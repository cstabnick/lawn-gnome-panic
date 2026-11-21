import { describe, expect, it } from 'vitest';
import { FURNITURE, TOWN_KINDS } from './config';
import { PEOPLE } from './people';
import { townGate, townKindOf, townLot, townLotProblems, townSpot, townSpotIds, TOWN_H, TOWN_W } from './town';
import { findPath, isWalkable, itemTiles } from './world';

describe('the town level', () => {
  it('places every prop from the level document without overlap', () => {
    expect(townLotProblems()).toEqual([]);
  });

  it('is the size its document says', () => {
    const lot = townLot();
    expect(lot.w).toBe(TOWN_W);
    expect(lot.h).toBe(TOWN_H);
  });

  it('keeps every item inside the lot', () => {
    const lot = townLot();
    for (const item of lot.items) {
      for (const t of itemTiles(item)) {
        expect(t.tx).toBeGreaterThanOrEqual(0);
        expect(t.ty).toBeGreaterThanOrEqual(0);
        expect(t.tx).toBeLessThan(TOWN_W);
        expect(t.ty).toBeLessThan(TOWN_H);
      }
    }
  });

  it('maps every prefab in the document to a town kind', () => {
    for (const k of TOWN_KINDS) expect(FURNITURE[k].room).toBe('town');
    expect(townKindOf('city-building')).toBe('spore-sprout');
    expect(townKindOf('no-such-prefab')).toBeNull();
  });

  it('has a spot for every routine block and every home', () => {
    const ids = new Set(townSpotIds());
    for (const p of PEOPLE) {
      expect(ids.has(p.home)).toBe(true);
      for (const r of p.routine) expect(ids.has(r.spot)).toBe(true);
    }
  });

  it('reaches every spot from the gate on foot', () => {
    const lot = townLot();
    const gate = townGate();
    expect(isWalkable(lot, gate.tx, gate.ty)).toBe(true);
    for (const id of townSpotIds()) {
      const t = townSpot(id);
      expect(isWalkable(lot, t.tx, t.ty), `spot ${id} is walkable`).toBe(true);
      expect(findPath(lot, gate, t), `a way to ${id}`).not.toBeNull();
    }
  });
});
