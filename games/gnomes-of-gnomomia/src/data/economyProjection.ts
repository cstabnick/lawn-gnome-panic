// PROJECTION, NOT SHIPPED CONTENT.
// Synthetic level 31-70 phases for the economy sim's `--cap=70` mode (src/sim/economy.ts, runEconomy({ cap: 70 })).
// Nothing here is imported by gameplay, content.ts or the UI: no quest, enemy, item or talent below exists in the game.
// It answers one question: "if future zones were built like the Verge, would the curves in src/data/economy.ts still
// hold up to level 70?" Each row is also the content tier that band would need (docs/design/gnomomia/economy.md,
// "Level 70 runway"): adding content tiers is a balancing lever next to the curve tweaks.
//
// The template is the shipped Verge (band 25-30): 8 main, 8 side, 2 finale quests; ~35 normal mobs in 10 respawning
// groups, 3 elites, 1 boss; raw quest gold main ~156, side ~58, finale ~450; raw enemy gold ~9 per mob; a mixed
// blooming / sprouted shop kit. `density` scales the quest and mob counts: kills per level rise past the knee (levelXp
// lateGrowth), so later bands need more content per level or they turn into grind.
import type { ClassId, DamageType, EquipSlot } from '../config';

export const PROJECTION_LABEL = 'PROJECTION (not shipped content): synthetic level 31-70 bands built like the Verge';

export interface ProjectedBand {
  /** Phase id in the report: `proj-<first level>`. */
  id: `proj-${number}`;
  /** Levels the band is played at; [lo, hi], lo = the previous band's hi. */
  band: readonly [number, number];
  /** Content density vs the Verge template (quests and mobs per band). */
  density: number;
  /** Item level of the band's shop kit (one item per slot per class; rarity mix in PROJECTION_TEMPLATE). */
  shopIlvl: number;
  /** New talent ranks per class the band's content opens (a post-30 talent track, gated on the band's finales). */
  talentRanks: number;
  /** Quest and enemy raw gold vs the Verge template: the band's quest gold tier. Past 30 every class kit has a priced
   * item in every slot, so a band needs more raw gold per quest than the Verge for the kit to stay in reach. */
  goldTier: number;
}

/** The template every band is scaled from (shipped Verge, per 5 levels). */
export const PROJECTION_TEMPLATE = {
  quests: { side: 8, main: 8, finale: 2 },
  rawQuestGold: { side: 58, main: 156, finale: 450 },
  /** Respawning normal groups (cleared clearsPerPhase times), mobs per group, single elites, one boss per band. */
  normalGroups: 10, groupSize: 3.5, elites: 3, bosses: 1,
  rawEnemyGold: [6, 12] as readonly [number, number],
  /** Heal potion of the band: like ruby-draught (120 hp, 90 coins at ilvl 28), heal and price x ilvl/28: HP grows about
   * linearly with level and every shipped heal potion costs 0.75 coins per hp. */
  potion: { heal: 120, value: 90, ilvl: 28 },
  /** Kit rarity mix, like the Verge's (its warden kit costs 16,136 = about 5 blooming items' worth over 8 slots):
   * weapon, body and trinket blooming (4 x ilvl^2), the other slots sprouted (2 x ilvl^2). */
  bloomingSlots: ['weapon', 'body', 'trinket'] as readonly EquipSlot[],
  valuePerIlvlSq: { blooming: 4, sprouted: 2 },
};

/** Eight 5-level bands, 30-35 ... 65-70. */
export const PROJECTED_BANDS: readonly ProjectedBand[] = [
  { id: 'proj-30', band: [30, 35], density: 1.15, shopIlvl: 34, talentRanks: 7, goldTier: 1.5 },
  { id: 'proj-35', band: [35, 40], density: 1.2, shopIlvl: 39, talentRanks: 7, goldTier: 1.5 },
  { id: 'proj-40', band: [40, 45], density: 1.25, shopIlvl: 44, talentRanks: 7, goldTier: 1.45 },
  { id: 'proj-45', band: [45, 50], density: 1.3, shopIlvl: 49, talentRanks: 7, goldTier: 1.35 },
  { id: 'proj-50', band: [50, 55], density: 1.35, shopIlvl: 54, talentRanks: 7, goldTier: 1.2 },
  { id: 'proj-55', band: [55, 60], density: 1.4, shopIlvl: 59, talentRanks: 7, goldTier: 1.1 },
  { id: 'proj-60', band: [60, 65], density: 1.45, shopIlvl: 64, talentRanks: 7, goldTier: 1.0 },
  { id: 'proj-65', band: [65, 70], density: 1.5, shopIlvl: 69, talentRanks: 7, goldTier: 1.0 },
];

/** The projected kit for a class: slots and how each class fills them (armor type, weapon class, damage type). */
export const PROJECTION_KIT: Record<ClassId, { armorType: 'plate' | 'leather' | 'cloth'; weaponClass: 'melee' | 'sling' | 'staff'; damageType: DamageType; slots: readonly EquipSlot[] }> = {
  warden: { armorType: 'plate', weaponClass: 'melee', damageType: 'slash', slots: ['weapon', 'offhand', 'head', 'body', 'legs', 'hands', 'feet', 'trinket'] },
  slinger: { armorType: 'leather', weaponClass: 'sling', damageType: 'pierce', slots: ['weapon', 'head', 'body', 'legs', 'hands', 'feet', 'trinket'] },
  mage: { armorType: 'cloth', weaponClass: 'staff', damageType: 'crush', slots: ['weapon', 'head', 'body', 'legs', 'hands', 'feet', 'trinket'] },
};

/** The content a band needs, counted from its row: what a future zone for that band would have to ship. */
export function bandContent(b: ProjectedBand): {
  quests: { side: number; main: number; finale: number }; normalMobs: number; groups: number; elites: number; bosses: number;
  shopTier: string; gearItems: number; potionTier: number; talentRanks: number; questGoldTier: { side: number; main: number; finale: number };
} {
  const t = PROJECTION_TEMPLATE;
  const q = (n: number): number => Math.round(n * b.density);
  const groups = q(t.normalGroups);
  const gearItems = Object.values(PROJECTION_KIT).reduce((s, k) => s + k.slots.length, 0);
  return {
    quests: { side: q(t.quests.side), main: q(t.quests.main), finale: t.quests.finale },
    groups, normalMobs: Math.round(groups * t.groupSize), elites: q(t.elites), bosses: t.bosses,
    shopTier: `ilvl ${b.shopIlvl}: ${t.bloomingSlots.join("/")} blooming, rest sprouted`, gearItems, potionTier: 1, talentRanks: b.talentRanks,
    questGoldTier: { side: Math.round(t.rawQuestGold.side * b.goldTier), main: Math.round(t.rawQuestGold.main * b.goldTier), finale: Math.round(t.rawQuestGold.finale * b.goldTier) },
  };
}
