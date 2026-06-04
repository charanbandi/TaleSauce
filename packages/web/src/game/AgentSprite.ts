import Phaser from "phaser";
import { TILE_SIZE } from "./assets/manifest.js";
import { nextSpriteIntent, type SpriteIntent } from "./stateMachine.js";
import type { AgentVisualState } from "@talesauce/shared";

export interface AgentSpriteOpts { x: number; y: number; name: string; id?: string; }

const SPRITE_SCALE = 2;

/** Renders one agent: a body sprite + name label + emote bubble; reacts to server state. */
export class AgentSprite {
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;
  private bubble: Phaser.GameObjects.Text;
  private tween?: Phaser.Tweens.Tween;
  private currentAnim = "";

  constructor(private scene: Phaser.Scene, opts: AgentSpriteOpts) {
    const px = opts.x * TILE_SIZE, py = opts.y * TILE_SIZE;
    this.sprite = scene.add.sprite(px, py, "char", 0).setOrigin(0.5, 0.9).setScale(SPRITE_SCALE);
    this.label = scene.add.text(px, this.labelY(), opts.name, {
      fontFamily: "monospace", fontSize: "9px", color: "#fff",
      stroke: "#241a14", strokeThickness: 3,
    }).setOrigin(0.5, 1);
    this.bubble = scene.add.text(px, this.bubbleY(), "", { fontSize: "14px" }).setOrigin(0.5, 1);
    if (scene.anims.exists("idle")) this.sprite.play("idle");
  }

  /** Drive visuals from the server-authoritative state. */
  applyState(state: AgentVisualState, frontPoint: { x: number; y: number }, workstation: { x: number; y: number }) {
    const intent: SpriteIntent = nextSpriteIntent(state);
    this.bubble.setText(this.bubbleGlyph(intent.bubble));
    if (intent.anim && intent.anim !== this.currentAnim && this.scene.anims.exists(intent.anim)) {
      this.currentAnim = intent.anim;
      this.sprite.play(intent.anim, true);
    }
    const target =
      intent.move === "front" ? frontPoint :
      intent.move === "workstation" ? workstation :
      { x: this.sprite.x + Phaser.Math.Between(-40, 40), y: this.sprite.y + Phaser.Math.Between(-24, 24) };
    this.moveTo(target.x, target.y);
  }

  private labelY() { return this.sprite.y - this.sprite.displayHeight * 0.9 - 2; }
  private bubbleY() { return this.sprite.y - this.sprite.displayHeight * 0.9 - 14; }

  private moveTo(x: number, y: number) {
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: this.sprite, x, y, duration: 700, ease: "Sine.InOut",
      onUpdate: () => {
        this.label.setPosition(this.sprite.x, this.labelY());
        this.bubble.setPosition(this.sprite.x, this.bubbleY());
      },
    });
  }

  private bubbleGlyph(b: SpriteIntent["bubble"]): string {
    return { none: "", thinking: "💭", question: "❓", result: "💬", alert: "❗", permission: "⚙️" }[b];
  }
}
