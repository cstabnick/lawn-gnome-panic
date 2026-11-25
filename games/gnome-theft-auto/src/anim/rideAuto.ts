// Riding poses picked by themselves (round 3): passengers sit in the pose their vehicle calls for (helicopter, plane,
// boat, golf cart, a fast open mower), long rides turn into a doze or seasickness, a rowing-boat driver rows, and every
// driver has a personality by vehicle (one hand on a golf cart, cool lean in a lowrider, white knuckles in the HOA van,
// road rage on the horn). Pure pickers plus one animator wrapper; player.ts, traffic.ts (and remotes.ts, if the online
// planner wants it) call createRideAnimator().update() after poseHands.
import type { GnomeModel } from '@lawn/gnome';
import { createAnimator, type Animator } from './animator';
import type { AnimId } from './types';

/** What a rider's pose depends on. Plain data so it is testable without a Vehicle. */
export interface RideInfo {
  kind: string;
  flies: boolean;
  fixedWing: boolean;
  boat: boolean;
  /** Closed cab (doors, no open top). */
  closed: boolean;
  /** 0 = driver, 1+ = passenger. */
  seat: number;
  /** |speed| / maxSpeed, 0..1. */
  speedFrac: number;
  /** Seconds since this rider got on. */
  rideT: number;
  /** A per-rider number (vehicle or player id) so riders differ. */
  seed: number;
  /** 0..1 sea roughness at the boat (waves.ts seaRoughness). Rough water brings seasickness sooner. */
  sea?: number;
}

/** After this long, a plane passenger dozes and some boat passengers turn green. */
export const LONG_RIDE_S = 40;

const hash = (n: number): number => {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  return (Math.imul(h, 0xc2b2ae35) >>> 0) / 4294967296;
};

/** Boats rowed or paddled by their driver instead of steered by grips. */
const ROWED: Readonly<Record<string, AnimId>> = { 'walnut-dinghy': 'boat-row', 'gravy-boat': 'boat-paddle' };

/** Each vehicle's driving personality (by kind), when the driver has one. */
const DRIVE_STYLE: Readonly<Record<string, AnimId>> = {
  'golf-cart': 'drive-casual', lowrider: 'drive-lean-cool', 'hoa-van': 'drive-white-knuckle', taxi: 'drive-elbow-out',
  'pot-rod': 'drive-elbow-out', 'snail-coach': 'drive-sleepy', 'boot-float': 'drive-sing-along', combine: 'drive-sleepy',
  'ride-on': 'drive-casual', 'teacup-trundler': 'drive-sing-along', 'barrow-buggy': 'drive-casual', 'lawn-roller': 'drive-sleepy',
  'euro-hatch': 'drive-white-knuckle', 'deux-pots': 'drive-sing-along', wespa: 'drive-lean-cool', 'baguette-trike': 'drive-elbow-out',
  'crepe-van': 'drive-casual',
};
const ANY_STYLE: readonly AnimId[] = ['drive-casual', 'drive-elbow-out', 'drive-sing-along', 'drive-lean-cool'];

/** The pose a passenger (seat >= 1) sits in. */
export function passengerAnim(r: RideInfo): AnimId {
  const h = hash(r.seed);
  if (r.flies && r.fixedWing) return r.rideT > LONG_RIDE_S && h < 0.6 ? 'sleep-seated' : 'plane-passenger';
  if (r.flies) {
    if (r.rideT < 4) return 'wave-from-seat';
    return h < 0.4 && !r.closed ? 'hang-out-door' : 'heli-passenger';
  }
  if (r.boat) {
    const sea = r.sea ?? 0;
    return r.rideT > LONG_RIDE_S * (1 - 0.7 * sea) && h < 0.35 + 0.45 * sea ? 'seasick' : 'boat-lookout';
  }
  if (r.kind === 'golf-cart') return 'golf-cart-passenger';
  if (r.rideT < 3) return 'wave-from-seat';
  if (r.speedFrac > 0.8 && !r.closed) return 'hold-on';
  return r.closed ? 'plane-passenger' : 'golf-cart-passenger';
}

/**
 * The driver's overlay (seat 0), or null for plain hands on the grips. `npc` drivers get a style for every vehicle (a
 * stable pick by seed); the player only for vehicles with a personality.
 */
export function driverAnim(r: RideInfo, npc = false): AnimId | null {
  const rowed = ROWED[r.kind];
  if (rowed) return r.speedFrac > 0.05 ? rowed : null;
  if (r.flies || r.boat) return r.speedFrac > 0.9 ? 'drive-white-knuckle' : null;
  if (r.speedFrac > 0.92) return 'drive-white-knuckle';
  const own = DRIVE_STYLE[r.kind];
  if (own) return own;
  return npc ? ANY_STYLE[Math.floor(hash(r.seed) * ANY_STYLE.length)] : null;
}

export interface RideAnimator {
  readonly animator: Animator;
  /** Every frame while seated, after model.update and poseHands. `horn`: the horn was pressed this frame (road rage). */
  update(model: GnomeModel, info: Omit<RideInfo, 'rideT'>, dt: number, horn?: boolean, npc?: boolean): void;
  /** Got off: everything back to rest, the ride clock restarts. */
  cancel(model: GnomeModel): void;
}

export function createRideAnimator(): RideAnimator {
  const animator = createAnimator();
  let rideT = 0;
  /** A one-shot (road rage, honk) is playing: hold the style until it ends. */
  let oneShot = false;
  const info: RideInfo = { kind: '', flies: false, fixedWing: false, boat: false, closed: false, seat: 0, speedFrac: 0, rideT: 0, seed: 0, sea: 0 };
  return {
    animator,
    update(model, src, dt, horn = false, npc = false) {
      rideT += dt;
      Object.assign(info, src);
      info.rideT = rideT;
      if (horn && info.seat === 0 && !info.flies && !info.boat) {
        oneShot = true;
        animator.play(Math.random() < 0.5 ? 'drive-road-rage' : 'drive-honk-pound', { onEnd: () => { oneShot = false; } });
      }
      if (!oneShot) {
        const want = info.seat > 0 ? passengerAnim(info) : driverAnim(info, npc);
        const cur = animator.current?.id ?? null;
        if (want && want !== cur) animator.play(want, { offset: hash(info.seed) * 2 });
        else if (!want && cur) animator.stop();
      }
      animator.apply(model, dt);
    },
    cancel(model) {
      animator.cancel(model);
      rideT = 0;
      oneShot = false;
    },
  };
}
