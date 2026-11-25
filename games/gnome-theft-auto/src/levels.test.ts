// The region documents and the layout file: valid, complete and consistent.
import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import {
  GENERATORS, LAYOUT, REGION_DOCS, REGION_IDS, REGIONS, biomeAtPoint, highways, inPolygon, markersOf, regionAt, regionAtExact,
  regionDocProblems, waterBodies, waterPaths,
} from './levels';

describe('region documents', () => {
  it('every region in the layout has a valid document, and every document is in the layout', () => {
    expect(new Set(REGION_IDS)).toEqual(new Set(Object.keys(REGION_DOCS)));
    for (const id of REGION_IDS) expect(regionDocProblems(REGION_DOCS[id]), id).toEqual([]);
  });

  it('each document is named after its file and names the generator the code implements', () => {
    for (const id of REGION_IDS) {
      const doc = REGION_DOCS[id];
      expect(doc.id).toBe(id);
      expect({ id: doc.base.id, version: doc.base.version }).toEqual(GENERATORS[id]);
      expect(Number.isInteger(doc.base.seed)).toBe(true);
    }
  });

  it('one region per biome, and exactly one Turfton with the city grid', () => {
    const biomes = REGION_IDS.map((id) => REGION_DOCS[id].data.region);
    expect(new Set(biomes).size).toBe(biomes.length);
    const city = REGION_IDS.filter((id) => REGION_DOCS[id].data.grid);
    expect(city).toEqual(['turfton']);
    expect(REGION_DOCS.turfton.data.kerbSeed).toBeTypeOf('number');
  });

  it('every prop is a known prefab', () => {
    for (const id of REGION_IDS) {
      for (const p of REGION_DOCS[id].props) expect(getPrefab(p.prefab), `${id}: ${p.prefab}`).toBeTruthy();
    }
  });

  it('marker ids are unique across the whole world (walk points only within their region)', () => {
    const ids = REGION_IDS.flatMap((id) => REGION_DOCS[id].markers.map((m) => (m.kind === 'walk' ? `${id}/${m.id}` : `${m.kind}:${m.id}`)));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('road ids are unique across regions, and every highway the layout lists exists', () => {
    const roads = REGION_IDS.flatMap((id) => REGION_DOCS[id].paths.map((p) => p.id));
    expect(new Set(roads).size).toBe(roads.length);
    for (const h of LAYOUT.highways) expect(roads, h).toContain(h);
    expect(highways().slice(0, LAYOUT.highways.length).map((h) => h.id)).toEqual(LAYOUT.highways);
  });

  it('world coordinates are the document coordinates moved by the origin', () => {
    const r = REGIONS['dust-flats'];
    const doc = REGION_DOCS['dust-flats'];
    expect(r.markers[0].x).toBe(doc.markers[0].x + r.origin.x);
    expect(r.props[0].z).toBe(doc.props[0].z + r.origin.z);
    expect(markersOf('site').map((m) => m.id).sort()).toEqual(['airfield', 'fort-sandpit']);
  });
});

// ---- The 2800 x 2800 map (Wild World epic 3, grown by GTA batch 3 E01) --------------------------------------------
/** The pre-expansion rule, kept here only to prove the borders reproduce it inside the old 1200 x 1200 world. */
function oldBiomeAt(x: number, z: number): string {
  if (Math.abs(x) <= 215 && Math.abs(z) <= 215) return 'city';
  if (Math.abs(x) >= Math.abs(z)) return x > 0 ? 'desert' : 'forest';
  return z < 0 ? 'tundra' : 'farmland';
}
/** A small seeded PRNG for the sampling tests. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function crossing(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): [number, number] | null {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + t * r[0], a[1] + t * r[1]] : null;
}

describe('the region map', () => {
  it('the world is 3600 x 3600 with the fence 5 inside the edge', () => {
    expect(LAYOUT.worldHalf).toBe(1800);
    expect(LAYOUT.fenceEdge).toBe(1795);
  });

  it('inside the old 1800 x 1800 square no point is in a batch-3 band, and every point outside it is', () => {
    const BANDS = ['north-highlands', 'south-shore', 'east-campus', 'west-estates', 'pardonlin', 'the-unmown'];
    const rnd = lcg(11);
    for (let i = 0; i < 20000; i++) {
      const x = (rnd() * 2 - 1) * 1800, z = (rnd() * 2 - 1) * 1800;
      const old = Math.abs(x) <= 900 && Math.abs(z) <= 900;
      expect(BANDS.includes(regionAt(x, z)), `${x}, ${z}`).toBe(!old);
    }
    expect(regionAt(0, -1200)).toBe('north-highlands');
    expect(regionAt(1300, -1300)).toBe('north-highlands');
    expect(regionAt(0, 1200)).toBe('south-shore');
    expect(regionAt(1200, 0)).toBe('east-campus');
    expect(regionAt(-1200, 0)).toBe('west-estates');
    expect(regionAt(900, 0)).toBe('dust-flats');
    // E28: the next yard west (Pardonlin), the preserve in the north-west (the Unmown), and the bands pushed out.
    expect(regionAt(-1600, 0)).toBe('pardonlin');
    expect(regionAt(-1600, 1050)).toBe('pardonlin');
    expect(regionAt(-1600, 1200)).toBe('south-shore');
    expect(regionAt(-1600, -1200)).toBe('the-unmown');
    expect(regionAt(-1000, -1600)).toBe('the-unmown');
    expect(regionAt(0, -1600)).toBe('north-highlands');
    expect(regionAt(1600, -1600)).toBe('north-highlands');
    expect(regionAt(1600, -1200)).toBe('north-highlands');
    expect(regionAt(1600, 0)).toBe('east-campus');
    expect(regionAt(1600, 1050)).toBe('east-campus');
    expect(regionAt(1600, 1600)).toBe('south-shore');
    expect(regionAt(0, 1700)).toBe('south-shore');
    expect(regionAt(-1300, 0)).toBe('west-estates');
  });

  it('inside the old 1200 x 1200 world every point keeps its old biome (edges and diagonals included)', () => {
    const rnd = lcg(42);
    for (let i = 0; i < 40000; i++) {
      const x = (rnd() * 2 - 1) * 600, z = (rnd() * 2 - 1) * 600;
      expect(biomeAtPoint(x, z), `${x}, ${z}`).toBe(oldBiomeAt(x, z));
    }
    for (let x = -600; x <= 600; x += 5) {
      for (let z = -600; z <= 600; z += 5) {
        if (biomeAtPoint(x, z) !== oldBiomeAt(x, z)) expect(`${x}, ${z}: ${biomeAtPoint(x, z)}`).toBe(oldBiomeAt(x, z));
      }
    }
  });

  it('the borders tile the map: every point is in some border, and the raster agrees with the exact test', () => {
    const rnd = lcg(7);
    for (let i = 0; i < 40000; i++) {
      const x = (rnd() * 2 - 1) * 1800, z = (rnd() * 2 - 1) * 1800;
      expect(REGION_IDS.some((id) => inPolygon(REGIONS[id].border, x, z)), `${x}, ${z}`).toBe(true);
      expect(regionAt(x, z)).toBe(regionAtExact(x, z));
    }
    expect(regionAt(-800, -800)).toBe('loch-moss');
    expect(regionAt(-450, -750)).toBe('loch-moss');
    expect(regionAt(-750, -450)).toBe('loch-moss');
    expect(regionAt(-800, 800)).toBe('tallgrass-commons');
    expect(regionAt(-450, 750)).toBe('tallgrass-commons');
    expect(regionAt(800, -500)).toBe('dust-flats');
    expect(regionAt(500, -800)).toBe('frostbite-fells');
    expect(regionAt(0, 0)).toBe('turfton');
    expect(regionAt(215, 215)).toBe('turfton');
    expect(regionAt(5000, 0)).toBe('east-campus');
  });

  it('the old highways reach the new edges, and the spurs end inside Loch Moss and Tallgrass Commons', () => {
    const end = (id: string) => highways().find((h) => h.id === id)!.points.at(-1)!;
    expect(end('east-outer')[0]).toBe(870);
    expect(end('west-outer')[0]).toBe(-870);
    expect(end('north-outer')[1]).toBe(-870);
    expect(end('south-outer')[1]).toBe(870);
    expect(regionAt(...end('loch-spur'))).toBe('loch-moss');
    expect(regionAt(...end('commons-spur'))).toBe('tallgrass-commons');
    // Each extension starts on its old highway's last vertex, so the road graph joins them.
    const start = (id: string) => highways().find((h) => h.id === id)!.points[0];
    expect(start('east-outer')).toEqual(end('east'));
    expect(start('west-outer')).toEqual(end('west'));
    expect(start('north-outer')).toEqual(end('north'));
    expect(start('south-outer')).toEqual(end('south'));
    // Batch 3 (E01): each outer highway runs on into its band, and the band roads close a ring round the old square.
    expect(start('north-band')).toEqual(end('north-outer'));
    expect(start('east-band')).toEqual(end('east-outer'));
    expect(start('south-band')).toEqual(end('south-outer'));
    expect(start('west-band')).toEqual(end('west-outer'));
    // E28 turned the west and east band junctions into roundabouts: the band roads now run on from the ring.
    expect(end('north-band')).toEqual(end('west-band-north'));
    expect(end('north-band-east')).toEqual(end('east-band-north'));
    expect(end('east-band-south')).toEqual(end('south-band-east'));
    expect(end('west-band-south')).toEqual(end('south-band'));
    for (const id of ['north-band', 'north-band-east', 'east-band', 'east-band-south', 'runway-spur', 'south-band', 'south-band-east', 'coast-spur', 'west-band', 'west-band-south', 'west-band-north', 'east-band-north', 'vineyard-lane', 'unmown-road', 'harbour-road']) {
      for (const [x, z] of highways().find((h) => h.id === id)!.points) {
        expect(Math.max(Math.abs(x), Math.abs(z)), `${id} stays inside the fence`).toBeLessThan(LAYOUT.fenceEdge - 20);
      }
    }
  });

  it('the reserved river is one connected course from the Basin to the Puddle Sea, crossing roads only at the five bridges', () => {
    const w = waterPaths();
    expect(w.map((p) => p.id)).toEqual(['river-ravine', 'river-upper', 'canal', 'river-farm', 'thymes']);
    const byId = Object.fromEntries(w.map((p) => [p.id, p.points]));
    expect(byId['river-ravine'].at(-1)).toEqual(byId.canal[0]);
    expect(byId.canal.at(-1)).toEqual(byId['river-farm'][0]);
    expect(byId['river-upper'][0]).toEqual([0, -350]);
    const bodies = Object.fromEntries(waterBodies().map((b) => [b.id, b]));
    const inBody = (id: string, [x, z]: [number, number]) => {
      const b = bodies[id];
      return x >= b.minX - 20 && x <= b.maxX + 20 && z >= b.minZ - 20 && z <= b.maxZ + 20;
    };
    expect(inBody('water/loch-moss', byId['river-upper'].at(-1)!)).toBe(true);
    expect(inBody('water/loch-moss', byId['river-ravine'][0])).toBe(true);
    expect(inBody('water/puddle-sea', byId['river-farm'].at(-1)!)).toBe(true);
    const bridges: string[] = [];
    for (const p of w.filter((q) => q.id !== 'thymes')) {
      for (const h of highways()) {
        for (let i = 0; i + 1 < p.points.length; i++) {
          for (let j = 0; j + 1 < h.points.length; j++) {
            if (crossing(p.points[i], p.points[i + 1], h.points[j], h.points[j + 1])) bridges.push(`${p.id} x ${h.id}`);
          }
        }
      }
    }
    expect([...new Set(bridges)].sort()).toEqual(['canal x south', 'river-farm x ring-se', 'river-ravine x ring-sw', 'river-ravine x west', 'river-upper x ring-nw']);
  });
});
