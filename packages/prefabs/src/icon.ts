// Prefab pictures for UI slots: one small offscreen WebGL renderer draws each prefab once from a three-quarter view,
// and the PNG data URL is cached. Cheap after the first call. Falls back to null without WebGL (the caller shows its emoji).
import * as THREE from 'three';
import { buildPrefab } from './build';
import { getPrefab } from './registry';
import type { Swatch } from './palette';

let renderer: THREE.WebGLRenderer | null | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
const cache = new Map<string, string>();

function setup(): THREE.WebGLRenderer | null {
  if (renderer !== undefined) return renderer;
  try {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } catch {
    renderer = null;
    return null;
  }
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a5a48, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 4, 3);
  scene.add(sun);
  camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  return renderer;
}

export interface IconOptions {
  /** Pixel size of the square picture. Default 64. Draw it at half that on screen for crisp hi-DPI. */
  size?: number;
  tint?: Swatch | number;
  /** View yaw in degrees. Default 35 (a little from the right). */
  yaw?: number;
}

/** A PNG data URL of the prefab, or null if WebGL is missing or the id is unknown. */
export function prefabIcon(id: string, opts: IconOptions = {}): string | null {
  const size = opts.size ?? 64;
  const yaw = opts.yaw ?? 35;
  const key = `${id}|${size}|${opts.tint ?? ''}|${yaw}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = getPrefab(id);
  const r = setup();
  if (!def || !r) return null;

  const model = buildPrefab(def, { tint: opts.tint, shadows: false, lights: false });
  // Long upright things (swords, staffs) read better lying diagonally across the slot.
  const box = new THREE.Box3().setFromObject(model);
  const dims = box.getSize(new THREE.Vector3());
  const tall = def.uses.includes('hold') && dims.y > 1.8 * Math.max(dims.x, dims.z);
  const pivot = new THREE.Group();
  pivot.add(model);
  if (tall) pivot.rotation.z = -Math.PI / 4;
  pivot.rotation.y = yaw * (Math.PI / 180);
  scene.add(pivot);

  const sphere = new THREE.Box3().setFromObject(pivot).getBoundingSphere(new THREE.Sphere());
  const dist = sphere.radius / Math.sin((camera.fov / 2) * (Math.PI / 180)) * 1.02;
  const dir = new THREE.Vector3(0, tall ? 0.15 : 0.55, 1).normalize();
  camera.position.copy(sphere.center).addScaledVector(dir, dist);
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();

  r.setSize(size, size, false);
  r.render(scene, camera);
  const url = r.domElement.toDataURL('image/png');
  scene.remove(pivot);
  cache.set(key, url);
  return url;
}

/**
 * An <img> of the prefab sized `px` CSS pixels, or a <span> with the emoji fallback when there is no picture.
 * The returned element has class 'prefab-icon'.
 */
export function prefabIconElement(id: string | undefined, fallbackEmoji: string, px = 24, tint?: Swatch | number): HTMLElement {
  const url = id ? prefabIcon(id, { size: Math.max(32, Math.ceil(px * 2)), tint }) : null;
  if (!url) {
    const span = document.createElement('span');
    span.className = 'prefab-icon';
    span.textContent = fallbackEmoji;
    span.style.fontSize = `${px}px`;
    span.style.lineHeight = '1';
    return span;
  }
  const img = document.createElement('img');
  img.className = 'prefab-icon';
  img.src = url;
  img.alt = fallbackEmoji;
  img.draggable = false;
  img.style.width = img.style.height = `${px}px`;
  img.style.display = 'block';
  img.style.pointerEvents = 'none';
  return img;
}
