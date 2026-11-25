import { describe, expect, it } from 'vitest';
import { emptySave, parseSave, recordShift, serializeSave, statsOf } from './career';
import { MAX_LEVEL } from './defs';
import { WORK_JOB_IDS } from './types';
import { starsForScore, WORK_JOBS, WORK_PAY, workPay } from './workDefs';

describe('workplace jobs (E24)', () => {
  it('every job has a full title and pay table', () => {
    for (const id of WORK_JOB_IDS) {
      expect(WORK_JOBS[id].levelTitles).toHaveLength(MAX_LEVEL);
      expect(WORK_PAY[id].perUnit).toHaveLength(MAX_LEVEL);
    }
  });

  it('pays more for more stars and more levels', () => {
    const a = workPay('chef', 1, [{ stars: 3 }]);
    const b = workPay('chef', 1, [{ stars: 5 }]);
    const c = workPay('chef', 5, [{ stars: 5 }]);
    expect(b.total).toBeGreaterThan(a.total);
    expect(c.total).toBeGreaterThan(b.total);
    expect(workPay('comedy', 1, []).total).toBe(0);
    expect(workPay('comedy', 1, [{ stars: 1 }], 6, 'Hazard pay').total).toBe(9);
  });

  it('a five-star shift of 8 tickets at level 5 pays roughly 260 (schedule)', () => {
    const p = workPay('chef', 5, Array.from({ length: 8 }, () => ({ stars: 5 })));
    expect(p.total).toBeGreaterThan(240);
    expect(p.total).toBeLessThan(330);
  });

  it('stars from scores', () => {
    expect(starsForScore(95)).toBe(5);
    expect(starsForScore(60)).toBe(3);
    expect(starsForScore(0)).toBe(1);
  });

  it('records a shift in the career save and survives a round trip', () => {
    const s = emptySave();
    const up = recordShift(s, 'mechanic', workPay('mechanic', 1, [{ stars: 5 }, { stars: 5 }]), { cars: 2, perfectCars: 2 });
    expect(up).toBe(2);
    const back = parseSave(serializeSave(s));
    expect(back.work.mechanic.done).toBe(1);
    expect(back.workStats.cars).toBe(2);
    expect(statsOf(back, null).workLevels.mechanic).toBe(2);
    expect(parseSave('{"v":1,"jobs":{}}').work.chef.xp).toBe(0);
  });
});
