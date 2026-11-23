// Steering variant and grip markers. Registers ride-on-mower+glaze in the shared prefab registry: only this file may use that base.
import * as THREE from 'three';
import { buildPrefab, getPrefab, setPrefabDamage } from '@lawn/prefabs';
import type { PrefabDef } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { applySteer, registerSteerVariant, resolveBodyPrefab, steerVariantId } from './steer';
import type { Loadout, SteerId, VehicleMounts } from './types';

const WHEEL_AT = [0, 0.62, 0.02] as const;
const mounts = (steer: VehicleMounts['steer'], width = 1.2): VehicleMounts => ({
  width, length: 1.7, height: 1, points: {}, lamps: null, steer, panels: [], wheels: [],
});
const loadout = (steer: SteerId): Loadout => ({ steer } as Loadout);

describe('steering variants', () => {
  const base = getPrefab('ride-on-mower') as PrefabDef;
  const baseParts = base.parts.length;
  const id = registerSteerVariant('ride-on-mower', { dropParts: [6], wheelAt: [...WHEEL_AT], columnBase: [0, 0.42, -0.1] });

  it('returns the variant id and is idempotent', () => {
    expect(id).toBe('ride-on-mower+glaze');
    expect(id).toBe(steerVariantId('ride-on-mower'));
    expect(registerSteerVariant('ride-on-mower', { dropParts: [6], wheelAt: [...WHEEL_AT] })).toBe(id);
  });

  it('registers a def at the wheel position without touching the base', () => {
    const v = getPrefab(id) as PrefabDef;
    expect(v).toBeDefined();
    expect(v.pivots?.steer).toEqual(WHEEL_AT);
    expect(base.pivots?.steer?.[1]).toBeCloseTo(1.1388, 4);
    expect(base.parts.length).toBe(baseParts);
    expect(v.parts.length).toBe(base.parts.length);
    const ring = v.parts.find((p) => p.s === 'ring' && p.group === 'steer');
    expect(ring?.at).toEqual(WHEEL_AT);
  });

  it('builds the wheel group at wheelAt and resolves the body id', () => {
    const body = buildPrefab(id);
    const steerGroup = body.getObjectByName('steer');
    expect(steerGroup).toBeDefined();
    expect(steerGroup!.position.x).toBeCloseTo(0, 6);
    expect(steerGroup!.position.y).toBeCloseTo(0.62, 6);
    expect(steerGroup!.position.z).toBeCloseTo(0.02, 6);
    expect(resolveBodyPrefab('ride-on-mower')).toBe(id);
    expect(resolveBodyPrefab('sandbag-wall')).toBe('sandbag-wall');
  });

  it('puts the column top at the wheel', () => {
    const v = getPrefab(id) as PrefabDef;
    const column = v.parts.find((p) => p.s === 'cyl' && p.c === 'iron' && !p.group);
    expect(column).toBeDefined();
    const solo = buildPrefab({ ...v, id: 'column-check', parts: [column!], pivots: undefined, damage: undefined });
    solo.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(solo);
    expect(Math.abs(box.max.y - WHEEL_AT[1])).toBeLessThan(0.03);
  });

  it('keeps the moved wheel after a damage change', () => {
    const body = buildPrefab(id);
    setPrefabDamage(body, 1);
    const steerGroup = body.getObjectByName('steer');
    expect(steerGroup!.position.y).toBeCloseTo(0.62, 6);
    expect(steerGroup!.position.z).toBeCloseTo(0.02, 6);
  });

  it('throws for an unknown base', () => {
    expect(() => registerSteerVariant('no-such-prefab', { dropParts: [], wheelAt: [0, 0, 0] })).toThrow();
  });

  describe('applySteer', () => {
    const stockMounts = mounts({ pivot: 'steer', grips: [[0.2, 0.62, 0.02], [-0.2, 0.62, 0.02]] });

    it('places stock grip markers in world space and turns them with the wheel', () => {
      const body = buildPrefab(id);
      const { grips } = applySteer(body, stockMounts, loadout('stock'));
      expect(grips).not.toBeNull();
      body.updateMatrixWorld(true);
      const left = new THREE.Vector3();
      const right = new THREE.Vector3();
      grips!.left.getWorldPosition(left);
      grips!.right.getWorldPosition(right);
      expect(left.x).toBeCloseTo(0.2, 6);
      expect(left.y).toBeCloseTo(0.62, 6);
      expect(left.z).toBeCloseTo(0.02, 6);
      expect(right.x).toBeCloseTo(-0.2, 6);
      expect(right.y).toBeCloseTo(0.62, 6);
      expect(right.z).toBeCloseTo(0.02, 6);

      const steerPivot = body.getObjectByName('steer')!;
      steerPivot.rotation.y = Math.PI / 2;
      body.updateMatrixWorld(true);
      grips!.left.getWorldPosition(left);
      expect(left.x).toBeCloseTo(0, 4);
      expect(left.y).toBeCloseTo(0.62, 4);
      expect(left.z).toBeCloseTo(-0.18, 4);
    });

    it('leaves exactly two markers after two calls', () => {
      const body = buildPrefab(id);
      applySteer(body, stockMounts, loadout('stock'));
      applySteer(body, stockMounts, loadout('stock'));
      const steerGroup = body.getObjectByName('steer')!;
      const markers = steerGroup.children.filter((c) => c.name.startsWith('glaze-grip-'));
      expect(markers.length).toBe(2);
    });

    it('returns no grips without a steering mount', () => {
      const body = buildPrefab(id);
      expect(applySteer(body, mounts(null), loadout('stock')).grips).toBeNull();
    });

    it.skipIf(!getPrefab('glaze-steer-racing'))('hides the stock ring for a styled wheel and shows it again for stock', () => {
      const body = buildPrefab(id);
      const steerGroup = body.getObjectByName('steer')!;
      const ring = steerGroup.children[0]; // the wheel is the only part in the 'steer' group
      applySteer(body, stockMounts, loadout('racing'));
      expect(steerGroup.children.some((c) => c.name === 'glaze-steer')).toBe(true);
      expect(ring.visible).toBe(false);
      applySteer(body, stockMounts, loadout('stock'));
      expect(steerGroup.children.some((c) => c.name === 'glaze-steer')).toBe(false);
      expect(ring.visible).toBe(true);
    });
  });
});
