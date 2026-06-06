/**
 * Procedural office renderer — draws a dense, GBA-style pixel-art office to a 2D canvas.
 * Inspired by / adapted from the MIT-licensed "My Virtual Office" (myvirtualoffice.ai).
 * Everything is hand-drawn with fillRect so the scene is dense and cohesive (no tilesets).
 */

import { drawCharacter, makeAppearance, type Appearance } from "./characterArt.js";

let C: CanvasRenderingContext2D;

// ── colour helpers ──────────────────────────────────────────────────────────
function darken(hex: string, amt: number) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.floor(r * (1 - amt)); g = Math.floor(g * (1 - amt)); b = Math.floor(b * (1 - amt));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function lighten(hex: string, pct: number) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + Math.round((255 - r) * pct / 100));
  g = Math.min(255, g + Math.round((255 - g) * pct / 100));
  b = Math.min(255, b + Math.round((255 - b) * pct / 100));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
const fr = (x: number, y: number, w: number, h: number, c: string) => { C.fillStyle = c; C.fillRect(x, y, w, h); };

// ── animated "typing code" monitor ──────────────────────────────────────────
function codeScreen(x: number, y: number, w: number, h: number, seed: number, tick: number) {
  fr(x, y, w, h, "#06243f");
  C.save();
  C.beginPath(); C.rect(x, y, w, h); C.clip();
  const lineH = 4;
  const offset = Math.floor((tick / 12 + seed * 3) % lineH);
  for (let row = -lineH; row < h + lineH; row += lineH) {
    const ly = y + row - offset;
    const idx = Math.floor((row + seed * 11) / lineH);
    const len = 7 + ((idx * 7 + seed * 5) % Math.max(8, w - 10));
    C.fillStyle = idx % 4 === 0 ? "#a5f3fc" : idx % 3 === 0 ? "#66bb6a" : "#4fc3f7";
    C.fillRect(x + 3, ly + 1, Math.min(len, w - 6), 2);
    if (idx % 5 === 0) { C.fillStyle = "#ffca28"; C.fillRect(x + w - 7, ly + 1, 4, 2); }
  }
  C.restore();
}

// ── furniture (ported recipes) ──────────────────────────────────────────────
function desk(x: number, y: number, tint: string, tick: number, seed: number) {
  C.save(); C.translate(x, y);
  fr(-36, -20, 76, 54, "rgba(0,0,0,0.12)");
  fr(-35, -25, 70, 45, "#8d6e63"); fr(-33, -23, 66, 41, "#a1887f");
  fr(-35, 18, 70, 4, "#6d4c41");
  fr(-33, 20, 4, 6, "#5d4037"); fr(29, 20, 4, 6, "#5d4037");
  fr(-20, -48, 40, 26, "#263238");                 // monitor
  fr(-22, -50, 44, 30, "rgba(79,195,247,0.22)");   // glow
  codeScreen(-17, -45, 34, 20, seed, tick);
  fr(-5, -22, 10, 4, "#37474f");                   // stand
  fr(-15, -18, 30, 8, "#455a64");                  // keyboard
  C.fillStyle = "#546e7a";
  for (let i = 0; i < 5; i++) C.fillRect(-13 + i * 6, -16, 4, 2);
  for (let i = 0; i < 4; i++) C.fillRect(-10 + i * 6, -13, 4, 2);
  fr(20, -5, 6, 8, "#78909c"); fr(21, -4, 4, 3, "#90a4ae"); // mouse
  // chair (tinted to hint the seat's owner)
  fr(-9, 24, 18, 14, darken(tint, 0.45)); fr(-7, 25, 14, 11, tint);
  C.restore();
}

function chairTop(x: number, y: number, tint: string) {
  fr(x - 9, y, 18, 14, darken(tint, 0.45)); fr(x - 7, y + 1, 14, 11, tint);
}

