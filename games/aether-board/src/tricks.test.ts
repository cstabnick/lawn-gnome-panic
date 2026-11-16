import { describe, expect, it } from 'vitest';
import { SIM_HZ, type Mode, type PhysEvent, type TrickCmd } from './config';
import { createPlayer } from './physics';
import { generateWorld } from './world';
import { createCombo, createRecognizer } from './tricks';

const DT = 1 / SIM_HZ;
const S = { x: 0, y: -1 };
const N = { x: 0, y: 1 };
const W = { x: -1, y: 0 };
const E = { x: 1, y: 0 };
const NW = { x: -0.7, y: 0.7 };
const C = { x: 0, y: 0 };

/** Feeds `[x, y, seconds]` holds at 1/120 s; returns every command produced, in order. */
function run(holds: [number, number, number][], mode: Mode = 'ground'): TrickCmd[] {
  const r = createRecognizer();
  const out: TrickCmd[] = [];
  for (const [x, y, secs] of holds) {
    for (let i = 0; i < Math.round(secs * SIM_HZ); i++) {
      const cmd = r.feed({ x, y }, mode, DT);
      if (cmd) out.push(cmd);
    }
  }
  return out;
}

describe('ground recognizer', () => {
  it('S then N pops an ollie with power >= 0.6 after a 0.15 s load', () => {
    const cmds = run([[S.x, S.y, 0.15], [N.x, N.y, 0.1]]);
    expect(cmds).toHaveLength(1);
    expect(cmds[0]).toMatchObject({ kind: 'pop', trick: 'ollie' });
    const power = (cmds[0] as { power: number }).power;
    expect(power).toBeGreaterThanOrEqual(0.6);
    expect(power).toBeLessThanOrEqual(1);
  });

  it('S then NW (slow, via E) is a kickflip', () => {
    const cmds = run([[S.x, S.y, 0.15], [E.x, E.y, 0.1], [NW.x, NW.y, 0.1]]);
    expect(cmds).toEqual([expect.objectContaining({ kind: 'pop', trick: 'kickflip' })]);
  });

  it('S then NW direct, in one hop (a real mouse flick), is a kickflip', () => {
    const cmds = run([[S.x, S.y, 0.15], [NW.x, NW.y, 0.1]]);
    expect(cmds).toEqual([expect.objectContaining({ kind: 'pop', trick: 'kickflip' })]);
  });

  it('S then W then N is a treFlip', () => {
    const cmds = run([[S.x, S.y, 0.15], [W.x, W.y, 0.1], [N.x, N.y, 0.1]]);
    expect(cmds).toEqual([expect.objectContaining({ kind: 'pop', trick: 'treFlip' })]);
  });

  it('S then W then centre is a popShove', () => {
    const cmds = run([[S.x, S.y, 0.15], [W.x, W.y, 0.05], [C.x, C.y, 0.1]]);
    expect(cmds).toEqual([expect.objectContaining({ kind: 'pop', trick: 'popShove' })]);
  });

  it('S then centre does nothing', () => {
    expect(run([[S.x, S.y, 0.15], [C.x, C.y, 0.3]])).toEqual([]);
  });

  it('a small wobble (m < 0.5) for 2 s does nothing', () => {
    expect(run([[0, -0.45, 0.5], [0.4, 0.3, 0.5], [-0.3, -0.4, 0.5], [0.2, -0.2, 0.5]])).toEqual([]);
  });

  it('after a command the stick must return to centre before the next gesture', () => {
    const cmds = run([[S.x, S.y, 0.15], [N.x, N.y, 0.3], [S.x, S.y, 0.15], [N.x, N.y, 0.1]]);
    expect(cmds).toHaveLength(1);
  });
});

describe('air recognizer', () => {
  it('centre then W within 0.15 s is a kickflip', () => {
    expect(run([[C.x, C.y, 0.1], [W.x, W.y, 0.05]], 'air')).toEqual([{ kind: 'air', trick: 'kickflip' }]);
  });

  it('a slow flick out of the centre does not fire, and waits for the centre again', () => {
    expect(run([[C.x, C.y, 0.1], [0.7, 0, 0.3], [W.x, W.y, 0.1]], 'air')).toEqual([]);
  });
});

describe('recognizer state', () => {
  it('bail mode gives nothing', () => {
    expect(run([[S.x, S.y, 0.15], [N.x, N.y, 0.1]], 'bail')).toEqual([]);
  });

  it('trail returns the recent path, oldest first, about every second sample', () => {
    const r = createRecognizer();
    for (let i = 0; i < 200; i++) r.feed({ x: 0, y: i / 200 }, 'ground', DT);
    const t = r.trail();
    expect(t.length).toBeGreaterThan(10);
    expect(t.length).toBeLessThanOrEqual(26);
    expect(t[t.length - 1].y).toBeCloseTo(199 / 200);
    expect(t[0].y).toBeLessThan(t[t.length - 1].y);
  });
});

describe('combo', () => {
  function playerAt() {
    return createPlayer(generateWorld(1));
  }

  it('a kickflip and a 360 land, banked after the link runs out, multiplies by the line count', () => {
    const combo = createCombo();
    const p = playerAt();
    const evs: PhysEvent[] = [
      { e: 'takeoff', speed: 20, ollie: true },
      { e: 'pop', trick: 'kickflip' },
      { e: 'trickDone', trick: 'kickflip' },
      { e: 'land', perfect: false, spin: -360, flips: 0, airT: 1, impact: 5, switchLand: false },
    ];
    for (const e of evs) combo.event(e, p);
    for (let i = 0; i < 1.5 * SIM_HZ; i++) combo.tick(DT, p);
    const v = combo.view();
    expect(v.total).toBe((120 + 250) * 2);
    expect(v.last?.kind).toBe('landed');
    expect(v.lines).toEqual([]);
  });

  it('a bail loses the combo', () => {
    const combo = createCombo();
    const p = playerAt();
    combo.event({ e: 'takeoff', speed: 20, ollie: true }, p);
    combo.event({ e: 'pop', trick: 'kickflip' }, p);
    combo.event({ e: 'trickDone', trick: 'kickflip' }, p);
    combo.event({ e: 'bail', reason: 'test' }, p);
    const v = combo.view();
    expect(v.total).toBe(0);
    expect(v.last?.kind).toBe('bailed');
  });

  it('a warp banks at once', () => {
    const combo = createCombo();
    const p = playerAt();
    combo.event({ e: 'takeoff', speed: 20, ollie: true }, p);
    combo.event({ e: 'warp' }, p);
    expect(combo.view().total).toBe(1000);
  });
});
