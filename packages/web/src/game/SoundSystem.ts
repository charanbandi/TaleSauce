import type Phaser from "phaser";
import { muteStore } from "./muteStore.js";

export type SfxKey =
  | "task-start"
  | "question"
  | "done"
  | "error"
  | "permission"
  | "permission-resolve";

const SFX_VOLUME = 0.6;
const AMBIENT_VOLUME = 0.35;
const FADE_IN_MS = 1000;
const FADE_OUT_MS = 500;

export class SoundSystem {
  private scene: Phaser.Scene;
  private ambient?: Phaser.Sound.BaseSound;
  private currentEnv?: "farm" | "office";
  private _muted: boolean;
  private playing = new Set<SfxKey>();
  private unsubscribeMute: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._muted = muteStore.muted;
    this.unsubscribeMute = muteStore.subscribe((muted) => {
      this._muted = muted;
      if (muted) {
        (this.ambient as any)?.pause?.();
      } else {
        (this.ambient as any)?.resume?.();
      }
    });
    // Detach from muteStore when the scene tears down, so destroyed
    // SoundSystems aren't retained in the global listener set.
    scene.events.once("shutdown", () => this.destroy());
    scene.events.once("destroy", () => this.destroy());
  }

  /** Unsubscribe from the mute store and stop ambient. Idempotent. */
  destroy(): void {
    this.unsubscribeMute();
    this.unsubscribeMute = () => {};
    this.stopAmbient();
  }

  get muted(): boolean { return this._muted; }

  startAmbient(env: "farm" | "office"): void {
    if (this.currentEnv === env) return;
    this.stopAmbient();
    this.currentEnv = env;
    if (this._muted) return;
    const key = env === "farm" ? "ambient-farm" : "ambient-office";
    if (!this.scene.cache.audio.exists(key)) return;
    this.ambient = this.scene.sound.add(key, { loop: true, volume: 0 });
    this.ambient.play();
    this.scene.tweens.add({ targets: this.ambient, volume: AMBIENT_VOLUME, duration: FADE_IN_MS });
  }

  stopAmbient(): void {
    if (!this.ambient) return;
    const target = this.ambient;
    this.scene.tweens.add({
      targets: target, volume: 0, duration: FADE_OUT_MS,
      onComplete: () => { target.stop(); target.destroy(); },
    });
    this.ambient = undefined;
    this.currentEnv = undefined;
  }

  play(key: SfxKey): void {
    if (this._muted) return;
    if (this.playing.has(key)) return;
    const audioKey = `sfx-${key}`;
    if (!this.scene.cache.audio.exists(audioKey)) return;
    this.playing.add(key);
    const sfx = this.scene.sound.add(audioKey, { volume: SFX_VOLUME });
    sfx.once("complete", () => {
      this.playing.delete(key);
      sfx.destroy();
    });
    sfx.play();
  }
}
