// E26: the bookie's panel. Runs under node with a tiny fake DOM (a child tree, click and keydown dispatch).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openWagerPanel, type WagerPanelOpts } from './wagerPanel';

type Listener = (e: unknown) => void;

class FakeEl {
  id = '';
  type = '';
  textContent = '';
  disabled = false;
  style = { cssText: '' };
  children: FakeEl[] = [];
  parent: FakeEl | null = null;
  attrs: Record<string, string> = {};
  listeners: Record<string, Listener[]> = {};
  constructor(readonly tagName: string) {}
  get firstChild(): FakeEl | null {
    return this.children[0] ?? null;
  }
  appendChild(c: FakeEl): FakeEl {
    c.parent?.removeChild(c);
    c.parent = this;
    this.children.push(c);
    return c;
  }
  removeChild(c: FakeEl): FakeEl {
    const i = this.children.indexOf(c);
    if (i >= 0) this.children.splice(i, 1);
    c.parent = null;
    return c;
  }
  remove(): void {
    this.parent?.removeChild(this);
  }
  setAttribute(k: string, v: string): void {
    this.attrs[k] = v;
  }
  addEventListener(t: string, f: Listener): void {
    (this.listeners[t] ??= []).push(f);
  }
  removeEventListener(t: string, f: Listener): void {
    this.listeners[t] = (this.listeners[t] ?? []).filter((x) => x !== f);
  }
  click(): void {
    if (this.disabled) return;
    for (const f of [...(this.listeners.click ?? [])]) f({ type: 'click' });
  }
  all(tag: string): FakeEl[] {
    const out: FakeEl[] = [];
    const walk = (n: FakeEl): void => {
      for (const c of n.children) {
        if (c.tagName === tag) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
}

class FakeDocument {
  keyListeners: Listener[] = [];
  createElement(tag: string): FakeEl {
    return new FakeEl(tag.toUpperCase());
  }
  addEventListener(_t: string, f: Listener): void {
    this.keyListeners.push(f);
  }
  removeEventListener(_t: string, f: Listener): void {
    this.keyListeners = this.keyListeners.filter((x) => x !== f);
  }
  pressKey(key: string): void {
    for (const f of [...this.keyListeners]) f({ key });
  }
}

const g = globalThis as unknown as { document?: unknown };
let doc: FakeDocument;
let parent: FakeEl;

beforeEach(() => {
  doc = new FakeDocument();
  g.document = doc;
  parent = new FakeEl('DIV');
});

afterEach(() => {
  delete g.document;
});

function opts(over: Partial<WagerPanelOpts> = {}): WagerPanelOpts & { picks: [string, number][]; closes: number } {
  const rec = { picks: [] as [string, number][], closes: 0 };
  return {
    parent: parent as unknown as HTMLElement,
    title: "Dot Wagstaff's book",
    line: 'Pick a street, pick a stake.',
    tracks: [
      { id: 'kerb-row-circuit', name: 'Kerb Row Circuit', best: 75.25 },
      { id: 'skyway-sprint', name: 'Skyway Sprint', best: null },
    ],
    wagers: [0, 5, 20, 50],
    acorns: 10,
    onPick: (t, w) => rec.picks.push([t, w]),
    onClose: () => rec.closes++,
    ...over,
    get picks() {
      return rec.picks;
    },
    get closes() {
      return rec.closes;
    },
  } as WagerPanelOpts & { picks: [string, number][]; closes: number };
}

function buttonsWith(text: string): FakeEl[] {
  return parent.all('BUTTON').filter((b) => b.textContent.includes(text));
}

describe('openWagerPanel', () => {
  it('appends a panel with the routes, best times and stakes', () => {
    openWagerPanel(opts());
    const panel = parent.children[0];
    expect(panel.id).toBe('gta-wager-panel');
    expect(parent.all('H3')[0].textContent).toBe("Dot Wagstaff's book");
    expect(buttonsWith('Kerb Row Circuit - 1:15.3').length).toBe(1);
    expect(buttonsWith('Skyway Sprint - no time yet').length).toBe(1);
    const stakes = parent.all('BUTTON').map((b) => b.textContent);
    expect(stakes).toContain('Friendly');
    expect(stakes).toContain('5 Acorns');
    expect(stakes).toContain('50 Acorns');
    for (const b of parent.all('BUTTON')) expect(b.attrs.type ?? 'button').toBe('button');
  });

  it('disables stakes above the Acorns the player has', () => {
    openWagerPanel(opts({ acorns: 10 }));
    expect(buttonsWith('20 Acorns')[0].disabled).toBe(true);
    expect(buttonsWith('50 Acorns')[0].disabled).toBe(true);
    expect(buttonsWith('5 Acorns')[0].disabled).toBe(false);
    expect(buttonsWith('Friendly')[0].disabled).toBe(false);
  });

  it('picking a route and stake then Race calls onPick and removes the panel', () => {
    const o = opts();
    openWagerPanel(o);
    buttonsWith('Skyway Sprint')[0].click();
    buttonsWith('5 Acorns')[0].click();
    buttonsWith('Race!')[0].click();
    expect(o.picks).toEqual([['skyway-sprint', 5]]);
    expect(parent.children.length).toBe(0);
    expect(o.closes).toBe(0);
  });

  it('the first route and the first stake are selected by default', () => {
    const o = opts();
    openWagerPanel(o);
    buttonsWith('Race!')[0].click();
    expect(o.picks).toEqual([['kerb-row-circuit', 0]]);
  });

  it('Not now calls onClose and removes the panel', () => {
    const o = opts();
    openWagerPanel(o);
    buttonsWith('Not now')[0].click();
    expect(o.closes).toBe(1);
    expect(o.picks.length).toBe(0);
    expect(parent.children.length).toBe(0);
  });

  it('Escape closes via onClose, and close() is idempotent', () => {
    const o = opts();
    const panel = openWagerPanel(o);
    doc.pressKey('Escape');
    expect(o.closes).toBe(1);
    expect(parent.children.length).toBe(0);
    panel.close();
    doc.pressKey('Escape');
    expect(o.closes).toBe(1);
    expect(doc.keyListeners.length).toBe(0);
  });

  it('close() removes the panel without calling onClose', () => {
    const o = opts();
    const panel = openWagerPanel(o);
    panel.close();
    expect(parent.children.length).toBe(0);
    expect(o.closes).toBe(0);
  });
});
