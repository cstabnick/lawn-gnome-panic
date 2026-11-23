// Raid pack raid-hedge (see docs/roadmaps/gnomomia-rebalance-raids.md). Prefix for new ids: raid-hedge-.
import type { ContentPack, EnemyDef, ItemDef, WorldObjectSpec } from '../../config';
import type { RaidDef, RaidPack, RecipeDef } from '../../raidTypes';
import { RAID_UNLOCK, raidAddHp, raidBossHp } from '../raidTuning';
import { craftGold, raidItemValue } from '../../economy';

const enemies: Record<string, EnemyDef> = {
  'raid-hedge-ironhorn': {
    id: 'raid-hedge-ironhorn', name: 'Ironhorn, the Old Stag', level: 20, rank: 'boss', family: 'shelled',
    damageType: 'crush', aggressive: true, model: 'beetle', color: 0x3a2a1a, scale: 2.4,
    hpOverride: raidBossHp(20), loot: [], gold: [0, 0], respawnSeconds: 0, noReward: true,
    examine: 'An old stag beetle, shell worn pale at the tips of his horns, who has held this hollow under the Elder Privet since before the Hedgewrights had a name for it.',
    wants: 'His rutting ground under the Elder Privet, which the Hedgewrights keep clearing for timber.',
    lastWords: 'Click.',
    moves: [
      { id: 'antler-sweep', name: 'Antler Sweep', kind: 'cone', every: 10, telegraph: 1.3, radius: 6, damage: 1.3 },
      { id: 'charge', name: 'Charge', kind: 'lane', every: 14, telegraph: 1.6, length: 16, width: 3, damage: 1.5, status: 'staggered', statusSeconds: 2 },
      { id: 'rut-call', name: 'Rut Call', kind: 'summon', every: 32, telegraph: 1, summon: { enemy: 'raid-hedge-young-stag', count: 2 } },
    ],
  },
  'raid-hedge-young-stag': {
    id: 'raid-hedge-young-stag', name: 'Young stag', level: 19, rank: 'normal', family: 'shelled',
    damageType: 'crush', aggressive: true, model: 'beetle', color: 0x5a3a1a, scale: 1.2,
    hpOverride: raidAddHp(19), loot: [], gold: [0, 0], respawnSeconds: 0, noReward: true,
    examine: 'A stag beetle still growing into his horns. He is trying very hard to look as if he is not.',
    wants: 'To prove himself to the old one.',
  },
};

