// Turfton Getaway: a Gnome Party slice of Gnome Theft Auto.
// Four seats race tinted Zero-Turn Racers with auto-throttle from outside The Gnomecino (60, -30) through 5 Turfton
// checkpoints (Greenhouse Strip & Downtown) to the Pay 'n' Glaze arch (60, 120) while dodging 3 Hat Watch cruisers.
import * as THREE from 'three';
import { createGnomeModel, resolveLook, type GnomeLook, type GnomeModel, type PlayerRef, type PlayerState } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import {
  soleWinner,
  type MinigameDef,
  type MinigameView,
  type PadState,
  type SeatIndex,
  type SeatInfo,
  type SliceReport,
  type ViewCtx,
} from '@lawn/party';
import { angleDiff, clampToWorld, pushOutOfBoxes } from '../collide';
import {
  COLORS,
  DEFAULT_LOOK,
  GAME_ID,
  GNOMECINO,
  MOWER_TINTS,
  PAY_N_GLAZE,
  ROAD_WIDTH,
  SIDEWALK_WIDTH,
  VEHICLES,
  WATCH,
} from '../config';
import type { Box } from '../types';

const ROUND_S = 45;
const FINISH_GRACE_S = 12;
const CHECKPOINT_RADIUS = 8.2;
const CHECKPOINT_COUNT = 5;

const RACER_SPEC = VEHICLES['zero-turn'];
const CRUISER_SPEC = VEHICLES['hoa-van'];
const CRUISER_SPEED = 13.5;

// Turfton play bounds and city-block colliders around the race grid (x in [-120..120], z in [-60..180]).
const ARENA = { minX: -70, maxX: 70, minZ: -50, maxZ: 132 } as const;
const BLOCK_INSET = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 1.5; // 9 units from road centre line -> 18-unit corridors
const GRID_XS = [-120, -60, 0, 60] as const;
const GRID_ZS = [-60, 0, 60, 120] as const;

const BLOCKS: Box[] = [];
for (const xi of GRID_XS) {
  for (const zj of GRID_ZS) {
    BLOCKS.push({
      minX: xi + BLOCK_INSET,
      maxX: xi + 60 - BLOCK_INSET,
      minZ: zj + BLOCK_INSET,
      maxZ: zj + 60 - BLOCK_INSET,
      h: 24,
    });
  }
}

interface Checkpoint {
  x: number;
  z: number;
  yaw: number;
  name: string;
}

const CHECKPOINTS: readonly Checkpoint[] = [
  { x: 60, z: 40, yaw: 0, name: 'Greenhouse Strip' },
  { x: 15, z: 60, yaw: -Math.PI / 2, name: 'East Turfton' },
  { x: 0, z: 10, yaw: Math.PI, name: 'Downtown Plaza' },
  { x: -60, z: 75, yaw: 0, name: 'West Turfton' },
  { x: 60, z: 120, yaw: Math.PI / 2, name: "Pay 'n' Glaze" },
];

interface Patrol {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  startX: number;
  startZ: number;
  startYaw: number;
}

const CRUISER_PATROLS: readonly Patrol[] = [
  // Intersection (60, 60) -> (18, 60)
  { ax: 65, az: 60, bx: 18, bz: 60, startX: 46, startZ: 60, startYaw: Math.PI / 2 },
  // Downtown (0, 0) crossing
  { ax: -24, az: 0, bx: 18, bz: 0, startX: -14, startZ: 0, startYaw: Math.PI / 2 },
  // Pay 'n' Glaze (z = 120) strip
  { ax: 42, az: 120, bx: -45, bz: 120, startX: 30, startZ: 120, startYaw: -Math.PI / 2 },
];

const START_SPOTS: readonly [number, number][] = [
  [58.2, -32.0],
  [61.8, -32.0],
  [58.2, -28.0],
  [61.8, -28.0],
];

interface RacerState {
  x: number;
  z: number;
  yaw: number;
  /** Signed forward speed. */
  s: number;
  /** Knock slide velocity (x, z) and spin kick from bumps. */
  kx: number;
  kz: number;
  ks: number;
  /** Next checkpoint index 0..5 (5 = finished). */
  cp: number;
  /** Finish time in seconds, or null. */
  fin: number | null;
  /** Drift blend 0..1. */
  dr: number;
}

interface CruiserState {
  x: number;
  z: number;
  yaw: number;
  s: number;
  /** 0 = heading toward patrol B, 1 = heading toward patrol A. */
  wp: 0 | 1;
}

export interface GetawayState {
  t: number;
  firstFin: number | null;
  r: RacerState[];
  c: CruiserState[];
}

