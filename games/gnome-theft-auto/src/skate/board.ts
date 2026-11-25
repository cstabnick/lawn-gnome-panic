// The skateboard controller (E19 A8): a pure step function. Ground and air are the winter slide rider (stepSlide); the
// board adds the ollie, vert launches, walls, air tricks and grabs, landings that bail, and rail grinds. It reports
// @lawn/trickboard PhysEvents (plus GTA's own) for the combo scorer. No three.js, no DOM.
import { AIR_GESTURES, BOARD_TRICKS, grabFor, grindFor, zoneOf } from '@lawn/trickboard';
import type { BoardTrick, GrabKind, GrindKind } from '@lawn/trickboard';
import { newSlide, stepSlide } from '../winter/slideRider';
import type { SlideGround, SlideInput, SlideState, SlideTuning } from '../winter/types';
import { SKATE } from './types';
import type { BoardState, SkateEvent, SkateGround, SkateInput } from './types';

const TAU = Math.PI * 2;
const RAD = 180 / Math.PI;
/** Horizontal slowing while lying after a bail, m/s^2. */
const BAIL_DRAG = 12;
/** A wall hit slower than this (m/s into it) is not reported. */
const WALL_MIN = 0.3;

export function skateTuning(): SlideTuning {
  return {
    gravity: SKATE.gravity, muSnow: SKATE.muPaved, muIce: SKATE.muPaved, muOther: SKATE.muRough, drag: SKATE.drag,
    carve: SKATE.carve, carveSpeed: SKATE.carveSpeed, grip: SKATE.grip, brakeMu: SKATE.brakeMu,
    pushAccel: SKATE.pushAccel, pushMax: SKATE.pushMax, jumpV: SKATE.ollieV, airSpin: SKATE.airSpin,
    bounce: 0, bounceMin: 99, maxSpeed: SKATE.maxSpeed, maxStep: SKATE.maxStep, probe: SKATE.probe,
    normalRate: SKATE.normalRate, crashSpeed: 99,
  };
}

// Reused between calls (the controller is single-threaded and synchronous).
const TUNE = skateTuning();
let cur: SkateGround | null = null;
const SG: SlideGround = {
  height: (x, z) => cur!.height(x, z),
  surface: (x, z) => (cur!.paved(x, z) ? 'snow' : 'other'),
};
const S: SlideState = newSlide(0, 0, 0, { height: () => 0, surface: () => 'snow' });
const SI: SlideInput = { steer: 0, brake: 0, push: 0, jump: false };
const pushPrev = new WeakMap<BoardState, number>();

function angleDiff(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d < -Math.PI) d += TAU;
  return d;
}

const round180 = (deg: number): number => Math.round(deg / 180) * 180;

/** A board standing still at (x, z), facing yaw. */
export function newBoard(x: number, z: number, yaw: number, ground: SkateGround): BoardState {
  return {
    x, y: ground.height(x, z), z, vx: 0, vy: 0, vz: 0, yaw, mode: 'ground', airT: 0, spin: 0, switchStance: false,
    trick: null, grab: null, grind: null, bailT: 0, nx: 0, ny: 1, nz: 0, lean: 0, t: 0,
  };
}

/** Horizontal m/s. */
export function boardSpeed(b: BoardState): number {
  return Math.hypot(b.vx, b.vz);
}

/** Advance dt seconds (sub-steps of SKATE.maxStep). Returns the events of this call in order. */
export function stepBoard(b: BoardState, inp: SkateInput, ground: SkateGround, dt: number): SkateEvent[] {
  const out: SkateEvent[] = [];
  if (!(dt > 0)) return out;
  dt = Math.min(dt, 0.25);
  cur = ground;
  const n = Math.max(1, Math.ceil(dt / SKATE.maxStep - 1e-9));
  const h = dt / n;
  for (let i = 0; i < n; i++) sub(b, inp, ground, h, i === 0, out);
  cur = null;
  return out;
}

function sub(b: BoardState, inp: SkateInput, ground: SkateGround, h: number, first: boolean, out: SkateEvent[]): void {
  b.t += h;
  if (b.mode === 'bail') return bailStep(b, ground, h);
  if (b.mode === 'grind') return grindStep(b, inp, ground, h, first, out);
  rideStep(b, inp, ground, h, first, out);
}

