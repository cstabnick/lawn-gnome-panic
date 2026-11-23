// Camp: fires (fuel, warmth, night noise), the water sources (Tap, puddles, rain catcher) and the Waystation bed.
import * as THREE from 'three';
import { FIRE, NOISE, PREFAB_SCALE, RAIN_CATCHER } from '../config';
import { getItem } from '../items/defs';
import { buildPrefab } from '@lawn/prefabs';
import type { WeatherKind, WeatherState } from '../sim/types';
import type { BlockoutMap, WaterDef } from '../world/types';
import type { Collider } from '../world/collide';
import type { Bus } from './bus';
import type { Interact, Interactable } from './interact';
import type { CampSystem, Clock, InventorySystem, NeedsSystem, PlayerState, Vec3 } from './types';

export interface CampDeps { scene: THREE.Scene; map: BlockoutMap; interact: Interact; bus: Bus; inv: InventorySystem;
  needs: NeedsSystem; clock: Clock; getPlayer: () => PlayerState; collider: Collider }

const RAIN: readonly WeatherKind[] = ['drizzle', 'rain', 'storm'];
const RAIN_BURN_MUL = 3;
const FIRE_MIN_SEPARATION = 3;
const DRINK_LITRES = 0.5;
const FILL_LITRES = 10;
const SLEEP_RATE = 30;
const REST_RATE = 10;
const REST_SUN_HOURS = 1;
const WAKE_TEXT = 'You wake to scratching.';

interface Puff { sprite: THREE.Sprite; phase: number; age: number; dx: number; dz: number }
interface Fire {
  x: number; y: number; z: number; hours: number; group: THREE.Group; light: THREE.PointLight;
  flames: Puff[]; smoke: Puff[]; noiseTimer: number; removers: (() => void)[]; phase: number;
}

let glowCache: { flame: THREE.CanvasTexture; smoke: THREE.CanvasTexture } | null = null;
function glowTextures(): { flame: THREE.CanvasTexture; smoke: THREE.CanvasTexture } {
  if (glowCache) return glowCache;
  const make = (inner: string, outer: string): THREE.CanvasTexture => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(c);
  };
  glowCache = {
    flame: make('rgba(255,235,150,1)', 'rgba(255,90,20,0)'),
    smoke: make('rgba(120,120,120,0.8)', 'rgba(80,80,80,0)'),
  };
  return glowCache;
}

const dist2 = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);

