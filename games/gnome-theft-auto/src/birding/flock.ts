// Birding: the flock simulation. Pure: plain data, no three.js, no DOM, no allocation per step.
// Yaw 0 faces +z. Heading from a direction (dx, dz) is atan2(dx, dz). Forward of a yaw is (sin, cos), right is (cos, -sin).
import { BIRDING } from './types';
import type { Bird, BirdSpecies, Flock, FlockEnv, FlockFrame, FlockMode, FlightStyle, PerchKind, PerchSpot } from './types';

const TAU = Math.PI * 2;
/** One scratch spot for env.perch calls; its values are copied out at once. */
const scratch: PerchSpot = { x: 0, y: 0, z: 0, kind: 'ground' };
/** Preallocated single-kind lists, so env.perch calls do not allocate. */
const SINGLE: Record<PerchKind, readonly PerchKind[]> = {
  roof: ['roof'], fence: ['fence'], tree: ['tree'], ground: ['ground'], water: ['water'], shore: ['shore'],
};
const WATER_OR_SHORE: readonly PerchKind[] = ['water', 'shore'];
/** Set by threatened(): where the flock is flushed from. */
let threatX = 0;
let threatZ = 0;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Wraps an angle to [-PI, PI). */
function wrap(a: number): number {
  const r = (a + Math.PI) % TAU;
  return (r < 0 ? r + TAU : r) - Math.PI;
}

function frac(v: number): number {
  return v - Math.floor(v);
}

/** How fast the phase runs (rad/s) per flight style: the wingbeat rate. */
function flapRate(flight: FlightStyle): number {
  switch (flight) {
    case 'bound': return 16;
    case 'glide': return 10;
    case 'soar': return 2;
    case 'hover': return 22;
    case 'runner': return 10;
    default: return 14; // flap, swim
  }
}

/** Seconds a flock stays in a settled mode (0 for the moving modes, which end on arrival or by their own timer). */
function modeTime(mode: FlockMode, env: FlockEnv): number {
  switch (mode) {
    case 'perched': return 20 + env.rnd() * 40;
    case 'swimming': return 25 + env.rnd() * 35;
    case 'circling': return 20 + env.rnd() * 20;
    default: return 0;
  }
}

/** Wing angle while airborne, from the style and the bird's phase. Positive raises the tips. */
function airborneWing(flight: FlightStyle, phase: number): number {
  switch (flight) {
    case 'bound': return frac(phase / 16) < 0.6 ? 0.9 * Math.sin(phase) : -1.2;
    case 'glide': return frac(phase / 30) < 1 / 3 ? 0.9 * Math.sin(phase) : 0.1;
    case 'soar': return 0.05 + 0.05 * Math.sin(phase * 0.3);
    case 'hover': return 0.7 * Math.sin(phase);
    default: return 0.9 * Math.sin(phase); // flap, swim
  }
}

/** Is the flock threatened by the gnome or a vehicle? Sets threatX/threatZ to the source when it is. */
function threatened(f: Flock, frame: FlockFrame): boolean {
  const sp = f.species;
  if (frame.onFoot) {
    const d = Math.hypot(frame.playerX - f.x, frame.playerZ - f.z);
    let k = frame.footSpeed < 0.5 ? 0.5 : frame.footSpeed < 4 ? 0.8 : 1.2;
    if (frame.viewing) k *= 0.5;
    if (d < sp.shy * k) {
      threatX = frame.playerX;
      threatZ = frame.playerZ;
      return true;
    }
  }
  const reach = Math.max(6, sp.shy * 2);
  for (let i = 0; i < frame.threats.length; i++) {
    const t = frame.threats[i];
    if (t.speed > BIRDING.flushVehicleSpeed && Math.hypot(t.x - f.x, t.z - f.z) < reach) {
      threatX = t.x;
      threatZ = t.z;
      return true;
    }
  }
  if (frame.shot && Math.hypot(frame.playerX - f.x, frame.playerZ - f.z) < BIRDING.shotFlush) {
    threatX = frame.playerX;
    threatZ = frame.playerZ;
    return true;
  }
  return false;
}

