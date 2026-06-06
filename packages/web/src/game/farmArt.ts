/**
 * Procedural farm renderer — draws a cozy, dense top-down pixel farm to a 2D canvas,
 * in the same hand-drawn style as officeArt.ts (no tilesets).
 */

let C: CanvasRenderingContext2D;
const fr = (x: number, y: number, w: number, h: number, c: string) => { C.fillStyle = c; C.fillRect(x, y, w, h); };
const arc = (x: number, y: number, r: number, c: string) => { C.fillStyle = c; C.beginPath(); C.arc(x, y, r, 0, Math.PI * 2); C.fill(); };
function darken(hex: string, amt: number) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.floor(r * (1 - amt)); g = Math.floor(g * (1 - amt)); b = Math.floor(b * (1 - amt));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
// deterministic PRNG so the scattered detail is stable frame-to-frame
function makeRand(seed: number) { return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }

// ── ground ──────────────────────────────────────────────────────────────────
function grassBackground(W: number, H: number) {
  fr(0, 0, W, H, "#7cc34e");
  const rnd = makeRand(99);
  // soft darker/lighter grass patches
  for (let i = 0; i < (W * H) / 5000; i++) {
    const x = rnd() * W, y = rnd() * H, r = 14 + rnd() * 26;
    arc(x, y, r, rnd() < 0.5 ? "rgba(106,178,64,0.5)" : "rgba(140,205,90,0.45)");
  }
  // grass-blade tufts
  for (let i = 0; i < (W * H) / 1400; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H);
    C.fillStyle = "rgba(74,140,46,0.7)";
    C.fillRect(x, y, 1, 3); C.fillRect(x + 2, y - 1, 1, 4); C.fillRect(x + 4, y, 1, 3);
  }
  // tiny wildflowers
  const fc = ["#ffe082", "#fff", "#f48fb1", "#ce93d8"];
  for (let i = 0; i < (W * H) / 9000; i++) {
    const x = rnd() * W, y = rnd() * H, c = fc[Math.floor(rnd() * fc.length)];
    fr(x, y, 2, 2, c); fr(x - 2, y, 2, 2, c); fr(x + 2, y, 2, 2, c); fr(x, y - 2, 2, 2, c); fr(x, y + 2, 2, 2, c);
    fr(x, y, 2, 2, "#ffd54f");
  }
}

// ── props ──────────────────────────────────────────────────────────────────
function tree(x: number, y: number, s = 1) {
  C.save(); C.translate(x, y); C.scale(s, s);
  C.fillStyle = "rgba(0,0,0,0.15)"; C.beginPath(); C.ellipse(0, 4, 22, 7, 0, 0, Math.PI * 2); C.fill(); // shadow
  fr(-5, -10, 10, 22, "#6d4c41"); fr(-5, -10, 3, 22, "#5d4037");                                          // trunk
  arc(0, -34, 22, "#2e7d32"); arc(-16, -24, 16, "#2e7d32"); arc(16, -24, 16, "#2e7d32"); arc(0, -20, 18, "#2e7d32");
  arc(-6, -40, 15, "#388e3c"); arc(10, -36, 14, "#388e3c"); arc(0, -30, 16, "#43a047");
  arc(-8, -44, 7, "#66bb6a"); arc(8, -40, 6, "#66bb6a"); arc(0, -34, 6, "#81c784");
  C.restore();
}
function bush(x: number, y: number) {
  arc(x, y, 11, "#2e7d32"); arc(x - 8, y + 2, 8, "#388e3c"); arc(x + 8, y + 2, 8, "#388e3c");
  arc(x - 3, y - 3, 5, "#66bb6a"); arc(x + 5, y - 1, 4, "#66bb6a");
}
function rock(x: number, y: number) {
  C.fillStyle = "rgba(0,0,0,0.12)"; C.beginPath(); C.ellipse(x, y + 4, 11, 4, 0, 0, Math.PI * 2); C.fill();
  arc(x, y, 9, "#9e9e9e"); arc(x - 2, y - 2, 6, "#bdbdbd"); fr(x - 3, y - 3, 3, 2, "#e0e0e0");
}
function flowerPatch(x: number, y: number, color: string) {
  for (let i = 0; i < 5; i++) {
    const fx = x + (i % 3) * 8 - 8, fy = y + Math.floor(i / 3) * 8;
    fr(fx, fy, 2, 2, color); fr(fx - 2, fy, 2, 2, color); fr(fx + 2, fy, 2, 2, color); fr(fx, fy - 2, 2, 2, color); fr(fx, fy + 2, 2, 2, color);
    fr(fx, fy, 2, 2, "#ffca28");
    fr(fx + 1, fy + 3, 1, 3, "#2e7d32");
  }
}

