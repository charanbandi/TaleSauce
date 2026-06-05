import Phaser from "phaser";
import { TILESETS, IMAGES, CHARACTERS, TILE_SIZE, AUDIO } from "../assets/manifest.js";
import { AgentSprite } from "../AgentSprite.js";
import { useStore } from "../../store/store.js";
import { workstationFor, type ActionSpot } from "../ActionSystem.js";
import type { Environment, AgentVisualState } from "@talesauce/shared";
import { SoundSystem, type SfxKey } from "../SoundSystem.js";

export interface TilemapLayerSpec {
  tilesetKey: string;
  /** Row-major 2D array of frame indices. Use -1 to skip a tile. */
  data: number[][];
  depth: number;
}

/** Create a 2D grid filled with `fill` (default -1 = empty). */
export function emptyGrid(rows: number, cols: number, fill = -1): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

/** Fill a rectangular region of `grid` with `frame`. Mutates in place. */
export function fillRect(grid: number[][], startRow: number, startCol: number, h: number, w: number, frame: number): void {
  for (let r = startRow; r < startRow + h && r < grid.length; r++)
    for (let c = startCol; c < startCol + w && c < grid[0].length; c++)
      grid[r][c] = frame;
}

/** Shared loading + tilemap helpers. */
export abstract class BaseScene extends Phaser.Scene {
  protected agents = new Map<string, AgentSprite>();
  private unsubscribe?: () => void;

  preload() {
    for (const t of TILESETS) this.load.spritesheet(t.key, t.url, { frameWidth: t.frameWidth, frameHeight: t.frameHeight });
    for (const i of IMAGES) this.load.image(i.key, i.url);
    for (const c of CHARACTERS) this.load.spritesheet(c.key, c.url, { frameWidth: c.frameWidth, frameHeight: c.frameHeight });
    for (const a of AUDIO) this.load.audio(a.key, a.url);
    this.load.on("loaderror", (file: any) => console.warn("asset failed:", file?.key));
  }

  /**
   * Stamp multiple tile layers onto the scene.
   * Each layer is a 2D array of spritesheet frame indices (-1 = skip).
   * Tiles are placed at (col * TILE_SIZE, row * TILE_SIZE) with origin (0,0).
   */
  protected buildTilemap(layers: TilemapLayerSpec[]): void {
    for (const layer of layers) {
      if (!this.textures.exists(layer.tilesetKey)) continue;
      layer.data.forEach((row, r) => {
        row.forEach((frame, c) => {
          if (frame < 0) return;
          this.add.image(c * TILE_SIZE, r * TILE_SIZE, layer.tilesetKey, frame)
            .setOrigin(0, 0)
            .setDepth(layer.depth);
        });
      });
    }
  }

  /** Place a single spritesheet frame at a tile coordinate (origin top-left). */
  protected placeSprite(key: string, frame: number, tileX: number, tileY: number, depth: number, scale = 1): void {
    if (!this.textures.exists(key)) return;
    this.add.image(tileX * TILE_SIZE, tileY * TILE_SIZE, key, frame)
      .setOrigin(0, 0)
      .setScale(scale)
      .setDepth(depth);
  }

