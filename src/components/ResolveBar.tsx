import styles from "./ResolveBar.module.css";

interface ResolveBarProps {
  value: number; // 0–100
}

export default function ResolveBar({ value }: ResolveBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow} aria-hidden="true">
        <span>Resolve</span>
        <span>{clamped} / 100</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Creature's resolve"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div className={styles.fill} style={{ width: `${clamped}%` }} />
      </div>
      {/* Progressbar updates are not announced reliably, so announce them here. */}
      <p className="visually-hidden" aria-live="polite">
        Resolve is now {clamped}
      </p>
    </div>
  );
}
