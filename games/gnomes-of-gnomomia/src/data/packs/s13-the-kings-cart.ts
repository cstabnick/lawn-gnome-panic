// Content pack s13-the-kings-cart: storyline 13, "The Cart That Came Back Empty". The Verge: the King's cart on the Shorn, the Trophy Ring, and the escort home to Last Tuft.
// Design: docs/design/gnomomia/storylines/13-the-kings-cart.md.
import type { ContentPack, Condition, DialogueNode, DialogueOption, Greeting, EnemyDef, ItemDef, NpcDef, WorldObjectSpec, QuestDef, SpawnSpec, BossMoveDef } from '../../config';
import { look } from '../../config';

const Q_TEAM = 's13-team-home';
const Q_ROWAN = 's13-rowan-under-cart';
const Q_HOME = 's13-bring-her-home';
const Q_KING = 's13-king-comes-home';
const SWEEPER = 's13-sweeper';
const SEAT = 's13-cart-seat';
const LOCKER = 's13-locker';
const AXLE = 's13-axle-box';
const RESTORE = 's13-cart-restore';
const LETTERS = 's13-gnorbert-letters';
const BUTTON = 's13-marigolds-button';
const HAT = 's13-kings-good-hat';
const GOAD = 's13-snail-goad';
const RIBBON = 's13-queens-ribbon';

// Shared gating helpers. "Started" means done or active; "not started" is its negation.
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const notStarted = (id: string): Condition => ({ not: { questAtLeast: { id, stage: 0 } } });
const flagIs = (name: string, value: string): Condition => ({ flag: { name, value } });
const onStage = (id: string, stage: number): Condition => ({ questStage: { id, stage } });
const hasLetters: Condition = { hasItem: { item: LETTERS, count: 3 } };

// ---------------------------------------------------------------- Mabel Snailwright (new copy at the Verge, Last Tuft)

const mabelNpc: NpcDef = {
  id: 's13-mabel', name: 'Mabel Snailwright', look: look(0x3a5a2a, 0x7a5a3a, null, { dress: true }), zone: 'verge', x: -4, z: 86, wander: 0.5,
  hidden: { not: done('c7-no-hats') },
  examine: 'Mabel Snailwright, a Fieldwarden with a snail-cart builder\'s apron and a file behind each ear. She built the King\'s cart.',
  greetings: [
    { when: onStage(Q_TEAM, 0), node: 'q1-go' },
    { when: onStage(Q_TEAM, 1), node: 'q1-go' },
    { when: onStage(Q_TEAM, 2), node: 'q1-seat' },
    { when: onStage(Q_TEAM, 3), node: 'q1-letters' },
    { when: onStage(Q_TEAM, 4), node: 'q1-turnin' },
    { when: onStage(Q_HOME, 0), node: 'q3-ready' },
    { when: onStage(Q_HOME, 1), node: 'q3-escort' },
    { when: onStage(Q_HOME, 2), node: 'q3-turnin' },
    { node: 'hub' },
  ],
  nodes: {
    hub: {
      hub: true,
      text: 'The cart is still out on the Shorn, in its ring, and it wants to come home. So do I.',
      options: [
        { text: 'What happened to the cart?', next: 'q1-start', action: { type: 'startQuest', quest: Q_TEAM }, when: notStarted(Q_TEAM) },
        { text: 'Let\'s take her home.', next: 'q3-start', action: { type: 'startQuest', quest: Q_HOME }, when: { ...done(Q_ROWAN), ...notStarted(Q_HOME) } },
        { text: 'Goodbye, Mabel.' },
      ],
    },
    'q1-start': {
      text: 'Four snails came home that year, still in their harness, with nothing on the end of it. The Crown\'s clerk wrote "cart: empty" in the book. I built that cart. Empty.',
      options: [{ text: 'I\'ll help you free the axle.' }],
    },
    'q1-go': {
      text: 'Back already? Good. The cart is out on the Shorn, in the Trophy Ring. Keep to the road and don\'t wander.',
      options: [{ text: 'Heading out.' }],
    },
    'q1-seat': {
      text: 'Lift the seat. The locker under it has a false bottom, and I built it myself at the King\'s request. Open it, and bring me what\'s inside.',
      options: [{ text: 'Opening it.' }],
    },
    'q1-letters': {
      text: 'Three letters in the King\'s hand, to his daughter. Take them, and don\'t read them on the road. Read them to her.',
      options: [{ text: 'I won\'t read them.' }],
    },
    'q1-turnin': {
      text: 'The team came home, and so did the King\'s things. The hat is yours. Wear it, and the Even Cut will know you for a Crown gnome.',
      options: [{ text: 'Thanks, Mabel.' }],
    },
    'q3-start': {
      text: 'Ironsod has the pin out, so the cart can roll. Walk it across the Shorn to Last Tuft, keep the wheels straight, and keep it whole.',
      options: [{ text: 'Let\'s go.' }],
    },
    'q3-ready': {
      text: 'The cart is free. Walk it home. The clippers will lean on us, so keep it straight.',
      options: [{ text: 'Keep it straight.' }],
    },
    'q3-escort': {
      text: 'It\'s a snail-cart, not a sermon. Keep your shears on the left, and keep the cart moving.',
      options: [{ text: 'Moving.' }],
    },
    'q3-turnin': {
      text: 'Home, under its own wheels. Four snails came home alone that year. This one came home with the team.',
      options: [{ text: 'Goodbye, Mabel.' }],
    },
  } satisfies Record<string, DialogueNode>,
};

