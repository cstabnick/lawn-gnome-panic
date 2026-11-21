import { describe, expect, it, vi } from 'vitest';
import { createBrain } from './brain';
import { newHousehold, dayOf } from './sim';
import { placeItem } from './world';
import type { App, GnomePuppet, Household } from './types';

function fakePuppet(): GnomePuppet {
  return {
    setPosition: vi.fn(),
    setFacing: vi.fn(),
    setPose: vi.fn(),
    setVisible: vi.fn(),
    update: vi.fn(),
  };
}

function fakeApp(h: Household) {
  const toast = vi.fn();
  const sfx = vi.fn();
  const event = vi.fn();
  const app = {
    h,
    mode: 'live',
    speed: 1,
    tool: { tool: 'select', kind: null, floor: 'wood', rot: 0 },
    selected: null,
    walls: 'up',
    activity: '',
    lotChanged: vi.fn(),
    stateChanged: vi.fn(),
    toast,
    sfx,
    event,
    here: () => h.lot,
    say: vi.fn(),
  } as unknown as App;
  return { app, toast, sfx, event };
}

function household(): Household {
  return newHousehold({ householdName: 'The Testbottoms', gnomeName: 'Pip', trait: 'neat', lot: 'empty' });
}

describe('brain', () => {
  it('eats from a fridge when hunger is low', () => {
    const h = household();
    h.funds = 500;
    expect(placeItem(h.lot, 'fridge', 5, 5, 0)).not.toBeNull();
    h.gnome.needs.hunger = 10;
    const { app } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    for (let i = 0; i < 3000; i++) brain.update(0.1, 0.2);
    expect(h.gnome.needs.hunger).toBeGreaterThan(50);
  });

  it('a bed fixes energy', () => {
    const h = household();
    h.funds = 500;
    expect(placeItem(h.lot, 'bed', 2, 2, 0)).not.toBeNull();
    h.gnome.needs.energy = 10;
    const { app } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    for (let i = 0; i < 3000; i++) brain.update(0.1, 0.2);
    expect(h.gnome.needs.energy).toBeGreaterThan(50);
  });

  it('with no toilet, a low bladder toasts and the gnome wanders', () => {
    const h = household();
    h.gnome.needs.bladder = 10;
    const { app, toast } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    for (let i = 0; i < 20; i++) brain.update(0.1, 0);
    expect(toast).toHaveBeenCalledWith('Need a toilet!');
    expect(toast.mock.calls.filter((c) => c[0] === 'Need a toilet!')).toHaveLength(1);
  });

  it('a job walks to the carpool stop, works a shift and comes home paid', () => {
    const h = household();
    h.funds = 100;
    h.gnome.job = 'gardener';
    h.clock = 8 * 60; // day 1 (a Monday, a work day), 08:00: the shift window opens
    const { app, toast } = fakeApp(h);
    const puppet = fakePuppet();
    const brain = createBrain(app, puppet);
    let sawWork = false;
    for (let i = 0; i < 30000; i++) {
      brain.update(0.1, 0.2);
      if (brain.state === 'working') sawWork = true;
      if (sawWork && h.gnome.workUntil === null) break;
    }
    expect(sawWork).toBe(true);
    expect(h.gnome.workUntil).toBeNull();
    expect(h.gnome.lastShiftDay).toBe(dayOf(8 * 60));
    expect(h.funds).toBeGreaterThan(100);
    expect(toast.mock.calls.some((c) => String(c[0]).startsWith('Back from work: +'))).toBe(true);
  });
});
