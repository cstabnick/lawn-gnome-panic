// Prefab pictures for UI slots: one small offscreen WebGL renderer draws each prefab once from a three-quarter view,
// and the PNG data URL is cached. Cheap after the first call. Falls back to null without WebGL (the caller shows its emoji).
import * as THREE from 'three';
import { buildPrefab } from './build';
import { getPrefab } from './registry';
import type { Swatch } from './palette';
import type { PrefabDef } from './types';

let renderer: THREE.WebGLRenderer | null | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let lastSize = 0;
let encodeMime: 'image/webp' | 'image/png' = 'image/png';
const cache = new Map<string, string>();
const _box = new THREE.Box3();
const _dims = new THREE.Vector3();
const _sphere = new THREE.Sphere();
const _dir = new THREE.Vector3();

function setup(): THREE.WebGLRenderer | null {
  if (renderer !== undefined) return renderer;
  try {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // WebP encoding with alpha is 2-4x faster than PNG and produces smaller data URLs.
    try {
      const probe = document.createElement('canvas');
      probe.width = probe.height = 1;
      if (probe.toDataURL('image/webp', 0.92).startsWith('data:image/webp')) {
        encodeMime = 'image/webp';
      }
    } catch {
      encodeMime = 'image/png';
    }
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
export function prefabIcon(idOrDef: string | PrefabDef, opts: IconOptions = {}): string | null {
  const def = typeof idOrDef === 'string' ? getPrefab(idOrDef) : idOrDef;
  if (!def) return null;
  const size = opts.size ?? 64;
  const yaw = opts.yaw ?? 35;
  const key = `${def.id}|${size}|${opts.tint ?? ''}|${yaw}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = setup();
  if (!r) return null;

  const model = buildPrefab(def, { tint: opts.tint, shadows: false, lights: false });
  // Long upright things (swords, staffs) read better lying diagonally across the slot.
  _box.setFromObject(model);
  _box.getSize(_dims);
  const tall = def.uses.includes('hold') && _dims.y > 1.8 * Math.max(_dims.x, _dims.z);
  const pivot = new THREE.Group();
  pivot.add(model);
  if (tall) pivot.rotation.z = -Math.PI / 4;
  pivot.rotation.y = yaw * (Math.PI / 180);
  scene.add(pivot);

  _box.setFromObject(pivot).getBoundingSphere(_sphere);
  const dist = _sphere.radius / Math.sin((camera.fov / 2) * (Math.PI / 180)) * 1.02;
  _dir.set(0, tall ? 0.15 : 0.55, 1).normalize();
  camera.position.copy(_sphere.center).addScaledVector(_dir, dist);
  camera.lookAt(_sphere.center);
  camera.updateProjectionMatrix();

  if (lastSize !== size) {
    r.setSize(size, size, false);
    lastSize = size;
  }
  r.render(scene, camera);
  const url = encodeMime === 'image/webp'
    ? r.domElement.toDataURL('image/webp', 0.92)
    : r.domElement.toDataURL('image/png');
  scene.remove(pivot);
  cache.set(key, url);
  return url;
}

export interface PrewarmIconOptions extends IconOptions {
  /** Number of icons to render per idle slice. Default 4. */
  chunkSize?: number;
}

/**
 * Pre-renders prefab icons in small idle-time chunks so opening inventories, shops or galleries hits the cache
 * without blocking the main thread. Returns a cancel function.
 */
export function prewarmPrefabIcons(ids: readonly string[], opts: PrewarmIconOptions = {}): () => void {
  const chunkSize = Math.max(1, opts.chunkSize ?? 4);
  let index = 0;
  let cancelled = false;
  let handle: number | ReturnType<typeof setTimeout> | undefined;

  const schedule = (fn: () => void): void => {
    if (typeof requestIdleCallback === 'function') {
      handle = requestIdleCallback(() => fn(), { timeout: 250 });
    } else {
      handle = setTimeout(fn, 16);
    }
  };

  const step = (): void => {
    if (cancelled) return;
    const end = Math.min(ids.length, index + chunkSize);
    for (; index < end; index++) {
      prefabIcon(ids[index], opts);
    }
    if (index < ids.length) schedule(step);
  };

  if (ids.length > 0) schedule(step);

  return () => {
    cancelled = true;
    if (handle !== undefined) {
      if (typeof cancelIdleCallback === 'function' && typeof handle === 'number') {
        cancelIdleCallback(handle);
      } else {
        clearTimeout(handle as ReturnType<typeof setTimeout>);
      }
    }
  };
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
