import type { DistortionId } from "../core/types";

// Mock of content/lines.json (Khan). Lines soften the distortion; they never intensify it.
const LINES: Partial<Record<DistortionId, string[]>> = {
  catastrophizing: [
    "What if this is the end of everything?",
    "Maybe… it would be hard, but not the end?",
    "Things might turn out more okay than I said.",
  ],
  mind_reading: [
    "They're all thinking the worst about you, surely?",
    "Maybe I can't actually know what they think…",
    "They might be busy with their own worries.",
  ],
};

const FALLBACK = [
  "I'm very sure about this thought.",
  "Hmm… maybe I'm not as sure as I sounded.",
  "There might be more to the story.",
];

export function creatureLine(distortion: DistortionId | undefined, turn: number): string {
  const lines = (distortion && LINES[distortion]) || FALLBACK;
  return lines[Math.min(turn, lines.length - 1)];
}