export interface GetawayInput {
  steer: number;
  drift: boolean;
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

// Bump constants matching games/gnome-theft-auto/src/vehicles.ts
const BUMP_RESTITUTION = 0.4;
const KNOCK_GRIP = 4.5;
const SPIN_GRIP = 3;
const SPIN_MAX = 4;
const REBOUND_MAX = 10;

function applyBump(
  ax: number,
  az: number,
  ayaw: number,
  as: number,
  akx: number,
  akz: number,
  ar: number,
  am: number,
  bx: number,
  bz: number,
  byaw: number,
  bs: number,
  bkx: number,
  bkz: number,
  br: number,
  bm: number,
): {
  dax: number;
  daz: number;
  dbx: number;
  dbz: number;
  ajx: number;
  ajz: number;
  aspin: number;
  bjx: number;
  bjz: number;
  bspin: number;
} | null {
  const dx = bx - ax;
  const dz = bz - az;
  const d = Math.hypot(dx, dz);
  const rr = ar + br;
  if (d >= rr) return null;
  const overlap = rr - d;
  let nx = 1;
  let nz = 0;
  if (d > 1e-6) {
    nx = dx / d;
    nz = dz / d;
  }
  const total = am + bm;
  const sa = (overlap * bm) / total;
  const sb = (overlap * am) / total;

  const vax = Math.sin(ayaw) * as + akx;
  const vaz = Math.cos(ayaw) * as + akz;
  const vbx = Math.sin(byaw) * bs + bkx;
  const vbz = Math.cos(byaw) * bs + bkz;
  const closingN = (vax - vbx) * nx + (vaz - vbz) * nz;
  if (closingN <= 0) {
    return {
      dax: -nx * sa,
      daz: -nz * sa,
      dbx: nx * sb,
      dbz: nz * sb,
      ajx: 0,
      ajz: 0,
      aspin: 0,
      bjx: 0,
      bjz: 0,
      bspin: 0,
    };
  }
  const jImp = ((1 + BUMP_RESTITUTION) * closingN) / (1 / am + 1 / bm);
  const spinOf = (yaw: number, r: number, m: number, sx: number, sz: number, jx: number, jz: number): number => {
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const front = fx * sx + fz * sz >= 0 ? 1 : -1;
    const rx = fx * r * 0.6 * front + sx * r * 0.4;
    const rz = fz * r * 0.6 * front + sz * r * 0.4;
    return (0.25 * (rz * jx - rx * jz)) / (0.5 * m * r * r);
  };
  const ajx = (-jImp * nx) / am;
  const ajz = (-jImp * nz) / am;
  const bjx = (jImp * nx) / bm;
  const bjz = (jImp * nz) / bm;
  return {
    dax: -nx * sa,
    daz: -nz * sa,
    dbx: nx * sb,
    dbz: nz * sb,
    ajx,
    ajz,
    aspin: spinOf(ayaw, ar, am, nx, nz, -jImp * nx, -jImp * nz),
    bjx,
    bjz,
    bspin: spinOf(byaw, br, bm, -nx, -nz, jImp * nx, jImp * nz),
  };
}

function kickRacer(r: RacerState, dx: number, dz: number, spinKick: number): void {
  const fx = Math.sin(r.yaw);
  const fz = Math.cos(r.yaw);
  const along = dx * fx + dz * fz;
  r.s = clamp(r.s + along, -REBOUND_MAX, RACER_SPEC.maxSpeed);
  r.kx += dx - along * fx;
  r.kz += dz - along * fz;
  r.ks = clamp(r.ks + spinKick, -SPIN_MAX, SPIN_MAX);
}

function clampToArena(x: number, z: number, radius: number): { x: number; z: number; hit: boolean } {
  const cx = clamp(x, ARENA.minX + radius, ARENA.maxX - radius);
  const cz = clamp(z, ARENA.minZ + radius, ARENA.maxZ - radius);
  const worldClamped = clampToWorld(cx, cz, 600, radius);
  return { x: worldClamped.x, z: worldClamped.z, hit: cx !== x || cz !== z || worldClamped.hit };
}

/** Progress score for sorting unfinished racers: higher is better. */
function progressKey(r: RacerState): [number, number, number] {
  if (r.fin !== null) return [1, CHECKPOINT_COUNT, -r.fin];
  const next = CHECKPOINTS[Math.min(r.cp, CHECKPOINT_COUNT - 1)];
  const dist = Math.hypot(next.x - r.x, next.z - r.z);
  return [0, r.cp, -dist];
}

function computePlaces(s: Readonly<GetawayState>): number[] {
  const keys = s.r.map(progressKey);
  return keys.map((a) =>
    keys.filter(
      (b) =>
        b[0] > a[0] ||
        (b[0] === a[0] && (b[1] > a[1] || (b[1] === a[1] && b[2] > a[2]))),
    ).length,
  );
}

function cpuTarget(r: Readonly<RacerState>, seat: SeatIndex): { x: number; z: number } {
  const lane = (seat - 1.5) * 1.1;
  switch (r.cp) {
    case 0:
      return { x: 60 + lane, z: 40 };
    case 1:
      return r.z < 52 ? { x: 60 + lane, z: 58 } : { x: 15, z: 60 + lane };
    case 2:
      return r.x > 8 ? { x: 2 + lane, z: 60 + lane } : { x: lane, z: 10 };
    case 3:
      if (r.z > 8 && r.x > -12) return { x: lane, z: 2 };
      if (r.x > -52) return { x: -58 + lane, z: lane };
      return { x: -60 + lane, z: 75 };
    default:
      return r.z < 112 ? { x: -60 + lane, z: 118 } : { x: 60, z: 120 + lane };
  }
}

const ORDINALS = ['1st', '2nd', '3rd', '4th'];

const def: MinigameDef<GetawayState, GetawayInput> = {
  meta: {
    id: 'gta-getaway',
    title: 'Turfton Getaway',
    game: GAME_ID,
    goal: "Race through 5 Turfton checkpoints to Pay 'n' Glaze while dodging Hat Watch cruisers!",
    controls: 'Steer left/right; hold action to handbrake drift.',
    maxSeconds: ROUND_S,
  },

  init(seats) {
    return {
      t: 0,
      firstFin: null,
      r: seats.map((_, k) => {
        const [sx, sz] = START_SPOTS[k % START_SPOTS.length];
        return { x: sx, z: sz, yaw: 0, s: 0, kx: 0, kz: 0, ks: 0, cp: 0, fin: null, dr: 0 };
      }),
      c: CRUISER_PATROLS.map((p) => ({
        x: p.startX,
        z: p.startZ,
        yaw: p.startYaw,
        s: CRUISER_SPEED,
        wp: 0,
      })),
    };
  },

  step(s, inputs, dt) {
    s.t += dt;

    // 1. Step 4 Zero-Turn Racers (auto-throttle, steer, handbrake drift).
    for (let k = 0; k < s.r.length; k++) {
      const r = s.r[k];
      if (r.fin !== null) {
        // Coast gently into the Pay 'n' Glaze bay after finishing.
        r.s *= Math.exp(-3.5 * dt);
        r.dr = Math.max(0, r.dr - dt * 4);
        r.x += Math.sin(r.yaw) * r.s * dt;
        r.z += Math.cos(r.yaw) * r.s * dt;
        r.kx = 0;
        r.kz = 0;
        r.ks = 0;
        continue;
      }

      const inp = inputs[k];
      const steer = clamp(inp?.steer ?? 0, -1, 1);
      const driftHeld = Boolean(inp?.drift);
      const drifting = driftHeld && Math.abs(steer) > 0.12;
      r.dr = clamp(r.dr + (drifting ? 6 : -5) * dt, 0, 1);

      const targetSpeed = drifting ? RACER_SPEC.maxSpeed * 0.86 : RACER_SPEC.maxSpeed;
      if (r.s < targetSpeed) {
        r.s = Math.min(targetSpeed, r.s + RACER_SPEC.accel * dt);
      } else {
        r.s = Math.max(targetSpeed, r.s - RACER_SPEC.accel * 0.6 * dt);
      }

      const turnBoost = 1 + r.dr * 0.45;
      r.yaw -= steer * RACER_SPEC.turnRate * turnBoost * dt * Math.sign(r.s || 1);

      // Integrate forward motion + decaying bump knock.
      const prevX = r.x;
      const prevZ = r.z;
      r.x += (Math.sin(r.yaw) * r.s + r.kx) * dt;
      r.z += (Math.cos(r.yaw) * r.s + r.kz) * dt;
      r.yaw += r.ks * dt;

      const fk = Math.exp(-KNOCK_GRIP * dt);
      const fs = Math.exp(-SPIN_GRIP * dt);
      r.kx *= fk;
      r.kz *= fk;
      r.ks *= fs;

      const pushed = pushOutOfBoxes(r.x, r.z, RACER_SPEC.radius, BLOCKS, 0);
      r.x = pushed.x;
      r.z = pushed.z;
      if (pushed.hit) {
        const nx = pushed.x - prevX;
        const nz = pushed.z - prevZ;
        if (Math.hypot(nx, nz) > 1e-4) {
          r.s = Math.max(8, r.s * 0.8);
          r.kx *= 0.25;
          r.kz *= 0.25;
        }
      }
      const kept = clampToArena(r.x, r.z, RACER_SPEC.radius);
      r.x = kept.x;
      r.z = kept.z;
      if (kept.hit) r.s = Math.max(8, r.s * 0.75);
    }

    // 2. Step 3 Hat Watch Cruisers along their patrol segments.
    for (let i = 0; i < s.c.length; i++) {
      const c = s.c[i];
      const pat = CRUISER_PATROLS[i];
      const tx = c.wp === 0 ? pat.bx : pat.ax;
      const tz = c.wp === 0 ? pat.bz : pat.az;
      const dx = tx - c.x;
      const dz = tz - c.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 3.5) {
        c.wp = c.wp === 0 ? 1 : 0;
      } else {
        const targetYaw = Math.atan2(dx, dz);
        const diff = angleDiff(targetYaw, c.yaw);
        const maxTurn = CRUISER_SPEC.turnRate * 1.4 * dt;
        c.yaw += clamp(diff, -maxTurn, maxTurn);
      }
      c.s = Math.min(CRUISER_SPEED, c.s + CRUISER_SPEC.accel * dt);
      c.x += Math.sin(c.yaw) * c.s * dt;
      c.z += Math.cos(c.yaw) * c.s * dt;
      const pushed = pushOutOfBoxes(c.x, c.z, CRUISER_SPEC.radius, BLOCKS, 0);
      c.x = pushed.x;
      c.z = pushed.z;
    }

    // 3. Vehicle-vehicle collisions: racer-vs-racer and cruiser-vs-racer (collideVehicles momentum model).
    for (let i = 0; i < s.r.length; i++) {
      const a = s.r[i];
      if (a.fin !== null) continue;
      for (let j = i + 1; j < s.r.length; j++) {
        const b = s.r[j];
        if (b.fin !== null) continue;
        const bump = applyBump(
          a.x, a.z, a.yaw, a.s, a.kx, a.kz, RACER_SPEC.radius, RACER_SPEC.mass,
          b.x, b.z, b.yaw, b.s, b.kx, b.kz, RACER_SPEC.radius, RACER_SPEC.mass,
        );
        if (!bump) continue;
        a.x += bump.dax;
        a.z += bump.daz;
        b.x += bump.dbx;
        b.z += bump.dbz;
        if (bump.ajx !== 0 || bump.ajz !== 0) kickRacer(a, bump.ajx, bump.ajz, bump.aspin);
        if (bump.bjx !== 0 || bump.bjz !== 0) kickRacer(b, bump.bjx, bump.bjz, bump.bspin);
      }

      for (let j = 0; j < s.c.length; j++) {
        const c = s.c[j];
        const bump = applyBump(
          a.x, a.z, a.yaw, a.s, a.kx, a.kz, RACER_SPEC.radius, RACER_SPEC.mass,
          c.x, c.z, c.yaw, c.s, 0, 0, CRUISER_SPEC.radius, CRUISER_SPEC.mass,
        );
        if (!bump) continue;
        a.x += bump.dax;
        a.z += bump.daz;
        c.x += bump.dbx;
        c.z += bump.dbz;
        if (bump.ajx !== 0 || bump.ajz !== 0) kickRacer(a, bump.ajx, bump.ajz, bump.aspin);
        const cf = Math.sin(c.yaw) * bump.bjx + Math.cos(c.yaw) * bump.bjz;
        c.s = clamp(c.s + cf, -REBOUND_MAX, CRUISER_SPEED);
      }
    }

    // 4. Advance checkpoints and record finish times.
    for (const r of s.r) {
      if (r.cp >= CHECKPOINT_COUNT) continue;
      const cp = CHECKPOINTS[r.cp];
      if (Math.hypot(cp.x - r.x, cp.z - r.z) <= CHECKPOINT_RADIUS) {
        r.cp += 1;
        if (r.cp === CHECKPOINT_COUNT && r.fin === null) {
          r.fin = s.t;
          if (s.firstFin === null) s.firstFin = s.t;
        }
      }
    }
  },

