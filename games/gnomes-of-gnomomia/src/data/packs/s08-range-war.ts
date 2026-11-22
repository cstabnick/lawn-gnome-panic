// Content pack: Storyline 08, A Brand for Every Herd (Cloverfield, levels 12-16). Prefix for new ids: s08-.
// Design: docs/design/gnomomia/storylines/08-range-war.md
// Canon NPCs (fallow, haybale, kree) and canon ids (c4-antenna-sister, flag ants) are owned by the ch4 pack.
import { look, type ContentPack, type DialogueNode, type DialogueOption, type Greeting } from '../../config';

const CHAIN = 'Storyline 8: A Brand for Every Herd';

// Quests. The two mandibles quests are the ants=peace and ants=war variants of quest 3.
const Q_GAPS = 's08-gaps-in-pickets';
const Q_CLAY = 's08-clay-brands';
const Q_MAND_PEACE = 's08-mandibles-peace';
const Q_MAND_WAR = 's08-mandibles-war';
const Q_GNAW = 's08-gnawjaws-hayloft';
const Q_ROUND = 's08-the-roundup';
const Q_BRAND = 's08-brand-for-every-herd';

// NPCs, enemies, items, objects.
const DARNEL = 's08-darnel';
const GNAW_NPC = 's08-gnawjaw-yielded';
const GNAW = 's08-gnawjaw';
const MOUSE = 's08-hayloft-mouse';
const BRAND_MOUSE = 's08-brand-mouse';
const CHIP = 's08-haybale-chip';
const MANDIBLE = 's08-soldier-mandible';
const CROOK = 's08-drovers-crook';
const PICKET = 's08-picket';
const JAWS = 's08-jaws-in-hay';
const DEN = 's08-hob-den';

// Places (cloverfield coordinates, from src/data/README.md regions).
const HAYLOFT = { x: -58, z: 44 };       // Pettigrew hayloft, Anthill edge of Pettigrew ranch
const NORTH_PASTURE = { x: -60, z: -58 }; // Honeydew Ranch north pasture, the picket line
const PEN = { x: -52, z: -34 };          // Honeydew Ranch herd pen

// Greetings checked before the canon NPCs' own greetings. Each one is gated by a quest stage, a quest status or a flag.
const FALLOW_GREETINGS: Greeting[] = [
  { when: { questStage: { id: Q_GAPS, stage: 0 } }, node: 's08-gapsReport' },
  { when: { questStage: { id: Q_GAPS, stage: 1 } }, node: 's08-gapsWaiting' },
  { when: { questStage: { id: Q_GAPS, stage: 2 } }, node: 's08-gapsWaiting' },
  { when: { questStage: { id: Q_MAND_WAR, stage: 0 } }, node: 's08-warReport' },
  { when: { questStage: { id: Q_MAND_WAR, stage: 1 } }, node: 's08-warWaiting' },
  { when: { questStage: { id: Q_MAND_WAR, stage: 2 } }, node: 's08-warWaiting' },
  { when: { questStage: { id: Q_MAND_WAR, stage: 3 } }, node: 's08-warTurnIn' },
  { when: { questStage: { id: Q_GNAW, stage: 0 } }, node: 's08-gnawWaiting' },
  { when: { questStage: { id: Q_GNAW, stage: 1 } }, node: 's08-gnawWaiting' },
  { when: { questStage: { id: Q_GNAW, stage: 2 } }, node: 's08-gnawWaiting' },
  { when: { quest: { id: Q_GNAW, status: 'done' } }, node: 's08-gnawDone' },
  { when: { questStage: { id: Q_ROUND, stage: 0 } }, node: 's08-roundReport' },
  { when: { questStage: { id: Q_ROUND, stage: 1 } }, node: 's08-roundChoice' },
  { when: { questStage: { id: Q_ROUND, stage: 2 } }, node: 's08-roundWaiting' },
  { when: { quest: { id: Q_ROUND, status: 'done' } }, node: 's08-roundDone' },
];

