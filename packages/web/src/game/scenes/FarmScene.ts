import { BaseScene } from "./BaseScene.js";
import { FARM_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

const GRASS_SOLID = 12; // solid grass center tile in grass.png

export class FarmScene extends BaseScene {
  constructor() { super("farm"); }
  create() {
    this.paintGround("grass", GRASS_SOLID, "#5fa83c");
    this.registerAnimations();

    const px = (t: number) => t * TILE_SIZE;

    // Tilled-soil garden patch (the primary workstation) + crops on top.
    this.add.rectangle(px(4), px(10), px(5), px(3), 0x7a4f2a).setOrigin(0.5, 0.5).setDepth(-50).setStrokeStyle(2, 0x5c3a1e);
    this.placeImage("plants", 4, 11, 1, 1);

    // Pond (swim spot).
    this.add.ellipse(px(18), px(12), px(5), px(3.5), 0x4f9bd6).setDepth(-50).setStrokeStyle(2, 0x2f6fa0);
    this.add.ellipse(px(18), px(12), px(3.5), px(2.2), 0x6fb6e6).setDepth(-49);

    this.spawnAgents("farm", FARM_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE });
  }
}
