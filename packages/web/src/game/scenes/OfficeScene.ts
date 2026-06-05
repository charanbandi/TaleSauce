import { BaseScene, emptyGrid, fillRect } from "./BaseScene.js";
import { OFFICE_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

const MAP_W = 24, MAP_H = 16;

// ── Frame indices for city_packed.png (37×28 = 1036 frames) ──────────────────
// Kenney Roguelike Modern City — adjust after visual inspection with debugTileset
const C_FLOOR      =   0; // primary floor tile
const C_FLOOR_ALT  =   1; // alternate floor (checkerboard)
const C_WALL       =  37; // wall tile (row 1)
const C_WALL_ALT   =  38; // alternate wall tile
const C_WALL_BASE  =  74; // baseboard / lower wall (row 2)
const C_WINDOW     = 111; // window frame (row 3)
const C_DESK       = 148; // desk top
const C_DESK_SIDE  = 149; // desk side/extension
const C_CHAIR      = 185; // office chair
const C_MONITOR    = 150; // computer monitor
const C_SOFA_L     = 222; // sofa left half
const C_SOFA_R     = 223; // sofa right half
const C_COUNTER    = 186; // counter/cabinet
const C_CARAFE     = 187; // coffee machine
const C_PLANT      = 259; // potted plant
const C_LAMP       = 260; // floor lamp
const C_WHITEBOARD = 112; // whiteboard section
const C_TABLE      = 224; // small side table

export class OfficeScene extends BaseScene {
  constructor() { super("office"); }

  create() {
    this.cameras.main.setBackgroundColor("#2a3140");
    this.registerAnimations();

    // ── Floor layer: checkerboard pattern, fills the whole viewport ───────
    const cols = Math.max(MAP_W, Math.ceil(this.scale.width / TILE_SIZE) + 1);
    const rows = Math.max(MAP_H, Math.ceil(this.scale.height / TILE_SIZE) + 1);
    const floor = emptyGrid(rows, cols, C_FLOOR);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if ((r + c) % 3 === 0) floor[r][c] = C_FLOOR_ALT;

    // ── Back wall (top 3 rows) ───────────────────────────────────────────
    const wall = emptyGrid(MAP_H, MAP_W, -1);
    for (let c = 0; c < MAP_W; c++) {
      wall[0][c] = C_WALL;
      wall[1][c] = C_WALL_ALT;
      wall[2][c] = C_WALL_BASE;
    }

    // ── Wall decorations (windows) ───────────────────────────────────────
    const deco = emptyGrid(MAP_H, MAP_W, -1);
    // 3 windows evenly spaced
    deco[1][4]  = C_WINDOW; deco[1][5]  = C_WINDOW;
    deco[1][12] = C_WINDOW; deco[1][13] = C_WINDOW;
    deco[1][20] = C_WINDOW; deco[1][21] = C_WINDOW;

    // ── Stamp layers ─────────────────────────────────────────────────────
    this.buildTilemap([
      { tilesetKey: "city", data: floor, depth: -100 },
      { tilesetKey: "city", data: wall,  depth: -85  },
      { tilesetKey: "city", data: deco,  depth: -80  },
    ]);

    // ── Props ────────────────────────────────────────────────────────────

    // Desk 1 (left workstation) — chair, desk surface, monitor
    this.placeSprite("city", C_CHAIR,   6,  7, -48);
    this.placeSprite("city", C_DESK,    6,  6, -46);
    this.placeSprite("city", C_DESK_SIDE, 7, 6, -46);
    this.placeSprite("city", C_MONITOR, 6,  5, -44);

    // Desk 2 (right workstation)
    this.placeSprite("city", C_CHAIR,     11, 7, -48);
    this.placeSprite("city", C_DESK,      11, 6, -46);
    this.placeSprite("city", C_DESK_SIDE, 12, 6, -46);
    this.placeSprite("city", C_MONITOR,   11, 5, -44);

    // Whiteboard on back wall (left area)
    this.placeSprite("city", C_WHITEBOARD, 2, 3, -79);
    this.placeSprite("city", C_WHITEBOARD, 3, 3, -79);

    // Coffee station (right side)
    this.placeSprite("city", C_COUNTER, 18, 4, -50);
    this.placeSprite("city", C_CARAFE,  19, 4, -50);

    // Couch (bottom-right) + small table
    this.placeSprite("city", C_SOFA_L, 20, 9, -50);
    this.placeSprite("city", C_SOFA_R, 21, 9, -50);
    this.placeSprite("city", C_TABLE,  19, 9, -50);

    // Potted plants (corners)
    this.placeSprite("city", C_PLANT, 1,  8, -48);
    this.placeSprite("city", C_PLANT, 22, 3, -48);

    // Floor lamp near couch
    this.placeSprite("city", C_LAMP, 22, 8, -48);

    // Spawn agents
    const sfx = this.createSoundSystem("office");
    this.spawnAgents("office", OFFICE_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx);
  }
}
