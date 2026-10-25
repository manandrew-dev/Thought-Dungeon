import { DISTORTIONS, moveById, movePool } from "../content";
import { generateCreature } from "./creature";
import { hash } from "./rng";
import type { Rng } from "./rng";
import { effect } from "./scorer";
import type { DistortionId, Encounter, Suggestion } from "./types";

export type Action =
  | { type: "CONFIRM_DISTORTION"; distortion: DistortionId }
  | { type: "USE_MOVE"; moveId: string; answer: string }
  | { type: "SUBMIT_BALANCED"; text: string; beliefAfter: number }
  | { type: "RETREAT" }
  | { type: "RESUME" };

function isSupportedDistortion(id: DistortionId): boolean {
  return DISTORTIONS.some((distortion) => distortion.id === id);
}

function isBeliefRating(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function offerMoves(distortion: DistortionId, rng: Rng, excludedId?: string): string[] | undefined {
  const pool = movePool(distortion)
    .filter((move) => move.id !== excludedId)
    .map((move) => move.id);
  if (pool.length < 3) return undefined;

  // Remove each selected ID from a copy, so even a constant RNG finishes in three draws.
  const offered: string[] = [];
  for (let choice = 0; choice < 3; choice++) {
    const index = Math.floor(rng() * pool.length);
    offered.push(pool.splice(index, 1)[0]!);
  }
  return offered;
}

// The UI must screen free text before creating encounters or dispatching actions.
export function createEncounter(
  thought: string,
  beliefBefore: number,
  suggestions: Suggestion[],
  opts?: { id?: string; now?: Date },
): Encounter {
  if (thought.length < 1 || thought.length > 500) {
    throw new RangeError("Thought must contain 1–500 characters.");
  }
  if (!isBeliefRating(beliefBefore)) {
    throw new RangeError("Belief rating must be a finite number between 0 and 100.");
  }
  if (suggestions.some((suggestion) => !isSupportedDistortion(suggestion.distortion)
    || !Number.isFinite(suggestion.confidence)
    || suggestion.confidence < 0 || suggestion.confidence > 1)) {
    throw new RangeError("Suggestions must use supported distortion IDs and confidence between 0 and 1.");
  }

  return {
    id: opts?.id ?? globalThis.crypto.randomUUID(),
    createdAt: (opts?.now ?? new Date()).toISOString(),
    thought,
    beliefBefore,
    suggestions: suggestions.map((suggestion) => ({ ...suggestion })),
    resolve: 100,
    turns: [],
    offeredMoveIds: [],
    phase: "confirming",
  };
}

export function reduce(state: Encounter, action: Action, rng: Rng): Encounter {
  switch (action.type) {
    case "CONFIRM_DISTORTION": {
      if (state.phase !== "confirming" || !isSupportedDistortion(action.distortion)) return state;
      const offeredMoveIds = offerMoves(action.distortion, rng);
      if (!offeredMoveIds) return state;

      return {
        ...state,
        distortion: action.distortion,
        creature: generateCreature(hash(state.thought), action.distortion),
        resolve: 100,
        offeredMoveIds,
        phase: "battling",
      };
    }

    case "USE_MOVE": {
      if (state.phase !== "battling" || action.answer.trim() === ""
        || !state.offeredMoveIds.includes(action.moveId) || !state.distortion) return state;
      const move = moveById(action.moveId);
      if (!move || (move.distortions !== "any" && !move.distortions.includes(state.distortion))) return state;

      const amount = effect(action.answer, move);
      if (!Number.isFinite(amount) || amount <= 0) return state;
      const resolve = Math.max(0, state.resolve - amount);
      const offeredMoveIds = resolve === 0 ? [] : offerMoves(state.distortion, rng, move.id);
      if (!offeredMoveIds) return state;

      return {
        ...state,
        resolve,
        turns: [...state.turns, { moveId: move.id, answer: action.answer, effect: amount }],
        offeredMoveIds,
        phase: resolve === 0 ? "taming" : "battling",
      };
    }

    case "SUBMIT_BALANCED":
      if (state.phase !== "taming" || action.text.trim() === "" || !isBeliefRating(action.beliefAfter)) return state;
      return { ...state, balancedThought: action.text, beliefAfter: action.beliefAfter, phase: "tamed" };

    case "RETREAT":
      return state.phase === "battling" ? { ...state, phase: "resting" } : state;

    case "RESUME":
      return state.phase === "resting" ? { ...state, phase: "battling" } : state;

    default:
      return state;
  }
}