  cpu(s, seat, rng) {
    const r = s.r[seat];
    if (r.fin !== null) return { steer: 0, drift: false };

    const tgt = cpuTarget(r, seat);
    const dx = tgt.x - r.x;
    const dz = tgt.z - r.z;
    const desiredYaw = Math.atan2(dx, dz);
    let diff = angleDiff(desiredYaw, r.yaw);

    // Light avoidance around patrolling Hat Watch cruisers ahead.
    const fx = Math.sin(r.yaw);
    const fz = Math.cos(r.yaw);
    for (const c of s.c) {
      const cx = c.x - r.x;
      const cz = c.z - r.z;
      const dist = Math.hypot(cx, cz);
      if (dist < 10 && dist > 0.1) {
        const ahead = cx * fx + cz * fz;
        if (ahead > 0) {
          const cross = fx * cz - fz * cx; // >0 means cruiser is to our left, <0 right
          diff += (cross >= 0 ? -0.45 : 0.45) * (1 - dist / 10);
        }
      }
    }

    // Tiny deterministic wobble from rng so CPUs don't look identical.
    const jitter = (rng() - 0.5) * 0.04;
    const steer = clamp(-diff * 2.2 + jitter, -1, 1);
    const drift = Math.abs(diff) > 0.65;
    return { steer, drift };
  },

