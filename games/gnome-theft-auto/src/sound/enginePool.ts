// A fixed pool of positional engine voices for other vehicles (the player's own engine is audio.ts). Each voice is one
// engineVoice.ts synth, driven by engineModel.ts: revs with inertia, load, doppler and distance muffling. A voice only
// changes hands while it is silent, so a new vehicle never slides the pitch or pan of one that is still sounding.
// Sirens and other loops stay on loops.ts.
import { busOut, getListener } from './bus';
import {
  dopplerRatio, firingHz, newEngineState, stepEngine, targetRevs,
  type EngineProfile, type EngineState,
} from './engineModel';
import { createEngineVoice, type EngineParams, type EngineVoice } from './engineVoice';
import { spatial, type Spatial } from './spatial';

export interface EngineSource {
  key: string;
  x: number;
  z: number;
  /** Velocity, world units per second (forward is (sin yaw, cos yaw) x speed). */
  vx: number;
  vz: number;
  /** |speed| / maxSpeed, 0..1, and throttle -1..1. */
  speed01: number;
  throttle: number;
  profile: EngineProfile;
  /** Audible range, metres (default 75; planes 220). */
  maxDist?: number;
}

export interface EnginePool {
  update(sources: readonly EngineSource[], dt: number): void;
  active(): number;
}

export interface VoiceSlot {
  key: string | null;
  free: boolean;
}

/** A source unseen this long (seconds) loses its engine state. */
const SEEN_FOR = 3;
/** A voice that lost its key this long (seconds) is silent and its synth is stopped. */
const SLEEP_AFTER = 1.5;
/** A voice that lost its key stays out of reach this long (seconds), so its last sound can finish fading. */
const RELEASE = 0.15;
const LISTENER_TAU = 0.2;
/** A listener jump faster than this (units/s) is a teleport, not a drive. */
const TELEPORT = 80;

/**
 * Give each slot the key it should play this frame (pure). A slot keeps its key while the key is still wanted; each
 * other wanted key, in order, goes to a slot that is empty and free; a slot that is not free and lost its key gets
 * null. A key is never placed twice, and a key with no free slot waits.
 */
export function planVoices(slots: readonly VoiceSlot[], wanted: readonly string[]): (string | null)[] {
  const out: (string | null)[] = slots.map(() => null);
  const wantSet = new Set(wanted);
  const placed = new Set<string>();
  slots.forEach((s, i) => {
    if (s.key !== null && wantSet.has(s.key) && !placed.has(s.key)) {
      out[i] = s.key;
      placed.add(s.key);
    }
  });
  let i = 0;
  for (const key of wanted) {
    if (placed.has(key)) continue;
    while (i < slots.length && !(out[i] === null && slots[i].key === null && slots[i].free === true)) i++;
    if (i >= slots.length) break;
    out[i] = key;
    placed.add(key);
    i++;
  }
  return out;
}

interface Entry {
  st: EngineState;
  seen: number;
}

interface Voice {
  ev: EngineVoice;
  panner: StereoPannerNode | null;
  key: string | null;
  releasedAt: number;
  idle: number;
  last: EngineParams;
  pan: number;
}

const SILENT: EngineParams = { hz: 20, load: 0, level: 0, bright: 0, rough: 0 };

