import * as THREE from 'three';
import { allGnomeokemon, buildGnomeokemon } from '../prefabs/registry';
import { animateGiantDog, createGiantDog, createGnomeJesus } from '../snap/models';
import type { BestPhotoMap } from '../snap/storage';

export type RoomId = 'map' | 'hall' | 'archive' | 'darkroom' | 'office';

/** Left to right along the building. */
export const ROOM_ORDER: readonly RoomId[] = ['map', 'hall', 'archive', 'darkroom', 'office'];
export const ROOM_SPACING = 12.6;

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
function buildShell(g: THREE.Group, style: ShellStyle, firstRoom: boolean): THREE.PointLight {
  box(g, ROOM_W + 0.4, 0.3, ROOM_D + 0.4, style.floor, 0, -0.15, 0);
  // Floor planks.
  for (let i = -5; i <= 5; i++) box(g, 0.04, 0.02, ROOM_D, 0x000000, i * 1.1, 0.01, 0).material = mat(0x000000);
  box(g, ROOM_W + 0.4, ROOM_H, 0.3, style.wall, 0, ROOM_H / 2, BACK_Z - 0.15);
  box(g, ROOM_W + 0.4, 0.28, 0.12, style.trim, 0, 0.14, BACK_Z + 0.04);
  box(g, ROOM_W + 0.4, 0.2, 0.16, style.trim, 0, ROOM_H - 0.1, BACK_Z + 0.02);
  // Dado rail.
  box(g, ROOM_W, 0.08, 0.06, style.trim, 0, 1.2, BACK_Z + 0.02);

  const addDivider = (x: number): void => {
    // Wall with a doorway between z = 0.4 and z = 3.2.
    box(g, 0.3, ROOM_H, 4.9, style.wall, x, ROOM_H / 2, BACK_Z + 2.45);
    box(g, 0.3, ROOM_H, 1.3, style.wall, x, ROOM_H / 2, 3.85);
    box(g, 0.3, ROOM_H - 2.7, 2.8, style.wall, x, 2.7 + (ROOM_H - 2.7) / 2, 1.8);
    box(g, 0.36, 2.7, 0.14, style.trim, x, 1.35, 0.4);
    box(g, 0.36, 2.7, 0.14, style.trim, x, 1.35, 3.2);
    box(g, 0.36, 0.14, 2.94, style.trim, x, 2.72, 1.8);
  };
  addDivider(ROOM_W / 2 + 0.1);
  if (firstRoom) addDivider(-ROOM_W / 2 - 0.1);

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
  buildShell(g, { wall: 0x6e8f5c, floor: 0x7a5236, trim: 0x3d2a1b, light: 0xfff0d0, window: true }, false);

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
  buildShell(g, { wall: 0x4e6f86, floor: 0x6a4a30, trim: 0x2a3a4a, light: 0xe8f2ff }, true);
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
  buildShell(g, { wall: 0x5b4636, floor: 0x4a3322, trim: 0x2a1c12, light: 0xffe2b0, lightIntensity: 22 }, false);
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
  const light = buildShell(g, { wall: 0x4a1f1f, floor: 0x2a1a16, trim: 0x1a0f0c, light: 0xff3a2a, lightIntensity: 30 }, false);
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
  buildShell(g, { wall: 0x76688c, floor: 0x5a4a3a, trim: 0x2d2540, light: 0xfff0dc, window: true, windowColor: 0xffd2a0 }, false);
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

const BUILDERS: Record<RoomId, (g: THREE.Group) => RoomHandle> = {
  map: buildMapRoom,
  hall: buildHall,
  archive: buildArchive,
  darkroom: buildDarkroom,
  office: buildOffice,
};

export function buildRooms(scene: THREE.Scene, best: BestPhotoMap): RoomHandle[] {
  const handles: RoomHandle[] = [];
  ROOM_ORDER.forEach((id, i) => {
    const g = new THREE.Group();
    g.position.x = i * ROOM_SPACING;
    scene.add(g);
    const h = BUILDERS[id](g);
    h.refresh?.(best);
    handles.push(h);
  });

  // Ground outside the building and a night-time garden backdrop.
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(220, 60), new THREE.MeshLambertMaterial({ color: 0x2c4a2e }));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set((ROOM_ORDER.length / 2) * ROOM_SPACING - ROOM_SPACING / 2, -0.32, -12);
  scene.add(lawn);
  return handles;
}