  result(s, timeUp) {
    const allDone = s.r.every((r) => r.fin !== null);
    const graceOver = s.firstFin !== null && s.t - s.firstFin >= FINISH_GRACE_S;
    if (!allDone && !graceOver && !timeUp) return null;
    return computePlaces(s);
  },

  report(s, places, seats): SliceReport {
    const w = soleWinner(places);
    const who = w === null ? null : (seats[w]?.name ?? null);
    const wf = w === null ? null : s.r[w].fin;
    let headline: string | undefined;
    if (who) {
      const raw = wf !== null ? `${who} hit Pay 'n' Glaze in ${wf.toFixed(1)}s` : `${who} led the Turfton getaway`;
      headline = raw.slice(0, 60);
    }
    return {
      headline,
      stats: [
        { key: 'checkpoints', label: 'Checkpoints', format: 'int', better: 'higher' },
        { key: 'time', label: 'Time', unit: 's', format: 'time', better: 'lower' },
      ],
      values: s.r.map((r) => ({
        checkpoints: r.cp,
        time: r.fin === null ? null : Math.round(r.fin * 100) / 100,
      })),
      notes: s.r.map((r) => {
        if (r.fin === null) return `${r.cp}/${CHECKPOINT_COUNT} checkpoints`;
        return r.fin === s.firstFin ? "First to Pay 'n' Glaze!" : null;
      }),
    };
  },

