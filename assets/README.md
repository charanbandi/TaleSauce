# TaleSauce Assets

The art in this folder is loaded by the Phaser scenes via
`packages/web/src/game/assets/manifest.ts`. Phase 1 ships with **generated
placeholder PNGs** so the app runs end-to-end. They are designed to be swapped
for real CC0 art with zero code changes — just replace the files at the exact
paths and frame sizes documented below.

## The asset contract (what the code expects)

`TILE_SIZE = 16` (px). Characters are 16×32 (one tile wide, two tiles tall).

| Logical key | File path | Format | Notes |
|---|---|---|---|
| `town` (tileset) | `assets/tiles/tilemap.png` | single image | Ground/decoration tiles. Currently used only as an image key; the farm/office scenes draw a procedural ground as a fallback, so this is optional for the app to run. |
| `char` (character sheet) | `assets/characters/character.png` | **horizontal sprite sheet**, frame size **16×32** | Required for agents to be visible. Frames are read left-to-right by index. |

### Character sheet frame order (indices)

The animation registration in `BaseScene.registerAnimations()` expects these
frame indices (adjust there if your real sheet differs):

| Frames | Animation |
|---|---|
| 0–3 | `walk-down` (frame 0 doubles as `idle`) |
| 4–7 | `work-loop` |
| 8–9 | `wave` / `talk` |

A real sheet with more directions (up/left/right walk cycles) is welcome — add
the rows and extend `registerAnimations()` to map them.

## How to drop in real CC0 art

You have internet; the sandbox does not. Download these (or similar) CC0 packs
and place the files at the paths above.

### Recommended packs (all CC0 1.0 — safe for a public repo)

1. **Kenney — “Tiny Town”** (farm/exterior tiles + simple characters)
   - https://kenney.nl/assets/tiny-town
2. **Kenney — “Tiny Dungeon” / “Roguelike Modern City”** (interior/office props)
   - https://kenney.nl/assets
3. **(Optional, higher-fidelity Stardew look) “Sprout Lands” by Cup Nooble**
   - https://cupnooble.itch.io/sprout-lands-asset-pack
   - ⚠️ Verify the pack’s license before committing — the free version is for
     personal/prototype use with credit; only commit it if its terms allow
     redistribution. Kenney CC0 is the zero-risk default for a public repo.

### Steps
1. Download and unzip a pack.
2. Find a character sprite sheet with 16×16 or 16×32 frames (or re-slice to
   16×32). Save it as `assets/characters/character.png`.
3. Find a ground/terrain tilesheet. Save it as `assets/tiles/tilemap.png`.
4. If your sheet’s frame layout differs from the table above, update the frame
   indices in `packages/web/src/game/scenes/BaseScene.ts`
   (`registerAnimations`) and the frame size in
   `packages/web/src/game/assets/manifest.ts`.
5. Add a row per asset to `LICENSES.md` with the source URL and license.

That’s it — no other code changes needed.
