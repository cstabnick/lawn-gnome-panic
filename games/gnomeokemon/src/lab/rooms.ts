import * as THREE from 'three';
import { allGnomeokemon, buildGnomeokemon } from '../prefabs/registry';
import { animateGiantDog, createGiantDog, createGnomeJesus } from '../snap/models';
import type { BestPhotoMap } from '../snap/storage';

export type RoomId = 'map' | 'hall' | 'archive' | 'dressing' | 'office' | 'darkroom';

/** A room cell of the house. */
type CellId = RoomId;

/**
 * The floor plan, seen from the front. Ground floor: Map Room, Lobby (front door), Archive.
 * Upstairs (up the lobby's staircase): Dressing Room, Grading Office (over the lobby), Darkroom.
 */
export const ROOM_CELLS: Record<CellId, { col: number; row: number }> = {
  map: { col: 0, row: 0 },
  hall: { col: 1, row: 0 },
  archive: { col: 2, row: 0 },
  dressing: { col: 0, row: 1 },
  office: { col: 1, row: 1 },
  darkroom: { col: 2, row: 1 },
};
export const ROOM_SPACING = 12.6;
export const FLOOR_SPACING = 4.9;
export const COLS = 3;
const ROWS = 2;

/** World position of a room's floor centre. */
export function roomOrigin(id: CellId): { x: number; y: number } {
  const c = ROOM_CELLS[id];
  return { x: c.col * ROOM_SPACING, y: c.row * FLOOR_SPACING };
}

/** Centre of the whole house in x, and its top (roof base) in y. */
export const HOUSE_CENTER_X = ((COLS - 1) * ROOM_SPACING) / 2;
export const HOUSE_TOP_Y = (ROWS - 1) * FLOOR_SPACING + 4.4 + 0.3;

/** The staircase in the lobby (room-local x, z; it climbs along +x against the back wall). */
export const STAIR = { x0: -1.0, x1: 5.0, z: -3.6, width: 1.4, steps: 14 };
/** The opening in the Grading Office floor above the stairs. */
const STAIR_HOLE = { x0: 0.9, x1: 5.05, z0: -4.45, z1: -2.85 };
/** Room geometry the walker uses: where a person stands to look into a room, and where the doorways are. */
export const ROOM_VIEW_Z = 2.6;
export const DOOR_Z = 1.8;
export const EYE_HEIGHT = 2.0;
export const ROOM_HALF_W = 6.3;
/** The front door, in lobby-local x. */
export const FRONT_DOOR = { halfWidth: 0.95, height: 3.1 };
/** Z of the front wall's outer face. */
export const FRONT_WALL_Z = 5.0;

export interface RoomHandle {
  update(t: number, current: RoomId): void;
  refresh?(best: BestPhotoMap): void;
}

const ROOM_W = 12.4;
const ROOM_D = 9;
const ROOM_H = 4.4;
const BACK_Z = -ROOM_D / 2;

// --- small building blocks ---------------------------------------------------------------------------------------

