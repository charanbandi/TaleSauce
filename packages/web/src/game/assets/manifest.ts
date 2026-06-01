/** Maps logical asset keys → file paths under /assets (served by Vite). */
export const TILE_SIZE = 16;

export interface SpriteSheetDef { key: string; url: string; frameWidth: number; frameHeight: number; }
export interface TilesetDef { key: string; url: string; }

export const TILESETS: TilesetDef[] = [
  { key: "town", url: "/assets/tiles/tilemap.png" },
];

export const CHARACTERS: SpriteSheetDef[] = [
  { key: "char", url: "/assets/characters/character.png", frameWidth: TILE_SIZE, frameHeight: TILE_SIZE * 2 },
];

/** Named animations expected on the character sheet (frame indices set in scene code). */
export const ANIMATIONS = ["idle", "walk-down", "walk-up", "walk-left", "walk-right", "work-loop", "wave", "talk"] as const;
