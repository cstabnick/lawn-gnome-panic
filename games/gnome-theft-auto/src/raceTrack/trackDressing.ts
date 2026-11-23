// Everything that stands around the Speedway: barriers (with colliders), grandstands built from the Great Spill's
// Tall-One junk, the start gantry, floodlights, sponsor boards, the pit garages, the Speedway Pay 'n' Glaze and the podium.
// All static prefabs go into one merged batch (a handful of draw calls); the gantry's start lamps are the only moving part.
import * as THREE from 'three';
import { buildPrefab, buildStaticPrefabs, type StaticPrefabPlacement } from '@lawn/prefabs';
import { glazeShopColliders } from '../glazeBay';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { tryInstantiate } from '../world';
import {
  BARRIER_GAPS, RACE_DESK, SPEEDWAY_GLAZE, TRACK, sampleAt, trackFrame, trackLength, type Deck,
} from './track';

export interface TrackDressing {
  /** Where the crowd stands (crowd.ts fills them). */
  decks: readonly Deck[];
  /** Per frame: the start lights show `lights` red lamps lit (0..5), or green when -1. */
  update(dt: number, px: number, pz: number, night: number, lights: number): void;
}

/** A deck in a prefab's own coordinates: surface height y, x and z ranges (front = +z). */
interface LocalDeck { y: number; x0: number; x1: number; z0: number; z1: number }

/** The grandstands' decks, as their prefabs are built (packages/prefabs/src/catalog/gta-race-track.ts). */
const STAND_DECKS: Record<string, LocalDeck[]> = {
  'speedway-book-stand': [
    { y: 3, x0: -11.5, x1: 11.5, z0: 3, z1: 7.6 },
    { y: 6, x0: -11.5, x1: 11.5, z0: -2, z1: 2.6 },
    { y: 9, x0: -11.5, x1: 11.5, z0: -7.6, z1: -2.4 },
  ],
  'speedway-sneaker-stand': [
    { y: 1, x0: -10, x1: 10, z0: 9.5, z1: 11 },
    { y: 2, x0: -10, x1: 10, z0: 8, z1: 9.5 },
    { y: 3, x0: -10, x1: 10, z0: 6.5, z1: 8 },
    { y: 4, x0: -10, x1: 10, z0: 5, z1: 6.5 },
    { y: 9, x0: -12, x1: -2, z0: -3, z1: 3 },
  ],
  'speedway-cooler-stand': [{ y: 11.5, x0: -7.5, x1: 7.5, z0: -4.5, z1: 4.5 }],
};

const BRANDS = [0xffd21f, 0xff7a00, 0x2f6b2a, 0xd8342c, 0x2f7fd1];
const L = (): number => trackLength();
const wrap = (s: number): number => ((s % L()) + L()) % L();
const inGap = (s: number, side: 'left' | 'right'): boolean =>
  BARRIER_GAPS.some((g) => g.side === side && wrap(s) >= g.from && wrap(s) <= g.to);
/** True when s lies in [from, to] on the lap (to may wrap past the line). */
const between = (s: number, from: number, to: number): boolean => {
  const w = wrap(s);
  return from <= to ? w >= from && w <= to : w >= from || w <= to;
};

/** World position and yaw of something `lat` m off the centre line at `s`, facing the track (its +z towards the road). */
function facing(s: number, lat: number): { x: number; z: number; yaw: number } {
  const p = sampleAt(s);
  const f = trackFrame(s, lat);
  const side = Math.sign(lat) || 1;
  return { x: f.x, z: f.z, yaw: Math.atan2(-side * p.nx, -side * p.nz) };
}

/** A yaw that lays a prefab's long x axis along the track at s. */
const alongYaw = (s: number): number => sampleAt(s).yaw - Math.PI / 2;

/** A local point (x, z) of something at (px, pz) turned by yaw, in world coordinates (three.js rotation.y). */
function local(px: number, pz: number, yaw: number, x: number, z: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [px + x * c + z * s, pz - x * s + z * c];
}

/** A collider of half sizes (hw, hd) round a point, top `h` above the ground there. */
function boxAround(x: number, z: number, hw: number, hd: number, h: number): Box {
  return { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, h: heightAt(x, z) + h };
}

/** Colliders along a straight piece from a to b (centre line), every `step` m, half width hw. */
function strip(boxes: Box[], ax: number, az: number, bx: number, bz: number, hw: number, h: number, step = 1.5): void {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    boxes.push(boxAround(ax + (bx - ax) * t, az + (bz - az) * t, hw, hw, h));
  }
}