function bail(b: BoardState, reason: string, out: SkateEvent[]): void {
  b.mode = 'bail';
  b.bailT = SKATE.bailS;
  b.trick = null;
  b.grab = null;
  b.grind = null;
  b.airT = 0;
  b.spin = 0;
  out.push({ e: 'bail', reason });
}

function bailStep(b: BoardState, ground: SkateGround, h: number): void {
  b.bailT -= h;
  const sp = Math.hypot(b.vx, b.vz);
  if (sp > 0) {
    const f = Math.max(0, sp - BAIL_DRAG * h) / sp;
    b.vx *= f; b.vz *= f;
  }
  b.x += b.vx * h;
  b.z += b.vz * h;
  b.y = ground.height(b.x, b.z);
  b.vy = 0;
  if (b.bailT <= 0) { b.bailT = 0; b.mode = 'ground'; }
}

function rideStep(b: BoardState, inp: SkateInput, ground: SkateGround, h: number, first: boolean, out: SkateEvent[]): void {
  const wasGround = b.mode === 'ground';
  const px = b.x, py = b.y, pz = b.z;
  const prevVy = b.vy;
  const prevYaw = b.yaw;
  const pvx = b.vx, pvz = b.vz;
  const hs0 = Math.hypot(b.vx, b.vz);

  // Air tricks and grabs act before the step
  if (!wasGround) airInput(b, inp, h, first, out);

  // Allowed rise of a legal slope this sub-step: the gradient measured behind the board (a wall ahead cannot be in it)
  let behind = 0;
  if (wasGround && hs0 > 0.05) {
    behind = Math.max(0, (py - ground.height(px - (b.vx / hs0) * 0.3, pz - (b.vz / hs0) * 0.3)) / 0.3);
  }

  S.x = b.x; S.y = b.y; S.z = b.z; S.vx = b.vx; S.vy = b.vy; S.vz = b.vz; S.yaw = b.yaw;
  S.grounded = wasGround; S.air = b.airT; S.spin = 0; S.lean = b.lean; S.nx = b.nx; S.ny = b.ny; S.nz = b.nz;
  SI.steer = inp.steer; SI.brake = inp.brake; SI.push = inp.push;
  SI.jump = wasGround && first && inp.ollie;

  const ev = stepSlide(S, SI, SG, TUNE, h);

  if (wasGround && S.grounded) {
    // Wall: the ground ahead rose more than a step plus the slope we were already on
    const travel = Math.hypot(S.x - px, S.z - pz);
    if (S.y - py > SKATE.stepUp + behind * travel + 1e-6) {
      const m = 0.3;
      let gx = ground.height(S.x + m, S.z) - ground.height(S.x - m, S.z);
      let gz = ground.height(S.x, S.z + m) - ground.height(S.x, S.z - m);
      let gl = Math.hypot(gx, gz);
      if (gl < 1e-6) { gx = S.x - px; gz = S.z - pz; gl = Math.hypot(gx, gz); }
      if (gl < 1e-9) { gx = 0; gz = 1; gl = 1; }
      const ux = gx / gl, uz = gz / gl;
      // The speed from before the step (the slide step clamps the jump up the wall into the speed)
      const vin = pvx * ux + pvz * uz;
      S.x = px; S.y = py; S.z = pz;
      S.vx = pvx; S.vz = pvz; S.vy = 0;
      if (vin > 0) { S.vx -= vin * ux; S.vz -= vin * uz; }
      copyOut(b);
      if (vin > WALL_MIN) {
        out.push({ e: 'wall', speed: vin });
        if (vin > SKATE.bailWallSpeed) bail(b, 'wall', out);
      }
      pushEvent(b, inp, out);
      return;
    }
  }

  copyOut(b);
  b.spin += (S.yaw - prevYaw) * RAD;
  if (wasGround) pushEvent(b, inp, out);

  if (wasGround && ev && ev.t === 'jumped') {
    b.airT = 0; b.spin = 0; b.trick = null; b.grab = null;
    b.mode = 'air';
    out.push({ e: 'takeoff', speed: Math.hypot(b.vx, b.vz), ollie: true });
    out.push({ e: 'pop', trick: 'ollie' });
    return;
  }
  if (wasGround && !S.grounded) {
    // Left the ground without an ollie: a lip or a kicker. A steep transition throws the board straight up.
    b.airT = 0; b.spin = 0; b.trick = null; b.grab = null;
    b.mode = 'air';
    vert(b, ground, px, pz);
    out.push({ e: 'takeoff', speed: Math.hypot(b.vx, b.vz), ollie: false });
    return;
  }
  if (wasGround) return;

  // In the air (or just landed)
  if (ev && ev.t === 'landed') {
    if (trySnap(b, ground, inp, prevVy, out)) return;
    land(b, inp, ev.air, ev.impact, out);
    return;
  }
  b.airT = S.air;
  trySnap(b, ground, inp, prevVy, out);
}

