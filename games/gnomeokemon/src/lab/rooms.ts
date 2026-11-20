import * as THREE from 'three';
import { allGnomeokemon, buildGnomeokemon } from '../prefabs/registry';
import { animateGiantDog, createGiantDog, createGnomeJesus } from '../snap/models';
import type { BestPhotoMap } from '../snap/storage';

export type RoomId = 'map' | 'hall' | 'archive' | 'darkroom' | 'office';

/** A room cell of the house. 'storage' is scenery: the player never walks there. */
type CellId = RoomId | 'storage';

/**
 * The floor plan, seen from the front. Ground floor: Map Room, Lobby (front door), Archive.
 * Upstairs: Storeroom, Grading Office (over the lobby), Darkroom.
 */
export const ROOM_CELLS: Record<CellId, { col: number; row: number }> = {
  map: { col: 0, row: 0 },
  hall: { col: 1, row: 0 },
  archive: { col: 2, row: 0 },
  storage: { col: 0, row: 1 },
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
  window?: boolean;
  windowColor?: number;
}

/** Floor, back wall, the divider on the right (with a doorway) and a ceiling light. */
function buildShell(g: THREE.Group, style: ShellStyle, cell: { col: number; row: number }): THREE.PointLight {
  // A thick floor slab: it is also the ceiling of the room below.
  box(g, ROOM_W + 0.4, 0.5, ROOM_D + 0.4, style.floor, 0, -0.25, 0);
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

  if (style.window) {
    const wc = style.windowColor ?? 0xbfe6ff;
    for (const wx of [-3.6, 3.6]) {
      box(g, 2.1, 1.9, 0.1, style.trim, wx, 2.5, BACK_Z + 0.06);
      glow(g, 1.8, 1.6, wc, wx, 2.5, BACK_Z + 0.13);
      box(g, 0.07, 1.6, 0.06, style.trim, wx, 2.5, BACK_Z + 0.16);
      box(g, 1.8, 0.07, 0.06, style.trim, wx, 2.5, BACK_Z + 0.16);
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

function buildHall(g: THREE.Group): RoomHandle {
  buildShell(g, { wall: 0x6e8f5c, floor: 0x7a5236, trim: 0x3d2a1b, light: 0xfff0d0, window: true }, ROOM_CELLS.hall);

  sign(g, '🍄 FESCUE FIELD LAB', 5.6, 0.9, 0, 3.78, BACK_Z + 0.2, '#3d2a1b', '#ffcc33');
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
  const clockFace = cyl(g, 0.5, 0.5, 0.1, 0xf4ecd8, 4.6, 3.1, BACK_Z + 0.12, 20);
  clockFace.rotation.x = Math.PI / 2;
  const hand = box(g, 0.05, 0.36, 0.04, 0x222222, 4.6, 3.1, BACK_Z + 0.2);
  hand.geometry.translate(0, 0.16, 0);

  const jesus = createGnomeJesus();
  jesus.position.set(2.9, 0, -0.9);
  jesus.scale.setScalar(1.35);
  g.add(jesus);

  const dog = createGiantDog();
  dog.position.set(-3.2, 0, 0.4);
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
  buildShell(g, { wall: 0x4e6f86, floor: 0x6a4a30, trim: 0x2a3a4a, light: 0xe8f2ff }, ROOM_CELLS.map);
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
  buildShell(g, { wall: 0x5b4636, floor: 0x4a3322, trim: 0x2a1c12, light: 0xffe2b0, lightIntensity: 22 }, ROOM_CELLS.archive);
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
  box(g, 5.0, 0.9, 1.2, 0x2a1c18, -1.2, 0.45, 2.2);
  box(g, 5.2, 0.08, 1.4, 0x4a3328, -1.2, 0.94, 2.2);
  for (let i = 0; i < 3; i++) {
    box(g, 1.2, 0.1, 0.8, [0xd8c98a, 0x8a9aa8, 0xc88a7a][i], -2.6 + i * 1.4, 1.03, 2.2);
  }
  cyl(g, 0.05, 0.05, 1.8, 0x444444, 3.6, 1.0, 1.8, 6);
  box(g, 0.7, 0.5, 0.5, 0x333333, 3.6, 2.0, 1.8);
  box(g, 1.3, 0.08, 1.0, 0x2a1c18, 3.6, 0.1, 1.8);
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
  buildShell(g, { wall: 0x76688c, floor: 0x5a4a3a, trim: 0x2d2540, light: 0xfff0dc, window: true, windowColor: 0xffd2a0 }, ROOM_CELLS.office);
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
  for (const [cx, cz] of [[-5.2, -3.4], [-4.5, -3.4], [5.3, -3.4]] as const) {
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

function buildStoreroom(g: THREE.Group): RoomHandle {
  buildShell(g, { wall: 0x7a7060, floor: 0x4a3a2c, trim: 0x2a2218, light: 0xffe8c0, lightIntensity: 16, window: true, windowColor: 0x9ab0c0 }, ROOM_CELLS.storage);
  sign(g, '📦 STOREROOM', 4.4, 0.9, 0, 3.8, BACK_Z + 0.2, '#2a2218', '#d8c8a8');
  const rnd = seeded(5);
  // Crates and barrels.
  for (let i = 0; i < 7; i++) {
    const x = -5 + i * 1.1 + (rnd() - 0.5) * 0.3;
    const h = 0.6 + rnd() * 0.5;
    box(g, 0.9, h, 0.9, 0x9a7a4a, x, h / 2, -3.2 + (rnd() - 0.5) * 0.4).rotation.y = (rnd() - 0.5) * 0.4;
  }
  for (let i = 0; i < 3; i++) cyl(g, 0.45, 0.5, 1.0, 0x6a4a2a, 3.6 + i * 0.95, 0.5, -3 + (i % 2) * 0.5, 10);
  box(g, 1.0, 0.9, 1.0, 0x9a7a4a, 4.2, 1.45, -3.1);
  // A sheet-covered armchair and a tarp over something.
  box(g, 1.2, 0.8, 1.1, 0xe8e4d8, -3.6, 0.4, 1.4);
  const tarp = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.9, 6), mat(0x5a7a8a));
  tarp.position.set(2.4, 0.45, 0.8);
  g.add(tarp);
  plant(g, 5.4, 3.3, 0.9);
  return { update() {} };
}

const BUILDERS: Record<CellId, (g: THREE.Group) => RoomHandle> = {
  map: buildMapRoom,
  hall: buildHall,
  archive: buildArchive,
  darkroom: buildDarkroom,
  office: buildOffice,
  storage: buildStoreroom,
};

/** The front wall. The lab fades its materials out when the camera comes inside. */
export interface Facade {
  group: THREE.Group;
  materials: THREE.Material[];
}

function buildFacade(scene: THREE.Scene): Facade {
  const group = new THREE.Group();
  const materials: THREE.Material[] = [];
  const fmat = (color: number, basic = false): THREE.Material => {
    const m = basic
      ? new THREE.MeshBasicMaterial({ color, transparent: true })
      : new THREE.MeshLambertMaterial({ color, flatShading: true, transparent: true });
    materials.push(m);
    return m;
  };
  const fbox = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const siding = [fmat(0xd8c9a3), fmat(0xc9b88e)];
  const trim = fmat(0xf4efe0);
  const glass = fmat(0xffe9a8, true);
  const frontZ = ROOM_D / 2 + 0.25;
  for (const [id, c] of Object.entries(ROOM_CELLS) as [CellId, { col: number; row: number }][]) {
    const x = c.col * ROOM_SPACING;
    const y = c.row * FLOOR_SPACING;
    fbox(ROOM_W + 0.5, ROOM_H + 0.5, 0.3, siding[(c.col + c.row) % 2], x, y + ROOM_H / 2 - 0.1, frontZ);
    for (let i = 1; i < 6; i++) fbox(ROOM_W + 0.5, 0.04, 0.34, trim, x, y + i * 0.75, frontZ);
    if (id === 'hall') continue;
    for (const wx of [-3.2, 3.2]) {
      fbox(2.0, 1.9, 0.12, trim, x + wx, y + 2.2, frontZ + 0.18);
      fbox(1.7, 1.6, 0.14, glass, x + wx, y + 2.2, frontZ + 0.2);
      fbox(0.07, 1.6, 0.16, trim, x + wx, y + 2.2, frontZ + 0.22);
      fbox(1.7, 0.07, 0.16, trim, x + wx, y + 2.2, frontZ + 0.22);
    }
  }
  // The lobby: a front door flanked by windows.
  const hx = ROOM_CELLS.hall.col * ROOM_SPACING;
  const door = fmat(0x7a3a24);
  fbox(2.0, 3.2, 0.14, trim, hx, 1.6, frontZ + 0.18);
  fbox(1.7, 3.0, 0.2, door, hx, 1.5, frontZ + 0.22);
  fbox(1.2, 0.9, 0.22, fmat(0x5a2a18), hx, 2.2, frontZ + 0.24);
  fbox(0.14, 0.14, 0.24, fmat(0xffcc33), hx + 0.6, 1.4, frontZ + 0.28);
  fbox(2.6, 0.2, 1.2, fmat(0xb8b0a0), hx, -0.1, frontZ + 0.9);
  fbox(3.4, 0.2, 1.8, fmat(0xa8a090), hx, -0.3, frontZ + 1.3);
  for (const wx of [-3.6, 3.6]) {
    fbox(1.9, 1.9, 0.12, trim, hx + wx, 2.2, frontZ + 0.18);
    fbox(1.6, 1.6, 0.14, glass, hx + wx, 2.2, frontZ + 0.2);
    fbox(0.07, 1.6, 0.16, trim, hx + wx, 2.2, frontZ + 0.22);
    fbox(1.6, 0.07, 0.16, trim, hx + wx, 2.2, frontZ + 0.22);
  }
  // Name board over the door.
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
  const boardMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  materials.push(boardMat);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.9), boardMat);
  board.position.set(hx, 3.85, frontZ + 0.2);
  group.add(board);
  scene.add(group);
  return { group, materials };
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
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(260, 90), new THREE.MeshLambertMaterial({ color: 0x3f6a38 }));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(HOUSE_CENTER_X, -0.52, 0);
  scene.add(lawn);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 40), new THREE.MeshLambertMaterial({ color: 0xb8aa88 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(HOUSE_CENTER_X, -0.5, 25);
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
  for (let i = 0; i < 26; i++) {
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

export function buildRooms(scene: THREE.Scene, best: BestPhotoMap): { handles: RoomHandle[]; facade: Facade } {
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
