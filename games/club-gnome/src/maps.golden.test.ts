/// <reference types="node" />
// Golden test for Club Gnome's maps: every map hashed (and its list sizes counted) as plain data. The fixture was captured
// from maps.ts BEFORE the maps moved into level documents, so a migration that keeps this passing has not changed a map.
// Regenerate only for a deliberate change to a map:  GOLDEN_CAPTURE=1 npx vitest run --root games/club-gnome src/maps.golden.test.ts
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MAP_IDS } from './config';
import { MAPS } from './maps';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'maps.golden.json');

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => [k, canon(o[k])]));
  }
  return typeof v === 'number' ? Math.round(v * 1e9) / 1e9 : v;
}
const hash = (v: unknown): string => createHash('sha1').update(JSON.stringify(canon(v))).digest('hex').slice(0, 16);

function capture(): Record<string, string | number> {
  const g: Record<string, string | number> = {};
  for (const id of MAP_IDS) {
    const m = MAPS[id];
    g[`${id}|map`] = hash(m);
    for (const k of ['buildings', 'props', 'blockers', 'portals', 'spots', 'seats', 'counters', 'signs', 'patches'] as const) {
      g[`${id}|${k}|count`] = (m[k] ?? []).length;
      g[`${id}|${k}`] = hash(m[k] ?? []);
    }
  }
  return g;
}

describe('club gnome maps golden', () => {
  it('matches the captured fixture', () => {
    const got = capture();
    if (process.env.GOLDEN_CAPTURE) { writeFileSync(FIXTURE, JSON.stringify(got, null, 1) + '\n'); return; }
    expect(existsSync(FIXTURE)).toBe(true);
    const want = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, string | number>;
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
    for (const k of Object.keys(want)) expect([k, got[k]]).toEqual([k, want[k]]);
  });
});