function pond(x: number, y: number, w: number, h: number, tick: number) {
  const el = (rw: number, rh: number, c: string, dy = 0) => { C.fillStyle = c; C.beginPath(); C.ellipse(x, y + dy, rw, rh, 0, 0, Math.PI * 2); C.fill(); };
  el(w + 4, h + 4, "#5d8a3a", 0);          // muddy bank
  el(w, h, "#2f6fa0");                       // deep water
  el(w - 6, h - 6, "#4f9bd6", 0);            // water
  el(w - 14, h - 12, "#6fb6e6", -2);         // shallow highlight
  // animated shimmer
  C.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 4; i++) {
    const sx = x - w / 2 + ((tick * 0.6 + i * 37) % w), sy = y - h / 3 + Math.sin(tick * 0.05 + i) * 4;
    C.fillRect(sx, sy, 8, 1);
  }
  // lily pads
  arc(x - w * 0.4, y, 6, "#388e3c"); arc(x + w * 0.3, y + 4, 5, "#43a047");
  fr(x + w * 0.3 - 1, y + 2, 2, 2, "#f48fb1");
  // reeds at edge
  for (let i = 0; i < 4; i++) { const rx = x + w * 0.6 + i * 4; fr(rx, y - 10, 1, 12, "#558b2f"); fr(rx, y - 13, 2, 4, "#8d6e63"); }
}

function tilledGarden(x: number, y: number, cols: number, rows: number, tick: number) {
  const cw = 22, rh = 20;
  const w = cols * cw, h = rows * rh;
  fr(x - 3, y - 3, w + 6, h + 6, "#6b4a2b");      // border soil
  for (let r = 0; r < rows; r++) {
    fr(x, y + r * rh, w, rh - 4, "#7a4f2a");
    fr(x, y + r * rh, w, 3, "#8a5a30");            // furrow ridge
    fr(x, y + r * rh + rh - 5, w, 2, "#5c3a1e");   // furrow shadow
    for (let c = 0; c < cols; c++) crop(x + c * cw + 4, y + r * rh + 2, (r + c) % 3, tick + r + c);
  }
}
function crop(x: number, y: number, type: number, tick: number) {
  const sway = Math.sin(tick * 0.04 + x) * 0.6;
  if (type === 0) { // leafy + carrot top
    fr(x + 5, y + 10, 4, 4, "#e8821e"); fr(x + 6, y + 13, 2, 2, "#c96a12");
    C.fillStyle = "#2e7d32";
    fr(x + 5 + sway, y + 2, 2, 9, "#2e7d32"); fr(x + 3 + sway, y + 4, 2, 6, "#388e3c"); fr(x + 8 + sway, y + 3, 2, 7, "#388e3c");
    fr(x + 5 + sway, y, 2, 3, "#66bb6a");
  } else if (type === 1) { // cabbage / leafy green
    arc(x + 7, y + 8, 6, "#388e3c"); arc(x + 4, y + 9, 4, "#2e7d32"); arc(x + 10, y + 9, 4, "#2e7d32"); arc(x + 7, y + 6, 4, "#66bb6a");
  } else { // tomato plant
    fr(x + 6 + sway, y + 2, 2, 12, "#33691e");
    fr(x + 3 + sway, y + 4, 3, 2, "#43a047"); fr(x + 9 + sway, y + 6, 3, 2, "#43a047");
    arc(x + 5 + sway, y + 9, 2, "#e53935"); arc(x + 9 + sway, y + 7, 2, "#e53935");
  }
}

function fenceRect(x: number, y: number, w: number, h: number) {
  const post = (px: number, py: number) => { fr(px - 2, py - 6, 4, 10, "#8d6e63"); fr(px - 2, py - 6, 4, 2, "#a1887f"); };
  C.strokeStyle = "#8d6e63"; C.lineWidth = 2;
  C.strokeRect(x, y, w, h);
  C.strokeStyle = "#6d4c41"; C.strokeRect(x, y + 3, w, h);
  for (let px = x; px <= x + w; px += 18) { post(px, y); post(px, y + h); }
  for (let py = y; py <= y + h; py += 18) { post(x, py); post(x + w, py); }
  C.lineWidth = 1;
}

