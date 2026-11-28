// Saltbucket Shore's life (E11 issue 3B): the vignette table, the residents and the blips. Pure data checks, no DOM.
import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { waterDepthAt } from '../water';
import * as THREE from 'three';
import { ambientFeetY } from '../ambientGnomes';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { buildBoardwalk } from './boardwalk';
import { COAST } from './config';
import { buildPirateShip } from './pirateShip';
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

describe('deck residents stand on their decks', () => {
  const boxes: Box[] = [];
  buildBoardwalk(new THREE.Scene(), boxes);
  buildPirateShip(new THREE.Scene(), boxes);
  const byId = (id: string) => COAST_RESIDENTS.find((r) => r.id === id)!;

  it('puts Reel Ruth on the pier handle, inside the rails', () => {
    const r = byId('coast-angler-spur');
    expect(ambientFeetY(r)).toBe(COAST.pier.deckY);
    expect(r.x).toBeGreaterThan(COAST.pier.handle.minX + 0.45);
    expect(r.x).toBeLessThan(COAST.pier.handle.maxX - 0.45);
  });

  it("puts the Queen's crew on her deck", () => {
    const crew = COAST_RESIDENTS.filter((r) => r.id.startsWith('coast-queen-'));
    expect(crew.length).toBeGreaterThanOrEqual(1);
    for (const r of crew) {
      expect(ambientFeetY(r), r.id).toBe(COAST.ship.deckY);
      expect(r.x).toBeGreaterThan(COAST.ship.deck.minX);
      expect(r.x).toBeLessThan(COAST.ship.deck.maxX);
      expect(r.z).toBeGreaterThan(COAST.ship.deck.minZ);
      expect(r.z).toBeLessThan(COAST.ship.deck.maxZ);
    }
  });

  it('puts Spun Sugar Sal on the planks, not in them', () => {
    const sal = byId('coast-sal-candyfloss');
    expect(ambientFeetY(sal)).toBeCloseTo(heightAt(sal.x, sal.z) + COAST.boardwalk.deckLift, 5);
  });
});
