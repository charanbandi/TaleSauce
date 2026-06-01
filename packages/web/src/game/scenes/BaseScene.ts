import Phaser from "phaser";
import { TILESETS, CHARACTERS, TILE_SIZE } from "../assets/manifest.js";
import { AgentSprite } from "../AgentSprite.js";
import { useStore } from "../../store/store.js";
import { workstationFor, type ActionSpot } from "../ActionSystem.js";
import type { Environment } from "@talesauce/shared";

/** Shared loading + a procedurally-built ground so a scene always renders even if a tile asset is missing. */
export abstract class BaseScene extends Phaser.Scene {
  protected agents = new Map<string, AgentSprite>();
  private unsubscribe?: () => void;

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

  protected registerAnimations() {
    const def = (key: string, start: number, end: number, rate = 6, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({ key, frames: this.anims.generateFrameNumbers("char", { start, end }), frameRate: rate, repeat });
    };
    // Frame indices match the placeholder sheet (0–3 walk, 4–7 work, 8–9 wave). Adjust when real art is dropped in.
    def("idle", 0, 0, 1);
    def("walk-down", 0, 3);
    def("work-loop", 4, 7);
    def("wave", 8, 9, 4);
    def("talk", 8, 9, 3);
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
    // clean up the subscription when the scene shuts down (prevents leaks on scene re-create)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unsubscribe?.());
  }
}
