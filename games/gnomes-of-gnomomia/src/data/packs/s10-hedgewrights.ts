// Content pack s10-hedgewrights: storyline 10, "Clippings". Hedgewood (Clippings, the Log-Run, Webhollow, Elder Privet).
// Design: docs/design/gnomomia/storylines/10-hedgewrights.md.
import type { ContentPack, Condition, DialogueNode, DialogueOption } from '../../config';
import { look } from '../../config';

const Q_HEIGHT = 's10-the-height-post';
const Q_BOUGH = 's10-bough';
const Q_COUNT = 's10-crowns-count';
const Q_BARE = 's10-bareheaded';
const Q_PEACE = 's10-dead-wood';
const Q_FELLED = 's10-the-privet-haul';
const Q_AGAIN = 's10-height-post-again';

// Each Condition holds one field, so all() chains the rest through not-not (the engine note in _common.md).
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const active = (id: string): Condition => ({ quest: { id, status: 'active' } });
const notStarted = (id: string): Condition => ({ quest: { id, status: 'none' } });
const flagIs = (name: string, value: string): Condition => ({ flag: { name, value } });
const onStage = (id: string, stage: number): Condition => ({ questStage: { id, stage } });
const atLeast = (id: string, stage: number): Condition => ({ questAtLeast: { id, stage } });
const all = (...parts: Condition[]): Condition => {
  const [head, ...rest] = parts;
  return rest.length === 0 ? head : { ...head, not: { not: all(...rest) } };
};

// Betony Panwell: Clippings cook, widow of Reed Panwell.
const betonyNodes: Record<string, DialogueNode> = {
  hub: {
    hub: true,
    text: 'Eleven at this table. There were fourteen when I started cooking for it. Set one more plate and I won\'t ask who for.',
    options: [
      { text: 'Where do I start?', next: 'height-start', action: { type: 'startQuest', quest: Q_HEIGHT }, when: all(done('c5-elder-privet'), notStarted(Q_HEIGHT)) },
      { text: 'Tell me about the Mill road.', next: 'bareheaded-start', action: { type: 'startQuest', quest: Q_BARE }, when: all(done(Q_COUNT), notStarted(Q_BARE)) },
      { text: 'Goodbye.' },
    ],
  },
  'height-start': {
    text: 'The post by the sawpit has a notch for each birthday. Go and read it, then take what you see up to Alder.',
    options: [{ text: 'I\'ll look.' }],
  },
  'height-wait': {
    text: 'Read the height post by the sawpit, then go and tell Alder what it says.',
    options: [{ text: 'On my way.' }],
  },
  'bareheaded-start': {
    text: 'Reed died on the Sawdust Mill road three springs ago. The camp says Wildlings. I said so too, because someone had to be called. Juniper\'s hunters went after the trail. Ask her at Barkhollow.',
    options: [{ text: 'I\'ll go to Barkhollow.' }],
  },
  'bareheaded-wait': {
    text: 'Barkhollow is past the old hedge. Ask Juniper what her hunters found on the Mill road.',
    options: [{ text: 'Going.' }],
  },
  'widow-choice': {
    text: 'Juniper has told you about the trail. Now tell me, and I\'ll say it at the table. What do I tell the camp?',
    options: [
      { text: 'Tell her the raiders were Ferals.', next: 'choice-ferals', action: { type: 'setFlag', flag: 'widow', value: 'ferals' } },
      { text: 'Tell her it was Wildlings.', next: 'choice-blamed', action: { type: 'setFlag', flag: 'widow', value: 'blamed' } },
    ],
  },
  'choice-ferals': {
    text: 'Ferals. Burdock\'s lads, who went bareheaded to the Mill road. Then I\'ll say it out loud, and the crew can argue with me.',
    options: [{ text: 'Thank you, Betony.' }],
  },
  'choice-blamed': {
    text: 'Wildlings, then. The camp keeps its story, and I keep my plate set.',
    options: [{ text: 'I understand.' }],
  },
  'after-ferals': {
    text: 'Two plates again. I said the Ferals\' name at the table, and nobody got up. That was enough for one night.',
    options: [{ text: 'I\'m glad.' }],
  },
  'after-blamed': {
    text: 'Dig a grave for the Wildlings we blamed, and put a stone on it. Nobody else in this camp will. I eat at the back now.',
    options: [{ text: 'I\'ll see to it.' }],
  },
};

