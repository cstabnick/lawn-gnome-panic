// Sky, light and rain (issue 2.4): sun clock, weather fog, rain/storm particles around the player, lightning.
// Visuals only, so Math.random is fine here (never in src/sim).
import * as THREE from 'three';
import { COLORS, SUN } from '../config';
import type { Clock, Sky } from '../game/types';
import type { WeatherKind, WeatherState } from '../sim/types';

const FOG_FAR: Record<WeatherKind, number> = {
  clear: 420, frost: 420, overcast: 320, drizzle: 220, rain: 220, storm: 150, fog: 60,
};
const DROPS_MAX = 1500;
const DROPS_DRIZZLE = 600;
const BOX_XZ = 60;
const BOX_Y = 30;
const FALL_SPEED = 25;
const WIND_SPEED = 12;       // gm/s of sideways drift at wind = 1
const DROP_LEN = 0.06;       // seconds of motion a streak shows
const BLEND_SECONDS = 3;
const SHADOW_SIZE = 60;
const SUN_DIST = 120;

const DAY_SKY = new THREE.Color(0xdfe8ee);
const NIGHT_SKY_HEMI = new THREE.Color(0x3a4660);
const GROUND = new THREE.Color(0x4a5a3a);
const FROST_GROUND = new THREE.Color(0x6a7a8a);
const SUN_COLOR = new THREE.Color(0xfff2dc);
const MOON_COLOR = new THREE.Color(0x8fa6d6);

