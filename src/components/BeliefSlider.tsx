import { useId } from "react";
import styles from "./BeliefSlider.module.css";

interface BeliefSliderProps {
  label: string;
  value: number; // 0–100
  onChange: (value: number) => void;
}

export default function BeliefSlider({ label, value, onChange }: BeliefSliderProps) {
  const id = useId();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <output htmlFor={id} className={styles.value}>
          {value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className={styles.slider}
        min={0}
        max={100}
        step={1}
        value={value}
        aria-valuetext={`${value} out of 100`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={styles.anchors} aria-hidden="true">
        <span>Not at all</span>
        <span>Completely</span>
      </div>
    </div>
  );
}
