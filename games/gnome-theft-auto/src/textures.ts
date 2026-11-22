// Procedural ground textures (self-generated, no assets): grass, asphalt, pavement, sand, forest floor, snow, ploughed
// farmland, Loch Moss peat and Tallgrass Commons meadow. Each is a 256 px tileable canvas; `planarUv` maps a flat ground
// mesh onto it by world position, so any road, wedge or patch tiles the same way whatever way it is laid.
import * as THREE from 'three';

export type GroundKind =
  | 'grass' | 'asphalt' | 'pavement' | 'sand' | 'forest' | 'snow' | 'farm' | 'moss' | 'meadow'
  // Epic 5 terrain paint (src/terrainPaint.ts): steep rock, packed trail dirt, shingle, river mud, pond ice.
  | 'rock' | 'dirt' | 'gravel' | 'mud' | 'ice';

const SIZE = 256;
/** World units one tile covers. */
export const TILE: Record<GroundKind, number> = {
  grass: 9, asphalt: 7, pavement: 5, sand: 12, forest: 9, snow: 10, farm: 14, moss: 10, meadow: 9,
  rock: 11, dirt: 8, gravel: 6, mud: 9, ice: 12,
};

/** A small deterministic random so every load looks the same. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/** `c` shifted lighter (amt > 0) or darker (amt < 0), 0..1. */
function shade(c: string, amt: number): string {
  const n = parseInt(c.slice(1), 16);
  const f = (v: number): number => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return hex((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255));
}

