// The Bottom Garden's dressing (E32 B6): the group exists, the potting shed roof is a walkable rooftop at tee height, the
// giant plants are soft and inside the garden but off the fairways, and nothing solid stands in play (except the shed,
// which is hole 7's tee, and the birdbath, which stands in hole 6's pond).
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import type { BottomGarden } from './bottomGarden';
import { BOTTOM_GARDEN, inPlay, inYard, POTTING_SHED } from './types';

let scene: THREE.Scene;
let garden: BottomGarden;
let heightAt: (x: number, z: number) => number;
let roofAt: (x: number, z: number, maxY: number) => number | null;

beforeAll(async () => {
  installFakeDom();
  const { buildBottomGarden } = await import('./bottomGarden');
  heightAt = (await import('../terrain')).heightAt;
  roofAt = (await import('../interiors/rooftops')).rooftopSurfaceBelow;
  scene = new THREE.Scene();
  garden = buildBottomGarden(scene);
}, 60_000);

const isShed = (b: Box): boolean => b.minX === POTTING_SHED.x - POTTING_SHED.w / 2 && b.maxX === POTTING_SHED.x + POTTING_SHED.w / 2;
const isBirdbath = (b: Box): boolean => b.shape === 'round';

describe('Bottom Garden', () => {
  it('builds one named group', () => {
    const g = scene.getObjectByName('hedgeworth-bottom-garden');
    expect(g).toBeDefined();
    expect(g!.children.length).toBeGreaterThan(5);
  });

  it('registers the shed roof about 2.6 m over the ground, walkable', () => {
    const y = roofAt(POTTING_SHED.x, POTTING_SHED.z, 20);
    expect(y).not.toBeNull();
    expect(y! - heightAt(POTTING_SHED.x, POTTING_SHED.z)).toBeCloseTo(POTTING_SHED.roofY, 1);
  });

  it('keeps the giant plants soft, inside the garden and off the fairways', () => {
    expect(garden.soft.length).toBeGreaterThanOrEqual(8);
    for (const s of garden.soft) {
      expect(s.x, 'x').toBeGreaterThan(BOTTOM_GARDEN.minX);
      expect(s.x, 'x').toBeLessThan(BOTTOM_GARDEN.maxX);
      expect(s.z, 'z').toBeGreaterThan(BOTTOM_GARDEN.minZ);
      expect(s.z, 'z').toBeLessThan(BOTTOM_GARDEN.maxZ);
      expect(inPlay(s.x, s.z), `${s.x},${s.z} in play`).toBe(false);
    }
  });

  it('has a shed collider reaching the roof and a round birdbath pedestal', () => {
    const shed = garden.boxes.find(isShed);
    expect(shed).toBeDefined();
    expect(shed!.h).toBeGreaterThan(heightAt(POTTING_SHED.x, POTTING_SHED.z) + POTTING_SHED.roofY - 0.1);
    expect(garden.boxes.some(isBirdbath)).toBe(true);
  });

  it('keeps every box inside the yard and every other box out of play', () => {
    for (const b of garden.boxes) {
      const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      expect(inYard(cx, cz), `box ${cx},${cz} in yard`).toBe(true);
      if (isShed(b) || isBirdbath(b)) continue;
      expect(inPlay(cx, cz, 0.5), `box ${cx.toFixed(1)},${cz.toFixed(1)} in play`).toBe(false);
    }
  });

  it('update() runs without throwing', () => {
    expect(() => { garden.update(0.016, 1.2); garden.update(0.016, 2.4); }).not.toThrow();
  });
});
