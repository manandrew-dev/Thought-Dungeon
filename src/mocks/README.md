Temporary stand-ins for core modules that haven't landed yet. Each file mirrors the
signature of the real module in `docs/architecture.md` §5. As the real modules merge,
switch the imports in `src/store.ts` (and screens) to `src/core/*` / `src/data/*` and
delete the matching mock.

Still mocked:

| Mock | Real module | Owner |
|---|---|---|
| `engine.ts` | `core/engine.ts` (already uses the real scorer, content, and creature generator) | Keith |
| `insights.ts` | `core/insights.ts` | Keith |

Already real: `core/safety.ts`, `core/scorer.ts`, `core/classifier/`, `core/creature.ts`,
`core/rng.ts`, `data/storage.ts`, `content/*.json`, `components/Creature.tsx`.
