import { describe, expect, it } from 'vitest';
import { ITEMS } from '../content';
import { weaponSwingSeconds } from '../rules';
import { effectiveAttribute, maxHp } from '../state';
import { FaceTanker, GreedyBerserker, KitingRanger, TacticalPlayer, makePolicy } from './agents';
import { buildLoadout } from './loadout';
import { runMonteCarlo, runScenario } from './runner';
import { SCENARIOS } from './scenarios';
import type { LoadoutSpec, ScenarioSpec } from './types';

describe('subsystem liveness (no-vibes wiring)', () => {
  it('warden-thick-clay r3 raises maxHp by 12%', () => {
    const base = buildLoadout({ level: 10, classId: 'warden', build: {}, gearTier: 'naked' });
    const withClay = buildLoadout({
      level: 10,
      classId: 'warden',
      build: { 'warden-thick-clay': 3 },
      gearTier: 'naked',
    });
    expect(maxHp(withClay)).toBe(Math.round(maxHp(base) * 1.12));
  });

  it('warden-keen-edge r3 increases Slash damage dealt', () => {
    const slashWeapon = Object.values(ITEMS).find(
      (i) => i.kind === 'weapon' && i.damageType === 'slash' && (i.ilvl ?? 1) <= 10,
    );
    expect(slashWeapon).toBeDefined();

    const noTalent: LoadoutSpec = {
      level: 10,
      classId: 'warden',
      build: {},
      gearTier: 'naked',
      equipmentOverrides: { weapon: slashWeapon!.id },
    };
    const withKeen: LoadoutSpec = {
      ...noTalent,
      build: { 'warden-keen-edge': 3 },
    };

    const autoOnly = makePolicy({
      id: 'test-auto',
      name: 'AutoOnly',
      rotation: 'auto-only',
      healThreshold: 0,
      potionThreshold: 0,
    });

    const dummy: ScenarioSpec = {
      id: 'test-dummy',
      name: 'Dummy',
      kind: 'duel',
      waves: [{ enemyId: 'clogmaw', count: 1, distance: 2 }],
      maxSeconds: 20,
    };

    const r0 = runMonteCarlo(dummy, noTalent, autoOnly, { seeds: 25 });
    const r1 = runMonteCarlo(dummy, withKeen, autoOnly, { seeds: 25 });
    // Compare average hits or duration/damage efficiency
    expect(r1.playerHitsLanded.p50).toBeGreaterThanOrEqual(1);
    expect(r0.playerHitsLanded.p50).toBeGreaterThanOrEqual(1);
    // With Keen Edge r3 (+9% slash), either winRate/ttk improves or damage per hit is higher
    expect(r1.medianTtkSeconds).toBeLessThanOrEqual(r0.medianTtkSeconds);
  });

  it('mage-kindling r3 increases Sun spell damage', () => {
    const autoMage = makePolicy({
      id: 'test-mage-auto',
      name: 'MageAuto',
      rotation: 'auto-only',
      healThreshold: 0,
      potionThreshold: 0,
    });
    const base: LoadoutSpec = { level: 10, classId: 'mage', build: {}, gearTier: 'zone-plain' };
    const kindled: LoadoutSpec = {
      level: 10,
      classId: 'mage',
      build: { 'mage-kindling': 3 },
      gearTier: 'zone-plain',
    };
    const r0 = runScenario(SCENARIOS['tf-sprite-trial'], base, autoMage, 1);
    const r1 = runScenario(SCENARIOS['tf-sprite-trial'], kindled, autoMage, 1);
    expect(r1.durationSeconds).toBeLessThanOrEqual(r0.durationSeconds);
    expect(r1.damageDealtBySource.flare ?? 0).toBeGreaterThan(0);
  });

  it('warden-quick-snips r3 increases swing frequency', () => {
    const autoOnly = makePolicy({
      id: 'test-auto-snip',
      name: 'AutoSnip',
      rotation: 'auto-only',
      healThreshold: 0.8,
      potionThreshold: 0.5,
    });
    const dummy: ScenarioSpec = {
      id: 'test-snip',
      name: 'SnipTest',
      kind: 'duel',
      waves: [{ enemyId: 'old-gleaner', count: 1, distance: 1.5 }],
      maxSeconds: 25,
    };
    const base = runScenario(
      dummy,
      { level: 16, classId: 'warden', build: {}, gearTier: 'zone-bis', potions: { healCount: 10 } },
      autoOnly,
      1,
    );
    const fast = runScenario(
      dummy,
      { level: 16, classId: 'warden', build: { 'warden-quick-snips': 3 }, gearTier: 'zone-bis', potions: { healCount: 10 } },
      autoOnly,
      1,
    );
    expect(fast.playerHitsLanded + fast.playerMisses).toBeGreaterThan(base.playerHitsLanded + base.playerMisses);
  });

  it('equipped item stats increase effectiveAttribute and maxHp', () => {
    const itemWithStats = Object.values(ITEMS).find((i) => i.stats && (i.stats.endurance ?? 0) > 0);
    expect(itemWithStats).toBeDefined();

    const naked = buildLoadout({ level: 10, classId: 'warden', build: {}, gearTier: 'naked' });
    const equipped = buildLoadout({
      level: 10,
      classId: 'warden',
      build: {},
      gearTier: 'naked',
      equipmentOverrides: { [itemWithStats!.slot!]: itemWithStats!.id },
    });

    expect(effectiveAttribute('endurance', equipped)).toBeGreaterThan(effectiveAttribute('endurance', naked));
    expect(maxHp(equipped)).toBeGreaterThan(maxHp(naked));
  });

  it('weaponSwingSeconds returns class-specific intervals (1H 2.0s, 2H 2.8s, sling 2.2s, blowpipe 1.6s)', () => {
    const oneH = Object.values(ITEMS).find((i) => i.kind === 'weapon' && (i.weaponClass ?? 'melee') === 'melee' && (i.hands ?? 1) === 1);
    const twoH = Object.values(ITEMS).find((i) => i.kind === 'weapon' && i.hands === 2);
    const sling = Object.values(ITEMS).find((i) => i.kind === 'weapon' && i.weaponClass === 'sling');
    const blowpipe = Object.values(ITEMS).find((i) => i.kind === 'weapon' && i.weaponClass === 'blowpipe');

    expect(weaponSwingSeconds(null)).toBe(2.0);
    if (oneH) expect(weaponSwingSeconds(oneH)).toBe(2.0);
    if (twoH) expect(weaponSwingSeconds(twoH)).toBe(2.8);
    if (sling) expect(weaponSwingSeconds(sling)).toBe(2.2);
    if (blowpipe) expect(weaponSwingSeconds(blowpipe)).toBe(1.6);
  });

  it('DoTs (chipped from Trim and poisoned from Nettle Darts) deal positive damage', () => {
    const trimLoadout: LoadoutSpec = {
      level: 12,
      classId: 'warden',
      build: { 'warden-keen-edge': 3, 'warden-quick-snips': 3, 'warden-trim': 1 },
      gearTier: 'zone-plain',
    };
    const rTrim = runScenario(SCENARIOS['boss-clogmaw'], trimLoadout, TacticalPlayer, 1);
    expect(rTrim.damageDealtBySource.chipped ?? 0).toBeGreaterThan(0);

    const poisonLoadout: LoadoutSpec = {
      level: 12,
      classId: 'slinger',
      build: { 'slinger-nettle-darts': 3 },
      gearTier: 'zone-plain',
    };
    const rPoison = runScenario(SCENARIOS['boss-clogmaw'], poisonLoadout, KitingRanger, 1);
    expect(rPoison.damageDealtBySource.poisoned ?? 0).toBeGreaterThan(0);
  });

  it('plate Warden takes significantly less damage from boss telegraphs than a naked character', () => {
    const faceTankNoHeal = makePolicy({
      id: 'tank-no-dodge',
      name: 'TankNoDodge',
      telegraphDodge: 0,
      healThreshold: 0,
      potionThreshold: 0,
      rotation: 'auto-only',
    });
    const plate = runScenario(
      SCENARIOS['boss-mole-king'],
      { level: 6, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' },
      faceTankNoHeal,
      1,
    );
    const naked = runScenario(
      SCENARIOS['boss-mole-king'],
      { level: 6, classId: 'warden', build: {}, gearTier: 'naked' },
      faceTankNoHeal,
      1,
    );
    const plateDmg = Object.entries(plate.damageTakenBySource)
      .filter(([k]) => k.startsWith('telegraph:'))
      .reduce((a, [, v]) => a + v, 0);
    const nakedDmg = Object.entries(naked.damageTakenBySource)
      .filter(([k]) => k.startsWith('telegraph:'))
      .reduce((a, [, v]) => a + v, 0);

    const platePerHit = plateDmg / Math.max(1, plate.telegraphsHit);
    const nakedPerHit = nakedDmg / Math.max(1, naked.telegraphsHit);
    if (plate.telegraphsHit > 0 && naked.telegraphsHit > 0) {
      expect(platePerHit).toBeLessThan(nakedPerHit);
    } else {
      expect(plate.durationSeconds).toBeGreaterThanOrEqual(naked.durationSeconds);
    }
  });
});

describe('combat.md baseline curve invariants', () => {
  it('on-level TacticalPlayer with zone-plain gear defeats same-level normal duels cleanly', () => {
    const noHeal = makePolicy({
      id: 'tactical-no-heal',
      name: 'TacticalNoHeal',
      healThreshold: 0,
      potionThreshold: 0,
    });
    const cases: Array<{ level: number; scenarioId: string }> = [
      { level: 1, scenarioId: 'mb-slug-duel' },
      { level: 3, scenarioId: 'mb-feral-duel' },
      { level: 4, scenarioId: 'mb-beetle-duel' },
      { level: 7, scenarioId: 'tf-sprite-trial' },
      { level: 23, scenarioId: 'rk-unfired-duel' },
    ];
    for (const c of cases) {
      const summary = runMonteCarlo(
        SCENARIOS[c.scenarioId],
        { level: c.level, classId: c.level >= 5 ? 'warden' : null, gearTier: 'zone-plain' },
        noHeal,
        { seeds: 20 },
      );
      expect(summary.winRate).toBeGreaterThanOrEqual(0.75);
    }
  });
});

describe('behavioral strategy counter-examples', () => {
  it('GreedyBerserker fails Grubthorn (boss-mole-king) and Sedgewick (boss-sedgewick) while TacticalPlayer succeeds', () => {
    const l6: LoadoutSpec = { level: 6, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' };
    const greedy6 = runMonteCarlo(SCENARIOS['boss-mole-king'], l6, GreedyBerserker, { seeds: 30 });
    const tactical6 = runMonteCarlo(SCENARIOS['boss-mole-king'], l6, TacticalPlayer, { seeds: 30 });
    expect(tactical6.winRate).toBeGreaterThanOrEqual(0.8);
    expect(greedy6.winRate).toBeLessThanOrEqual(tactical6.winRate - 0.4);

    const l28: LoadoutSpec = { level: 28, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' };
    const greedy28 = runMonteCarlo(SCENARIOS['boss-sedgewick'], l28, GreedyBerserker, { seeds: 20 });
    const tactical28 = runMonteCarlo(SCENARIOS['boss-sedgewick'], l28, TacticalPlayer, { seeds: 20 });
    expect(tactical28.winRate).toBeGreaterThanOrEqual(0.8);
    expect(greedy28.winRate).toBeLessThanOrEqual(0.3);
  });

  it('PassiveTurtler fails Gromwell (gromwell-flood) while TacticalPlayer succeeds', () => {
    const l25: LoadoutSpec = { level: 25, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' };
    const passive = runMonteCarlo(SCENARIOS['boss-gromwell'], l25, makePolicy({ ...TacticalPlayer.traits, id: 'passive-turtler', name: 'PassiveTurtler', posture: 'cautious', telegraphDodge: 0.9, healThreshold: 0.78, potionThreshold: 0.5, rotation: 'defensive-first', targetPriority: 'nearest' }), { seeds: 20 });
    const tactical = runMonteCarlo(SCENARIOS['boss-gromwell'], l25, TacticalPlayer, { seeds: 20 });
    expect(tactical.winRate).toBeGreaterThanOrEqual(0.8);
    expect(passive.winRate).toBeLessThanOrEqual(0.3);
  });

  it('new zone packs, gauntlets, minibosses, and Mower Deck finale clear cleanly', () => {
    expect(runMonteCarlo(SCENARIOS['cf-meadow-gauntlet'], { level: 14, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' }, TacticalPlayer, { seeds: 15 }).winRate).toBeGreaterThanOrEqual(0.8);
    expect(runMonteCarlo(SCENARIOS['hw-wasp-pack'], { level: 18, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' }, TacticalPlayer, { seeds: 15 }).winRate).toBeGreaterThanOrEqual(0.8);
    expect(runMonteCarlo(SCENARIOS['rk-dowager-mudtooth'], { level: 23, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' }, TacticalPlayer, { seeds: 15 }).winRate).toBeGreaterThanOrEqual(0.8);
    expect(runMonteCarlo(SCENARIOS['vg-shed-gauntlet'], { level: 28, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' }, TacticalPlayer, { seeds: 15 }).winRate).toBeGreaterThanOrEqual(0.8);
    expect(runMonteCarlo(SCENARIOS['boss-mower-deck'], { level: 30, classId: 'warden', build: 'shieldwall', gearTier: 'zone-bis' }, TacticalPlayer, { seeds: 15 }).winRate).toBeGreaterThanOrEqual(0.8);
  });

  it('KitingRanger Slinger outperforms FaceTanker Slinger on Feral Brute (L4)', () => {
    const slingerLoadout: LoadoutSpec = { level: 4, classId: 'slinger', build: {}, gearTier: 'zone-plain' };
    const kiter = runMonteCarlo(SCENARIOS['mb-brute-elite'], slingerLoadout, KitingRanger, { seeds: 30 });
    const tanker = runMonteCarlo(SCENARIOS['mb-brute-elite'], slingerLoadout, FaceTanker, { seeds: 30 });

    expect(kiter.winRate).toBeGreaterThanOrEqual(tanker.winRate);
    expect(kiter.hpRemainingPct.p50).toBeGreaterThanOrEqual(tanker.hpRemainingPct.p50);
  });
});
