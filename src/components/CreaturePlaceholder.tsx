import type { CSSProperties } from "react";
import styles from "./CreaturePlaceholder.module.css";

interface CreaturePlaceholderProps {
  name: string;
  resolve: number; // 0–100
  calm?: boolean;
  size?: "normal" | "small";
  /** Hide from screen readers when nearby text already names the creature (e.g. inside a card link). */
  decorative?: boolean;
}

// Stand-in for Khan's Creature.tsx (#29): same footprint, softens as resolve drops.
export default function CreaturePlaceholder({
  name,
  resolve,
  calm = false,
  size = "normal",
  decorative = false,
}: CreaturePlaceholderProps) {
  const intensity = calm ? 0 : resolve / 100;
  const classes = [styles.creature, calm && styles.calm, size === "small" && styles.small].filter(Boolean).join(" ");
  const a11y = decorative
    ? { "aria-hidden": true }
    : { role: "img", "aria-label": calm ? `${name}, calm` : `${name}, resolve ${resolve}` };

  return (
    <div className={classes} {...a11y} style={{ "--intensity": intensity } as CSSProperties}>
      <span className={styles.eyes} aria-hidden="true">
        {calm ? "◡ ◡" : "● ●"}
      </span>
    </div>
  );
}
