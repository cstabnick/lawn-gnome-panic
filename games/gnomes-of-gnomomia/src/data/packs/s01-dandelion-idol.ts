// Content pack: Storyline 01, The Dandelion Idol (Mossbottom Vale, levels 3-6). Prefix for new ids: s01-.
// Design: docs/design/gnomomia/storylines/01-dandelion-idol.md
import { look, type ContentPack, type DialogueNode, type Greeting } from '../../config';

const CHICORY = 's01-chicory';
const Q_NOT_OURS = 's01-not-ours-to-steal';
const Q_LOGS = 's01-stamped-logs';
const Q_WELL = 's01-who-comes-up-the-path';
const Q_CLOCK_LET_IN = 's01-clock-let-in';
const Q_CLOCK_AWAY = 's01-clock-turned-away';
const CLOCK = 's01-dandelion-clock';
const CHAIN = 'Storyline 1: The Dandelion Idol';

// Greetings on Captain Pip and Elder Fernwick: checked before their own, always gated by a quest stage, a flag, or a quest start.
const PIP_GREETINGS: Greeting[] = [
  { when: { quest: { id: Q_NOT_OURS, status: 'none' }, questAtLeast: { id: 'mb-feral-totem', stage: 2 } }, node: 's01-pipOwner' },
  { when: { questStage: { id: Q_NOT_OURS, stage: 0 } }, node: 's01-pipReport' },
  { when: { quest: { id: Q_WELL, status: 'none' }, questAtLeast: { id: Q_LOGS, stage: 3 } }, node: 's01-pipEscort' },
  { when: { questStage: { id: Q_WELL, stage: 0 } }, node: 's01-pipEscortReport' },
  { when: { questStage: { id: Q_CLOCK_LET_IN, stage: 1 } }, node: 's01-pipClock' },
];

const FERNWICK_GREETINGS: Greeting[] = [
  { when: { questStage: { id: Q_WELL, stage: 2 } }, node: 's01-fernChoice' },
  {
    when: { quest: { id: Q_CLOCK_LET_IN, status: 'none' }, questAtLeast: { id: Q_WELL, stage: 4 }, flag: { name: 'feral', value: 'let_in' } },
    node: 's01-fernClock',
  },
];

const PIP_NODES: Record<string, DialogueNode> = {
  's01-pipOwner': {
    text: 'Whose totem? Don\'t say the Wildlings. Wildlings don\'t steal, so somebody\'s lying, and it\'s the camp\'s job to say who.',
    options: [
      { text: 'Then I will ask the camp.', next: 's01-pipOwnerGo', action: { type: 'startQuest', quest: Q_NOT_OURS } },
      { text: 'Not my business.' },
    ],
  },
  's01-pipOwnerGo': {
    text: 'Then go and ask. Come back and tell me what you were told.',
    options: [{ text: 'I will be back.' }],
  },
  's01-pipReport': {
    text: 'Back already? Good. Go west to the feral camp and ask their elder, Chicory Dibble, whose totem that is.',
    options: [{ text: 'On my way.' }],
  },
  's01-pipEscort': {
    text: 'Chicory Dibble wants a place at the well. I would rather he did not have one, but the Elder will hear it. Will you walk him up?',
    options: [
      { text: 'I will fetch him.', next: 's01-pipEscortGo', action: { type: 'startQuest', quest: Q_WELL } },
      { text: 'Not today.' },
    ],
  },
  's01-pipEscortGo': {
    text: 'Good. Stop by once more before you set off, so I know you have him.',
    options: [{ text: 'Will do, Captain.' }],
  },
  's01-pipEscortReport': {
    text: 'Right. Chicory is yours to walk. Lead him from the camp to the well, and keep to the path.',
    options: [{ text: 'Let us go.' }],
  },
  's01-pipClock': {
    text: 'The well held, and the ferals went home with bumps. Good work, recruit. Chicory is still a feral, but he is ours now.',
    options: [{ text: 'Goodbye.' }],
  },
};

