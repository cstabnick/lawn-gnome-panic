// Content pack s02-neat-chapel: storyline 02, "The Even Lawn" (Thatchford Downs, levels 7-11). Prefix for new ids: s02-.
import { look, type ContentPack, type DialogueOption, type Greeting, type DialogueNode } from '../../config';

const CHAPEL_X = 35;
const CHAPEL_Z = 10;
const CHAPEL_R = 14;
const BANK_X = 35;
const BANK_Z = -15;
const BANK_R = 10;

const Q_GRASS = 's02-keep-off-grass';
const Q_NAMES = 's02-names-evening';
const Q_TAG = 's02-hobs-tag';
const Q_BRIMS = 's02-flat-brims';
const Q_BANK = 's02-long-bank';

/** Brother Sedge's extra dialogue, added to the canon NPC `sedge` (owned by ch2). Trusted/wary follows the `sedge` flag. */
const SEDGE_TOPICS: DialogueOption[] = [
  {
    text: 'Brother, how do you keep the lawn so even?', next: 's02-sedgeQ1StartT',
    action: { type: 'startQuest', quest: Q_GRASS },
    when: { quest: { id: Q_GRASS, status: 'none' }, not: { classId: 'none' }, flag: { name: 'sedge', value: 'trusted' } },
  },
  {
    text: 'I have read your pamphlets. What is the rule here?', next: 's02-sedgeQ1StartW',
    action: { type: 'startQuest', quest: Q_GRASS },
    when: { quest: { id: Q_GRASS, status: 'none' }, not: { classId: 'none' }, flag: { name: 'sedge', value: 'wary' } },
  },
  {
    text: 'You mentioned the Long Bank. Will you show me?', next: 's02-sedgeBankStartT',
    action: { type: 'startQuest', quest: Q_BANK },
    when: { quest: { id: Q_BANK, status: 'none' }, questAtLeast: { id: Q_BRIMS, stage: 4 }, flag: { name: 'sedge', value: 'trusted' } },
  },
  {
    text: 'Is the Long Bank safe to walk to?', next: 's02-sedgeBankStartW',
    action: { type: 'startQuest', quest: Q_BANK },
    when: { quest: { id: Q_BANK, status: 'none' }, questAtLeast: { id: Q_BRIMS, stage: 4 }, flag: { name: 'sedge', value: 'wary' } },
  },
];

const SEDGE_EXTRA_NODES: Record<string, DialogueNode> = {
  's02-sedgeQ1StartT': {
    text: 'Keep off the grass. Walk the path to the chapel and tap four of the path-stones, so you know where your feet go. Then come back and tell me what you saw.',
    options: [{ text: 'I will walk the path.' }],
  },
  's02-sedgeQ1StartW': {
    text: 'Path-stones. Four of them. Tap them, then tell me what you have read about the Level. I will know if you have read well.',
    options: [{ text: 'I will tap them.' }],
  },
  's02-sedgeQ1Wait': {
    text: 'Four path-stones, friend. The rest of the lawn can wait.',
    options: [{ text: 'Understood.' }],
  },
  's02-sedgeQ1TurnT': {
    text: 'You kept to the path. That is the whole of it. The Verger has a pair of shears for you. They are never to touch grass.',
    options: [{ text: 'Thank you, Brother.' }],
  },
  's02-sedgeQ1TurnW': {
    text: 'Path. Good. Shears. Do not cut with them.',
    options: [{ text: 'Understood.' }],
  },
  's02-sedgeBankStartT': {
    text: 'The Long Bank, north along the Hose. I have never seen it unmown. Nothing has come to cut it. We were told the Level would not hate us. Walk with me.',
    options: [{ text: 'Lead the way.' }],
  },
  's02-sedgeBankStartW': {
    text: 'The Long Bank. Have you read the Hose charter? No? Then walk with me, and stay out of the reeds.',
    options: [{ text: 'Lead the way.' }],
  },
  's02-sedgeBankWait': {
    text: 'The reeds are this way. Keep up.',
    options: [{ text: 'I am coming.' }],
  },
  's02-sedgeDoubt': {
    text: 'Sedge stands in the reeds, which are taller than he is. "Tell me what you see in them. I will tell you what I count at night."',
    options: [
      { text: 'Tell him the reeds are alive.', next: 's02-sedgeDoubtTold', action: { type: 'setFlag', flag: 'sedge_doubt', value: 'told' } },
      { text: 'Tell him the Order is right.', next: 's02-sedgeDoubtKept', action: { type: 'setFlag', flag: 'sedge_doubt', value: 'kept' } },
    ],
  },
  's02-sedgeDoubtTold': {
    text: 'He is quiet for a long time. "I count them at night. The number does not go down." Wait here for a moment. I have something for you.',
    options: [{ text: 'I will wait.' }],
  },
  's02-sedgeDoubtKept': {
    text: 'He nods, and goes back to the reeds he has been counting. "The Level is kind to those who keep it. I will count without you, then."',
    options: [{ text: 'Goodbye, Brother.' }],
  },
  's02-sedgeBankToldTurn': {
    text: 'You said the reeds were alive. Then take this, a reed bound with string. It keeps you dry near water.',
    options: [{ text: 'Thank you.', action: { type: 'giveItem', item: 's02-reed-charm', count: 1 } }],
  },
  's02-sedgeBankKeptTurn': {
    text: 'Then we are agreed. The Order is right, and the reeds are only reeds.',
    options: [{ text: 'Goodbye, Brother.' }],
  },
};

