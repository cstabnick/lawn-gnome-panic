import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SKY } from './config';
import { createParcels } from './parcels';
import { heightAt } from '../terrain';

describe('parcels', () => {
  it('lands a dropped parcel on the terrain and pays Acorns to a gnome on foot', () => {
    const scene = new THREE.Scene();
    const parcels = createParcels(scene);
    parcels.drop(0, 50, 0, 0, 0);
    expect(parcels.count).toBe(1);

    // Far from the parcel (the player is 1000 m away), so nothing is collected while it falls.
    const group = scene.children[0] as THREE.Group;
    let paid = 0;
    for (let i = 0; i < 1000 && group.position.y > heightAt(0, 0); i++) {
      paid += parcels.update(0.1, 1000, 0, 1000, true);
    }
    expect(paid).toBe(0);
    expect(Math.abs(group.position.y - heightAt(0, 0))).toBeLessThan(0.5);
    expect(group.children.length).toBe(1);

    const got = parcels.update(0.1, 0, group.position.y, 0, true);
    expect(got).toBe(SKY.parcelAcorns);
    expect(parcels.count).toBe(0);
    expect(scene.children.length).toBe(0);
  });

  it('keeps at most parcelMax parcels', () => {
    const scene = new THREE.Scene();
    const parcels = createParcels(scene);
    for (let i = 0; i < SKY.parcelMax + 1; i++) parcels.drop(i * 10, 50, 0, 0, 0);
    expect(parcels.count).toBe(SKY.parcelMax);
    parcels.clear();
    expect(parcels.count).toBe(0);
  });
});
