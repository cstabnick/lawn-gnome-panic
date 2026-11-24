// The sign atlas: 12 company signs and 4 murals painted on one 1024 x 1024 canvas.
import * as THREE from 'three';
import { BRANDS } from '../brands';

/** Sign ids 0-11 (512 x 128 cells, 4:1) and mural ids 12-15 (256 x 256 cells, 1:1). */
export const SIGN = {
  KILN_SHIELD: 0,
  SNAIL_MAIL: 1,
  TATTLER: 2,
  ACORN_COLA: 3,
  RAZOR_BACK: 4,
  HUSKY_BLADE: 5,
  STINK_GRO: 6,
  BUCK_IRON: 7,
  PIGEON_DROP: 8,
  TURFTON_FM: 9,
  DANDELION_FIZZ: 10,
  FIRST_KILN_BANK: 11,
  MURAL_MOWER: 12,
  MURAL_HAT: 13,
  MURAL_SLUG: 14,
  MURAL_FLOWERS: 15,
} as const;

/** Width / height of a sign (4) or a mural (1). */
export const signAspect = (id: number): number => (id < 12 ? 4 : 1);

/**
 * The uv rectangle [u0, v0, u1, v1] of a sign or mural in the atlas (v up, as three samples a flipY canvas texture).
 * Signs: cell (id % 2, floor(id / 2)) of 512 x 128 from the canvas top. Murals: cell id - 12 of 256 x 256 along the
 * bottom 256 px.
 */
export function signUv(id: number): [number, number, number, number] {
  if (id < 12) {
    const col = id % 2, row = Math.floor(id / 2);
    const x0 = col * 512, y0 = row * 128;
    return [x0 / 1024, 1 - (y0 + 128) / 1024, (x0 + 512) / 1024, 1 - y0 / 1024];
  }
  const k = id - 12;
  return [(k * 256) / 1024, 0, ((k + 1) * 256) / 1024, 256 / 1024];
}

type Ctx = CanvasRenderingContext2D;
/** Draws an emblem centred on (x, y), within about 36 px of it. fg = ink colour, bg = cut-out colour. */
type Emblem = (c: Ctx, x: number, y: number, fg: string, bg: string) => void;

const ATLAS = 1024;
const CELL_W = 512;
const CELL_H = 128;
const PAD = 4;
const BORDER = 6;
const TEXT_W = 400;
const MURAL = 256;
const MURAL_Y = 768;

const css = (n: number): string => '#' + n.toString(16).padStart(6, '0');

function lum(n: number): number {
  const ch = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
}