// Rue Spokeshave: faller. She called the run that killed Mallow Trowell.
const rueNodes: Record<string, DialogueNode> = {
  hub: {
    hub: true,
    text: 'Bough! Every log that comes down the run is one I called. Ask me anything else you like, but not about the run.',
    options: [
      { text: 'What does the run need?', next: 'bough-start', action: { type: 'startQuest', quest: Q_BOUGH }, when: all(done(Q_HEIGHT), notStarted(Q_BOUGH)) },
      { text: 'Goodbye.' },
    ],
  },
  'bough-start': {
    text: 'The run has killed crew since Mallow. Go up to the top of it, clear the web spiders off the chutes, then set the chock-stops. Call it when it\'s safe.',
    options: [{ text: 'I\'ll go up the run.' }],
  },
  'bough-wait': {
    text: 'Clear the spiders off the run, then set the chock-stops. Bring me the count when it\'s done.',
    options: [{ text: 'Going.' }],
  },
  'bough-turnin': {
    text: 'I called it. He heard me. He held the rope anyway. That\'s the trouble with the good ones. Keep his chock; you\'ve set the run right.',
    options: [{ text: 'I\'ll carry it.' }],
  },
  'escort-wait': {
    text: 'Keep the wagon on the road and don\'t stop at the Wildlings\' hedge. If I crack, I crack. Walk on.',
    options: [{ text: 'Walking.' }],
  },
};

// Tallyman Oakum: Crown tithe-counter. He signed the double-cut order after the King's Fall.
const oakumNodes: Record<string, DialogueNode> = {
  hub: {
    hub: true,
    text: 'The tithe is the tithe. It doesn\'t care who cut the logs, only that they\'re counted.',
    options: [
      { text: 'Count the tithe with me.', next: 'count-start', action: { type: 'startQuest', quest: Q_COUNT }, when: all(done(Q_BOUGH), notStarted(Q_COUNT)) },
      { text: 'Goodbye.' },
    ],
  },
  'count-start': {
    text: 'Ten hedge logs from the stack in the cart yard. Then weigh them at the scale, and bring the count back to me.',
    options: [{ text: 'I\'ll fetch the logs.' }],
  },
  'count-wait': {
    text: 'Ten logs from the stack, then the scale in the cart yard. I\'ll be here when you\'re done.',
    options: [{ text: 'Going.' }],
  },
  'count-turnin': {
    text: 'I signed it. I count what I signed. Count it with me, if you like. It comes out the same.',
    options: [{ text: 'It comes out the same.' }],
  },
};

// Canon NPC: Boss Alder Splitwell. Hub options and turn-in lines only; the canon pack owns the rest.
const splitwellTopics: DialogueOption[] = [
  { text: 'Show me which privet the Crown wants cut.', next: 'privet-peace-start', action: { type: 'startQuest', quest: Q_PEACE }, when: all(flagIs('hedge', 'peace'), done('c5-heartwood'), done(Q_BARE), notStarted(Q_PEACE)) },
  { text: 'Show me which privet the Crown wants cut.', next: 'privet-felled-start', action: { type: 'startQuest', quest: Q_FELLED }, when: all(flagIs('hedge', 'felled'), done('c5-heartwood'), done(Q_BARE), notStarted(Q_FELLED)) },
  { text: 'Tell me what the Charter really says.', next: 'again-start', action: { type: 'startQuest', quest: Q_AGAIN }, when: all(done(Q_PEACE), notStarted(Q_AGAIN)) },
  { text: 'Tell me what the Charter really says.', next: 'again-start', action: { type: 'startQuest', quest: Q_AGAIN }, when: all(done(Q_FELLED), notStarted(Q_AGAIN)) },
];

