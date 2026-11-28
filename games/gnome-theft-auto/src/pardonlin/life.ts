// Pardonlin's moving life (E30): pigeons on the squares, swans on the Thymes, Continentals strolling and cycling the
// footpaths. app.ts creates it once and updates it every frame with the player's position.
import type * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { gnomeState, makeGnome } from '../gnomes';
import { heightAt, waterAt } from '../terrain';
import { animStride, newAnimClock, stepAnimClock, type AnimClock } from '../animStride';
import { pathPoints } from './layout';

export interface PardonlinLife {
  /** px, pz: the player (1e6 during a cutscene's hide). night: 0 day .. 1 night. */
  update(dt: number, px: number, pz: number, night: number): void;
}

export const PIGEON_SPOTS: readonly { x: number; z: number; n: number }[] = [
  { x: -1510, z: -240, n: 12 }, // the Grand Platz
  { x: -1520, z: -340, n: 8 }, // the Bean Tower garden
  { x: -1522, z: 180, n: 8 }, // Teacup Row
  { x: -1733, z: 150, n: 10 }, // the Beetle Market
  { x: -1500, z: 1030, n: 8 }, // Basin Quay
];

/** A flock flushes when the player comes this close (m) to any of its birds. */
const FLUSH_RANGE = 4;
/** Flight speed (m/s) for flushing and landing. */
const FLY_SPEED = 6;
/** How far out (m) a flushed bird heads, away from the player. */
const FLUSH_DIST = 10;
/** Night (0..1) above which flocks roost, hidden. */
const ROOST_NIGHT = 0.6;
/** Beyond this distance (m) from the town centre the whole of life is hidden and skipped. */
const FAR_DIST = 600;
const TOWN_CENTRE = { x: -1600, z: 100 };
/** Swans glide at this speed (m/s) between these z values along the Thymes. */
const SWAN_SPEED = 0.6;
const SWAN_Z = { lo: -500, hi: 500 };
const WALK_SPEED = 1.1;
const CYCLE_SPEED = 4;

const CONTINENTAL_LOOKS: readonly Partial<GnomeLook>[] = [
  { hat: 0x1f2a44, shirt: 0xf5efe4, skin: 0xf1c27d },
  { hat: 0x7a1f2b, shirt: 0x1f4f8f, skin: 0xe0ac69 },
  { hat: 0x2e4a2e, shirt: 0xf5efe4, skin: 0x8d5524 },
  { hat: 0x1f2a44, shirt: 0x1f4f8f, skin: 0xc68642 },
  { hat: 0x7a1f2b, shirt: 0xf5efe4, skin: 0xffdbac },
  { hat: 0x2e4a2e, shirt: 0x1f4f8f, skin: 0x5c3a21 },
];

const BASE_LOOK: GnomeLook = {
  hat: 0x1f2a44,
  shirt: 0xf5efe4,
  pants: 0x2c3e50,
  skin: 0xf1c27d,
  boots: 0x222222,
  beard: null,
  hair: null,
  freckles: false,
  dress: false,
  glasses: false,
  bowlCut: null,
};

/** Seeded PRNG (mulberry32): the same town every build, no Math.random. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Point3 { x: number; y: number; z: number }

/**
 * The point a flushed pigeon heads for: FLUSH_DIST metres from the bird, directly away from the player, at `height`.
 * A bird exactly on the player heads off along +x.
 */
export function flushTarget(bx: number, bz: number, px: number, pz: number, height: number): Point3 {
  let dx = bx - px;
  let dz = bz - pz;
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) {
    dx = 1;
    dz = 0;
  } else {
    dx /= d;
    dz /= d;
  }
  return { x: bx + dx * FLUSH_DIST, y: height, z: bz + dz * FLUSH_DIST };
}

// ---- Paths ----

interface Poly { pts: { x: number; z: number }[]; cum: number[]; len: number }