function house(x: number, y: number) {
  fr(x + 4, y + 54, 96, 10, "rgba(0,0,0,0.12)");        // shadow
  fr(x, y + 20, 92, 44, "#c8a063"); fr(x + 2, y + 22, 88, 40, "#d8b478"); // walls
  // roof
  C.fillStyle = "#b23a2e"; C.beginPath(); C.moveTo(x - 8, y + 22); C.lineTo(x + 46, y - 8); C.lineTo(x + 100, y + 22); C.closePath(); C.fill();
  C.fillStyle = "#9c2f25"; C.beginPath(); C.moveTo(x - 8, y + 22); C.lineTo(x + 46, y - 8); C.lineTo(x + 46, y - 4); C.lineTo(x - 4, y + 22); C.closePath(); C.fill();
  fr(x + 64, y - 6, 10, 16, "#7a4f2a"); fr(x + 63, y - 9, 12, 4, "#5d4037"); // chimney
  // door
  fr(x + 38, y + 38, 18, 26, "#6d4c41"); fr(x + 40, y + 40, 14, 24, "#8d6e63"); fr(x + 50, y + 50, 2, 2, "#ffd54f");
  // windows
  fr(x + 12, y + 30, 16, 14, "#5d4037"); fr(x + 14, y + 32, 12, 10, "#a8d8f0"); fr(x + 14, y + 32, 12, 4, "#cfeaff");
  fr(x + 66, y + 30, 16, 14, "#5d4037"); fr(x + 68, y + 32, 12, 10, "#a8d8f0"); fr(x + 68, y + 32, 12, 4, "#cfeaff");
  // flower box
  fr(x + 12, y + 44, 16, 4, "#8d6e63");
}

function haystack(x: number, y: number) {
  fr(x - 2, y + 16, 28, 5, "rgba(0,0,0,0.12)");
  arc(x + 12, y + 12, 14, "#e6c34c"); arc(x + 12, y + 6, 11, "#f0d264"); arc(x + 12, y, 8, "#f5dd80");
  for (let i = 0; i < 6; i++) fr(x + 2 + i * 4, y + 4, 1, 10, "rgba(180,140,40,0.5)");
}
function scarecrow(x: number, y: number) {
  fr(x - 1, y - 30, 2, 34, "#8d6e63");            // post
  fr(x - 14, y - 22, 28, 2, "#8d6e63");           // arms
  arc(x, y - 30, 6, "#d8b478"); fr(x - 3, y - 32, 6, 2, "#b23a2e"); // head + hat band
  C.fillStyle = "#a8732e"; C.beginPath(); C.moveTo(x - 8, y - 34); C.lineTo(x + 8, y - 34); C.lineTo(x + 5, y - 38); C.lineTo(x - 5, y - 38); C.closePath(); C.fill();
  fr(x - 6, y - 24, 12, 14, "#b23a2e"); fr(x - 6, y - 24, 12, 3, "#d84a3c"); // shirt
  fr(x - 2, y - 31, 1, 1, "#000"); fr(x + 1, y - 31, 1, 1, "#000");
}

