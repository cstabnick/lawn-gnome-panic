// The waterworks plan: placement counts, boat spots on water, no boat overlaps, dock colliders reach water, and the weir
// sits on the ravine river outside the loch. Pure plan checks; the prefab meshes are not tested here.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VEHICLES } from './config';
import { installFakeDom } from './testing/fakeDom';
import { buildWaterworks, waterworksPlan } from './waterworks';
import { bedAt, heightAt, waterAt } from './terrain';
import { BODIES, bodyRadius, bridges, courseProfile } from './water';
import type { Box } from './types';

const plan = waterworksPlan();
const byPrefab = (id: string) => plan.works.filter((w) => w.prefab === id);

describe('waterworksPlan', () => {
  it('has the expected counts', () => {
    // Four arches on the old river. Low bridges (E03) where deck-to-bed is shallow: the canal and the four over the
    // Thymes in Pardonlin (E28).
    expect(byPrefab('arch-road-bridge')).toHaveLength(4);
    expect(byPrefab('canal-road-bridge')).toHaveLength(5);
    expect(byPrefab('road-bridge')).toHaveLength(0);
    expect(byPrefab('canal-lock-gate')).toHaveLength(2);
    expect(byPrefab('loch-weir')).toHaveLength(2);
    expect(byPrefab('wooden-dock')).toHaveLength(3);
    expect(byPrefab('wharf')).toHaveLength(2);
    expect(plan.boats).toHaveLength(7);
  });

  it('puts every boat on water deep enough to float it', () => {
    for (const b of plan.boats) {
      const hit = waterAt(b.x, b.z);
      expect(hit, `${b.kind} at (${b.x}, ${b.z})`).not.toBeNull();
      expect(hit!.depth).toBeGreaterThanOrEqual(VEHICLES[b.kind].draft! + 0.2);
    }
  });

  it('keeps boats apart', () => {
    for (let i = 0; i < plan.boats.length; i++) {
      for (let j = i + 1; j < plan.boats.length; j++) {
        const a = plan.boats[i], b = plan.boats[j];
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        expect(d, `${a.kind} vs ${b.kind}`).toBeGreaterThanOrEqual(VEHICLES[a.kind].radius + VEHICLES[b.kind].radius);
      }
    }
  });

  it('has each dock collider reaching water at its water end', () => {
    for (const w of byPrefab('wooden-dock')) {
      const box = w.solid![0];
      const ends = [box.minZ, box.maxZ].map((z) => waterAt((box.minX + box.maxX) / 2, z)?.depth ?? 0);
      expect(Math.max(...ends)).toBeGreaterThan(0.5);
    }
  });

  it('puts the weir on the ravine river, outside the loch', () => {
    const loch = BODIES.find((b) => b.id === 'water/loch-moss')!;
    const ravine = courseProfile('river-ravine')!;
    const w = byPrefab('loch-weir')[0];
    expect(bodyRadius(loch, w.x, w.z)).toBeGreaterThan(1);
    let best = Infinity;
    for (let k = 0; k < ravine.x.length; k++) {
      best = Math.min(best, Math.hypot(ravine.x[k] - w.x, ravine.z[k] - w.z));
    }
    // Each weir half sits about 3.6 m out from the river centre line, against its bank.
    expect(best).toBeLessThan(5);
  });

  it('leaves a boat pass of at least 4 m between the two weir halves', () => {
    const [a, b] = byPrefab('loch-weir');
    // Across the river: local +x of the weir is (cos yaw, -sin yaw).
    const across = (w: { x: number; z: number; yaw: number }) => w.x * Math.cos(w.yaw) - w.z * Math.sin(w.yaw);
    const halfA = 6 * a.scaleX!, halfB = 6 * b.scaleX!;
    const gap = Math.abs(across(a) - across(b)) - halfA - halfB;
    expect(gap).toBeGreaterThanOrEqual(4);
  });

  it('keeps every bridge above the bed, with its deck top at the span deck height', () => {
    const deckTop: Record<string, number> = { 'arch-road-bridge': 6.5, 'canal-road-bridge': 3.0 };
    const spans = bridges();
    expect(spans.length).toBeGreaterThan(0);
    for (const b of spans) {
      const w = plan.works.find((p) => p.prefab in deckTop && p.x === b.x && p.z === b.z);
      expect(w, `bridge at (${b.x}, ${b.z})`).toBeDefined();
      expect(w!.y, `${b.id} base vs bed`).toBeGreaterThanOrEqual(bedAt(b.x, b.z) - 0.1);
      expect(w!.y + deckTop[w!.prefab] * (w!.scaleY ?? 1), `${b.id} deck`).toBeCloseTo(b.deck, 1);
    }
  });

  it('builds without throwing and returns the boats', () => {
    const restore = installFakeDom();
    try {
      const boxes: Box[] = [];
      const scene = new THREE.Scene();
      const ww = buildWaterworks(scene, boxes);
      expect(ww.boats).toHaveLength(7);
      ww.update(0.1);
      expect(heightAt(0, 0)).toBeTypeOf('number');
    } finally {
      restore();
    }
  });
});