  createView(ctx: ViewCtx): MinigameView<GetawayState, GetawayInput> {
    const { scene, camera, renderer, ui, seats, mySeat } = ctx;
    renderer.shadowMap.enabled = true;
    camera.far = 420;
    camera.updateProjectionMatrix();

    scene.background = new THREE.Color(COLORS.sky);
    scene.fog = new THREE.Fog(COLORS.sky, 90, 250);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x447744, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.55);
    sun.position.set(70, 95, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -110;
    sun.shadow.camera.right = 110;
    sun.shadow.camera.top = 110;
    sun.shadow.camera.bottom = -110;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 260;
    scene.add(sun);
    scene.add(sun.target);
    sun.target.position.set(0, 0, 45);

    // ---- Ground, Turfton roads, sidewalks & blocks -----------------------------------------------------------------
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(360, 360),
      new THREE.MeshStandardMaterial({ color: COLORS.grass, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMat = new THREE.MeshStandardMaterial({ color: COLORS.road, roughness: 0.9 });
    const lineMat = new THREE.MeshBasicMaterial({ color: COLORS.roadLine });
    const sideMat = new THREE.MeshStandardMaterial({ color: COLORS.sidewalk, roughness: 0.95 });

    // North-south roads at x = -60, 0, 60
    for (const rx of [-60, 0, 60]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, 240), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(rx, 0.02, 45);
      road.receiveShadow = true;
      scene.add(road);

      for (let z = -68; z <= 156; z += 8) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.6), lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(rx, 0.04, z);
        scene.add(dash);
      }
    }

    // East-west roads at z = -60, 0, 60, 120
    for (const rz of [-60, 0, 60, 120]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(200, ROAD_WIDTH), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.025, rz);
      road.receiveShadow = true;
      scene.add(road);

