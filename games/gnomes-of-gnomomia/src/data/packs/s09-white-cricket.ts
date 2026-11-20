// Content pack s09-white-cricket: Storyline 09, The White Cricket (Hedgewood, levels 15-19). Prefix for new ids: s09-.
// Design: docs/design/gnomomia/storylines/09-white-cricket.md
// Canon NPCs (juniper, twitchett), canon enemy (cricket) and canon items (blue-potion, rose-draught) are owned by other packs; this pack only adds to them.
import { look, type ContentPack, type DialogueNode, type DialogueOption, type Greeting } from '../../config';

const CHAIN = 'Storyline 9: The White Cricket';

// Quests, in chain order. Each follow-up is offered from Juniper's hub once the previous one is done.
const Q_CARRY = 's09-nothing-to-carry';
const Q_CHORUS = 's09-quiet-chorus';
const Q_TUNE = 's09-tune-under-privet';
const Q_HUNT = 's09-the-white-one';
const Q_SPARED = 's09-spared';
const Q_TAKEN = 's09-taken';
const Q_POSTAGE = 's09-postage-paid';

// NPCs, enemies, objects, items.
const JUNIPER_HEDGE = 's09-juniper-at-hedge';
const HUSH_SINGING = 's09-hush-singing';
const HUSH = 's09-hush';
const EAR_OBJ = 's09-hunters-ear';
const MARK = 's09-cricket-mark';
const JERKIN = 's09-whitesong-jerkin';
const EAR = 's09-hunters-ear-horn';
const WING = 's09-white-wing';
const CRICKET = 'cricket';

// Places (hedgewood and thatchford coordinates, from src/data/README.md regions).
const CRICKET_HEDGE = { x: 20, z: -40 };
const PRIVET_EDGE = { x: -44, z: -46 };
const MARK_AT = { x: -40, z: -42 };
const GUILDHALL = { x: 10, z: -10 };

// Greetings checked before the canon NPCs' own greetings. Each one is gated by a quest stage or flag.
const JUNIPER_GREETINGS: Greeting[] = [
  { when: { questStage: { id: Q_CARRY, stage: 0 } }, node: 's09-carryWait' },
  { when: { questStage: { id: Q_CARRY, stage: 1 } }, node: 's09-carryWait' },
  { when: { questStage: { id: Q_CARRY, stage: 2 } }, node: 's09-carryTurnIn' },
  { when: { questStage: { id: Q_CHORUS, stage: 0 } }, node: 's09-chorusWait' },
  { when: { questStage: { id: Q_CHORUS, stage: 1 } }, node: 's09-chorusWait' },
  { when: { questStage: { id: Q_CHORUS, stage: 2 } }, node: 's09-chorusTurnIn' },
  { when: { questStage: { id: Q_TUNE, stage: 0 } }, node: 's09-tuneWait' },
  { when: { questStage: { id: Q_TUNE, stage: 1 } }, node: 's09-tuneWait' },
  { when: { questStage: { id: Q_TUNE, stage: 2 } }, node: 's09-tuneTurnIn' },
  { when: { questStage: { id: Q_HUNT, stage: 0 } }, node: 's09-huntWaitStart' },
  { when: { questStage: { id: Q_SPARED, stage: 0 } }, node: 's09-sparedTurnIn' },
  { when: { questStage: { id: Q_TAKEN, stage: 1 } }, node: 's09-takenTurnIn' },
];

const TWITCHETT_GREETINGS: Greeting[] = [
  { when: { questStage: { id: Q_POSTAGE, stage: 1 }, flag: { name: 'cricket', value: 'spared' } }, node: 's09-postageSpared' },
  { when: { questStage: { id: Q_POSTAGE, stage: 1 }, flag: { name: 'cricket', value: 'taken' } }, node: 's09-postageTaken' },
];

