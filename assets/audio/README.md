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

## Ambient loops — ⬇️ you add these (2 files)

Kenney no longer ships an ambient pack, so grab two looping background tracks from **Pixabay**
(free, no account needed to download, license allows commercial use with no attribution):

1. **Farm:** https://pixabay.com/sound-effects/search/nature%20ambience/ — pick a calm
   birds / countryside / morning loop. Save it here as **`ambient-farm.mp3`**.
2. **Office:** https://pixabay.com/sound-effects/search/office%20ambience/ — pick a quiet
   room-tone / office / keyboard-hum loop. Save it here as **`ambient-office.mp3`**.

Pixabay's download button gives `.mp3` — the manifest (`packages/web/src/game/assets/manifest.ts`,
the `AUDIO` array) already points the two ambient entries at `.mp3`, so just drop the files in with
those exact names and reload. Pick tracks that loop cleanly (most Pixabay "ambience" clips do).

The app runs fine without the ambient files — sound just stays quieter (SFX only) until you add them.
The `SoundSystem` checks each clip exists before playing, so missing ambient never breaks anything.

> Alternative CC0 source if you prefer: https://freesound.org (filter to "Creative Commons 0").
> Requires a free account; save the two loops with the same `ambient-farm.mp3` / `ambient-office.mp3`
> names (convert to mp3 if needed).
