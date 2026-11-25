import { describe, expect, it, vi } from 'vitest';
import { Profiler } from './core';
import { parseProfileValue, readProfileConfig, STORAGE_KEY } from './config';

function clock() {
  let t = 0;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

function memStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

describe('Profiler', () => {
  it('off: timed is a plain call and nothing is reported', () => {
    const c = clock();
    const p = new Profiler({ on: false, thresholdMs: 10, now: c.now, log: false });
    p.beginFrame();
    expect(p.timed('a', () => { c.advance(500); return 7; })).toBe(7);
    p.endFrame();
    p.mark('m', 999);
    p.longTask(0, 999);
    expect(p.reports).toHaveLength(0);
  });

  it('reports a slow frame with its systems, slowest first, and the context', () => {
    const c = clock();
    const p = new Profiler({ on: true, thresholdMs: 50, now: c.now, log: false });
    p.setContext(() => ({ zone: 'mossbottom' }));
    p.beginFrame();
    p.timed('fast', () => c.advance(1));
    p.timed('world', () => c.advance(40));
    p.timed('render', () => c.advance(20));
    p.endFrame();
    expect(p.reports).toHaveLength(1);
    expect(p.reports[0]).toMatchObject({ kind: 'frame', ms: 61, parts: [['world', 40], ['render', 20]], ctx: { zone: 'mossbottom' } });
    // Spans keep the order the systems ran in, with their start in the frame (the Gantt view).
    expect(p.reports[0].spans).toEqual([
      { name: 'fast', start: 0, ms: 1 },
      { name: 'world', start: 1, ms: 40 },
      { name: 'render', start: 41, ms: 20 },
    ]);
  });

  it('skips frames under the threshold and long tasks inside a reported frame', () => {
    const c = clock();
    const p = new Profiler({ on: true, thresholdMs: 50, now: c.now, log: false });
    p.beginFrame();
    c.advance(10);
    p.endFrame();
    expect(p.reports).toHaveLength(0);
    p.beginFrame();
    c.advance(100);
    p.endFrame();
    p.longTask(15, 90); // the same freeze, seen by the observer
    p.longTask(500, 200); // a separate one
    expect(p.reports.map((r) => r.kind)).toEqual(['frame', 'longtask']);
  });

  it('ignores frame gaps once the game times its own frames', () => {
    const p = new Profiler({ on: true, thresholdMs: 50, log: false });
    p.gap(0, 100);
    p.beginFrame();
    p.gap(200, 100);
    expect(p.reports.map((r) => r.kind)).toEqual(['gap']);
  });

  it('summary totals systems across hitches; listeners and log fire', () => {
    const c = clock();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = new Profiler({ on: true, thresholdMs: 5, now: c.now });
    const seen: number[] = [];
    p.onReport((r) => seen.push(r.ms));
    for (const ms of [10, 30]) {
      p.beginFrame();
      p.timed('render', () => c.advance(ms));
      p.endFrame();
    }
    p.mark('music', 8);
    expect(seen).toEqual([10, 30, 8]);
    expect(p.summary()[0]).toEqual({ system: 'render', hitches: 2, totalMs: 40, worstMs: 30 });
    expect(warn).toHaveBeenCalledWith('[hitch] frame 30ms: render 30ms');
    warn.mockRestore();
  });

  it('keeps a bounded number of reports', () => {
    const p = new Profiler({ on: true, thresholdMs: 1, keep: 3, log: false });
    for (let i = 0; i < 10; i++) p.mark('x', 5);
    expect(p.reports).toHaveLength(3);
  });

  it('sections split a frame like timed() calls, the last one closed by endFrame', () => {
    const c = clock();
    const p = new Profiler({ on: true, thresholdMs: 10, now: c.now, log: false });
    p.beginFrame();
    p.section('traffic');
    c.advance(4);
    p.section('render');
    c.advance(8);
    p.endFrame();
    expect(p.reports[0]).toMatchObject({ kind: 'frame', ms: 12, parts: [['render', 8], ['traffic', 4]] });
    expect(p.reports[0].spans).toEqual([{ name: 'traffic', start: 0, ms: 4 }, { name: 'render', start: 4, ms: 8 }]);
  });

  it('attaches render stats to a hitch frame and sends a sample every sampleMs', () => {
    const c = clock();
    const p = new Profiler({ on: true, thresholdMs: 50, now: c.now, log: false });
    p.sampleMs = 1000;
    let calls = 100;
    p.setRenderStats(() => ({ drawCalls: calls, triangles: 2000, geometries: 5, textures: 2, programs: 3, gpuMs: 0, pixelRatio: 1.5 }));
    const seen: string[] = [];
    p.onReport((r) => seen.push(r.kind));
    for (let i = 0; i < 70; i++) {
      p.beginFrame();
      p.timed('world', () => c.advance(2));
      if (i === 30) c.advance(60);
      calls = i < 35 ? 100 : 300;
      p.endFrame();
      c.advance(14);
    }
    expect(p.reports).toHaveLength(1);
    expect(p.reports[0].render?.drawCalls).toBe(100);
    expect(seen).toEqual(['frame', 'sample']);
    const s = p.samples[0];
    expect(s.kind).toBe('sample');
    expect(s.frames?.p50).toBe(16);
    expect(s.render?.triangles).toBe(2000);
    expect(s.spans[0]).toMatchObject({ name: 'world', start: 0 });
    expect(p.liveStats()?.fps).toBeGreaterThan(50);
  });

  it('live stats collect while reporting stays off', () => {
    const c = clock();
    const p = new Profiler({ on: false, thresholdMs: 1, now: c.now, log: false });
    p.setLive(true);
    for (let i = 0; i < 80; i++) {
      p.beginFrame();
      p.section('npcs');
      c.advance(5);
      p.endFrame();
      c.advance(15);
    }
    expect(p.reports).toHaveLength(0);
    expect(p.samples).toHaveLength(0);
    const l = p.liveStats();
    expect(l?.fps).toBe(50);
    expect(l?.systems[0]).toEqual(['npcs', 5]);
  });
});

describe('config', () => {
  it('is off with no flag and nothing kept', () => {
    expect(readProfileConfig('', memStorage()).on).toBe(false);
    expect(readProfileConfig('?x=1', null).on).toBe(false);
  });

  it('parses threshold, upload and off', () => {
    expect(parseProfileValue('')).toMatchObject({ on: true, thresholdMs: 80, upload: false });
    expect(parseProfileValue('50,upload')).toMatchObject({ on: true, thresholdMs: 50, upload: true });
    expect(parseProfileValue('off').on).toBe(false);
  });

  it('reads ?profile and the old ?hitches', () => {
    expect(readProfileConfig('?profile=40', null)).toEqual({ on: true, thresholdMs: 40, upload: false });
    expect(readProfileConfig('?hitches=120', null)).toEqual({ on: true, thresholdMs: 120, upload: false });
    expect(readProfileConfig('?hitches', null)).toEqual({ on: true, thresholdMs: 80, upload: false });
  });

  it('keep remembers the setting until ?profile=off', () => {
    const s = memStorage();
    readProfileConfig('?profile=60,upload,keep', s);
    expect(s.m.has(STORAGE_KEY)).toBe(true);
    expect(readProfileConfig('', s)).toEqual({ on: true, thresholdMs: 60, upload: true });
    expect(readProfileConfig('?profile=off', s).on).toBe(false);
    expect(readProfileConfig('', s).on).toBe(false);
  });

  it('never throws on broken storage', () => {
    const bad = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => {} };
    expect(readProfileConfig('', bad).on).toBe(false);
    expect(readProfileConfig('?profile=keep', bad).on).toBe(true);
  });

  it('can be enabled and disabled at runtime via setEnabled', () => {
    let t = 0;
    const p = new Profiler({ on: false, thresholdMs: 50, log: false, now: () => t });
    expect(p.on).toBe(false);
    p.setEnabled(true, 40);
    expect(p.on).toBe(true);
    expect(p.thresholdMs).toBe(40);
    p.beginFrame();
    p.timed('work', () => { t += 60; });
    p.endFrame();
    expect(p.reports).toHaveLength(1);
    p.setEnabled(false);
    expect(p.on).toBe(false);
  });
});
