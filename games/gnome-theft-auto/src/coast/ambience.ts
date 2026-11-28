// The coast's sound bed (FX11, G3#24): continuous surf scaled by distance to the shore, the boardwalk murmur and organ,
// the Spokewheel's creak, the Queen's rigging. Replaces the old random surf / bell / gull ticks in life.ts.
import type { JobsDeps } from '../jobs/types';
import { busOut, getListener, playAt, registerSound } from '../sound/bus';
import { noise, tone } from '../sound/synth';
import { currentInterior } from '../interiors';
import { COAST } from './config';
import { coastNight } from './nightLights';
import type { CoastPart } from './types';

const AMB = {
  /** Surf bed: full within `near` m of the shore line, zero `far` m inland; zero outside the coast region. */
  surf: { near: 25, far: 220, regionX: 1400, regionZ: 950, gain: 0.5, filterHz: 650, lfoA: 0.11, lfoB: 0.07, washEvery: [6, 12], washRange: 80 },
  murmur: { range: 60, gain: 0.35, nightCut: 0.6, filterHz: 800 },
  deck: { x0: -210, x1: 210, z0: 1102, z1: 1132 },
  wheel: { x: -260, z: 1100, organRange: 90, organGain: 0.35, organGap: [1, 2], creakEvery: [5, 9], creakRange: 60 },
  queen: { x: 300, z: 1268, range: 50, tickEvery: [1.5, 4], creakEvery: [6, 10] },
  bell: { range: 150, every: [10, 20] },
  gull: { shoreRange: 150, every: [10, 20], spread: 40, nightSkip: 0.7 },
  smooth: 0.4,
} as const;

/** Surf bed level 0..1 at a listener position. */
export function surfLevel(x: number, z: number): number {
  const s = AMB.surf;
  if (Math.abs(x) > s.regionX || z < s.regionZ) return 0;
  const inland = COAST.shoreZ - z;
  if (inland <= s.near) return 1;
  return Math.max(0, 1 - (inland - s.near) / (s.far - s.near));
}

/** Boardwalk murmur level 0..1: full over the deck, zero 60 m away; quieter at night (night 0..1). */
export function murmurLevel(x: number, z: number, night = 0): number {
  const d = AMB.deck;
  const dx = Math.max(d.x0 - x, 0, x - d.x1);
  const dz = Math.max(d.z0 - z, 0, z - d.z1);
  const lvl = Math.max(0, 1 - Math.hypot(dx, dz) / AMB.murmur.range);
  return lvl * (1 - AMB.murmur.nightCut * night);
}

// A jaunty calliope: semitones above C5, 0.26 s a note. Three phrases.
const NOTE = 0.26;
const PHRASES: number[][] = [
  [0, 4, 7, 12, 7, 4, 7, 0],
  [7, 7, 9, 7, 12, 11, 7, 4, 0],
  [0, 2, 4, 5, 7, 9, 12, 12],
];
const organId = (i: number): string => `coast-organ-${i}`;
const phraseDur = (i: number): number => PHRASES[i].length * NOTE + 0.1;

function registerRecipes(): void {
  PHRASES.forEach((notes, i) => {
    registerSound(organId(i), (c, out, t) => {
      notes.forEach((n, k) => {
        const f = 523.25 * Math.pow(2, n / 12);
        const at = t + k * NOTE;
        tone(c, out, 'square', at, NOTE * 0.9, f, f * 1.006, 0.05, 0.01);
        tone(c, out, 'triangle', at, NOTE * 0.9, f / 2, (f / 2) * 1.004, 0.08, 0.01);
      });
      return phraseDur(i);
    });
  });
  registerSound('coast-halyard', (c, out, t, info) => {
    tone(c, out, 'triangle', t, 0.05, 2400 + info.rand * 900, 1800, 0.06, 0.002);
    return 0.06;
  });
}

const rnd = (r: readonly number[]): number => r[0] + Math.random() * (r[1] - r[0]);

interface Beds {
  ctx: AudioContext;
  surf: GainNode;
  murmur: GainNode;
}

function lfo(ctx: AudioContext, hz: number, depth: number, into: AudioParam): void {
  const o = ctx.createOscillator();
  o.frequency.value = hz;
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(into);
  o.start();
}