/** Gives each member its own landing perch near the target. Called once per flight, when the centre comes within 12. */
function assignPerches(f: Flock, env: FlockEnv): void {
  const kinds = SINGLE[f.targetKind];
  for (let i = 0; i < f.members.length; i++) {
    const m = f.members[i];
    if (env.perch(kinds, f.tx + m.slotX, f.tz + m.slotZ, 3, scratch)) {
      m.perchX = scratch.x;
      m.perchY = scratch.y;
      m.perchZ = scratch.z;
    } else {
      m.perchX = f.tx + m.slotX;
      m.perchY = f.ty;
      m.perchZ = f.tz + m.slotZ;
    }
  }
}

/** A new flock of `size` birds centred on (x, y, z) in `mode`. Bird ids come from nextBirdId(). */
export function createFlock(
  id: number, species: BirdSpecies, size: number, x: number, y: number, z: number, mode: FlockMode, env: FlockEnv,
  nextBirdId: () => number,
): Flock {
  const members: Bird[] = [];
  const heading = env.rnd() * TAU;
  const spacing = Math.max(0.7, species.size * 2.2);
  const landed = mode === 'perched' || mode === 'swimming';
  const perchKind: PerchKind = mode === 'swimming' ? 'water' : species.perches[0];
  for (let i = 0; i < size; i++) {
    const a = i * 2.39996;
    const r = spacing * 0.6 * Math.sqrt(i);
    const slotX = Math.cos(a) * r;
    const slotZ = Math.sin(a) * r;
    const seed = env.rnd();
    const slotY = i === 0 ? 0 : (env.rnd() - 0.5) * spacing * 0.6;
    const wx = x + slotX;
    const wz = z + slotZ;
    let px = wx;
    let py = y + slotY;
    let pz = wz;
    if (landed) {
      if (env.perch(SINGLE[perchKind], wx, wz, 2 + spacing, scratch)) {
        px = scratch.x;
        py = scratch.y;
        pz = scratch.z;
      } else {
        const w = env.water(wx, wz);
        py = mode === 'swimming' && w !== null ? w : env.ground(wx, wz);
      }
    }
    members.push({
      id: nextBirdId(), species, x: px, y: py, z: pz, yaw: heading, pitch: 0, bank: 0,
      wingAngle: landed ? -1.35 : 0, phase: seed * TAU, slotX, slotY, slotZ,
      perchX: px, perchY: py, perchZ: pz, seed,
    });
  }
  const span = species.callEvery[1] - species.callEvery[0];
  return {
    id, species, members, mode, modeT: modeTime(mode, env), x, y, z, heading, tx: x, ty: y, tz: z,
    targetKind: perchKind, homeX: x, homeZ: z, callT: species.callEvery[0] + env.rnd() * span, sinceFlush: 999, acc: 0,
  };
}

/** Send the flock flying to (x, y, z), where it settles on a perch of `kind`. */
export function sendFlock(f: Flock, x: number, y: number, z: number, kind: PerchKind, env: FlockEnv): void {
  void env; // the flight needs no terrain here; it is steered in stepFlock
  f.mode = f.species.flight === 'runner' ? 'running' : 'flying';
  f.tx = x;
  f.ty = y;
  f.tz = z;
  f.targetKind = kind;
  f.modeT = 0; // flying: 0 = landing perches not assigned yet (see stepFlying)
}

/** Make the flock circle round (cx, cz) high up for a while (soarers, sky flocks). */
export function circleFlock(f: Flock, cx: number, cz: number, env: FlockEnv): void {
  if (f.species.flight === 'runner') return;
  f.mode = 'circling';
  f.tx = cx;
  f.tz = cz;
  f.ty = env.ground(cx, cz) + f.species.altitude * (1.2 + env.rnd() * 0.8);
  f.modeT = 20 + env.rnd() * 20;
}

