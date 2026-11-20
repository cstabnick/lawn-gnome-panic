import { buildPrefab } from '@lawn/prefabs';
import * as THREE from 'three';

/**
 * The Field Lab's surroundings: a street along the front of the lot, neighbours on both sides and a skyline behind. The
 * lab sits on a big, expensive lawn in the middle of town (Gnome Jesus is not broke). Pure scenery: nothing here moves
 * except the clouds.
 *
 * Layout in world space: the house centre is (cx, 0); the lot runs z -22..17; the street is in front (+z), the skyline
 * behind (-z).
 */

const matCache = new Map<number, THREE.MeshLambertMaterial>();
function mat(color: number): THREE.MeshLambertMaterial {
  let m = matCache.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    matCache.set(color, m);
  }
  return m;
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** One tile of a wall with windows (a 3 x 3 world-unit cell). Two variants per wall colour. */
const tileCache = new Map<string, THREE.CanvasTexture>();
function wallTile(color: string, variant: number): THREE.CanvasTexture {
  const key = `${color}:${variant}`;
  let tex = tileCache.get(key);
  if (!tex) {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 60, 64, 4);
    ctx.fillStyle = '#e9e2d0';
    ctx.fillRect(14, 12, 36, 38);
    ctx.fillStyle = variant === 0 ? '#9cc4e4' : '#f0d890';
    ctx.fillRect(17, 15, 30, 32);
    ctx.fillStyle = '#e9e2d0';
    ctx.fillRect(31, 15, 3, 32);
    ctx.fillRect(17, 30, 30, 3);
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tileCache.set(key, tex);
  }
  return tex;
}

function faceMaterial(color: string, variant: number, repeatX: number, repeatY: number): THREE.MeshLambertMaterial {
  const tex = wallTile(color, variant).clone();
  tex.needsUpdate = true;
  tex.repeat.set(Math.max(1, Math.round(repeatX)), Math.max(1, Math.round(repeatY)));
  return new THREE.MeshLambertMaterial({ map: tex });
}

function building(scene: THREE.Scene, x: number, z: number, w: number, d: number, h: number, wall: string, roof: number, variant: number): void {
  const geo = new THREE.BoxGeometry(w, h, d);
  const roofMat = mat(roof);
  const side = faceMaterial(wall, variant, d / 3, h / 3);
  const front = faceMaterial(wall, variant, w / 3, h / 3);
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z.
  const mesh = new THREE.Mesh(geo, [side, side, roofMat, roofMat, front, front]);
  mesh.position.set(x, h / 2 - 0.5, z);
  scene.add(mesh);
  // Rooftop box (stairwell or water tank) so skylines are not flat.
  const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, 2, d * 0.3), roofMat);
  top.position.set(x + w * 0.15, h - 0.5 + 1, z - d * 0.1);
  scene.add(top);
}

/**
 * A parked ride-on lawnmower (the prefab from the library), nose along the street. The town's traffic is mowers.
 * `gold` is the owner's: a gold mower with a halo floating over the seat.
 */
function mower(scene: THREE.Scene, x: number, z: number, color: number, facing: 1 | -1, gold = false, bike = false): THREE.Group {
  const g = new THREE.Group();
  // The town's traffic is a mix of ride-on mowers and push-mower bikes (the bike is the smaller of the two).
  const body = bike ? buildPrefab('push-mower-bike', { tint: color, scale: 2.1 }) : buildPrefab('ride-on-mower', { tint: color, scale: 2.3 });
  g.add(body);
  if (gold) {
    const top = new THREE.Box3().setFromObject(body).max.y;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 8, 20), new THREE.MeshBasicMaterial({ color: 0xffd23a }));
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, top + 0.5, -0.2);
    g.add(halo);
  }
  g.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2; // the prefab faces +z; park it along the street
  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

function streetLamp(scene: THREE.Scene, x: number, z: number): void {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 6), mat(0x2a2f33));
  pole.position.set(x, 2.1, z);
  scene.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), mat(0x2a2f33));
  arm.position.set(x, 4.7, z - 0.4);
  arm.rotation.y = Math.PI / 2;
  scene.add(arm);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.3), new THREE.MeshBasicMaterial({ color: 0xfff0b8 }));
  bulb.position.set(x, 4.6, z - 0.8);
  scene.add(bulb);
}

function roundTree(scene: THREE.Scene, x: number, z: number, s: number, color: number): void {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.28 * s, 2.2 * s, 6), mat(0x5a3a24));
  trunk.position.set(x, 0.6 * s, z);
  scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * s, 0), mat(color));
  crown.position.set(x, 2.6 * s, z);
  scene.add(crown);
}

export interface City {
  update(t: number): void;
}