function buildBeds(ctx: AudioContext, into: GainNode): Beds {
  const surfSrc = ctx.createBufferSource();
  surfSrc.buffer = noise(ctx);
  surfSrc.loop = true;
  const sf = ctx.createBiquadFilter();
  sf.type = 'bandpass';
  sf.frequency.value = AMB.surf.filterHz;
  sf.Q.value = 0.5;
  const swell = ctx.createGain();
  swell.gain.value = 0.6;
  lfo(ctx, AMB.surf.lfoA, 0.28, swell.gain);
  lfo(ctx, AMB.surf.lfoB, 0.18, swell.gain);
  const surf = ctx.createGain();
  surf.gain.value = 0;
  surfSrc.connect(sf).connect(swell).connect(surf).connect(into);
  surfSrc.start();

  const mSrc = ctx.createBufferSource();
  mSrc.buffer = noise(ctx);
  mSrc.loop = true;
  const mf = ctx.createBiquadFilter();
  mf.type = 'bandpass';
  mf.frequency.value = AMB.murmur.filterHz;
  mf.Q.value = 0.4;
  const wob = ctx.createGain();
  wob.gain.value = 0.7;
  lfo(ctx, 0.37, 0.2, wob.gain);
  lfo(ctx, 0.83, 0.1, wob.gain);
  const murmur = ctx.createGain();
  murmur.gain.value = 0;
  mSrc.connect(mf).connect(wob).connect(murmur).connect(into);
  mSrc.start();
  return { ctx, surf, murmur };
}

export function installCoastAmbience(_deps: JobsDeps): CoastPart {
  registerRecipes();
  let beds: Beds | null = null;
  let washT = rnd(AMB.surf.washEvery);
  let organT = 0.5;
  let organIdx = Math.floor(Math.random() * PHRASES.length);
  let wheelT = rnd(AMB.wheel.creakEvery);
  let tickT = rnd(AMB.queen.tickEvery);
  let timberT = rnd(AMB.queen.creakEvery);
  let bellT = rnd(AMB.bell.every);
  let gullT = rnd(AMB.gull.every);
  const at = { x: 0, z: 0 };

  return {
    update(dt: number): void {
      const out = busOut();
      if (!out) return;
      if (!beds || beds.ctx !== out.ctx) beds = buildBeds(out.ctx, out.ambience);
      const L = getListener();
      const inside = currentInterior() !== null;
      const night = coastNight();
      const now = out.ctx.currentTime;
      beds.surf.gain.setTargetAtTime(inside ? 0 : surfLevel(L.x, L.z) * AMB.surf.gain, now, AMB.smooth);
      beds.murmur.gain.setTargetAtTime(inside ? 0 : murmurLevel(L.x, L.z, night) * AMB.murmur.gain, now, AMB.smooth);
      if (inside) return;

      washT -= dt;
      if (washT <= 0) {
        washT = rnd(AMB.surf.washEvery);
        if (Math.abs(L.z - COAST.shoreZ) <= AMB.surf.washRange && surfLevel(L.x, L.z) > 0) {
          at.x = L.x;
          at.z = COAST.shoreZ;
          playAt('surf-wash', at, { bus: 'ambience' });
        }
      }

      const w = AMB.wheel;
      const wd = Math.hypot(L.x - w.x, L.z - w.z);
      organT -= dt;
      if (organT <= 0) {
        const i = organIdx;
        organIdx = Math.floor(Math.random() * PHRASES.length);
        organT = phraseDur(i) + rnd(w.organGap);
        if (wd <= w.organRange) playAt(organId(i), w, { bus: 'ambience', maxDist: w.organRange, gain: w.organGain });
      }
      wheelT -= dt;
      if (wheelT <= 0) {
        wheelT = rnd(w.creakEvery);
        if (wd <= w.creakRange) playAt('door-creak', w, { bus: 'ambience', param: 0.1, gain: 0.5, maxDist: w.creakRange });
      }

      const q = AMB.queen;
      const qd = Math.hypot(L.x - q.x, L.z - q.z);
      tickT -= dt;
      if (tickT <= 0) {
        tickT = rnd(q.tickEvery);
        if (qd <= q.range) {
          at.x = q.x + (Math.random() - 0.5) * 8;
          at.z = q.z;
          playAt('coast-halyard', at, { bus: 'ambience', maxDist: q.range });
        }
      }
      timberT -= dt;
      if (timberT <= 0) {
        timberT = rnd(q.creakEvery);
        if (qd <= q.range) playAt('door-creak', q, { bus: 'ambience', param: 0.15, gain: 0.5, maxDist: q.range });
      }

      bellT -= dt;
      if (bellT <= 0) {
        bellT = rnd(AMB.bell.every);
        const spots = COAST.soundSpots.buoyBell;
        const s = spots[Math.floor(Math.random() * spots.length)];
        if (Math.hypot(L.x - s[0], L.z - s[1]) <= AMB.bell.range) {
          at.x = s[0];
          at.z = s[1];
          playAt('buoy-bell', at, { bus: 'ambience', maxDist: AMB.bell.range });
        }
      }

      gullT -= dt;
      if (gullT <= 0) {
        gullT = rnd(AMB.gull.every);
        const skip = night > 0.5 && Math.random() < AMB.gull.nightSkip;
        if (!skip && Math.abs(L.z - COAST.shoreZ) <= AMB.gull.shoreRange && surfLevel(L.x, L.z) > 0) {
          at.x = L.x + (Math.random() * 2 - 1) * AMB.gull.spread;
          at.z = L.z + (Math.random() * 2 - 1) * AMB.gull.spread;
          playAt('gull', at, { bus: 'ambience' });
        }
      }
    },
  };
}
