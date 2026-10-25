Temporary stand-ins for core modules that haven't landed yet. Each file mirrors the
signature of the real module in `docs/architecture.md` §5. As the real modules merge,
switch the imports in `src/store.ts` (and screens) to `src/core/*` / `src/data/*` and
delete the matching mock.