function bookshelf(x: number, y: number) {
  fr(x, y + 76, 50, 15, "rgba(0,0,0,0.12)");
  fr(x, y, 50, 80, "#6d4c41"); fr(x + 2, y + 2, 46, 76, "#8d6e63"); fr(x + 4, y + 4, 42, 72, "#5d4037");
  const cols = ["#e57373", "#ef5350", "#64b5f6", "#42a5f5", "#fff176", "#ffee58", "#81c784", "#66bb6a", "#ce93d8", "#ff8a65", "#4dd0e1", "#a1887f"];
  for (let r = 0; r < 3; r++) {
    const sy = y + 6 + r * 24; let bx = x + 6;
    for (let i = 0; i < 6; i++) {
      const bw = 3 + (i % 3), bh = 14 + (i % 2) * 3;
      fr(bx, sy + (18 - bh), bw, bh, cols[(r * 6 + i) % cols.length]);
      fr(bx, sy + (18 - bh), 1, bh, "rgba(0,0,0,0.15)");
      fr(bx + 1, sy + (18 - bh) + 3, bw - 2, 1, "rgba(255,255,255,0.3)");
      bx += bw + 1;
    }
  }
}

function plant(x: number, y: number) {
  fr(x, y + 10, 16, 14, "#eceff1"); fr(x + 2, y + 12, 12, 10, "#fafafa");
  fr(x + 2, y + 10, 12, 4, "#4e342e");
  const arc = (cx: number, cy: number, r: number, c: string) => { C.fillStyle = c; C.beginPath(); C.arc(cx, cy, r, 0, Math.PI * 2); C.fill(); };
  arc(x + 8, y + 5, 9, "#2e7d32"); arc(x + 3, y + 1, 6, "#388e3c"); arc(x + 13, y + 1, 6, "#43a047"); arc(x + 8, y - 3, 5, "#4caf50");
  fr(x + 4, y - 2, 3, 3, "#66bb6a"); fr(x + 10, y + 2, 3, 3, "#66bb6a");
}

function tallPlant(x: number, y: number) {
  fr(x - 2, y + 28, 22, 4, "#a1887f"); fr(x, y + 30, 18, 18, "#d84315"); fr(x + 2, y + 32, 14, 14, "#e64a19");
  fr(x + 2, y + 30, 14, 4, "#4e342e");
  fr(x + 5, y + 2, 3, 32, "#2e7d32"); fr(x + 11, y - 6, 3, 40, "#2e7d32");
  C.fillStyle = "#43a047";
  fr(x + 1, y - 2, 6, 4, "#43a047"); fr(x + 3, y - 6, 4, 4, "#43a047"); fr(x + 8, y - 10, 6, 4, "#43a047"); fr(x + 12, y - 14, 4, 4, "#43a047");
  fr(x - 1, y + 4, 4, 6, "#66bb6a"); fr(x + 14, y - 4, 4, 6, "#66bb6a"); fr(x + 8, y + 6, 4, 4, "#66bb6a");
  fr(x + 2, y - 4, 2, 2, "#81c784"); fr(x + 10, y - 12, 2, 2, "#81c784");
}

function vending(x: number, y: number) {
  fr(x, y + 71, 45, 15, "rgba(0,0,0,0.12)");
  fr(x, y, 45, 75, "#b71c1c"); fr(x + 2, y + 2, 41, 71, "#c62828");
  fr(x + 5, y + 5, 28, 45, "#e3f2fd"); fr(x + 5, y + 5, 10, 45, "rgba(255,255,255,0.2)");
  const sn = ["#ffc107", "#ff5722", "#4caf50", "#795548", "#e91e63", "#2196f3"];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) { fr(x + 7 + c * 9, y + 7 + r * 11, 6, 8, sn[(r * 3 + c) % 6]); fr(x + 7 + c * 9, y + 7 + r * 11, 2, 2, "rgba(255,255,255,0.3)"); }
    fr(x + 5, y + 16 + r * 11, 28, 1, "#bdbdbd");
  }
  fr(x + 5, y + 55, 35, 15, "#1a1a1a"); fr(x + 35, y + 10, 6, 6, "#4caf50"); fr(x + 35, y + 20, 6, 6, "#f44336");
  fr(x + 8, y + 58, 28, 8, "#424242");
}