export function createSky(scene: THREE.Scene): Sky {
  const bg = new THREE.Color(COLORS.sky);
  scene.background = bg;
  const fog = new THREE.Fog(COLORS.fog, 84, 420);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(DAY_SKY.clone(), GROUND.clone(), 1.2);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(SUN_COLOR.clone(), 1.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera;
  sc.left = -SHADOW_SIZE / 2; sc.right = SHADOW_SIZE / 2;
  sc.top = SHADOW_SIZE / 2; sc.bottom = -SHADOW_SIZE / 2;
  sc.near = 1; sc.far = SUN_DIST * 2.5;
  sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  // Rain: line streaks, two vertices per drop, in world space.
  const pos = new Float32Array(DROPS_MAX * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xaab8c8, transparent: true, opacity: 0.45, depthWrite: false });
  const rain = new THREE.LineSegments(geo, rainMat);
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);
  const drops = new Float32Array(DROPS_MAX * 3); // head x, y, z
  let seeded = false;

  const seedDrop = (i: number, focus: THREE.Vector3, anyHeight: boolean): void => {
    drops[i * 3] = focus.x + (Math.random() - 0.5) * BOX_XZ;
    drops[i * 3 + 1] = anyHeight ? focus.y - 5 + Math.random() * BOX_Y : focus.y - 5 + BOX_Y * (0.8 + Math.random() * 0.2);
    drops[i * 3 + 2] = focus.z + (Math.random() - 0.5) * BOX_XZ;
  };

  // Smoothed state (blend over about BLEND_SECONDS).
  let fogFar = 420;
  let night = 0;          // 0 day, 1 night (from 1 - clock.light)
  let frost = 0;
  let first = true;
  let flash = 0;          // seconds left of a lightning burst
  let nextFlash = 8 + Math.random() * 12;

  const dayCol = new THREE.Color(COLORS.sky);
  const nightCol = new THREE.Color(COLORS.nightSky);
  const fogDay = new THREE.Color(COLORS.fog);
  const tmp = new THREE.Color();

  return {
    update(clock: Clock, weather: WeatherState, focus: THREE.Vector3, dt: number): void {
      const kind = weather.kind;
      const k = first ? 1 : 1 - Math.exp(-dt * (3 / BLEND_SECONDS));
      const lightTarget = Math.min(1, Math.max(0, clock.light));
      night += (1 - lightTarget - night) * k;
      fogFar += (FOG_FAR[kind] - fogFar) * k;
      frost += ((kind === 'frost' ? 1 : 0) - frost) * k;
      first = false;

      // Sky and fog colours.
      bg.copy(dayCol).lerp(nightCol, night);
      tmp.copy(fogDay).lerp(dayCol, 0.3).lerp(nightCol, night);
      fog.color.copy(tmp);
      fog.far = fogFar;
      fog.near = fogFar * 0.2;
      // Overcast/rain greys the daytime sky towards the fog colour.
      const grey = kind === 'clear' || kind === 'frost' ? 0 : kind === 'overcast' ? 0.4 : 0.7;
      bg.lerp(fog.color, grey * (1 - night));

      // Sun arc: rises east (+x) at nightEnd, sets west (-x) at nightStart. Moon takes the opposite arc at night.
      const h = clock.hourOfDay;
      const dayLen = SUN.nightStart - SUN.nightEnd;
      const isDay = !clock.night;
      let t: number;
      if (isDay) t = (h - SUN.nightEnd) / dayLen;
      else t = (((h - SUN.nightStart) % 24) + 24) % 24 / (24 - dayLen);
      t = Math.min(1, Math.max(0, t));
      const a = t * Math.PI;
      const elev = Math.max(0.25, Math.sin(a)); // keep the light from skimming the ground
      sun.target.position.copy(focus);
      sun.position.set(
        focus.x + Math.cos(a) * SUN_DIST,
        focus.y + elev * SUN_DIST,
        focus.z + 0.35 * SUN_DIST,
      );
      sun.target.updateMatrixWorld();

      const wetDim = kind === 'storm' ? 0.45 : kind === 'rain' || kind === 'fog' ? 0.6 : kind === 'drizzle' || kind === 'overcast' ? 0.75 : 1;
      const sunI = 1.5 * wetDim * (0.35 + 0.65 * Math.sin(a));
      sun.intensity = sunI * (1 - night) + 0.15 * night;
      sun.color.copy(SUN_COLOR).lerp(MOON_COLOR, night);

      // Hemisphere, with frost tint and lightning.
      hemi.color.copy(DAY_SKY).lerp(NIGHT_SKY_HEMI, night);
      hemi.groundColor.copy(GROUND).lerp(FROST_GROUND, frost * 0.5);
      let hemiI = (1.2 * wetDim + 0.1) * (1 - night) + 0.35 * night;
      if (kind === 'storm') {
        nextFlash -= dt;
        if (nextFlash <= 0) { flash = 0.1; nextFlash = 8 + Math.random() * 12; }
      }
      if (flash > 0) { flash -= dt; hemiI += 3; }
      hemi.intensity = hemiI;

      // Rain.
      const raining = kind === 'drizzle' || kind === 'rain' || kind === 'storm';
      rain.visible = raining;
      if (!raining) return;
      const count = kind === 'drizzle' ? DROPS_DRIZZLE : DROPS_MAX;
      if (!seeded) { for (let i = 0; i < DROPS_MAX; i++) seedDrop(i, focus, true); seeded = true; }
      const vx = Math.sin(weather.windDir) * weather.wind * WIND_SPEED;
      const vz = Math.cos(weather.windDir) * weather.wind * WIND_SPEED;
      const vy = -FALL_SPEED;
      const step = Math.min(dt, 0.1);
      const half = BOX_XZ / 2;
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        drops[j] += vx * step; drops[j + 1] += vy * step; drops[j + 2] += vz * step;
        const dx = drops[j] - focus.x, dz = drops[j + 2] - focus.z;
        if (drops[j + 1] < focus.y - 5 || drops[j + 1] > focus.y - 5 + BOX_Y + 5 || Math.abs(dx) > half || Math.abs(dz) > half) {
          seedDrop(i, focus, drops[j + 1] > focus.y - 5 && (Math.abs(dx) > half || Math.abs(dz) > half));
        }
        const o = i * 6;
        pos[o] = drops[j]; pos[o + 1] = drops[j + 1]; pos[o + 2] = drops[j + 2];
        pos[o + 3] = drops[j] - vx * DROP_LEN; pos[o + 4] = drops[j + 1] - vy * DROP_LEN; pos[o + 5] = drops[j + 2] - vz * DROP_LEN;
      }
      geo.setDrawRange(0, count * 2);
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      rainMat.opacity = kind === 'drizzle' ? 0.3 : 0.45;
    },
  };
}
