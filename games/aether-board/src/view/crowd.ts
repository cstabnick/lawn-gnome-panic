// Gnome life on the islands: spectator gnomes along the rims who cheer as you fly by (and go wild when you land
// near them), and giant spotted toadstools. A small pool of gnome models follows you down the chain (the island
// you are on and the next two), so the draw count stays flat however long the world is.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { PALETTE, type PhysEvent, type Player } from '../config';
import { surfaceY, type World } from '../world';
import { addOutline, toonify, toonMat } from './toon';

export interface Crowd {
  update(p: Player, dt: number, t: number, events: PhysEvent[]): void;
  /** Remove everything createCrowd added to the scene and free its GPU memory. */
  dispose(): void;
}

interface Spot { x: number; y: number; z: number; facing: number; island: number }

const PER_ISLAND = 5;
const POOL = PER_ISLAND * 3;
const HATS = [PALETTE.pink, PALETTE.cyan, PALETTE.lime, PALETTE.orange, PALETTE.purple, PALETTE.yellow];
const SHIRTS = [0x3a2a6a, PALETTE.cyan, PALETTE.pink, 0x2f64c9, PALETTE.mint, PALETTE.lilac];

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

/** Frees the GPU buffers and materials of everything under obj (three's dispose() is safe to repeat). */
function disposeTree(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (!(o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Line)) return;
    o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) m.dispose();
  });
}

