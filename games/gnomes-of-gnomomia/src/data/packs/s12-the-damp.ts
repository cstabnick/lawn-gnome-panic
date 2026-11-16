// Content pack s12-the-damp: storyline 12, "The Damp". The Rockery (Mudtooth Deeps, Soakway, Dry Hall) and the Verge side quest.
// Design: docs/design/gnomomia/storylines/12-the-damp.md.
import type { ContentPack, Condition, DialogueNode, DialogueOption, Greeting, EnemyDef, ItemDef, NpcDef, WorldObjectDef, QuestDef } from '../../config';
import { look } from '../../config';

const Q_WET = 's12-wet-ground';
const Q_SURVEY = 's12-nettles-survey';
const Q_LARDER = 's12-the-larder';
const Q_FIFTH = 's12-the-fifth';
const Q_BRANCH = 's12-open-the-branch';
const Q_WHEELS = 's12-under-the-wheels';
const WEEVIL = 's12-dry-root-weevil';
const VALVE = 's12-branch-valve';

// Shared gating helpers. "Started" means done or active; "not started" is its negation.
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const notStarted = (id: string): Condition => ({ not: { questAtLeast: { id, stage: 0 } } });
const flagIs = (name: string, value: string): Condition => ({ flag: { name, value } });
const onStage = (id: string, stage: number): Condition => ({ questStage: { id, stage } });

// ---------------------------------------------------------------- Dowager Mudtooth (canon, ch6): topics and extra nodes

