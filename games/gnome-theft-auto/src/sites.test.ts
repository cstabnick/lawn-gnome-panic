// The site registry (E01): every slot is valid, on the map, in its region, off the roads and clear of the other slots.
import { describe, expect, it } from 'vitest';
import { CITY_HALF, HIGHWAYS, ROAD_LINES, ROAD_WIDTH, WORLD_HALF } from './config';
import { LAYOUT, markersOf, regionAt, waterBodies } from './levels';
import { POS_BOUND } from './net';
import {
  INTERIOR_MIN_X, MAP_EXTENT, OFF_MAP, SITES, SITE_IDS, anchorOf, inSite, isOffMap, reservedRects, siteById, siteRect, sitesByEpic,
  type Site, type SiteRect,
} from './sites';

const rectOf = (s: Site): SiteRect => ({ minX: s.x - s.hw, maxX: s.x + s.hw, minZ: s.z - s.hd, maxZ: s.z + s.hd });
const overlap = (a: SiteRect, b: SiteRect, gap = 0): boolean =>
  a.minX < b.maxX + gap && a.maxX > b.minX - gap && a.minZ < b.maxZ + gap && a.maxZ > b.minZ - gap;
const inside = (a: SiteRect, b: SiteRect): boolean => a.minX >= b.minX && a.maxX <= b.maxX && a.minZ >= b.minZ && a.maxZ <= b.maxZ;
/** Distance from a point to a rectangle (0 inside). */
const rectDist = (r: SiteRect, x: number, z: number): number =>
  Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
/** Smallest distance from a polyline's centre line to the rectangle, sampled every metre. */
function polyDist(r: SiteRect, pts: readonly (readonly [number, number])[]): number {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az)));
    for (let i = 0; i <= n; i++) best = Math.min(best, rectDist(r, ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n));
  }
  return best;
}

