# Thought Dungeon

**Tame your anxious thoughts, one creature at a time.**

Thought Dungeon turns *cognitive restructuring*, a core technique of Cognitive Behavioural Therapy (CBT), into a gentle turn-based game. Every anxious thought you write down becomes a creature whose species is the thinking pattern behind it. You calm the creature by working through real CBT reframing questions, then write a more balanced version of the thought.

**Play it:** https://manandrew-dev.github.io/Thought-Dungeon/

Built for the UVEC 2026 Hackathon (theme: a gamified process for supporting mental health).

> Thought Dungeon is a practice tool, not a replacement for professional support. If you are in crisis in Canada, call or text **9-8-8** (Suicide Crisis Helpline), or call **911** in an emergency.

---

## The problem

Distorted anxious thinking ("I'm going to fail and everyone will know I'm a fraud") drives a lot of student stress. Cognitive restructuring is an evidence-based way to work through these thoughts, but its usual format, the written *thought record*, feels clinical, and people often abandon it.

## The idea: the mechanic is the method

Every step of a CBT thought record is a game action, so playing the game *is* doing the exercise:

| Thought record step | In the game |
|---|---|
| Write down the automatic thought | Capture the thought; a creature appears |
| Rate how strongly you believe it | Belief slider (0–100) before the encounter |
| Identify the cognitive distortion | Confirm the creature's species (one of 10 thinking patterns) |
| Challenge the thought with questions | Choose a "move" (a reframing question) and answer it in your own words |
| Write a balanced alternative thought | Taming: write the balanced thought |
| Re-rate your belief | Second belief slider; the change is shown in neutral language |

## Features

