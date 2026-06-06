import Phaser from "phaser";
import { TILE_SIZE } from "./assets/manifest.js";
import { nextSpriteIntent, type SpriteIntent } from "./stateMachine.js";
import type { AgentVisualState } from "@talesauce/shared";
import { ensureCharTexture, paletteFor, CHAR_FW, CHAR_FH } from "./characterArt.js";

export interface AgentSpriteOpts { x: number; y: number; name: string; id?: string; homePx?: { x: number; y: number }; }

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
  private walkKey: string;

  constructor(private scene: Phaser.Scene, opts: AgentSpriteOpts) {
    this.home = opts.homePx;
    const px = opts.homePx ? opts.homePx.x : opts.x * TILE_SIZE;
    const py = opts.homePx ? opts.homePx.y : opts.y * TILE_SIZE;

    const key = `char-${opts.id ?? opts.name}`;
    ensureCharTexture(scene, key, paletteFor(opts.name, opts.id ?? opts.name));
    this.walkKey = `${key}-walk`;
    if (!scene.anims.exists(this.walkKey)) {
      scene.anims.create({ key: this.walkKey, frames: [{ key, frame: 1 }, { key, frame: 2 }], frameRate: 6, repeat: -1 });
    }

    this.shadow = scene.add.ellipse(px, py + 1, 14, 5, 0x000000, 0.18);
    this.sprite = scene.add.sprite(px, py, key, 0).setOrigin(0.5, 0.92).setScale(SPRITE_SCALE);

    this.label = scene.add.text(px, this.labelY(), opts.name, {
      fontFamily: "monospace", fontSize: "9px", color: "#fff", stroke: "#241a14", strokeThickness: 3,
    }).setOrigin(0.5, 1);
    this.bubble = scene.add.text(px, this.bubbleY(), "", { fontSize: "14px" }).setOrigin(0.5, 1);

    this.updateDepths();
  }

  applyState(state: AgentVisualState, frontPoint: { x: number; y: number }, workstation: { x: number; y: number }) {
    const intent: SpriteIntent = nextSpriteIntent(state);
    this.bubble.setText(this.bubbleGlyph(intent.bubble));
    const deskOrStation = this.home ?? workstation;
    const wander = this.home
      ? { x: this.home.x + Phaser.Math.Between(-6, 6), y: this.home.y + Phaser.Math.Between(-4, 4) }
      : { x: this.sprite.x + Phaser.Math.Between(-40, 40), y: this.sprite.y + Phaser.Math.Between(-24, 24) };
    const target =
      intent.move === "front"       ? frontPoint :
      intent.move === "workstation" ? deskOrStation :
      wander;
    this.moveTo(target.x, target.y);
    this.updateDepths();
  }

  private updateDepths(): void {
    const d = this.sprite.y;
    this.shadow.setDepth(d - 2); this.sprite.setDepth(d); this.label.setDepth(d + 2); this.bubble.setDepth(d + 2);
  }

  private spriteH() { return CHAR_FH * SPRITE_SCALE; }
  private labelY() { return this.sprite.y - this.spriteH() * 0.92 - 2; }
  private bubbleY() { return this.sprite.y - this.spriteH() * 0.92 - 14; }

  private moveTo(x: number, y: number) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y);
    if (dist < 2) { this.sprite.anims.stop(); this.sprite.setFrame(0); return; }
    const duration = Math.min(900, Math.max(180, dist * 5));
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
      onComplete: () => { this.sprite.anims.stop(); this.sprite.setFrame(0); },
    });
  }

  private bubbleGlyph(b: SpriteIntent["bubble"]): string {
    return { none: "", thinking: "💭", question: "❓", result: "💬", alert: "❗", permission: "⚙️" }[b];
  }
}
