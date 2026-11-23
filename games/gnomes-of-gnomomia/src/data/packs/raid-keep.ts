// Raid pack raid-keep (see docs/roadmaps/gnomomia-rebalance-raids.md). Prefix for new ids: raid-keep-.
import type { ContentPack, EnemyDef, ItemDef } from '../../config';
import type { RaidPack } from '../../raidTypes';
import { RAID_UNLOCK, raidAddHp, raidBossHp } from '../raidTuning';
import { craftGold, raidItemValue } from '../../economy';

const ENEMIES: Record<string, EnemyDef> = {
  'raid-keep-murmur': {
    id: 'raid-keep-murmur', name: 'Murmur, the Starling Mother', level: 12, rank: 'boss', family: 'winged', damageType: 'pierce',
    aggressive: true, loot: [], gold: [0, 0], noReward: true, respawnSeconds: 0,
    model: 'crow', color: 0x2b2f4a, scale: 1.6, hpOverride: raidBossHp(12),
    examine: 'A starling the size of a dog, with a flock that moves as one thing. She watches the lawn the way a Reeve watches a queue.',
    wants: "Seed for her flock's winter. The Keep's west lawn is where the seed-carts spill.",
    moves: [
      { id: 'swoop', name: 'Swoop', kind: 'lane', every: 11, telegraph: 1.5, length: 14, width: 2.5, damage: 1.4 },
      { id: 'gust', name: 'Gust', kind: 'cone', every: 14, telegraph: 1.2, radius: 7, damage: 0.9, status: 'staggered', statusSeconds: 1.5 },
      { id: 'murmuration', name: 'Murmuration', kind: 'summon', every: 30, telegraph: 1, summon: { enemy: 'raid-keep-starling', count: 3 } },
    ],
    lastWords: 'Chrrrk.',
  },
  'raid-keep-starling': {
    id: 'raid-keep-starling', name: 'Starling', level: 11, rank: 'normal', family: 'winged', damageType: 'pierce',
    aggressive: true, loot: [], gold: [0, 0], noReward: true, respawnSeconds: 0,
    model: 'crow', color: 0x3a3f5a, scale: 0.7, hpOverride: raidAddHp(11),
    examine: 'Small, glossy and in a hurry. It shouts over everything else, including itself.',
    wants: 'Whatever Murmur wants. Mostly seed.',
  },
};

const ITEMS: Record<string, ItemDef> = {
  // Raid drops (ilvl 13, 1 in 5 each on a win).
  'raid-keep-beak-pick': {
    id: 'raid-keep-beak-pick', name: 'Starling-beak pick', icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 13, rarity: 'heirloom',
    source: 'raid', damageType: 'pierce', hands: 1, weaponClass: 'melee', stats: { strength: 2, endurance: 2 },
    value: raidItemValue(13), examine: 'Ground from a starling beak. The horn mark is on the haft, so the Reeves know where it came from.',
  },
  'raid-keep-sling': {
    id: 'raid-keep-sling', name: 'Murmur-feather sling', icon: '🪶', kind: 'weapon', slot: 'weapon', ilvl: 13, rarity: 'heirloom',
    source: 'raid', damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 2, accuracy: 2 },
    value: raidItemValue(13), examine: 'Long flight feathers plaited into a sling. The horn mark is on the pouch, where the stone sits.',
  },
  'raid-keep-wand': {
    id: 'raid-keep-wand', name: 'Seed-store wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 13, rarity: 'heirloom',
    source: 'raid', damageType: 'sun', hands: 1, weaponClass: 'wand', stats: { intelligence: 2, endurance: 2 },
    value: raidItemValue(13), examine: 'A seed-cart measuring stick with a starling feather on top. The horn mark is burned into the grip.',
  },
  'raid-keep-hood': {
    id: 'raid-keep-hood', name: 'Starling-down hood', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 13, rarity: 'heirloom',
    source: 'raid', armorType: 'cloth', stats: { endurance: 2, defense: 2 },
    value: raidItemValue(13), examine: 'Down from a flock that is not coming back for it. The horn mark is inside, where it stays warm.',
  },
  'raid-keep-charm': {
    id: 'raid-keep-charm', name: 'Speckled egg charm', icon: '🥚', kind: 'trinket', slot: 'trinket', ilvl: 13, rarity: 'heirloom',
    source: 'raid', stats: { endurance: 2, agility: 2 },
    value: raidItemValue(13), examine: 'A speckled egg with a hole in it, strung on a cord. The horn mark is on the cord.',
  },
  // Reforged at the Sodbury anvil (ilvl 17).
  'raid-keep-beak-pick-reforged': {
    id: 'raid-keep-beak-pick-reforged', name: 'Reforged starling-beak pick', icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 17, rarity: 'heirloom',
    source: 'craft', damageType: 'pierce', hands: 1, weaponClass: 'melee', stats: { strength: 3, endurance: 3 },
    value: raidItemValue(17), examine: 'Reforged in Sodbury until the beak stopped looking like a beak. The horn mark is still on the haft.',
  },
  'raid-keep-sling-reforged': {
    id: 'raid-keep-sling-reforged', name: 'Reforged murmur-feather sling', icon: '🪶', kind: 'weapon', slot: 'weapon', ilvl: 17, rarity: 'heirloom',
    source: 'craft', damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 3, accuracy: 3 },
    value: raidItemValue(17), examine: 'Reforged with a new pouch and the same feathers. The horn mark is still on it, somewhere.',
  },
  'raid-keep-wand-reforged': {
    id: 'raid-keep-wand-reforged', name: 'Reforged seed-store wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 17, rarity: 'heirloom',
    source: 'craft', damageType: 'sun', hands: 1, weaponClass: 'wand', stats: { intelligence: 3, endurance: 3 },
    value: raidItemValue(17), examine: 'Reforged with the seed still in it. It rattles when it is pleased.',
  },
  'raid-keep-hood-reforged': {
    id: 'raid-keep-hood-reforged', name: 'Reforged starling-down hood', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 17, rarity: 'heirloom',
    source: 'craft', armorType: 'cloth', stats: { endurance: 3, defense: 3 },
    value: raidItemValue(17), examine: 'Reforged into a hood that keeps the rain off and the Reeves away.',
  },
  'raid-keep-charm-reforged': {
    id: 'raid-keep-charm-reforged', name: 'Reforged speckled egg charm', icon: '🥚', kind: 'trinket', slot: 'trinket', ilvl: 17, rarity: 'heirloom',
    source: 'craft', stats: { endurance: 3, agility: 3 },
    value: raidItemValue(17), examine: 'The egg is still whole inside the cord. Nobody has asked what is in it.',
  },
};

