/// <reference types="node" />
// Golden test for Gnome Front's arena: the constants (bases, flags, vehicle slots), the ground height on a grid, the cover
// obstacles buildWorld() returns (positions, sizes, order) and where it puts every object. Captured BEFORE the arena moved
// into a level document.
// Regenerate only for a deliberate change:  GOLDEN_CAPTURE=1 npx vitest run --root games/gnome-front src/arena.golden.test.ts
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ARENA_HALF, BASES, FLAGS, VEHICLE_SLOTS } from './config';
import { heightAt } from './terrain';
import { buildWorld } from './world';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'arena.golden.json');

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canon(o[k])]));
  }
  return typeof v === 'number' ? Math.round(v * 1e9) / 1e9 : v;
}
const sha = (s: string): string => createHash('sha1').update(s).digest('hex').slice(0, 16);
const hash = (v: unknown): string => sha(JSON.stringify(canon(v)));
const f = (n: number): string => n.toFixed(9);

function capture(): Record<string, string | number> {
  const g: Record<string, string | number> = {
    arenaHalf: ARENA_HALF, bases: hash(BASES), flags: hash(FLAGS), vehicleSlots: hash(VEHICLE_SLOTS),
    flagCount: FLAGS.length, slotCount: VEHICLE_SLOTS.length,
  };
  const heights: string[] = [];
  for (let x = -150; x <= 150; x += 10) for (let z = -150; z <= 150; z += 10) heights.push(f(heightAt(x, z)));
  g.heights = sha(heights.join(','));

  const scene = new THREE.Scene();
  const obstacles = buildWorld(scene);
  g.obstacleCount = obstacles.length;
  g.obstacles = hash(obstacles);
  g.sceneChildren = scene.children.map((c) => c.type).join(',');
  // Every object buildWorld placed (the landmarks, HQs and scattered cover live in one group), in creation order.
  const placed: string[] = [];
  scene.traverse((o) => {
    if (o === scene || o instanceof THREE.Light) return;
    if (o.parent === scene) return;
    if (o.parent && o.parent.parent === scene) placed.push([o.type, f(o.position.x), f(o.position.y), f(o.position.z), f(o.rotation.y), f(o.scale.x)].join('/'));
  });
  g.placedCount = placed.length;
  g.placed = sha(placed.join('|'));
  return g;
}

describe('gnome front arena golden', () => {
  it('matches the captured fixture', () => {
    const got = capture();
    if (process.env.GOLDEN_CAPTURE) { writeFileSync(FIXTURE, JSON.stringify(got, null, 1) + '\n'); return; }
    expect(existsSync(FIXTURE)).toBe(true);
    const want = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, string | number>;
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
    for (const k of Object.keys(want)) expect([k, got[k]]).toEqual([k, want[k]]);
  });
});
