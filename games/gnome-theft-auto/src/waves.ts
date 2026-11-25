// Water waves (docs/roadmaps/gta-water-waves.md): one deterministic wave field that the water mesh draws (a vertex
// shader, waveShader.ts) and that boats, swimmers, bobbers and splash-downs float on (terrain.ts waterAt adds
// waveSurfaceOffset to the still surface). Pure maths, no three.js, no DOM, no allocation per call.
//
// THE FIELD
//   h(x, z, t) = waveAmplitudeScale(x, z) * seaGainAt(t) * detailGain * SUM_i amp_i * sin(kx_i x + kz_i z - w_i t + p_i)
// A few directional sines (a swell, two cross swells, wind chop and a ripple), deep-water dispersion (w = sqrt(g k)), all
// travelling roughly downwind (WAVES.windYaw). Vertical only (no Gerstner sideways shift), so what you see is exactly what
// a hull samples.
//   - waveAmplitudeScale: 0..~1.35, static. Open Loch Moss 1, the Puddle Sea WAVES.bodyGain (bigger), fading to 0 over
//     WAVES.shoreM metres of the shore and WAVES.islandM around islands; rivers and the canal WAVES.courseGain (tiny
//     ripples); 0 within a calm spot's radius (canal locks: registerCalmSpots).
//   - seaGainAt(t): the sea state. A schedule derived only from t (300 s slots, each calm / breezy / blustery from a hash
//     of the slot number), blended over WAVES.blendS, unless setSeaState() forced one (a storm event; online the host's
//     choice, relayed by online/seaSync.ts). So every client computes the same gain for the same t.
//   - waveTime(): the shared clock, seconds. Wall-clock UTC (Date.now) + an offset (setWaveClockOffset: online, the
//     mirror nudges it to the host's clock), cached once per frame by tickWaveClock() (app.ts). It stays 0 and
//     waveSurfaceOffset stays 0 until the first tick, so unit tests of other modules see still water.
//
// API (contract for other workstreams):
//   waveHeight(x, z, t): number                     metres above the still water level (small; ~0.45 m peak blustery loch)
//   waveSlope(x, z, t, out: {x, z}): void           surface gradient dh/dx, dh/dz (ignores the slow change of the scale)
//   waveAmplitudeScale(x, z): number                0 at shores, rivers ~0.05, open loch 1, Puddle Sea 1.35
//   waveTime(): number                              the shared clock (s) this frame
//   setSeaState(state: SeaState | null, at?): void  force calm / breezy / blustery from time `at` (null: back to the schedule)
//   seaState(): SeaState                            the state now (forced or scheduled)
//   waveSurfaceOffset(x, z): number                 waveHeight at waveTime(), 0 before the first tick or with waves off
//   waveDrift(x, z, t, out: {x, z}): void           downwind unit vector times the local significant height (m)
//   waveAttitude(x, z, yaw, halfLength, halfBeam, t, out): void  heave / pitch / roll of a hull that sits on the waves
//   waveShaderState(t, out: Float32Array): number   per-component [kx, kz, phase, amp] for the shader; returns the count
//   seaRoughness(x, z): number                      0..1 how rough it is here now (seasickness, shake, sound)
//   tickWaveClock(nowMs?), setWaveClockOffset(ms), setWaveDetail('off'|'low'|'high'), registerCalmSpots(spots)
// Anything that floats can just use terrain.ts waterAt(x, z).surface: it already includes the waves (still depth).
import { smoothstep } from '@lawn/level';
import { BODIES, ISLANDS, bodyRadius } from './water';
import type { Tier } from './quality';

export type SeaState = 'calm' | 'breezy' | 'blustery';
export const SEA_STATES: readonly SeaState[] = ['calm', 'breezy', 'blustery'];
/** Options toggle (waveOptions.ts) and ?waves=0|low|high. 'off' = still water everywhere (physics too). */
export type WaveDetail = 'off' | 'low' | 'high';

const G = 9.81;