const matCache = new Map<string, THREE.MeshLambertMaterial>();
function mat(color: number, emissive = 0): THREE.MeshLambertMaterial {
  const key = `${color}:${emissive}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    if (emissive) {
      m.emissive = new THREE.Color(emissive);
    }
    matCache.set(key, m);
  }
  return m;
}

function box(parent: THREE.Object3D, w: number, h: number, d: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function cyl(
  parent: THREE.Object3D,
  rTop: number,
  rBot: number,
  h: number,
  color: number,
  x: number,
  y: number,
  z: number,
  seg = 12,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function glow(parent: THREE.Object3D, w: number, h: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A wooden sign with text, as a plane facing +z. */
function sign(parent: THREE.Object3D, text: string, w: number, h: number, x: number, y: number, z: number, bg = '#4a3322', fg = '#ffcc33'): void {
  const tex = canvasTexture(512, Math.round((512 * h) / w), (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, ctx.canvas.width - 20, ctx.canvas.height - 20);
    ctx.fillStyle = fg;
    ctx.font = `800 ${Math.round(ctx.canvas.height * 0.46)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2 + 4, ctx.canvas.width - 40);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  m.position.set(x, y, z);
  parent.add(m);
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Scale a model so its tallest/widest side is `size`, standing on y = 0. */
function fitModel(obj: THREE.Object3D, size: number): void {
  const bb = new THREE.Box3().setFromObject(obj);
  const dim = bb.getSize(new THREE.Vector3());
  const k = size / Math.max(dim.x, dim.y, dim.z, 0.001);
  obj.scale.multiplyScalar(k);
  const bb2 = new THREE.Box3().setFromObject(obj);
  obj.position.y -= bb2.min.y;
}

interface ShellStyle {
  wall: number;
  floor: number;
  trim: number;
  light: number;
  lightIntensity?: number;
  /** Windows on the back wall at these local x (none by default). */
  windowXs?: number[];
  windowColor?: number;
}

interface ShellOptions {
  /** A hole in the floor (the stairwell). */
  hole?: { x0: number; x1: number; z0: number; z1: number };
  /** The front wall has the front door in it. */
  door?: boolean;
}

/** Floor, back wall, the divider on the right (with a doorway) and a ceiling light. */
function buildShell(g: THREE.Group, style: ShellStyle, cell: { col: number; row: number }, opts: ShellOptions = {}): THREE.PointLight {
  // A thick floor slab: it is also the ceiling of the room below. The stairwell is a hole in it.
  const X0 = -(ROOM_W + 0.4) / 2;
  const X1 = (ROOM_W + 0.4) / 2;
  const Z0 = -(ROOM_D + 0.4) / 2;
  const Z1 = (ROOM_D + 0.4) / 2;
  const slab = (x0: number, x1: number, z0: number, z1: number): void => {
    box(g, x1 - x0, 0.5, z1 - z0, style.floor, (x0 + x1) / 2, -0.25, (z0 + z1) / 2);
  };
  if (opts.hole) {
    const h = opts.hole;
    slab(X0, h.x0, Z0, Z1);
    slab(h.x1, X1, Z0, Z1);
    slab(h.x0, h.x1, Z0, h.z0);
    slab(h.x0, h.x1, h.z1, Z1);
  } else {
    slab(X0, X1, Z0, Z1);
  }
  if (cell.row === ROWS - 1) box(g, ROOM_W + 0.4, 0.3, ROOM_D + 0.4, style.trim, 0, ROOM_H + 0.15, 0);
  // Floor planks.
  for (let i = -5; i <= 5; i++) box(g, 0.04, 0.02, ROOM_D, 0x000000, i * 1.1, 0.01, 0).material = mat(0x000000);
  box(g, ROOM_W + 0.4, ROOM_H, 0.3, style.wall, 0, ROOM_H / 2, BACK_Z - 0.15);
  box(g, ROOM_W + 0.4, 0.28, 0.12, style.trim, 0, 0.14, BACK_Z + 0.04);
  box(g, ROOM_W + 0.4, 0.2, 0.16, style.trim, 0, ROOM_H - 0.1, BACK_Z + 0.02);
  // Dado rail.
  box(g, ROOM_W, 0.08, 0.06, style.trim, 0, 1.2, BACK_Z + 0.02);

  const addDivider = (x: number, solid = false): void => {
    if (solid) {
      // An outside wall: no doorway.
      box(g, 0.3, ROOM_H, ROOM_D + 0.3, 0x8a6a4a, x, ROOM_H / 2, 0);
      return;
    }
    // Wall with a doorway between z = 0.4 and z = 3.2.
    box(g, 0.3, ROOM_H, 4.9, style.wall, x, ROOM_H / 2, BACK_Z + 2.45);
    box(g, 0.3, ROOM_H, 1.3, style.wall, x, ROOM_H / 2, 3.85);
    box(g, 0.3, ROOM_H - 2.7, 2.8, style.wall, x, 2.7 + (ROOM_H - 2.7) / 2, 1.8);
    box(g, 0.36, 2.7, 0.14, style.trim, x, 1.35, 0.4);
    box(g, 0.36, 2.7, 0.14, style.trim, x, 1.35, 3.2);
    box(g, 0.36, 0.14, 2.94, style.trim, x, 2.72, 1.8);
  };
  addDivider(ROOM_W / 2 + 0.1, cell.col === COLS - 1);
  if (cell.col === 0) addDivider(-ROOM_W / 2 - 0.1, true);

  const wc = style.windowColor ?? 0xbfe6ff;
  for (const wx of style.windowXs ?? []) {
    box(g, 2.1, 1.9, 0.1, style.trim, wx, 2.5, BACK_Z + 0.06);
    glow(g, 1.8, 1.6, wc, wx, 2.5, BACK_Z + 0.13);
    box(g, 0.07, 1.6, 0.06, style.trim, wx, 2.5, BACK_Z + 0.16);
    box(g, 1.8, 0.07, 0.06, style.trim, wx, 2.5, BACK_Z + 0.16);
  }

  // The front wall (the camera stands just inside it), with the same windows as the outside shows.
  const FZ = ROOM_D / 2 + 0.1;
  if (opts.door) {
    const open = FRONT_DOOR.halfWidth;
    const w = ROOM_W / 2 + 0.2 - open;
    box(g, w, ROOM_H, 0.2, style.wall, -open - w / 2, ROOM_H / 2, FZ);
    box(g, w, ROOM_H, 0.2, style.wall, open + w / 2, ROOM_H / 2, FZ);
    box(g, open * 2, ROOM_H - FRONT_DOOR.height, 0.2, style.wall, 0, FRONT_DOOR.height + (ROOM_H - FRONT_DOOR.height) / 2, FZ);
  } else {
    box(g, ROOM_W + 0.4, ROOM_H, 0.2, style.wall, 0, ROOM_H / 2, FZ);
  }
  box(g, ROOM_W + 0.4, 0.28, 0.1, style.trim, 0, 0.14, FZ - 0.1);
  box(g, ROOM_W + 0.4, 0.2, 0.14, style.trim, 0, ROOM_H - 0.1, FZ - 0.08);
  for (const wx of opts.door ? [-3.6, 3.6] : [-3.2, 3.2]) {
    box(g, 2.0, 1.9, 0.08, style.trim, wx, 2.2, FZ - 0.1);
    const pane = glow(g, 1.7, 1.6, wc, wx, 2.2, FZ - 0.15);
    pane.rotation.y = Math.PI;
    for (const [bw, bh] of [[0.07, 1.6], [1.7, 0.07]] as const) {
      box(g, bw, bh, 0.05, style.trim, wx, 2.2, FZ - 0.18);
    }
  }

  // Hanging lamp.
  cyl(g, 0.02, 0.02, 0.9, 0x222222, 0, ROOM_H - 0.5, 0.5, 4);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.32, 12, 1, true), new THREE.MeshLambertMaterial({ color: style.trim, side: THREE.DoubleSide }));
  shade.position.set(0, ROOM_H - 1.05, 0.5);
  g.add(shade);
  glow(g, 0.34, 0.34, 0xfff0c0, 0, ROOM_H - 1.2, 0.5).rotation.x = -Math.PI / 2;

  const light = new THREE.PointLight(style.light, style.lightIntensity ?? 22, 16, 1.4);
  light.position.set(0, ROOM_H - 1.3, 0.8);
  g.add(light);
  return light;
}

function plant(g: THREE.Object3D, x: number, z: number, s = 1): void {
  cyl(g, 0.3 * s, 0.22 * s, 0.4 * s, 0xb5613a, x, 0.2 * s, z, 8);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.9 * s, 5), mat(0x4f9a3a));
    leaf.position.set(x + Math.cos(a) * 0.14 * s, 0.8 * s, z + Math.sin(a) * 0.14 * s);
    leaf.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
    g.add(leaf);
  }
}

// --- rooms -------------------------------------------------------------------------------------------------------

