// Raid pack raid-clover (see docs/roadmaps/gnomomia-rebalance-raids.md). Prefix for new ids: raid-clover-.
// The Honeydew Silo Raid: Grainsack, the Field-Mouse King, and his harvest mice, by the Honeydew Ranch silos.
import type { ContentPack, EnemyDef, ItemDef } from '../../config';
import type { RaidPack, RecipeDef } from '../../raidTypes';
import { RAID_UNLOCK, raidAddHp, raidBossHp } from '../raidTuning';
import { craftGold, raidItemValue } from '../../economy';

const ENEMIES_RAID: Record<string, EnemyDef> = {
  'raid-clover-grainsack': {
    id: 'raid-clover-grainsack', name: 'Grainsack, the Field-Mouse King', level: 16, rank: 'boss', family: 'furred',
    damageType: 'crush', aggressive: true, hpOverride: raidBossHp(16),
    loot: [], gold: [0, 0],
    model: 'rat', color: 0x8a6a4a, scale: 2.0, respawnSeconds: 0,
    noReward: true,
    examine: 'A field mouse the size of a hay bale, with a crown made from a bottle cap. He has never been asked to take it off.',
    wants: 'Winter stores. The farms are bare, and the ranch silos are the last full grain in Cloverfield.',
    lastWords: 'Squeak. (A very small squeak, for him.)',
    moves: [
      { id: 'belly-flop', name: 'Belly Flop', kind: 'ring', every: 12, telegraph: 1.5, radius: 5, damage: 1.3, status: 'staggered', statusSeconds: 1.5 },
      { id: 'chaff-cloud', name: 'Chaff Cloud', kind: 'pool', every: 15, telegraph: 1.2, radius: 3.5, damage: 0.5, status: 'slowed', statusSeconds: 3 },
      { id: 'call-the-granary', name: 'Call the Granary', kind: 'summon', every: 30, telegraph: 1, summon: { enemy: 'raid-clover-harvest-mouse', count: 3 } },
    ],
  },
  'raid-clover-harvest-mouse': {
    id: 'raid-clover-harvest-mouse', name: 'Harvest mouse', level: 15, rank: 'normal', family: 'furred',
    damageType: 'slash', aggressive: true, hpOverride: raidAddHp(15),
    loot: [], gold: [0, 0],
    model: 'rat', color: 0xb08a5a, scale: 0.9, respawnSeconds: 0,
    noReward: true,
    examine: 'Its cheeks are full, and it intends to keep them that way.',
    wants: 'A share of the silo, carried home one cheekful at a time.',
  },
};

const DROP_LEVEL = 17;
const REFORGED_LEVEL = 21;

