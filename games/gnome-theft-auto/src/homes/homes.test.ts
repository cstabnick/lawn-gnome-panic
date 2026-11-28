// Homes table: every character has a home and a workplace, doors sit next to their sites, hidden homes stay hidden.
import { describe, expect, it } from 'vitest';
import { CAST } from '../quests/stages';
import { CITY_CAST } from '../city/cityCast';
import { siteRect, type SiteId } from '../sites';
import { HOMES, WORKS, homeDoor, homeOf, workOf } from './data';
import { HOME_DOORS } from './types';

describe('homes table', () => {
  it('every CAST id and CITY_CAST key has a home and a workplace', () => {
    const ids = [...CAST.map((c) => c.id), ...CITY_CAST.map((c) => c.key)];
    for (const id of ids) {
      expect(homeOf(id), `home of ${id}`).toBeDefined();
      expect(workOf(id), `work of ${id}`).toBeDefined();
    }
  });

  it('has no duplicate character ids', () => {
    expect(new Set(HOMES.map((h) => h.characterId)).size).toBe(HOMES.length);
    expect(new Set(WORKS.map((w) => w.characterId)).size).toBe(WORKS.length);
  });

  it('doors of homes on E01 home sites are near their site and outside it', () => {
    for (const h of HOMES) {
      if (!h.where || !(h.where.startsWith('home-') || h.where === 'saucer-court')) continue;
      expect(h.door, `door of ${h.characterId}`).not.toBeNull();
      const r = siteRect(h.where as SiteId);
      const [x, z] = h.door!;
      const dx = Math.max(r.minX - x, 0, x - r.maxX);
      const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
      const d = Math.hypot(dx, dz);
      expect(d, `${h.characterId} door distance`).toBeLessThanOrEqual(14);
      const onEdge = [r.minX, r.maxX].some((e) => Math.abs(x - e) < 1e-6) || [r.minZ, r.maxZ].some((e) => Math.abs(z - e) < 1e-6);
      // Saucer Court's exit stands in its open courtyard, inside the rectangle by design
      if (h.where !== 'saucer-court') expect(d >= 0.5 || onEdge, `${h.characterId} door outside site`).toBe(true);
    }
  });

  it('hidden homes are unacknowledged and have no door', () => {
    for (const h of HOMES.filter((x) => x.kind === 'hidden')) {
      expect(h.acknowledged).toBe(false);
      expect(h.door).toBeNull();
    }
  });

  it('homeDoor matches the fixed door table', () => {
    expect(homeDoor('juniper')).toEqual([HOME_DOORS.juniper[0], HOME_DOORS.juniper[1]]);
  });
});
