Temporary stand-ins for core modules that haven't landed yet. Each file mirrors the
signature of the real module in `docs/architecture.md` §5. As the real modules merge,
switch the imports in `src/store.ts` (and screens) to `src/core/*` / `src/data/*` and
delete the matching mock.

Still mocked:

| Mock | Real module | Owner |
|---|---|---|
| `engine.ts` | `core/engine.ts` (uses the real `core/scorer.ts`) | Keith |
| `insights.ts` | `core/insights.ts` | Keith |
| `classifier.ts` | `core/classifier/` | Khan |
| `distortions.ts`, `moves.ts`, `lines.ts` | `content/*.json` | Khan |
| `components/CreaturePlaceholder.tsx` | `components/Creature.tsx` | Khan |

Already real: `core/safety.ts`, `core/scorer.ts`, `data/storage.ts`.
