import Phaser from "phaser";
import { TILE_SIZE } from "./assets/manifest.js";
import { nextSpriteIntent, type SpriteIntent } from "./stateMachine.js";
import type { AgentVisualState } from "@talesauce/shared";
import { ensureCharTexture, appearanceFor, CHAR_FH } from "./characterArt.js";

export interface AgentSpriteOpts {
  x: number; y: number; name: string; id?: string;
  homePx?: { x: number; y: number };
  deskWork?: boolean;           // office desk agents type; others stand idle
}

const SPRITE_SCALE = 1.4;

/** Back-compat export: a representative tint colour for an agent (used by UI dots). */
const NAMED: Record<string, number> = { Willow: 0x43a047, Kai: 0x2196f3, Rex: 0xef6c00, Cass: 0x8e24aa };
const PRESET = [0x26a69a, 0xfbc02d, 0xec407a, 0x5c6bc0, 0x66bb6a, 0xff7043];
export function tintForAgent(name: string, id: string): number {
  if (name in NAMED) return NAMED[name];
  let h = 0; for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return PRESET[Math.abs(h) % PRESET.length];
}

/** Renders one agent: shadow + GBA character + name label + emote bubble; reacts to server state. */
export class AgentSprite {
  private shadow: Phaser.GameObjects.Ellipse;
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;
  private bubble: Phaser.GameObjects.Text;
  private tween?: Phaser.Tweens.Tween;
  private home?: { x: number; y: number };
  private deskWork: boolean;
  private onErrand = false;
  private walkKey: string;
  private idleKey: string;
  private deskKey: string;
  private curiousKey: string;
  private sadKey: string;
  private currentState: AgentVisualState = "idle";

  constructor(private scene: Phaser.Scene, opts: AgentSpriteOpts) {
    this.home = opts.homePx;
    this.deskWork = !!opts.deskWork && !!opts.homePx;
    const px = opts.homePx ? opts.homePx.x : opts.x * TILE_SIZE;
    const py = opts.homePx ? opts.homePx.y : opts.y * TILE_SIZE;

    const key = `char-${opts.id ?? opts.name}`;
    ensureCharTexture(scene, key, appearanceFor(opts.name, opts.id ?? opts.name));
    this.walkKey = `${key}-walk`; this.idleKey = `${key}-idle`; this.deskKey = `${key}-desk`;
    if (!scene.anims.exists(this.walkKey)) scene.anims.create({ key: this.walkKey, frames: [{ key, frame: 1 }, { key, frame: 2 }], frameRate: 6, repeat: -1 });
    if (!scene.anims.exists(this.idleKey)) scene.anims.create({ key: this.idleKey, frames: [0, 0, 0, 0, 0, 0, 0, 0, 3].map((frame) => ({ key, frame })), frameRate: 3, repeat: -1 });
    if (!scene.anims.exists(this.deskKey)) scene.anims.create({ key: this.deskKey, frames: [{ key, frame: 4 }, { key, frame: 5 }], frameRate: 5, repeat: -1 });
    this.curiousKey = `${key}-curious`; this.sadKey = `${key}-sad`;
    if (!scene.anims.exists(this.curiousKey)) scene.anims.create({ key: this.curiousKey, frames: [{ key, frame: 6 }], frameRate: 1, repeat: -1 });
    if (!scene.anims.exists(this.sadKey)) scene.anims.create({ key: this.sadKey, frames: [{ key, frame: 7 }], frameRate: 1, repeat: -1 });

    this.shadow = scene.add.ellipse(px, py + 1, 14, 5, 0x000000, 0.18);
    this.sprite = scene.add.sprite(px, py, key, 0).setOrigin(0.5, 0.9).setScale(SPRITE_SCALE);
    this.sprite.play(this.restKey());

    this.label = scene.add.text(px, this.labelY(), opts.name, {
      fontFamily: "monospace", fontSize: "9px", color: "#fff", stroke: "#241a14", strokeThickness: 3,
    }).setOrigin(0.5, 1);
    this.bubble = scene.add.text(px, this.bubbleY(), "", { fontSize: "14px" }).setOrigin(0.5, 1);

    this.updateDepths();

    // Occasional "look around" for desk workers (brief glance left/right).
    if (this.deskWork) {
      scene.time.addEvent({
        delay: 9000, loop: true, callback: () => {
          if (this.onErrand || this.tween?.isPlaying()) return;
          this.sprite.setFlipX(!this.sprite.flipX);
          scene.time.delayedCall(1400, () => { if (!this.onErrand) this.sprite.setFlipX(false); });
        },
      });
    }
  }

