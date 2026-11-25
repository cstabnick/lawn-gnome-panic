// Saltbucket Shore's life (E11 issue 3B): the vignette table, the residents and the blips. Pure data checks, no DOM.
import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { waterDepthAt } from '../water';
import { COAST_RESIDENTS, COAST_VIGNETTES, type CoastDistrict } from './life';

const DISTRICTS: CoastDistrict[] = ['boardwalk', 'pier', 'beach', 'ship'];

describe('coast vignettes', () => {
  it('tells at least three stories in each district', () => {
    for (const d of DISTRICTS) {
      const n = COAST_VIGNETTES.filter((v) => v.district === d).length;
      expect(n, d).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every vignette at least one prop', () => {
    for (const v of COAST_VIGNETTES) expect(v.props.length, v.id).toBeGreaterThan(0);
  });

  it('uses only prefab ids that exist', () => {
    for (const v of COAST_VIGNETTES) {
      for (const p of v.props) expect(getPrefab(p.prefab), `${v.id}: ${p.prefab}`).toBeDefined();
    }
  });

  it('keeps boardwalk and beach props on dry ground', () => {
    for (const v of COAST_VIGNETTES) {
      if (v.district !== 'boardwalk' && v.district !== 'beach') continue;
      for (const p of v.props) expect(waterDepthAt(p.x, p.z), `${v.id}: ${p.prefab}`).toBe(0);
      for (const d of v.decals ?? []) expect(waterDepthAt(d.x, d.z), `${v.id} decal`).toBe(0);
    }
  });
});

describe('coast residents', () => {
  it('has at least six residents, each with a unique id and a bubble line', () => {
    expect(COAST_RESIDENTS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(COAST_RESIDENTS.map((r) => r.id));
    expect(ids.size).toBe(COAST_RESIDENTS.length);
    for (const r of COAST_RESIDENTS) expect(r.bubble.length, r.id).toBeGreaterThan(0);
  });

  it('stands within 400 m of the boardwalk centre', () => {
    for (const r of COAST_RESIDENTS) {
      expect(Math.hypot(r.x - 0, r.z - 1150), r.id).toBeLessThanOrEqual(400);
    }
  });
});
