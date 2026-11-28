// Founders' Green card app (E19). Node has no DOM, so this file brings a tiny element stand-in (as golfApp.test.ts does).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { _resetGnomletApps, getGnomletApp } from '../gnomlet/registry';
import type { CourtApi } from '../court/types';
import type { SkateApi } from '../skate/types';
import { registerFoundersApp, type FoundersAppDeps } from './app';
import { emptySportsSave } from './save';
import type { SportsSave, SportsStore } from './types';

class FakeEl {
  children: FakeEl[] = [];
  parent: FakeEl | null = null;
  style = { cssText: '' };
  textContent = '';
  type = '';
  disabled = false;
  private listeners: Array<() => void> = [];
  constructor(readonly tagName: string) {}
  appendChild(c: FakeEl): FakeEl {
    c.parent = this;
    this.children.push(c);
    return c;
  }
  remove(): void {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((x) => x !== this);
    this.parent = null;
  }
  addEventListener(_type: string, fn: () => void): void {
    this.listeners.push(fn);
  }
  click(): void {
    for (const fn of this.listeners) fn();
  }
  text(): string {
    return this.textContent + this.children.map((c) => c.text()).join(' ');
  }
  findAll(pred: (e: FakeEl) => boolean): FakeEl[] {
    const out: FakeEl[] = [];
    for (const c of this.children) {
      if (pred(c)) out.push(c);
      out.push(...c.findAll(pred));
    }
    return out;
  }
}

const g = globalThis as Record<string, unknown>;

beforeAll(() => {
  g.document = { createElement: (tag: string) => new FakeEl(tag) };
});

afterAll(() => {
  delete g.document;
});

function fakeSave(owned: boolean): SportsSave {
  const s = emptySportsSave();
  s.jam.games = 4;
  s.jam.wins = 3;
  s.jam.threes = 12;
  s.jam.dunks = 2;
  s.jam.swishBeaten = 1;
  s.jam.bestMargin = 6;
  s.skate.boardOwned = owned;
  s.skate.bestCombo = 840;
  s.skate.fullRails = 2;
  s.skate.linesDone = 3;
  s.skate.lines = { 'first-push': 9.5 };
  return s;
}

function fakeStore(save: SportsSave): SportsStore {
  return {
    data: () => save,
    recordGame() {},
    recordShootMake() {},
    setBoardOwned() {},
    recordOllie() {},
    recordCombo: () => false,
    recordFullRail() {},
    recordLine: () => false,
  };
}

function fakeCourt(reply: string | null, calls: string[]): CourtApi {
  return {
    startGame: (opts) => {
      calls.push(`game:${opts?.opponents ?? ''}`);
      return reply;
    },
    quitGame() {},
    inGame: () => false,
    startShootaround: () => {
      calls.push('shootaround');
      return reply;
    },
    onGame: () => () => {},
  };
}

function fakeSkate(calls: string[], owned: boolean): SkateApi {
  return {
    boardOwned: () => owned,
    giveBoard() {},
    dropBoard: () => {
      calls.push('drop');
      return null;
    },
    startLine: (id) => {
      calls.push(`line:${id}`);
      return null;
    },
    onLine: () => () => {},
  };
}

function fakeDeps(save: SportsSave, court: CourtApi | null, skate: SkateApi | null, toasts: string[]): FoundersAppDeps {
  return { store: () => fakeStore(save), court: () => court, skate: () => skate, toast: (t) => toasts.push(t) };
}

function openApp(deps: FoundersAppDeps): { root: FakeEl; closed: string[] } {
  _resetGnomletApps();
  registerFoundersApp(deps);
  const app = getGnomletApp('founders-green');
  const root = new FakeEl('div');
  const closed: string[] = [];
  const tablet = { close: () => closed.push('closed'), home: () => {}, setTitle: () => {} };
  app?.open?.(root as unknown as HTMLElement, tablet);
  return { root, closed };
}

function buttons(root: FakeEl, label: string): FakeEl[] {
  return root.findAll((e) => e.tagName === 'button' && e.textContent === label);
}

describe("Founders' Green app", () => {
  it('registers under the fun group with the Founders\' Green label', () => {
    _resetGnomletApps();
    registerFoundersApp(fakeDeps(fakeSave(false), null, null, []));
    const app = getGnomletApp('founders-green');
    expect(app?.label).toBe("Founders' Green");
    expect(app?.group).toBe('fun');
    expect(app?.detail?.()).toBe('Court: 3 of 4 won. Lines done: 3');
  });

  it('shows the court and the gutter numbers with one line button each', () => {
    const { root } = openApp(fakeDeps(fakeSave(false), fakeCourt(null, []), fakeSkate([], false), []));
    expect(root.text()).toContain('Games: 4. Wins: 3.');
    expect(root.text()).toContain('Threes: 12. Dunks: 2.');
    expect(root.text()).toContain('Beat Swish: 1 times. Best winning margin: 6.');
    expect(root.text()).toContain('Best combo: 840. Full rails: 2.');
    expect(root.text()).toContain('First Push: 9.50 s');
    expect(root.text()).toContain('The Long Gutter: not yet');
    expect(buttons(root, 'Skate it')).toHaveLength(4);
    expect(buttons(root, 'Pickup game (to 11)')).toHaveLength(1);
    expect(buttons(root, 'Shootaround')).toHaveLength(1);
  });

  it('starts a line from its button and closes the tablet', () => {
    const calls: string[] = [];
    const toasts: string[] = [];
    const { root, closed } = openApp(fakeDeps(fakeSave(false), null, fakeSkate(calls, false), toasts));
    buttons(root, 'Skate it')[1].click();
    expect(calls).toEqual([`line:${'bowl-line'}`]);
    expect(closed).toEqual(['closed']);
    expect(toasts).toEqual([]);
  });

  it('starts a pickup game with the regulars', () => {
    const calls: string[] = [];
    const { root, closed } = openApp(fakeDeps(fakeSave(false), fakeCourt(null, calls), null, []));
    buttons(root, 'Pickup game (to 11)')[0].click();
    expect(calls).toEqual(['game:regulars']);
    expect(closed).toEqual(['closed']);
  });

  it('toasts a refusal and stays open', () => {
    const calls: string[] = [];
    const toasts: string[] = [];
    const { root, closed } = openApp(fakeDeps(fakeSave(false), fakeCourt('Too far from the court.', calls), null, toasts));
    buttons(root, 'Shootaround')[0].click();
    expect(calls).toEqual(['shootaround']);
    expect(toasts).toEqual(['Too far from the court.']);
    expect(closed).toEqual([]);
  });

  it('shows "Drop your board" only when the board is owned', () => {
    const none = openApp(fakeDeps(fakeSave(false), null, fakeSkate([], false), []));
    expect(buttons(none.root, 'Drop your board')).toHaveLength(0);

    const calls: string[] = [];
    const owned = openApp(fakeDeps(fakeSave(true), null, fakeSkate(calls, true), []));
    const drop = buttons(owned.root, 'Drop your board');
    expect(drop).toHaveLength(1);
    drop[0].click();
    expect(calls).toEqual(['drop']);
  });

  it('disables the buttons when there is no runtime', () => {
    const { root } = openApp(fakeDeps(emptySportsSave(), null, null, []));
    expect(buttons(root, 'Shootaround')[0].disabled).toBe(true);
    expect(buttons(root, 'Skate it')[0].disabled).toBe(true);
  });
});
