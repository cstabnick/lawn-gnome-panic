// Chunk bookkeeping for the streamed map (roadmap 8.11): chunk indexes, the load/unload plan, and the bucketing of items.
import { describe, expect, it } from 'vitest';
import { STREAMING } from '../config';
import type { ContainerDef } from '../sim/types';
import type { BlockoutMap } from '../world/types';
import { bucket, chunkKey, chunkOf, isLandmark, plan } from './streaming';

const EMPTY_MAP: BlockoutMap = {
  bounds: { x0: 0, x1: 4000, z0: 0, z1: 4000 },
  blocks: [], routes: [], pits: [], spots: [], havens: [], water: [], paths: [], props: [], containers: [],
  playerSpawn: { x: 0, y: 0, z: 0 },
};

describe('chunkOf', () => {
  it('floors by the chunk size, negatives included', () => {
    expect(STREAMING.chunk).toBe(256);
    expect(chunkOf(0, 0)).toEqual({ cx: 0, cz: 0 });
    expect(chunkOf(255.9, 256)).toEqual({ cx: 0, cz: 1 });
    expect(chunkOf(-1, -257)).toEqual({ cx: -1, cz: -2 });
    expect(chunkKey(-1, -2)).toBe('-1,-2');
  });
});

describe('plan', () => {
  it('loads the square of chunks around the focus, nearest first, and skips loaded ones', () => {
    const p = plan({ x: 10, z: 10 }, new Set(['0,0']), 1);
    expect(p.load).toHaveLength(8);
    expect(p.load).not.toContain('0,0');
    expect(p.load[0] === '1,0' || p.load[0] === '0,1' || p.load[0] === '-1,0' || p.load[0] === '0,-1').toBe(true);
    // Corners come last.
    expect(p.load[p.load.length - 1]).toMatch(/^-?1,-?1$/);
    expect(p.unload).toEqual([]);
  });

  it('unloads only chunks beyond radius + 1', () => {
    const loaded = new Set(['0,0', '2,0', '3,0', '-3,0', '0,-5']);
    const p = plan({ x: 10, z: 10 }, loaded, 1);
    expect(p.unload.sort()).toEqual(['-3,0', '0,-5', '3,0'].sort());
  });

  it('is empty when everything in range is loaded', () => {
    const all = new Set<string>();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) all.add(chunkKey(dx, dz));
    expect(plan({ x: 0, z: 0 }, all, 1)).toEqual({ load: [], unload: [] });
  });
});

describe('bucket', () => {
  it('indexes blocks, props and containers by the chunk of their centre', () => {
    const map: BlockoutMap = {
      ...EMPTY_MAP,
      blocks: [{ id: 'a', kind: 'wall', x0: 290, x1: 310, z0: 0, z1: 10, y: 0, h: 2 }],
      props: [{ prefab: 'bench', x: 300, y: 0, z: 5 }],
      containers: [{ id: 'c', type: 'chest', region: 'x' as ContainerDef['region'], x: 10, y: 0, z: 10 }],
    };
    const b = bucket(map);
    expect(b.get('1,0')?.blocks).toEqual([0]);
    expect(b.get('1,0')?.props).toEqual([0]);
    expect(b.get('0,0')?.containers).toEqual([0]);
  });

  it('puts a path into every chunk it passes through', () => {
    const map: BlockoutMap = {
      ...EMPTY_MAP,
      paths: [{ id: 'p', kind: 'gravel', points: [[0, 0], [1000, 0]], width: 4 }],
    };
    const b = bucket(map);
    for (const key of ['0,0', '1,0', '2,0', '3,0']) expect(b.get(key)?.paths).toEqual([0]);
    expect(b.get('0,1')).toBeUndefined();
  });
});

describe('isLandmark', () => {
  it('is true for a block whose top is 60 gm or more', () => {
    expect(isLandmark({ id: 'spire', kind: 'spire', x0: 0, x1: 1, z0: 0, z1: 1, y: 0, h: 60 })).toBe(true);
    expect(isLandmark({ id: 'hedge', kind: 'hedge', x0: 0, x1: 1, z0: 0, z1: 1, y: 0, h: 59 })).toBe(false);
  });
});