const SEDGE_GREETINGS_FIRST: Greeting[] = [
  { when: { questStage: { id: Q_GRASS, stage: 2 }, flag: { name: 'sedge', value: 'trusted' } }, node: 's02-sedgeQ1TurnT' },
  { when: { questStage: { id: Q_GRASS, stage: 2 }, flag: { name: 'sedge', value: 'wary' } }, node: 's02-sedgeQ1TurnW' },
  { when: { questStage: { id: Q_GRASS, stage: 0 } }, node: 's02-sedgeQ1Wait' },
  { when: { questStage: { id: Q_GRASS, stage: 1 } }, node: 's02-sedgeQ1Wait' },
  { when: { questStage: { id: Q_BANK, stage: 0 } }, node: 's02-sedgeBankWait' },
  { when: { questStage: { id: Q_BANK, stage: 1 } }, node: 's02-sedgeBankWait' },
  { when: { questStage: { id: Q_BANK, stage: 2 } }, node: 's02-sedgeDoubt' },
  { when: { questStage: { id: Q_BANK, stage: 3 }, flag: { name: 'sedge_doubt', value: 'told' } }, node: 's02-sedgeBankToldTurn' },
  { when: { questStage: { id: Q_BANK, stage: 3 }, flag: { name: 'sedge_doubt', value: 'kept' } }, node: 's02-sedgeBankKeptTurn' },
];

