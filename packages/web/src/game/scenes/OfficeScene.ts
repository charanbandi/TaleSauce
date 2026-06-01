import { BaseScene } from "./BaseScene.js";

export class OfficeScene extends BaseScene {
  constructor() { super("office"); }
  create() {
    this.drawFallbackGround(0xaab1bd, 0xc8cdd6); // office slate
    this.cameras.main.setBackgroundColor("#aab1bd");
  }
}