/** Tuning. Amplitudes are metres at scale 1 (open Loch Moss) and gain 1 (breezy). */
export const WAVES = {
  /** Direction the waves travel (radians, 0 = +z, like a vehicle yaw). */
  windYaw: 0.9,
  /** [wavelength m, amplitude m, direction offset from windYaw rad, phase rad]. Swell, two cross swells, chop, ripple. */
  components: [
    [22, 0.16, 0, 0],
    [13, 0.09, 0.55, 1.3],
    [8.5, 0.05, -0.75, 2.6],
    [4.2, 0.025, 1.4, 4.1],
    [1.7, 0.008, -2.1, 5.2],
  ] as readonly (readonly [number, number, number, number])[],
  /** Sea state gain. */
  seaGain: { calm: 0.35, breezy: 1, blustery: 1.75 } as Record<SeaState, number>,
  /** Per still body (water marker id), else 1. */
  bodyGain: { 'water/loch-moss': 1, 'water/puddle-sea': 1.35, 'water/saltwater': 1.6 } as Record<string, number>,
  /** Rivers and the canal (anywhere wet that is not a still body). */
  courseGain: 0.05,
  /** Waves fade to nothing over this many metres in from a shore, and around an island. */
  shoreM: 22,
  islandM: 12,
  /** Scheduled sea state slot length and the blend between states, s. */
  slotS: 300,
  blendS: 40,
  /** Chance weights of calm / breezy (rest blustery) per slot. */
  calmP: 0.3,
  breezyP: 0.5,
  /** 'low' detail scales every wave by this. */
  lowGain: 0.6,
} as const;

/** Seconds subtracted from Unix time so the clock stays a modest number (2025-01-01). */
const EPOCH_S = 1735689600;

const N = WAVES.components.length;
const KX = new Float64Array(N);
const KZ = new Float64Array(N);
const OM = new Float64Array(N);
const AMP = new Float64Array(N);
const PH = new Float64Array(N);
let AMP_SUM = 0;
for (let i = 0; i < N; i++) {
  const [len, amp, dir, ph] = WAVES.components[i];
  const k = (2 * Math.PI) / len;
  const yaw = WAVES.windYaw + dir;
  KX[i] = k * Math.sin(yaw);
  KZ[i] = k * Math.cos(yaw);
  OM[i] = Math.sqrt(G * k);
  AMP[i] = amp;
  PH[i] = ph;
  AMP_SUM += amp;
}
const WIND_X = Math.sin(WAVES.windYaw), WIND_Z = Math.cos(WAVES.windYaw);

// ---- Static scale --------------------------------------------------------------------------------------------------
interface BodyBox { cx: number; cz: number; a: number; b: number; m: number; gain: number; w: (typeof BODIES)[number]; isl: { x: number; z: number; r: number }[] }
const BOXES: BodyBox[] = BODIES.map((w) => ({
  cx: w.cx, cz: w.cz, a: w.a, b: w.b, m: Math.min(w.a, w.b), gain: WAVES.bodyGain[w.id] ?? 1, w,
  isl: ISLANDS.filter((i) => bodyRadius(w, i.x, i.z) < 1).map((i) => ({ x: i.x, z: i.z, r: i.r })),
}));

/** Outside a still body, river ripples are 0 at its shore and back to full this far out (m). */
const SHORE_BAND_M = 15;

const calm: { x: number; z: number; r: number }[] = [];
/** Places where the water stays still (canal locks, a weir): waves are 0 within r and fade back in over another r. */
export function registerCalmSpots(spots: readonly { x: number; z: number; r: number }[]): void {
  calm.length = 0;
  for (const s of spots) calm.push({ x: s.x, z: s.z, r: s.r });
}

/** How big the waves are at (x, z): 0 near a shore, ~0.05 on rivers, 1 on open Loch Moss. Static (no time). */
export function waveAmplitudeScale(x: number, z: number): number {
  let outside = 1;
  for (let i = 0; i < BOXES.length; i++) {
    const b = BOXES[i];
    const pad = SHORE_BAND_M;
    if (x < b.cx - b.a - pad || x > b.cx + b.a + pad || z < b.cz - b.b - pad || z > b.cz + b.b + pad) continue;
    const r = bodyRadius(b.w, x, z);
    // On and just past a shore (the water mesh's rim, a river mouth) the water is still; river ripples fade back in
    // over SHORE_BAND_M metres, so the shoreline never moves against the foam ring and the bank.
    if (!(r < 1)) {
      outside = Math.min(outside, smoothstep(0, SHORE_BAND_M, (r - 1) * b.m));
      continue;
    }
    let s = b.gain * smoothstep(0, WAVES.shoreM, (1 - r) * b.m);
    for (let j = 0; j < b.isl.length; j++) {
      const il = b.isl[j];
      s *= smoothstep(0, WAVES.islandM, Math.hypot(x - il.x, z - il.z) - il.r);
    }
    return s;
  }
  let s: number = WAVES.courseGain * outside;
  for (let i = 0; i < calm.length; i++) {
    const c = calm[i];
    s *= smoothstep(c.r, 2 * c.r, Math.hypot(x - c.x, z - c.z));
  }
  return s;
}

