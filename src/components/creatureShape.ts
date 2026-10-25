import { mulberry32 } from "../core/rng";
import type { CreatureParams } from "../core/types";

// Pure geometry and colour for Creature.tsx (architecture §5.5), kept separate so it can be unit-tested.

export const VIEWBOX = 200;
export const CENTER = { x: 100, y: 108 };
export const BASE_RADIUS = 60;

export type Point = [number, number];

/** 0 = calm and round, 1 = fully bristling. */
export function spikiness(resolve: number, calm: boolean): number {
  return calm ? 0 : Math.min(1, Math.max(0, resolve / 100));
}

/**
 * Radial vertices: one tip per bodyPoint with a valley between each pair, plus seeded jitter.
 * Tips and valleys both settle onto a circle as spikiness falls.
 */
export function bodyPoints(params: CreatureParams, spike: number): Point[] {
  const rng = mulberry32(params.seed);
  const n = params.bodyPoints * 2;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const jitter = rng() * 2 - 1;
    const radius = BASE_RADIUS * (1 + spike * ((i % 2 === 0 ? 0.28 : -0.14) + 0.08 * jitter));
    return [CENTER.x + Math.cos(angle) * radius, CENTER.y + Math.sin(angle) * radius];
  });
}

/** Closed Catmull-Rom curve through the points; lower tension near full spikiness gives sharper tips. */
export function bodyPath(points: Point[], spike: number): string {
  const n = points.length;
  const tension = (1 - 0.85 * spike) / 6;
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [points[(i - 1 + n) % n], points[i], points[(i + 1) % n], points[(i + 2) % n]];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/** Darker and more saturated while bristling; light and soft when calm. */
export function bodyColours(hue: number, spike: number, calm: boolean) {
  const saturation = calm ? 35 : 30 + 28 * spike;
  const lightness = calm ? 84 : 76 - 28 * spike;
  return {
    fill: `hsl(${hue} ${saturation}% ${lightness}%)`,
    stroke: `hsl(${hue} ${saturation}% ${Math.max(18, lightness - 40)}%)`,
  };
}

/** Eye x-positions, centred on the body. */
export function eyePositions(eyeCount: number): number[] {
  const gap = 24;
  return Array.from({ length: eyeCount }, (_, i) => CENTER.x + (i - (eyeCount - 1) / 2) * gap);
}

/** Mouth curve: a wobbly frown while bristling, easing into a small smile as it calms. */
export function mouthPath(spike: number): string {
  const y = CENTER.y + 22;
  const curve = 8 - 16 * spike; // positive bends down into a smile
  return `M${CENTER.x - 14} ${y} Q${CENTER.x} ${(y + curve).toFixed(1)} ${CENTER.x + 14} ${y}`;
}

export function creatureLabel(name: string, resolve: number, calm: boolean): string {
  if (calm) return `${name}, calm and at rest`;
  const mood = resolve > 66 ? "bristling" : resolve > 33 ? "softening" : "almost calm";
  return `${name}, ${mood}, resolve ${Math.round(resolve)} of 100`;
}
