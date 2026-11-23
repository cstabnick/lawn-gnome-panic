import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Economy } from './economy';
import { createPerkEffects, type PerkEffectDeps } from './perkEffects';
import { PERKS_KEY, QUEST_SAVE_KEY, setPerkStorage } from './perks';
import type { Hud, Player, Watch } from './types';

function fakeStorage(entries: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(entries));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
}

function doneQuests(ids: string[]): string {
  const save: Record<string, { state: string; step: number; cracked: string[] }> = {};
  for (const id of ids) save[id] = { state: 'done', step: 0, cracked: [] };
  return JSON.stringify(save);
}

function makeDeps(opts: { quests?: string[]; overrides?: object } = {}) {
  const entries: Record<string, string> = {};
  if (opts.quests) entries[QUEST_SAVE_KEY] = doneQuests(opts.quests);
  if (opts.overrides) entries[PERKS_KEY] = JSON.stringify(opts.overrides);
  setPerkStorage(fakeStorage(entries));

  // The spies are captured here: createPerkEffects replaces the methods on these objects with wrappers.
  const earn = vi.fn();
  const spend = vi.fn(() => true);
  const chargeHospital = vi.fn(() => ({ fee: 100, receipt: 'Bill.' }));
  const economy = { earn, spend, chargeHospital };
  const hurt = vi.fn();
  const watch = { heat: 0 } as Watch;
  const player = { x: 0, y: 0, z: 0, vehicle: null, health: 1, swimming: false, hurt } as unknown as Player;
  const hud = { toast: vi.fn(), banner: vi.fn() } as unknown as Hud;
  const deps: PerkEffectDeps = { economy: economy as unknown as Economy, watch, player, hud };
  return { deps, spies: { earn, spend, chargeHospital, hurt }, watch, hud };
}

afterEach(() => {
  setPerkStorage(null);
});

describe('perk effects', () => {
  it('velvet-rope charges 25% less for discounted spend reasons', () => {
    const { deps, spies, hud } = makeDeps({ quests: ['sq-big-lou-embargo'] });
    createPerkEffects(deps);
    expect(deps.economy.spend(8, 'Acorn-Cola')).toBe(true);
    expect(spies.spend).toHaveBeenCalledWith(6, 'Acorn-Cola');
    expect(hud.toast).toHaveBeenCalledWith('Velvet Rope Tab: saved 2 Acorns', 2500);
  });

  it('charges the full price with no perk', () => {
    const { deps, spies } = makeDeps();
    createPerkEffects(deps);
    expect(deps.economy.spend(8, 'Acorn-Cola')).toBe(true);
    expect(spies.spend).toHaveBeenCalledWith(8, 'Acorn-Cola');
  });

  it('porcelain-charm refunds half the hospital fee through the original earn', () => {
    const { deps, spies } = makeDeps({ quests: ['sq-porcelain-blues'] });
    createPerkEffects(deps);
    const r = deps.economy.chargeHospital();
    expect(spies.earn).toHaveBeenCalledWith(50, 'Porcelain-Glaze Charm');
    expect(r.receipt).toContain('50 Acorns refunded');
  });

  it('thick-glaze passes 0.09 for hurt(0.1)', () => {
    const { deps, spies } = makeDeps({ quests: ['sq-porcelain-support'] });
    createPerkEffects(deps);
    deps.player.hurt(0.1);
    expect(spies.hurt).toHaveBeenCalledTimes(1);
    expect(spies.hurt.mock.calls[0][0]).toBeCloseTo(0.09);
  });

  it('audit-paperwork lowers heat below one hat by 0.16 per second', () => {
    const { deps, watch } = makeDeps({ quests: ['sq-hoa-audit'] });
    watch.heat = 0.9;
    const fx = createPerkEffects(deps);
    fx.update(1);
    expect(watch.heat).toBeCloseTo(0.74);
  });

  it('a revoked perk does nothing', () => {
    const { deps, spies } = makeDeps({
      quests: ['sq-big-lou-embargo'],
      overrides: { granted: [], revoked: ['velvet-rope'], seen: [] },
    });
    createPerkEffects(deps);
    deps.economy.spend(8, 'Acorn-Cola');
    expect(spies.spend).toHaveBeenCalledWith(8, 'Acorn-Cola');
  });
});
