// Regression: every golden acorn must be pickable on foot (not inside a building/prop collider or wedged in a slot).
// Extend `PICKUP_SPOTS` to cover other collectibles (E01/E10).
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { GOLDEN_ACORN_SPOTS } from './easterEggs';
import { heightAt } from './terrain';
import type { World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

const GNOME_RADIUS = 0.4;
const SLOT_RING = 0.8;
const PICKUP_SPOTS: ReadonlyArray<{ id: string; x: number; z: number }> = GOLDEN_ACORN_SPOTS;

describe('pickups are reachable on foot', () => {
  it('every golden acorn spot and a ring around it is outside every collider', async () => {
    installFakeDom();
    const { buildWorld } = await import('./world');
    const world: World = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
    const blocked = (x: number, z: number): string | null => {
      for (const b of world.boxes) {
        if (b.h < 0.5) continue;
        if (b.shape === 'round') {
          const cx = (b.minX + b.maxX) / 2;
          const cz = (b.minZ + b.maxZ) / 2;
          const r = (b.maxX - b.minX) / 2 + GNOME_RADIUS;
          if (Math.hypot(x - cx, z - cz) < r) return JSON.stringify(b);
        } else if (x > b.minX - GNOME_RADIUS && x < b.maxX + GNOME_RADIUS && z > b.minZ - GNOME_RADIUS && z < b.maxZ + GNOME_RADIUS) {
          return JSON.stringify(b);
        }
      }
      return null;
    };
    const bad: string[] = [];
    for (const s of PICKUP_SPOTS) {
      let why = blocked(s.x, s.z);
      for (let i = 0; i < 8 && !why; i++) {
        const a = (i / 8) * Math.PI * 2;
        why = blocked(s.x + Math.cos(a) * SLOT_RING, s.z + Math.sin(a) * SLOT_RING);
      }
      if (why) bad.push(`${s.id} (${s.x},${s.z}) ground ${heightAt(s.x, s.z).toFixed(2)} blocked by ${why}`);
    }
    expect(bad).toEqual([]);
  }, 60_000);
});
