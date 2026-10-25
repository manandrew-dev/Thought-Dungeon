import type { CSSProperties } from "react";
import styles from "./CreaturePlaceholder.module.css";

interface CreaturePlaceholderProps {
  name: string;
  resolve: number; // 0–100
  calm?: boolean;
}

// Stand-in for Khan's Creature.tsx (#29): same footprint, softens as resolve drops.
export default function CreaturePlaceholder({ name, resolve, calm = false }: CreaturePlaceholderProps) {
  const intensity = calm ? 0 : resolve / 100;

  return (
    <div
      className={calm ? `${styles.creature} ${styles.calm}` : styles.creature}
      role="img"
      aria-label={calm ? `${name}, calm` : `${name}, resolve ${resolve}`}
      style={{ "--intensity": intensity } as CSSProperties}
    >
      <span className={styles.eyes} aria-hidden="true">
        {calm ? "◡ ◡" : "● ●"}
      </span>
    </div>
  );
}