function waterCooler(x: number, y: number) {
  C.fillStyle = "rgba(0,0,0,0.1)"; C.beginPath(); C.ellipse(x, y + 42, 16, 5, 0, 0, Math.PI * 2); C.fill();
  fr(x - 10, y + 34, 4, 8, "#757575"); fr(x + 6, y + 34, 4, 8, "#757575");
  fr(x - 12, y, 24, 36, "#e0e0e0"); fr(x - 10, y + 2, 20, 32, "#eeeeee");
  fr(x - 8, y + 18, 16, 8, "#bdbdbd");
  fr(x - 7, y + 19, 6, 6, "#f44336"); fr(x + 1, y + 19, 6, 6, "#2196f3");
  fr(x - 10, y + 28, 20, 4, "#9e9e9e");
  fr(x - 9, y - 28, 18, 28, "rgba(3,169,244,0.6)");
  C.fillStyle = "rgba(3,169,244,0.5)"; C.beginPath(); C.arc(x, y - 28, 9, Math.PI, 0); C.fill();
  fr(x - 4, y - 34, 8, 6, "#0277bd"); fr(x - 3, y - 36, 6, 3, "#01579b");
  fr(x - 7, y - 24, 3, 20, "rgba(255,255,255,0.4)");
}

function kitchenCounter(x: number, y: number) {
  fr(x + 2, y + 32, 72, 8, "rgba(0,0,0,0.12)");
  fr(x, y, 72, 34, "#e0e0e0"); fr(x + 2, y + 2, 68, 30, "#f5f5f5"); fr(x, y, 72, 4, "#fafafa");
  fr(x + 4, y + 10, 28, 18, "#e0e0e0"); fr(x + 36, y + 10, 28, 18, "#e0e0e0");
  fr(x + 16, y + 17, 4, 3, "#bdbdbd"); fr(x + 48, y + 17, 4, 3, "#bdbdbd");
}
function coffeeMaker(x: number, y: number) {
  fr(x, y + 10, 24, 12, "#e0e0e0"); fr(x + 1, y + 11, 22, 10, "#f5f5f5");
  fr(x + 2, y, 20, 12, "#212121"); fr(x + 4, y + 2, 16, 8, "#333");
  fr(x + 15, y + 2, 4, 8, "rgba(3,169,244,0.5)");
  fr(x + 5, y + 3, 3, 2, "#4caf50"); fr(x + 5, y + 7, 3, 2, "#f44336");
  fr(x + 5, y + 18, 10, 3, "#424242"); fr(x + 7, y + 16, 5, 5, "#fff");
}
function microwave(x: number, y: number) {
  fr(x, y, 30, 24, "#455a64"); fr(x + 2, y + 2, 26, 20, "#37474f"); fr(x + 3, y + 3, 17, 17, "#263238");
  fr(x + 4, y + 4, 15, 15, "rgba(100,200,255,0.15)");
  fr(x + 21, y + 7, 2, 10, "#90a4ae"); fr(x + 24, y + 3, 4, 17, "#546e7a");
  fr(x + 25, y + 5, 2, 2, "#4caf50"); fr(x + 25, y + 9, 2, 2, "#f44336");
  fr(x + 4, y + 3, 8, 4, "#0a3010");
}

function coffeeTable(x: number, y: number) {
  fr(x, y, 64, 34, "#5d4037"); fr(x + 2, y + 2, 60, 30, "#8d6e63");
  fr(x + 2, y + 30, 4, 4, "#4e342e"); fr(x + 58, y + 30, 4, 4, "#4e342e");
  fr(x + 7, y + 6, 14, 18, "#e3f2fd"); fr(x + 9, y + 8, 10, 6, "#1976d2");
  fr(x + 32, y + 10, 12, 6, "#212121"); fr(x + 34, y + 11, 2, 2, "#f44336");
}