/** The lobby's staircase up to the Grading Office: solid treads along the back wall, with a banister. */
function buildStairs(g: THREE.Group): void {
  const n = STAIR.steps;
  const run = (STAIR.x1 - STAIR.x0) / n;
  const rise = FLOOR_SPACING / n;
  for (let i = 0; i < n; i++) {
    const h = rise * (i + 1);
    box(g, run, h, STAIR.width, i % 2 ? 0x9a6a3a : 0x8a5a2e, STAIR.x0 + run * (i + 0.5), h / 2, STAIR.z);
    box(g, run + 0.02, 0.05, STAIR.width + 0.1, 0xc8a070, STAIR.x0 + run * (i + 0.5), h + 0.01, STAIR.z);
  }
  // Banister along the open side, sloping with the treads, on posts.
  const railZ = STAIR.z + STAIR.width / 2 + 0.08;
  const slope = Math.atan2(FLOOR_SPACING, STAIR.x1 - STAIR.x0);
  const len = Math.hypot(FLOOR_SPACING, STAIR.x1 - STAIR.x0);
  const rail = box(g, len, 0.09, 0.09, 0x3d2a1b, (STAIR.x0 + STAIR.x1) / 2, FLOOR_SPACING / 2 + 1.0, railZ);
  rail.rotation.z = slope;
  for (let i = 0; i < n; i += 2) {
    const h = rise * (i + 1);
    box(g, 0.07, 1.0, 0.07, 0x3d2a1b, STAIR.x0 + run * (i + 0.5), h + 0.5, railZ);
  }
}

function buildHall(g: THREE.Group): RoomHandle {
  buildShell(g, { wall: 0x6e8f5c, floor: 0x7a5236, trim: 0x3d2a1b, light: 0xfff0d0, windowXs: [-3.6] }, ROOM_CELLS.hall, { door: true });
  buildStairs(g);

  sign(g, '🍄 FESCUE FIELD LAB', 4.4, 0.8, -2.7, 3.95, BACK_Z + 0.2, '#3d2a1b', '#ffcc33');
  // Rug.
  const rug = cyl(g, 3, 3, 0.04, 0xa8402c, 0.4, 0.03, 0.8, 32);
  cyl(g, 2.5, 2.5, 0.05, 0xb88a4a, 0.4, 0.04, 0.8, 32);
  rug.receiveShadow = true;
  // Reception desk.
  box(g, 3.4, 1.05, 1.1, 0x5a3a24, 2.9, 0.52, -1.9);
  box(g, 3.6, 0.1, 1.3, 0x8a5a36, 2.9, 1.08, -1.9);
  box(g, 0.5, 0.3, 0.4, 0x2a3a4a, 3.8, 1.28, -1.9);
  cyl(g, 0.12, 0.12, 0.3, 0xdddddd, 2.2, 1.28, -1.9, 8);
  // Bench + coat rack with hats.
  box(g, 2.4, 0.12, 0.7, 0x7a5236, -3.6, 0.5, -3.2);
  for (const lx of [-4.6, -2.6]) box(g, 0.12, 0.5, 0.6, 0x3d2a1b, lx, 0.25, -3.2);
  cyl(g, 0.05, 0.05, 2.1, 0x3d2a1b, -5.3, 1.05, -3.6, 6);
  for (let i = 0; i < 3; i++) {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), mat([0xd8372c, 0x2d6cd8, 0xf2b630][i]));
    hat.position.set(-5.3 + (i - 1) * 0.22, 2.1 - i * 0.04, -3.6 + (i % 2) * 0.1);
    hat.rotation.z = (i - 1) * 0.5;
    g.add(hat);
  }
  plant(g, -5.4, -1.2, 1.2);
  plant(g, 5.5, 3.4, 1.1);

  // Clock.
  const clockFace = cyl(g, 0.5, 0.5, 0.1, 0xf4ecd8, -5.3, 3.2, BACK_Z + 0.12, 20);
  clockFace.rotation.x = Math.PI / 2;
  const hand = box(g, 0.05, 0.36, 0.04, 0x222222, -5.3, 3.2, BACK_Z + 0.2);
  hand.geometry.translate(0, 0.16, 0);

  const jesus = createGnomeJesus();
  jesus.position.set(2.9, 0, -0.9);
  jesus.scale.setScalar(1.35);
  g.add(jesus);

  const dog = createGiantDog();
  dog.position.set(-4.4, 0, 0.9);
  dog.rotation.y = 0.5;
  dog.scale.setScalar(0.65);
  g.add(dog);

  return {
    update(t) {
      animateGiantDog(dog, t, false);
      jesus.position.y = Math.sin(t * 2.1) * 0.03;
      jesus.rotation.y = -0.35 + Math.sin(t * 0.8) * 0.2;
      hand.rotation.z = -t * 0.5;
    },
  };
}