function copyOut(b: BoardState): void {
  b.x = S.x; b.y = S.y; b.z = S.z; b.vx = S.vx; b.vy = S.vy; b.vz = S.vz; b.yaw = S.yaw;
  b.lean = S.lean; b.nx = S.nx; b.ny = S.ny; b.nz = S.nz;
  b.mode = S.grounded ? 'ground' : 'air';
}

function pushEvent(b: BoardState, inp: SkateInput, out: SkateEvent[]): void {
  const was = pushPrev.get(b) ?? 0;
  if (b.mode === 'ground' && was <= 0.3 && inp.push > 0.3) out.push({ e: 'push' });
  pushPrev.set(b, inp.push);
}

/** Turn the uphill speed at a steep take-off into vertical speed (the sideways part stays). */
function vert(b: BoardState, ground: SkateGround, px: number, pz: number): void {
  const m = 0.3;
  // Measured a little behind the lip: right at the coping the transition ends and the slope reads half
  const hs = Math.hypot(b.vx, b.vz);
  if (hs > 1e-3) { px -= (b.vx / hs) * m; pz -= (b.vz / hs) * m; }
  const gx = (ground.height(px + m, pz) - ground.height(px - m, pz)) / (2 * m);
  const gz = (ground.height(px, pz + m) - ground.height(px, pz - m)) / (2 * m);
  const gl = Math.hypot(gx, gz);
  if (gl <= SKATE.vertGradient) return;
  const ux = gx / gl, uz = gz / gl;
  const vu = b.vx * ux + b.vz * uz;
  if (vu <= 0) return;
  b.vx -= vu * ux;
  b.vz -= vu * uz;
  b.vy = Math.max(b.vy, vu);
}

function airInput(b: BoardState, inp: SkateInput, h: number, first: boolean, out: SkateEvent[]): void {
  if (first && inp.flip && !b.trick) {
    const zone = zoneOf(inp.stick);
    const hit = AIR_GESTURES.find((g) => g.zone === zone);
    const trick: BoardTrick = hit ? hit.trick : 'kickflip';
    b.trick = { id: trick, t: 0 };
    out.push({ e: 'pop', trick });
  }
  if (b.trick) {
    b.trick.t += h;
    const id = b.trick.id as BoardTrick;
    if (b.trick.t >= BOARD_TRICKS[id].dur) {
      b.trick = null;
      out.push({ e: 'trickDone', trick: id });
    }
  }
  if (inp.grab && !b.grab) {
    const name = grabFor(1, inp.stick);
    b.grab = { id: name, t: 0 };
    out.push({ e: 'grabStart', kind: 1, name });
  } else if (b.grab) {
    if (inp.grab) b.grab.t += h;
    else endGrab(b, out);
  }
}

function endGrab(b: BoardState, out: SkateEvent[]): void {
  if (!b.grab) return;
  out.push({ e: 'grabEnd', kind: 1, t: b.grab.t, name: b.grab.id as GrabKind });
  b.grab = null;
}

function land(b: BoardState, inp: SkateInput, airT: number, impact: number, out: SkateEvent[]): void {
  const sp = Math.hypot(b.vx, b.vz);
  let ang = 0;
  if (sp > 0.5) ang = Math.abs(angleDiff(b.yaw, Math.atan2(b.vx, b.vz)));
  const off = Math.min(ang, Math.PI - ang);
  const spin = round180(b.spin);
  b.mode = 'ground';
  b.airT = 0;
  let reason: string | null = null;
  if (b.trick) reason = 'trick';
  else if (off > SKATE.landYawTol) reason = 'sideways';
  else if (b.grab) reason = 'grab';
  if (reason) {
    bail(b, reason, out);
    return;
  }
  const switchLand = ang > Math.PI / 2;
  if (switchLand) {
    b.switchStance = !b.switchStance;
    b.yaw = Math.atan2(b.vx, b.vz);
  }
  b.spin = 0;
  out.push({ e: 'land', perfect: off < 0.15, spin, flips: 0, airT, impact, switchLand });
}

