import { describe, expect, it } from "vitest";
import { effect } from "../src/core/scorer";
import type { Move } from "../src/core/types";

const move: Move = {
  id: "examine_evidence",
  name: "Examine the Evidence",
  question: "What facts support this thought? What facts don't?",
  distortions: "any",
  basePower: 20,
};

describe("effect", () => {
  it("returns zero for an empty answer", () => {
    expect(effect("", move)).toBe(0);
  });

  it.each([" ", "   ", "\t", "\n", "\t\n  ", "\u00a0"])("returns zero for a whitespace-only answer (%j)", (answer) => {
    expect(effect(answer, move)).toBe(0);
  });

  it.each([
    [".", 20.4],
    ["🙂", 20.4],
    ["Okay", 20.4],
    ["I can try", 21.2],
    ["  I\tcan\ntry  ", 21.2],
  ])("adds the word-count bonus for %j", (answer, expected) => {
    expect(effect(answer, move)).toBeCloseTo(expected);
  });

  it.each([
    [10, 24],
    [37, 34.8],
    [38, 35],
    [100, 35],
  ])("caps the word-count bonus at 15 for %i words", (wordCount, expected) => {
    const answer = Array(wordCount).fill("thought").join(" ");
    expect(effect(answer, move)).toBeCloseTo(expected);
  });

  it.each([
    ["but", 23.4],
    ["although", 23.4],
    ["evidence", 23.4],
    ["actually", 23.4],
    ["maybe", 23.4],
    ["in the past", 24.2],
    ["a friend", 23.8],
  ])("recognizes the reflective marker %j", (answer, expected) => {
    expect(effect(answer, move)).toBeCloseTo(expected);
  });

  it("matches markers regardless of capitalization and surrounding punctuation", () => {
    expect(effect("(BUT), MAYBE!", move)).toBeCloseTo(26.8);
  });

  it("matches phrases across repeated spaces, tabs, and newlines", () => {
    expect(effect("IN\tTHE\nPAST, A   FRIEND", move)).toBeCloseTo(28);
  });

  it.each([
    "butterfly",
    "althoughish",
    "counterevidence",
    "actuallyish",
    "maybes",
    "within the past",
    "in the pastry",
    "a friendship",
    "extra friend",
  ])("does not award a marker bonus for the substring in %j", (answer) => {
    const wordCount = answer.split(" ").length;
    expect(effect(answer, move)).toBeCloseTo(move.basePower + 0.4 * wordCount);
  });

  it("does not match a phrase when another word interrupts it", () => {
    expect(effect("in the distant past", move)).toBeCloseTo(21.6);
  });

  it.each([
    [1, 23.4],
    [2, 26.8],
    [3, 30.2],
    [4, 31.6],
    [10, 34],
  ])("counts repeated marker occurrences and caps their bonus at 10 (%i occurrences)", (count, expected) => {
    expect(effect(Array(count).fill("maybe").join(" "), move)).toBeCloseTo(expected);
  });

  it.each([15, 20, 30])("keeps nonempty answer scores within the bounds for base power %i", (basePower) => {
    const selectedMove = { ...move, basePower };
    const answers = [
      ".",
      "I can try",
      "but although evidence actually maybe in the past a friend",
      Array(100).fill("maybe").join(" "),
    ];

    for (const answer of answers) {
      const score = effect(answer, selectedMove);
      expect(score).toBeGreaterThanOrEqual(basePower);
      expect(score).toBeLessThanOrEqual(basePower + 25);
    }

    expect(effect(answers[3]!, selectedMove)).toBe(basePower + 25);
  });

  it("returns identical results across repeated and interleaved calls", () => {
    for (let call = 0; call < 5; call++) {
      expect(effect("maybe", move)).toBeCloseTo(23.4);
      expect(effect("", move)).toBe(0);
      expect(effect("\t\n ", move)).toBe(0);
      expect(effect("I can try", move)).toBeCloseTo(21.2);
      expect(effect("maybe", move)).toBeCloseTo(23.4);
    }
  });

  it.each([
    ["I am worried", "Maybe I can look for evidence before deciding"],
    ["This feels difficult", "Although this feels difficult I have managed similar things in the past"],
  ])("scores a longer reflective answer at least as highly as %j", (shortAnswer, longAnswer) => {
    expect(effect(longAnswer, move)).toBeGreaterThanOrEqual(effect(shortAnswer, move));
  });

  it("does not distinguish positive and negative meaning with the same effort markers", () => {
    expect(effect("Maybe I will succeed", move)).toBe(effect("Maybe I will fail", move));
  });
});