// ---------------------------------------------------------------- The King's cart (escort NPC, Trophy Ring to Last Tuft)

const cartNpc: NpcDef = {
  id: 's13-kings-cart', name: 'The King\'s cart', look: look(0x7a5a3a, 0x6b4a2b, null), zone: 'verge', x: -60, z: -10, wander: 0,
  model: 'snail', scale: 2,
  // Once Bring Her Home is done, the cart stands in the Last Tuft yard for the restoration.
  placements: [{ zone: 'verge', x: 4, z: 86, when: done(Q_HOME) }],
  examine: 'The King\'s cart, a snail-cart with a locker under the seat. Mown into a ring by the Even Cut, and still wearing its harness.',
  greetings: [{ node: 'hub' }],
  nodes: {
    hub: {
      text: 'A snail-cart, on its axle, in a ring of stubble. The Crown\'s book says it is empty.',
      options: [{ text: 'Goodbye.' }],
    },
  },
};

// ---------------------------------------------------------------- Bindweed Hobnail (new, Last Tuft gate)

const hobnailNpc: NpcDef = {
  id: 's13-hobnail', name: 'Bindweed Hobnail', look: look(0x4a4a2a, 0x5a4632, 0x8a7a5a), zone: 'verge', x: 16, z: 96, wander: 0.5,
  examine: 'A Keep bearer with a grey beard and a bench at the gate of Last Tuft. Lead of the King\'s litter.',
  greetings: [
    { when: done(Q_TEAM), node: 'after' },
    { node: 'hub' },
  ],
  nodes: {
    hub: {
      text: 'Bindweed Hobnail. I was lead bearer on the King\'s litter. I carried him home. I did not open the locker.',
      options: [
        { text: 'What did you see on the Shorn?', next: 'saw' },
        { text: 'Goodbye.' },
      ],
    },
    saw: {
      text: 'A box under the seat. I told the clerk. He said, "The cart\'s empty, Hobnail, write what\'s there." So I wrote what he said. I didn\'t push.',
      options: [{ text: 'Goodbye, Hobnail.' }],
    },
    after: {
      text: 'The letters were in the locker, were they? I didn\'t push, and I should have. Tell the Queen I said so.',
      options: [{ text: 'I will.' }],
    },
  } satisfies Record<string, DialogueNode>,
};

// ---------------------------------------------------------------- Ironsod (ch7 copy c7-ironsod): topics, turn-in greetings and extra nodes

const ironsod = {
  topics: [
    {
      text: 'What is wrong with the cart\'s axle?', next: 's13-ironsod-q2-start', action: { type: 'startQuest', quest: Q_ROWAN },
      when: { ...done(Q_TEAM), ...notStarted(Q_ROWAN) },
    },
  ] satisfies readonly DialogueOption[],

  greetingsFirst: [
    { when: onStage(Q_ROWAN, 0), node: 's13-ironsod-q2-go' },
    { when: onStage(Q_ROWAN, 1), node: 's13-ironsod-q2-go' },
    { when: onStage(Q_ROWAN, 2), node: 's13-ironsod-q2-sweep' },
    { when: onStage(Q_ROWAN, 3), node: 's13-ironsod-q2-axle' },
    { when: onStage(Q_ROWAN, 4), node: 's13-ironsod-q2-choice' },
  ] satisfies readonly Greeting[],

  nodes: {
    's13-ironsod-q2-start': {
      text: 'I hid under that axle while the escort died. I haven\'t been near a cart since. The pin is stuck in the box under it. Go and look.',
      options: [{ text: 'I\'ll look.' }],
    },
    's13-ironsod-q2-go': {
      text: 'The Trophy Ring. Sweepers walk its edge, and they will keep walking it until somebody stops them.',
      options: [{ text: 'Going.' }],
    },
    's13-ironsod-q2-sweep': {
      text: 'Four Sweepers keep the ruts level, so nothing leans. Kill them, and then we can talk about the axle.',
      options: [{ text: 'On it.' }],
    },
    's13-ironsod-q2-axle': {
      text: 'This time I don\'t get under the cart.',
      options: [{ text: 'Go on, then.' }],
    },
    's13-ironsod-q2-choice': {
      text: 'It\'s the pin. Somebody has to get under the axle for it. I can go myself, or I can send a Keep sapper. Your call, not mine.',
      options: [
        { text: 'Go under yourself, Rowan. I\'ll hold the lamp.', action: { type: 'setFlag', flag: 'ironsod', value: 'faced' } },
        { text: 'Send a sapper from the Keep.', action: { type: 'setFlag', flag: 'ironsod', value: 'sent' } },
      ],
    },
  } satisfies Record<string, DialogueNode>,
};