const mudtooth = {
  topics: [
    {
      text: 'Where is the wet ground?', next: 's12-wet-start', action: { type: 'startQuest', quest: Q_WET },
      when: { ...done('c6-honest-words'), ...flagIs('mudtooth', 'trust'), ...notStarted(Q_WET) },
    },
    {
      text: 'What is eating the roots?', next: 's12-larder-start', action: { type: 'startQuest', quest: Q_LARDER },
      when: { ...done(Q_SURVEY), ...notStarted(Q_LARDER) },
    },
    {
      text: 'What does the Keep want with the water?', next: 's12-fifth-start', action: { type: 'startQuest', quest: Q_FIFTH },
      when: { ...done(Q_LARDER), ...notStarted(Q_FIFTH) },
    },
    {
      text: 'Share a fifth with the moles.', next: 's12-fifth-shared', action: { type: 'setFlag', flag: 'damp', value: 'shared' },
      when: onStage(Q_FIFTH, 0),
    },
    {
      text: 'The Keep keeps its water.', next: 's12-fifth-kept', action: { type: 'setFlag', flag: 'damp', value: 'kept' },
      when: onStage(Q_FIFTH, 0),
    },
    {
      text: 'The Mower has four wheels. Can the moles dig under them?', next: 's12-wheels-start', action: { type: 'startQuest', quest: Q_WHEELS },
      when: { ...flagIs('damp', 'shared'), questAtLeast: { id: 'c7-muster', stage: 0 }, ...notStarted(Q_WHEELS) },
    },
  ] satisfies readonly DialogueOption[],

  greetingsFirst: [
    { when: onStage(Q_WET, 0), node: 's12-wet-reach' },
    { when: onStage(Q_WET, 1), node: 's12-wet-dig' },
    { when: onStage(Q_WET, 2), node: 's12-wet-turnin' },
    { when: onStage(Q_LARDER, 0), node: 's12-larder-wait' },
    { when: onStage(Q_LARDER, 1), node: 's12-larder-turnin' },
    { when: onStage(Q_BRANCH, 2), node: 's12-valve-turnin' },
    { when: onStage(Q_WHEELS, 0), node: 's12-wheels-wait' },
    { when: onStage(Q_WHEELS, 1), node: 's12-wheels-turnin' },
  ] satisfies readonly Greeting[],

  nodes: {
    's12-wet-start': {
      text: 'The wet was here when my mother was a pup. Then your people came up the Hose with poles and sank shafts through it.',
      options: [{ text: 'I\'ll go and look at the scars.' }],
    },
    's12-wet-reach': {
      text: 'Past the Honest Words chamber, along the Soakway roof. Look at it, and then come back and tell me what you see.',
      options: [{ text: 'I\'m going.' }],
    },
    's12-wet-dig': {
      text: 'Three survey scars along the roof, where the shafts came down. Dig them out, one at a time. I\'ll hear it from here.',
      options: [{ text: 'Digging.' }],
    },
    's12-wet-turnin': {
      text: 'Shafts, every one, sunk in the Dry Summer. Look at the scars, and tell me they were looking for anything you\'d call a friend.',
      options: [{ text: 'They weren\'t.' }],
    },
    's12-larder-start': {
      text: 'Weevils have got into the root stores. Six of them, gnawing the damp roots the clan keeps. Clear them out of the Soakway.',
      options: [{ text: 'I\'ll clear them.' }],
    },
    's12-larder-wait': {
      text: 'Six weevils in the Soakway. Kill them, and then come back and tell me the Larder is clear.',
      options: [{ text: 'On my way.' }],
    },
    's12-larder-turnin': {
      text: 'The Larder\'s clear. Take these gloves. Mole-hide, warm in wet ground, and they still smell of the Soakway.',
      options: [{ text: 'Thank you, Dowager.' }],
    },
    's12-fifth-start': {
      text: 'The Keep wants to talk about the water. Hear what Nettle says they offer, then tell me what you think a fair share is.',
      options: [{ text: 'I\'ll think on it.' }],
    },
    's12-fifth-shared': {
      text: 'A fifth. Your Keep has never once given us a fifth. I\'ll hold you to it.',
      options: [{ text: 'Done.' }],
    },
    's12-fifth-kept': {
      text: 'Then keep it. The Keep has never once given us a fifth, and I won\'t ask twice.',
      options: [{ text: 'Goodbye, Dowager.' }],
    },
    's12-valve-turnin': {
      text: 'I can hear it. Leave me the hearing.',
      options: [{ text: 'Goodbye, Dowager.' }],
    },
    's12-wheels-start': {
      text: 'The Mower\'s four wheels sit in pits out on the battlefield. The moles can dig under them, if you show them where. Four pits, all dug.',
      options: [{ text: 'I\'ll dig them.' }],
    },
    's12-wheels-wait': {
      text: 'Four wheel-pits on the battlefield, on the Mower\'s path. Dig each one, and come back to me.',
      options: [{ text: 'Going.' }],
    },
    's12-wheels-turnin': {
      text: 'Four pits, all dug. Tell the Last Tuft the moles did it, and let them wonder why.',
      options: [{ text: 'I\'ll tell them.' }],
    },
  } satisfies Record<string, DialogueNode>,
};

// ---------------------------------------------------------------- Nettle (canon, ch2): topics and extra nodes

const nettle = {
  topics: [
    {
      text: 'What is Ida\'s seal for?', next: 's12-survey-start', action: { type: 'startQuest', quest: Q_SURVEY },
      when: { ...done(Q_WET), ...notStarted(Q_SURVEY) },
    },
    {
      text: 'What does the Keep offer?', next: 's12-nettle-fifth',
      when: onStage(Q_FIFTH, 0),
    },
    {
      text: 'Is that the end of the Deeps\' water?', next: 's12-nettle-kept',
      when: { ...done(Q_FIFTH), ...flagIs('damp', 'kept') },
    },
    {
      text: 'Can we open the branch?', next: 's12-open-start', action: { type: 'startQuest', quest: Q_BRANCH },
      when: { ...done(Q_FIFTH), ...flagIs('damp', 'shared'), ...notStarted(Q_BRANCH) },
    },
  ] satisfies readonly DialogueOption[],

  greetingsFirst: [
    { when: onStage(Q_SURVEY, 2), node: 's12-nettle-turnin' },
    { when: onStage(Q_BRANCH, 2), node: 's12-nettle-sent' },
  ] satisfies readonly Greeting[],

  nodes: {
    's12-survey-start': {
      text: 'Ida says the seal\'s Shard iron, both ways, and not one drop goes down it till the moles have seen the valve. Her words, not mine.',
      options: [{ text: 'Then let\'s go.' }],
    },
    's12-nettle-turnin': {
      text: 'It held, then. Good. Ida will ask whether I touched the seal, and I\'ll say no.',
      options: [{ text: 'Thanks, Nettle.' }],
    },
    's12-nettle-fifth': {
      text: 'A fifth of what the Deeps lose anyway. The Keep won\'t miss it.',
      options: [{ text: 'Thanks.' }],
    },
    's12-nettle-kept': {
      text: 'Dry it is.',
      options: [{ text: 'Goodbye, Nettle.' }],
    },
    's12-open-start': {
      text: 'The valve\'s ready to open. Stay by it. The weevils come in three waves, and if you wander off, we start again.',
      options: [{ text: 'I\'ll hold it.' }],
    },
    's12-nettle-sent': {
      text: 'Go and tell Dowager. She\'ll say she can hear it. Let her.',
      options: [{ text: 'Going now.' }],
    },
  } satisfies Record<string, DialogueNode>,
};

