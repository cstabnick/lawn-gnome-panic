// Lamps: positions, sizes, colours and the housings. Run: npx vitest run packages/glaze/src/lamps.test.ts
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { beamColor } from './catalog';
import { buildLamps } from './lamps';
import { defaultLoadout } from './loadout';
import type { Loadout, VehicleMounts } from './types';

const mountsFor = (lamps: VehicleMounts['lamps'], width = 1.2): VehicleMounts => ({
  width,
  length: 3,
  height: 1,
  points: {},
  lamps,
  steer: null,
  panels: [],
  wheels: [],
});

const LAMPS_AT: VehicleMounts['lamps'] = [[0.32, 0.5, 0.9], [-0.32, 0.5, 0.9]];

const loadoutWith = (patch: Partial<Loadout>): Loadout => ({ ...defaultLoadout(0xd8342c), ...patch });

describe('buildLamps', () => {
  it('returns no housings and no beams when the vehicle has no lamp mounts', () => {
    const out = buildLamps(mountsFor(null), loadoutWith({ lamp: 'round' }));
    expect(out.housings).toBeNull();
    expect(out.beams).toBeNull();
  });

  it('stock lamp: no housings, two bulbs and two beams at the mounts', () => {
    const out = buildLamps(mountsFor(LAMPS_AT), loadoutWith({ lamp: 'stock' }));
    expect(out.housings).toBeNull();
    expect(out.beams).not.toBeNull();
    const beams = out.beams as THREE.Group;
    expect(beams.name).toBe('glaze-beams');
    expect(beams.children).toHaveLength(4);
    const firstBulb = beams.children[0];
    expect(firstBulb.position.toArray()).toEqual([0.32, 0.5, 0.9]);
  });

  it('keeps positions as given and only scales sizes by width / 1.2', () => {
    const out = buildLamps(mountsFor(LAMPS_AT, 2.4), loadoutWith({ lamp: 'stock' }));
    const beams = out.beams as THREE.Group;
    const bulb = beams.children[0];
    expect(bulb.position.toArray()).toEqual([0.32, 0.5, 0.9]);
    expect(bulb.scale.x).toBe(2);
  });

  it('colours the bulbs and beams from the beam id', () => {
    const out = buildLamps(mountsFor(LAMPS_AT), loadoutWith({ lamp: 'stock', beam: 'rose' }));
    const beams = out.beams as THREE.Group;
    const bulb = beams.children[0] as THREE.Mesh;
    const material = bulb.material as THREE.MeshBasicMaterial;
    expect(material.color.getHex()).toBe(beamColor('rose'));
  });

  it.skipIf(!getPrefab('glaze-lamp-round'))('builds a mirrored housing pair for a round lamp', () => {
    const out = buildLamps(mountsFor(LAMPS_AT), loadoutWith({ lamp: 'round' }));
    expect(out.housings).not.toBeNull();
    const housings = out.housings as THREE.Group;
    expect(housings.name).toBe('glaze-lamps');
    expect(housings.children).toHaveLength(2);
    expect(housings.children[1].scale.x).toBeLessThan(0);
  });

  it.skipIf(!getPrefab('glaze-lamp-bar'))('builds one housing for the light bar', () => {
    const out = buildLamps(mountsFor(LAMPS_AT), loadoutWith({ lamp: 'bar' }));
    const housings = out.housings as THREE.Group;
    expect(housings.children).toHaveLength(1);
    expect(housings.children[0].position.x).toBeCloseTo(0);
  });

  it.skipIf(!getPrefab('glaze-lamp-popup'))('raises the popup bulbs and beams by 0.03 * scale', () => {
    const flat = buildLamps(mountsFor(LAMPS_AT), loadoutWith({ lamp: 'stock' }));
    const popup = buildLamps(mountsFor(LAMPS_AT), loadoutWith({ lamp: 'popup' }));
    const flatBulb = (flat.beams as THREE.Group).children[0];
    const popupBulb = (popup.beams as THREE.Group).children[0];
    expect(popupBulb.position.y).toBeCloseTo(flatBulb.position.y + 0.03);
  });

  it('housings are null when the lamp prefab is missing', () => {
    if (getPrefab('glaze-lamp-round')) return;
    const out = buildLamps(mountsFor(LAMPS_AT), loadoutWith({ lamp: 'round' }));
    expect(out.housings).toBeNull();
    expect(out.beams).not.toBeNull();
  });
});