// Start options on Juniper's hub nodes. Each one is gated on the previous step being done.
const JUNIPER_TOPICS: DialogueOption[] = [
  {
    text: 'Juniper, what is the first thing I can carry for you?', next: 's09-carryStart', action: { type: 'startQuest', quest: Q_CARRY },
    when: { quest: { id: 'c5-neutral-ground', status: 'done' }, not: { questAtLeast: { id: Q_CARRY, stage: 0 } } },
  },
  {
    text: 'What is the chorus under the hedge, Juniper?', next: 's09-chorusStart', action: { type: 'startQuest', quest: Q_CHORUS },
    when: { quest: { id: Q_CARRY, status: 'done' }, not: { questAtLeast: { id: Q_CHORUS, stage: 0 } } },
  },
  {
    text: 'What is the tune under the Privet?', next: 's09-tuneStart', action: { type: 'startQuest', quest: Q_TUNE },
    when: { quest: { id: Q_CHORUS, status: 'done' }, not: { questAtLeast: { id: Q_TUNE, stage: 0 } } },
  },
  {
    text: 'Is there one more hunt left in you, Juniper?', next: 's09-huntStart', action: { type: 'startQuest', quest: Q_HUNT },
    when: { quest: { id: Q_TUNE, status: 'done' }, not: { questAtLeast: { id: Q_HUNT, stage: 0 } } },
  },
  {
    text: 'The reply in your coat. Is it time to post it?', next: 's09-postageStart', action: { type: 'startQuest', quest: Q_POSTAGE },
    when: { quest: { id: Q_SPARED, status: 'done' }, not: { questAtLeast: { id: Q_POSTAGE, stage: 0 } } },
  },
  {
    text: 'The reply in your coat. Is it time to post it?', next: 's09-postageStart', action: { type: 'startQuest', quest: Q_POSTAGE },
    when: { quest: { id: Q_TAKEN, status: 'done' }, not: { questAtLeast: { id: Q_POSTAGE, stage: 0 } } },
  },
];

// Dialogue nodes merged into Juniper's node map.
const JUNIPER_NODES: Record<string, DialogueNode> = {
  's09-carryStart': {
    text: 'Cricket Hedge is where the lodge keeps its ear. Go and listen at the root, and then bring the cup back to me.',
    options: [{ text: 'I will go.' }],
  },
  's09-carryWait': {
    text: 'Cricket Hedge, and the acorn cup in the root. Then come back to me.',
    options: [{ text: 'I am going.' }],
  },
  's09-carryTurnIn': {
    text: 'You listened. Good. Here is something for the road, and the crickets will stop being your business for a while.',
    options: [{ text: 'Thank you, Juniper.' }],
  },
  's09-chorusStart': {
    text: 'Six of the crickets have to fall silent, one by one, under a bigger voice. Go and make them quiet, and come back when they are.',
    options: [{ text: 'I will go.' }],
  },
  's09-chorusWait': {
    text: 'Cricket Hedge. Six crickets, one by one, until the hedge is quiet enough to hear the big one.',
    options: [{ text: 'I will.' }],
  },
  's09-chorusTurnIn': {
    text: 'Six of them. Quiet, mostly. Now there is one that does not stop, and you can hear it under the rest.',
    options: [{ text: 'I heard it.' }],
  },
  's09-tuneStart': {
    text: 'The hunters carved the tallies on the Privet\'s outer hedge, one notch a night. Count the three newest, and tell me what you hear.',
    options: [{ text: 'I will count them.' }],
  },
  's09-tuneWait': {
    text: 'The outer hedge of the Elder Privet. Three cricket-marks, and they are the newest notches on the wall.',
    options: [{ text: 'I am going.' }],
  },
  's09-tuneTurnIn': {
    text: 'Three notches. Our own, the newest ones. Hush has been singing every night we have been counting it.',
    options: [{ text: 'Then I should find it.' }],
  },
  's09-huntStart': {
    text: 'The White Cricket. The lodge has sung about it longer than the Charter has stood. Reach Cricket Hedge after dark, and listen for the one that does not stop.',
    options: [{ text: 'I will go.' }],
  },
  's09-huntWaitStart': {
    text: 'Cricket Hedge, after dark. Listen through the acorn cup at the root before you go in singing.',
    options: [{ text: 'I am going.' }],
  },
  's09-sparedTurnIn': {
    text: 'You let it sing. Then you are the first hunter the lodge has sent out that way, and that is worth an ear horn. Take it, and go and tell Hazel.',
    options: [{ text: 'Thank you, Juniper.' }],
  },
  's09-takenTurnIn': {
    text: 'The wing. Good. Tanner can stitch it into something warm. Do not ask me to like it. Hand it over and I will say what the lodge says.',
    options: [{ text: 'Here it is.' }],
  },
  's09-postageStart': {
    text: 'One line, two seasons late. Take it to Hazel at the Thatchford guildhall, and do not read it on the road.',
    options: [{ text: 'I will take it.' }],
  },
};

