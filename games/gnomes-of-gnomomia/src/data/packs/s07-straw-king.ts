// Content pack s07-straw-king: storyline 07, "The Straw King". Cloverfield (Scarecrow Rise, Stook Hollow, Honeydew lofts).
// Design: docs/design/gnomomia/storylines/07-straw-king.md.
import type { ContentPack, Condition, DialogueNode } from '../../config';
import { look } from '../../config';

const Q_KING = 's07-the-straw-king';
const Q_RITES = 's07-old-rites';
const Q_FRESH = 's07-fresh-straw';
const Q_GARDENER = 's07-gardener-who-forgot';
const Q_DRESS = 's07-dressing-the-king';
const Q_CHOICE = 's07-the-kings-choice';

// Shared gating helpers. "Started" means the quest is done or active; "not started" is its negation.
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const active = (id: string): Condition => ({ quest: { id, status: 'active' } });
const notStarted = (id: string): Condition => ({ not: { questAtLeast: { id, stage: 0 } } });

const flagIs = (name: string, value: string): Condition => ({ flag: { name, value } });
const onStage = (id: string, stage: number): Condition => ({ questStage: { id, stage } });

// Clary Rakehook: Sodbury farmhand.
const claryNodes: Record<string, DialogueNode> = {
  hub: {
    hub: true,
    text: 'Straw\'s in the ruts again. Rain\'s rotting it from the top, and nobody\'s been up to dress him.',
    options: [
      { text: 'Where do I start?', next: 'straw-start', action: { type: 'startQuest', quest: Q_KING }, when: { ...done('c4-straw-king'), ...notStarted(Q_KING) } },
      { text: 'Does the farm need hands?', next: 'fresh-start', action: { type: 'startQuest', quest: Q_FRESH }, when: { ...done(Q_RITES), ...notStarted(Q_FRESH) } },
      { text: 'Goodbye.' },
    ],
  },
  'straw-start': {
    text: 'Up the Rise, to the King. Touch the inscription, then clear the wights off his legs. Come find me after.',
    options: [{ text: 'Right.' }],
  },
  'straw-wait': {
    text: 'Six wights on the Rise, I\'d guess. Clear them, and then come and tell me he\'s still standing.',
    options: [{ text: 'Will do.' }],
  },
  'straw-turnin': {
    text: 'He\'s still standing, then. Thank you. Rain\'s still getting into his top; I\'ll keep an eye on the road.',
    options: [{ text: 'Glad to help.' }],
  },
  'fresh-start': {
    text: 'Honeydew\'s ranch has four lofts, and her keys hang by the gate. Open every loft door, and bring me the straw you find. Eight bundles, bound the old way.',
    options: [{ text: 'I\'ll go now.' }],
  },
  'fresh-wait': {
    text: 'Honeydew\'s lofts are on the ranch, north of the pens. Bring me eight bundles of sheaf-straw.',
    options: [{ text: 'Going.' }],
  },
  'fresh-turnin': {
    text: 'Eight bundles, bound right. Good. You\'ve a steady hand for it.',
    options: [{ text: 'Thanks, Clary.' }],
  },
  'after-tended': {
    text: 'Straw\'s stopped coming down the road. I walked it twice to be sure.',
    options: [
      { text: 'Did you ever tie the knot wrong?', next: 'clary-secret' },
      { text: 'Goodbye.' },
    ],
  },
  'clary-secret': {
    text: 'Last spring. I tied it wrong, and the King sagged that week. I never said so. I\'m saying so now.',
    options: [{ text: 'Thank you for telling me.' }],
  },
};