const ITEMS_RAID: Record<string, ItemDef> = {
  'raid-clover-flail': {
    id: 'raid-clover-flail', name: 'Grain flail', icon: '🌾', kind: 'weapon', slot: 'weapon', ilvl: DROP_LEVEL, rarity: 'heirloom',
    damageType: 'crush', hands: 1, weaponClass: 'melee', stats: { strength: 3, endurance: 3 }, value: raidItemValue(DROP_LEVEL), source: 'raid',
    examine: 'Threshed the whole silo once, by the look of the straw. Horn-marked now, which sells for almost nothing.',
  },
  'raid-clover-sling': {
    id: 'raid-clover-sling', name: 'Silo-rope sling', icon: '🪢', kind: 'weapon', slot: 'weapon', ilvl: DROP_LEVEL, rarity: 'heirloom',
    damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 3, accuracy: 3 }, value: raidItemValue(DROP_LEVEL), source: 'raid',
    examine: 'Hauled grain up the silo for years. It still hauls, and the horn mark is the only thing it is paid in.',
  },
  'raid-clover-wand': {
    id: 'raid-clover-wand', name: 'Ear-of-wheat wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: DROP_LEVEL, rarity: 'heirloom',
    damageType: 'sun', hands: 1, weaponClass: 'wand', stats: { intelligence: 3, endurance: 3 }, value: raidItemValue(DROP_LEVEL), source: 'raid',
    examine: 'One ear, still golden. The mice kept it for a reason nobody has been able to guess.',
  },
  'raid-clover-hood': {
    id: 'raid-clover-hood', name: 'Chaff-sack hood', icon: '🧶', kind: 'armor', slot: 'head', ilvl: DROP_LEVEL, rarity: 'heirloom',
    armorType: 'cloth', stats: { endurance: 3, defense: 3 }, value: raidItemValue(DROP_LEVEL), source: 'raid',
    examine: 'Itches in a way that suggests it was made for someone else. Still warm.',
  },
  'raid-clover-charm': {
    id: 'raid-clover-charm', name: "Mouse-king's thimble", icon: '🪡', kind: 'trinket', slot: 'trinket', ilvl: DROP_LEVEL, rarity: 'heirloom',
    stats: { endurance: 3, agility: 3 }, value: raidItemValue(DROP_LEVEL), source: 'raid',
    examine: 'Far too small for a gnome finger, and perfectly sized for a king. Horn-marked, and worth less than the brass.',
  },
  'raid-clover-flail-reforged': {
    id: 'raid-clover-flail-reforged', name: 'Reforged grain flail', icon: '🌾', kind: 'weapon', slot: 'weapon', ilvl: REFORGED_LEVEL, rarity: 'heirloom',
    damageType: 'crush', hands: 1, weaponClass: 'melee', stats: { strength: 3, endurance: 3 }, value: raidItemValue(REFORGED_LEVEL), source: 'craft',
    examine: 'The Clippings smith cut the flail down and bound it again, with a heavier head. Tidier than before.',
  },
  'raid-clover-sling-reforged': {
    id: 'raid-clover-sling-reforged', name: 'Reforged silo-rope sling', icon: '🪢', kind: 'weapon', slot: 'weapon', ilvl: REFORGED_LEVEL, rarity: 'heirloom',
    damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 3, accuracy: 3 }, value: raidItemValue(REFORGED_LEVEL), source: 'craft',
    examine: 'Rope re-laid by a smith who thinks slings are a waste of good rope. He made it anyway.',
  },
  'raid-clover-wand-reforged': {
    id: 'raid-clover-wand-reforged', name: 'Reforged ear-of-wheat wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: REFORGED_LEVEL, rarity: 'heirloom',
    damageType: 'sun', hands: 1, weaponClass: 'wand', stats: { intelligence: 3, endurance: 3 }, value: raidItemValue(REFORGED_LEVEL), source: 'craft',
    examine: 'The gold ear is set in brass now. It still will not explain itself.',
  },
  'raid-clover-hood-reforged': {
    id: 'raid-clover-hood-reforged', name: 'Reforged chaff-sack hood', icon: '🧶', kind: 'armor', slot: 'head', ilvl: REFORGED_LEVEL, rarity: 'heirloom',
    armorType: 'cloth', stats: { endurance: 3, defense: 3 }, value: raidItemValue(REFORGED_LEVEL), source: 'craft',
    examine: 'Re-stitched with the chaff left in. The smith says it fits a gnome now, which is more than the mouse could say.',
  },
  'raid-clover-charm-reforged': {
    id: 'raid-clover-charm-reforged', name: "Reforged mouse-king's thimble", icon: '🪡', kind: 'trinket', slot: 'trinket', ilvl: REFORGED_LEVEL, rarity: 'heirloom',
    stats: { endurance: 3, agility: 3 }, value: raidItemValue(REFORGED_LEVEL), source: 'craft',
    examine: 'Brass, with a tiny crown welded to the top. The smith charges for the crown separately.',
  },
};

const DROPS = ['raid-clover-flail', 'raid-clover-sling', 'raid-clover-wand', 'raid-clover-hood', 'raid-clover-charm'];

const RECIPES_RAID: RecipeDef[] = DROPS.map((drop) => ({
  id: `${drop}-reforge`,
  station: 'raid-anvil-clippings',
  makes: `${drop}-reforged`,
  needs: [{ item: drop, count: 1 }],
  gold: craftGold(REFORGED_LEVEL),
}));

export const PACK: ContentPack = {
  id: 'raid-clover',
  enemies: ENEMIES_RAID,
  items: ITEMS_RAID,
  objects: {
    'raid-clover-horn': {
      id: 'raid-clover-horn', zone: 'cloverfield', name: 'Horn post', x: -80, z: -6, model: 'horn', verb: 'Sound the horn',
      examine: "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.",
      when: RAID_UNLOCK,
    },
  },
};

export const RAID_PACK: RaidPack = {
  raids: [
    {
      id: 'raid-clover', name: 'The Honeydew Silo Raid', zone: 'cloverfield', level: 16, minLevel: 14,
      x: -80, z: -20, r: 14, boss: 'raid-clover-grainsack',
      waves: [
        { enemy: 'raid-clover-harvest-mouse', count: 3, at: 20 },
        { enemy: 'raid-clover-harvest-mouse', count: 3, at: 60 },
        { enemy: 'raid-clover-harvest-mouse', count: 4, at: 100 },
      ],
      horn: 'raid-clover-horn',
      drops: DROPS,
      intro: 'Grainsack has the silos open and the mice are carrying the grain off. Blow the horn and get it back.',
      victory: 'The king is down and the silo is half full again. The Reeve will want the rest of it back.',
    },
  ],
  recipes: RECIPES_RAID,
};
