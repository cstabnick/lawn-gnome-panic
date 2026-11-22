// Content pack ch4-cloverfield: Root and Seed (chapter 4, Cloverfield, levels 11-16). Prefix for new ids: c4-.
import { look, type ContentPack, type DialogueNode, type DialogueOption, type ZoneId } from '../../config';

// Snail-cart travel: one ticket, one node that does the travel. Each town opens on the quest of the chapter that opens it.
const TOWNS: { key: string; label: string; quest: string; zone: ZoneId; x: number; z: number }[] = [
  { key: 'mossbottom', label: 'Mossbottom', quest: 'mb-what-moles-know', zone: 'mossbottom', x: 4, z: 4 },
  { key: 'thatchford', label: 'Thatchford', quest: 'c2-letter-for-the-queen', zone: 'thatchford', x: 4, z: 6 },
  { key: 'keep', label: 'Birdbath Keep', quest: 'c3-ledger', zone: 'keep', x: 0, z: 24 },
  { key: 'hedgewood', label: 'Hedgewood', quest: 'c5-valve-maps', zone: 'hedgewood', x: 44, z: 40 },
  { key: 'rockery', label: 'the Rockery', quest: 'c6-who-holds-the-valve', zone: 'rockery', x: 3, z: 24 },
  { key: 'verge', label: 'the Verge', quest: 'c7-the-level', zone: 'verge', x: 4, z: 80 },
];

function travelNodes(): { options: DialogueOption[]; nodes: Record<string, DialogueNode> } {
  const options: DialogueOption[] = [];
  const nodes: Record<string, DialogueNode> = {};
  for (const t of TOWNS) {
    const when = { hasItem: { item: 'snailcart-ticket', count: 1 }, quest: { id: t.quest, status: 'done' as const } };
    options.push({ text: `Ride a snail-cart to ${t.label} (one ticket).`, next: `ride-${t.key}`, action: { type: 'takeItem', item: 'snailcart-ticket', count: 1 }, when });
    nodes[`ride-${t.key}`] = {
      text: `Hold on to the snail. ${t.label} by sunset, if the snail agrees.`,
      options: [{ text: 'Let us go.', action: { type: 'travel', zone: t.zone, x: t.x, z: t.z } }],
    };
  }
  return { options, nodes };
}

const TRAVEL = travelNodes();

