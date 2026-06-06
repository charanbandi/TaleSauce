# TaleSauce Assets

The farm and office worlds — and the characters — are drawn **procedurally in code**,
not from image tilesets. See:

- `packages/web/src/game/officeArt.ts` — the office (desks, kitchen, lounge, etc.)
- `packages/web/src/game/farmArt.ts` — the farm (grass, garden, pond, trees, chickens)
- `packages/web/src/game/characterArt.ts` — the agent/NPC pixel characters

So the only binary assets here are **audio**:

- `assets/audio/` — ambient loops + UI sound effects (see `assets/audio/README.md`
  for sources and how to swap them). Loaded via `packages/web/src/game/assets/manifest.ts`.

Audio credits are in the repo-root `LICENSES.md`.
