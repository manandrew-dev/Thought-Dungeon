import { describe, expect, it } from "vitest";
import {
  BREAK_SUGGESTIONS,
  DISTORTIONS,
  MOVES,
  breakSuggestion,
  creatureLine,
  distortionById,
  movePool,
  tamedLine,
} from "../src/content";
import { screen } from "../src/core/safety";
import type { DistortionId } from "../src/core/types";

const IDS: DistortionId[] = [
  "catastrophizing", "mind_reading", "fortune_telling", "all_or_nothing",
  "overgeneralization", "should_statements", "labeling",
  "emotional_reasoning", "personalization", "mental_filter",
];

describe("distortions", () => {
  it("has exactly one entry per distortion id", () => {
    expect(DISTORTIONS.map((d) => d.id).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)("has complete display fields for %s", (id) => {
    const d = distortionById(id);
    expect(d.name).not.toBe("");
    expect(d.creature).not.toBe("");
    expect(d.blurb).not.toBe("");
    expect(d.example).not.toBe("");
    expect(d.palette).toHaveLength(2);
    d.palette.forEach((colour) => expect(colour).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it.each(IDS)("has valid, positively weighted patterns for %s", (id) => {
    const { patterns } = distortionById(id);
    expect(patterns.length).toBeGreaterThan(0);
    patterns.forEach(({ pattern, weight }) => {
      expect(() => new RegExp(pattern, "i")).not.toThrow();
      expect(weight).toBeGreaterThan(0);
    });
  });
});

describe("moves", () => {
  it("has unique ids", () => {
    const ids = MOVES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps basePower within 15–30", () => {
    MOVES.forEach((m) => {
      expect(m.basePower).toBeGreaterThanOrEqual(15);
      expect(m.basePower).toBeLessThanOrEqual(30);
    });
  });

  it("only tags known distortions", () => {
    MOVES.forEach((m) => {
      if (m.distortions !== "any") m.distortions.forEach((id) => expect(IDS).toContain(id));
    });
  });

  it("has at least 4 moves tagged any", () => {
    expect(MOVES.filter((m) => m.distortions === "any").length).toBeGreaterThanOrEqual(4);
  });

  it.each(IDS)("has at least 4 specific moves for %s", (id) => {
    const specific = MOVES.filter((m) => m.distortions !== "any" && m.distortions.includes(id));
    expect(specific.length).toBeGreaterThanOrEqual(4);
  });

  it.each(IDS)("offers a pool large enough to avoid repeats for %s", (id) => {
    expect(movePool(id).length).toBeGreaterThanOrEqual(4);
  });
});

describe("lines", () => {
  it.each(IDS)("has creature and tamed lines for %s", (id) => {
    expect(creatureLine(id, 0)).not.toBe("");
    expect(tamedLine(id)).not.toBe("");
  });

  it("repeats the final, gentlest line once dialogue runs out", () => {
    expect(creatureLine("labeling", 99)).toBe(creatureLine("labeling", 4));
  });

  it("clamps negative turns to the first line", () => {
    expect(creatureLine("labeling", -1)).toBe(creatureLine("labeling", 0));
  });

  it("falls back to a valid line when no distortion is set", () => {
    expect(creatureLine(undefined, 0)).not.toBe("");
  });

  it("suggests one of the listed breaks", () => {
    expect(BREAK_SUGGESTIONS).toContain(breakSuggestion());
  });

  it("contains no crisis language anywhere in the content", () => {
    const text = [
      ...DISTORTIONS.flatMap((d) => [d.blurb, d.example]),
      ...MOVES.flatMap((m) => [m.name, m.question]),
      ...IDS.flatMap((id) => [...Array(5).keys()].map((t) => creatureLine(id, t)).concat(tamedLine(id))),
      ...BREAK_SUGGESTIONS,
    ];
    text.forEach((t) => expect(screen(t).crisis, t).toBe(false));
  });
});