      for (let x = -92; x <= 92; x += 8) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.35), lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.045, rz);
        scene.add(dash);
      }
    }

    // Sidewalk pads & downtown tower blocks for each city block
    const towerPal = [0x9aa4b2, 0x8d8278, 0x768591, 0xb59e84];
    const towerMats = towerPal.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
    BLOCKS.forEach((b, idx) => {
      const bw = b.maxX - b.minX;
      const bd = b.maxZ - b.minZ;
      const cx = (b.minX + b.maxX) / 2;
      const cz = (b.minZ + b.maxZ) / 2;

      const pad = new THREE.Mesh(new THREE.BoxGeometry(bw + 3, 0.12, bd + 3), sideMat);
      pad.position.set(cx, 0.06, cz);
      pad.receiveShadow = true;
      scene.add(pad);

      // Skip placing a generic tower on The Gnomecino's block (x: 69..111, z: -51..-9)
      if (cx > 65 && cz < -5 && cz > -55) return;

      const h = 14 + ((idx * 17) % 24);
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(bw - 6, h, bd - 6),
        towerMats[idx % towerMats.length],
      );
      tower.position.set(cx, h / 2, cz);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);
    });

    // ---- Landmarks: The Gnomecino, Greenhouse Strip, Pay 'n' Glaze Arch --------------------------------------------
    const gnomecino = buildPrefab('gta-gnomecino', { scale: 5.5 });
    gnomecino.position.set(GNOMECINO.x - 10, 0, GNOMECINO.z);
    gnomecino.rotation.y = -Math.PI / 2;
    gnomecino.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    scene.add(gnomecino);

    // Greenhouse Strip glass-arch canopies over x = 60
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x2a5648, roughness: 0.5, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x99ebd8, transparent: true, opacity: 0.34, roughness: 0.2, side: THREE.DoubleSide });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff66cc, emissive: 0xd936a8 });
    const amberMat = new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xd99b26 });
    const springY = 8.5;
    const archRise = 5.5;
    const halfSpan = 7.5;
    for (const [z0, z1] of [[-50, -10], [10, 50]] as [number, number][]) {
      const spanLen = z1 - z0;
      const zMid = (z0 + z1) / 2;
      for (const pz of [z0 + 2, z0 + 14, z0 + 26, z1 - 2]) {
        for (const px of [60 - halfSpan, 60 + halfSpan]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, springY, 0.7), ironMat);
          post.position.set(px, springY / 2, pz);
          post.castShadow = true;
          scene.add(post);
        }
      }
      for (let k = 0; k < 6; k++) {
        const a0 = (Math.PI * k) / 6;
        const a1 = (Math.PI * (k + 1)) / 6;
        const x0 = 60 - Math.cos(a0) * halfSpan;
        const y0 = springY + Math.sin(a0) * archRise;
        const x1 = 60 - Math.cos(a1) * halfSpan;
        const y1 = springY + Math.sin(a1) * archRise;
        const segLen = Math.hypot(x1 - x0, y1 - y0);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.12, spanLen), glassMat);
        panel.position.set((x0 + x1) / 2, (y0 + y1) / 2, zMid);
        panel.rotation.z = Math.atan2(y1 - y0, x1 - x0);
        scene.add(panel);
      }
      for (const lx of [56.4, 63.6]) {
        const tube = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, spanLen - 4), pinkMat);
        tube.position.set(lx, springY + 3.2, zMid);
        scene.add(tube);
      }
      const centerTube = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, spanLen - 4), amberMat);
      centerTube.position.set(60, springY + 4.4, zMid);
      scene.add(centerTube);
    }

    // Pay 'n' Glaze spray arch spanning the finish at (60, 120)
    const payNGlaze = buildPrefab('gta-pay-n-glaze', { scale: 5.5 });
    payNGlaze.position.set(60, 0, PAY_N_GLAZE.z - 30); // (60, 0, 120)
    payNGlaze.rotation.y = Math.PI / 2;
    payNGlaze.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    scene.add(payNGlaze);

    // Checkered finish strip on the road at (60, 120)
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xfafafa });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 10; col++) {
        const sq = new THREE.Mesh(
          new THREE.PlaneGeometry(1.0, 1.0),
          (row + col) % 2 === 0 ? whiteMat : blackMat,
        );
        sq.rotation.x = -Math.PI / 2;
        sq.position.set(59.5 + row, 0.055, 115.5 + col);
        scene.add(sq);
      }
    }

    // ---- 5 Checkpoint Rings -----------------------------------------------------------------------------------------
    const cpMeshes = CHECKPOINTS.map((cp, idx) => {
      const group = new THREE.Group();
      group.position.set(cp.x, 0, cp.z);
      group.rotation.y = cp.yaw;
      const isFinish = idx === CHECKPOINT_COUNT - 1;
      const ringMat = new THREE.MeshStandardMaterial({
        color: isFinish ? 0xff3b9a : 0x38f2ff,
        emissive: isFinish ? 0xff3b9a : 0x18a0d8,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.28, 10, 28), ringMat);
      ring.position.y = 4.6;
      group.add(ring);

      const padMat = new THREE.MeshBasicMaterial({
        color: isFinish ? 0xff3b9a : 0x38f2ff,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      });
      const pad = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.6, 28), padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.07;
      group.add(pad);

      scene.add(group);
      return { group, ring, ringMat, padMat };
    });

    // ---- 4 Player Zero-Turn Racers with Seated Gnomes ---------------------------------------------------------------
    const racerMeshes = seats.map((seat, idx) => {
      const root = new THREE.Group();
      const tint = seat.color ?? MOWER_TINTS[idx % MOWER_TINTS.length];
      const body = buildPrefab(RACER_SPEC.prefab, { scale: RACER_SPEC.scale, tint });
      body.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
      root.add(body);

      const look: GnomeLook =
        resolveLook(seat as unknown as PlayerRef) ?? seat.look ?? DEFAULT_LOOK;
      const gnome: GnomeModel = createGnomeModel(look);
      gnome.object.position.set(RACER_SPEC.seat[0], RACER_SPEC.seat[1], RACER_SPEC.seat[2]);
      gnome.object.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
      root.add(gnome.object);

      // Drift sparks behind rear wheels
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.55, 0.1, -0.75, 0.55, 0.1, -0.75]), 3));
      const sparks = new THREE.Points(
        sparkGeo,
        new THREE.PointsMaterial({ color: 0xffb347, size: 0.28, transparent: true, opacity: 0.9 }),
      );
      sparks.visible = false;
      root.add(sparks);

      const wheels = ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3']
        .map((n) => body.getObjectByName(n))
        .filter((w): w is THREE.Object3D => Boolean(w));

      const pose: PlayerState = {
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        facing: 0,
        grounded: true,
        jumpsUsed: 0,
        sitting: true,
      };

      scene.add(root);
      return { root, body, gnome, sparks, wheels, pose, wheelSpin: 0, x: 0, z: 0, yaw: 0, init: false };
    });

    // ---- 3 Hat Watch Cruisers ---------------------------------------------------------------------------------------
    const watchOfficerLook: GnomeLook = {
      ...DEFAULT_LOOK,
      hat: WATCH.hat,
      shirt: WATCH.coat,
      pants: 0x1f2b4d,
    };
    const cruiserMeshes = CRUISER_PATROLS.map(() => {
      const root = new THREE.Group();
      const body = buildPrefab(CRUISER_SPEC.prefab, { scale: CRUISER_SPEC.scale, tint: WATCH.hat });
      body.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
      root.add(body);

      const officer = createGnomeModel(watchOfficerLook);
      officer.object.position.set(CRUISER_SPEC.seat[0], CRUISER_SPEC.seat[1], CRUISER_SPEC.seat[2]);
      root.add(officer.object);
      officer.update(
        {
          position: new THREE.Vector3(),
          velocity: new THREE.Vector3(),
          facing: 0,
          grounded: true,
          jumpsUsed: 0,
          sitting: true,
        },
        0,
      );

      const redMat = new THREE.MeshBasicMaterial({ color: 0xff2233 });
      const blueMat = new THREE.MeshBasicMaterial({ color: 0x2288ff });
      const beaconR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.25), redMat);
      beaconR.position.set(-0.35, 2.25, 0.8);
      const beaconB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.25), blueMat);
      beaconB.position.set(0.35, 2.25, 0.8);
      root.add(beaconR, beaconB);

      const wheels = ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3']
        .map((n) => body.getObjectByName(n))
        .filter((w): w is THREE.Object3D => Boolean(w));

      scene.add(root);
      return { root, redMat, blueMat, wheels, wheelSpin: 0, x: 0, z: 0, yaw: 0, init: false };
    });

    // ---- HUD Overlay ------------------------------------------------------------------------------------------------
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;inset:0;pointer-events:none;font:700 20px system-ui;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.85)';
    ui.appendChild(overlay);
    const mk = (css: string): HTMLDivElement => {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;${css}`;
      overlay.appendChild(d);
      return d;
    };
    const placeEl = mk('top:max(12px,env(safe-area-inset-top));left:max(16px,env(safe-area-inset-left))');
    const cpEl = mk('top:max(42px,calc(env(safe-area-inset-top) + 30px));left:max(16px,env(safe-area-inset-left))');
    const timeEl = mk('top:max(12px,env(safe-area-inset-top));right:max(16px,env(safe-area-inset-right))');
    const navEl = mk(
      'top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);' +
      'padding:4px 12px;border-radius:999px;background:rgba(15,23,42,.55);font-size:15px;white-space:nowrap',
    );
    const finEl = mk('top:38%;left:0;right:0;text-align:center;font-size:40px');
    const setText = (el: HTMLElement, text: string): void => {
      if (el.textContent !== text) el.textContent = text;
    };

    let firstFrame = true;
    const lookTarget = new THREE.Vector3();
    const camGoal = new THREE.Vector3();

    return {
      render(s, dt) {
        const alpha = 1 - Math.exp(-dt * 15);

        // Update 4 player Zero-Turns
        s.r.forEach((src, k) => {
          const m = racerMeshes[k];
          if (!m.init || Math.hypot(src.x - m.x, src.z - m.z) > 10) {
            m.x = src.x;
            m.z = src.z;
            m.yaw = src.yaw;
            m.init = true;
          } else {
            m.x += (src.x - m.x) * alpha;
            m.z += (src.z - m.z) * alpha;
            m.yaw += angleDiff(src.yaw, m.yaw) * alpha;
          }
          m.root.position.set(m.x, 0, m.z);
          m.root.rotation.y = m.yaw;
          m.body.rotation.y = src.dr * 0.18;
          m.sparks.visible = src.dr > 0.25 && src.fin === null;

          m.wheelSpin += (src.s * dt) / 0.3;
          for (const w of m.wheels) w.rotation.x = m.wheelSpin;
          m.gnome.update(m.pose, dt);
        });

        // Update 3 Hat Watch Cruisers
        const flash = Math.floor(s.t * 5) % 2 === 0;
        s.c.forEach((src, i) => {
          const m = cruiserMeshes[i];
          if (!m.init || Math.hypot(src.x - m.x, src.z - m.z) > 10) {
            m.x = src.x;
            m.z = src.z;
            m.yaw = src.yaw;
            m.init = true;
          } else {
            m.x += (src.x - m.x) * alpha;
            m.z += (src.z - m.z) * alpha;
            m.yaw += angleDiff(src.yaw, m.yaw) * alpha;
          }
          m.root.position.set(m.x, 0, m.z);
          m.root.rotation.y = m.yaw;
          m.wheelSpin += (src.s * dt) / 0.35;
          for (const w of m.wheels) w.rotation.x = m.wheelSpin;
          m.redMat.color.setHex(flash ? 0xff2233 : 0x441118);
          m.blueMat.color.setHex(flash ? 0x112244 : 0x2288ff);
        });

        // Camera & checkpoint highlights follow mySeat (or leader when watching)
        const places = computePlaces(s);
        const focusIdx = mySeat ?? Math.max(0, places.indexOf(0));
        const focus = racerMeshes[focusIdx];
        const focusState = s.r[focusIdx];

        const fx = Math.sin(focus.yaw);
        const fz = Math.cos(focus.yaw);
        camGoal.set(focus.x - fx * 8.2, 4.6, focus.z - fz * 8.2);
        lookTarget.set(focus.x + fx * 6.5, 1.1, focus.z + fz * 6.5);
        if (firstFrame) {
          camera.position.copy(camGoal);
          firstFrame = false;
        } else {
          camera.position.lerp(camGoal, 1 - Math.exp(-dt * 10));
        }
        camera.lookAt(lookTarget);

        // Pulse the active checkpoint ring for the focused racer
        cpMeshes.forEach((cp, idx) => {
          const passed = idx < focusState.cp;
          const active = idx === focusState.cp;
          cp.ringMat.opacity = passed ? 0.14 : active ? 0.95 : 0.45;
          cp.padMat.opacity = passed ? 0.06 : active ? 0.42 : 0.16;
          if (active) {
            const pulse = 1 + 0.08 * Math.sin(s.t * 6);
            cp.ring.scale.setScalar(pulse);
            cp.ringMat.color.setHex(0xffd23f);
            cp.ringMat.emissive.setHex(0xf59e0b);
          } else {
            cp.ring.scale.setScalar(1);
            const isFin = idx === CHECKPOINT_COUNT - 1;
            cp.ringMat.color.setHex(isFin ? 0xff3b9a : 0x38f2ff);
            cp.ringMat.emissive.setHex(isFin ? 0xff3b9a : 0x18a0d8);
          }
        });

        // HUD text
        setText(timeEl, `${s.t.toFixed(1)}s`);
        if (mySeat !== null) {
          const me = s.r[mySeat];
          const p = places[mySeat];
          setText(placeEl, `${ORDINALS[p]} / ${seats.length}`);
          setText(cpEl, `CP ${me.cp} / ${CHECKPOINT_COUNT}`);
          if (me.cp < CHECKPOINT_COUNT) {
            const next = CHECKPOINTS[me.cp];
            const diff = angleDiff(Math.atan2(next.x - me.x, next.z - me.z), me.yaw);
            const arrow = diff > 0.35 ? '<- ' : diff < -0.35 ? ' ->' : ' ^ ';
            setText(navEl, `${arrow}${next.name}`);
          } else {
            setText(navEl, "Pay 'n' Glaze!");
          }
          setText(finEl, me.fin !== null ? `FINISHED ${ORDINALS[p]}!` : '');
        } else {
          setText(placeEl, `${seats[focusIdx].name}`);
          setText(cpEl, `CP ${focusState.cp} / ${CHECKPOINT_COUNT}`);
          setText(navEl, 'Spectating');
          setText(finEl, '');
        }
      },

      input(pad: Readonly<PadState>): GetawayInput {
        return { steer: pad.x, drift: pad.a };
      },

      dispose() {
        overlay.remove();
      },
    };
  },
};

export default def;
