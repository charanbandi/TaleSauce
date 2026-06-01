/**
 * assets/generate-placeholders.mjs
 *
 * Generates two placeholder PNGs for the TaleSauce Phase 1 asset contract:
 *   assets/tiles/tilemap.png       – 64×64 tileset (4×4 grid of 16×16 tiles)
 *   assets/characters/character.png – 160×32 horizontal sprite sheet (10 frames, 16×32 each)
 *
 * Usage:
 *   node assets/generate-placeholders.mjs
 *
 * Re-runnable and deterministic. Uses `pngjs` (available in root node_modules).
 * Real CC0 art can replace these files at the exact same paths without any code change.
 */

import { PNG } from "pngjs";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────── helpers ───────────────────────────────────────

/**
 * Create a blank (transparent) PNG and return a helper for drawing on it.
 */
function makePNG(width, height) {
  const png = new PNG({ width, height, filterType: -1 });
  // Fill with transparent black
  png.data.fill(0);

  return {
    png,
    /** Set pixel (x, y) to RGBA. */
    setPixel(x, y, r, g, b, a = 255) {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const idx = (y * width + x) * 4;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    },
    /** Fill an axis-aligned rectangle. */
    fillRect(x, y, w, h, r, g, b, a = 255) {
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          this.setPixel(x + dx, y + dy, r, g, b, a);
        }
      }
    },
    /** Draw a 1-pixel border around a rectangle (inner edge). */
    strokeRect(x, y, w, h, r, g, b, a = 255) {
      for (let dx = 0; dx < w; dx++) {
        this.setPixel(x + dx, y, r, g, b, a);
        this.setPixel(x + dx, y + h - 1, r, g, b, a);
      }
      for (let dy = 0; dy < h; dy++) {
        this.setPixel(x, y + dy, r, g, b, a);
        this.setPixel(x + w - 1, y + dy, r, g, b, a);
      }
    },
    save(filePath) {
      const buf = PNG.sync.write(png);
      writeFileSync(filePath, buf);
      console.log(`  Wrote ${filePath}  (${width}×${height})`);
    },
  };
}

// ─────────────────────────── tilemap ───────────────────────────────────────
// 64×64 = 4 columns × 4 rows of 16×16 tiles
// Tile types (row-major):
//   row 0: grass green, dirt brown, water blue, water-deep blue
//   row 1: floor grey, wall dark-grey, floor alt, placeholder dark
//   rows 2-3: darker variants / extras

function makeTilemap() {
  const W = 64, H = 64, T = 16;
  const c = makePNG(W, H);

  const TILES = [
    // row 0
    { r: 72,  g: 160, b: 64  }, // grass
    { r: 139, g: 90,  b: 43  }, // dirt
    { r: 64,  g: 128, b: 200 }, // water
    { r: 40,  g: 80,  b: 160 }, // deep water
    // row 1
    { r: 160, g: 155, b: 148 }, // stone floor
    { r: 80,  g: 75,  b: 70  }, // wall
    { r: 190, g: 175, b: 140 }, // sand / floor alt
    { r: 50,  g: 50,  b: 50  }, // void / dark
    // row 2
    { r: 100, g: 180, b: 80  }, // bright grass
    { r: 160, g: 110, b: 60  }, // light dirt
    { r: 100, g: 160, b: 220 }, // shallow water
    { r: 200, g: 190, b: 160 }, // light sand
    // row 3
    { r: 55,  g: 120, b: 45  }, // dark grass
    { r: 110, g: 65,  b: 30  }, // dark dirt
    { r: 30,  g: 60,  b: 130 }, // very deep water
    { r: 130, g: 125, b: 120 }, // dark stone
  ];

  TILES.forEach((col, i) => {
    const tx = (i % 4) * T;
    const ty = Math.floor(i / 4) * T;
    c.fillRect(tx, ty, T, T, col.r, col.g, col.b);
    // Draw a subtle inner border so tiles are visually distinct as a grid
    c.strokeRect(tx, ty, T, T, Math.max(0, col.r - 30), Math.max(0, col.g - 30), Math.max(0, col.b - 30));
  });

  return c;
}

// ─────────────────────────── character ─────────────────────────────────────
// 160×32 = 10 frames of 16×32
// Color palette
const SKIN   = [230, 190, 150];
const HAIR   = [60,  40,  20];
const SHIRT  = [70,  100, 200];  // blue shirt
const PANTS  = [50,  50,  90];   // dark pants
const SHOES  = [60,  40,  20];   // same as hair
const HAND   = [230, 190, 150];  // same as skin
const PLACEHOLDER_BORDER = [180, 0, 180]; // magenta border so it reads as placeholder

/**
 * Draw a simple top-down/side-view character in one 16×32 frame.
 *
 * @param {object} c          - canvas from makePNG
 * @param {number} ox         - x offset for this frame
 * @param {number} legOffset  - shift legs down by N pixels (walk cycle)
 * @param {number} armMode    - 0=down, 1=forward/work, 2=raised (wave/talk)
 * @param {boolean} leftArm   - if armMode===2, which arm is raised
 */
