// The hunter camps stand on dry open ground, off the roads, outside reserved sites and clear of colliders.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { CAMPS } from './camps';
import { MAX_CAMPS } from './types';
import { ITEMS } from '../inventory';
import { reservedRects } from '../sites';
import { roadDistance } from '../critters';
import { waterAt } from '../terrain';
import { regionAt } from '../levels';
import type { World } from '../types';

vi.mock('../audio', () => ({ play: () => undefined }));

describe('hunter camps', () => {
  it('data is well formed', () => {
    expect(CAMPS.length).toBeGreaterThan(0);
    expect(CAMPS.length).toBeLessThanOrEqual(MAX_CAMPS);
    expect(new Set(CAMPS.map((c) => c.id)).size).toBe(CAMPS.length);
    const ids = new Set(ITEMS.map((i) => i.id));
    for (const c of CAMPS) if (c.loot.item) expect(ids.has(c.loot.item), c.id).toBe(true);
    for (const a of CAMPS) for (const b of CAMPS) {
      if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id}/${b.id}`).toBeGreaterThanOrEqual(120);
    }
  });

  it('every camp is on dry open ground off roads, sites and colliders', async () => {
    installFakeDom();
    const { buildWorld } = await import('../world');
    const world: World = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
    const rects = reservedRects();
    const bad: string[] = [];
    for (const c of CAMPS) {
      if (Math.abs(c.x) > 1700 || Math.abs(c.z) > 1700) bad.push(`${c.id} outside the fence`);
      const r = regionAt(c.x, c.z);
      if (r === 'the-unmown' || r === 'pardonlin' || r === 'turfton') bad.push(`${c.id} in ${r}`);
      if (waterAt(c.x, c.z)) bad.push(`${c.id} in water`);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        if (waterAt(c.x + Math.sin(a) * 6, c.z + Math.cos(a) * 6)) { bad.push(`${c.id} water within 6 m`); break; }
      }
      if (roadDistance(c.x, c.z) < 20) bad.push(`${c.id} on a road`);
      for (const q of rects) {
        if (c.x >= q.minX - 10 && c.x <= q.maxX + 10 && c.z >= q.minZ - 10 && c.z <= q.maxZ + 10) bad.push(`${c.id} in ${q.id}`);
      }
      // The camps' own colliders (added by buildCountryside) sit at the centre: ignore boxes centred within 7 m.
      for (const b of world.boxes) {
        const dx = Math.max(b.minX - c.x, 0, c.x - b.maxX), dz = Math.max(b.minZ - c.z, 0, c.z - b.maxZ);
        if (Math.hypot(dx, dz) >= 6) continue;
        const mx = (b.minX + b.maxX) / 2, mz = (b.minZ + b.maxZ) / 2;
        if (Math.hypot(mx - c.x, mz - c.z) < 7) continue;
        bad.push(`${c.id} near a collider at ${mx.toFixed(0)},${mz.toFixed(0)}`);
      }
    }
    expect(bad).toEqual([]);
  }, 120000);
});