const HAYBALE_GREETINGS: Greeting[] = [
  { when: { questStage: { id: Q_CLAY, stage: 0 } }, node: 's08-clayReport' },
  { when: { questStage: { id: Q_CLAY, stage: 1 } }, node: 's08-clayWaiting' },
  { when: { questStage: { id: Q_CLAY, stage: 2 } }, node: 's08-clayTurnIn' },
  { when: { questStage: { id: Q_BRAND, stage: 0 } }, node: 's08-brandWait' },
  { when: { questStage: { id: Q_BRAND, stage: 1 } }, node: 's08-brandWait' },
  { when: { questStage: { id: Q_BRAND, stage: 2 } }, node: 's08-brandWait' },
  { when: { questStage: { id: Q_BRAND, stage: 3 }, flag: { name: 'mice', value: 'jailed' } }, node: 's08-brandJailedTurnIn' },
  { when: { questStage: { id: Q_BRAND, stage: 3 }, flag: { name: 'mice', value: 'debt' } }, node: 's08-brandDebtTurnIn' },
  { when: { quest: { id: Q_BRAND, status: 'done' }, flag: { name: 'mice', value: 'jailed' } }, node: 's08-brandJailedDone' },
  { when: { quest: { id: Q_BRAND, status: 'done' }, flag: { name: 'mice', value: 'debt' } }, node: 's08-brandDebtDone' },
  { when: { quest: { id: Q_ROUND, status: 'done' }, flag: { name: 'range', value: 'roundup' } }, node: 's08-rangeRoundup' },
  { when: { quest: { id: Q_ROUND, status: 'done' }, flag: { name: 'range', value: 'standoff' } }, node: 's08-rangeStandoff' },
];

const KREE_GREETINGS: Greeting[] = [
  { when: { questStage: { id: Q_MAND_PEACE, stage: 0 } }, node: 's08-peaceReport' },
  { when: { questStage: { id: Q_MAND_PEACE, stage: 1 } }, node: 's08-peaceWait' },
  { when: { questStage: { id: Q_MAND_PEACE, stage: 2 } }, node: 's08-peaceWait' },
  { when: { questStage: { id: Q_MAND_PEACE, stage: 3 } }, node: 's08-peaceTurnIn' },
];

// Dialogue on the canon NPCs' hub nodes (start options for quests, gated by their prerequisites).
const FALLOW_TOPICS: DialogueOption[] = [
  {
    text: 'Anything for the Sodbury pickets?', next: 's08-gapsStart', action: { type: 'startQuest', quest: Q_GAPS },
    when: { quest: { id: 'c4-antenna-sister', status: 'done' }, not: { questAtLeast: { id: Q_GAPS, stage: 0 } } },
  },
  {
    text: 'The Anthill edge. What do we do about the ants?', next: 's08-warStart', action: { type: 'startQuest', quest: Q_MAND_WAR },
    when: { flag: { name: 'ants', value: 'war' }, quest: { id: Q_CLAY, status: 'done' }, not: { questAtLeast: { id: Q_MAND_WAR, stage: 0 } } },
  },
  {
    text: 'Hob of the hayloft. Where is he?', next: 's08-gnawStart', action: { type: 'startQuest', quest: Q_GNAW },
    when: { quest: { id: Q_MAND_PEACE, status: 'done' }, not: { questAtLeast: { id: Q_GNAW, stage: 0 } } },
  },
  {
    text: 'Hob of the hayloft. Where is he?', next: 's08-gnawStart', action: { type: 'startQuest', quest: Q_GNAW },
    when: { quest: { id: Q_MAND_WAR, status: 'done' }, not: { questAtLeast: { id: Q_GNAW, stage: 0 } } },
  },
  {
    text: 'The herd. How does it go home?', next: 's08-roundStart', action: { type: 'startQuest', quest: Q_ROUND },
    when: { quest: { id: Q_GNAW, status: 'done' }, not: { questAtLeast: { id: Q_ROUND, stage: 0 } } },
  },
];

