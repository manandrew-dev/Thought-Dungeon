import type { DistortionId, Encounter, Move, Suggestion } from "../core/types";
import { moveById, movePool } from "./moves";

// Mock of core/engine.ts and core/scorer.ts (Keith). The real engine exposes reduce(state, action, rng);
// each function below stands in for reduce with the matching action type.

const REFLECTIVE_MARKERS = ["but", "although", "evidence", "actually", "maybe", "in the past", "a friend"];

// Mirrors architecture §5.4.
function effect(answer: string, move: Move): number {
  const lower = answer.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean).length;
  const markers = REFLECTIVE_MARKERS.filter((m) => new RegExp(`\\b${m}\\b`).test(lower)).length;
  return move.basePower + Math.min(15, 0.4 * words) + Math.min(10, 3 * markers);
}

function drawMoves(distortion: DistortionId, exclude?: string): string[] {
  const pool = movePool(distortion).filter((m) => m.id !== exclude);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((m) => m.id);
}

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

// CONFIRM_DISTORTION
export function confirmDistortion(state: Encounter, distortion: DistortionId): Encounter {
  if (state.phase !== "confirming") return state;
  return {
    ...state,
    distortion,
    creature: { seed: 1, species: distortion, bodyPoints: 8, wobble: 0.5, hue: 220, eyeCount: 2 },
    offeredMoveIds: drawMoves(distortion),
    phase: "battling",
  };
}

// USE_MOVE
export function applyMove(state: Encounter, moveId: string, answer: string): Encounter {
  const move = moveById(moveId);
  if (state.phase !== "battling" || !state.distortion || !move || !state.offeredMoveIds.includes(moveId)) return state;
  const amount = Math.round(effect(answer, move));
  const resolve = Math.max(0, state.resolve - amount);
  return {
    ...state,
    resolve,
    turns: [...state.turns, { moveId, answer, effect: amount }],
    offeredMoveIds: drawMoves(state.distortion, moveId),
    phase: resolve === 0 ? "taming" : "battling",
  };
}

// RETREAT
export function retreat(state: Encounter): Encounter {
  return state.phase === "battling" ? { ...state, phase: "resting" } : state;
}

// RESUME
export function resume(state: Encounter): Encounter {
  return state.phase === "resting" ? { ...state, phase: "battling" } : state;
}

// SUBMIT_BALANCED
export function submitBalanced(state: Encounter, text: string, beliefAfter: number): Encounter {
  return state.phase === "taming" ? { ...state, balancedThought: text, beliefAfter, phase: "tamed" } : state;
}
