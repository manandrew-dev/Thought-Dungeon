import { create } from "zustand";
import type { DistortionId, Encounter, SaveFile, Settings, Suggestion } from "./core/types";
import { createEncounter, reduce, type Action } from "./core/engine";
import { exportJson, load, save, wipe } from "./data/storage";

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
  /** The saved data as pretty-printed JSON, for download. */
  exportJson: () => string;
  /** Deletes all encounters and resets settings, in memory and in storage. */
  wipeAll: () => void;
}

// Seeded PRNGs keep the engine's tests deterministic; in the app, any source of randomness will do.
const rng = Math.random;

const byId = (encounters: Encounter[]) => Object.fromEntries(encounters.map((e) => [e.id, e]));

const initial = load();

export const useAppStore = create<AppState>()((set) => {
  const dispatch = (id: string, action: Action) =>
    set((state) => {
      const encounter = state.encounters[id];
      return encounter ? { encounters: { ...state.encounters, [id]: reduce(encounter, action, rng) } } : state;
    });

  return {
    encounters: byId(initial.encounters),
    settings: initial.settings,

    startEncounter: (thought, beliefBefore, suggestions, distortion) => {
      const encounter = reduce(createEncounter(thought, beliefBefore, suggestions), { type: "CONFIRM_DISTORTION", distortion }, rng);
      set((state) => ({ encounters: { ...state.encounters, [encounter.id]: encounter } }));
      return encounter.id;
    },

    applyMove: (id, moveId, answer) => dispatch(id, { type: "USE_MOVE", moveId, answer }),
    retreat: (id) => dispatch(id, { type: "RETREAT" }),
    resume: (id) => dispatch(id, { type: "RESUME" }),
    submitBalanced: (id, text, beliefAfter) => dispatch(id, { type: "SUBMIT_BALANCED", text, beliefAfter }),

    discardEncounter: (id) =>
      set((state) => {
        const { [id]: _discarded, ...rest } = state.encounters;
        return { encounters: rest };
      }),

    updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

    exportJson: () => exportJson(),

    wipeAll: () => {
      // Wipe first so load() returns fresh defaults. Setting state triggers a save,
      // so wipe again to make removal the last write.
      wipe();
      set({ encounters: {}, settings: load().settings });
      wipe();
    },
  };
});

// Persist every change. Crisis text never reaches the store (screens screen first), and a
// discarded encounter disappears from storage on the next save.
useAppStore.subscribe((state) => {
  const file: SaveFile = { version: 1, encounters: Object.values(state.encounters), settings: state.settings };
  save(file);
});
