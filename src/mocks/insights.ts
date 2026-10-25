import type { DistortionId, Encounter, FieldNote } from "../core/types";
import { distortionById, moveById } from "../content";

// Mock of core/insights.ts (Keith). Descriptive only: no dates or usage counts.
export function fieldNotes(encounters: Encounter[]): FieldNote[] {
  const tamed = encounters.filter((e) => e.phase === "tamed" && e.distortion && e.beliefAfter !== undefined);
  if (tamed.length === 0) return [];
  const notes: FieldNote[] = [];

  const counts = new Map<DistortionId, number>();
  for (const e of tamed) counts.set(e.distortion!, (counts.get(e.distortion!) ?? 0) + 1);
  const top = Math.max(...counts.values());
  const topNames = [...counts].filter(([, n]) => n === top).map(([id]) => distortionById(id).name);
  notes.push({
    kind: "distortion_frequency",
    text: tamed.length === 1
      ? `So far, the pattern you've worked with is ${topNames[0]}.`
      : `${joinNames(topNames)} ${topNames.length === 1 ? "has" : "have"} come up most often.`,
  });

  const avg = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const before = avg(tamed.map((e) => e.beliefBefore));
  const after = avg(tamed.map((e) => e.beliefAfter!));
  notes.push({ kind: "mean_belief_change", text: `On average, belief in the original thought moved from ${before} to ${after}.` });

  const biggest = tamed.reduce((best, e) =>
    e.beliefBefore - e.beliefAfter! > best.beliefBefore - best.beliefAfter! ? e : best,
  );
  if (biggest.beliefBefore - biggest.beliefAfter! > 0) {
    const moveNames = [...new Set(biggest.turns.map((t) => moveById(t.moveId)?.name).filter(Boolean))] as string[];
    if (moveNames.length > 0) {
      notes.push({
        kind: "effective_move",
        text: `${joinNames(moveNames)} ${moveNames.length === 1 ? "was" : "were"} part of the encounter with the largest change.`,
      });
    }
  }

  return notes;
}

function joinNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