// ---- Sea state ------------------------------------------------------------------------------------------------------
function hash01(n: number): number {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** The scheduled state of slot `slot` (pure). */
export function scheduledSeaState(slot: number): SeaState {
  const u = hash01(slot);
  return u < WAVES.calmP ? 'calm' : u < WAVES.calmP + WAVES.breezyP ? 'breezy' : 'blustery';
}

function ease(u: number): number {
  return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
}

function scheduledGain(t: number): number {
  const slot = Math.floor(t / WAVES.slotS);
  const g1 = WAVES.seaGain[scheduledSeaState(slot)];
  const g0 = WAVES.seaGain[scheduledSeaState(slot - 1)];
  return g0 + (g1 - g0) * ease((t - slot * WAVES.slotS) / WAVES.blendS);
}

/** A forced state: from `at` the gain blends from `from` to the state's gain (null state: back to the schedule). */
let forced: { state: SeaState | null; at: number; from: number } | null = null;
let detail: WaveDetail = 'high';
let lastGainT = NaN;
let lastGain = 0;

/** The sea-state gain at time t (deterministic: the schedule, or the forced state). */
export function seaGainAt(t: number): number {
  if (t === lastGainT) return lastGain;
  let g: number;
  if (forced && t >= forced.at) {
    const to = forced.state ? WAVES.seaGain[forced.state] : scheduledGain(t);
    g = forced.from + (to - forced.from) * ease((t - forced.at) / WAVES.blendS);
  } else g = scheduledGain(t);
  const d = detail === 'off' ? 0 : detail === 'low' ? WAVES.lowGain : 1;
  lastGainT = t;
  lastGain = g * d;
  return lastGain;
}

/** Force the sea state from time `at` (default: now). null = back to the schedule. A storm event calls this; online the
 *  host relays it (online/seaSync.ts) and mirrors call it with the host's `at`. */
export function setSeaState(state: SeaState | null, at: number = waveTime()): void {
  const d = detail === 'off' ? 0 : detail === 'low' ? WAVES.lowGain : 1;
  const from = d > 0 ? seaGainAt(at) / d : scheduledGain(at);
  forced = { state, at, from };
  lastGainT = NaN;
}

/** The forced state and when it started, or null when on the schedule (what the host relays). */
export function forcedSeaState(): { state: SeaState | null; at: number } | null {
  return forced ? { state: forced.state, at: forced.at } : null;
}

/** The sea state at time t (default: now). */
export function seaState(t: number = waveTime()): SeaState {
  if (forced && t >= forced.at && forced.state) return forced.state;
  return scheduledSeaState(Math.floor(t / WAVES.slotS));
}

/** Waves off / low / high (Options and ?waves=). */
export function setWaveDetail(d: WaveDetail): void {
  detail = d;
  lastGainT = NaN;
}
export function waveDetail(): WaveDetail {
  return detail;
}

let tier: Tier = 'high';
/** The render quality tier (app.ts quality governor): 'min' and 'low' draw fewer components and no whitecaps. */
export function setWaveQualityTier(t: Tier): void {
  tier = t;
}
/** How many components the water mesh draws: 0 with waves off, 3 on a low tier or 'low' detail, else all. */
export function waveVisualComponents(): number {
  if (detail === 'off') return 0;
  return detail === 'low' || tier === 'min' || tier === 'low' ? 3 : N;
}
/** Whitecaps and the height colour shift in the water shader. */
export function waveFoamOn(): boolean {
  return detail === 'high' && tier !== 'min';
}

// ---- Clock ----------------------------------------------------------------------------------------------------------
let nowT = 0;
let ticked = false;
let offsetMs = 0;

/** Call once per frame (app.ts): caches the shared clock for this frame. */
export function tickWaveClock(nowMs: number = Date.now()): void {
  nowT = (nowMs + offsetMs) / 1000 - EPOCH_S;
  ticked = true;
}

/** The shared wave clock, seconds (0 before the first tick). Same on every client up to clock skew (see seaSync.ts). */
export function waveTime(): number {
  return nowT;
}

/** Online: add `ms` to the local wall clock so it matches the host's. */
export function setWaveClockOffset(ms: number): void {
  offsetMs = Number.isFinite(ms) ? ms : 0;
}
export function waveClockOffset(): number {
  return offsetMs;
}

/** Tests: back to the unticked, still state. */
export function resetWaves(): void {
  nowT = 0; ticked = false; offsetMs = 0; forced = null; detail = 'high'; tier = 'high'; lastGainT = NaN; calm.length = 0;
}

// ---- The field ------------------------------------------------------------------------------------------------------
/** Wave height above the still level at (x, z) and time t, metres. */
export function waveHeight(x: number, z: number, t: number): number {
  const s = waveAmplitudeScale(x, z);
  if (s <= 0) return 0;
  const g = seaGainAt(t) * s;
  if (g <= 0) return 0;
  let h = 0;
  for (let i = 0; i < N; i++) h += AMP[i] * Math.sin(KX[i] * x + KZ[i] * z - OM[i] * t + PH[i]);
  return h * g;
}

/** Gradient of the wave surface at (x, z, t) into out (dh/dx, dh/dz). The slow change of the scale is ignored. */
export function waveSlope(x: number, z: number, t: number, out: { x: number; z: number }): void {
  out.x = 0;
  out.z = 0;
  const s = waveAmplitudeScale(x, z);
  if (s <= 0) return;
  const g = seaGainAt(t) * s;
  if (g <= 0) return;
  for (let i = 0; i < N; i++) {
    const c = AMP[i] * g * Math.cos(KX[i] * x + KZ[i] * z - OM[i] * t + PH[i]);
    out.x += c * KX[i];
    out.z += c * KZ[i];
  }
}

/** Downwind unit vector times the local significant height (sum of amplitudes, m). What pushes a hull along. */
export function waveDrift(x: number, z: number, t: number, out: { x: number; z: number }): void {
  const a = waveAmplitudeScale(x, z) * seaGainAt(t) * AMP_SUM;
  out.x = WIND_X * a;
  out.z = WIND_Z * a;
}

/** How rough the water is at (x, z) now, 0 (still) .. 1 (blustery open Puddle Sea). Seasickness, shake, sounds. */
export function seaRoughness(x: number, z: number): number {
  if (!ticked) return 0;
  const r = (waveAmplitudeScale(x, z) * seaGainAt(nowT)) / (WAVES.bodyGain['water/puddle-sea'] * WAVES.seaGain.blustery);
  return r < 0 ? 0 : r > 1 ? 1 : r;
}

/** The terrain hook (terrain.ts waterAt): the wave height now, 0 before the first clock tick or with waves off. */
export function waveSurfaceOffset(x: number, z: number): number {
  return ticked ? waveHeight(x, z, nowT) : 0;
}

/** Heave (m), pitch (+ = bow up) and roll (+ = right side down) of a hull of the given half length / beam on the waves. */
export function waveAttitude(
  x: number, z: number, yaw: number, halfLength: number, halfBeam: number, t: number,
  out: { heave: number; pitch: number; roll: number },
): void {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const rx = -Math.cos(yaw), rz = Math.sin(yaw);
  const bow = waveHeight(x + fx * halfLength, z + fz * halfLength, t);
  const stern = waveHeight(x - fx * halfLength, z - fz * halfLength, t);
  const left = waveHeight(x - rx * halfBeam, z - rz * halfBeam, t);
  const right = waveHeight(x + rx * halfBeam, z + rz * halfBeam, t);
  out.heave = (bow + stern + left + right) / 4;
  out.pitch = Math.atan2(bow - stern, 2 * halfLength);
  out.roll = Math.atan2(left - right, 2 * halfBeam);
}

/** Most components the shader takes. */
export const WAVE_COMPONENTS = N;

/**
 * Shader uniforms for time t: out[4i..4i+3] = [kx, kz, phase, amp * seaGain] per component, phase wrapped to 0..2PI
 * (computed in double here so a float shader stays exact). The shader adds amp * aWaveScale * sin(kx x + kz z - phase).
 * `count` (default all) limits the components (quality tiers drop the small ones); the rest get amp 0. Returns count.
 */
export function waveShaderState(t: number, out: Float32Array, count: number = N): number {
  const g = seaGainAt(t);
  const TAU = Math.PI * 2;
  for (let i = 0; i < N; i++) {
    let ph = (OM[i] * t - PH[i]) % TAU;
    if (ph < 0) ph += TAU;
    out[4 * i] = KX[i];
    out[4 * i + 1] = KZ[i];
    out[4 * i + 2] = ph;
    out[4 * i + 3] = i < count ? AMP[i] * g : 0;
  }
  return Math.min(count, N);
}
