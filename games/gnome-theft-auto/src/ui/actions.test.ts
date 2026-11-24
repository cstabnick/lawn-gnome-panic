import { describe, expect, it } from 'vitest';
import { PAD_FAMILIES, glyphLabel, type PadButtonName } from '@lawn/gamepad';
import { KEYS, MOVE_KEYS } from '../keys';
import { ACTIONS, padBinding, registerAction, runAction, isAvailable, type PadMode } from './actions';

const MODES: PadMode[] = ['foot', 'drive', 'fly', 'chute', 'any'];

describe('the action matrix', () => {
  it('has unique ids', () => {
    const ids = ACTIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every action a path on touch, keyboard and gamepad', () => {
    for (const a of ACTIONS) {
      expect(a.touch, `${a.id} touch`).toBeTruthy();
      expect(a.touchText.length, `${a.id} touchText`).toBeGreaterThan(0);
      expect(Object.keys(a.kb).length, `${a.id} keyboard`).toBe(1);
      if ('key' in a.kb) expect(KEYS[a.kb.key], `${a.id} key ${a.kb.key}`).toBeTruthy();
      if ('move' in a.kb) expect(MOVE_KEYS[a.kb.move], `${a.id} move ${a.kb.move}`).toBeTruthy();
      if ('via' in a.kb && a.kb.via === 'more') expect(a.inMore || a.inDock || a.id === 'context', `${a.id} is only on keyboard via More, so it must be in it`).toBeTruthy();
      expect(Object.keys(a.pad).length, `${a.id} pad`).toBeGreaterThan(0);
      for (const b of Object.values(a.pad)) if (b === 'more') expect(a.inMore || a.inDock, `${a.id} is only on the pad via More, so it must be in it`).toBeTruthy();
    }
  });

  it('puts More-menu actions in the menu and dock actions in the dock', () => {
    for (const a of ACTIONS) {
      if (a.touch === 'more') expect(a.inMore, `${a.id}`).toBe(true);
      if (a.touch === 'dock' && a.id !== 'context') expect(a.inDock, `${a.id}`).toBe(true);
      if (a.inDock) expect(a.touch).toBe('dock');
    }
  });

  it('binds every keyboard action in keys.ts to some action', () => {
    const used = new Set(ACTIONS.flatMap((a) => ('key' in a.kb ? [a.kb.key] : [])));
    const exempt = new Set(['trainerAlt', 'enterExit']);
    used.add('enterExit');
    for (const k of Object.keys(KEYS)) if (!exempt.has(k)) expect(used.has(k as keyof typeof KEYS), `KEYS.${k} has no action row`).toBe(true);
  });

  it('has a glyph for every pad control in every family', () => {
    for (const a of ACTIONS) {
      for (const m of MODES) {
        const b = padBinding(a.id, m === 'any' ? 'foot' : m);
        if (b === 'more' || b === 'options') continue;
        for (const f of PAD_FAMILIES) expect(glyphLabel(f, b as PadButtonName).length, `${a.id} ${f} ${b}`).toBeGreaterThan(0);
      }
    }
  });

  it('never gives two always-on actions the same pad control in the same mode', () => {
    // Contextual sharing is fine: D-pad up is "the top dock button", B is close inside sheets, A is confirm in menus.
    const contextual = new Set(['context', 'garage', 'lockupStore', 'craftShop', 'fish', 'binoculars', 'close', 'confirm', 'fishBait', 'handbrake', 'climb', 'descend']);
    for (const m of ['foot', 'drive', 'fly'] as const) {
      const seen = new Map<string, string>();
      for (const a of ACTIONS) {
        if (contextual.has(a.id)) continue;
        const b = a.pad[m] ?? a.pad.any;
        if (!b || b === 'more' || b === 'options') continue;
        const prev = seen.get(b);
        expect(prev, `${m}: ${a.id} and ${prev} both use ${b}`).toBeUndefined();
        seen.set(b, a.id);
      }
    }
  });
});

describe('the action registry', () => {
  it('runs a registered, available action only', () => {
    let n = 0;
    let ok = false;
    registerAction('party', { run: () => { n++; }, available: () => ok });
    expect(isAvailable('party')).toBe(false);
    expect(runAction('party')).toBe(false);
    ok = true;
    expect(runAction('party')).toBe(true);
    expect(n).toBe(1);
  });
});
