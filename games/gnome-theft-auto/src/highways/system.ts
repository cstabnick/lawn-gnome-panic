// Skyway runtime (docs/roadmaps/gta-highways.md, H2.2): walls for the player's vehicle and feet, and two achievements.
import type { Pushed } from '../collide';
import { groundAt } from '../terrain';
import type { Player, Vehicle } from '../types';
import { deckContactsAt, pushOutOfDecks, skywayLength } from './deck';

export interface HighwaysDeps {
  toast(text: string, ms?: number): void;
  unlock(id: string): void;
}

export interface Highways {
  /** Once per frame, after the player and its vehicle have moved. */
  update(dt: number, player: Player): void;
}

const TURFTON = 'turfton-skyway';
const SPAN = 'unfinished-span';
/** A run counts as end to end when the player covered the length less this much. */
const RUN_SLACK = 12;
/** Seconds off the Turfton deck before a run is forgotten. */
const RUN_GRACE = 3;
/** Metres from the Span's open end that count as the lip. */
const LIP = 3;
/** Seconds after leaving the lip in which the car must go airborne off the deck. */
const LIP_WINDOW = 1.5;
/** Horizontal metres from the launch point a landing needs for Mind the Gap. */
const GAP_MIN = 25;
/** Foot walking radius against the decks. */
const FOOT_R = 0.4;

/** True when a run that reached `min`..`max` along a skyway of `length` metres counts as end to end. */
export function runComplete(min: number, max: number, length: number): boolean {
  return max - min >= length - RUN_SLACK;
}

/** True when a landing point is far enough from the launch point to count as a jump over the gap. */
export function gapCleared(launchX: number, launchZ: number, landX: number, landZ: number): boolean {
  return Math.hypot(landX - launchX, landZ - launchZ) >= GAP_MIN;
}

interface Run { min: number; max: number; off: number; done: boolean }
interface Gap {
  /** Seconds since the car was last at the lip; -1 when not armed. */
  armT: number;
  launch: { x: number; z: number } | null;
}

/** Apply a wall push to a ground vehicle (sim body or arcade), the same way stunts.ts does for ramp sides. */
function pushVehicle(v: Vehicle, s: Pushed): void {
  if (v.sim) {
    const body = v.sim.ctrl.body;
    body.pos.x += s.x - v.x;
    body.pos.z += s.z - v.z;
    v.x = s.x;
    v.z = s.z;
    v.sim.lastX = v.x;
    v.sim.lastZ = v.z;
    const vn = body.vel.x * s.nx + body.vel.z * s.nz;
    if (vn < 0) { body.vel.x -= vn * s.nx; body.vel.z -= vn * s.nz; }
  } else {
    v.x = s.x;
    v.z = s.z;
    const fx = Math.sin(v.yaw);
    const fz = Math.cos(v.yaw);
    let vx = fx * v.speed;
    let vz = fz * v.speed;
    const vn = vx * s.nx + vz * s.nz;
    if (vn < 0) { vx -= vn * s.nx; vz -= vn * s.nz; }
    v.speed = vx * fx + vz * fz;
  }
}

export function createHighways(deps: HighwaysDeps): Highways {
  const seen = new Set<string>();
  let run: Run | null = null;
  let gap: Gap = { armT: -1, launch: null };

  const resetDriving = (): void => {
    run = null;
    gap = { armT: -1, launch: null };
  };

  return {
    update(dt: number, player: Player) {
      const v = player.vehicle;
      if (!v) {
        resetDriving();
        const s = pushOutOfDecks(player.x, player.z, FOOT_R, player.y);
        if (s.hit) { player.x = s.x; player.z = s.z; }
        return;
      }
      if (v.spec.flies || v.spec.boat) { resetDriving(); return; }

      const baseY = v.sim ? v.sim.py : v.y;
      const s = pushOutOfDecks(v.x, v.z, v.spec.radius, baseY);
      if (s.hit) pushVehicle(v, s);

      // The deck the car is driving on (its top at the car's base), if any.
      const deck = deckContactsAt(v.x, v.z).find((c) => Math.abs(baseY - c.surfaceY) < 1) ?? null;
      if (deck && !seen.has(deck.skyway.id)) {
        seen.add(deck.skyway.id);
        deps.toast(deck.skyway.name, 2500);
      }

      // Skyway run: the Turfton Skyway from one end to the other.
      if (deck && deck.skyway.id === TURFTON) {
        if (!run) run = { min: deck.along, max: deck.along, off: 0, done: false };
        run.min = Math.min(run.min, deck.along);
        run.max = Math.max(run.max, deck.along);
        run.off = 0;
        if (!run.done && runComplete(run.min, run.max, skywayLength(TURFTON))) {
          run.done = true;
          deps.unlock('gta-skyway-run');
          deps.toast('Turfton Skyway: end to end!');
        }
      } else if (run) {
        run.off += dt;
        if (run.off > RUN_GRACE) run = null;
      }

      // Mind the Gap: leave the Unfinished Span's open end airborne and land far enough out.
      const airborne = v.sim
        ? v.sim.ctrl.telemetry.groundedWheels === 0
        : v.y - groundAt(v.x, v.z, v.y) > 0.5;
      const onLip = deck !== null && deck.skyway.id === SPAN && deck.along >= skywayLength(SPAN) - LIP;
      const onSpan = deck !== null && deck.skyway.id === SPAN;
      if (gap.launch) {
        if (!airborne) {
          if (gapCleared(gap.launch.x, gap.launch.z, v.x, v.z)) {
            deps.unlock('gta-mind-the-gap');
            deps.toast('Mind the gap!');
          }
          gap = { armT: -1, launch: null };
        }
      } else if (onLip && !airborne) {
        gap = { armT: 0, launch: null };
      } else if (gap.armT >= 0) {
        gap.armT += dt;
        if (!onSpan && airborne) gap.launch = { x: v.x, z: v.z };
        else if (gap.armT > LIP_WINDOW) gap = { armT: -1, launch: null };
      }
    },
  };
}