function buildMapRoom(g: THREE.Group): RoomHandle {
  buildShell(g, { wall: 0x4e6f86, floor: 0x6a4a30, trim: 0x2a3a4a, light: 0xe8f2ff, windowXs: [3.6] }, ROOM_CELLS.map);
  sign(g, '🗺️ SAFARI MAP ROOM', 5.4, 0.9, 0, 3.78, BACK_Z + 0.2, '#1c2c3a', '#9fd8ff');

  // Wall pinboard with polaroids.
  box(g, 5.6, 2.2, 0.1, 0x6b4b2b, 0, 2.0, BACK_Z + 0.08);
  box(g, 5.3, 1.9, 0.08, 0xc79a5c, 0, 2.0, BACK_Z + 0.14);
  const rnd = seeded(7);
  const polaroidColors = [0x8fd06a, 0xe6c36a, 0x4e8fa8, 0xd0654a, 0x7a6ad0, 0xbfe3f0, 0x9cc0d9];
  for (let i = 0; i < 7; i++) {
    const px = -2.4 + i * 0.8 + (rnd() - 0.5) * 0.15;
    const py = 2.0 + (rnd() - 0.5) * 0.9;
    const card = box(g, 0.56, 0.66, 0.02, 0xf4f4f0, px, py, BACK_Z + 0.2);
    card.rotation.z = (rnd() - 0.5) * 0.3;
    const pic = glow(g, 0.46, 0.42, polaroidColors[i], px, py + 0.06, BACK_Z + 0.215);
    pic.rotation.z = card.rotation.z;
  }

  // Big map table.
  const mapTex = canvasTexture(512, 256, (ctx) => {
    ctx.fillStyle = '#d9c79a';
    ctx.fillRect(0, 0, 512, 256);
    const blobs: [number, number, number, string][] = [
      [60, 130, 56, '#6fae4a'], [150, 80, 46, '#d9a45a'], [225, 150, 48, '#3f6f84'], [305, 90, 46, '#a8452e'],
      [370, 170, 46, '#2f8fb0'], [430, 80, 44, '#3a3a7a'], [470, 175, 36, '#bfe3f0'],
    ];
    for (const [x, y, r, c] of blobs) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#6b4b2b';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 130);
    [[150, 80], [225, 150], [305, 90], [370, 170], [430, 80], [470, 175]].forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.stroke();
  });
  box(g, 5.2, 0.9, 2.5, 0x5a3a24, 0, 0.45, 0.3);
  box(g, 5.5, 0.12, 2.8, 0x8a5a36, 0, 0.96, 0.3);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.4), new THREE.MeshLambertMaterial({ map: mapTex }));
  top.rotation.x = -Math.PI / 2;
  top.position.set(0, 1.03, 0.3);
  g.add(top);
  const pins: THREE.Mesh[] = [];
  const pinX = [-2.2, -1.35, -0.45, 0.45, 1.3, 2.15, 2.7];
  const pinZ = [0.5, -0.2, 0.55, -0.15, 0.7, -0.05, 0.9];
  const pinCol = [0x3fbf4a, 0xf2b630, 0x4aa0c8, 0xd8372c, 0x28a8d8, 0x6a5ad0, 0xe8f6ff];
  for (let i = 0; i < 7; i++) {
    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 8), mat(pinCol[i]));
    pin.rotation.x = Math.PI;
    pin.position.set(pinX[i], 1.28, pinZ[i]);
    g.add(pin);
    pins.push(pin);
  }
  // Globe on the side.
  cyl(g, 0.1, 0.25, 0.5, 0x3d2a1b, -4.8, 0.25, 1.5, 8);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), mat(0x3f8fb0));
  globe.position.set(-4.8, 1.15, 1.5);
  g.add(globe);
  for (let i = 0; i < 4; i++) {
    const land = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), mat(0x6fae4a));
    const a = i * 1.7;
    land.position.set(Math.cos(a) * 0.55, Math.sin(i) * 0.3, Math.sin(a) * 0.55);
    globe.add(land);
  }
  plant(g, 5.3, 3.4, 1);

  return {
    update(t) {
      globe.rotation.y = t * 0.5;
      pins.forEach((p, i) => (p.position.y = 1.28 + Math.sin(t * 2 + i) * 0.06));
    },
  };
}

function buildArchive(g: THREE.Group): RoomHandle {
  buildShell(g, { wall: 0x5b4636, floor: 0x4a3322, trim: 0x2a1c12, light: 0xffe2b0, lightIntensity: 22, windowXs: [] }, ROOM_CELLS.archive);
  sign(g, '📖 GNOMOKEDEX ARCHIVE', 5.8, 0.9, 0, 3.8, BACK_Z + 0.2, '#2a1c12', '#ffdc7a');

  // Bookshelves across the back wall.
  const rnd = seeded(42);
  const bookColors = [0xb23a2a, 0x2f6f4a, 0x2a4f8a, 0xc79a2a, 0x6a3a7a, 0x8a5a36, 0xd8d2c0];
  box(g, 11.6, 2.9, 0.5, 0x3a2616, 0, 1.6, BACK_Z + 0.3);
  for (let row = 0; row < 3; row++) {
    const y = 0.35 + row * 0.95;
    box(g, 11.6, 0.08, 0.55, 0x6a4a2a, 0, y, BACK_Z + 0.34);
    let x = -5.5;
    while (x < 5.4) {
      const w = 0.16 + rnd() * 0.18;
      const h = 0.5 + rnd() * 0.32;
      box(g, w, h, 0.34, bookColors[Math.floor(rnd() * bookColors.length)], x + w / 2, y + 0.04 + h / 2, BACK_Z + 0.36);
      x += w + 0.02;
    }
  }
  // Ladder.
  for (const lx of [-5.2, -4.7]) box(g, 0.07, 3.0, 0.07, 0x8a5a36, lx, 1.5, BACK_Z + 0.7).rotation.x = 0.1;
  for (let i = 0; i < 6; i++) box(g, 0.6, 0.05, 0.06, 0x8a5a36, -4.95, 0.4 + i * 0.5, BACK_Z + 0.7 - i * 0.02);

  // Specimen pedestals with glass cases.
  const dex = allGnomeokemon();
  const picks = [dex[0], dex[Math.floor(dex.length * 0.3)], dex[Math.floor(dex.length * 0.6)], dex[dex.length - 1]];
  const specimens: THREE.Object3D[] = [];
  const xs = [-4.3, -1.45, 1.45, 4.3];
  picks.forEach((entry, i) => {
    const px = xs[i];
    cyl(g, 0.7, 0.8, 1.0, 0xcdbf9f, px, 0.5, 0.5, 10);
    box(g, 1.7, 0.1, 1.7, 0x8a7a5a, px, 1.03, 0.5);
    const holder = new THREE.Group();
    holder.position.set(px, 1.08, 0.5);
    try {
      const m = buildGnomeokemon(entry);
      fitModel(m, 1.05);
      holder.add(m);
    } catch {
      // A model that fails to build just leaves an empty case.
    }
    g.add(holder);
    specimens.push(holder);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.45, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.16, depthWrite: false }),
    );
    glass.position.set(px, 1.82, 0.5);
    g.add(glass);
    box(g, 0.5, 0.18, 0.04, 0xffcc33, px, 0.78, 1.37);
  });
  plant(g, 5.5, 3.3, 1.2);
  plant(g, -5.5, 3.4, 0.9);

  return {
    update(t) {
      specimens.forEach((s, i) => {
        s.rotation.y = t * 0.6 + i;
        s.position.y = 1.08 + Math.sin(t * 1.5 + i) * 0.03;
      });
    },
  };
}

