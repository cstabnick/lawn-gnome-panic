// Content pack s06-the-forty: storyline 06, "The Forty". Drainpipe Deeps (Gutters, Cistern, Backflow), the Hedgewood
// grave, and the Forty Stone plot at the top of the Deeps stairs. Design: docs/design/gnomomia/storylines/06-the-forty.md.
// Canon NPCs Dill (puddleby) and Ida (ida) get topics, greetings and nodes here. Lichen is owned by the ch5 pack, so his
// lines are added the same way (topics, greetingsFirst, extraNodes) and resolve once ch5 defines him.
import type { Condition, ContentPack, DialogueNode, DialogueOption, Greeting, ItemDef, QuestDef, WorldObjectDef } from '../../config';

const Q_TOOLS = 's06-forty-tools';
const Q_LOCKERS = 's06-barracks-lockers';
const Q_LICHEN = 's06-lichens-name';
const Q_SHIFT = 's06-finish-their-shift';
const Q_STONE = 's06-the-forty-stone';

const FLAG_BURNET = 's06-burnet';
const FLAG_STONE = 's06-stone';

// Gating helpers. Each returns one field, so spreads never clash on the same key except `not`, which only notStarted uses.
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const active = (id: string): Condition => ({ quest: { id, status: 'active' } });
const started = (id: string): Condition => ({ questAtLeast: { id, stage: 0 } });
const notStarted = (id: string): Condition => ({ not: { questAtLeast: { id, stage: 0 } } });
const flagIs = (name: string, value: string): Condition => ({ flag: { name, value } });
const onStage = (id: string, stage: number): Condition => ({ questStage: { id, stage } });

// Dill Puddleby (canon, ch2). His start options and turn-ins are added from this pack.
const dillTopics: DialogueOption[] = [
  {
    text: 'Forty plates. What were they carrying?', next: 's06-dill-tools-start', action: { type: 'startQuest', quest: Q_TOOLS },
    when: { ...done('c3-letter-from-puddlemere'), ...flagIs('c2-forty-list', 'yes'), ...notStarted(Q_TOOLS) },
  },
  { text: 'The forty. Any news?', next: 's06-dill-tools-wait', when: active(Q_TOOLS) },
  { text: 'The table. Who sits where?', next: 's06-dill-table', when: done(Q_STONE) },
];
const dillGreetingsFirst: Greeting[] = [
  { when: onStage(Q_TOOLS, 2), node: 's06-dill-tools-turnin' },
  { when: onStage(Q_STONE, 5), node: 's06-dill-stone-turnin' },
];
const dillNodes: Record<string, DialogueNode> = {
  's06-dill-tools-start': {
    text: 'Forty plates, every night. Somebody should at least know what they carried. Their tools went down with them, and one of them scratched a line on the north grate of the Gutters.',
    options: [{ text: 'I\'ll go and look.' }],
  },
  's06-dill-tools-wait': {
    text: 'The Gutters\' north ledge, past the gutter rats. The grate sits above the upper ladder.',
    options: [{ text: 'Going.' }],
  },
  's06-dill-tools-turnin': {
    text: 'A scratch on iron, and a name off a stamped tin. That\'s something to put on the table. Thank you for carrying it back down to me.',
    options: [{ text: 'Glad to help, Dill.' }],
  },
  's06-dill-stone-turnin': {
    text: 'Thistle sent word. Primrose goes in the middle, where the sun reaches first. The stone is up, then. Forty names, and every one of them cut.',
    options: [{ text: 'Goodnight, Dill.' }],
  },
  's06-dill-table': {
    text: 'Dill sets a name card at the head of the table, where the forty plates begin. He doesn\'t say anything about it, and neither do you.',
    options: [{ text: 'Goodnight, Dill.' }],
  },
};

