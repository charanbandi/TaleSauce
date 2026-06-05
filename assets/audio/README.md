# Audio assets

Drop the following 8 files here (all CC0 — no attribution legally required, credited in
`/LICENSES.md` anyway). The app runs without them; sound simply stays silent until they're added.

## Ambient loops (from Kenney "Ambient Sounds" — https://kenney.nl/assets/ambient-sounds)

| File | Pick a sound that is… |
|------|----------------------|
| `ambient-farm.ogg`   | nature / birds / light breeze loop |
| `ambient-office.ogg` | indoor hum / AC / faint city loop  |

## SFX (from Kenney "Interface Sounds" — https://kenney.nl/assets/interface-sounds)

| File | Pick a sound that is… |
|------|----------------------|
| `sfx-task-start.ogg`         | short blip / notification |
| `sfx-question.ogg`           | gentle rising 2-note chime |
| `sfx-done.ogg`               | warm success ding |
| `sfx-error.ogg`              | low soft buzz |
| `sfx-permission.ogg`         | alert ping |
| `sfx-permission-resolve.ogg` | soft confirmation click |

`.ogg` is preferred. If you only have `.mp3`, rename the files to `.mp3` AND update the
`url` values in `packages/web/src/game/assets/manifest.ts` (the `AUDIO` array) to match.
