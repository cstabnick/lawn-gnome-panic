// Raid pack raid-rock (see docs/roadmaps/gnomomia-rebalance-raids.md). Prefix for new ids: raid-rock-.
import type { ContentPack, EnemyDef, ItemDef, WorldObjectSpec } from '../../config';
import type { RaidPack, RecipeDef } from '../../raidTypes';
import { RAID_UNLOCK, raidAddHp, raidBossHp } from '../raidTuning';
import { craftGold, raidItemValue } from '../../economy';

const HORN_EXAMINE = "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.";
const REFORGED_EXAMINE = 'Reforged at Last Tuft from horn-marked gear. The anvil took the old mark off and left a new one, which is more than most smiths manage.';

const enemies: Record<string, EnemyDef> = {
  'raid-rock-clinkerback': {
    id: 'raid-rock-clinkerback', name: 'Clinkerback, the Seam Centipede', level: 24, rank: 'boss', family: 'shelled',
    damageType: 'pierce', aggressive: true, noReward: true,
    loot: [], gold: [0, 0], model: 'centipede', color: 0x5a3a2a, scale: 2.6, respawnSeconds: 0,
    hpOverride: raidBossHp(24),
    examine: 'A centipede as long as a cart, its legs ticking on the rock. Every leg ends in a little pick, and it knows exactly where the seam is.',
    wants: 'The warm deep seam. Every new Delver cut in the Shard Mine lets the warmth out.',
    moves: [
      { id: 'coil', name: 'Coil', kind: 'ring', every: 12, telegraph: 1.5, radius: 5, damage: 1.2, status: 'staggered', statusSeconds: 1.5 },
      { id: 'grit-spray', name: 'Grit Spray', kind: 'cone', every: 9, telegraph: 1.1, radius: 7, damage: 0.9, status: 'chipped', statusSeconds: 6 },
      { id: 'brood', name: 'Brood', kind: 'summon', every: 28, telegraph: 1, summon: { enemy: 'raid-rock-louse', count: 4 } },
    ],
    lastWords: 'Tik. Tik. Tik.',
  },
  'raid-rock-louse': {
    id: 'raid-rock-louse', name: 'Seam louse', level: 23, rank: 'trivial', family: 'shelled', damageType: 'pierce',
    aggressive: true, noReward: true,
    loot: [], gold: [0, 0], model: 'earwig', color: 0x6a6a5a, scale: 1.0, respawnSeconds: 0,
    hpOverride: raidAddHp(23),
    examine: 'Small and shelled, sitting in a crowd on the warm rock as if it were a bench at market.',
    wants: 'Warmth, from anything warm. You will do.',
  },
};

