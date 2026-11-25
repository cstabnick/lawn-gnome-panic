// E26: every street-race meet stands on open ground: nobody on a road, in a building or in the water, the area clear of
// the roads, and the flag-dropper beside tracks[0]'s grid.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { nearestRoad, roadSegments, type RoadSeg } from '../testing/roadSegments';
import { trackById } from '../raceTrack/tracks';
import { waterAt } from '../terrain';
import type { World } from '../types';
import { MEETS, meetOfTrack } from './meets';
import { MEET_IDS, type MeetSpot } from './types';

let world: World;
let segs: RoadSeg[] = [];

/** Pardonlin's roads are 7 wide; the road-graph segments do not carry a width, so narrow them there. */
const narrow = (s: RoadSeg): RoadSeg => (s.ax < -1300 && s.half === 5 ? { ...s, half: 3.5 } : s);

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('../world');
  world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  segs = roadSegments(world).map(narrow);
}, 120000);

const inBox = (x: number, z: number, m: number): boolean => world.boxes.some((b) => x > b.minX - m && x < b.maxX + m && z > b.minZ - m && z < b.maxZ + m);

describe('street meets', () => {
  for (const id of MEET_IDS) {
    describe(id, () => {
      const m = MEETS[id];
      const spots = (): [string, MeetSpot][] => [
        ['organiser', m.organiser], ['bookie', m.bookie], ['flagger', m.flagger],
        ...m.crowd.map((s, i): [string, MeetSpot] => [`crowd ${i}`, s]),
        ...m.residents.map((s, i): [string, MeetSpot] => [`resident ${i}`, s]),
        ...m.vignettes.map((s, i): [string, MeetSpot] => [`vignette ${i}`, s]),
        ...m.signs.map((s, i): [string, MeetSpot] => [`sign ${i}`, s]),
      ];

      it('has the people and props the contract asks for', () => {
        expect(m.id).toBe(id);
        expect(m.crowd.length).toBeGreaterThanOrEqual(6);
        expect(m.residents).toHaveLength(2);
        expect(m.vignettes.length).toBeGreaterThanOrEqual(3);
        expect(m.signs.length).toBeGreaterThanOrEqual(4);
        expect(m.area.hw).toBeGreaterThanOrEqual(14);
        expect(m.area.hw).toBeLessThanOrEqual(30);
        const d = Math.hypot(m.organiser.x - m.bookie.x, m.organiser.z - m.bookie.z);
        expect(d).toBeGreaterThanOrEqual(3);
        expect(d).toBeLessThanOrEqual(6);
        for (const t of m.tracks) expect(meetOfTrack(t)?.id).toBe(id);
      });

      it('keeps every spot off the roads, out of buildings and out of the water', () => {
        for (const [name, s] of spots()) {
          expect(inBox(s.x, s.z, 0.6), `${id} ${name} (${s.x}, ${s.z}) is inside a building`).toBe(false);
          const r = nearestRoad(segs, s.x, s.z);
          expect(r.over, `${id} ${name} (${s.x}, ${s.z}) is ${r.over.toFixed(1)} m past the road edge`).toBeGreaterThan(0.5);
          const w = waterAt(s.x, s.z);
          expect(!w || w.depth < 0.05, `${id} ${name} (${s.x}, ${s.z}) is in water`).toBe(true);
        }
      });

      it('keeps the vignettes and the dressing area clear', () => {
        for (const v of m.vignettes) {
          for (let a = 0; a < 16; a++) {
            const x = v.x + Math.cos(a * 0.3927) * 3.5, z = v.z + Math.sin(a * 0.3927) * 3.5;
            expect(inBox(x, z, 0), `${id} vignette (${v.x}, ${v.z}) has a building within 3.5 m`).toBe(false);
          }
        }
        const { x, z, hw, hd } = m.area;
        for (let px = x - hw; px <= x + hw; px += 2) {
          for (let pz = z - hd; pz <= z + hd; pz += 2) {
            expect(nearestRoad(segs, px, pz).over, `${id} area point (${px}, ${pz}) is too close to a road`).toBeGreaterThanOrEqual(2);
          }
        }
      });

      it('puts the people inside the area and the flagger beside the first grid', () => {
        const { x, z, hw, hd } = m.area;
        for (const [name, s] of spots()) {
          if (name === 'flagger' || name.startsWith('crowd')) continue;
          expect(Math.abs(s.x - x), `${id} ${name} outside the area`).toBeLessThanOrEqual(hw);
          expect(Math.abs(s.z - z), `${id} ${name} outside the area`).toBeLessThanOrEqual(hd);
        }
        const g = trackById(m.tracks[0]).gridSlot(0);
        expect(Math.hypot(m.flagger.x - g.x, m.flagger.z - g.z)).toBeLessThanOrEqual(60);
      });
    });
  }
});
