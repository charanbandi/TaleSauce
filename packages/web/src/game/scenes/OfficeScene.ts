import { BaseScene, emptyGrid } from "./BaseScene.js";
import { OFFICE_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

const MAP_W = 24, MAP_H = 16;

// LimeZu Modern Interiors (free). room_builder = 17-wide sheet; interiors = 16-wide sheet.
const FLOOR = 133;      // room_builder clean grey office-tile floor (seamless)
const SOFA = 724;       // interiors: 3×2 couch
const BOOKSHELF = 736;  // interiors: 2×3 bookshelf/cabinet
const PLANT_A = 848;    // interiors: 1×1 potted leafy plant
const PLANT_B = 849;    // interiors: 1×1 potted leafy plant (variant)
const LAMP = 816;       // interiors: 1×2 floor lamp

export class OfficeScene extends BaseScene {
  constructor() { super("office"); }

  create() {
    this.cameras.main.setBackgroundColor("#7a5a44");
    this.registerAnimations();

    const cols = Math.max(MAP_W, Math.ceil(this.scale.width / TILE_SIZE) + 1);
    const rows = Math.max(MAP_H, Math.ceil(this.scale.height / TILE_SIZE) + 1);
    const floor = emptyGrid(rows, cols, FLOOR);
    this.buildTilemap([{ tilesetKey: "room", data: floor, depth: -100 }]);

    // Bookshelves along the top "wall"
    this.placeObject("interiors", BOOKSHELF, 2, 3, 4,  0, -50);
    this.placeObject("interiors", BOOKSHELF, 2, 3, 9,  0, -50);
    this.placeObject("interiors", BOOKSHELF, 2, 3, 14, 0, -50);

    // A lounge sofa
    this.placeObject("interiors", SOFA, 3, 2, 17, 9, -50);

    // Floor lamp by the sofa
    this.placeObject("interiors", LAMP, 1, 2, 21, 9, -50);

    // Potted plants for warmth (corners + accents)
    this.placeObject("interiors", PLANT_A, 1, 1, 1,  4, -50);
    this.placeObject("interiors", PLANT_B, 1, 1, 22, 4, -50);
    this.placeObject("interiors", PLANT_A, 1, 1, 1,  12, -50);
    this.placeObject("interiors", PLANT_B, 1, 1, 16, 8, -50);
    this.placeObject("interiors", PLANT_A, 1, 1, 8,  6, -50);

    const sfx = this.createSoundSystem("office");
    this.spawnAgents("office", OFFICE_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx);
  }
}
