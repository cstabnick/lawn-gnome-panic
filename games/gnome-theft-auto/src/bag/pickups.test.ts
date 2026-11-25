import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PARKS } from '../parks/blocks';
import { createPickups, pickupSpots, PICKUP } from './pickups';

describe('pickupSpots', () => {
  it('has one spot per park, 3 m east of the park centre', () => {
    const spots = pickupSpots();
    expect(spots).toHaveLength(PARKS.length);
    PARKS.forEach((p, i) => {
      expect(spots[i]).toEqual({ x: p.x + 3, z: p.z });
    });
  });
});

describe('createPickups', () => {
  const spot = { x: 10, z: 10 };

  function setup(onFoot = true) {
    const scene = new THREE.Scene();
    const picked: string[] = [];
    const pickups = createPickups({
      scene,
      spots: [spot],
      groundAt: () => 0,
      onPick: (id) => {
        picked.push(id);
        return true;
      },
      rng: () => 0,
    });
    return { scene, picked, pickups, onFoot };
  }

  it('picks exactly one item when the player walks through, and only once', () => {
    const { picked, pickups } = setup();
    pickups.update(0.016, spot.x, spot.z, true);
    expect(picked).toEqual(['crab-apple']);
    pickups.update(0.016, spot.x, spot.z, true);
    expect(picked).toHaveLength(1);
  });

  it('comes back after the respawn time', () => {
    const { scene, picked, pickups } = setup();
    pickups.update(0.016, spot.x, spot.z, true);
    expect(picked).toHaveLength(1);

    const visibleModels = () => scene.children.filter((c) => c.visible).length;
    expect(visibleModels()).toBe(0);

    for (let i = 0; i < PICKUP.respawnS + 1; i++) pickups.update(1, 500, 500, true);
    expect(visibleModels()).toBe(1);
    expect(picked).toHaveLength(1);
  });

  it('never picks when not on foot', () => {
    const { picked, pickups } = setup();
    pickups.update(0.016, spot.x, spot.z, false);
    expect(picked).toEqual([]);
  });
});
