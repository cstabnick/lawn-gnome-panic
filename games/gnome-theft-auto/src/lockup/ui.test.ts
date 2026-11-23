// The garage sheet: phone-mode garage tabs, the fee per kind, and the place name in each row.
// The shared fake DOM has no querySelector or click, so this file uses a small element stub of its own.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { StorageKind, StoredVehicle } from './types';

installFakeDom();
const { createLockupUi } = await import('./ui');

type Listener = (e: { target: unknown }) => void;

class FakeEl {
  tagName: string;
  id = '';
  className = '';
  type = '';
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  children: FakeEl[] = [];
  attrs: Record<string, string> = {};
  listeners: Record<string, Listener[]> = {};
  private text: string | null = null;

  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }

  get textContent(): string {
    if (this.text !== null) return this.text;
    return this.children.map((c) => c.textContent).join('');
  }

  set textContent(v: string) {
    this.text = v;
    this.children = [];
  }

  get classList(): { add(c: string): void; remove(c: string): void; contains(c: string): boolean } {
    const has = (c: string): boolean => this.className.split(/\s+/).includes(c);
    return {
      add: (c: string) => { if (!has(c)) this.className = `${this.className} ${c}`.trim(); },
      remove: (c: string) => { this.className = this.className.split(/\s+/).filter((x) => x && x !== c).join(' '); },
      contains: has,
    };
  }

  appendChild<T extends FakeEl>(c: T): T {
    this.children.push(c);
    return c;
  }

  replaceChildren(...nodes: FakeEl[]): void {
    this.children = nodes;
  }

  setAttribute(k: string, v: string): void {
    this.attrs[k] = String(v);
  }

  getAttribute(k: string): string | null {
    return this.attrs[k] ?? null;
  }

  addEventListener(type: string, fn: Listener): void {
    (this.listeners[type] ??= []).push(fn);
  }

  click(): void {
    for (const fn of this.listeners.click ?? []) fn({ target: this });
  }

  /** All descendants (depth first) that match a simple selector: `tag`, `.class`, or `tag.class`. */
  private walk(): FakeEl[] {
    const out: FakeEl[] = [];
    const visit = (n: FakeEl): void => {
      for (const c of n.children) {
        out.push(c);
        visit(c);
      }
    };
    visit(this);
    return out;
  }

  private matches(sel: string, el: FakeEl): boolean {
    const [tag, ...classes] = sel.split('.');
    if (tag && el.tagName !== tag.toUpperCase()) return false;
    return classes.every((c) => el.className.split(/\s+/).includes(c));
  }

  querySelectorAll<T = FakeEl>(sel: string): T[] {
    return this.walk().filter((el) => this.matches(sel, el)) as unknown as T[];
  }

  querySelector<T = FakeEl>(sel: string): T | null {
    return this.querySelectorAll<T>(sel)[0] ?? null;
  }
}

function installGlobals(): () => void {
  const g = globalThis as Record<string, unknown>;
  const saved = { document: g.document, window: g.window, requestAnimationFrame: g.requestAnimationFrame };
  const body = new FakeEl('body');
  const head = new FakeEl('head');
  g.document = {
    createElement: (tag: string) => new FakeEl(tag),
    head,
    body,
    pointerLockElement: null,
    exitPointerLock: () => {},
  };
  g.window = {
    addEventListener: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
  };
  // No frames run in these tests: the gamepad poll is never started.
  g.requestAnimationFrame = () => 0;
  return () => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete g[k];
      else g[k] = v;
    }
  };
}

function rec(uid: string, name: string): StoredVehicle {
  return {
    uid,
    kind: 'ride-on',
    variant: null,
    name,
    tint: 0,
    look: null,
    hp: 1,
    enginePitch: null,
    storedAt: 0,
  };
}

const LOT: Record<StorageKind, StoredVehicle[]> = {
  ground: [rec('lk-ground-1', 'Ground Gnomobile')],
  air: [rec('lk-air-1', 'Sky Gnat')],
  water: [],
};

function makeDeps(over: Record<string, unknown> = {}) {
  return {
    store: {
      list: (kind?: StorageKind) => (kind ? LOT[kind] : [...LOT.ground, ...LOT.air, ...LOT.water]),
      capacity: () => 2,
    },
    isOut: () => false,
    fee: vi.fn((k: StorageKind) => (k === 'air' ? 80 : 40)),
    cooldownLeft: () => 0,
    scrapValue: () => 10,
    deliver: vi.fn(() => null),
    takeOut: vi.fn(() => null),
    scrap: vi.fn(() => null),
    ...over,
  };
}

