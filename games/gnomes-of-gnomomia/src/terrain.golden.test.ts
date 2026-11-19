/// <reference types="node" />
// Golden test for the terrain core (terrainCore.ts): the world's height, walking, flora, roads and colours, sampled at fixed points and hashed.
// The fixture (terrain.golden.json) was captured from terrain.ts BEFORE it became createTerrain(), so a refactor
// that keeps this passing has not changed the world. Regenerate it only for a deliberate change to the world:
//   GOLDEN_CAPTURE=1 npx vitest run -w games/gnomes-of-gnomomia src/terrain.golden.test.ts   (from the repo root, see README)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { WORLD } from './config';
import { OBJECTS, ZONES } from './content';
import { checkCondition } from './quests';
import { state } from './state';
import { createTerrain } from './terrainCore';

// A fresh analytic terrain, not the game's own instance: that one gets the baked walk grid installed.
const terrain = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition });
const {
  chunkFlora, deckLayout, findFreeSpot, groundColourAt, heightAt, isBlocked, isBlockedAt, passOpen, passes, regionNameAt,
  roadSegments, standY, surfacesAt, themeZoneAt, zoneAt,
} = terrain;

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(here, 'terrain.golden.json');

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sha = (s: string): string => createHash('sha1').update(s).digest('hex').slice(0, 16);
const f = (n: number | null): string => (n === null ? 'null' : n.toFixed(9));

const OUTDOOR = Object.values(ZONES).filter((z) => !z.indoor);
/** Interiors and the Deeps are instances far south of the overworld. */
const INSTANCES = ['deeps', 'mossbottom/schoolroom', 'thatchford/guildhall', 'keep/royal-archive'] as const;

/** Fixed sample points: the same list every run. */
function samplePoints(): { name: string; pts: [number, number][] }[] {
  const out: { name: string; pts: [number, number][] }[] = [];
  let seed = 1;
  for (const def of OUTDOOR) {
    const r = rng(seed++);
    const o = def.origin!;
    const span = def.half + 60;
    const pts: [number, number][] = [];
    for (let i = 0; i < 500; i++) pts.push([o.x + (r() * 2 - 1) * span, o.z + (r() * 2 - 1) * span]);
    out.push({ name: `zone:${def.id}`, pts });
  }
  for (const id of INSTANCES) {
    const def = ZONES[id as keyof typeof ZONES];
    const r = rng(seed++);
    const o = def.origin!;
    const span = def.half + 4;
    const pts: [number, number][] = [];
    for (let i = 0; i < 200; i++) pts.push([o.x + (r() * 2 - 1) * span, o.z + (r() * 2 - 1) * span]);
    out.push({ name: `instance:${id}`, pts });
  }
  {
    const r = rng(900);
    const pts: [number, number][] = [];
    for (const s of roadSegments()) {
      for (let i = 0; i < 12; i++) {
        const t = r();
        pts.push([s.ax + (s.bx - s.ax) * t + (r() * 2 - 1) * 6, s.az + (s.bz - s.az) * t + (r() * 2 - 1) * 6]);
      }
    }
    out.push({ name: 'roads', pts });
  }
  {
    const r = rng(901);
    const pts: [number, number][] = [];
    for (const d of deckLayout()) {
      for (let i = 0; i < 40; i++) pts.push([d.ramp.minX - 6 + r() * (d.ramp.maxX - d.ramp.minX + 12), d.ramp.minZ - 6 + r() * (d.ramp.maxZ - d.ramp.minZ + 12)]);
      for (let i = 0; i < 40; i++) pts.push([d.deck.x + (r() * 2 - 1) * (d.deck.w / 2 + 3), d.deck.z + (r() * 2 - 1) * (d.deck.d / 2 + 3)]);
    }
    out.push({ name: 'decks', pts });
  }
  return out;
}

