export type DistortionId =
  | "catastrophizing" | "mind_reading" | "fortune_telling" | "all_or_nothing"
  | "overgeneralization" | "should_statements" | "labeling"
  | "emotional_reasoning" | "personalization" | "mental_filter";

export interface Distortion {
  id: DistortionId;
  name: string;                 // "Catastrophizing"
  creature: string;             // "Doomwyrm"
  blurb: string;                // plain-language explanation
  patterns: WeightedPattern[];  // used by the keyword classifier
  palette: [string, string];    // primary, secondary colour
}

export interface WeightedPattern { pattern: string; weight: number; }  // pattern is a regex source

export interface Move {
  id: string;                   // "examine_evidence"
  name: string;                 // "Examine the Evidence"
  question: string;             // "What facts support this thought? What facts don't?"
  distortions: DistortionId[] | "any";
  basePower: number;            // 15–30
}

export interface Suggestion { distortion: DistortionId; confidence: number; }  // confidence 0–1

export interface CreatureParams {
  seed: number;
  species: DistortionId;
  bodyPoints: number;           // 6–12 blob vertices
  wobble: number;               // 0–1
  hue: number;                  // 0–360, shifted from species palette
  eyeCount: number;             // 1–3
}

export interface Turn {
  moveId: string;
  answer: string;
  effect: number;               // Resolve reduction applied
}

export type Phase = "confirming" | "battling" | "taming" | "tamed" | "resting";

export interface Encounter {
  id: string;                   // UUID
  createdAt: string;            // ISO 8601
  thought: string;
  beliefBefore: number;         // 0–100
  suggestions: Suggestion[];
  distortion?: DistortionId;    // set on confirmation
  creature?: CreatureParams;    // set on confirmation
  resolve: number;              // 100 → 0
  turns: Turn[];
  offeredMoveIds: string[];     // current three moves
  phase: Phase;
  balancedThought?: string;
  beliefAfter?: number;         // 0–100
}

export interface Settings {
  sound: boolean;
  reducedMotion: boolean;
}

export interface SaveFile {
  version: 1;
  encounters: Encounter[];
  settings: Settings;
}