const splitwellExtra: Record<string, DialogueNode> = {
  's10-alder-height': {
    text: 'Trees grow back. Gnomes don\'t. Top notch is his, at nine. I don\'t say his name at table.',
    options: [{ text: 'I understand.' }],
  },
  'privet-peace-start': {
    text: 'Eight dead privet trunks in the outer hedge, marked with Burdock\'s ribbons. Cut only those. Then take the clippings to the mulch heap and tell me it\'s done.',
    options: [{ text: 'Dead wood only.' }],
  },
  'privet-felled-start': {
    text: 'Burdock\'s Tangle won\'t stop the Privet. Cut the Elder Privet down at the hedge centre. Take its heartwood chips, and bring Rue\'s wagon home.',
    options: [{ text: 'I\'ll cut it.' }],
  },
  's10-alder-peace-wait': {
    text: 'Eight trunks with Burdock\'s ribbons, then the mulch heap at the north end. Go on.',
    options: [{ text: 'Going.' }],
  },
  's10-alder-felled-wait': {
    text: 'The stump in the Elder Privet, then the chips from it, then Rue\'s wagon home. Hold the road.',
    options: [{ text: 'Going.' }],
  },
  's10-alder-peace-end': {
    text: 'It says keep the Bough. It doesn\'t say cut the lot. Take the dead wood, leave the living, and the hedge pays you back for three hundred years.',
    options: [{ text: 'I\'ll remember it.' }],
  },
  's10-alder-felled-end': {
    text: 'Stump\'s cut. Chips are on the wagon. I\'ll sit with it a while.',
    options: [{ text: 'Goodbye, Boss.' }],
  },
  'again-start': {
    text: 'Walk to the post with me. Read the top notch, then the bark above it. Then tell me what you think I should carve.',
    options: [{ text: 'Lead on.' }],
  },
  's10-alder-again-wait': {
    text: 'The height post, then my choice for you. Read the top notch first.',
    options: [{ text: 'Going.' }],
  },
  's10-alder-fen': {
    text: 'My son walked into the hedge at nine. You\'ll carry this up to him, or you\'ll keep it on the post. Choose.',
    options: [
      { text: 'Carry his words up the hedge to Fen.', action: { type: 'setFlag', flag: 'fen', value: 'word' } },
      { text: 'Keep them on the post.', action: { type: 'setFlag', flag: 'fen', value: 'silent' } },
    ],
  },
};

const fenTopics: DialogueOption[] = [
  { text: 'Your father sent word up the hedge.', next: 's10-fen-word', when: flagIs('fen', 'word') },
];
const fenExtra: Record<string, DialogueNode> = {
  's10-fen-word': {
    text: 'He said my name? Then tell him the wren isn\'t finished. I\'ll bring it down when it is.',
    options: [{ text: 'I\'ll tell him.' }],
  },
};

// Canon NPC: Juniper Quickstring. Her hunters tracked the raiders to the Ferals and she hasn't told the camp.
const juniperGreetings = [{ when: onStage(Q_BARE, 2), node: 's10-juniper-trail' }];
const juniperExtra: Record<string, DialogueNode> = {
  's10-juniper-trail': {
    text: 'The raiders had no hats. Feral lads, not Wildlings. Burdock threw them out herself. Nobody asked her which side she\'d rather they blamed.',
    options: [{ text: 'Betony should hear this.' }],
  },
};

