// Weather view (E06): rain streaks, snow (or frost-glaze) flakes and a cloud layer, pooled round the camera.
import * as THREE from 'three';
import type { Tier } from '../quality';
import type { WeatherState } from './types';
import { WEATHER_TIERS } from './config';

export interface WeatherViewFrame {
  /** 0 (day) .. 1 (night), from atmosphere.nightFactor(): darkens the drops and clouds. */
  night: number;
  /** The current render tier (quality.ts): caps how many particles are drawn and whether clouds show. */
  tier: Tier;
  /** false: weather is off (Options) or the camera is off the map (interiors, cutscene rooms); nothing is in the scene. */
  visible: boolean;
}

export interface WeatherView {
  /** Everything the view draws lives under this group (added to the scene while visible, removed while not). */
  readonly root: THREE.Group;
  /** Once per frame, after the camera has moved. */
  update(dt: number, camera: THREE.Camera, w: WeatherState, f: WeatherViewFrame): void;
  dispose(): void;
}

const RAIN_HALF = 30;
const RAIN_BELOW = 12;
const RAIN_HEIGHT = 30;
const RAIN_SPEED = 24;
const RAIN_LEN = 1.3;

/** Rain streak length and opacity. Small screens (phones) get shorter, fainter streaks so they do not read as noise. */
export function rainLook(small: boolean, intensity: number): { len: number; opacity: number } {
  return small
    ? { len: RAIN_LEN * 0.6, opacity: 0.25 + 0.2 * intensity }
    : { len: RAIN_LEN, opacity: 0.4 + 0.3 * intensity };
}
const WIND_X = 1.5;
const WIND_Z = 0.8;
const SNOW_FALL = 1.4;
const CLOUD_HALF = 400;
const CLOUD_DRIFT = 2.5;
const RENDER_ORDER = 5;

const CLOUD_OPACITY: Record<WeatherState['kind'], number> = { clear: 0.22, cloud: 0.75, mist: 0.4, rain: 0.85, snow: 0.7 };
const CLOUD_OVERCAST: Record<WeatherState['kind'], number> = { clear: 0, cloud: 0.5, mist: 0.35, rain: 0.9, snow: 0.6 };

function wrapCoord(v: number, center: number, halfSpan: number): number {
  const span = halfSpan * 2;
  let d = v - center;
  if (d > halfSpan) d -= Math.ceil((d - halfSpan) / span) * span;
  else if (d < -halfSpan) d += Math.ceil((-halfSpan - d) / span) * span;
  return center + d;
}

