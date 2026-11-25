import { describe, expect, it } from 'vitest';
import { reportEndpoint, toHitchJson } from './upload';

describe('upload', () => {
  it('builds the ReportHitches URL from the platform base', () => {
    expect(reportEndpoint('https://gnome.example/api')).toBe('https://gnome.example/api/gnome.profile.v1.ProfileService/ReportHitches');
    expect(reportEndpoint('http://localhost:8090/api/')).toBe('http://localhost:8090/api/gnome.profile.v1.ProfileService/ReportHitches');
    expect(reportEndpoint('')).toBe('');
  });

  it('maps a report to protojson inside the server limits', () => {
    const spans = Array.from({ length: 80 }, (_, i) => ({ name: i === 0 ? '' : `system${i}`.repeat(10), start: i, ms: 1 }));
    const ctx = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`k${i}`, i]));
    const j = toHitchJson({ kind: 'frame', ms: 900, at: 1234, parts: [], spans, wall: Date.UTC(2026, 0, 2), ctx });
    expect(j).toMatchObject({ kind: 'frame', atMs: 1234, durationMs: 900, occurredAt: '2026-01-02T00:00:00.000Z' });
    const out = j.spans as { name: string }[];
    expect(out).toHaveLength(64);
    expect(out[0].name).toBe('?');
    expect(out[1].name.length).toBeLessThanOrEqual(64);
    expect(Object.keys(j.context as object)).toHaveLength(8);
  });

  it('clamps extreme durations and span times to server limits', () => {
    const j = toHitchJson({
      kind: 'gap', ms: 900_000, at: -5, parts: [], spans: [{ name: 'tab', start: -1, ms: 900_000 }], wall: Date.UTC(2026, 0, 2), ctx: {},
    });
    expect(j.durationMs).toBe(600_000);
    expect(j.atMs).toBe(0);
    expect((j.spans as { startMs: number; durationMs: number }[])[0]).toEqual({ name: 'tab', startMs: 0, durationMs: 600_000 });
  });
});
