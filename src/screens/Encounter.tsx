import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Creature from "../components/Creature";
import CreatureStage from "../components/CreatureStage";
import MoveCard from "../components/MoveCard";
import ResolveBar from "../components/ResolveBar";
import { useSound } from "../components/useSound";
import { screen } from "../core/safety";
import { creatureLine, distortionById, moveById } from "../content";
import { useAppStore } from "../store";
import styles from "./Encounter.module.css";

export default function Encounter() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const encounter = useAppStore((state) => state.encounters[id]);
  const { applyMove, retreat, resume, discardEncounter } = useAppStore();
  const play = useSound();

  const [selectedMove, setSelectedMove] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const lineRef = useRef<HTMLParagraphElement>(null);
  const calmRef = useRef<HTMLDivElement>(null);
  const turnCount = encounter?.turns.length ?? 0;
  const isFirstTurn = useRef(true);

  // After each move, bring focus to the creature's new line (or the calm moment once tamed down).
  useEffect(() => {
    if (isFirstTurn.current) {
      isFirstTurn.current = false;
      return;
    }
    (lineRef.current ?? calmRef.current)?.focus();
  }, [turnCount]);

  if (!encounter || !encounter.distortion) {
    return (
      <>
        <h1>We couldn't find this encounter</h1>
        <p>It may have ended, or the page was refreshed before it was saved.</p>
        <Link to="/">Return home</Link>
      </>
    );
  }

  const distortion = distortionById(encounter.distortion);
  const creatureName = distortion.creature;
  const move = selectedMove ? moveById(selectedMove) : undefined;

  function handleMove(event: FormEvent) {
    event.preventDefault();
    if (!move) return;
    const text = answer.trim();
    if (!text) {
      setError("Even a few words count.");
      return;
    }
    // Screen every answer before using it (S1). On crisis the encounter is discarded, not saved.
    if (screen(text).crisis) {
      discardEncounter(id);
      navigate("/support", { replace: true });
      return;
    }
    applyMove(id, move.id, text);
    play(useAppStore.getState().encounters[id]?.phase === "taming" ? "calm" : "move");
    setSelectedMove("");
    setAnswer("");
    setError("");
  }

  function handleRetreat() {
    retreat(id);
    navigate("/");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{creatureName}</h1>
        <p className={styles.thought}>
          <span className="visually-hidden">Your thought: </span>“{encounter.thought}”
        </p>
      </header>

      <section className={styles.arena} aria-label={`${creatureName}`}>
        <CreatureStage pulseKey={turnCount} calm={encounter.phase === "taming"}>
          <Creature species={encounter.distortion} params={encounter.creature} resolve={encounter.resolve} calm={encounter.phase === "taming"} />
        </CreatureStage>
        <ResolveBar value={encounter.resolve} />
        {encounter.phase === "battling" && (
          <p key={turnCount} ref={lineRef} tabIndex={-1} className={styles.line} aria-live="polite">
            <span className="visually-hidden">{creatureName} says: </span>
            {creatureLine(encounter.distortion, turnCount)}
          </p>
        )}
      </section>

      {encounter.phase === "battling" && (
        <form className={styles.form} onSubmit={handleMove}>
          <fieldset className={styles.moves}>
            <legend className={styles.legend}>Choose a move</legend>
            {encounter.offeredMoveIds.map((moveId) => {
              const m = moveById(moveId);
              if (!m) return null;
              return (
                <MoveCard
                  key={m.id}
                  group="move"
                  value={m.id}
                  name={m.name}
                  question={m.question}
                  selected={selectedMove === m.id}
                  onSelect={(value) => {
                    setSelectedMove(value);
                    setError("");
                  }}
                />
              );
            })}
          </fieldset>

          {move && (
            <div className={styles.field}>
              <label htmlFor="answer" className={styles.label}>
                {move.question}
              </label>
              <textarea
                id="answer"
                className={styles.textarea}
                rows={4}
                maxLength={1000}
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  if (error) setError("");
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "answer-error" : undefined}
              />
              {error && (
                <p id="answer-error" className={styles.error}>
                  {error}
                </p>
              )}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={handleRetreat}>
              Step away for now
            </button>
            <button type="submit" className="btn btn-primary" disabled={!move}>
              Use move
            </button>
          </div>
        </form>
      )}

      {encounter.phase === "resting" && (
        <div className={styles.panel}>
          <p>The {creatureName} is resting. You can pick this up whenever you like.</p>
          <button type="button" className="btn btn-primary" onClick={() => resume(id)}>
            Continue the encounter
          </button>
        </div>
      )}

      {encounter.phase === "taming" && (
        <div ref={calmRef} tabIndex={-1} className={styles.panel} role="status">
          <p className={styles.calmTitle}>The {creatureName} is settling down…</p>
          <p>You looked at this thought from {turnCount} different angles. Take a breath before the last step.</p>
          <Link className="btn btn-primary" to={`/encounter/${id}/tame`}>
            Write your balanced thought
          </Link>
        </div>
      )}

      {encounter.phase === "tamed" && (
        <div className={styles.panel}>
          <p>The {creatureName} has been tamed.</p>
          <Link to="/bestiary">See it in your Bestiary</Link>
        </div>
      )}
    </div>
  );
}