export function createEnginePool(size: number): EnginePool {
  /** null = asleep (no nodes). */
  let voices: (Voice | null)[] = Array.from({ length: size }, () => null);
  let built: AudioContext | null = null;
  let clock = 0;
  const states = new Map<string, Entry>();
  let lastL: { x: number; z: number } | null = null;
  let lvx = 0;
  let lvz = 0;

  return {
    update(sources, dt) {
      const step = dt > 0 ? dt : 0;
      clock += step;
      const out = busOut();
      if (!out) return;
      if (built !== out.ctx) {
        voices = Array.from({ length: size }, () => null);
        built = out.ctx;
        lastL = null;
        lvx = 0;
        lvz = 0;
      }
      const now = out.ctx.currentTime;
      const l = getListener();

      // Listener velocity, one-pole smoothed; a teleport counts as no movement.
      if (lastL && step > 0) {
        let vx = (l.x - lastL.x) / step;
        let vz = (l.z - lastL.z) / step;
        if (Math.hypot(vx, vz) > TELEPORT) {
          vx = 0;
          vz = 0;
        }
        const a = 1 - Math.exp(-step / LISTENER_TAU);
        lvx += (vx - lvx) * a;
        lvz += (vz - lvz) * a;
      }
      lastL = { x: l.x, z: l.z };

      const audible: { key: string; s: Spatial; p: EngineParams }[] = [];
      for (const src of sources) {
        let e = states.get(src.key);
        if (!e) {
          e = { st: newEngineState(), seen: clock };
          states.set(src.key, e);
        }
        e.seen = clock;
        stepEngine(e.st, targetRevs(src.speed01, src.throttle, src.profile.gears), src.throttle, step);
        const s = spatial(src.x, src.z, l.x, l.z, l.yaw, src.maxDist ?? 75);
        if (s.gain < 0.01) continue;
        const doppler = dopplerRatio(src.x, src.z, src.vx, src.vz, l.x, l.z, lvx, lvz);
        audible.push({
          key: src.key,
          s,
          p: {
            hz: firingHz(src.profile, e.st.revs) * doppler,
            load: e.st.load,
            level: 0.11 * src.profile.gain * s.gain * (0.7 + 0.3 * e.st.load + 0.15 * e.st.revs),
            bright: src.profile.bright,
            rough: src.profile.rough,
            chop: src.profile.chop,
            maxCutoff: s.cutoff,
          },
        });
      }
      for (const [k, e] of states) if (clock - e.seen > SEEN_FOR) states.delete(k);

      audible.sort((a, b) => b.s.gain - a.s.gain);
      const top = audible.slice(0, size);
      const byKey = new Map(top.map((e) => [e.key, e]));

      const slots: VoiceSlot[] = voices.map((v) => ({
        key: v?.key ?? null,
        free: v === null || (v.key === null && now - v.releasedAt >= RELEASE),
      }));
      const assigned = planVoices(slots, top.map((e) => e.key));

      voices.forEach((v, i) => {
        const key = assigned[i];
        const e = key === null ? undefined : byKey.get(key);
        if (!e) {
          if (!v) return;
          if (v.key !== null) {
            v.key = null;
            v.releasedAt = now;
            v.ev.set({ ...v.last, level: 0 }, now, 0.03);
          }
          v.idle += step;
          if (v.idle > SLEEP_AFTER) {
            v.ev.stop(now);
            v.panner?.disconnect();
            voices[i] = null;
          }
          return;
        }

        let vo = v;
        if (!vo) {
          const panner = typeof out.ctx.createStereoPanner === 'function' ? out.ctx.createStereoPanner() : null;
          if (panner) panner.connect(out.world);
          const ev = createEngineVoice(out.ctx, panner ?? out.world);
          vo = { ev, panner, key: null, releasedAt: -Infinity, idle: 0, last: SILENT, pan: 0 };
          voices[i] = vo;
        }
        vo.idle = 0;
        if (vo.key !== key) {
          // A new key on a silent voice: jump to its params, pan straight there, then fade in.
          vo.key = key;
          vo.ev.snap(e.p, now);
          if (vo.panner) {
            vo.panner.pan.cancelScheduledValues(now);
            vo.panner.pan.setValueAtTime(e.s.pan, now);
          }
          vo.pan = e.s.pan;
          vo.ev.set(e.p, now, 0.06);
        } else {
          vo.ev.set(e.p, now);
          if (vo.panner && Math.abs(e.s.pan - vo.pan) > 0.02) {
            vo.panner.pan.setTargetAtTime(e.s.pan, now, 0.08);
            vo.pan = e.s.pan;
          }
        }
        vo.last = e.p;
      });
    },
    active() {
      let n = 0;
      for (const v of voices) if (v && v.key !== null && v.last.level > 0.001) n++;
      return n;
    },
  };
}
