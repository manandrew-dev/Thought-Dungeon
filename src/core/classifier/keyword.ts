import { DISTORTIONS } from "../../content";
import type { DistortionId, Suggestion } from "../types";
import type { Classifier } from "./index";

// Rule-based classifier (architecture §5.2, requirement F4). Each distortion's weighted
// patterns from distortions.json are matched against the thought; matched weights are summed.

const FALLBACK: Suggestion[] = [{ distortion: "catastrophizing", confidence: 0.1 }];

const COMPILED = DISTORTIONS.map((d) => ({
  id: d.id,
  patterns: d.patterns.map(({ pattern, weight }) => ({ regex: new RegExp(pattern, "i"), weight })),
}));

function normalize(text: string): string {
  return text.replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim();
}

export function scores(text: string): { distortion: DistortionId; score: number }[] {
  const normalized = normalize(text);
  return COMPILED.map(({ id, patterns }) => ({
    distortion: id,
    score: patterns.reduce((sum, { regex, weight }) => sum + (regex.test(normalized) ? weight : 0), 0),
  }));
}

export function classify(text: string): Suggestion[] {
  // Array.prototype.sort is stable, so ties keep the distortions.json order.
  const matched = scores(text).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (matched.length === 0) return FALLBACK.map((s) => ({ ...s }));

  // Confidence is each score's share of all matched weight, so an ambiguous thought gets lower confidence.
  const total = matched.reduce((sum, s) => sum + s.score, 0);
  return matched.slice(0, 2).map(({ distortion, score }) => ({ distortion, confidence: score / total }));
}

export class KeywordClassifier implements Classifier {
  async suggest(text: string): Promise<Suggestion[]> {
    return classify(text);
  }
}
