// E26: every street-race meet builds from its data: the scene gets children, the colliders go into world.boxes, and no
// collider swallows a person's spot.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { Box, World } from '../types';
import { MEET_CAST } from './cast';
import { MEETS } from './meets';
import { buildMeet } from './meetScene';
import { MEET_IDS, type MeetSpot } from './types';

beforeAll(() => {
  installFakeDom();
});

const noop = () => undefined;
const deps = { toast: noop, unlock: noop, increment: noop };

const insideBox = (b: Box, x: number, z: number): boolean => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;

describe('street meet scenes', () => {
  for (const id of MEET_IDS) {
    describe(id, () => {
      const meet = MEETS[id];
      const cast = MEET_CAST[id];

      it('builds the scene, adds colliders and reports its blip', () => {
        const scene = new THREE.Scene();
        const world = { boxes: [] as Box[] } as unknown as World;
        const area = buildMeet(scene, world, meet, cast, deps);
        expect(scene.children.length).toBeGreaterThan(0);
        expect(world.boxes.length).toBeGreaterThan(0);
        const blips = area.blips();
        expect(blips).toHaveLength(1);
        expect(blips[0]).toMatchObject({ x: meet.centre.x, z: meet.centre.z, label: meet.name });
      });

      it('keeps every collider clear of the people standing at the meet', () => {
        const scene = new THREE.Scene();
        const world = { boxes: [] as Box[] } as unknown as World;
        buildMeet(scene, world, meet, cast, deps);
        const spots: [string, MeetSpot][] = [
          ['organiser', meet.organiser], ['bookie', meet.bookie], ['flagger', meet.flagger],
          ...meet.residents.map((s, i): [string, MeetSpot] => [`resident ${i}`, s]),
          ...meet.crowd.map((s, i): [string, MeetSpot] => [`crowd ${i}`, s]),
        ];
        for (const b of world.boxes) {
          for (const [name, s] of spots) {
            expect(insideBox(b, s.x, s.z), `${id}: collider covers ${name} at (${s.x}, ${s.z})`).toBe(false);
          }
        }
      });

      it('updates without throwing by day and after dark', () => {
        const scene = new THREE.Scene();
        const world = { boxes: [] as Box[] } as unknown as World;
        const area = buildMeet(scene, world, meet, cast, deps);
        expect(() => {
          area.update(0.016, meet.centre.x, meet.centre.z, 0);
          area.update(3, meet.centre.x, meet.centre.z, 1);
        }).not.toThrow();
      });
    });
  }
});