export function buildCity(scene: THREE.Scene, cx: number): City {
  const rnd = seeded(2026);

  // Everything outside the lot is pavement; the lot's own lawn is built with the garden.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 520), mat(0x70767a));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.56, -80);
  scene.add(ground);

  // The street along the front: sidewalks, kerbs, asphalt, a dashed centre line.
  const road = (z0: number, z1: number, color: number, y: number): void => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(900, z1 - z0), mat(color));
    p.rotation.x = -Math.PI / 2;
    p.position.set(cx, y, (z0 + z1) / 2);
    scene.add(p);
  };
  road(17.5, 21, 0xb9b6ac, -0.49); // inner sidewalk
  road(21, 33, 0x33383d, -0.5); // asphalt
  road(33, 37, 0xb9b6ac, -0.49); // outer sidewalk
  for (const kz of [21, 33]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(900, 0.2, 0.3), mat(0xd9d6cc));
    kerb.position.set(cx, -0.42, kz);
    scene.add(kerb);
  }
  for (let i = -60; i <= 60; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.22), mat(0xf2c744));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(cx + i * 4.4, -0.49, 27);
    scene.add(dash);
  }
  // Zebra crossing at the lab's gate, so the walk from the street makes sense.
  for (let i = -4; i <= 4; i++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 5), mat(0xf2f2ee));
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(cx + i * 1.1, -0.48, 27);
    scene.add(stripe);
  }

  // Street furniture: lamps and trees on the inner sidewalk, parked mowers, and the owner's gold mower right by the gate.
  for (let i = -5; i <= 5; i++) {
    const x = cx + i * 16;
    if (Math.abs(x - cx) < 5) continue;
    streetLamp(scene, x, 19.2);
    if (i % 2 === 0) roundTree(scene, x + 8, 19.4, 1, i % 4 === 0 ? 0x3f8a3a : 0x4f9a42);
  }
  const mowerColors = [0xc0392b, 0x2e6fb8, 0xe9e5da, 0x3a3f46, 0x4aa36a, 0xd98a2b, 0x7a4cb0, 0x8a9aa8];
  for (let i = -6; i <= 6; i++) {
    const x = cx + i * 9.5 + (rnd() - 0.5) * 3;
    if (Math.abs(x - cx - 5) < 8) continue;
    if (rnd() < 0.35) continue;
    mower(scene, x, 23.4, mowerColors[Math.floor(rnd() * mowerColors.length)], 1, false, rnd() < 0.4);
    if (rnd() < 0.5 && Math.abs(x - cx) > 24) mower(scene, x + 4, 30.6, mowerColors[Math.floor(rnd() * mowerColors.length)], -1, false, rnd() < 0.4);
  }
  mower(scene, cx + 12, 23.4, 0xe8c050, 1, true);
  // A push-mower bike chained up near the gate, where everyone can see one.
  mower(scene, cx - 11, 22.6, 0x2e6fb8, 1, false, true);

  // Neighbours either side of the lot, shoulder to shoulder, with a skyline of towers behind.
  const walls = ['#b0654a', '#c9b48a', '#8a96a8', '#d8d0c0', '#9a6a5a', '#7e9a8a'];
  const roofs = [0x5a4a42, 0x6a6a6a, 0x4a4f55];
  let xr = cx + 27;
  let xl = cx - 27;
  for (let i = 0; i < 9; i++) {
    const wR = 9 + rnd() * 7;
    const wL = 9 + rnd() * 7;
    const hR = 12 + rnd() * 20;
    const hL = 12 + rnd() * 20;
    building(scene, xr + wR / 2, -6 - rnd() * 6, wR, 26 + rnd() * 6, hR, walls[i % walls.length], roofs[i % 3], i % 2);
    building(scene, xl - wL / 2, -6 - rnd() * 6, wL, 26 + rnd() * 6, hL, walls[(i + 3) % walls.length], roofs[(i + 1) % 3], (i + 1) % 2);
    xr += wR + 0.8;
    xl -= wL + 0.8;
  }
  // A second row across the street's far side would be behind the camera; instead, a row behind the lot.
  for (let i = -9; i <= 9; i++) {
    const w = 10 + rnd() * 8;
    building(scene, cx + i * 17 + (rnd() - 0.5) * 3, -34 - rnd() * 4, w, 14, 14 + rnd() * 22, walls[(i + 9) % walls.length], roofs[(i + 9) % 3], (i + 9) % 2);
  }
  // Towers in the haze.
  const tower = ['#6f8296', '#8a9aa8', '#5f7488', '#9aa6b0'];
  for (let i = -12; i <= 12; i++) {
    const w = 12 + rnd() * 12;
    const h = 30 + rnd() * 55;
    building(scene, cx + i * 22 + (rnd() - 0.5) * 8, -70 - rnd() * 40, w, w, h, tower[(i + 12) % tower.length], 0x4a5560, (i + 12) % 2);
  }
  // A couple of antennas on the tallest.
  for (const ax of [-44, 38, 110]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 28, 5), mat(0x555d66));
    a.position.set(cx + ax, 78, -96);
    scene.add(a);
  }

  // Back fence of the lot (hedge), so the lawn has an edge.
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(52, 2.2, 1.2), mat(0x2f6a34));
  hedge.position.set(cx, 0.6, -22.4);
  scene.add(hedge);
  for (const sx of [-26.4, 26.4]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 39), mat(0x2f6a34));
    side.position.set(cx + sx, 0.6, -2.5);
    scene.add(side);
  }

  // Clouds drifting very slowly.
  const clouds: THREE.Group[] = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group();
    const n = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + rnd() * 3, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
      puff.position.set(k * 5 - n * 2.5, rnd() * 1.5, rnd() * 3);
      puff.scale.y = 0.55;
      c.add(puff);
    }
    c.position.set(cx - 150 + i * 38 + rnd() * 20, 62 + rnd() * 30, -130 - rnd() * 40);
    scene.add(c);
    clouds.push(c);
  }

  return {
    update(t) {
      clouds.forEach((c, i) => {
        c.position.x += 0.004 * (1 + (i % 3));
        if (c.position.x > cx + 190) c.position.x = cx - 190;
      });
      void t;
    },
  };
}