/** Drops repeated points and measures the arc length, so every segment has a direction. */
function makePoly(points: readonly { x: number; z: number }[]): Poly {
  const pts: { x: number; z: number }[] = [];
  for (const p of points) {
    const last = pts[pts.length - 1];
    if (!last || last.x !== p.x || last.z !== p.z) pts.push({ x: p.x, z: p.z });
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  return { pts, cum, len: cum[cum.length - 1] ?? 0 };
}

/** The part of a polyline between z = lo and z = hi (segments cut at the limits), in order. */
function clipZ(pts: [number, number][], lo: number, hi: number): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    if (az === bz) {
      if (az >= lo && az <= hi) out.push({ x: ax, z: az }, { x: bx, z: bz });
      continue;
    }
    const t0 = (lo - az) / (bz - az);
    const t1 = (hi - az) / (bz - az);
    const tmin = Math.max(0, Math.min(t0, t1));
    const tmax = Math.min(1, Math.max(t0, t1));
    if (tmin > tmax) continue;
    out.push({ x: ax + (bx - ax) * tmin, z: az + (bz - az) * tmin }, { x: ax + (bx - ax) * tmax, z: az + (bz - az) * tmax });
  }
  return out.length >= 2 ? out : pts.map(([x, z]) => ({ x, z }));
}

/** Position and unit direction at arc length s along a polyline (clamped to its ends). */
function pointAt(p: Poly, s: number): { x: number; z: number; tx: number; tz: number } {
  const t = Math.max(0, Math.min(p.len, s));
  let i = 0;
  while (i < p.pts.length - 2 && p.cum[i + 1] < t) i++;
  const seg = p.cum[i + 1] - p.cum[i];
  const f = seg > 0 ? (t - p.cum[i]) / seg : 0;
  const a = p.pts[i];
  const b = p.pts[i + 1] ?? a;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const d = Math.hypot(dx, dz) || 1;
  return { x: a.x + dx * f, z: a.z + dz * f, tx: dx / d, tz: dz / d };
}

/** A walker or swimmer on a polyline: goes end to end and back. */
interface Mover { poly: Poly; s: number; dir: 1 | -1; speed: number }

function advance(m: Mover, dt: number): void {
  m.s += m.dir * m.speed * dt;
  if (m.s >= m.poly.len) {
    m.s = m.poly.len;
    m.dir = -1;
  } else if (m.s <= 0) {
    m.s = 0;
    m.dir = 1;
  }
}

// ---- Pigeons ----

type BirdMode = 'peck' | 'flush' | 'circle' | 'land';

interface Bird {
  obj: THREE.Group;
  rand: () => number;
  /** Where the bird sits now (world). */
  x: number;
  y: number;
  z: number;
  /** Its home offset from the spot it lands back at. */
  ox: number;
  oz: number;
  mode: BirdMode;
  heading: number;
  roll: number;
  /** Flush and landing target, and circle state. */
  tx: number;
  ty: number;
  tz: number;
  circleTime: number;
  ang: number;
  radius: number;
  height: number;
  /** Peck nod and shuffle timers. */
  nodIn: number;
  nodLeft: number;
  shuffleIn: number;
  walkLeft: number;
}

interface Flock {
  spot: { x: number; z: number; n: number };
  birds: Bird[];
  roost: boolean;
}

/** A pigeon's offset from its spot: within 4.8 m. */
function landingOffset(rand: () => number): { ox: number; oz: number } {
  const a = rand() * Math.PI * 2;
  const r = 4.8 * Math.sqrt(rand());
  return { ox: Math.cos(a) * r, oz: Math.sin(a) * r };
}

function buildFlock(scene: THREE.Scene, spot: { x: number; z: number; n: number }, index: number): Flock {
  const birds: Bird[] = [];
  for (let i = 0; i < spot.n; i++) {
    const rand = seededRandom(index * 1000 + i + 1);
    const { ox, oz } = landingOffset(rand);
    const x = spot.x + ox;
    const z = spot.z + oz;
    const obj = buildPrefab('bird-pigeon', { lights: false });
    obj.position.set(x, heightAt(x, z), z);
    scene.add(obj);
    birds.push({
      obj, rand, x, y: heightAt(x, z), z, ox, oz,
      mode: 'peck', heading: rand() * Math.PI * 2, roll: 0,
      tx: x, ty: 0, tz: z, circleTime: 0, ang: 0, radius: 6, height: 0,
      nodIn: 1 + rand() * 2, nodLeft: 0, shuffleIn: 4 + rand() * 4, walkLeft: 0,
    });
  }
  return { spot, birds, roost: false };
}

function flyTowards(b: Bird, tx: number, ty: number, tz: number, dt: number): number {
  const dx = tx - b.x;
  const dy = ty - b.y;
  const dz = tz - b.z;
  const d = Math.hypot(dx, dy, dz);
  const step = Math.min(d, FLY_SPEED * dt);
  if (d > 1e-6) {
    b.x += (dx / d) * step;
    b.y += (dy / d) * step;
    b.z += (dz / d) * step;
    b.heading = Math.atan2(dx, dz);
  }
  return d;
}