  applyState(state: AgentVisualState, frontPoint: { x: number; y: number }, workstation: { x: number; y: number }) {
    this.currentState = state;
    const intent: SpriteIntent = nextSpriteIntent(state);
    this.bubble.setText(this.bubbleGlyph(intent.bubble));
    if (this.onErrand) return; // an errand (e.g. coffee break) owns movement until it finishes
    const deskOrStation = this.home ?? workstation;
    const wander = this.home
      ? { x: this.home.x, y: this.home.y }
      : { x: this.sprite.x + Phaser.Math.Between(-40, 40), y: this.sprite.y + Phaser.Math.Between(-24, 24) };
    const target =
      intent.move === "front"       ? frontPoint :
      intent.move === "workstation" ? deskOrStation :
      wander;
    this.walkTo(target.x, target.y);
    this.updateDepths();
  }

  /** Send the agent on a round-trip errand (walk there, pause, walk home). */
  goOnErrand(point: { x: number; y: number }, pauseMs: number): void {
    if (this.onErrand || !this.home) return;
    this.onErrand = true;
    this.walkTo(point.x, point.y, () => {
      this.sprite.play(this.idleKey); // stand at the machine
      this.scene.time.delayedCall(pauseMs, () => {
        this.walkTo(this.home!.x, this.home!.y, () => { this.onErrand = false; });
      });
    });
  }

  get state(): { onErrand: boolean } { return { onErrand: this.onErrand }; }

  /** Current sprite position (scene px) — used for scene-level click selection. */
  getPos(): { x: number; y: number } { return { x: this.sprite.x, y: this.sprite.y }; }

  /** Re-home the agent (e.g. after the scene is resized) and walk it there. */
  setHome(point: { x: number; y: number }): void {
    this.home = point;
    if (!this.onErrand) this.walkTo(point.x, point.y);
  }

  private restKey() {
    const s = this.currentState;
    if (s === "error") return this.sadKey;
    if (s === "awaiting-user" || s === "awaiting-permission") return this.curiousKey;
    if ((s === "working" || s === "going-to-workstation") && this.deskWork) return this.deskKey;
    return this.idleKey;
  }

  private updateDepths(): void {
    const d = this.sprite.y;
    this.shadow.setDepth(d - 2); this.sprite.setDepth(d); this.label.setDepth(d + 2); this.bubble.setDepth(d + 2);
  }

  private spriteH() { return CHAR_FH * SPRITE_SCALE; }
  private labelY() { return this.sprite.y - this.spriteH() * 0.92 - 2; }
  private bubbleY() { return this.sprite.y - this.spriteH() * 0.92 - 14; }

  private walkTo(x: number, y: number, onArrive?: () => void) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y);
    if (dist < 2) { if (this.sprite.anims.currentAnim?.key !== this.restKey()) this.sprite.play(this.restKey()); onArrive?.(); return; }
    const duration = Math.min(2800, Math.max(220, dist * 9)); // ~0.11 px/ms — a natural walking pace
    this.sprite.setFlipX(x < this.sprite.x);
    this.sprite.play(this.walkKey, true);
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: this.sprite, x, y, duration, ease: "Sine.InOut",
      onUpdate: () => {
        this.shadow.setPosition(this.sprite.x, this.sprite.y + 1);
        this.label.setPosition(this.sprite.x, this.labelY());
        this.bubble.setPosition(this.sprite.x, this.bubbleY());
        this.updateDepths();
      },
      onComplete: () => { this.sprite.play(this.restKey()); onArrive?.(); },
    });
  }

  private bubbleGlyph(b: SpriteIntent["bubble"]): string {
    return { none: "", thinking: "💭", question: "❓", result: "💬", alert: "❗", permission: "⚙️" }[b];
  }
}
