import { describe, expect, it } from 'vitest';
import { browserLabel, deviceLabel, fmtTris, fromHitch, isSample } from './data';
import type { ViewSession } from './data';
import { aggregate } from './demo';
import { layoutSpans } from './frame';

describe('layoutSpans', () => {
  it('puts sequential spans on one row and nested spans below their parent', () => {
    const rows = layoutSpans([
      { name: 'update', start: 0, ms: 50 },
      { name: 'physics', start: 2, ms: 20 },
      { name: 'ai', start: 25, ms: 10 },
      { name: 'pathfind', start: 26, ms: 5 },
      { name: 'render', start: 50, ms: 30 },
    ]);
    expect(rows.map((r) => [r.span.name, r.depth])).toEqual([['update', 0], ['physics', 1], ['ai', 1], ['pathfind', 2], ['render', 0]]);
  });
});

describe('aggregate (same rules as the server)', () => {
  const h = (wall: number, ms: number, spans: [string, number][]) => ({
    kind: spans.length ? 'frame' : 'longtask', at: 0, ms, wall, ctx: {}, spans: spans.map(([name, d]) => ({ name, start: 0, ms: d })),
  });
  it('buckets hitches, sums systems and puts span-less hitches under (untimed)', () => {
    const t0 = Date.UTC(2026, 0, 1, 10);
    const s = aggregate(
      [
        { session: 'a', h: h(t0 + 1000, 200, [['render', 150], ['world', 50]]) },
        { session: 'b', h: h(t0 + 2000, 100, []) },
        { session: 'a', h: h(t0 + 30 * 60e3, 300, [['world', 300]]) },
      ],
      t0,
      t0 + 3600e3,
    );
    expect(s.bucketMs).toBe(60e3);
    expect(s.systems.map((x) => [x.name, x.totalMs])).toEqual([['world', 350], ['render', 150], ['(untimed)', 100]]);
    expect(s.buckets[0]).toMatchObject({ hitches: 2, sessions: 2, max: 200, system: { render: 150, world: 50, '(untimed)': 100 } });
    expect(s.buckets[30].hitches).toBe(1);
  });
});

describe('labels', () => {
  const base = { touch: false, cores: 8, memGb: 0 } as ViewSession;
  it('shortens ANGLE GPU strings and skips unknown memory', () => {
    expect(deviceLabel({ ...base, gpu: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 (0x00002786) Direct3D11 vs_5_0 ps_5_0, D3D11)' })).toBe('Desktop · NVIDIA GeForce RTX 4070 · 8c');
    expect(deviceLabel({ ...base, touch: true, gpu: 'Mali-G57', memGb: 4 })).toBe('Mobile · Mali-G57 · 8c 4G');
  });
  it('names the browser', () => {
    expect(browserLabel('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0')).toBe('Edge 142');
    expect(browserLabel('Mozilla/5.0 (iPhone) Version/18.1 Mobile/15E148 Safari/604.1')).toBe('Safari 18');
  });
});

describe('frame-health samples', () => {
  const t0 = Date.UTC(2026, 0, 1, 10);
  const sample = (wall: number, p50: number, drawCalls: number) => ({
    kind: 'sample', at: 0, ms: p50, wall, ctx: {}, spans: [],
    frames: { p50, p95: p50 * 2, max: 0, cpu: 0, n: 1 },
    render: { drawCalls, triangles: 1e6, gpuMs: 0, programs: 1, pixelRatio: 1 },
  });
  it('keeps samples out of the hitch counts and the p50', () => {
    const s = aggregate(
      [
        { session: 'a', h: { kind: 'frame', at: 0, ms: 200, wall: t0 + 1000, ctx: {}, spans: [{ name: 'render', start: 0, ms: 200 }] } },
        { session: 'a', h: sample(t0 + 2000, 16, 100) },
      ],
      t0,
      t0 + 3600e3,
    );
    expect(s.buckets[0]).toMatchObject({ hitches: 1, sessions: 1, p50: 200, samples: 1, frameP50: 16 });
    expect(s.systems.map((x) => x.name)).toEqual(['render']);
  });
  it('means the render counters over a bucket', () => {
    const s = aggregate([{ session: 'a', h: sample(t0 + 1000, 16, 100) }, { session: 'a', h: sample(t0 + 2000, 16, 300) }], t0, t0 + 3600e3);
    expect(s.buckets[0]).toMatchObject({ samples: 2, drawCalls: 200, frameP95: 32, hitches: 0 });
  });
  it('maps render and frame stats from a hitch', () => {
    const v = fromHitch({
      kind: 'sample', atMs: 5000, durationMs: 16, context: { region: 'x' }, spans: [],
      render: { drawCalls: 300, triangles: 1e6, gpuMs: 2, programs: 9, pixelRatio: 1.5, geometries: 0, textures: 0 },
      frames: { frames: 300, p50Ms: 16.7, p95Ms: 33, maxMs: 50, cpuMs: 4 },
    } as unknown as Parameters<typeof fromHitch>[0]);
    expect(v.render).toEqual({ drawCalls: 300, triangles: 1e6, gpuMs: 2, programs: 9, pixelRatio: 1.5 });
    expect(v.frames).toEqual({ p50: 16.7, p95: 33, max: 50, cpu: 4, n: 300 });
    expect(isSample(v)).toBe(true);
  });
  it('formats triangle counts', () => {
    expect(fmtTris(640000)).toBe('640 k');
    expect(fmtTris(1240000)).toBe('1.24 M');
  });
});
