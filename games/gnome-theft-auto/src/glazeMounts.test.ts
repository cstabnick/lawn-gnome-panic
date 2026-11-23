// Pay 'n' Glaze mounts: every ground vehicle's mounts are finite, the steering grips are within a seated gnome's reach,
// and the grip markers land where the numbers say.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { applySteer, buildGlazeBody, defaultLoadout, getMounts, type VehicleMounts } from '@lawn/glaze';
import { VEHICLES } from './config';
import { registerGlazeMounts } from './glazeMounts';
import { GLAZE_KINDS } from './glazeStore';

const REACH = 0.45;
const SHOULDER_X = 0.27;
const SHOULDER_Y = 0.62;

/** Every number reachable from a mounts object is finite. */
function allFinite(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(allFinite);
  if (v && typeof v === 'object') return Object.values(v).every(allFinite);
  return true;
}

const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('glazeMounts', () => {
  it('registering twice is safe', () => {
    registerGlazeMounts();
    expect(() => registerGlazeMounts()).not.toThrow();
  });

  it('registering a steer variant does not change the catalogue prefab', () => {
    registerGlazeMounts();
    expect(getPrefab('ride-on-mower')?.pivots?.steer).toEqual([0, 1.1388, 0.0103]);
  });

  for (const kind of GLAZE_KINDS) {
    const spec = VEHICLES[kind];

    it(`${kind}: mounts are finite and the panels are sized`, () => {
      registerGlazeMounts();
      const body = buildGlazeBody(spec.prefab, { scale: spec.scale });
      const m: VehicleMounts = getMounts(spec.prefab, body);
      expect(allFinite(m)).toBe(true);
      expect(m.panels).toHaveLength(4);
      for (const p of m.panels) {
        expect(p.size[0]).toBeGreaterThan(0);
        expect(p.size[1]).toBeGreaterThan(0);
      }
      if (m.lamps) {
        expect(m.lamps[0][0]).toBeGreaterThan(0);
        expect(m.lamps[1][0]).toBeLessThan(0);
      }
    });

    it(`${kind}: steering grips are within reach and the markers land on them`, () => {
      registerGlazeMounts();
      const body = buildGlazeBody(spec.prefab, { scale: spec.scale });
      const m = getMounts(spec.prefab, body);
      if (!m.steer) return;

      expect(body.getObjectByName(m.steer.pivot)).toBeTruthy();

      const seat = spec.seat;
      const leftShoulder = [seat[0] + SHOULDER_X, seat[1] + SHOULDER_Y, seat[2]];
      const rightShoulder = [seat[0] - SHOULDER_X, seat[1] + SHOULDER_Y, seat[2]];
      const rootGrip = (g: readonly number[]) => [g[0] * spec.scale, g[1] * spec.scale, g[2] * spec.scale];
      const [leftGrip, rightGrip] = m.steer.grips.map(rootGrip);
      expect(dist(leftGrip, leftShoulder)).toBeLessThanOrEqual(REACH);
      expect(dist(rightGrip, rightShoulder)).toBeLessThanOrEqual(REACH);

      body.scale.setScalar(spec.scale);
      body.position.set(0, 0, 0);
      body.updateMatrixWorld(true);
      const { grips } = applySteer(body, m, defaultLoadout(0xffffff));
      expect(grips).not.toBeNull();
      if (!grips) return;
      body.updateMatrixWorld(true);
      const lw = new THREE.Vector3();
      const rw = new THREE.Vector3();
      grips.left.getWorldPosition(lw);
      grips.right.getWorldPosition(rw);
      const [lx, ly, lz] = leftGrip;
      const [rx, ry, rz] = rightGrip;
      expect(lw.x).toBeCloseTo(lx, 4);
      expect(lw.y).toBeCloseTo(ly, 4);
      expect(lw.z).toBeCloseTo(lz, 4);
      expect(rw.x).toBeCloseTo(rx, 4);
      expect(rw.y).toBeCloseTo(ry, 4);
      expect(rw.z).toBeCloseTo(rz, 4);
    });
  }
});