// Ida Gromwell (canon, ch3). Starts Lockers, Finish Their Shift and The Forty Stone; turns in and chooses for the stone.
const idaTopics: DialogueOption[] = [
  {
    text: 'The barracks lockers in the Cistern. Want them opened?', next: 's06-ida-lockers-start', action: { type: 'startQuest', quest: Q_LOCKERS },
    when: { ...done(Q_TOOLS), ...started('c5-valve-maps'), ...notStarted(Q_LOCKERS) },
  },
  { text: 'The lockers. Still open?', next: 's06-ida-lockers-wait', when: active(Q_LOCKERS) },
  {
    text: 'The Backflow wheels. Can they be set right?', next: 's06-ida-shift-start', action: { type: 'startQuest', quest: Q_SHIFT },
    when: { ...done(Q_LICHEN), ...started('c6-down-the-drains'), ...notStarted(Q_SHIFT) },
  },
  { text: 'The wheels. How are they?', next: 's06-ida-shift-wait', when: active(Q_SHIFT) },
  {
    text: 'The Forty Stone. How do we raise it?', next: 's06-ida-stone-start', action: { type: 'startQuest', quest: Q_STONE },
    when: { ...done(Q_SHIFT), ...notStarted(Q_STONE) },
  },
  { text: 'The stone. What do the tags need?', next: 's06-ida-stone-wait', when: active(Q_STONE) },
];
const idaGreetingsFirst: Greeting[] = [
  { when: onStage(Q_LOCKERS, 4), node: 's06-ida-lockers-turnin' },
  { when: onStage(Q_SHIFT, 5), node: 's06-ida-shift-turnin' },
  { when: onStage(Q_STONE, 4), node: 's06-ida-stone-choice' },
];
const idaNodes: Record<string, DialogueNode> = {
  's06-ida-lockers-start': {
    text: 'The Cistern barracks, on the west side of the pool. Nine lockers, and most of them are rot. Open three of them and bring up what\'s worth keeping.',
    options: [{ text: 'I\'ll open them.' }],
  },
  's06-ida-lockers-wait': {
    text: 'Three lockers in the barracks, west of the pool. Open them and come back to me.',
    options: [{ text: 'Going now.' }],
  },
  's06-ida-lockers-turnin': {
    text: 'The maps have a W.P. in the corner. Woad never signed anything else. Keep his tag. He\'d have wanted it used.',
    options: [{ text: 'I\'ll keep it.' }],
  },
  's06-ida-shift-start': {
    text: 'The wheels in the Backflow are sticking, and the echoes are still turning them. Go through the hatch in the Cistern wall and set four wheels right. Don\'t touch the seals.',
    options: [{ text: 'I\'ll set them.' }],
  },
  's06-ida-shift-wait': {
    text: 'Four wheels in the Backflow, around the flooded hall. Set each one right and let the echoes finish.',
    options: [{ text: 'Going down.' }],
  },
  's06-ida-shift-turnin': {
    text: 'All four set. The echoes have sat down in the silt, the way they were waiting to. Thank you. It is the least we could do for them.',
    options: [{ text: 'Glad it\'s done.' }],
  },
  's06-ida-stone-start': {
    text: 'Madder\'s tag, Woad\'s and Burnet\'s. Carry all three up to the plot at the top of the Deeps stairs, and peg it out. Then I\'ll need you to decide what goes under the names.',
    options: [{ text: 'I\'ll take them up.' }],
  },
  's06-ida-stone-wait': {
    text: 'The three tags, the plot at the top of the stairs, and then the stone. Keep going.',
    options: [{ text: 'Going.' }],
  },
  's06-ida-stone-choice': {
    text: 'The first line of Speedwell\'s letter, the one about the seal work, can go under the names. Or only the names, with my father above them. Which do you want?',
    options: [
      { text: 'Cut the letter under the names.', action: { type: 'setFlag', flag: FLAG_STONE, value: 'letter' } },
      { text: 'Only the names.', action: { type: 'setFlag', flag: FLAG_STONE, value: 'names' } },
    ],
  },
};

// Old Lichen (ch5). Starts Lichen's Name and takes the Burnet choice at his hedge.
const lichenTopics: DialogueOption[] = [
  {
    text: 'Burnet Tallow. Will you tell me about him?', next: 's06-lichen-start', action: { type: 'startQuest', quest: Q_LICHEN },
    when: { ...done(Q_LOCKERS), ...notStarted(Q_LICHEN) },
  },
  { text: 'Burnet, in the Tangle. Any word?', next: 's06-lichen-wait', when: active(Q_LICHEN) },
];
const lichenGreetingsFirst: Greeting[] = [
  { when: onStage(Q_LICHEN, 0), node: 's06-lichen-choice' },
  { when: onStage(Q_LICHEN, 1), node: 's06-lichen-turnin' },
];
const lichenNodes: Record<string, DialogueNode> = {
  's06-lichen-start': {
    text: 'Burnet Tallow is under the burdock in the Tangle, with a strip of bark for a marker. Go and look at him. Then come and find me, and I\'ll ask you a thing nobody has asked.',
    options: [{ text: 'I\'ll go and look.' }],
  },
  's06-lichen-wait': {
    text: 'Burnet\'s grave is under the burdock. Go and see it, and then come back here.',
    options: [{ text: 'Going.' }],
  },
  's06-lichen-choice': {
    text: 'Burnet said a name cut in bark is a fence, and he\'d had enough of fences. So you choose. Bark or stone.',
    options: [
      { text: 'Bark. Cut it into the Elder Privet, the Wildling way.', action: { type: 'setFlag', flag: FLAG_BURNET, value: 'privet' } },
      { text: 'Stone. Keep his name on the Forty Stone only.', action: { type: 'setFlag', flag: FLAG_BURNET, value: 'keep' } },
    ],
  },
  's06-lichen-turnin': {
    text: 'Then it\'s said, and it\'s kept. Thank you for going down to him. He\'s had nine years in the hedge, and he\'s had someone come.',
    options: [{ text: 'Goodbye, Lichen.' }],
  },
};