// ---------------------------------------------------------------- Queen Marigold (ch7 copy c7-marigold): topics, turn-in greetings and extra nodes

const marigold = {
  topics: [
    {
      text: 'I have Gnorbert\'s letters.', next: 's13-marigold-q4-start', action: { type: 'startQuest', quest: Q_KING },
      when: { ...done(Q_HOME), ...hasLetters, ...notStarted(Q_KING) },
    },
  ] satisfies readonly DialogueOption[],

  greetingsFirst: [
    { when: onStage(Q_KING, 0), node: 's13-marigold-q4-letters' },
    { when: onStage(Q_KING, 1), node: 's13-marigold-q4-cart' },
    { when: onStage(Q_KING, 2), node: 's13-marigold-q4-choice' },
    { when: onStage(Q_KING, 3), node: 's13-marigold-q4-turnin' },
  ] satisfies readonly Greeting[],

  nodes: {
    's13-marigold-q4-start': {
      text: 'You have them? Read me the third one, then tell me what the cart needs.',
      options: [{ text: 'I\'ll get the cart ready.' }],
    },
    's13-marigold-q4-letters': {
      text: 'He says the Shorn smells of vinegar and clean. Does it? Tell me the truth. I have never been allowed to check.',
      options: [{ text: 'It smells of vinegar and clean, Highness.' }],
    },
    's13-marigold-q4-cart': {
      text: 'The cart is in the Last Tuft yard. Mabel says it needs a hub, a seat and paint. Do the work, and come back to me.',
      options: [{ text: 'Going.' }],
    },
    's13-marigold-q4-choice': {
      text: 'Father wanted it home. Haul the Crown\'s grain again, or keep it at Last Tuft as a memorial with a lamp beside it. Choose.',
      options: [
        { text: 'Haul the grain. He would have hauled it.', action: { type: 'setFlag', flag: 'cart', value: 'haul' } },
        { text: 'Keep it. Put a lamp by it.', action: { type: 'setFlag', flag: 'cart', value: 'memorial' } },
      ],
    },
    's13-marigold-q4-turnin': {
      text: 'It\'s home, and it\'s been restored. Take my ribbon for the cart. It was mine. Tie it on.',
      options: [{ text: 'Thank you, Highness.' }],
    },
  } satisfies Record<string, DialogueNode>,
};

// ---------------------------------------------------------------- enemy

const sweeper: EnemyDef = {
  id: SWEEPER, name: 'Even Cut Sweeper', level: 26, rank: 'normal', family: 'fired',
  damageType: 'crush', aggressive: true,
  loot: [], gold: [4, 10],
  model: 'clay', color: 0xb0643a, scale: 1,
  respawnSeconds: 0,
  moves: [
    { id: 's13-broom-sweep', name: 'Broom sweep', kind: 'cone', every: 9, telegraph: 1.2, length: 3, width: 3, damage: 1 },
    { id: 's13-shorn-grit', name: 'Shorn grit', kind: 'ring', every: 12, telegraph: 1.5, radius: 3, damage: 0.5, status: 'chipped', statusSeconds: 6 },
  ] satisfies readonly BossMoveDef[],
  examine: 'A fired-clay Sweeper with a broom for an arm, sweeping the King\'s ruts level so nothing leans.',
  wants: 'To keep the King\'s ruts swept level, so nothing leans.',
};

// ---------------------------------------------------------------- items

const hat: ItemDef = {
  id: HAT, name: 'King\'s Good Hat', icon: '🎩', kind: 'armor', slot: 'head',
  ilvl: 25, rarity: 'blooming', armorType: 'leather', stats: { endurance: 1, defense: 1 },
  value: 2500,
  examine: 'A tall brown felt hat with a Tall-eye pin. Wear it, and the Even Cut will know you for a Crown gnome.',
};

