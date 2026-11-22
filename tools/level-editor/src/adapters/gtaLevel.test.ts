// Gnome Theft Auto's region documents in the level editor: every region survives a round trip byte for byte, the ground colours
// show roads, and the walk points get ids no marker has.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { REGION_DOCS, REGION_IDS } from '@gta/levels';
import { GTA_COLLECTIONS } from './gtaProfile';
import { PAINT_COLOUR, TRAIL_COLOUR, docToLevel, groundColourAt, levelToDoc, type GtaLevel } from './gtaLevel';

const here = dirname(fileURLToPath(import.meta.url));
const levelsDir = resolve(here, '../../../../games/gnome-theft-auto/src/data/levels');
const ROAD = 0x55555b;
const OUTSIDE = 0x2a2e36;
const WATER = 0x3d8fd6;

describe('Gnome Theft Auto regions in the level editor', () => {
  for (const id of REGION_IDS) {
    it(`${id}: the document is saved byte for byte when nothing is edited`, () => {
      const text = readFileSync(resolve(levelsDir, `${id}.level.json`), 'utf8');
      expect(JSON.stringify(levelToDoc(docToLevel(REGION_DOCS[id])), null, 2) + '\n').toBe(text);
    });
  }

  it('a road colour shows on a highway point and a ground colour away from it', () => {
    const level = docToLevel(REGION_DOCS['dust-flats']);
    const road = level.paths.find((p) => p.kind === 'road')!;
    const [x, z] = road.points[0];
    expect(groundColourAt(level, x, z)).toBe(ROAD);
    expect(groundColourAt(level, -100, 0)).toBe(level.data.ground);
  });

  it('the reserved river shows as water on the ground, and the border polygon is dark outside it', () => {
    const level = docToLevel(REGION_DOCS['mossy-wood']);
    const river = level.paths.find((p) => p.id === 'river-ravine')!;
    const [x, z] = river.points[0];
    expect(groundColourAt(level, x, z)).toBe(WATER);
    expect(groundColourAt(level, -450, -550)).toBe(OUTSIDE);
    expect(groundColourAt(level, -100, 0)).toBe(level.data.ground);
  });

  it('loch-moss and tallgrass-commons are regions', () => {
    expect(REGION_IDS).toContain('loch-moss');
    expect(REGION_IDS).toContain('tallgrass-commons');
    for (const id of ['loch-moss', 'tallgrass-commons'] as const) {
      const doc = docToLevel(REGION_DOCS[id]);
      expect(doc.w).toBe(600);
      expect(doc.d).toBe(600);
    }
  });

  it('a Turfton grid line shows as road, and the ground away from it is the ground colour', () => {
    const level = docToLevel(REGION_DOCS.turfton);
    expect(groundColourAt(level, 0, 50)).toBe(ROAD);
    expect(groundColourAt(level, 30, 30)).toBe(level.data.ground);
  });

  it('outside the bounds is dark', () => {
    const level = docToLevel(REGION_DOCS.turfton);
    expect(groundColourAt(level, level.w / 2 + 50, 0)).toBe(OUTSIDE);
  });

  it('the walks collection gives a new walk point an id no marker has', () => {
    const level = docToLevel(REGION_DOCS.turfton) as GtaLevel;
    const walks = GTA_COLLECTIONS.find((c) => c.id === 'walks')!;
    const made = walks.makeIn!(level as never, 1, 2, 0);
    const ids = new Set(level.markers.map((m) => m.id));
    expect(ids.has(String(made.id))).toBe(false);
    expect(made).toMatchObject({ kind: 'walk', x: 1, z: 2 });
  });

  it('a trail shows in the dirt colour, not the road colour', () => {
    const level = docToLevel(REGION_DOCS['dust-flats']);
    level.paths.push({ id: 'trail/test', kind: 'road', points: [[300, 300], [320, 300]], width: 4 } as never);
    expect(groundColourAt(level, 310, 300)).toBe(TRAIL_COLOUR);
  });

  it('a game paint shows in its colour, and an unpainted spot is the ground colour', () => {
    const level = docToLevel(REGION_DOCS['dust-flats']);
    expect(groundColourAt(level, -100, 0, () => 'rock')).toBe(PAINT_COLOUR.rock);
    expect(groundColourAt(level, -100, 0, () => null)).toBe(level.data.ground);
  });
});
