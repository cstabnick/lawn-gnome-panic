// Sim jobs: ride comfort, stars, pay and scores. Pure maths on plain data (no DOM, no three.js).
import type { ComfortState, GigState, JobId, JobPerks, PayResult, Personality, Sample, Surge } from './types';
import { JOB_TUNING } from './defs';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const wrap = (a: number): number => {
  const t = Math.PI * 2;
  return ((((a + Math.PI) % t) + t) % t) - Math.PI;
};

export function newComfort(): ComfortState {
  return { score: 100, jolts: 0, crashes: 0, runOvers: 0, air: 0, stalls: 0, rough: 0, lastSpeed: 0, lastYaw: 0, lastVy: 0, primed: false };
}

/** One frame of ride quality (mutates c). Rules: roadmap issue 1.2. */
export function stepComfort(c: ComfortState, s: Sample, dt: number, p: Personality, job: JobId, storm: boolean): void {
  if (!c.primed) {
    c.lastSpeed = s.speed; c.lastYaw = s.yaw; c.lastVy = s.vy; c.primed = true;
    return;
  }
  const accel = Math.abs(s.speed - c.lastSpeed) / dt;
  const yawRate = Math.abs(wrap(s.yaw - c.lastYaw)) / dt;
  const vAccel = Math.abs(s.vy - c.lastVy) / dt;
  const sens = p === 'nervous' || p === 'celebrity' ? 2 : p === 'hurry' ? 0.5 : 1;

  if (accel > 9) c.score -= (accel - 9) * 0.5 * sens * dt;
  if (accel > 20) c.jolts++;
  const lat = yawRate * s.speed;
  if (lat > 8) c.score -= (lat - 8) * 0.4 * sens * dt;
  if (s.hpLoss > 0.005) { c.crashes++; c.score -= 12 * sens; }
  if (s.ranOver) { c.runOvers++; c.score -= 25; }
  if (job !== 'pilot' && s.aboveGround > 0.8) { c.air += dt; c.score -= 8 * sens * dt; }
  if (job === 'pilot') {
    if (vAccel > 6) c.score -= (vAccel - 6) * 0.3 * sens * dt;
    if (s.stalled) { c.stalls += dt; c.score -= 10 * sens * dt; }
  }
  if (job === 'boat') {
    const rough = s.waveSlope * s.speed;
    const thr = storm ? 0.9 : 1.2;
    if (rough > thr) { c.rough += dt; c.score -= (rough - thr) * 6 * sens * dt; }
  }

  c.score = clamp(c.score + 1.5 * dt, 0, 100);
  c.lastSpeed = s.speed; c.lastYaw = s.yaw; c.lastVy = s.vy;
}

/** 1..5 stars from comfort score 0..100 and timeRatio (time taken / time allowed; <= 1 is on time; 0 = no clock). */
export function starsFor(comfort: number, timeRatio: number): 1 | 2 | 3 | 4 | 5 {
  let base = comfort >= 90 ? 5 : comfort >= 75 ? 4 : comfort >= 55 ? 3 : comfort >= 35 ? 2 : 1;
  if (timeRatio > 1.5) base -= 2;
  else if (timeRatio > 1.15) base -= 1;
  return clamp(base, 1, 5) as 1 | 2 | 3 | 4 | 5;
}

/** 0..100: landing accuracy from distance to the zone centre, the zone radius and touchdown vertical speed (m/s, - = down). */
export function landingScore(dist: number, radius: number, touchdownVy: number): number {
  const acc = (radius > 0 ? clamp(1 - dist / radius, 0, 1) : 0) * 60;
  const soft = touchdownVy >= -1 ? 40 : touchdownVy <= -6 ? 0 : 40 * (1 - (-touchdownVy - 1) / 5);
  return Math.round(acc + soft);
}

/** 0..100: a cargo crate landing `dist` metres from the target. */
export function cargoScore(dist: number): number {
  return Math.round(100 * clamp(1 - dist / 60, 0, 1));
}

/** Where a crate released at height h (m) with ground velocity (vx, vz) lands: (x + vx*t, z + vz*t), t = sqrt(2h/18). */
export function cargoLanding(x: number, z: number, h: number, vx: number, vz: number): { x: number; z: number } {
  const t = Math.sqrt((2 * Math.max(0, h)) / 18);
  return { x: x + vx * t, z: z + vz * t };
}

/** The pay for a finished (phase 'done') gig. Formula: roadmap issue 1.2. */
export function payFor(st: GigState, perks: JobPerks, surge: Surge): PayResult {
  const g = st.gig;
  const T = JOB_TUNING;

  // 1. Base pay.
  let base = g.basePay * perks.payMult * surge.payMult * (surge.celebrity ? T.celebrityMult : 1);

  // 2. Parcels.
  if (g.parcels.includes('fragile')) base *= 0.4 + 0.6 * st.condition;
  else if (g.parcels.length > 0) base *= 0.8 + 0.2 * st.condition;

  // 3. Scores (landing and cargo stops).
  const scores = Object.values(st.scores);
  if (scores.length > 0) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    base *= g.kind === 'cargo' ? 0.3 + (0.7 * avg) / 100 : 0.6 + (0.4 * avg) / 100;
  }

  // 4. Time: early bonus, late penalty, and a per-stop penalty for each soft due missed.
  const timeRatio = g.timeLimit > 0 ? st.t / g.timeLimit : 0;
  let time = g.timeLimit > 0 ? base * clamp(1 - timeRatio, -0.5, 0.3) : 0;
  g.stops.forEach((stop, i) => {
    if (stop.due !== undefined && i < st.reachedAt.length && st.reachedAt[i] > stop.due) {
      time -= base * 0.05;
    }
  });

  // 5. Stars.
  const stars = starsFor(st.comfort.score, timeRatio);

  // 6. Tip.
  const tip = base * T.tipMax * ((stars - 1) / 4) * perks.tipMult * (surge.celebrity ? 2 : 1) *
    (g.personality === 'chatty' ? 1.2 : 1) *
    (g.personality === 'hurry' && timeRatio > 0 && timeRatio <= 0.8 ? 1.5 : 1);

  // 7. Bonus.
  const bonus = g.kind === 'player-fare' ? T.playerFareBonus : 0;

  // 8. Round and total.
  const rBase = Math.round(base);
  const rTime = Math.round(time);
  const rTip = Math.round(tip);
  const rBonus = Math.round(bonus);
  const total = Math.max(0, rBase + rTime + rTip + rBonus);
  const xp = Math.round(10 + stars * 6 + total / 5);

  // 9. Notes.
  const notes: string[] = [`Fare ${rBase}`];
  if (rTime > 0) notes.push(`Early +${rTime}`);
  else if (rTime < 0) notes.push(`Late ${rTime}`);
  if (rTip > 0) notes.push(`Tip ${rTip} (${stars} stars)`);
  if (surge.rush) notes.push('Rush hour x1.25');
  if (surge.storm) notes.push('Storm pay x1.4');
  if (surge.celebrity) notes.push('Celebrity x2');
  if (g.parcels.length > 0) notes.push(`Parcels ${Math.round(st.condition * 100)}%`);
  g.stops.forEach((stop, i) => {
    const sc = st.scores[i];
    if (sc === undefined) return;
    if (stop.action === 'land') notes.push(`Landing ${sc}`);
    else if (stop.action === 'cargo') notes.push(`Cargo ${sc}`);
  });
  if (rBonus > 0) notes.push(`Real gnome +${rBonus}`);

  return { base: rBase, time: rTime, tip: rTip, bonus: rBonus, total, stars, xp, notes };
}