function updateBird(b: Bird, flock: Flock, dt: number, time: number): void {
  const { spot } = flock;
  if (b.mode === 'peck') {
    const ground = heightAt(b.x, b.z);
    b.y = ground;
    // Shuffle: a 0.3 m step at 0.4 m/s, now and then, staying within 5 m of its landing offset.
    if (b.walkLeft > 0) {
      const step = Math.min(b.walkLeft, 0.4 * dt);
      b.x += Math.sin(b.heading) * step;
      b.z += Math.cos(b.heading) * step;
      b.walkLeft -= step;
      const hx = spot.x + b.ox - b.x;
      const hz = spot.z + b.oz - b.z;
      if (Math.hypot(hx, hz) > 5) b.heading = Math.atan2(hx, hz);
    } else {
      b.shuffleIn -= dt;
      if (b.shuffleIn <= 0) {
        b.shuffleIn = 4 + b.rand() * 4;
        b.walkLeft = 0.3;
        b.heading = b.rand() * Math.PI * 2;
      }
    }
    // Peck: a 0.15 s nod every 1-3 s.
    if (b.nodLeft > 0) b.nodLeft -= dt;
    else {
      b.nodIn -= dt;
      if (b.nodIn <= 0) {
        b.nodLeft = 0.15;
        b.nodIn = 1 + b.rand() * 2;
      }
    }
    b.roll = 0;
    b.obj.position.set(b.x, ground, b.z);
    b.obj.rotation.set(b.nodLeft > 0 ? 0.3 : 0, b.heading, 0);
    return;
  }
  if (b.mode === 'flush') {
    if (flyTowards(b, b.tx, b.ty, b.tz, dt) < 0.3) {
      b.mode = 'circle';
      b.circleTime = 6 + b.rand() * 4;
      b.ang = Math.atan2(b.z - spot.z, b.x - spot.x);
      b.radius = Math.max(6, Math.hypot(b.x - spot.x, b.z - spot.z));
      b.height = b.ty;
    }
  } else if (b.mode === 'circle') {
    // One lap of the spot at its height, 1 rad/s.
    b.ang += dt;
    b.circleTime -= dt;
    b.x = spot.x + Math.cos(b.ang) * b.radius;
    b.z = spot.z + Math.sin(b.ang) * b.radius;
    b.y = b.height;
    b.heading = Math.atan2(-Math.sin(b.ang), Math.cos(b.ang));
    if (b.circleTime <= 0) {
      const { ox, oz } = landingOffset(b.rand);
      b.ox = ox;
      b.oz = oz;
      b.tx = spot.x + ox;
      b.tz = spot.z + oz;
      b.ty = heightAt(b.tx, b.tz);
      b.mode = 'land';
    }
  } else {
    if (flyTowards(b, b.tx, b.ty, b.tz, dt) < 0.1) {
      b.mode = 'peck';
      b.y = b.ty;
      b.heading = b.rand() * Math.PI * 2;
      b.nodIn = 1 + b.rand() * 2;
      b.shuffleIn = 4 + b.rand() * 4;
    }
  }
  // Wings: a quick roll wobble while airborne.
  b.roll = Math.sin(time * 22 + b.ox) * 0.3;
  b.obj.position.set(b.x, b.y, b.z);
  b.obj.rotation.set(0, b.heading, b.roll);
}

// ---- Life ----

interface Stroller {
  gnome: GnomeModel;
  clock: AnimClock;
  mover: Mover;
  bike?: THREE.Group;
  speed: number;
  seat: number;
}

