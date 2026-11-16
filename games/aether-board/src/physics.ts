// The board. Pure, fixed-step (SIM_HZ) and deterministic: Player + Input + TrickCmd + World → Player + events.
//
// Feel decisions:
// - Speed is precious. Riding over changing terrain re-projects velocity onto the new surface keeping its length,
//   carving converts most sideways speed into forward speed, and landings keep the whole along-surface velocity.
// - The board leaves the ground only when the ground falls away faster than gravity could pull it down (crests,
//   lips, rims), with a 0.12 s grace so tiny hops never break your carve or count as air.
// - Landing is judged on board direction (either way round: switch is fine), front/back flips and a board trick
//   that finished. Smooth landings (moving along the slope) are "perfect" and give a little kick.
import * as THREE from 'three';
import { BOARD_TRICKS, TUNE, type Input, type PhysEvent, type Player, type TrickCmd } from './config';
import { groundAt, nearestOnRail, railAt, type Ground, type World } from './world';

const UP = new THREE.Vector3(0, 1, 0);
const G = TUNE.gravity;
/** Short hops below this airtime are not "air": no takeoff event, no landing judgement. */
const GRACE_S = 0.12;

// Scratch vectors (the sim is single threaded).
const vF = new THREE.Vector3();
const vR = new THREE.Vector3();
const vT = new THREE.Vector3();
const vA = new THREE.Vector3();
const vTmp = new THREE.Vector3();
const vTan = new THREE.Vector3();
const vRail = new THREE.Vector3();
const gScratch: Ground = { y: 0, normal: new THREE.Vector3(), island: 0 };
const gScratch2: Ground = { y: 0, normal: new THREE.Vector3(), island: 0 };

/** Nose direction of a heading (horizontal unit vector). */
export function forwardOf(heading: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(Math.sin(heading), 0, Math.cos(heading));
}

export function createPlayer(w: World): Player {
  const p: Player = {
    pos: w.spawn.pos.clone(), vel: new THREE.Vector3(), heading: w.spawn.heading, mode: 'ground', normal: UP.clone(),
    crouch: 0, jumpHeld: false, switchStance: false,
    airT: 0, spin: 0, spinVel: 0, flip: 0, flipVel: 0, trick: null, tricksThisAir: 0, grab: 0, grabT: 0,
    grind: null, grindCooldown: 0, lastRail: -1, bailT: 0, flow: 0.3, boosting: false,
    island: 0, lastSafe: { pos: w.spawn.pos.clone(), heading: w.spawn.heading }, t: 0,
  };
  forwardOf(p.heading, p.vel).multiplyScalar(6);
  return p;
}

/** Back on solid ground at `at` (default: the last island you landed on), rolling forward. */
export function respawn(p: Player, at: { pos: THREE.Vector3; heading: number }, speed: number): void {
  p.pos.copy(at.pos);
  p.pos.y += 0.05;
  p.heading = at.heading;
  forwardOf(p.heading, p.vel).multiplyScalar(speed);
  p.mode = 'ground';
  p.normal.copy(UP);
  p.crouch = 0;
  p.switchStance = false;
  resetAir(p);
  p.grind = null;
  p.bailT = 0;
}

function resetAir(p: Player): void {
  p.airT = 0;
  p.spin = 0;
  p.spinVel = 0;
  p.flip = 0;
  p.flipVel = 0;
  p.trick = null;
  p.tricksThisAir = 0;
  p.grab = 0;
  p.grabT = 0;
  takeoffSent.delete(p);
}

/** Players whose current air has been announced with a 'takeoff' event (short hops are not). */
const takeoffSent = new WeakSet<Player>();

/** Board-only rotation of the running trick, for the view (radians). */
export function boardPose(p: Player): { roll: number; shove: number; pitch: number } {
  if (!p.trick) return { roll: 0, shove: 0, pitch: 0 };
  const def = BOARD_TRICKS[p.trick.id];
  const x = def.dur > 0 ? Math.min(1, p.trick.t / def.dur) : 1;
  const f = x * x * (3 - 2 * x);
  const turn = Math.PI * 2 * f;
  return { roll: def.flip * turn, shove: def.shove * turn, pitch: p.trick.id === 'impossible' ? turn : 0 };
}