// Comfrey Hayfork: Sheafkeeper at Stook Hollow.
const comfreyNodes: Record<string, DialogueNode> = {
  hub: {
    hub: true,
    text: 'Stook Hollow is quiet tonight. I still set out a second cup, though nobody sits in it.',
    options: [
      { text: 'Ask about the rite-posts.', next: 'rites-start', action: { type: 'startQuest', quest: Q_RITES }, when: { ...done(Q_KING), ...notStarted(Q_RITES) } },
      { text: 'Where did your mother learn the knot?', next: 'gardener-start', action: { type: 'startQuest', quest: Q_GARDENER }, when: { ...done(Q_FRESH), ...notStarted(Q_GARDENER) } },
      { text: 'Dress the King with me.', next: 'dressing-start', action: { type: 'startQuest', quest: Q_DRESS }, when: { ...done(Q_GARDENER), ...notStarted(Q_DRESS) } },
      { text: 'What is the choice about the King?', next: 'king-start', action: { type: 'startQuest', quest: Q_CHOICE }, when: { ...done(Q_DRESS), ...notStarted(Q_CHOICE) } },
      { text: 'Goodbye.' },
    ],
  },
  'rites-start': {
    text: 'Three posts up the Rise, three knots. My mother tied the first. Count them, then tell me he\'s only straw.',
    options: [{ text: 'I\'ll count them.' }],
  },
  'rites-wait': {
    text: 'Three rite-posts on the Rise path, with the knot carved on each. Count them for me.',
    options: [{ text: 'On my way.' }],
  },
  'rites-turnin': {
    text: 'Three knots counted, and you didn\'t laugh at any of them. Thank you. Here is the honeydew for your trouble.',
    options: [{ text: 'You\'re welcome.' }],
  },
  'gardener-start': {
    text: 'My mother learned it from hers, and the Charter\'s clerks wrote down something else. Go to Birdbath Keep and ask the Archivist what the Record says.',
    options: [{ text: 'I\'ll go to the Keep.' }],
  },
  'gardener-wait': {
    text: 'Birdbath Keep first. Archivist Inkcap keeps the Straw Record. Ask him for it, and then come back to me.',
    options: [{ text: 'Going now.' }],
  },
  'dressing-start': {
    text: 'The King\'s arms need binding, and there are four bundles to tie on him. Hold the Rise while I work. The wights come in waves.',
    options: [{ text: 'I\'ll hold the Rise.' }],
  },
  'dressing-wait': {
    text: 'Go up the Rise and keep the wights off him until the bundles are on.',
    options: [{ text: 'Going up.' }],
  },
  'dressing-turnin': {
    text: 'He\'s standing. Not for long, mind. Choose how.',
    options: [{ text: 'I\'ll think on it.' }],
  },
  'king-start': {
    text: 'Go and look at him, and you\'ll see the trouble. I\'ll be here when you\'re back.',
    options: [{ text: 'Going to look.' }],
  },
  'king-wait': {
    text: 'Go and look at the King. Gleaner\'s circling, and I\'d like to know what you think before I decide.',
    options: [{ text: 'Going now.' }],
  },
  choice: {
    text: 'Tie him the old way and he stands another harvest. Or leave him to the crows. Gleaner has been circling since the straw started coming down. They\'ll keep him up after a fashion.',
    options: [
      { text: 'Tie him the old way, with the cord.', next: 'choice-tended', action: { type: 'setFlag', flag: 'straw', value: 'tended' } },
      { text: 'Let the crows roost.', next: 'choice-roosted', action: { type: 'setFlag', flag: 'straw', value: 'roosted' } },
    ],
  },
  'choice-tended': {
    text: 'Then we tie him properly. Come back when I\'ve knotted the cord, and I\'ll give you the other half of this.',
    options: [{ text: 'I\'ll come back.' }],
  },
  'choice-roosted': {
    text: 'Then a loose knot, and the birds can have him. I\'m going to the Keep to look for my sister. Come back when you\'re done here.',
    options: [{ text: 'Good luck, Comfrey.' }],
  },
  'turnin-tended': {
    text: 'Tied the old way, with the cord. It was my mother\'s, and she\'d want it on someone who\'ll use it. Take it. Keep, keep.',
    options: [{ text: 'Thank you.', action: { type: 'giveItem', item: 's07-sheaf-cord', count: 1 } }],
  },
  'turnin-roosted': {
    text: 'A loose knot, and Gleaner has her roost. Take these flasks for the road to the Keep. I\'m going to look for my sister.',
    options: [{ text: 'Safe travels.', action: { type: 'giveItem', item: 'honeydew-flask', count: 3 } }],
  },
};

