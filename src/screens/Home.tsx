import { Link } from "react-router-dom";
import Creature from "../components/Creature";
import { distortionById } from "../content";
import { useAppStore } from "../store";
import styles from "./Home.module.css";

export default function Home() {
  const encounters = useAppStore((state) => state.encounters);
  const waiting = Object.values(encounters)
    .filter((e) => (e.phase === "resting" || e.phase === "taming") && e.distortion)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Thought Dungeon</h1>
        <p className={styles.lead}>
          Turn an anxious thought into a creature, then tame it by looking at it from new angles.
        </p>
        <Link className="btn btn-primary" to="/new">
          Begin an encounter
        </Link>
      </section>

      {waiting.length > 0 && (
        <section aria-labelledby="waiting-heading">
          <h2 id="waiting-heading" className={styles.sectionHeading}>
            Waiting for you
          </h2>
          <ul className={styles.list}>
            {waiting.map((e) => {
              const d = distortionById(e.distortion!);
              const taming = e.phase === "taming";
              return (
                <li key={e.id} className={styles.card}>
                  <Creature species={d.id} params={e.creature} resolve={e.resolve} calm={taming} size="small" decorative />
                  <div className={styles.cardText}>
                    <p className={styles.status}>
                      {taming ? `The ${d.creature} has settled down.` : `The ${d.creature} is resting.`}
                    </p>
                    <p className={styles.thought}>“{e.thought}”</p>
                    <Link
                      className={styles.cardLink}
                      to={taming ? `/encounter/${e.id}/tame` : `/encounter/${e.id}`}
                    >
                      {taming ? "Write the balanced thought" : "Continue"}
                      <span className="visually-hidden"> with the {d.creature}</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className={styles.sectionHeading}>
          How it works
        </h2>
        <ol className={styles.steps}>
          <li>Write down a thought that's worrying you.</li>
          <li>Spot the thinking pattern behind it and meet its creature.</li>
          <li>Answer reflective questions until it calms down, then write a more balanced thought.</li>
        </ol>
      </section>

      <nav aria-label="More" className={styles.more}>
        <Link to="/bestiary">Visit your Bestiary</Link>
        <Link to="/learn">Learn about thinking patterns</Link>
      </nav>
    </div>
  );
}
