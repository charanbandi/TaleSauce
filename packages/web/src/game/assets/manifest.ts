/** Maps logical asset keys → file paths under /assets (served by Vite publicDir). */
export const TILE_SIZE = 16;

export interface SpriteSheetDef { key: string; url: string; frameWidth: number; frameHeight: number; }
export interface TilesetDef { key: string; url: string; }

/**
 * Tilesets loaded as spritesheets (16×16 frames).
 * Used both for BaseScene.buildTilemap() layer data AND individual placeSprite() calls.
 * Keys used in scene code must match these keys exactly.
 */
export const TILESETS: SpriteSheetDef[] = [
  // Farm
  { key: "grass",     url: "/farm/grass.png",        frameWidth: 16, frameHeight: 16 },
  { key: "water",     url: "/farm/water.png",         frameWidth: 16, frameHeight: 16 },
  { key: "dirt",      url: "/farm/tilled_dirt.png",   frameWidth: 16, frameHeight: 16 },
  { key: "paths",     url: "/farm/paths.png",         frameWidth: 16, frameHeight: 16 },
  { key: "fences",    url: "/farm/fences.png",        frameWidth: 16, frameHeight: 16 },
  { key: "hills",     url: "/farm/hills.png",         frameWidth: 16, frameHeight: 16 },
  { key: "things",    url: "/farm/grass_things.png",  frameWidth: 16, frameHeight: 16 },
  { key: "furniture", url: "/farm/furniture.png",     frameWidth: 16, frameHeight: 16 },
  { key: "plants",    url: "/farm/plants.png",         frameWidth: 16, frameHeight: 16 },
  // Office
  { key: "city",      url: "/office/city_packed.png", frameWidth: 16, frameHeight: 16 },
];

/** Whole-image props placed directly (not sliced). */
export const IMAGES: TilesetDef[] = [
  { key: "house",  url: "/farm/wooden_house.png" },
];

/**
 * Character sprite sheets.
 * "char"    = Sprout Lands Basic Charakter (4×4 grid of 48×48 frames — 16 total).
 * "actions" = Sprout Lands Actions (2×12 grid of 48×48 frames — 24 total).
 */
export const CHARACTERS: SpriteSheetDef[] = [
  { key: "char",    url: "/characters/sprout_char.png",    frameWidth: 48, frameHeight: 48 },
  { key: "actions", url: "/characters/sprout_actions.png", frameWidth: 48, frameHeight: 48 },
];

/** Named animations expected on the character sheets. */
export const ANIMATIONS = [
  "idle", "walk-down", "work-loop", "wave", "talk",
  "farm-work", "type-work", "sit-idle", "sleep-idle", "drink-idle", "point-idle", "swim-idle",
] as const;

/** Audio assets: ambient loops and sound effects. */
export const AUDIO: { key: string; url: string; loop?: boolean }[] = [
  { key: "ambient-farm",           url: "/audio/ambient-farm.m4a",           loop: true },
  { key: "ambient-office",         url: "/audio/ambient-office.mp3",         loop: true },
  { key: "sfx-task-start",         url: "/audio/sfx-task-start.ogg"                     },
  { key: "sfx-question",           url: "/audio/sfx-question.ogg"                       },
  { key: "sfx-done",               url: "/audio/sfx-done.ogg"                           },
  { key: "sfx-error",              url: "/audio/sfx-error.ogg"                          },
  { key: "sfx-permission",         url: "/audio/sfx-permission.ogg"                     },
  { key: "sfx-permission-resolve", url: "/audio/sfx-permission-resolve.ogg"             },
];
