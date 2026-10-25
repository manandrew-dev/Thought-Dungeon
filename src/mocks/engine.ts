import type { DistortionId, Encounter, Suggestion } from "../core/types";

// Mock of core/engine.ts (Keith). The real engine exposes reduce(state, action, rng);
// confirmDistortion stands in for reduce(state, { type: "CONFIRM_DISTORTION", distortion }, rng).
export function createEncounter(thought: string, beliefBefore: number, suggestions: Suggestion[]): Encounter {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    thought,
    beliefBefore,
    suggestions,
    resolve: 100,
    turns: [],
    offeredMoveIds: [],
    phase: "confirming",
  };
}

export function confirmDistortion(state: Encounter, distortion: DistortionId): Encounter {
  if (state.phase !== "confirming") return state;
  return {
    ...state,
    distortion,
    creature: { seed: 1, species: distortion, bodyPoints: 8, wobble: 0.5, hue: 220, eyeCount: 2 },
    offeredMoveIds: ["examine_evidence", "friend_advice", "likely_outcome"],
    phase: "battling",
  };
}
