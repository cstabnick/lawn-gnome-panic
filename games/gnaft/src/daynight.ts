// Day/night cycle: sun, sky, fog, hemi light, stars and moon. Rain greys the day.
import * as THREE from 'three';
import { COLORS, type Ctx, type System } from './config';
import { nightAmount, sunHeight } from './rules';

const SKY_SUNSET = 0xf4a261;
const SKY_NIGHT = 0x0b1d3a;
const MOON_COLOR = new THREE.Color(0x9db4ff);
const SKY_GREY = 0x8a99a6;
const SUN_WARM = 0xffb070;
const HEMI_DAY_SKY = 0xdff3ff;
const HEMI_NIGHT_SKY = 0x3a4a7a;
const RAIN_RATE = 0.3;          // rainAmount change per second
const STAR_COUNT = 900;
const STAR_RADIUS = 1500;
const MOON_DISTANCE = 1200;
const MOON_RADIUS = 30;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function createDayNight(ctx: Ctx): System {
  const { scene, camera, state, lights } = ctx;
  let rainAmount = state.raining ? 1 : 0;

  // Reusable colours.
  const skyDay = new THREE.Color(COLORS.sky);
  const skySunset = new THREE.Color(SKY_SUNSET);
  const skyNight = new THREE.Color(SKY_NIGHT);
  const skyGrey = new THREE.Color(SKY_GREY);
  const sunWhite = new THREE.Color(0xffffff);
  const sunWarm = new THREE.Color(SUN_WARM);
  const hemiDay = new THREE.Color(HEMI_DAY_SKY);
  const hemiNight = new THREE.Color(HEMI_NIGHT_SKY);
  const tmpSky = new THREE.Color();
  const tmpDir = new THREE.Vector3();

  // Stars: points on the upper half of a large sphere, uniform by area.
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let k = 0; k < STAR_COUNT; k++) {
    const y = Math.random();                 // height in 0..1 gives a uniform hemisphere
    const ring = Math.sqrt(1 - y * y);
    const a = Math.random() * Math.PI * 2;
    starPos[k * 3] = Math.cos(a) * ring * STAR_RADIUS;
    starPos[k * 3 + 1] = y * STAR_RADIUS;
    starPos[k * 3 + 2] = Math.sin(a) * ring * STAR_RADIUS;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    sizeAttenuation: false,
    transparent: true,
    fog: false,
    depthWrite: false,
    opacity: 0,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  stars.visible = false;
  scene.add(stars);

  // Moon: opposite the sun, far away, drawn without fog.
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RADIUS, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xf4f1de, fog: false }),
  );
  moon.visible = false;
  scene.add(moon);

  return {
    update(dt: number): void {
      // Rain eases toward its target at a fixed rate.
      const target = state.raining ? 1 : 0;
      const step = RAIN_RATE * dt;
      rainAmount = target > rainAmount
        ? Math.min(target, rainAmount + step)
        : Math.max(target, rainAmount - step);

      const h = sunHeight(state);
      const night = nightAmount(state);
      const rain = rainAmount;

      // Sun position and light.
      const a = state.dayTime * Math.PI * 2;
      lights.sun.position.set(Math.cos(a) * 60, Math.max(Math.sin(a), -0.2) * 60 + 5, 20);
      const sunLevel = clamp01(h * 2.5 + 0.1);
      lights.sun.intensity = 2.2 * sunLevel * (1 - 0.55 * rain);
      const warm = clamp01(1 - Math.abs(h) / 0.25);
      lights.sun.color.copy(sunWhite).lerp(sunWarm, warm);
      // Moonlight: at night the same light comes from the moon's side, cool and soft, so the raft stays readable.
      if (night > 0) {
        lights.sun.position.lerp(new THREE.Vector3(-Math.cos(a) * 60, Math.max(-Math.sin(a), 0.3) * 60 + 5, 20), night);
        lights.sun.intensity = Math.max(lights.sun.intensity, 0.9 * night * (1 - 0.55 * rain));
        lights.sun.color.lerp(MOON_COLOR, night);
      }

      // Hemisphere light: dim at night, tinted blue.
      lights.hemi.intensity = (0.7 + (1.2 - 0.7) * (1 - night)) * (1 - 0.3 * rain);
      lights.hemi.color.copy(hemiDay).lerp(hemiNight, night);

      // Sky and fog colour: day, sunset at the horizon, night, then grey under rain.
      const sunsetK = clamp01(1 - Math.abs(h) / 0.2);
      tmpSky.copy(skyDay).lerp(skySunset, sunsetK).lerp(skyNight, night).lerp(skyGrey, rain * 0.6);
      (scene.background as THREE.Color).copy(tmpSky);
      (scene.fog as THREE.Fog).color.copy(tmpSky);

      // Stars follow the camera and fade in at night, out in rain.
      const starOpacity = night * (1 - rain);
      starMat.opacity = starOpacity;
      stars.visible = starOpacity > 0.001;
      stars.position.copy(camera.position);

      // Moon sits opposite the sun.
      tmpDir.copy(lights.sun.position).normalize().multiplyScalar(-MOON_DISTANCE);
      moon.position.copy(camera.position).add(tmpDir);
      moon.visible = night > 0.05;
    },
  };
}
