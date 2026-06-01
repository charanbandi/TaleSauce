import Phaser from "phaser";
import { TILESETS, CHARACTERS, TILE_SIZE } from "../assets/manifest.js";

/** Shared loading + a procedurally-built ground so a scene always renders even if a tile asset is missing. */
export abstract class BaseScene extends Phaser.Scene {
  preload() {
    for (const t of TILESETS) this.load.image(t.key, t.url);
    for (const c of CHARACTERS) this.load.spritesheet(c.key, c.url, { frameWidth: c.frameWidth, frameHeight: c.frameHeight });
    this.load.on("loaderror", (file: any) => console.warn("asset failed:", file?.key));
  }

  /** Fallback checkerboard ground so a missing tilemap never blanks the scene. */
  protected drawFallbackGround(colorA: number, colorB: number) {
    const g = this.add.graphics();
    const cols = Math.ceil(this.scale.width / TILE_SIZE);
    const rows = Math.ceil(this.scale.height / TILE_SIZE);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        g.fillStyle((x + y) % 2 ? colorA : colorB, 1);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    g.setDepth(-100);
  }
}
