import { beforeEach, describe, expect, it, vi } from 'vitest';

// The HUD only needs a sliver of the DOM: elements with text, classes, style, children and listeners, plus window
// key listeners. The fake below keeps just that, so the test runs under node without installFakeDom.

type Listener = (e: any) => void;

class FakeEl {
  tagName: string;
  className = '';
  id = '';
  type = '';
  textContent = '';
  style: Record<string, string> = {};
  children: FakeEl[] = [];
  attrs: Record<string, string> = {};
  parent: FakeEl | null = null;
  listeners: Record<string, Listener[]> = {};
  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }
  get classList() {
    const self = this;
    return {
      toggle(c: string, on: boolean) {
        const set = new Set(self.className.split(' ').filter(Boolean));
        if (on) set.add(c);
        else set.delete(c);
        self.className = [...set].join(' ');
      },
    };
  }
  append(...nodes: FakeEl[]) {
    for (const n of nodes) {
      n.parent?.children.splice(n.parent.children.indexOf(n), 1);
      n.parent = this;
      this.children.push(n);
    }
  }
  remove() {
    if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
  }
  setAttribute(k: string, v: string) {
    this.attrs[k] = v;
  }
  getAttribute(k: string) {
    return k in this.attrs ? this.attrs[k] : null;
  }
  hasAttribute(k: string) {
    return k in this.attrs;
  }
  removeAttribute(k: string) {
    delete this.attrs[k];
  }
  addEventListener(t: string, l: Listener) {
    (this.listeners[t] ??= []).push(l);
  }
  removeEventListener(t: string, l: Listener) {
    this.listeners[t] = (this.listeners[t] ?? []).filter((x) => x !== l);
  }
  dispatch(t: string, e: any = {}) {
    for (const l of this.listeners[t] ?? []) l({ stopPropagation() {}, ...e });
  }
}

const windowListeners: Record<string, Listener[]> = {};
const body = new FakeEl('body');
const head = new FakeEl('head');

vi.mock('../ui/glyphs', () => ({ glyphText: () => 'I' }));
vi.mock('../ui/inputSource', () => ({
  currentGlyphSet: () => 'keyboard',
  onInputSourceChange: () => () => {},
}));
vi.mock('@lawn/gamepad', () => ({ firstPad: () => null }));
vi.mock('../jobs/defs', () => ({ JOB_PAD_BUTTON: 11 }));

function findAll(node: FakeEl, pred: (n: FakeEl) => boolean): FakeEl[] {
  const out: FakeEl[] = [];
  for (const c of node.children) {
    if (pred(c)) out.push(c);
    out.push(...findAll(c, pred));
  }
  return out;
}

beforeEach(() => {
  for (const k of Object.keys(windowListeners)) delete windowListeners[k];
  body.children = [];
  head.children = [];
  const g = globalThis as Record<string, unknown>;
  g.document = {
    body,
    head,
    createElement: (tag: string) => new FakeEl(tag),
    getElementById: (id: string) => findAll(head, (n) => n.id === id)[0] ?? null,
  };
  g.window = {
    addEventListener: (t: string, l: Listener) => (windowListeners[t] ??= []).push(l),
    removeEventListener: (t: string, l: Listener) => {
      windowListeners[t] = (windowListeners[t] ?? []).filter((x) => x !== l);
    },
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
});

function keydown(code: string) {
  for (const l of windowListeners.keydown ?? []) l({ code, repeat: false, preventDefault() {}, target: null });
}

const view = (action: string | null = 'Lift bin') => ({
  icon: '🗑️',
  title: 'Bin round: 4 of 9 bins',
  lines: ['Next bin: 120 m', 'Tank 64%'],
  meter: { label: 'Load', frac: 0.64 },
  action,
  color: '#7bd389',
});

describe('createShiftHud', () => {
  it('shows the view title, and set(null) hides the root', async () => {
    const { createShiftHud } = await import('./shiftHud');
    const ui = new FakeEl('div');
    body.append(ui);
    const hud = createShiftHud(ui as unknown as HTMLElement);
    const root = findAll(ui, (n) => n.id === 'gta-shift-hud')[0];
    expect(root.style.display).toBe('none');

    hud.set(view());
    const titles = findAll(root, (n) => n.className === 'gta-sh-title');
    expect(titles[0].textContent).toBe('Bin round: 4 of 9 bins');
    expect(root.style.display).toBe('flex');
    expect(findAll(root, (n) => n.className === 'gta-sh-caption')[0].textContent).toBe('Load 64%');

    hud.set(null);
    expect(root.style.display).toBe('none');
    hud.dispose();
    expect(findAll(ui, (n) => n.id === 'gta-shift-hud')).toHaveLength(0);
  });

  it('fires onAction from the I key only while the action button shows', async () => {
    const { createShiftHud } = await import('./shiftHud');
    const ui = new FakeEl('div');
    const hud = createShiftHud(ui as unknown as HTMLElement);
    const cb = vi.fn();
    const off = hud.onAction(cb);

    keydown('KeyI');
    expect(cb).not.toHaveBeenCalled();

    hud.set(view('Man the hose'));
    keydown('KeyI');
    expect(cb).toHaveBeenCalledTimes(1);

    hud.set(view(null));
    keydown('KeyI');
    expect(cb).toHaveBeenCalledTimes(1);

    off();
    hud.set(view());
    keydown('KeyI');
    expect(cb).toHaveBeenCalledTimes(1);
    hud.dispose();
  });
});
