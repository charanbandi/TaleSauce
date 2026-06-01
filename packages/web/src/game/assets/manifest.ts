/** Maps logical asset keys → file paths under /assets (served by Vite). */
export const TILE_SIZE = 16;

export interface SpriteSheetDef { key: string; url: string; frameWidth: number; frameHeight: number; }
export interface TilesetDef { key: string; url: string; }

// Vite publicDir is set to the repo-root `assets/` folder, so the files in
// assets/tiles/tilemap.png are served at URL /tiles/tilemap.png.
export const TILESETS: TilesetDef[] = [
  { key: "town", url: "/tiles/tilemap.png" },
];

export const CHARACTERS: SpriteSheetDef[] = [
  { key: "char", url: "/characters/character.png", frameWidth: TILE_SIZE, frameHeight: TILE_SIZE * 2 },
];

/** Named animations expected on the character sheet (frame indices set in scene code). */
export const ANIMATIONS = ["idle", "walk-down", "walk-up", "walk-left", "walk-right", "work-loop", "wave", "talk"] as const;
