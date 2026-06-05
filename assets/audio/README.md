# Audio assets

## SFX — ✅ already added (Kenney "Interface Sounds", CC0)

These 6 files are committed and working. Source pack:
https://kenney.nl/assets/interface-sounds

| File | Kenney source |
|------|---------------|
| `sfx-task-start.ogg`         | `select_001.ogg`       |
| `sfx-question.ogg`           | `question_001.ogg`     |
| `sfx-done.ogg`               | `confirmation_001.ogg` |
| `sfx-error.ogg`              | `error_001.ogg`        |
| `sfx-permission.ogg`         | `bong_001.ogg`         |
| `sfx-permission-resolve.ogg` | `click_001.ogg`        |

To swap any for a different taste, copy another file from the Kenney pack over it (keep the name).

## Ambient loops — ✅ already added (Pixabay, free for commercial use)

- `ambient-farm.mp3` — tropical jungle birds, by Iris/Helen/silvy (`placidplace` on Pixabay)
- `ambient-office.mp3` — office ambience, by `freesound_community` on Pixabay

To swap either, save a different `.mp3` over it with the same filename and reload. The manifest
(`packages/web/src/game/assets/manifest.ts`, the `AUDIO` array) points the two ambient entries at
`.mp3`. The `SoundSystem` checks each clip exists before playing, so a missing file never breaks anything.

> Note: `ambient-farm.mp3` is ~18 MB (256 kbps). If repo size matters, re-encode it lower
> (e.g. `ffmpeg -i ambient-farm.mp3 -b:a 96k -ac 1 out.mp3` → ~3 MB) — quality stays fine for a
> background loop.