const button: ItemDef = {
  id: BUTTON, name: 'Marigold\'s Button', icon: '🔘', kind: 'trinket', slot: 'trinket',
  ilvl: 25, rarity: 'sprouted', stats: { endurance: 1 },
  value: 1250,
  examine: 'A clay button Gnorbert carried for his daughter, with an M scratched in the back.',
};

const goad: ItemDef = {
  id: GOAD, name: 'Gnorbert\'s Snail Goad', icon: '🥢', kind: 'weapon', slot: 'weapon',
  ilvl: 25, rarity: 'sprouted', damageType: 'pierce', hands: 1, weaponClass: 'melee',
  value: 1250,
  examine: 'A long stick with a brass point, worn smooth by the King\'s hand. Good for snails and nothing else.',
};

const letters: ItemDef = {
  id: LETTERS, name: 'Gnorbert\'s Letters', icon: '✉️', kind: 'misc', questItem: true, stackable: true,
  value: 0,
  examine: 'Three letters to Marigold in the King\'s hand. The third is unfinished.',
};

const ribbon: ItemDef = {
  id: RIBBON, name: 'The Queen\'s ribbon', icon: '🎀', kind: 'misc', questItem: true,
  value: 0,
  examine: 'A faded ribbon, tied to the cart at Last Tuft. Cosmetic: it marks the cart as the Queen\'s.',
};

// ---------------------------------------------------------------- world objects

const objects: Record<string, WorldObjectSpec> = {
  [SEAT]: {
    id: SEAT, zone: 'verge', name: 'Cart seat',
    model: 'cart', color: 0x7a5a3a, verb: 'Open',
    examine: 'The King\'s cart seat, its cushion gone to felt. Mabel\'s false bottom is under it somewhere.',
    text: 'You lift the seat. Under it, the locker has a second floor, and the clerk never looked for one.',
    when: onStage(Q_TEAM, 2),
    setFlag: { flag: 'cart-locker', value: 'open' },
  },
  [LOCKER]: {
    id: LOCKER, zone: 'verge', name: 'Cart locker',
    model: 'chest', color: 0x5a4632, verb: 'Search',
    examine: 'A tool locker under the seat, with a false bottom that Mabel built at the King\'s request.',
    text: 'Under the false bottom: three letters in the King\'s hand, folded small.',
    when: flagIs('cart-locker', 'open'),
    once: true,
    giveItem: { item: LETTERS, count: 3 },
  },
  [AXLE]: {
    id: AXLE, zone: 'verge', name: 'Axle box',
    model: 'generic', color: 0x4a3a2a, verb: 'Open',
    examine: 'The axle box where Ironsod hid while the escort died. The pin is still stuck in it.',
    text: 'You work the box open. The pin is in the grease. From under the axle, muffled: "Hold the lamp. It\'s the pin. It\'s always the pin."',
    when: onStage(Q_ROWAN, 3),
    once: true,
    giveItem: { item: BUTTON, count: 1 },
  },
  [RESTORE]: {
    id: RESTORE, zone: 'verge', name: 'Cart restoration',
    model: 'cart', color: 0x7a5a3a, verb: 'Restore',
    examine: 'The King\'s cart in the Last Tuft yard, with its hub off and its seat out. Mabel\'s crew is waiting for a hand.',
    text: 'You fit a new hub, a new seat, or a coat of Last Tuft paint. The cart takes a little more of each.',
    when: onStage(Q_KING, 1),
  },
};

// ---------------------------------------------------------------- quests

