// Rain showers: clear and rain phases, falling rain streaks, rain audio level and thunder flashes.
import * as THREE from 'three';
import type { Ctx, System } from './config';
import { WEATHER } from './config';
import { notify } from './rules';
import { sfx, setRain } from './audio';

const DROP_COUNT = 1500;
const DROP_LENGTH = 0.5;
const BOX = 50;            // rain box width/depth (m), centred on the player
const HALF = BOX / 2;
const BOX_TOP = 25;        // rain box height (m)
const FALL_SPEED = 25;     // m/s
const WIND_X = 2;          // m/s along x
const RAIN_FADE_RATE = 0.4; // visual amount change per second
const THUNDER_MIN = 12;
const THUNDER_MAX = 25;
const FLASH_SECONDS = 0.3;
const FLASH_PEAK = 0.6;

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export function createWeather(ctx: Ctx): System {
  const state = ctx.state;
  state.raining = false;

  // Phase timer: starts clear.
  let raining = false;
  let phaseLeft = rand(WEATHER.clearMin, WEATHER.clearMax);
  let thunderIn = 0;

  // Visual amount 0..1.
  let r = 0;

  // Rain streaks.
  const positions = new Float32Array(DROP_COUNT * 2 * 3);
  const dropX = new Float32Array(DROP_COUNT);
  const dropY = new Float32Array(DROP_COUNT);
  const dropZ = new Float32Array(DROP_COUNT);
  const px0 = state.player.position.x;
  const pz0 = state.player.position.z;
  for (let d = 0; d < DROP_COUNT; d++) {
    dropX[d] = px0 + rand(-HALF, HALF);
    dropY[d] = rand(0, BOX_TOP);
    dropZ[d] = pz0 + rand(-HALF, HALF);
  }
  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', posAttr);
  const material = new THREE.LineBasicMaterial({ color: 0xdde8f2, transparent: true, opacity: 0 });
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  lines.visible = false;
  ctx.scene.add(lines);

  // Thunder flash overlay.
  const flash = document.createElement('div');
  flash.id = 'rg-flash';
  flash.style.cssText =
    'position:fixed;left:0;top:0;width:100%;height:100%;background:#fff;pointer-events:none;opacity:0;z-index:40;';
  ctx.ui.appendChild(flash);
  let flashLeft = 0;

  function startRain(): void {
    raining = true;
    state.raining = true;
    notify(state, 'Rain! Your grass grows twice as fast.');
    phaseLeft = rand(WEATHER.rainMin, WEATHER.rainMax);
    thunderIn = rand(THUNDER_MIN, THUNDER_MAX);
  }

  function stopRain(): void {
    raining = false;
    state.raining = false;
    notify(state, 'The rain stops.');
    phaseLeft = rand(WEATHER.clearMin, WEATHER.clearMax);
  }

  function wrap(rel: number): number {
    return ((((rel + HALF) % BOX) + BOX) % BOX) - HALF;
  }

  return {
    update(dt: number): void {
      const active = state.mode !== 'title';
      // A co-op guest shows the host's weather: follow state.raining, never toggle it.
      if (state.netRole === 'guest') {
        raining = state.raining;
        phaseLeft = Infinity;
      }

      if (active) {
        phaseLeft -= dt;
        if (phaseLeft <= 0) {
          if (raining) stopRain();
          else startRain();
        }

        if (raining) {
          thunderIn -= dt;
          if (thunderIn <= 0) {
            sfx('thunder');
            flashLeft = FLASH_SECONDS;
            thunderIn = rand(THUNDER_MIN, THUNDER_MAX);
          }
        }
      }

      // Smooth visual amount toward 1 (raining) or 0 (clear).
      const target = raining ? 1 : 0;
      const step = RAIN_FADE_RATE * dt;
      if (r < target) r = Math.min(target, r + step);
      else if (r > target) r = Math.max(target, r - step);

      // Rain streaks.
      const pp = state.player.position;
      const fall = FALL_SPEED * dt;
      const wind = WIND_X * dt;
      for (let d = 0; d < DROP_COUNT; d++) {
        let y = dropY[d] - fall;
        if (y < 0) y += BOX_TOP;
        dropY[d] = y;
        dropX[d] = pp.x + wrap(dropX[d] + wind - pp.x);
        dropZ[d] = pp.z + wrap(dropZ[d] - pp.z);

        const x = dropX[d];
        const z = dropZ[d];
        const o = d * 6;
        positions[o] = x;
        positions[o + 1] = y;
        positions[o + 2] = z;
        positions[o + 3] = x;
        positions[o + 4] = y + DROP_LENGTH;
        positions[o + 5] = z;
      }
      posAttr.needsUpdate = true;

      material.opacity = 0.8 * r;
      lines.visible = r > 0.01;

      // Thunder flash fade.
      if (flashLeft > 0) {
        flashLeft = Math.max(0, flashLeft - dt);
        flash.style.opacity = String(FLASH_PEAK * (flashLeft / FLASH_SECONDS));
      } else if (flash.style.opacity !== '0') {
        flash.style.opacity = '0';
      }

      setRain(r);
    },
  };
}
