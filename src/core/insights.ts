import { DISTORTIONS, MOVES } from "../content";
import type { DistortionId, Encounter, FieldNote } from "./types";

function isRating(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function average(changes: number[]): number {
  // Sum in a stable order, including when the input encounters are reordered.
  return [...changes].sort((a, b) => a - b).reduce((sum, change) => sum + change, 0) / changes.length;
}

function formatChange(change: number): string {
  const rounded = Number(change.toFixed(1));
  return (rounded === 0 ? 0 : rounded).toFixed(1);
}

export function fieldNotes(encounters: Encounter[]): FieldNote[] {
  const distortions = new Map(DISTORTIONS.map((distortion) => [distortion.id, distortion.name]));
  const moves = new Map(MOVES.map((move) => [move.id, move.name]));
  const frequencies = new Map<DistortionId, number>();
  const changes: number[] = [];
  const moveChanges = new Map<string, number[]>();

  for (const encounter of encounters) {
    if (encounter?.phase !== "tamed") continue;

    if (encounter.distortion && distortions.has(encounter.distortion)) {
      frequencies.set(encounter.distortion, (frequencies.get(encounter.distortion) ?? 0) + 1);
    }

    if (!isRating(encounter.beliefBefore) || !isRating(encounter.beliefAfter)) continue;
    const change = encounter.beliefAfter - encounter.beliefBefore;
    changes.push(change);

    // Repeated use of a move contributes only once to that encounter's association.
    const turns = Array.isArray(encounter.turns) ? encounter.turns : [];
    const usedIds = new Set(turns.map((turn) => turn?.moveId));
    for (const id of usedIds) {
      if (!moves.has(id)) continue;
      const associated = moveChanges.get(id) ?? [];
      associated.push(change);
      moveChanges.set(id, associated);
    }
  }

  const notes: FieldNote[] = [...frequencies]
    .sort(([leftId, leftCount], [rightId, rightCount]) => rightCount - leftCount || compareIds(leftId, rightId))
    .map(([id, count]) => ({
      kind: "distortion_frequency",
      text: `${distortions.get(id)} was the confirmed distortion in ${count} completed ${count === 1 ? "encounter" : "encounters"}.`,
    }));

  if (changes.length > 0) {
    notes.push({
      kind: "mean_belief_change",
      text: `Self-reported belief change averaged ${formatChange(average(changes))} points (after minus before) across ${changes.length} completed ${changes.length === 1 ? "encounter" : "encounters"} with both ratings.`,
    });
  }

  const comparable = [...moveChanges]
    .filter(([, values]) => values.length >= 2)
    .map(([id, values]) => ({ id, count: values.length, mean: average(values) }))
    .sort((left, right) => Math.abs(right.mean) - Math.abs(left.mean) || compareIds(left.id, right.id));

  // A lone move or a single observation does not support a move comparison.
  if (comparable.length >= 2) {
    const largest = Math.abs(comparable[0]!.mean);
    for (const candidate of comparable) {
      if (largest === 0 || Math.abs(candidate.mean) !== largest) continue;
      notes.push({
        kind: "effective_move",
        text: `In ${candidate.count} rated completed encounters including ${moves.get(candidate.id)}, self-reported belief change averaged ${formatChange(candidate.mean)} points (after minus before). This is an encounter-level association, not an individual move effect.`,
      });
    }
  }

  return notes;
}