const items: Record<string, ItemDef> = {
  'raid-hedge-antler-axe': {
    id: 'raid-hedge-antler-axe', name: 'Antler axe', icon: '🪓', kind: 'weapon', slot: 'weapon', ilvl: 21,
    rarity: 'heirloom', source: 'raid', damageType: 'slash', hands: 1, weaponClass: 'melee',
    stats: { strength: 3, endurance: 3 }, value: raidItemValue(21),
    examine: 'Cut from a shed antler and bound to a haft. The horn mark is on the grip, where the Hedgewrights keep their tallies.',
  },
  'raid-hedge-sling': {
    id: 'raid-hedge-sling', name: 'Rut-cord sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 21,
    rarity: 'heirloom', source: 'raid', damageType: 'crush', hands: 1, weaponClass: 'sling',
    stats: { agility: 3, accuracy: 3 }, value: raidItemValue(21),
    examine: 'Twisted from the sinew of a stag who lost. The horn mark is worth more to a smith than the sling is to you.',
  },
  'raid-hedge-wand': {
    id: 'raid-hedge-wand', name: 'Privet-heart wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 21,
    rarity: 'heirloom', source: 'raid', damageType: 'sun', hands: 1, weaponClass: 'wand',
    stats: { intelligence: 3, endurance: 3 }, value: raidItemValue(21),
    examine: 'Heartwood from the Elder Privet, which does not like to be cut and has said so. The horn mark is burned into the end.',
  },
  'raid-hedge-hood': {
    id: 'raid-hedge-hood', name: 'Bark-felt hood', icon: '🎩', kind: 'armor', slot: 'head', ilvl: 21,
    rarity: 'heirloom', source: 'raid', armorType: 'cloth',
    stats: { endurance: 3, defense: 3 }, value: raidItemValue(21),
    examine: 'Felted bark that keeps the rain off and the gossip in. Horn-marked, so the Wayfarers know whose it is.',
  },
  'raid-hedge-charm': {
    id: 'raid-hedge-charm', name: 'Shed-antler charm', icon: '📿', kind: 'trinket', slot: 'trinket', ilvl: 21,
    rarity: 'heirloom', source: 'raid', stats: { endurance: 3, agility: 3 }, value: raidItemValue(21),
    examine: 'A tine from a shed antler on a cord. It is lighter than it looks, and the horn mark is on the back where nobody reads it.',
  },
  'raid-hedge-antler-axe-reforged': {
    id: 'raid-hedge-antler-axe-reforged', name: 'Flintdelve antler axe', icon: '🪓', kind: 'weapon', slot: 'weapon', ilvl: 25,
    rarity: 'heirloom', source: 'craft', damageType: 'slash', hands: 1, weaponClass: 'melee',
    stats: { strength: 4, endurance: 4 }, value: raidItemValue(25),
    examine: 'The antler axe, re-hafted and re-edged by a Flintdelve smith who charged for the work and did not ask about the horn.',
  },
  'raid-hedge-sling-reforged': {
    id: 'raid-hedge-sling-reforged', name: 'Flintdelve rut-cord sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 25,
    rarity: 'heirloom', source: 'craft', damageType: 'crush', hands: 1, weaponClass: 'sling',
    stats: { agility: 4, accuracy: 4 }, value: raidItemValue(25),
    examine: 'The rut-cord sling, re-strung with something tougher. The smith says it will outlast the stag. He is probably right.',
  },
  'raid-hedge-wand-reforged': {
    id: 'raid-hedge-wand-reforged', name: 'Flintdelve privet-heart wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 25,
    rarity: 'heirloom', source: 'craft', damageType: 'sun', hands: 1, weaponClass: 'wand',
    stats: { intelligence: 4, endurance: 4 }, value: raidItemValue(25),
    examine: 'The privet-heart wand, capped in Flintdelve iron. The privet has not complained, which the smith took as consent.',
  },
  'raid-hedge-hood-reforged': {
    id: 'raid-hedge-hood-reforged', name: 'Flintdelve bark-felt hood', icon: '🎩', kind: 'armor', slot: 'head', ilvl: 25,
    rarity: 'heirloom', source: 'craft', armorType: 'cloth',
    stats: { endurance: 4, defense: 4 }, value: raidItemValue(25),
    examine: 'The bark-felt hood, lined and stitched in Flintdelve. Warmer than it was, and the horn mark is now under a patch.',
  },
  'raid-hedge-charm-reforged': {
    id: 'raid-hedge-charm-reforged', name: 'Flintdelve antler charm', icon: '📿', kind: 'trinket', slot: 'trinket', ilvl: 25,
    rarity: 'heirloom', source: 'craft', stats: { endurance: 4, agility: 4 }, value: raidItemValue(25),
    examine: 'The shed-antler charm, set in a Flintdelve iron ring. The smith would like it known that the ring was extra.',
  },
};

const objects: Record<string, WorldObjectSpec> = {
  'raid-hedge-horn': {
    id: 'raid-hedge-horn', zone: 'hedgewood', name: 'Horn post', x: -65, z: -26, model: 'horn',
    verb: 'Sound the horn',
    examine: "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.",
    when: RAID_UNLOCK,
  },
};

const drops = Object.keys(items).filter((id) => !id.endsWith('-reforged'));

const raid: RaidDef = {
  id: 'raid-hedge', name: 'The Rut Under the Elder Privet', zone: 'hedgewood', level: 20, minLevel: 18,
  x: -65, z: -40, r: 14, boss: 'raid-hedge-ironhorn',
  waves: [
    { enemy: 'raid-hedge-young-stag', count: 2, at: 20 },
    { enemy: 'raid-hedge-young-stag', count: 3, at: 60 },
    { enemy: 'raid-hedge-young-stag', count: 3, at: 100 },
  ],
  horn: 'raid-hedge-horn',
  drops,
  intro: "Ironhorn has been seen on his rutting ground, and the Hedgewrights want it cleared. Blow the horn and the Wayfarers will come.",
  victory: 'The old stag is down, and the Hedgewrights will have their timber back. The gear is still horn-marked, so do not try to sell it.',
};

const recipes: RecipeDef[] = drops.map((drop) => ({
  id: `${drop}-reforge`,
  station: 'raid-anvil-flintdelve',
  makes: `${drop}-reforged`,
  needs: [{ item: drop, count: 1 }],
  gold: craftGold(25),
}));

export const PACK: ContentPack = { id: 'raid-hedge', enemies, items, objects };
export const RAID_PACK: RaidPack = { raids: [raid], recipes };