function buildDarkroom(g: THREE.Group): RoomHandle {
  const light = buildShell(g, { wall: 0x4a1f1f, floor: 0x2a1a16, trim: 0x1a0f0c, light: 0xff3a2a, lightIntensity: 30 }, ROOM_CELLS.darkroom);
  sign(g, '🖼️ DARKROOM', 4.2, 0.9, 0, 3.8, BACK_Z + 0.2, '#1a0f0c', '#ff8a7a');

  // Clothesline with up to 7 prints.
  const lineY = 2.55;
  const line = box(g, 11, 0.025, 0.025, 0xddd2c0, 0, lineY, -0.8);
  line.position.y = lineY;
  box(g, 0.1, 3.4, 0.1, 0x1a0f0c, -5.6, 1.7, -0.8);
  box(g, 0.1, 3.4, 0.1, 0x1a0f0c, 5.6, 1.7, -0.8);

  const photoGroup = new THREE.Group();
  g.add(photoGroup);
  const photoPlanes: THREE.Mesh[] = [];
  let textures: THREE.Texture[] = [];
  const loader = new THREE.TextureLoader();

  const refresh = (best: BestPhotoMap): void => {
    for (const t of textures) t.dispose();
    textures = [];
    photoGroup.clear();
    photoPlanes.length = 0;
    const ranked = Object.values(best)
      .filter((p) => Boolean(p))
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 7);
    for (let i = 0; i < 7; i++) {
      const x = -4.6 + i * 1.53;
      const holder = new THREE.Group();
      holder.position.set(x, lineY - 0.5, -0.78);
      holder.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.05;
      const paper = box(holder, 1.4, 1.0, 0.03, 0xf4f4f0, 0, 0, 0);
      paper.castShadow = false;
      const p = ranked[i];
      if (p) {
        const tex = loader.load(p.dataUrl);
        tex.colorSpace = THREE.SRGBColorSpace;
        textures.push(tex);
        const img = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.82), new THREE.MeshBasicMaterial({ map: tex }));
        img.position.set(0, 0.02, 0.02);
        holder.add(img);
        photoPlanes.push(img);
      } else {
        glow(holder, 1.26, 0.82, 0x3a2a26, 0, 0.02, 0.02);
      }
      box(holder, 0.1, 0.18, 0.06, 0x7a5236, 0, 0.55, 0);
      photoGroup.add(holder);
    }
  };
  refresh({});

  // Developing trays and enlarger.
  box(g, 5.0, 0.9, 1.2, 0x2a1c18, -1.2, 0.45, -3.4);
  box(g, 5.2, 0.08, 1.4, 0x4a3328, -1.2, 0.94, -3.4);
  for (let i = 0; i < 3; i++) {
    box(g, 1.2, 0.1, 0.8, [0xd8c98a, 0x8a9aa8, 0xc88a7a][i], -2.6 + i * 1.4, 1.03, -3.4);
  }
  cyl(g, 0.05, 0.05, 1.8, 0x444444, 3.6, 1.0, -3.2, 6);
  box(g, 0.7, 0.5, 0.5, 0x333333, 3.6, 2.0, -3.2);
  box(g, 1.3, 0.08, 1.0, 0x2a1c18, 3.6, 0.1, -3.2);
  // Red safelight bulbs.
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4030 }));
  bulb.position.set(-5.0, 3.1, 1.0);
  g.add(bulb);

  return {
    refresh,
    update(t) {
      light.intensity = 30 + Math.sin(t * 7) * 1.2 + Math.sin(t * 13.1) * 1;
    },
  };
}

