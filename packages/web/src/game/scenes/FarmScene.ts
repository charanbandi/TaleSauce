import { BaseScene } from "./BaseScene.js";

export class FarmScene extends BaseScene {
  constructor() { super("farm"); }
  create() {
    this.drawFallbackGround(0x7cc04f, 0x9bd66b); // grassy greens
    this.cameras.main.setBackgroundColor("#7cc04f");
    // Tilemap layering + ActionSpot props added in a later task.
  }
}
