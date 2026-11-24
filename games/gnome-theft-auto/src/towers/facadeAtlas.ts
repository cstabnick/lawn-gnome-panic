// The facade atlas: 16 window patterns painted on one 1024 x 1024 canvas (4 x 4 tiles of 256 px), plus a glow atlas
// with the same layout (lit windows on black) for night.
import * as THREE from 'three';
import { seeded } from './kit';

/** Facade tile ids: tile i is painted at canvas x = (i % 4) * 256, y = floor(i / 4) * 256. */
export const FACADE = {
  BRICK: 0,
  BLUE_GLASS: 1,
  CONCRETE_BANDS: 2,
  SANDSTONE: 3,
  OBSIDIAN: 4,
  GREEN_GLASS: 5,
  WHITE_GRID: 6,
  DECO_CREAM: 7,
  BRICK_WEATHERED: 8,
  COPPER: 9,
  PASTEL_BALCONY: 10,
  GOLD_MIRROR: 11,
  CHECKER: 12,
  TERRACOTTA: 13,
  SHOPS: 14,
  LOBBY: 15,
} as const;

/** The body tiles a minor tower may use (not SHOPS or LOBBY, which are ground floors). */
export const BODY_FACADES: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const SIZE = 1024;
const TILE = 256;
const WARM = ['#ffd27a', '#ffc46b', '#ffe9b0'];
const COOL = '#bfe3ff';
const SILL = '#f4f1ea';

type Ctx = CanvasRenderingContext2D;
/** The two canvases being painted, plus the shared random source. Both are in tile space (translated). */
interface Tile { d: Ctx; g: Ctx; rnd: () => number }
type Painter = (t: Tile) => void;

/**
 * Fills a rect in tile space. It is also drawn one tile away in each direction, so anything crossing a tile edge
 * wraps: the clip in paintAtlas keeps the copies inside their own tile.
 */
function fillR(c: Ctx, x: number, y: number, w: number, h: number, style: string | CanvasGradient): void {
  c.fillStyle = style;
  for (const dx of [-TILE, 0, TILE]) {
    for (const dy of [-TILE, 0, TILE]) {
      const rx = x + dx, ry = y + dy;
      if (rx < TILE && rx + w > 0 && ry < TILE && ry + h > 0) c.fillRect(rx, ry, w, h);
    }
  }
}

/** A rect (or an arch: semicircle on top when arch is set, with w as its diameter) filled in one style. */
function pane(c: Ctx, x: number, y: number, w: number, h: number, style: string | CanvasGradient, arch: boolean): void {
  if (!arch) { fillR(c, x, y, w, h, style); return; }
  c.fillStyle = style;
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + w / 2);
  c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  c.lineTo(x + w, y + h);
  c.closePath();
  c.fill();
}

/** A pale diagonal glint across a pane. */
function glint(c: Ctx, x: number, y: number, w: number, h: number, alpha = 0.35): void {
  c.fillStyle = `rgba(255,255,255,${alpha})`;
  c.beginPath();
  c.moveTo(x + w * 0.2, y + h);
  c.lineTo(x + w * 0.55, y);
  c.lineTo(x + w * 0.7, y);
  c.lineTo(x + w * 0.35, y + h);
  c.closePath();
  c.fill();
}

/** Same rect on both canvases, with a different colour on each (glow is black where nothing glows). */
function both(t: Tile, x: number, y: number, w: number, h: number, day: string, glow: string): void {
  fillR(t.d, x, y, w, h, day);
  fillR(t.g, x, y, w, h, glow);
}

function wall(t: Tile, color: string): void {
  fillR(t.d, 0, 0, TILE, TILE, color);
}

/** Vertical wall gradient that matches at the top and bottom edge (so the tile repeats seamlessly). */
function wallGrad(t: Tile, edge: string, mid: string): void {
  const gr = t.d.createLinearGradient(0, 0, 0, TILE);
  gr.addColorStop(0, edge);
  gr.addColorStop(0.5, mid);
  gr.addColorStop(1, edge);
  fillR(t.d, 0, 0, TILE, TILE, gr);
}

