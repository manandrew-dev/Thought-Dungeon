import type { DistortionId, Suggestion } from "../core/types";

// Mock of core/classifier (Khan). A few keywords so suggestions vary while testing.
const KEYWORDS: [RegExp, DistortionId][] = [
  [/\b(ruin|over|disaster|bomb|worst|never recover)\b/, "catastrophizing"],
  [/\b(they think|everyone will|thinks i'?m|judg)/, "mind_reading"],
  [/\b(will go badly|going to fail|just know)\b/, "fortune_telling"],
  [/\b(perfect|worthless|total failure)\b/, "all_or_nothing"],
  [/\b(always|never|everything)\b/, "overgeneralization"],
  [/\b(should|must|ought)\b/, "should_statements"],
  [/\bi'?m (such )?an? (idiot|failure|loser|fraud)\b/, "labeling"],
  [/\bi feel\b/, "emotional_reasoning"],
  [/\b(because of me|my fault)\b/, "personalization"],
  [/\b(only|all that matters)\b/, "mental_filter"],
];

export async function suggest(text: string): Promise<Suggestion[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const lower = text.toLowerCase();
  const hits = KEYWORDS.filter(([pattern]) => pattern.test(lower)).map(([, id]) => id);
  if (hits.length === 0) return [{ distortion: "catastrophizing", confidence: 0.1 }];
  return hits.slice(0, 2).map((distortion, i) => ({ distortion, confidence: i === 0 ? 0.7 : 0.3 }));
}
