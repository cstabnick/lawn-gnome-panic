import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { homeOf } from '../homes/data';
import { trails } from '../levels';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { WIND_FARM } from './types';
import { buildWindFarm, installWindFarm, rotorCount } from './windFarm';

describe('Pinwheel Ridge', () => {
  beforeAll(() => { installFakeDom(); });

  it('builds ten rotors that turn', () => {
    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    buildWindFarm(scene, boxes);
    expect(rotorCount()).toBe(10);
    const rotors: THREE.Object3D[] = [];
    scene.traverse((o) => { if (o.name === 'pinwheel-rotor') rotors.push(o); });
    expect(rotors).toHaveLength(10);
    const part = installWindFarm({ player: { x: 850, z: -1220 }, scene } as never);
    part.update?.(0.5, 10);
    const a = rotors[0].rotation.z;
    part.update?.(0.5, 11);
    expect(rotors[0].rotation.z).not.toBe(a);
  });

  it('keeps colliders inside the site and off the track', () => {
    const boxes: Box[] = [];
    buildWindFarm(new THREE.Scene(), boxes);
    expect(boxes.length).toBeGreaterThanOrEqual(10);
    const s = WIND_FARM.site;
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(s.minX - 20);
      expect(b.maxX).toBeLessThanOrEqual(s.maxX + 20);
      expect(b.minZ).toBeGreaterThanOrEqual(s.minZ - 20);
      expect(b.maxZ).toBeLessThanOrEqual(s.maxZ + 20);
    }
    const track = trails().filter((t) => t.id.startsWith('trail/pinwheel-track'));
    expect(track.length).toBeGreaterThan(0);
    for (const t of track) {
      for (let i = 1; i < t.points.length; i++) {
        const [a, b] = [t.points[i - 1], t.points[i]];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let d = 0; d <= len; d += 3) {
          const x = a[0] + ((b[0] - a[0]) * d) / len, z = a[1] + ((b[1] - a[1]) * d) / len;
          const hit = boxes.find((c) => x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ);
          expect(hit, `collider on the track at ${x.toFixed(0)},${z.toFixed(0)}`).toBeUndefined();
        }
      }
    }
  });

  it('gives Ragwort a door', () => {
    buildWindFarm(new THREE.Scene(), []);
    expect(homeOf('ragwort')!.door).not.toBeNull();
  });
});