export function createCampSystem(deps: CampDeps): CampSystem {
  const { scene, map, interact, bus, inv, needs, clock, getPlayer, collider } = deps;
  const fires: Fire[] = [];
  let time = 0;
  let sleeping = false;
  let sleepStart = 0;
  let resting = false;
  let restEnd = 0;

  const litres = new Map<string, number>();
  for (const w of map.water) if (w.kind === 'rain-catcher') litres.set(w.id, 1);

  function extinguish(f: Fire): void {
    for (const r of f.removers) r();
    f.removers.length = 0;
    scene.remove(f.group);
    f.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m?.dispose();
    });
    fires.splice(fires.indexOf(f), 1);
  }

  function placeFire(x: number, y: number, z: number, burnHours: number): boolean {
    for (const f of fires) if (dist2(f.x, f.z, x, z) < FIRE_MIN_SEPARATION) return false;
    const groundY = collider.groundAt(x, z, y);
    const group = buildPrefab('campfire', { scale: PREFAB_SCALE, lights: false });
    group.position.set(x, groundY, z);
    const tex = glowTextures();
    const light = new THREE.PointLight(0xff8a30, 2, 14, 1.5);
    light.position.set(0, 1.2, 0);
    group.add(light);
    const flames: Puff[] = [];
    for (let i = 0; i < 4; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.flame, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      group.add(sprite);
      flames.push({ sprite, phase: i * 1.7, age: 0, dx: 0, dz: 0 });
    }
    const smoke: Puff[] = [];
    for (let i = 0; i < 3; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.smoke, transparent: true, depthWrite: false, opacity: 0.3 }));
      group.add(sprite);
      smoke.push({ sprite, phase: i, age: i / 3, dx: 0, dz: 0 });
    }
    scene.add(group);
    const fire: Fire = { x, y: groundY, z, hours: burnHours, group, light, flames, smoke, noiseTimer: 0, removers: [], phase: Math.random() * 10 };
    const fuelable: Interactable = {
      id: `fire-fuel-${fires.length}-${x}-${z}`, x, y: groundY, z, radius: 2.5,
      label: () => (inv.countTag('FUEL') >= 1 ? 'Add fuel' : null),
      act: () => {
        const ref = inv.findTag('FUEL');
        const stack = ref ? inv.get(ref) : null;
        if (!stack) return;
        const per = getItem(stack.def).props?.burnHours ?? 1;
        if (!inv.consumeTag('FUEL', 1)) return;
        fire.hours += Math.max(1, FIRE.burnHoursPerFuel * per);
        bus.emit('hint', { text: 'You feed the fire.' });
      },
    };
    fire.removers.push(interact.add(fuelable));
    fires.push(fire);
    bus.emit('campfire-lit', { x, z });
    return true;
  }

  // Waystation fire starts lit.
  for (const s of map.spots) if (s.kind === 'fire' && s.id === 'fire-waystation') placeFire(s.x, s.y, s.z, FIRE.waystationStartHours);

  // Water sources.
  for (const w of map.water) addWater(w);

  function addWater(w: WaterDef): void {
    const at = { id: w.id, x: w.x, y: w.y, z: w.z, radius: 2 };
    const add = (i: Interactable): void => { interact.add(i); };
    if (w.kind === 'standpipe') {
      add({ ...at, id: `${w.id}-drink`, label: () => 'Drink from the Tap', act: () => needs.drink(DRINK_LITRES, true) });
      add({ ...at, id: `${w.id}-fill`, label: () => 'Fill your containers', act: () => fillFrom('clean', FILL_LITRES) });
    } else if (w.kind === 'puddle') {
      add({ ...at, id: `${w.id}-drink`, label: () => 'Drink from the puddle (dirty)', act: () => needs.drink(DRINK_LITRES, false) });
      add({ ...at, id: `${w.id}-fill`, label: () => 'Fill with dirty water', act: () => fillFrom('dirty', FILL_LITRES) });
    } else {
      const left = (): number => litres.get(w.id) ?? 0;
      add({
        ...at, id: `${w.id}-drink`,
        label: () => (left() > 0 ? `Drink from the rain catcher (${left().toFixed(1)} L)` : null),
        act: () => {
          const take = Math.min(DRINK_LITRES, left());
          if (take <= 0) return;
          litres.set(w.id, left() - take);
          needs.drink(take, true);
        },
      });
      add({
        ...at, id: `${w.id}-fill`,
        label: () => (left() > 0 ? 'Fill your containers' : null),
        act: () => {
          const stored = inv.fillLiquid('clean', left());
          litres.set(w.id, left() - stored);
          bus.emit('hint', { text: stored > 0 ? `You fill ${stored.toFixed(1)} L.` : 'Nothing fits.' });
        },
      });
    }
  }

  function fillFrom(kind: 'clean' | 'dirty', amount: number): void {
    const stored = inv.fillLiquid(kind, amount);
    bus.emit('hint', { text: stored > 0 ? `You fill ${stored.toFixed(1)} L.` : 'Nothing fits.' });
  }

  // Waystation bed: sleep at night under a haven, rest by day.
  for (const s of map.spots) {
    if (s.kind !== 'bed') continue;
    interact.add({
      id: `bed-${s.id}`, x: s.x, y: s.y, z: s.z, radius: 2,
      label: () => {
        if (sleeping || resting) return null;
        if (clock.night) return getPlayer().haven ? 'Sleep until dawn' : null;
        return 'Rest a while';
      },
      act: () => {
        if (clock.night) {
          sleeping = true;
          sleepStart = clock.sunHours;
          clock.setRate(SLEEP_RATE);
        } else {
          resting = true;
          restEnd = clock.sunHours + REST_SUN_HOURS;
          clock.setRate(REST_RATE);
        }
      },
    });
  }

  bus.on('player-hit', () => {
    if (sleeping) {
      sleeping = false;
      clock.setRate(1);
      bus.emit('hint', { text: WAKE_TEXT });
    } else if (resting) {
      resting = false;
      clock.setRate(1);
    }
  });

  function update(dt: number, sunHours: number, weather: WeatherState): void {
    time += dt;
    const raining = RAIN.includes(weather.kind);
    const night = clock.night;

    for (const f of [...fires]) {
      const inHaven = collider.havenAt(f.x, f.y, f.z) !== null;
      f.hours -= sunHours * (raining && !inHaven ? RAIN_BURN_MUL : 1);
      if (f.hours <= 0) { extinguish(f); continue; }
      const scale = Math.max(0.3, Math.min(1, f.hours / 4));
      f.light.intensity = (2.2 + 0.4 * Math.sin(time * 11 + f.phase)) * scale;
      for (const p of f.flames) {
        const k = 0.9 + 0.2 * Math.sin(time * 9 + p.phase);
        p.sprite.position.set(Math.sin(p.phase) * 0.15, 0.35 + 0.1 * Math.sin(time * 13 + p.phase), Math.cos(p.phase) * 0.15);
        p.sprite.scale.set(0.7 * k, 0.9 * k * (0.95 + 0.1 * Math.sin(time * 7 + p.phase * 2)), 1);
      }
      for (const p of f.smoke) {
        p.age += dt * 0.25;
        if (p.age >= 1) {
          p.age = 0;
          p.dx = 0; p.dz = 0;
        }
        p.dx += Math.sin(weather.windDir) * weather.wind * 0.15 * dt;
        p.dz += Math.cos(weather.windDir) * weather.wind * 0.15 * dt;
        p.sprite.position.set(p.dx, 0.6 + p.age * 3, p.dz);
        p.sprite.scale.setScalar(0.5 + p.age * 1.4);
        (p.sprite.material as THREE.SpriteMaterial).opacity = 0.35 * (1 - p.age);
      }
      if (night) {
        f.noiseTimer += dt;
        if (f.noiseTimer >= FIRE.noiseEverySec) {
          f.noiseTimer -= FIRE.noiseEverySec;
          bus.emit('noise', { x: f.x, z: f.z, radius: NOISE.fire, source: 'fire' });
        }
      }
    }

    if (raining) {
      for (const w of map.water) {
        if (w.kind !== 'rain-catcher') continue;
        const cur = litres.get(w.id) ?? 0;
        litres.set(w.id, Math.min(RAIN_CATCHER.capLitres, cur + RAIN_CATCHER.litresPerHour * sunHours));
      }
    }

    if (sleeping && !clock.night) {
      sleeping = false;
      clock.setRate(1);
      bus.emit('slept', { hours: clock.sunHours - sleepStart });
    }
    if (resting && clock.sunHours >= restEnd) {
      resting = false;
      clock.setRate(1);
    }
  }

  function nearFire(pos: Vec3): boolean {
    return fires.some((f) => dist2(f.x, f.z, pos.x, pos.z) <= FIRE.warmRadius);
  }

  return {
    update,
    placeFire,
    nearFire,
    firesLit: () => fires.length,
    sleeping: () => sleeping,
  };
}