  /**
   * Stamp a multi-tile object from a packed spritesheet.
   * `topLeftFrame` is the object's top-left tile; w×h are its tile dimensions.
   * Frames are taken row-major using the sheet's native column count.
   */
  protected placeObject(key: string, topLeftFrame: number, w: number, h: number, tileX: number, tileY: number, depth: number): void {
    if (!this.textures.exists(key)) return;
    const sheetCols = Math.round(this.textures.get(key).source[0].width / 16);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const frame = topLeftFrame + r * sheetCols + c;
        this.add.image((tileX + c) * TILE_SIZE, (tileY + r) * TILE_SIZE, key, frame)
          .setOrigin(0, 0).setDepth(depth);
      }
    }
  }

  /** Place a whole-image prop at a tile coordinate (origin bottom-center). */
  protected placeImage(key: string, tileX: number, tileY: number, scale = 1, depth = 0): void {
    if (!this.textures.exists(key)) return;
    this.add.image(tileX * TILE_SIZE, tileY * TILE_SIZE, key)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setDepth(depth);
  }

  /**
   * Place a looping animated water sprite over a tile area.
   * Creates "water-loop" animation from frames 0-3 of the "water" spritesheet.
   * Draws one animated sprite per tile in the rectangle.
   */
  protected waterAnim(tileX: number, tileY: number, w: number, h: number, depth: number): void {
    if (!this.textures.exists("water")) return;
    if (!this.anims.exists("water-loop")) {
      this.anims.create({
        key: "water-loop",
        frames: this.anims.generateFrameNumbers("water", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
    }
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        this.add.sprite((tileX + c) * TILE_SIZE, (tileY + r) * TILE_SIZE, "water", 0)
          .setOrigin(0, 0)
          .setDepth(depth)
          .play("water-loop");
      }
    }
  }

  /**
   * DEBUG ONLY — dumps all frames of a tileset on screen with index labels.
   * Call temporarily in create(), verify indices, then REMOVE before committing.
   * Usage: this.debugTileset("grass", 0, 0);
   */
  protected debugTileset(key: string, startRow = 0, endRow = 9999, scale = 1.5): void {
    if (!this.textures.exists(key)) return;
    const tex = this.textures.get(key);
    const sheetCols = Math.round(tex.source[0].width / 16);
    const frames = tex.getFrameNames().map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
    this.add.rectangle(0, 0, 4096, 4096, 0x101018).setOrigin(0, 0).setDepth(499);
    const cell = 16 * scale;
    frames.forEach((f) => {
      const col = f % sheetCols, row = Math.floor(f / sheetCols);
      if (row < startRow || row > endRow) return;
      const x = col * cell, y = (row - startRow) * cell;
      this.add.image(x, y, key, f).setOrigin(0, 0).setScale(scale).setDepth(500);
      // label only the top-left of each tile, small
      this.add.text(x, y, String(f), { fontSize: "6px", color: "#ffec3d" }).setDepth(501);
    });
  }

  protected registerAnimations(): void {
    const charDef = (key: string, start: number, end: number, rate = 6, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({ key, frames: this.anims.generateFrameNumbers("char", { start, end }), frameRate: rate, repeat });
    };
    const actDef = (key: string, start: number, end: number, rate = 6, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({ key, frames: this.anims.generateFrameNumbers("actions", { start, end }), frameRate: rate, repeat });
    };

    // From sprout_char.png (4×4 grid = 16 frames)
    charDef("idle",       0,  1, 2);
    charDef("walk-down",  0,  3, 6);
    charDef("work-loop",  0,  3, 9);
    charDef("wave",      12, 15, 5);
    charDef("talk",       8, 11, 4);

    // From sprout_actions.png (2×12 grid = 24 frames at 48×48).
    // FRAME INDEX DISCOVERY: Run the game, call this.debugTileset("actions", 0, 0) in
    // FarmScene.create(), and look at the overlay to identify which frame ranges correspond
    // to which actions. Then fill in the correct ranges below and remove the debug call.
    //
    // Expected layout (2 frames per row, 12 rows = 24 frames total):
    //   Row 0  → frames  0-1  (likely: farming/watering)
    //   Row 1  → frames  2-3  (likely: typing)
    //   Row 2  → frames  4-5  (likely: swim/wave)
    //   Row 3  → frames  6-7  (likely: sitting)
    //   Row 4  → frames  8-9  (likely: sleeping)
    //   Row 5  → frames 10-11 (likely: pointing/gesturing)
    //   Row 6  → frames 12-13 (likely: drinking)
    //
    // Update the ranges below after visual inspection:
    actDef("farm-work",  0,  1, 4);
    actDef("type-work",  2,  3, 8);
    actDef("swim-idle",  4,  5, 4);
    actDef("sit-idle",   6,  7, 3);
    actDef("sleep-idle", 8,  9, 2);
    actDef("point-idle", 10, 11, 4);
    actDef("drink-idle", 12, 13, 4);
  }

  protected createSoundSystem(env: "farm" | "office"): SoundSystem {
    const sys = new SoundSystem(this);
    sys.startAmbient(env);
    return sys;
  }

  protected spawnAgents(
    env: Environment,
    spots: ActionSpot[],
    frontPoint: { x: number; y: number },
    sfx?: SoundSystem,
  ): void {
    const stationTile = workstationFor(spots).tile;
    const workstation = { x: stationTile.x * TILE_SIZE, y: stationTile.y * TILE_SIZE };
    const prevStates = new Map<string, AgentVisualState>();
    const SFX_MAP: Partial<Record<AgentVisualState, SfxKey>> = {
      "working":             "task-start",
      "awaiting-user":       "question",
      "reporting":           "done",
      "error":               "error",
      "awaiting-permission": "permission",
    };
    const render = () => {
      const all = useStore.getState().agents;
      for (const rt of Object.values(all)) {
        if (rt.config.environment !== env) continue;
        const prev = prevStates.get(rt.config.id);
        if (prev !== rt.state) {
          prevStates.set(rt.config.id, rt.state);
          if (prev === "awaiting-permission" && rt.state === "working") {
            sfx?.play("permission-resolve");
          } else {
            const sfxKey = SFX_MAP[rt.state];
            if (sfxKey) sfx?.play(sfxKey);
          }
        }
        let s = this.agents.get(rt.config.id);
        if (!s) {
          s = new AgentSprite(this, { x: rt.config.pos.x, y: rt.config.pos.y, name: rt.config.name, id: rt.config.id });
          this.agents.set(rt.config.id, s);
        }
        s.applyState(rt.state, frontPoint, workstation);
      }
    };
    render();
    this.unsubscribe = useStore.subscribe(render);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unsubscribe?.());
  }
}
