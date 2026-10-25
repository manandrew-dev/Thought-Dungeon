import type { Distortion, DistortionId, Move } from "../core/types";
import distortionsJson from "./distortions.json";
import linesJson from "./lines.json";
import movesJson from "./moves.json";

// Typed access to the static content (architecture §5.8). Exports mirror src/mocks/
// so screens can switch imports without other changes.

/** `example` is display-only: shown next to the blurb on the Capture screen. */
export type DistortionInfo = Distortion & { example: string };

export const DISTORTIONS = distortionsJson as DistortionInfo[];
export const MOVES = movesJson as Move[];

interface Lines {
  creature: Record<DistortionId, string[]>;
  tamed: Record<DistortionId, string>;
  breaks: string[];
}

const LINES = linesJson as Lines;

export const distortionById = (id: DistortionId) => DISTORTIONS.find((d) => d.id === id)!;

export const moveById = (id: string) => MOVES.find((m) => m.id === id);

export const movePool = (distortion: DistortionId) =>
  MOVES.filter((m) => m.distortions === "any" || m.distortions.includes(distortion));

/** Creature dialogue for the given turn; each line is gentler than the last, and the final one repeats. */
export function creatureLine(distortion: DistortionId | undefined, turn: number): string {
  const lines = LINES.creature[distortion ?? "catastrophizing"];
  return lines[Math.min(Math.max(0, turn), lines.length - 1)];
}

export function tamedLine(distortion: DistortionId): string {
  return LINES.tamed[distortion];
}

export function breakSuggestion(): string {
  return LINES.breaks[Math.floor(Math.random() * LINES.breaks.length)];
}

export const BREAK_SUGGESTIONS: readonly string[] = LINES.breaks;
