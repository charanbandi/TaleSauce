import Phaser from "phaser";
import { TILE_SIZE } from "./assets/manifest.js";
import { nextSpriteIntent, type SpriteIntent } from "./stateMachine.js";
import type { AgentVisualState } from "@talesauce/shared";

export interface AgentSpriteOpts { x: number; y: number; name: string; }

/** Renders one agent: a body sprite + name label + emote bubble; reacts to server state. */
export class AgentSprite {
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;
  private bubble: Phaser.GameObjects.Text;
  private tween?: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, opts: AgentSpriteOpts) {
    const px = opts.x * TILE_SIZE, py = opts.y * TILE_SIZE;
    this.sprite = scene.add.sprite(px, py, "char", 0).setOrigin(0.5, 1);
    this.label = scene.add.text(px, py - TILE_SIZE * 2 - 2, opts.name, { fontFamily: "monospace", fontSize: "8px", color: "#fff" }).setOrigin(0.5, 1);
    this.bubble = scene.add.text(px, py - TILE_SIZE * 2 - 12, "", { fontSize: "10px" }).setOrigin(0.5, 1);
  }

  /** Drive visuals from the server-authoritative state. */
  applyState(state: AgentVisualState, frontPoint: { x: number; y: number }, workstation: { x: number; y: number }) {
    const intent: SpriteIntent = nextSpriteIntent(state);
    this.bubble.setText(this.bubbleGlyph(intent.bubble));
    const target =
      intent.move === "front" ? frontPoint :
      intent.move === "workstation" ? workstation :
      { x: this.sprite.x + Phaser.Math.Between(-40, 40), y: this.sprite.y + Phaser.Math.Between(-24, 24) };
    this.moveTo(target.x, target.y);
  }

  private moveTo(x: number, y: number) {
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: [this.sprite, this.label, this.bubble], x, duration: 600, ease: "Sine.InOut",
      onUpdate: () => {
        this.label.y = this.sprite.y - TILE_SIZE * 2 - 2;
        this.bubble.y = this.sprite.y - TILE_SIZE * 2 - 12;
      },
    });
    this.scene.tweens.add({ targets: [this.sprite, this.label, this.bubble], y, duration: 600, ease: "Sine.InOut" });
  }

  private bubbleGlyph(b: SpriteIntent["bubble"]): string {
    return { none: "", thinking: "💭", question: "❓", result: "💬", alert: "❗" }[b];
  }
}