export function buildTrackDressing(scene: THREE.Scene, boxes: Box[]): TrackDressing {
  const placed: StaticPrefabPlacement[] = [];
  const decks: Deck[] = [];
  /** Place a prefab on the ground at (x, z); `lift` raises it above the ground there. */
  const put = (id: string, x: number, z: number, yaw: number, extra: Partial<StaticPrefabPlacement> & { lift?: number } = {}): void => {
    const { lift = 0, ...rest } = extra;
    placed.push({ id, x, z, yaw, ...rest, y: heightAt(x, z) + lift });
  };

  // ---- Barriers ----------------------------------------------------------------------------------------------------
  // The pit wall: a Tall-One ruler along the right of the main straight, between the pit exit and the pit entry.
  const RULER = { from: 1194, to: 76 };
  // The north straight's outside: a giant garden hose instead of tyres.
  const HOSE = { from: 378, to: 520 };
  const off = TRACK.barrierOffset;
  for (let s = 0; s < L(); s += 1.6) {
    for (const side of ['left', 'right'] as const) {
      if (inGap(s, side)) continue;
      if (side === 'right' && between(s, RULER.from, RULER.to)) continue;
      if (side === 'left' && between(s, HOSE.from, HOSE.to)) continue;
      const f = trackFrame(s, side === 'left' ? off : -off);
      // Red and white in runs of five, like a kerb.
      put('speedway-tyre-stack', f.x, f.z, 0, { tint: Math.floor(s / 8) % 2 === 0 ? 0xd8342c : 0xf4f4f4 });
      boxes.push(boxAround(f.x, f.z, 0.62, 0.62, 0.9));
    }
  }
  for (let s = RULER.from; s < RULER.from + wrap(RULER.to - RULER.from); s += 30) {
    const len = Math.min(30, RULER.from + wrap(RULER.to - RULER.from) - s);
    if (len < 10) break;
    const a = trackFrame(s, -off), b = trackFrame(s + len, -off), m = trackFrame(s + len / 2, -off);
    put('speedway-ruler-wall', m.x, m.z, alongYaw(s + len / 2), { scale: len / 30 });
    strip(boxes, a.x, a.z, b.x, b.z, 0.45, 1.4);
  }
  for (let s = HOSE.from; s + 5 <= HOSE.to; s += 10) {
    const a = trackFrame(s, off), b = trackFrame(s + 10, off), m = trackFrame(s + 5, off);
    put('speedway-hose-run', m.x, m.z, Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2);
    strip(boxes, a.x, a.z, b.x, b.z, 0.7, 1.4);
  }

  // ---- Grandstands -------------------------------------------------------------------------------------------------
  const stand = (id: string, s: number, lat: number, scale = 1): void => {
    const f = facing(s, lat);
    const ground = heightAt(f.x, f.z);
    put(id, f.x, f.z, f.yaw, { scale });
    for (const d of STAND_DECKS[id] ?? []) {
      const [x, z] = local(f.x, f.z, f.yaw, ((d.x0 + d.x1) / 2) * scale, ((d.z0 + d.z1) / 2) * scale);
      decks.push({ x, z, y: ground + d.y * scale, yaw: f.yaw, w: (d.x1 - d.x0) * scale, d: (d.z1 - d.z0) * scale });
    }
    // The stand's body as a few colliders across its footprint (its prefab's size from its bounds).
    const b = new THREE.Box3().setFromObject(buildPrefab(id, { scale }));
    const hw = (b.max.x - b.min.x) / 2, hd = (b.max.z - b.min.z) / 2;
    const cz = (b.max.z + b.min.z) / 2;
    for (let x = -hw + 1.5; x <= hw - 1.5 + 1e-6; x += 3) {
      for (let z = -hd + 1.5; z <= hd - 1.5 + 1e-6; z += 3) {
        const [wx, wz] = local(f.x, f.z, f.yaw, x, z + cz);
        boxes.push(boxAround(wx, wz, 1.5, 1.5, b.max.y));
      }
    }
  };
  // Main straight, outside (south): the Book Stack by the line, the Sneaker before it; the Cooler on the north-east hairpin.
  stand('speedway-book-stand', 18, off + 3 + 8);
  stand('speedway-sneaker-stand', 1176, off + 3.5 + 11);
  stand('speedway-cooler-stand', 345, off + 3 + 5);
  // A second Book Stack on the outside of the east climb, looking down turn one.
  stand('speedway-book-stand', 150, off + 3 + 8, 0.8);

  // ---- The start gantry, floodlights, sponsor boards ---------------------------------------------------------------
  const g0 = sampleAt(0);
  put('speedway-gantry', g0.x, g0.z, g0.yaw);
  for (const lat of [11.5, -11.5]) {
    const p = trackFrame(0, lat);
    boxes.push(boxAround(p.x, p.z, 0.55, 0.55, 9));
  }
  const TOWERS: [number, 'left' | 'right'][] = [
    [70, 'left'], [200, 'right'], [300, 'right'], [440, 'right'], [580, 'left'], [700, 'right'], [860, 'left'], [1060, 'right'],
  ];
  for (const [s, side] of TOWERS) {
    const f = facing(s, (side === 'left' ? 1 : -1) * (off + 4));
    put('speedway-light-tower', f.x, f.z, f.yaw);
    boxes.push(boxAround(f.x, f.z, 1, 1, 16));
  }
  let brand = 0;
  for (let s = 30; s < L(); s += 46) {
    const side = (Math.round(s / 46) % 2 === 0 ? 'left' : 'right') as 'left' | 'right';
    if (inGap(s, side) || inGap(s - 4, side) || inGap(s + 4, side)) continue;
    if (side === 'right' && between(s, RULER.from - 5, RULER.to + 5)) continue;
    if (side === 'left' && between(s, HOSE.from - 5, HOSE.to + 5)) continue;
    if (TOWERS.some(([ts, tside]) => tside === side && Math.abs(wrap(ts - s + L() / 2) - L() / 2) < 10)) continue;
    const f = facing(s, (side === 'left' ? 1 : -1) * (off + 1.8));
    put('speedway-banner', f.x, f.z, f.yaw, { tint: BRANDS[brand++ % BRANDS.length], trim: 0x1d1d1d });
  }

  // ---- The Great Spill: the rest of the giant junk ---------------------------------------------------------------------
  // The hose rears up in a loop over the north straight, after the Rake-Handle Hop's landing.
  const arch = sampleAt(462);
  put('speedway-hose-arch', arch.x, arch.z, arch.yaw);
  for (const lat of [11.2, -11.2]) {
    const p = trackFrame(462, lat);
    boxes.push(boxAround(p.x, p.z, 0.8, 0.8, 2));
  }
  // The rake lies in the infield beside the hop, its handle pointing at the road.
  {
    const f = facing(405, -(off + 16));
    put('speedway-rake', f.x, f.z, f.yaw + Math.PI / 2);
  }
  // The frisbee leans up on its rim beside the Frisbee Crest.
  {
    const f = facing(985, off + 9);
    put('speedway-frisbee', f.x, f.z, f.yaw, { rot: [1.25, f.yaw, 0], lift: 6.6 });
    boxes.push(boxAround(f.x, f.z, 3, 3, 13));
  }
  // A toppled watering can in the infield of the east climb, a pencil stuck in the pan by the west bend, a tennis ball
  // and a beach ball rolled into the infield.
  const can = facing(235, -(off + 12));
  put('watering-can', can.x, can.z, can.yaw, { scale: 22, rot: [0, can.yaw, Math.PI / 2], lift: 4.5 });
  boxes.push(boxAround(can.x, can.z, 4, 4, 8));
  const pencil = facing(640, off + 14);
  put('tall-one-pencil', pencil.x, pencil.z, pencil.yaw);
  boxes.push(boxAround(pencil.x, pencil.z, 2.4, 2.4, 14));
  const ball = facing(720, -(off + 20));
  put('tennis-ball', ball.x, ball.z, 0.7, { scale: 30 });
  boxes.push(boxAround(ball.x, ball.z, 3, 3, 6));
  const beach = facing(1020, -(off + 14));
  put('beach-ball', beach.x, beach.z, 0.3, { scale: 12 });
  boxes.push(boxAround(beach.x, beach.z, 3, 3, 6));

  // ---- Pit lane: garages, the podium, the Speedway Pay 'n' Glaze -----------------------------------------------------------
  [714, 723, 732, 752, 761, 770].forEach((x, i) => {
    put('speedway-pit-garage', x, -399, 0, { tint: BRANDS[i % BRANDS.length] });
    boxes.push({ minX: x - 4, maxX: x + 4, minZ: -403, maxZ: -399.5, h: heightAt(x, -401) + 4.5 });
  });
  put('speedway-podium', RACE_DESK.x, RACE_DESK.z - 7, 0);
  put('trophy-cup', RACE_DESK.x, RACE_DESK.z - 7, 0, { scale: 5, lift: 1.5 });
  boxes.push(boxAround(RACE_DESK.x, RACE_DESK.z - 7, 3, 1, 1.5));
  const shop = tryInstantiate(scene, 'gta-pay-n-glaze', { footprint: SPEEDWAY_GLAZE.footprint }, SPEEDWAY_GLAZE.x, SPEEDWAY_GLAZE.z, SPEEDWAY_GLAZE.yaw);
  if (shop) boxes.push(...glazeShopColliders(shop));

  const batch = buildStaticPrefabs(placed, { name: 'speedway-dressing' });
  scene.add(batch);

  // ---- Start lamps: discs over the gantry's lenses, switched per frame ----------------------------------------------------
  const lampGeo = new THREE.CircleGeometry(0.34, 14);
  const lampMats = [0, 1, 2, 3, 4].map(() => new THREE.MeshBasicMaterial({ color: 0x2a0606 }));
  const gantryY = heightAt(g0.x, g0.z);
  for (let i = 0; i < 5; i++) {
    for (const face of [1, -1]) {
      const m = new THREE.Mesh(lampGeo, lampMats[i]);
      // Lamp 0 is the leftmost as seen from either side of the gantry.
      const [x, z] = local(g0.x, g0.z, g0.yaw, -face * (4 - 2 * i), face * 1.08);
      m.position.set(x, gantryY + 7.4, z);
      m.rotation.y = g0.yaw + (face > 0 ? 0 : Math.PI);
      scene.add(m);
    }
  }
  let shown = NaN;

  return {
    decks,
    update(_dt, _px, _pz, _night, lights) {
      if (lights === shown) return;
      shown = lights;
      lampMats.forEach((m, i) => m.color.setHex(lights < 0 ? 0x3cff6e : i < lights ? 0xff2a1a : 0x2a0606));
    },
  };
}
