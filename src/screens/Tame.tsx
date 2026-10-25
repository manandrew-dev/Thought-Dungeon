import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import BeliefSlider from "../components/BeliefSlider";
import CreaturePlaceholder from "../components/CreaturePlaceholder";
// Swap for ../core/safety, content JSON, and Creature.tsx as they land.
import { distortionById } from "../mocks/distortions";
import { breakSuggestion } from "../mocks/lines";
import { moveById } from "../mocks/moves";
import { screen } from "../mocks/safety";
import { useAppStore } from "../store";
import styles from "./Tame.module.css";

const MAX_LENGTH = 500;

export default function Tame() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const encounter = useAppStore((state) => state.encounters[id]);
  const submitBalanced = useAppStore((state) => state.submitBalanced);
  const discardEncounter = useAppStore((state) => state.discardEncounter);

  const [text, setText] = useState("");
  // Start the second rating at the first one so nothing nudges the number either way.
  const [belief, setBelief] = useState(encounter?.beliefBefore ?? 50);
  const [error, setError] = useState("");
  const [breakLine] = useState(breakSuggestion);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const phase = encounter?.phase;
  const isFirstPhase = useRef(true);

  // When the creature is tamed, move focus to the result heading.
  useEffect(() => {
    if (isFirstPhase.current) {
      isFirstPhase.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [phase]);

  if (!encounter || !encounter.distortion) {
    return (
      <>
        <h1>We couldn't find this encounter</h1>
        <p>It may have ended, or the page was refreshed before it was saved.</p>
        <Link to="/">Return home</Link>
      </>
    );
  }

  // No skipping ahead: taming starts once Resolve reaches 0.
  if (encounter.phase === "battling" || encounter.phase === "resting" || encounter.phase === "confirming") {
    return <Navigate to={`/encounter/${id}`} replace />;
  }

  const creatureName = distortionById(encounter.distortion).creature;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const balanced = text.trim();
    if (!balanced) {
      setError("Write a sentence or two. It doesn't need to be perfect.");
      return;
    }
    // Screen before saving (S1). On crisis the encounter is discarded, not saved.
    if (screen(balanced).crisis) {
      discardEncounter(id);
      navigate("/support", { replace: true });
      return;
    }
    submitBalanced(id, balanced, belief);
  }

  if (encounter.phase === "tamed") {
    return (
      <div className={styles.page}>
        <h1 ref={headingRef} tabIndex={-1}>
          The {creatureName} is calm now
        </h1>
        <CreaturePlaceholder name={creatureName} resolve={0} calm />
        <p className={styles.lead}>It has joined your Bestiary.</p>

        <section className={styles.panel} aria-labelledby="change-heading">
          <h2 id="change-heading" className={styles.panelHeading}>
            How the thought feels now
          </h2>
          <p>
            You rated the original thought <strong>{encounter.beliefBefore}</strong> before and{" "}
            <strong>{encounter.beliefAfter}</strong> now.
          </p>
          <p className={styles.label}>Your balanced thought</p>
          <blockquote className={styles.quote}>{encounter.balancedThought}</blockquote>
        </section>

        <p>That was real work. {breakLine}</p>

        <div className={styles.actions}>
          <Link className="btn btn-secondary" to="/">
            Return home
          </Link>
          <Link className="btn btn-primary" to="/bestiary">
            Visit your Bestiary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Taming the {creatureName}</h1>
      <p className={styles.thought}>
        <span className="visually-hidden">Your original thought: </span>“{encounter.thought}”
      </p>

      <section className={styles.panel} aria-labelledby="found-heading">
        <h2 id="found-heading" className={styles.panelHeading}>
          What you found
        </h2>
        <ul className={styles.answers}>
          {encounter.turns.map((turn, i) => (
            <li key={i}>
              <span className={styles.moveName}>{moveById(turn.moveId)?.name ?? "Move"}</span>
              <span>{turn.answer}</span>
            </li>
          ))}
        </ul>
      </section>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="balanced" className={styles.label}>
            Write a more balanced version of the thought
          </label>
          <p id="balanced-hint" className={styles.hint}>
            It can hold both the worry and what you found, e.g. “Midterms are stressful, but I studied, and one exam
            doesn't define me.”
          </p>
          <textarea
            id="balanced"
            className={styles.textarea}
            rows={4}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError("");
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "balanced-hint balanced-error" : "balanced-hint"}
          />
          <div className={styles.meta}>
            {error ? (
              <p id="balanced-error" className={styles.error}>
                {error}
              </p>
            ) : (
              <span />
            )}
            <span className={styles.count}>
              {text.length} / {MAX_LENGTH}
            </span>
          </div>
        </div>

        <BeliefSlider label="How much do you believe the original thought now?" value={belief} onChange={setBelief} />

        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary">
            Tame the {creatureName}
          </button>
        </div>
      </form>
    </div>
  );
}
