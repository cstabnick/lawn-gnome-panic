// Dynamic day/dusk/night/dawn cycle, biome atmospheric tinting, and pooled weather motes.
import * as THREE from 'three';
import { VIEW } from './config';
import type { BiomeId } from './types';

export type TimeMode = 'auto' | 'noon' | 'golden' | 'night';
export type TimeLabel = 'Morning' | 'Noon' | 'Golden Hour' | 'Dusk' | 'Neon Night' | 'Dawn';

/** Full 24-hour cycle duration in seconds (6 minutes). */
export const CYCLE_SECONDS = 360;
/** Starting phase in 'auto' mode: bright morning-noon (0 = dawn/midnight, 0.25 = noon, 0.5 = golden, 0.75 = night). */
export const INITIAL_PHASE = 0.22;

const MOTE_COUNT = 260;
const MOTE_SPAN = 64;
const MOTE_HALF = MOTE_SPAN * 0.5;
const MOTE_HEIGHT = 18;

export interface AtmosphereState {
  phase: number;
  nightFactor: number;
  label: TimeLabel;
  skyHex: number;
  fogHex: number;
  fogNear: number;
  fogFar: number;
  sunColorHex: number;
  sunIntensity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  sunDir: [number, number, number];
}

interface TimeKeyframe {
  phase: number;
  nightFactor: number;
  sky: number;
  fog: number;
  fogNearScale: number;
  fogFarScale: number;
  sunColor: number;
  sunIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunDir: [number, number, number];
}

// Periodic keyframes on [0, 1]. Phase 0.25 = Noon, 0.50 = Golden Hour, 0.75 = Neon Night, 0.00/1.00 = Dawn.
const KEYFRAMES: readonly TimeKeyframe[] = [
  {
    phase: 0.0,
    nightFactor: 0.35,
    sky: 0xd99bb0,
    fog: 0xd8a8b8,
    fogNearScale: 0.9,
    fogFarScale: 0.92,
    sunColor: 0xffb899,
    sunIntensity: 0.85,
    hemiSky: 0xffd0dc,
    hemiGround: 0x3b3545,
    hemiIntensity: 0.62,
    sunDir: [0.75, 0.28, 0.45],
  },
  {
    phase: 0.14,
    nightFactor: 0.0,
    sky: 0x99d6f5,
    fog: 0xaadbf5,
    fogNearScale: 0.98,
    fogFarScale: 0.98,
    sunColor: 0xfff4df,
    sunIntensity: 1.35,
    hemiSky: 0xf4faff,
    hemiGround: 0x4b6a3b,
    hemiIntensity: 0.82,
    sunDir: [0.55, 0.65, 0.4],
  },
  {
    phase: 0.25,
    nightFactor: 0.0,
    sky: 0x8fd0f2,
    fog: 0x9bd6f4,
    fogNearScale: 1.0,
    fogFarScale: 1.0,
    sunColor: 0xfff2d8,
    sunIntensity: 1.6,
    hemiSky: 0xffffff,
    hemiGround: 0x4a6b3a,
    hemiIntensity: 0.9,
    sunDir: [0.48, 0.82, 0.32],
  },
  {
    phase: 0.42,
    nightFactor: 0.04,
    sky: 0xb7cde6,
    fog: 0xc9d0dc,
    fogNearScale: 0.98,
    fogFarScale: 0.98,
    sunColor: 0xffe0b2,
    sunIntensity: 1.35,
    hemiSky: 0xfff0dd,
    hemiGround: 0x4d5a35,
    hemiIntensity: 0.8,
    sunDir: [-0.45, 0.55, 0.48],
  },
  {
    phase: 0.5,
    nightFactor: 0.22,
    sky: 0xf09b59,
    fog: 0xf2ad72,
    fogNearScale: 0.92,
    fogFarScale: 0.94,
    sunColor: 0xff9d47,
    sunIntensity: 1.15,
    hemiSky: 0xffcaa0,
    hemiGround: 0x4a3b2c,
    hemiIntensity: 0.72,
    sunDir: [-0.78, 0.25, 0.42],
  },
  {
    phase: 0.6,
    nightFactor: 0.68,
    sky: 0x4a3b73,
    fog: 0x52407a,
    fogNearScale: 0.84,
    fogFarScale: 0.86,
    sunColor: 0xc77dff,
    sunIntensity: 0.55,
    hemiSky: 0x8b7ec8,
    hemiGround: 0x262138,
    hemiIntensity: 0.5,
    sunDir: [-0.82, 0.16, -0.35],
  },
  {
    phase: 0.75,
    nightFactor: 1.0,
    sky: 0x0d1328,
    fog: 0x131b36,
    fogNearScale: 0.76,
    fogFarScale: 0.8,
    sunColor: 0x7aa2ff,
    sunIntensity: 0.38,
    hemiSky: 0x3b4d8a,
    hemiGround: 0x111524,
    hemiIntensity: 0.42,
    sunDir: [-0.35, 0.74, -0.52],
  },
  {
    phase: 0.89,
    nightFactor: 0.92,
    sky: 0x171d38,
    fog: 0x1e2545,
    fogNearScale: 0.8,
    fogFarScale: 0.84,
    sunColor: 0x8fa8f5,
    sunIntensity: 0.42,
    hemiSky: 0x4a5994,
    hemiGround: 0x171a2b,
    hemiIntensity: 0.45,
    sunDir: [0.45, 0.35, -0.5],
  },
  {
    phase: 1.0,
    nightFactor: 0.35,
    sky: 0xd99bb0,
    fog: 0xd8a8b8,
    fogNearScale: 0.9,
    fogFarScale: 0.92,
    sunColor: 0xffb899,
    sunIntensity: 0.85,
    hemiSky: 0xffd0dc,
    hemiGround: 0x3b3545,
    hemiIntensity: 0.62,
    sunDir: [0.75, 0.28, 0.45],
  },
];

