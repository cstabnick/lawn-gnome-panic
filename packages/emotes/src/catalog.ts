// Every emote. Axis notes for the @lawn/gnome rig (the gnome faces +z, its left is +x):
//  - arm.x: 0 hangs down, negative swings forward and up (-PI/2 straight ahead, -PI straight up), positive swings back.
//  - arm.z: left arm positive = out to the side, right arm negative = out to the side. Opposite sign = across the chest.
//  - leg.x: negative kicks forward, positive back. leg.z: like the arms.
//  - tip: positive tips the body forward (about the feet). lean: positive leans to the gnome's right. yaw: spin.
import type { EmoteDef, EmotePose } from './types';

const PI = Math.PI;
const { sin, cos, abs, max, min } = Math;
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smoothstep ease in-out on [0, 1]. */
const ease = (v: number): number => {
  const k = clamp01(v);
  return k * k * (3 - 2 * k);
};
/** 0 -> 1 over the first `inS` seconds and 1 -> 0 over the last `outS` seconds of a one-shot of length d. */
const envelope = (t: number, d: number, inS: number, outS: number): number => min(ease(t / inS), ease((d - t) / outS));

export const EMOTES: readonly EmoteDef[] = [
  {
    id: 'wave',
    label: 'Wave',
    icon: '👋',
    duration: 2,
    loop: false,
    free: true,
    pose(t, o) {
      const e = envelope(t, 2, 0.25, 0.3);
      o.armR.x = -0.4 * e;
      o.armR.z = (-2.5 + 0.35 * sin(t * 12)) * e;
      o.lean = -0.06 * e;
    },
  },
  {
    id: 'cheer',
    label: 'Cheer',
    icon: '🙌',
    duration: 1.6,
    loop: false,
    free: true,
    pose(t, o) {
      const e = envelope(t, 1.6, 0.15, 0.25);
      const hop = max(0, sin((t * 2 * PI) / 0.8));
      o.armL.x = o.armR.x = -2.9 * e;
      o.armL.z = (0.35 + 0.2 * hop) * e;
      o.armR.z = -(0.35 + 0.2 * hop) * e;
      o.lift = 0.22 * hop * e;
      o.legL.x = -0.3 * hop * e;
      o.legR.x = 0.2 * hop * e;
    },
  },
  {
    // The classic victory dance: four beats of arm pumps swinging side to side, then four beats of pointing up and
    // down with alternating kicks.
    id: 'battle-bop',
    label: 'Battle Bop',
    icon: '🕺',
    duration: 2.4,
    loop: true,
    pose(t, o) {
      const beatS = 0.3;
      const local = t % 2.4;
      const beat = local / beatS;
      const fadeIn = ease(t / 0.2);
      if (local < 1.2) {
        const s = sin(PI * beat);
        o.armL.x = o.armR.x = -1.3 * fadeIn;
        o.armL.z = (0.15 + 0.75 * s) * fadeIn;
        o.armR.z = (-0.15 + 0.75 * s) * fadeIn;
        o.shift = -0.07 * s * fadeIn;
        o.lean = 0.08 * s * fadeIn;
        o.lift = -0.04 * abs(s) * fadeIn;
        o.legL.x = 0.25 * max(0, -s);
        o.legR.x = 0.25 * max(0, s);
      } else {
        const c = cos(PI * beat);
        o.armL.x = -1.6 - 1.3 * c;
        o.armR.x = -1.6 + 1.3 * c;
        o.armL.z = 0.2;
        o.armR.z = -0.2;
        o.legL.x = -0.45 * max(0, c);
        o.legR.x = -0.45 * max(0, -c);
        o.lift = 0.06 * abs(sin(2 * PI * beat));
        o.yaw = 0.15 * c;
      }
    },
  },
  {
    id: 'floss',
    label: 'Floss',
    icon: '🏁',
    duration: 0.8,
    loop: true,
    pose(t, o) {
      const fadeIn = ease(t / 0.2);
      const s = sin((2 * PI * t) / 0.8) * fadeIn;
      // Both arms swing to the same side, one in front of the body and one behind; the hips go the other way.
      o.armL.z = 0.15 + 0.75 * s;
      o.armR.z = -0.15 + 0.75 * s;
      o.armL.x = -0.55 * s;
      o.armR.x = 0.55 * s;
      o.shift = -0.09 * s;
      o.lean = 0.12 * s;
      o.yaw = 0.1 * s;
    },
  },
  {
    id: 'golf-clap',
    label: 'Golf Clap',
    icon: '👏',
    duration: 2.2,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2.2, 0.25, 0.3);
      const clap = 0.5 + 0.5 * cos(t * 22);
      o.armL.x = o.armR.x = -1.15 * e;
      o.armL.z = (-0.12 - 0.18 * clap) * e;
      o.armR.z = (0.12 + 0.18 * clap) * e;
      o.tip = -0.05 * e;
    },
  },
  {
    id: 'fist-pump',
    label: 'Fist Pump',
    icon: '✊',
    duration: 1.5,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 1.5, 0.12, 0.25);
      const pump = max(0, sin(t * 4 * PI));
      o.armR.x = (-2.1 - 0.8 * pump) * e;
      o.armR.z = -0.25 * e;
      o.armL.x = -0.35 * e;
      o.legL.x = -0.35 * e;
      o.lift = 0.08 * pump * e;
      o.lean = 0.08 * e;
    },
  },
  {
    id: 'facepalm',
    label: 'Facepalm',
    icon: '🤦',
    duration: 2.2,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2.2, 0.3, 0.35);
      o.armR.x = -2.35 * e;
      o.armR.z = 0.55 * e;
      o.tip = 0.18 * e;
      o.yaw = 0.12 * sin(t * 6) * ease((t - 0.5) / 0.3) * e;
      o.armL.x = 0.15 * e;
    },
  },
  {
    id: 'salute',
    label: 'Salute',
    icon: '🫡',
    duration: 2,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2, 0.2, 0.3);
      o.armR.x = -2.55 * e;
      o.armR.z = 0.85 * e;
      o.legL.z = -0.04 * e;
      o.legR.z = 0.04 * e;
      o.tip = -0.06 * e;
      o.lift = 0.03 * e;
    },
  },
  {
    id: 'toadstool-jig',
    label: 'Toadstool Jig',
    icon: '🍄',
    duration: 1.2,
    loop: true,
    pose(t, o) {
      const fadeIn = ease(t / 0.2);
      const w = (2 * PI * t) / 1.2;
      const s = sin(w);
      // Hands on hips, alternating high kicks, a hop on every kick, turning side to side.
      o.armL.x = o.armR.x = 0.3 * fadeIn;
      o.armL.z = 0.65 * fadeIn;
      o.armR.z = -0.65 * fadeIn;
      o.legL.x = -0.75 * max(0, s) * fadeIn;
      o.legR.x = -0.75 * max(0, -s) * fadeIn;
      o.lift = 0.12 * abs(s) * fadeIn;
      o.yaw = 0.35 * sin(w / 2) * fadeIn;
      o.lean = -0.08 * s * fadeIn;
    },
  },
  {
    id: 'pinwheel-spin',
    label: 'Pinwheel Spin',
    icon: '🌀',
    duration: 2,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2, 0.2, 0.25);
      o.armL.z = 1.5 * e;
      o.armR.z = -1.5 * e;
      o.yaw = ease((t - 0.1) / 1.7) * 4 * PI;
      o.lift = 0.1 * sin(clamp01(t / 2) * PI);
      o.legL.z = 0.12 * e;
      o.legR.z = -0.12 * e;
    },
  },
  {
    id: 'spooked-shiver',
    label: 'Spooked Shiver',
    icon: '😱',
    duration: 2.2,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2.2, 0.15, 0.4);
      o.armL.x = o.armR.x = -2.0 * e;
      o.armL.z = -0.45 * e;
      o.armR.z = 0.45 * e;
      o.legL.z = 0.1 * e;
      o.legR.z = -0.1 * e;
      o.shift = 0.02 * sin(t * 60) * e;
      o.lean = 0.05 * sin(t * 47) * e;
      o.tip = -0.12 * e;
      o.lift = -0.04 * e;
    },
  },
  {
    // Lie face down (the rig pivots at the feet), ripple along the lawn, get back up.
    id: 'worm',
    label: 'The Worm',
    icon: '🪱',
    duration: 3.2,
    loop: false,
    pose(t, o) {
      const down = envelope(t, 3.2, 0.45, 0.5);
      const ripple = sin((t - 0.45) * 9) * ease((t - 0.45) / 0.2) * ease((2.7 - t) / 0.2);
      o.tip = (PI / 2 - 0.22 * ripple) * down;
      o.lift = (0.24 + 0.1 * max(0, ripple)) * down;
      o.armL.x = o.armR.x = -0.5 * down;
      o.legL.x = o.legR.x = 0.25 * max(0, -ripple) * down;
    },
  },
  {
    // Arms sweep up over the head while the gnome hops and tips back, then forward, once.
    id: 'parachute-flip',
    label: 'Parachute Flip',
    icon: '🪂',
    duration: 2.2,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2.2, 0.2, 0.35);
      const u = clamp01(t / 2.2);
      o.armL.x = o.armR.x = -2.8 * e;
      o.lift = 0.2 * sin(PI * u) * e;
      o.tip = -0.3 * sin(2 * PI * u) * e;
    },
  },
  {
    // Point one arm ahead, turn a full circle, drop the arm back down.
    id: 'compass-point',
    label: 'Compass Point',
    icon: '🧭',
    duration: 2.4,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2.4, 0.25, 0.4);
      o.armR.x = -1.4 * e;
      o.armR.z = -0.2 * e;
      o.yaw = 2 * PI * ease(t / 1.6);
    },
  },
  {
    // A tumble: the gnome topples backwards to the lawn, rolls onto its side and sits up again (the rig pivots at the feet).
    id: 'tumble-roll',
    label: 'Tumble Roll',
    icon: '🎳',
    duration: 2.6,
    loop: false,
    pose(t, o) {
      const e = envelope(t, 2.6, 0.5, 0.5);
      o.tip = -(PI / 2) * e;
      o.lift = 0.1 * e;
      o.yaw = 2 * PI * ease((t - 0.5) / 1.6) * (t > 0.5 ? 1 : 0);
      o.armL.x = o.armR.x = -1.2 * e;
      o.legL.x = o.legR.x = 0.5 * e;
    },
  },
  {
    // Gnome Theft Auto's Showboat reward: a show-off strut on the spot, chest out, arms swinging wide, hips rolling.
    id: 'showboat-strut',
    label: 'Showboat Strut',
    icon: '🦚',
    duration: 1.2,
    loop: true,
    pose(t, o) {
      const fadeIn = ease(t / 0.2);
      const w = (2 * PI * t) / 1.2;
      const s = sin(w);
      o.armL.x = -0.6 * s * fadeIn;
      o.armR.x = 0.6 * s * fadeIn;
      o.armL.z = 0.35 * fadeIn;
      o.armR.z = -0.35 * fadeIn;
      o.legL.x = -0.35 * max(0, s) * fadeIn;
      o.legR.x = -0.35 * max(0, -s) * fadeIn;
      o.lift = 0.05 * abs(s) * fadeIn;
      o.tip = -0.1 * fadeIn;
      o.lean = 0.1 * s * fadeIn;
      o.yaw = 0.2 * cos(w) * fadeIn;
    },
  },
];

const BY_ID = new Map(EMOTES.map((e) => [e.id, e]));

export function getEmote(id: string): EmoteDef | undefined {
  return BY_ID.get(id);
}

/** True for an id in the catalog (use it to validate network messages and saved loadouts). */
export function isEmoteId(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id);
}

/** A pose with every value zero (the gnome standing still). */
export function emptyPose(): EmotePose {
  return { armL: { x: 0, z: 0 }, armR: { x: 0, z: 0 }, legL: { x: 0, z: 0 }, legR: { x: 0, z: 0 }, lift: 0, shift: 0, yaw: 0, lean: 0, tip: 0 };
}

/** Sets every value of p back to zero. */
export function zeroPose(p: EmotePose): void {
  p.armL.x = p.armL.z = p.armR.x = p.armR.z = 0;
  p.legL.x = p.legL.z = p.legR.x = p.legR.z = 0;
  p.lift = p.shift = p.yaw = p.lean = p.tip = 0;
}

/** The pose of an emote at t seconds (a fresh object; for tests and previews). */
export function sampleEmote(def: EmoteDef, t: number): EmotePose {
  const p = emptyPose();
  def.pose(t, p);
  return p;
}