const TABS = [
  { kind: 'ground' as const, label: 'Lock-Up' },
  { kind: 'air' as const, label: 'Hangar Two' },
];

describe('createLockupUi (garage tabs)', () => {
  let restore: () => void;

  beforeAll(() => {
    restore = installGlobals();
  });

  afterAll(() => restore());

  function mount(deps: ReturnType<typeof makeDeps>) {
    const ui = new FakeEl('div') as unknown as HTMLElement;
    const sheet = createLockupUi(ui, deps as unknown as Parameters<typeof createLockupUi>[1]);
    return { ui, sheet };
  }

  function sheetRoot(ui: HTMLElement): FakeEl {
    return (ui as unknown as FakeEl).children[0];
  }

  function tabsOf(ui: HTMLElement): FakeEl[] {
    return sheetRoot(ui).querySelectorAll<FakeEl>('.gta-lockup-tab');
  }

  function names(ui: HTMLElement): string[] {
    return sheetRoot(ui).querySelectorAll<FakeEl>('.gta-lockup-name').map((n) => n.textContent);
  }

  it('phone mode with two garages shows two tabs', () => {
    const deps = makeDeps({ tabs: () => TABS });
    const { ui, sheet } = mount(deps);
    sheet.open('ground', 'phone', 'Lock-Up');
    expect(tabsOf(ui)).toHaveLength(2);
    expect(tabsOf(ui)[0].className).toContain('on');
    expect(tabsOf(ui)[1].className).not.toContain('on');
    expect(tabsOf(ui)[1].textContent).toBe('Hangar Two');
  });

  it('clicking the air tab re-renders with the air record', () => {
    const deps = makeDeps({ tabs: () => TABS });
    const { ui, sheet } = mount(deps);
    sheet.open('ground', 'phone', 'Lock-Up');
    expect(names(ui)).toContain('Ground Gnomobile');

    tabsOf(ui)[1].click();

    expect(names(ui)).toContain('Sky Gnat');
    expect(names(ui)).not.toContain('Ground Gnomobile');
    expect(tabsOf(ui)[1].className).toContain('on');
  });

  it('with one garage there is no tab strip', () => {
    const deps = makeDeps({ tabs: () => [TABS[0]] });
    const { ui, sheet } = mount(deps);
    sheet.open('ground', 'phone', 'Lock-Up');
    expect(tabsOf(ui)).toHaveLength(0);
  });

  it('fee is asked for the current kind', () => {
    const deps = makeDeps({ tabs: () => TABS });
    const { ui, sheet } = mount(deps);
    sheet.open('ground', 'phone', 'Lock-Up');
    expect(deps.fee).toHaveBeenLastCalledWith('ground');
    expect(sheetRoot(ui).querySelector('.gta-lockup-sub')?.textContent).toContain('Sling-Lift: 40 Acorns a drop');

    tabsOf(ui)[1].click();

    expect(deps.fee).toHaveBeenLastCalledWith('air');
    expect(sheetRoot(ui).querySelector('.gta-lockup-sub')?.textContent).toContain('Sling-Lift: 80 Acorns a drop');
  });

  it('the row meta uses placeName for the kind', () => {
    const deps = makeDeps({
      tabs: () => TABS,
      placeName: (k: StorageKind) => (k === 'air' ? 'Hangar Two' : 'the Lock-Up'),
    });
    const { ui, sheet } = mount(deps);
    sheet.open('ground', 'phone', 'Lock-Up');
    expect(sheetRoot(ui).querySelector('.gta-lockup-meta')?.textContent).toBe('100% · In the Lock-Up');

    tabsOf(ui)[1].click();
    expect(sheetRoot(ui).querySelector('.gta-lockup-meta')?.textContent).toBe('100% · In Hangar Two');
  });

  it('the row meta defaults to the Lock-Up without placeName', () => {
    const deps = makeDeps();
    const { ui, sheet } = mount(deps);
    sheet.open('ground', 'phone', 'Lock-Up');
    expect(sheetRoot(ui).querySelector('.gta-lockup-meta')?.textContent).toBe('100% · In the Lock-Up');
  });
});