const FERNWICK_NODES: Record<string, DialogueNode> = {
  's01-fernChoice': {
    text: 'My knees say let him up. My knees have said a lot this month. Chicory says: "Burr was my son. I would like to be somebody\'s neighbour when I say so."',
    options: [
      { text: 'Let him up to the well.', action: { type: 'setFlag', flag: 'feral', value: 'let_in' } },
      { text: 'Send him back to the camp.', action: { type: 'setFlag', flag: 'feral', value: 'turned_away' } },
      { text: 'Not yet. I will think.' },
    ],
  },
  's01-fernClock': {
    text: 'The Idol is still ticking, and Chicory says his camp will come up the path for it. Hold the well for a minute, if you can.',
    options: [
      { text: 'I will hold the well.', action: { type: 'startQuest', quest: Q_CLOCK_LET_IN } },
      { text: 'Not yet.' },
    ],
  },
};

export const PACK: ContentPack = {
  id: 's01-dandelion-idol',

  items: {
    [CLOCK]: {
      id: CLOCK, name: 'Dandelion clock', icon: '🌼', kind: 'trinket', slot: 'trinket', ilvl: 4, rarity: 'sprouted',
      stats: { agility: 1 }, value: 32,
      examine: 'A dandelion seed-head in privet wire. "Blow it and count the seeds. The count was never wrong, Chicory says, only late."',
    },
  },

  npcs: {
    [CHICORY]: {
      id: CHICORY, name: 'Chicory Dibble', look: look(0x7a6a4a, 0x6b5b3a, 0xbfbfbf, { bowlCut: 0xbfbfbf }), zone: 'mossbottom', x: -50, z: 16, wander: 0.5,
      // At the well once he is let up (flag feral=let_in).
      placements: [{ zone: 'mossbottom', x: 4, z: 9, when: { flag: { name: 'feral', value: 'let_in' } } }],
      examine: 'Unofficial elder of the Feral Camp. He is bareheaded, and he has the look of a man who sold his hat for bread.',
      greetings: [
        { when: { questStage: { id: Q_NOT_OURS, stage: 2 } }, node: 'q1TurnIn' },
        { when: { questStage: { id: Q_LOGS, stage: 2 } }, node: 'q2TurnIn' },
        { when: { questStage: { id: Q_LOGS, stage: 0 } }, node: 'logsWaiting' },
        { when: { questStage: { id: Q_LOGS, stage: 1 } }, node: 'logsWaiting' },
        { when: { questStage: { id: Q_WELL, stage: 1 } }, node: 'escortGo' },
        { when: { questStage: { id: Q_WELL, stage: 2 } }, node: 'choiceWait' },
        { when: { questStage: { id: Q_WELL, stage: 3 }, flag: { name: 'feral', value: 'let_in' } }, node: 'q3TurnInIn' },
        { when: { questStage: { id: Q_WELL, stage: 3 }, flag: { name: 'feral', value: 'turned_away' } }, node: 'q3TurnInAway' },
        { when: { questStage: { id: Q_CLOCK_LET_IN, stage: 0 } }, node: 'holdWell' },
        { when: { questStage: { id: Q_CLOCK_AWAY, stage: 0 } }, node: 'awayReach' },
        { when: { questStage: { id: Q_CLOCK_AWAY, stage: 1 } }, node: 'stakeWait' },
        { when: { questStage: { id: Q_CLOCK_AWAY, stage: 2 } }, node: 'q4bTurnIn' },
        { when: { flag: { name: 'feral', value: 'let_in' }, questAtLeast: { id: Q_WELL, stage: 4 } }, node: 'resident' },
        { node: 'hello' },
      ],
      nodes: {
        hello: {
          hub: true,
          text: 'Dandelions and camp business. You want something from the Feral Camp, or are you lost?',
          options: [
            { text: 'Got any work for a stranger?', next: 'logsIntro', action: { type: 'startQuest', quest: Q_LOGS }, when: { quest: { id: Q_LOGS, status: 'none' }, questAtLeast: { id: Q_NOT_OURS, stage: 3 } } },
            { text: 'Whose totem is it, really?', next: 'clockTalk' },
            { text: 'Goodbye.' },
          ],
        },
        clockTalk: {
          text: 'We didn\'t steal it. She kept the hedge and sent us out with the clock. We\'re still telling the time.',
          options: [{ text: 'Who is she?', next: 'burdock' }, { text: 'Goodbye.' }],
        },
        burdock: {
          text: 'Mother Burdock. She threw us out when the King fell, for raiding the Hedgewright camps. Some of that was ours to answer for.',
          options: [{ text: 'Goodbye.' }],
        },
        logsIntro: {
          text: 'Beetle Barrows, south-west of the well. The rotten logs in the mounds carry a stamp. Look at them, and tell me what you see.',
          options: [{ text: 'I will go to the barrows.' }],
        },
        logsWaiting: {
          text: 'Beetle Barrows, south-west of the well. Three stamped logs. Look at each one, then come back and tell me.',
          options: [{ text: 'I will look.' }],
        },
        q1TurnIn: {
          text: 'So Pip sent you to see the camp. Good. Tell him we didn\'t steal it. We\'re still telling the time.',
          options: [{ text: 'Thanks, Chicory.' }],
        },
        q2TurnIn: {
          text: 'Every log in these mounds has the Clippings sawpit stamp. Cut in the hedge, milled at the Sawdust Mill, and the rot comes back here for the beetles. Mind the mill, friend.',
          options: [{ text: 'I will mind it.' }],
        },
        escortGo: {
          text: 'Lead on. Keep to the path, and mind the mill.',
          options: [{ text: 'On our way.' }],
        },
        choiceWait: {
          text: 'Go and ask the Elder. He is at the well, deciding what his knees think.',
          options: [{ text: 'I will fetch him.' }],
        },
        q3TurnInIn: {
          text: 'A well with a neighbour in it. Take the clock. Blow it and count the seeds. The count was never wrong, only late.',
          options: [{ text: 'Thank you, Chicory.' }],
        },
        q3TurnInAway: {
          text: 'Back to the camp, then. The gate shut on us once already, so keep the clock until we come for it.',
          options: [
            { text: 'I will bring it to the stake.', next: 'awayStart', action: { type: 'startQuest', quest: Q_CLOCK_AWAY } },
            { text: 'Goodbye.' },
          ],
        },
        awayStart: {
          text: 'The stake is on the camp\'s east side. Bring the clock there, and we will take it home.',
          options: [{ text: 'Goodbye.' }],
        },
        awayReach: {
          text: 'The stake is on the east side of the camp. Come and find it.',
          options: [{ text: 'Goodbye.' }],
        },
        stakeWait: {
          text: 'Interact with the stake, then come back to me with the clock.',
          options: [{ text: 'Goodbye.' }],
        },
        q4bTurnIn: {
          text: 'Give me the clock. We\'re still telling the time.',
          options: [{ text: 'Here it is, Chicory.' }],
        },
        holdWell: {
          text: 'They will come up the path for the clock. Hold the well for a minute, and do not let the Idol go.',
          options: [{ text: 'Goodbye.' }],
        },
        resident: {
          text: 'Bareheaded is what hungry looks like, not what a Wildling looks like. Ferals don\'t wear hats. We sold ours for bread. Keep that in mind at the mill.',
          options: [{ text: 'I will keep it in mind.' }],
        },
      },
    },
  },

  objects: {
    's01-stamped-log': {
      id: 's01-stamped-log', zone: 'mossbottom', name: 'Stamped log', x: -46, z: -57, model: 'post',
      verb: 'Inspect', examine: 'A rotten log with a stamp burned into the bark.',
      text: 'The Clippings sawpit stamp. Cut in the hedge, milled at the Sawdust Mill.',
    },
    's01-dandelion-stake': {
      id: 's01-dandelion-stake', zone: 'mossbottom', name: 'Dandelion stake', x: -43, z: 22, model: 'post',
      verb: 'Inspect', examine: 'A stake with a dandelion carved on top. The camp keeps its marker for the Idol here.',
      text: 'The wire is still bent where the clock used to hang.',
    },
  },

  greetingsFirst: {
    'pip': PIP_GREETINGS,
    'fernwick': FERNWICK_GREETINGS,
  },

  extraNodes: {
    'pip': PIP_NODES,
    'fernwick': FERNWICK_NODES,
  },

  quests: {
    [Q_NOT_OURS]: {
      id: Q_NOT_OURS, name: 'Not Ours to Steal', giver: 'pip', zone: 'mossbottom', level: 3, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Report back to Captain Pip before you go to the camp.', objective: { type: 'talk', npc: 'pip' } },
        { text: 'Find the Feral Camp, west of Mossbottom.', objective: { type: 'reach', zone: 'mossbottom', x: -55, z: 20, r: 12 } },
        { text: 'Talk to Chicory Dibble at the Feral Camp.', objective: { type: 'talk', npc: CHICORY } },
      ],
      reward: { gold: 40, items: [{ item: 'red-potion', count: 2 }] },
    },
    [Q_LOGS]: {
      id: Q_LOGS, name: 'Stamped Logs', giver: CHICORY, zone: 'mossbottom', level: 3, tier: 'side', chain: CHAIN,
      stages: [
        { text: 'Reach Beetle Barrows, south-west of Mossbottom.', objective: { type: 'reach', zone: 'mossbottom', x: -45, z: -60, r: 14 } },
        { text: 'Examine the three stamped logs in Beetle Barrows.', objective: { type: 'interact', object: 's01-stamped-log', count: 3 } },
        { text: 'Tell Chicory Dibble what the logs say.', objective: { type: 'talk', npc: CHICORY } },
      ],
      reward: { gold: 60, items: [{ item: 'bark-vest', count: 1 }] },
    },
    [Q_WELL]: {
      id: Q_WELL, name: 'Who Comes Up the Path', giver: 'pip', zone: 'mossbottom', level: 4, tier: 'main', chain: CHAIN,
      stages: [
        { text: 'Report to Captain Pip that you will walk Chicory up to the well.', objective: { type: 'talk', npc: 'pip' } },
        { text: 'Walk Chicory Dibble from the Feral Camp to the well.', objective: { type: 'escort', npc: CHICORY, zone: 'mossbottom', x: 0, z: 0, r: 6 } },
        { text: 'Talk to Elder Fernwick at the well and let him decide.', objective: { type: 'choice', flag: 'feral' } },
        { text: 'Talk to Chicory Dibble at the well.', objective: { type: 'talk', npc: CHICORY } },
      ],
      reward: { gold: 150, items: [{ item: CLOCK, count: 1 }] },
    },
    [Q_CLOCK_LET_IN]: {
      id: Q_CLOCK_LET_IN, name: 'The Clock Runs Down', giver: 'fernwick', zone: 'mossbottom', level: 5, tier: 'main', chain: CHAIN,
      stages: [
        {
          text: 'Hold the well for a minute. Feral gnomes and a brute will come up the path for the Idol.',
          objective: {
            type: 'defend', zone: 'mossbottom', x: 0, z: 0, r: 8, seconds: 60,
            waves: [{ enemy: 'feral-gnome', count: 4, at: 10 }, { enemy: 'feral-brute', count: 1, at: 35 }],
          },
        },
        { text: 'Tell Captain Pip the well held.', objective: { type: 'talk', npc: 'pip' } },
      ],
      reward: { gold: 200, items: [] },
    },
    [Q_CLOCK_AWAY]: {
      id: Q_CLOCK_AWAY, name: 'The Clock Runs Down', giver: CHICORY, zone: 'mossbottom', level: 5, tier: 'main', chain: CHAIN,
      stages: [
        { text: 'Walk back to the Feral Camp.', objective: { type: 'reach', zone: 'mossbottom', x: -55, z: 20, r: 12 } },
        { text: 'Interact with the dandelion stake on the camp\'s east side.', objective: { type: 'interact', object: 's01-dandelion-stake', count: 1 } },
        { text: 'Give Chicory Dibble back his clock.', objective: { type: 'talk', npc: CHICORY }, takeItems: [{ item: CLOCK, count: 1 }] },
      ],
      reward: { gold: 120, items: [] },
    },
  },
};
