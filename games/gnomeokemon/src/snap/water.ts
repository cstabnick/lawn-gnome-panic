// Water for the lawn ride: the ford's water sheet, the glass tube around the
// rail in its section, and the splash and bubble particles.
// Scene and curve are passed in; nothing here touches module-level state.

import * as THREE from 'three';
import { TUBE_RADIUS, WATER_Y } from './rail';

const FORD_WIDTH = 2.4;
const FORD_SAMPLES = 60;
const TUBE_SAMPLES = 40;
const TUBE_RADIAL = 8;
const SPLASH_COUNT = 60;
const BUBBLE_COUNT = 40;
const BUBBLE_RISE = 0.4;

/** Something that animates over time and is drawn as points. */
export interface WaterFx {
  points: THREE.Points;
  update(t: number, dt: number): void;
}

/** Evenly spaced u values from a to b, inclusive. */
function spanU(range: readonly [number, number], count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const f = count === 1 ? 0 : i / (count - 1);
    out.push(range[0] + (range[1] - range[0]) * f);
  }
  return out;
}

/** Horizontal (xz) unit normal of the curve at u. */
function sideNormal(curve: THREE.CatmullRomCurve3, u: number): THREE.Vector3 {
  const tan = curve.getTangentAt(u);
  const n = new THREE.Vector3(-tan.z, 0, tan.x);
  const len = Math.hypot(n.x, n.z) || 1;
  return n.multiplyScalar(1 / len);
}

/** Flat ribbon of water along the curve over the u range, at WATER_Y. */
export function buildFordWater(
  scene: THREE.Scene,
  curve: THREE.CatmullRomCurve3,
  range: readonly [number, number],
): THREE.Mesh {
  const us = spanU(range, FORD_SAMPLES);
  const positions: number[] = [];
  const indices: number[] = [];
  const half = FORD_WIDTH / 2;

  us.forEach((u, i) => {
    const p = curve.getPointAt(u);
    const n = sideNormal(curve, u);
    positions.push(p.x + n.x * half, WATER_Y, p.z + n.z * half);
    positions.push(p.x - n.x * half, WATER_Y, p.z - n.z * half);
    if (i < us.length - 1) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshLambertMaterial({
    color: 0x3fa7d6,
    transparent: true,
    opacity: 0.8,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

/** Sub-curve over the u range, sampled into a fresh CatmullRomCurve3. */
function subCurve(curve: THREE.CatmullRomCurve3, range: readonly [number, number]): THREE.CatmullRomCurve3 {
  const pts = spanU(range, TUBE_SAMPLES + 1).map((u) => curve.getPointAt(u));
  return new THREE.CatmullRomCurve3(pts);
}

/** Glass tube around the rail over the u range. */
export function buildTube(
  scene: THREE.Scene,
  curve: THREE.CatmullRomCurve3,
  range: readonly [number, number],
): THREE.Mesh {
  const geometry = new THREE.TubeGeometry(
    subCurve(curve, range),
    TUBE_SAMPLES,
    TUBE_RADIUS,
    TUBE_RADIAL,
    false,
  );
  const material = new THREE.MeshLambertMaterial({
    color: 0x7fd6ff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

/**
 * Splash points at the ford's entry and exit, plus bubbles rising inside the
 * tube. One Points cloud: the first SPLASH_COUNT points are splashes, the rest
 * are bubbles. update() rises the bubbles and flickers the cloud's opacity.
 */
export function buildSplashes(
  scene: THREE.Scene,
  curve: THREE.CatmullRomCurve3,
  ford: readonly [number, number],
  tube: readonly [number, number],
): WaterFx {
  const total = SPLASH_COUNT + BUBBLE_COUNT;
  const positions = new Float32Array(total * 3);

  // Splashes: scattered around the two ends of the ford.
  const ends = [ford[0], ford[1]];
  for (let i = 0; i < SPLASH_COUNT; i++) {
    const base = curve.getPointAt(ends[i % 2]);
    const jitterX = (Math.random() - 0.5) * 3;
    const jitterZ = (Math.random() - 0.5) * 3;
    positions[i * 3] = base.x + jitterX;
    positions[i * 3 + 1] = WATER_Y + Math.random() * 0.2;
    positions[i * 3 + 2] = base.z + jitterZ;
  }

  // Bubbles: inside the tube, between its bottom and top.
  const tubePts = spanU(tube, TUBE_SAMPLES + 1).map((u) => curve.getPointAt(u));
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of tubePts) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const bottom = minY - TUBE_RADIUS;
  const top = maxY + TUBE_RADIUS;
  const bubbleX: number[] = [];
  const bubbleZ: number[] = [];
  const bubbleY: number[] = [];
  for (let i = 0; i < BUBBLE_COUNT; i++) {
    const u = tube[0] + (tube[1] - tube[0]) * Math.random();
    const p = curve.getPointAt(u);
    const n = sideNormal(curve, u);
    const off = (Math.random() - 0.5) * TUBE_RADIUS * 1.2;
    bubbleX.push(p.x + n.x * off);
    bubbleZ.push(p.z + n.z * off);
    bubbleY.push(bottom + Math.random() * (top - bottom));
  }

  const writeBubbles = () => {
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const k = (SPLASH_COUNT + i) * 3;
      positions[k] = bubbleX[i];
      positions[k + 1] = bubbleY[i];
      positions[k + 2] = bubbleZ[i];
    }
  };
  writeBubbles();

  const geometry = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', attr);

  const material = new THREE.PointsMaterial({
    color: 0xe8f7ff,
    size: 0.35,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    points,
    update(t: number, dt: number) {
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        let y = bubbleY[i] + BUBBLE_RISE * dt;
        if (y > top) y = bottom;
        bubbleY[i] = y;
      }
      writeBubbles();
      attr.needsUpdate = true;
      material.opacity = 0.55 + 0.35 * Math.sin(t * 9);
    },
  };
}

/**
 * True when the closest of 40 sampled curve points within the u range is
 * within TUBE_RADIUS of pos. An empty [0, 0] range is never in the tube.
 */
export function isInTube(
  pos: THREE.Vector3,
  curve: THREE.CatmullRomCurve3,
  range: readonly [number, number],
): boolean {
  if (range[0] === 0 && range[1] === 0) return false;
  for (const u of spanU(range, 40)) {
    if (curve.getPointAt(u).distanceTo(pos) <= TUBE_RADIUS) return true;
  }
  return false;
}
