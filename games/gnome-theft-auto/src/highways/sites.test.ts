// The work-site dressing (sites.ts): enough pieces, colliders off the decks and inside their yards.
import { describe, expect, it } from 'vitest';
import { deckContactsAt } from './deck';
import { buildSkywaySites } from './sites';
import { SKYWAY_SITES } from './skyways';

describe('buildSkywaySites', () => {
  const { group, boxes } = buildSkywaySites();

  it('names its group and dresses every site and crack', () => {
    expect(group.name).toBe('skyway-sites');
    let pieces = 0;
    group.traverse((o) => {
      if (o !== group) pieces++;
    });
    expect(pieces).toBeGreaterThan(10);
    for (const site of SKYWAY_SITES) {
      expect(group.getObjectByName(`skyway-site-${site.id}`), site.id).toBeDefined();
    }
  });

  it('has colliders', () => {
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) expect(b.maxX).toBeGreaterThan(b.minX);
  });

  it('keeps every collider centre off the decks', () => {
    for (const b of boxes) {
      const cx = (b.minX + b.maxX) / 2;
      const cz = (b.minZ + b.maxZ) / 2;
      expect(deckContactsAt(cx, cz), `box at ${cx.toFixed(1)}, ${cz.toFixed(1)}`).toHaveLength(0);
    }
  });

  it('keeps every collider inside a site yard', () => {
    for (const b of boxes) {
      const cx = (b.minX + b.maxX) / 2;
      const cz = (b.minZ + b.maxZ) / 2;
      const inYard = SKYWAY_SITES.some(({ yard }) =>
        cx >= yard.minX && cx <= yard.maxX && cz >= yard.minZ && cz <= yard.maxZ);
      expect(inYard, `box at ${cx.toFixed(1)}, ${cz.toFixed(1)}`).toBe(true);
    }
  });
});