function tv(x: number, y: number) {
  fr(x, y, 50, 32, "#212121"); fr(x + 3, y + 3, 44, 26, "#263238");
  fr(x + 5, y + 5, 40, 22, "#1a1a2e"); fr(x + 5, y + 5, 40, 11, "rgba(255,255,255,0.03)");
  fr(x + 44, y + 28, 2, 2, "#f44336");
  fr(x + 18, y + 30, 14, 3, "#37474f"); fr(x + 12, y + 32, 26, 2, "#37474f");
}

function couch(x: number, y: number, base = "#3f51b5") {
  const cushion = lighten(base, 25), back = darken(base, 0.35), arm = darken(base, 0.2), sh = darken(base, 0.4);
  fr(x + 4, y + 4, 160, 40, "rgba(0,0,0,0.10)");
  fr(x, y, 160, 12, back);                    // backrest
  fr(x, y + 8, 14, 40, arm); fr(x + 146, y + 8, 14, 40, arm); // arms
  fr(x + 14, y + 12, 132, 34, base);
  fr(x + 16, y + 14, 128, 12, cushion);       // top cushion highlight
  for (let i = 0; i < 3; i++) fr(x + 18 + i * 43, y + 26, 40, 18, cushion); // seat cushions
  for (let i = 0; i < 3; i++) fr(x + 18 + i * 43, y + 42, 40, 3, sh);
  fr(x + 6, y + 46, 8, 4, "#2b2b2b"); fr(x + 146, y + 46, 8, 4, "#2b2b2b"); // feet
}

function pingPong(x: number, y: number) {
  // table
  fr(x - 40, y - 24, 80, 48, "#1b5e20"); fr(x - 38, y - 22, 76, 44, "#2e7d32");
  fr(x - 1, y - 22, 2, 44, "#fff");            // centre net line
  fr(x - 38, y, 76, 1, "#a5d6a7");
  fr(x - 40, y + 24, 6, 8, "#5d4037"); fr(x + 34, y + 24, 6, 8, "#5d4037"); // legs
  fr(x - 40, y - 24, 6, 8, "#5d4037"); fr(x + 34, y - 24, 6, 8, "#5d4037");
  // paddles + ball
  fr(x - 30, y - 4, 8, 6, "#c62828"); fr(x + 24, y - 2, 8, 6, "#1565c0");
  fr(x + 4, y - 10, 3, 3, "#fff");
}

function whiteboard(x: number, y: number) {
  fr(x, y, 28, 40, "#eceff1"); fr(x + 2, y + 2, 24, 36, "#fafafa");
  C.strokeStyle = "#1976d2"; C.lineWidth = 1; C.beginPath(); C.moveTo(x + 5, y + 8); C.lineTo(x + 20, y + 10); C.stroke();
  C.strokeStyle = "#d32f2f"; C.beginPath(); C.moveTo(x + 5, y + 16); C.lineTo(x + 18, y + 15); C.stroke();
  C.strokeStyle = "#388e3c"; C.beginPath(); C.moveTo(x + 5, y + 24); C.lineTo(x + 22, y + 23); C.stroke();
  fr(x + 4, y + 40, 20, 3, "#bdbdbd");
}

function filingCabinet(x: number, y: number) {
  fr(x + 2, y + 2, 28, 55, "rgba(0,0,0,0.1)");
  fr(x, y, 28, 55, "#607d8b"); fr(x + 1, y + 1, 26, 53, "#78909c");
  for (let i = 0; i < 3; i++) { fr(x + 3, y + 3 + i * 17, 22, 14, "#b0bec5"); fr(x + 10, y + 8 + i * 17, 8, 3, "#ffd700"); }
}

function windowPane(x: number, y: number) {
  fr(x - 4, y - 4, 52, 60, "#90a4ae");            // sill
  fr(x, y, 44, 52, "#cfe8ff");                    // glass (day sky)
  fr(x, y, 44, 18, "#add6ff");
  fr(x + 6, y + 24, 14, 20, "#bfe3a0"); fr(x + 26, y + 30, 12, 14, "#bfe3a0"); // distant rooftops/hills
  C.strokeStyle = "#b0bec5"; C.lineWidth = 2;
  C.beginPath(); C.moveTo(x + 22, y); C.lineTo(x + 22, y + 52); C.stroke();
  C.beginPath(); C.moveTo(x, y + 26); C.lineTo(x + 44, y + 26); C.stroke(); C.lineWidth = 1;
}