// ---------------------------------------------------------------- Tunk (new, mole foreman)

const tunkNpc: NpcDef = {
  id: 's12-tunk', name: 'Tunk', look: look(0x5a4632, 0x6e5a3a, null), zone: 'rockery', x: 62, z: 54, wander: 0.5,
  model: 'mole', scale: 1,
  examine: 'A grubby mole with clay in his fur and a shovel he has not put down since the last collapse.',
  greetings: [
    { when: done(Q_BRANCH), node: 'after' },
    { node: 'hub' },
  ],
  nodes: {
    hub: {
      hub: true,
      text: 'Feel that? The floor\'s been doing that since the Mower woke. Don\'t ask me to stop digging.',
      options: [
        { text: 'What are you digging for?', next: 'dig' },
        { text: 'Goodbye.' },
      ],
    },
    dig: {
      text: 'Shoring. Timber and mud, to keep the roof up. The last dry collapse buried two moles, and I dug the shoring for that one. I\'m still sorry.',
      options: [{ text: 'Goodbye.' }],
    },
    after: {
      text: 'It\'s wet, Dowager. Can you hear it? Don\'t you go and fall in it.',
      options: [{ text: 'Goodbye.' }],
    },
  },
};

// ---------------------------------------------------------------- enemy

const weevil: EnemyDef = {
  id: WEEVIL, name: 'Dry-root weevil', level: 21, rank: 'normal', family: 'shelled',
  damageType: 'slash', aggressive: true,
  loot: [], gold: [2, 6],
  model: 'beetle', color: 0x6b4a2b, scale: 1,
  respawnSeconds: 30,
  examine: 'A brown weevil as long as a gnome\'s arm, its snout dusty from old roots.',
  wants: 'The damp roots the moles store, which the dry ground has killed off.',
};

// ---------------------------------------------------------------- Nettle's rockery copy (escort and valve beats of Nettle's Survey)

// The canon Nettle lives in Thatchford, so the Rockery beats of the survey run through this copy. Visible only while the survey is active.
const surveyorNpc: NpcDef = {
  id: 's12-nettle-surveyor', name: 'Nettle', look: look(0xd9b84a, 0x3a7a6a, null, { freckles: true, dress: true }), zone: 'rockery', x: 60, z: 40, wander: 0.5,
  hidden: { not: { quest: { id: Q_SURVEY, status: 'active' } } },
  examine: 'Nettle, out on the Rockery survey with a yellow hat and a spanner. Ida\'s apprentice, far from the Keep.',
  greetings: [
    { when: onStage(Q_SURVEY, 0), node: 's12-nettle-escort' },
    { when: onStage(Q_SURVEY, 1), node: 's12-nettle-valve' },
    { node: 'hub' },
  ],
  nodes: {
    hub: {
      hub: true,
      text: 'Ida says the seal stays shut till the moles have seen it. I\'m only here to carry the spanner.',
      options: [{ text: 'Goodbye, Nettle.' }],
    },
    's12-nettle-escort': {
      text: 'Keep up. The floor\'s been bad in the Shard Mine since the Mower woke. Tunk says the same, loudly.',
      options: [{ text: 'Lead on.' }],
    },
    's12-nettle-valve': {
      text: 'The branch-valve is in the Dry Hall wall. Turn it, and then tell me what it did.',
      options: [{ text: 'Turning it now.' }],
    },
  },
};