function contrast(a: number, b: number): number {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The secondary colour, unless white or black contrasts more with the background. */
function inkFor(bg: number, sec: number): number {
  let best = sec, bestC = contrast(sec, bg);
  for (const cand of [0xffffff, 0x000000]) {
    const k = contrast(cand, bg);
    if (k > bestC) { best = cand; bestC = k; }
  }
  return best;
}

function disc(c: Ctx, x: number, y: number, r: number, fill: string): void {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function poly(c: Ctx, pts: [number, number][], fill: string): void {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fill();
}

// Emblems (one per company). Each is drawn with paths only.
const shieldEmblem: Emblem = (c, x, y, fg) =>
  poly(c, [[x - 28, y - 32], [x + 28, y - 32], [x + 28, y + 2], [x, y + 34], [x - 28, y + 2]], fg);

const envelopeEmblem: Emblem = (c, x, y, fg, bg) => {
  poly(c, [[x - 34, y - 22], [x + 34, y - 22], [x + 34, y + 22], [x - 34, y + 22]], fg);
  poly(c, [[x - 34, y - 22], [x, y + 6], [x + 34, y - 22]], bg);
};

const newspaperEmblem: Emblem = (c, x, y, fg, bg) => {
  poly(c, [[x - 30, y - 34], [x + 30, y - 34], [x + 30, y + 34], [x - 30, y + 34]], fg);
  c.fillStyle = bg;
  c.fillRect(x - 22, y - 22, 44, 5);
  c.fillRect(x - 22, y - 10, 44, 3);
  c.fillRect(x - 22, y, 44, 3);
  c.fillRect(x - 22, y + 10, 20, 3);
};

const acornEmblem: Emblem = (c, x, y, fg, bg) => {
  c.fillStyle = fg;
  c.beginPath();
  c.ellipse(x, y + 8, 22, 28, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = fg;
  c.beginPath();
  c.ellipse(x, y - 14, 26, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = bg;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x - 24, y - 14);
  c.lineTo(x + 24, y - 14);
  c.stroke();
};

const bladeEmblem: Emblem = (c, x, y, fg) => {
  for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.fillStyle = fg;
    c.beginPath();
    c.ellipse(22, 0, 22, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  disc(c, x, y, 8, fg);
};

const boltEmblem: Emblem = (c, x, y, fg) =>
  poly(c, [[x + 8, y - 34], [x - 22, y + 4], [x - 2, y + 4], [x - 8, y + 34], [x + 22, y - 6], [x + 2, y - 6]], fg);

const leafEmblem: Emblem = (c, x, y, fg, bg) => {
  c.fillStyle = fg;
  c.beginPath();
  c.moveTo(x - 32, y + 30);
  c.quadraticCurveTo(x - 40, y - 30, x + 34, y - 34);
  c.quadraticCurveTo(x + 40, y + 30, x - 32, y + 30);
  c.fill();
  c.strokeStyle = bg;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x - 28, y + 26);
  c.lineTo(x + 26, y - 28);
  c.stroke();
};

const coinEmblem: Emblem = (c, x, y, fg, bg) => {
  disc(c, x, y, 32, fg);
  disc(c, x, y, 23, bg);
  disc(c, x, y, 16, fg);
};

const birdEmblem: Emblem = (c, x, y, fg) => {
  c.fillStyle = fg;
  c.beginPath();
  c.ellipse(x, y + 4, 24, 14, 0, 0, Math.PI * 2);
  c.fill();
  disc(c, x + 18, y - 8, 10, fg);
  poly(c, [[x + 27, y - 11], [x + 36, y - 7], [x + 27, y - 4]], fg);
  poly(c, [[x - 20, y + 2], [x - 36, y - 10], [x - 32, y + 8]], fg);
};

const arcsEmblem: Emblem = (c, x, y, fg) => {
  disc(c, x - 12, y, 8, fg);
  c.strokeStyle = fg;
  c.lineWidth = 7;
  for (const r of [18, 30, 42]) {
    c.beginPath();
    c.arc(x - 12, y, r, -0.7, 0.7);
    c.stroke();
  }
};

const bubblesEmblem: Emblem = (c, x, y, fg, bg) => {
  disc(c, x - 14, y + 10, 14, fg);
  disc(c, x + 14, y - 4, 20, fg);
  disc(c, x + 6, y + 30, 9, fg);
  disc(c, x + 8, y - 10, 5, bg);
};

const pillarsEmblem: Emblem = (c, x, y, fg) => {
  poly(c, [[x - 36, y - 14], [x, y - 36], [x + 36, y - 14]], fg);
  c.fillStyle = fg;
  c.fillRect(x - 32, y - 10, 64, 6);
  for (const dx of [-24, -6, 12]) c.fillRect(x + dx, y - 2, 10, 32);
  c.fillRect(x - 34, y + 30, 68, 6);
};

interface SignDef {
  id: number;
  text: string;
  bg: number;
  sec: number;
  font: string;
  size: number;
  emblem: Emblem;
}

const SIGN_DEFS: SignDef[] = [
  { id: SIGN.KILN_SHIELD, text: 'KILN-SHIELD', bg: BRANDS['kiln-shield'].primary, sec: BRANDS['kiln-shield'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: shieldEmblem },
  { id: SIGN.SNAIL_MAIL, text: 'SNAIL-MAIL EXPRESS', bg: BRANDS['snail-mail'].primary, sec: BRANDS['snail-mail'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: envelopeEmblem },
  { id: SIGN.TATTLER, text: 'THE TURFTON TATTLER', bg: 0xf2ead8, sec: 0x1b1b1b, font: 'Georgia, serif', size: 54, emblem: newspaperEmblem },
  { id: SIGN.ACORN_COLA, text: 'ACORN-COLA', bg: BRANDS['acorn-cola'].primary, sec: BRANDS['acorn-cola'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: acornEmblem },
  { id: SIGN.RAZOR_BACK, text: 'RAZOR-BACK', bg: BRANDS['razor-back'].primary, sec: BRANDS['razor-back'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: bladeEmblem },
  { id: SIGN.HUSKY_BLADE, text: 'HUSKY-BLADE', bg: BRANDS['husky-blade'].primary, sec: BRANDS['husky-blade'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: boltEmblem },
  { id: SIGN.STINK_GRO, text: 'STINK-GRO', bg: BRANDS['stink-gro'].primary, sec: BRANDS['stink-gro'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: leafEmblem },
  { id: SIGN.BUCK_IRON, text: 'BUCK-IRON', bg: BRANDS['buck-iron'].primary, sec: BRANDS['buck-iron'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: coinEmblem },
  { id: SIGN.PIGEON_DROP, text: 'PIGEON-DROP', bg: BRANDS['pigeon-drop'].primary, sec: BRANDS['pigeon-drop'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: birdEmblem },
  { id: SIGN.TURFTON_FM, text: 'TURFTON FM 99.3', bg: 0x1b1b22, sec: 0xffc400, font: 'system-ui, sans-serif', size: 64, emblem: arcsEmblem },
  { id: SIGN.DANDELION_FIZZ, text: 'DANDELION FIZZ', bg: BRANDS['dandelion-fizz'].primary, sec: BRANDS['dandelion-fizz'].secondary, font: 'system-ui, sans-serif', size: 64, emblem: bubblesEmblem },
  { id: SIGN.FIRST_KILN_BANK, text: 'FIRST KILN BANK', bg: 0x3b2f22, sec: 0xd4af37, font: 'system-ui, sans-serif', size: 64, emblem: pillarsEmblem },
];

/** Sets the bold font, shrinking it until the text fits TEXT_W. Stops after 10 tries; junk measurements stop it early. */
function fitFont(c: Ctx, text: string, face: string, start: number): void {
  let size = start;
  for (let i = 0; i < 10; i++) {
    c.font = `bold ${size}px ${face}`;
    const w = c.measureText(text).width;
    if (!Number.isFinite(w) || w <= TEXT_W) break;
    size = Math.max(8, Math.floor((size * TEXT_W) / w));
  }
  c.font = `bold ${size}px ${face}`;
}

function paintSign(c: Ctx, def: SignDef): void {
  const x0 = (def.id % 2) * CELL_W, y0 = Math.floor(def.id / 2) * CELL_H;
  const bg = css(def.bg), sec = css(def.sec);
  const fg = css(inkFor(def.bg, def.sec));

  // Whole cell in the background colour (the 4 px margin), then the secondary border, then the inner background.
  c.fillStyle = bg;
  c.fillRect(x0, y0, CELL_W, CELL_H);
  c.fillStyle = sec;
  c.fillRect(x0 + PAD, y0 + PAD, CELL_W - 2 * PAD, CELL_H - 2 * PAD);
  const inset = PAD + BORDER;
  c.fillStyle = bg;
  c.fillRect(x0 + inset, y0 + inset, CELL_W - 2 * inset, CELL_H - 2 * inset);

  def.emblem(c, x0 + 56, y0 + CELL_H / 2, fg, bg);

  fitFont(c, def.text, def.font, def.size);
  c.fillStyle = fg;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(def.text, x0 + 300, y0 + CELL_H / 2);
}

// Murals are painted in local 256 x 256 coordinates, origin at the cell's top-left.

function mowerMural(c: Ctx): void {
  c.fillStyle = '#8fd3ff';
  c.fillRect(0, 0, MURAL, MURAL);
  disc(c, 214, 44, 26, '#ffd21f');
  c.fillStyle = '#4caf50';
  c.fillRect(0, 200, MURAL, 56);
  // Gnome: hat, head, beard, coat.
  poly(c, [[100, 85], [140, 85], [120, 38]], '#d62828');
  disc(c, 120, 96, 16, '#f3c9a0');
  disc(c, 120, 110, 11, '#ffffff');
  c.fillStyle = '#1e5bd8';
  c.fillRect(98, 112, 44, 40);
  // Mower.
  c.fillStyle = '#2e7d32';
  c.fillRect(76, 148, 110, 34);
  c.strokeStyle = '#222';
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(180, 150);
  c.lineTo(215, 110);
  c.stroke();
  disc(c, 100, 192, 13, '#222');
  disc(c, 170, 192, 13, '#222');
  c.fillStyle = '#ffffff';
  c.font = 'bold 12px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('MOWERS ARE FOR BORROWING', 128, 244);
}

function hatMural(c: Ctx): void {
  c.fillStyle = '#0b2a6b';
  c.fillRect(0, 0, MURAL, MURAL);
  const coins: [number, number, number][] = [
    [22, 20, 9], [70, 10, 7], [118, 26, 10], [170, 8, 8], [232, 30, 9],
    [40, 70, 7], [96, 58, 8], [240, 84, 10], [20, 118, 8], [200, 120, 7],
    [60, 146, 8], [236, 150, 9], [150, 136, 6],
  ];
  for (const [x, y, r] of coins) {
    disc(c, x, y, r, '#a8801c');
    disc(c, x, y, r - 2, '#ffc83d');
  }
  // Giant hat: brim, cone, gold band.
  c.fillStyle = '#d62828';
  c.beginPath();
  c.ellipse(128, 190, 110, 22, 0, 0, Math.PI * 2);
  c.fill();
  poly(c, [[40, 190], [216, 190], [128, 30]], '#d62828');
  c.fillStyle = '#d4af37';
  c.fillRect(56, 158, 144, 16);
}

function slugMural(c: Ctx): void {
  c.fillStyle = '#ff8a1f';
  c.fillRect(0, 0, MURAL, MURAL);
  // Chequered stripe across the top.
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 22; col++) {
      c.fillStyle = (row + col) % 2 ? '#ffffff' : '#111111';
      c.fillRect(col * 12, row * 12, 12, 12);
    }
  }
  // Speed lines.
  c.strokeStyle = '#ffffff';
  c.lineWidth = 4;
  for (const y of [110, 132, 154, 176]) {
    c.beginPath();
    c.moveTo(8, y);
    c.lineTo(10 + (y % 3) * 8, y);
    c.stroke();
  }
  // Slug body, head, eye.
  c.fillStyle = '#7a8b3a';
  c.beginPath();
  c.ellipse(128, 150, 85, 38, 0, 0, Math.PI * 2);
  c.fill();
  disc(c, 206, 132, 16, '#7a8b3a');
  disc(c, 214, 124, 6, '#ffffff');
  disc(c, 216, 124, 3, '#111111');
  // The number 7 on its side.
  c.fillStyle = '#ffffff';
  c.font = 'bold 56px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('7', 118, 152);
}

function flowersMural(c: Ctx): void {
  c.fillStyle = '#2e8b3a';
  c.fillRect(0, 0, MURAL, MURAL);
  // Sunflowers with stems.
  const sunflower = (x: number, y: number): void => {
    c.strokeStyle = '#1f6e2a';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, MURAL);
    c.stroke();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      c.save();
      c.translate(x, y);
      c.rotate(a);
      c.fillStyle = '#ffd21f';
      c.beginPath();
      c.ellipse(24, 0, 14, 7, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    disc(c, x, y, 16, '#6b3e12');
  };
  sunflower(56, 80);
  sunflower(188, 64);
  // Tulips.
  const tulip = (x: number, y: number): void => {
    c.strokeStyle = '#1f6e2a';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + 50);
    c.stroke();
    poly(c, [[x - 12, y], [x - 14, y - 22], [x - 6, y - 14], [x, y - 26], [x + 6, y - 14], [x + 14, y - 22], [x + 12, y]], '#ff4d6d');
  };
  tulip(110, 150);
  tulip(150, 140);
  // Watering can in the corner.
  c.strokeStyle = '#3f7fd6';
  c.lineWidth = 5;
  c.beginPath();
  c.arc(206, 200, 16, Math.PI, Math.PI * 2);
  c.stroke();
  c.fillStyle = '#3f7fd6';
  c.fillRect(180, 205, 48, 34);
  poly(c, [[180, 225], [150, 195], [156, 190], [184, 216]], '#3f7fd6');
}

/** Paints one mural into its 256 x 256 cell at the bottom of the atlas. */
function paintMural(c: Ctx, id: number): void {
  const ox = (id - 12) * MURAL, oy = MURAL_Y;
  const paint = [mowerMural, hatMural, slugMural, flowersMural][id - 12];
  c.save();
  c.translate(ox, oy);
  c.beginPath();
  c.rect(0, 0, MURAL, MURAL);
  c.clip();
  paint(c);
  c.restore();
}

/** Builds the sign atlas texture. */
export function buildSignAtlas(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS;
  canvas.height = ATLAS;
  const c = canvas.getContext('2d');
  if (c) {
    for (const def of SIGN_DEFS) paintSign(c, def);
    for (let id = 12; id < 16; id++) paintMural(c, id);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
