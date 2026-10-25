import { Link } from "react-router-dom";
import CreaturePlaceholder from "../components/CreaturePlaceholder";
// Swap for content JSON, core/insights, and Creature.tsx as they land.
import { distortionById } from "../mocks/distortions";
import { fieldNotes } from "../mocks/insights";
import { useAppStore } from "../store";
import styles from "./Bestiary.module.css";

export default function Bestiary() {
  const encounters = useAppStore((state) => state.encounters);
  const all = Object.values(encounters);
  const tamed = all
    .filter((e) => e.phase === "tamed" && e.distortion)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const notes = fieldNotes(all);

  return (
    <div className={styles.page}>
      <h1>Bestiary</h1>

      {tamed.length === 0 ? (
        <div className={styles.empty}>
          <p>Your Bestiary is empty for now. Creatures you tame will rest here.</p>
          <Link to="/new">Begin an encounter</Link>
        </div>
      ) : (
        <>
          <p className={styles.lead}>The creatures you've tamed, and what you found along the way.</p>
          <ul className={styles.grid}>
            {tamed.map((e) => {
              const d = distortionById(e.distortion!);
              return (
                <li key={e.id}>
                  <Link className={styles.card} to={`/bestiary/${e.id}`}>
                    <CreaturePlaceholder name={d.creature} resolve={0} calm size="small" decorative />
                    <span className={styles.cardText}>
                      <span className={styles.creatureName}>{d.creature}</span>
                      <span className={styles.distortion}>{d.name}</span>
                      <span className={styles.preview}>“{e.balancedThought}”</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <section className={styles.notes} aria-labelledby="notes-heading">
            <h2 id="notes-heading">Field Notes</h2>
            <ul>
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