// ---------------------------------------------------------------- items

const gloves: ItemDef = {
  id: 's12-mudtooth-gloves', name: 'Mudtooth gloves', icon: '🧤', kind: 'armor', slot: 'hands',
  ilvl: 21, rarity: 'sprouted', armorType: 'leather', stats: { agility: 1 },
  value: 882,
  examine: 'Mole-hide, warm in wet ground. They still smell of the Soakway.',
};

const ring: ItemDef = {
  id: 's12-soakway-ring', name: 'Soakway Ring', icon: '💍', kind: 'trinket', slot: 'trinket',
  ilvl: 22, rarity: 'sprouted', effect: 'Ward vs Rain 5%.',
  value: 968,
  examine: 'Cut from an old Tall One pipe joint, and warm to the touch.',
};

// ---------------------------------------------------------------- world objects

const objects: Record<string, WorldObjectDef> = {
  's12-dig-scar': {
    id: 's12-dig-scar', zone: 'rockery', name: 'Survey scar', x: 44, z: 46,
    model: 'generic', color: 0x5a4632, verb: 'Dig',
    examine: 'A collapsed survey shaft along the Soakway roof, where a Pipewright crew came through in the Dry Summer.',
    text: 'You dig out a little more of the old shaft. The roof creaks above you.',
  },
  [VALVE]: {
    id: VALVE, zone: 'rockery', name: 'Branch-valve', x: 70, z: 60,
    model: 'valve', color: 0x7a7a80, verb: 'Turn',
    examine: 'A Tall One pipe-tap in the Dry Hall wall, sealed with Shard iron.',
    text: 'The seal hums. Something cool pushes at it from the far side.',
  },
  's12-wheel-pit': {
    id: 's12-wheel-pit', zone: 'verge', name: 'Wheel-pit', x: 0, z: -62,
    model: 'generic', color: 0x4a3a2a, verb: 'Dig',
    examine: 'A pit dug under the path of the Mower\'s wheel. Dug wide, so the wheel drops in.',
    text: 'You dig deeper. The moles would be proud of that.',
  },
};

// ---------------------------------------------------------------- quests

