import * as THREE from 'three';
import { DeltaGrid, PaintGrid } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import { TUNING, WORLD } from '../config';
import { OBJECTS, QUESTS, ZONES } from '../content';
import { findPath, findPath3 } from '../pathfind';
import { checkCondition } from '../quests';
import { state } from '../state';
import { createTerrain } from '../terrainCore';
import { loadWalkGrid } from '../walkBake';
import { loadWorldDeltas } from '../worldDeltas';
import { loadWorldPaint } from '../worldPaint';
import { ROAD_COST_TAG, getKernelRuntime, initGnomomiaWasm, type TaggedRoadCost } from './terrainWasm';

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

describe('Wasm kernel parity', () => {
  it('matches TS heightAt, standY, isBlocked and groundColourAt across zones, interiors, deltas, paint and stamps', async () => {
    await initGnomomiaWasm();
    const rt = getKernelRuntime()!;
    expect(rt).not.toBeNull();

    const zones = structuredClone(ZONES);
    zones.mossbottom.stamps = [
      ...(zones.mossbottom.stamps ?? []),
      { op: 'gauss', x: 25, z: 25, sigma: 6, amount: 3.5 },
      { op: 'flatten', x: -35, z: 35, inner: 4, outer: 10, to: 4.2 },
    ];
    const t = createTerrain({ zones, objects: OBJECTS, checkCondition });
    const deltas = loadWorldDeltas() ?? new DeltaGrid();
    deltas.setUnits(12, -14, 135);
    t.setDeltas(deltas);
    const paint = loadWorldPaint() ?? new PaintGrid();
    paint.set(18, -18, 3);
    t.setPaint(paint);
    t.addCollider(14, 14, 1.5);

    // Prime Wasm sync via a dummy 1-step path query
    findPath3({ x: 3, y: t.heightAt(3, 3), z: 3 }, { x: 4, y: t.heightAt(4, 3), z: 3 }, t.standY, 8);
    // Sync paint via minimap build
    t.buildMinimapPixels(0, -64, 64, 32, TUNING.waterLevel);

    const r = rng(1337);
    const sampleZones = ['mossbottom', 'thatchford', 'keep', 'deeps', 'mossbottom/schoolroom'] as const;
    for (const zid of sampleZones) {
      const def = zones[zid as keyof typeof zones];
      const o = def.origin ?? { x: 0, z: 0 };
      const span = def.half + (def.indoor ? 4 : 50);
      for (let i = 0; i < 150; i++) {
        const x = o.x + (r() * 2 - 1) * span;
        const z = o.z + (r() * 2 - 1) * span;
        const jsH = t.heightAt(x, z);
        const wasmH = rt.ex.heightAt(x, z);
        expect(wasmH).toBeCloseTo(jsH, 12);

        const jsBlk = t.isBlocked(x, z);
        const wasmBlk = rt.ex.isBlocked(x, z) !== 0;
        expect(wasmBlk).toBe(jsBlk);

        for (const dy of [0, 3]) {
          const jsStand = t.standY(x, z, jsH + dy);
          const wasmStand = rt.ex.standY(x, z, jsH + dy);
          if (jsStand === null) expect(Number.isNaN(wasmStand)).toBe(true);
          else expect(wasmStand).toBeCloseTo(jsStand, 12);
        }

        const jsCol = t.groundColourAt(x, z);
        const wasmCol = rt.ex.groundColourAt(x, z);
        expect(wasmCol).toBe(jsCol);
      }
    }
  });

  it('builds chunk mesh buffers matching Three.js PlaneGeometry + toNonIndexed + Color.setHex + computeVertexNormals', () => {
    const t = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => true });
    const deltas = loadWorldDeltas();
    if (deltas) t.setDeltas(deltas);
    const paint = loadWorldPaint();
    if (paint) t.setPaint(paint);

    const C = WORLD.chunk;
    const n = 32;
    const cx = 32, cz = -208;
    const wasmBufs = t.buildChunkBuffers(cx, cz, C, n)!;
    expect(wasmBufs).not.toBeNull();

    const indexed = new THREE.PlaneGeometry(C, C, n, n).rotateX(-Math.PI / 2).translate(cx, 0, cz);
    const grid = indexed.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < grid.count; i++) grid.setY(i, t.heightAt(grid.getX(i), grid.getZ(i)));
    const geo = indexed.toNonIndexed();
    indexed.dispose();
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const tmpColour = new THREE.Color();
    const colours = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i += 3) {
      const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
      const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      tmpColour.setHex(t.groundColourAt(x, z));
      for (let k = 0; k < 3; k++) {
        colours[(i + k) * 3] = tmpColour.r;
        colours[(i + k) * 3 + 1] = tmpColour.g;
        colours[(i + k) * 3 + 2] = tmpColour.b;
      }
    }
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const nrm = geo.getAttribute('normal') as THREE.BufferAttribute;

    expect(wasmBufs.positions.length).toBe(pos.array.length);
    expect(wasmBufs.minY).toBeCloseTo(geo.boundingBox!.min.y, 5);
    expect(wasmBufs.maxY).toBeCloseTo(geo.boundingBox!.max.y, 5);
    for (let i = 0; i < wasmBufs.positions.length; i += 97) {
      expect(wasmBufs.positions[i]).toBeCloseTo(pos.array[i], 5);
      expect(wasmBufs.normals[i]).toBeCloseTo(nrm.array[i], 5);
      expect(wasmBufs.colors[i]).toBeCloseTo(colours[i], 5);
    }
    geo.dispose();
  });

  it('builds minimap RGBA pixels matching reference heightAt + groundColourAt', () => {
    const t = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => true });
    const px = t.buildMinimapPixels(-64, -64, 64, 32, TUNING.waterLevel)!;
    expect(px.length).toBe(1024);
    for (let py = 0; py < 32; py++) {
      const wz = -64 + (py + 0.5) * 2;
      for (let x = 0; x < 32; x++) {
        const wx = -64 + (x + 0.5) * 2;
        const got = px[py * 32 + x];
        if (t.heightAt(wx, wz) < TUNING.waterLevel) {
          expect(got).toBe(0xff9f6a2d);
        } else {
          const hex = t.groundColourAt(wx, wz);
          const want = (0xff000000 | ((hex & 255) << 16) | (((hex >> 8) & 255) << 8) | ((hex >> 16) & 255)) >>> 0;
          expect(got).toBe(want);
        }
      }
    }
  });

  it('matches road-biased and unscaled findPath3 results and handles 2D terrain findPath', () => {
    for (const id of Object.keys(QUESTS)) state.quests[id] = { stage: 99, count: 0, done: true };
    const t = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition });
    const walk = loadWalkGrid();
    if (walk) t.setWalkGrid(walk);

    const from = { x: 3, y: t.heightAt(3, 3), z: 3 };
    const goal = { x: 0, y: t.heightAt(0, -240), z: -240 };

    const taggedCost: TaggedRoadCost = (x, z) => (t.isWithinRoad(Math.round(x), Math.round(z), WORLD.roadHalfWidth) ? 0.8 : 1);
    taggedCost[ROAD_COST_TAG] = 0.8;
    const untaggedCost = (x: number, z: number) => (t.isWithinRoad(Math.round(x), Math.round(z), WORLD.roadHalfWidth) ? 0.8 : 1);

    const pTagged = findPath3(from, goal, t.standY, 16000, { cost: taggedCost, minCost: 0.8 });
    const pUntagged = findPath3(from, goal, t.standY, 16000, { cost: untaggedCost, minCost: 0.8 });
    expect(pTagged).toEqual(pUntagged);

    const p2 = findPath({ x: 3, z: 3 }, { x: 12, z: -15 }, t.isBlocked);
    expect(p2.length).toBeGreaterThan(0);
  });
});
