// Nested pivots: a pivot may name a parent pivot. Parts, local positions and world positions must all follow the authored absolute `at`.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { buildPrefab, setPrefabDamage } from './build';
import { getPrefabPart } from './interact';
import { registerPrefab } from './registry';
import { pivotAt, pivotParent, resolvePivotOrder } from './pivots';
import type { PivotDef, PrefabDef } from './types';

// Inline test rig (not in the catalog): suspension > knuckle > wheel-2, with absolute authored positions.
const rig = (overrides: Partial<PrefabDef> = {}): PrefabDef => ({
  id: 'test-nested-rig',
  name: 'Nested test rig',
  category: 'prop',
  uses: ['place'],
  about: 'Test only.',
  tags: [],
  emoji: [],
  parts: [
    { s: 'box', d: [0.2, 0.1, 0.2], name: 'spring', group: 'suspension', at: [0, 0.5, 0.5], c: 'iron' },
    { s: 'cyl', d: [0.2, 0.2, 0.1], name: 'tyre-2', group: 'wheel-2', at: [0.2, 0.3, 0.7], rot: [0, 0, 90], c: 'iron' },
    { s: 'box', d: [1, 0.2, 1], at: [0, 0.1, 0], c: 'iron' },
  ],
  pivots: {
    suspension: [0, 0.3, 0.5],
    knuckle: { at: [0.2, 0.3, 0.5], parent: 'suspension' },
    'wheel-2': { at: [0.2, 0.3, 0.7], parent: 'knuckle' },
  },
  ...overrides,
}) as PrefabDef;

const worldOf = (obj: THREE.Object3D): THREE.Vector3 => obj.getWorldPosition(new THREE.Vector3());
const expectVec = (v: THREE.Vector3, x: number, y: number, z: number): void => {
  expect(v.x).toBeCloseTo(x, 5);
  expect(v.y).toBeCloseTo(y, 5);
  expect(v.z).toBeCloseTo(z, 5);
};

/** Names, types and local positions of every object under a built root, in traversal order. */
const listing = (root: THREE.Object3D): string[] => {
  const out: string[] = [];
  root.traverse((o) => {
    if (o === root) return;
    out.push(`${o.name}|${o.type}|${o.position.x.toFixed(6)},${o.position.y.toFixed(6)},${o.position.z.toFixed(6)}`);
  });
  return out;
};

describe('pivot helpers', () => {
  it('reads a bare Vec3 pivot and an object pivot the same way', () => {
    expect(pivotAt([1, 2, 3])).toEqual([1, 2, 3]);
    expect(pivotAt({ at: [1, 2, 3], parent: 'x' })).toEqual([1, 2, 3]);
    expect(pivotParent([1, 2, 3])).toBeUndefined();
    expect(pivotParent({ at: [1, 2, 3] })).toBeUndefined();
    expect(pivotParent({ at: [1, 2, 3], parent: 'x' })).toBe('x');
  });

  it('orders parents before children and keeps authored order for roots', () => {
    const order = resolvePivotOrder({
      wheel: { at: [0, 0, 0], parent: 'knuckle' },
      knuckle: { at: [0, 0, 0], parent: 'suspension' },
      suspension: [0, 0, 0],
      reel: [1, 0, 0],
    });
    expect(order).toEqual(['suspension', 'knuckle', 'wheel', 'reel']);
  });

  it('throws on a cycle and on an unknown parent', () => {
    expect(() => resolvePivotOrder({ a: { at: [0, 0, 0], parent: 'b' }, b: { at: [0, 0, 0], parent: 'a' } }))
      .toThrow('pivot cycle: a -> b -> a');
    expect(() => resolvePivotOrder({ x: { at: [0, 0, 0], parent: 'y' } }))
      .toThrow("pivot 'x' has unknown parent 'y'");
  });

  it('buildPrefab throws on a cycle', () => {
    const cyclic = rig({ pivots: { a: { at: [0, 0, 0], parent: 'b' }, b: { at: [0, 0, 0], parent: 'a' } } });
    expect(() => buildPrefab(cyclic)).toThrow('pivot cycle');
  });
});

