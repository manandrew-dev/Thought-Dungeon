import { describe, expect, it } from "vitest";
import { DISTORTIONS } from "../src/content";
import { fieldNotes } from "../src/core/insights";
import type { DistortionId, Encounter, FieldNote, Phase } from "../src/core/types";

function completed(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: "completed-encounter",
    createdAt: "2026-10-25T12:00:00.000Z",
    thought: "I am worried about my exam",
    beliefBefore: 80,
    beliefAfter: 50,
    suggestions: [],
    distortion: "catastrophizing",
    resolve: 0,
    turns: [],
    offeredMoveIds: [],
    phase: "tamed",
    balancedThought: "I can prepare",
    ...overrides,
  };
}

function withMoves(moveIds: string[], beliefBefore: number, beliefAfter: number): Encounter {
  return completed({
    beliefBefore,
    beliefAfter,
    turns: moveIds.map((moveId) => ({ moveId, answer: "I can try", effect: 20 })),
  });
}

function ofKind(notes: FieldNote[], kind: FieldNote["kind"]): FieldNote[] {
  return notes.filter((note) => note.kind === kind);
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

describe("fieldNotes", () => {
  it("returns no notes for no encounters", () => {
    expect(fieldNotes([])).toEqual([]);
  });

  it.each<Phase>(["confirming", "battling", "taming", "resting"])("ignores encounters in phase %s", (phase) => {
    expect(fieldNotes([completed({ phase })])).toEqual([]);
  });

  it("ignores historical abandoned encounters", () => {
    const abandoned = { ...completed(), phase: "abandoned" } as unknown as Encounter;
    expect(fieldNotes([abandoned])).toEqual([]);
  });

  it("describes one completed encounter without inventing a move comparison", () => {
    expect(fieldNotes([withMoves(["examine_evidence", "friend_advice"], 80, 50)])).toEqual([
      { kind: "distortion_frequency", text: "Catastrophizing was the confirmed distortion in 1 completed encounter." },
      {
        kind: "mean_belief_change",
        text: "Self-reported belief change averaged -30.0 points (after minus before) across 1 completed encounter with both ratings.",
      },
    ]);
  });

  it("counts confirmed distortions rather than classifier suggestions", () => {
    const data = [
      completed({ distortion: "labeling", suggestions: [{ distortion: "mind_reading", confidence: 0.9 }] }),
      completed({ distortion: "labeling" }),
      completed({ distortion: "catastrophizing" }),
      completed({ distortion: "mind_reading", phase: "resting" }),
    ];
    expect(ofKind(fieldNotes(data), "distortion_frequency")).toEqual([
      { kind: "distortion_frequency", text: "Labeling was the confirmed distortion in 2 completed encounters." },
      { kind: "distortion_frequency", text: "Catastrophizing was the confirmed distortion in 1 completed encounter." },
    ]);
  });

  it.each(DISTORTIONS)("uses the content name for distortion $id", (distortion) => {
    expect(ofKind(fieldNotes([completed({ distortion: distortion.id })]), "distortion_frequency")).toEqual([
      { kind: "distortion_frequency", text: `${distortion.name} was the confirmed distortion in 1 completed encounter.` },
    ]);
  });

  it("breaks equal-frequency ties by distortion ID", () => {
    const data = [completed({ distortion: "mind_reading" }), completed({ distortion: "all_or_nothing" }), completed()];
    expect(ofKind(fieldNotes(data), "distortion_frequency").map((note) => note.text)).toEqual([
      "All-or-Nothing Thinking was the confirmed distortion in 1 completed encounter.",
      "Catastrophizing was the confirmed distortion in 1 completed encounter.",
      "Mind Reading was the confirmed distortion in 1 completed encounter.",
    ]);
  });

  it("averages signed self-reported changes using completed encounters only", () => {
    const data = [
      completed({ beliefBefore: 80, beliefAfter: 50 }),
      completed({ beliefBefore: 40, beliefAfter: 50 }),
      completed({ beliefBefore: 100, beliefAfter: 0, phase: "battling" }),
    ];
    expect(ofKind(fieldNotes(data), "mean_belief_change")).toEqual([
      {
        kind: "mean_belief_change",
        text: "Self-reported belief change averaged -10.0 points (after minus before) across 2 completed encounters with both ratings.",
      },
    ]);
  });

  it.each([
    [100, 0, "-100.0"],
    [0, 100, "100.0"],
    [50, 50, "0.0"],
    [50.25, 60.5, "10.3"],
    [50, 49.96, "0.0"],
  ])("reports ratings %s to %s without judging their direction", (beliefBefore, beliefAfter, expected) => {
    const notes = ofKind(fieldNotes([completed({ beliefBefore, beliefAfter })]), "mean_belief_change");
    expect(notes[0]!.text).toContain(`averaged ${expected} points`);
    expect(notes[0]!.text).not.toMatch(/improv|success|fail|worse|better/i);
  });

  it.each([undefined, null, "50", NaN, Infinity, -Infinity, -1, 101])("excludes invalid rating %j without fabricating a replacement", (invalid) => {
    for (const field of ["beliefBefore", "beliefAfter"]) {
      const bad = { ...completed(), [field]: invalid } as unknown as Encounter;
      const notes = fieldNotes([bad, completed({ beliefBefore: 90, beliefAfter: 30 })]);
      expect(ofKind(notes, "mean_belief_change")[0]!.text)
        .toBe("Self-reported belief change averaged -60.0 points (after minus before) across 1 completed encounter with both ratings.");
      expect(ofKind(notes, "distortion_frequency")[0]!.text).toContain("2 completed encounters");
    }
  });

  it("omits the mean and move notes when no valid rating pairs exist", () => {
    const data = [completed({ beliefAfter: NaN }), completed({ beliefBefore: Infinity })];
    expect(ofKind(fieldNotes(data), "mean_belief_change")).toEqual([]);
    expect(ofKind(fieldNotes(data), "effective_move")).toEqual([]);
  });

  it("does not invent missing distortion, turn, or rating data", () => {
    const missing = { phase: "tamed" } as Encounter;
    expect(fieldNotes([missing])).toEqual([]);
    const noDistortionOrTurns = { phase: "tamed", beliefBefore: 80, beliefAfter: 50 } as Encounter;
    expect(fieldNotes([noDistortionOrTurns]).map((note) => note.kind)).toEqual(["mean_belief_change"]);
  });

  it("ignores unsupported historical distortion IDs", () => {
    const state = completed({ distortion: "unknown" as DistortionId });
    expect(ofKind(fieldNotes([state]), "distortion_frequency")).toEqual([]);
    expect(ofKind(fieldNotes([state]), "mean_belief_change")).toHaveLength(1);
  });

  it("identifies the move with the largest average change magnitude", () => {
    const data = [
      withMoves(["examine_evidence"], 90, 30),
      withMoves(["examine_evidence"], 80, 40),
      withMoves(["friend_advice"], 80, 60),
      withMoves(["friend_advice"], 70, 60),
    ];
    expect(ofKind(fieldNotes(data), "effective_move")).toEqual([
      {
        kind: "effective_move",
        text: "In 2 rated completed encounters including Examine the Evidence, self-reported belief change averaged -50.0 points (after minus before). This is an encounter-level association, not an individual move effect.",
      },
    ]);
  });

  it("compares averages rather than totals or scorer power", () => {
    const data = [
      ...Array.from({ length: 4 }, () => withMoves(["examine_evidence"], 80, 50)),
      withMoves(["friend_advice"], 80, 40),
      withMoves(["friend_advice"], 80, 40),
    ];
    expect(ofKind(fieldNotes(data), "effective_move")[0]!.text).toContain("including Talk to a Friend");
  });

  it("counts each move once per encounter even if repeated turns use it", () => {
    const data = [
      withMoves(Array(10).fill("examine_evidence"), 100, 0),
      withMoves(["examine_evidence"], 50, 50),
      withMoves(["friend_advice"], 80, 20),
      withMoves(["friend_advice"], 80, 20),
    ];
    const notes = ofKind(fieldNotes(data), "effective_move");
    expect(notes).toHaveLength(1);
    expect(notes[0]!.text).toContain("including Talk to a Friend");
    expect(notes[0]!.text).toContain("-60.0 points");
  });

  it("preserves the direction of increases when comparing change magnitudes", () => {
    const data = [
      withMoves(["friend_advice"], 20, 80),
      withMoves(["friend_advice"], 20, 80),
      withMoves(["examine_evidence"], 80, 30),
      withMoves(["examine_evidence"], 80, 30),
    ];
    const notes = ofKind(fieldNotes(data), "effective_move");
    expect(notes).toHaveLength(1);
    expect(notes[0]!.text).toContain("including Talk to a Friend");
    expect(notes[0]!.text).toContain("60.0 points (after minus before)");
  });

  it("retains tied leading moves in deterministic ID order", () => {
    const data = [
      withMoves(["friend_advice", "examine_evidence"], 80, 40),
      withMoves(["examine_evidence", "friend_advice"], 80, 40),
      withMoves(["zoom_out"], 80, 70),
      withMoves(["zoom_out"], 80, 70),
    ];
    const notes = ofKind(fieldNotes(data), "effective_move");
    expect(notes).toHaveLength(2);
    expect(notes[0]!.text).toContain("including Examine the Evidence");
    expect(notes[1]!.text).toContain("including Talk to a Friend");
    expect(notes.every((note) => note.text.includes("encounter-level association, not an individual move effect"))).toBe(true);
  });

  it("does not let repeated uses in one encounter satisfy the comparison threshold", () => {
    const data = [
      withMoves(Array(10).fill("examine_evidence"), 100, 0),
      withMoves(["friend_advice"], 80, 50),
      withMoves(["friend_advice"], 80, 50),
    ];
    expect(ofKind(fieldNotes(data), "effective_move")).toEqual([]);
  });

  it("omits a move comparison if only one known move has enough observations", () => {
    const data = [
      withMoves(["examine_evidence"], 90, 40),
      withMoves(["examine_evidence"], 80, 40),
      withMoves(["unknown_move"], 80, 10),
      withMoves(["unknown_move"], 80, 10),
    ];
    expect(ofKind(fieldNotes(data), "effective_move")).toEqual([]);
  });

  it("does not use invalid ratings or unfinished encounters for move comparisons", () => {
    const data = [
      withMoves(["examine_evidence"], 90, 40),
      withMoves(["examine_evidence"], 80, NaN),
      { ...withMoves(["examine_evidence"], 80, 20), phase: "resting" as const },
      withMoves(["friend_advice"], 80, 50),
      withMoves(["friend_advice"], 80, 50),
    ];
    expect(ofKind(fieldNotes(data), "effective_move")).toEqual([]);
  });

  it("omits leading-move claims when all observed average differences are zero", () => {
    const data = [
      withMoves(["examine_evidence", "friend_advice"], 50, 50),
      withMoves(["examine_evidence", "friend_advice"], 50, 50),
    ];
    expect(ofKind(fieldNotes(data), "effective_move")).toEqual([]);
    expect(ofKind(fieldNotes(data), "mean_belief_change")[0]!.text).toContain("0.0 points");
  });

  it("handles incomplete historical turn entries without throwing", () => {
    const badTurns = [null, {}, { moveId: "unknown_move" }] as unknown as Encounter["turns"];
    expect(() => fieldNotes([completed({ turns: badTurns })])).not.toThrow();
    expect(ofKind(fieldNotes([completed({ turns: badTurns })]), "effective_move")).toEqual([]);
  });

  it("is deterministic when encounters and turns are reordered", () => {
    const data = [
      withMoves(["friend_advice", "examine_evidence"], 80.15, 20.05),
      withMoves(["examine_evidence", "friend_advice"], 79.95, 60.05),
      completed({ distortion: "mind_reading", beliefBefore: 40.05, beliefAfter: 40.15 }),
    ];
    const reordered = [...data].reverse().map((encounter) => ({ ...encounter, turns: [...encounter.turns].reverse() }));
    expect(fieldNotes(reordered)).toEqual(fieldNotes(data));
    expect(fieldNotes(data)).toEqual(fieldNotes(data));
  });

  it("does not mutate frozen encounter data or content", () => {
    const data = [
      withMoves(["examine_evidence", "friend_advice"], 80, 50),
      withMoves(["friend_advice", "examine_evidence"], 70, 50),
    ];
    const before = structuredClone(data);
    const contentBefore = structuredClone(DISTORTIONS);
    freezeDeep(data);
    fieldNotes(data);
    expect(data).toEqual(before);
    expect(DISTORTIONS).toEqual(contentBefore);
  });

  it("returns only the existing FieldNote structure and descriptive kinds", () => {
    const data = [
      withMoves(["examine_evidence", "friend_advice"], 80, 50),
      withMoves(["friend_advice", "examine_evidence"], 70, 50),
    ];
    const notes: FieldNote[] = fieldNotes(data);
    expect(new Set(notes.map((note) => note.kind)))
      .toEqual(new Set(["distortion_frequency", "mean_belief_change", "effective_move"]));
    for (const note of notes) {
      expect(Object.keys(note).sort()).toEqual(["kind", "text"]);
      expect(typeof note.text).toBe("string");
      expect(note.text.length).toBeGreaterThan(0);
      expect(note.text).not.toMatch(/2026|streak|missed days|diagnos|treatment|clinically|keep going|try again/i);
    }
  });
});
