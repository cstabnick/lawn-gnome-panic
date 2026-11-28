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

/** Which of the 4 atlas cells a mote uses: 0 round glow, 1 petal, 2 leaf, 3 seed fluff. Night is always the glow.
 *  The mote shader mirrors this (floor(seed * 4), night > 0.5 gives 0). */
export function moteCell(seed: number, night: number): number {
  if (night > 0.5) return 0;
  return Math.min(3, Math.max(0, Math.floor(seed * 4)));
}

/** 128 x 128 atlas, 2 x 2 cells of 64 px, each with a transparent margin. Null where there is no DOM (node tests). */
function createMoteAtlas(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;
  const cell = (n: number, draw: () => void): void => {
    g.save();
    g.translate((n % 2) * 64 + 32, Math.floor(n / 2) * 64 + 32);
    draw();
    g.restore();
  };
  // 0: soft round glow
  cell(0, () => {
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 30);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.3, 'rgba(255,255,255,0.7)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.beginPath();
    g.arc(0, 0, 30, 0, Math.PI * 2);
    g.fill();
  });
  // 1: petal, a soft ellipse a touch pink
  cell(1, () => {
    g.rotate(-0.5);
    const r = g.createRadialGradient(0, 0, 2, 0, 0, 26);
    r.addColorStop(0, 'rgba(255,248,250,1)');
    r.addColorStop(0.7, 'rgba(255,226,236,0.95)');
    r.addColorStop(1, 'rgba(255,214,228,0)');
    g.fillStyle = r;
    g.beginPath();
    g.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2);
    g.fill();
  });
  // 2: leaf, pointed ellipse with a darker mid vein
  cell(2, () => {
    g.rotate(-0.6);
    g.fillStyle = 'rgba(236,244,196,0.96)';
    g.beginPath();
    g.moveTo(-28, 0);
    g.quadraticCurveTo(0, -20, 28, 0);
    g.quadraticCurveTo(0, 20, -28, 0);
    g.fill();
    g.strokeStyle = 'rgba(170,190,110,0.9)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-27, 0);
    g.lineTo(22, 0);
    g.stroke();
  });
  // 3: seed fluff, a tiny core with faint radiating strands
  cell(3, () => {
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = 1.2;
    g.lineCap = 'round';
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.2;
      g.beginPath();
      g.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      g.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
      g.stroke();
    }
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 8);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(1, 'rgba(255,255,255,0.1)');
    g.fillStyle = r;
    g.beginPath();
    g.arc(0, 0, 8, 0, Math.PI * 2);
    g.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft tumbling sprite points: capped size, faded out near the camera, fog aware. */
function createMoteMaterial(tex: THREE.Texture | null): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uColor: { value: new THREE.Color(0xffffff) },
        uOpacity: { value: 0.3 },
        uSize: { value: 0.25 },
        uScale: { value: 400 },
        uTime: { value: 0 },
        uNight: { value: 0 },
        uMap: { value: tex },
      },
    ]),
    vertexShader: `
      uniform float uSize;
      uniform float uScale;
      uniform float uTime;
      attribute float aSeed;
      varying float vNear;
      varying float vSeed;
      varying float vAngle;
      #include <fog_pars_vertex>
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(uSize * uScale / -mv.z, 22.0);
        vNear = smoothstep(0.8, 3.0, -mv.z);
        vSeed = aSeed;
        vAngle = aSeed * 6.2832 + uTime * (0.6 + aSeed) * (aSeed > 0.5 ? 1.0 : -1.0);
        vec4 mvPosition = mv;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uNight;
      uniform sampler2D uMap;
      varying float vNear;
      varying float vSeed;
      varying float vAngle;
      #include <fog_pars_fragment>
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float cs = cos(vAngle);
        float sn = sin(vAngle);
        vec2 p = vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y) + 0.5;
        if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
        float cell = uNight > 0.5 ? 0.0 : min(3.0, floor(vSeed * 4.0));
        float col = mod(cell, 2.0);
        float row = floor(cell / 2.0);
        vec2 uv = vec2((col + p.x) * 0.5, 1.0 - (row + p.y) * 0.5);
        vec4 t = texture2D(uMap, uv);
        gl_FragColor = vec4(uColor * t.rgb, t.a * uOpacity * vNear);
        if (gl_FragColor.a < 0.01) discard;
        #include <fog_fragment>
      }`,
  });
}