/** Marks every quest a pass gate asks about as done, so every pass is open. */
function openAllGates(): void {
  const ids = new Set<string>();
  const walk = (c: unknown): void => {
    if (!c || typeof c !== 'object') return;
    const o = c as { quest?: { id: string }; questAtLeast?: { id: string }; questStage?: { id: string }; not?: unknown };
    if (o.quest) ids.add(o.quest.id);
    if (o.questAtLeast) ids.add(o.questAtLeast.id);
    if (o.questStage) ids.add(o.questStage.id);
    walk(o.not);
  };
  for (const def of Object.values(ZONES)) for (const e of def.exits) walk(e.when);
  for (const id of ids) state.quests[id] = { stage: 99, count: 0, done: true };
}

interface Golden {
  [key: string]: string | number;
}

function capture(): Golden {
  const g: Golden = {};
  const sets = samplePoints();
  // Quest-independent queries (first, gates closed: nothing has been started).
  for (const { name, pts } of sets) {
    g[`height|${name}`] = sha(pts.map(([x, z]) => f(heightAt(x, z))).join(','));
    g[`zone|${name}`] = sha(pts.map(([x, z]) => `${zoneAt(x, z)}/${themeZoneAt(x, z).id}`).join(','));
    g[`colour|${name}`] = sha(pts.map(([x, z]) => groundColourAt(x, z)).join(','));
    g[`region|${name}`] = sha(pts.map(([x, z]) => regionNameAt(x, z)).join(','));
    g[`surfaces|${name}`] = sha(pts.map(([x, z]) => surfacesAt(x, z).map(f).join('/')).join(','));
    g[`standY|${name}`] = sha(pts.map(([x, z]) => `${f(standY(x, z, heightAt(x, z)))}:${f(standY(x, z, heightAt(x, z) + 3))}`).join(','));
    g[`blockedAt|${name}`] = sha(pts.map(([x, z]) => `${isBlockedAt(x, z, heightAt(x, z) + 3) ? 1 : 0}`).join(','));
    g[`free|${name}`] = sha(pts.slice(0, 40).map(([x, z]) => { const p = findFreeSpot(x, z); return `${f(p.x)}/${f(p.z)}`; }).join(','));
  }
  g.roads = sha(roadSegments().map((s) => [s.ax, s.az, s.bx, s.bz].map(f).join('/')).join(','));
  g.decks = sha(deckLayout().map((d) => `${d.deck.x}/${d.deck.z}/${f(d.top)}`).join(','));
  g.passCount = passes().length;
  for (const { name, pts } of sets) g[`blocked-closed|${name}`] = sha(pts.map(([x, z]) => (isBlocked(x, z) ? 1 : 0)).join(''));
  g['open-closed'] = passes().map((p) => (passOpen(p) ? 1 : 0)).join('');
  // Flora: a block of chunks around each outdoor zone's centre.
  const C = WORLD.chunk;
  for (const def of OUTDOOR) {
    const ci0 = Math.floor(def.origin!.x / C), cj0 = Math.floor(def.origin!.z / C);
    const rows: string[] = [];
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      rows.push(chunkFlora(ci0 + i, cj0 + j).map((fl) => `${fl.kind}/${f(fl.x)}/${f(fl.y)}/${f(fl.z)}/${f(fl.s)}/${f(fl.rot)}`).join(';'));
    }
    g[`flora|${def.id}`] = sha(rows.join('|'));
  }
  // The same walking queries with every gate open.
  openAllGates();
  g['open-open'] = passes().map((p) => (passOpen(p) ? 1 : 0)).join('');
  for (const { name, pts } of sets) g[`blocked-open|${name}`] = sha(pts.map(([x, z]) => (isBlocked(x, z) ? 1 : 0)).join(''));
  return g;
}

describe('terrain golden', () => {
  it('matches the captured fixture', () => {
    const got = capture();
    if (process.env.GOLDEN_CAPTURE) {
      writeFileSync(FIXTURE, JSON.stringify(got, null, 1) + '\n');
      return;
    }
    expect(existsSync(FIXTURE)).toBe(true);
    const want = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Golden;
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
    for (const k of Object.keys(want)) expect([k, got[k]]).toEqual([k, want[k]]);
  });
});
