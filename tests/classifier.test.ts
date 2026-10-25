import { describe, expect, it } from "vitest";
import { suggest } from "../src/core/classifier";
import { classify, KeywordClassifier } from "../src/core/classifier/keyword";
import type { DistortionId } from "../src/core/types";

const EXAMPLES: Record<DistortionId, string[]> = {
  catastrophizing: [
    "If I fail this, my life is over.",
    "I'm going to bomb my midterm and everyone will know I'm a fraud",
    "If I miss this deadline it'll be a total disaster and I'll never recover",
  ],
  mind_reading: [
    "They definitely think I'm annoying.",
    "My roommate thinks I'm lazy",
    "Everyone will notice how nervous I am and judge me",
  ],
  fortune_telling: [
    "I just know it'll go badly.",
    "I'm going to freeze during my presentation",
    "I won't get the internship anyway, so there's no point in applying",
  ],
  all_or_nothing: [
    "If it's not perfect, it's worthless.",
    "I got a B, so the whole semester is a complete failure",
    "Either I get 100% or I've failed",
  ],
  overgeneralization: [
    "I always mess everything up.",
    "Every time I try something new it goes wrong",
    "Nobody ever replies to my messages, story of my life",
  ],
  should_statements: [
    "I should be further along by now.",
    "I must never make mistakes in front of my team",
    "I ought to be able to handle this on my own",
  ],
  labeling: [
    "I'm such an idiot.",
    "I'm a complete failure",
    "I'm not smart enough to be in this program",
  ],
  emotional_reasoning: [
    "I feel useless, so I must be.",
    "I feel like a fraud so I must be one",
    "I'm so anxious, so something bad is definitely coming",
  ],
  personalization: [
    "The group failed because of me.",
    "My friend seemed upset, it's my fault",
    "I let the whole team down by being sick",
  ],
  mental_filter: [
    "The one bad comment is all that matters.",
    "I only remember the one mistake I made in my talk",
    "I can't stop thinking about that one critical review",
  ],
};

const cases = Object.entries(EXAMPLES).flatMap(([id, texts]) => texts.map((text) => [id, text] as const));

describe("keyword classifier", () => {
  it.each(cases)("includes %s in the top two for %j", (id, text) => {
    expect(classify(text).map((s) => s.distortion)).toContain(id);
  });

  it("suggests catastrophizing first for the acceptance scenario", () => {
    const [first] = classify("I'm going to bomb my midterm and everyone will know I'm a fraud");
    expect(first.distortion).toBe("catastrophizing");
  });

  it.each(["", "   ", "Today I had lunch with my friends.", "🙂"])(
    "falls back to catastrophizing at 0.1 when nothing matches (%j)",
    (text) => {
      expect(classify(text)).toEqual([{ distortion: "catastrophizing", confidence: 0.1 }]);
    },
  );

  it.each(cases)("returns 1–2 sorted suggestions with confidence in (0, 1] (%s: %j)", (_, text) => {
    const result = classify(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(2);
    result.forEach(({ confidence }) => {
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
    if (result.length === 2) expect(result[0].confidence).toBeGreaterThanOrEqual(result[1].confidence);
    expect(new Set(result.map((s) => s.distortion)).size).toBe(result.length);
  });

  it("gives full confidence when only one distortion matches", () => {
    expect(classify("I should rest more")).toEqual([{ distortion: "should_statements", confidence: 1 }]);
  });

  it("ignores case, curly apostrophes, and extra whitespace", () => {
    const plain = classify("I'm such an idiot.");
    expect(classify("I’M   SUCH\nAN IDIOT")).toEqual(plain);
  });

  it("is deterministic", () => {
    const text = "I always fail and everyone thinks I'm stupid";
    expect(classify(text)).toEqual(classify(text));
  });

  it("does not let one call's fallback be mutated into the next", () => {
    classify("")[0].confidence = 0.9;
    expect(classify("")[0].confidence).toBe(0.1);
  });

  it("exposes the same results through the async Classifier interface", async () => {
    const text = "They definitely think I'm annoying.";
    await expect(new KeywordClassifier().suggest(text)).resolves.toEqual(classify(text));
    await expect(suggest(text)).resolves.toEqual(classify(text));
  });
});
