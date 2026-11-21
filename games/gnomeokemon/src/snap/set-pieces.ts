// Set pieces for a course: water and lava pools, islands and platforms, walls, lore and toy props, the cave roof,
// and the Turfton street. Everything is read from the course's level document (levels.ts) and sits on the terrain
// that the stamps made. The terrain itself is built in world.ts.

import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import {
  buildRailCurve,
  courseFlags,
  courseIslands,
  coursePlatforms,
  coursePonds,
  courseProps,
  courseWalls,
} from './levels';
import type { CourseId } from './types';
import type { WorldHandles } from './world';

const STONE = 0x8c877f;
const STONE_CAP = 0xa39e95;
const BRICK = 0xa4553a;
const MORTAR = 0xd8cbb8;
const GLASS_FRAME = 0x334155;
const GLASS = 0x9fd8e6;
const ICE = 0xbfe7f5;
const ROCK = 0x4a4038;
const PILLAR = 0xb8b2a6;
const GRASS_CAP = 0x7a9a4a;
const PLATFORM = 0x9c8b6e;
const CAVE_ROOF = 0x221a17;
const CAVE_SKY = 0x1c1512;
const CITY_SKY = 0x9db0c4;
const CITY_LINE = 0xf5d76e;

/** Toy props that move: a yarn ball rolls, a duck bobs, a lily pad sways. */
const TOYS = new Set(['yarn-ball', 'rubber-duck', 'lily-pad']);

/** A small deterministic 0..1 number, so set pieces look the same on every ride. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Points spaced `step` apart along a polyline, each with the direction of travel. */
function alongPolyline(points: readonly [number, number][], step: number): { x: number; z: number; ang: number; len: number }[] {
  const out: { x: number; z: number; ang: number; len: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const total = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(total / step));
    const ang = Math.atan2(bx - ax, bz - az);
    for (let s = 0; s < n; s++) {
      const t = (s + 0.5) / n;
      out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, ang, len: total / n });
    }
  }
  return out;
}

function mat(colour: number, opts: { transparent?: boolean; opacity?: number; flat?: boolean } = {}): THREE.Material {
  return new THREE.MeshLambertMaterial({
    color: colour,
    flatShading: opts.flat ?? true,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

function box(w: number, h: number, d: number, colour: number, x: number, y: number, z: number, opts?: { transparent?: boolean; opacity?: number }): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(colour, opts));
  m.position.set(x, y, z);
  return m;
}

/** Wall pieces along a polyline. Each style is a few meshes per 1.6 m segment, standing on the terrain. */
function buildWall(
  group: THREE.Group,
  points: readonly [number, number][],
  style: string,
  ground: (x: number, z: number) => number,
): void {
  const segs = alongPolyline(points, 1.6);
  segs.forEach((s, i) => {
    const y = ground(s.x, s.z);
    const add = (m: THREE.Object3D, dy = 0, dx = 0): void => {
      const holder = new THREE.Group();
      holder.position.set(s.x, y + dy, s.z);
      holder.rotation.y = s.ang - Math.PI / 2; // local x runs along the wall
      m.position.x += dx;
      holder.add(m);
      group.add(holder);
    };
    if (style === 'stone') {
      const h = 1.2 + (i % 2) * 0.25;
      add(box(s.len, h, 0.35, STONE, 0, h / 2, 0));
      add(box(s.len, 0.12, 0.42, STONE_CAP, 0, h + 0.06, 0));
    } else if (style === 'brick') {
      add(box(s.len, 1.5, 0.3, BRICK, 0, 0.75, 0));
      add(box(s.len, 0.06, 0.32, MORTAR, 0, 0.5, 0));
      add(box(s.len, 0.06, 0.32, MORTAR, 0, 1.0, 0));
    } else if (style === 'glass') {
      add(box(0.08, 2.6, 0.08, GLASS_FRAME, -s.len / 2, 1.3, 0));
      add(box(s.len, 2.4, 0.04, GLASS, 0, 1.4, 0, { transparent: true, opacity: 0.35 }));
      add(box(s.len, 0.1, 0.1, GLASS_FRAME, 0, 2.65, 0));
    } else if (style === 'ice') {
      add(box(s.len, 1.8, 0.5, ICE, 0, 0.9, 0, { transparent: true, opacity: 0.75 }));
    } else if (style === 'rock') {
      const r = 0.8 + hash(i) * 0.5;
      const jitter = (hash(i + 7) - 0.5) * 0.5;
      const boulder = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), mat(ROCK));
      boulder.scale.set(1.1, 1.4, 0.8);
      boulder.position.set(jitter, r * 1.1, 0);
      const holder = new THREE.Group();
      holder.position.set(s.x, y, s.z);
      holder.rotation.y = s.ang - Math.PI / 2; // local x runs along the wall
      holder.add(boulder);
      group.add(holder);
    } else {
      // pillar: a column at each segment, with a capital
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.4, 8), mat(PILLAR));
      col.position.set(0, 1.2, 0);
      add(col);
      add(box(0.9, 0.25, 0.9, PILLAR, 0, 2.52, 0));
    }
  });
}

