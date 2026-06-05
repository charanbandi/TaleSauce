import { BaseScene, emptyGrid } from "./BaseScene.js";
import { FARM_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

const MAP_W = 24, MAP_H = 16;

// ── Verified frame indices (read from the source sheets) ─────────────────────
// grass.png is an 11-wide autotile; frame 12 = solid centre tile (seamless).
const G_SOLID = 12;
// plants.png (6×2) — mature crop sprites (end of each row = fully grown).
const CROP_A = 5, CROP_B = 11;
// grass_things.png (9×5) — row 0 = trees, row 1 = bushes.
const TREE_A = 0, TREE_B = 1, TREE_C = 2, BUSH = 9;
const PROP = 2; // prop scale, matches the 2× agents

export class FarmScene extends BaseScene {
  constructor() { super("farm"); }

  create() {
    this.cameras.main.setBackgroundColor("#6cbf4b");
    this.registerAnimations();

    // ── Ground: seamless solid grass across the whole viewport ───────────
    const cols = Math.max(MAP_W, Math.ceil(this.scale.width / TILE_SIZE) + 1);
    const rows = Math.max(MAP_H, Math.ceil(this.scale.height / TILE_SIZE) + 1);
    const ground = emptyGrid(rows, cols, G_SOLID);

    this.buildTilemap([
      { tilesetKey: "grass", data: ground, depth: -100 },
    ]);

    // ── Vegetable patch: a tidy grid of mature crops on the grass ────────
    for (let i = 0; i < 4; i++) {
      this.placeSprite("plants", CROP_A, 4 + i * 2, 9,  -55, PROP);
      this.placeSprite("plants", CROP_B, 5 + i * 2, 11, -55, PROP);
    }

    // ── House (whole-image prop), top-left ───────────────────────────────
    this.placeImage("house", 3, 4, 1, -40);

    // ── Trees framing the scene (sparse, tasteful, scaled to match agents) ─
    this.placeSprite("things", TREE_A, 0, 1, -38, PROP);
    this.placeSprite("things", TREE_B, 17, 1, -38, PROP);
    this.placeSprite("things", TREE_C, 20, 3, -38, PROP);
    this.placeSprite("things", TREE_A, 22, 9, -38, PROP);
    this.placeSprite("things", TREE_B, 1, 13, -38, PROP);

    // ── A few bushes for life ────────────────────────────────────────────
    this.placeSprite("things", BUSH, 12, 6, -38, PROP);
    this.placeSprite("things", BUSH, 15, 13, -38, PROP);
    this.placeSprite("things", BUSH, 10, 3, -38, PROP);

    // ── Small animated pond, lower-right ─────────────────────────────────
    this.waterAnim(16, 11, 4, 3, -58);

    const sfx = this.createSoundSystem("farm");
    this.spawnAgents("farm", FARM_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx);
  }
}
