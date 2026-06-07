import Phaser from "phaser";
import { BaseScene } from "./BaseScene.js";
import { TILE_SIZE } from "../assets/manifest.js";
import { renderOffice, OFFICE_DESKS, OFFICE_COFFEE } from "../officeArt.js";

const TEX_KEY = "office-bg";

export class OfficeScene extends BaseScene {
  private tick = 0;
  private bgCanvas?: HTMLCanvasElement;
  private bgCtx?: CanvasRenderingContext2D;
  private bgImage?: Phaser.GameObjects.Image;

  constructor() { super("office"); }

  create() {
    this.cameras.main.setBackgroundColor("#c9cdd3");
    this.buildBg();

    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (!this.bgCtx || !this.bgCanvas) return;
        renderOffice(this.bgCtx, this.bgCanvas.width, this.bgCanvas.height, ++this.tick);
        (this.textures.get(TEX_KEY) as Phaser.Textures.CanvasTexture).refresh();
      },
    });

    const sfx = this.createSoundSystem("office");
    this.spawnAgents("office", { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx, [...OFFICE_DESKS], { deskWork: true, breakSpot: OFFICE_COFFEE });

    // Re-lay the office (and re-seat agents) when the pane is resized.
    this.scale.on("resize", () => { this.buildBg(); this.reseatAgents([...OFFICE_DESKS]); });
  }

  private buildBg() {
    const W = Math.max(640, Math.floor(this.scale.width));
    const H = Math.max(480, Math.floor(this.scale.height));
    this.bgImage?.destroy();
    if (this.textures.exists(TEX_KEY)) this.textures.remove(TEX_KEY);
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    this.bgCanvas = canvas;
    this.bgCtx = canvas.getContext("2d")!;
    renderOffice(this.bgCtx, W, H, this.tick);
    this.textures.addCanvas(TEX_KEY, canvas);
    this.bgImage = this.add.image(0, 0, TEX_KEY).setOrigin(0, 0).setDepth(-100);
  }
}