/** Set pieces for a course. Returns an update(t) for the water, lava and bobbing parts. */
export function buildSetPieces(scene: THREE.Scene, courseId: CourseId, ground: (x: number, z: number) => number): WorldHandles {
  const anim: ((t: number) => void)[] = [];
  const flags = courseFlags(courseId);

  for (const p of coursePonds(courseId)) {
    const m = p.lava
      ? new THREE.MeshBasicMaterial({ color: p.color })
      : new THREE.MeshLambertMaterial({ color: p.color, transparent: true, opacity: 0.82 });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(p.r * 0.95, 28), m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(p.x, p.level + 0.03, p.z);
    mesh.name = p.lava ? 'lava' : 'water';
    scene.add(mesh);
    const base = new THREE.Color(p.color);
    if (p.lava) {
      // Lava breathes: the colour pulses between the pool's colour and a dimmer red.
      anim.push((t) => {
        m.color.copy(base).multiplyScalar(0.8 + 0.2 * Math.sin(t * 2.4 + p.x));
      });
    } else {
      // Water lifts and falls a few millimetres, so it reads as moving.
      anim.push((t) => {
        mesh.position.y = p.level + 0.03 + Math.sin(t * 1.3 + p.x) * 0.008;
      });
    }
  }

  for (const isl of courseIslands(courseId)) {
    // A grassy cap on the island: its top sits at h, the same height the stamp gave the ground.
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(isl.r * 0.95, isl.r * 1.05, 0.12, 14), mat(GRASS_CAP));
    cap.position.set(isl.x, isl.h - 0.06, isl.z);
    scene.add(cap);
  }

  for (const pl of coursePlatforms(courseId)) {
    // A stone plinth from below the bank up to the platform top, where the stamp put the flat ground at h.
    const height = pl.h + 0.6;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(pl.r * 0.95, pl.r * 1.05, height, 12), mat(PLATFORM));
    plinth.position.set(pl.x, (pl.h - 0.6) / 2, pl.z);
    plinth.castShadow = true;
    scene.add(plinth);
  }

  const wallGroup = new THREE.Group();
  for (const w of courseWalls(courseId)) buildWall(wallGroup, w.points, w.style, ground);
  scene.add(wallGroup);

  for (const p of courseProps(courseId)) {
    const prop = buildPrefab(p.prefab, { lights: false });
    prop.position.set(p.x, ground(p.x, p.z), p.z);
    prop.rotation.y = p.rot ?? 0;
    prop.scale.setScalar(p.scale ?? 1.6);
    scene.add(prop);
    if (TOYS.has(p.prefab)) {
      const baseY = prop.position.y;
      const baseRot = prop.rotation.y;
      anim.push((t) => {
        if (p.prefab === 'yarn-ball') prop.rotation.z = Math.sin(t * 0.8 + p.x) * 0.25;
        else if (p.prefab === 'rubber-duck') prop.position.y = baseY + Math.sin(t * 1.6 + p.x) * 0.02;
        else prop.rotation.y = baseRot + Math.sin(t * 0.5 + p.z) * 0.08;
      });
    }
  }

  if (flags.cave) buildCaveRoof(scene);
  if (flags.city) buildStreetLines(scene, courseId);

  return {
    update(t: number) {
      for (const fn of anim) fn(t);
    },
  };
}

/** The Rockery pass: a dark roof of rock with stalactites, so the ride runs under the hill. */
function buildCaveRoof(scene: THREE.Scene): void {
  scene.background = new THREE.Color(CAVE_SKY);
  scene.fog = new THREE.Fog(CAVE_SKY, 12, 40);
  const ROOF_Y = 5.2;
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshLambertMaterial({ color: CAVE_ROOF, side: THREE.DoubleSide }));
  roof.rotation.x = Math.PI / 2;
  roof.position.set(0, ROOF_Y, -5);
  scene.add(roof);
  for (let i = 0; i < 26; i++) {
    const z = 18 - i * 1.8;
    const x = (hash(i) - 0.5) * 14;
    const h = 0.9 + hash(i + 3) * 1.1;
    const stal = new THREE.Mesh(new THREE.ConeGeometry(0.35 + hash(i + 5) * 0.2, h, 6), mat(0x3a2e27));
    stal.rotation.x = Math.PI;
    stal.position.set(x, ROOF_Y - h / 2, z);
    scene.add(stal);
  }
}

/** Turfton's street: a dark road with a dashed centre line along the rail, under an overcast sky. */
function buildStreetLines(scene: THREE.Scene, courseId: CourseId): void {
  scene.background = new THREE.Color(CITY_SKY);
  scene.fog = new THREE.Fog(CITY_SKY, 18, 60);
  const curve = buildRailCurve(courseId);
  const pts = curve.getSpacedPoints(70);
  pts.forEach((p, i) => {
    if (i % 2 === 1) return;
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.9), mat(CITY_LINE));
    dash.position.set(p.x, 0.02, p.z);
    dash.rotation.y = Math.atan2(next.x - p.x, next.z - p.z);
    scene.add(dash);
  });
}

/** Turfton downtown: the street's lights and sky. The terrain (asphalt) and the buildings are the course's props. */
export function buildCityEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(CITY_SKY);
  scene.fog = new THREE.Fog(CITY_SKY, 18, 60);
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x3a3d42, 1.6));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.9);
  sun.position.set(12, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 70;
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 34;
  sun.shadow.camera.bottom = -34;
  scene.add(sun);
  return { update() {} };
}
