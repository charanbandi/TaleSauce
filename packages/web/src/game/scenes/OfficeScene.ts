import { BaseScene } from "./BaseScene.js";
import { OFFICE_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

const FLOOR_TILE = 0; // floor tile in the Kenney modern-city sheet

export class OfficeScene extends BaseScene {
  constructor() { super("office"); }
  create() {
    this.paintGround("city", FLOOR_TILE, "#8b8f99");
    this.registerAnimations();

    const px = (t: number) => t * TILE_SIZE;
    // Desks with monitors at the work spots.
    const desk = (tx: number, ty: number) => {
      this.add.rectangle(px(tx), px(ty), px(2.2), px(1.2), 0x6b4a2f).setDepth(-40).setStrokeStyle(2, 0x4a3220);
      this.add.rectangle(px(tx), px(ty) - 6, px(1), px(0.8), 0x2b3a55).setDepth(-39).setStrokeStyle(1, 0x9bd6ff);
    };
    desk(6, 6);
    desk(10, 6);

    this.spawnAgents("office", OFFICE_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE });
  }
}
