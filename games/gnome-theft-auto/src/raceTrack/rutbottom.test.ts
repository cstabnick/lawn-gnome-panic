// The Rutbottom Dirt Bowl: a bumpy dirt circuit with big banks, whoops and two jumps, inside the dirt-track site.
import { describe, expect, it } from 'vitest';
import { siteRect } from '../sites';
import { heightAt } from '../terrain';
import { TRACKS } from './tracks';

const T = TRACKS.rutbottom;
const D = T.def;

describe('rutbottom', () => {
  it('is a 1.2 to 1.6 km lap', () => {
    expect(T.length()).toBeGreaterThan(1200);
    expect(T.length()).toBeLessThan(1600);
  });

  it('has at least four banked corners and no bank steeper than 0.38 of the width', () => {
    const S = T.samples();
    let runs = 0;
    let inRun = false;
    for (const p of S) {
      const hi = p.bank >= 2.5;
      if (hi && !inRun) runs++;
      inRun = hi;
      expect(p.bank / D.width).toBeLessThanOrEqual(0.38);
    }
    expect(runs).toBeGreaterThanOrEqual(4);
  });

  it('keeps its whoops 25 m from every jump and from the line', () => {
    const L = T.length();
    expect((D.whoops ?? []).length).toBeGreaterThanOrEqual(2);
    const gap = (a: number, b: number): number => {
      const d = Math.abs(a - b) % L;
      return Math.min(d, L - d);
    };
    for (const w of D.whoops ?? []) {
      for (const j of D.jumps) {
        for (const s of [w.from, w.to]) expect(gap(s, j.s - j.up)).toBeGreaterThanOrEqual(25);
        for (const s of [w.from, w.to]) expect(gap(s, j.s + j.down)).toBeGreaterThanOrEqual(25);
        // the whole whoop range must not contain the jump
        expect(j.s < w.from || j.s > w.to).toBe(true);
      }
      expect(w.from).toBeGreaterThanOrEqual(25);
      expect(w.to).toBeLessThanOrEqual(L - 25);
    }
  });

  it('stands its corners on gentle banks, not walls (north of the start straight)', () => {
    let worst = 0;
    for (let x = 1100; x <= 1250; x += 10) {
      for (let d = 9; d < 25; d += 2) worst = Math.max(worst, Math.abs(heightAt(x, -543 - d) - heightAt(x, -543 - d - 2)) / 2);
    }
    expect(worst, 'steepest bank (rise/run)').toBeLessThan(0.55);
  });

  it('leaves the entrance lane clear', () => {
    for (const p of T.samples()) expect(Math.hypot(p.x - 1015, p.z + 650)).toBeGreaterThanOrEqual(35);
  });

  it('stays inside the dirt-track site with the barriers', () => {
    const r = siteRect('dirt-track');
    for (const p of T.samples()) {
      expect(p.x - D.barrierOffset).toBeGreaterThan(r.minX);
      expect(p.x + D.barrierOffset).toBeLessThan(r.maxX);
      expect(p.z - D.barrierOffset).toBeGreaterThan(r.minZ);
      expect(p.z + D.barrierOffset).toBeLessThan(r.maxZ);
    }
  });

  it('counts a lap on the gate tracker', () => {
    const tr = T.tracker();
    const events: string[] = [];
    for (let s = -15; s <= T.length() + 5; s += 2) {
      const f = T.frame(s);
      const ev = tr.update(0.1, f.x, f.z);
      if (ev) events.push(ev);
    }
    expect(events[0]).toBe('start');
    expect(events[events.length - 1]).toBe('lap');
    expect(tr.laps).toBe(1);
  });
});