export const PACK: ContentPack = {
  id: 's02-neat-chapel',

  items: {
    's02-verger-shears': { id: 's02-verger-shears', name: "Verger's Hand Shears", icon: '✂️', kind: 'weapon', slot: 'weapon', ilvl: 9, rarity: 'sprouted', damageType: 'slash', hands: 1, weaponClass: 'melee', value: 162, examine: 'Kept sharp and never used on grass.', effect: '+5% crit vs Plant.' },
    's02-hobs-pipe-key': { id: 's02-hobs-pipe-key', name: "Hob's Pipe-Key", icon: '🔑', kind: 'trinket', slot: 'trinket', ilvl: 10, rarity: 'sprouted', value: 200, examine: 'Brass, bright, and still fits a Deeps valve.', effect: '+1 Rain ward.' },
    's02-level-brim': { id: 's02-level-brim', name: 'Level Brim', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 10, rarity: 'sprouted', armorType: 'leather', value: 200, examine: "An Edger's cap brim trimmed flat enough to stand a cup on.", effect: '+1 Bloom ward.' },
    's02-reed-charm': { id: 's02-reed-charm', name: 'Reed Charm', icon: '🌾', kind: 'trinket', slot: 'trinket', ilvl: 11, rarity: 'sprouted', value: 242, examine: 'A Long Bank reed bound with string.', effect: '+2 Rain ward near water.' },
    's02-pipewright-tag': { id: 's02-pipewright-tag', name: 'Pipewright Name-Tag', icon: '🏷️', kind: 'misc', questItem: true, value: 0, examine: "A brass tag stamped with a lost Pipewright's name." },
  },

  enemies: {
    's02-lawn-warden': {
      id: 's02-lawn-warden', name: 'Lawn Warden', level: 9, rank: 'normal', family: 'fired', damageType: 'crush', aggressive: true, attackSeconds: 2.4,
      loot: [], gold: [2, 6], model: 'clay', color: 0xb8a27a, scale: 1.1, respawnSeconds: 30,
      examine: 'A clay guard in a level-brimmed cap. Every blade it has is the same height.',
      wants: 'Every blade the same height.',
    },
  },

  spawns: [
    { id: 's02-spawn-1', zone: 'thatchford', enemy: 'magpie-thief', count: 4, spread: 10 },
    { id: 's02-spawn-2', zone: 'thatchford', enemy: 's02-lawn-warden', count: 1, spread: 2, when: { flagSet: 's02-lawn-cut' } },
  ],

  objects: {
    's02-path-stone': {
      id: 's02-path-stone', zone: 'thatchford', name: 'Path-stone', model: 'stone',
      verb: 'Tap', examine: 'A flat stone on the chapel path, level as a plate.',
      text: 'It rings faintly, like a bell that has been told to be quiet.',
    },
    's02-name-plate': {
      id: 's02-name-plate', zone: 'thatchford', name: 'Name-plate, Wall of the Forty', model: 'sign',
      verb: 'Read', examine: "A brass plate with a lost Pipewright's name on it.",
      text: 'You read the name aloud, as the Order does every night.',
    },
    's02-hat-hook': {
      id: 's02-hat-hook', zone: 'thatchford', name: 'Hat-hook by the door', model: 'post',
      verb: 'Check', examine: 'A brass hook by the chapel door, with a cap hanging from it.',
      text: 'The cap is flat as a tabletop. Nobody here wears a hat.',
    },
    's02-chapel-lawn': {
      id: 's02-chapel-lawn', zone: 'thatchford', name: 'Chapel lawn', model: 'generic',
      verb: 'Cut', examine: 'Brick-edged and level. Every blade is the same height.',
      text: 'You cut a blade. Somewhere a bell rings, and a clay figure stirs.',
      setFlag: { flag: 's02-lawn-cut', value: 'yes' },
    },
    's02-pipewright-tag-a': {
      id: 's02-pipewright-tag-a', zone: 'thatchford', name: 'Magpie nest', model: 'generic',
      verb: 'Search', examine: 'Bright scraps woven into a nest on Crowfoot Hill.',
      text: 'Under the scraps you find a brass name-tag.',
      once: true, giveItem: { item: 's02-pipewright-tag', count: 1 }, when: { quest: { id: Q_TAG, status: 'active' } },
    },
    's02-pipewright-tag-b': {
      id: 's02-pipewright-tag-b', zone: 'thatchford', name: 'Magpie nest', model: 'generic',
      verb: 'Search', examine: 'A second nest of bright scraps, a little way off the first.',
      text: 'Under the scraps you find another brass name-tag.',
      once: true, giveItem: { item: 's02-pipewright-tag', count: 1 }, when: { quest: { id: Q_TAG, status: 'active' } },
    },
  },

  quests: {
    [Q_GRASS]: {
      id: Q_GRASS, name: 'Keep Off the Grass', giver: 'sedge', zone: 'thatchford', level: 7, tier: 'side', chain: 'The Even Lawn',
      stages: [
        { text: 'Walk the path to the Neat Chapel.', objective: { type: 'reach', zone: 'thatchford', x: CHAPEL_X, z: CHAPEL_Z, r: CHAPEL_R } },
        { text: 'Tap four path-stones on the chapel path.', objective: { type: 'interact', object: 's02-path-stone', count: 4 } },
        { text: 'Tell Brother Sedge what you learned on the path.', objective: { type: 'talk', npc: 'sedge' } },
      ],
      reward: { gold: 40, items: [{ item: 's02-verger-shears', count: 1 }] },
    },
    [Q_NAMES]: {
      id: Q_NAMES, name: 'The Names at Evening', giver: 's02-plantain-pail', zone: 'thatchford', level: 8, tier: 'side', chain: 'The Even Lawn',
      stages: [
        { text: 'Read three name-plates on the Wall of the Forty.', objective: { type: 'interact', object: 's02-name-plate', count: 3 } },
        { text: 'Tell Verger Pail which names you read.', objective: { type: 'talk', npc: 's02-plantain-pail' } },
      ],
      reward: { gold: 40, items: [] },
    },
    [Q_TAG]: {
      id: Q_TAG, name: "Hob's Tag", giver: 's02-chickweed-mattock', zone: 'thatchford', level: 9, tier: 'side', chain: 'The Even Lawn',
      stages: [
        { text: 'Drive off four magpie thieves on Crowfoot Hill.', objective: { type: 'kill', enemy: 'magpie-thief', count: 4 } },
        { text: 'Find two Pipewright name-tags in the magpie nests on Crowfoot Hill.', objective: { type: 'collect', item: 's02-pipewright-tag', count: 2 } },
        { text: 'Bring Chickweed the two name-tags.', objective: { type: 'talk', npc: 's02-chickweed-mattock' }, takeItems: [{ item: 's02-pipewright-tag', count: 2 }] },
      ],
      reward: { gold: 60, items: [{ item: 's02-hobs-pipe-key', count: 1 }] },
    },
    [Q_BRIMS]: {
      id: Q_BRIMS, name: 'Flat Brims', giver: 's02-sprig-lintel', zone: 'thatchford', level: 10, tier: 'side', chain: 'The Even Lawn',
      stages: [
        { text: 'Go to the hat-hooks by the chapel door.', objective: { type: 'reach', zone: 'thatchford', x: 31, z: 4, r: 6 } },
        { text: 'Check all three hat-hooks by the door.', objective: { type: 'interact', object: 's02-hat-hook', count: 3 } },
        { text: 'Decide what to do about the flat brims.', objective: { type: 'choice', flag: 'brims' } },
        { text: 'Tell Sprig what you decided.', objective: { type: 'talk', npc: 's02-sprig-lintel' } },
      ],
      reward: { gold: 40, items: [] },
    },
    [Q_BANK]: {
      id: Q_BANK, name: 'The Long Bank', giver: 'sedge', zone: 'thatchford', level: 11, tier: 'side', chain: 'The Even Lawn',
      stages: [
        { text: 'Walk Brother Sedge up the Hose to the Long Bank.', objective: { type: 'escort', npc: 'sedge', zone: 'thatchford', x: BANK_X, z: BANK_Z, r: BANK_R } },
        { text: 'Reach the reeds of the Long Bank.', objective: { type: 'reach', zone: 'thatchford', x: BANK_X, z: BANK_Z, r: BANK_R } },
        { text: 'Answer Sedge about the reeds.', objective: { type: 'choice', flag: 'sedge_doubt' } },
        { text: 'Tell Brother Sedge your answer.', objective: { type: 'talk', npc: 'sedge' } },
      ],
      reward: { gold: 80, items: [] },
    },
  },

  npcs: {
    's02-plantain-pail': {
      id: 's02-plantain-pail', name: 'Verger Plantain Pail', look: look(0x2e5e3a, 0x1f1f1f, 0xdddddd, { glasses: true }), zone: 'thatchford', x: 34, z: 4, wander: 0.5,
      examine: 'The chapel verger. He keeps the door, the hooks and the wall, and he has not smiled since the last hat.',
      greetings: [
        { when: { questStage: { id: Q_NAMES, stage: 1 } }, node: 'namesTurn' },
        { when: { questStage: { id: Q_NAMES, stage: 0 } }, node: 'namesWait' },
        { when: { quest: { id: Q_NAMES, status: 'done' } }, node: 'namesDone' },
        { node: 'intro' },
      ],
      nodes: {
        intro: {
          hub: true,
          text: 'Path only, friend. The lawn is for looking at. Cut one blade and you will learn what *trimmed* means. Ha. Mind the stones.',
          options: [
            { text: 'Is there anything I can do here?', next: 'offer', when: { quest: { id: Q_NAMES, status: 'none' }, questAtLeast: { id: Q_GRASS, stage: 3 } } },
            { text: 'Goodbye.' },
          ],
        },
        offer: {
          text: 'The Wall of the Forty. Three of the plates should be read aloud. The Order reads them every night, so nobody is forgotten. Read three, then come and tell me which ones.',
          options: [{ text: 'I will read them.', action: { type: 'startQuest', quest: Q_NAMES } }, { text: 'Not today.' }],
        },
        namesWait: {
          text: 'Three plates on the Wall. Read them out. Do not skip the short ones.',
          options: [{ text: 'I will read them.' }],
        },
        namesTurn: {
          text: 'You read them, then. Good. The Pipewrights are on that wall because somebody has to say so, and now somebody has.',
          options: [{ text: 'It was nothing.' }],
        },
        namesDone: {
          text: 'The Wall is read every night. Now you are one of the people who read it.',
          options: [{ text: 'Goodbye.' }],
        },
      },
    },

    's02-chickweed-mattock': {
      id: 's02-chickweed-mattock', name: 'Chickweed Mattock', look: look(0x9c6b8f, 0xe8e0c8, null, { dress: true }), zone: 'thatchford', x: 30, z: 12, wander: 0.8,
      examine: 'A former mill laundress. She reads the Wall with one finger, and she moves her lips when she does it.',
      greetings: [
        { when: { questStage: { id: Q_TAG, stage: 2 } }, node: 'tagTurn' },
        { when: { questStage: { id: Q_TAG, stage: 1 } }, node: 'tagWait' },
        { when: { questStage: { id: Q_TAG, stage: 0 } }, node: 'tagWait' },
        { when: { quest: { id: Q_TAG, status: 'done' } }, node: 'tagDone' },
        { node: 'intro' },
      ],
      nodes: {
        intro: {
          hub: true,
          text: 'The Order reads them every night, so nobody has forgotten. Even the ones nobody found.',
          options: [
            { text: 'Tell me about the names.', next: 'offer', when: { quest: { id: Q_TAG, status: 'none' }, questAtLeast: { id: Q_NAMES, stage: 2 } } },
            { text: 'Goodbye.' },
          ],
        },
        offer: {
          text: 'Four magpies on Crowfoot Hill have been carrying brass about. Drive them off and bring me the name-tags from their nests. Then I will tell you whose name I am looking for.',
          options: [{ text: 'I will go up Crowfoot Hill.', action: { type: 'startQuest', quest: Q_TAG } }, { text: 'Not yet.' }],
        },
        tagWait: {
          text: 'Four magpies, and two tags. Then I can say his name properly.',
          options: [{ text: 'I am on my way.' }],
        },
        tagTurn: {
          text: 'Hob Mattock. They said the Pipewrights stayed below. I have his tag. I have his name, read out every night. That is all I have got.',
          options: [{ text: 'I am sorry.' }],
        },
        tagDone: {
          text: 'His name is read every night. Keep the key somewhere the water cannot reach it.',
          options: [{ text: 'I will.' }],
        },
      },
    },

    's02-sprig-lintel': {
      id: 's02-sprig-lintel', name: 'Sprig Lintel', look: look(0xb84c3c, 0x6b8f3a, null, { freckles: true, dress: true }), zone: 'thatchford', x: 38, z: 4, wander: 1.2,
      examine: 'The youngest apprentice at the chapel. She is holding a cap, and she is trying very hard to look like she is not.',
      greetings: [
        { when: { questStage: { id: Q_BRIMS, stage: 3 }, flag: { name: 'brims', value: 'asked' } }, node: 'brimsTurnAsked' },
        { when: { questStage: { id: Q_BRIMS, stage: 3 }, flag: { name: 'brims', value: 'kept' } }, node: 'brimsTurnKept' },
        { when: { questStage: { id: Q_BRIMS, stage: 2 } }, node: 'brimsChoice' },
        { when: { questStage: { id: Q_BRIMS, stage: 1 } }, node: 'sprigWait' },
        { when: { questStage: { id: Q_BRIMS, stage: 0 } }, node: 'sprigWait' },
        { when: { quest: { id: Q_BRIMS, status: 'done' } }, node: 'sprigDone' },
        { node: 'intro' },
      ],
      nodes: {
        intro: {
          hub: true,
          text: 'Nobody here wears a hat. Brother says a hat is a little roof on something that ought to be level.',
          options: [
            { text: 'Why is that cap so flat?', next: 'offer', when: { quest: { id: Q_BRIMS, status: 'none' }, questAtLeast: { id: Q_GRASS, stage: 3 } } },
            { text: 'Goodbye.' },
          ],
        },
        offer: {
          text: 'I was going to hang it back up. Go and look at the hooks by the door. Check all three, and then we will talk about the brim.',
          options: [{ text: 'I will look at the hooks.', action: { type: 'startQuest', quest: Q_BRIMS } }, { text: 'Not my business.' }],
        },
        sprigWait: {
          text: 'The hooks are by the door. Three of them. Check each one, and do not put anything in your pocket.',
          options: [{ text: 'Understood.' }],
        },
        brimsChoice: {
          text: 'Brother says the brims are flat for the Level. I think they are flat for somebody else. Why are they flat? Shall you ask him, or shall you take one?',
          options: [
            { text: 'Ask Sedge why the brims are flat.', next: 'brimsAsked', action: { type: 'setFlag', flag: 'brims', value: 'asked' } },
            { text: 'Take one brim from the hook.', next: 'brimsKept', action: { type: 'setFlag', flag: 'brims', value: 'kept' } },
          ],
        },
        brimsAsked: {
          text: 'Brother told me, so I will tell you. "We come bare-headed to the Level, as the sky does. On the day of the Sorrow we walk the Shorn that way. We do not explain it to the Crown."',
          options: [{ text: 'Thank you, Sprig.' }],
        },
        brimsKept: {
          text: 'You took one? Then you did not see me. I will say a cap fell off the hook. Go on, before Verger Pail comes out.',
          options: [{ text: 'Thank you.' }],
        },
        brimsTurnAsked: {
          text: 'Brother told you, then. Forty gold, and no more questions from me.',
          options: [{ text: 'Goodbye.' }],
        },
        brimsTurnKept: {
          text: 'A Level Brim, flat as a tabletop. Keep it under your hat, and do not tell Brother.',
          options: [{ text: 'Thank you.', action: { type: 'giveItem', item: 's02-level-brim', count: 1 } }],
        },
        sprigDone: {
          text: 'The hooks are still flat. That is a comfort.',
          options: [{ text: 'Goodbye.' }],
        },
      },
    },
  },

  topics: {
    sedge: SEDGE_TOPICS,
  },

  greetingsFirst: {
    sedge: SEDGE_GREETINGS_FIRST,
  },

  extraNodes: {
    sedge: SEDGE_EXTRA_NODES,
  },
};