function clock(x: number, y: number) {
  C.fillStyle = "#546e7a"; C.beginPath(); C.arc(x, y, 13, 0, Math.PI * 2); C.fill();
  C.fillStyle = "#fff"; C.beginPath(); C.arc(x, y, 10, 0, Math.PI * 2); C.fill();
  const now = new Date();
  const ha = (now.getHours() % 12 + now.getMinutes() / 60) * (Math.PI * 2 / 12) - Math.PI / 2;
  const ma = (now.getMinutes() / 60) * Math.PI * 2 - Math.PI / 2;
  C.strokeStyle = "#333"; C.lineWidth = 2; C.beginPath(); C.moveTo(x, y); C.lineTo(x + Math.cos(ha) * 5, y + Math.sin(ha) * 5); C.stroke();
  C.lineWidth = 1; C.beginPath(); C.moveTo(x, y); C.lineTo(x + Math.cos(ma) * 8, y + Math.sin(ma) * 8); C.stroke();
}

function zoneLabel(x: number, y: number, text: string, color: string) {
  C.font = "bold 13px monospace"; C.textAlign = "center"; C.textBaseline = "middle";
  C.fillStyle = "rgba(0,0,0,0.35)"; C.fillRect(x - text.length * 5 - 8, y - 11, text.length * 10 + 16, 22);
  C.fillStyle = color; C.fillText(text, x, y);
  C.textAlign = "left"; C.textBaseline = "alphabetic";
}

// ── ambient colleague: walks to the coffee maker, brews, returns ─────────────
type NpcState = "toCoffee" | "brew" | "toHome" | "idle";
interface Npc { x: number; y: number; state: NpcState; timer: number; flip: boolean; }
let npc: Npc | null = null;
const NPC_PAL: Appearance = makeAppearance({ shirt: "#5e35b1", hairStyle: "short" });

function stepAndDrawNpc(W: number, H: number, coffee: { x: number; y: number }, tick: number) {
  const home = { x: W * 0.5, y: H * 0.46 };
  if (!npc) npc = { x: home.x, y: home.y, state: "idle", timer: 80, flip: false };
  const n = npc;
  let moving = false;
  if (n.timer > 0) {
    n.timer--;
  } else if (n.state === "toCoffee" || n.state === "toHome") {
    const tgt = n.state === "toCoffee" ? coffee : home;
    const dx = tgt.x - n.x, dy = tgt.y - n.y, d = Math.hypot(dx, dy);
    if (d < 3) { n.state = n.state === "toCoffee" ? "brew" : "idle"; n.timer = n.state === "brew" ? 50 : 90; }
    else { moving = true; n.flip = dx < 0; n.x += (dx / d) * 1.4; n.y += (dy / d) * 1.2; }
  } else if (n.state === "brew") {
    n.state = "toHome";
  } else { // idle
    n.state = "toCoffee";
  }

  const phase = moving ? (Math.floor(tick / 4) % 2 === 0 ? 1 : 2) : 0;
  const S = 1.4; // match the 1.4× agent sprites
  C.save(); C.translate(n.x, n.y); C.scale(n.flip ? -S : S, S);
  drawCharacter(C, 0, 0, NPC_PAL, phase);
  C.restore();
  if (n.state === "brew") { // steam
    C.fillStyle = "rgba(255,255,255,0.4)";
    C.fillRect(n.x + 6, n.y - 58 + Math.sin(tick * 0.2) * 2, 2, 4);
    C.fillRect(n.x + 11, n.y - 62 + Math.cos(tick * 0.2) * 2, 2, 4);
  }
}

