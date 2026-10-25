import styles from "./MoveCard.module.css";

interface MoveCardProps {
  group: string; // shared radio name for the set of offered moves
  value: string;
  name: string;
  question: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

// A styled radio: wrap the set in a labelled group (e.g. fieldset + legend "Choose a move").
export default function MoveCard({ group, value, name, question, selected, onSelect }: MoveCardProps) {
  return (
    <label className={selected ? `${styles.card} ${styles.selected}` : styles.card}>
      <input
        type="radio"
        className={styles.input}
        name={group}
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
      />
      <span className={styles.name}>
        {name}
        {selected && (
          <span className={styles.check} aria-hidden="true">
            ✓
          </span>
        )}
      </span>
      <span className={styles.question}>{question}</span>
    </label>
  );
}
