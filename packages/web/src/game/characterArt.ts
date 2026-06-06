/**
 * Procedural GBA-style character renderer. Draws a little pixel person and bakes a
 * 3-frame (idle, walk-A, walk-B) spritesheet texture per agent so characters match
 * the hand-drawn office/farm world. Adapted in spirit from My Virtual Office (MIT).
 */
import type Phaser from "phaser";

export const CHAR_FW = 28;
export const CHAR_FH = 48;

export interface CharPalette { shirt: string; skin: string; hair: string; pants: string; }

const SKINS = ["#ffcc80", "#e8b88a", "#d4a574", "#c68642", "#8d5524", "#fddcb5"];
const HAIRS = ["#3e2723", "#5d4037", "#212121", "#8d6e63", "#bf8f3f", "#9e9e9e"];
const NAMED_SHIRTS: Record<string, string> = {
  Willow: "#43a047", Kai: "#2196f3", Rex: "#ef6c00", Cass: "#8e24aa",
};
const PRESET_SHIRTS = ["#26a69a", "#fbc02d", "#ec407a", "#5c6bc0", "#66bb6a", "#ff7043"];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return Math.abs(h); }

export function paletteFor(name: string, id: string): CharPalette {
  const h = hash(id || name);
  const shirt = NAMED_SHIRTS[name] ?? PRESET_SHIRTS[h % PRESET_SHIRTS.length];
  return { shirt, skin: SKINS[h % SKINS.length], hair: HAIRS[(h >> 3) % HAIRS.length], pants: "#37474f" };
}

const fr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
function darken(hex: string, amt: number) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.floor(r * (1 - amt)); g = Math.floor(g * (1 - amt)); b = Math.floor(b * (1 - amt));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** Draw one character with feet at (cx, feetY). phase: 0 idle, 1 walk-A, 2 walk-B. */
export function drawCharacter(c: CanvasRenderingContext2D, cx: number, feetY: number, p: CharPalette, phase: number) {
  c.save(); c.translate(cx, feetY);
  const swing = phase === 0 ? 0 : phase === 1 ? 3 : -3;
  const bob = phase === 0 ? 0 : 1;

  // shadow
  c.fillStyle = "rgba(0,0,0,0.18)"; c.beginPath(); c.ellipse(0, 1, 9, 3, 0, 0, Math.PI * 2); c.fill();

  // legs (one forward, one back when walking)
  fr(c, -6, -10 - bob, 5, 10 + swing, p.pants);
  fr(c, 1, -10 - bob, 5, 10 - swing, p.pants);
  fr(c, -6, -1 - bob + swing, 5, 2, "#263238");  // shoes
  fr(c, 1, -1 - bob - swing, 5, 2, "#263238");

  // body / shirt
  fr(c, -8, -22 - bob, 16, 13, p.shirt);
  fr(c, -8, -22 - bob, 16, 3, "#ffffff22");       // collar highlight
  fr(c, -8, -12 - bob, 16, 2, darken(p.shirt, 0.25));

  // arms (swing opposite legs)
  fr(c, -11, -21 - bob + swing, 3, 10, p.shirt);
  fr(c, 8, -21 - bob - swing, 3, 10, p.shirt);
  fr(c, -11, -12 - bob + swing, 3, 2, p.skin);     // hands
  fr(c, 8, -12 - bob - swing, 3, 2, p.skin);

  // head
  fr(c, -8, -36 - bob, 16, 15, p.skin);
  fr(c, -8, -23 - bob, 16, 2, darken(p.skin, 0.18)); // jaw shade

  // hair (short cap)
  fr(c, -9, -38 - bob, 18, 5, p.hair);
  fr(c, -9, -34 - bob, 3, 6, p.hair); fr(c, 6, -34 - bob, 3, 6, p.hair);
  fr(c, -4, -39 - bob, 5, 2, darken(p.hair, -0.0)); // (kept same tone, subtle)

  // eyes + mouth
  fr(c, -5, -31 - bob, 2, 3, "#263238"); fr(c, 3, -31 - bob, 2, 3, "#263238");
  fr(c, -5, -31 - bob, 1, 1, "#ffffff");  fr(c, 3, -31 - bob, 1, 1, "#ffffff");
  fr(c, -3, -26 - bob, 6, 1, darken(p.skin, 0.3)); // mouth

  c.restore();
}

/** Build (once) a 3-frame spritesheet texture for an agent and return its key. */
export function ensureCharTexture(scene: Phaser.Scene, key: string, p: CharPalette): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement("canvas");
  canvas.width = CHAR_FW * 3; canvas.height = CHAR_FH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for (let f = 0; f < 3; f++) drawCharacter(ctx, f * CHAR_FW + CHAR_FW / 2, CHAR_FH - 4, p, f);
  const tex = scene.textures.addCanvas(key, canvas)!;
  tex.add(0, 0, 0, 0, CHAR_FW, CHAR_FH);
  tex.add(1, 0, CHAR_FW, 0, CHAR_FW, CHAR_FH);
  tex.add(2, 0, CHAR_FW * 2, 0, CHAR_FW, CHAR_FH);
}