// Items. Name tags are quest items that stay in the pack until the stone.
const items: Record<string, ItemDef> = {
  's06-name-tag-madder': {
    id: 's06-name-tag-madder', name: 'Name Tag: Madder Wringer', icon: '🏷️', kind: 'misc', questItem: true, value: 0,
    examine: 'A stamped tin tag, scratched on the back. Stays in your pack until the stone goes up.',
  },
  's06-name-tag-woad': {
    id: 's06-name-tag-woad', name: 'Name Tag: Woad Plumbline', icon: '🏷️', kind: 'misc', questItem: true, value: 0,
    examine: 'A stamped tin tag, with a plumb-line stamp. Stays in your pack until the stone goes up.',
  },
  's06-name-tag-burnet': {
    id: 's06-name-tag-burnet', name: 'Name Tag: Burnet Tallow', icon: '🏷️', kind: 'misc', questItem: true, value: 0,
    examine: 'A stamped tin tag, wrapped in a strip of hedge bark. Stays in your pack until the stone goes up.',
  },
  's06-woads-plumbline': {
    id: 's06-woads-plumbline', name: 'Woad\'s Plumbline', icon: '📏', kind: 'trinket', slot: 'trinket',
    ilvl: 19, rarity: 'sprouted', stats: { agility: 1 }, effect: '+1 agility.', value: 722,
    examine: 'A surveyor\'s plumb-line with a brass stamp at the weight. It hangs true. It always has.',
  },
  's06-speedwells-caulk-tin': {
    id: 's06-speedwells-caulk-tin', name: 'Speedwell\'s Caulk Tin', icon: '🥫', kind: 'offhand', slot: 'offhand',
    ilvl: 25, rarity: 'blooming', stats: { endurance: 2, defense: 2 }, effect: '+2 endurance, +2 defense.', value: 2500,
    examine: 'A tin of seal paste, still soft inside. Nothing gets through.',
  },
};