export function createCrowd(scene: THREE.Scene, w: World): Crowd {
  const rnd = rng(w.seed * 7919 + 13);
  // Everything this crowd puts into the scene, so dispose() can take it out again.
  const owned: THREE.Object3D[] = [];
  const add = (o: THREE.Object3D): void => {
    scene.add(o);
    owned.push(o);
  };

  // ---- spectator spots: along the rims beside the exit kicker and down the sides, facing the riding line
  const spots: Spot[][] = w.islands.map((isl) => {
    const list: Spot[] = [];
    for (let i = 0; i < PER_ISLAND; i++) {
      // Spread down the whole run, near its edges (runs are long ellipses).
      const ra = isl.r * isl.stretch;
      const along = (-0.8 + 1.6 * ((i + rnd() * 0.8) / PER_ISLAND)) * ra;
      const half = isl.r * Math.sqrt(Math.max(0, 1 - (along / ra) ** 2));
      const side = (i % 2 === 0 ? 1 : -1) * half * (0.62 + 0.12 * rnd());
      const x = isl.cx + isl.dx * along + isl.dz * side;
      const z = isl.cz + isl.dz * along - isl.dx * side;
      const y = surfaceY(isl, x, z);
      if (y === null) continue;
      // Face the island's fall line (where the action is).
      const fx = isl.cx + isl.dx * along - x;
      const fz = isl.cz + isl.dz * along - z;
      list.push({ x, y, z, facing: Math.atan2(fx, fz), island: isl.id });
    }
    return list;
  });

  // ---- gnome pool
  interface Fan { model: GnomeModel; pose: PlayerState; phase: number; hype: number; spot: Spot | null }
  const fans: Fan[] = [];
  for (let i = 0; i < POOL; i++) {
    const look: GnomeLook = {
      ...GNORMAN_LOOK,
      hat: HATS[i % HATS.length], shirt: SHIRTS[(i * 5) % SHIRTS.length],
      beard: i % 3 === 0 ? null : 0xf4f4f4, glasses: i % 4 === 1, freckles: i % 3 === 2,
      hair: i % 3 === 0 ? { color: [0xe0a040, 0x7a4a2a, 0xff8fd1][i % 3], style: 'pigtails' } : null,
      dress: i % 3 === 0,
    };
    const model = createGnomeModel(look);
    toonify(model.object, 0.025);
    model.object.scale.setScalar(1.25);
    model.object.visible = false;
    add(model.object);
    fans.push({
      model, phase: i * 1.7, hype: 0, spot: null,
      pose: { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 },
    });
  }
  let assignedFor = -1;

  // ---- toadstools (instanced: stems, caps, spots, outlines)
  interface Shroom { x: number; y: number; z: number; s: number; rot: number; cap: number }
  const shrooms: Shroom[] = [];
  for (const isl of w.islands) {
    const ra = isl.r * isl.stretch;
    const n = Math.round((3 + rnd() * 2) * isl.stretch * 1.5);
    for (let i = 0; i < n; i++) {
      // Along the run's edges, all the way down.
      const al = (rnd() * 2 - 1) * ra * 0.9;
      const half = isl.r * Math.sqrt(Math.max(0, 1 - (al / ra) ** 2));
      const sd = (rnd() < 0.5 ? -1 : 1) * half * (0.7 + 0.2 * rnd());
      const x = isl.cx + isl.dx * al + isl.dz * sd;
      const z = isl.cz + isl.dz * al - isl.dx * sd;
      // Keep the riding line (the downhill corridor to the exit kicker) and every kicker's surroundings clear.
      const along = (x - isl.cx) * isl.dx + (z - isl.cz) * isl.dz;
      const side = Math.abs((x - isl.cx) * isl.dz - (z - isl.cz) * isl.dx);
      if (along > -isl.r * 0.2 && side < 24) continue;
      if (isl.kickers.some((k) => Math.hypot(x - (k.x + Math.sin(k.yaw) * k.len * 0.5), z - (k.z + Math.cos(k.yaw) * k.len * 0.5)) < k.len + 10)) continue;
      const y = surfaceY(isl, x, z);
      if (y === null) continue;
      shrooms.push({ x, y, z, s: 1.6 + rnd() * 2.6, rot: rnd() * 6.28, cap: rnd() < 0.6 ? 0xff3f5a : rnd() < 0.5 ? PALETTE.cyan : PALETTE.purple });
    }
  }
  const stemGeo = new THREE.CylinderGeometry(0.28, 0.4, 1.6, 12);
  stemGeo.translate(0, 0.8, 0);
  const capGeo = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  capGeo.scale(1.1, 0.7, 1.1);
  capGeo.translate(0, 1.5, 0);
  const dotGeo = new THREE.SphereGeometry(0.16, 8, 6);
  const count = shrooms.length;
  const stems = new THREE.InstancedMesh(stemGeo, toonMat(0xfff4e0), count);
  const caps = new THREE.InstancedMesh(capGeo, toonMat(0xffffff), count);
  const stemLines = new THREE.InstancedMesh(stemGeo, (addOutline(new THREE.Mesh(stemGeo), 0.06).material as THREE.Material), count);
  const capLines = new THREE.InstancedMesh(capGeo, (addOutline(new THREE.Mesh(capGeo), 0.06).material as THREE.Material), count);
  const DOTS = 5;
  const dots = new THREE.InstancedMesh(dotGeo, toonMat(0xffffff), count * DOTS);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sv = new THREE.Vector3();
  const pv = new THREE.Vector3();
  const col = new THREE.Color();
  shrooms.forEach((sh, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), sh.rot);
    m.compose(pv.set(sh.x, sh.y - 0.1, sh.z), q, sv.setScalar(sh.s));
    stems.setMatrixAt(i, m);
    caps.setMatrixAt(i, m);
    stemLines.setMatrixAt(i, m);
    capLines.setMatrixAt(i, m);
    caps.setColorAt(i, col.setHex(sh.cap));
    for (let d = 0; d < DOTS; d++) {
      // White spots on the cap: points on the dome (radius 1.1 × 0.7 squash), in the shroom's frame.
      const a = sh.rot + d * 2.4 + 0.5;
      const el = 0.35 + (d % 3) * 0.3;
      const lx = Math.cos(a) * Math.cos(el) * 1.1;
      const lz = Math.sin(a) * Math.cos(el) * 1.1;
      const ly = 1.5 + Math.sin(el) * 0.7;
      m.compose(pv.set(sh.x + lx * sh.s, sh.y - 0.1 + ly * sh.s, sh.z + lz * sh.s), q.identity(), sv.setScalar(sh.s));
      dots.setMatrixAt(i * DOTS + d, m);
    }
  });
  for (const im of [stems, caps, stemLines, capLines, dots]) {
    im.instanceMatrix.needsUpdate = true;
    add(im);
  }
  if (caps.instanceColor) caps.instanceColor.needsUpdate = true;

  const playerPos = new THREE.Vector3();

  return {
    update(p, dt, t, events) {
      // Re-seat the pool on this island and the next two.
      if (p.island !== assignedFor) {
        assignedFor = p.island;
        let k = 0;
        for (let di = 0; di < 3; di++) {
          for (const s of spots[p.island + di] ?? []) {
            if (k >= fans.length) break;
            fans[k].spot = s;
            fans[k].hype = 0;
            k++;
          }
        }
        for (; k < fans.length; k++) fans[k].spot = null;
      }
      playerPos.copy(p.pos);
      let landed = false;
      for (const e of events) if (e.e === 'land' || e.e === 'trickDone' || e.e === 'warp') landed = true;

      for (const f of fans) {
        const s = f.spot;
        f.model.object.visible = s !== null;
        if (!s) continue;
        const d = Math.hypot(s.x - playerPos.x, s.y - playerPos.y, s.z - playerPos.z);
        // Hype: rises as you come close or fly over, spikes when you land a trick near them, then settles.
        const near = d < 45 ? 1 - d / 45 : 0;
        if (landed && d < 60) f.hype = 1;
        f.hype = Math.max(near * (p.mode === 'air' ? 1 : 0.6), f.hype - dt * 0.5);
        const hop = f.hype > 0.3 ? Math.abs(Math.sin(t * 9 + f.phase)) * 0.35 * f.hype : 0;
        f.pose.position.set(s.x, s.y + hop, s.z);
        // Turn toward you while you are near, else watch the line.
        const toward = Math.atan2(playerPos.x - s.x, playerPos.z - s.z);
        f.pose.facing = near > 0.05 ? toward : s.facing;
        f.model.update(f.pose, dt);
        const wave = Math.sin(t * 10 + f.phase);
        if (f.hype > 0.3) {
          f.model.arms.left.rotation.x = -2.5 + wave * 0.35;
          f.model.arms.right.rotation.x = -2.5 - wave * 0.35;
        } else {
          f.model.arms.right.rotation.x = -0.3 + Math.sin(t * 1.3 + f.phase) * 0.15;
        }
      }
    },
    dispose() {
      for (const o of owned) {
        scene.remove(o);
        disposeTree(o);
      }
      owned.length = 0;
    },
  };
}
