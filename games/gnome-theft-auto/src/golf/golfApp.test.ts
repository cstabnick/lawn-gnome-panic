// Hedgeworth card app (A14). Node has no DOM, so this file brings a tiny element stand-in (as winterApp.test.ts does).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { _resetGnomletApps, getGnomletApp } from '../gnomlet/registry';
import { registerGolfApp, type GolfAppDeps } from './golfApp';
import { emptyGolfSave } from './save';
import type { GolfApi, GolfSave, GolfStore } from './types';

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
  find(pred: (e: FakeEl) => boolean): FakeEl | undefined {
    for (const c of this.children) {
      if (pred(c)) return c;
      const hit = c.find(pred);
      if (hit) return hit;
    }
    return undefined;
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

function fakeSave(): GolfSave {
  const s = emptyGolfSave();
  s.best[0] = 5;
  s.best[2] = 6;
  s.bestRound = 17;
  s.bestNine = 38;
  s.rounds = 2;
  s.aces = 1;
  s.ballsFound = ['lb-1'];
  return s;
}

function fakeDeps(save: GolfSave, api: GolfApi | null, toasts: string[]): GolfAppDeps {
  const store: GolfStore = {
    data: () => save,
    breakBoard() {},
    recordHole() {},
    recordRound() {},
    findBall: () => false,
    flattenMolehill: () => false,
  };
  return { store: () => store, api: () => api, toast: (t) => toasts.push(t) };
}

function fakeApi(reply: string | null, calls: number[]): GolfApi {
  return {
    startRound: (hole) => {
      calls.push(hole ?? -1);
      return reply;
    },
    quitRound() {},
    inRound: () => false,
    boardBroken: () => false,
    breakBoard() {},
    onHole: () => () => {},
    store: () => { throw new Error('not used'); },
  };
}

function openApp(deps: GolfAppDeps): { root: FakeEl; closed: string[] } {
  _resetGnomletApps();
  registerGolfApp(deps);
  const app = getGnomletApp('hedgeworth');
  const root = new FakeEl('div');
  const closed: string[] = [];
  const tablet = { close: () => closed.push('closed'), home: () => {}, setTitle: () => {} };
  app?.open?.(root as unknown as HTMLElement, tablet);
  return { root, closed };
}

describe('Hedgeworth card app', () => {
  it('registers under the games group with the Hedgeworth label', () => {
    _resetGnomletApps();
    registerGolfApp(fakeDeps(fakeSave(), null, []));
    const app = getGnomletApp('hedgeworth');
    expect(app?.label).toBe('Hedgeworth');
    expect(app?.group).toBe('fun');
    expect(app?.detail?.()).toBe('Best nine 38 (+4)');
  });

  it('shows "No card yet" until a nine-hole round is finished', () => {
    _resetGnomletApps();
    registerGolfApp(fakeDeps(emptyGolfSave(), null, []));
    expect(getGnomletApp('hedgeworth')?.detail?.()).toBe('No card yet');
  });

  it('shows the nine holes in card order with a total row and the stats', () => {
    const { root } = openApp(fakeDeps(fakeSave(), fakeApi(null, []), []));
    const rows = root.findAll((e) => e.tagName === 'tr');
    // One header row, then one row per hole (card order 1..9), then the Total row.
    expect(rows).toHaveLength(11);
    expect(rows[1].text()).toContain('The Mortgage');
    expect(rows[1].text()).toContain('5');
    expect(rows[2].text()).toContain("Vesper's Patience");
    expect(rows[3].text()).toContain('The Long Week');
    expect(rows[3].text()).toContain('6');
    expect(rows[4].text()).toContain("Peony's Promise");
    expect(rows[9].text()).toContain('The Ninth');
    expect(rows[10].text()).toContain('Total');
    expect(rows[10].text()).toContain('34');
    // Not every hole has a best, so the Total's best cell is a dash.
    expect(rows[10].text()).toContain('–');
    expect(root.text()).toContain('Nine holes, at last. Par 34.');
    expect(root.text()).toContain('Rounds played: 2');
    expect(root.text()).toContain('Best round: 38 (+4)');
    expect(root.text()).toContain('Old four-hole card: 17');
    expect(root.text()).toContain('Holes in one: 1');
    expect(root.text()).toContain('Lost balls found: 1 / 8');
    expect(root.text()).toContain('The Kicked Board: still standing');
  });

  it('sums the bests in the Total row when all nine holes have one', () => {
    const save = fakeSave();
    save.best = save.best.map(() => 4);
    const { root } = openApp(fakeDeps(save, fakeApi(null, []), []));
    const rows = root.findAll((e) => e.tagName === 'tr');
    expect(rows[10].text()).toContain('Total');
    expect(rows[10].text()).toContain('36');
    expect(rows[10].text()).not.toContain('–');
  });

  it('shows the old four-hole line only when bestRound is set', () => {
    const save = fakeSave();
    save.bestRound = null;
    const { root } = openApp(fakeDeps(save, fakeApi(null, []), []));
    expect(root.text()).not.toContain('Old four-hole card');
    expect(root.text()).toContain('Best round: 38 (+4)');
  });

  it('starts hole 1 from the Play button and closes the tablet', () => {
    const calls: number[] = [];
    const toasts: string[] = [];
    const { root, closed } = openApp(fakeDeps(fakeSave(), fakeApi(null, calls), toasts));
    const play = root.find((e) => e.tagName === 'button');
    expect(play?.disabled).toBe(false);
    play?.click();
    expect(calls).toEqual([0]);
    expect(toasts).toEqual([]);
    expect(closed).toEqual(['closed']);
  });

  it('toasts the reason when the round cannot start', () => {
    const calls: number[] = [];
    const toasts: string[] = [];
    const { root, closed } = openApp(fakeDeps(fakeSave(), fakeApi('Too far from Hedgeworth.', calls), toasts));
    root.find((e) => e.tagName === 'button')?.click();
    expect(calls).toEqual([0]);
    expect(toasts).toEqual(['Too far from Hedgeworth.']);
    expect(closed).toEqual([]);
  });

  it('disables the Play button when there is no runtime', () => {
    const { root } = openApp(fakeDeps(emptyGolfSave(), null, []));
    expect(root.find((e) => e.tagName === 'button')?.disabled).toBe(true);
  });
});