function make(kind: GroundKind): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = SIZE;
  cv.height = SIZE;
  const g = cv.getContext('2d');
  const r = rng(kind.length * 977 + kind.charCodeAt(0));
  if (g) {
    /** Draws `fn` at the tile and its 8 wrapped neighbours so edges match. */
    const wrap = (x: number, y: number, size: number, fn: (ox: number, oy: number) => void): void => {
      for (const ox of [-SIZE, 0, SIZE]) {
        if (x + ox < -size || x + ox > SIZE + size) continue;
        for (const oy of [-SIZE, 0, SIZE]) {
          if (y + oy < -size || y + oy > SIZE + size) continue;
          fn(ox, oy);
        }
      }
    };
    const dots = (n: number, rMin: number, rMax: number, colour: () => string, alpha: number): void => {
      for (let i = 0; i < n; i++) {
        const x = r() * SIZE, y = r() * SIZE, rad = rMin + r() * (rMax - rMin);
        g.globalAlpha = alpha * (0.5 + r() * 0.5);
        g.fillStyle = colour();
        wrap(x, y, rad, (ox, oy) => { g.beginPath(); g.arc(x + ox, y + oy, rad, 0, Math.PI * 2); g.fill(); });
      }
      g.globalAlpha = 1;
    };
    const lines = (n: number, len: number, w: number, colour: () => string, alpha: number, vertical = false): void => {
      g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const x = r() * SIZE, y = r() * SIZE;
        const a = vertical ? -Math.PI / 2 + (r() - 0.5) * 0.7 : r() * Math.PI * 2;
        const l = len * (0.5 + r());
        g.globalAlpha = alpha * (0.5 + r() * 0.5);
        g.strokeStyle = colour();
        g.lineWidth = w;
        wrap(x, y, l, (ox, oy) => {
          g.beginPath();
          g.moveTo(x + ox, y + oy);
          g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
          g.stroke();
        });
      }
      g.globalAlpha = 1;
    };
    const base = (c: string): void => { g.fillStyle = c; g.fillRect(0, 0, SIZE, SIZE); };
    const patches = (c: string, n: number, alpha: number, rad: number): void => dots(n, rad * 0.5, rad, () => c, alpha);

    switch (kind) {
      case 'grass': {
        const c = hex(0x5fae4a);
        base(c);
        patches(shade(c, -0.25), 22, 0.18, 34);
        patches(shade(c, 0.2), 18, 0.14, 30);
        lines(1500, 7, 1.4, () => shade(c, (r() - 0.5) * 0.6), 0.55, true);
        dots(160, 0.8, 1.6, () => (r() < 0.5 ? '#f4e9a6' : '#cfe38a'), 0.5);
        break;
      }
      case 'forest': {
        const c = hex(0x3d8a45);
        base(c);
        patches('#25552b', 26, 0.3, 36);
        patches('#6b5a35', 14, 0.22, 24);
        lines(500, 7, 1.3, () => shade(c, (r() - 0.5) * 0.5), 0.5, true);
        dots(520, 1.4, 3, () => ['#8a5a2a', '#b07a32', '#c9a23a', '#6e3d1f', '#a8582a'][Math.floor(r() * 5)], 0.75);
        lines(60, 14, 1.6, () => '#4a3320', 0.7);
        break;
      }
      case 'asphalt': {
        const c = hex(0x55555b);
        base(c);
        patches('#3b3b40', 14, 0.25, 40);
        patches('#6a6a70', 12, 0.18, 36);
        dots(2400, 0.5, 1.3, () => (r() < 0.5 ? '#8c8c92' : '#2e2e33'), 0.7);
        lines(5, 60, 1.2, () => '#202024', 0.55);
        patches('#222226', 4, 0.22, 16);
        break;
      }
      case 'pavement': {
        const c = hex(0xc9bfa8);
        base(c);
        patches('#b3a98f', 16, 0.3, 36);
        dots(1400, 0.5, 1.2, () => (r() < 0.5 ? '#8f866f' : '#e8e0cc'), 0.55);
        g.strokeStyle = '#7d7461';
        g.lineWidth = 2;
        g.globalAlpha = 0.8;
        for (const p of [0, SIZE / 2]) {
          g.beginPath(); g.moveTo(p, 0); g.lineTo(p, SIZE); g.stroke();
          g.beginPath(); g.moveTo(0, p); g.lineTo(SIZE, p); g.stroke();
        }
        g.globalAlpha = 1;
        lines(6, 30, 1, () => '#6a6250', 0.5);
        break;
      }
      case 'sand': {
        const c = hex(0xd9b87a);
        base(c);
        patches('#c7a566', 20, 0.25, 40);
        patches('#e8cc94', 16, 0.25, 36);
        for (let y = 0; y < SIZE; y += 9) {
          g.globalAlpha = 0.22;
          g.strokeStyle = y % 18 === 0 ? '#b8975a' : '#f0d9a2';
          g.lineWidth = 2;
          g.beginPath();
          const ph = r() * 6;
          for (let x = 0; x <= SIZE; x += 8) g.lineTo(x, y + Math.sin((x / SIZE) * Math.PI * 4 + ph) * 3);
          g.stroke();
        }
        g.globalAlpha = 1;
        dots(900, 0.5, 1.3, () => (r() < 0.5 ? '#a8854c' : '#f6e2b0'), 0.6);
        dots(30, 2, 4, () => '#9c8460', 0.8);
        break;
      }
      case 'snow': {
        const c = hex(0xe8f0f5);
        base(c);
        patches('#c9d8e6', 26, 0.3, 38);
        patches('#ffffff', 20, 0.4, 30);
        dots(500, 0.5, 1.2, () => '#ffffff', 0.9);
        dots(120, 0.6, 1.4, () => '#a9bdd3', 0.55);
        lines(14, 40, 1.4, () => '#b7c8da', 0.35);
        break;
      }
      case 'farm': {
        const c = hex(0x8fc24f);
        base(c);
        patches('#6f9c3a', 16, 0.2, 36);
        // Furrows: bands of alternating shade across the tile.
        for (let x = 0; x < SIZE; x += 32) {
          g.fillStyle = 'rgba(70,52,28,0.28)';
          g.fillRect(x + 8, 0, 10, SIZE);
          g.fillStyle = 'rgba(210,240,130,0.22)';
          g.fillRect(x + 20, 0, 6, SIZE);
        }
        lines(700, 6, 1.2, () => shade(c, (r() - 0.5) * 0.5), 0.5, true);
        dots(260, 1.2, 2.6, () => (r() < 0.5 ? '#6a8f2d' : '#a5d65d'), 0.7);
        break;
      }
      case 'moss': {
        const c = hex(0x2f6b5c);
        base(c);
        patches('#1f4d44', 28, 0.3, 36);
        patches('#4a3d2a', 14, 0.22, 26);
        patches(shade(c, 0.18), 16, 0.22, 28);
        lines(420, 6, 1.2, () => shade(c, (r() - 0.5) * 0.5), 0.5, true);
        dots(70, 1.2, 2.4, () => (r() < 0.5 ? '#8a9199' : '#6f767e'), 0.85);
        break;
      }
      case 'meadow': {
        const c = hex(0xb5d94a);
        base(c);
        patches(shade(c, -0.2), 20, 0.18, 34);
        patches(shade(c, 0.22), 16, 0.16, 30);
        lines(1300, 7, 1.4, () => shade(c, (r() - 0.5) * 0.6), 0.55, true);
        dots(120, 1.2, 2.2, () => '#ffffff', 0.85);
        dots(120, 1.2, 2.2, () => '#ffe04a', 0.85);
        break;
      }
      case 'rock': {
        const c = hex(0x8a8580);
        base(c);
        patches('#6e6a66', 22, 0.35, 40);
        patches('#a8a39c', 18, 0.3, 32);
        lines(40, 50, 1.6, () => '#55514d', 0.55);
        lines(30, 30, 1.2, () => '#b9b4ad', 0.4);
        dots(500, 0.6, 1.6, () => (r() < 0.5 ? '#5f5b57' : '#c4beb6'), 0.6);
        break;
      }
      case 'dirt': {
        const c = hex(0xa07a4f);
        base(c);
        patches('#8a6640', 20, 0.3, 36);
        patches('#b8916a', 16, 0.25, 30);
        lines(80, 40, 1.4, () => '#7a5836', 0.35, true);
        dots(900, 0.5, 1.4, () => (r() < 0.5 ? '#6e5032' : '#c9a57a'), 0.6);
        break;
      }
      case 'gravel': {
        const c = hex(0x9a958c);
        base(c);
        patches('#86817a', 16, 0.3, 30);
        dots(2600, 0.8, 2.2, () => ['#bdb7ac', '#77726b', '#a39b8d', '#d2cbbf', '#6a655f'][Math.floor(r() * 5)], 0.85);
        break;
      }
      case 'mud': {
        const c = hex(0x6b5134);
        base(c);
        patches('#523d27', 24, 0.35, 34);
        patches('#7f6444', 16, 0.3, 28);
        patches('#4a5a2e', 10, 0.2, 22);
        dots(400, 0.6, 1.6, () => (r() < 0.5 ? '#3f2f1e' : '#8c7350'), 0.55);
        break;
      }
      case 'ice': {
        const c = hex(0xbfe3f2);
        base(c);
        patches('#a6d4ea', 22, 0.35, 40);
        patches('#e6f6fc', 18, 0.4, 32);
        lines(30, 60, 1.2, () => '#ffffff', 0.55);
        lines(20, 40, 1, () => '#8fc1d9', 0.4);
        break;
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const cache = new Map<GroundKind, THREE.CanvasTexture>();
export function groundTexture(kind: GroundKind): THREE.CanvasTexture {
  let t = cache.get(kind);
  if (!t) {
    t = make(kind);
    cache.set(kind, t);
  }
  return t;
}

/** Give a flat ground geometry UVs from its world x/z, one tile per `tile` units (replaces any existing uv). */
export function planarUv(geo: THREE.BufferGeometry, tile: number): void {
  const p = geo.getAttribute('position');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / tile;
    uv[i * 2 + 1] = -p.getZ(i) / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
