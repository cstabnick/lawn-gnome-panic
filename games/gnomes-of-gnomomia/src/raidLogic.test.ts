// Raid seats and helper logic (src/raidRoster.ts, src/raidHelperLogic.ts): pure numbers, no DOM.
import { afterEach, describe, expect, it } from 'vitest';
import type { RaidPartyMember, RaidSeat } from './raidTypes';
import { RAID_TUNING } from './data/raidTuning';
import { assignSwing, createHelperState, damageHelper, helperStats, pickHealTarget, tickHelper, type HelperState } from './raidHelperLogic';
import { partyMembersNear, seatRaid, setPartySource } from './raidRoster';
import { mulberry32 } from './rules';

const ME = { name: 'Tester', classId: null, level: 10 } as const;

function party(classId: 'warden' | 'slinger' | 'mage', x = 0, z = 0, zone = 'keep'): RaidPartyMember {
  return { id: `p-${classId}`, name: `Party ${classId}`, classId, level: 10, zone, x, z };
}

function helperSeat(role: 'tank' | 'healer' | 'damage', n = 0): RaidSeat {
  return { kind: 'helper', id: `helper-${n}`, name: 'Helper', classId: 'slinger', level: 10, role };
}

function up(role: 'tank' | 'healer' | 'damage', index: number): HelperState {
  return createHelperState(index, helperSeat(role, index));
}

afterEach(() => setPartySource(null));

describe('raid seats', () => {
  it('fills four seats for a slinger with no party: damage player, then tank, healer, damage helpers', () => {
    const seats = seatRaid(4, { ...ME, classId: 'slinger' }, [], mulberry32(1));
    expect(seats).toHaveLength(4);
    expect(seats[0]).toMatchObject({ kind: 'player', id: 'me', role: 'damage' });
    expect(seats.map((s) => s.role).sort()).toEqual(['damage', 'damage', 'healer', 'tank']);
    const helpers = seats.filter((s) => s.kind === 'helper');
    expect(helpers.map((s) => s.id)).toEqual(['helper-0', 'helper-1', 'helper-2']);
    expect(new Set(helpers.map((s) => s.name)).size).toBe(helpers.length);
    expect(helpers.every((s) => s.colors !== undefined)).toBe(true);
  });

  it('gives a warden player helpers healer, damage, damage', () => {
    const seats = seatRaid(4, { ...ME, classId: 'warden' }, [], mulberry32(2));
    expect(seats[0].role).toBe('tank');
    expect(seats.slice(1).map((s) => s.role)).toEqual(['healer', 'damage', 'damage']);
  });

  it('gives a mage player helpers tank, damage, damage', () => {
    const seats = seatRaid(4, { ...ME, classId: 'mage' }, [], mulberry32(3));
    expect(seats[0].role).toBe('healer');
    expect(seats.slice(1).map((s) => s.role)).toEqual(['tank', 'damage', 'damage']);
  });

  it('seats one party mage, then a tank and a damage helper', () => {
    const seats = seatRaid(4, { ...ME, classId: 'slinger' }, [party('mage')], mulberry32(4));
    expect(seats.map((s) => s.kind)).toEqual(['player', 'party', 'helper', 'helper']);
    expect(seats[1]).toMatchObject({ kind: 'party', id: 'p-mage', role: 'healer' });
    expect(seats.slice(2).map((s) => s.role)).toEqual(['tank', 'damage']);
  });

  it('never seats more than the size', () => {
    const seats = seatRaid(2, { ...ME, classId: 'slinger' }, [party('mage'), party('warden')], mulberry32(5));
    expect(seats).toHaveLength(2);
    expect(seats.map((s) => s.kind)).toEqual(['player', 'party']);
  });

  it('returns only members within range of the horn in the same zone', () => {
    setPartySource({ members: () => [party('mage', 100, 0), party('warden', 20, 0), party('slinger', 5, 5, 'verge')] });
    const near = partyMembersNear('keep', 0, 0, 30);
    expect(near.map((m) => m.id)).toEqual(['p-warden']);
    expect(partyMembersNear('keep', 0, 0)).toHaveLength(1);
  });

  it('has no party members until a party source is set', () => {
    expect(partyMembersNear('keep', 0, 0)).toEqual([]);
  });
});

describe('helper logic', () => {
  it('gives the healer a heal and the tank a crush damage type', () => {
    expect(helperStats('healer', 10).heal).toBeGreaterThan(0);
    expect(helperStats('tank', 10).heal).toBe(0);
    expect(helperStats('tank', 10).damageType).toBe('crush');
  });

  it('brings a downed helper back at half HP after reviveSeconds', () => {
    const h = up('damage', 0);
    damageHelper(h, h.hpMax * 10);
    expect(h.hp).toBe(0);
    expect(h.downFor).toBe(RAID_TUNING.helper.reviveSeconds);
    expect(tickHelper(h, RAID_TUNING.helper.reviveSeconds - 1)).toEqual({ attack: false, heal: false });
    tickHelper(h, 1.5);
    expect(h.downFor).toBe(0);
    expect(h.hp).toBe(Math.round(h.hpMax * RAID_TUNING.helper.reviveHpFrac));
  });

  it('ignores damage while down', () => {
    const h = up('tank', 0);
    damageHelper(h, h.hpMax * 10);
    const downFor = h.downFor;
    damageHelper(h, 5);
    expect(h.downFor).toBe(downFor);
    expect(h.hp).toBe(0);
  });

  it('assigns a boss swing to the up tank, and to the player when the tank is down', () => {
    const tank = up('tank', 0);
    const helpers = [tank, up('healer', 1), up('damage', 2)];
    expect(assignSwing('boss', mulberry32(1), helpers)).toBe(0);
    damageHelper(tank, tank.hpMax * 10);
    expect(assignSwing('boss', mulberry32(1), helpers)).toBe('player');
  });

  it('heals the lowest up fraction only when it is below healBelow', () => {
    const hurt = up('damage', 1);
    hurt.hp = hurt.hpMax * 0.3;
    const ninety = up('healer', 0);
    ninety.hp = ninety.hpMax * 0.9;
    expect(pickHealTarget(0.5, [ninety])).toBe('player');
    expect(pickHealTarget(0.95, [hurt])).toBe(1);
    expect(pickHealTarget(0.5, [ninety, hurt])).toBe(1);
    const fine = up('damage', 2);
    expect(pickHealTarget(0.95, [fine])).toBeNull();
  });

  it('fires a swing once per attackSeconds', () => {
    const h = up('damage', 0);
    h.attackTimer = 0.5;
    expect(tickHelper(h, 0.6).attack).toBe(true);
    expect(tickHelper(h, 0.1).attack).toBe(false);
  });
});