/** The day glass of one window: warm when lit, sky-blue with a glint when not. */
function glass(t: Tile, x: number, y: number, w: number, h: number, lit: boolean, arch: boolean): void {
  const gr = t.d.createLinearGradient(0, y, 0, y + h);
  if (lit) {
    gr.addColorStop(0, '#8a7650');
    gr.addColorStop(1, '#2e2a24');
  } else {
    gr.addColorStop(0, '#9fb6c8');
    gr.addColorStop(1, '#4f6578');
  }
  pane(t.d, x, y, w, h, gr, arch);
  if (!lit) glint(t.d, x, y, w, h);
}

/** The night glow of one window: lit windows get a warm (or one in five a cool) colour, a quarter of them half bright. */
function glowPane(t: Tile, x: number, y: number, w: number, h: number, lit: boolean, full: boolean, arch: boolean): void {
  if (!lit) return;
  const color = t.rnd() < 0.2 ? COOL : WARM[Math.floor(t.rnd() * WARM.length)];
  const dim = !full && t.rnd() < 0.25;
  t.g.globalAlpha = dim ? 0.5 : 1;
  pane(t.g, x, y, w, h, color, arch);
  t.g.globalAlpha = 1;
}

/** One window on both canvases. Lit with chance 0.45 unless `full` forces it lit at full brightness. */
function win(t: Tile, x: number, y: number, w: number, h: number, full = false, arch = false): void {
  const lit = full || t.rnd() < 0.45;
  glass(t, x, y, w, h, lit, arch);
  glowPane(t, x, y, w, h, lit, full, arch);
}

/** A punched window with a white lintel and sill. */
function punch(t: Tile, x: number, y: number, w: number, h: number): void {
  fillR(t.d, x - 2, y - 6, w + 4, 4, SILL);
  fillR(t.d, x - 4, y + h, w + 8, 4, SILL);
  win(t, x, y, w, h);
}

