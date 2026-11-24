// Tubing: the tow physics. Pure and deterministic: the tube's next state is a function of its state, the boat's pose,
// the rider's input, the sea and dt. Rules: tubing/types.ts TOW and the roadmap issue 1.4.
import { TOW } from './types';
import type { BoatPose, Sea, TubeEvent, TubeInput, TubeScore, TubeState } from './types';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The slot index 0..2 (anything else is clamped). */
function slotIndex(slot: number): number {
  return clamp(Math.round(slot), 0, TOW.slots.length - 1);
}

/** The rope's hook point on the boat for `slot`: the stern (radius behind the centre) shifted sideways by slot.side. */
export function hookPoint(b: BoatPose, slot: number): { x: number; z: number } {
  const s = TOW.slots[slotIndex(slot)];
  const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
  const lx = Math.cos(b.yaw), lz = -Math.sin(b.yaw);
  return { x: b.x - fx * b.radius + lx * s.side, z: b.z - fz * b.radius + lz * s.side };
}

/** A tube at rest on the water, rope length straight behind the hook point, facing the boat. */
export function newTube(b: BoatPose, slot: number, sea: Sea): TubeState {
  const h = hookPoint(b, slot);
  const rope = TOW.slots[slotIndex(slot)].rope;
  const x = h.x - Math.sin(b.yaw) * rope;
  const z = h.z - Math.cos(b.yaw) * rope;
  return {
    x, y: sea.surface(x, z) + TOW.floatY, z,
    vx: 0, vy: 0, vz: 0, yaw: b.yaw, lean: 0, air: 0, risk: 0, slot, fallen: false, hopT: 0,
  };
}

/** One step (dt <= 0.05; callers sub-step longer frames). Mutates t. */
export function stepTube(t: TubeState, b: BoatPose, inp: TubeInput, sea: Sea, dt: number): TubeEvent {
  let ev: TubeEvent = null;
  const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);

  // 1. Lean eases towards the input (0 while fallen).
  const leanTarget = t.fallen ? 0 : clamp(inp.lean, -1, 1);
  const leanStep = TOW.leanRate * dt;
  t.lean += clamp(leanTarget - t.lean, -leanStep, leanStep);

  // 2. Rope: from the tube to the hook point.
  const h = hookPoint(b, t.slot);
  const dx = h.x - t.x, dz = h.z - t.z;
  const d = Math.hypot(dx, dz);
  const ux = d > 1e-6 ? dx / d : fx;
  const uz = d > 1e-6 ? dz / d : fz;
  const rope = TOW.slots[slotIndex(t.slot)].rope;
  const px = -uz, pz = ux; // across the rope, to the rider's right

  // 3. On the water: the tube rides at the surface.
  const onWater = t.y <= sea.surface(t.x, t.z) + TOW.floatY + 0.02;

  // 4. Taut rope: spring and damping pull the tube along the rope; lean pushes it across.
  if (d > rope) {
    const bvx = fx * b.speed, bvz = fz * b.speed;
    const vrel = (bvx - t.vx) * ux + (bvz - t.vz) * uz;
    const a = TOW.k * (d - rope) + TOW.c * vrel;
    t.vx += ux * a * dt;
    t.vz += uz * a * dt;
    if (!t.fallen) {
      t.vx += px * TOW.leanForce * t.lean * dt;
      t.vz += pz * TOW.leanForce * t.lean * dt;
    }
  }

  // 5. Waves launch the tube up a rising face; a hop kicks it up.
  if (onWater) {
    const s = { x: 0, z: 0 };
    sea.slope(t.x, t.z, s);
    const rise = s.x * t.vx + s.z * t.vz;
    if (rise > 0) t.vy = Math.max(t.vy, rise * TOW.launch);
    if (inp.hop && !t.fallen && t.hopT <= 0) {
      t.vy = TOW.hopV;
      t.hopT = TOW.hopCooldown;
    }
  }

  // 6. Drag (much less in the air).
  const k = Math.exp(-TOW.drag * dt * (onWater ? 1 : 0.15));
  t.vx *= k;
  t.vz *= k;

  // 7. Gravity and motion.
  t.vy -= TOW.gravity * dt;
  t.x += t.vx * dt;
  t.y += t.vy * dt;
  t.z += t.vz * dt;

  // 8. Landing on the water, or staying in the air.
  const floor = sea.surface(t.x, t.z) + TOW.floatY;
  if (t.y <= floor) {
    if (t.air >= 0.25) {
      ev = { t: 'landed', air: t.air };
      if (t.air >= 0.5 && Math.abs(t.lean) > 0.8 && !t.fallen) t.risk += TOW.hardLanding;
    }
    t.y = floor;
    t.vy = 0;
    t.air = 0;
  } else {
    t.air += dt;
  }

  // 9. Face the hook point.
  t.yaw = Math.atan2(dx, dz);

  // 10. Fall risk: sideways speed while leaning hard, or going too fast.
  const side = Math.abs(t.vx * px + t.vz * pz);
  const sp = Math.hypot(t.vx, t.vz);
  let add = 0;
  if (side > TOW.sideFast && Math.abs(t.lean) > 0.6) add += (side - TOW.sideFast) * TOW.sideRisk * dt;
  if (sp > TOW.tooFast) add += (sp - TOW.tooFast) * TOW.fastRisk * dt;
  if (add > 0) t.risk += add;
  else t.risk = Math.max(0, t.risk - TOW.riskDrain * dt);
  if (!t.fallen && t.risk >= 1) {
    t.fallen = true;
    t.risk = 0;
    ev = { t: 'fell', vx: t.vx, vy: t.vy + TOW.throwUp, vz: t.vz };
  }

  // 11. Timers.
  t.hopT = Math.max(0, t.hopT - dt);
  return ev;
}

export function newScore(): TubeScore {
  return { air: 0, dist: 0, topSpeed: 0, falls: 0, points: 0, bigAirs: 0 };
}

/** Add one step to the score (mutates sc): distance and top speed while not fallen, air on 'landed', falls on 'fell'. */
export function scoreStep(sc: TubeScore, t: TubeState, ev: TubeEvent, dt: number): void {
  if (!t.fallen) {
    const sp = Math.hypot(t.vx, t.vz);
    sc.dist += sp * dt;
    sc.topSpeed = Math.max(sc.topSpeed, sp);
  }
  if (ev?.t === 'landed') {
    sc.air += ev.air;
    if (ev.air >= TOW.bigAirS) sc.bigAirs++;
  } else if (ev?.t === 'fell') {
    sc.falls++;
  }
  sc.points = Math.round(sc.dist + sc.air * TOW.airPoints + sc.bigAirs * TOW.bigAirPoints);
}