interface BiomeAtmosphereProfile {
  skyTint: number;
  skyWeight: number;
  fogTint: number;
  fogWeight: number;
  fogNearMult: number;
  fogFarMult: number;
  moteColorDay: number;
  moteColorNight: number;
  moteOpacityDay: number;
  moteOpacityNight: number;
  moteSize: number;
  vx: number;
  vy: number;
  vz: number;
  swirl: number;
}

const BIOME_PROFILES: Record<BiomeId, BiomeAtmosphereProfile> = {
  city: {
    skyTint: 0x8fd0f2,
    skyWeight: 0.0,
    fogTint: 0x9bd6f4,
    fogWeight: 0.0,
    fogNearMult: 1.0,
    fogFarMult: 1.0,
    moteColorDay: 0xfff3d6,
    moteColorNight: 0x9fd8ff,
    moteOpacityDay: 0.22,
    moteOpacityNight: 0.48,
    moteSize: 0.24,
    vx: 0.45,
    vy: 0.15,
    vz: 0.25,
    swirl: 0.6,
  },
  desert: {
    skyTint: 0xe6be7a,
    skyWeight: 0.26,
    fogTint: 0xdcb06d,
    fogWeight: 0.36,
    fogNearMult: 0.84,
    fogFarMult: 0.86,
    moteColorDay: 0xe5c488,
    moteColorNight: 0x9b8668,
    moteOpacityDay: 0.65,
    moteOpacityNight: 0.38,
    moteSize: 0.26,
    vx: 6.2,
    vy: 0.12,
    vz: 2.1,
    swirl: 1.1,
  },
  forest: {
    skyTint: 0x5ca880,
    skyWeight: 0.24,
    fogTint: 0x4f9975,
    fogWeight: 0.38,
    fogNearMult: 0.8,
    fogFarMult: 0.82,
    moteColorDay: 0xb7f598,
    moteColorNight: 0x8cff70,
    moteOpacityDay: 0.42,
    moteOpacityNight: 0.82,
    moteSize: 0.3,
    vx: 0.3,
    vy: 0.28,
    vz: -0.25,
    swirl: 1.45,
  },
  tundra: {
    skyTint: 0xcbe8ff,
    skyWeight: 0.28,
    fogTint: 0xd9efff,
    fogWeight: 0.34,
    fogNearMult: 0.9,
    fogFarMult: 0.92,
    moteColorDay: 0xf4fbff,
    moteColorNight: 0xc8e4ff,
    moteOpacityDay: 0.72,
    moteOpacityNight: 0.62,
    moteSize: 0.28,
    vx: 1.1,
    vy: -2.4,
    vz: 0.7,
    swirl: 1.2,
  },
  farmland: {
    skyTint: 0xf2d98a,
    skyWeight: 0.2,
    fogTint: 0xebd38a,
    fogWeight: 0.26,
    fogNearMult: 0.96,
    fogFarMult: 0.96,
    moteColorDay: 0xfff5c0,
    moteColorNight: 0xd9cb8e,
    moteOpacityDay: 0.56,
    moteOpacityNight: 0.36,
    moteSize: 0.28,
    vx: 1.4,
    vy: 0.38,
    vz: 0.5,
    swirl: 0.95,
  },
  // Loch Moss: a cool, misty highland glen.
  loch: {
    skyTint: 0x9fb8b0,
    skyWeight: 0.3,
    fogTint: 0xa9c2bb,
    fogWeight: 0.44,
    fogNearMult: 0.72,
    fogFarMult: 0.76,
    moteColorDay: 0xe4f2ec,
    moteColorNight: 0xa8d8ff,
    moteOpacityDay: 0.4,
    moteOpacityNight: 0.6,
    moteSize: 0.3,
    vx: 0.6,
    vy: 0.1,
    vz: -0.4,
    swirl: 1.3,
  },
  // Tallgrass Commons: a bright, pollen-heavy meadow.
  parkland: {
    skyTint: 0xbfe6a0,
    skyWeight: 0.18,
    fogTint: 0xd6efb0,
    fogWeight: 0.22,
    fogNearMult: 0.95,
    fogFarMult: 0.95,
    moteColorDay: 0xfff2a8,
    moteColorNight: 0xd8f59a,
    moteOpacityDay: 0.6,
    moteOpacityNight: 0.45,
    moteSize: 0.27,
    vx: 0.9,
    vy: 0.45,
    vz: 0.6,
    swirl: 1.15,
  },
  // Batch 3 bands (E01): placeholder profiles; the epics that fill each band tune them.
  highland: {
    skyTint: 0xb8d4ee, skyWeight: 0.24, fogTint: 0xc6dcef, fogWeight: 0.3, fogNearMult: 0.92, fogFarMult: 0.94,
    moteColorDay: 0xf0f6ff, moteColorNight: 0xbcd6f5, moteOpacityDay: 0.5, moteOpacityNight: 0.4, moteSize: 0.26,
    vx: 2.4, vy: -0.6, vz: 0.8, swirl: 1.1,
  },
  coast: {
    skyTint: 0xa8dcef, skyWeight: 0.22, fogTint: 0xc4e6ef, fogWeight: 0.32, fogNearMult: 0.9, fogFarMult: 0.92,
    moteColorDay: 0xfdfbf2, moteColorNight: 0xa8d8f0, moteOpacityDay: 0.45, moteOpacityNight: 0.35, moteSize: 0.25,
    vx: 3.2, vy: 0.2, vz: -1.4, swirl: 1.0,
  },
  campus: {
    skyTint: 0xa6d6f0, skyWeight: 0.1, fogTint: 0xb4dcef, fogWeight: 0.12, fogNearMult: 0.98, fogFarMult: 0.98,
    moteColorDay: 0xfff6dc, moteColorNight: 0xb8dcff, moteOpacityDay: 0.3, moteOpacityNight: 0.4, moteSize: 0.24,
    vx: 0.5, vy: 0.2, vz: 0.3, swirl: 0.7,
  },
  estate: {
    skyTint: 0xe8d8a0, skyWeight: 0.16, fogTint: 0xe6dcae, fogWeight: 0.2, fogNearMult: 0.96, fogFarMult: 0.96,
    moteColorDay: 0xfff0c8, moteColorNight: 0xd8d0a0, moteOpacityDay: 0.45, moteOpacityNight: 0.4, moteSize: 0.26,
    vx: 0.8, vy: 0.3, vz: 0.4, swirl: 0.9,
  },
};