export const PACK: ContentPack = {
  id: 'ch4-cloverfield',

  items: {
    // Sodbury smith stock (plain, ilvl 12-15).
    'c4-hay-hook': { id: 'c4-hay-hook', name: 'Hay hook', icon: '🪝', kind: 'weapon', slot: 'weapon', ilvl: 12, damageType: 'pierce', hands: 2, weaponClass: 'melee', value: 144, examine: 'Built to lift bales. Works on other things if you are in a hurry.' },
    'c4-ranch-spade': { id: 'c4-ranch-spade', name: 'Ranch spade', icon: '🪏', kind: 'weapon', slot: 'weapon', ilvl: 13, damageType: 'crush', hands: 1, weaponClass: 'melee', value: 169, examine: 'Dug a hundred fence posts. Has opinions about the next hundred.' },
    'c4-ladybird-plate': { id: 'c4-ladybird-plate', name: 'Ladybird-shell plate', icon: '🐞', kind: 'armor', slot: 'body', ilvl: 13, armorType: 'plate', value: 169, examine: 'Red shell, black spots, and a faint smell of aphid.' },
    'c4-rancher-sling': { id: 'c4-rancher-sling', name: 'Rancher\'s sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 12, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 144, examine: 'For shooing crows off the seed, and sometimes the crows off the ranch hand.' },
    'c4-lasso-sling': { id: 'c4-lasso-sling', name: 'Lasso-and-sling', icon: '🪢', kind: 'weapon', slot: 'weapon', ilvl: 14, damageType: 'crush', hands: 1, weaponClass: 'sling', value: 196, examine: 'Catches a snail at twelve paces. Catches the snail\'s owner at six.' },
    'c4-cricket-jerkin': { id: 'c4-cricket-jerkin', name: 'Cricket-leather jerkin', icon: '🦗', kind: 'armor', slot: 'body', ilvl: 14, armorType: 'leather', value: 196, examine: 'Stiff, springy, and loud when you crouch.' },
    'c4-clover-wand': { id: 'c4-clover-wand', name: 'Clover wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 13, damageType: 'bloom', hands: 1, weaponClass: 'wand', value: 169, examine: 'Three leaves on the tip. Only one of them is lucky.' },
    'c4-honeycomb-charm': { id: 'c4-honeycomb-charm', name: 'Honeycomb charm', icon: '🍯', kind: 'offhand', slot: 'offhand', ilvl: 13, stats: { bloomHealing: 5 }, value: 169, examine: 'Sticky, sweet, and it still smells of the hive.' },
    // Sodbury smith's prize stock (blooming, value 4 x ilvl^2).
    'c4-show-hay-hook': { id: 'c4-show-hay-hook', name: 'Prize hay hook', icon: '🪝', kind: 'weapon', slot: 'weapon', ilvl: 16, rarity: 'blooming', damageType: 'slash', hands: 1, weaponClass: 'melee', stats: { strength: 2, defense: 2 }, value: 1024, prefab: 'hay-hook', examine: 'Won the Sodbury fair three years running, for hooking. Nobody else entered.' },
    'c4-drovers-lasso': { id: 'c4-drovers-lasso', name: 'Drover\'s lasso-sling', icon: '🪢', kind: 'weapon', slot: 'weapon', ilvl: 16, rarity: 'blooming', damageType: 'crush', hands: 1, weaponClass: 'sling', stats: { agility: 2, accuracy: 2 }, value: 1024, prefab: 'lasso-sling', examine: 'A snail drover\'s working sling. The rope is soaked in honeydew, so it never slips.' },
    'c4-ribbon-wand': { id: 'c4-ribbon-wand', name: 'Four-leaf wand', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 16, rarity: 'blooming', damageType: 'bloom', hands: 1, weaponClass: 'wand', stats: { intelligence: 2, endurance: 2 }, value: 1024, prefab: 'clover-wand', examine: 'All four leaves are lucky. The smith swears to it, and he has never lost at cards.' },
    'c4-thistledown-smock': {
      id: 'c4-thistledown-smock', name: 'Thistledown smock', icon: '👗', kind: 'armor', slot: 'body', ilvl: 16, rarity: 'blooming', armorType: 'cloth', stats: { endurance: 2, intelligence: 2 }, value: 1024, prefab: 'cloth-smock',
      examine: 'Thistledown felted on linen. Light as the dandelion smock, and it holds a stitch.',
      gate: { when: { quest: { id: 'c4-granary', status: 'done' } }, why: 'Tilth keeps his thistledown in the granary loft, and the mice have it. Finish The Granary for Muckle.' },
    },
    'c4-ribbon-charm': {
      id: 'c4-ribbon-charm', name: 'Fair ribbon charm', icon: '🎗️', kind: 'trinket', slot: 'trinket', ilvl: 16, rarity: 'blooming', stats: { endurance: 2, agility: 2 }, value: 1024, prefab: 'bead-necklace',
      examine: 'A blue fair ribbon on a string of clover beads. Sodbury gives one a year.',
      gate: { when: { quest: { id: 'c4-antenna-sister', status: 'done' } }, why: 'Sodbury holds no fair while the ants are at the fences. Finish Antenna-Sister.' },
    },
    'c4-dandelion-smock': { id: 'c4-dandelion-smock', name: 'Dandelion-down smock', icon: '👗', kind: 'armor', slot: 'body', ilvl: 14, armorType: 'cloth', value: 196, examine: 'Light enough to blow away. Warm enough to stop it.' },

    // Named drops and rewards.
    'c4-gleaners-pinion': { id: 'c4-gleaners-pinion', name: 'Gleaner\'s Pinion', icon: '🪶', kind: 'offhand', slot: 'offhand', ilvl: 16, rarity: 'heirloom', damageType: 'pierce', value: 1024, effect: '+2 m range.', examine: 'A long black flight feather. Slingers would fight over it, if they were not already fighting over everything else.' },
    'c4-formicas-mandible': { id: 'c4-formicas-mandible', name: 'Formica\'s Mandible', icon: '🦷', kind: 'weapon', slot: 'weapon', ilvl: 16, rarity: 'heirloom', damageType: 'slash', hands: 1, weaponClass: 'melee', value: 1024, effect: 'Hits Crack.', examine: 'Still clicking, a little, when you hold it near aphids.' },
    'c4-haybale-hoe': { id: 'c4-haybale-hoe', name: 'Haybale Family Hoe', icon: '⛏️', kind: 'weapon', slot: 'weapon', ilvl: 16, rarity: 'blooming', damageType: 'crush', hands: 2, weaponClass: 'melee', value: 512, examine: 'Four generations of Haybales. Don\'t lose it.' },
    'c4-riding-snail': { id: 'c4-riding-snail', name: 'Riding snail', icon: '🐌', kind: 'trinket', slot: 'trinket', ilvl: 12, stats: { moveSpeed: 30 }, value: 144, examine: 'A saddle, a bridle and a snail who has agreed to go slightly faster. +30% walk speed.' },

    // Consumables.
    'honeydew-flask': { id: 'honeydew-flask', name: 'Honeydew flask', icon: '🍯', kind: 'potion', heal: 40, stackable: true, value: 20, examine: 'Honeydew from Ma Haybale\'s aphids. Restores 40 hit points.' },
    'snailcart-ticket': { id: 'snailcart-ticket', name: 'Snail-cart ticket', icon: '🎫', kind: 'misc', stackable: true, value: 5, examine: 'Good for one ride on a snail-cart between towns you have visited.' },
    'snailcart-writ': { id: 'snailcart-writ', name: 'Snail-cart Writ', icon: '📜', kind: 'misc', questItem: true, value: 0, examine: 'Fieldwardens will haul for the war. Mabel signed it twice, in case the first one slid off the cart.' },

    // Quest items.
    'c4-grain-sack': { id: 'c4-grain-sack', name: 'Grain sack', icon: '🌾', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Muckle\'s hidden grain, for the Gleaner. Light, but it smells of a long winter.' },
    'c4-clover-seed': { id: 'c4-clover-seed', name: 'Clover seed', icon: '☘️', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Seed for the Thousand\'s pasture. A peace offering, if you can get it there in one piece.' },
    'c4-honeydew': { id: 'c4-honeydew', name: 'Honeydew', icon: '💧', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Sticky sweet sap from the aphid trough. Ants like it more than gnomes do.' },
    'c4-primer-book': { id: 'c4-primer-book', name: 'Primer', icon: '📕', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'A school primer from the Keep. Someone has drawn a snail on the first page.' },
  },

  enemies: {
    aphid: {
      id: 'aphid', name: 'Aphid', level: 11, rank: 'trivial', family: 'soft', damageType: 'pierce', aggressive: false,
      loot: [], gold: [0, 1],
      model: 'aphid', color: 0x9ccc4a, scale: 0.6, respawnSeconds: 30,
      examine: 'Livestock. Plump, green and milked twice a day, which it seems to enjoy.', wants: 'Clover sap.',
      lastWords: 'Ma Haybale won\'t like that.',
    },
    ladybird: {
      id: 'ladybird', name: 'Ladybird', level: 11, rank: 'normal', family: 'shelled', damageType: 'slash', aggressive: true,
      loot: [], gold: [1, 4],
      model: 'beetle', color: 0xc0281e, scale: 0.8, respawnSeconds: 30,
      examine: 'Hops from aphid to aphid, eating as it goes. Nobody has asked it to stop.', wants: 'Aphids, to eat them.',
    },
    'runaway-snail': {
      id: 'runaway-snail', name: 'Runaway snail', level: 12, rank: 'trivial', family: 'soft', damageType: 'crush', aggressive: false,
      loot: [], gold: [0, 1],
      model: 'snail', color: 0xb89a6a, scale: 1, respawnSeconds: 30,
      examine: 'Left the pen at dawn and has been making slow progress ever since.', wants: 'Freedom, slowly.',
    },
    'field-mouse': {
      id: 'field-mouse', name: 'Field mouse', level: 12, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [], gold: [1, 4],
      model: 'rat', color: 0x9a8a7a, scale: 0.7, respawnSeconds: 30,
      examine: 'Comes in threes, which is how you know there are more in the granary.', wants: 'The granary.',
    },
    'red-ant-worker': {
      id: 'red-ant-worker', name: 'Red ant worker', level: 13, rank: 'normal', family: 'shelled', damageType: 'crush', aggressive: false,
      loot: [], gold: [0, 2],
      model: 'ant', color: 0xa33a1e, scale: 0.8, respawnSeconds: 30,
      examine: 'Carrying a seed twice its size. It does not stop to say hello.', wants: 'Pasture and aphids for the colony.',
    },
    'red-ant-soldier': {
      id: 'red-ant-soldier', name: 'Red ant soldier', level: 14, rank: 'normal', family: 'shelled', damageType: 'slash', aggressive: true,
      loot: [], gold: [2, 6],
      model: 'ant', color: 0x8a2a14, scale: 1, respawnSeconds: 30,
      examine: 'Guards the workers, and the ranch, and now the ranch\'s old gate.', wants: 'To guard the workers.',
    },
    grasshopper: {
      id: 'grasshopper', name: 'Grasshopper', level: 14, rank: 'normal', family: 'shelled', damageType: 'crush', aggressive: true,
      loot: [{ item: 'c4-clover-seed', chance: 0.8 }], gold: [1, 5],
      model: 'cricket', color: 0x7fa84a, scale: 1.1, respawnSeconds: 30,
      examine: 'Leaps eight metres and lands on whatever it fancies. The crops, mostly.', wants: 'Crops.',
    },
    'straw-wight': {
      id: 'straw-wight', name: 'Straw wight', level: 15, rank: 'normal', family: 'plant', damageType: 'crush', aggressive: true,
      loot: [], gold: [2, 6],
      model: 'straw', color: 0xd8b860, scale: 1, respawnSeconds: 30,
      examine: 'Straw that has been standing guard so long it has forgotten what for.', wants: 'To guard the Straw King, as the scarecrow does.',
    },
    'ant-queen': {
      id: 'ant-queen', name: 'Ant Queen Formica', level: 16, rank: 'miniboss', family: 'shelled', damageType: 'slash', aggressive: true,
      loot: [{ item: 'c4-formicas-mandible', chance: 1 }], gold: [40, 70],
      model: 'ant', color: 0x5a1a0e, scale: 1.8, respawnSeconds: 0,
      examine: 'The Queen of the Thousand. Her mound is her house, her army and her last argument.', wants: 'Her colony to survive.',
      moves: [
        { id: 'call-soldiers', name: 'Call the Soldiers', kind: 'summon', every: 25, telegraph: 1, belowHpPct: 0.6, summon: { enemy: 'red-ant-soldier', count: 2 } },
        { id: 'mandible-crack', name: 'Mandible Crack', kind: 'cone', every: 10, telegraph: 1.2, radius: 3, damage: 1.1, status: 'cracked', statusSeconds: 4 },
      ],
      lastWords: 'The mound will hold without me. Probably.',
    },
    'old-gleaner': {
      id: 'old-gleaner', name: 'Old Gleaner', level: 16, rank: 'worldboss', family: 'winged', damageType: 'pierce', aggressive: true,
      loot: [{ item: 'c4-gleaners-pinion', chance: 1 }], gold: [60, 90],
      model: 'crow', color: 0x1c1c22, scale: 2.4, respawnSeconds: 0,
      examine: 'A great crow, thin as a fence post and twice as tall. She has not eaten properly in a season.', wants: 'Food. The farms are empty, so there is no spilled grain.',
      moves: [
        { id: 'swoop', name: 'Swoop', kind: 'lane', every: 14, telegraph: 1.5, length: 14, width: 3, damage: 1.2 },
        { id: 'gust', name: 'Gust', kind: 'cone', every: 10, telegraph: 1.2, radius: 6, damage: 0.8, status: 'slowed', statusSeconds: 3 },
        { id: 'snatch', name: 'Snatch', kind: 'vanish', every: 25, telegraph: 2, radius: 3 },
      ],
      lastWords: 'Then I suppose the grain was never coming.',
    },
  },

  npcs: {
    haybale: {
      id: 'haybale', name: 'Ma Honeydew Haybale', look: look(0x7a3a5a, 0x9a7a4a, null, { glasses: true }), zone: 'cloverfield', x: -62, z: -30, wander: 0.5,
      examine: 'Head of the biggest aphid ranch. Her three children all left for the Keep, and none of them write.',
      greetings: [
        { when: { questStage: { id: 'c4-haybale-letters', stage: 1 } }, node: 'lettersIn' },
        { when: { flag: { name: 'c4-tax', value: 'collect' } }, node: 'cold' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'An aphid ain\'t smart, but it\'s loyal. More than I can say for some. What do you want, dear?',
          options: [
            { text: 'Your children. Do you want me to find them?', next: 'letters', action: { type: 'startQuest', quest: 'c4-haybale-letters' }, when: { quest: { id: 'c4-haybale-letters', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        letters: { text: 'Three of them. One is Robin-Master Wren Tumble, up at the Keep, and she won\'t be the first to say she is busy. Go and ask them.', options: [{ text: 'I will find them.' }] },
        lettersIn: { text: 'You found them? Wren wrote? Well. Well, then. Take this hoe. Four generations of Haybales. Don\'t lose it.', options: [{ text: 'Thank you, Ma Haybale.' }] },
        cold: { text: 'I heard about the Chancellor\'s tax. You collected it, and you kept the change. Don\'t come near my herd.', options: [{ text: 'I did what I had to.' }] },
      },
    },

    fallow: {
      id: 'fallow', name: 'Sheriff Timothy Fallow', look: look(0x5a3a1e, 0x7a6a3a, 0x9c7a4a), zone: 'cloverfield', x: -4, z: -8, wander: 0.3,
      examine: 'Sheriff of Cloverfield. He keeps one eye on the ants and the other on the sky.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Ants don\'t sleep. So I don\'t either. What is it?',
          options: [
            { text: 'The ants have the Pettigrew ranch. What do we do?', next: 'rustlers', action: { type: 'startQuest', quest: 'c4-rustlers' }, when: { quest: { id: 'c4-rustlers', status: 'none' }, questAtLeast: { id: 'c4-royal-warrant', stage: 1 } } },
            { text: 'Anything I can do about the crow?', next: 'gleaner', action: { type: 'startQuest', quest: 'c4-old-gleaner' }, when: { quest: { id: 'c4-old-gleaner', status: 'none' }, questAtLeast: { id: 'c4-rustlers', stage: 2 } } },
            { text: 'Is there a straw man out at Scarecrow Rise?', next: 'straw', action: { type: 'startQuest', quest: 'c4-straw-king' }, when: { quest: { id: 'c4-straw-king', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        rustlers: { text: 'Reach the Pettigrew ranch, then kill the red ant soldiers squatting in it. Eight of them. Don\'t let them carry off the fence.', options: [{ text: 'I will ride out.' }] },
        gleaner: { text: 'She roosts at Crow\'s Perch. Hungry, and starving the crows out of their own nests. Fight her, or feed her. I\'ll not tell you which.', options: [{ text: 'Understood.' }] },
        straw: { text: 'Scarecrow Rise. Read what is carved on the post, and clear the straw-wights around it. The Archive says it was "a Gardener who forgot to leave".', options: [{ text: 'I will look.' }] },
      },
    },

    muckle: {
      id: 'muckle', name: 'Fieldwarden Clover Muckle', look: look(0x3a5a2a, 0x6b5a3a, 0xd0c8b0, { glasses: true }), zone: 'cloverfield', x: 17, z: -9, wander: 0.2,
      examine: 'Fieldwarden and keeper of the granary. He counts everything twice, and the second count is always lower.',
      shop: ['honeydew-flask', 'snailcart-ticket'],
      greetings: [
        { when: { questStage: { id: 'c4-royal-warrant', stage: 0 } }, node: 'warrant' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Haul for the Crown? With what? The young left and the ants have the Pettigrew ranch. What do you need?',
          options: [
            { text: 'Show me your stock.', action: { type: 'openShop' } },
            // questAtLeast with a stage past the end means "done" (done quests always pass).
            { text: 'Give me the Royal Warrant, then.', next: 'warrantAsk', action: { type: 'startQuest', quest: 'c4-royal-warrant' }, when: { quest: { id: 'c4-royal-warrant', status: 'none' }, questAtLeast: { id: 'c3-ledger', stage: 99 } } },
            { text: 'The granary needs clearing.', next: 'granary', action: { type: 'startQuest', quest: 'c4-granary' }, when: { quest: { id: 'c4-granary', status: 'none' }, questAtLeast: { id: 'c4-royal-warrant', stage: 1 } } },
            { text: 'I found your hidden grain store.', next: 'skim', action: { type: 'startQuest', quest: 'c4-muckles-skimming' }, when: { flagSet: 'c4-store-found', quest: { id: 'c4-muckles-skimming', status: 'none' } } },
            { text: 'The Chancellor\'s tax. What is owed?', next: 'tax', action: { type: 'startQuest', quest: 'c4-potsworths-tax' }, when: { quest: { id: 'c4-potsworths-tax', status: 'none' }, questAtLeast: { id: 'c4-royal-warrant', stage: 1 } } },
            { text: 'Goodbye.' },
          ],
        },
        warrantAsk: { text: 'The Warrant is on my desk, under the tea. Come back and I will hand it over, and tell you the three things that need fixing.', options: [{ text: 'I will be back.' }] },
        warrant: { text: 'Three things. The ranch, the snails, and the granary. Fallow has the ranch, Mabel has the snails, and I have the granary, which is where your work starts.', options: [{ text: 'Then I start now.' }] },
        granary: { text: 'Field mice, ten of them, in the granary. They have made a home of the good sacks. Clear them, and I will owe you a drink.', options: [{ text: 'Consider it done.' }] },
        skim: {
          text: 'Found it, did you. Then you know. I feed the old folk out of the store, and that is technically a crime. Tell the Sheriff, or keep my secret. Your choice.',
          options: [
            { text: 'Tell the Sheriff.', action: { type: 'setFlag', flag: 'c4-skim', value: 'told' } },
            { text: 'Keep the secret.', action: { type: 'setFlag', flag: 'c4-skim', value: 'kept' } },
          ],
        },
        tax: {
          text: 'The Chancellor sent a collector in the spring and nobody has paid. The tax is owed. Pay it yourself, forgive it, or collect it from the farms. Your choice, and the farms will remember.',
          options: [
            { text: 'I will pay it myself.', action: { type: 'setFlag', flag: 'c4-tax', value: 'pay' } },
            { text: 'Forgive it.', action: { type: 'setFlag', flag: 'c4-tax', value: 'forgive' } },
            { text: 'Collect it from the farms.', action: { type: 'setFlag', flag: 'c4-tax', value: 'collect' } },
          ],
        },
      },
    },

    mabel: {
      id: 'mabel', name: 'Mabel Snailwright', look: look(0x8a4a1a, 0x4a6a8a, null, { hair: { color: 0xc8a050, style: 'pigtails' } }), zone: 'cloverfield', x: 14, z: 14, wander: 0.4,
      examine: 'Snail-cart builder. Built the cart King Gnorbert rode to the Verge. It came back empty.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Slow is safe. Fast is how you end up on the Shorn. What can I do for you?',
          options: [
            { text: 'The snails are running off. Can you help?', next: 'snails', action: { type: 'startQuest', quest: 'c4-runaway-snails' }, when: { quest: { id: 'c4-runaway-snails', status: 'none' }, questAtLeast: { id: 'c4-royal-warrant', stage: 1 } } },
            { text: 'Is the cart ready to haul the Crown\'s grain?', next: 'haul', action: { type: 'startQuest', quest: 'c4-great-haul' }, when: { quest: { id: 'c4-great-haul', status: 'none' }, questAtLeast: { id: 'c4-old-gleaner', stage: 2 } } },
            { text: 'I want a ride, please.', next: 'travel' },
            { text: 'Goodbye.' },
          ],
        },
        snails: { text: 'Lasso them at the pen post, five of them. They come back. Mostly. Here, a riding snail for your trouble, once they\'re home.', options: [{ text: 'I will fetch them.' }] },
        haul: { text: 'Escort me to the Keep\'s exit. Straw-wights and mice will try to stop us on the road. Keep the cart close.', options: [{ text: 'Let us go.' }] },
        travel: {
          text: 'One ticket a ride, and the snails don\'t care where you are going. Which town?',
          options: [...TRAVEL.options, { text: 'Never mind.' }],
        },
        ...TRAVEL.nodes,
      },
    },

    kree: {
      id: 'kree', name: 'Antenna-Sister Kree', look: look(0x5a2a1a, 0x3a2a1a, null), zone: 'cloverfield', x: 38, z: 60, wander: 0.2, model: 'ant',
      examine: 'Red ant. Translator for the Thousand. Speaks gnome as if she is clearing a blocked drain.',
      greetings: [
        { when: { flagSet: 'ants' }, node: 'settled' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Click-trill. Click. Translation: the Thousand need pasture. Your aphids are on it.',
          options: [
            { text: 'Let us talk about the ants.', next: 'choose', action: { type: 'startQuest', quest: 'c4-antenna-sister' }, when: { quest: { id: 'c4-antenna-sister', status: 'none' }, questAtLeast: { id: 'c4-royal-warrant', stage: 1 } } },
            { text: 'We need to talk about the ants.', next: 'choose', when: { quest: { id: 'c4-antenna-sister', status: 'active' } } },
            { text: 'Goodbye.' },
          ],
        },
        choose: {
          text: 'Click. Two roads. Share the grazing, or drive the Thousand off. Translation of the second road: a queen has to die first.',
          options: [
            { text: 'Make peace. Shared pasture.', next: 'peace' },
            { text: 'Drive them out.', action: { type: 'setFlag', flag: 'ants', value: 'war' } },
          ],
        },
        peace: { text: 'Click-trill. Proof first. Take 10 clover seed and 5 honeydew to our Queen. She will know if they are fresh.', options: [{ text: 'I will bring them.' }] },
        settled: { text: 'Click. Settled. Whatever you chose, the aphids will not forget it, and neither will the Thousand.', options: [{ text: 'Goodbye, Kree.' }] },
      },
    },

    'c4-ant-queen-npc': {
      id: 'c4-ant-queen-npc', name: 'Queen Formica', look: look(0x5a1a0e, 0x3a1a0e, null), zone: 'cloverfield', x: 50, z: 60, wander: 0, model: 'ant',
      hidden: { flag: { name: 'ants', value: 'war' } },
      examine: 'The Queen of the Thousand. Her mound is her house, her army and her last argument.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Click-trill. Our mound is hungry. Have you the tribute?',
          options: [
            { text: 'I have brought the tribute.', next: 'tribute', when: { quest: { id: 'c4-antenna-sister', status: 'active' }, hasItem: { item: 'c4-clover-seed', count: 10 } } },
            { text: 'Goodbye.' },
          ],
        },
        tribute: { text: 'Clover seed, ten. Show me. Good. Now the sweet.', options: [{ text: 'Here.', next: 'tribute2', action: { type: 'takeItem', item: 'c4-clover-seed', count: 10 } }] },
        tribute2: { text: 'Honeydew, five. Fresh. Then the pasture is ours to share.', options: [{ text: 'Here.', next: 'accept', action: { type: 'takeItem', item: 'c4-honeydew', count: 5 } }] },
        accept: { text: 'Click. The Thousand will graze beside the aphids. Tell Kree.', options: [{ text: 'Peace, Queen.', action: { type: 'setFlag', flag: 'ants', value: 'peace' } }] },
      },
    },

    'c4-sodbury-smith': {
      id: 'c4-sodbury-smith', name: 'Tilth Anvilhand', look: look(0x2a2a2a, 0x5a4a3a, 0x8a7a6a), zone: 'cloverfield', x: 8, z: 6, wander: 0,
      examine: 'Smith of Sodbury. Shoes horses, mends ploughs, and hates ants on principle.',
      shop: ['c4-hay-hook', 'c4-ranch-spade', 'c4-ladybird-plate', 'c4-rancher-sling', 'c4-lasso-sling', 'c4-cricket-jerkin', 'c4-clover-wand', 'c4-honeycomb-charm', 'c4-dandelion-smock',
        'c4-show-hay-hook', 'c4-drovers-lasso', 'c4-ribbon-wand', 'c4-thistledown-smock', 'c4-ribbon-charm'],
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: { hub: true, text: 'Hay hooks, spades, plate off a ladybird. Hit something with it and bring it back for sharpening.', options: [{ text: 'Show me your wares.', action: { type: 'openShop' } }, { text: 'Goodbye.' }] },
      },
    },

    'c4-last-pupil-npc': {
      id: 'c4-last-pupil-npc', name: 'Pell, the last pupil', look: look(0x3a6a8a, 0x8a4a3a, null), zone: 'cloverfield', x: -12, z: -20, wander: 0.2,
      examine: 'The only child left in the Sodbury schoolhouse. The teacher still rings the bell for Pell every morning.',
      greetings: [
        { when: { questStage: { id: 'c4-last-pupil', stage: 1 } }, node: 'thanks' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Miss says there are books up at the Keep, sent down the cart road. Three of them. Nobody sends them.',
          options: [
            { text: 'I will bring you three books.', next: 'ask', action: { type: 'startQuest', quest: 'c4-last-pupil' }, when: { quest: { id: 'c4-last-pupil', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        ask: { text: 'Three books. Primers, with the snail on the front. Bring them to the schoolhouse, please.', options: [{ text: 'I will.' }] },
        thanks: { text: 'You brought them! Miss rang the bell twice today. Do you want to see the snail on the first page?', options: [{ text: 'Maybe another day.' }] },
      },
    },
  },

  quests: {
    'c4-royal-warrant': {
      id: 'c4-royal-warrant', name: 'The Royal Warrant', giver: 'muckle', zone: 'cloverfield', level: 11, tier: 'main', chain: 'Root and Seed',
      stages: [{ text: 'Return to Fieldwarden Muckle for the Royal Warrant.', objective: { type: 'talk', npc: 'muckle' } }],
      reward: { gold: 75, items: [] },
    },
    'c4-rustlers': {
      id: 'c4-rustlers', name: 'Rustlers', giver: 'fallow', zone: 'cloverfield', level: 12, tier: 'main', chain: 'Root and Seed',
      stages: [
        { text: 'Reach the Pettigrew ranch.', objective: { type: 'reach', zone: 'cloverfield', x: -70, z: 40, r: 12 } },
        { text: 'Kill 8 red ant soldiers at the ranch.', objective: { type: 'kill', enemy: 'red-ant-soldier', count: 8 } },
      ],
      reward: { gold: 160, items: [] },
    },
    'c4-runaway-snails': {
      id: 'c4-runaway-snails', name: 'Runaway Snails', giver: 'mabel', zone: 'cloverfield', level: 12, tier: 'main', chain: 'Root and Seed',
      stages: [{ text: 'Lasso 5 runaway snails at the snail pen post.', objective: { type: 'interact', object: 'c4-snail-post', count: 5 } }],
      reward: { gold: 125, items: [{ item: 'c4-riding-snail', count: 1 }] },
    },
    'c4-granary': {
      id: 'c4-granary', name: 'The Granary', giver: 'muckle', zone: 'cloverfield', level: 13, tier: 'main', chain: 'Root and Seed',
      stages: [{ text: 'Kill 10 field mice in the granary.', objective: { type: 'kill', enemy: 'field-mouse', count: 10 } }],
      reward: { gold: 140, items: [] },
    },
    'c4-antenna-sister': {
      id: 'c4-antenna-sister', name: 'Antenna-Sister', giver: 'kree', zone: 'cloverfield', level: 14, tier: 'main', chain: 'Root and Seed',
      stages: [{ text: 'Make peace with the Thousand, or drive them out.', objective: { type: 'choice', flag: 'ants' } }],
      reward: { gold: 175, items: [] },
    },
    'c4-old-gleaner': {
      id: 'c4-old-gleaner', name: 'Old Gleaner', giver: 'fallow', zone: 'cloverfield', level: 16, tier: 'main', chain: 'Root and Seed',
      stages: [
        { text: 'Reach Crow\'s Perch.', objective: { type: 'reach', zone: 'cloverfield', x: 80, z: -70, r: 8 } },
        { text: 'Feed the Gleaner from Muckle\'s hidden store, or fight her.', objective: { type: 'choice', flag: 'gleaner' } },
      ],
      reward: { gold: 240, items: [] },
    },
    'c4-great-haul': {
      id: 'c4-great-haul', name: 'The Great Haul', giver: 'mabel', zone: 'cloverfield', level: 16, tier: 'finale', chain: 'Root and Seed',
      stages: [{ text: 'Escort Mabel\'s snail-cart to the Keep exit.', objective: { type: 'escort', npc: 'mabel', zone: 'cloverfield', x: 120, z: 0, r: 8 } }],
      reward: { gold: 300, items: [{ item: 'snailcart-writ', count: 1 }] },
    },

    'c4-straw-king': {
      id: 'c4-straw-king', name: 'The Straw King', giver: 'fallow', zone: 'cloverfield', level: 14, tier: 'side', chain: 'Root and Seed',
      stages: [
        { text: 'Read the inscription at Scarecrow Rise.', objective: { type: 'interact', object: 'c4-straw-inscription', count: 1 } },
        { text: 'Clear 6 straw-wights at Scarecrow Rise.', objective: { type: 'kill', enemy: 'straw-wight', count: 6 } },
      ],
      reward: { gold: 100, items: [] },
    },
    'c4-last-pupil': {
      id: 'c4-last-pupil', name: 'The Last Pupil', giver: 'c4-last-pupil-npc', zone: 'cloverfield', level: 11, tier: 'side', chain: 'Root and Seed',
      stages: [
        { text: 'Bring 3 primers from the Keep cart to the schoolhouse.', objective: { type: 'collect', item: 'c4-primer-book', count: 3 }, takeItems: [{ item: 'c4-primer-book', count: 3 }] },
        { text: 'Tell Pell the books have arrived.', objective: { type: 'talk', npc: 'c4-last-pupil-npc' } },
      ],
      reward: { gold: 60, items: [] },
    },
    'c4-haybale-letters': {
      id: 'c4-haybale-letters', name: 'Haybale Letters', giver: 'haybale', zone: 'cloverfield', level: 13, tier: 'side', chain: 'Root and Seed',
      stages: [
        { text: 'Find Robin-Master Wren Tumble at the Keep.', objective: { type: 'talk', npc: 'wren' } },
        { text: 'Tell Ma Haybale what Wren said.', objective: { type: 'talk', npc: 'haybale' } },
      ],
      reward: { gold: 125, items: [{ item: 'c4-haybale-hoe', count: 1 }] },
    },
    'c4-muckles-skimming': {
      id: 'c4-muckles-skimming', name: 'Muckle\'s Skimming', giver: 'muckle', zone: 'cloverfield', level: 15, tier: 'side', chain: 'Root and Seed',
      stages: [{ text: 'Decide what to do about the grain store.', objective: { type: 'choice', flag: 'c4-skim' } }],
      reward: { gold: 75, items: [] },
    },
    'c4-potsworths-tax': {
      id: 'c4-potsworths-tax', name: 'Potsworth\'s Tax', giver: 'muckle', zone: 'cloverfield', level: 12, tier: 'side', chain: 'Root and Seed',
      stages: [{ text: 'Decide what to do about the Chancellor\'s tax.', objective: { type: 'choice', flag: 'c4-tax' } }],
      reward: { gold: 75, items: [] },
    },
  },

  spawns: [
    { id: 'c4-spawn-1', zone: 'cloverfield', enemy: 'aphid', count: 4, spread: 6 },
    { id: 'c4-spawn-2', zone: 'cloverfield', enemy: 'ladybird', count: 2, spread: 6 },
    { id: 'c4-spawn-3', zone: 'cloverfield', enemy: 'runaway-snail', count: 3, spread: 5 },
    { id: 'c4-spawn-4', zone: 'cloverfield', enemy: 'field-mouse', count: 6, spread: 3 },
    { id: 'c4-spawn-5', zone: 'cloverfield', enemy: 'grasshopper', count: 3, spread: 6 },
    { id: 'c4-spawn-6', zone: 'cloverfield', enemy: 'red-ant-worker', count: 3, spread: 8 },
    { id: 'c4-spawn-7', zone: 'cloverfield', enemy: 'red-ant-soldier', count: 3, spread: 8 },
    { id: 'c4-spawn-8', zone: 'cloverfield', enemy: 'red-ant-soldier', count: 6, spread: 6 },
    { id: 'c4-spawn-9', zone: 'cloverfield', enemy: 'straw-wight', count: 4, spread: 6 },
    { id: 'c4-spawn-10', zone: 'cloverfield', enemy: 'ant-queen', count: 1, spread: 0, when: { flag: { name: 'ants', value: 'war' } } },
    { id: 'c4-spawn-11', zone: 'cloverfield', enemy: 'old-gleaner', count: 1, spread: 0, when: { quest: { id: 'c4-old-gleaner', status: 'active' }, flagUnset: 'gleaner' } },
  ],

  objects: {
    'c4-snail-post': {
      id: 'c4-snail-post', zone: 'cloverfield', name: 'Snail pen post', model: 'post', verb: 'Lasso',
      examine: 'A fence post with a loop of rope on it. Runaway snails are the only thing it ever catches.',
      text: 'You lasso a snail and walk it home.',
    },
    'c4-aphid-trough': {
      id: 'c4-aphid-trough', zone: 'cloverfield', name: 'Aphid trough', model: 'trough', verb: 'Milk',
      examine: 'A trough of clover, and a line of aphids who seem to think it is their idea.',
      text: 'You milk the aphids gently. They do not object.',
      giveItem: { item: 'c4-honeydew', count: 1 },
    },
    'c4-muckles-store': {
      id: 'c4-muckles-store', zone: 'cloverfield', name: 'Muckle\'s hidden store', model: 'chest', verb: 'Search',
      examine: 'A grain store under a loose plank, behind the granary. Muckle keeps it well hidden from the Keep, and not well enough from you.',
      text: 'You take a sack of grain from the hidden store.',
      giveItem: { item: 'c4-grain-sack', count: 1 },
      setFlag: { flag: 'c4-store-found', value: 'yes' },
    },
    'c4-crows-perch-post': {
      id: 'c4-crows-perch-post', zone: 'cloverfield', name: 'Crow\'s Perch', model: 'post', verb: 'Feed',
      examine: 'A fallen fence post, white with droppings, where the Gleaner roosts. Something has been eating from the bowl at its foot.',
      text: 'You lay out ten sacks of grain. The Gleaner eats, takes the pinion from her own tail as a thank you, and leaves for the hills.',
      once: true,
      when: { quest: { id: 'c4-old-gleaner', status: 'active' }, questAtLeast: { id: 'c4-old-gleaner', stage: 1 }, flagUnset: 'gleaner', hasItem: { item: 'c4-grain-sack', count: 10 } },
      giveItem: { item: 'c4-gleaners-pinion', count: 1 },
      setFlag: { flag: 'gleaner', value: 'fed' },
    },
    'c4-gleaner-nest': {
      id: 'c4-gleaner-nest', zone: 'cloverfield', name: 'Gleaner\'s nest', model: 'generic', verb: 'Search',
      examine: 'The nest is hers, and the Sheriff\'s deputy\'s hat is somewhere in it.',
      text: 'You search the nest and find the hat. Fallow will want to see it.',
      once: true,
      when: { quest: { id: 'c4-old-gleaner', status: 'active' }, flagUnset: 'gleaner', hasItem: { item: 'c4-gleaners-pinion', count: 1 } },
      setFlag: { flag: 'gleaner', value: 'killed' },
    },
    'c4-book-crate': {
      id: 'c4-book-crate', zone: 'cloverfield', name: 'Crate from the Keep', model: 'cart', verb: 'Open',
      examine: 'A crate of schoolbooks, sent down the cart road from the Keep\'s Archive. Nobody sends them.',
      text: 'You take a primer from the crate.',
      when: { quest: { id: 'c4-last-pupil', status: 'active' } },
      giveItem: { item: 'c4-primer-book', count: 1 },
    },
    'c4-straw-inscription': {
      id: 'c4-straw-inscription', zone: 'cloverfield', name: 'Scarecrow inscription', model: 'sign', verb: 'Read',
      examine: 'Carved into the post, in a hand that was patient: "A Gardener who forgot to leave."',
      text: 'The inscription says a Gardener forgot to leave. The Archive agrees, and says no more.',
    },
  },

  topics: {
    wren: [
      { text: 'A letter from Ma Haybale, in Sodbury. She sends her love.', next: 'c4-wren-letter', when: { quest: { id: 'c4-haybale-letters', status: 'active' } } },
    ],
  },

  extraNodes: {
    wren: {
      'c4-wren-letter': { text: 'Ma? She wrote. I have been meaning to. Tell her I am well, and busy, and that I will come down at harvest.', options: [{ text: 'I will tell her.' }] },
    },
  },
};