// The copy of Juniper who stands at Cricket Hedge while the choice stage is active.
const JUNIPER_HEDGE_NODES: Record<string, DialogueNode> = {
  's09-hedgeAsk': {
    text: 'Hear the crickets? Now listen under them. There\'s one that doesn\'t stop, and it is singing right now. Hunters don\'t finish a beast that\'s singing. Choose, and then we both live with it.',
    options: [
      { text: 'Let it sing.', next: 's09-hedgeSpared', action: { type: 'setFlag', flag: 'cricket', value: 'spared' } },
      { text: 'Take its wing.', next: 's09-hedgeTaken', action: { type: 'setFlag', flag: 'cricket', value: 'taken' } },
    ],
  },
  's09-hedgeSpared': {
    text: 'Then it sings on. Go back to the lodge and tell the Hedgewrights what you chose, and I will hear what they say about it.',
    options: [{ text: 'I will go back.', action: { type: 'startQuest', quest: Q_SPARED } }],
  },
  's09-hedgeTaken': {
    text: 'Then you took its wing. Bring it back to the lodge, and do not let the Hedgewrights hear you cheer about it.',
    options: [{ text: 'I will bring it back.', action: { type: 'startQuest', quest: Q_TAKEN } }],
  },
};

// Hush, shown as a singer that does not fight: while the choice is asked, and afterwards if it was spared.
const HUSH_SINGING_NODES: Record<string, DialogueNode> = {
  's09-hushSing': {
    text: 'It sings one note, and the hedge goes quiet around it. It does not look at you.',
    options: [{ text: 'Goodbye, Hush.' }],
  },
};

// Lines for Hazel at the Thatchford guildhall, in the storyline's two branches.
const TWITCHETT_NODES: Record<string, DialogueNode> = {
  's09-postageSpared': {
    text: 'She says you let it sing. Then you are the first hunter that lodge has ever sent me, and I am not sure I forgive you for it. Two pence? You could have walked it over, Juniper. Come up the Hedge in spring. I\'ll have the kettle on.',
    options: [{ text: 'I will tell her.' }],
  },
  's09-postageTaken': {
    text: 'She says you took its wing. Then she will wear it, and she will never look at me while she does. Two pence? You could have walked it over, Juniper. Come up the Hedge in spring. I\'ll have the kettle on.',
    options: [{ text: 'I will tell her.' }],
  },
};

