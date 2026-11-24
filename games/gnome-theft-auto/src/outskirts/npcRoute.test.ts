import { describe, expect, it } from 'vitest';
import { LANES, NPC_STATIONS, type Station } from './town';
import { laneOf, routeBetween } from './npcRoute';

type Pt = [number, number];
const key = (p: Pt) => `${p[0]},${p[1]}`;

function ownSegments(s: Station): [Pt, Pt][] {
  const pts: Pt[] = [[s.x, s.z], ...s.path];
  const out: [Pt, Pt][] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push([pts[i], pts[i + 1]]);
  return out;
}

function isOwnSegment(a: Pt, b: Pt, stations: Station[]): boolean {
  for (const s of stations) {
    for (const [p, q] of ownSegments(s)) {
      if ((key(p) === key(a) && key(q) === key(b)) || (key(p) === key(b) && key(q) === key(a))) return true;
    }
  }
  return false;
}

function inSameLane(a: Pt, b: Pt): boolean {
  for (const r of [LANES.main, LANES.cross]) {
    const inside = (p: Pt) => p[0] >= r.minX && p[0] <= r.maxX && p[1] >= r.minZ && p[1] <= r.maxZ;
    if (inside(a) && inside(b)) return true;
  }
  return false;
}

describe('laneOf', () => {
  it('finds the main street, the cross street and nothing else', () => {
    expect(laneOf(655, 100)).toBe('main');
    expect(laneOf(620, 125)).toBe('cross');
    expect(laneOf(655, 125)).toBe('main'); // the hub is in both: main wins
    expect(laneOf(600, 40)).toBeNull();
    expect(laneOf(0, 0)).toBeNull();
  });
});

describe('routeBetween', () => {
  it('a station to itself is its own point', () => {
    const s: Station = { x: 648.5, z: 80, yaw: 0, idle: 'sweep', path: [] };
    expect(routeBetween(s, s)).toEqual([[648.5, 80]]);
    const twin: Station = { ...s };
    expect(routeBetween(s, twin)).toEqual([[648.5, 80]]);
  });

  for (const npc of NPC_STATIONS) {
    it(`${npc.id}: every pair of stations routes along paths or inside a lane`, () => {
      const stations = npc.stations;
      for (let i = 0; i < stations.length; i++) {
        for (let j = 0; j < stations.length; j++) {
          const route = routeBetween(stations[i], stations[j]);
          expect(route[0]).toEqual([stations[i].x, stations[i].z]);
          expect(route[route.length - 1]).toEqual([stations[j].x, stations[j].z]);
          for (let k = 0; k + 1 < route.length; k++) {
            const a = route[k];
            const b = route[k + 1];
            expect(key(a)).not.toBe(key(b));
            const ok = isOwnSegment(a, b, [stations[i], stations[j]]) || inSameLane(a, b);
            expect(ok, `${npc.id} ${i}->${j} segment ${key(a)} -> ${key(b)}`).toBe(true);
          }
        }
      }
    });
  }
});
