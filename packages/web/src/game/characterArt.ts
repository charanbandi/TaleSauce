/**
 * Procedural GBA-style character renderer with variety (gender, hair styles,
 * clothing, glasses, skin/hair colours) + a blink animation. Bakes a 4-frame
 * spritesheet per agent (idle, walk-A, walk-B, blink).
 * Adapted in spirit from My Virtual Office (MIT).
 */
import type Phaser from "phaser";

export const CHAR_FW = 36;
export const CHAR_FH = 52;

export type Gender = "M" | "F";
export type HairStyle = "bald" | "buzz" | "short" | "medium" | "long" | "bun" | "ponytail" | "spiky" | "curly";
export type ShirtStyle = "plain" | "stripe" | "hoodie" | "dress";

export interface Appearance {
  gender: Gender;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  shirtStyle: ShirtStyle;
  pants: string;
  glasses: boolean;
}
// kept for callers that still pass a simple palette (e.g. ambient NPC)
export type CharPalette = Appearance;

const SKINS = ["#ffcc80", "#e8b88a", "#d4a574", "#c68642", "#8d5524", "#fddcb5", "#f1c27d"];
const HAIRS = ["#2b1d12", "#5d4037", "#1a1a1a", "#8d6e63", "#caa14b", "#9e9e9e", "#b5651d", "#d9c27a"];
const SHIRTS = ["#26a69a", "#fbc02d", "#ec407a", "#5c6bc0", "#66bb6a", "#ff7043", "#29b6f6", "#ab47bc", "#ef5350"];
const HAIR_STYLES: HairStyle[] = ["buzz", "short", "medium", "long", "bun", "ponytail", "spiky", "curly"];
const SHIRT_STYLES: ShirtStyle[] = ["plain", "plain", "stripe", "hoodie"];

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }

// fixed identities for the four starter agents, then deterministic variety for the rest
const NAMED: Record<string, Appearance> = {
  Willow: { gender: "F", skin: "#e8b88a", hair: "#5d4037", hairStyle: "long",     shirt: "#43a047", shirtStyle: "dress",  pants: "#37474f", glasses: false },
  Kai:    { gender: "M", skin: "#d4a574", hair: "#1a1a1a", hairStyle: "short",    shirt: "#2196f3", shirtStyle: "hoodie", pants: "#37474f", glasses: false },
  Rex:    { gender: "M", skin: "#c68642", hair: "#b5651d", hairStyle: "spiky",    shirt: "#ef6c00", shirtStyle: "plain",  pants: "#455a64", glasses: false },
  Cass:   { gender: "F", skin: "#ffcc80", hair: "#2b1d12", hairStyle: "bun",      shirt: "#8e24aa", shirtStyle: "stripe", pants: "#37474f", glasses: true  },
};

export function appearanceFor(name: string, id: string): Appearance {
  if (NAMED[name]) return NAMED[name];
  const h = hash(id || name);
  const gender: Gender = (h & 1) ? "M" : "F";
  return {
    gender,
    skin: SKINS[h % SKINS.length],
    hair: HAIRS[(h >> 3) % HAIRS.length],
    hairStyle: HAIR_STYLES[(h >> 6) % HAIR_STYLES.length],
    shirt: SHIRTS[(h >> 9) % SHIRTS.length],
    shirtStyle: gender === "F" && ((h >> 12) & 3) === 0 ? "dress" : SHIRT_STYLES[(h >> 12) % SHIRT_STYLES.length],
    pants: ["#37474f", "#455a64", "#3e4a5a", "#5d4037"][(h >> 15) % 4],
    glasses: ((h >> 17) & 3) === 0,
  };
}
// convenience for ambient NPCs
export function makeAppearance(p: Partial<Appearance>): Appearance {
  return { gender: "M", skin: "#e8b88a", hair: "#3e2723", hairStyle: "short", shirt: "#5e35b1", shirtStyle: "hoodie", pants: "#37474f", glasses: false, ...p };
}

