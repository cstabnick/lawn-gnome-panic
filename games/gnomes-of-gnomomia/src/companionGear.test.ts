import { describe, expect, it } from 'vitest';
import { EQUIP_SLOTS, type ClassId, type EquipSlot } from './config';
import { ITEMS } from './content';
import { PERSONALITY_ORDER } from './companionLogic';
import {
  CLASS_WIRE, GEAR_STYLE, RARITY_RANK, classFromWire, classToWire, companionArmorAllowed,
  companionEquipment, companionHitDamage, companionMaxHp, companionWeaponAllowed, levelFitsZone, levelOffset,
  personalityFromWire, personalityToWire, questLevelFor, zoneLevelFor,
} from './companionGear';

describe('companionEquipment', () => {
  it('gives every class, personality and level 1..30 a valid loadout', () => {
    for (const classId of CLASS_WIRE) {
      for (const pid of PERSONALITY_ORDER) {
        const style = GEAR_STYLE[pid];
        for (let level = 1; level <= 30; level++) {
          const eq = companionEquipment(classId, level, pid, 3);
          const cap = Math.max(1, level - style.lag);
          const where = `${classId} ${pid} L${level}`;
          expect(eq.weapon, where).not.toBeNull();
          expect(companionWeaponAllowed(ITEMS[eq.weapon!], classId), where).toBe(true);

          // Weapon fallback: when no eligible weapon exists, the weapon may sit above the cap.
          const eligibleWeapons = Object.values(ITEMS).filter((it) =>
            companionWeaponAllowed(it, classId) && !it.questItem
            && RARITY_RANK[it.rarity ?? 'plain'] <= RARITY_RANK[style.maxRarity]
            && (it.ilvl ?? 1) <= cap);

          for (const slot of EQUIP_SLOTS) {
            const id = eq[slot];
            if (id === null) continue;
            const item = ITEMS[id];
            expect(item, `${where} ${slot}`).toBeDefined();
            expect(item.questItem, where).toBeFalsy();
            if (slot === 'weapon') {
              if (eligibleWeapons.length > 0) {
                expect((item.ilvl ?? 1) <= cap, where).toBe(true);
                expect(RARITY_RANK[item.rarity ?? 'plain'] <= RARITY_RANK[style.maxRarity], where).toBe(true);
              }
              continue;
            }
            expect(item.slot, `${where} ${slot}`).toBe(slot);
            expect(companionArmorAllowed(item, classId, slot), `${where} ${slot}`).toBe(true);
            expect((item.ilvl ?? 1) <= cap, `${where} ${slot}`).toBe(true);
            expect(RARITY_RANK[item.rarity ?? 'plain'] <= RARITY_RANK[style.maxRarity], `${where} ${slot}`).toBe(true);
          }
          if (style.keepsHat) expect(eq.head, where).toBeNull();
          if (eq.weapon && ITEMS[eq.weapon].hands === 2) expect(eq.offhand, where).toBeNull();
        }
      }
    }
  });

  it('is deterministic for the same inputs', () => {
    for (const classId of CLASS_WIRE) {
      for (const pid of PERSONALITY_ORDER) {
        for (const level of [1, 10, 30]) {
          expect(companionEquipment(classId, level, pid, 4)).toEqual(companionEquipment(classId, level, pid, 4));
        }
      }
    }
  });

  it('differs by seed for at least one (class, level) pair', () => {
    let differs = false;
    for (const classId of CLASS_WIRE) {
      for (let level = 1; level <= 30 && !differs; level++) {
        const a = companionEquipment(classId, level, 'tryhard', 0);
        const b = companionEquipment(classId, level, 'tryhard', 5);
        if (JSON.stringify(a) !== JSON.stringify(b)) differs = true;
      }
    }
    expect(differs).toBe(true);
  });
});

describe('levels', () => {
  it('questLevelFor clamps and offsets by id', () => {
    expect(questLevelFor(1, 0)).toBe(1);
    expect(questLevelFor(30, 2)).toBe(30);
    expect(questLevelFor(10, 1)).toBe(10);
    expect(questLevelFor(10, 0)).toBe(9);
  });

  it('zoneLevelFor stays in the band and in range', () => {
    expect(zoneLevelFor([19, 24], 3, 1)).toBe(19);
    expect(zoneLevelFor([1, 6], 25, 2)).toBe(7);
    const bands: [number, number][] = [[1, 6], [6, 11], [19, 24], [25, 30]];
    for (const band of bands) {
      for (let p = 1; p <= 30; p++) {
        for (let id = 0; id < 3; id++) {
          expect(levelFitsZone(zoneLevelFor(band, p, id), band)).toBe(true);
        }
      }
    }
  });

  it('levelFitsZone uses the band with slack', () => {
    expect(levelFitsZone(3, [19, 24])).toBe(false);
    expect(levelFitsZone(17, [19, 24])).toBe(true);
    expect(levelFitsZone(28, [19, 24])).toBe(false);
  });

  it('levelOffset is -1, 0 or 1 for negative ids too', () => {
    expect([levelOffset(0), levelOffset(1), levelOffset(2), levelOffset(3)]).toEqual([-1, 0, 1, -1]);
    expect([levelOffset(-1), levelOffset(-2), levelOffset(-3)]).toEqual([1, 0, -1]);
  });
});

describe('max hp and damage', () => {
  const none = Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null])) as Record<EquipSlot, string | null>;

  it('matches the base values with no gear', () => {
    expect(companionMaxHp(5, 'mage', none)).toBe(41);
    expect(companionMaxHp(5, 'warden', none)).toBe(51);
  });

  it('hit damage uses the weapon', () => {
    expect(companionHitDamage(5, none)).toBe(Math.max(1, Math.round(3 * 0.7)));
    expect(companionHitDamage(5, { ...none, weapon: 'x' })).toBe(3);
  });
});

describe('wire encoders', () => {
  const classes: ClassId[] = ['warden', 'slinger', 'mage'];
  it('round-trips classes and personalities', () => {
    for (const c of classes) expect(classFromWire(classToWire(c))).toBe(c);
    for (const p of PERSONALITY_ORDER) {
      expect(personalityFromWire(personalityToWire(p))).toBe(p);
    }
  });

  it('rejects out-of-range or non-integer indexes', () => {
    for (const n of [-1, 3, 0.5]) expect(classFromWire(n)).toBeNull();
    for (const n of [-1, PERSONALITY_ORDER.length, 0.5]) expect(personalityFromWire(n)).toBeNull();
  });
});