export const PACK: ContentPack = {
  id: 'raid-keep',
  enemies: ENEMIES,
  items: ITEMS,
  objects: {
    'raid-keep-horn': {
      id: 'raid-keep-horn', zone: 'keep', x: -40, z: -16, name: 'Horn post', model: 'horn', verb: 'Sound the horn',
      examine: "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.", when: RAID_UNLOCK,
    },
  },
};

export const RAID_PACK: RaidPack = {
  raids: [
    {
      id: 'raid-keep', name: 'The Archive Lawn Murmuration', zone: 'keep', level: 12, minLevel: 10,
      x: -40, z: -30, r: 14, boss: 'raid-keep-murmur',
      waves: [
        { enemy: 'raid-keep-starling', count: 3, at: 20 },
        { enemy: 'raid-keep-starling', count: 3, at: 60 },
        { enemy: 'raid-keep-starling', count: 4, at: 100 },
      ],
      horn: 'raid-keep-horn',
      drops: ['raid-keep-beak-pick', 'raid-keep-sling', 'raid-keep-wand', 'raid-keep-hood', 'raid-keep-charm'],
      intro: 'The horn sounds over the Archive lawn, and the west lawn goes dark with starlings.',
      victory: 'The flock lifts all at once and scatters over the Basin.',
    },
  ],
  recipes: [
    { id: 'raid-keep-pick-reforge', station: 'raid-anvil-sodbury', makes: 'raid-keep-beak-pick-reforged', needs: [{ item: 'raid-keep-beak-pick', count: 1 }], gold: craftGold(17) },
    { id: 'raid-keep-sling-reforge', station: 'raid-anvil-sodbury', makes: 'raid-keep-sling-reforged', needs: [{ item: 'raid-keep-sling', count: 1 }], gold: craftGold(17) },
    { id: 'raid-keep-wand-reforge', station: 'raid-anvil-sodbury', makes: 'raid-keep-wand-reforged', needs: [{ item: 'raid-keep-wand', count: 1 }], gold: craftGold(17) },
    { id: 'raid-keep-hood-reforge', station: 'raid-anvil-sodbury', makes: 'raid-keep-hood-reforged', needs: [{ item: 'raid-keep-hood', count: 1 }], gold: craftGold(17) },
    { id: 'raid-keep-charm-reforge', station: 'raid-anvil-sodbury', makes: 'raid-keep-charm-reforged', needs: [{ item: 'raid-keep-charm', count: 1 }], gold: craftGold(17) },
  ],
};
