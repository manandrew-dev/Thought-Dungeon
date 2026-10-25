import type { Move } from "./types";

const REFLECTIVE_MARKERS = [
  "but",
  "although",
  "evidence",
  "actually",
  "maybe",
  "in the past",
  "a friend",
];

const reflectivePattern = new RegExp(
  `\\b(?:${REFLECTIVE_MARKERS.map((marker) => marker.replace(/ /g, "\\s+")).join("|")})\\b`,
  "gi",
);

export function effect(answer: string, move: Move): number {
  const trimmed = answer.trim();
  if (trimmed === "") {
    return 0;
  }

  const wordCount = trimmed.split(/\s+/).length;
  const reflectiveMarkerCount = answer.match(reflectivePattern)?.length ?? 0;

  return move.basePower
    + Math.min(15, 0.4 * wordCount)
    + Math.min(10, 3 * reflectiveMarkerCount);
}