/** Cheap deterministic pseudo-random in [0,1) so the scatter is the same every run. */
function rnd(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function makeCanvasTexture(draw: (g: CanvasRenderingContext2D, size: number) => void, size: number): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  if (!g) return null;
  draw(g, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWeatherView(scene: THREE.Scene): WeatherView {
  const root = new THREE.Group();
  root.name = 'weather';
  const maxRain = WEATHER_TIERS.high.rain;
  const maxSnow = WEATHER_TIERS.high.snow;
  const maxClouds = WEATHER_TIERS.high.clouds;

  // Rain: head position per drop (world), two vertices per drop.
  const rainState = new Float32Array(maxRain * 3);
  const rainPos = new Float32Array(maxRain * 6);
  const rainGeo = new THREE.BufferGeometry();
  const rainAttr = new THREE.BufferAttribute(rainPos, 3);
  rainAttr.setUsage(THREE.DynamicDrawUsage);
  rainGeo.setAttribute('position', rainAttr);
  rainGeo.setDrawRange(0, 0);
  const smallScreen = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600;
  const rainLen = rainLook(smallScreen, 1).len;
  const rainMat = new THREE.LineBasicMaterial({ color: 0xaecbe6, transparent: true, opacity: 0.4, depthWrite: false, fog: true });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  const vlen = Math.hypot(WIND_X, RAIN_SPEED, WIND_Z);
  const tailX = (-WIND_X / vlen) * rainLen;
  const tailY = (RAIN_SPEED / vlen) * rainLen;
  const tailZ = (-WIND_Z / vlen) * rainLen;

  // Snow
  const snowState = new Float32Array(maxSnow * 4); // x, y, z, seed
  const snowPos = new Float32Array(maxSnow * 3);
  const snowGeo = new THREE.BufferGeometry();
  const snowAttr = new THREE.BufferAttribute(snowPos, 3);
  snowAttr.setUsage(THREE.DynamicDrawUsage);
  snowGeo.setAttribute('position', snowAttr);
  snowGeo.setDrawRange(0, 0);
  const flakeTex = makeCanvasTexture((g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  }, 32);
  const snowMat = new THREE.PointsMaterial({ size: 0.3, transparent: true, depthWrite: false, color: 0xf4f8ff });
  if (flakeTex) snowMat.map = flakeTex;
  // Flakes: alpha-tested round sprites, capped in size on screen and faded out as they reach the camera (no hard squares).
  const snowPixelRatio = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  snowMat.alphaTest = 0.02;
  snowMat.customProgramCacheKey = () => 'gta-snow';
  snowMat.onBeforeCompile = (shader) => {
    shader.uniforms.uPixelRatio = { value: snowPixelRatio };
    shader.vertexShader =
      'uniform float uPixelRatio;\nvarying float vNear;\n' +
      shader.vertexShader.replace(
        '#include <logdepthbuf_vertex>',
        '#include <logdepthbuf_vertex>\n\tgl_PointSize = min(gl_PointSize, 14.0 * uPixelRatio);\n\tvNear = smoothstep(1.0, 2.5, -mvPosition.z);',
      );
    shader.fragmentShader =
      'varying float vNear;\n' +
      shader.fragmentShader.replace('#include <map_particle_fragment>', '#include <map_particle_fragment>\n\tdiffuseColor.a *= vNear;');
  };
  const snow = new THREE.Points(snowGeo, snowMat);
  const snowBase = new THREE.Color(0xf4f8ff);
  const snowNight = new THREE.Color(0x8a93a8);

  // Clouds
  const puffTex = makeCanvasTexture((g, s) => {
    g.clearRect(0, 0, s, s);
    const puffs = [
      [0.5, 0.55, 0.32],
      [0.3, 0.6, 0.22],
      [0.7, 0.6, 0.22],
      [0.42, 0.4, 0.2],
      [0.6, 0.42, 0.2],
      [0.18, 0.66, 0.14],
      [0.82, 0.66, 0.14],
    ];
    for (const [px, py, pr] of puffs) {
      const grad = g.createRadialGradient(px * s, py * s, 0, px * s, py * s, pr * s);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    }
  }, 128);
  const cloudData = new Float32Array(maxClouds * 4); // world x, z, height above camera, drift factor
  const sprites: THREE.Sprite[] = [];
  const cloudMats: THREE.SpriteMaterial[] = [];
  for (let i = 0; i < maxClouds; i++) {
    const mat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false, opacity: 0 });
    if (puffTex) mat.map = puffTex;
    const sp = new THREE.Sprite(mat);
    const ang = rnd(i, 1) * Math.PI * 2;
    const rad = 120 + rnd(i, 2) * 260;
    cloudData[i * 4] = Math.cos(ang) * rad;
    cloudData[i * 4 + 1] = Math.sin(ang) * rad;
    cloudData[i * 4 + 2] = 90 + rnd(i, 3) * 50;
    cloudData[i * 4 + 3] = 0.7 + rnd(i, 4) * 0.6;
    sp.scale.set(60 + rnd(i, 5) * 70, 25 + rnd(i, 6) * 20, 1);
    sp.frustumCulled = false;
    sp.castShadow = false;
    sp.receiveShadow = false;
    sp.renderOrder = RENDER_ORDER;
    sp.visible = false;
    sprites.push(sp);
    cloudMats.push(mat);
    root.add(sp);
  }

  for (const o of [rain, snow]) {
    o.frustumCulled = false;
    o.castShadow = false;
    o.receiveShadow = false;
    o.renderOrder = RENDER_ORDER;
    o.visible = false;
    root.add(o);
  }

  const rainDay = new THREE.Color(0xaecbe6);
  const rainNight = new THREE.Color(0x5d6f86);
  const cloudWhite = new THREE.Color(0xffffff);
  const cloudGrey = new THREE.Color(0x7d8590);
  const cloudDark = new THREE.Color(0x2a3048);
  const tmp = new THREE.Color();

  let seeded = false;
  let time = 0;

  function seed(cx: number, cy: number, cz: number): void {
    for (let i = 0; i < maxRain; i++) {
      rainState[i * 3] = cx + (rnd(i, 11) * 2 - 1) * RAIN_HALF;
      rainState[i * 3 + 1] = cy - RAIN_BELOW + rnd(i, 12) * RAIN_HEIGHT;
      rainState[i * 3 + 2] = cz + (rnd(i, 13) * 2 - 1) * RAIN_HALF;
    }
    for (let i = 0; i < maxSnow; i++) {
      snowState[i * 4] = cx + (rnd(i, 21) * 2 - 1) * RAIN_HALF;
      snowState[i * 4 + 1] = cy - RAIN_BELOW + rnd(i, 22) * RAIN_HEIGHT;
      snowState[i * 4 + 2] = cz + (rnd(i, 23) * 2 - 1) * RAIN_HALF;
      snowState[i * 4 + 3] = rnd(i, 24) * Math.PI * 2;
    }
  }

  function update(dt: number, camera: THREE.Camera, w: WeatherState, f: WeatherViewFrame): void {
    const cloudBudget = WEATHER_TIERS[f.tier].clouds;
    const cloudCount = w.kind === 'clear' ? Math.ceil(cloudBudget / 3) : cloudBudget;
    const rainN = w.kind === 'rain' ? Math.round(WEATHER_TIERS[f.tier].rain * w.intensity) : 0;
    const snowN = w.kind === 'snow' ? Math.round(WEATHER_TIERS[f.tier].snow * w.intensity) : 0;
    const show = f.visible && (rainN > 0 || snowN > 0 || cloudCount > 0);
    if (!show) {
      if (root.parent) root.removeFromParent();
      return;
    }
    if (root.parent !== scene) scene.add(root);

    time += dt;
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;
    if (!seeded) {
      seed(cx, cy, cz);
      seeded = true;
    }
    const lo = cy - RAIN_BELOW;
    const hi = cy - RAIN_BELOW + RAIN_HEIGHT;

    rain.visible = rainN > 0;
    rainGeo.setDrawRange(0, rainN * 2);
    if (rainN > 0) {
      for (let i = 0; i < rainN; i++) {
        const s = i * 3;
        let x = rainState[s] + WIND_X * dt;
        let y = rainState[s + 1] - RAIN_SPEED * dt;
        let z = rainState[s + 2] + WIND_Z * dt;
        x = wrapCoord(x, cx, RAIN_HALF);
        z = wrapCoord(z, cz, RAIN_HALF);
        if (y < lo) y += RAIN_HEIGHT * Math.ceil((lo - y) / RAIN_HEIGHT);
        else if (y > hi) y -= RAIN_HEIGHT * Math.ceil((y - hi) / RAIN_HEIGHT);
        rainState[s] = x;
        rainState[s + 1] = y;
        rainState[s + 2] = z;
        const v = i * 6;
        rainPos[v] = x + tailX;
        rainPos[v + 1] = y + tailY;
        rainPos[v + 2] = z + tailZ;
        rainPos[v + 3] = x;
        rainPos[v + 4] = y;
        rainPos[v + 5] = z;
      }
      rainAttr.needsUpdate = true;
      rainMat.opacity = rainLook(smallScreen, w.intensity).opacity;
      rainMat.color.copy(rainDay).lerp(rainNight, f.night);
    }

    snow.visible = snowN > 0;
    snowGeo.setDrawRange(0, snowN);
    if (snowN > 0) {
      for (let i = 0; i < snowN; i++) {
        const s = i * 4;
        const sd = snowState[s + 3];
        let x = snowState[s] + Math.sin(time * 1.3 + sd) * 0.6 * dt;
        let y = snowState[s + 1] - SNOW_FALL * dt;
        let z = snowState[s + 2] + Math.cos(time * 1.1 + sd * 1.7) * 0.4 * dt;
        x = wrapCoord(x, cx, RAIN_HALF);
        z = wrapCoord(z, cz, RAIN_HALF);
        if (y < lo) y += RAIN_HEIGHT * Math.ceil((lo - y) / RAIN_HEIGHT);
        else if (y > hi) y -= RAIN_HEIGHT * Math.ceil((y - hi) / RAIN_HEIGHT);
        snowState[s] = x;
        snowState[s + 1] = y;
        snowState[s + 2] = z;
        const v = i * 3;
        snowPos[v] = x;
        snowPos[v + 1] = y;
        snowPos[v + 2] = z;
      }
      snowAttr.needsUpdate = true;
      snowMat.color.copy(snowBase).lerp(snowNight, f.night);
    }

    const baseOpacity = w.kind === 'clear' ? CLOUD_OPACITY.clear : CLOUD_OPACITY[w.kind] * (0.35 + 0.65 * w.intensity);
    tmp
      .copy(cloudWhite)
      .lerp(cloudGrey, CLOUD_OVERCAST[w.kind] * (w.kind === 'clear' ? 1 : w.intensity))
      .lerp(cloudDark, f.night * 0.8);
    for (let i = 0; i < maxClouds; i++) {
      const sp = sprites[i];
      const on = i < cloudCount;
      sp.visible = on;
      if (!on) continue;
      const d = i * 4;
      const drift = CLOUD_DRIFT * cloudData[d + 3] * dt;
      cloudData[d] = wrapCoord(cloudData[d] + drift * 0.88, cx, CLOUD_HALF);
      cloudData[d + 1] = wrapCoord(cloudData[d + 1] + drift * 0.47, cz, CLOUD_HALF);
      sp.position.set(cloudData[d], cy + cloudData[d + 2], cloudData[d + 1]);
      const m = cloudMats[i];
      m.opacity = baseOpacity;
      m.color.copy(tmp);
    }
  }

  return {
    root,
    update,
    dispose() {
      root.removeFromParent();
      rainGeo.dispose();
      rainMat.dispose();
      snowGeo.dispose();
      snowMat.dispose();
      flakeTex?.dispose();
      puffTex?.dispose();
      for (const m of cloudMats) m.dispose();
    },
  };
}
