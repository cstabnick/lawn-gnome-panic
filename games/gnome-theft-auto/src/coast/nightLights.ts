// The lit seaside (FX11, G3#12): emissive bulbs, lanterns and windows that switch on at dusk, and soft light-pool decals
// under the lamps. No real lights: one shared night factor (eased from the sky's time label) drives every material made
// here. coast/index.ts steps it once a frame; modules make their materials and pools at build time.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { TimeLabel } from '../atmosphere';

/** How dark each time label is for the coast's lights (0 = lights off, 1 = full night). */
const LABEL_NIGHT: Record<TimeLabel, number> = {
  Morning: 0, Noon: 0, 'Golden Hour': 0.2, Dusk: 0.75, 'Neon Night': 1, Dawn: 0.35,
};
/** Seconds to fade fully on or off. */
const EASE_S = 4;

let night = 0;
/** The first step snaps to the target (loading into the night starts lit). */
let first = true;
const glows: { m: THREE.MeshStandardMaterial; peak: number }[] = [];
const pools: { mesh: THREE.Mesh; peak: number }[] = [];
const hooks: ((n: number, dt: number) => void)[] = [];

/** The target night factor for a time label (null: no sky, daylight). Pure. */
export function nightTarget(label: TimeLabel | null): number {
  return label ? LABEL_NIGHT[label] ?? 0 : 0;
}

/** The current (eased) night factor, 0 day .. 1 night. */
export function coastNight(): number {
  return night;
}

/**
 * A material for a bulb, lantern or window: `day` colour by day (unlit glass, default a pale cream), glowing `color` at
 * night (emissive intensity `peak` x night). One material can be shared by many merged meshes.
 */
export function nightGlowMat(color: number, peak = 1.8, day = 0xf4ecd8): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: day, roughness: 0.4, emissive: color, emissiveIntensity: peak * night });
  glows.push({ m, peak });
  return m;
}

let poolTex: THREE.CanvasTexture | null | undefined;
function poolTexture(): THREE.CanvasTexture | null {
  if (poolTex !== undefined) return poolTex;
  poolTex = null;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  poolTex = new THREE.CanvasTexture(c);
  return poolTex;
}

/**
 * A soft warm pool of lamp light on a floor: a flat disc of radius `r` centred at (x, y, z), on the decal layer
 * (flatLayer: no z-fighting with the planks), additive, invisible by day. Add the returned mesh to the scene.
 */
export function lightPool(x: number, y: number, z: number, r: number, color = 0xffd08a, peak = 0.55): THREE.Mesh {
  const map = poolTexture();
  const mat = flatLayer(new THREE.MeshBasicMaterial({
    color, map, transparent: true, opacity: peak * night, depthWrite: false, blending: THREE.AdditiveBlending,
  }), LAYER.decal);
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 24), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y + 0.02, z);
  mesh.visible = night > 0.02;
  mesh.name = 'coast-light-pool';
  pools.push({ mesh, peak });
  return mesh;
}

/** Called every frame with the eased night factor (chasing bulbs, a window that lights at dusk). */
export function onCoastNight(fn: (night: number, dt: number) => void): void {
  hooks.push(fn);
}

/** Every frame (coast/index.ts): ease towards the label's night factor and update every glow, pool and hook. */
export function stepCoastNight(dt: number, label: TimeLabel | null): void {
  const target = nightTarget(label);
  const step = dt / EASE_S;
  const was = night;
  night = first ? target : target > night ? Math.min(target, night + step) : Math.max(target, night - step);
  if (night !== was || first) {
    for (const g of glows) g.m.emissiveIntensity = g.peak * night;
    for (const p of pools) {
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.peak * night;
      p.mesh.visible = night > 0.02;
    }
  }
  first = false;
  for (const h of hooks) h(night, dt);
}
