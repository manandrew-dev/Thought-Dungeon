# Thought Dungeon — Requirements Specification

**Project:** Thought Dungeon
**Context:** UVEC 2026 Hackathon (theme: a gamified process for supporting mental health)
**Related documents:** `architecture.md`

---

## 1. Purpose

Thought Dungeon is a browser-based application that delivers **cognitive restructuring**, a core technique of Cognitive Behavioural Therapy (CBT), as a turn-based encounter game. Each anxious thought entered by the user becomes a creature whose species is the cognitive distortion behind it. The user transforms ("tames") the creature by working through CBT reframing questions and producing a balanced alternative thought.

### 1.1 Problem

Distorted anxious thinking is a common driver of stress and anxiety, particularly among university students. Cognitive restructuring is an evidence-based response, but its standard delivery format, the written thought record, is clinical and frequently abandoned. Thought Dungeon maps each step of a thought record onto a game action so that the game mechanic and the therapeutic process are the same thing.

### 1.2 Target users

| Group | Description |
|---|---|
| Primary | University students experiencing stress and anxious rumination (exams, deadlines, social worries). |
| Secondary | People familiar with CBT thought records seeking a less clinical way to practise them. |
| Excluded | People in crisis. The system detects crisis language and redirects to professional support (§6). |

## 2. Design principles

All features must conform to the following principles.

| ID | Principle |
|---|---|
| P-1 | **Mechanic is method.** Every game action corresponds to a step of cognitive restructuring. |
| P-2 | **Tame, don't kill.** Creatures are transformed and befriended, never destroyed. |
| P-3 | **No fail state.** The player has no health, there is no timer, and no answer is marked wrong. |
| P-4 | **No pressure mechanics.** No streaks, quotas, push notifications, or messages about missed days. |
| P-5 | **Bounded sessions.** An encounter is designed to take 3–5 minutes. The system does not prompt the user to begin another encounter. |
| P-6 | **Local and private.** All user data remains on the user's device. |

## 3. Glossary

| Term | Definition |
|---|---|
| Thought | Free-text worry entered by the user. |
| Distortion | One of ten cognitive distortion types (§4.2). |
| Creature | Visual representation of a thought. Species is determined by distortion; appearance is seeded from the thought text. |
| Encounter | One full session from thought capture to taming. |
| Resolve | Creature meter, 100 → 0. Reaches 0 when the user has worked through enough reframing questions. |
| Move | A CBT reframing question offered to the user during an encounter. |
| Balanced thought | User-written alternative thought produced at the end of an encounter. |
| Belief rating | User's self-rated belief in the original thought, 0–100, captured before and after. |
| Bestiary | Collection of all tamed creatures and their encounter records. |

## 4. Functional requirements

Priority levels: **P0** required for release · **P1** expected · **P2** optional.

### 4.1 Thought capture
| ID | Requirement | Priority |
|---|---|---|
| F1 | The system shall accept a free-text thought of 1–500 characters. | P0 |
| F2 | The system shall capture a belief rating (0–100) before the encounter begins. | P0 |
| F3 | The system shall pass all free-text input through the safety screener before any other processing (§6). | P0 |

### 4.2 Distortion identification
| ID | Requirement | Priority |
|---|---|---|
| F4 | The system shall suggest the one or two most likely distortion types for a thought using a rule-based classifier. | P0 |
| F5 | The user shall confirm or override the suggested distortion before the encounter begins. Identifying the distortion is part of the restructuring process. | P0 |
| F6 | The system may use an in-browser machine-learning classifier to improve suggestions. If it is unavailable or exceeds its timeout, the rule-based result shall be used. | P2 |

Supported distortion types:

| ID | Distortion | Creature | Example thought |
|---|---|---|---|
| `catastrophizing` | Catastrophizing | Doomwyrm | "If I fail this, my life is over." |
| `mind_reading` | Mind Reading | Whisperer | "They definitely think I'm annoying." |
| `fortune_telling` | Fortune Telling | Oracle Moth | "I just know it'll go badly." |
| `all_or_nothing` | All-or-Nothing Thinking | Splitter | "If it's not perfect, it's worthless." |
| `overgeneralization` | Overgeneralization | Echo Slime | "I always mess everything up." |
| `should_statements` | Should Statements | Shouldgeist | "I should be further along by now." |
| `labeling` | Labeling | Tagling | "I'm such an idiot." |
| `emotional_reasoning` | Emotional Reasoning | Fogling | "I feel useless, so I must be." |
| `personalization` | Personalization | Mirror Imp | "The group failed because of me." |
| `mental_filter` | Mental Filter | Shadow Sieve | "The one bad comment is all that matters." |

### 4.3 Encounter
| ID | Requirement | Priority |
|---|---|---|
| F7 | The system shall generate a creature for each thought. Species shall be determined by distortion; visual variation shall be deterministically seeded from the thought text. | P0 |
| F8 | Each creature shall have a Resolve meter starting at 100. | P0 |
| F9 | Each turn, the system shall offer three moves drawn from those applicable to the distortion. The same move shall not be offered in consecutive turns. | P0 |
| F10 | The user shall answer the selected move's question in free text. Empty strings (`""`) and whitespace-only answers (spaces, tabs, or newlines) are invalid and shall receive an effect of 0. The engine shall reject them before changing encounter state: they shall not reduce Resolve, record a turn, draw new moves, or advance the encounter. Every valid answer containing at least one non-whitespace character shall reduce Resolve by a positive amount based on effort (length and reflective language), never on correctness. | P0 |
| F11 | Between turns, the creature shall display a line of dialogue that restates the distortion in softened form. Dialogue shall never intensify the user's thought. | P1 |
| F12 | Moves shall be accompanied by animation and sound, subject to user settings (F22). | P1 |
| F13 | The user may retreat from an encounter at any time. A retreated encounter is saved in a resting state with no penalty. | P1 |