const fr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
function darken(hex: string, amt: number) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.floor(r * (1 - amt)); g = Math.floor(g * (1 - amt)); b = Math.floor(b * (1 - amt));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function lighten(hex: string, amt: number) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + (255 - r) * amt); g = Math.min(255, g + (255 - g) * amt); b = Math.min(255, b + (255 - b) * amt);
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function drawHair(c: CanvasRenderingContext2D, style: HairStyle, color: string, headTop: number) {
  const hl = lighten(color, 0.25);
  c.fillStyle = color;
  const top = headTop; // y of head top (~-37)
  switch (style) {
    case "bald": break;
    case "buzz":
      fr(c, -11, top - 2, 22, 3, color); fr(c, -12, top, 3, 4, color); fr(c, 9, top, 3, 4, color); break;
    case "short":
      fr(c, -11, top - 3, 22, 5, color); fr(c, -12, top + 1, 3, 6, color); fr(c, 9, top + 1, 3, 6, color);
      fr(c, -5, top - 4, 4, 2, hl); break;
    case "medium":
      fr(c, -12, top - 3, 24, 4, color); fr(c, -12, top, 4, 9, color); fr(c, 8, top, 4, 9, color);
      fr(c, -5, top - 4, 5, 2, hl); break;
    case "long":
      fr(c, -12, top - 4, 24, 6, color); fr(c, -13, top, 4, 16, color); fr(c, 9, top, 4, 16, color);
      fr(c, -13, top, 3, 13, hl); break;
    case "bun":
      fr(c, -11, top - 2, 22, 4, color); fr(c, -12, top + 1, 3, 4, color); fr(c, 9, top + 1, 3, 4, color);
      fr(c, -4, top - 7, 9, 6, color); fr(c, -3, top - 8, 7, 2, hl); break;
    case "ponytail":
      fr(c, -11, top - 2, 22, 4, color); fr(c, -12, top + 1, 3, 6, color); fr(c, 9, top + 1, 3, 6, color);
      fr(c, 11, top + 1, 4, 18, color); fr(c, 12, top + 16, 3, 6, color); fr(c, 11, top + 1, 2, 12, hl); break;
    case "spiky":
      fr(c, -11, top - 1, 22, 4, color);
      for (let i = 0; i < 5; i++) { const sx = -10 + i * 5; c.fillStyle = color; c.beginPath(); c.moveTo(sx, top); c.lineTo(sx + 2, top - 6); c.lineTo(sx + 4, top); c.fill(); }
      break;
    case "curly":
      fr(c, -11, top - 2, 22, 5, color);
      c.fillStyle = color;
      for (const [bx, by] of [[-12, top], [12, top], [-9, top - 4], [-2, top - 5], [5, top - 5], [10, top - 3]] as [number, number][]) { c.beginPath(); c.arc(bx, by, 3, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = hl; c.beginPath(); c.arc(-2, top - 5, 1.5, 0, Math.PI * 2); c.fill(); break;
  }
}

type Expression = "happy" | "focused" | "curious" | "sad" | "blink";
const OUTLINE = "#2a2018";

function smile(c: CanvasRenderingContext2D, a: Appearance, my: number, expr: Expression) {
  c.lineWidth = 1;
  if (expr === "sad") { c.strokeStyle = "#8a4b3a"; c.beginPath(); c.arc(0, my + 3, 3, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); return; }
  if (expr === "curious") { c.fillStyle = "#7a3b2e"; c.beginPath(); c.arc(0, my, 1.6, 0, Math.PI * 2); c.fill(); return; }
  if (expr === "focused") { fr(c, -2, my, 4, 1, "#8a4b3a"); return; }
  c.strokeStyle = a.gender === "F" ? "#b15a63" : "#8a4b3a";
  c.beginPath(); c.arc(0, my - 2, 3, 0.18 * Math.PI, 0.82 * Math.PI); c.stroke();
}

function drawFace(c: CanvasRenderingContext2D, a: Appearance, expr: Expression, eyeY: number, skin: string) {
  if (expr === "blink") {
    fr(c, -6, eyeY + 1, 4, 1, darken(skin, 0.4)); fr(c, 2, eyeY + 1, 4, 1, darken(skin, 0.4));
    smile(c, a, -5, "happy"); return;
  }
  if (expr === "sad") {
    fr(c, -7, eyeY, 4, 4, "#fff"); fr(c, 3, eyeY, 4, 4, "#fff");
    fr(c, -6, eyeY + 1, 3, 3, "#263238"); fr(c, 3, eyeY + 1, 3, 3, "#263238");
    c.fillStyle = "#7ec8e3"; c.beginPath(); c.arc(9, eyeY - 2, 1.5, 0, Math.PI * 2); c.fill();
  } else if (expr === "curious") {
    fr(c, -8, eyeY - 2, 5, 5, "#fff"); fr(c, 3, eyeY - 2, 5, 5, "#fff");
    fr(c, -7, eyeY - 1, 3, 3, "#263238"); fr(c, 4, eyeY - 1, 3, 3, "#263238");
    fr(c, -7, eyeY - 1, 1, 1, "#fff"); fr(c, 4, eyeY - 1, 1, 1, "#fff");
  } else if (expr === "focused") {
    fr(c, -7, eyeY, 4, 3, "#fff"); fr(c, 3, eyeY, 4, 3, "#fff");
    fr(c, -6, eyeY + 1, 3, 2, "#263238"); fr(c, 4, eyeY + 1, 3, 2, "#263238");
  } else { // happy
    fr(c, -7, eyeY - 1, 4, 4, "#fff"); fr(c, 3, eyeY - 1, 4, 4, "#fff");
    fr(c, -6, eyeY, 3, 3, "#263238"); fr(c, 3, eyeY, 3, 3, "#263238");
    fr(c, -6, eyeY, 1, 1, "#fff"); fr(c, 3, eyeY, 1, 1, "#fff");
  }
  if (expr !== "sad") { c.fillStyle = "rgba(255,120,130,0.42)"; c.fillRect(-9, eyeY + 3, 3, 2); c.fillRect(6, eyeY + 3, 3, 2); }
  smile(c, a, -5, expr);
}

// Head drawn with its BOTTOM at local y=0 (extends up to y=-16; hair above that).
function drawHead(c: CanvasRenderingContext2D, a: Appearance, expr: Expression) {
  const skin = a.skin;
  fr(c, -12, -17, 24, 18, OUTLINE);              // outline silhouette
  fr(c, -11, -16, 22, 16, skin);                 // head
  fr(c, -11, -2, 22, 2, darken(skin, 0.16));     // chin shade
  drawHair(c, a.hairStyle, a.hair, -16);
  const eyeY = -10;
  drawFace(c, a, expr, eyeY, skin);
  if (a.glasses && expr !== "blink") {
    c.strokeStyle = "#263238"; c.lineWidth = 1;
    c.strokeRect(-7, eyeY - 1, 5, 5); c.strokeRect(2, eyeY - 1, 5, 5); fr(c, -2, eyeY + 1, 4, 1, "#263238");
  }
}

// Body drawn with feet at local y=0. Returns neckY (where the head bottom attaches).
function drawBody(c: CanvasRenderingContext2D, a: Appearance, frame: number): number {
  const walking = frame === 1 || frame === 2;
  const typing = frame === 4 || frame === 5;
  const swing = frame === 1 ? 3 : frame === 2 ? -3 : 0;
  const bob = walking ? 1 : 0;
  const typeLift = frame === 5 ? 2 : 0;
  const fem = a.gender === "F";
  const bodyW = fem ? 9 : 10;
  const legLen = 6, torsoTop = -16 - bob, torsoH = 11, hemY = torsoTop + torsoH;

  c.fillStyle = "rgba(0,0,0,0.18)"; c.beginPath(); c.ellipse(0, 1, 9, 3, 0, 0, Math.PI * 2); c.fill();

  if (a.shirtStyle === "dress") {
    fr(c, -5, -legLen + 1, 4, legLen - 1 + swing, a.skin); fr(c, 1, -legLen + 1, 4, legLen - 1 - swing, a.skin);
    fr(c, -5, -1 + swing, 4, 2, "#5d4037"); fr(c, 1, -1 - swing, 4, 2, "#5d4037");
  } else {
    fr(c, -7, -legLen - 1, 7, legLen + 1, OUTLINE); fr(c, 0, -legLen - 1, 7, legLen + 1, OUTLINE);
    fr(c, -6, -legLen, 5, legLen + swing, a.pants); fr(c, 1, -legLen, 5, legLen - swing, a.pants);
    fr(c, -6, -1 + swing, 5, 2, "#263238"); fr(c, 1, -1 - swing, 5, 2, "#263238");
  }

  if (!typing) {
    fr(c, -bodyW - 4, torsoTop - 1, 4, 11, OUTLINE); fr(c, bodyW, torsoTop - 1, 4, 11, OUTLINE);
    fr(c, -bodyW - 3, torsoTop + swing, 3, 10, a.shirt); fr(c, bodyW, torsoTop - swing, 3, 10, a.shirt);
  }

  if (a.shirtStyle === "dress") {
    c.fillStyle = OUTLINE; c.beginPath(); c.moveTo(-bodyW - 1, torsoTop - 1); c.lineTo(bodyW + 1, torsoTop - 1); c.lineTo(bodyW + 5, hemY + 1); c.lineTo(-bodyW - 5, hemY + 1); c.closePath(); c.fill();
    c.fillStyle = a.shirt; c.beginPath(); c.moveTo(-bodyW, torsoTop); c.lineTo(bodyW, torsoTop); c.lineTo(bodyW + 4, hemY); c.lineTo(-bodyW - 4, hemY); c.closePath(); c.fill();
    fr(c, -bodyW, torsoTop, bodyW * 2, 3, lighten(a.shirt, 0.25));
  } else {
    fr(c, -bodyW - 1, torsoTop - 1, bodyW * 2 + 2, torsoH + 2, OUTLINE);
    fr(c, -bodyW, torsoTop, bodyW * 2, torsoH, a.shirt);
    fr(c, -bodyW, torsoTop, bodyW * 2, 3, lighten(a.shirt, 0.22));
    fr(c, -bodyW, hemY - 2, bodyW * 2, 2, darken(a.shirt, 0.25));
    if (a.shirtStyle === "stripe") { for (let i = 0; i < 2; i++) fr(c, -bodyW, torsoTop + 3 + i * 4, bodyW * 2, 2, lighten(a.shirt, 0.4)); }
    if (a.shirtStyle === "hoodie") {
      fr(c, -5, torsoTop - 3, 10, 4, darken(a.shirt, 0.15));
      fr(c, -1, torsoTop + 2, 2, 7, darken(a.shirt, 0.3));
      fr(c, -6, hemY - 4, 12, 3, darken(a.shirt, 0.18));
    }
  }

  if (typing) {
    fr(c, -7, torsoTop + 2, 3, 8, a.shirt); fr(c, 4, torsoTop + 2, 3, 8, a.shirt);
    fr(c, -8, hemY - 2 - typeLift, 4, 3, a.skin); fr(c, 4, hemY - 2 - typeLift, 4, 3, a.skin);
  } else {
    fr(c, -bodyW - 3, torsoTop + 10 + swing, 3, 2, a.skin); fr(c, bodyW, torsoTop + 10 - swing, 3, 2, a.skin);
  }
  return torsoTop + 1;
}

/** Draw one character with feet at (cx, feetY). frame 0..7 per the table above. */
export function drawCharacter(c: CanvasRenderingContext2D, cx: number, feetY: number, a: Appearance, frame: number) {
  c.save(); c.translate(cx, feetY); c.imageSmoothingEnabled = false;
  const expr: Expression =
    frame === 4 || frame === 5 ? "focused" :
    frame === 6 ? "curious" :
    frame === 7 ? "sad" :
    frame === 3 ? "blink" : "happy";
  const neckY = drawBody(c, a, frame);
  c.save(); c.translate(0, neckY); c.scale(1.3, 1.3); drawHead(c, a, expr); c.restore();
  c.restore();
}

/** Frames: 0 idle, 1 walk-A, 2 walk-B, 3 blink, 4 type-down, 5 type-up, 6 curious, 7 sad. */
export const CHAR_FRAMES = 8;

/** Build (once) the spritesheet texture for an agent. */
export function ensureCharTexture(scene: Phaser.Scene, key: string, a: Appearance): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement("canvas");
  canvas.width = CHAR_FW * CHAR_FRAMES; canvas.height = CHAR_FH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for (let f = 0; f < CHAR_FRAMES; f++) drawCharacter(ctx, f * CHAR_FW + CHAR_FW / 2, CHAR_FH - 5, a, f);
  const tex = scene.textures.addCanvas(key, canvas)!;
  for (let f = 0; f < CHAR_FRAMES; f++) tex.add(f, 0, f * CHAR_FW, 0, CHAR_FW, CHAR_FH);
}
