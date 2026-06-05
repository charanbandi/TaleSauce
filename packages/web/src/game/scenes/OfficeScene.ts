import { BaseScene, emptyGrid } from "./BaseScene.js";
import { OFFICE_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

const MAP_W = 24, MAP_H = 16;

// ── Verified frame indices for city_packed.png (37-wide) ─────────────────────
const C_FLOOR = 120; // clean light-grey floor tile (seamless)
const C_RUG   = 164; // green rug/mat
const C_SOFA_A = 240; // teal couch
const C_SOFA_B = 250; // teal couch (variant)
const C_SOFA_G = 270; // green couch
const C_PLANT  = 293; // tall potted plant
const PROP = 2; // prop scale, matches the 2× agents

export class OfficeScene extends BaseScene {
  constructor() { super("office"); }

  create() {
    this.cameras.main.setBackgroundColor("#cfd3da");
    this.registerAnimations();

    // ── Floor: seamless light-grey across the whole viewport ─────────────
    const cols = Math.max(MAP_W, Math.ceil(this.scale.width / TILE_SIZE) + 1);
    const rows = Math.max(MAP_H, Math.ceil(this.scale.height / TILE_SIZE) + 1);
    const floor = emptyGrid(rows, cols, C_FLOOR);
    this.buildTilemap([{ tilesetKey: "city", data: floor, depth: -100 }]);

    // ── Central lounge: a rug with couches around it ─────────────────────
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++)
      this.placeSprite("city", C_RUG, 6 + c, 6 + r, -70, 1); // 4×2 rug area (unscaled tiles)
    this.placeSprite("city", C_SOFA_A, 6, 5, -50, PROP);  // top couch
    this.placeSprite("city", C_SOFA_B, 8, 5, -50, PROP);
    this.placeSprite("city", C_SOFA_G, 6, 8, -50, PROP);  // bottom couch
    this.placeSprite("city", C_SOFA_G, 8, 8, -50, PROP);

    // ── Plants in all four corners for warmth + symmetry ─────────────────
    this.placeSprite("city", C_PLANT, 1,  3,  -48, PROP);
    this.placeSprite("city", C_PLANT, 21, 3,  -48, PROP);
    this.placeSprite("city", C_PLANT, 1,  12, -48, PROP);
    this.placeSprite("city", C_PLANT, 21, 12, -48, PROP);

    const sfx = this.createSoundSystem("office");
    this.spawnAgents("office", OFFICE_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx);
  }
}
