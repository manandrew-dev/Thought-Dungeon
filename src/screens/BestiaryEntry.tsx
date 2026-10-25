import { Link, useParams } from "react-router-dom";
import Creature from "../components/Creature";
import { distortionById, moveById } from "../content";
import { useAppStore } from "../store";
import styles from "./Bestiary.module.css";

export default function BestiaryEntry() {
  const { id = "" } = useParams();
  const encounter = useAppStore((state) => state.encounters[id]);

  if (!encounter || encounter.phase !== "tamed" || !encounter.distortion) {
    return (
      <>
        <h1>We couldn't find this creature</h1>
        <p>It may not have been tamed yet, or the page was refreshed before it was saved.</p>
        <Link to="/bestiary">Back to Bestiary</Link>
      </>
    );
  }

  const d = distortionById(encounter.distortion);

  return (
    <div className={styles.page}>
      <Link to="/bestiary" className={styles.back}>
        ← Back to Bestiary
      </Link>
      <h1>{d.creature}</h1>
      <Creature species={d.id} params={encounter.creature} resolve={0} calm />
      <p className={styles.lead}>
        <strong>{d.name}:</strong> {d.blurb}
      </p>

      <section className={styles.panel} aria-labelledby="thought-heading">
        <h2 id="thought-heading">The original thought</h2>
        <blockquote className={styles.quote}>{encounter.thought}</blockquote>
      </section>

      <section className={styles.panel} aria-labelledby="found-heading">
        <h2 id="found-heading">What you found</h2>
        <ul className={styles.answers}>
          {encounter.turns.map((turn, i) => (
            <li key={i}>
              <span className={styles.moveName}>{moveById(turn.moveId)?.name ?? "Move"}</span>
              <span>{turn.answer}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="balanced-heading">
        <h2 id="balanced-heading">Your balanced thought</h2>
        <blockquote className={styles.quote}>{encounter.balancedThought}</blockquote>
        <p>
          You rated the original thought <strong>{encounter.beliefBefore}</strong> before and{" "}
          <strong>{encounter.beliefAfter}</strong> after.
        </p>
      </section>
    </div>
  );
}
