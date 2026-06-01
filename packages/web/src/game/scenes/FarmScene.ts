import { BaseScene } from "./BaseScene.js";
import { FARM_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";

export class FarmScene extends BaseScene {
  constructor() { super("farm"); }
  create() {
    this.drawFallbackGround(0x7cc04f, 0x9bd66b);
    this.cameras.main.setBackgroundColor("#7cc04f");
    this.registerAnimations();
    this.spawnAgents("farm", FARM_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE });
  }
}
