import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Encounter, SaveFile } from "../src/core/types";

function createStorage() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    removeItem: vi.fn((key: string) => { data.delete(key); }),
  };
}

const tamedEncounter: Encounter = {
  id: "c3ba61df-4074-4852-b3f6-935c85645a7c",
  createdAt: "2026-10-25T12:00:00.000Z",
  thought: "I will fail my midterm",
  beliefBefore: 90,
  suggestions: [{ distortion: "catastrophizing", confidence: 0.8 }],
  distortion: "catastrophizing",
  creature: {
    seed: 42,
    species: "catastrophizing",
    bodyPoints: 8,
    wobble: 0.5,
    hue: 200,
    eyeCount: 2,
  },
  resolve: 0,
  turns: [{ moveId: "examine_evidence", answer: "Maybe I can prepare", effect: 25 }],
  offeredMoveIds: [],
  phase: "tamed",
  balancedThought: "I can study and ask for help",
  beliefAfter: 45,
};

function createSave(): SaveFile {
  return {
    version: 1,
    encounters: [structuredClone(tamedEncounter)],
    settings: { sound: false, reducedMotion: true },
  };
}

const defaultSave: SaveFile = {
  version: 1,
  encounters: [],
  settings: { sound: false, reducedMotion: false },
};

describe("storage", () => {
  let persistent: ReturnType<typeof createStorage>;
  let storage: typeof import("../src/data/storage");

  beforeEach(async () => {
    vi.resetModules();
    persistent = createStorage();
    vi.stubGlobal("localStorage", persistent);
    vi.stubGlobal("matchMedia", undefined);
    storage = await import("../src/data/storage");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses the versioned storage key and returns defaults when nothing is saved", () => {
    expect(storage.STORAGE_KEY).toBe("thought-dungeon:v1");
    expect(storage.load()).toEqual(defaultSave);
    expect(persistent.getItem).toHaveBeenCalledWith(storage.STORAGE_KEY);
  });

  it.each([true, false])("defaults reduced motion to the media preference (%s)", (matches) => {
    const matchMedia = vi.fn(() => ({ matches }));
    vi.stubGlobal("matchMedia", matchMedia);
    expect(storage.load().settings.reducedMotion).toBe(matches);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("returns valid defaults if the media query throws", () => {
    vi.stubGlobal("matchMedia", () => { throw new Error("Media query unavailable"); });
    expect(storage.load()).toEqual(defaultSave);
  });

  it("returns fresh default objects on each load", () => {
    const first = storage.load();
    first.settings.sound = true;
    first.encounters.push(structuredClone(tamedEncounter));
    expect(storage.load()).toEqual(defaultSave);
  });

  it("round-trips the full save through persistent storage", () => {
    const file = createSave();
    storage.save(file);
    expect(persistent.setItem).toHaveBeenCalledWith(storage.STORAGE_KEY, JSON.stringify(file));
    expect(storage.load()).toEqual(file);
  });

  it("preserves tamed encounters after the storage module is reloaded", async () => {
    storage.save(createSave());
    vi.resetModules();
    const reloaded = await import("../src/data/storage");
    expect(reloaded.load().encounters).toEqual([tamedEncounter]);
  });

  it("preserves a resting encounter for resumption", () => {
    const file = createSave();
    file.encounters = [{ ...tamedEncounter, phase: "resting", resolve: 50 }];
    storage.save(file);
    expect(storage.load()).toEqual(file);
  });

  it("preserves an unconfirmed encounter with optional fields absent", () => {
    const file = createSave();
    file.encounters = [{
      id: "new-encounter",
      createdAt: "2026-10-25T12:00:00.000Z",
      thought: "I am worried",
      beliefBefore: 50,
      suggestions: [],
      resolve: 100,
      turns: [],
      offeredMoveIds: [],
      phase: "confirming",
    }];
    storage.save(file);
    expect(storage.load()).toEqual(file);
  });

  it.each([
    { sound: true, reducedMotion: true },
    { sound: false, reducedMotion: false },
  ])("preserves saved settings rather than replacing them with defaults (%j)", (settings) => {
    const file = { ...createSave(), settings };
    storage.save(file);
    vi.stubGlobal("matchMedia", () => ({ matches: !settings.reducedMotion }));
    expect(storage.load().settings).toEqual(settings);
  });

  it("replaces malformed JSON with a fresh save without throwing", () => {
    persistent.setItem(storage.STORAGE_KEY, "{broken json");
    expect(storage.load()).toEqual(defaultSave);
    expect(JSON.parse(persistent.getItem(storage.STORAGE_KEY)!)).toEqual(defaultSave);
  });

  it.each([0, 2, "1", null])("replaces unsupported schema version %j with a fresh save", (version) => {
    persistent.setItem(storage.STORAGE_KEY, JSON.stringify({ ...createSave(), version }));
    expect(storage.load()).toEqual(defaultSave);
  });

  it.each([
    null,
    [],
    {},
    { version: 1, encounters: [], settings: null },
    { version: 1, encounters: [], settings: { sound: "yes", reducedMotion: false } },
    { version: 1, encounters: "invalid", settings: defaultSave.settings },
    { version: 1, encounters: [null], settings: defaultSave.settings },
    { version: 1, encounters: [{ ...tamedEncounter, phase: "failed" }], settings: defaultSave.settings },
    { version: 1, encounters: [{ ...tamedEncounter, suggestions: [{ distortion: "unknown", confidence: 1 }] }], settings: defaultSave.settings },
    { version: 1, encounters: [{ ...tamedEncounter, turns: [{ moveId: "move", answer: "text", effect: "bad" }] }], settings: defaultSave.settings },
    { version: 1, encounters: [{ ...tamedEncounter, creature: { ...tamedEncounter.creature, eyeCount: "two" } }], settings: defaultSave.settings },
    { version: 1, encounters: [{ ...tamedEncounter, balancedThought: 42 }], settings: defaultSave.settings },
  ])("rejects invalid saved data (%j)", (invalid) => {
    persistent.setItem(storage.STORAGE_KEY, JSON.stringify(invalid));
    expect(storage.load()).toEqual(defaultSave);
  });

  it("keeps save/load working in memory when storage is absent", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(storage.load()).toEqual(defaultSave);
    storage.save(createSave());
    expect(storage.load()).toEqual(createSave());
  });

  it("handles errors when accessing the localStorage property itself", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() { throw new Error("Storage access denied"); },
    });
    expect(storage.load()).toEqual(defaultSave);
    storage.save(createSave());
    expect(storage.load()).toEqual(createSave());
    expect(() => storage.wipe()).not.toThrow();
    expect(storage.load()).toEqual(defaultSave);
  });

  it("falls back when reading throws and retains subsequent saves", () => {
    persistent.getItem.mockImplementation(() => { throw new Error("Read denied"); });
    expect(storage.load()).toEqual(defaultSave);
    storage.save(createSave());
    expect(storage.load()).toEqual(createSave());
    expect(persistent.setItem).not.toHaveBeenCalled();
  });

  it("retains the last successfully loaded save when a later read fails", () => {
    persistent.setItem(storage.STORAGE_KEY, JSON.stringify(createSave()));
    expect(storage.load()).toEqual(createSave());
    persistent.getItem.mockImplementation(() => { throw new Error("Read denied"); });
    expect(storage.load()).toEqual(createSave());
  });

  it("retains the newest save when writing throws and does not reload stale data", () => {
    persistent.setItem(storage.STORAGE_KEY, JSON.stringify(defaultSave));
    persistent.setItem.mockImplementation(() => { throw new Error("Quota exceeded"); });
    storage.save(createSave());
    expect(storage.load()).toEqual(createSave());

    persistent.setItem.mockReset();
    persistent.getItem.mockClear();
    const latest = { ...createSave(), settings: { sound: true, reducedMotion: true } };
    storage.save(latest);
    expect(storage.load()).toEqual(latest);
    expect(persistent.getItem).not.toHaveBeenCalled();
  });

  it("isolates fallback data from mutations of saved inputs and loaded outputs", () => {
    vi.stubGlobal("localStorage", undefined);
    const file = createSave();
    storage.save(file);
    file.encounters.length = 0;
    file.settings.sound = true;

    const loaded = storage.load();
    expect(loaded).toEqual(createSave());
    loaded.encounters.length = 0;
    loaded.settings.sound = true;
    expect(storage.load()).toEqual(createSave());
  });

  it("can replace corrupt data even if persisting the replacement fails", () => {
    persistent.setItem(storage.STORAGE_KEY, "invalid json");
    persistent.setItem.mockImplementation(() => { throw new Error("Write denied"); });
    expect(storage.load()).toEqual(defaultSave);
    storage.save(createSave());
    expect(storage.load()).toEqual(createSave());
  });

  it("exports valid JSON for the default save", () => {
    expect(JSON.parse(storage.exportJson())).toEqual(defaultSave);
  });

  it("exports the complete persisted save", () => {
    storage.save(createSave());
    expect(JSON.parse(storage.exportJson())).toEqual(createSave());
  });

  it("exports the latest fallback save", () => {
    vi.stubGlobal("localStorage", undefined);
    storage.save(createSave());
    expect(JSON.parse(storage.exportJson())).toEqual(createSave());
  });

  it("wipes persistent and fallback data while preserving unrelated keys", async () => {
    persistent.setItem("unrelated", "keep");
    storage.save(createSave());
    storage.wipe();
    expect(persistent.removeItem).toHaveBeenCalledWith(storage.STORAGE_KEY);
    expect(persistent.getItem(storage.STORAGE_KEY)).toBeNull();
    expect(persistent.getItem("unrelated")).toBe("keep");
    expect(storage.load()).toEqual(defaultSave);

    persistent.getItem.mockImplementation(() => { throw new Error("Read denied"); });
    expect(storage.load()).toEqual(defaultSave);
    persistent.getItem.mockReset();
    vi.resetModules();
    const reloaded = await import("../src/data/storage");
    expect(reloaded.load()).toEqual(defaultSave);
  });

  it("attempts to remove an older persistent save even after falling back", () => {
    storage.save(createSave());
    persistent.setItem.mockImplementation(() => { throw new Error("Write denied"); });
    storage.save({ ...createSave(), encounters: [] });
    storage.wipe();
    expect(persistent.getItem(storage.STORAGE_KEY)).toBeNull();
    expect(storage.load()).toEqual(defaultSave);
  });

  it("wipes fallback data even when persistent removal throws", () => {
    storage.save(createSave());
    persistent.removeItem.mockImplementation(() => { throw new Error("Removal denied"); });
    expect(() => storage.wipe()).not.toThrow();
    expect(storage.load()).toEqual(defaultSave);
    expect(JSON.parse(storage.exportJson())).toEqual(defaultSave);
    storage.save({ ...createSave(), encounters: [] });
    expect(storage.load().encounters).toEqual([]);
  });

  it("wipes safely when storage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    storage.save(createSave());
    storage.wipe();
    expect(storage.load()).toEqual(defaultSave);
  });
});