const HAYBALE_TOPICS: DialogueOption[] = [
  {
    text: 'Anything for the brands?', next: 's08-clayStart', action: { type: 'startQuest', quest: Q_CLAY },
    when: { quest: { id: Q_GAPS, status: 'done' }, not: { questAtLeast: { id: Q_CLAY, stage: 0 } } },
  },
  {
    text: 'Something is eating the honeydew under the hayloft.', next: 's08-brandStart', action: { type: 'startQuest', quest: Q_BRAND },
    when: { quest: { id: Q_ROUND, status: 'done' }, not: { questAtLeast: { id: Q_BRAND, stage: 0 } } },
  },
];

const KREE_TOPICS: DialogueOption[] = [
  {
    text: 'How do your herds work, Kree?', next: 's08-peaceStart', action: { type: 'startQuest', quest: Q_MAND_PEACE },
    when: { flag: { name: 'ants', value: 'peace' }, quest: { id: Q_CLAY, status: 'done' }, not: { questAtLeast: { id: Q_MAND_PEACE, stage: 0 } } },
  },
  {
    text: 'What did Formica do to your queen?', next: 's08-ridgeLine',
    when: { flag: { name: 'ants', value: 'war' }, quest: { id: Q_CLAY, status: 'done' } },
  },
];

// Dialogue nodes merged into the canon NPCs.
const FALLOW_NODES: Record<string, DialogueNode> = {
  's08-gapsStart': {
    text: 'Forty aphids since the thaw, and the north pickets are down. Come back to me before you ride out, and I will tell you where I want you.',
    options: [{ text: 'I will come back.' }],
  },
  's08-gapsReport': {
    text: 'Good. The north pasture of Honeydew. Three pickets pulled from the line, and the aphids walk out through the gaps. Set them back in the holes.',
    options: [{ text: 'On my way.' }],
  },
  's08-gapsWaiting': {
    text: 'The north pasture of Honeydew. Three pulled pickets, and the aphids know the way out. Set them back.',
    options: [{ text: 'I will set them.' }],
  },
  's08-warStart': {
    text: 'I have seen plenty of ants at the pickets. I have not seen one lift a herd. Come back to me before you ride out. I need you to look at the hay.',
    options: [{ text: 'I will come back.' }],
  },
  's08-warReport': {
    text: 'The Pettigrew hayloft, on the Anthill edge. Real soldiers\' jaws from the field fight are in the hay there. Bring me three.',
    options: [{ text: 'I will bring them.' }],
  },
  's08-warWaiting': {
    text: 'Three soldier jaws from the Pettigrew hayloft. The hay chute is the way in.',
    options: [{ text: 'I am going.' }],
  },
  's08-warTurnIn': {
    text: 'Three jaws, from the field fight. The ants are in the mound, we are in the hay, and the herd is still gone. Now we go after the mice.',
    options: [{ text: 'Understood, Sheriff.' }],
  },
  's08-gnawStart': {
    text: 'The Pettigrew hayloft is the mice\'s den. Hob of the hayloft is the one counting the honeydew. Clear the hay, then deal with him.',
    options: [{ text: 'I will go to the hayloft.' }],
  },
  's08-gnawWaiting': {
    text: 'The Pettigrew hayloft. Six mice, then Hob himself. He will not go quietly, from what I hear.',
    options: [{ text: 'I will go.' }],
  },
  's08-gnawDone': {
    text: 'Hob went through the floor, and the hayloft is quieter. Ma Haybale wants to talk about what comes next.',
    options: [{ text: 'I will see her.' }],
  },
  's08-roundStart': {
    text: 'The herd is out on the Pettigrew pasture, and the pen at Honeydew is the one to hold. Come back to me and I will tell you what I need.',
    options: [{ text: 'I will come back.' }],
  },
  's08-roundReport': {
    text: 'The herd is on the Pettigrew pasture. Ants at the ridge, mice in the hay, and the pen at Honeydew between them. I need your call on how the herd goes home.',
    options: [{ text: 'Tell me the choices.' }],
  },
  's08-roundChoice': {
    text: 'Herd or fence, gnome. Haybale says the drive is hers to name. Kree says it is the ants\' to share. The fence is the one with my name on it.',
    options: [
      { text: 'Drive the herd home with Kree\'s soldiers.', when: { flag: { name: 'ants', value: 'peace' } }, action: { type: 'setFlag', flag: 'range', value: 'roundup' } },
      { text: 'Drive the herd home past the ridge, while the ants watch.', when: { flag: { name: 'ants', value: 'war' } }, action: { type: 'setFlag', flag: 'range', value: 'roundup' } },
      { text: 'Hold the herd inside our fence.', action: { type: 'setFlag', flag: 'range', value: 'standoff' } },
    ],
  },
  's08-roundWaiting': {
    text: 'Hold the pen at Honeydew for ninety seconds. Three waves are coming, and the pen must not break.',
    options: [{ text: 'I will hold it.' }],
  },
  's08-roundDone': {
    text: 'The herd is home, one way or the other. Ma Haybale will want to talk about Hob next.',
    options: [{ text: 'Thanks, Sheriff.' }],
  },
};

