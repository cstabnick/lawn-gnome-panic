// The garages at runtime: buying Hangar Two and the Mossbank Boathouse on foot, the water and air drop rules of the
// Sling-Lift, and the Lock-Up achievements. The shared fake DOM has no head, body, window or element events, so this
// file adds the few it needs (the sheet is never opened here).
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

vi.mock('../audio', () => ({ play: () => undefined }));

installFakeDom();

type AnyObj = Record<string, unknown>;

/** A minimal element: enough for the sheet and the store button to be built without a browser. */
function stubEl(tag: string): AnyObj {
  const el: AnyObj = {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    type: '',
    textContent: '',
    style: {},
    dataset: {},
    children: [],
    classList: { add() { /* none */ }, remove() { /* none */ }, contains: () => false, toggle() { /* none */ } },
    appendChild(c: unknown) {
      (el.children as unknown[]).push(c);
      return c;
    },
    replaceChildren() {
      el.children = [];
    },
    setAttribute() { /* none */ },
    addEventListener() { /* none */ },
    removeEventListener() { /* none */ },
    querySelectorAll: () => [],
    querySelector: () => null,
  };
  return el;
}

function patchDom(): void {
  const doc = document as unknown as AnyObj;
  const orig = (doc.createElement as (tag: string) => unknown).bind(doc);
  doc.createElement = (tag: string) => (tag === 'canvas' ? orig(tag) : stubEl(tag));
  doc.head = stubEl('head');
  doc.body = stubEl('body');
  const g = globalThis as AnyObj;
  g.window ??= { addEventListener() { /* none */ }, removeEventListener() { /* none */ } };
}
patchDom();

const { createLockup } = await import('./runtime');
const { createLockupStore } = await import('./store');
const { createDeedStore } = await import('./deeds');
type LockupDepsT = Parameters<typeof createLockup>[0];

function memory() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string): string | null => m.get(k) ?? null,
    setItem: (k: string, v: string): void => { m.set(k, v); },
  };
}

interface TestProbe {
  ground(x: number, z: number): number;
  water(x: number, z: number): number;
  slope(x: number, z: number): number;
  blocked(x: number, z: number, r: number): boolean;
}

/** Dry, flat, open ground everywhere. */
const DRY: TestProbe = { ground: () => 0, water: () => 0, slope: () => 0, blocked: () => false };
/** Open water 3 m deep everywhere (ground -3). */
const DEEP: TestProbe = { ground: () => -3, water: () => 3, slope: () => 0, blocked: () => false };

function make(acorns: number, at: { x: number; z: number }, probe: TestProbe) {
  const state = { acorns };
  const unlock = vi.fn();
  const deps = {
    scene: new THREE.Scene(),
    ui: document.createElement('div') as unknown as HTMLElement,
    hud: { toast: vi.fn(), banner: vi.fn() },
    economy: {
      state: () => ({ acorns: state.acorns }),
      spend: (n: number) => {
        if (state.acorns < n) return false;
        state.acorns -= n;
        return true;
      },
      earn: vi.fn(),
    },
    play: vi.fn(),
    vehicles: [] as unknown[],
    player: () => ({ x: at.x, y: 0, z: at.z, vehicle: null }),
    stepOut: vi.fn(),
    blocked: () => null,
    probe,
    achievements: { unlock },
    phone: { addApp: vi.fn() },
    store: createLockupStore(memory(), { ground: 5, air: 3, water: 3 }),
    deeds: createDeedStore(memory()),
  };
  const lk = createLockup(deps as unknown as LockupDepsT);
  return { lk, deps, state, unlock };
}

describe('Hangar Two (air)', () => {
  it('is bought on foot at the site: the prompt shows the price, and only enough Acorns buy it', () => {
    const poor = make(100, { x: 480, z: -70 }, DRY);
    expect(poor.lk.prompt()).toBe('Buy Hangar Two · 1800 Acorns');
    poor.lk.interact();
    expect(poor.lk.owns('air')).toBe(false);
    expect(poor.state.acorns).toBe(100);

    const rich = make(2000, { x: 480, z: -70 }, DRY);
    rich.lk.interact();
    expect(rich.lk.owns('air')).toBe(true);
    expect(rich.state.acorns).toBe(200);
    expect(rich.lk.prompt()).toBe('Open Hangar Two');
  });

  it('drops an aircraft on a flat dry open probe once Hangar Two is owned', () => {
    const t = make(500, { x: 0, z: 0 }, DRY);
    const rec = t.lk.addRecord('hedge-hopper');
    expect(rec).not.toBeNull();
    t.lk.buy('air', true);
    expect(t.lk.callDelivery(rec!.uid)).toBeNull();
  });
});

describe('landed achievement', () => {
  it('unlocks gta-landed-gnome once both estates are owned', () => {
    const t = make(0, { x: 0, z: 0 }, DRY);
    t.lk.buy('air', true);
    expect(t.unlock).not.toHaveBeenCalledWith('gta-landed-gnome');
    t.lk.buy('water', true);
    expect(t.unlock).toHaveBeenCalledWith('gta-landed-gnome');
  });
});

describe('Mossbank Boathouse (water)', () => {
  it('refuses a boat delivery until the boathouse is owned', () => {
    const t = make(500, { x: 0, z: 0 }, DRY);
    const rec = t.lk.addRecord('clog-cruiser');
    expect(rec).not.toBeNull();
    const err = t.lk.callDelivery(rec!.uid);
    expect(err).toContain('do not own');
  });

  it('refuses on dry land and drops the boat on deep open water once owned', () => {
    const t = make(500, { x: 0, z: 0 }, DRY);
    const rec = t.lk.addRecord('clog-cruiser');
    t.lk.buy('water', true);
    expect(t.lk.callDelivery(rec!.uid)).toMatch(/No open water/);

    const deep = make(500, { x: 0, z: 0 }, DEEP);
    const boat = deep.lk.addRecord('clog-cruiser');
    deep.lk.buy('water', true);
    expect(deep.lk.callDelivery(boat!.uid)).toBeNull();
    expect(deep.state.acorns).toBe(500 - 100);
  });
});
