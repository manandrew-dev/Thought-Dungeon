import { distortionById } from "../content";
import { hash, mulberry32 } from "./rng";
import type { CreatureParams, DistortionId } from "./types";

// Creature generator (architecture §5.5). Pure and deterministic: the same seed and
// species always give the same creature, so identical thoughts look identical.

const HUE_SHIFT = 20; // max degrees either side of the species' primary colour

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return 0;
  const hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

export function generateCreature(seed: number, species: DistortionId): CreatureParams {
  // Mix the species into the seed so one thought confirmed as two species gives two different creatures.
  const rng = mulberry32((seed ^ hash(species)) >>> 0);
  const baseHue = hexToHue(distortionById(species).palette[0]);

  return {
    seed,
    species,
    bodyPoints: 6 + Math.floor(rng() * 7),
    wobble: rng(),
    hue: Math.round(baseHue + (rng() * 2 - 1) * HUE_SHIFT + 360) % 360,
    eyeCount: 1 + Math.floor(rng() * 3),
  };
}
