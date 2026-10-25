import { Link } from "react-router-dom";
import CreaturePlaceholder from "../components/CreaturePlaceholder";
// Swap for content/distortions.json as it lands.
import { DISTORTIONS } from "../mocks/distortions";
import styles from "./Learn.module.css";

export default function Learn() {
  return (
    <div className={styles.page}>
      <h1>Thinking patterns</h1>
      <div className={styles.intro}>
        <p>
          Everyone's mind takes shortcuts. When we're stressed, some shortcuts make things feel worse than they are.
          Cognitive behavioural therapy (CBT) calls these <em>cognitive distortions</em>. Spotting one is the first
          step to looking at a thought more fairly.
        </p>
        <p>Noticing a pattern isn't a diagnosis, and having these thoughts doesn't mean anything is wrong with you.</p>
      </div>

      <ul className={styles.list}>
        {DISTORTIONS.map((d) => (
          <li key={d.id} className={styles.card}>
            <CreaturePlaceholder name={d.creature} resolve={40} size="small" decorative />
            <div className={styles.cardText}>
              <h2 className={styles.name}>{d.name}</h2>
              <p className={styles.creature}>Its creature: {d.creature}</p>
              <p>{d.blurb}</p>
              <p className={styles.example}>
                Sounds like: <q>{d.example}</q>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className={styles.outro}>
        Have a thought like one of these? <Link to="/new">Begin an encounter</Link>
      </p>
    </div>
  );
}
