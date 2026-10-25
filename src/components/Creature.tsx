import { useMemo, type CSSProperties, type ReactNode } from "react";
import { distortionById } from "../content";
import { generateCreature } from "../core/creature";
import { hash } from "../core/rng";
import type { CreatureParams, DistortionId } from "../core/types";
import styles from "./Creature.module.css";
import {
  CENTER,
  VIEWBOX,
  bodyColours,
  bodyPath,
  bodyPoints,
  creatureLabel,
  eyePositions,
  mouthPath,
  spikiness,
} from "./creatureShape";

interface CreatureProps {
  species: DistortionId;
  /** From the encounter. Without it (Learn, Bestiary grid) a default creature for the species is drawn. */
  params?: CreatureParams;
  /** Defaults to the species' creature name. */
  name?: string;
  resolve: number; // 0–100
  calm?: boolean;
  size?: "normal" | "small";
  /** Hide from screen readers when nearby text already names the creature (e.g. inside a card link). */
  decorative?: boolean;
}

// Procedural creature (architecture §5.5): spiky and dark at high resolve, round and light as it
// calms, with closed eyes once tamed. Idle wobble is CSS, so reduced motion switches it off.
export default function Creature({
  species,
  params,
  name,
  resolve,
  calm = false,
  size = "normal",
  decorative = false,
}: CreatureProps) {
  const creature = useMemo(() => params ?? generateCreature(hash(species), species), [params, species]);
  const distortion = distortionById(species);
  const spike = spikiness(resolve, calm);
  const body = bodyPath(bodyPoints(creature, spike), spike);
  const colours = bodyColours(creature.hue, spike, calm);
  const accent = distortion.palette[1];
  const ink = "#2b2a33";

  const a11y = decorative
    ? { "aria-hidden": true }
    : { role: "img", "aria-label": creatureLabel(name ?? distortion.creature, resolve, calm) };

  const style = {
    "--wobble-amount": calm ? 1 : 1 + 4 * creature.wobble * spike,
    "--wobble-duration": `${3.2 - creature.wobble}s`,
  } as CSSProperties;

  return (
    <svg
      className={[styles.creature, size === "small" && styles.small].filter(Boolean).join(" ")}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      style={style}
      focusable="false"
      {...a11y}
    >
      <g className={styles.idle}>
        <g opacity={calm ? 0.55 : 0.9}>{speciesBehind(species, accent)}</g>
        <path className={styles.body} d={body} fill={colours.fill} stroke={colours.stroke} strokeWidth={3} strokeLinejoin="round" />
        <g opacity={calm ? 0.55 : 0.9}>{speciesFront(species, accent, colours.stroke, calm)}</g>
        {eyePositions(creature.eyeCount).map((x) =>
          calm ? (
            <path key={x} d={`M${x - 7} ${CENTER.y - 12} Q${x} ${CENTER.y - 6} ${x + 7} ${CENTER.y - 12}`} fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          ) : (
            <g key={x}>
              <circle cx={x} cy={CENTER.y - 12} r={8} fill="#ffffff" stroke={ink} strokeWidth={1.5} />
              <circle cx={x} cy={CENTER.y - 11} r={4 - 1.5 * spike} fill={ink} />
            </g>
          ),
        )}
        <path d={mouthPath(spike)} fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </svg>
  );
}

// One small, recognisable feature per species, in its secondary palette colour.

function speciesBehind(species: DistortionId, accent: string): ReactNode {
  switch (species) {
    case "catastrophizing": // Doomwyrm: horns
      return (
        <>
          <path d="M76 66 L62 26 L92 56 Z" fill={accent} />
          <path d="M124 66 L138 26 L108 56 Z" fill={accent} />
        </>
      );
    case "mind_reading": // Whisperer: listening antennae
      return (
        <g fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round">
          <path d="M88 58 Q82 34 70 24" />
          <path d="M112 58 Q118 34 130 24" />
          <circle cx={70} cy={24} r={5} fill={accent} />
          <circle cx={130} cy={24} r={5} fill={accent} />
        </g>
      );
    case "fortune_telling": // Oracle Moth: wings
      return (
        <>
          <ellipse cx={50} cy={96} rx={28} ry={42} transform="rotate(-20 50 96)" fill={accent} />
          <ellipse cx={150} cy={96} rx={28} ry={42} transform="rotate(20 150 96)" fill={accent} />
        </>
      );
    case "overgeneralization": // Echo Slime: echo rings
      return (
        <g fill="none" stroke={accent} strokeWidth={3}>
          <circle cx={CENTER.x} cy={CENTER.y} r={80} opacity={0.5} />
          <circle cx={CENTER.x} cy={CENTER.y} r={93} opacity={0.25} />
        </g>
      );
    case "should_statements": // Shouldgeist: ghostly tail
      return <path d="M62 150 Q68 196 82 176 Q92 198 100 178 Q108 198 118 176 Q132 196 138 150 Z" fill={accent} />;
    case "emotional_reasoning": // Fogling: fog puffs
      return (
        <g fill={accent} opacity={0.7}>
          <circle cx={44} cy={142} r={18} />
          <circle cx={158} cy={138} r={20} />
          <circle cx={100} cy={176} r={16} />
        </g>
      );
    default:
      return null;
  }
}

function speciesFront(species: DistortionId, accent: string, outline: string, calm: boolean): ReactNode {
  switch (species) {
    case "all_or_nothing": // Splitter: a seam down its belly
      return <path d="M100 142 L94 149 L106 156 L94 163 L100 170" fill="none" stroke={outline} strokeWidth={3} strokeLinejoin="round" />;
    case "labeling": // Tagling: a tag that falls away once tamed
      return calm ? null : (
        <g>
          <path d="M146 92 L160 114" stroke={outline} strokeWidth={2} />
          <rect x={150} y={112} width={28} height={16} rx={3} transform="rotate(18 164 120)" fill={accent} stroke={outline} strokeWidth={2} />
        </g>
      );
    case "personalization": // Mirror Imp: a hand mirror
      return (
        <g stroke={outline} strokeWidth={2.5}>
          <path d="M150 152 L140 168" strokeLinecap="round" />
          <circle cx={156} cy={140} r={13} fill={accent} />
        </g>
      );
    case "mental_filter": // Shadow Sieve: a mesh patch
      return (
        <g stroke={outline} strokeWidth={1.5} fill="none">
          <circle cx={CENTER.x} cy={152} r={13} fill={accent} />
          <path d="M91 146 H109 M89 152 H111 M91 158 H109 M94 143 V161 M100 139 V165 M106 143 V161" />
        </g>
      );
    default:
      return null;
  }
}