export function createPardonlinLife(scene: THREE.Scene): PardonlinLife {
  const flocks = PIGEON_SPOTS.map((spot, i) => buildFlock(scene, spot, i));

  const swanPoly = makePoly(clipZ(pathPoints('thymes'), SWAN_Z.lo, SWAN_Z.hi));
  const swans = [0, 1, 2, 3].map((i) => {
    const obj = buildPrefab('bird-swan', { lights: false });
    scene.add(obj);
    return {
      obj,
      mover: { poly: swanPoly, s: (swanPoly.len * (i + 0.5)) / 4, dir: (i % 2 === 0 ? 1 : -1) as 1 | -1, speed: SWAN_SPEED },
      phase: i * 1.7,
    };
  });

  const strollers: Stroller[] = [];
  const walkPaths = ['trail/thymes-walk', 'trail/rive-gauche'].map((id) => makePoly(pathPoints(id).map(([x, z]) => ({ x, z }))));
  for (let i = 0; i < 9; i++) {
    const cyclist = i >= 6;
    const rand = seededRandom(5000 + i);
    const poly = walkPaths[i % 2];
    const look: GnomeLook = { ...BASE_LOOK, ...CONTINENTAL_LOOKS[i % CONTINENTAL_LOOKS.length] };
    const gnome = makeGnome(scene, look);
    const bike = cyclist ? buildPrefab('push-mower-bike', { lights: false }) : undefined;
    if (bike) scene.add(bike);
    strollers.push({
      gnome,
      clock: newAnimClock(i),
      mover: { poly, s: poly.len * rand(), dir: rand() < 0.5 ? 1 : -1, speed: cyclist ? CYCLE_SPEED : WALK_SPEED },
      bike,
      speed: cyclist ? CYCLE_SPEED : WALK_SPEED,
      seat: cyclist ? 0.55 : 0,
    });
  }

  let farHidden = false;
  let elapsed = 0;

  return {
    update(dt: number, px: number, pz: number, night: number): void {
      // A cutscene keeps everything still.
      if (px >= 1e5) return;
      const far = Math.hypot(px - TOWN_CENTRE.x, pz - TOWN_CENTRE.z) > FAR_DIST;
      if (far) {
        if (!farHidden) {
          farHidden = true;
          for (const f of flocks) for (const b of f.birds) b.obj.visible = false;
          for (const s of swans) s.obj.visible = false;
          for (const s of strollers) {
            s.gnome.object.visible = false;
            if (s.bike) s.bike.visible = false;
          }
        }
        return;
      }
      farHidden = false;

      elapsed += dt;
      const t = elapsed;

      // Pigeons: flush when the player comes close, roost at night once settled.
      for (const f of flocks) {
        const settled = f.birds.every((b) => b.mode === 'peck');
        f.roost = settled && night > ROOST_NIGHT;
        if (f.roost) {
          for (const b of f.birds) b.obj.visible = false;
          continue;
        }
        if (settled) {
          const close = f.birds.some((b) => Math.hypot(b.x - px, b.z - pz) < FLUSH_RANGE);
          if (close) {
            for (const b of f.birds) {
              b.mode = 'flush';
              b.height = 8 + b.rand() * 6;
              const target = flushTarget(b.x, b.z, px, pz, b.height);
              b.tx = target.x;
              b.ty = target.y;
              b.tz = target.z;
            }
          }
        }
        for (const b of f.birds) {
          b.obj.visible = true;
          updateBird(b, f, dt, t);
        }
      }

      // Swans glide along the Thymes at the water surface, bobbing.
      for (const s of swans) {
        advance(s.mover, dt);
        const p = pointAt(s.mover.poly, s.mover.s);
        const surface = waterAt(p.x, p.z)?.surface ?? heightAt(p.x, p.z) + 0.05;
        const bob = Math.sin(t * 2 + s.phase) * 0.03;
        s.obj.position.set(p.x, surface + bob, p.z);
        s.obj.rotation.set(0, Math.atan2(p.tx * s.mover.dir, p.tz * s.mover.dir), 0);
        s.obj.visible = true;
      }

      // Strollers and cyclists: pose is stepped on the animation LOD, movement every frame.
      for (const s of strollers) {
        advance(s.mover, dt);
        const p = pointAt(s.mover.poly, s.mover.s);
        const yaw = Math.atan2(p.tx * s.mover.dir, p.tz * s.mover.dir);
        const ground = heightAt(p.x, p.z);
        const y = ground + s.seat;
        if (s.bike) {
          s.bike.position.set(p.x, ground, p.z);
          s.bike.rotation.set(0, yaw, 0);
          s.bike.visible = true;
        }
        s.gnome.object.visible = true;
        const dist = Math.hypot(p.x - px, p.z - pz);
        const step = stepAnimClock(s.clock, dt, animStride(dist));
        if (step > 0) s.gnome.update(gnomeState(p.x, y, p.z, yaw, s.speed, s.seat > 0), step);
        else s.gnome.object.position.set(p.x, y, p.z);
      }
    },
  };
}
