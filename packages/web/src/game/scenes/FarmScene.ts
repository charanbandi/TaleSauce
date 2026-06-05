import { BaseScene, emptyGrid, fillRect, type TilemapLayerSpec } from "./BaseScene.js";
import { FARM_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

const MAP_W = 24, MAP_H = 16;

// ── Tile frame indices (adjust after visual inspection with debugTileset) ────
// grass.png (11×7 = 77 frames)
const G_SOLID  = 0;  // plain grass center tile
const G_LIGHT  = 1;  // lighter grass variant
const G_DARK   = 11; // slightly darker grass
const G_FLOWER = 22; // grass with flower detail
const G_ROCK   = 33; // grass with small rock

// paths.png (4×4 = 16 frames)
const P_H = 0;  // horizontal path
const P_V = 1;  // vertical path

// dirt / tilled_dirt.png (11×7 = 77 frames)
const D_PLAIN = 0; // plain tilled soil

// fences.png (4×4 = 16 frames)
const F_H = 0, F_V = 4;
const F_TL = 5, F_TR = 6, F_BL = 9, F_BR = 10;

// hills.png (11×9 = 99 frames)
const H_TOP = 0;
const H_MID = 11; // second row

// things / grass_things.png (9×5 = 45 frames)
const T_TREE = 0;
const T_BUSH = 9;
const T_FLOWER_PROP = 18;

// furniture.png (9×6 = 54 frames)
const FN_MAILBOX = 0;

export class FarmScene extends BaseScene {
  constructor() { super("farm"); }

  create() {
    this.cameras.main.setBackgroundColor("#4a7a2e");
    this.registerAnimations();

    // ── Ground layer: grass fill with scattered variants ─────────────────
    const ground = emptyGrid(MAP_H, MAP_W, G_SOLID);
    // Scatter variants for visual richness
    const variants: [number, number, number][] = [
      [0, 5, G_LIGHT], [1, 18, G_DARK], [3, 9, G_LIGHT], [4, 20, G_FLOWER],
      [5, 3, G_ROCK],  [6, 14, G_DARK], [7, 7, G_LIGHT], [8, 20, G_ROCK],
      [9, 2, G_DARK],  [10, 17, G_LIGHT], [11, 11, G_FLOWER], [12, 4, G_DARK],
      [13, 19, G_LIGHT], [14, 8, G_ROCK], [2, 22, G_LIGHT], [15, 15, G_DARK],
    ];
    for (const [r, c, f] of variants) {
      if (r < MAP_H && c < MAP_W) ground[r][c] = f;
    }

    // ── Hills layer: top 2 rows ──────────────────────────────────────────
    const hills = emptyGrid(MAP_H, MAP_W, -1);
    for (let c = 0; c < MAP_W; c++) {
      hills[0][c] = H_TOP;
      hills[1][c] = H_MID;
    }

    // ── Paths: vertical from row 5-9 at col 5, horizontal at row 8 from col 5-15
    const paths = emptyGrid(MAP_H, MAP_W, -1);
    for (let r = 5; r <= 9; r++) paths[r][5] = P_V;
    for (let c = 5; c <= 15; c++) paths[8][c] = P_H;

    // ── Garden soil: 4×3 patch at col 5-8, rows 10-12 ───────────────────
    const dirt = emptyGrid(MAP_H, MAP_W, -1);
    fillRect(dirt, 10, 5, 3, 4, D_PLAIN);

    // ── Fences around garden (box: rows 9-13, cols 4-9) ──────────────────
    const fences = emptyGrid(MAP_H, MAP_W, -1);
    fences[9][4] = F_TL;  fences[9][9] = F_TR;
    fences[13][4] = F_BL; fences[13][9] = F_BR;
    for (let c = 5; c <= 8; c++) { fences[9][c] = F_H; fences[13][c] = F_H; }
    for (let r = 10; r <= 12; r++) { fences[r][4] = F_V; fences[r][9] = F_V; }

    // ── Stamp all layers ─────────────────────────────────────────────────
    this.buildTilemap([
      { tilesetKey: "grass",  data: ground, depth: -100 },
      { tilesetKey: "hills",  data: hills,  depth: -95  },
      { tilesetKey: "paths",  data: paths,  depth: -70  },
      { tilesetKey: "dirt",   data: dirt,   depth: -60  },
      { tilesetKey: "fences", data: fences, depth: -55  },
    ]);

    // ── Props ────────────────────────────────────────────────────────────

    // Wooden house (top-left)
    this.placeImage("house", 3, 5, 1, -50);

    // Crops on garden soil
    this.placeSprite("dirt", D_PLAIN, 5, 11, -58);
    this.placeSprite("dirt", D_PLAIN, 6, 11, -58);
    this.placeSprite("dirt", D_PLAIN, 7, 11, -58);

    // Trees (top-left + right clusters)
    this.placeSprite("things", T_TREE, 1, 2, -45);
    this.placeSprite("things", T_TREE, 2, 2, -45);
    this.placeSprite("things", T_TREE, 20, 2, -45);
    this.placeSprite("things", T_TREE, 21, 2, -45);

    // Bushes/flowers scattered
    this.placeSprite("things", T_BUSH, 12, 7, -80);
    this.placeSprite("things", T_BUSH, 16, 14, -80);
    this.placeSprite("things", T_FLOWER_PROP, 10, 3, -80);
    this.placeSprite("things", T_FLOWER_PROP, 22, 12, -80);

    // Mailbox near house
    this.placeSprite("furniture", FN_MAILBOX, 4, 6, -48);

    // Animated pond (4×3 tiles, bottom-right area)
    this.waterAnim(16, 10, 4, 3, -65);

    // Pond border — rock tiles surrounding the water
    for (let c = 15; c <= 20; c++) {
      this.placeSprite("grass", G_ROCK, c, 9, -66);
      this.placeSprite("grass", G_ROCK, c, 13, -66);
    }
    for (let r = 10; r <= 12; r++) {
      this.placeSprite("grass", G_ROCK, 15, r, -66);
      this.placeSprite("grass", G_ROCK, 20, r, -66);
    }

    // Spawn agents
    const sfx = this.createSoundSystem("farm");
    this.spawnAgents("farm", FARM_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx);
  }
}
