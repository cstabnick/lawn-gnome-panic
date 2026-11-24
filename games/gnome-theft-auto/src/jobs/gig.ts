// Sim jobs: the gig machine. A gig is a list of stops; stepGig moves through them from one vehicle Sample a frame.
// Pure: no DOM, no three.js, no game objects.
import type { Gig, GigEvent, GigState, Sample } from './types';
import { newComfort, stepComfort, cargoLanding, cargoScore, landingScore } from './rating';
import { JOB_TUNING } from './defs';

export function startGig(gig: Gig): GigState {
  return {
    gig, idx: 0, phase: 'running', t: 0, dwellT: 0, outT: 0, comfort: newComfort(), condition: 1,
    reachedAt: [], scores: {}, touchdownVy: 0, failReason: null,
  };
}

function fail(st: GigState, reason: string): GigEvent {
  st.phase = 'failed';
  st.failReason = reason;
  return { t: 'failed', reason };
}

/** One frame. Rules: roadmap issue 1.2. */
export function stepGig(st: GigState, s: Sample, dt: number, storm: boolean): GigEvent {
  if (st.phase !== 'running') return null;
  st.t += dt;

  // Out of the job vehicle for too long fails the gig.
  if (!s.inVehicle) {
    st.outT += dt;
    if (st.outT > JOB_TUNING.outOfVehicleS) return fail(st, 'You left the vehicle.');
    return null;
  }
  st.outT = 0;

  const g = st.gig;
  const stop = g.stops[st.idx];
  if (!stop) return null;

  // Hard deadline for the current stop.
  if (stop.hardDue !== undefined && st.t > stop.hardDue) return fail(st, stop.hardReason ?? 'Too late.');

  // Ride and parcel wear while loaded.
  if (loaded(st)) {
    if (st.comfort.primed) {
      const jerk = Math.abs(s.speed - st.comfort.lastSpeed) / dt;
      if (g.parcels.length > 0) {
        st.condition = Math.max(0, st.condition - s.hpLoss * 3 - (s.ranOver ? 0.1 : 0) - (jerk > 14 ? 0.02 : 0));
      }
    }
    stepComfort(st.comfort, s, dt, g.personality, g.job, storm);
  } else {
    // Not loaded: keep the last values so the first loaded frame has no fake jerk.
    st.comfort.lastSpeed = s.speed; st.comfort.lastYaw = s.yaw; st.comfort.lastVy = s.vy; st.comfort.primed = true;
  }

  // Last airborne vertical speed, used for the landing score.
  if (s.aboveGround > 0.6) st.touchdownVy = s.vy;

  const d = Math.hypot(s.x - stop.x, s.z - stop.z);
  let reached = false;

  if (stop.action === 'gate') {
    const lo = stop.minAlt ?? -Infinity;
    const hi = stop.maxAlt ?? Infinity;
    reached = d <= stop.radius && s.aboveGround >= lo && s.aboveGround <= hi;
  } else if (stop.action === 'cargo') {
    if (d <= stop.radius && s.action) {
      const land = cargoLanding(s.x, s.z, s.aboveGround, Math.sin(s.yaw) * s.speed, Math.cos(s.yaw) * s.speed);
      st.scores[st.idx] = cargoScore(Math.hypot(land.x - stop.x, land.z - stop.z));
      reached = true;
    }
  } else {
    // pickup, drop, land: hold inside the radius, slow enough, for the dwell time.
    const inside = d <= stop.radius && s.speed < stop.maxSpeed &&
      (stop.action !== 'land' || s.aboveGround <= 0.6) &&
      (!stop.needsPlayer || s.playerAboard);
    if (inside) {
      st.dwellT += dt;
      reached = st.dwellT >= stop.dwell;
    } else {
      st.dwellT = 0;
    }
    if (reached && stop.action === 'land') {
      st.scores[st.idx] = landingScore(d, stop.radius, st.touchdownVy);
    }
  }

  if (!reached) return null;

  st.reachedAt.push(st.t);
  st.idx++;
  st.dwellT = 0;
  if (st.idx === g.stops.length) {
    st.phase = 'done';
    return { t: 'done' };
  }
  return { t: 'reached', stop: st.idx - 1 };
}

/** True while passengers or parcels are aboard: after the first stop is reached and while running. */
export function loaded(st: GigState): boolean {
  return st.idx > 0 && st.phase === 'running';
}

/** Seconds left on the clock (timeLimit - t; negative = late), or null without a clock. */
export function timeLeft(st: GigState): number | null {
  return st.gig.timeLimit > 0 ? st.gig.timeLimit - st.t : null;
}