export const PACK: ContentPack = {
  id: 's09-white-cricket',

  items: {
    [JERKIN]: {
      id: JERKIN, name: 'Whitesong Jerkin', icon: '🧥', kind: 'armor', slot: 'body', ilvl: 17, rarity: 'blooming',
      armorType: 'leather', stats: { agility: 2, endurance: 2 }, value: 1156,
      examine: 'Pale leather that stays warm. Tanner says it hums when you stand still, and that it is the cricket, not the wind.',
    },
    [EAR]: {
      id: EAR, name: 'Hunter\'s Ear Horn', icon: '📯', kind: 'trinket', slot: 'trinket', ilvl: 16, rarity: 'sprouted',
      stats: { agility: 1 }, value: 512,
      examine: 'A hollow acorn cup on a cord. Hold it to a root and the hedge goes quiet to listen. Juniper gave hers to you.',
    },
    [WING]: {
      id: WING, name: 'White Wing', icon: '🪽', kind: 'misc', questItem: true, value: 0,
      examine: 'Hush\'s wing, folded and dry. It is still pale.',
    },
  },

  enemies: {
    [HUSH]: {
      id: HUSH, name: 'Hush, the White Cricket', level: 17, rank: 'miniboss', family: 'shelled', damageType: 'crush', aggressive: true,
      loot: [{ item: WING, chance: 1 }], gold: [40, 70], model: 'cricket', color: 0xf4f4ec, scale: 1.6, respawnSeconds: 0,
      examine: 'A White Cricket as big as a gnome\'s chest, pale as a cup of milk. Every other cricket on the hedge goes quiet when it starts.',
      wants: 'To sing its one song to the Privet every night, and be left alone to do it.',
      moves: [
        { id: 's09-song', name: 'Song', kind: 'ring', every: 18, telegraph: 3, radius: 6, status: 'slowed', statusSeconds: 4 },
      ],
      lastWords: 'Hush.',
    },
  },

  npcs: {
    [JUNIPER_HEDGE]: {
      id: JUNIPER_HEDGE, name: 'Juniper Quickstring', look: look(0x3c6b3a, 0x7a5a2e, null), zone: 'hedgewood',
      x: CRICKET_HEDGE.x, z: CRICKET_HEDGE.z, wander: 0,
      // Stands at Cricket Hedge only while the choice stage of the hunt is the current one.
      hidden: { not: { questStage: { id: Q_HUNT, stage: 1 } } },
      examine: 'The Huntmaster of Barkhollow, with a folded letter showing at the edge of her coat. She is listening under the crickets.',
      greetings: [{ node: 's09-hedgeAsk' }],
      nodes: JUNIPER_HEDGE_NODES,
    },
    [HUSH_SINGING]: {
      id: HUSH_SINGING, name: 'Hush, the White Cricket', look: look(0xf4f4ec, 0xf4f4ec, null), model: 'cricket', scale: 1.6,
      zone: 'hedgewood', x: CRICKET_HEDGE.x + 4, z: CRICKET_HEDGE.z + 2, wander: 0,
      // Shown during the choice stage, and afterwards for good if the cricket was spared. Hidden on the taken path.
      hidden: { not: { questAtLeast: { id: Q_HUNT, stage: 1 }, not: { flag: { name: 'cricket', value: 'taken' } } } },
      examine: 'A White Cricket, pale as milk, singing one note over the hedge. Nothing about it is hostile.',
      greetings: [{ node: 's09-hushSing' }],
      nodes: HUSH_SINGING_NODES,
    },
  },

  spawns: [
    // Hush, hostile, only while the taken follow-up is active.
    { id: 's09-spawn-1', zone: 'hedgewood', enemy: HUSH, x: CRICKET_HEDGE.x, z: CRICKET_HEDGE.z, count: 1, spread: 0, when: { quest: { id: Q_TAKEN, status: 'active' } } },
  ],

  objects: {
    [EAR_OBJ]: {
      id: EAR_OBJ, zone: 'hedgewood', name: 'Hunters\' Ear', x: 16, z: -44, model: 'generic',
      verb: 'Listen', once: true,
      examine: 'An old acorn cup set in a root. Hold it to the wood and the hedge goes quiet to listen.',
      text: 'You listen through the acorn cup. Under the crickets there is one that does not stop.',
    },
    [MARK]: {
      id: MARK, zone: 'hedgewood', name: 'Cricket-mark', x: MARK_AT.x, z: MARK_AT.z, model: 'post',
      verb: 'Count',
      examine: 'A notch cut into the outer hedge wall of the Elder Privet, one for a night the hunters heard Hush sing.',
      text: 'You count the notch. Another night of singing.',
    },
  },

  // Canon NPCs get their quest lines here, through topics (start options), greetingsFirst (stage greetings) and extraNodes (the nodes they point to).
  topics: {
    juniper: JUNIPER_TOPICS,
  },

  greetingsFirst: {
    juniper: JUNIPER_GREETINGS,
    twitchett: TWITCHETT_GREETINGS,
  },

  extraNodes: {
    juniper: JUNIPER_NODES,
    twitchett: TWITCHETT_NODES,
  },

  quests: {
    [Q_CARRY]: {
      id: Q_CARRY, name: 'Nothing to Carry Home', giver: 'juniper', zone: 'hedgewood', level: 15, tier: 'side', chain: CHAIN,
      // The first stage is the reach, not a talk: the start option is itself a talk to Juniper.
      stages: [
        { text: 'Reach Cricket Hedge.', objective: { type: 'reach', zone: 'hedgewood', x: CRICKET_HEDGE.x, z: CRICKET_HEDGE.z, r: 10 } },
        { text: 'Listen at the Hunters\' Ear, the acorn cup in the root.', objective: { type: 'interact', object: EAR_OBJ, count: 1 } },
        { text: 'Report back to Juniper.', objective: { type: 'talk', npc: 'juniper' } },
      ],
      reward: { gold: 60, items: [{ item: 'blue-potion', count: 1 }] },
    },
    [Q_CHORUS]: {
      id: Q_CHORUS, name: 'The Quiet Chorus', giver: 'juniper', zone: 'hedgewood', level: 16, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Reach Cricket Hedge.', objective: { type: 'reach', zone: 'hedgewood', x: CRICKET_HEDGE.x, z: CRICKET_HEDGE.z, r: 10 } },
        { text: 'Silence six crickets, one by one.', objective: { type: 'kill', enemy: CRICKET, count: 6 } },
        { text: 'Report back to Juniper.', objective: { type: 'talk', npc: 'juniper' } },
      ],
      reward: { gold: 90, items: [] },
    },
    [Q_TUNE]: {
      id: Q_TUNE, name: 'The Tune Under the Privet', giver: 'juniper', zone: 'hedgewood', level: 17, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Reach the outer hedge of the Elder Privet.', objective: { type: 'reach', zone: 'hedgewood', x: PRIVET_EDGE.x, z: PRIVET_EDGE.z, r: 10 } },
        { text: 'Count the three newest cricket-marks on the hedge wall.', objective: { type: 'interact', object: MARK, count: 3 } },
        { text: 'Report back to Juniper.', objective: { type: 'talk', npc: 'juniper' } },
      ],
      reward: { gold: 100, items: [{ item: 'rose-draught', count: 1 }] },
    },
    [Q_HUNT]: {
      id: Q_HUNT, name: 'The White One', giver: 'juniper', zone: 'hedgewood', level: 17, tier: 'main', chain: CHAIN,
      stages: [
        { text: 'Reach Cricket Hedge after dark, and listen under the crickets.', objective: { type: 'reach', zone: 'hedgewood', x: CRICKET_HEDGE.x, z: CRICKET_HEDGE.z, r: 10 } },
        { text: 'Juniper asks what to do with the White Cricket: let it sing, or take its wing.', objective: { type: 'choice', flag: 'cricket' } },
      ],
      reward: { gold: 200, items: [] },
    },
    [Q_SPARED]: {
      id: Q_SPARED, name: 'Let It Sing', giver: 'juniper', zone: 'hedgewood', level: 17, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Tell Juniper at Barkhollow that the White Cricket was let to sing.', objective: { type: 'talk', npc: 'juniper' } },
      ],
      reward: { gold: 100, items: [{ item: EAR, count: 1 }] },
    },
    [Q_TAKEN]: {
      id: Q_TAKEN, name: 'Its Wing', giver: 'juniper', zone: 'hedgewood', level: 17, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Hush is singing for the last time over Cricket Hedge. Take its wing.', objective: { type: 'kill', enemy: HUSH, count: 1 } },
        { text: 'Bring the folded wing to Juniper at Barkhollow.', objective: { type: 'talk', npc: 'juniper' }, takeItems: [{ item: WING, count: 1 }] },
      ],
      reward: { gold: 100, items: [{ item: JERKIN, count: 1 }] },
    },
    [Q_POSTAGE]: {
      id: Q_POSTAGE, name: 'Postage Paid', giver: 'juniper', zone: 'hedgewood', level: 19, tier: 'main', chain: CHAIN,
      // The start option is the talk to Juniper, so the first stage is the road to Thatchford.
      stages: [
        { text: 'Reach the Thatchford guildhall with Juniper\'s reply.', objective: { type: 'reach', zone: 'thatchford', x: GUILDHALL.x, z: GUILDHALL.z, r: 8 } },
        { text: 'Give the reply to Hazel Twitchett.', objective: { type: 'talk', npc: 'twitchett' } },
      ],
      reward: { gold: 150, items: [{ item: 'blue-potion', count: 2 }] },
    },
  },
};