Scoring rewards participation and reflective language without judging whether someone's thoughts are correct or therapeutically appropriate. The scorer shall perform no semantic analysis or gibberish detection; this is an intentional MVP limitation to maintain a supportive, nonjudgmental experience. This does not replace the safety screening required by F3 and S1. For valid nonempty answers, scoring shall use `effect = basePower + min(15, 0.4 × wordCount) + min(10, 3 × reflectiveMarkerCount)` as defined in `architecture.md` §5.4. Base power shall remain 15–30, the bonuses shall remain capped at 15 and 10 respectively, and the effect shall remain between `basePower` and `basePower + 25`. Scoring shall be deterministic and require no external AI or API dependencies.

### 4.4 Taming
| ID | Requirement | Priority |
|---|---|---|
| F14 | When Resolve reaches 0, the user shall write a balanced thought. The user's previous answers in the encounter shall be displayed as reference. | P0 |
| F15 | The system shall capture a second belief rating and display the change from the first rating in neutral language. | P0 |
| F16 | The creature shall transform to its calm form and be added to the Bestiary. | P0 |
| F17 | On completion, the system shall suggest taking a break and shall not prompt a new encounter. | P1 |

### 4.5 Bestiary
| ID | Requirement | Priority |
|---|---|---|
| F18 | The Bestiary shall display all tamed creatures. Selecting one shall show its original thought, answers, balanced thought, and belief change. | P0 |
| F19 | The Bestiary shall display "Field Notes": observations on the most frequent distortion types and most effective moves, phrased descriptively and without judgement. | P1 |
| F20 | The user may revisit a tamed creature to reconsider its balanced thought. | P2 |

### 4.6 Data and settings
| ID | Requirement | Priority |
|---|---|---|
| F21 | All data shall persist in browser `localStorage` under a versioned schema. | P0 |
| F22 | The user shall be able to toggle sound and reduced motion. Reduced motion shall default to the `prefers-reduced-motion` media query. | P1 |
| F23 | The user shall be able to export all data as JSON and delete all data after confirmation. | P1 |
| F24 | The system shall provide a reference page explaining each distortion type in plain language. | P1 |

## 5. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| N1 | Cost / dependencies | The system shall run entirely client-side. It shall use no backend, paid API, or API key. |
| N2 | Availability | The system shall function offline after first load, excluding the optional ML model download. |
| N3 | Performance | The encounter screen shall be interactive within 2 seconds on a typical laptop. ML inference, if used, shall run off the main thread. |
| N4 | Accessibility | The UI shall meet WCAG 2.1 AA: full keyboard operation, visible focus, AA contrast, text alternatives for creatures, and no information conveyed by colour alone. |
| N5 | Responsiveness | The UI shall support viewport widths from 360 px to desktop. |
| N6 | Maintainability | Game logic shall be implemented as framework-independent TypeScript with automated unit tests. |
| N7 | Licensing | All third-party assets shall be licensed for this use and credited in `README.md`. |

## 6. Safety requirements

| ID | Requirement |
|---|---|
| S1 | Every free-text input shall be screened for language indicating self-harm or suicidal intent. A positive result shall halt the game flow and display the Support screen. The input shall not be saved. |
| S2 | The Support screen shall list the 9-8-8 Suicide Crisis Helpline (Canada, call or text), 911 for emergencies, and campus counselling services. |
| S3 | The Support screen shall contain no game elements or game terminology. |
| S4 | The application shall display a persistent notice that it is a practice tool and not a replacement for professional support. |
| S5 | The screener shall favour false positives over false negatives. |

## 7. Constraints

| ID | Constraint |
|---|---|
| C1 | Source code shall be hosted in a GitHub repository created on the day of the event. |
| C2 | Commits after 6:00 PM on October 25, 2026 are not considered. |
| C3 | The repository shall contain `README.md` at its root describing the project, all features, and how to build or access it. |
| C4 | No paid APIs or paid access resources shall be used. |
| C5 | The project shall be presented in an 8–10 minute slide presentation covering problem, solution, and impact. |

## 8. Out of scope

User accounts, cloud sync, multiplayer, clinician-facing features, push notifications, LLM-generated content, native mobile applications.

## 9. Acceptance scenario

1. User enters "I'm going to bomb my midterm and everyone will know I'm a fraud" with belief 90.
2. System suggests Catastrophizing (and optionally Mind Reading); user confirms Catastrophizing.
3. A Doomwyrm is generated. User completes 3–5 moves; Resolve reaches 0 and the creature visibly softens with each move.
4. User writes a balanced thought and re-rates belief at 45. System displays the change.
5. The tamed creature appears in the Bestiary with the full encounter record.
6. The system suggests a break and does not prompt a new encounter.
7. Reloading the page preserves the Bestiary.
