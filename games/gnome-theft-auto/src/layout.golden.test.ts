// The golden layout test: builds the whole world the way the game does (fixed seed) and compares everything it produces
// with src/data/layout.golden.json, captured from the code before the world moved into level documents. It must pass
// with the fixture unedited: a difference means the world looks or plays differently.
//
// Regenerate the fixture ONLY on purpose (a deliberate layout change, agreed in a roadmap):
//   UPDATE_GOLDEN=1 npx vitest run src/layout.golden.test.ts      (from games/gnome-theft-auto)
// To look at a change without touching the fixture, write the snapshot somewhere else and compare the two files:
//   GOLDEN_OUT=/some/temp/now.json npx vitest run src/layout.golden.test.ts
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { installFakeDom } from './testing/fakeDom';
import { diffSnapshots, snapshotLayout, type Batch } from './testing/captureLayout';

const cap = vi.hoisted(() => ({ batches: [] as { name: string; items: StaticPrefabPlacement[] }[] }));
vi.mock('@lawn/prefabs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@lawn/prefabs')>();
  return {
    ...mod,
    buildStaticPrefabs: (placements: readonly StaticPrefabPlacement[], opts?: { name?: string }) => {
      // One cell of a buildStaticCells batch ("forest-scenery:3,-1"): the whole batch was captured below.
      if (!opts?.name?.includes(':')) cap.batches.push({ name: opts?.name ?? '', items: placements.map((p) => ({ ...p })) });
      return mod.buildStaticPrefabs(placements, opts);
    },
  };
});
// Scenery batches are split per cell for culling (cull.ts buildStaticCells): capture each batch whole, as before.
vi.mock('./cull', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./cull')>();
  return {
    ...mod,
    buildStaticCells: (placements: readonly StaticPrefabPlacement[], opts?: Parameters<typeof mod.buildStaticCells>[1]) => {
      cap.batches.push({ name: opts?.name ?? '', items: placements.map((p) => ({ ...p })) });
      return mod.buildStaticCells(placements, opts);
    },
  };
});

// node:fs is loaded untyped: the game's tsconfig has no node types (the browser build never sees this file).
const FIXTURE = new URL('./data/layout.golden.json', import.meta.url);
const NODE_FS = 'node:fs';
type Fs = { readFileSync(p: URL, enc: 'utf8'): string; writeFileSync(p: URL, text: string): void };
const ENV = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const UPDATE = ENV.UPDATE_GOLDEN === '1';
const OUT = ENV.GOLDEN_OUT;

async function capture(): Promise<unknown> {
  installFakeDom();
  const cfg = await import('./config');
  const { GIVERS } = await import('./quests/defs');
  const { buildWorld } = await import('./world');
  cap.batches.length = 0;
  const scene = new THREE.Scene();
  const world = buildWorld(scene, null as unknown as THREE.WebGLRenderer);
  const biomeSamples: string[] = [];
  for (let z = -cfg.WORLD_HALF; z <= cfg.WORLD_HALF; z += 25) {
    let row = '';
    for (let x = -cfg.WORLD_HALF; x <= cfg.WORLD_HALF; x += 25) row += cfg.biomeAt(x, z)[0];
    biomeSamples.push(row);
  }
  const layout = {
    worldHalf: cfg.WORLD_HALF, cityHalf: cfg.CITY_HALF, roadLines: cfg.ROAD_LINES, roadWidth: cfg.ROAD_WIDTH,
    roadPitch: cfg.ROAD_PITCH, biomes: cfg.BIOMES, biomeNames: cfg.BIOME_NAMES, biomeGround: cfg.BIOME_GROUND, biomeSamples,
    highways: cfg.HIGHWAYS, base: cfg.BASE, airfield: cfg.AIRFIELD, spawn: cfg.SPAWN,
    landmarks: {
      mulchClub: cfg.MULCH_CLUB, hospital: cfg.HOSPITAL, bodega: cfg.BODEGA, sideValve: cfg.SIDE_VALVE,
      payNGlaze: cfg.PAY_N_GLAZE, gnomecino: cfg.GNOMECINO, thorneTower: cfg.THORNE_TOWER, clayMart: cfg.CLAY_MART,
      amphitheater: cfg.AMPHITHEATER, patioHeights: cfg.PATIO_HEIGHTS, greenhouseStrip: cfg.GREENHOUSE_STRIP,
      gnomaTruck: cfg.GNOMA_TRUCK, culvertPortals: cfg.CULVERT_PORTALS,
    },
    places: cfg.PLACES,
  };
  return snapshotLayout(scene, world, cap.batches as Batch[], layout, GIVERS as unknown as Record<string, unknown>);
}

describe('golden layout', () => {
  it('builds exactly the world in layout.golden.json', async () => {
    const fs = (await import(/* @vite-ignore */ NODE_FS)) as Fs;
    const now = await capture();
    if (OUT) {
      fs.writeFileSync(new URL(`file:///${OUT.replace(/\\/g, '/').replace(/^\/+/, '')}`), JSON.stringify(now) + '\n');
      return;
    }
    if (UPDATE) {
      fs.writeFileSync(FIXTURE, JSON.stringify(now) + '\n');
      return;
    }
    const golden = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    const diffs = diffSnapshots(now, golden);
    expect(diffs, diffs.join('\n')).toEqual([]);
  }, 120_000);
});
