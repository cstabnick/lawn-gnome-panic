// Checks every prefab in the catalog: well-formed data, and it builds into something gnome-sized standing on the ground.
// Run: npm test -w packages/prefabs
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { PALETTE } from './palette';
import { buildPrefab } from './build';
import { getPrefabInteractTarget, getPrefabPart, getPrefabParts, getPrefabRestTarget, getPrefabSitTarget, prefabFromObject } from './interact';
import { getPrefab, normalizeEmoji, prefabForEmoji, resolvePrefab } from './registry';
import type { ShapeKind } from './types';

const DIMS: Record<ShapeKind, [number, number]> = {
  box: [3, 3], cyl: [3, 3], cone: [2, 2], ball: [1, 1], ring: [2, 3], pill: [2, 2], wedge: [3, 3],
};

describe('catalog', () => {
  it('has unique kebab-case ids', () => {
    const seen = new Set<string>();
    for (const p of CATALOG) {
      expect(p.id, p.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(seen.has(p.id), `duplicate ${p.id}`).toBe(false);
      seen.add(p.id);
    }
  });

  for (const p of CATALOG) {
    describe(p.id, () => {
      it('is well formed', () => {
        expect(p.name.length, 'name').toBeGreaterThan(0);
        expect(p.about.length, 'about').toBeGreaterThan(0);
        expect(p.examine.length, 'at least 4 examine lines').toBeGreaterThanOrEqual(4);
        for (const line of p.examine) {
          expect(line.length, `examine line too long: ${line}`).toBeLessThanOrEqual(160);
          expect(line.length, 'examine line empty').toBeGreaterThan(8);
        }
        expect(new Set(p.examine).size, 'examine lines are all different').toBe(p.examine.length);
        expect(p.uses.length, 'uses').toBeGreaterThan(0);
        expect(p.parts.length, 'parts').toBeGreaterThan(0);
        expect(p.parts.length, 'at most 40 parts').toBeLessThanOrEqual(40);
        if (p.uses.includes('hold')) expect(p.grip, 'hold needs grip').toBeDefined();
        if (p.uses.includes('sit')) expect(p.seat, 'sit needs seat').toBeDefined();
        for (const e of p.emoji) expect(e, 'emoji without U+FE0F').toBe(normalizeEmoji(e));
        for (const t of p.tags) expect(t, 'tags are lower-case').toBe(t.toLowerCase());
        const usesTint = p.parts.some((part) => part.c === 'tint');
        const usesTrim = p.parts.some((part) => part.c === 'trim');
        if (usesTrim) expect(p.trim, 'a prefab with trim parts sets a default trim').toBeDefined();
        for (const part of p.parts) {
          const [min, max] = DIMS[part.s];
          expect(part.d.length, `${part.s} d length`).toBeGreaterThanOrEqual(min);
          expect(part.d.length, `${part.s} d length`).toBeLessThanOrEqual(max);
          for (const n of [...part.d, ...(part.at ?? []), ...(part.rot ?? []), ...(part.scale ?? [])]) {
            expect(Number.isFinite(n), `finite number in ${part.s}`).toBe(true);
          }
          if (typeof part.c === 'string' && part.c !== 'tint' && part.c !== 'trim') {
            expect(part.c in PALETTE, `palette has '${part.c}'`).toBe(true);
          }
        }
        if (p.tint !== undefined && typeof p.tint === 'string') expect(p.tint in PALETTE, `tint '${p.tint}'`).toBe(true);
        if (usesTint) expect(p.tint, 'a prefab with tint parts sets a default tint').toBeDefined();
      });

      it('builds, stands on the ground and is gnome-sized', () => {
        const g = buildPrefab(p);
        const box = new THREE.Box3().setFromObject(g);
        const size = box.getSize(new THREE.Vector3());
        if (p.mount !== 'wall') {
          expect(box.min.y, 'bottom near y=0').toBeGreaterThan(-0.03);
          expect(box.min.y, 'bottom near y=0').toBeLessThan(0.03);
        }
        expect(Math.max(size.x, size.y, size.z), 'largest side').toBeGreaterThan(0.03);
        expect(Math.max(size.x, size.y, size.z), 'largest side').toBeLessThan(3);
        const c = box.getCenter(new THREE.Vector3());
        expect(Math.abs(c.x), 'centred on x').toBeLessThan(0.15 + size.x / 2);
        // Neck gear hangs on the chest, forward of the neck, so its centre is not on the origin.
        // packages/gnome/src/gear-clearance.test.ts checks where it sits relative to the head instead.
        if (!p.uses.includes('wear-neck')) expect(Math.abs(c.z), 'centred on z').toBeLessThan(0.15 + size.z / 2);
      });
    });
  }
});

describe('lookup', () => {
  it('finds prefabs by emoji with or without U+FE0F', () => {
    expect(prefabForEmoji('🛡️')?.id).toBe('round-shield');
    expect(prefabForEmoji('🛡')?.id).toBe('round-shield');
  });
  it('resolves an explicit id, then emoji, then a name word', () => {
    expect(resolvePrefab({ prefab: 'brass-key', icon: '🛡' })?.id).toBe('brass-key');
    expect(resolvePrefab({ icon: '🍄' })?.id).toBe('red-mushroom');
    expect(resolvePrefab({ icon: '❓', name: 'Grandad\'s Old Trowel' })?.id).toBe('old-trowel');
    expect(resolvePrefab({ icon: '❓', name: 'Mysterious Thing' })).toBeUndefined();
  });
  it('lets the name pick between prefabs that share an emoji', () => {
    // 🛡 is listed by several shields and breastplates: the name's words pick one, the emoji's first prefab is the fallback.
    expect(resolvePrefab({ icon: '🛡', name: 'Oak shield' })?.id).toBe('oak-shield');
    expect(resolvePrefab({ icon: '🛡', name: 'Bottlecap plate', prefer: ['armor'] })?.id).toBe('bottlecap-cuirass');
    expect(resolvePrefab({ icon: '🛡', name: 'Tin buckler' })?.id).toBe('round-shield');
  });
});

describe('interact', () => {
  it('finds prefab root and computes world sit target for a rotated stool', () => {
    const stool = buildPrefab('stool');
    stool.position.set(10, 2, -5);
    stool.rotation.y = Math.PI / 2;
    const hit = prefabFromObject(stool.children[0]);
    expect(hit?.def.id).toBe('stool');
    expect(hit?.root).toBe(stool);

    const target = getPrefabSitTarget(stool, hit!.def)!;
    expect(target.position.x).toBeCloseTo(10, 4);
    expect(target.position.y).toBeCloseTo(2.4, 4);
    expect(target.position.z).toBeCloseTo(-5, 4);
    expect(target.facing).toBeCloseTo(Math.PI / 2, 4);
  });

  it('computes fixed rest target in front of a hearth', () => {
    const hearth = buildPrefab('hearth');
    hearth.position.set(0, 0, -3.8);
    const def = getPrefab('hearth')!;
    const target = getPrefabRestTarget(hearth, def)!;
    expect(target.position.x).toBeCloseTo(0, 4);
    expect(target.position.z).toBeCloseTo(-3.8 + 1.15, 4);
    // Facing back toward the hearth (-z -> Math.PI).
    expect(Math.abs(target.facing)).toBeCloseTo(Math.PI, 4);
  });

  it('computes nearest-side rest target around a scaled campfire', () => {
    const fire = buildPrefab('campfire', { scale: 2 });
    fire.position.set(5, 0, 5);
    const def = getPrefab('campfire')!;
    const from = new THREE.Vector3(10, 0, 5);
    const target = getPrefabRestTarget(fire, def, from)!;
    expect(target.position.x).toBeCloseTo(5 + 0.75 * 2, 4);
    expect(target.position.z).toBeCloseTo(5, 4);
    expect(target.facing).toBeCloseTo(-Math.PI / 2, 4);
  });

  it('builds articulated pivots, named parts, and interact targets for slot machines', () => {
    for (const id of ['slot-machine-classic', 'slot-machine-deluxe', 'slot-machine-mushroom']) {
      const def = getPrefab(id)!;
      const machine = buildPrefab(def);
      machine.position.set(4, 0, 1);
      machine.rotation.y = -Math.PI / 2;

      const reels = getPrefabParts(machine, 'reel-');
      expect(reels.map((r) => r.name)).toEqual(['reel-0', 'reel-1', 'reel-2']);
      for (const r of reels) {
        expect(r.children.length).toBe(1);
        expect(r.children[0].position.length()).toBeCloseTo(0, 5);
      }

      const lever = getPrefabPart(machine, 'lever');
      expect(lever).not.toBeNull();
      expect(lever!.children.length).toBe(2);

      const beacon = getPrefabPart(machine, 'beacon');
      expect(beacon).not.toBeNull();

      const target = getPrefabInteractTarget(machine, def)!;
      expect(target).not.toBeNull();
      expect(target.camera).toBeDefined();
      // Machine rotated -PI/2 faces -x, so standing spot in front (+z local) is at x < 4 and gnome faces back (+x)
      expect(target.stand.x).toBeLessThan(4);
      expect(target.facing).toBeGreaterThan(0);
      expect(target.facing).toBeLessThan(Math.PI / 2);
    }
  });
});