/** Scare the flock away from (fromX, fromZ). */
export function flushFlock(f: Flock, fromX: number, fromZ: number, env: FlockEnv): void {
  const away = Math.atan2(f.x - fromX, f.z - fromZ) + (env.rnd() - 0.5);
  const runner = f.species.flight === 'runner';
  const dist = runner ? 15 + env.rnd() * 10 : 40 + env.rnd() * 30;
  const dx = f.x + Math.sin(away) * dist;
  const dz = f.z + Math.cos(away) * dist;
  if (!runner && env.perch(f.species.perches, dx, dz, 25, scratch)) {
    sendFlock(f, scratch.x, scratch.y, scratch.z, scratch.kind, env);
  } else {
    sendFlock(f, dx, env.ground(dx, dz), dz, 'ground', env);
  }
  f.sinceFlush = 0;
}

/** One step. Returns true when the flock flushed during this step. */
export function stepFlock(f: Flock, frame: FlockFrame, env: FlockEnv): boolean {
  const dt = frame.dt;
  const rate = flapRate(f.species.flight);
  f.sinceFlush += dt;
  for (let i = 0; i < f.members.length; i++) f.members[i].phase += dt * rate;

  if ((f.mode === 'perched' || f.mode === 'swimming') && f.sinceFlush > 3 && threatened(f, frame)) {
    flushFlock(f, threatX, threatZ, env);
    return true;
  }
  switch (f.mode) {
    case 'perched': stepPerched(f, frame, env); break;
    case 'swimming': stepSwimming(f, frame, env); break;
    case 'flying': stepFlying(f, frame, env); break;
    case 'circling': stepCircling(f, frame, env); break;
    case 'running': stepRunning(f, frame, env); break;
  }
  return false;
}

function stepPerched(f: Flock, frame: FlockFrame, env: FlockEnv): void {
  const t = frame.time;
  const prevT = t - frame.dt;
  const ground = f.species.perches[0] === 'ground';
  for (let i = 0; i < f.members.length; i++) {
    const m = f.members[i];
    // a small hop: turn once as the sine crosses 0.98 upward
    if (Math.sin(t * 0.7 + m.seed * 40) > 0.98 && Math.sin(prevT * 0.7 + m.seed * 40) <= 0.98) {
      m.yaw += (env.rnd() - 0.5) * 1.5;
    }
    let y = m.perchY;
    if (ground) {
      const b = Math.sin(t * 6 + m.seed * 20);
      if (b > 0.9) y += 0.03 * clamp((b - 0.9) * 10, 0, 1);
    }
    m.x = m.perchX;
    m.y = y;
    m.z = m.perchZ;
    m.pitch = 0;
    m.bank = 0;
    m.wingAngle = -1.35;
  }
  f.modeT -= frame.dt;
  if (f.modeT > 0) return;
  const sp = f.species;
  if (sp.flight === 'runner') {
    // walk a few steps: running at a quarter speed (modeT 1 marks a walk)
    const a = env.rnd() * TAU;
    const d = 5 + env.rnd() * 5;
    const x = f.x + Math.sin(a) * d;
    const z = f.z + Math.cos(a) * d;
    sendFlock(f, x, env.ground(x, z), z, 'ground', env);
    f.modeT = 1;
    return;
  }
  if ((sp.flight === 'soar' || sp.flight === 'hover') && env.rnd() < 0.5) {
    circleFlock(f, f.homeX, f.homeZ, env);
    return;
  }
  if (env.perch(sp.perches, f.homeX + (env.rnd() - 0.5) * 60, f.homeZ + (env.rnd() - 0.5) * 60, 30, scratch)) {
    sendFlock(f, scratch.x, scratch.y, scratch.z, scratch.kind, env);
  } else {
    f.modeT = 5; // nothing to land on near home: try again soon
  }
}