const HAYBALE_NODES: Record<string, DialogueNode> = {
  's08-clayStart': {
    text: 'Field mice on Honeydew are wearing my brands. I can\'t tell my aphids from the Thousand\'s by looking. Four chips, if you please.',
    options: [{ text: 'Four chips. I will look.' }],
  },
  's08-clayReport': {
    text: 'I can\'t tell my aphids from the Thousand\'s by looking. The brand is how I know which are mine. Bring me four of the chips the mice are wearing.',
    options: [{ text: 'I will bring them.' }],
  },
  's08-clayWaiting': {
    text: 'Four brand-chips, from the field mice on Honeydew. They wear them like medals.',
    options: [{ text: 'I am looking.' }],
  },
  's08-clayTurnIn': {
    text: 'Four chips. Good. My stamp was carved by Darnel Pegg, the brand-carver in Sodbury, and he sold a copy to whoever asked. Go and see him.',
    options: [{ text: 'Thanks, Ma.' }],
  },
  's08-brandStart': {
    text: 'Gnawjaw\'s den is under the Pettigrew hayloft, behind a cold stove. Look at it, then come back and we will talk about what the mice are owed.',
    options: [{ text: 'I will look at the stove.' }],
  },
  's08-brandWait': {
    text: 'Look at the den under the hayloft, then talk to Gnawjaw. He comes out when he is ready. After that we talk about the ledger.',
    options: [{ text: 'I am going.' }],
  },
  's08-brandJailedTurnIn': {
    text: 'The Sodbury cell, then. Take your crook. I will not be warm about it, and I will not be warm to anyone who puts a mouse in a cell.',
    options: [{ text: 'Goodbye, Ma.' }],
  },
  's08-brandDebtTurnIn': {
    text: 'Honeydew, then. He will work off his litter\'s share on my pasture. That is warm enough. Take the crook. It is for herding, not hooking.',
    options: [{ text: 'Thank you, Ma.' }],
  },
  's08-brandJailedDone': {
    text: 'The cell is the cell. Do not expect me to be warm about it.',
    options: [{ text: 'Goodbye.' }],
  },
  's08-brandDebtDone': {
    text: 'He is on my honeydew with a pitchfork, and the ledger is nearly square. I am nearly warm again.',
    options: [{ text: 'Goodbye.' }],
  },
  's08-rangeRoundup': {
    text: 'The herd went home past the gate, with Kree\'s soldiers in the drive. Fallow calls it a good call. I call it a late one.',
    hub: true,
    options: [{ text: 'Goodbye.' }],
  },
  's08-rangeStandoff': {
    text: 'The herd stayed inside the fence until the ants pulled back. Fallow calls it a good call. The ledger calls it a lost week of honey.',
    hub: true,
    options: [{ text: 'Goodbye.' }],
  },
};

