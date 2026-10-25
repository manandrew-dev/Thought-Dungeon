import { create } from "zustand";
import type { DistortionId, Encounter, Settings, Suggestion } from "./core/types";
// Swap these for ./core/engine and ./data/storage as they land.
import { applyMove, confirmDistortion, createEncounter, resume, retreat, submitBalanced } from "./mocks/engine";

interface AppState {
  encounters: Record<string, Encounter>;
  settings: Settings;
  /** Creates an encounter, confirms its distortion, and returns its id. */
  startEncounter: (thought: string, beliefBefore: number, suggestions: Suggestion[], distortion: DistortionId) => string;
  applyMove: (id: string, moveId: string, answer: string) => void;
  retreat: (id: string) => void;
  resume: (id: string) => void;
  submitBalanced: (id: string, text: string, beliefAfter: number) => void;
  /** Drops an encounter without saving, e.g. after a crisis screen (architecture §5.1). */
  discardEncounter: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useAppStore = create<AppState>()((set) => {
  const update = (id: string, fn: (encounter: Encounter) => Encounter) =>
    set((state) => {
      const encounter = state.encounters[id];
      return encounter ? { encounters: { ...state.encounters, [id]: fn(encounter) } } : state;
    });

  return {
    encounters: {},
    settings: { sound: true, reducedMotion: prefersReducedMotion },

    startEncounter: (thought, beliefBefore, suggestions, distortion) => {
      const encounter = confirmDistortion(createEncounter(thought, beliefBefore, suggestions), distortion);
      set((state) => ({ encounters: { ...state.encounters, [encounter.id]: encounter } }));
      return encounter.id;
    },

    applyMove: (id, moveId, answer) => update(id, (e) => applyMove(e, moveId, answer)),
    retreat: (id) => update(id, retreat),
    resume: (id) => update(id, resume),
    submitBalanced: (id, text, beliefAfter) => update(id, (e) => submitBalanced(e, text, beliefAfter)),

    discardEncounter: (id) =>
      set((state) => {
        const { [id]: _discarded, ...rest } = state.encounters;
        return { encounters: rest };
      }),

    updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
  };
});