// Quests. Each starts from a dialogue option above. Where the giver's start line is also the first talk, the
// first stage is the real objective (see the engine note in _common.md).
const quests: Record<string, QuestDef> = {
  [Q_TOOLS]: {
    id: Q_TOOLS, name: 'Forty Tools', giver: 'puddleby', zone: 'thatchford', level: 12, tier: 'side', chain: 'The Forty',
    stages: [
      { text: 'Climb to the Gutters\' north ledge, above the upper ladder, past the gutter rats.', objective: { type: 'reach', zone: 'deeps', x: -14, z: 80, r: 5 } },
      { text: 'Read the scratched grate on the north ledge.', objective: { type: 'interact', object: 's06-gutters-grate', count: 1 } },
      { text: 'Take what the grate said back to Dill Puddleby.', objective: { type: 'talk', npc: 'puddleby' } },
    ],
    reward: { gold: 60, items: [] },
  },
  [Q_LOCKERS]: {
    id: Q_LOCKERS, name: 'The Barracks Lockers', giver: 'ida', zone: 'keep', level: 19, tier: 'side', chain: 'The Forty',
    stages: [
      { text: 'Find the Cistern barracks, on the west side of the pool.', objective: { type: 'reach', zone: 'deeps', x: -20, z: 4, r: 6 } },
      { text: 'Open the first Pipewright locker.', objective: { type: 'interact', object: 's06-locker-1', count: 1 } },
      { text: 'Open the second Pipewright locker.', objective: { type: 'interact', object: 's06-locker-2', count: 1 } },
      { text: 'Open the third Pipewright locker.', objective: { type: 'interact', object: 's06-locker-3', count: 1 } },
      { text: 'Bring what the lockers held to Ida Gromwell.', objective: { type: 'talk', npc: 'ida' } },
    ],
    reward: { gold: 100, items: [{ item: 's06-name-tag-woad', count: 1 }, { item: 's06-woads-plumbline', count: 1 }] },
  },
  [Q_LICHEN]: {
    id: Q_LICHEN, name: 'Lichen\'s Name', giver: 'lichen', zone: 'hedgewood', level: 17, tier: 'side', chain: 'The Forty',
    stages: [
      { text: 'Choose, with Old Lichen, whether Burnet\'s name goes in bark or in stone.', objective: { type: 'choice', flag: FLAG_BURNET } },
      { text: 'Tell Old Lichen what you chose.', objective: { type: 'talk', npc: 'lichen' } },
    ],
    reward: { gold: 80, items: [{ item: 's06-name-tag-burnet', count: 1 }] },
  },
  [Q_SHIFT]: {
    id: Q_SHIFT, name: 'Finish Their Shift', giver: 'ida', zone: 'keep', level: 24, tier: 'side', chain: 'The Forty',
    stages: [
      { text: 'Go through the Cistern hatch and reach the Backflow.', objective: { type: 'reach', zone: 'deeps', x: 0, z: -50, r: 10 } },
      { text: 'Turn the first valve wheel.', objective: { type: 'interact', object: 's06-valve-wheel-1', count: 1 } },
      { text: 'Turn the second valve wheel.', objective: { type: 'interact', object: 's06-valve-wheel-2', count: 1 } },
      { text: 'Turn the third valve wheel.', objective: { type: 'interact', object: 's06-valve-wheel-3', count: 1 } },
      { text: 'Turn the fourth valve wheel.', objective: { type: 'interact', object: 's06-valve-wheel-4', count: 1 } },
      { text: 'Tell Ida Gromwell the wheels are set.', objective: { type: 'talk', npc: 'ida' } },
    ],
    reward: { gold: 150, items: [{ item: 'glaze-pot', count: 3 }] },
  },
  [Q_STONE]: {
    id: Q_STONE, name: 'The Forty Stone', giver: 'ida', zone: 'keep', level: 25, tier: 'main', chain: 'The Forty',
    stages: [
      { text: 'Carry Madder Wringer\'s name tag up to the stone plot.', objective: { type: 'collect', item: 's06-name-tag-madder', count: 1 }, takeItems: [{ item: 's06-name-tag-madder', count: 1 }] },
      { text: 'Carry Woad Plumbline\'s name tag up to the stone plot.', objective: { type: 'collect', item: 's06-name-tag-woad', count: 1 }, takeItems: [{ item: 's06-name-tag-woad', count: 1 }] },
      { text: 'Carry Burnet Tallow\'s name tag up to the stone plot.', objective: { type: 'collect', item: 's06-name-tag-burnet', count: 1 }, takeItems: [{ item: 's06-name-tag-burnet', count: 1 }] },
      { text: 'Peg out the stone plot at the top of the Deeps stairs.', objective: { type: 'interact', object: 's06-stone-plot', count: 1 } },
      { text: 'Ask Ida Gromwell what goes under the names: the letter, or only the names.', objective: { type: 'choice', flag: FLAG_STONE } },
      { text: 'Tell Dill Puddleby the stone is raised.', objective: { type: 'talk', npc: 'puddleby' } },
    ],
    reward: { gold: 200, items: [{ item: 's06-speedwells-caulk-tin', count: 1 }] },
  },
};

