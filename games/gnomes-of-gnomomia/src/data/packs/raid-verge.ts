// Raid pack raid-verge (see docs/roadmaps/gnomomia-rebalance-raids.md). Prefix for new ids: raid-verge-.
import type { ContentPack, EnemyDef, ItemDef, WorldObjectSpec } from '../../config';
import type { RaidPack } from '../../raidTypes';
import { raidItemValue } from '../../economy';
import { RAID_UNLOCK, raidAddHp, raidBossHp } from '../raidTuning';

const DROPS = ['raid-verge-wrench', 'raid-verge-sling', 'raid-verge-wand', 'raid-verge-hood', 'raid-verge-charm'] as const;

export const PACK: ContentPack = {
  id: 'raid-verge',

  enemies: {
    'raid-verge-old-sump': {
      id: 'raid-verge-old-sump', name: 'Old Sump, Rust-Rat of the Oil Drum', level: 29, rank: 'boss', family: 'metal',
      damageType: 'crush', aggressive: true, loot: [], gold: [0, 0], model: 'rat', color: 0x6a4a2a, scale: 2.4,
      hpOverride: raidBossHp(29), respawnSeconds: 0, noReward: true,
      examine: 'A rust-rat the size of a wheelbarrow, with a tail like a bent pipe. He sits on an oil drum and does not let go of it.',
      wants: 'The oil drum he dragged out of the Shed. He thinks Last Tuft has come to take it back.',
      lastWords: 'Mine. Was mine.',
      moves: [
        { id: 'black-dew-slick', name: 'Black Dew Slick', kind: 'pool', every: 13, telegraph: 1.2, radius: 3.5, damage: 0.6, status: 'slowed', statusSeconds: 4 },
        { id: 'drum-roll', name: 'Drum Roll', kind: 'lane', every: 15, telegraph: 1.6, length: 18, width: 3, damage: 1.5, status: 'staggered', statusSeconds: 2 },
        { id: 'pack-call', name: 'Pack Call', kind: 'summon', every: 30, telegraph: 1, summon: { enemy: 'raid-verge-sump-rat', count: 3 } },
        { id: 'oil-rage', name: 'Oil Rage', kind: 'buff', every: 40, telegraph: 1, belowHpPct: 0.4 },
      ],
    },
    'raid-verge-sump-rat': {
      id: 'raid-verge-sump-rat', name: 'Sump rat', level: 28, rank: 'normal', family: 'metal', damageType: 'slash',
      aggressive: true, loot: [], gold: [0, 0], model: 'rat', color: 0x7a5a3a, scale: 1.1, hpOverride: raidAddHp(28),
      respawnSeconds: 0, noReward: true,
      examine: 'A young rust-rat that has learned to climb out of a drum. It is hungry and it is not picky.',
      wants: 'A lick of the drum, when Old Sump is not looking.',
    } satisfies EnemyDef,
  },

  items: {
    'raid-verge-wrench': {
      id: 'raid-verge-wrench', name: 'Drum wrench', icon: '🔧', kind: 'weapon', slot: 'weapon', ilvl: 30, rarity: 'kilnfired',
      damageType: 'crush', hands: 1, weaponClass: 'melee', stats: { strength: 5, endurance: 5 }, source: 'raid',
      value: raidItemValue(30),
      examine: 'A wrench that was bolted to the drum before the drum was bolted to the Shed. Heavy, and it has opinions about rust. The horn mark on the handle sells for almost nothing.',
    } satisfies ItemDef,
    'raid-verge-sling': {
      id: 'raid-verge-sling', name: 'Oil-drum sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 30, rarity: 'kilnfired',
      damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 5, accuracy: 5 }, source: 'raid',
      value: raidItemValue(30),
      examine: 'Cut from the drum\'s own strap and dented on one side. It throws true, which is more than the drum did. The horn mark is worth little to any shop.',
    } satisfies ItemDef,
    'raid-verge-wand': {
      id: 'raid-verge-wand', name: 'Drum-lid wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 30, rarity: 'kilnfired',
      damageType: 'sun', hands: 1, weaponClass: 'wand', stats: { intelligence: 5, endurance: 5 }, source: 'raid',
      value: raidItemValue(30),
      examine: 'A lid, rolled into a stick and polished until the sun comes out of it. Shops will offer horn-mark coins for it, and not many.',
    } satisfies ItemDef,
    'raid-verge-hood': {
      id: 'raid-verge-hood', name: 'Rust-rat hood', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 30, rarity: 'kilnfired',
      armorType: 'cloth', stats: { endurance: 5, defense: 5 }, source: 'raid',
      value: raidItemValue(30),
      examine: 'Stitched from the rat\'s own bedding. It smells of oil and will not be washed. The Verge says that is the point.',
    } satisfies ItemDef,
    'raid-verge-charm': {
      id: 'raid-verge-charm', name: 'Drum-bung charm', icon: '🧿', kind: 'trinket', slot: 'trinket', ilvl: 30, rarity: 'kilnfired',
      stats: { endurance: 5, agility: 5 }, source: 'raid',
      value: raidItemValue(30),
      examine: 'The bung from the drum, on a bit of wire. It was the only part Old Sump would never let go of. Horn-marked, and worth a few coins at most.',
    } satisfies ItemDef,
  },

  objects: {
    'raid-verge-horn': {
      id: 'raid-verge-horn', zone: 'verge', name: 'Horn post', x: -70, z: 69, model: 'horn', verb: 'Sound the horn',
      examine: "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.",
      when: RAID_UNLOCK,
    } satisfies WorldObjectSpec,
  },
};

export const RAID_PACK: RaidPack = {
  raids: [
    {
      id: 'raid-verge', name: 'The Oil Drum', zone: 'verge', level: 29, minLevel: 27, x: -70, z: 55, r: 14,
      boss: 'raid-verge-old-sump',
      waves: [
        { enemy: 'raid-verge-sump-rat', count: 3, at: 20 },
        { enemy: 'raid-verge-sump-rat', count: 3, at: 60 },
        { enemy: 'raid-verge-sump-rat', count: 4, at: 100 },
      ],
      horn: 'raid-verge-horn',
      drops: DROPS,
      intro: 'You blow the horn. Something under the Shorn lifts its head and smells of oil.',
      victory: 'Old Sump lets go of the drum at last. The Wayfarers take the hood and the wrench, and leave the drum.',
    },
  ],
  recipes: [],
};
