import type { Suggestion } from "../types";
import { KeywordClassifier } from "./keyword";

export interface Classifier {
  /** Sorted by confidence, highest first; length 1–2. */
  suggest(text: string): Promise<Suggestion[]>;
}

// Only the keyword classifier for now. The optional ML classifier (F6, P2) would be
// blended in here via a CompositeClassifier without changing callers.
const classifier: Classifier = new KeywordClassifier();

/** Same signature as src/mocks/classifier.ts, so screens can switch imports directly. */
export function suggest(text: string): Promise<Suggestion[]> {
  return classifier.suggest(text);
}