// ── seat positions (desk centres) for agents, in office-canvas pixels ────────
export interface DeskSeat { x: number; y: number; }
export let OFFICE_DESKS: DeskSeat[] = [];
/** Coffee-break destination (in office-canvas/scene coords), set during render. */
export const OFFICE_COFFEE = { x: 0, y: 0 };

/**
 * Render the whole office to `ctx`, sized W×H. `tick` drives screen animation.
 * Returns/refreshes OFFICE_DESKS (seat centres) for agent placement.
 */
export function renderOffice(ctx: CanvasRenderingContext2D, W: number, H: number, tick: number) {
  C = ctx;
  C.imageSmoothingEnabled = false;
  C.clearRect(0, 0, W, H);

  // ── floor: subtle checkerboard ──
  const TILE = 24;
  for (let x = 0; x < W; x += TILE)
    for (let y = 0; y < H; y += TILE)
      fr(x, y, TILE, TILE, (Math.floor(x / TILE) + Math.floor(y / TILE)) % 2 === 0 ? "#cdd1d7" : "#c5c9d0");

  // ── top wall band with sections, windows, clock ──
  const wallH = 40;
  fr(0, 0, W, wallH, "#455a64");
  fr(0, 0, W * 0.40, wallH, "#37474f");
  fr(W * 0.40, 0, W * 0.32, wallH, "#3949ab");
  fr(W * 0.72, 0, W * 0.28, wallH, "#5d4037");
  fr(0, wallH - 5, W, 5, "#263238");
  windowPane(W * 0.08, 6); windowPane(W * 0.24, 6);
  windowPane(W * 0.80, 6); windowPane(W * 0.92, 6);
  clock(W * 0.56, wallH / 2);

  // ── zone labels ──
  zoneLabel(W * 0.20, wallH + 16, "DESKS", "#ffd54f");
  zoneLabel(W * 0.30, H * 0.62, "LOUNGE", "#80cbc4");
  zoneLabel(W * 0.50, H - 140, "KITCHEN", "#ffab91");

  // ── desk grid spread across the width, each with a tinted chair ──
  const deskTints = ["#ffd54f", "#4fc3f7", "#ff8a65", "#ba68c8", "#81c784", "#f06292", "#4dd0e1", "#fff176", "#a1887f"];
  OFFICE_DESKS = [];
  const cols = [W * 0.20, W * 0.42, W * 0.64];
  const deskRowY = [wallH + 75, wallH + 190, wallH + 305];
  let di = 0;
  for (const dy of deskRowY) {
    for (const dx of cols) {
      desk(dx, dy, deskTints[di % deskTints.length], tick, di + 1);
      OFFICE_DESKS.push({ x: dx, y: dy + 32 });
      di++;
    }
  }

  // ── far-left storage wall ──
  bookshelf(8, wallH + 64);
  filingCabinet(14, wallH + 168);

  // ── lounge (middle band, left-of-centre) ──
  const ly = H * 0.66;
  tv(W * 0.12, ly - 70);
  couch(W * 0.08, ly - 28);
  coffeeTable(W * 0.13, ly + 34);
  plant(W * 0.04, ly + 30);
  tallPlant(W * 0.34, ly - 30);

  // ── fun + meeting (middle band, right) ──
  pingPong(W * 0.72, H * 0.62);
  whiteboard(W * 0.86, H * 0.55);

  // ── kitchen (bottom strip) ──
  const ky = H - 100;
  kitchenCounter(W * 0.32, ky);
  coffeeMaker(W * 0.32 + 6, ky - 22);
  microwave(W * 0.32 + 38, ky - 24);
  vending(W * 0.32 + 92, ky - 40);
  waterCooler(W * 0.32 + 176, ky + 8);
  plant(W * 0.32 - 30, ky + 4);
  tallPlant(W - 36, H - 92);
  plant(W * 0.66, H - 60);

  // ── ambient colleague making coffee ──
  OFFICE_COFFEE.x = W * 0.32 + 40; OFFICE_COFFEE.y = ky + 4; // where real agents stand for a coffee break
  stepAndDrawNpc(W, H, { x: W * 0.32 + 16, y: ky + 6 }, tick);
}
