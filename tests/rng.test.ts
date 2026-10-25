import { afterEach, describe, expect, it, vi } from "vitest";
import { hash, mulberry32 } from "../src/core/rng";
import type { Rng } from "../src/core/rng";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mulberry32", () => {
  it.each([
    [0, [1144304738, 1416247, 958946056, 627933444, 2007157716]],
    [1, [2693262067, 11749833, 2265367787, 4213581821, 4159151403]],
    [0xffffffff, [3850105811, 813802916, 3073704848, 4054706436, 3630262831]],
  ])("matches the Mulberry32 output vector for seed %i", (seed, expected) => {
    const rng: Rng = mulberry32(seed);
    const actual = expected.map(() => rng() * 4294967296);
    expect(actual).toEqual(expected);
  });

  it.each([0, 1, 42, 123456789, 0xffffffff, -1])("repeats the sequence for seed %i", (seed) => {
    const first = mulberry32(seed);
    const second = mulberry32(seed);

    for (let draw = 0; draw < 1000; draw++) {
      expect(first()).toBe(second());
    }
  });

  it.each([0, 1, 42, 123456789, 0x7fffffff, 0x80000000, 0xffffffff, -1])("keeps output in [0, 1) for seed %i", (seed) => {
    const rng = mulberry32(seed);

    for (let draw = 0; draw < 1000; draw++) {
      const value = rng();
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("produces different sequences for different seeds", () => {
    const first = mulberry32(1);
    const second = mulberry32(2);
    expect(Array.from({ length: 20 }, () => first()))
      .not.toEqual(Array.from({ length: 20 }, () => second()));
  });

  it("keeps the state of separate generators independent", () => {
    const first = mulberry32(42);
    const second = mulberry32(42);
    const reference = mulberry32(42);
    const expected = Array.from({ length: 3 }, () => reference());

    expect(first()).toBe(expected[0]);
    expect(first()).toBe(expected[1]);
    expect(second()).toBe(expected[0]);
    expect(first()).toBe(expected[2]);
    expect(second()).toBe(expected[1]);
  });

  it.each([
    [-1, 0xffffffff],
    [42 + 4294967296, 42],
  ])("normalizes seed %i to the same unsigned 32-bit state as %i", (seed, equivalent) => {
    const first = mulberry32(seed);
    const second = mulberry32(equivalent);
    expect(Array.from({ length: 20 }, () => first()))
      .toEqual(Array.from({ length: 20 }, () => second()));
  });

  it("does not depend on Math.random", () => {
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Unseeded randomness must not be used");
    });
    const rng = mulberry32(1);
    expect(rng()).toBe(2693262067 / 4294967296);
    expect(rng()).toBe(11749833 / 4294967296);
    expect(random).not.toHaveBeenCalled();
  });
});

describe("hash", () => {
  it.each([
    ["", 2166136261],
    ["a", 3826002220],
    ["hello", 1335831723],
    ["foobar", 3214735720],
    ["café", 856211068],
    ["你好", 3619451238],
    ["😀", 3409036472],
    ["😁", 3425814091],
    ["e\u0301", 2484688179],
  ])("matches the UTF-16 hash vector for %j", (text, expected) => {
    expect(hash(text)).toBe(expected);
  });

  it.each(["", "I am worried about my midterm", "café", "你好", "🧠✨", "\ud800"])("repeatedly hashes %j to the same unsigned 32-bit integer", (text) => {
    const expected = hash(text);
    expect(Number.isInteger(expected)).toBe(true);
    expect(expected).toBeGreaterThanOrEqual(0);
    expect(expected).toBeLessThanOrEqual(0xffffffff);

    for (let call = 0; call < 5; call++) {
      hash("another thought");
      expect(hash(text)).toBe(expected);
    }
  });

  it("distinguishes representative changes to the input", () => {
    expect(hash("thought")).not.toBe(hash("Thought"));
    expect(hash("thought")).not.toBe(hash("thought "));
    expect(hash("ab")).not.toBe(hash("ba"));
    expect(hash("😀")).not.toBe(hash("😁"));
  });

  it("hashes the exact input without Unicode normalization", () => {
    expect(hash("é")).not.toBe(hash("e\u0301"));
  });

  it("can reproducibly seed a generator from Unicode thought text", () => {
    const first = mulberry32(hash("I'm worried about my exam 🧠"));
    const second = mulberry32(hash("I'm worried about my exam 🧠"));
    expect(Array.from({ length: 20 }, () => first()))
      .toEqual(Array.from({ length: 20 }, () => second()));
  });
});