export const PACK: ContentPack = {
  id: 's10-hedgewrights',

  items: {
    's10-mallows-chock': {
      id: 's10-mallows-chock', name: 'Mallow\'s Chock', icon: '🪵', kind: 'trinket', slot: 'trinket',
      ilvl: 16, rarity: 'sprouted', stats: { endurance: 1 }, value: 512,
      examine: 'A notched wedge of hedge-oak. "He carried it on the run. It stopped the run once."',
    },
    's10-splitwells-bucksaw': {
      id: 's10-splitwells-bucksaw', name: 'Splitwell\'s Bucksaw', icon: '🪚', kind: 'weapon', slot: 'weapon',
      ilvl: 17, rarity: 'blooming', damageType: 'slash', hands: 1, weaponClass: 'melee',
      stats: { strength: 1, critDamage: 0.1 }, value: 1156,
      examine: 'Two handles and one sawyer. Alder never once let go of his end.',
    },
    's10-hedge-log': {
      id: 's10-hedge-log', name: 'Hedge log', icon: '🌲', kind: 'misc', questItem: true, stackable: true, value: 0,
      examine: 'A length of hedge-oak, cut for the tithe. It is counted before it is burned.',
    },
    's10-privet-chip': {
      id: 's10-privet-chip', name: 'Privet heartwood chip', icon: '🍂', kind: 'misc', questItem: true, stackable: true, value: 0,
      examine: 'A chip of Elder Privet heartwood. It smells sweet, like a hedge in flower.',
    },
  },

  spawns: [
    { zone: 'hedgewood', enemy: 'web-spider', x: 52, z: -34, count: 6, spread: 6 },
    {
      zone: 'hedgewood', enemy: 'wildling-scout', x: -12, z: -20, count: 3, spread: 6,
      when: all(flagIs('hedge', 'felled'), onStage(Q_FELLED, 3)),
    },
  ],

  npcs: {
    's10-betony': {
      id: 's10-betony', name: 'Betony Panwell', look: look(0x7a3b5a, 0xc9a26b, null, { dress: true }), zone: 'hedgewood', x: 44, z: 40, wander: 1,
      greetings: [
        { when: onStage(Q_BARE, 3), node: 'widow-choice' },
        { when: active(Q_BARE), node: 'bareheaded-wait' },
        { when: active(Q_HEIGHT), node: 'height-wait' },
        { when: all(flagIs('widow', 'ferals'), atLeast(Q_AGAIN, 1)), node: 'after-ferals' },
        { when: all(flagIs('widow', 'blamed'), atLeast(Q_AGAIN, 1)), node: 'after-blamed' },
        { node: 'hub' },
      ],
      nodes: betonyNodes,
      examine: 'Reed Panwell\'s widow. She cooks for the whole camp and lays one plate more than there are crew.',
    },
    's10-rue': {
      id: 's10-rue', name: 'Rue Spokeshave', look: look(0x3b5a7a, 0xb08a5a, null), zone: 'hedgewood', x: 40, z: 46, wander: 2,
      // During the escort she walks the log-wagon out of the Elder Privet; she is at the stump until then.
      placements: [{ zone: 'hedgewood', x: -44, z: -50, when: onStage(Q_FELLED, 3) }],
      greetings: [
        { when: onStage(Q_BOUGH, 3), node: 'bough-turnin' },
        { when: active(Q_BOUGH), node: 'bough-wait' },
        { when: onStage(Q_FELLED, 3), node: 'escort-wait' },
        { node: 'hub' },
      ],
      nodes: rueNodes,
      examine: 'A faller with a chock in her apron pocket. She won\'t stand under a log-run now.',
    },
    's10-oakum': {
      id: 's10-oakum', name: 'Tallyman Oakum', look: look(0x2a2a3a, 0x6a6a7a, 0x9a9a9a), zone: 'hedgewood', x: 46, z: 58, wander: 0,
      greetings: [
        { when: onStage(Q_COUNT, 3), node: 'count-turnin' },
        { when: active(Q_COUNT), node: 'count-wait' },
        { node: 'hub' },
      ],
      nodes: oakumNodes,
      examine: 'A Crown tallyman with ink on both cuffs. He counts everything twice.',
    },
  },

  quests: {
    [Q_HEIGHT]: {
      id: Q_HEIGHT, name: 'The Height Post', giver: 's10-betony', zone: 'hedgewood', level: 16, tier: 'side', chain: 'Clippings',
      stages: [
        { text: 'Talk to Betony Panwell at the Clippings table.', objective: { type: 'talk', npc: 's10-betony' } },
        { text: 'Read the height post by the sawpit.', objective: { type: 'interact', object: 's10-height-post', count: 1 } },
        { text: 'Tell Boss Alder what the notches say.', objective: { type: 'talk', npc: 'splitwell' } },
      ],
      reward: { gold: 40, items: [{ item: 'rose-draught', count: 2 }] },
    },
    [Q_BOUGH]: {
      id: Q_BOUGH, name: 'Bough!', giver: 's10-rue', zone: 'hedgewood', level: 17, tier: 'side', chain: 'Clippings',
      stages: [
        { text: 'Reach the top of the Log-Run above Clippings.', objective: { type: 'reach', zone: 'hedgewood', x: 50, z: -28, r: 12 } },
        { text: 'Kill four web spiders on the run.', objective: { type: 'kill', enemy: 'web-spider', count: 4 } },
        { text: 'Set the three chock-stops along the run.', objective: { type: 'interact', object: 's10-chock-stop', count: 3 } },
        { text: 'Tell Rue the run is set.', objective: { type: 'talk', npc: 's10-rue' } },
      ],
      reward: { gold: 60, items: [{ item: 's10-mallows-chock', count: 1 }] },
    },
    [Q_COUNT]: {
      id: Q_COUNT, name: 'The Crown\'s Count', giver: 's10-oakum', zone: 'hedgewood', level: 17, tier: 'side', chain: 'Clippings',
      stages: [
        { text: 'Talk to Tallyman Oakum in the cart yard.', objective: { type: 'talk', npc: 's10-oakum' } },
        { text: 'Collect ten hedge logs from the stack.', objective: { type: 'collect', item: 's10-hedge-log', count: 10 } },
        { text: 'Weigh the logs at the tithe scale in the cart yard.', objective: { type: 'interact', object: 's10-tithe-scale', count: 1 } },
        { text: 'Count the tithe back with Oakum.', objective: { type: 'talk', npc: 's10-oakum' }, takeItems: [{ item: 's10-hedge-log', count: 10 }] },
      ],
      reward: { gold: 80, items: [] },
    },
    [Q_BARE]: {
      id: Q_BARE, name: 'Bareheaded', giver: 's10-betony', zone: 'hedgewood', level: 18, tier: 'side', chain: 'Clippings',
      stages: [
        { text: 'Talk to Betony about the Mill road.', objective: { type: 'talk', npc: 's10-betony' } },
        { text: 'Reach Barkhollow.', objective: { type: 'reach', zone: 'hedgewood', x: 80, z: -20, r: 14 } },
        { text: 'Talk to Juniper Quickstring about her hunters\' trail.', objective: { type: 'talk', npc: 'juniper' } },
        { text: 'Decide with Betony what the camp is told.', objective: { type: 'choice', flag: 'widow' } },
      ],
      reward: { gold: 70, items: [] },
    },
    [Q_PEACE]: {
      id: Q_PEACE, name: 'Dead Wood', giver: 'splitwell', zone: 'hedgewood', level: 19, tier: 'side', chain: 'Clippings',
      stages: [
        { text: 'Talk to Boss Alder about the privet.', objective: { type: 'talk', npc: 'splitwell' } },
        { text: 'Cut the eight dead privet trunks marked with Burdock\'s ribbons.', objective: { type: 'interact', object: 's10-dead-privet', count: 8 } },
        { text: 'Take the clippings to the mulch heap.', objective: { type: 'interact', object: 's10-mulch-heap', count: 1 } },
        { text: 'Tell Alder the dead wood is cut.', objective: { type: 'talk', npc: 'splitwell' } },
      ],
      reward: { gold: 90, items: [] },
    },
    [Q_FELLED]: {
      id: Q_FELLED, name: 'The Privet Haul', giver: 'splitwell', zone: 'hedgewood', level: 19, tier: 'side', chain: 'Clippings',
      stages: [
        { text: 'Talk to Boss Alder about the Elder Privet.', objective: { type: 'talk', npc: 'splitwell' } },
        { text: 'Cut the Elder Privet stump at the hedge centre.', objective: { type: 'interact', object: 's10-privet-stump', count: 1 } },
        { text: 'Collect twelve privet heartwood chips from the stump.', objective: { type: 'collect', item: 's10-privet-chip', count: 12 } },
        { text: 'Escort Rue\'s log-wagon to Clippings.', objective: { type: 'escort', npc: 's10-rue', zone: 'hedgewood', x: 40, z: 40, r: 8 } },
        { text: 'Tell Alder the wagon is home.', objective: { type: 'talk', npc: 'splitwell' }, takeItems: [{ item: 's10-privet-chip', count: 12 }] },
      ],
      reward: { gold: 90, items: [] },
    },
    [Q_AGAIN]: {
      id: Q_AGAIN, name: 'The Height Post, Again', giver: 'splitwell', zone: 'hedgewood', level: 20, tier: 'main', chain: 'Clippings',
      stages: [
        { text: 'Walk to the height post with Boss Alder.', objective: { type: 'talk', npc: 'splitwell' } },
        { text: 'Read the height post by the sawpit.', objective: { type: 'interact', object: 's10-height-post', count: 1 } },
        { text: 'Choose what Alder carries up to Fen.', objective: { type: 'choice', flag: 'fen' } },
      ],
      reward: { gold: 150, items: [{ item: 's10-splitwells-bucksaw', count: 1 }] },
    },
  },

  objects: {
    's10-height-post': {
      id: 's10-height-post', zone: 'hedgewood', name: 'Height post', x: 36, z: 30,
      model: 'post', color: 0x8a6a3a, verb: 'Read',
      examine: 'A post by the sawpit, notched for each birthday. The top notch is the nine-year-old\'s, and above it there is only bark.',
      text: 'Notches climb the post one by one. The top one is Fen\'s. Above it, only bark.',
    },
    's10-chock-stop': {
      id: 's10-chock-stop', zone: 'hedgewood', name: 'Chock-stop', x: 46, z: -6,
      model: 'stone', color: 0x6e5f49, verb: 'Set',
      examine: 'A hedge-oak wedge on the Log-Run, meant to stop a chute of logs. One of them failed two summers ago.',
      text: 'You drive the wedge home. The run holds for now.',
    },
    's10-log-stack': {
      id: 's10-log-stack', zone: 'hedgewood', name: 'Stack of hedge logs', x: 56, z: 58,
      model: 'cart', color: 0x8a6a3a, verb: 'Take',
      examine: 'Hedge logs stacked for the tithe, waiting to be counted.',
      text: 'You take a hedge log from the stack.',
      giveItem: { item: 's10-hedge-log', count: 1 },
    },
    's10-tithe-scale': {
      id: 's10-tithe-scale', zone: 'hedgewood', name: 'Tithe scale', x: 52, z: 62,
      model: 'trough', color: 0x9a9a9a, verb: 'Weigh',
      examine: 'A beam scale in the cart yard, where the tithe logs are counted and weighed.',
      text: 'The beam settles on the count.',
    },
    's10-mulch-heap': {
      id: 's10-mulch-heap', zone: 'hedgewood', name: 'Mulch heap', x: 50, z: 22,
      model: 'generic', color: 0x5a4632, scale: 2, verb: 'Feed',
      examine: 'The clippings heap at the north end of the camp. The Hedgewrights used to pile it for the tithe.',
      text: 'The clippings go back to the hedge roots instead of the tithe-pile.',
    },
    's10-dead-privet': {
      id: 's10-dead-privet', zone: 'hedgewood', name: 'Dead privet trunk', x: -56, z: -52,
      model: 'generic', color: 0x7a6a4a, scale: 1.2, verb: 'Cut',
      examine: 'A dead Elder Privet trunk with one of Burdock\'s ribbons tied to it. Only dead wood may be cut here.',
      text: 'You cut the dead trunk down and leave the ribbon on the stump.',
    },
    's10-privet-stump': {
      id: 's10-privet-stump', zone: 'hedgewood', name: 'Privet stump', x: -46, z: -60,
      model: 'stone', color: 0x8a7a5a, scale: 1.5, verb: 'Chip',
      examine: 'The cut Elder Privet. New sprouts have not yet come up around the base. Its heartwood smells sweet.',
      text: 'You chip a privet heartwood fragment from the stump.',
      giveItem: { item: 's10-privet-chip', count: 1 },
    },
  },

  greetingsFirst: {
    splitwell: [
      { when: onStage(Q_HEIGHT, 2), node: 's10-alder-height' },
      { when: onStage(Q_PEACE, 3), node: 's10-alder-peace-end' },
      { when: onStage(Q_FELLED, 4), node: 's10-alder-felled-end' },
      { when: onStage(Q_AGAIN, 2), node: 's10-alder-fen' },
      { when: active(Q_PEACE), node: 's10-alder-peace-wait' },
      { when: active(Q_FELLED), node: 's10-alder-felled-wait' },
      { when: active(Q_AGAIN), node: 's10-alder-again-wait' },
    ],
    juniper: juniperGreetings,
  },

  topics: {
    splitwell: splitwellTopics,
    fen: fenTopics,
  },

  extraNodes: {
    splitwell: splitwellExtra,
    fen: fenExtra,
    juniper: juniperExtra,
  },
};
