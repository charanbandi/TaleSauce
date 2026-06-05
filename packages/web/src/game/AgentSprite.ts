import Phaser from "phaser";
import { TILE_SIZE } from "./assets/manifest.js";
import { nextSpriteIntent, type SpriteIntent } from "./stateMachine.js";
import type { AgentVisualState } from "@talesauce/shared";

export interface AgentSpriteOpts { x: number; y: number; name: string; id?: string; homePx?: { x: number; y: number }; }

const SPRITE_SCALE = 2;

const NAMED_TINTS: Record<string, number> = {
  Willow: 0xffffff,
  Kai:    0x88aaff,
  Rex:    0xff9966,
  Cass:   0xcc88ff,
};
const PRESET_TINTS = [0x66ffaa, 0xffdd66, 0xff6688, 0x66ccff, 0xaaff88, 0xff88aa];

/** Deterministic tint for an agent by name + id. Exported for testing. */
export function tintForAgent(name: string, id: string): number {
  if (name in NAMED_TINTS) return NAMED_TINTS[name];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return PRESET_TINTS[Math.abs(h) % PRESET_TINTS.length];
}

/** Renders one agent: shadow + body sprite + name label + emote bubble; reacts to server state. */
export class AgentSprite {
  private shadow: Phaser.GameObjects.Ellipse;
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;
  private bubble: Phaser.GameObjects.Text;
  private tween?: Phaser.Tweens.Tween;
  private currentAnim = "";
  private home?: { x: number; y: number };

  constructor(private scene: Phaser.Scene, opts: AgentSpriteOpts) {
    this.home = opts.homePx;
    const px = opts.homePx ? opts.homePx.x : opts.x * TILE_SIZE;
    const py = opts.homePx ? opts.homePx.y : opts.y * TILE_SIZE;

    // Shadow ellipse just under the sprite's feet
    this.shadow = scene.add.ellipse(px, py + 2, 16, 5, 0x000000, 0.18);

    this.sprite = scene.add.sprite(px, py, "char", 0).setOrigin(0.5, 0.9).setScale(SPRITE_SCALE);

    const tint = tintForAgent(opts.name, opts.id ?? opts.name);
    if (tint !== 0xffffff) this.sprite.setTint(tint);

    this.label = scene.add.text(px, this.labelY(), opts.name, {
      fontFamily: "monospace", fontSize: "9px", color: "#fff",
      stroke: "#241a14", strokeThickness: 3,
    }).setOrigin(0.5, 1);

    this.bubble = scene.add.text(px, this.bubbleY(), "", { fontSize: "14px" }).setOrigin(0.5, 1);

    if (scene.anims.exists("idle")) {
      this.sprite.play("idle");
      // Phase offset — start each agent at a random frame so they don't all bounce in sync
      const anim = this.sprite.anims.currentAnim;
      if (anim && anim.frames.length > 1) {
        this.sprite.anims.setCurrentFrame(anim.frames[Math.floor(Math.random() * anim.frames.length)]);
      }
    }

    this.updateDepths();
  }

  applyState(state: AgentVisualState, frontPoint: { x: number; y: number }, workstation: { x: number; y: number }) {
    const intent: SpriteIntent = nextSpriteIntent(state);
    this.bubble.setText(this.bubbleGlyph(intent.bubble));
    if (intent.anim && intent.anim !== this.currentAnim && this.scene.anims.exists(intent.anim)) {
      this.currentAnim = intent.anim;
      this.sprite.play(intent.anim, true);
    }
    // Agents with a home desk sit there when idle/working and only leave to walk to the front.
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
    this.shadow.setDepth(d - 2);
    this.sprite.setDepth(d);
    this.label.setDepth(d + 2);
    this.bubble.setDepth(d + 2);
  }

  private labelY() { return this.sprite.y - this.sprite.displayHeight * 0.9 - 2; }
  private bubbleY() { return this.sprite.y - this.sprite.displayHeight * 0.9 - 14; }

  private moveTo(x: number, y: number) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y);
    const duration = Math.min(700, Math.max(150, dist * 4));
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: this.sprite, x, y, duration, ease: "Quad.InOut",
      onUpdate: () => {
        this.shadow.setPosition(this.sprite.x, this.sprite.y + 2);
        this.label.setPosition(this.sprite.x, this.labelY());
        this.bubble.setPosition(this.sprite.x, this.bubbleY());
        this.updateDepths();
      },
    });
  }

  private bubbleGlyph(b: SpriteIntent["bubble"]): string {
    return { none: "", thinking: "💭", question: "❓", result: "💬", alert: "❗", permission: "⚙️" }[b];
  }
}