describe('site registry', () => {
  it('SITE_IDS and the slot markers name the same sites, once each', () => {
    const ids = markersOf('slot').map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...SITE_IDS].sort());
    expect(SITES.length).toBe(SITE_IDS.length);
  });

  it('every site is on the map, inside the fence, and in the region whose document holds it', () => {
    for (const s of SITES) {
      expect(s.hw > 0 && s.hd > 0, s.id).toBe(true);
      const r = rectOf(s);
      expect(Math.max(Math.abs(r.minX), Math.abs(r.maxX), Math.abs(r.minZ), Math.abs(r.maxZ)), s.id).toBeLessThanOrEqual(LAYOUT.fenceEdge);
      expect(regionAt(s.x, s.z), s.id).toBe(s.region);
      expect(/^E\d\d$/.test(s.epic), `${s.id} epic ${s.epic}`).toBe(true);
      for (const a of Object.values(s.anchors)) expect(Number.isFinite(a.x) && Number.isFinite(a.z), s.id).toBe(true);
    }
  });

  it('sites do not overlap, except a child inside its parent', () => {
    for (const s of SITES) if (s.parent) expect(inside(rectOf(s), rectOf(siteById(s.parent))), `${s.id} in ${s.parent}`).toBe(true);
    for (let i = 0; i < SITES.length; i++) {
      for (let j = i + 1; j < SITES.length; j++) {
        const a = SITES[i], b = SITES[j];
        if (a.parent === b.id || b.parent === a.id) continue;
        if (a.parent && a.parent === b.parent) {
          expect(overlap(rectOf(a), rectOf(b)), `${a.id} / ${b.id}`).toBe(false);
          continue;
        }
        expect(overlap(rectOf(a), rectOf(b)), `${a.id} / ${b.id}`).toBe(false);
      }
    }
  });

  it('no site covers a highway or a city street (except the tunnel block), a reserve marker or a still-water body', () => {
    const clear = ROAD_WIDTH / 2 + 2;
    for (const s of SITES) {
      const r = rectOf(s);
      if (!s.overRoad) {
        for (const h of HIGHWAYS) expect(polyDist(r, h.points), `${s.id} x ${h.id}`).toBeGreaterThan(clear);
        if (Math.abs(s.x) <= CITY_HALF && Math.abs(s.z) <= CITY_HALF) {
          for (const v of ROAD_LINES) {
            expect(r.maxX < v - clear || r.minX > v + clear, `${s.id} x street x=${v}`).toBe(true);
            expect(r.maxZ < v - clear || r.minZ > v + clear, `${s.id} x street z=${v}`).toBe(true);
          }
        }
      }
      for (const m of reservedRects().filter((q) => q.source === 'reserve')) expect(overlap(r, m), `${s.id} x ${m.id}`).toBe(false);
      // A water site (E11's the Saltwater) holds its own sea, and so do the sites inside it (the Bathtub Queen).
      const wet = s.kind === 'water' || (s.parent !== undefined && SITES.find((q) => q.id === s.parent)?.kind === 'water');
      if (!wet) for (const w of waterBodies()) expect(overlap(r, w), `${s.id} x ${w.id}`).toBe(false);
    }
  });

  it('every epic that was promised ground has it', () => {
    const want: Record<string, string[]> = {
      E08: ['car-dealer', 'boat-dealer', 'aircraft-dealer'],
      E10: ['double-pot', 'saucer-court', 'home-01', 'home-12'],
      E11: ['ocean', 'beach', 'boardwalk', 'ferris-wheel', 'pirate-ship'],
      E12: ['ski-hill', 'ice-lake'],
      E13: ['campus', 'observatory-mound', 'runway-2', 'wind-farm'],
      E14: ['dirt-track', 'rally-route', 'toadstool-forest'],
      E15: ['golf-yard'],
      E16: ['vineyard', 'mansion', 'farm-plot', 'construction-1', 'construction-2', 'construction-3'],
      E17: ['skyway-under', 'cult-camp', 'mole-entrance'],
      E19: ['basketball-court', 'skate-park'],
      E30: ['pl-landmark', 'pl-grand-place', 'pl-cafe-row', 'pl-radio-station', 'pl-market', 'pl-jardin', 'pl-harbour'],
      E31: ['unmown-ranger-station', 'unmown-wetland', 'unmown-meadow', 'unmown-hide-1', 'rootwell-field-station'],
    };
    for (const [epic, ids] of Object.entries(want)) {
      const have = sitesByEpic(epic).map((s) => s.id);
      for (const id of ids) expect(have, epic).toContain(id);
    }
    expect(sitesByEpic('E10').filter((s) => s.kind === 'home').length).toBe(12);
  });

  it('looks up rectangles and anchors in world coordinates', () => {
    const c = siteById('campus');
    expect(siteRect('campus')).toEqual({ minX: c.x - c.hw, maxX: c.x + c.hw, minZ: c.z - c.hd, maxZ: c.z + c.hd });
    expect(inSite('campus', c.x, c.z)).toBe(true);
    expect(inSite('campus', c.x + c.hw + 1, c.z)).toBe(false);
    expect(anchorOf('golf-yard', 'breach')).toEqual({ x: -895, z: 640 });
    expect(() => anchorOf('golf-yard', 'nope')).toThrow();
    expect(siteById('pirate-ship').parent).toBe('ocean');
    expect(siteById('ferris-wheel').label).toBe('the Spokewheel');
    for (const s of SITES) expect(s.label.length, s.id).toBeGreaterThan(0);
  });

  it('flat-only reserved rectangles leave out natural slots', () => {
    const flat = new Set(reservedRects({ flatOnly: true }).map((r) => r.id));
    expect(flat.has('campus')).toBe(true);
    expect(flat.has('ski-hill')).toBe(false);
    expect(flat.has('reserve/speedway')).toBe(true);
  });
});

describe('map extent and off-map space', () => {
  it('the map is 3600 square and the net believes every point of it', () => {
    expect(WORLD_HALF).toBe(1800);
    expect(MAP_EXTENT).toBe(WORLD_HALF);
    expect(POS_BOUND).toBeGreaterThan(WORLD_HALF);
  });

  it('off-map rooms are off the map', () => {
    for (const o of OFF_MAP) expect(isOffMap(o.x, o.z), o.id).toBe(true);
    expect(isOffMap(INTERIOR_MIN_X, 0)).toBe(true);
    expect(isOffMap(1300, -1300)).toBe(false);
  });
});
