import { beforeEach, describe, expect, it } from 'vitest';
import { _resetGnomletApps, getGnomletApp, listGnomletApps, onGnomletAppsChange, registerGnomletApp, unregisterGnomletApp } from './registry';
import { BRIDGED, GNOMLET_CSS, nearestInDirection } from './gnomlet';
import { ACTIONS } from '../ui/actions';

/** The declarations of the first CSS rule whose selector is exactly `sel`. */
function cssRule(css: string, sel: string): string {
  const flat = css.replace(/\s+/g, ' ');
  const i = flat.indexOf(`${sel}{`);
  return i < 0 ? '' : flat.slice(i + sel.length + 1, flat.indexOf('}', i));
}

describe('Gnomlet app registry', () => {
  beforeEach(() => _resetGnomletApps());

  it('lists apps by group, then order, then label, and hides unavailable ones', () => {
    registerGnomletApp({ id: 'b', label: 'Bee', icon: 'b', group: 'fun', run: () => {} });
    registerGnomletApp({ id: 'a', label: 'Ant', icon: 'a', group: 'fun', run: () => {} });
    registerGnomletApp({ id: 'o', label: 'Options', icon: 'o', group: 'system', order: 1, open: () => {} });
    registerGnomletApp({ id: 't', label: 'Taxi', icon: 't', group: 'phone', run: () => {} });
    registerGnomletApp({ id: 'x', label: 'Hidden', icon: 'x', group: 'phone', available: () => false, run: () => {} });
    expect(listGnomletApps().map((a) => a.id)).toEqual(['t', 'a', 'b', 'o']);
  });

  it('replaces an app with the same id and tells listeners', () => {
    let n = 0;
    const off = onGnomletAppsChange(() => n++);
    registerGnomletApp({ id: 'bag', label: 'Bag', icon: '1', run: () => {} });
    registerGnomletApp({ id: 'bag', label: 'Bag', icon: '2', run: () => {} });
    expect(getGnomletApp('bag')?.icon).toBe('2');
    unregisterGnomletApp('bag');
    expect(getGnomletApp('bag')).toBeUndefined();
    expect(n).toBe(3);
    off();
  });

  it('rejects an app with neither open nor run', () => {
    expect(() => registerGnomletApp({ id: 'nope', label: 'Nope', icon: '?' })).toThrow();
  });
});

describe('Gnomlet shell', () => {
  it('takes pointer events (its parent #ui does not): the old More menu bug', () => {
    expect(cssRule(GNOMLET_CSS, '#gta-gnomlet')).toMatch(/pointer-events:\s*auto/);
  });

  it('keeps every former More tile reachable (bridged, a phone app, or Options itself)', () => {
    for (const a of ACTIONS.filter((x) => x.inMore)) {
      if (a.id === 'phone' || a.id === 'options') continue; // the tablet itself; options.ts registers the Options app
      expect(BRIDGED.map((b) => b.id), `${a.id} bridged`).toContain(a.id);
    }
  });

  it('moves pad focus to the nearest element in a direction', () => {
    const a = { x: 0, y: 0 };
    const right = { x: 100, y: 0 };
    const below = { x: 0, y: 100 };
    const diag = { x: 90, y: 80 };
    const list = [a, right, below, diag];
    expect(nearestInDirection(a, list, 1, 0)).toBe(right);
    expect(nearestInDirection(a, list, 0, 1)).toBe(below);
    expect(nearestInDirection(a, list, -1, 0)).toBeNull();
    expect(nearestInDirection(right, list, 0, 1)).toBe(diag);
  });
});