// Objects. Gutters grate, Cistern lockers, Backflow wheels, the Hedgewood grave, the stone plot and the Forty Stone.
const objects: Record<string, WorldObjectDef> = {
  's06-gutters-grate': {
    id: 's06-gutters-grate', zone: 'deeps', name: 'Scratched grate', x: 0, z: 95, model: 'generic', verb: 'Read',
    examine: 'An iron grate on the north ledge, scratched from the inside with something hard.',
    text: '"WATER AT THE KNEE. CAULK HOLDING. TELL MAM." A stamped tin tag is caught in the grate beside the line.',
    when: onStage(Q_TOOLS, 1), once: true, giveItem: { item: 's06-name-tag-madder', count: 1 },
  },
  's06-locker-1': {
    id: 's06-locker-1', zone: 'deeps', name: 'Pipewright locker', x: -20, z: 2, model: 'chest', verb: 'Open',
    examine: 'A Pipewright locker, its hinges gone to rust.',
    text: 'A pair of gloves gone stiff with silt, and a tally of water levels, all smudged.',
    when: active(Q_LOCKERS),
  },
  's06-locker-2': {
    id: 's06-locker-2', zone: 'deeps', name: 'Pipewright locker', x: -22, z: 6, model: 'chest', verb: 'Open',
    examine: 'A Pipewright locker. Someone has painted its number in white.',
    text: 'Empty but for a caulk brush with no bristles left.',
    when: active(Q_LOCKERS),
  },
  's06-locker-3': {
    id: 's06-locker-3', zone: 'deeps', name: 'Pipewright locker', x: -19, z: -4, model: 'chest', verb: 'Open',
    examine: 'A Pipewright locker, half full of mud.',
    text: 'Mud and a rotted tool roll. The rest of the locker is clean.',
    when: active(Q_LOCKERS),
  },
  's06-valve-wheel-1': {
    id: 's06-valve-wheel-1', zone: 'deeps', name: 'Valve wheel', x: -8, z: -44, model: 'valve', verb: 'Turn',
    examine: 'A brass valve wheel, bent a little on one spoke.',
    text: 'The wheel gives a quarter turn. Somewhere under the water, a voice says: "Sticking. Sticking. Hold it."',
    when: active(Q_SHIFT),
  },
  's06-valve-wheel-2': {
    id: 's06-valve-wheel-2', zone: 'deeps', name: 'Valve wheel', x: 8, z: -44, model: 'valve', verb: 'Turn',
    examine: 'A brass valve wheel, green where the water sits.',
    text: 'The wheel slips, then bites. The voice says: "Sticking. Hold it."',
    when: active(Q_SHIFT),
  },
  's06-valve-wheel-3': {
    id: 's06-valve-wheel-3', zone: 'deeps', name: 'Valve wheel', x: -8, z: -66, model: 'valve', verb: 'Turn',
    examine: 'A brass valve wheel with a Pipewright\'s mark on the hub.',
    text: 'The wheel turns a half and jams. The voice goes on: "Hold it. Hold it."',
    when: active(Q_SHIFT),
  },
  's06-valve-wheel-4': {
    id: 's06-valve-wheel-4', zone: 'deeps', name: 'Valve wheel', x: 8, z: -66, model: 'valve', verb: 'Turn',
    examine: 'The last of four valve wheels in the flooded hall.',
    text: 'The wheel sets square with a clank. The voice sighs: "Done, then," and goes quiet in the silt.',
    when: active(Q_SHIFT),
  },
  's06-burnet-grave': {
    id: 's06-burnet-grave', zone: 'hedgewood', name: 'Burnet\'s grave', x: -30, z: -40, model: 'grave', verb: 'Read',
    examine: 'A low mound under the burdock, with a strip of hedge bark for a marker. Someone keeps the leaves swept.',
    text: 'The bark is cut with one word: BURNET. Old Lichen tends this grave, and has done for a long time.',
  },
  's06-stone-plot': {
    id: 's06-stone-plot', zone: 'keep', name: 'Stone plot', x: -30, z: 22, model: 'generic', verb: 'Peg out',
    examine: 'A square of turned earth at the top of the Deeps stairs, with forty pegs in it.',
    text: 'You peg the corners and string the lines. The plot is ready for a stone.',
    when: active(Q_STONE),
  },
  's06-forty-stone-letter': {
    id: 's06-forty-stone-letter', zone: 'keep', name: 'The Forty Stone', x: -30, z: 22, model: 'stone', verb: 'Read',
    examine: 'A grey stone, cut in rows. Forty names, and one above them all.',
    text: 'Forty names cut in rows. Master Pipewright Gromwell above them, where the water can\'t reach. Primrose Thistle in the middle, where the sun reaches first. Pipewright Hob Mattock is among the names. Under the rows, in plain letters: "The seal work isn\'t right, and I have written that down twice."',
    when: { ...done(Q_STONE), ...flagIs(FLAG_STONE, 'letter') },
  },
  's06-forty-stone-names': {
    id: 's06-forty-stone-names', zone: 'keep', name: 'The Forty Stone', x: -30, z: 22, model: 'stone', verb: 'Read',
    examine: 'A grey stone, cut in rows. Forty names, and one above them all.',
    text: 'Forty names cut in rows. Master Pipewright Gromwell above them, where the water can\'t reach. Primrose Thistle in the middle, where the sun reaches first. Pipewright Hob Mattock is among the names.',
    when: { ...done(Q_STONE), ...flagIs(FLAG_STONE, 'names') },
  },
};

export const PACK: ContentPack = {
  id: 's06-the-forty',
  items,
  quests,
  objects,
  topics: { puddleby: dillTopics, ida: idaTopics, lichen: lichenTopics },
  greetingsFirst: { puddleby: dillGreetingsFirst, ida: idaGreetingsFirst, lichen: lichenGreetingsFirst },
  extraNodes: { puddleby: dillNodes, ida: idaNodes, lichen: lichenNodes },
};