### Thought capture
- Free-text thought (up to 500 characters) and a belief rating from 0 to 100.
- Every piece of text you write is screened for crisis language before anything else happens (see [Safety](#safety)).

### Spotting the pattern
- A keyword classifier suggests the one or two most likely thinking patterns.
- You always confirm or change the suggestion yourself. Naming the pattern is part of the practice.
- Ten patterns, each with its own creature:

| Pattern | Creature | Example thought |
|---|---|---|
| Catastrophizing | Doomwyrm | "If I fail this, my life is over." |
| Mind Reading | Whisperer | "They definitely think I'm annoying." |
| Fortune Telling | Oracle Moth | "I just know it'll go badly." |
| All-or-Nothing Thinking | Splitter | "If it's not perfect, it's worthless." |
| Overgeneralization | Echo Slime | "I always mess everything up." |
| Should Statements | Shouldgeist | "I should be further along by now." |
| Labeling | Tagling | "I'm such an idiot." |
| Emotional Reasoning | Fogling | "I feel useless, so I must be." |
| Personalization | Mirror Imp | "The group failed because of me." |
| Mental Filter | Shadow Sieve | "The one bad comment is all that matters." |

### The encounter
- **A creature unique to your thought.** Its shape, colour, and eye count are generated from the thought's text, so the same thought always gives the same creature. Each species also has its own feature: horns, antennae, wings, a tag, and so on.
- **Resolve** starts at 100. Each answer lowers it, and the creature visibly softens: spiky and dark at first, then rounder and lighter, then calm.
- **Three moves per turn**, drawn from 48 CBT reframing questions (at least 4 specific to each pattern plus 7 general ones). The move you just used is never offered again straight away.
- **Effort, never correctness.** Any non-empty answer makes progress. Longer, more reflective answers make more, but no answer is ever marked wrong.
- **Softening dialogue.** Between turns the creature restates its thought more gently each time. It never intensifies what you wrote.
- **Retreat at any time** with no penalty. The encounter rests and can be resumed from Home.
- Gentle animations and optional sound effects.

### Taming
- Your earlier answers are shown as a reference while you write a balanced thought.
- A second belief rating, with the change shown in neutral language.
- The creature transforms into its calm form and joins your Bestiary.
- A break suggestion closes the session. The app never prompts you to start another one.

### Bestiary and Field Notes
- Every tamed creature, with its original thought, your answers, the balanced thought, and the belief change.
- **Field Notes**: short, descriptive observations, such as which patterns come up most, the average belief change, and which moves were part of the encounters with the biggest change. No charts over time, and no streaks or usage counts.

### Learn, Support, and Settings
- **Learn**: a plain-language explanation of each thinking pattern.
- **Support**: crisis lines and campus resources, with no game elements.
- **Settings**: turn sound on (off by default) and toggle reduced motion (which follows your system setting by default), export all your data as JSON, or delete everything.

## Design principles

| Principle | What it means in practice |
|---|---|
| Mechanic is method | Every game action is a step of cognitive restructuring. |
| Tame, don't kill | Creatures are calmed and befriended, never destroyed. |
| No fail state | No health bar, no timer, no wrong answers. |
| No pressure mechanics | No streaks, quotas, notifications, or "you missed a day" messages. |
| Bounded sessions | An encounter takes 3–5 minutes and ends with a break suggestion, not a prompt to play again. |
| Local and private | Everything stays in your browser. There are no accounts, no server, and no analytics. |

The writing follows the same principles. Questions are open and warm rather than interrogating. Creature lines frame the thought as a feeling ("It feels like…") instead of repeating it as fact. Calming messages never promise outcomes we can't know.

## Safety

- **Every free-text input is screened**: the thought, each answer, and the balanced thought. If crisis language is detected, the game stops immediately, nothing is saved, and the Support screen opens.
- **The screener favours false positives.** We would rather show support resources unnecessarily than miss someone who needs them. Common exam-stress hyperbole ("this exam is killing me", "I'll die if I fail") is deliberately not flagged, so ordinary worries can still be worked through. Phrases like "I can't do this anymore" are flagged.
- **The Support screen** lists the 9-8-8 Suicide Crisis Helpline (Canada, call or text), 911, and UVic counselling services. It contains no game elements or game language.
- A persistent notice on every other screen says this is a practice tool, not professional support.
- Automated tests check that no built-in content (questions, creature lines, break suggestions) would trip the screener.

## Why keyword rules, not machine learning

We evaluated an optional in-browser ML classifier: zero-shot NLI with `Xenova/distilbert-base-uncased-mnli` via Transformers.js, about 67 MB. We then **deliberately chose keyword rules**.

We wrote the model's ten hypotheses before seeing any results. We tested on two sets: the 30 sentences the keyword rules were tuned on, and 20 new held-out sentences that nothing was tuned on. "Top-2" means the correct pattern is among our two suggestions.

| Method | Tuned 30 (top-1 / top-2) | Held-out 20 (top-1 / top-2) | All 50 (top-2) |
|---|---|---|---|
| Keyword rules | 97% / 100% | 40% / 40% | 76% |
| ML only | 37% / 43% | 15% / 30% | 38% |
| Hybrid (0.6 ML + 0.4 keyword) | 70% / 97% | 45% / 55% | 80% |

- **The hybrid adds only 4 points top-2 across all 50 sentences, and lowers top-1 on the tuned set from 97% to 70%.** ML alone is barely above chance (random top-2 is 20%).
- **A 67 MB download isn't justified** by that gain: it's heavy on mobile data and unreliable on event wifi. Inference itself was fast, at about 40 ms per thought once loaded.
- **The real limitation is keyword coverage.** Keywords matched nothing for half of the held-out sentences. You confirm or change the pattern anyway, and choosing it is itself part of the CBT practice. So the classifier only needs to give a reasonable starting point, and when it has no match, the choice is yours.

## Accessibility

Built to WCAG 2.1 AA:
- Full keyboard operation and visible focus.
- AA colour contrast. Nothing is conveyed by colour alone.
- Every creature has a text description of its state, e.g. "Doomwyrm, bristling, resolve 80 of 100".
- Reduced motion turns off creature wobble and transitions.
- Page titles, and focus management on route changes.
- Layouts that reflow from 360 px wide to desktop.

## Tech stack

| Layer | Technology |
|---|---|
| Build | Vite, TypeScript |
| UI | React 18, React Router |
| State | Zustand |
| Styling | CSS Modules with theme tokens (CSS custom properties) |
| Animation | CSS transitions, Framer Motion |
| Creatures | Procedurally generated SVG, seeded with mulberry32 |
| Sound | Synthesized with the Web Audio API (no audio files) |
| Storage | `localStorage`, versioned schema, in-memory fallback |
| Tests | Vitest |
| Hosting | GitHub Pages via GitHub Actions |

The app runs entirely client-side, with no backend, no paid APIs, and no API keys. Code is split into three layers with one-way dependencies:

```
UI (React)  →  Core (pure TypeScript)  →  Content & Data
```

Core modules (safety, classifier, engine, scorer, creature generator, insights) contain no React or browser storage access. They are deterministic and fully unit-tested. See [`docs/requirements.md`](docs/requirements.md) and [`docs/architecture.md`](docs/architecture.md) for the full specification.

## Getting started

You'll need Node.js 20.19+ or 22.12+, and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm test         # run the unit tests
npm run build    # production build to dist/
```

Every push to `main` is tested, built, and deployed to GitHub Pages. Pull requests are tested and built too.

## Tests

504 unit tests across 10 files, run with `npm test`:

| File | Covers |
|---|---|
| `safety.test.ts` | Crisis phrases are flagged (including case, punctuation, and spacing variants); ordinary worries and hyperbole are not |
| `classifier.test.ts` | 3 example thoughts per pattern land in the top two; fallback; result shape; determinism |
| `content.test.ts` | Every pattern has complete content; at least 4 moves per pattern and 4 general moves; valid patterns and powers; no content trips the safety screener |
| `engine.test.ts` | Every phase transition; invalid actions and empty answers leave state unchanged; Resolve clamps at 0; the last-used move is never offered again straight away; retreat and resume keep progress; deterministic replay |
| `scorer.test.ts` | Empty answers score 0; scores stay within their bounds and caps; reflective markers match whole words |
| `storage.test.ts` | Save/load round-trips; corrupt or unknown-version data yields a fresh save without crashing |
| `creature.test.ts` | The same thought and pattern always give the same creature; every parameter stays in range |
| `creatureShape.test.ts` | Calm creatures are round; spikes shrink as Resolve falls; colours lighten; text labels; accessibility attributes |
| `insights.test.ts` | Field Notes counts, belief-change averages, and move comparisons; never invents missing data |
| `rng.test.ts` | Seeded PRNG and string hash |

## Project structure

```
src/
├── content/      distortions, moves, and creature lines (JSON) plus a typed loader
├── core/         safety, classifier, engine, scorer, creature, insights, rng, types
├── data/         storage (the only module that touches localStorage)
├── components/   Creature, ResolveBar, MoveCard, BeliefSlider, and other components
└── screens/      Home, Capture, Encounter, Tame, Bestiary, Learn, Support, Settings
tests/            unit tests
docs/             requirements and architecture
```

## Team

| Name | Role |
|---|---|
| Andrew | UI: every screen, routing, theme, components, animation, sound, accessibility, deployment |
| Keith | Game logic: data model, encounter engine, effort scorer, storage, insights, RNG |
| Khan | Content and creatures: CBT content, safety screener, classifier, creature generator and renderer, documentation |

## Credits and licences

- **No third-party art, icons, fonts, or audio are used.** Creatures are procedurally generated SVG, sound effects are synthesized in the browser with the Web Audio API, the favicon is original, and text uses the system font.
- **CBT content** (reframing questions, pattern descriptions, creature dialogue) was written by the team, based on standard cognitive restructuring techniques.
- **Open-source libraries:**
  - React, React DOM, React Router, Zustand, Framer Motion, Vite, Vitest (MIT)
  - TypeScript (Apache-2.0)
  - axe-core (MPL-2.0, development only)
- **Evaluation only, not shipped:** Transformers.js and the `Xenova/distilbert-base-uncased-mnli` model were used offline to evaluate the ML classifier. They are not part of the app.

## Licence

[MIT](LICENSE)
