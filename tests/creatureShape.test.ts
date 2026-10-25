import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Creature from "../src/components/Creature";
import {
  BASE_RADIUS,
  CENTER,
  bodyColours,
  bodyPath,
  bodyPoints,
  creatureLabel,
  eyePositions,
  mouthPath,
  spikiness,
} from "../src/components/creatureShape";
import { DISTORTIONS, distortionById } from "../src/content";
import { generateCreature } from "../src/core/creature";
import { hash } from "../src/core/rng";

const params = generateCreature(hash("If I fail this, my life is over."), "catastrophizing");
const radii = (spike: number) => bodyPoints(params, spike).map(([x, y]) => Math.hypot(x - CENTER.x, y - CENTER.y));
const lightness = (colour: string) => Number(colour.match(/ (\d+(?:\.\d+)?)%\)$/)![1]);

describe("creature shape", () => {
  it("maps resolve to spikiness, and calm to zero", () => {
    expect(spikiness(100, false)).toBe(1);
    expect(spikiness(50, false)).toBe(0.5);
    expect(spikiness(0, false)).toBe(0);
    expect(spikiness(100, true)).toBe(0);
    expect(spikiness(140, false)).toBe(1);
    expect(spikiness(-5, false)).toBe(0);
  });

  it("uses a tip and a valley per bodyPoint", () => {
    expect(bodyPoints(params, 1)).toHaveLength(params.bodyPoints * 2);
  });

  it("is a perfect circle when calm", () => {
    radii(0).forEach((r) => expect(r).toBeCloseTo(BASE_RADIUS));
  });

  it("gets less spiky as resolve falls", () => {
    const spread = (spike: number) => Math.max(...radii(spike)) - Math.min(...radii(spike));
    expect(spread(1)).toBeGreaterThan(spread(0.5));
    expect(spread(0.5)).toBeGreaterThan(spread(0));
  });

  it("draws the same path for the same params and resolve", () => {
    expect(bodyPath(bodyPoints(params, 0.7), 0.7)).toBe(bodyPath(bodyPoints(params, 0.7), 0.7));
  });

  it("draws a closed path", () => {
    expect(bodyPath(bodyPoints(params, 1), 1)).toMatch(/^M.*Z$/);
  });

  it("gets lighter as it calms", () => {
    expect(lightness(bodyColours(200, 1, false).fill)).toBeLessThan(lightness(bodyColours(200, 0.3, false).fill));
    expect(lightness(bodyColours(200, 0, true).fill)).toBeGreaterThan(lightness(bodyColours(200, 0, false).fill));
  });

  it.each([1, 2, 3])("centres %i eye(s) on the body", (count) => {
    const xs = eyePositions(count);
    expect(xs).toHaveLength(count);
    expect(xs.reduce((a, b) => a + b, 0) / count).toBeCloseTo(CENTER.x);
  });

  it("turns a frown into a smile as it calms", () => {
    const controlY = (d: string) => Number(d.match(/Q\S+ (\S+)/)![1]);
    const endY = CENTER.y + 22;
    expect(controlY(mouthPath(1))).toBeLessThan(endY);
    expect(controlY(mouthPath(0))).toBeGreaterThan(endY);
  });

  it("describes state in words, not colour", () => {
    expect(creatureLabel("Doomwyrm", 90, false)).toBe("Doomwyrm, bristling, resolve 90 of 100");
    expect(creatureLabel("Doomwyrm", 50, false)).toBe("Doomwyrm, softening, resolve 50 of 100");
    expect(creatureLabel("Doomwyrm", 10, false)).toBe("Doomwyrm, almost calm, resolve 10 of 100");
    expect(creatureLabel("Doomwyrm", 0, true)).toBe("Doomwyrm, calm and at rest");
  });
});

describe("Creature", () => {
  const render = (props: Parameters<typeof Creature>[0]) => renderToStaticMarkup(createElement(Creature, props));

  it("is an image with a descriptive label", () => {
    const html = render({ species: "catastrophizing", params, resolve: 80 });
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Doomwyrm, bristling, resolve 80 of 100"');
  });

  it("uses a custom name when given", () => {
    expect(render({ species: "catastrophizing", params, resolve: 0, calm: true, name: "Doomwyrm" })).toContain(
      'aria-label="Doomwyrm, calm and at rest"',
    );
  });

  it("is hidden from screen readers when decorative", () => {
    const html = render({ species: "labeling", resolve: 40, decorative: true });
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("role=");
  });

  it("closes its eyes when calm", () => {
    expect(render({ species: "labeling", resolve: 0, calm: true })).not.toContain('fill="#ffffff"');
    expect(render({ species: "labeling", resolve: 50 })).toContain('fill="#ffffff"');
  });

  it.each(DISTORTIONS.map((d) => d.id))("renders a default creature for %s without params", (species) => {
    const html = render({ species, resolve: 40 });
    expect(html).toContain("<svg");
    expect(html).toContain(distortionById(species).creature);
  });

  it("is deterministic for the same props", () => {
    expect(render({ species: "mental_filter", resolve: 60 })).toBe(render({ species: "mental_filter", resolve: 60 }));
  });
});