// Drops: ilvl 25, heirloom, source 'raid'. Reforged pieces: ilvl 30, heirloom, source 'craft', stats at amount 5.
const items: Record<string, ItemDef> = {
  'raid-rock-pick': {
    id: 'raid-rock-pick', name: 'Seam pick', icon: '⛏️', kind: 'weapon', slot: 'weapon', ilvl: 25, rarity: 'heirloom', source: 'raid',
    damageType: 'pierce', hands: 1, weaponClass: 'melee', stats: { strength: 4, endurance: 4 }, value: raidItemValue(25),
    examine: 'Cut from the first seam the Delvers ever opened. The horn mark on the handle is newer than the seam.',
  },
  'raid-rock-sling': {
    id: 'raid-rock-sling', name: 'Clinker sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 25, rarity: 'heirloom', source: 'raid',
    damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 4, accuracy: 4 }, value: raidItemValue(25),
    examine: 'It fires clinker, and the clinker comes back warm. The horn mark is a bonus nobody asked for.',
  },
  'raid-rock-wand': {
    id: 'raid-rock-wand', name: 'Warm-seam wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 25, rarity: 'heirloom', source: 'raid',
    damageType: 'sun', hands: 1, weaponClass: 'wand', stats: { intelligence: 4, endurance: 4 }, value: raidItemValue(25),
    examine: 'It stays warm in your hand for an hour after the fight, which is the horn mark doing its job.',
  },
  'raid-rock-hood': {
    id: 'raid-rock-hood', name: 'Grit-felt hood', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 25, rarity: 'heirloom', source: 'raid',
    armorType: 'cloth', stats: { endurance: 4, defense: 4 }, value: raidItemValue(25),
    examine: 'Felt with the grit still in it. Shake it out and the grit keeps its opinions.',
  },
  'raid-rock-charm': {
    id: 'raid-rock-charm', name: 'Centipede-leg charm', icon: '🦿', kind: 'trinket', slot: 'trinket', ilvl: 25, rarity: 'heirloom', source: 'raid',
    stats: { endurance: 4, agility: 4 }, value: raidItemValue(25),
    examine: 'One of the legs, still ticking faintly. The horn mark is stamped on the back, where the Reeves can read it.',
  },
  'raid-rock-pick-reforged': {
    id: 'raid-rock-pick-reforged', name: 'Reforged seam pick', icon: '⛏️', kind: 'weapon', slot: 'weapon', ilvl: 30, rarity: 'heirloom', source: 'craft',
    damageType: 'pierce', hands: 1, weaponClass: 'melee', stats: { strength: 5, endurance: 5 }, value: raidItemValue(30), examine: REFORGED_EXAMINE,
  },
  'raid-rock-sling-reforged': {
    id: 'raid-rock-sling-reforged', name: 'Reforged clinker sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 30, rarity: 'heirloom', source: 'craft',
    damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 5, accuracy: 5 }, value: raidItemValue(30), examine: REFORGED_EXAMINE,
  },
  'raid-rock-wand-reforged': {
    id: 'raid-rock-wand-reforged', name: 'Reforged warm-seam wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 30, rarity: 'heirloom', source: 'craft',
    damageType: 'sun', hands: 1, weaponClass: 'wand', stats: { intelligence: 5, endurance: 5 }, value: raidItemValue(30), examine: REFORGED_EXAMINE,
  },
  'raid-rock-hood-reforged': {
    id: 'raid-rock-hood-reforged', name: 'Reforged grit-felt hood', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 30, rarity: 'heirloom', source: 'craft',
    armorType: 'cloth', stats: { endurance: 5, defense: 5 }, value: raidItemValue(30), examine: REFORGED_EXAMINE,
  },
  'raid-rock-charm-reforged': {
    id: 'raid-rock-charm-reforged', name: 'Reforged centipede-leg charm', icon: '🦿', kind: 'trinket', slot: 'trinket', ilvl: 30, rarity: 'heirloom', source: 'craft',
    stats: { endurance: 5, agility: 5 }, value: raidItemValue(30), examine: REFORGED_EXAMINE,
  },
};

const objects: Record<string, WorldObjectSpec> = {
  'raid-rock-horn': {
    id: 'raid-rock-horn', zone: 'rockery', name: 'Horn post', x: 65, z: -31, model: 'horn',
    verb: 'Sound the horn', examine: HORN_EXAMINE, when: RAID_UNLOCK,
  },
};

export const PACK: ContentPack = { id: 'raid-rock', enemies, items, objects };

const recipes: RecipeDef[] = [
  { id: 'raid-rock-pick-reforge', station: 'raid-anvil-last-tuft', makes: 'raid-rock-pick-reforged', needs: [{ item: 'raid-rock-pick', count: 1 }], gold: craftGold(30) },
  { id: 'raid-rock-sling-reforge', station: 'raid-anvil-last-tuft', makes: 'raid-rock-sling-reforged', needs: [{ item: 'raid-rock-sling', count: 1 }], gold: craftGold(30) },
  { id: 'raid-rock-wand-reforge', station: 'raid-anvil-last-tuft', makes: 'raid-rock-wand-reforged', needs: [{ item: 'raid-rock-wand', count: 1 }], gold: craftGold(30) },
  { id: 'raid-rock-hood-reforge', station: 'raid-anvil-last-tuft', makes: 'raid-rock-hood-reforged', needs: [{ item: 'raid-rock-hood', count: 1 }], gold: craftGold(30) },
  { id: 'raid-rock-charm-reforge', station: 'raid-anvil-last-tuft', makes: 'raid-rock-charm-reforged', needs: [{ item: 'raid-rock-charm', count: 1 }], gold: craftGold(30) },
];

export const RAID_PACK: RaidPack = {
  raids: [
    {
      id: 'raid-rock', name: 'The Warm Seam', zone: 'rockery', level: 24, minLevel: 22, x: 65, z: -45, r: 14,
      boss: 'raid-rock-clinkerback',
      waves: [
        { enemy: 'raid-rock-louse', count: 4, at: 20 },
        { enemy: 'raid-rock-louse', count: 4, at: 60 },
        { enemy: 'raid-rock-louse', count: 5, at: 100 },
      ],
      horn: 'raid-rock-horn',
      drops: ['raid-rock-pick', 'raid-rock-sling', 'raid-rock-wand', 'raid-rock-hood', 'raid-rock-charm'],
      intro: 'The horn sounds under the Shard Mine, and every louse in the Rockery turns to face the warm rock.',
      victory: 'The seam goes quiet, and for once the iron stops humming.',
    },
  ],
  recipes,
};
