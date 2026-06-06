import Phaser from "phaser";
import { BaseScene } from "./BaseScene.js";
import { FARM_SPOTS } from "../ActionSystem.js";
import { TILE_SIZE } from "../assets/manifest.js";
import { renderFarm, FARM_SEATS, FARM_WELL } from "../farmArt.js";

const TEX_KEY = "farm-bg";

export class FarmScene extends BaseScene {
  private tick = 0;
  private bgCanvas?: HTMLCanvasElement;
  private bgCtx?: CanvasRenderingContext2D;
  private bgImage?: Phaser.GameObjects.Image;

  constructor() { super("farm"); }

  create() {
    this.cameras.main.setBackgroundColor("#7cc34e");
    this.buildBg();

    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (!this.bgCtx || !this.bgCanvas) return;
        renderFarm(this.bgCtx, this.bgCanvas.width, this.bgCanvas.height, ++this.tick);
        (this.textures.get(TEX_KEY) as Phaser.Textures.CanvasTexture).refresh();
      },
    });

    const sfx = this.createSoundSystem("farm");
    this.spawnAgents("farm", FARM_SPOTS, { x: this.scale.width / 2, y: this.scale.height - TILE_SIZE }, sfx, [...FARM_SEATS], { deskWork: false, breakSpot: FARM_WELL });

    this.scale.on("resize", () => { this.buildBg(); this.reseatAgents([...FARM_SEATS]); });
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
    renderFarm(this.bgCtx, W, H, this.tick);
    this.textures.addCanvas(TEX_KEY, canvas);
    this.bgImage = this.add.image(0, 0, TEX_KEY).setOrigin(0, 0).setDepth(-100);
  }
}
