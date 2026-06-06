import Phaser from "phaser";
import { TILE_SIZE, AUDIO } from "../assets/manifest.js";
import { AgentSprite } from "../AgentSprite.js";
import { useStore } from "../../store/store.js";
import { workstationFor, type ActionSpot } from "../ActionSystem.js";
import type { Environment, AgentVisualState } from "@talesauce/shared";
import { SoundSystem, type SfxKey } from "../SoundSystem.js";

/** Shared scene: audio loading, sound system, and agent spawning/state wiring.
 *  Scenes draw their world procedurally (see officeArt.ts / farmArt.ts). */
export abstract class BaseScene extends Phaser.Scene {
  protected agents = new Map<string, AgentSprite>();
  private unsubscribe?: () => void;

  preload() {
    for (const a of AUDIO) this.load.audio(a.key, a.url);
    this.load.on("loaderror", (file: any) => console.warn("asset failed:", file?.key));
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
    seats?: { x: number; y: number }[],
    opts?: { deskWork?: boolean; breakSpot?: { x: number; y: number } },
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
    const seatFor = new Map<string, { x: number; y: number }>();
    const render = () => {
      const all = useStore.getState().agents;
      let seatIdx = 0;
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
        // Assign each agent a stable seat (desk / work spot) so they stay put there.
        if (seats && seats.length && !seatFor.has(rt.config.id)) {
          seatFor.set(rt.config.id, seats[seatIdx % seats.length]);
        }
        seatIdx++;
        const home = seatFor.get(rt.config.id);
        let s = this.agents.get(rt.config.id);
        if (!s) {
          s = new AgentSprite(this, {
            x: rt.config.pos.x, y: rt.config.pos.y, name: rt.config.name, id: rt.config.id, homePx: home,
            deskWork: opts?.deskWork && !!home,
          });
          this.agents.set(rt.config.id, s);
        }
        s.applyState(rt.state, frontPoint, home ?? workstation);
      }
    };
    render();
    this.unsubscribe = useStore.subscribe(render);

    // Click anywhere near an agent (in this scene's canvas) to open its chat.
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      let bestId: string | null = null, bestD = Infinity;
      for (const [id, s] of this.agents) {
        const p = s.getPos();
        const d = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, p.x, p.y - 24);
        if (d < bestD) { bestD = d; bestId = id; }
      }
      if (bestId && bestD < 55) useStore.getState().select(bestId);
    });

    // Idle agents occasionally take a coffee/water break (walk to the spot and back).
    if (opts?.breakSpot) {
      this.time.addEvent({
        delay: 10000, loop: true, callback: () => {
          const all = useStore.getState().agents;
          const free = Object.values(all).filter((rt) => rt.config.environment === env && rt.state === "idle")
            .map((rt) => this.agents.get(rt.config.id)).filter((s): s is AgentSprite => !!s && !s.state.onErrand);
          if (free.length && Math.random() < 0.6) free[Math.floor(Math.random() * free.length)].goOnErrand(opts.breakSpot!, 1800);
        },
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unsubscribe?.());
  }
}