function stepSwimming(f: Flock, frame: FlockFrame, env: FlockEnv): void {
  const dt = frame.dt;
  const t = frame.time;
  for (let i = 0; i < f.members.length; i++) {
    const m = f.members[i];
    m.yaw += Math.sin(t * 0.3 + m.seed * 9) * 0.3 * dt;
    const dxc = m.x - f.x;
    const dzc = m.z - f.z;
    if (Math.hypot(dxc, dzc) > 12) m.yaw = Math.atan2(-dxc, -dzc); // turn back toward the flock
    m.x += Math.sin(m.yaw) * 0.25 * dt;
    m.z += Math.cos(m.yaw) * 0.25 * dt;
    const w = env.water(m.x, m.z);
    if (w === null) {
      // drifted onto land: settle instead (the perched step snaps members to their perches)
      f.mode = 'perched';
      f.modeT = 10;
      return;
    }
    m.y = w;
    m.pitch = 0;
    m.bank = 0;
    m.wingAngle = -1.35;
  }
  f.modeT -= dt;
  if (f.modeT > 0) return;
  if (env.perch(WATER_OR_SHORE, f.homeX + (env.rnd() - 0.5) * 60, f.homeZ + (env.rnd() - 0.5) * 60, 30, scratch)) {
    sendFlock(f, scratch.x, scratch.y, scratch.z, scratch.kind, env);
  } else {
    f.modeT = 5;
  }
}

function stepFlying(f: Flock, frame: FlockFrame, env: FlockEnv): void {
  const sp = f.species;
  const dt = frame.dt;
  const t = frame.time;
  const dx = f.tx - f.x;
  const dz = f.tz - f.z;
  const dH = Math.hypot(dx, dz);
  if (dH > 0.01) f.heading += clamp(wrap(Math.atan2(dx, dz) - f.heading), -2.5 * dt, 2.5 * dt);
  const h = f.heading;
  const ch = Math.cos(h);
  const sh = Math.sin(h);
  const step = Math.min(sp.speed * dt, dH);
  f.x += sh * step;
  f.z += ch * step;

  // height: cruise over the ground or water, then ease down near the target
  const g = env.ground(f.x, f.z);
  const w = env.water(f.x, f.z);
  const base = w !== null && w > g ? w : g;
  const near = dH < 20;
  const wantY = near ? f.ty + 1.5 : base + sp.altitude;
  const oldY = f.y;
  f.y += clamp(wantY - f.y, -2 * dt, 2 * dt);
  if (!near && f.y < g + 0.5) f.y = g + 0.5;
  const vy = dt > 0 ? (f.y - oldY) / dt : 0;
  const pitch = clamp(-vy / Math.max(sp.speed, 0.1), -0.5, 0.5);

  const landing = dH <= 12;
  if (landing && f.modeT === 0) {
    assignPerches(f, env);
    f.modeT = 1;
  }
  const k = 1 - Math.exp(-3 * dt);
  for (let i = 0; i < f.members.length; i++) {
    const m = f.members[i];
    const wob = Math.sin(t * 1.3 + m.seed * 10) * 0.3;
    if (landing) {
      m.x += (m.perchX - m.x) * k;
      m.y += (m.perchY - m.y) * k;
      m.z += (m.perchZ - m.z) * k;
    } else {
      const sx = m.slotX + wob;
      m.x = f.x + ch * sx + sh * m.slotZ;
      m.z = f.z - sh * sx + ch * m.slotZ;
      m.y = f.y + m.slotY + wob;
      const wing = airborneWing(sp.flight, m.phase);
      if (sp.flight === 'bound' && wing < -1) m.y -= 0.25;
    }
    m.yaw = h;
    m.pitch = pitch;
    m.bank = 0;
    m.wingAngle = airborneWing(sp.flight, m.phase);
  }

  if (dH < 1.5) {
    f.mode = f.targetKind === 'water' ? 'swimming' : 'perched';
    f.modeT = modeTime(f.mode, env);
    f.homeX = f.tx;
    f.homeZ = f.tz;
    f.heading = wrap(f.heading);
    for (let i = 0; i < f.members.length; i++) {
      const m = f.members[i];
      m.x = m.perchX;
      m.y = m.perchY;
      m.z = m.perchZ;
    }
  }
}

