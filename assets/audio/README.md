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

- `ambient-farm.m4a` — tropical jungle birds, by Iris/Helen/silvy (`placidplace` on Pixabay)
- `ambient-office.mp3` — office ambience, by `freesound_community` on Pixabay

To swap either, save a new file over it with the same name and reload. The manifest
(`packages/web/src/game/assets/manifest.ts`, the `AUDIO` array) points `ambient-farm` at `.m4a`
and `ambient-office` at `.mp3` — match the extension or update the URL there. The `SoundSystem`
checks each clip exists before playing, so a missing file never breaks anything.

> Note: `ambient-farm.m4a` was re-encoded to 64 kbps mono (~4.9 MB, down from ~19 MB) with the
> built-in `afconvert -f m4af -d aac -b 64000 -c 1 in.mp3 out.m4a` — quality is fine for a
> background loop. Re-encode lower if repo size matters more.
