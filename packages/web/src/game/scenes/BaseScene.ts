import Phaser from "phaser";
import { TILESETS, IMAGES, CHARACTERS, TILE_SIZE } from "../assets/manifest.js";
import { AgentSprite } from "../AgentSprite.js";
import { useStore } from "../../store/store.js";
import { workstationFor, type ActionSpot } from "../ActionSystem.js";
import type { Environment } from "@talesauce/shared";

/** Shared loading + tile painting helpers. */
export abstract class BaseScene extends Phaser.Scene {
  protected agents = new Map<string, AgentSprite>();
  private unsubscribe?: () => void;

  preload() {
    for (const t of TILESETS) this.load.spritesheet(t.key, t.url, { frameWidth: t.frameWidth, frameHeight: t.frameHeight });
    for (const i of IMAGES) this.load.image(i.key, i.url);
    for (const c of CHARACTERS) this.load.spritesheet(c.key, c.url, { frameWidth: c.frameWidth, frameHeight: c.frameHeight });
    this.load.on("loaderror", (file: any) => console.warn("asset failed:", file?.key));
  }

  /** Fill the scene with one tile (depth -100). Uses a large fixed coverage so it works
   *  regardless of the canvas size at create() time under Scale.RESIZE. */
  protected paintGround(key: string, frame = 0, bgColor = "#000000") {
    this.cameras.main.setBackgroundColor(bgColor);
    if (!this.textures.exists(key)) return;
    const COVER = 4096;
    this.add.tileSprite(0, 0, COVER, COVER, key, frame).setOrigin(0, 0).setDepth(-100);
  }

  /** Scatter a tile at random spots for ground texture (depth -90). */
  protected scatter(key: string, frame: number, count: number) {
    if (!this.textures.exists(key)) return;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      this.add.image(x, y, key, frame).setDepth(-90);
    }
  }

  /** Place a whole image prop at a tile coordinate (origin bottom-center), scaled. */
  protected placeImage(key: string, tileX: number, tileY: number, scale = 1, depth = 0) {
    if (!this.textures.exists(key)) return;
    this.add.image(tileX * TILE_SIZE, tileY * TILE_SIZE, key).setOrigin(0.5, 1).setScale(scale).setDepth(depth);
  }

  protected registerAnimations() {
    const def = (key: string, start: number, end: number, rate = 6, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({ key, frames: this.anims.generateFrameNumbers("char", { start, end }), frameRate: rate, repeat });
    };
    // Sprout Lands basic character sheet: 4×4 grid of front-facing bounce frames.
    // Row 0 (0–3) reads as an idle/walk bounce; we reuse it across states for Phase 1.
    def("idle", 0, 1, 2);
    def("walk-down", 0, 3, 6);
    def("work-loop", 0, 3, 9);
    def("wave", 12, 15, 5);
    def("talk", 8, 11, 4);
  }

  protected spawnAgents(env: Environment, spots: ActionSpot[], frontPoint: { x: number; y: number }) {
    const stationTile = workstationFor(spots).tile;
    const workstation = { x: stationTile.x * TILE_SIZE, y: stationTile.y * TILE_SIZE }; // tile → pixel
    const render = () => {
      const all = useStore.getState().agents;
      for (const rt of Object.values(all)) {
        if (rt.config.environment !== env) continue;
        let s = this.agents.get(rt.config.id);
        if (!s) { s = new AgentSprite(this, { x: rt.config.pos.x, y: rt.config.pos.y, name: rt.config.name }); this.agents.set(rt.config.id, s); }
        s.applyState(rt.state, frontPoint, workstation);
      }
    };
    render();
    this.unsubscribe = useStore.subscribe(render); // re-render agents whenever store state changes
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unsubscribe?.());
  }
}
