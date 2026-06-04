import { BaseScene } from "./BaseScene.js";
import { OFFICE_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";


export class OfficeScene extends BaseScene {
  constructor() { super("office"); }
  create() {
    this.cameras.main.setBackgroundColor("#9aa0ac");
    this.registerAnimations();

    const px = (t: number) => t * TILE_SIZE;

    // Back wall strip with a baseboard, so the room reads as interior.
    this.add.rectangle(0, 0, 4096, px(2.5), 0x3a4254).setOrigin(0, 0).setDepth(-80);
    this.add.rectangle(0, px(2.5), 4096, px(0.4), 0x2a3140).setOrigin(0, 0).setDepth(-79);

    // Desks with monitors (the primary workstations) + a chair.
    const desk = (tx: number, ty: number) => {
      this.add.rectangle(px(tx), px(ty) + 8, px(1), px(0.6), 0x394150).setDepth(-46); // chair back
      this.add.rectangle(px(tx), px(ty), px(2.4), px(1.2), 0x7a5638).setDepth(-44).setStrokeStyle(2, 0x533a24); // desk
      this.add.rectangle(px(tx) - 8, px(ty) - 7, px(1.1), px(0.85), 0x1f2a3d).setDepth(-43).setStrokeStyle(2, 0x6fd0ff); // monitor
      this.add.rectangle(px(tx) + 10, px(ty) - 2, px(0.5), px(0.4), 0x2b2b2b).setDepth(-43); // mini tower/keyboard
    };
    desk(6, 6);
    desk(10, 6);

    // Whiteboard.
    this.add.rectangle(px(3), px(3), px(2.4), px(1.5), 0xf3f4f6).setDepth(-50).setStrokeStyle(3, 0x9aa0ac);
    this.add.rectangle(px(2.6), px(2.8), px(1.2), px(0.12), 0x3b82f6).setDepth(-49);
    this.add.rectangle(px(2.8), px(3.1), px(0.8), px(0.12), 0xef4444).setDepth(-49);

    // Coffee station.
    this.add.rectangle(px(12), px(4), px(1.2), px(0.9), 0x4b5563).setDepth(-50);
    this.add.rectangle(px(12), px(3.7), px(0.4), px(0.4), 0x111827).setDepth(-49); // carafe
    this.add.circle(px(12.4), px(4.1), 2, 0xfca5a5).setDepth(-49); // on light

    // Couch (chill spot).
    this.add.rectangle(px(14), px(9), px(2.6), px(1.1), 0x3f6f5f).setDepth(-50).setStrokeStyle(2, 0x2c4f43);
    this.add.rectangle(px(14), px(8.7), px(2.6), px(0.4), 0x4d8473).setDepth(-49); // backrest

    // A potted plant for life.
    this.add.rectangle(px(18), px(3), px(0.5), px(0.5), 0x8b5a2b).setDepth(-50);
    this.add.circle(px(18.25), px(2.7), 7, 0x4b8b5a).setDepth(-49);

    this.spawnAgents("office", OFFICE_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE });
  }
}
