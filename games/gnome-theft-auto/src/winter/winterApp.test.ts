// Winter sports (E12): the Snowdrop app and the Hot Cocoa item. Node has no DOM, so this file brings a tiny element stand-in.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { _resetGnomletApps, getGnomletApp } from '../gnomlet/registry';
import { ITEMS, itemDef } from '../inventory';
import { createWinterStore } from './save';
import { BLACK_DIAMOND_S } from './types';
import { registerWinterApp, registerWinterItems, type WinterAppCtx } from './winterApp';

class FakeEl {
  children: FakeEl[] = [];
  parent: FakeEl | null = null;
  style = { cssText: '' };
  textContent = '';
  type = '';
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
    return this.children.flatMap((c) => [...(pred(c) ? [c] : []), ...c.findAll(pred)]);
  }
  find(pred: (e: FakeEl) => boolean): FakeEl | undefined {
    for (const c of this.children) {
      if (pred(c)) return c;
      const hit = c.find(pred);
      if (hit) return hit;
    }
    return undefined;
  }
}

const g = globalThis as Record<string, unknown>;
const memory = { getItem: () => null, setItem: () => {} };

beforeAll(() => {
  g.document = { createElement: (tag: string) => new FakeEl(tag) };
});

afterAll(() => {
  delete g.document;
});

function fakeCtx(calls: string[]): WinterAppCtx {
  return {
    store: () => createWinterStore(memory),
    dropSled: () => null,
    startRun: (id) => {
      calls.push(id);
      return null;
    },
    toast: () => {},
  };
}

describe('winter items', () => {
  it('registers Hot Cocoa once', () => {
    registerWinterItems();
    registerWinterItems();
    expect(itemDef('hot-cocoa')).toBeDefined();
    expect(ITEMS.filter((d) => d.id === 'hot-cocoa')).toHaveLength(1);
  });
});

describe('Snowdrop app', () => {
  it('registers under ski-runs with the Snowdrop label', () => {
    _resetGnomletApps();
    registerWinterApp(fakeCtx([]));
    expect(getGnomletApp('ski-runs')?.label).toBe('Snowdrop');
  });

  it('opens the Wool Run card and starts it from the first button', () => {
    _resetGnomletApps();
    const calls: string[] = [];
    registerWinterApp(fakeCtx(calls));
    const app = getGnomletApp('ski-runs');
    const root = new FakeEl('div') as unknown as HTMLElement;
    const closed: string[] = [];
    const tablet = { close: () => closed.push('closed'), home: () => {}, setTitle: () => {} };
    app?.open?.(root, tablet);
    const rootEl = root as unknown as FakeEl;
    expect(rootEl.text()).toContain('the Wool Run');
    const first = rootEl.find((e) => e.tagName === 'button');
    first?.click();
    expect(calls).toEqual(['wool-run']);
    expect(closed).toEqual(['closed']);
  });

  it('has a Nursery card after the Wool Run card, with its own Ski it button', () => {
    _resetGnomletApps();
    const calls: string[] = [];
    registerWinterApp(fakeCtx(calls));
    const root = new FakeEl('div') as unknown as HTMLElement;
    const tablet = { close: () => {}, home: () => {}, setTitle: () => {} };
    getGnomletApp('ski-runs')?.open?.(root, tablet);
    const rootEl = root as unknown as FakeEl;
    const text = rootEl.text();
    expect(text).toContain('the Nursery');
    expect(text.indexOf('the Nursery')).toBeGreaterThan(text.indexOf('the Wool Run'));
    expect(text.indexOf('the Nursery')).toBeLessThan(text.indexOf('the Tea-Tray Run'));
    expect(text).toContain(`clean in ≤ ${BLACK_DIAMOND_S.toFixed(1)} s`);
    const buttons = rootEl.findAll((e) => e.tagName === 'button');
    buttons[1]?.click();
    expect(calls).toEqual(['nursery']);
  });
});