/** Ambient motes (dust, pollen, fireflies). L05: fewer and fainter than before (was 260 at full opacity). */
const MOTE_COUNT = 180;
/** Every biome's mote opacity is scaled by this (L05). */
export const MOTE_OPACITY_SCALE = 0.75;
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
  // E28: Pardonlin (a soft, slightly hazy continental afternoon) and the Unmown (pollen-heavy meadow air).
  continental: {
    skyTint: 0xd8c8b0, skyWeight: 0.14, fogTint: 0xd6d0c4, fogWeight: 0.2, fogNearMult: 0.95, fogFarMult: 0.95,
    moteColorDay: 0xfff4e0, moteColorNight: 0xd0c8f0, moteOpacityDay: 0.3, moteOpacityNight: 0.35, moteSize: 0.22,
    vx: 0.4, vy: 0.2, vz: 0.3, swirl: 0.6,
  },
  preserve: {
    skyTint: 0xc8e0a8, skyWeight: 0.16, fogTint: 0xcfe2b8, fogWeight: 0.22, fogNearMult: 0.94, fogFarMult: 0.95,
    moteColorDay: 0xfff8b0, moteColorNight: 0xc8f0a0, moteOpacityDay: 0.6, moteOpacityNight: 0.5, moteSize: 0.28,
    vx: 0.9, vy: 0.4, vz: 0.5, swirl: 1.2,
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

/**
 * Weather dimming (E06, src/weather/): `overcast` 0..1 greys the sky and fog and dims the sun; `mist` 0..1 pulls the
 * fog in. Pure; applied after the time-of-day and biome blend.
 */
export function applyWeatherLook(s: AtmosphereState, overcast: number, mist: number): AtmosphereState {
  const o = Math.max(0, Math.min(1, overcast));
  const m = Math.max(0, Math.min(1, mist));
  if (o === 0 && m === 0) return s;
  const grey = (hex: number, dark: number): number => {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    const l = Math.min(247, Math.round((r * 0.3 + g * 0.55 + b * 0.15) * dark));
    return (l << 16) | (l << 8) | (l + 8);
  };
  const fogMist = lerpHex(s.fogHex, grey(s.fogHex, 1.05), m * 0.6);
  return {
    ...s,
    skyHex: lerpHex(s.skyHex, grey(s.skyHex, 0.82), o * 0.7),
    fogHex: lerpHex(fogMist, grey(fogMist, 0.85), o * 0.55),
    fogNear: s.fogNear * (1 - 0.3 * o) * (1 - 0.75 * m),
    fogFar: s.fogFar * (1 - 0.25 * o) * (1 - 0.55 * m),
    sunIntensity: s.sunIntensity * (1 - 0.55 * o),
    hemiIntensity: s.hemiIntensity * (1 - 0.18 * o),
  };
}

/** Time-lapse handle (E06, L11): `seconds` is how long the scrub takes (0 when the sky was already there). */
export interface TimeLapse {
  seconds: number;
  done: Promise<void>;
}

/** A time of day as a phase: the fixed modes' phases, or a phase number (wrapped). */
export function targetPhase(target: Exclude<TimeMode, 'auto'> | number): number {
  return typeof target === 'number' ? wrapPhase(target) : effectivePhase(0, target);
}

/** Forward distance from phase `a` to phase `b`, in [0, 1). */
export function forwardDelta(a: number, b: number): number {
  return wrapPhase(b - a);
}

/** Signed shortest distance from phase `a` to phase `b`, in [-0.5, 0.5). */
export function shortestDelta(a: number, b: number): number {
  const d = wrapPhase(b - a);
  return d >= 0.5 ? d - 1 : d;
}

/** Cutscene time-lapse (L11): seconds to scrub into a scene's `sky`, and back to world time when it ends. */
export const TIME_LAPSE = { inSeconds: 2.6, outSeconds: 1.6 } as const;

/** Below this phase distance a lapse is skipped (the sky is already there). */
export const LAPSE_MIN_DELTA = 0.03;

export interface AtmosphereController {
  update(dt: number, focusX: number, focusZ: number, biome: BiomeId, airborneOrFlying?: boolean): void;
  /** Like update, but the world clock does not advance (frozen cutscenes: the sky still animates a time-lapse). */
  render(dt: number, focusX: number, focusZ: number, biome: BiomeId): void;
  nightFactor(): number;
  timeLabel(): TimeLabel;
  setMode(mode: TimeMode): void;
  getMode(): TimeMode;
  /** The world clock's phase (0..1; 0.25 noon, 0.5 golden, 0.75 night). A fixed mode ignores it, but it is kept. */
  getPhase(): number;
  /** Set the world clock's phase (no animation). */
  setPhase(phase: number): void;
  /** The phase the sky was last drawn at (a fixed mode's phase, or a time-lapse's). */
  displayPhase(): number;
  /**
   * Visual only (L11): scrub the drawn sky forward (wrapping) to `target` over `seconds`, then hold it there until
   * releaseLapse. The world clock is untouched. Returns seconds 0 (and holds at once) when the sky is already there.
   */
  timeLapseTo(target: Exclude<TimeMode, 'auto'> | number, seconds: number): TimeLapse;
  /** Scrub the drawn sky back (the shortest way) to the world's own time over `seconds`, then drop the hold. */
  releaseLapse(seconds: number): TimeLapse;
  /** True while a time-lapse holds or scrubs the drawn sky away from world time. */
  lapsing(): boolean;
  /**
   * Intentional world-time change (e.g. E10's "sleep until night"): scrub the sky forward to `target` over `seconds`,
   * then set the world clock there. A fixed time mode is switched to 'auto' so the new time shows.
   */
  advanceWorldTime(target: Exclude<TimeMode, 'auto'> | number, seconds?: number): TimeLapse;
  /** Weather dimming (src/weather/): see applyWeatherLook. Eased in over about a second. */
  setWeatherLook(overcast: number, mist: number): void;
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
  // Time-lapse (L11): a drawn phase that scrubs from `from` by `delta` over `dur`, then holds ('in'), or ends (a release
  // or an advance). null with no hold = the sky shows world time.
  let lapse: {
    from: number; delta: number; t: number; dur: number; kind: 'in' | 'release' | 'advance'; target: number;
    resolve: () => void;
  } | null = null;
  let lapseHold: number | null = null;
  let lastDisplay = effectivePhase(INITIAL_PHASE, 'auto');
  let wantOvercast = 0;
  let wantMist = 0;
  let curOvercast = 0;
  let curMist = 0;
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
  const seedAttr = new Float32Array(MOTE_COUNT);
  for (let i = 0; i < MOTE_COUNT; i++) seedAttr[i] = seeds[i] / (Math.PI * 2);
  moteGeo.setAttribute('aSeed', new THREE.BufferAttribute(seedAttr, 1));
  const moteMat = createMoteMaterial(createMoteAtlas());
  (moteMat.uniforms.uColor.value as THREE.Color).setHex(BIOME_PROFILES.city.moteColorDay);
  moteMat.uniforms.uSize.value = BIOME_PROFILES.city.moteSize;
  moteMat.uniforms.uOpacity.value = BIOME_PROFILES.city.moteOpacityDay;
  let moteScale = 0;
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);

  /** Advance the lapse by dt and return the phase to draw. */
  function stepDisplay(dt: number): number {
    const world = effectivePhase(phase, mode);
    if (lapse) {
      lapse.t += dt;
      const k = smoothstep(lapse.t / Math.max(1e-6, lapse.dur));
      // A release chases the world's own (moving) time: re-aim at it every frame.
      if (lapse.kind === 'release') lapse.delta = shortestDelta(lapse.from, world);
      if (lapse.t >= lapse.dur) {
        const done = lapse;
        lapse = null;
        if (done.kind === 'in') lapseHold = done.target;
        else if (done.kind === 'advance') {
          phase = done.target;
          lapseHold = null;
        } else lapseHold = null;
        done.resolve();
        return done.kind === 'in' ? done.target : effectivePhase(phase, mode);
      }
      return wrapPhase(lapse.from + lapse.delta * k);
    }
    return lapseHold ?? world;
  }

  function startLapse(kind: 'in' | 'release' | 'advance', target: number, seconds: number, forward: boolean): TimeLapse {
    if (lapse) {
      lapse.resolve();
      lapse = null;
    }
    const from = lastDisplay;
    const delta = forward ? forwardDelta(from, target) : shortestDelta(from, target);
    let resolve: () => void = () => {};
    const done = new Promise<void>((r) => { resolve = r; });
    if (Math.abs(delta) < LAPSE_MIN_DELTA || seconds <= 0) {
      if (kind === 'in') lapseHold = target;
      else if (kind === 'advance') {
        phase = target;
        lapseHold = null;
      } else lapseHold = null;
      resolve();
      return { seconds: 0, done };
    }
    lapseHold = null;
    lapse = { from, delta, t: 0, dur: seconds, kind, target, resolve };
    return { seconds, done };
  }

  function update(
    dt: number,
    focusX: number,
    focusZ: number,
    biome: BiomeId,
    airborneOrFlying = false,
    advanceClock = true,
  ): void {
    const safeDt = Math.max(0, Math.min(dt, 0.25));
    clock += safeDt;
    if (mode === 'auto' && advanceClock) {
      phase = wrapPhase(phase + safeDt / CYCLE_SECONDS);
    }

    const scrubbing = lapse !== null;
    const display = stepDisplay(safeDt);
    lastDisplay = display;
    const weatherK = Math.min(1, safeDt * 2.5);
    curOvercast = lerpNum(curOvercast, wantOvercast, weatherK);
    curMist = lerpNum(curMist, wantMist, weatherK);
    const state = applyWeatherLook(computeAtmosphereState(display, 'auto', biome), curOvercast, curMist);
    currentNight = state.nightFactor;
    currentLabel = state.label;

    const targetFogFar = airborneOrFlying
      ? Math.min(VIEW.cameraFar - 30, state.fogFar * 1.25)
      : state.fogFar;

    // A time-lapse scrubs fast: follow it exactly instead of easing behind it.
    const blend = initialized && !scrubbing ? Math.min(1, safeDt * 2.8) : 1;
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
    sun.shadow.intensity = 1 - 0.55 * Math.min(1, curOvercast);
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
    const targetOpacity = lerpNum(bp.moteOpacityDay, bp.moteOpacityNight, state.nightFactor) * MOTE_OPACITY_SCALE;
    curMoteOpacity = lerpNum(curMoteOpacity, targetOpacity, blend);
    targetMoteColor.setHex(lerpHex(bp.moteColorDay, bp.moteColorNight, state.nightFactor));
    moteColor.copy(moteMat.uniforms.uColor.value as THREE.Color).lerp(targetMoteColor, blend);
    (moteMat.uniforms.uColor.value as THREE.Color).copy(moteColor);
    moteMat.uniforms.uSize.value = curMoteSize;
    moteMat.uniforms.uOpacity.value = curMoteOpacity;
    moteMat.uniforms.uTime.value = clock;
    moteMat.uniforms.uNight.value = state.nightFactor;
    if (typeof window !== 'undefined') {
      const sc = (window.innerHeight * Math.min(2, window.devicePixelRatio || 1)) / 2;
      if (sc !== moteScale) {
        moteScale = sc;
        moteMat.uniforms.uScale.value = sc;
      }
    }

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
    update: (dt, x, z, b, air = false) => update(dt, x, z, b, air, true),
    render: (dt, x, z, b) => update(dt, x, z, b, false, false),
    nightFactor: () => currentNight,
    timeLabel: () => currentLabel,
    setMode: (next: TimeMode) => {
      mode = next;
    },
    getMode: () => mode,
    getPhase: () => phase,
    setPhase: (p: number) => {
      phase = wrapPhase(p);
    },
    displayPhase: () => lastDisplay,
    timeLapseTo: (target, seconds) => startLapse('in', targetPhase(target), seconds, true),
    releaseLapse: (seconds) => {
      if (!lapse && lapseHold === null) return { seconds: 0, done: Promise.resolve() };
      return startLapse('release', effectivePhase(phase, mode), seconds, false);
    },
    lapsing: () => lapse !== null || lapseHold !== null,
    advanceWorldTime: (target, seconds = 2) => {
      mode = 'auto';
      return startLapse('advance', targetPhase(target), seconds, true);
    },
    setWeatherLook: (overcast: number, mist: number) => {
      wantOvercast = overcast;
      wantMist = mist;
    },
  };
}
