import { describe, expect, it } from 'vitest';
import { LEVELS, sampleSurfaceHeight } from '../levels/loader';
import { createSkater, stepSkater } from './skater';

describe('Gnom Set Radio level documents & rollerblade sim', () => {
  it('both levels satisfy @lawn/level format and event counts', () => {
    const vk = LEVELS['velvet-keys'];
    expect(vk.format).toBe('lawn-level');
    expect(vk.data.events.filter((e) => e.kind === 'story').length).toBe(3);
    expect(vk.data.events.filter((e) => e.kind === 'boss').length).toBe(1);
    expect(vk.data.events.filter((e) => e.kind === 'side').length).toBe(2);

    const bb = LEVELS['bongo-basin'];
    expect(bb.format).toBe('lawn-level');
    expect(bb.data.events.filter((e) => e.kind === 'story').length).toBe(4);
    expect(bb.data.events.filter((e) => e.kind === 'boss').length).toBe(1);
    expect(bb.data.events.filter((e) => e.kind === 'side').length).toBe(2);
  });

  it('skater accelerates and climbs ramp onto Conservatory Terrace rooftop', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    // Position at foot of south Conservatory ramp (z=19, heading north -Z)
    s.x = 0;
    s.z = 20;
    s.y = 0;
    const btn = { jump: false, trick: false, railCooldown: 0 };
    for (let i = 0; i < 120; i++) {
      stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: true }, 1 / 60, btn);
    }
    expect(s.z).toBeLessThan(8);
    expect(s.y).toBeGreaterThan(3.0);
    expect(sampleSurfaceHeight(doc, 0, 0, s.y)).toBeCloseTo(3.5, 1);
  });

  it('skater snaps onto 3D ley-line rail and scores tricks', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    // Place near rail-plaza-loop (y=1.4, z=24) while airborne
    s.x = -10;
    s.y = 2.0;
    s.z = 24;
    s.vx = 12;
    s.vy = -1;
    s.grounded = false;
    const btn = { jump: false, trick: false, railCooldown: 0 };

    const res = stepSkater(
      s,
      doc,
      { moveX: 1, moveZ: 0, jump: false, grind: true, trick: false, boost: false },
      1 / 60,
      btn,
    );
    expect(s.grinding).toBe(true);
    expect(s.railId).toBe('rail-plaza-loop');
    expect(res.trickTriggered).toBe('Ley-Line Grind');

    const trickRes = stepSkater(
      s,
      doc,
      { moveX: 1, moveZ: 0, jump: false, grind: true, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(trickRes.trickTriggered).toBeTruthy();
    expect(s.comboMult).toBeGreaterThan(1);
  });
});
