import Phaser from "phaser";
import { BaseScene } from "./BaseScene.js";
import { OFFICE_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";
import { renderOffice, OFFICE_DESKS, OFFICE_COFFEE } from "../officeArt.js";

const TEX_KEY = "office-bg";

export class OfficeScene extends BaseScene {
  private tick = 0;
  private bgCanvas?: HTMLCanvasElement;

  constructor() { super("office"); }

  create() {
    this.cameras.main.setBackgroundColor("#c9cdd3"); // floor tone, fills any gap

    const W = Math.max(640, Math.floor(this.scale.width));
    const H = Math.max(480, Math.floor(this.scale.height));

    // Offscreen canvas → Phaser CanvasTexture used as the office background.
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    this.bgCanvas = canvas;
    const ctx = canvas.getContext("2d")!;
    renderOffice(ctx, W, H, 0);

    if (this.textures.exists(TEX_KEY)) this.textures.remove(TEX_KEY);
    this.textures.addCanvas(TEX_KEY, canvas);
    this.add.image(0, 0, TEX_KEY).setOrigin(0, 0).setDepth(-100);

    // Re-render ~10fps so the monitor "code" animates.
    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (!this.bgCanvas) return;
        const c = this.bgCanvas.getContext("2d")!;
        renderOffice(c, this.bgCanvas.width, this.bgCanvas.height, ++this.tick);
        const tex = this.textures.get(TEX_KEY) as Phaser.Textures.CanvasTexture;
        tex.refresh();
      },
    });

    const sfx = this.createSoundSystem("office");
    // Seat agents at the desks (seat positions are in office-canvas = scene coords).
    this.spawnAgents("office", OFFICE_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx, [...OFFICE_DESKS], { deskWork: true, breakSpot: OFFICE_COFFEE });
  }
}
