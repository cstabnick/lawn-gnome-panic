// Raid seats: the player, party members (when a party system plugs in) and helpers for the rest. Pure.
import type { ClassId } from './config';
import type { HelperRole, PartySource, RaidPartyMember, RaidSeat } from './raidTypes';
import { RAID_TUNING } from './data/raidTuning';
import { roleForClass } from './raidHelperLogic';

let partySource: PartySource | null = null;

export const HELPER_NAMES: readonly string[] = ['Madder Tumblepot', 'Woad Brickwell', 'Borage Haftsby', 'Burnet Pegwhistle', 'Chervil Barrowby', 'Hyssop Kettleclod', 'Lupin Sackwell', 'Teasel Ladlefoot', 'Vetch Spadesworth'];

export const HELPER_COLORS: Record<HelperRole, { hat: number; shirt: number; beard: number }> = {
  tank: { hat: 0x5a6a7a, shirt: 0x4a4a52, beard: 0xd8d0c0 },
  healer: { hat: 0x2f6fb0, shirt: 0xe8e0c8, beard: 0xb08a5a },
  damage: { hat: 0xb0302a, shirt: 0x6a4a2a, beard: 0x3a2a1a },
};

/** The class a helper of this role fights as. */
export function classForRole(role: HelperRole): ClassId {
  if (role === 'tank') return 'warden';
  if (role === 'healer') return 'mage';
  return 'slinger';
}

/** Registers (null removes) the party system's member list. Party members take raid seats before helpers do. */
export function setPartySource(src: PartySource | null): void {
  partySource = src;
}

/** Party members in `zone` within `range` metres of (x, z). */
export function partyMembersNear(zone: string, x: number, z: number, range: number = RAID_TUNING.partyRange): RaidPartyMember[] {
  if (!partySource) return [];
  return partySource.members().filter((m) => m.zone === zone && Math.hypot(m.x - x, m.z - z) <= range);
}

/** Fills `size` seats: the player, then party members in order, then helpers for the free seats (tank, healer, then damage). */
export function seatRaid(size: number, me: { name: string; classId: ClassId | null; level: number }, party: readonly RaidPartyMember[], rng: () => number): RaidSeat[] {
  if (size < 1) return [];
  const seats: RaidSeat[] = [];
  const playerClass: ClassId = me.classId ?? 'slinger';
  seats.push({ kind: 'player', id: 'me', name: me.name, classId: playerClass, level: me.level, role: roleForClass(playerClass) });

  for (const m of party) {
    if (seats.length >= size) break;
    const classId: ClassId = m.classId ?? 'slinger';
    seats.push({ kind: 'party', id: m.id, name: m.name, classId, level: m.level, role: roleForClass(classId) });
  }

  const free = size - seats.length;
  if (free > 0) {
    const roles: HelperRole[] = [];
    const taken = new Set(seats.map((s) => s.role));
    for (const r of ['tank', 'healer'] as const) {
      if (roles.length < free && !taken.has(r)) roles.push(r);
    }
    while (roles.length < free) roles.push('damage');

    const usedNames = new Set(seats.map((s) => s.name));
    let n = 0;
    for (const role of roles) {
      let pool = HELPER_NAMES.filter((name) => !usedNames.has(name));
      if (pool.length === 0) pool = [...HELPER_NAMES];
      const name = pool.length > 0 ? pool[Math.floor(rng() * pool.length)] : `Helper ${n + 1}`;
      usedNames.add(name);
      seats.push({ kind: 'helper', id: `helper-${n}`, name, classId: classForRole(role), level: me.level, role, colors: { ...HELPER_COLORS[role] } });
      n++;
    }
  }
  return seats;
}