export function wrapPhase(phase: number): number {
  const m = phase % 1;
  return m < 0 ? m + 1 : m;
}

export function effectivePhase(phase: number, mode: TimeMode): number {
  if (mode === 'noon') return 0.25;
  if (mode === 'golden') return 0.5;
  if (mode === 'night') return 0.75;
  return wrapPhase(phase);
}

export function timeLabelForPhase(phase: number): TimeLabel {
  const p = wrapPhase(phase);
  if (p < 0.12 || p >= 0.9) return 'Dawn';
  if (p < 0.22) return 'Morning';
  if (p < 0.42) return 'Noon';
  if (p < 0.55) return 'Golden Hour';
  if (p < 0.65) return 'Dusk';
  return 'Neon Night';
}

export function lerpHex(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  return (r << 16) | (g << 8) | bl;
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  const k = Math.max(0, Math.min(1, t));
  return k * k * (3 - 2 * k);
}

/**
 * Pure helper computing the target atmospheric state for a given cycle phase, mode override, and biome.
 */
export function computeAtmosphereState(
  phase: number,
  mode: TimeMode,
  biome: BiomeId,
): AtmosphereState {
  const p = effectivePhase(phase, mode);

  let k0 = KEYFRAMES[0];
  let k1 = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (p >= KEYFRAMES[i].phase && p <= KEYFRAMES[i + 1].phase) {
      k0 = KEYFRAMES[i];
      k1 = KEYFRAMES[i + 1];
      break;
    }
  }

  const span = Math.max(1e-6, k1.phase - k0.phase);
  const t = smoothstep((p - k0.phase) / span);

  const nightFactor = lerpNum(k0.nightFactor, k1.nightFactor, t);
  const baseSky = lerpHex(k0.sky, k1.sky, t);
  const baseFog = lerpHex(k0.fog, k1.fog, t);
  const baseNear = VIEW.fogNear * lerpNum(k0.fogNearScale, k1.fogNearScale, t);
  const baseFar = VIEW.fogFar * lerpNum(k0.fogFarScale, k1.fogFarScale, t);
  const sunColorHex = lerpHex(k0.sunColor, k1.sunColor, t);
  const sunIntensity = lerpNum(k0.sunIntensity, k1.sunIntensity, t);
  const hemiSkyHex = lerpHex(k0.hemiSky, k1.hemiSky, t);
  const hemiGroundHex = lerpHex(k0.hemiGround, k1.hemiGround, t);
  const hemiIntensity = lerpNum(k0.hemiIntensity, k1.hemiIntensity, t);

  const dx = lerpNum(k0.sunDir[0], k1.sunDir[0], t);
  const dy = lerpNum(k0.sunDir[1], k1.sunDir[1], t);
  const dz = lerpNum(k0.sunDir[2], k1.sunDir[2], t);
  const len = Math.hypot(dx, dy, dz) || 1;
  const sunDir: [number, number, number] = [dx / len, dy / len, dz / len];

  // Blend biome atmospheric tint & fog tightness; soften biome tint slightly at deep night.
  const bp = BIOME_PROFILES[biome];
  const dayWeight = 1 - nightFactor * 0.55;
  const skyHex = lerpHex(baseSky, lerpHex(bp.skyTint, baseSky, nightFactor * 0.65), bp.skyWeight * dayWeight);
  const fogHex = lerpHex(baseFog, lerpHex(bp.fogTint, baseFog, nightFactor * 0.65), bp.fogWeight * dayWeight);
  const fogNear = baseNear * bp.fogNearMult;
  const fogFar = baseFar * bp.fogFarMult;

  return {
    phase: p,
    nightFactor,
    label: timeLabelForPhase(p),
    skyHex,
    fogHex,
    fogNear,
    fogFar,
    sunColorHex,
    sunIntensity,
    hemiSkyHex,
    hemiGroundHex,
    hemiIntensity,
    sunDir,
  };
}

