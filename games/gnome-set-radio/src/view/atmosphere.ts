import * as THREE from 'three';
import type { GsrLevelId } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';

export interface RegionLightingSpec {
  hemiSky: number;
  hemiGround: number;
  hemiInt: number;
  sunColor: number;
  sunInt: number;
  sunPos: [number, number, number];
  rimColor: number;
  rimInt: number;
  fogDensity: number;
  moteColor: string;
  moteAltColor: string;
  moteRise: number;
}

export const REGION_LIGHTING: Record<GsrLevelId, RegionLightingSpec> = {
  'velvet-keys': {
    hemiSky: 0xffb3ec,
    hemiGround: 0x261542,
    hemiInt: 1.05,
    sunColor: 0xfff5d6,
    sunInt: 1.35,
    sunPos: [36, 58, 30],
    rimColor: 0x00e5ff,
    rimInt: 0.5,
    fogDensity: 0.004,
    moteColor: '#ff4ecd',
    moteAltColor: '#ffd740',
    moteRise: 0.9,
  },
  'bongo-basin': {
    hemiSky: 0xffd08a,
    hemiGround: 0x3b1e12,
    hemiInt: 1.1,
    sunColor: 0xffe0b2,
    sunInt: 1.45,
    sunPos: [44, 52, -22],
    rimColor: 0xff9100,
    rimInt: 0.55,
    fogDensity: 0.0038,
    moteColor: '#ff9100',
    moteAltColor: '#ffd740',
    moteRise: 1.1,
  },
  'chrome-kiln': {
    hemiSky: 0xff9e6d,
    hemiGround: 0x241216,
    hemiInt: 0.98,
    sunColor: 0xffd180,
    sunInt: 1.4,
    sunPos: [-32, 54, 34],
    rimColor: 0x76ff03,
    rimInt: 0.65,
    fogDensity: 0.0044,
    moteColor: '#ff6d00',
    moteAltColor: '#76ff03',
    moteRise: 1.8,
  },
  'neon-birdbath': {
    hemiSky: 0x80f5ff,
    hemiGround: 0x161d42,
    hemiInt: 1.05,
    sunColor: 0xd8f3ff,
    sunInt: 1.3,
    sunPos: [30, 62, -30],
    rimColor: 0xff4ecd,
    rimInt: 0.6,
    fogDensity: 0.0038,
    moteColor: '#00e5ff',
    moteAltColor: '#ff4ecd',
    moteRise: 1.2,
  },
  'mulch-alley': {
    hemiSky: 0xff8a80,
    hemiGround: 0x180b24,
    hemiInt: 1.0,
    sunColor: 0xffe5b4,
    sunInt: 1.28,
    sunPos: [-38, 50, 26],
    rimColor: 0x00e5ff,
    rimInt: 0.62,
    fogDensity: 0.0044,
    moteColor: '#ff5252',
    moteAltColor: '#ffd740',
    moteRise: 1.3,
  },
  'tupperware-mall': {
    hemiSky: 0xb2ebf2,
    hemiGround: 0x2a1c42,
    hemiInt: 1.18,
    sunColor: 0xffffff,
    sunInt: 1.35,
    sunPos: [28, 64, 28],
    rimColor: 0xff8a80,
    rimInt: 0.5,
    fogDensity: 0.0032,
    moteColor: '#4dd0e1',
    moteAltColor: '#ff8a80',
    moteRise: 0.7,
  },
  'hoa-citadel': {
    hemiSky: 0xfff9c4,
    hemiGround: 0x1b3b24,
    hemiInt: 1.15,
    sunColor: 0xfffde7,
    sunInt: 1.5,
    sunPos: [40, 66, 36],
    rimColor: 0x69f0ae,
    rimInt: 0.45,
    fogDensity: 0.0032,
    moteColor: '#ffd740',
    moteAltColor: '#69f0ae',
    moteRise: 0.65,
  },
  'subsoil-relay': {
    hemiSky: 0xb388ff,
    hemiGround: 0x120824,
    hemiInt: 0.96,
    sunColor: 0xffcc80,
    sunInt: 1.22,
    sunPos: [-34, 56, -34],
    rimColor: 0x7c4dff,
    rimInt: 0.68,
    fogDensity: 0.0045,
    moteColor: '#7c4dff',
    moteAltColor: '#ffab40',
    moteRise: 1.5,
  },
  'zero-hz-zenith': {
    hemiSky: 0xf5f5ff,
    hemiGround: 0x14141c,
    hemiInt: 1.08,
    sunColor: 0xfff8e1,
    sunInt: 1.4,
    sunPos: [26, 68, -26],
    rimColor: 0xffd740,
    rimInt: 0.65,
    fogDensity: 0.0034,
    moteColor: '#ffd740',
    moteAltColor: '#ffffff',
    moteRise: 1.1,
  },
};