const KREE_NODES: Record<string, DialogueNode> = {
  's08-peaceStart': {
    text: 'We stroke them with our antennae until the honey comes, and we walk them to fresh clover before frost. Your herd is not ours. Our herd is not yours. The clover is for both.',
    options: [{ text: 'I will look into the hay.' }],
  },
  's08-peaceReport': {
    text: 'The Pettigrew hayloft, on our edge of the ranch. Three soldiers\' jaws from the field fight are in the hay, and the mice keep dragging them about. Bring me three.',
    options: [{ text: 'I will bring them.' }],
  },
  's08-peaceWait': {
    text: 'Three mandibles from the hay. The hayloft chute is the way in, and the mice are quick.',
    options: [{ text: 'I am going.' }],
  },
  's08-peaceTurnIn': {
    text: 'Three jaws. Someone planted them in the hay to make us look guilty. Our soldiers do not leave their jaws lying about.',
    options: [{ text: 'Then someone else is lying.' }],
  },
  's08-ridgeLine': {
    text: 'Formica is in the mound, and her soldiers are in the hay. You will not come up the ridge, gnome. We will not come down it.',
    options: [{ text: 'Goodbye, Kree.' }],
  },
};

// Gnawjaw's yielded form, at the Pettigrew hayloft. Shown once quest 4 is passed.
const GNAW_NPC_GREETINGS: Greeting[] = [
  { when: { questStage: { id: Q_BRAND, stage: 2 } }, node: 's08-miceChoice' },
  { when: { questStage: { id: Q_BRAND, stage: 1 } }, node: 's08-yieldTalk' },
  { when: { quest: { id: Q_BRAND, status: 'done' }, flag: { name: 'mice', value: 'jailed' } }, node: 's08-afterJailed' },
  { when: { quest: { id: Q_BRAND, status: 'done' }, flag: { name: 'mice', value: 'debt' } }, node: 's08-afterDebt' },
  { node: 's08-gnawHello' },
];

const GNAW_NPC_NODES: Record<string, DialogueNode> = {
  's08-gnawHello': {
    text: 'Do not hit me. I have no fight left, gnome, only a hole in the floor. Go and talk to Ma Haybale about me.',
    options: [{ text: 'I will talk to her.' }],
  },
  's08-yieldTalk': {
    text: 'I took the ones with a mark. A mark means someone is counting.',
    options: [
      { text: 'Who was counting?', next: 's08-yieldWhy' },
      { text: 'Keep talking.', next: 's08-yieldWhy' },
    ],
  },
  's08-yieldWhy': {
    text: 'The carts took our granary before last winter. I took honeydew to keep the rest alive, and I kept taking after the first pups were gone. Do what you like with me.',
    options: [{ text: 'I will think on it.' }],
  },
  's08-miceChoice': {
    text: 'Ma Haybale has a say, and so do the carts. What happens to me, gnome?',
    options: [
      { text: 'Take him to the Sodbury cell.', action: { type: 'setFlag', flag: 'mice', value: 'jailed' } },
      { text: 'Put him to work on Honeydew, paying off his litter\'s share.', action: { type: 'setFlag', flag: 'mice', value: 'debt' } },
    ],
  },
  's08-afterJailed': {
    text: 'The Sodbury cell is cold. The cloth is small, and I have not asked for a blanket.',
    options: [{ text: 'Goodbye.' }],
  },
  's08-afterDebt': {
    text: 'Honeydew is hard work, and the ants watch me pick. I do not mind it as much as I thought I would.',
    options: [{ text: 'Goodbye.' }],
  },
};

