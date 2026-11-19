// The shipped walk bake: it matches the terrain it was made from, its tiles are the outdoor zones, and the game installs it.
import { describe, expect, it } from 'vitest';
import { WALK_CELL, mulberry32 } from '@lawn/level';
import { computeBakeHash, walkTileSpecs } from './bakeWalk';
import { OBJECTS, ZONES } from './content';
import { checkCondition } from './quests';
import { terrain } from './terrain';
import { createTerrain } from './terrainCore';
import { BAKED_WALK_HASH, loadWalkGrid } from './walkBake';
import { loadWorldDeltas } from './worldDeltas';
import { loadWorldPaint } from './worldPaint';

const input = { zones: ZONES, objects: OBJECTS, checkCondition };

/** A fresh analytic terrain, with the same brush edits and surface paint the bake had (none today). */
function fresh(zones = ZONES) {
  const t = createTerrain({ ...input, zones });
  const d = loadWorldDeltas();
  if (d) t.setDeltas(d);
  const p = loadWorldPaint();
  if (p) t.setPaint(p);
  return t;
}

describe('walk bake', () => {
  it('the shipped hash matches the terrain the game would bake now', () => {
    expect(BAKED_WALK_HASH).toBe(computeBakeHash(fresh(), ZONES));
  });

  it('its tiles are the outdoor zones', () => {
    const grid = loadWalkGrid();
    expect(grid).not.toBeNull();
    expect([...grid!.tileIds].sort()).toEqual(walkTileSpecs(ZONES).map((s) => s.id).sort());
  });

  it('agrees with terrain.staticSolidAt at cell centres', () => {
    const grid = loadWalkGrid()!;
    const t = fresh();
    const specs = walkTileSpecs(ZONES);
    const rng = mulberry32(7);
    for (let i = 0; i < 20000; i++) {
      const { rect } = specs[Math.floor(rng() * specs.length)];
      const x = (Math.floor((rect.minX + rng() * (rect.maxX - rect.minX)) / WALK_CELL) + 0.5) * WALK_CELL;
      const z = (Math.floor((rect.minZ + rng() * (rect.maxZ - rect.minZ)) / WALK_CELL) + 0.5) * WALK_CELL;
      expect(grid.solidAt(x, z), `cell (${x}, ${z})`).toBe(t.staticSolidAt(x, z));
    }
  });

  it('loadWalkGrid returns the seven outdoor tiles', () => {
    expect(loadWalkGrid()?.tileIds.length).toBe(7);
  });

  it('the game terrain has the baked grid installed', () => {
    expect(terrain.walkGrid).not.toBeNull();
  });

  it('the hash changes with zone stamps and brush edits, and is stable for equal inputs', () => {
    const base = computeBakeHash(fresh(), ZONES);
    expect(computeBakeHash(fresh(), ZONES)).toBe(base);

    const stamped = {
      ...ZONES,
      mossbottom: { ...ZONES.mossbottom, stamps: [{ op: 'gauss' as const, x: 0, z: 0, sigma: 12, amount: 2 }] },
    };
    expect(computeBakeHash(fresh(stamped), stamped)).not.toBe(base);

    const edited = fresh();
    edited.deltas.setUnits(0, 0, 50);
    expect(computeBakeHash(edited, ZONES)).not.toBe(base);
  });

  it('the hash changes when a cell is painted', () => {
    const base = computeBakeHash(fresh(), ZONES);
    const painted = fresh();
    painted.paint.set(3, 3, 2);
    expect(computeBakeHash(painted, ZONES)).not.toBe(base);
  });
});

describe('bake fingerprint across machines', () => {
  it('ignores last-bit differences in computed zone data (trig differs between Node versions and CPUs) but not real changes', () => {
    const input = { zones: ZONES, objects: OBJECTS, checkCondition };
    const base = computeBakeHash(createTerrain(input), ZONES);
    const shifted = (dx: number) => ({
      ...ZONES,
      mossbottom: { ...ZONES.mossbottom, exits: ZONES.mossbottom.exits.map((e) => ({ ...e, x: e.x + dx })) },
    });
    // A difference in the 13th decimal place, like a different libm would make.
    expect(computeBakeHash(createTerrain({ ...input, zones: shifted(3e-13) }), shifted(3e-13))).toBe(base);
    // A real change of a millimetre is noticed.
    expect(computeBakeHash(createTerrain({ ...input, zones: shifted(1e-3) }), shifted(1e-3))).not.toBe(base);
  });
});
