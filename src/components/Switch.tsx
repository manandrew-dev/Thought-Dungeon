import { useId } from "react";
import styles from "./Switch.module.css";

interface SwitchProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// A native checkbox exposed as a switch, so Space toggles it and screen readers announce on/off.
export default function Switch({ label, hint, checked, onChange }: SwitchProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
      </div>
      <span className={styles.control}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className={styles.input}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={hint ? hintId : undefined}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        <span className={styles.state} aria-hidden="true">
          {checked ? "On" : "Off"}
        </span>
      </span>
    </div>
  );
}
