import { create } from "zustand";
import type { DistortionId, Encounter, Settings, Suggestion } from "./core/types";
// Swap these for ./core/engine and ./data/storage as they land.
import { confirmDistortion, createEncounter } from "./mocks/engine";

interface AppState {
  encounters: Record<string, Encounter>;
  settings: Settings;
  /** Creates an encounter, confirms its distortion, and returns its id. */
  startEncounter: (thought: string, beliefBefore: number, suggestions: Suggestion[], distortion: DistortionId) => string;
  updateSettings: (patch: Partial<Settings>) => void;
}

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useAppStore = create<AppState>()((set) => ({
  encounters: {},
  settings: { sound: true, reducedMotion: prefersReducedMotion },

  startEncounter: (thought, beliefBefore, suggestions, distortion) => {
    const encounter = confirmDistortion(createEncounter(thought, beliefBefore, suggestions), distortion);
    set((state) => ({ encounters: { ...state.encounters, [encounter.id]: encounter } }));
    return encounter.id;
  },

  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
}));
