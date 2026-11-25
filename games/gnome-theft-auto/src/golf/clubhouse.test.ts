// Hedgeworth's buildings, clubhouse interior and homes (node, no DOM).
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { homeOf } from '../homes/data';
import { interiorById } from '../interiors';
import { buildHedgeworthBuildings, defineClubhouseInterior, registerHedgeworthHomes } from './clubhouse';
import { CLUBHOUSE, CLUBHOUSE_INTERIOR, inPlay, inYard } from './types';
import type { GolfStore } from './types';

describe('Hedgeworth buildings', () => {
  it('colliders are inside the yard and out of play', () => {
    const { boxes } = buildHedgeworthBuildings(new THREE.Scene());
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      const x = (b.minX + b.maxX) / 2, z = (b.minZ + b.maxZ) / 2;
      expect(inYard(b.minX, b.minZ, 1) && inYard(b.maxX, b.maxZ, 1), `${x},${z}`).toBe(true);
      expect(inPlay(x, z), `${x},${z}`).toBe(false);
    }
  });

  it('defines the clubhouse interior once, at the clubhouse door', () => {
    const deps = { store: () => ({}) as GolfStore, startRound: () => null, toast() {} };
    defineClubhouseInterior(deps);
    defineClubhouseInterior(deps);
    const p = interiorById(CLUBHOUSE_INTERIOR);
    expect(p).toBeDefined();
    expect(p?.def.door.x).toBe(CLUBHOUSE.door.x);
    expect(p?.def.door.z).toBe(CLUBHOUSE.door.z + 1);
  });

  it('registers the three homes with doors', () => {
    registerHedgeworthHomes();
    registerHedgeworthHomes();
    for (const k of ['peony', 'basil', 'thrift']) expect(homeOf(k)?.door, k).not.toBeNull();
  });
});