function buildOffice(g: THREE.Group): RoomHandle {
  buildShell(g, { wall: 0x76688c, floor: 0x5a4a3a, trim: 0x2d2540, light: 0xfff0dc, windowXs: [-3.6], windowColor: 0xffd2a0 }, ROOM_CELLS.office, { hole: STAIR_HOLE });
  // Rail around the stairwell.
  const railLen = STAIR_HOLE.x1 - STAIR_HOLE.x0;
  box(g, railLen, 0.07, 0.07, 0x3d2a1b, (STAIR_HOLE.x0 + STAIR_HOLE.x1) / 2, 0.95, STAIR_HOLE.z1);
  for (let i = 0; i <= 4; i++) box(g, 0.07, 0.95, 0.07, 0x3d2a1b, STAIR_HOLE.x0 + (railLen * i) / 4, 0.475, STAIR_HOLE.z1);
  box(g, 0.07, 0.07, STAIR_HOLE.z1 - STAIR_HOLE.z0, 0x3d2a1b, STAIR_HOLE.x0, 0.95, (STAIR_HOLE.z0 + STAIR_HOLE.z1) / 2);
  sign(g, '⚖️ GRADING OFFICE', 5.2, 0.9, 0, 3.8, BACK_Z + 0.2, '#2d2540', '#e8d6ff');

  // Big desk with Gnome Jesus behind it.
  box(g, 3.6, 0.9, 1.3, 0x4a3322, 0, 0.45, -1.4);
  box(g, 3.9, 0.1, 1.5, 0x7a5236, 0, 0.95, -1.4);
  box(g, 0.9, 0.04, 0.6, 0xf4f4f0, -0.8, 1.02, -1.3);
  cyl(g, 0.16, 0.16, 0.16, 0xc83a3a, 0.9, 1.08, -1.3, 10);
  const jesus = createGnomeJesus();
  jesus.position.set(0, 0, -2.5);
  jesus.scale.setScalar(1.45);
  g.add(jesus);
  // Filing cabinets.
  for (const [cx, cz] of [[-5.2, -3.4], [-4.5, -3.4]] as const) {
    box(g, 0.7, 1.5, 0.8, 0x8a9aa8, cx, 0.75, cz);
    for (let i = 0; i < 3; i++) box(g, 0.5, 0.04, 0.04, 0x333333, cx, 0.35 + i * 0.45, cz + 0.42);
  }
  // Trophy shelf.
  box(g, 3.0, 0.08, 0.5, 0x7a5236, -3.9, 2.0, BACK_Z + 0.3);
  const cups: THREE.Group[] = [];
  const cupColors = [0xcd7f32, 0xc0c0c0, 0xffcc33, 0xe8f6ff];
  for (let i = 0; i < 4; i++) {
    const cup = new THREE.Group();
    cyl(cup, 0.2, 0.1, 0.3, cupColors[i], 0, 0.28, 0, 10);
    cyl(cup, 0.12, 0.12, 0.05, 0x4a3322, 0, 0.05, 0, 8);
    cup.position.set(-4.9 + i * 0.65, 2.04, BACK_Z + 0.3);
    cup.visible = false;
    g.add(cup);
    cups.push(cup);
  }
  // Corkboard.
  box(g, 2.6, 1.6, 0.08, 0x6b4b2b, 3.9, 2.0, BACK_Z + 0.08);
  box(g, 2.4, 1.4, 0.06, 0xc79a5c, 3.9, 2.0, BACK_Z + 0.13);
  const rnd = seeded(9);
  for (let i = 0; i < 6; i++) {
    glow(g, 0.5, 0.4, [0xfff2a8, 0xffc0c0, 0xc0e8ff][i % 3], 3.9 - 0.85 + (i % 3) * 0.85, 2.3 - Math.floor(i / 3) * 0.6 + (rnd() - 0.5) * 0.1, BACK_Z + 0.18);
  }
  plant(g, 5.4, 3.3, 1.1);

  return {
    refresh(best) {
      const grades = new Set(Object.values(best).map((p) => p?.score?.grade));
      const has = (g2: string): boolean => grades.has(g2 as never);
      cups[0].visible = has('Bronze') || has('Silver') || has('Gold') || has('Divine');
      cups[1].visible = has('Silver') || has('Gold') || has('Divine');
      cups[2].visible = has('Gold') || has('Divine');
      cups[3].visible = has('Divine');
    },
    update(t) {
      jesus.position.y = Math.sin(t * 2.2) * 0.025;
      jesus.rotation.y = Math.sin(t * 0.7) * 0.25;
      cups.forEach((c, i) => (c.rotation.y = t * 0.8 + i));
    },
  };
}

/** Set by buildRooms: the picture shown in the Dressing Room mirror. */
let mirrorTexture: THREE.Texture | null = null;
let mirrorAspect = 2 / 3;

function buildDressing(g: THREE.Group): RoomHandle {
  buildShell(g, { wall: 0x8a6a8a, floor: 0x6a4a3a, trim: 0x3a2a3a, light: 0xffe4c8, lightIntensity: 24, windowXs: [4.2], windowColor: 0xd8c8f0 }, ROOM_CELLS.dressing);
  sign(g, '🪞 DRESSING ROOM', 4.8, 0.9, 0, 3.85, BACK_Z + 0.2, '#3a2a3a', '#ffd8f0');

  // Rug.
  cyl(g, 3.0, 3.0, 0.04, 0x7a3a5a, 0, 0.03, 0.4, 32);
  cyl(g, 2.5, 2.5, 0.05, 0xa8688a, 0, 0.04, 0.4, 32);

  // The standing mirror: a gilt frame on two feet, tilted back a little. Its glass shows a picture of the photographer
  // pair drawn in a hidden scene (see photographer.ts), plus a faint diagonal shine.
  const stand = new THREE.Group();
  stand.position.set(0, 0, -2.5);
  stand.rotation.x = -0.05;
  g.add(stand);
  const mh = 3.1;
  const mw = mh * mirrorAspect;
  box(stand, mw + 0.34, mh + 0.34, 0.14, 0xc9a24a, 0, 0.95 + mh / 2 + 0.2, 0);
  box(stand, mw + 0.14, mh + 0.14, 0.16, 0x8a6a2a, 0, 0.95 + mh / 2 + 0.2, 0.01);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(mw, mh),
    new THREE.MeshBasicMaterial({ map: mirrorTexture ?? undefined, color: mirrorTexture ? 0xffffff : 0x9ab8d8 }),
  );
  glass.position.set(0, 0.95 + mh / 2 + 0.2, 0.11);
  stand.add(glass);
  const shine = new THREE.Mesh(
    new THREE.PlaneGeometry(mw * 0.35, mh * 1.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false }),
  );
  shine.position.set(-mw * 0.18, 0.95 + mh / 2 + 0.2, 0.115);
  shine.rotation.z = 0.35;
  stand.add(shine);
  for (const fx of [-mw / 2 - 0.1, mw / 2 + 0.1]) {
    box(stand, 0.14, 1.0, 0.14, 0x8a6a2a, fx, 0.5, 0.0);
    box(stand, 0.2, 0.08, 1.0, 0x8a6a2a, fx, 0.04, 0.2);
  }

  // Wardrobe, hat stand, dressing table and a tripod.
  box(g, 2.2, 3.3, 1.1, 0x6a4a30, -4.9, 1.65, -3.7);
  box(g, 0.05, 3.0, 0.05, 0x2a1c12, -4.9, 1.65, -3.12);
  cyl(g, 0.07, 0.07, 0.15, 0xc9a24a, -4.65, 1.6, -3.1, 6);
  cyl(g, 0.07, 0.07, 0.15, 0xc9a24a, -5.15, 1.6, -3.1, 6);
  cyl(g, 0.05, 0.05, 2.0, 0x3a2a3a, 4.9, 1.0, -1.6, 6);
  [0xd8372c, 0x2d6cd8, 0xf2b630, 0x4fbf4a].forEach((c, i) => {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), mat(c));
    hat.position.set(4.9 + (i % 2 ? 0.28 : -0.28), 1.85 - i * 0.2, -1.6);
    hat.rotation.z = (i % 2 ? -1 : 1) * 0.6;
    g.add(hat);
  });
  box(g, 2.4, 0.9, 0.9, 0x5a3a24, 4.6, 0.45, -3.8);
  box(g, 2.6, 0.08, 1.0, 0x8a5a36, 4.6, 0.94, -3.8);
  cyl(g, 0.1, 0.1, 0.3, 0xffd8f0, 3.9, 1.12, -3.8, 8);
  for (const tx of [-0.25, 0, 0.25]) {
    const leg = cyl(g, 0.025, 0.025, 1.5, 0x333333, 4.0 + tx, 0.7, 2.6 + (tx === 0 ? 0.3 : -0.1), 5);
    leg.rotation.z = -tx * 0.8;
  }
  box(g, 0.4, 0.26, 0.2, 0x333333, 4.0, 1.5, 2.6);
  plant(g, -5.5, 3.2, 1.1);

  return { update() {} };
}