export interface AtmosphereController {
  update(dt: number, focusX: number, focusZ: number, biome: BiomeId, airborneOrFlying?: boolean): void;
  nightFactor(): number;
  timeLabel(): TimeLabel;
  setMode(mode: TimeMode): void;
  getMode(): TimeMode;
}

function wrapCoord(v: number, center: number, halfSpan: number): number {
  const span = halfSpan * 2;
  let d = v - center;
  if (d > halfSpan) d -= Math.ceil((d - halfSpan) / span) * span;
  else if (d < -halfSpan) d += Math.ceil((-halfSpan - d) / span) * span;
  return center + d;
}

export function createAtmosphere(
  scene: THREE.Scene,
  sun: THREE.DirectionalLight,
  hemi: THREE.HemisphereLight,
): AtmosphereController {
  let mode: TimeMode = 'auto';
  let phase = INITIAL_PHASE;
  let clock = 0;
  let currentNight = 0;
  let currentLabel: TimeLabel = timeLabelForPhase(INITIAL_PHASE);

  const skyColor = new THREE.Color();
  const fogColor = new THREE.Color();
  const sunColor = new THREE.Color();
  const hemiSky = new THREE.Color();
  const hemiGround = new THREE.Color();
  const moteColor = new THREE.Color();
  const targetMoteColor = new THREE.Color();

  // Smoothly damped biome profile values for seamless border crossings.
  let curSkyHex = 0x8fd0f2;
  let curFogHex = 0x9bd6f4;
  let curFogNear: number = VIEW.fogNear;
  let curFogFar: number = VIEW.fogFar;
  let curVx = BIOME_PROFILES.city.vx;
  let curVy = BIOME_PROFILES.city.vy;
  let curVz = BIOME_PROFILES.city.vz;
  let curSwirl = BIOME_PROFILES.city.swirl;
  let curMoteSize = BIOME_PROFILES.city.moteSize;
  let curMoteOpacity = BIOME_PROFILES.city.moteOpacityDay;
  let initialized = false;

  // Pooled weather mote cloud (~260 particles).
  const positions = new Float32Array(MOTE_COUNT * 3);
  const seeds = new Float32Array(MOTE_COUNT);
  for (let i = 0; i < MOTE_COUNT; i++) {
    // Deterministic pseudo-random spread around origin.
    const h1 = Math.sin(i * 12.9898 + 1.23) * 43758.5453;
    const h2 = Math.sin(i * 78.233 + 4.56) * 43758.5453;
    const h3 = Math.sin(i * 39.346 + 7.89) * 43758.5453;
    const rx = h1 - Math.floor(h1);
    const ry = h2 - Math.floor(h2);
    const rz = h3 - Math.floor(h3);
    positions[i * 3] = (rx - 0.5) * MOTE_SPAN;
    positions[i * 3 + 1] = 0.3 + ry * MOTE_HEIGHT;
    positions[i * 3 + 2] = (rz - 0.5) * MOTE_SPAN;
    seeds[i] = rx * Math.PI * 2;
  }

  const moteGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  moteGeo.setAttribute('position', posAttr);
  const moteMat = new THREE.PointsMaterial({
    color: BIOME_PROFILES.city.moteColorDay,
    size: BIOME_PROFILES.city.moteSize,
    transparent: true,
    opacity: BIOME_PROFILES.city.moteOpacityDay,
    depthWrite: false,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);

  function update(
    dt: number,
    focusX: number,
    focusZ: number,
    biome: BiomeId,
    airborneOrFlying = false,
  ): void {
    const safeDt = Math.max(0, Math.min(dt, 0.25));
    clock += safeDt;
    if (mode === 'auto') {
      phase = wrapPhase(phase + safeDt / CYCLE_SECONDS);
    }

    const state = computeAtmosphereState(phase, mode, biome);
    currentNight = state.nightFactor;
    currentLabel = state.label;

    const targetFogFar = airborneOrFlying
      ? Math.min(VIEW.cameraFar - 30, state.fogFar * 1.25)
      : state.fogFar;

    const blend = initialized ? Math.min(1, safeDt * 2.8) : 1;
    initialized = true;

    curSkyHex = lerpHex(curSkyHex, state.skyHex, blend);
    curFogHex = lerpHex(curFogHex, state.fogHex, blend);
    curFogNear = lerpNum(curFogNear, state.fogNear, blend);
    curFogFar = lerpNum(curFogFar, targetFogFar, blend);

    skyColor.setHex(curSkyHex);
    fogColor.setHex(curFogHex);
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(skyColor);
    } else {
      scene.background = skyColor.clone();
    }
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(fogColor);
      scene.fog.near = curFogNear;
      scene.fog.far = curFogFar;
    }

    sunColor.setHex(state.sunColorHex);
    sun.color.copy(sunColor);
    sun.intensity = state.sunIntensity;
    sun.position.set(
      focusX + state.sunDir[0] * 120,
      state.sunDir[1] * 120,
      focusZ + state.sunDir[2] * 120,
    );
    sun.target.position.set(focusX, 0, focusZ);

    hemiSky.setHex(state.hemiSkyHex);
    hemiGround.setHex(state.hemiGroundHex);
    hemi.color.copy(hemiSky);
    hemi.groundColor.copy(hemiGround);
    hemi.intensity = state.hemiIntensity;

    // Update weather motes.
    const bp = BIOME_PROFILES[biome];
    curVx = lerpNum(curVx, bp.vx, blend);
    curVy = lerpNum(curVy, bp.vy, blend);
    curVz = lerpNum(curVz, bp.vz, blend);
    curSwirl = lerpNum(curSwirl, bp.swirl, blend);
    curMoteSize = lerpNum(curMoteSize, bp.moteSize, blend);
    const targetOpacity = lerpNum(bp.moteOpacityDay, bp.moteOpacityNight, state.nightFactor);
    curMoteOpacity = lerpNum(curMoteOpacity, targetOpacity, blend);
    targetMoteColor.setHex(lerpHex(bp.moteColorDay, bp.moteColorNight, state.nightFactor));
    moteColor.copy(moteMat.color).lerp(targetMoteColor, blend);
    moteMat.color.copy(moteColor);
    moteMat.size = curMoteSize;
    moteMat.opacity = curMoteOpacity;

    for (let i = 0; i < MOTE_COUNT; i++) {
      const idx = i * 3;
      const seed = seeds[i];
      const swayX = Math.sin(clock * curSwirl + seed) * 0.65;
      const swayZ = Math.cos(clock * curSwirl * 0.85 + seed * 1.3) * 0.65;

      let px = positions[idx] + (curVx + swayX) * safeDt;
      let py = positions[idx + 1] + (curVy + Math.sin(clock * 1.6 + seed) * 0.25) * safeDt;
      let pz = positions[idx + 2] + (curVz + swayZ) * safeDt;

      px = wrapCoord(px, focusX, MOTE_HALF);
      pz = wrapCoord(pz, focusZ, MOTE_HALF);
      if (py < 0.25) py += MOTE_HEIGHT;
      else if (py > MOTE_HEIGHT + 0.25) py -= MOTE_HEIGHT;

      positions[idx] = px;
      positions[idx + 1] = py;
      positions[idx + 2] = pz;
    }
    posAttr.needsUpdate = true;
  }

  return {
    update,
    nightFactor: () => currentNight,
    timeLabel: () => currentLabel,
    setMode: (next: TimeMode) => {
      mode = next;
    },
    getMode: () => mode,
  };
}
