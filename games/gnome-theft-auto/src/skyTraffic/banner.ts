// The towed advert banner (docs/roadmaps/gta-npc-planes.md): a cloth strip on a rope behind the tow plane. It flutters
// cheaply (one vertex array written in place), shows one ad as a large canvas texture readable from the ground on both
// sides, takes bullet hits, and can be torn loose to fall and fade.
import * as THREE from 'three';
import { BRANDS } from '../brands';
import { heightAt } from '../terrain';
import { SKY } from './config';
import type { AdDef } from './types';

export interface SkyBanner {
  readonly object: THREE.Group;
  setAd(ad: AdDef): void;
  update(dt: number, tx: number, ty: number, tz: number, yaw: number, speed: number, time: number, near: boolean): void;
  hitTest(x: number, y: number, z: number): boolean;
  tearLoose(): void;
  readonly torn: boolean;
  gone(): boolean;
  readonly hits: number;
  centre(out: THREE.Vector3): THREE.Vector3;
  setVisible(on: boolean): void;
  dispose(): void;
}

// ---- Ad textures ----

const textureCache = new Map<string, THREE.CanvasTexture>();

function hexCss(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

function isLightColour(n: number): boolean {
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
}

function drawAd(cv: HTMLCanvasElement, ad: AdDef): void {
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const W = cv.width;
  const H = cv.height;
  const brand = BRANDS[ad.brand];

  let bg: string;
  let border: string;
  let fg: string;
  let accent: string;
  if (ad.egg) {
    bg = '#1b1b22';
    border = '#ff6fa8';
    fg = '#ffffff';
    accent = '#ff6fa8';
  } else {
    bg = hexCss(brand.primary);
    border = hexCss(brand.secondary);
    fg = isLightColour(brand.primary) ? '#151518' : '#ffffff';
    accent = border;
  }

  ctx.fillStyle = border;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(14, 14, W - 28, H - 28);

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Headline: shrink until it fits the cloth width (minimum 60 px).
  let size = 170;
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  while (size > 60 && ctx.measureText(ad.headline).width > W - 120) {
    size = Math.max(60, size - 8);
    ctx.font = `900 ${size}px system-ui, sans-serif`;
  }
  ctx.fillText(ad.headline, W / 2, 108);

  ctx.font = '700 40px system-ui, sans-serif';
  ctx.globalAlpha = 0.85;
  ctx.fillText(ad.tagline, W / 2, 200);
  ctx.globalAlpha = 1;

  ctx.font = '800 26px system-ui';
  ctx.fillStyle = accent;
  ctx.textAlign = 'right';
  ctx.fillText(brand.name, W - 30, 232);
}

/** One CanvasTexture per ad (cached by id, at most SKY.bannerTextureCache; the oldest is disposed). */
export function adTexture(ad: AdDef): THREE.CanvasTexture {
  const cached = textureCache.get(ad.id);
  if (cached) return cached;

  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({ width: 4, height: 4 } as unknown as HTMLCanvasElement);
  }

  const cv = document.createElement('canvas');
  cv.width = SKY.adCanvasW;
  cv.height = SKY.adCanvasH;
  drawAd(cv, ad);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;

  textureCache.set(ad.id, tex);
  if (textureCache.size > SKY.bannerTextureCache) {
    const oldestKey = textureCache.keys().next().value;
    if (oldestKey !== undefined) {
      const old = textureCache.get(oldestKey);
      textureCache.delete(oldestKey);
      old?.dispose();
    }
  }
  return tex;
}

// ---- Geometry layout ----
// Columns c = 0..S. Front set: vertex 2c = top_c, 2c+1 = bot_c. Back set: the same positions offset by SETV.
const S = SKY.bannerSegments;
const L = SKY.bannerLength;
const H = SKY.bannerHeight;
const SETV = 2 * (S + 1);
const VERTS = 2 * SETV;

function buildClothGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(VERTS * 3);
  const uv = new Float32Array(VERTS * 2);
  const idx = new Uint16Array(S * 12);

  for (let set = 0; set < 2; set++) {
    const base = set * SETV;
    for (let c = 0; c <= S; c++) {
      const u = c / S;
      const z = -SKY.ropeLength - u * L;
      const uu = set === 0 ? u : 1 - u;
      for (let b = 0; b < 2; b++) {
        const v = base + 2 * c + b;
        pos[v * 3] = 0;
        pos[v * 3 + 1] = b === 0 ? -SKY.bannerDrop : -SKY.bannerDrop - H;
        pos[v * 3 + 2] = z;
        uv[v * 2] = uu;
        uv[v * 2 + 1] = b === 0 ? 1 : 0;
      }
    }
  }

  let k = 0;
  for (let c = 0; c < S; c++) {
    const t0 = 2 * c;
    const b0 = 2 * c + 1;
    const t1 = 2 * (c + 1);
    const b1 = 2 * (c + 1) + 1;
    // Front (faces +x, CCW).
    idx[k++] = t0; idx[k++] = b0; idx[k++] = t1;
    idx[k++] = t1; idx[k++] = b0; idx[k++] = b1;
    // Back (the same triples reversed: faces -x).
    idx[k++] = SETV + t1; idx[k++] = SETV + b0; idx[k++] = SETV + t0;
    idx[k++] = SETV + b1; idx[k++] = SETV + b0; idx[k++] = SETV + t1;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

/** Writes the flutter into the x of every vertex (both sets share it). No allocation. */
function flutter(geo: THREE.BufferGeometry, time: number): void {
  const attr = geo.getAttribute('position') as THREE.BufferAttribute;
  const arr = attr.array as Float32Array;
  for (let c = 0; c <= S; c++) {
    const u = c / S;
    const phase = SKY.flutterWave * u * L - SKY.flutterSpeed * time;
    const x = SKY.flutterAmp * u * Math.sin(phase);
    for (let b = 0; b < 2; b++) {
      const xv = b === 0 ? x : x * 1.15;
      const v0 = 2 * c + b;
      arr[v0 * 3] = xv;
      arr[(SETV + v0) * 3] = xv;
    }
  }
  attr.needsUpdate = true;
}

function flatten(geo: THREE.BufferGeometry): void {
  const attr = geo.getAttribute('position') as THREE.BufferAttribute;
  const arr = attr.array as Float32Array;
  for (let v = 0; v < VERTS; v++) arr[v * 3] = 0;
  attr.needsUpdate = true;
}

// ---- Scratch (no per-call allocation) ----
const scratchOff = { x: 0, z: 0 };

export function createBanner(scene: THREE.Scene): SkyBanner {
  const object = new THREE.Group();

  const ropeGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -SKY.bannerDrop, -SKY.ropeLength),
  ]);
  const ropeMat = new THREE.LineBasicMaterial({ color: 0x333333 });
  const rope = new THREE.Line(ropeGeo, ropeMat);
  rope.castShadow = false;
  object.add(rope);

  const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, H, 6);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, -SKY.bannerDrop - H / 2, -SKY.ropeLength);
  pole.castShadow = false;
  object.add(pole);

  const clothGeo = buildClothGeometry();
  const clothMat = new THREE.MeshBasicMaterial({ map: null, side: THREE.FrontSide });
  const cloth = new THREE.Mesh(clothGeo, clothMat);
  cloth.castShadow = false;
  cloth.frustumCulled = false;
  object.add(cloth);

  scene.add(object);

  let torn = false;
  let gone = false;
  let landed = false;
  let fadeT = 0;
  let hits = 0;
  let flat = false;
  let vx = 0;
  let vz = 0;
  let lastSpeed = 0;

  return {
    object,

    setAd(ad: AdDef): void {
      clothMat.map = adTexture(ad);
      clothMat.needsUpdate = true;
    },

    update(dt, tx, ty, tz, yaw, speed, time, near): void {
      if (!torn) {
        object.position.set(tx, ty, tz);
        object.rotation.set(0, yaw, 0);
        lastSpeed = speed;
      } else if (!landed) {
        object.position.x += vx * dt;
        object.position.z += vz * dt;
        object.position.y -= SKY.bannerFall * dt;
        vx *= Math.max(0, 1 - 0.5 * dt);
        vz *= Math.max(0, 1 - 0.5 * dt);
        object.rotation.y += 0.2 * dt;
        const floor = heightAt(object.position.x, object.position.z);
        if (object.position.y - SKY.bannerDrop - H <= floor) {
          landed = true;
          clothMat.transparent = true;
        }
      } else if (!gone) {
        fadeT += dt;
        clothMat.opacity = Math.max(0, 1 - fadeT / SKY.bannerFade);
        if (fadeT >= SKY.bannerFade) gone = true;
      }

      if (near) {
        flutter(clothGeo, time);
        flat = false;
      } else if (!flat) {
        flatten(clothGeo);
        flat = true;
      }
    },

    hitTest(x, y, z): boolean {
      if (torn) return false;
      const yaw = object.rotation.y;
      const dx = x - object.position.x;
      const dy = y - object.position.y;
      const dz = z - object.position.z;
      const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
      const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const hit = Math.abs(lx) < 2.5
        && lz <= -SKY.ropeLength && lz >= -SKY.ropeLength - L
        && dy <= -SKY.bannerDrop && dy >= -SKY.bannerDrop - H;
      if (hit) hits += 1;
      return hit;
    },

    tearLoose(): void {
      if (torn) return;
      torn = true;
      const yaw = object.rotation.y;
      vx = Math.sin(yaw) * lastSpeed * 0.3;
      vz = Math.cos(yaw) * lastSpeed * 0.3;
      rope.visible = false;
    },

    get torn(): boolean {
      return torn;
    },

    gone(): boolean {
      return gone;
    },

    get hits(): number {
      return hits;
    },

    centre(out: THREE.Vector3): THREE.Vector3 {
      const yaw = object.rotation.y;
      const lx = 0;
      const lz = -SKY.ropeLength - L / 2;
      scratchOff.x = lx * Math.cos(yaw) + lz * Math.sin(yaw);
      scratchOff.z = -lx * Math.sin(yaw) + lz * Math.cos(yaw);
      return out.set(
        object.position.x + scratchOff.x,
        object.position.y - SKY.bannerDrop - H / 2,
        object.position.z + scratchOff.z,
      );
    },

    setVisible(on: boolean): void {
      object.visible = on;
    },

    dispose(): void {
      scene.remove(object);
      ropeGeo.dispose();
      ropeMat.dispose();
      poleGeo.dispose();
      poleMat.dispose();
      clothGeo.dispose();
      clothMat.dispose();
    },
  };
}