const quests: Record<string, QuestDef> = {
  [Q_TEAM]: {
    id: Q_TEAM, name: 'The Team Came Home', giver: 's13-mabel', zone: 'verge', level: 25, tier: 'side', chain: 'The Cart That Came Back Empty',
    stages: [
      { text: 'Go back to Mabel and tell her you will help her free the cart\'s axle.', objective: { type: 'talk', npc: 's13-mabel' } },
      { text: 'Walk out onto the Shorn to the Trophy Ring, where the King\'s cart stands.', objective: { type: 'reach', zone: 'verge', x: -60, z: -10, r: 10 } },
      { text: 'Open the cart\'s seat. The locker under it has a false bottom.', objective: { type: 'interact', object: SEAT, count: 1 } },
      { text: 'Take Gnorbert\'s Letters out of the locker.', objective: { type: 'collect', item: LETTERS, count: 3 } },
      { text: 'Show Mabel the letters and tell her what the locker held.', objective: { type: 'talk', npc: 's13-mabel' } },
    ],
    reward: { gold: 60, items: [{ item: HAT, count: 1 }] },
  },
  [Q_ROWAN]: {
    id: Q_ROWAN, name: 'Rowan Under the Cart', giver: 'c7-ironsod', zone: 'verge', level: 26, tier: 'main', chain: 'The Cart That Came Back Empty',
    stages: [
      { text: 'Go back to Ironsod and tell him you have seen the cart\'s axle.', objective: { type: 'talk', npc: 'c7-ironsod' } },
      { text: 'Walk to the Trophy Ring, where the Sweepers keep the ruts level.', objective: { type: 'reach', zone: 'verge', x: -60, z: -10, r: 10 } },
      { text: 'Kill four Even Cut Sweepers in the Trophy Ring.', objective: { type: 'kill', enemy: SWEEPER, count: 4 } },
      { text: 'Open the axle box under the cart. The pin is in there.', objective: { type: 'interact', object: AXLE, count: 1 } },
      { text: 'Decide with Ironsod who goes under the cart: himself, or a Keep sapper.', objective: { type: 'choice', flag: 'ironsod' } },
    ],
    reward: { gold: 80, items: [] },
  },
  [Q_HOME]: {
    id: Q_HOME, name: 'Bring Her Home', giver: 's13-mabel', zone: 'verge', level: 27, tier: 'main', chain: 'The Cart That Came Back Empty',
    stages: [
      { text: 'Tell Mabel the axle is free and the cart is ready to roll.', objective: { type: 'talk', npc: 's13-mabel' } },
      { text: 'Escort the cart from the Trophy Ring to Last Tuft. The Even Cut clippers will charge the lane. If the cart cracks, Mabel starts you again from the ring.', objective: { type: 'escort', npc: 's13-kings-cart', zone: 'verge', x: 4, z: 86, r: 8 } },
      { text: 'Tell Mabel the cart is home.', objective: { type: 'talk', npc: 's13-mabel' } },
    ],
    reward: { gold: 120, items: [{ item: GOAD, count: 1 }] },
  },
  [Q_KING]: {
    id: Q_KING, name: 'The King Comes Home', giver: 'c7-marigold', zone: 'verge', level: 28, tier: 'main', chain: 'The Cart That Came Back Empty',
    stages: [
      { text: 'Read Queen Marigold her father\'s letters.', objective: { type: 'talk', npc: 'c7-marigold' } },
      { text: 'Restore the cart in the Last Tuft yard: a new hub, a new seat and paint.', objective: { type: 'interact', object: RESTORE, count: 3 } },
      { text: 'Decide with Marigold whether the cart hauls supplies again or stays as a memorial.', objective: { type: 'choice', flag: 'cart' } },
      { text: 'Tell Queen Marigold what the cart is for now.', objective: { type: 'talk', npc: 'c7-marigold' } },
    ],
    reward: { gold: 150, items: [{ item: RIBBON, count: 1 }] },
  },
};

// ---------------------------------------------------------------- spawns

const spawns: SpawnSpec[] = [
  // The Trophy Ring's Sweepers: only while Rowan Under the Cart is at the kill stage. They do not respawn.
  { id: 's13-spawn-1', zone: 'verge', enemy: SWEEPER, count: 4, spread: 6, when: onStage(Q_ROWAN, 2) },
  // The escort lane: clippers and acolytes charge the cart from the Shorn while Bring Her Home is at its escort stage.
  { id: 's13-spawn-2', zone: 'verge', enemy: 'even-cut-clipper', count: 3, spread: 5, when: onStage(Q_HOME, 1) },
  { id: 's13-spawn-3', zone: 'verge', enemy: 'even-cut-acolyte', count: 3, spread: 5, when: onStage(Q_HOME, 1) },
];

// ---------------------------------------------------------------- pack

export const PACK: ContentPack = {
  id: 's13-the-kings-cart',
  items: { [hat.id]: hat, [button.id]: button, [goad.id]: goad, [letters.id]: letters, [ribbon.id]: ribbon },
  enemies: { [sweeper.id]: sweeper },
  npcs: { [mabelNpc.id]: mabelNpc, [cartNpc.id]: cartNpc, [hobnailNpc.id]: hobnailNpc },
  quests,
  spawns,
  objects,
  topics: {
    'c7-ironsod': ironsod.topics,
    'c7-marigold': marigold.topics,
  },
  greetingsFirst: {
    'c7-ironsod': ironsod.greetingsFirst,
    'c7-marigold': marigold.greetingsFirst,
  },
  extraNodes: {
    'c7-ironsod': ironsod.nodes,
    'c7-marigold': marigold.nodes,
  },
};
