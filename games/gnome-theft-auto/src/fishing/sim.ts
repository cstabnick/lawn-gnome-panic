// Fishing: the pure line simulation (cast, wait, bite, hook, reel with tension, land or lose). Plain data, no THREE, no
// DOM. Every phase change resets s.t to 0; stepFishing adds dt to s.t first. No allocation in stepFishing.
import { FIGHT, FISH, type FishEvent, type FishSpecies, type FishingState, type SimEnv, type SimInput } from './types';
import { waveSurfaceOffset } from '../waves';

export function createFishingState(): FishingState {
  return {
    phase: 'idle', t: 0, charge: 0, fromX: 0, fromY: 0, fromZ: 0, toX: 0, toZ: 0, surface: 0, bobX: 0, bobY: 0, bobZ: 0,
    dip: 0, biteIn: 0, nibbleT: 0, fish: null, size: 0, window: 0, line: 0, startLine: 0, tension: 0, pull: 0, pullT: 0,
    burstT: 0, stamina: 1, slackT: 0, wobble: 0,
  };
}

function rand(env: SimEnv, a: number, b: number): number {
  return a + env.rnd() * (b - a);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** One step of the line. Returns what happened this step, or null. */
export function stepFishing(s: FishingState, inp: SimInput, env: SimEnv, dt: number): FishEvent | null {
  s.t += dt;
  switch (s.phase) {
    case 'idle': {
      s.dip = 0;
      if (inp.pressed) {
        s.phase = 'charge';
        s.t = 0;
        s.charge = 0;
      }
      return null;
    }

    case 'charge': {
      s.charge = Math.min(1, s.charge + dt / FISH.chargeTime);
      if (!(inp.released || !inp.hold)) return null;
      const d0 = FISH.minCast + s.charge * (env.rod.castRange - FISH.minCast);
      const yaw = env.origin.yaw;
      for (let k = 0; ; k++) {
        const d = d0 - 0.5 * k;
        if (d < 1.5) break;
        const tx = env.origin.x + Math.sin(yaw) * d;
        const tz = env.origin.z + Math.cos(yaw) * d;
        const w = env.water(tx, tz);
        if (w !== null) {
          s.fromX = env.origin.x;
          s.fromY = env.origin.y;
          s.fromZ = env.origin.z;
          s.toX = tx;
          s.toZ = tz;
          // env.water is the wave-raised surface; keep the still level here (fishView adds the wave back to the bobber).
          s.surface = w - waveSurfaceOffset(tx, tz);
          s.bobX = s.fromX;
          s.bobY = s.fromY;
          s.bobZ = s.fromZ;
          s.phase = 'flight';
          s.t = 0;
          return 'cast';
        }
      }
      s.phase = 'idle';
      s.t = 0;
      return 'dry';
    }

    case 'flight': {
      const k = Math.min(1, s.t / FISH.flightTime);
      s.bobX = s.fromX + (s.toX - s.fromX) * k;
      s.bobZ = s.fromZ + (s.toZ - s.fromZ) * k;
      s.bobY = s.fromY + (s.surface - s.fromY) * k + FISH.arc * 4 * k * (1 - k);
      if (k >= 1) {
        s.bobX = s.toX;
        s.bobY = s.surface;
        s.bobZ = s.toZ;
        s.phase = 'wait';
        s.t = 0;
        s.biteIn = env.biteDelay();
        s.nibbleT = 0;
        s.dip = 0;
        return 'plop';
      }
      return null;
    }

    case 'wait': {
      s.dip = Math.max(0, s.dip - dt * 3);
      if (inp.pressed) {
        s.phase = 'idle';
        s.t = 0;
        return 'early';
      }
      s.biteIn -= dt;
      if (s.biteIn > 0 && s.biteIn < FISH.nibbleLead) {
        s.nibbleT -= dt;
        if (s.nibbleT <= 0) {
          s.nibbleT = rand(env, 0.4, 0.7);
          s.dip = 0.35;
          return 'nibble';
        }
      }
      if (s.biteIn <= 0) {
        const r = env.pick();
        if (r === null) {
          s.biteIn = env.biteDelay();
          return null;
        }
        s.fish = r.fish;
        s.size = r.size;
        s.phase = 'bite';
        s.t = 0;
        s.window = FISH.biteWindow * (1.15 - 0.1 * r.fish.difficulty);
        s.dip = 1;
        return 'bite';
      }
      return null;
    }

    case 'bite': {
      const fish = s.fish as FishSpecies;
      s.dip = 1;
      s.window -= dt;
      if (inp.pressed) {
        const dx = s.bobX - env.origin.x;
        const dz = s.bobZ - env.origin.z;
        s.phase = 'reel';
        s.t = 0;
        s.line = Math.max(FISH.landDist + 0.5, Math.hypot(dx, dz));
        s.startLine = s.line;
        s.tension = FISH.hookTension;
        s.pull = FISH.restPull;
        s.stamina = 1;
        s.slackT = 0;
        s.burstT = 0;
        s.pullT = rand(env, FIGHT[fish.fight].every[0], FIGHT[fish.fight].every[1]);
        return 'hooked';
      }
      if (s.window <= 0) {
        s.phase = 'wait';
        s.t = 0;
        s.fish = null;
        s.size = 0;
        s.dip = 0;
        s.biteIn = env.biteDelay();
        return 'missed';
      }
      return null;
    }

    case 'reel': {
      const fish = s.fish as FishSpecies;
      const f = FIGHT[fish.fight];
      const sizeFrac = clamp01((s.size - fish.size[0]) / (fish.size[1] - fish.size[0]));
      const power = Math.min(1, f.strength * (0.7 + 0.15 * fish.difficulty) * (0.8 + 0.4 * sizeFrac));
      let ev: FishEvent | null = null;

      if (s.burstT > 0) {
        s.burstT -= dt;
        s.pull = power * Math.max(0.3, s.stamina);
        if (s.burstT <= 0) {
          s.burstT = 0;
          s.pullT = rand(env, f.every[0], f.every[1]);
        }
      } else {
        s.pullT -= dt;
        s.pull += (FISH.restPull - s.pull) * Math.min(1, dt * 4);
        if (s.pullT <= 0) {
          s.burstT = rand(env, f.burst[0], f.burst[1]);
          ev = 'burst';
        }
      }

      if (inp.hold) {
        s.tension += dt * FISH.tensionRise * (0.4 + s.pull * 1.6) / env.rod.strength;
        s.line -= dt * env.rod.reelSpeed * (1 - s.pull * 0.7);
        s.stamina -= dt * FISH.tire * (0.5 + s.pull) / f.stamina;
      } else {
        s.tension -= dt * FISH.tensionFall;
        s.line += dt * s.pull * FISH.runSpeed * f.run;
        s.stamina -= dt * FISH.tire * 0.3 / f.stamina;
      }
      s.stamina = clamp01(s.stamina);

      if (s.tension >= 1) {
        s.tension = 1;
        s.phase = 'lost';
        s.t = 0;
        s.fish = null;
        return 'snapped';
      }
      s.tension = Math.max(0, s.tension);

      s.slackT = s.tension < FISH.slackBelow ? s.slackT + dt : 0;
      if (s.slackT >= FISH.slackLimit) {
        s.phase = 'lost';
        s.t = 0;
        s.fish = null;
        return 'slipped';
      }

      if (s.line > env.rod.castRange * FISH.maxLineMul) {
        s.phase = 'lost';
        s.t = 0;
        s.fish = null;
        return 'slipped';
      }

      if (s.line <= FISH.landDist) {
        s.phase = 'landed';
        s.t = 0;
        return 'landed';
      }

      const dx = s.bobX - env.origin.x;
      const dz = s.bobZ - env.origin.z;
      const d = Math.hypot(dx, dz) || 1;
      s.bobX = env.origin.x + (dx / d) * s.line;
      s.bobZ = env.origin.z + (dz / d) * s.line;
      s.bobY = s.surface;
      s.wobble = Math.sin(s.t * 9) * 0.4 * s.pull;
      return ev;
    }

    default:
      // landed, lost: nothing until the caller resets the line.
      return null;
  }
}

/** Back to idle (after a landed or lost line has been shown, or when fishing stops). */
export function resetFishing(s: FishingState): void {
  s.phase = 'idle';
  s.t = 0;
  s.charge = 0;
  s.fish = null;
  s.size = 0;
  s.dip = 0;
  s.tension = 0;
  s.pull = 0;
  s.line = 0;
  s.startLine = 0;
  s.burstT = 0;
  s.slackT = 0;
  s.wobble = 0;
}

/** Debug trainer: while waiting, make `fish` bite now. False when not waiting. */
export function forceBite(s: FishingState, fish: FishSpecies, size: number): boolean {
  if (s.phase !== 'wait') return false;
  s.fish = fish;
  s.size = size;
  s.phase = 'bite';
  s.t = 0;
  s.window = 2 * FISH.biteWindow;
  s.dip = 1;
  return true;
}