/** Snap a falling board onto a rail. Returns true when it did (and emitted grindStart). */
function trySnap(b: BoardState, ground: SkateGround, inp: SkateInput, prevVy: number, out: SkateEvent[]): boolean {
  const rails = ground.rails;
  if (rails.length === 0 || prevVy >= 0 && b.vy >= 0) return false;
  const sp = Math.hypot(b.vx, b.vz);
  if (sp < SKATE.railMinSpeed) return false;
  for (let i = 0; i < rails.length; i++) {
    const r = rails[i];
    const dx = r.bx - r.ax, dz = r.bz - r.az;
    const l2 = dx * dx + dz * dz;
    if (l2 < 1e-6) continue;
    let s = ((b.x - r.ax) * dx + (b.z - r.az) * dz) / l2;
    s = s < 0 ? 0 : s > 1 ? 1 : s;
    const cx = r.ax + dx * s, cz = r.az + dz * s;
    if (Math.hypot(b.x - cx, b.z - cz) > SKATE.railReach) continue;
    const ry = r.ay + (r.by - r.ay) * s;
    if (b.y < ry - 0.05 || b.y > ry + SKATE.railAbove) continue;

    const l = Math.sqrt(l2);
    const along = b.vx * dx + b.vz * dz;
    const dir: 1 | -1 = along >= 0 ? 1 : -1;
    const entry = (dir === 1 ? s : 1 - s) * l;
    if (b.grab) endGrab(b, out);
    const kind: GrindKind = grindFor(inp.stick);
    const spin = round180(b.spin);
    b.mode = 'grind';
    b.trick = null;
    b.x = cx; b.y = ry; b.z = cz;
    b.vx = (dx / l) * dir * sp; b.vz = (dz / l) * dir * sp; b.vy = 0;
    b.yaw = Math.atan2(dx * dir, dz * dir);
    b.grind = { rail: i, s, dir, speed: sp, kind, t: 0, fromEnd: entry <= SKATE.fullRailEnd };
    b.airT = 0; b.spin = 0;
    out.push({ e: 'grindStart', rail: i, ley: false, spin, kind });
    return true;
  }
  return false;
}

function grindStep(b: BoardState, inp: SkateInput, ground: SkateGround, h: number, first: boolean, out: SkateEvent[]): void {
  const g = b.grind;
  const r = g ? ground.rails[g.rail] : undefined;
  if (!g || !r) { b.mode = 'air'; b.grind = null; return; }
  const dx = r.bx - r.ax, dz = r.bz - r.az;
  const l = Math.hypot(dx, dz);
  const grad = (g.dir * (r.by - r.ay)) / l;
  const acc = (-SKATE.gravity * grad) / Math.sqrt(1 + grad * grad) - SKATE.grindFriction;
  g.speed = Math.max(SKATE.grindMinSpeed, g.speed + acc * h);
  g.s += (g.dir * g.speed * h) / l;
  g.t += h;
  const hop = first && inp.ollie;
  const off = g.s < 0 || g.s > 1;
  if (off) g.s = g.s < 0 ? 0 : 1;
  b.x = r.ax + dx * g.s; b.z = r.az + dz * g.s; b.y = r.ay + (r.by - r.ay) * g.s;
  b.vx = (dx / l) * g.dir * g.speed; b.vz = (dz / l) * g.dir * g.speed;
  b.yaw = Math.atan2(dx * g.dir, dz * g.dir);
  b.vy = 0;
  if (!hop && !off) return;

  // Leaving the rail
  const farM = (g.dir === 1 ? 1 - g.s : g.s) * l;
  out.push({ e: 'grindEnd', t: g.t, ley: false, kind: g.kind as GrindKind });
  if (g.fromEnd && farM <= SKATE.fullRailEnd) out.push({ e: 'fullRail', rail: g.rail });
  b.vy = hop ? SKATE.railHopV : grad * g.speed;
  b.mode = 'air';
  b.grind = null;
  b.airT = 0; b.spin = 0;
  out.push({ e: 'takeoff', speed: g.speed, ollie: false });
}
