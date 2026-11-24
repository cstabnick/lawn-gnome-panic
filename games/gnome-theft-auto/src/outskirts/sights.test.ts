import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Economy } from '../economy';
import type { Hud } from '../types';
import { installFakeDom } from '../testing/fakeDom';
import { createTownSights, type SightsFrame } from './sights';
import type { TownNpcs } from './npcs';
import type { OutskirtsSave, OutskirtsStore } from './save';
import { emptyOutskirtsSave } from './save';
import { TOWN_ACHIEVEMENTS } from './town';

vi.mock('../sound', () => ({ playAt: vi.fn(() => true) }));

beforeAll(() => {
  installFakeDom();
});

function fakeStore(): OutskirtsStore & { save: OutskirtsSave } {
  const save = emptyOutskirtsSave();
  return {
    save,
    get: () => save,
    markVisited() {
      if (save.visited) return false;
      save.visited = true;
      return true;
    },
    markShop: () => false,
    addSouvenir: () => false,
    hasSouvenir: () => false,
    addWish() {
      save.wished += 1;
      return save.wished;
    },
    markJackpot() {
      if (save.wellJackpot) return false;
      save.wellJackpot = true;
      return true;
    },
    markKnocked() {
      if (save.knocked) return false;
      save.knocked = true;
      return true;
    },
  };
}

function fakeEconomy(acorns: number) {
  const state = { acorns };
  const economy = {
    state: () => ({ acorns: state.acorns }),
    earn: vi.fn((n: number) => { state.acorns += n; }),
    spend: vi.fn((n: number) => {
      if (state.acorns < n) return false;
      state.acorns -= n;
      return true;
    }),
  };
  return { state, economy };
}

function setup(acorns = 20) {
  const hud = { toast: vi.fn(), callout: vi.fn() };
  const { economy } = fakeEconomy(acorns);
  const store = fakeStore();
  const unlock = vi.fn();
  const sights = createTownSights({
    ui: { appendChild: () => {} } as unknown as HTMLElement,
    hud: hud as unknown as Hud,
    economy: economy as unknown as Economy,
    store,
    npcs: { cheer: vi.fn() } as unknown as TownNpcs,
    play: () => {},
    unlock,
  });
  return { sights, hud, economy, store, unlock };
}

function frame(px: number, pz: number, night = 0, dt = 0.1): SightsFrame {
  return { dt, px, pz, time: 'Noon', night };
}

describe('Pebblewick sights', () => {
  it('prompt names the nearest sight within reach and null far away', () => {
    const { sights } = setup();
    expect(sights.prompt(681, 92, 0)).toBe('Toss an Acorn in the wishing well (1 Acorn)');
    expect(sights.prompt(715.5, 176, 0)).toBe('Open the water tower valve');
    expect(sights.prompt(600, 50, 0)).toBeNull();
  });

  it('the 12th wish pays 15 Acorns', () => {
    const { sights, economy, hud, store } = setup(20);
    for (let i = 1; i <= 11; i++) {
      expect(sights.interact(681, 92, 0)).toBe(true);
    }
    expect(store.get().wished).toBe(11);
    expect(hud.toast).not.toHaveBeenCalledWith(expect.stringContaining('coughs up'));
    expect(sights.interact(681, 92, 0)).toBe(true);
    expect(store.get().wished).toBe(12);
    expect(economy.earn).toHaveBeenCalledWith(15, 'Wishing Well');
    expect(store.get().wellJackpot).toBe(true);
    expect(hud.toast).toHaveBeenCalledWith(expect.stringContaining('coughs up 15 Acorns'));
  });

  it('knocking by day does not unlock; by night unlocks the three am knock', () => {
    const day = setup();
    expect(day.sights.interact(845, 147, 0)).toBe(true);
    expect(day.unlock).not.toHaveBeenCalledWith('gta-three-am-knock');
    expect(day.store.get().knocked).toBe(false);

    const night = setup();
    expect(night.sights.interact(845, 147, 1)).toBe(true);
    expect(night.unlock).toHaveBeenCalledWith('gta-three-am-knock');
    expect(night.unlock).toHaveBeenCalledWith(TOWN_ACHIEVEMENTS.knock);
    expect(night.store.get().knocked).toBe(true);
  });

  it('walking into the town calls the callout once', () => {
    const { sights, hud, unlock } = setup();
    sights.update(frame(500, 100));
    expect(hud.callout).not.toHaveBeenCalled();
    sights.update(frame(655, 105));
    expect(hud.callout).toHaveBeenCalledTimes(1);
    expect(hud.callout).toHaveBeenCalledWith('PEBBLEWICK', 'Pop. 32. Welcome.');
    expect(unlock).toHaveBeenCalledWith(TOWN_ACHIEVEMENTS.visit);
    sights.update(frame(656, 105));
    sights.update(frame(656, 106));
    expect(hud.callout).toHaveBeenCalledTimes(1);
  });

  it('the very first update inside the town counts as an arrival', () => {
    const { sights, hud } = setup();
    sights.update(frame(655, 105));
    expect(hud.callout).toHaveBeenCalledTimes(1);
  });
});
