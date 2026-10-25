import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BeliefSlider from "../components/BeliefSlider";
import MoveCard from "../components/MoveCard";
import type { DistortionId, Suggestion } from "../core/types";
import { screen } from "../core/safety";
// Swap for ../core/classifier and content/distortions.json as they land.
import { suggest } from "../mocks/classifier";
import { DISTORTIONS, distortionById } from "../mocks/distortions";
import { useAppStore } from "../store";
import styles from "./Capture.module.css";

const MAX_LENGTH = 500;
const WARN_AT = 450;

type Step = "write" | "confirm";

export default function Capture() {
  const navigate = useNavigate();
  const startEncounter = useAppStore((state) => state.startEncounter);

  const [step, setStep] = useState<Step>("write");
  const [thought, setThought] = useState("");
  const [belief, setBelief] = useState(50);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<DistortionId | "">("");
  const [showAll, setShowAll] = useState(false);

  const stepHeading = useRef<HTMLHeadingElement>(null);
  const isFirstStep = useRef(true);

  // Move focus to the new step's heading, but not on first render (route focus handles that).
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false;
      return;
    }
    stepHeading.current?.focus();
  }, [step]);

  async function handleWrite(event: FormEvent) {
    event.preventDefault();
    const text = thought.trim();
    if (!text) {
      setError("Write a few words about the thought on your mind.");
      return;
    }
    // Safety screening runs before anything else sees the text (F3, S1). Nothing is saved.
    if (screen(text).crisis) {
      navigate("/support", { replace: true });
      return;
    }
    setError("");
    setChecking(true);
    try {
      const result = await suggest(text);
      setSuggestions(result);
      setSelected(result[0]?.distortion ?? "");
      setShowAll(result.length === 0);
    } catch {
      setSuggestions([]);
      setSelected("");
      setShowAll(true);
    } finally {
      setChecking(false);
    }
    setStep("confirm");
  }

  function handleConfirm(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const id = startEncounter(thought.trim(), belief, suggestions, selected);
    navigate(`/encounter/${id}`);
  }

  const suggestedIds = suggestions.map((s) => s.distortion);
  const others = DISTORTIONS.filter((d) => !suggestedIds.includes(d.id));
  const remaining = MAX_LENGTH - thought.length;

  return (
    <>
      <h1>New encounter</h1>

      {step === "write" ? (
        <form className={styles.form} onSubmit={handleWrite} noValidate>
          <h2 ref={stepHeading} tabIndex={-1}>
            What's on your mind?
          </h2>
          <div className={styles.field}>
            <label htmlFor="thought" className={styles.label}>
              Write down one worrying thought, in your own words.
            </label>
            <textarea
              id="thought"
              className={styles.textarea}
              rows={4}
              maxLength={MAX_LENGTH}
              value={thought}
              onChange={(event) => {
                setThought(event.target.value);
                if (error) setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "thought-count thought-error" : "thought-count"}
              placeholder="e.g. I'm going to bomb my midterm"
            />
            <div className={styles.meta}>
              {error ? (
                <p id="thought-error" className={styles.error}>
                  {error}
                </p>
              ) : (
                <span />
              )}
              <span id="thought-count" className={styles.count}>
                {thought.length} / {MAX_LENGTH}
              </span>
            </div>
            <p className="visually-hidden" aria-live="polite">
              {remaining <= MAX_LENGTH - WARN_AT ? `${remaining} characters left` : ""}
            </p>
          </div>

          <BeliefSlider label="How much do you believe this thought right now?" value={belief} onChange={setBelief} />

          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary" disabled={checking}>
              {checking ? "Looking at this thought…" : "Continue"}
            </button>
          </div>
          <p className="visually-hidden" aria-live="polite">
            {checking ? "Looking at this thought…" : ""}
          </p>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleConfirm}>
          <h2 ref={stepHeading} tabIndex={-1}>
            Which thinking pattern fits best?
          </h2>
          <blockquote className={styles.thought}>{thought.trim()}</blockquote>
          <p className={styles.hint}>
            This is a best guess. You know your thoughts better than any tool does, so pick whichever feels closest.
          </p>

          <fieldset className={styles.options}>
            <legend className="visually-hidden">Thinking pattern</legend>
            {suggestions.map((s, i) => {
              const d = distortionById(s.distortion);
              return (
                <MoveCard
                  key={d.id}
                  group="distortion"
                  value={d.id}
                  name={`${d.name} (${d.creature})`}
                  question={`${i === 0 ? "Closest match. " : ""}${d.blurb} For example: "${d.example}"`}
                  selected={selected === d.id}
                  onSelect={(value) => setSelected(value as DistortionId)}
                />
              );
            })}

            {suggestions.length > 0 && (
              <button
                type="button"
                className="btn-link"
                aria-expanded={showAll}
                aria-controls="other-patterns"
                onClick={() => setShowAll((open) => !open)}
              >
                {showAll ? "Show fewer options" : "It's something else"}
              </button>
            )}

            <div id="other-patterns" className={styles.options} hidden={!showAll}>
              {others.map((d) => (
                <MoveCard
                  key={d.id}
                  group="distortion"
                  value={d.id}
                  name={`${d.name} (${d.creature})`}
                  question={`${d.blurb} For example: "${d.example}"`}
                  selected={selected === d.id}
                  onSelect={(value) => setSelected(value as DistortionId)}
                />
              ))}
            </div>
          </fieldset>

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep("write")}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={!selected}>
              Meet the creature
            </button>
          </div>
        </form>
      )}
    </>
  );
}
