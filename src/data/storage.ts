import type { Encounter, SaveFile } from "../core/types";

export const STORAGE_KEY = "thought-dungeon:v1";

// Keep a serialized snapshot so callers cannot mutate the fallback store by reference.
let memoryJson: string | null = null;
let memoryOnly = false;

const distortionIds = new Set([
  "catastrophizing", "mind_reading", "fortune_telling", "all_or_nothing",
  "overgeneralization", "should_statements", "labeling",
  "emotional_reasoning", "personalization", "mental_filter",
]);
const phases = new Set(["confirming", "battling", "taming", "tamed", "resting"]);

function freshSave(): SaveFile {
  let reducedMotion = false;
  try {
    reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    // Media queries may be unavailable outside the browser or in restricted contexts.
  }

  return {
    version: 1,
    encounters: [],
    settings: { sound: false, reducedMotion },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isDistortion(value: unknown): boolean {
  return typeof value === "string" && distortionIds.has(value);
}

function isEncounter(value: unknown): value is Encounter {
  if (!isRecord(value)) return false;

  const creature = value.creature;
  return typeof value.id === "string"
    && typeof value.createdAt === "string"
    && typeof value.thought === "string"
    && isNumber(value.beliefBefore)
    && Array.isArray(value.suggestions)
    && value.suggestions.every((suggestion: unknown) => isRecord(suggestion)
      && isDistortion(suggestion.distortion)
      && isNumber(suggestion.confidence))
    && (value.distortion === undefined || isDistortion(value.distortion))
    && (creature === undefined || (isRecord(creature)
      && isNumber(creature.seed)
      && isDistortion(creature.species)
      && isNumber(creature.bodyPoints)
      && isNumber(creature.wobble)
      && isNumber(creature.hue)
      && isNumber(creature.eyeCount)))
    && isNumber(value.resolve)
    && Array.isArray(value.turns)
    && value.turns.every((turn: unknown) => isRecord(turn)
      && typeof turn.moveId === "string"
      && typeof turn.answer === "string"
      && isNumber(turn.effect))
    && Array.isArray(value.offeredMoveIds)
    && value.offeredMoveIds.every((id: unknown) => typeof id === "string")
    && typeof value.phase === "string" && phases.has(value.phase)
    && (value.balancedThought === undefined || typeof value.balancedThought === "string")
    && (value.beliefAfter === undefined || isNumber(value.beliefAfter));
}

function isSaveFile(value: unknown): value is SaveFile {
  return isRecord(value)
    && value.version === 1
    && Array.isArray(value.encounters)
    && value.encounters.every(isEncounter)
    && isRecord(value.settings)
    && typeof value.settings.sound === "boolean"
    && typeof value.settings.reducedMotion === "boolean";
}

export function load(): SaveFile {
  if (!memoryOnly) {
    try {
      memoryJson = globalThis.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Stay in memory for this session to avoid reloading stale persistent data.
      memoryOnly = true;
    }
  }

  if (memoryJson === null) return freshSave();

  try {
    const parsed: unknown = JSON.parse(memoryJson);
    if (isSaveFile(parsed)) return parsed;
  } catch {
    // Malformed JSON is handled like an invalid or unsupported save below.
  }

  const file = freshSave();
  save(file);
  return file;
}

export function save(file: SaveFile): void {
  memoryJson = JSON.stringify(file);
  if (memoryOnly) return;

  try {
    globalThis.localStorage.setItem(STORAGE_KEY, memoryJson);
  } catch {
    memoryOnly = true;
  }
}

export function exportJson(): string {
  return JSON.stringify(load(), null, 2);
}

export function wipe(): void {
  memoryJson = null;

  // Attempt removal even in fallback mode: an older persistent save may still exist.
  try {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  } catch {
    memoryOnly = true;
  }
}
