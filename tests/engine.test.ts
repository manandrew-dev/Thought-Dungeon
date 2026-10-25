import { afterEach, describe, expect, it, vi } from "vitest";
import { DISTORTIONS, MOVES, moveById, movePool } from "../src/content";
import { generateCreature } from "../src/core/creature";
import { createEncounter, reduce } from "../src/core/engine";
import type { Action } from "../src/core/engine";
import { hash, mulberry32 } from "../src/core/rng";
import * as scorer from "../src/core/scorer";
import type { DistortionId, Encounter, Phase, Suggestion } from "../src/core/types";

const thought = "I'm worried about my midterm";
const suggestions: Suggestion[] = [{ distortion: "catastrophizing", confidence: 0.8 }];
const fixedId = "7a9cfbf4-36bd-4e2c-9978-ac57ebfba684";
const now = new Date("2026-10-25T12:00:00.000Z");
const species = DISTORTIONS.map((distortion) => distortion.id);

function initial(): Encounter {
  return createEncounter(thought, 90, suggestions, { id: fixedId, now });
}

function battling(distortion: DistortionId = "catastrophizing"): Encounter {
  return reduce(initial(), { type: "CONFIRM_DISTORTION", distortion }, mulberry32(42));
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function expectValidOffer(state: Encounter, excludedId?: string): void {
  const eligible = movePool(state.distortion!).map((move) => move.id);
  expect(state.offeredMoveIds).toHaveLength(3);
  expect(new Set(state.offeredMoveIds).size).toBe(3);
  for (const id of state.offeredMoveIds) expect(eligible).toContain(id);
  if (excludedId !== undefined) expect(state.offeredMoveIds).not.toContain(excludedId);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("createEncounter", () => {
  it("creates the documented initial state with injected metadata and no creature", () => {
    expect(initial()).toEqual({
      id: fixedId,
      createdAt: now.toISOString(),
      thought,
      beliefBefore: 90,
      suggestions,
      resolve: 100,
      turns: [],
      offeredMoveIds: [],
      phase: "confirming",
    });
  });

  it("supports the original three-argument call with UUID and timestamp defaults", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const uuid = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(fixedId);
    const state = createEncounter(thought, 90, suggestions);
    expect(state.id).toBe(fixedId);
    expect(state.createdAt).toBe(now.toISOString());
    expect(uuid).toHaveBeenCalledOnce();
  });

  it("uses real UUID defaults that differ between encounters", () => {
    const first = createEncounter(thought, 90, suggestions);
    const second = createEncounter(thought, 90, suggestions);
    expect(first.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(first.id).not.toBe(second.id);
    expect(new Date(first.createdAt).toISOString()).toBe(first.createdAt);
  });

  it("supports each metadata override independently", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(fixedId);
    const customDate = new Date("2026-10-24T01:02:03.000Z");
    expect(createEncounter(thought, 90, suggestions, { id: "test-id" }).id).toBe("test-id");
    expect(createEncounter(thought, 90, suggestions, { now: customDate })).toMatchObject({
      id: fixedId, createdAt: customDate.toISOString(),
    });
  });

  it("does not access crypto when an ID is supplied", () => {
    vi.stubGlobal("crypto", undefined);
    expect(initial().id).toBe(fixedId);
  });

  it("copies suggestion records and creates independent empty arrays", () => {
    const input: Suggestion[] = [{ distortion: "mind_reading", confidence: 0.5 }];
    const state = createEncounter(thought, 90, input, { id: fixedId, now });
    input[0]!.confidence = 0;
    input.push({ distortion: "labeling", confidence: 0.2 });
    expect(state.suggestions).toEqual([{ distortion: "mind_reading", confidence: 0.5 }]);
    expect(initial().turns).not.toBe(initial().turns);
    expect(initial().offeredMoveIds).not.toBe(initial().offeredMoveIds);
  });

  it.each([1, 500])("accepts a thought of %i characters", (length) => {
    expect(createEncounter("x".repeat(length), 50, suggestions, { id: fixedId, now }).thought).toHaveLength(length);
  });

  it.each(["", "x".repeat(501)])("rejects thoughts outside the documented length contract", (text) => {
    expect(() => createEncounter(text, 50, suggestions, { id: fixedId, now })).toThrow(RangeError);
  });

  it.each([0, 45.5, 100])("accepts belief-before rating %s", (belief) => {
    expect(createEncounter(thought, belief, suggestions, { id: fixedId, now }).beliefBefore).toBe(belief);
  });

  it.each([-1, 101, NaN, Infinity, -Infinity])("rejects invalid belief-before rating %s", (belief) => {
    expect(() => createEncounter(thought, belief, suggestions, { id: fixedId, now })).toThrow(RangeError);
  });

  it.each([-0.1, 1.1, NaN, Infinity])("rejects invalid suggestion confidence %s", (confidence) => {
    expect(() => createEncounter(thought, 50, [{ distortion: "labeling", confidence }], { id: fixedId, now })).toThrow(RangeError);
  });

  it("rejects unsupported suggestion IDs", () => {
    expect(() => createEncounter(thought, 50, [
      { distortion: "unsupported" as DistortionId, confidence: 0.5 },
    ], { id: fixedId, now })).toThrow(RangeError);
  });
});

describe("distortion confirmation and move offers", () => {
  it.each(species)("confirms %s and offers three eligible unique moves", (distortion) => {
    const state = reduce({ ...initial(), resolve: 12 }, { type: "CONFIRM_DISTORTION", distortion }, mulberry32(123));
    expect(state.phase).toBe("battling");
    expect(state.distortion).toBe(distortion);
    expect(state.resolve).toBe(100);
    expect(state.creature).toEqual(generateCreature(hash(thought), distortion));
    expectValidOffer(state);
  });

  it("allows the user to override the classifier's suggestion", () => {
    expect(battling("mind_reading").distortion).toBe("mind_reading");
  });

  it("rejects unsupported distortion IDs without drawing moves", () => {
    const state = initial();
    const rng = vi.fn(() => 0);
    expect(reduce(state, { type: "CONFIRM_DISTORTION", distortion: "unsupported" as DistortionId }, rng)).toBe(state);
    expect(rng).not.toHaveBeenCalled();
  });

  it("generates the same creature regardless of move-selection RNG", () => {
    const action: Action = { type: "CONFIRM_DISTORTION", distortion: "catastrophizing" };
    expect(reduce(initial(), action, mulberry32(1)).creature)
      .toEqual(reduce(initial(), action, mulberry32(999)).creature);
  });

  it.each([0, 1 - Number.EPSILON])("terminates with unique offers for a constant RNG returning %s", (value) => {
    const rng = vi.fn(() => value);
    const state = reduce(initial(), { type: "CONFIRM_DISTORTION", distortion: "labeling" }, rng);
    expectValidOffer(state);
    expect(rng).toHaveBeenCalledTimes(3);
  });

  it("does not mutate content while selecting moves", () => {
    const before = structuredClone(MOVES);
    const state = battling();
    reduce(state, { type: "USE_MOVE", moveId: state.offeredMoveIds[0]!, answer: "I can try" }, mulberry32(9));
    expect(MOVES).toEqual(before);
  });
});

describe("move use", () => {
  it("uses the scorer, records the answer verbatim, and reduces Resolve", () => {
    const state = battling();
    const id = state.offeredMoveIds[0]!;
    const answer = "  Maybe I can look for evidence  ";
    const amount = scorer.effect(answer, moveById(id)!);
    const next = reduce(state, { type: "USE_MOVE", moveId: id, answer }, mulberry32(9));
    expect(next.resolve).toBeCloseTo(100 - amount);
    expect(next.turns).toEqual([{ moveId: id, answer, effect: amount }]);
    expect(next.phase).toBe("battling");
    expectValidOffer(next, id);
  });

  it.each(["", " ", "\t", "\n", "\t\n  ", "\u00a0"])("rejects an empty answer (%j) without changes or RNG use", (answer) => {
    const state = battling();
    const rng = vi.fn(() => 0);
    expect(reduce(state, { type: "USE_MOVE", moveId: state.offeredMoveIds[0]!, answer }, rng)).toBe(state);
    expect(rng).not.toHaveBeenCalled();
  });

  it("accepts a non-whitespace character without judging its meaning", () => {
    const state = battling();
    const next = reduce(state, { type: "USE_MOVE", moveId: state.offeredMoveIds[0]!, answer: "." }, mulberry32(9));
    expect(next.resolve).toBeLessThan(state.resolve);
    expect(next.turns).toHaveLength(1);
  });

  it("rejects a real eligible move that was not offered", () => {
    const state = battling();
    const move = movePool(state.distortion!).find((candidate) => !state.offeredMoveIds.includes(candidate.id))!;
    const rng = vi.fn(() => 0);
    expect(reduce(state, { type: "USE_MOVE", moveId: move.id, answer: "Maybe" }, rng)).toBe(state);
    expect(rng).not.toHaveBeenCalled();
  });

  it("rejects an unknown ID even if a malformed state lists it as offered", () => {
    const state = { ...battling(), offeredMoveIds: ["unknown"] };
    expect(reduce(state, { type: "USE_MOVE", moveId: "unknown", answer: "Maybe" }, mulberry32(9))).toBe(state);
  });

  it("rejects an ineligible move even if a malformed state lists it as offered", () => {
    const state = { ...battling(), offeredMoveIds: ["name_the_moment"] };
    expect(reduce(state, { type: "USE_MOVE", moveId: "name_the_moment", answer: "Maybe" }, mulberry32(9))).toBe(state);
  });

  it("rejects move use if the confirmed distortion is missing", () => {
    const state = battling();
    delete state.distortion;
    expect(reduce(state, { type: "USE_MOVE", moveId: state.offeredMoveIds[0]!, answer: "Maybe" }, mulberry32(9))).toBe(state);
  });

  it.each([0, -1, NaN, Infinity])("rejects an invalid scorer result (%s) without state or RNG changes", (amount) => {
    const state = battling();
    vi.spyOn(scorer, "effect").mockReturnValueOnce(amount);
    const rng = vi.fn(() => 0);
    expect(reduce(state, { type: "USE_MOVE", moveId: state.offeredMoveIds[0]!, answer: "Maybe" }, rng)).toBe(state);
    expect(rng).not.toHaveBeenCalled();
  });

  it.each([1, 22.4])("clamps Resolve %s to zero and transitions to taming without drawing more moves", (resolve) => {
    const state = { ...battling(), resolve, offeredMoveIds: ["examine_evidence"] };
    const rng = vi.fn(() => 0);
    const next = reduce(state, { type: "USE_MOVE", moveId: "examine_evidence", answer: "." }, rng);
    expect(next.resolve).toBe(0);
    expect(next.phase).toBe("taming");
    expect(next.offeredMoveIds).toEqual([]);
    expect(next.turns).toEqual([{ moveId: "examine_evidence", answer: ".", effect: 22.4 }]);
    expect(rng).not.toHaveBeenCalled();
  });

  it("appends to the previous turn history", () => {
    const first = battling();
    const second = reduce(first, { type: "USE_MOVE", moveId: first.offeredMoveIds[0]!, answer: "." }, mulberry32(8));
    const third = reduce(second, { type: "USE_MOVE", moveId: second.offeredMoveIds[0]!, answer: "." }, mulberry32(9));
    expect(third.turns).toHaveLength(2);
    expect(third.turns[0]).toEqual(second.turns[0]);
  });

  it.each(species)("excludes the last used move on every battle turn for %s", (distortion) => {
    const rng = mulberry32(123);
    let state = reduce(initial(), { type: "CONFIRM_DISTORTION", distortion }, rng);
    for (let turn = 0; turn < 8 && state.phase === "battling"; turn++) {
      expectValidOffer(state);
      const id = state.offeredMoveIds[0]!;
      state = reduce(state, { type: "USE_MOVE", moveId: id, answer: "." }, rng);
      expect(state.resolve).toBeGreaterThanOrEqual(0);
      if (state.phase === "battling") expectValidOffer(state, id);
    }
    expect(state.phase).toBe("taming");
  });
});

describe("balanced thoughts", () => {
  it.each([0, 45.5, 100])("accepts a nonempty thought with belief-after %s", (beliefAfter) => {
    const state: Encounter = { ...battling(), phase: "taming", resolve: 0, offeredMoveIds: [] };
    const rng = vi.fn(() => 0);
    const text = "  I can prepare and ask for help  ";
    const next = reduce(state, { type: "SUBMIT_BALANCED", text, beliefAfter }, rng);
    expect(next).toEqual({ ...state, balancedThought: text, beliefAfter, phase: "tamed" });
    expect(rng).not.toHaveBeenCalled();
  });

  it.each(["", " ", "\t\n"])("rejects an empty balanced thought (%j)", (text) => {
    const state: Encounter = { ...battling(), phase: "taming", resolve: 0 };
    expect(reduce(state, { type: "SUBMIT_BALANCED", text, beliefAfter: 45 }, mulberry32(9))).toBe(state);
  });

  it.each([-1, 101, NaN, Infinity, -Infinity])("rejects invalid belief-after %s", (beliefAfter) => {
    const state: Encounter = { ...battling(), phase: "taming", resolve: 0 };
    expect(reduce(state, { type: "SUBMIT_BALANCED", text: "I can try", beliefAfter }, mulberry32(9))).toBe(state);
  });
});

describe("phase transitions and immutability", () => {
  it("preserves all progress through retreat and resume without drawing moves", () => {
    const battle = battling();
    const state = reduce(battle, { type: "USE_MOVE", moveId: battle.offeredMoveIds[0]!, answer: "." }, mulberry32(8));
    const rng = vi.fn(() => 0);
    const resting = reduce(state, { type: "RETREAT" }, rng);
    expect(resting).toEqual({ ...state, phase: "resting" });
    expect(resting).not.toBe(state);
    expect(reduce(resting, { type: "RESUME" }, rng)).toEqual(state);
    expect(rng).not.toHaveBeenCalled();
  });

  const actions: Action[] = [
    { type: "CONFIRM_DISTORTION", distortion: "labeling" },
    { type: "USE_MOVE", moveId: "examine_evidence", answer: "Maybe" },
    { type: "SUBMIT_BALANCED", text: "I can try", beliefAfter: 45 },
    { type: "RETREAT" },
    { type: "RESUME" },
  ];
  const allowed: Record<Action["type"], Phase> = {
    CONFIRM_DISTORTION: "confirming", USE_MOVE: "battling", SUBMIT_BALANCED: "taming",
    RETREAT: "battling", RESUME: "resting",
  };
  const phases: Phase[] = ["confirming", "battling", "taming", "tamed", "resting"];
  const invalidTransitions = phases.flatMap((phase) => actions
    .filter((action) => allowed[action.type] !== phase)
    .map((action) => ({ phase, action })));

  it.each(invalidTransitions)("rejects $action.type during $phase", ({ phase, action }) => {
    const state = freezeDeep({ ...battling(), phase });
    const rng = vi.fn(() => 0);
    expect(reduce(state, action, rng)).toBe(state);
    expect(rng).not.toHaveBeenCalled();
  });

  it("leaves state unchanged for an unknown action", () => {
    const state = battling();
    expect(reduce(state, { type: "UNKNOWN" } as unknown as Action, mulberry32(9))).toBe(state);
  });

  it.each(actions)("does not mutate frozen input for $type", (action) => {
    let state: Encounter = { ...battling(), phase: allowed[action.type] };
    if (action.type === "USE_MOVE") state = { ...state, offeredMoveIds: [action.moveId, "friend_advice", "alternative_view"] };
    if (action.type === "SUBMIT_BALANCED") state = { ...state, resolve: 0, offeredMoveIds: [] };
    freezeDeep(state);
    const before = structuredClone(state);
    expect(reduce(state, action, mulberry32(9))).not.toBe(state);
    expect(state).toEqual(before);
  });

  it("replays a full encounter deterministically with matching seeded RNG streams", () => {
    const play = () => {
      const rng = mulberry32(456);
      let state = reduce(initial(), { type: "CONFIRM_DISTORTION", distortion: "catastrophizing" }, rng);
      const states = [state];
      for (let turn = 0; turn < 8 && state.phase === "battling"; turn++) {
        state = reduce(state, { type: "USE_MOVE", moveId: state.offeredMoveIds[0]!, answer: "Maybe I can try" }, rng);
        states.push(state);
      }
      expect(state.phase).toBe("taming");
      state = reduce(state, { type: "SUBMIT_BALANCED", text: "I can prepare", beliefAfter: 45 }, rng);
      states.push(state);
      return states;
    };
    expect(play()).toEqual(play());
  });

  it("does not use unseeded randomness, UUIDs, or the clock inside reduce", () => {
    const state = initial();
    const random = vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("Unexpected random call"); });
    const uuid = vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => { throw new Error("Unexpected UUID call"); });
    const date = vi.spyOn(globalThis, "Date").mockImplementation(() => { throw new Error("Unexpected clock access"); });
    const next = reduce(state, { type: "CONFIRM_DISTORTION", distortion: "labeling" }, mulberry32(9));
    expect(next.phase).toBe("battling");
    expect(random).not.toHaveBeenCalled();
    expect(uuid).not.toHaveBeenCalled();
    expect(date).not.toHaveBeenCalled();
  });
});
