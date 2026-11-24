import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { railGaps, deckSamples, skywayDefs } from './deck';
import { buildSkywayMeshes } from './mesh';

describe('skyway meshes', () => {
  const group = buildSkywayMeshes();

  it('builds a named group with meshes in it', () => {
    expect(group.name).toBe('skyways');
    expect(group.children.length).toBeGreaterThan(0);
  });

  it('every mesh has finite positions', () => {
    let meshes = 0;
    group.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      meshes++;
      const pos = o.geometry.getAttribute('position');
      expect(pos).toBeDefined();
      for (const v of pos.array) expect(Number.isNaN(v)).toBe(false);
    });
    expect(meshes).toBeGreaterThan(0);
  });

  const decks = (): THREE.Mesh[] => {
    const out: THREE.Mesh[] = [];
    group.traverse((o) => {
      if (o instanceof THREE.Mesh && /-deck-\d+$/.test(o.name)) out.push(o);
    });
    return out;
  };

  it('the deck top faces up', () => {
    const turfton = decks().filter((m) => m.name.startsWith('turfton-skyway-deck-'));
    expect(turfton.length).toBeGreaterThan(0);
    for (const deck of turfton) {
      const geo = deck.geometry as THREE.BufferGeometry;
      const top = geo.groups[0];
      const normals = geo.getAttribute('normal');
      const index = geo.getIndex()!;
      for (let i = top.start; i < top.start + top.count; i++) {
        expect(normals.getY(index.getX(i))).toBeGreaterThan(0.5);
      }
    }
  });

  it('no deck-top triangle anywhere has a downward normal', () => {
    let down = 0;
    for (const deck of decks()) {
      const geo = deck.geometry as THREE.BufferGeometry;
      const top = geo.groups[0];
      const normals = geo.getAttribute('normal');
      const index = geo.getIndex()!;
      for (let i = top.start; i < top.start + top.count; i++) {
        if (normals.getY(index.getX(i)) <= 0) down++;
      }
    }
    expect(down).toBe(0);
  });

  it('the foot slip roads are one mesh', () => {
    const slip = group.getObjectByName('skyway-slip-roads');
    expect(slip).toBeInstanceOf(THREE.Mesh);
  });

  it('no rail vertex lies inside a crack gap', () => {
    let inside = 0;
    for (const def of skywayDefs()) {
      const cracks = railGaps(def.id).filter((g) => g.kind === 'crack');
      if (cracks.length === 0) continue;
      // The rail line of each side (mid-rail, 0.15 m out from the deck edge), sampled every 0.5 m along.
      const half = def.width / 2;
      const samples = deckSamples(def.id, 0.5);
      const rail = (side: 1 | -1) => samples.map((s) => ({
        x: s.x + s.dirZ * side * (half + 0.15),
        z: s.z - s.dirX * side * (half + 0.15),
        along: s.along,
      }));
      const lines = { 1: rail(1), '-1': rail(-1) } as const;
      const nearest = (line: readonly { x: number; z: number; along: number }[], x: number, z: number) => {
        let best = line[0];
        let bestD = Infinity;
        for (const p of line) {
          const d = (p.x - x) ** 2 + (p.z - z) ** 2;
          if (d < bestD) { bestD = d; best = p; }
        }
        return { d: bestD, along: best.along };
      };
      group.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || !o.name.startsWith(`${def.id}-rails-`)) return;
        const pos = o.geometry.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const r = nearest(lines[1], x, z);
          const l = nearest(lines[-1], x, z);
          const side = r.d <= l.d ? 1 : -1;
          const along = side === 1 ? r.along : l.along;
          // 1 m of slack: the outer edge of a rail at a gentle joint (19 degrees, mitred) projects about 0.9 m further along.
          for (const g of cracks) {
            if (g.side === side && along >= g.from + 1 && along <= g.to - 1) inside++;
          }
        }
      });
    }
    expect(inside).toBe(0);
  });

  it('the group bounds cover the Turfton Skyway and contain (300, 7, -60)', () => {
    const box = new THREE.Box3().setFromObject(group);
    expect(box.min.x).toBeLessThanOrEqual(200);
    expect(box.max.x).toBeGreaterThanOrEqual(540);
    expect(box.containsPoint(new THREE.Vector3(300, 7, -60))).toBe(true);
  });
});
