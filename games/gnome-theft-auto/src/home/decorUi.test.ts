// The decorate panel: opening the shop and buying puts the piece in storage. Uses a tiny fake DOM (fakeDom.ts has no
// events or children, which the panel needs).
import { describe, expect, it } from 'vitest';
import { createDecorPanel } from './decorUi';
import { loadLayout, resetLayoutCache } from './layout';

class El {
  children: El[] = [];
  style: Record<string, string> = {};
  attrs: Record<string, string> = {};
  handlers: Record<string, (e: unknown) => void> = {};
  className = '';
  textContent = '';
  width = 0;
  height = 0;
  clientWidth = 0;
  classList = { add: () => {}, remove: () => {} };
  constructor(public tag: string) {}
  get firstChild(): El | null { return this.children[0] ?? null; }
  appendChild(c: El): El { this.children.push(c); return c; }
  removeChild(c: El): El { this.children = this.children.filter((x) => x !== c); return c; }
  setAttribute(k: string, v: string): void { this.attrs[k] = v; }
  removeAttribute(k: string): void { delete this.attrs[k]; }
  addEventListener(t: string, f: (e: unknown) => void): void { this.handlers[t] = f; }
  getContext(): null { return null; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 300 }; }
}
const walk = (e: El, out: El[] = []): El[] => { out.push(e); e.children.forEach((c) => walk(c, out)); return out; };

describe('decor panel', () => {
  it('buying a bed delivers it to storage', () => {
    const g = globalThis as Record<string, unknown>;
    g.document = {
      createElement: (t: string) => new El(t),
      createTextNode: (s: string) => { const e = new El('#text'); e.textContent = s; return e; },
      head: new El('head'),
      body: new El('body'),
    };
    g.window = { devicePixelRatio: 1, addEventListener: () => {}, removeEventListener: () => {} };
    resetLayoutCache();
    loadLayout({ getItem: () => null, setItem: () => {} });
    const ui = new El('div');
    const toasts: string[] = [];
    const economy = { state: () => ({ acorns: 500 }), spend: () => true } as never;
    const panel = createDecorPanel({ ui: ui as unknown as HTMLElement, economy, toast: (t) => toasts.push(t) });
    panel.open('shop');
    expect(panel.isOpen()).toBe(true);
    const buy = walk(ui).find((e) => e.tag === 'button' && e.children[0]?.textContent === 'Buy')!;
    buy.handlers.click({});
    expect(loadLayout().stored.bed).toBe(1);
    expect(toasts[0]).toContain('delivered');
    panel.close();
    expect(panel.isOpen()).toBe(false);
  });
});