function drawCharacter(c, ox, legOffset, armMode, leftArm = false) {
  const oy = 0; // y start

  // Clear this frame area (transparent)
  c.fillRect(ox, oy, 16, 32, 0, 0, 0, 0);

  // Placeholder: 1-px magenta border around the whole frame
  c.strokeRect(ox, oy, 16, 32, ...PLACEHOLDER_BORDER, 80);

  // ── Body (torso: 8×10, centered horizontally, y=10–19) ──
  const bx = ox + 4;
  const by = 10;
  c.fillRect(bx, by, 8, 10, ...SHIRT);

  // ── Head (6×6, centered, y=3–8) ──
  const hx = ox + 5;
  const hy = 3;
  c.fillRect(hx, hy, 6, 6, ...SKIN);
  // Hair (top 2 rows of head)
  c.fillRect(hx, hy, 6, 2, ...HAIR);
  // Eyes (2 pixels at row hy+3)
  c.setPixel(hx + 1, hy + 3, 30, 20, 10);
  c.setPixel(hx + 4, hy + 3, 30, 20, 10);
  // Mouth (2 pixels at row hy+5)
  c.setPixel(hx + 2, hy + 5, 180, 80, 60);
  c.setPixel(hx + 3, hy + 5, 180, 80, 60);

  // ── Arms ──
  // Left arm (ox+2, ox+3) ; Right arm (ox+11, ox+12)
  if (armMode === 0) {
    // Arms straight down along torso
    c.fillRect(ox + 2, by,     2, 9, ...SHIRT);
    c.fillRect(ox + 2, by + 9, 2, 2, ...HAND);   // left hand
    c.fillRect(ox + 12, by,     2, 9, ...SHIRT);
    c.fillRect(ox + 12, by + 9, 2, 2, ...HAND);  // right hand
  } else if (armMode === 1) {
    // Arms angled forward (work pose) — shift left arm up-left, right arm up-right
    c.fillRect(ox + 1, by + 1, 3, 7, ...SHIRT);
    c.fillRect(ox + 1, by + 8, 3, 2, ...HAND);
    c.fillRect(ox + 12, by + 1, 3, 7, ...SHIRT);
    c.fillRect(ox + 12, by + 8, 3, 2, ...HAND);
  } else {
    // armMode === 2 — one arm raised (wave / talk)
    if (leftArm) {
      // Left arm raised
      c.fillRect(ox + 1, by - 5, 3, 7, ...SHIRT);
      c.fillRect(ox + 1, by - 7, 3, 2, ...HAND);
      // Right arm normal
      c.fillRect(ox + 12, by,     2, 9, ...SHIRT);
      c.fillRect(ox + 12, by + 9, 2, 2, ...HAND);
    } else {
      // Right arm raised
      c.fillRect(ox + 12, by - 5, 3, 7, ...SHIRT);
      c.fillRect(ox + 12, by - 7, 3, 2, ...HAND);
      // Left arm normal
      c.fillRect(ox + 2, by,     2, 9, ...SHIRT);
      c.fillRect(ox + 2, by + 9, 2, 2, ...HAND);
    }
  }

  // ── Legs ──
  const legBase = 20 + legOffset;
  // Left leg
  c.fillRect(ox + 4, legBase,     4, 8, ...PANTS);
  c.fillRect(ox + 4, legBase + 8, 4, 2, ...SHOES);
  // Right leg
  c.fillRect(ox + 8, legBase,     4, 8, ...PANTS);
  c.fillRect(ox + 8, legBase + 8, 4, 2, ...SHOES);
}

function makeCharacterSheet() {
  const W = 160, H = 32;
  const c = makePNG(W, H);

  // walk-down / idle frames 0-3: gentle step alternation
  //   frame 0: standing still
  //   frame 1: right leg forward (legOffset varies per leg)
  //   frame 2: standing (mid-step)
  //   frame 3: left leg forward
  drawCharacter(c,   0, 0, 0);  // frame 0 – idle/stand
  drawCharacter(c,  16, 1, 0);  // frame 1 – step right
  drawCharacter(c,  32, 0, 0);  // frame 2 – neutral
  drawCharacter(c,  48, 1, 0);  // frame 3 – step left (mirror conveyed by offset)

  // work-loop frames 4-7: arms forward, body bob
  drawCharacter(c,  64, 0, 1);  // frame 4 – work neutral
  drawCharacter(c,  80, 1, 1);  // frame 5 – work lean
  drawCharacter(c,  96, 0, 1);  // frame 6 – work neutral
  drawCharacter(c, 112, 1, 1);  // frame 7 – work lean

  // wave / talk frames 8-9: right arm raised (frame 8), left arm raised (frame 9)
  drawCharacter(c, 128, 0, 2, false); // frame 8 – wave right arm
  drawCharacter(c, 144, 0, 2, true);  // frame 9 – wave left arm (talk)

  return c;
}

// ─────────────────────────── main ───────────────────────────────────────────

const tilesDir = join(__dirname, "tiles");
const charsDir = join(__dirname, "characters");
mkdirSync(tilesDir, { recursive: true });
mkdirSync(charsDir, { recursive: true });

console.log("Generating placeholder PNGs…");

const tilemap = makeTilemap();
tilemap.save(join(tilesDir, "tilemap.png"));

const character = makeCharacterSheet();
character.save(join(charsDir, "character.png"));

console.log("Done. These are CC0 placeholder assets. Swap in real art at the same paths.");
