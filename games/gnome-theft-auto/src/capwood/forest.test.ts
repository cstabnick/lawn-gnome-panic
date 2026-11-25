// Capwood's plan and builder: everything inside the site, clear of the Capwood Run and the fixed places, stems that do
// not overlap, enough story, and createCapwoodForest builds into a scene and adds colliders.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import type { World } from '../types';
import { nearTrack } from '../raceTrack/tracks';
import { CAPWOOD_PLAN, FOREST_RECT, HAND_PLACED, HUT_COLLIDER, KEEP, SPACING_R, WARDEN_DOOR } from './forestPlan';
import { CAP_COUNT_SPOTS, GREAT_RING, WARDEN_HUT } from './spots';

installFakeDom();
const { createCapwoodForest } = await import('./forest');

const props = CAPWOOD_PLAN.props;
const free = props.filter((p) => !HAND_PLACED.has(p));
const stemsOf = (list: typeof props) => list.filter((p) => SPACING_R[p.id] !== undefined);

describe('Capwood plan', () => {
  it('has the counts the place needs', () => {
    const n = (id: string) => props.filter((p) => p.id === id).length;
    expect(n('capwood-toadstool-tall')).toBeGreaterThanOrEqual(20);
    expect(n('capwood-toadstool-squat')).toBeGreaterThanOrEqual(30);
    expect(n('capwood-toadstool-cluster')).toBeGreaterThanOrEqual(40);
    expect(n('capwood-puffball')).toBeGreaterThanOrEqual(12);
    expect(CAPWOOD_PLAN.vignettes.length).toBeGreaterThanOrEqual(4);
    expect(CAPWOOD_PLAN.signs.length).toBeGreaterThanOrEqual(5);
    expect(CAPWOOD_PLAN.residents.length).toBeGreaterThanOrEqual(2);
  });

  it('every prop and sign is inside the site rectangle', () => {
    for (const p of [...props, ...CAPWOOD_PLAN.signs]) {
      expect(p.x, `${p.x},${p.z}`).toBeGreaterThanOrEqual(FOREST_RECT.minX);
      expect(p.x).toBeLessThanOrEqual(FOREST_RECT.maxX);
      expect(p.z).toBeGreaterThanOrEqual(FOREST_RECT.minZ);
      expect(p.z).toBeLessThanOrEqual(FOREST_RECT.maxZ);
    }
  });

  it('nothing stands on the Capwood Run', () => {
    for (const p of [...props, ...CAPWOOD_PLAN.signs]) expect(nearTrack(p.x, p.z, 3), `${p.x},${p.z}`).toBe(false);
  });

  it('the scattered forest keeps out of the hut, the ring and the cap-count spots', () => {
    for (const p of free) {
      expect(Math.hypot(p.x - WARDEN_HUT.x, p.z - WARDEN_HUT.z), `${p.id} ${p.x},${p.z} hut`).toBeGreaterThanOrEqual(KEEP.hut);
      expect(Math.hypot(p.x - GREAT_RING.x, p.z - GREAT_RING.z), `${p.id} ring`).toBeGreaterThanOrEqual(GREAT_RING.r + KEEP.ringExtra);
      for (const s of CAP_COUNT_SPOTS) expect(Math.hypot(p.x - s.x, p.z - s.z), `${p.id} ${s.label}`).toBeGreaterThanOrEqual(KEEP.spot);
    }
  });

  it('every cap-count spot has a cap and a ticket-flag beside it', () => {
    for (const s of CAP_COUNT_SPOTS) {
      const near = props.filter((p) => Math.hypot(p.x - s.x, p.z - s.z) < 3);
      expect(near.some((p) => p.id === 'capwood-toadstool-tall' || p.id === 'capwood-toadstool-squat'), s.label).toBe(true);
      expect(near.some((p) => p.id === 'capwood-stage-flag'), s.label).toBe(true);
    }
  });

  it('no two stems overlap', () => {
    const stems = stemsOf(props);
    for (let i = 0; i < stems.length; i++) {
      for (let j = i + 1; j < stems.length; j++) {
        const a = stems[i], b = stems[j];
        const ra = SPACING_R[a.id] * (a.id === 'capwood-toadstool-tall' ? 1 : a.scale ?? 1);
        const rb = SPACING_R[b.id] * (b.id === 'capwood-toadstool-tall' ? 1 : b.scale ?? 1);
        expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id}@${a.x.toFixed(0)},${a.z.toFixed(0)} / ${b.id}@${b.x.toFixed(0)},${b.z.toFixed(0)}`)
          .toBeGreaterThanOrEqual(ra + rb + 1 - 1e-6);
      }
    }
  });

  it('nothing solid within 3 m of the Warden spot', () => {
    for (const p of props) {
      if (!p.solid) continue;
      const r = 'r' in p.solid ? p.solid.r : Math.hypot(p.solid.w, p.solid.d) / 2;
      expect(Math.hypot(p.x - WARDEN_DOOR.x, p.z - WARDEN_DOOR.z) - r).toBeGreaterThanOrEqual(3);
    }
    expect(Math.hypot(HUT_COLLIDER.x - WARDEN_DOOR.x, HUT_COLLIDER.z - WARDEN_DOOR.z) - HUT_COLLIDER.r).toBeGreaterThanOrEqual(3);
  });

  it('vignettes tell a story and sit among their props', () => {
    for (const v of CAPWOOD_PLAN.vignettes) {
      expect(v.story.length).toBeGreaterThan(40);
      expect(props.some((p) => Math.hypot(p.x - v.x, p.z - v.z) < 8), v.id).toBe(true);
    }
  });
});

describe('createCapwoodForest', () => {
  const scene = new THREE.Scene();
  const world = { boxes: [] } as unknown as World;
  const toasts: string[] = [];
  const unlocked: string[] = [];
  const area = createCapwoodForest(scene, world, {
    toast: (t) => { toasts.push(t); }, unlock: (id) => { unlocked.push(id); }, increment: () => undefined,
  });

  it('builds into the scene and adds colliders', () => {
    expect(scene.children.length).toBeGreaterThan(0);
    expect(world.boxes.length).toBeGreaterThan(40);
    expect(world.boxes.some((b) => b.shape === 'round')).toBe(true);
  });

  it('has one blip called Capwood', () => {
    expect(area.blips().map((b) => b.label)).toEqual(['Capwood']);
  });

  it('unlocks the toadstool trail at the Great Ring at night, once', () => {
    area.update(0.1, GREAT_RING.x, GREAT_RING.z, 0.2);
    expect(unlocked).toEqual([]);
    area.update(0.1, GREAT_RING.x, GREAT_RING.z, 0.9);
    area.update(0.1, GREAT_RING.x, GREAT_RING.z, 0.9);
    expect(unlocked).toEqual(['gta-toadstool-trail']);
    expect(toasts.length).toBe(1);
  });
});