export const PACK: ContentPack = {
  id: 's08-range-war',

  items: {
    [CHIP]: {
      id: CHIP, name: 'Haybale brand-chip', icon: '🍃', kind: 'misc', ilvl: 12, questItem: true, value: 0,
      examine: 'A dab of ochre-green clay with a stamped leaf. The mice wear them like medals.',
    },
    [MANDIBLE]: {
      id: MANDIBLE, name: 'Soldier mandible', icon: '🦷', kind: 'misc', ilvl: 13, questItem: true, value: 0,
      examine: 'A red ant\'s jaw. Ants do not leave these lying about.',
    },
    [CROOK]: {
      id: CROOK, name: 'Drover\'s Crook', icon: '🪝', kind: 'weapon', slot: 'weapon', ilvl: 14, rarity: 'sprouted',
      damageType: 'crush', hands: 1, weaponClass: 'melee', value: 392,
      examine: 'A shepherd\'s hook with a soft end. "For herding, not hooking."',
    },
  },

  enemies: {
    [MOUSE]: {
      id: MOUSE, name: 'Hayloft mouse', level: 13, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [], gold: [3, 8], model: 'rat', color: 0x8a7a66, scale: 0.9, respawnSeconds: 30,
      examine: 'A field mouse with a mouthful of aphid and hay stuck to its tail. Packs of three or four.',
      wants: 'Gnawjaw\'s honeydew hoard.',
    },
    [BRAND_MOUSE]: {
      id: BRAND_MOUSE, name: 'Brand-wearing mouse', level: 12, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [{ item: CHIP, chance: 0.6 }], gold: [2, 6], model: 'rat', color: 0x9a8a6a, scale: 0.9, respawnSeconds: 30,
      examine: 'A field mouse with a green clay brand-chip on a string round its neck, like a medal.',
      wants: 'Honeydew, and a bigger medal.',
    },
    [GNAW]: {
      id: GNAW, name: 'Gnawjaw, Hob of the Hayloft', level: 15, rank: 'miniboss', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [], gold: [30, 50], model: 'rat', color: 0x4a3a2c, scale: 1.3, respawnSeconds: 0,
      examine: 'A grubby hob with a brand-chip on his collar, worn like a medal. His litter is hungry and he is the one who feeds them.',
      wants: 'Food for his litter.',
      moves: [
        { id: 's08-gnaw', name: 'Gnaw', kind: 'cone', every: 12, telegraph: 1, length: 3, width: 2, damage: 1.3, status: 'chipped', statusSeconds: 6 },
        { id: 's08-hoard-call', name: 'Hoard Call', kind: 'summon', every: 25, telegraph: 1, summon: { enemy: MOUSE, count: 2 } },
      ],
      lastWords: 'Hold! I yield! Mind the floor, gnome, I am going through it.',
    },
  },

  npcs: {
    [DARNEL]: {
      id: DARNEL, name: 'Darnel Pegg', look: look(0x5a3e28, 0x7a6a4a, 0x8a7a6a), zone: 'cloverfield', x: -18, z: 8, wander: 0.3,
      // Appears once Ma Haybale's brand-chips have been turned in, and his name is out.
      hidden: { not: { quest: { id: Q_CLAY, status: 'done' } } },
      examine: 'A brand-carver with ochre clay under his nails and a lean-to of stamps behind him. He looks like a man who would like to be forgiven.',
      greetings: [{ node: 's08-darnelHello' }],
      nodes: {
        's08-darnelHello': {
          hub: true,
          text: 'Brands that do not wash off in rain. I carve them for Sodbury. Ask me about any stamp you like, I have carved most of them.',
          options: [
            { text: 'Who copied the Haybale stamp?', next: 's08-darnelCopies' },
            { text: 'Goodbye.' },
          ],
        },
        's08-darnelCopies': {
          text: 'I made the stamp that they copied. It is my fault they could. I will make a new one, and this one will not wash off.',
          options: [{ text: 'I will tell Ma Haybale.' }],
        },
      },
    },
    [GNAW_NPC]: {
      id: GNAW_NPC, name: 'Gnawjaw, Hob of the Hayloft', look: look(0x4a3a2c, 0x5a4a3a, null), model: 'rat', zone: 'cloverfield',
      x: HAYLOFT.x + 1, z: HAYLOFT.z - 4, wander: 0.2,
      // Shows once the kill stage of quest 4 has passed (the quest is done).
      hidden: { not: { questAtLeast: { id: Q_GNAW, stage: 3 } } },
      examine: 'A hob with a brand-chip on his collar and a cold stove\'s worth of soot on his paws. He is not running any more.',
      greetings: GNAW_NPC_GREETINGS,
      nodes: GNAW_NPC_NODES,
    },
  },

  spawns: [
    // Hayloft mice live in the Pettigrew hayloft; their pack grows once Hob calls them.
    { id: 's08-spawn-1', zone: 'cloverfield', enemy: MOUSE, x: HAYLOFT.x, z: HAYLOFT.z, count: 4, spread: 5 },
    { id: 's08-spawn-2', zone: 'cloverfield', enemy: MOUSE, x: HAYLOFT.x + 4, z: HAYLOFT.z - 4, count: 3, spread: 4 },
    // Brand-wearing mice on Honeydew Ranch, dropping brand-chips.
    { id: 's08-spawn-3', zone: 'cloverfield', enemy: BRAND_MOUSE, x: -60, z: -44, count: 4, spread: 8 },
    // Gnawjaw, only while the kill stage of quest 4 is the current one.
    { id: 's08-spawn-4', zone: 'cloverfield', enemy: GNAW, x: HAYLOFT.x, z: HAYLOFT.z, count: 1, spread: 0, when: { questStage: { id: Q_GNAW, stage: 2 } } },
  ],

  objects: {
    [PICKET]: {
      id: PICKET, zone: 'cloverfield', name: 'Pulled picket', x: NORTH_PASTURE.x, z: NORTH_PASTURE.z, model: 'post',
      verb: 'Reset', examine: 'A picket pulled from the north line. The wire still hums where it was stretched.',
      text: 'You set the picket back in its hole.',
    },
    [JAWS]: {
      id: JAWS, zone: 'cloverfield', name: 'Jaws in the hay', x: HAYLOFT.x - 4, z: HAYLOFT.z + 2, model: 'generic',
      verb: 'Take', examine: 'Red ant jaws, left in the hay by the chute. Ants do not leave these lying about.',
      text: 'You take a soldier\'s mandible from the hay.',
      giveItem: { item: MANDIBLE, count: 1 },
    },
    [DEN]: {
      id: DEN, zone: 'cloverfield', name: 'Cold stove', x: HAYLOFT.x + 2, z: HAYLOFT.z + 4, model: 'generic',
      verb: 'Look', examine: 'A cold stove under the hayloft floor. There is one small cloth beside it.',
      text: 'The stove is cold, and the cloth is small. Nothing in the den is shown in detail.',
      when: { quest: { id: Q_GNAW, status: 'done' } },
    },
  },

  // Canon NPCs get their quest lines here, through topics (start options), greetingsFirst (stage greetings) and extraNodes (the nodes they point to).
  topics: {
    fallow: FALLOW_TOPICS,
    haybale: HAYBALE_TOPICS,
    kree: KREE_TOPICS,
  },

  greetingsFirst: {
    fallow: FALLOW_GREETINGS,
    haybale: HAYBALE_GREETINGS,
    kree: KREE_GREETINGS,
  },

  extraNodes: {
    fallow: FALLOW_NODES,
    haybale: HAYBALE_NODES,
    kree: KREE_NODES,
  },

  quests: {
    [Q_GAPS]: {
      id: Q_GAPS, name: 'Gaps in the Pickets', giver: 'fallow', zone: 'cloverfield', level: 12, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Report back to Sheriff Fallow before you ride north.', objective: { type: 'talk', npc: 'fallow' } },
        { text: 'Ride to the north pasture of Honeydew Ranch.', objective: { type: 'reach', zone: 'cloverfield', x: NORTH_PASTURE.x, z: NORTH_PASTURE.z, r: 10 } },
        { text: 'Set the three pulled pickets back in the north line.', objective: { type: 'interact', object: PICKET, count: 3 } },
      ],
      reward: { gold: 75, items: [] },
    },
    [Q_CLAY]: {
      id: Q_CLAY, name: 'Clay Brands', giver: 'haybale', zone: 'cloverfield', level: 12, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Report to Ma Haybale about the brands.', objective: { type: 'talk', npc: 'haybale' } },
        { text: 'Take four brand-chips from the field mice on Honeydew Ranch.', objective: { type: 'collect', item: CHIP, count: 4 } },
        { text: 'Bring the four brand-chips back to Ma Haybale.', objective: { type: 'talk', npc: 'haybale' }, takeItems: [{ item: CHIP, count: 4 }] },
      ],
      reward: { gold: 125, items: [] },
    },
    [Q_MAND_PEACE]: {
      id: Q_MAND_PEACE, name: 'Mandibles in the Hay', giver: 'kree', zone: 'cloverfield', level: 13, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Report to Antenna-Sister Kree about the mandibles.', objective: { type: 'talk', npc: 'kree' } },
        { text: 'Reach the Pettigrew hayloft, on the Anthill edge.', objective: { type: 'reach', zone: 'cloverfield', x: HAYLOFT.x, z: HAYLOFT.z, r: 10 } },
        { text: 'Take three soldier mandibles from the hay.', objective: { type: 'collect', item: MANDIBLE, count: 3 } },
        { text: 'Bring the three mandibles back to Kree.', objective: { type: 'talk', npc: 'kree' }, takeItems: [{ item: MANDIBLE, count: 3 }] },
      ],
      reward: { gold: 125, items: [] },
    },
    [Q_MAND_WAR]: {
      id: Q_MAND_WAR, name: 'Mandibles in the Hay', giver: 'fallow', zone: 'cloverfield', level: 13, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Report to Sheriff Fallow about the mandibles.', objective: { type: 'talk', npc: 'fallow' } },
        { text: 'Reach the Pettigrew hayloft, on the Anthill edge.', objective: { type: 'reach', zone: 'cloverfield', x: HAYLOFT.x, z: HAYLOFT.z, r: 10 } },
        { text: 'Take three soldier mandibles from the hay.', objective: { type: 'collect', item: MANDIBLE, count: 3 } },
        { text: 'Bring the three mandibles back to Sheriff Fallow.', objective: { type: 'talk', npc: 'fallow' }, takeItems: [{ item: MANDIBLE, count: 3 }] },
      ],
      reward: { gold: 125, items: [] },
    },
    [Q_GNAW]: {
      id: Q_GNAW, name: 'Gnawjaw\'s Hayloft', giver: 'fallow', zone: 'cloverfield', level: 14, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Reach the Pettigrew hayloft.', objective: { type: 'reach', zone: 'cloverfield', x: HAYLOFT.x, z: HAYLOFT.z, r: 10 } },
        { text: 'Kill six hayloft mice.', objective: { type: 'kill', enemy: MOUSE, count: 6 } },
        { text: 'Face Gnawjaw, Hob of the Hayloft. He will bolt through the floor when he is beaten.', objective: { type: 'kill', enemy: GNAW, count: 1 } },
      ],
      reward: { gold: 175, items: [] },
    },
    [Q_ROUND]: {
      id: Q_ROUND, name: 'The Roundup', giver: 'fallow', zone: 'cloverfield', level: 14, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Report to Sheriff Fallow about the herd.', objective: { type: 'talk', npc: 'fallow' } },
        { text: 'Choose how the herd goes home.', objective: { type: 'choice', flag: 'range' } },
        {
          text: 'Hold the herd pen at Honeydew Ranch for ninety seconds. The pen must not break.',
          objective: {
            type: 'defend', zone: 'cloverfield', x: PEN.x, z: PEN.z, r: 8, seconds: 90,
            waves: [{ enemy: MOUSE, count: 3, at: 15 }, { enemy: MOUSE, count: 4, at: 45 }, { enemy: BRAND_MOUSE, count: 4, at: 70 }],
          },
        },
      ],
      reward: { gold: 240, items: [] },
    },
    [Q_BRAND]: {
      id: Q_BRAND, name: 'A Brand for Every Herd', giver: 'haybale', zone: 'cloverfield', level: 15, tier: 'main', chain: CHAIN,
      stages: [
        { text: 'Look at the cold stove in Gnawjaw\'s den, under the Pettigrew hayloft.', objective: { type: 'interact', object: DEN, count: 1 } },
        { text: 'Talk to Gnawjaw, who comes out of the hay and gives himself up.', objective: { type: 'talk', npc: GNAW_NPC } },
        { text: 'Decide what happens to Gnawjaw.', objective: { type: 'choice', flag: 'mice' } },
        { text: 'Tell Ma Haybale what became of the mice.', objective: { type: 'talk', npc: 'haybale' } },
      ],
      reward: { gold: 400, items: [{ item: CROOK, count: 1 }] },
    },
  },
};