function stepCircling(f: Flock, frame: FlockFrame, env: FlockEnv): void {
  const sp = f.species;
  const dt = frame.dt;
  const t = frame.time;
  const hover = sp.flight === 'hover';
  const R = hover ? 0 : 8 + sp.size * 12;
  if (hover) {
    // hangs over the spot with a slow turn and a small bob
    f.x = f.tx;
    f.z = f.tz;
    f.y = f.ty + 0.3 * Math.sin(t * 1.5);
    f.heading = wrap(f.heading + 0.4 * dt);
  } else {
    const r0 = Math.hypot(f.x - f.tx, f.z - f.tz);
    const a = Math.atan2(f.z - f.tz, f.x - f.tx) + (sp.speed / R) * dt;
    const r = r0 + (R - r0) * (1 - Math.exp(-1.5 * dt));
    f.x = f.tx + Math.cos(a) * r;
    f.z = f.tz + Math.sin(a) * r;
    f.heading = Math.atan2(-Math.sin(a), Math.cos(a));
    const wantY = f.ty + Math.sin(t * 0.4 + f.id) * 2;
    f.y += clamp(wantY - f.y, -4 * dt, 4 * dt);
  }
  const h = f.heading;
  const ch = Math.cos(h);
  const sh = Math.sin(h);
  // bank toward the circle's centre: positive (right wing down) when the centre is on the right
  const side = (f.tx - f.x) * ch - (f.tz - f.z) * sh;
  const bank = R > 0 ? 0.35 * (side > 0 ? 1 : -1) : 0;
  for (let i = 0; i < f.members.length; i++) {
    const m = f.members[i];
    m.x = f.x + ch * m.slotX + sh * m.slotZ;
    m.z = f.z - sh * m.slotX + ch * m.slotZ;
    m.y = f.y + m.slotY;
    m.yaw = h;
    m.pitch = 0;
    m.bank = bank;
    m.wingAngle = airborneWing(sp.flight, m.phase);
    if (sp.flight === 'bound' && m.wingAngle < -1) m.y -= 0.25;
  }
  f.modeT -= dt;
  if (f.modeT > 0) return;
  if (env.perch(sp.perches, f.tx, f.tz, 40, scratch)) {
    sendFlock(f, scratch.x, scratch.y, scratch.z, scratch.kind, env);
  } else {
    circleFlock(f, f.tx, f.tz, env);
  }
}

function stepRunning(f: Flock, frame: FlockFrame, env: FlockEnv): void {
  const sp = f.species;
  const dt = frame.dt;
  const dx = f.tx - f.x;
  const dz = f.tz - f.z;
  const dH = Math.hypot(dx, dz);
  if (dH > 0.01) f.heading += clamp(wrap(Math.atan2(dx, dz) - f.heading), -2.5 * dt, 2.5 * dt);
  const speed = sp.speed * (f.modeT === 1 ? 0.25 : 1);
  const step = Math.min(speed * dt, dH);
  f.x += Math.sin(f.heading) * step;
  f.z += Math.cos(f.heading) * step;
  f.y = env.ground(f.x, f.z);
  const ch = Math.cos(f.heading);
  const sh = Math.sin(f.heading);
  for (let i = 0; i < f.members.length; i++) {
    const m = f.members[i];
    m.x = f.x + ch * m.slotX + sh * m.slotZ;
    m.z = f.z - sh * m.slotX + ch * m.slotZ;
    m.y = f.y;
    m.yaw = f.heading;
    m.pitch = 0;
    m.bank = 0;
    m.wingAngle = -0.6 + 0.5 * Math.sin(m.phase);
  }
  f.heading = wrap(f.heading);
  if (dH < 1) {
    // arrived: settle where each bird stands
    f.mode = 'perched';
    f.modeT = modeTime('perched', env);
    f.homeX = f.x;
    f.homeZ = f.z;
    for (let i = 0; i < f.members.length; i++) {
      const m = f.members[i];
      m.perchX = m.x;
      m.perchY = m.y;
      m.perchZ = m.z;
    }
  }
}