/** Brick courses every 8 px, staggered every other course, each brick with a slight shade jitter. */
function bricks(t: Tile, brick: string, mortar: string): void {
  wall(t, mortar);
  for (let row = 0; row < 32; row++) {
    const y = row * 8, off = row % 2 ? 16 : 0;
    for (let k = 0; k < 8; k++) {
      const x = off + k * 32 + 1;
      fillR(t.d, x, y + 1, 30, 6, brick);
      const a = (t.rnd() * 0.12).toFixed(3);
      fillR(t.d, x, y + 1, 30, 6, t.rnd() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`);
    }
  }
}

/** A railing on a balcony in front of a French window: vertical bars, a top rail and a slab. Painted white by day. */
function french(t: Tile, x: number, y: number, w: number, h: number): void {
  win(t, x, y, w, h);
  const x0 = x - 10, x1 = x + w + 10, top = y + h - 18, base = y + h + 4;
  both(t, x0, top, x1 - x0, 3, '#ffffff', '#000');
  for (let bx = x0; bx <= x1 - 2; bx += 6) both(t, bx, top, 2, base - top, '#ffffff', '#000');
  both(t, x0 - 2, base, x1 - x0 + 4, 4, '#ffffff', '#000');
}

/** Tile 0: warm red brick, two punched windows per floor. */
function paintBrick(t: Tile): void {
  bricks(t, '#a5523a', '#cbb9a2');
  for (const x of [44, 172]) {
    punch(t, x, 30, 40, 60);
    punch(t, x, 158, 40, 60);
  }
}

/** Tile 1: blue curtain wall with thin light mullions on a 64 px grid and a spandrel band at each floor line. */
function paintBlueGlass(t: Tile): void {
  wallGrad(t, '#3f7fb5', '#2b5a80');
  for (let cy = 0; cy < 4; cy++) {
    for (let cx = 0; cx < 4; cx++) win(t, cx * 64 + 3, cy * 64 + 3, 58, 58);
  }
  for (let k = 0; k < 4; k++) {
    both(t, k * 64 - 1, 0, 2, TILE, '#c9dcea', '#000');
    both(t, 0, k * 64 - 1, TILE, 2, '#c9dcea', '#000');
  }
  both(t, 0, -4, TILE, 8, '#1f4466', '#000');
  both(t, 0, 124, TILE, 8, '#1f4466', '#000');
}

/** Tile 2: grey concrete with one long ribbon window per floor running across the tile, and vertical mullions. */
function paintConcrete(t: Tile): void {
  wall(t, '#9aa0a6');
  for (const y of [40, 168]) {
    win(t, 0, y, TILE, 44);
    for (let k = 0; k < 8; k++) both(t, 32 * k - 1, y, 2, 44, '#5b6168', '#000');
    fillR(t.d, 0, y + 44, TILE, 4, '#b8bec4');
  }
  both(t, 0, -2, TILE, 4, '#7d848b', '#000');
  both(t, 0, 124, TILE, 4, '#7d848b', '#000');
}

/** Tile 3: sandstone with arched-top windows and a carved string course at each floor line. */
function paintSandstone(t: Tile): void {
  wall(t, '#d9c08b');
  for (const x of [44, 172]) {
    for (const y of [30, 158]) {
      win(t, x, y, 40, 70, false, true);
      fillR(t.d, x - 4, y + 70, 48, 4, '#b89c63');
    }
  }
  both(t, 0, -2, TILE, 4, '#b89c63', '#000');
  both(t, 0, 126, TILE, 4, '#b89c63', '#000');
}

/** Tile 4: near-black glass with thin gold fins every 64 px and dark windows between them. */
function paintObsidian(t: Tile): void {
  wall(t, '#14151b');
  for (let k = 0; k < 4; k++) {
    win(t, k * 64 + 4, 12, 56, 108);
    win(t, k * 64 + 4, 140, 56, 108);
    both(t, k * 64 - 1, 0, 3, TILE, '#c9a227', '#000');
  }
}

/** Tile 5: green glass with a light frame round each window and a small planter of green dots under it. */
function paintGreen(t: Tile): void {
  wallGrad(t, '#2f7d5b', '#1f5a40');
  for (const y of [20, 148]) {
    for (const x of [8, 72, 136, 200]) {
      fillR(t.d, x - 3, y - 3, 54, 82, '#cfe8dc');
      win(t, x, y, 48, 76);
      for (let j = 0; j < 4; j++) {
        t.d.fillStyle = '#7fcf8a';
        t.d.beginPath();
        t.d.arc(x + 6 + j * 12, y + 84, 3, 0, Math.PI * 2);
        t.d.fill();
      }
    }
  }
}

/** Tile 6: white render with four square punched windows per floor, dark frames. */
function paintWhiteGrid(t: Tile): void {
  wall(t, '#eef0f2');
  for (const x of [12, 76, 140, 204]) {
    for (const y of [44, 172]) {
      fillR(t.d, x - 3, y - 3, 46, 46, '#3a3f45');
      win(t, x, y, 40, 40);
    }
  }
}

/** Tile 7: cream art deco with two darker piers per tile and dark spandrels, so the windows read as tall strips. */
function paintDeco(t: Tile): void {
  wall(t, '#efe6d2');
  both(t, 8, 0, 16, TILE, '#d9cdb0', '#000');
  both(t, 232, 0, 16, TILE, '#d9cdb0', '#000');
  both(t, 24, 120, 208, 24, '#4a4f55', '#000');
  for (const x of [48, 176]) {
    win(t, x, 16, 32, 104);
    win(t, x, 144, 32, 104);
  }
}

/** Tile 8: weathered dark brick with rain streaks under the sills, one boarded window, and soot near the top. */
function paintBrickWeathered(t: Tile): void {
  bricks(t, '#6e3f2e', '#4a3a33');
  fillR(t.d, 0, -8, TILE, 20, 'rgba(20,12,8,0.14)');
  for (const x of [44, 172]) {
    punch(t, x, 30, 40, 60);
    punch(t, x, 158, 40, 60);
  }
  for (const sy of [94, 222]) {
    for (const x of [44, 172]) {
      for (let j = 0; j < 3; j++) {
        const sx = x + t.rnd() * 34;
        fillR(t.d, sx, sy, 3, 10 + t.rnd() * 40, 'rgba(0,0,0,0.25)');
      }
    }
  }
  // The boarded window replaces the punched one at (172, 30).
  fillR(t.d, 172, 30, 40, 60, '#7a5a38');
  for (let py = 30; py < 90; py += 10) fillR(t.d, 172, py, 40, 2, '#3a2818');
}

/** Tile 9: verdigris copper panels on a 64 px seam grid, narrow vertical windows. */
function paintCopper(t: Tile): void {
  wall(t, '#5fa58e');
  for (let k = 0; k < 4; k++) {
    both(t, k * 64 - 1, 0, 2, TILE, '#3f7f6c', '#000');
    both(t, 0, k * 64 - 1, TILE, 2, '#3f7f6c', '#000');
  }
  for (let cx = 0; cx < 4; cx++) {
    win(t, cx * 64 + 22, 12, 20, 40);
    win(t, cx * 64 + 22, 140, 20, 40);
  }
}

/** Tile 10: pastel pink stucco with tall French windows, each with a white balcony railing in front. */
function paintPastel(t: Tile): void {
  wall(t, '#f2b8c6');
  for (const x of [46, 174]) {
    french(t, x, 20, 36, 90);
    french(t, x, 148, 36, 90);
  }
}

/** Tile 11: gold mirror glass, very thin dark mullions and a diagonal sheen on each pane. */
function paintGold(t: Tile): void {
  wallGrad(t, '#c9a24a', '#8a6a2a');
  for (let k = 0; k < 4; k++) {
    for (const y of [6, 134]) {
      win(t, k * 64 + 3, y, 58, 116);
      glint(t.d, k * 64 + 3, y, 58, 116, 0.45);
    }
    both(t, k * 64, 0, 1, TILE, '#3a2a10', '#000');
  }
}

/** Tile 12: candy panels, red and white 64 px squares in a chessboard, with a small window in each white square. */
function paintChecker(t: Tile): void {
  for (let cy = 0; cy < 4; cy++) {
    for (let cx = 0; cx < 4; cx++) {
      const white = (cx + cy) % 2 === 0;
      fillR(t.d, cx * 64, cy * 64, 64, 64, white ? '#fafafa' : '#c62828');
      if (white) win(t, cx * 64 + 20, cy * 64 + 20, 24, 24);
    }
  }
}

/** Tile 13: terracotta with recessed windows under horizontal louvre fins (dark stripes every 12 px). */
function paintTerracotta(t: Tile): void {
  wall(t, '#c0673f');
  for (const y of [30, 158]) {
    for (const x of [40, 168]) {
      fillR(t.d, x - 4, y - 4, 56, 78, '#7a3b22');
      win(t, x, y, 48, 70);
      for (let yy = y; yy < y + 70; yy += 12) fillR(t.d, x - 4, yy, 56, 3, '#8f4a2b');
    }
  }
}

/** Tile 14: ground-floor shopfront, only its bottom 70% (rows 77-255) is seen: fascia, two shop windows, a door. */
function paintShops(t: Tile): void {
  wall(t, '#c9b79c');
  fillR(t.d, 0, 77, TILE, 22, '#2a2d33');
  for (const x of [14, 156]) win(t, x, 104, 86, 132, true);
  // Display shapes inside the windows (day only).
  fillR(t.d, 26, 206, 24, 30, '#8a5a3a');
  fillR(t.d, 60, 220, 20, 16, '#c9a27a');
  t.d.fillStyle = '#6a3a2a';
  t.d.beginPath();
  t.d.moveTo(44, 150);
  t.d.lineTo(64, 150);
  t.d.lineTo(60, 172);
  t.d.lineTo(48, 172);
  t.d.closePath();
  t.d.fill();
  fillR(t.d, 214, 196, 24, 40, '#7f6a55');
  t.d.fillStyle = '#3a2f2a';
  t.d.beginPath();
  t.d.ellipse(190, 190, 14, 5, 0, 0, Math.PI * 2);
  t.d.fill();
  fillR(t.d, 182, 178, 16, 12, '#3a2f2a');
  // The door between the windows: dark wood by day, half lit at night.
  fillR(t.d, 108, 120, 40, 116, '#4a2e1e');
  t.g.globalAlpha = 0.5;
  fillR(t.g, 108, 120, 40, 116, '#ffd27a');
  t.g.globalAlpha = 1;
  fillR(t.d, 0, 246, TILE, 10, '#8d8579');
}

/** Tile 15: ground-floor lobby, only its bottom 70% is seen: one tall glass wall, frames, a revolving door, a stone base. */
function paintLobby(t: Tile): void {
  wall(t, '#c4c8cc');
  const gl = t.d.createLinearGradient(0, 90, 0, 238);
  gl.addColorStop(0, '#5f7f96');
  gl.addColorStop(1, '#2f4656');
  t.d.fillStyle = gl;
  t.d.fillRect(8, 90, 240, 148);
  t.g.globalAlpha = 0.8;
  fillR(t.g, 8, 90, 240, 148, '#e8f4ff');
  t.g.globalAlpha = 1;
  for (const x of [60, 124, 188]) both(t, x, 90, 4, 148, '#2e3840', '#000');
  // Double doors in the middle bay: dark glass with a brass push bar.
  fillR(t.d, 100, 150, 56, 88, '#1e2a32');
  fillR(t.d, 127, 150, 2, 88, '#8a8f94');
  fillR(t.d, 106, 190, 18, 3, '#c9a24a');
  fillR(t.d, 132, 190, 18, 3, '#c9a24a');
  fillR(t.d, 0, 246, TILE, 10, '#d5d0c6');
}

/** Painters by facade id: index i is tile i. */
const PAINTERS: readonly Painter[] = [
  paintBrick,
  paintBlueGlass,
  paintConcrete,
  paintSandstone,
  paintObsidian,
  paintGreen,
  paintWhiteGrid,
  paintDeco,
  paintBrickWeathered,
  paintCopper,
  paintPastel,
  paintGold,
  paintChecker,
  paintTerracotta,
  paintShops,
  paintLobby,
];

/** Paints all 16 tiles on both canvases. Each tile is clipped to its own square. */
function paintAtlas(d: Ctx, g: Ctx): void {
  const rnd = seeded(0x7a11);
  g.fillStyle = '#000';
  g.fillRect(0, 0, SIZE, SIZE);
  PAINTERS.forEach((paint, i) => {
    const ox = (i % 4) * TILE, oy = Math.floor(i / 4) * TILE;
    d.save();
    g.save();
    for (const c of [d, g]) {
      c.translate(ox, oy);
      c.beginPath();
      c.rect(0, 0, TILE, TILE);
      c.clip();
    }
    paint({ d, g, rnd });
    d.restore();
    g.restore();
  });
}

/** Builds the day atlas (map) and the night glow atlas (emissive). */
export function buildFacadeAtlas(): { map: THREE.Texture; glow: THREE.Texture } {
  const dayCanvas = document.createElement('canvas');
  const glowCanvas = document.createElement('canvas');
  dayCanvas.width = SIZE;
  dayCanvas.height = SIZE;
  glowCanvas.width = SIZE;
  glowCanvas.height = SIZE;
  const map = new THREE.CanvasTexture(dayCanvas);
  const glow = new THREE.CanvasTexture(glowCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  glow.colorSpace = THREE.SRGBColorSpace;
  const d = dayCanvas.getContext('2d');
  const g = glowCanvas.getContext('2d');
  if (d && g) paintAtlas(d, g);
  return { map, glow };
}