const BUILDERS: Record<CellId, (g: THREE.Group) => RoomHandle> = {
  map: buildMapRoom,
  hall: buildHall,
  archive: buildArchive,
  darkroom: buildDarkroom,
  office: buildOffice,
  dressing: buildDressing,
};

/** The outside of the front wall. The house is closed; the only way in is the door, which the lab swings open. */
export interface Facade {
  /** Hinged at its left edge: rotation.y 0 = shut, about -1.5 = swung open outward. */
  door: THREE.Group;
  /** World x of the front door. */
  doorX: number;
}

function buildFacade(scene: THREE.Scene): Facade {
  const group = new THREE.Group();
  scene.add(group);
  const fbox = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const siding = [mat(0xd8c9a3), mat(0xc9b88e)];
  const trim = mat(0xf4efe0);
  const glass = new THREE.MeshBasicMaterial({ color: 0xcfe8f8 });
  const outerZ = ROOM_D / 2 + 0.35; // centre of the 0.3-thick siding (inner wall is 4.5..4.7)
  const hx = ROOM_CELLS.hall.col * ROOM_SPACING;
  const open = FRONT_DOOR.halfWidth;

  for (const id of Object.keys(ROOM_CELLS) as RoomId[]) {
    const c = ROOM_CELLS[id];
    const x = c.col * ROOM_SPACING;
    const y = c.row * FLOOR_SPACING;
    const m = siding[(c.col + c.row) % 2];
    if (id === 'hall') {
      const w = ROOM_W / 2 + 0.25 - open;
      fbox(w, ROOM_H + 0.5, 0.3, m, x - open - w / 2, y + ROOM_H / 2 - 0.1, outerZ);
      fbox(w, ROOM_H + 0.5, 0.3, m, x + open + w / 2, y + ROOM_H / 2 - 0.1, outerZ);
      fbox(open * 2, ROOM_H + 0.5 - FRONT_DOOR.height, 0.3, m, x, FRONT_DOOR.height + (ROOM_H + 0.5 - FRONT_DOOR.height) / 2 - 0.1, outerZ);
    } else {
      fbox(ROOM_W + 0.5, ROOM_H + 0.5, 0.3, m, x, y + ROOM_H / 2 - 0.1, outerZ);
    }
    for (let i = 1; i < 6; i++) {
      const ly = y + i * 0.75;
      if (id === 'hall' && ly < FRONT_DOOR.height + 0.4) {
        const gap = open + 0.2;
        const span = (ROOM_W + 0.5) / 2 - gap;
        fbox(span, 0.04, 0.34, trim, x - gap - span / 2, ly, outerZ);
        fbox(span, 0.04, 0.34, trim, x + gap + span / 2, ly, outerZ);
      } else {
        fbox(ROOM_W + 0.5, 0.04, 0.34, trim, x, ly, outerZ);
      }
    }
    for (const wx of id === 'hall' ? [-3.6, 3.6] : [-3.2, 3.2]) {
      fbox(2.0, 1.9, 0.12, trim, x + wx, y + 2.2, outerZ + 0.2);
      fbox(1.7, 1.6, 0.14, glass, x + wx, y + 2.2, outerZ + 0.22);
      fbox(0.07, 1.6, 0.16, trim, x + wx, y + 2.2, outerZ + 0.25);
      fbox(1.7, 0.07, 0.16, trim, x + wx, y + 2.2, outerZ + 0.25);
      // Window box with flowers.
      fbox(1.9, 0.28, 0.4, mat(0x6a4a2a), x + wx, y + 1.15, outerZ + 0.3);
      for (let k = 0; k < 5; k++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), mat([0xff6a8a, 0xffd23a, 0xc88aff, 0xff9a3a, 0xff6a8a][k]));
        f.position.set(x + wx - 0.7 + k * 0.35, y + 1.42, outerZ + 0.3);
        group.add(f);
      }
    }
  }

  // The door frame, the door itself (hinged on its left edge), a knob, steps and the name board.
  fbox(0.12, FRONT_DOOR.height + 0.1, 0.4, trim, hx - open - 0.04, FRONT_DOOR.height / 2, outerZ + 0.1);
  fbox(0.12, FRONT_DOOR.height + 0.1, 0.4, trim, hx + open + 0.04, FRONT_DOOR.height / 2, outerZ + 0.1);
  fbox(open * 2 + 0.3, 0.14, 0.4, trim, hx, FRONT_DOOR.height + 0.05, outerZ + 0.1);
  const door = new THREE.Group();
  door.position.set(hx - open, 0, ROOM_D / 2 + 0.2);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(open * 2, FRONT_DOOR.height - 0.05, 0.12), mat(0x7a3a24));
  panel.position.set(open, (FRONT_DOOR.height - 0.05) / 2, 0);
  door.add(panel);
  const inset = new THREE.Mesh(new THREE.BoxGeometry(open * 1.3, 0.9, 0.14), mat(0x5a2a18));
  inset.position.set(open, 2.25, 0);
  door.add(inset);
  const inset2 = new THREE.Mesh(new THREE.BoxGeometry(open * 1.3, 0.9, 0.14), mat(0x5a2a18));
  inset2.position.set(open, 0.95, 0);
  door.add(inset2);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0xffcc33));
  knob.position.set(open * 2 - 0.2, 1.4, 0.12);
  door.add(knob);
  group.add(door);
  fbox(2.6, 0.2, 1.2, mat(0xb8b0a0), hx, -0.1, outerZ + 1.0);
  fbox(3.4, 0.2, 1.8, mat(0xa8a090), hx, -0.3, outerZ + 1.5);
  // Porch lights either side of the door.
  for (const lx of [-1.6, 1.6]) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0b0 }));
    bulb.position.set(hx + lx, 2.9, outerZ + 0.3);
    group.add(bulb);
  }
  const tex = canvasTexture(512, 100, (ctx) => {
    ctx.fillStyle = '#3d2a1b';
    ctx.fillRect(0, 0, 512, 100);
    ctx.strokeStyle = '#ffcc33';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 88);
    ctx.fillStyle = '#ffcc33';
    ctx.font = '800 46px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FESCUE FIELD LAB', 256, 54, 480);
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.9), new THREE.MeshBasicMaterial({ map: tex }));
  board.position.set(hx, 3.85, outerZ + 0.2);
  group.add(board);
  return { door, doorX: hx };
}