// Marjoram Hayfork: Comfrey's sister, hinted at the rope-walks. Shown after the Straw Record.
const marjoramNodes: Record<string, DialogueNode> = {
  hub: {
    text: 'The rope-walks, under the Ward. Two pairs of hands tie the knot. I was the other pair.',
    options: [{ text: 'Where are you?' }],
  },
};

export const PACK: ContentPack = {
  id: 's07-straw-king',

  items: {
    's07-sheaf-straw': {
      id: 's07-sheaf-straw', name: 'Sheaf-straw', icon: '🌾', kind: 'misc', questItem: true, stackable: true,
      ilvl: 13, rarity: 'plain', value: 0,
      examine: 'Good straw, bound the old way. Smells of summer. The knot won\'t hold on anything else.',
    },
    's07-sheaf-cord': {
      id: 's07-sheaf-cord', name: 'Sheaf-cord', icon: '🧶', kind: 'trinket', slot: 'trinket',
      ilvl: 15, rarity: 'sprouted', stats: { bloomHealing: 0.1 }, effect: '+10% Bloom healing', value: 450,
      examine: 'Plaited from the King\'s old cord. Sheafkeepers tie one on each new gnome: "Keep, keep."',
    },
  },

  enemies: {
    's07-damp-wight': {
      id: 's07-damp-wight', name: 'Damp-wight', level: 15, rank: 'normal', family: 'plant',
      damageType: 'crush', aggressive: true, ward: { rain: 0.5 },
      loot: [], gold: [6, 10], model: 'straw', color: 0xc8b04a, scale: 1,
      respawnSeconds: 30,
      examine: 'Wet, sour straw in the shape of a man. Its drip leaves whatever it touches sluggish for a while.',
      wants: 'To keep the King standing while the rot takes him.',
    },
  },

  npcs: {
    's07-clary': {
      id: 's07-clary', name: 'Clary Rakehook', look: look(0x6b4a2a, 0x7a9e3a, 0x8a5a2b), zone: 'cloverfield', x: 9, z: 0, wander: 3,
      greetings: [
        { when: onStage(Q_KING, 2), node: 'straw-turnin' },
        { when: onStage(Q_FRESH, 3), node: 'fresh-turnin' },
        { when: active(Q_KING), node: 'straw-wait' },
        { when: active(Q_FRESH), node: 'fresh-wait' },
        { when: flagIs('straw', 'tended'), node: 'after-tended' },
        { node: 'hub' },
      ],
      nodes: claryNodes,
      examine: 'A Sodbury farmhand with straw in his boots. He keeps looking up at the Rise.',
    },
    's07-comfrey': {
      id: 's07-comfrey', name: 'Comfrey Hayfork', look: look(0x7a3b5a, 0xc9a26b, null, { dress: true }), zone: 'cloverfield', x: -45, z: 78, wander: 0,
      greetings: [
        { when: onStage(Q_RITES, 2), node: 'rites-turnin' },
        { when: active(Q_RITES), node: 'rites-wait' },
        { when: active(Q_GARDENER), node: 'gardener-wait' },
        { when: onStage(Q_DRESS, 3), node: 'dressing-turnin' },
        { when: active(Q_DRESS), node: 'dressing-wait' },
        { when: onStage(Q_CHOICE, 1), node: 'choice' },
        { when: { ...onStage(Q_CHOICE, 2), ...flagIs('straw', 'tended') }, node: 'turnin-tended' },
        { when: { ...onStage(Q_CHOICE, 2), ...flagIs('straw', 'roosted') }, node: 'turnin-roosted' },
        { when: active(Q_CHOICE), node: 'king-wait' },
        { node: 'hub' },
      ],
      nodes: comfreyNodes,
      examine: 'A Sheafkeeper with a two-handed knot tied on her belt. She sets out a second cup at the Hollow every evening.',
    },
    's07-marjoram': {
      id: 's07-marjoram', name: 'Marjoram Hayfork', look: look(0x3b5a7a, 0xb08a5a, null, { dress: true }), zone: 'keep', x: -14, z: 36, wander: 2,
      // Hint only: she shows up in the Pedestal Ward once the Archive has named her.
      hidden: { not: { questAtLeast: { id: Q_GARDENER, stage: 2 } } },
      greetings: [{ node: 'hub' }],
      nodes: marjoramNodes,
      examine: 'Comfrey\'s sister, or someone who looks very like her. She is not sure where she left the rope.',
    },
  },

  quests: {
    [Q_KING]: {
      id: Q_KING, name: 'The Straw King', giver: 's07-clary', zone: 'cloverfield', level: 13, tier: 'side', chain: 'The Straw King',
      stages: [
        { text: 'Touch the inscription on Scarecrow Rise and see what the straw is doing.', objective: { type: 'interact', object: 's07-straw-king', count: 1 } },
        { text: 'Clear six straw-wights off the Rise.', objective: { type: 'kill', enemy: 'straw-wight', count: 6 } },
        { text: 'Tell Clary the King is still standing.', objective: { type: 'talk', npc: 's07-clary' } },
      ],
      reward: { gold: 40, items: [] },
    },
    [Q_RITES]: {
      id: Q_RITES, name: 'Old Rites', giver: 's07-comfrey', zone: 'cloverfield', level: 13, tier: 'side', chain: 'The Straw King',
      stages: [
        { text: 'Talk to Comfrey Hayfork at Stook Hollow about the rite-posts.', objective: { type: 'talk', npc: 's07-comfrey' } },
        { text: 'Interact with three rite-posts on Scarecrow Rise.', objective: { type: 'interact', object: 's07-rite-post', count: 3 } },
        { text: 'Report the three knots to Comfrey.', objective: { type: 'talk', npc: 's07-comfrey' } },
      ],
      reward: { gold: 75, items: [{ item: 'honeydew-flask', count: 2 }] },
    },
    [Q_FRESH]: {
      id: Q_FRESH, name: 'Fresh Straw', giver: 's07-clary', zone: 'cloverfield', level: 14, tier: 'side', chain: 'The Straw King',
      stages: [
        { text: 'Talk to Clary about the lofts at Honeydew Ranch.', objective: { type: 'talk', npc: 's07-clary' } },
        { text: 'Open the four loft doors at Honeydew Ranch.', objective: { type: 'interact', object: 's07-loft-door', count: 4 } },
        { text: 'Gather eight bundles of sheaf-straw.', objective: { type: 'collect', item: 's07-sheaf-straw', count: 8 } },
        { text: 'Bring the sheaf-straw to Clary.', objective: { type: 'talk', npc: 's07-clary' }, takeItems: [{ item: 's07-sheaf-straw', count: 8 }] },
      ],
      reward: { gold: 100, items: [] },
    },
    [Q_GARDENER]: {
      id: Q_GARDENER, name: 'The Gardener Who Forgot', giver: 's07-comfrey', zone: 'cloverfield', level: 14, tier: 'side', chain: 'The Straw King',
      stages: [
        { text: 'Ask Comfrey where her mother learned the knot.', objective: { type: 'talk', npc: 's07-comfrey' } },
        { text: 'Reach Birdbath Keep.', objective: { type: 'reach', zone: 'keep', x: 0, z: 20, r: 14 } },
        { text: 'Talk to Archivist Inkcap about the Straw Record.', objective: { type: 'talk', npc: 'inkcap' } },
        { text: 'Read the Straw Record on the shelf beside Bartholomew\'s Charter.', objective: { type: 'interact', object: 's07-straw-record', count: 1 } },
        { text: 'Tell Inkcap what the Record says.', objective: { type: 'talk', npc: 'inkcap' } },
      ],
      reward: { gold: 125, items: [] },
    },
    [Q_DRESS]: {
      id: Q_DRESS, name: 'Dressing the King', giver: 's07-comfrey', zone: 'cloverfield', level: 15, tier: 'side', chain: 'The Straw King',
      stages: [
        { text: 'Reach Scarecrow Rise with Comfrey\'s bundles.', objective: { type: 'reach', zone: 'cloverfield', x: -60, z: 95, r: 14 } },
        {
          text: 'Hold the Rise for ninety seconds against the wights.',
          objective: {
            type: 'defend', zone: 'cloverfield', x: -60, z: 95, r: 12, seconds: 90,
            waves: [
              { enemy: 'straw-wight', count: 4, at: 0 },
              { enemy: 's07-damp-wight', count: 3, at: 30 },
              { enemy: 'straw-wight', count: 3, at: 60 },
              { enemy: 's07-damp-wight', count: 2, at: 60 },
            ],
          },
        },
        { text: 'Bind the four straw bundles on the King.', objective: { type: 'interact', object: 's07-straw-bundle', count: 4 } },
        { text: 'Tell Comfrey the King is dressed.', objective: { type: 'talk', npc: 's07-comfrey' } },
      ],
      reward: { gold: 160, items: [] },
    },
    [Q_CHOICE]: {
      id: Q_CHOICE, name: 'The King\'s Choice', giver: 's07-comfrey', zone: 'cloverfield', level: 16, tier: 'side', chain: 'The Straw King',
      stages: [
        { text: 'Look closely at the King.', objective: { type: 'interact', object: 's07-straw-king', count: 1 } },
        { text: 'Decide with Comfrey whether to tie the King or leave him to the crows.', objective: { type: 'choice', flag: 'straw' } },
        { text: 'Tell Comfrey what you decided.', objective: { type: 'talk', npc: 's07-comfrey' } },
      ],
      // Tended gives the sheaf-cord and roosted gives three flasks, both through the turn-in options above.
      reward: { gold: 125, items: [] },
    },
  },

  objects: {
    's07-straw-king': {
      id: 's07-straw-king', zone: 'cloverfield', name: 'The Straw King',
      model: 'generic', color: 0xe8c95a, scale: 6, verb: 'Inspect',
      examine: 'A straw figure twenty gnomes tall, with a sack head and button eyes. Gnomes call him the King and do not know what he is for.',
      text: 'The King\'s sack head turns a hand\'s width toward the sun.',
    },
    's07-rite-post': {
      id: 's07-rite-post', zone: 'cloverfield', name: 'Rite-post',
      model: 'post', color: 0x8a6a3a, verb: 'Read',
      examine: 'A carved post with a knot marked near the top.',
      text: 'The knot mark has been cut and recut for generations.',
    },
    's07-straw-bundle': {
      id: 's07-straw-bundle', zone: 'cloverfield', name: 'Straw bundle',
      model: 'generic', color: 0xd9b84a, scale: 1.4, verb: 'Bind',
      examine: 'A bundle of old straw waiting to be tied onto the King.',
      text: 'You bind the bundle tight with the old knot.',
    },
    's07-loft-door': {
      id: 's07-loft-door', zone: 'cloverfield', name: 'Loft door',
      model: 'chest', color: 0x8a6a3a, verb: 'Open',
      examine: 'A loft door on the Honeydew ranch, shut and dusty for years.',
      text: 'Inside there are two bundles of sheaf-straw, going soft at the edges.',
      giveItem: { item: 's07-sheaf-straw', count: 2 },
    },
    's07-straw-record': {
      id: 's07-straw-record', zone: 'keep', name: 'The Straw Record',
      model: 'book', color: 0x6e5f49, verb: 'Read',
      examine: 'A ledger on the shelf beside Bartholomew\'s Charter. Three accounts of the King, written in three hands.',
      text: 'A Gardener "who forgot to leave". A Fieldwarden clerk\'s crow-scare for the first wheat. And the Sheafkeepers\' rite-book, which says the knot is older than the Charter.',
      once: true,
    },
  },

  greetingsFirst: {
    inkcap: [
      { when: onStage(Q_GARDENER, 2), node: 's07-inkcap-accounts' },
      { when: onStage(Q_GARDENER, 4), node: 's07-inkcap-record' },
    ],
  },

  extraNodes: {
    inkcap: {
      's07-inkcap-accounts': {
        text: 'There are three accounts of that. All wrong in interesting ways. The Record is on the shelf beside Bartholomew\'s Charter.',
        options: [{ text: 'Thank you, Archivist.' }],
      },
      's07-inkcap-record': {
        text: 'That straw isn\'t Charter straw. Nobody has made straw like it in three hundred years. A Sheafkeeper came up six years ago to copy the knot, and she never brought the copy back.',
        options: [{ text: 'I\'ll tell Comfrey.' }],
      },
    },
  },
};