describe('nested pivots', () => {
  it('nests suspension > knuckle > wheel-2 in the built tree', () => {
    const root = buildPrefab(rig());
    const knuckle = root.getObjectByName('knuckle')!;
    const wheel = root.getObjectByName('wheel-2')!;
    expect(knuckle.parent!.name).toBe('suspension');
    expect(wheel.parent!.name).toBe('knuckle');
  });

  it('uses local positions that are differences of the absolute ones', () => {
    const root = buildPrefab(rig());
    expectVec(root.getObjectByName('knuckle')!.position, 0.2, 0, 0);
    expectVec(root.getObjectByName('wheel-2')!.position, 0, 0, 0.2);
  });

  it('puts every nested part at its authored world position at rest', () => {
    const root = buildPrefab(rig());
    root.updateMatrixWorld(true);
    expectVec(worldOf(root.getObjectByName('tyre-2')!), 0.2, 0.3, 0.7);
    expectVec(worldOf(root.getObjectByName('spring')!), 0, 0.5, 0.5);
    expectVec(worldOf(root.getObjectByName('wheel-2')!), 0.2, 0.3, 0.7);
  });

  it('rotating the parent turns the child part about the parent pivot', () => {
    const root = buildPrefab(rig());
    root.getObjectByName('suspension')!.rotation.z = Math.PI / 2;
    root.updateMatrixWorld(true);
    // Offset of the tyre from the suspension pivot is (0.2, 0, 0.2); a 90 degree turn about z gives (0, 0.2, 0.2).
    expectVec(worldOf(root.getObjectByName('tyre-2')!), 0, 0.5, 0.7);
  });

  it('getPrefabPart finds the nested pivot and the nested part', () => {
    const root = buildPrefab(rig());
    expect(getPrefabPart(root, 'wheel-2')).toBe(root.getObjectByName('wheel-2'));
    expect(getPrefabPart(root, 'tyre-2')?.name).toBe('tyre-2');
  });

  it('a flat prefab builds exactly as with Vec3 pivots (ride-on-mower)', () => {
    const mower = CATALOG.find((p) => p.id === 'ride-on-mower')!;
    const pivots = mower.pivots!;
    // The same pivots written in object form (no parent) must build the same tree, names, types and positions.
    const asObjects: Record<string, PivotDef> = Object.fromEntries(Object.entries(pivots).map(([k, v]) => [k, { at: pivotAt(v) }]));
    const flat = buildPrefab(mower);
    const objectForm = buildPrefab({ ...mower, pivots: asObjects });
    expect(listing(objectForm)).toEqual(listing(flat));
    // Root pivots come out in authored order, at their authored positions.
    const rootPivotNames = flat.children.map((c) => c.name).filter((n) => Object.hasOwn(pivots, n));
    expect(rootPivotNames).toEqual(Object.keys(pivots));
    for (const [name, v] of Object.entries(pivots)) {
      const g = flat.getObjectByName(name)!;
      expect(g.parent).toBe(flat);
      expectVec(g.position, pivotAt(v)[0], pivotAt(v)[1], pivotAt(v)[2]);
    }
  });

  it('setPrefabDamage rebuilds nested chains with the same shape', () => {
    const def = rig({ id: 'test-nested-damage', damage: [{ name: 'dented', add: [{ s: 'box', d: [0.05, 0.05, 0.05], at: [0, 0.6, 0.5], c: 'iron' }] }] });
    registerPrefab(def); // setPrefabDamage looks the prefab up by id
    const root = buildPrefab(def);
    const before = root.getObjectByName('knuckle');
    setPrefabDamage(root, 1);
    const knuckle = root.getObjectByName('knuckle')!;
    expect(knuckle).not.toBe(before);
    expect(knuckle.parent!.name).toBe('suspension');
    expect(root.getObjectByName('wheel-2')!.parent!.name).toBe('knuckle');
    root.updateMatrixWorld(true);
    expectVec(worldOf(root.getObjectByName('tyre-2')!), 0.2, 0.3, 0.7);
  });

  it('hiding a parent group hides the parts of its child groups', () => {
    const root = buildPrefab(rig({ damage: [{ name: 'wrecked', hide: ['suspension'] }] }), { damage: 1 });
    expect(getPrefabPart(root, 'spring')).toBeNull();
    expect(getPrefabPart(root, 'tyre-2')).toBeNull();
    expect(getPrefabPart(root, 'wheel-2')).not.toBeNull();
  });

  it('morphing a parent group moves the parts of its child groups', () => {
    const root = buildPrefab(rig({ damage: [{ name: 'bent', morph: { suspension: { at: [0, 0.1, 0] } } }] }), { damage: 1 });
    expect(root.getObjectByName('tyre-2')!.position.y).toBeCloseTo(0.1, 5);
  });
});
