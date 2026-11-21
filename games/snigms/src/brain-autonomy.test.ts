// The gnome's own choices with the player's suggestions in play: a crash-out ignores everything, a refusal costs temper,
// an accepted suggestion walks, a free evening in town happens once a day, and the gnome heads home at bedtime.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrain } from './brain';
import { TEMPER_REFUSED, TOWN_CLOSE_HOUR } from './config';
import { newHousehold, dayOf } from './sim';
import { townLot } from './town';
import { placeItem } from './world';
import type { App, GnomePuppet, Household } from './types';

afterEach(() => vi.restoreAllMocks());

function fakePuppet(): GnomePuppet {
  return { setPosition: vi.fn(), setFacing: vi.fn(), setPose: vi.fn(), setVisible: vi.fn(), update: vi.fn() };
}

function fakeApp(h: Household) {
  const toast = vi.fn();
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
    sfx: vi.fn(),
    event,
    here: () => (h.gnome.where === 'town' ? townLot() : h.lot),
    say: vi.fn(),
  } as unknown as App;
  return { app, toast, event };
}

function household(): Household {
  const h = newHousehold({ householdName: 'The Testbottoms', gnomeName: 'Pip', trait: 'neat', lot: 'empty' });
  h.funds = 500;
  return h;
}

describe('suggestions', () => {
  it('are refused during a crash-out', () => {
    const h = household();
    const item = placeItem(h.lot, 'fridge', 5, 5, 0);
    expect(item).not.toBeNull();
    h.gnome.needs.hunger = 10;
    h.gnome.crash = { until: h.clock + 500 };
    const { app, toast } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    brain.suggestUse(item!.id);
    expect(toast).toHaveBeenLastCalledWith(expect.stringContaining('Not listening'));
    expect(brain.state).not.toBe('walking');
  });

  it('can be ignored by a stewing gnome, and the refusal costs temper', () => {
    const h = household();
    const item = placeItem(h.lot, 'fridge', 5, 5, 0);
    h.gnome.temper = 25; // obeyChance(25) is about 0.29: a roll of 0.99 is refused
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { app, toast } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    brain.suggestUse(item!.id);
    expect(toast).toHaveBeenLastCalledWith('Pip ignores you.');
    expect(h.gnome.temper).toBe(25 - TEMPER_REFUSED);
    expect(brain.state).not.toBe('walking');
  });

  it('are walked to when the gnome is calm and the roll goes its way', () => {
    const h = household();
    const item = placeItem(h.lot, 'fridge', 5, 5, 0);
    h.gnome.temper = 90;
    vi.spyOn(Math, 'random').mockReturnValue(0); // the obey roll succeeds
    const { app, event } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    brain.suggestUse(item!.id);
    expect(brain.state).toBe('walking');
    expect(event).toHaveBeenCalledWith('obeyed');
  });

  it('suggesting a neighbour at home is turned down with a reason', () => {
    const h = household();
    const { app, toast } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    brain.suggestChat('wren');
    expect(toast).toHaveBeenLastCalledWith(expect.stringContaining('Nobody to talk to at home'));
  });
});

describe('an evening out', () => {
  it('takes the gnome to town once a day, and back home by bedtime', () => {
    const h = household();
    h.clock = 18 * 60; // 18:00 on day 1
    h.gnome.lastTownDay = 0;
    vi.spyOn(Math, 'random').mockReturnValue(0); // the free-trip roll succeeds and every other roll is low
    const { app } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    let wentToTown = false;
    for (let i = 0; i < 4000 && !wentToTown; i++) {
      brain.update(0.1, 0.2);
      if (h.gnome.where === 'town') wentToTown = true;
    }
    expect(wentToTown).toBe(true);
    expect(h.gnome.lastTownDay).toBe(dayOf(h.clock));

    // Past bedtime the gnome heads home.
    h.clock = Math.floor(h.clock / 1440) * 1440 + TOWN_CLOSE_HOUR * 60;
    let home = false;
    for (let i = 0; i < 4000 && !home; i++) {
      brain.update(0.1, 0.2);
      if (h.gnome.where === 'home') home = true;
    }
    expect(home).toBe(true);
  });

  it('does not start while the gnome is in a crash-out', () => {
    const h = household();
    h.clock = 18 * 60;
    h.gnome.lastTownDay = 0;
    h.gnome.crash = { until: h.clock + 10000 };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { app } = fakeApp(h);
    const brain = createBrain(app, fakePuppet());
    for (let i = 0; i < 1500; i++) brain.update(0.1, 0.2);
    expect(h.gnome.where).toBe('home');
    expect(h.gnome.trip).toBeNull();
  });
});