/** Horizontal yaw of a vector (same convention as heading). */
function yawOf(v: THREE.Vector3): number {
  return Math.atan2(v.x, v.z);
}

function wrapPi(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

// ---------------------------------------------------------------- step

export function stepPlayer(p: Player, inp: Input, cmd: TrickCmd | null, w: World, dt: number, ev: PhysEvent[]): void {
  p.t += dt;
  p.grindCooldown = Math.max(0, p.grindCooldown - dt);
  p.flow = Math.max(0, p.flow - TUNE.flowDrain * dt);

  if (inp.respawn) {
    respawn(p, p.lastSafe, 12);
    p.flow *= 0.5;
    ev.push({ e: 'respawn' });
    return;
  }

  // Boost: along your travel, burning flow. Not while bailing.
  const wantBoost = inp.boost && p.flow > 0.02 && p.mode !== 'bail';
  if (wantBoost && !p.boosting) ev.push({ e: 'boostStart' });
  p.boosting = wantBoost;

  switch (p.mode) {
    case 'ground': stepGround(p, inp, cmd, w, dt, ev); break;
    case 'air': stepAir(p, inp, cmd, w, dt, ev); break;
    case 'grind': stepGrind(p, inp, cmd, w, dt, ev); break;
    case 'bail': stepBail(p, w, dt); break;
  }

  // Soft speed cap (flow raises it a little).
  const cap = TUNE.maxSpeed * (1 + 0.25 * p.flow);
  const sp = p.vel.length();
  if (sp > cap) p.vel.multiplyScalar(1 - Math.min(0.5, ((sp - cap) / sp) * 3 * dt));

  // The aether gate warps you back to the start, keeping your speed.
  if (p.pos.distanceTo(w.gate.pos) < w.gate.r) {
    respawn(p, w.spawn, Math.max(22, p.vel.length()));
    p.island = 0;
    p.lastSafe = { pos: w.spawn.pos.clone(), heading: w.spawn.heading };
    ev.push({ e: 'warp' });
    return;
  }
  // Fell into the void.
  if (p.pos.y < w.voidY) {
    respawn(p, p.lastSafe, 12);
    p.flow *= 0.5;
    ev.push({ e: 'respawn' });
  }
}

/** Crouch charge and the release that pops. Returns the pop power, or null. */
function chargeAndPop(p: Player, inp: Input, cmd: TrickCmd | null, dt: number): { power: number; trick: TrickCmd | null } | null {
  const loading = inp.jump || inp.stick.y < -0.5;
  if (cmd && cmd.kind === 'pop') {
    p.crouch = 0;
    p.jumpHeld = inp.jump;
    return { power: Math.max(cmd.power, 0.35), trick: cmd };
  }
  if (loading) p.crouch = Math.min(1, p.crouch + dt / TUNE.chargeTime);
  const released = p.jumpHeld && !inp.jump;
  p.jumpHeld = inp.jump;
  if (released) {
    const power = Math.max(p.crouch, 0.3);
    p.crouch = 0;
    return { power, trick: null };
  }
  if (!loading) p.crouch = Math.max(0, p.crouch - dt * 4);
  return null;
}

function applyBoost(p: Player, dt: number): void {
  if (!p.boosting) return;
  const sp = p.vel.length();
  if (sp > 0.5) vTmp.copy(p.vel).divideScalar(sp);
  else forwardOf(p.heading, vTmp);
  p.vel.addScaledVector(vTmp, TUNE.boostAccel * dt);
  p.flow = Math.max(0, p.flow - TUNE.boostDrain * dt);
}

function quadDrag(v: THREE.Vector3, k: number, dt: number): void {
  const sp = v.length();
  v.multiplyScalar(Math.max(0, 1 - sp * k * dt));
}

function goAir(p: Player, ev: PhysEvent[], ollie: boolean): void {
  p.mode = 'air';
  resetAir(p);
  p.normal.copy(UP);
  if (ollie) {
    takeoffSent.add(p);
    ev.push({ e: 'takeoff', speed: p.vel.length(), ollie: true });
  }
}

function startTrick(p: Player, cmd: TrickCmd | null, ev: PhysEvent[]): void {
  if (!cmd) return;
  if (cmd.trick === 'ollie') {
    ev.push({ e: 'pop', trick: 'ollie' });
    return;
  }
  if (p.trick) return;
  p.trick = { id: cmd.trick, t: 0 };
  ev.push({ e: 'pop', trick: cmd.trick });
}

// ---------------------------------------------------------------- ground

function stepGround(p: Player, inp: Input, cmd: TrickCmd | null, w: World, dt: number, ev: PhysEvent[]): void {
  const g = groundAt(w, p.pos.x, p.pos.z, p.pos.y + 0.6, gScratch);
  if (!g) {
    goAir(p, ev, false);
    stepAir(p, inp, null, w, dt, ev);
    return;
  }
  const n = g.normal;
  p.normal.copy(n);
  if (g.island !== p.island) {
    p.island = g.island;
    ev.push({ e: 'island', id: g.island });
  }

  // Board axes on the surface.
  forwardOf(p.heading, vF);
  vF.addScaledVector(n, -vF.dot(n)).normalize();
  vR.crossVectors(vF, n).normalize(); // right of the nose

  // Velocity along the surface.
  vT.copy(p.vel).addScaledVector(n, -p.vel.dot(n));
  let speed = vT.length();

  // Carve: turn the board, then let grip pull the velocity onto the board's axis.
  const turnRate = THREE.MathUtils.lerp(TUNE.carveRate, TUNE.carveRateFast, Math.min(1, speed / TUNE.maxCarveSpeed));
  p.heading -= inp.steer * turnRate * dt;
  forwardOf(p.heading, vF);
  vF.addScaledVector(n, -vF.dot(n)).normalize();
  vR.crossVectors(vF, n).normalize();

  let along = vT.dot(vF);
  let side = vT.dot(vR);
  if (speed < 0.8) {
    // Nearly stopped: the board decides which way is forward.
    along = Math.max(along, 0);
  }
  const sideAfter = side * Math.exp(-TUNE.grip * dt);
  const shed = Math.abs(side) - Math.abs(sideAfter);
  along += Math.sign(along || 1) * shed * TUNE.carveKeep;
  side = sideAfter;
  vT.copy(vF).multiplyScalar(along).addScaledVector(vR, side);
  p.switchStance = along < 0;

  // Gravity along the slope.
  vA.set(0, -G, 0);
  vA.addScaledVector(n, -vA.dot(n));
  vT.addScaledVector(vA, dt);

  // Push (only up to pushMax) and brake (powerslide).
  speed = vT.length();
  if (inp.lean > 0.1 && speed < TUNE.pushMax) {
    const dir = p.switchStance ? -1 : 1;
    vT.addScaledVector(vF, dir * TUNE.pushAccel * inp.lean * dt);
  }
  if (inp.lean < -0.1 && speed > 0.01) {
    const cut = Math.min(speed, TUNE.brakeDecel * -inp.lean * dt);
    vT.multiplyScalar((speed - cut) / speed);
  }
  // Rolling drag and air drag.
  vT.multiplyScalar(1 - TUNE.rollDrag * dt);
  quadDrag(vT, TUNE.airDrag, dt);
  p.vel.copy(vT);
  applyBoost(p, dt);

  // Pop?
  const pop = chargeAndPop(p, inp, cmd, dt);
  if (pop) {
    const impulse = THREE.MathUtils.lerp(TUNE.ollieMin, TUNE.ollieMax, pop.power);
    vTmp.copy(n).multiplyScalar(0.7).addScaledVector(UP, 0.3).normalize();
    p.vel.addScaledVector(vTmp, impulse);
    p.pos.addScaledVector(n, 0.05);
    goAir(p, ev, true);
    startTrick(p, pop.trick ?? { kind: 'pop', trick: 'ollie', power: pop.power }, ev);
    return;
  }

  // Move, then follow the ground or leave it.
  p.pos.addScaledVector(p.vel, dt);
  const g2 = groundAt(w, p.pos.x, p.pos.z, p.pos.y + 1.0, gScratch2);
  if (!g2) {
    goAir(p, ev, false);
    return;
  }
  const drop = p.pos.y - g2.y; // > 0: the ground fell away under us
  if (drop > 0.5 * G * dt * dt + 0.003) {
    goAir(p, ev, false);
    return;
  }
  p.pos.y = g2.y;
  // Gentle change of surface: keep the speed, change its direction (fluid). A sharp change (a ramp's side, a wall):
  // lose the part of the velocity driving into it, as a real board would.
  const sp = p.vel.length();
  const into = p.vel.dot(g2.normal);
  p.vel.addScaledVector(g2.normal, -into);
  const nsp = p.vel.length();
  if (nsp > 1e-4 && n.dot(g2.normal) > 0.93) p.vel.multiplyScalar(sp / nsp);
  p.normal.copy(g2.normal);
}

// ---------------------------------------------------------------- air

function stepAir(p: Player, inp: Input, cmd: TrickCmd | null, w: World, dt: number, ev: PhysEvent[]): void {
  p.airT += dt;
  if (!takeoffSent.has(p) && p.airT > GRACE_S) {
    takeoffSent.add(p);
    ev.push({ e: 'takeoff', speed: p.vel.length(), ollie: false });
  }
  const real = takeoffSent.has(p);

  // Spin (A/D) and flips (W/S) ease toward the stick, so they feel weighty but quick.
  const k = 1 - Math.exp(-TUNE.spinResponse * dt);
  p.spinVel += (-inp.steer * TUNE.spinRate - p.spinVel) * k;
  p.heading += p.spinVel * dt;
  p.spin += p.spinVel * dt;
  const flipTarget = real && Math.abs(inp.lean) > 0.35 ? inp.lean * TUNE.flipRate : 0;
  p.flipVel += (flipTarget - p.flipVel) * k;
  p.flip += p.flipVel * dt;

  // A little air steering, sideways to your travel (right of travel = (-z, x)).
  const hl = Math.hypot(p.vel.x, p.vel.z);
  if (hl > 0.5) {
    const rx = -p.vel.z / hl;
    const rz = p.vel.x / hl;
    p.vel.x += rx * inp.steer * TUNE.airSteer * dt;
    p.vel.z += rz * inp.steer * TUNE.airSteer * dt;
  }

  // Board tricks, grabs.
  if (cmd && cmd.kind === 'air' && real) startTrick(p, cmd, ev);
  if (p.trick) {
    p.trick.t += dt;
    const def = BOARD_TRICKS[p.trick.id];
    if (p.trick.t >= def.dur) {
      ev.push({ e: 'trickDone', trick: p.trick.id });
      p.tricksThisAir++;
      p.trick = null;
    }
  }
  if (inp.grab !== p.grab && real) {
    if (p.grab) ev.push({ e: 'grabEnd', kind: p.grab, t: p.grabT });
    p.grab = inp.grab;
    p.grabT = 0;
    if (p.grab) ev.push({ e: 'grabStart', kind: p.grab });
  }
  if (p.grab) p.grabT += dt;

  // Charge in the air too, so a pop is ready the moment you land on a rail.
  p.jumpHeld = inp.jump;

  p.vel.y -= G * dt;
  quadDrag(p.vel, TUNE.airDrag, dt);
  applyBoost(p, dt);
  const prevY = p.pos.y;
  p.pos.addScaledVector(p.vel, dt);

  if (tryGrind(p, w, ev)) return;

  const g = groundAt(w, p.pos.x, p.pos.z, prevY + 0.05, gScratch);
  if (g && p.pos.y <= g.y && p.vel.dot(g.normal) < 0) land(p, g, ev);
}

function land(p: Player, g: Ground, ev: PhysEvent[]): void {
  const n = g.normal;
  p.pos.y = g.y;
  const sp = p.vel.length();
  const impact = Math.max(0, -p.vel.dot(n));
  vT.copy(p.vel).addScaledVector(n, -p.vel.dot(n));
  const real = takeoffSent.has(p);

  // Short hop: just keep riding.
  if (!real) {
    p.vel.copy(vT);
    p.mode = 'ground';
    p.normal.copy(n);
    resetAir(p);
    return;
  }

  if (p.grab) ev.push({ e: 'grabEnd', kind: p.grab, t: p.grabT });

  // Judge the landing.
  let reason = '';
  if (p.trick) {
    const def = BOARD_TRICKS[p.trick.id];
    if (p.trick.t / def.dur < TUNE.landTrickDone) reason = 'Board still flipping';
    else {
      ev.push({ e: 'trickDone', trick: p.trick.id });
      p.tricksThisAir++;
    }
  }
  const flips = Math.round(p.flip / (Math.PI * 2));
  if (!reason && Math.abs(p.flip - flips * Math.PI * 2) > TUNE.landFlipTol) reason = 'Over-rotated';
  let switchLand = false;
  if (!reason && vT.lengthSq() > 1) {
    forwardOf(p.heading, vF);
    vF.addScaledVector(n, -vF.dot(n)).normalize();
    const c = vF.dot(vTmp.copy(vT).normalize());
    const tol = Math.cos(TUNE.landYawTol);
    if (c < -tol) switchLand = true;
    else if (c < tol) reason = 'Landed sideways';
  }

  if (reason) {
    p.mode = 'bail';
    p.bailT = TUNE.bailTime;
    p.vel.copy(vT).multiplyScalar(TUNE.bailKeep);
    p.normal.copy(n);
    ev.push({ e: 'bail', reason });
    resetAir(p);
    return;
  }

  const perfect = sp > 4 && impact / sp < TUNE.perfectImpact;
  // Absorb the drop in the knees: keep your horizontal speed plus a quarter of what the fall would add, so big
  // drops do not snowball into speeds no landing can hold.
  const hSpeed = Math.hypot(p.vel.x, p.vel.z);
  const full = vT.length();
  if (full > hSpeed && full > 1e-3) vT.multiplyScalar((hSpeed + 0.25 * (full - hSpeed)) / full);
  p.vel.copy(vT);
  if (perfect && vT.lengthSq() > 1) p.vel.addScaledVector(vTmp.copy(vT).normalize(), TUNE.perfectBoost);
  // Line the board up with the travel exactly (either way round).
  const travelYaw = yawOf(vT);
  p.heading = switchLand ? travelYaw + Math.PI : travelYaw;
  p.heading = wrapPi(p.heading);
  p.switchStance = switchLand;
  const spinDeg = Math.round(Math.abs(p.spin) / Math.PI) * 180 * Math.sign(p.spin || 1);
  p.flow = Math.min(1, p.flow + 0.05 + 0.05 * Math.min(4, p.tricksThisAir) + (Math.abs(spinDeg) >= 180 ? 0.05 : 0) + Math.abs(flips) * 0.08 + (perfect ? 0.08 : 0));
  ev.push({ e: 'land', perfect, spin: spinDeg, flips, airT: p.airT, impact, switchLand });
  p.mode = 'ground';
  p.normal.copy(n);
  resetAir(p);
}

// ---------------------------------------------------------------- grind

function tryGrind(p: Player, w: World, ev: PhysEvent[]): boolean {
  if (p.grindCooldown > 0) return false;
  const sp = p.vel.length();
  if (sp < 3) return false;
  for (let i = 0; i < w.rails.length; i++) {
    const r = w.rails[i];
    if (p.pos.distanceTo(r.center) > r.radius + TUNE.grindSnap + 1) continue;
    const near = nearestOnRail(r, p.pos);
    if (near.dist > TUNE.grindSnap) continue;
    railAt(r, near.s, vRail, vTan);
    if (p.pos.y < vRail.y - 0.5) continue; // never from below
    const along = p.vel.dot(vTan);
    if (Math.abs(along) < TUNE.grindAlign * sp) continue;
    if (near.s < 0.5 || near.s > r.len - 0.5) continue;
    const dir: 1 | -1 = along >= 0 ? 1 : -1;
    const spin = Math.round(Math.abs(p.spin) / Math.PI) * 180 * Math.sign(p.spin || 1);
    if (p.grab) ev.push({ e: 'grabEnd', kind: p.grab, t: p.grabT });
    resetAir(p);
    p.mode = 'grind';
    p.grind = { rail: i, s: near.s, dir, speed: Math.max(Math.abs(along), sp * 0.8), t: 0 };
    p.lastRail = i;
    p.heading = yawOf(vTmp.copy(vTan).multiplyScalar(dir));
    p.flow = Math.min(1, p.flow + 0.04);
    ev.push({ e: 'grindStart', rail: i, ley: r.ley, spin });
    return true;
  }
  return false;
}

function stepGrind(p: Player, inp: Input, cmd: TrickCmd | null, w: World, dt: number, ev: PhysEvent[]): void {
  const gr = p.grind;
  if (!gr) {
    p.mode = 'air';
    return;
  }
  const r = w.rails[gr.rail];
  gr.t += dt;
  railAt(r, gr.s, vRail, vTan);
  // Gravity along the rail, and the ley-line current.
  const travelY = vTan.y * gr.dir;
  gr.speed += -G * travelY * dt;
  if (r.ley && gr.speed < TUNE.leyMax) gr.speed += TUNE.leyAccel * dt;
  if (r.ley) p.flow = Math.min(1, p.flow + 0.05 * dt);
  gr.speed *= 1 - 0.01 * dt;
  if (p.boosting) {
    gr.speed += TUNE.boostAccel * dt;
    p.flow = Math.max(0, p.flow - TUNE.boostDrain * dt);
  }
  gr.s += gr.dir * gr.speed * dt;
  railAt(r, gr.s, vRail, vTan);
  p.pos.copy(vRail);
  p.pos.y += 0.1;
  p.vel.copy(vTan).multiplyScalar(gr.dir * gr.speed);
  p.heading = yawOf(vTmp.copy(vTan).multiplyScalar(gr.dir));
  p.normal.copy(UP);

  const pop = chargeAndPop(p, inp, cmd, dt);
  const offEnd = gr.s <= 0 || gr.s >= r.len;
  const stalled = gr.speed < 1.5;
  if (pop || offEnd || stalled) {
    ev.push({ e: 'grindEnd', t: gr.t, ley: r.ley });
    p.grind = null;
    p.grindCooldown = TUNE.grindCooldown;
    if (pop) {
      p.vel.addScaledVector(UP, THREE.MathUtils.lerp(TUNE.ollieMin, TUNE.ollieMax, pop.power) * 0.9);
      goAir(p, ev, true);
      startTrick(p, pop.trick ?? { kind: 'pop', trick: 'ollie', power: pop.power }, ev);
    } else {
      p.vel.y += 2;
      goAir(p, ev, true);
    }
  }
}

// ---------------------------------------------------------------- bail

function stepBail(p: Player, w: World, dt: number): void {
  p.bailT -= dt;
  p.vel.y -= G * dt;
  const prevY = p.pos.y;
  p.pos.addScaledVector(p.vel, dt);
  const g = groundAt(w, p.pos.x, p.pos.z, prevY + 0.3, gScratch);
  let grounded = false;
  if (g && p.pos.y <= g.y + 0.02) {
    p.pos.y = g.y;
    p.vel.addScaledVector(g.normal, -p.vel.dot(g.normal));
    p.vel.multiplyScalar(Math.exp(-1.8 * dt));
    p.normal.copy(g.normal);
    grounded = true;
  }
  if (p.bailT <= 0) {
    if (grounded) {
      p.mode = 'ground';
      if (p.vel.lengthSq() > 1) p.heading = yawOf(p.vel);
    } else {
      p.mode = 'air';
      resetAir(p);
      takeoffSent.add(p); // the next touchdown is judged as a landing, with nothing to fail
    }
  }
}