const quests: Record<string, QuestDef> = {
  [Q_WET]: {
    id: Q_WET, name: 'Wet Ground', giver: 'mudtooth', zone: 'rockery', level: 20, tier: 'side', chain: 'The Damp',
    stages: [
      { text: 'Walk the Soakway, past the Honest Words chamber, to the damp tunnels.', objective: { type: 'reach', zone: 'rockery', x: 48, z: 44, r: 8 } },
      { text: 'Dig out the three survey scars along the Soakway roof.', objective: { type: 'interact', object: 's12-dig-scar', count: 3 } },
      { text: 'Tell Dowager Mudtooth what the scars were for.', objective: { type: 'talk', npc: 'mudtooth' } },
    ],
    reward: { gold: 50, items: [] },
  },
  [Q_SURVEY]: {
    id: Q_SURVEY, name: 'Nettle\'s Survey', giver: 'nettle', zone: 'rockery', level: 21, tier: 'side', chain: 'The Damp',
    stages: [
      { text: 'Walk Nettle from the Flintdelve cart stop to the Dry Hall, through the Shard Mine\'s lower gallery.', objective: { type: 'escort', npc: 's12-nettle-surveyor', zone: 'rockery', x: 66, z: 56, r: 7 } },
      { text: 'Turn the branch-valve in the Dry Hall wall.', objective: { type: 'interact', object: VALVE, count: 1 } },
      { text: 'Tell Nettle what the branch-valve did.', objective: { type: 'talk', npc: 'nettle' } },
    ],
    reward: { gold: 80, items: [] },
  },
  [Q_LARDER]: {
    id: Q_LARDER, name: 'The Larder', giver: 'mudtooth', zone: 'rockery', level: 21, tier: 'side', chain: 'The Damp',
    stages: [
      { text: 'Kill six Dry-root weevils in the Soakway. They are gnawing the moles\' stored roots.', objective: { type: 'kill', enemy: WEEVIL, count: 6 } },
      { text: 'Tell Dowager Mudtooth the Larder is clear.', objective: { type: 'talk', npc: 'mudtooth' } },
    ],
    reward: { gold: 60, items: [{ item: 's12-mudtooth-gloves', count: 1 }] },
  },
  [Q_FIFTH]: {
    id: Q_FIFTH, name: 'The Fifth', giver: 'mudtooth', zone: 'rockery', level: 22, tier: 'side', chain: 'The Damp',
    stages: [
      { text: 'Choose with Dowager Mudtooth in the Dry Hall: a fifth of the water for the moles, or none for the Keep.', objective: { type: 'choice', flag: 'damp' } },
    ],
    reward: { gold: 100, items: [] },
  },
  [Q_BRANCH]: {
    id: Q_BRANCH, name: 'Open the Branch', giver: 'nettle', zone: 'rockery', level: 23, tier: 'side', chain: 'The Damp',
    stages: [
      {
        text: 'Hold the Dry Hall branch-valve for a minute while the weevils come in three waves. Stay close.',
        objective: {
          type: 'defend', zone: 'rockery', x: 70, z: 60, r: 6, seconds: 60,
          waves: [
            { enemy: WEEVIL, count: 3, at: 5 },
            { enemy: WEEVIL, count: 3, at: 25 },
            { enemy: WEEVIL, count: 3, at: 45 },
          ],
        },
      },
      { text: 'Turn the branch-valve open.', objective: { type: 'interact', object: VALVE, count: 1 } },
      { text: 'Tell Dowager Mudtooth the valve is open.', objective: { type: 'talk', npc: 'mudtooth' } },
    ],
    reward: { gold: 120, items: [{ item: 's12-soakway-ring', count: 1 }] },
  },
  [Q_WHEELS]: {
    id: Q_WHEELS, name: 'Under the Wheels', giver: 'mudtooth', zone: 'verge', level: 25, tier: 'side', chain: 'The Damp',
    stages: [
      { text: 'Dig the four wheel-pits under the Mower\'s path on the battlefield.', objective: { type: 'interact', object: 's12-wheel-pit', count: 4 } },
      { text: 'Tell Dowager Mudtooth the wheel-pits are dug.', objective: { type: 'talk', npc: 'mudtooth' } },
    ],
    reward: { gold: 150, items: [] },
  },
};

// ---------------------------------------------------------------- pack

export const PACK: ContentPack = {
  id: 's12-the-damp',
  items: { [gloves.id]: gloves, [ring.id]: ring },
  enemies: { [WEEVIL]: weevil },
  npcs: { [tunkNpc.id]: tunkNpc, [surveyorNpc.id]: surveyorNpc },
  quests,
  spawns: [
    { zone: 'rockery', enemy: WEEVIL, x: 46, z: 40, count: 3, spread: 4 },
    { zone: 'rockery', enemy: WEEVIL, x: 54, z: 34, count: 3, spread: 4 },
  ],
  objects,
  topics: {
    mudtooth: mudtooth.topics,
    nettle: nettle.topics,
  },
  greetingsFirst: {
    mudtooth: mudtooth.greetingsFirst,
    nettle: nettle.greetingsFirst,
  },
  extraNodes: {
    mudtooth: mudtooth.nodes,
    nettle: nettle.nodes,
  },
  allies: [
    { id: 's12-mole-tunnellers', name: 'Mole tunnellers', when: flagIs('damp', 'shared'), effect: 'wheel-dig' },
  ],
};
