import Phaser from "phaser";
import { BaseScene } from "./BaseScene.js";
import { FARM_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";
import { renderFarm, FARM_SEATS } from "../farmArt.js";

const TEX_KEY = "farm-bg";

export class FarmScene extends BaseScene {
  private tick = 0;
  private bgCanvas?: HTMLCanvasElement;

  constructor() { super("farm"); }

  create() {
    this.cameras.main.setBackgroundColor("#7cc34e"); // grass tone, fills any gap

    const W = Math.max(640, Math.floor(this.scale.width));
    const H = Math.max(480, Math.floor(this.scale.height));

    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    this.bgCanvas = canvas;
    const ctx = canvas.getContext("2d")!;
    renderFarm(ctx, W, H, 0);

    if (this.textures.exists(TEX_KEY)) this.textures.remove(TEX_KEY);
    this.textures.addCanvas(TEX_KEY, canvas);
    this.add.image(0, 0, TEX_KEY).setOrigin(0, 0).setDepth(-100);

    // Re-render ~10fps so the pond shimmers and crops sway.
    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (!this.bgCanvas) return;
        const c = this.bgCanvas.getContext("2d")!;
        renderFarm(c, this.bgCanvas.width, this.bgCanvas.height, ++this.tick);
        (this.textures.get(TEX_KEY) as Phaser.Textures.CanvasTexture).refresh();
      },
    });

    const sfx = this.createSoundSystem("farm");
    this.spawnAgents("farm", FARM_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx, [...FARM_SEATS]);
  }
}