export function applyRegionalLighting(
  levelId: GsrLevelId,
  hemi: THREE.HemisphereLight,
  sun: THREE.DirectionalLight,
  rimLight: THREE.DirectionalLight,
  scene: THREE.Scene,
  fogColor: string,
): void {
  const spec = REGION_LIGHTING[levelId];
  hemi.color.setHex(spec.hemiSky);
  hemi.groundColor.setHex(spec.hemiGround);
  hemi.intensity = spec.hemiInt;
  sun.color.setHex(spec.sunColor);
  sun.intensity = spec.sunInt;
  sun.position.set(spec.sunPos[0], spec.sunPos[1], spec.sunPos[2]);
  rimLight.color.setHex(spec.rimColor);
  rimLight.intensity = spec.rimInt;
  scene.fog = new THREE.FogExp2(fogColor, spec.fogDensity);
}

export interface AtmosphereMotesSystem {
  update(t: number, dt: number, beatPulse: number): void;
  dispose(): void;
}

export function createAtmosphereMotes(
  doc: GsrLevelDoc,
  group: THREE.Group,
  track: <T extends { dispose(): void }>(x: T) => T,
): AtmosphereMotesSystem {
  const spec = REGION_LIGHTING[doc.id as GsrLevelId] ?? REGION_LIGHTING['velvet-keys'];
  const count = 140;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const cA = new THREE.Color(spec.moteColor);
  const cB = new THREE.Color(spec.moteAltColor);
  const spanW = doc.bounds.w * 0.48;
  const spanD = doc.bounds.d * 0.48;

  for (let i = 0; i < count; i++) {
    const o = i * 3;
    pos[o] = (Math.random() * 2 - 1) * spanW;
    pos[o + 1] = 1 + Math.random() * 24;
    pos[o + 2] = (Math.random() * 2 - 1) * spanD;
    const c = i % 2 === 0 ? cA : cB;
    col[o] = c.r;
    col[o + 1] = c.g;
    col[o + 2] = c.b;
    phase[i] = Math.random() * Math.PI * 2;
  }

  const geo = track(new THREE.BufferGeometry());
  const attr = new THREE.BufferAttribute(pos, 3);
  geo.setAttribute('position', attr);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = track(
    new THREE.PointsMaterial({
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  group.add(pts);

  return {
    update(t, dt, beatPulse) {
      mat.size = 0.36 + beatPulse * 0.22;
      mat.opacity = 0.56 + beatPulse * 0.28;
      for (let i = 0; i < count; i++) {
        const o = i * 3;
        pos[o] += Math.sin(t * 0.8 + phase[i]!) * 0.35 * dt;
        pos[o + 1] += spec.moteRise * dt;
        if (pos[o + 1]! > 26) pos[o + 1] = 1.0;
      }
      attr.needsUpdate = true;
    },
    dispose() {
      // geo and mat are tracked by parent world disposables.
    },
  };
}
