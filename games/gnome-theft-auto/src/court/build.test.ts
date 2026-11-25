import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildDrainpipeCourt } from './build';
import { COURT, COURT_SITE } from './types';

describe('Drainpipe Court build', () => {
  const scene = new THREE.Scene();
  const court = buildDrainpipeCourt(scene);

  it('keeps every collider inside the site', () => {
    expect(court.boxes.length).toBeGreaterThan(8);
    for (const b of court.boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(COURT_SITE.minX);
      expect(b.maxX).toBeLessThanOrEqual(COURT_SITE.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(COURT_SITE.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(COURT_SITE.maxZ);
    }
  });

  it('leaves the painted court clear except for the two hoop poles', () => {
    const inside = court.boxes.filter((b) =>
      b.maxX > COURT.x - COURT.halfX && b.minX < COURT.x + COURT.halfX && b.maxZ > COURT.z - COURT.halfZ && b.minZ < COURT.z + COURT.halfZ);
    expect(inside).toHaveLength(2);
    for (const b of inside) expect(b.shape).toBe('round');
  });

  it('puts both rims on the simulation hoops', () => {
    scene.updateMatrixWorld(true);
    for (const hoop of COURT.hoops) {
      const obj = court.group.getObjectByName(`drainpipe-hoop-${hoop.side}`)!;
      const rim = obj.localToWorld(new THREE.Vector3(0, 3.05, 0.4));
      expect(Math.abs(rim.x - hoop.x)).toBeLessThan(0.01);
      expect(Math.abs(rim.z - hoop.z)).toBeLessThan(0.01);
      expect(Math.abs(rim.y - (court.groundY + COURT.hoopY))).toBeLessThan(0.01);
    }
  });
});