// ── ambient chickens (wander + peck) ────────────────────────────────────────
interface Chicken { x: number; y: number; tx: number; ty: number; timer: number; pecking: boolean; flip: boolean; }
let chickens: Chicken[] = [];
function stepChickens(W: number, H: number) {
  const rnd = makeRand(Date.now() & 0xffff);
  const pick = (ck: Chicken) => { ck.tx = W * (0.18 + rnd() * 0.6); ck.ty = H * (0.5 + rnd() * 0.42); };
  if (!chickens.length) {
    for (let i = 0; i < 3; i++) { const ck: Chicken = { x: W * 0.4, y: H * 0.6, tx: 0, ty: 0, timer: i * 20, pecking: false, flip: false }; pick(ck); chickens.push(ck); }
  }
  for (const ck of chickens) {
    if (ck.timer > 0) { ck.timer--; continue; }       // pecking / pausing
    const dx = ck.tx - ck.x, dy = ck.ty - ck.y, d = Math.hypot(dx, dy);
    if (d < 3) { ck.pecking = true; ck.timer = 18 + Math.floor(rnd() * 30); if (rnd() < 0.5) pick(ck); }
    else { ck.flip = dx < 0; ck.x += (dx / d) * 0.9; ck.y += (dy / d) * 0.7; ck.pecking = false; }
  }
}
function drawChicken(ck: Chicken, tick: number) {
  const peckDip = ck.pecking ? (Math.sin(tick * 0.4) > 0 ? 3 : 0) : 0;
  C.save(); C.translate(ck.x, ck.y); if (ck.flip) C.scale(-1, 1);
  C.fillStyle = "rgba(0,0,0,0.15)"; C.beginPath(); C.ellipse(0, 2, 7, 2.5, 0, 0, Math.PI * 2); C.fill();
  fr(2, 1, 1, 3, "#e6a23c"); fr(-2, 1, 1, 3, "#e6a23c");            // legs
  C.fillStyle = "#fff"; C.beginPath(); C.ellipse(0, -3, 6, 5, 0, 0, Math.PI * 2); C.fill(); // body
  C.fillStyle = "#e0e0e0"; C.beginPath(); C.ellipse(1, -2, 4, 3, 0, 0, Math.PI * 2); C.fill(); // wing
  fr(-6, -6, 3, 4, "#fff");                                          // tail
  C.fillStyle = "#fff"; C.beginPath(); C.arc(4, -7 + peckDip, 3, 0, Math.PI * 2); C.fill(); // head
  fr(4, -10 + peckDip, 2, 2, "#e53935");                             // comb
  fr(6, -7 + peckDip, 3, 2, "#f6a609");                              // beak
  fr(4, -8 + peckDip, 1, 1, "#222");                                 // eye
  C.restore();
}

// ── seats (work spots) for agents, in canvas pixels ──────────────────────────
export interface FarmSeat { x: number; y: number; }
export let FARM_SEATS: FarmSeat[] = [];

export function renderFarm(ctx: CanvasRenderingContext2D, W: number, H: number, tick: number) {
  C = ctx;
  C.imageSmoothingEnabled = false;
  grassBackground(W, H);

  // dirt path from house down toward the garden/pond
  C.strokeStyle = "#c2a878"; C.lineWidth = 14; C.lineCap = "round";
  C.beginPath(); C.moveTo(W * 0.18, H * 0.22); C.quadraticCurveTo(W * 0.35, H * 0.45, W * 0.5, H * 0.6); C.stroke();
  C.strokeStyle = "#b59868"; C.lineWidth = 10; C.stroke();
  C.lineWidth = 1;

  // treeline border along the top
  for (let i = 0; i < W; i += 64) tree(i + 28, 30 + (i % 128 === 0 ? 0 : 8), 0.85);

  // house, top-left
  house(W * 0.08, 70);

  // garden plot with crop rows + fence
  const gx = W * 0.30, gy = H * 0.30, gCols = 4, gRows = 4;
  tilledGarden(gx, gy, gCols, gRows, tick);
  fenceRect(gx - 8, gy - 8, gCols * 22 + 12, gRows * 20 + 12);
  scarecrow(gx + gCols * 22 + 24, gy + 10);

  // pond, lower area
  pond(W * 0.72, H * 0.74, 60, 38, tick);

  // decor scatter
  tree(W * 0.86, H * 0.30, 1.1);
  tree(W * 0.16, H * 0.62, 1.0);
  tree(W * 0.92, H * 0.92, 0.9);
  bush(W * 0.5, H * 0.5); bush(W * 0.62, H * 0.4); bush(W * 0.22, H * 0.84);
  rock(W * 0.42, H * 0.78); rock(W * 0.6, H * 0.86);
  haystack(W * 0.1, H * 0.5); haystack(W * 0.16, H * 0.52);
  flowerPatch(W * 0.5, H * 0.2, "#f06292"); flowerPatch(W * 0.66, H * 0.16, "#ffffff");
  flowerPatch(W * 0.34, H * 0.7, "#ba68c8"); flowerPatch(W * 0.8, H * 0.5, "#ffd54f");

  // ambient chickens
  stepChickens(W, H);
  for (const ck of chickens) drawChicken(ck, tick);

  // agent work spots: along the garden front + by the pond
  FARM_SEATS = [
    { x: gx + 12, y: gy + gRows * 20 + 16 },
    { x: gx + 56, y: gy + gRows * 20 + 16 },
    { x: gx + 100, y: gy + gRows * 20 + 16 },
    { x: W * 0.72, y: H * 0.74 + 50 },
    { x: W * 0.2, y: H * 0.4 },
    { x: W * 0.6, y: H * 0.62 },
  ];
}
