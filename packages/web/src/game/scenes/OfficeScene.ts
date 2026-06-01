import { BaseScene } from "./BaseScene.js";
import { OFFICE_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

export class OfficeScene extends BaseScene {
  constructor() { super("office"); }
  create() {
    this.drawFallbackGround(0xaab1bd, 0xc8cdd6);
    this.cameras.main.setBackgroundColor("#aab1bd");
    this.registerAnimations();
    this.spawnAgents("office", OFFICE_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE });
  }
}
