// Every registered track (tracks.ts) keeps the TrackDef contract: samples about a metre apart, gates in order, a run
// along the centre line counted by the gate tracker, a start grid on the road behind the start line, barriers that
// never cross, and (when it has one) the whole track inside its reserve rectangle.
import { describe, expect, it } from 'vitest';
import { ALL_TRACKS, TRACK_IDS, TRACKS, trackById, trackSurfaceAt } from './tracks';

describe('track registry', () => {
  it('has every id, and trackById finds each', () => {
    for (const id of TRACK_IDS) expect(trackById(id)).toBe(TRACKS[id]);
    expect(() => trackById('nope')).toThrow();
  });

  for (const t of ALL_TRACKS) {
    describe(t.id, () => {
      it('samples about a metre apart', () => {
        const S = t.samples();
        expect(S.length).toBeGreaterThan(100);
        for (let k = 1; k < S.length; k++) {
          const d = Math.hypot(S[k].x - S[k - 1].x, S[k].z - S[k - 1].z);
          expect(d).toBeGreaterThan(0.5);
          expect(d).toBeLessThan(1.5);
        }
      });

      it('has its gates in racing order', () => {
        const G = t.gates();
        expect(G).toHaveLength(t.def.gates);
        for (let i = 1; i < G.length; i++) expect(G[i].s).toBeGreaterThan(G[i - 1].s);
        if (!t.closed) {
          expect(G[0].s).toBeCloseTo(t.startS(), 0);
          expect(G[G.length - 1].s).toBeCloseTo(t.finishS(), 0);
        }
      });

      it('counts one full lap or run along the centre line', () => {
        const tr = t.tracker();
        const events: string[] = [];
        const from = t.startS() - 15;
        const to = t.closed ? t.length() + 5 : t.finishS() + 5;
        for (let s = from; s <= to; s += 2) {
          const f = t.frame(s);
          const ev = tr.update(0.1, f.x, f.z);
          if (ev) events.push(ev);
        }
        expect(events[0]).toBe('start');
        expect(events.filter((e) => e === 'gate')).toHaveLength(t.def.gates - (t.closed ? 1 : 2));
        expect(events[events.length - 1]).toBe('lap');
        expect(tr.laps).toBe(1);
      });

      it('puts four grid slots on the road behind the start line', () => {
        for (let slot = 0; slot < 4; slot++) {
          const g = t.gridSlot(slot);
          const spot = t.locate(g.x, g.z, 20);
          expect(spot).not.toBeNull();
          expect(Math.abs(spot!.lat)).toBeLessThanOrEqual(t.def.width / 2);
          expect(t.surfaceAt(g.x, g.z)).toBe(t.def.surface);
          if (!t.closed) expect(spot!.s).toBeLessThan(t.startS());
        }
      });

      it('keeps every two parts of the track apart (barriers never cross)', () => {
        const S = t.samples();
        const n = S.length;
        let closest = Infinity;
        for (let i = 0; i < n; i += 2) {
          for (let k = i + 2; k < n; k += 2) {
            const along = t.closed ? Math.min(k - i, n - (k - i)) : k - i;
            if (along < 90) continue;
            closest = Math.min(closest, Math.hypot(S[i].x - S[k].x, S[i].z - S[k].z));
          }
        }
        expect(closest).toBeGreaterThan(2 * t.def.barrierOffset + 6);
      });

      it('stays inside its reserve rectangle', () => {
        const r = t.def.reserve;
        if (!r) return;
        for (const p of t.samples()) {
          expect(Math.abs(p.x - r.x) + t.def.barrierOffset).toBeLessThan(r.hw);
          expect(Math.abs(p.z - r.z) + t.def.barrierOffset).toBeLessThan(r.hd);
        }
      });

      it('reports its road surface on the centre line', () => {
        const p = t.sampleAt(t.startS() + 30);
        expect(trackSurfaceAt(p.x, p.z) === t.def.surface || t.id !== 'lost-and-found').toBe(true);
        expect(t.surfaceAt(p.x, p.z)).toBe(t.def.surface);
      });
    });
  }
});
