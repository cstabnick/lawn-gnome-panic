// Damage stages: the data is consistent, every level builds into a finite, grounded model, and levels can be switched in place.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { buildPrefab, resolveTintTrim, setPrefabDamage } from './build';
import { damagedDef, prefabDamageLevels } from './damage';
import { PALETTE } from './palette';

const breakable = CATALOG.filter((p) => p.damage && p.damage.length > 0);

const colorsOf = (root: THREE.Object3D): number[] => {
  const out: number[] = [];
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m && 'color' in m) out.push((m as THREE.MeshLambertMaterial).color.getHex());
  });
  return out;
};
const partCount = (root: THREE.Object3D): number => {
  let n = 0;
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) n++; });
  return n;
};

describe('damage stages', () => {
  it('the mowers are breakable, with two stages each', () => {
    for (const id of ['ride-on-mower', 'push-mower-bike', 'zero-turn-mower', 'combine-harvester']) {
      const def = CATALOG.find((p) => p.id === id);
      expect(def, id).toBeDefined();
      expect(prefabDamageLevels(def!), id).toBe(2);
    }
  });

  for (const def of breakable) {
    describe(def.id, () => {
      const names = new Set<string>();
      for (const p of def.parts) { if (p.name) names.add(p.name); if (p.group) names.add(p.group); }

      it('stage data is well formed', () => {
        const seen = new Set<string>();
        for (const st of def.damage!) {
          expect(st.name.length).toBeGreaterThan(0);
          expect(seen.has(st.name), 'stage names differ').toBe(false);
          seen.add(st.name);
          for (const h of st.hide ?? []) expect(names.has(h), `hide '${h}' is a named part or group`).toBe(true);
          for (const k of Object.keys(st.morph ?? {})) expect(names.has(k), `morph '${k}' is a named part or group`).toBe(true);
          for (const p of st.add ?? []) {
            for (const n of [...p.d, ...(p.at ?? []), ...(p.rot ?? [])]) expect(Number.isFinite(n)).toBe(true);
            if (typeof p.c === 'string' && p.c !== 'tint' && p.c !== 'trim') expect(p.c in PALETTE).toBe(true);
          }
          if (st.darken !== undefined) expect(st.darken >= 0 && st.darken <= 1).toBe(true);
        }
      });

      it('builds at every level, finite, on the ground and about the same size', () => {
        const base = new THREE.Box3().setFromObject(buildPrefab(def));
        const baseSize = base.getSize(new THREE.Vector3());
        for (let lv = 0; lv <= def.damage!.length; lv++) {
          const box = new THREE.Box3().setFromObject(buildPrefab(def, { damage: lv }));
          const size = box.getSize(new THREE.Vector3());
          expect([box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite), `level ${lv} finite`).toBe(true);
          expect(box.min.y, `level ${lv} not buried`).toBeGreaterThan(-0.12);
          expect(box.min.y, `level ${lv} not floating`).toBeLessThan(0.05);
          expect(size.x, `level ${lv} width`).toBeLessThan(baseSize.x * 1.5);
          expect(size.z, `level ${lv} length`).toBeLessThan(baseSize.z * 1.5);
        }
      });

      it('each level looks different from the one before', () => {
        const sig = (lv: number): string => {
          const r = buildPrefab(def, { damage: lv });
          return `${partCount(r)}|${colorsOf(r).join(',')}|${JSON.stringify(r.children.map((c) => [c.position.y, c.rotation.z]))}`;
        };
        for (let lv = 1; lv <= def.damage!.length; lv++) expect(sig(lv), `level ${lv}`).not.toBe(sig(lv - 1));
      });

      it('wrecked soots the tint and trim colours', () => {
        const n = def.damage!.length;
        const fresh = resolveTintTrim(def);
        const worn = resolveTintTrim(damagedDef(def, n));
        const bright = (c: number): number => ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255);
        expect(bright(worn.tintHex)).toBeLessThan(bright(fresh.tintHex));
        expect(bright(worn.trimHex)).toBeLessThan(bright(fresh.trimHex));
      });

      it('a stage that hides a part really removes it', () => {
        const hidden = def.damage!.flatMap((s) => s.hide ?? []);
        const worn = damagedDef(def, def.damage!.length);
        for (const h of hidden) expect(worn.parts.some((p) => p.name === h || p.group === h), h).toBe(false);
      });
    });
  }

  it('level is clamped, and an unbreakable prefab ignores it', () => {
    const def = breakable[0];
    expect(buildPrefab(def, { damage: 99 }).userData.damage).toBe(def.damage!.length);
    expect(buildPrefab(def, { damage: -3 }).userData.damage).toBe(0);
    const plain = CATALOG.find((p) => !p.damage)!;
    expect(buildPrefab(plain, { damage: 2 }).userData.damage).toBe(0);
  });

  it('setPrefabDamage rebuilds in place: same root, scale and position, new pivots', () => {
    const root = buildPrefab('ride-on-mower', { tint: 0x2f64c9, scale: 1.5 });
    root.position.set(3, 0, 4);
    const wheelBefore = root.getObjectByName('wheel-1');
    expect(wheelBefore).toBeDefined();
    expect(setPrefabDamage(root, 2)).toBe(2);
    expect(root.scale.x).toBe(1.5);
    expect(root.position.x).toBe(3);
    expect(root.userData.damage).toBe(2);
    expect(root.getObjectByName('wheel-1')?.children.length ?? 0, 'the wrecked mower lost wheel-1').toBe(0);
    expect(root.getObjectByName('wheel-0')).toBeDefined();
    expect(setPrefabDamage(root, 0)).toBe(0);
    expect(root.getObjectByName('wheel-1')?.children.length, 'wheel-1 is back').toBeGreaterThan(0);
    // The same look as a fresh build (tint kept).
    expect(colorsOf(root).join()).toBe(colorsOf(buildPrefab('ride-on-mower', { tint: 0x2f64c9 })).join());
  });

  it('building at level 0 is untouched: same result as before damage existed', () => {
    const a = buildPrefab('ride-on-mower');
    const b = buildPrefab('ride-on-mower', { damage: 0 });
    expect(partCount(a)).toBe(partCount(b));
    expect(colorsOf(a).join()).toBe(colorsOf(b).join());
  });
});