function buildRoof(scene: THREE.Scene): void {
  const half = ROOM_D / 2 + 0.9;
  const shape = new THREE.Shape();
  shape.moveTo(-half, 0);
  shape.lineTo(half, 0);
  shape.lineTo(0, 3.6);
  shape.closePath();
  const length = COLS * ROOM_SPACING + 1.6;
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false }), mat(0x8a3a30));
  roof.rotation.y = -Math.PI / 2;
  roof.position.set(HOUSE_CENTER_X + length / 2, HOUSE_TOP_Y - 0.05, 0);
  scene.add(roof);
  // Ridge cap, chimney and an attic window.
  box(scene, length + 0.2, 0.2, 0.5, 0x5a2a24, HOUSE_CENTER_X, HOUSE_TOP_Y + 3.6, 0);
  box(scene, 1.3, 3.4, 1.3, 0x9a7a6a, HOUSE_CENTER_X + 9.5, HOUSE_TOP_Y + 3.0, -1.4);
  box(scene, 1.6, 0.25, 1.6, 0x6a5a50, HOUSE_CENTER_X + 9.5, HOUSE_TOP_Y + 4.8, -1.4);
}

function buildGarden(scene: THREE.Scene): void {
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(52, 39.5), new THREE.MeshLambertMaterial({ color: 0x3f6a38 }));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(HOUSE_CENTER_X, -0.52, -2.25);
  scene.add(lawn);
  // Path from the door to the gate (the sidewalk starts at z = 17.5).
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 12), new THREE.MeshLambertMaterial({ color: 0xb8aa88 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(HOUSE_CENTER_X, -0.5, 11.5);
  scene.add(path);
  const rnd = seeded(11);
  // Bushes along the front.
  for (let i = 0; i < 14; i++) {
    const x = HOUSE_CENTER_X - 17 + i * 2.6;
    if (Math.abs(x - HOUSE_CENTER_X) < 2.4) continue;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.8 + rnd() * 0.3, 8, 6), mat(0x2f7a3a));
    b.position.set(x, 0.2, ROOM_D / 2 + 3.4 + rnd() * 0.5);
    scene.add(b);
  }
  // Pine trees beside the house.
  const rightEdge = (COLS - 1) * ROOM_SPACING;
  [-9, -14, rightEdge + 9, rightEdge + 15].forEach((tx, i) => {
    const tz = -2 + (i % 2) * 5;
    cyl(scene, 0.35, 0.45, 3, 0x5a3a24, tx, 1, tz, 7);
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2 - k * 0.5, 2.8, 8), mat(0x2a6a34));
      cone.position.set(tx, 3.6 + k * 1.6, tz);
      scene.add(cone);
    }
  });
  // Picket fence with a gap for the path.
  for (let i = -16; i <= 16; i++) {
    if (Math.abs(i * 1.1) < 1.5) continue;
    box(scene, 0.18, 1.0, 0.1, 0xf4efe0, HOUSE_CENTER_X + i * 1.1, 0, 17);
  }
  // Flowers by the path.
  const colors = [0xff6a8a, 0xffd23a, 0xff9a3a, 0xc88aff];
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), mat(colors[i % colors.length]));
    f.position.set(HOUSE_CENTER_X + (i % 2 ? 1.7 : -1.7) + (rnd() - 0.5) * 0.4, -0.3, 9 + i * 0.9);
    scene.add(f);
  }
  // Lamp post and mailbox.
  cyl(scene, 0.06, 0.06, 2.6, 0x222222, HOUSE_CENTER_X + 3.4, 0.8, 10, 6);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0b0 }));
  lamp.position.set(HOUSE_CENTER_X + 3.4, 2.2, 10);
  scene.add(lamp);
  box(scene, 0.5, 0.4, 0.8, 0x3a5a8a, HOUSE_CENTER_X - 3.6, 0.9, 12);
  cyl(scene, 0.05, 0.05, 1.0, 0x5a3a24, HOUSE_CENTER_X - 3.6, 0.2, 12, 5);
}

export function buildRooms(
  scene: THREE.Scene,
  best: BestPhotoMap,
  mirror: { texture: THREE.Texture; aspect: number },
): { handles: RoomHandle[]; facade: Facade } {
  mirrorTexture = mirror.texture;
  mirrorAspect = mirror.aspect;
  const handles: RoomHandle[] = [];
  (Object.keys(ROOM_CELLS) as CellId[]).forEach((id) => {
    const g = new THREE.Group();
    const o = roomOrigin(id);
    g.position.set(o.x, o.y, 0);
    scene.add(g);
    const h = BUILDERS[id](g);
    h.refresh?.(best);
    handles.push(h);
  });
  buildRoof(scene);
  buildGarden(scene);
  return { handles, facade: buildFacade(scene) };
}
