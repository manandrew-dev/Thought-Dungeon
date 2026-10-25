import { describe, expect, it } from "vitest";
import { DISTORTIONS } from "../src/content";
import { generateCreature } from "../src/core/creature";
import { hash } from "../src/core/rng";

const SPECIES = DISTORTIONS.map((d) => d.id);
const SEEDS = [0, 1, 42, 0xffffffff, hash("I'm going to bomb my midterm"), hash("They think I'm annoying")];

describe("generateCreature", () => {
  it.each(SPECIES)("returns identical params for the same seed and species (%s)", (species) => {
    const seed = hash("If I fail this, my life is over.");
    expect(generateCreature(seed, species)).toEqual(generateCreature(seed, species));
  });

  it("keeps the seed and species it was given", () => {
    const creature = generateCreature(1234, "labeling");
    expect(creature.seed).toBe(1234);
    expect(creature.species).toBe("labeling");
  });

  it("keeps every field within its documented range", () => {
    for (const species of SPECIES) {
      for (const seed of [...SEEDS, ...Array.from({ length: 200 }, (_, i) => hash(`thought ${i}`))]) {
        const { bodyPoints, wobble, hue, eyeCount } = generateCreature(seed, species);
        expect(Number.isInteger(bodyPoints)).toBe(true);
        expect(bodyPoints).toBeGreaterThanOrEqual(6);
        expect(bodyPoints).toBeLessThanOrEqual(12);
        expect(wobble).toBeGreaterThanOrEqual(0);
        expect(wobble).toBeLessThanOrEqual(1);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
        expect(Number.isInteger(eyeCount)).toBe(true);
        expect(eyeCount).toBeGreaterThanOrEqual(1);
        expect(eyeCount).toBeLessThanOrEqual(3);
      }
    }
  });

  it("varies appearance across different thoughts", () => {
    const creatures = Array.from({ length: 50 }, (_, i) => generateCreature(hash(`worry ${i}`), "catastrophizing"));
    expect(new Set(creatures.map((c) => c.bodyPoints)).size).toBeGreaterThan(1);
    expect(new Set(creatures.map((c) => c.eyeCount)).size).toBeGreaterThan(1);
    expect(new Set(creatures.map((c) => c.wobble)).size).toBeGreaterThan(1);
  });

  it("gives the same thought a different look under a different species", () => {
    const seed = hash("I always mess everything up.");
    const a = generateCreature(seed, "overgeneralization");
    const b = generateCreature(seed, "all_or_nothing");
    expect({ ...a, species: undefined }).not.toEqual({ ...b, species: undefined });
  });
});
