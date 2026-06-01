/** Maps logical asset keys → file paths under /assets (served by Vite publicDir). */
export const TILE_SIZE = 16;

export interface SpriteSheetDef { key: string; url: string; frameWidth: number; frameHeight: number; }
export interface TilesetDef { key: string; url: string; }

/**
 * Tilesets loaded as 16×16 spritesheets so we can place individual tiles by index.
 * Vite publicDir is the repo-root `assets/` folder, so `assets/farm/grass.png` is
 * served at `/farm/grass.png`.
 */
export const TILESETS: SpriteSheetDef[] = [
  { key: "grass", url: "/farm/grass.png", frameWidth: 16, frameHeight: 16 },
  { key: "water", url: "/farm/water.png", frameWidth: 16, frameHeight: 16 },
  { key: "dirt", url: "/farm/tilled_dirt.png", frameWidth: 16, frameHeight: 16 },
  { key: "city", url: "/office/city_packed.png", frameWidth: 16, frameHeight: 16 },
];

/** Whole-image props placed directly (not sliced into tiles). */
export const IMAGES: TilesetDef[] = [
  { key: "house", url: "/farm/wooden_house.png" },
  { key: "plants", url: "/farm/plants.png" },
  { key: "furniture", url: "/farm/furniture.png" },
];

/**
 * Character sprite sheet. Sprout Lands "Basic Charakter Spritesheet" is a 4×4 grid
 * of 48×48 frames (front-facing idle/bounce poses).
 */
export const CHARACTERS: SpriteSheetDef[] = [
  { key: "char", url: "/characters/sprout_char.png", frameWidth: 48, frameHeight: 48 },
];

/** Named animations expected on the character sheet (frame indices set in scene code). */
export const ANIMATIONS = ["idle", "walk-down", "walk-up", "walk-left", "walk-right", "work-loop", "wave", "talk"] as const;
