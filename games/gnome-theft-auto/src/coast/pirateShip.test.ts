import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Box } from '../types';
import { rooftopById, rooftopSurfaceBelow } from '../interiors/rooftops';
import { waterDepthAt } from '../water';
import { COAST } from './config';
import { buildPirateShip } from './pirateShip';

describe('the Bathtub Queen', () => {
  const boxes: Box[] = [];
  buildPirateShip(new THREE.Scene(), boxes);
  const { deckY, gangplank, deck } = COAST.ship;

  it('has a walkable deck at deckY', () => {
    expect(rooftopById('bathtub-queen-deck')?.y).toBe(deckY);
    expect(rooftopSurfaceBelow(300, 1268, deckY + 1)).toBe(deckY);
  });

  it('joins the pier bowl by the gangplank', () => {
    const r = rooftopById('bathtub-queen-gangplank');
    expect(r).toBeDefined();
    expect(r!.minZ).toBeLessThanOrEqual(COAST.pier.bowl.maxZ);
    expect(r!.maxZ).toBeGreaterThanOrEqual(deck.minZ);
  });

  it('keeps the rail colliders off the gangplank', () => {
    for (const b of boxes) {
      if (b.h < deckY + 0.5) continue;
      const overlaps = b.minX < gangplank.maxX && b.maxX > gangplank.minX && b.minZ < gangplank.maxZ && b.maxZ > gangplank.minZ;
      // The cabin, masts and cannons are far from the plank; only rails could touch it.
      expect(overlaps, JSON.stringify(b)).toBe(false);
    }
  });

  it('keeps the sea chest in the cabin, at the foot of the bed', () => {
    const [tx, tz] = COAST.ship.treasureLocal;
    expect(Math.abs(tx)).toBeLessThan(6.5);
    expect(Math.abs(tz)).toBeLessThan(4.5);
    // The bed sits at (-5.6, 2.8), turned so its foot (1 m from the middle) points to the room's centre.
    expect(Math.hypot(tx - -4.6, tz - 2.8)).toBeLessThan(2.5);
  });

  it('floats in water', () => {
    expect(waterDepthAt(COAST.ship.x, COAST.ship.z)).toBeGreaterThan(1);
  });
});
