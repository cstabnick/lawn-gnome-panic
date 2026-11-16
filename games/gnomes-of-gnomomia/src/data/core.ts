// Core tables every system reads: attributes, skills, the two starting spells, and the starting kit.
import type { Attribute, EquipSlot, SkillId, SpellDef, SpellId } from '../config';

export const ATTRIBUTES: readonly Attribute[] = ['strength', 'endurance', 'agility', 'intelligence'];

/** Use-based skills (combat.md §10). They grow by use and are capped by character level. */
export const SKILLS: readonly { id: SkillId; name: string; about: string }[] = [
  { id: 'blade', name: 'Blade', about: 'Hitting with Slash weapons. Raises accuracy and damage with them.' },
  { id: 'blunt', name: 'Blunt', about: 'Hitting with Crush weapons. Raises accuracy and damage with them.' },
  { id: 'marksmanship', name: 'Marksmanship', about: 'Hitting with ranged weapons. Raises accuracy and damage with them.' },
  { id: 'block', name: 'Block', about: 'Blocking with a shield. Raises your defense.' },
  { id: 'toughness', name: 'Toughness', about: 'Being hit. Each level takes a little more off every blow.' },
  { id: 'sun', name: 'Sun', about: 'Casting Sun spells. Raises their damage.' },
  { id: 'rain', name: 'Rain', about: 'Casting Rain spells. Raises their damage and how hard they slow.' },
  { id: 'bloom', name: 'Bloom', about: 'Casting Bloom spells. Raises your healing.' },
];

export const SPELLS: Record<SpellId, SpellDef> = {
  flare: { id: 'flare', name: 'Flare', icon: '🔥', school: 'sun', cost: 8, cooldown: 1.8, castTime: 0, needsTarget: true, ranks: [1, 6, 12, 18, 24, 30], about: 'Hurl a ball of fire at your target. Never misses.' },
  mend: { id: 'mend', name: 'Mend', icon: '✨', school: 'bloom', cost: 10, cooldown: 1.8, castTime: 0, needsTarget: false, ranks: [1, 8, 14, 20, 26], heal: true, about: 'Heal your own wounds.' },
};

/** What a new game starts with. Equipped items are not also in the inventory. */
export const START_EQUIPMENT: Record<EquipSlot, string | null> = {
  head: null, body: 'moss-tunic', legs: null, hands: null, feet: null, weapon: 'rusty-trowel', offhand: null, trinket: null,
};
export const START_INVENTORY: readonly { item: string; count: number }[] = [{ item: 'red-potion', count: 2 }];
