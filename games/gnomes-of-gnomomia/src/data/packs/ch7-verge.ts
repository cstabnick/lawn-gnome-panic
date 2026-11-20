// Content pack ch7-verge: Chapter 7, "The Verge" (Last Tuft, the Shorn, the King's cart, the Level, the Fence line). Prefix for new ids: c7-.
// Canonical ids owned here: even-cut-clipper even-cut-acolyte shorn-hound rust-rat oil-slug grass-bag-moth edger-knight high-edger;
// kings-signet rust-oil; the Verge gear and the Sedgewick blade. Canon NPCs ironsod, wren, marigold, potsworth, burdock, sedge and fernwick
// get Verge copies (c7-<npc>) with their own lines.
//
// Design notes (where the engine forced a change to the design doc):
// - `sedge` and `potsworth` already hold values from ch2 and ch6, so a choice on those flags would finish at once. The choices use
//   `c7-sedge-choice` and `c7-judgement`, and a chained node then sets the canon flag (`sedge`, `potsworth`).
// - "Potsworth appears if confessed or exiled" needs an OR, which a Condition cannot express. The helper flag `c7-potsworth-here`
//   is set by the wings departure (confessed) and by the judgement (exile).
// - Quests have no repeat, so the three supply runs are one-time. Each gives its 10 items once.
// - The peace apology to Burdock is its own quest (`c7-peace-apology`), started from Marigold when hedge=peace.
import { look, type Condition, type ContentPack, type DialogueNode, type DialogueOption, type EnemyDef, type NpcDef, type QuestDef, type WorldObjectSpec, type SpawnGroup, type AllyDef } from '../../config';

const fresh = (id: string): Condition => ({ quest: { id, status: 'none' } });
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const active = (id: string): Condition => ({ quest: { id, status: 'active' } });
/** Quest `prereq` is finished and `id` has not been started yet. */
const next = (prereq: string, id: string): Condition => ({ quest: { id: prereq, status: 'done' }, not: { not: fresh(id) } });
/** Quest `id` is active on `stage` or later, or done. */
const from = (id: string, stage: number): Condition => ({ questAtLeast: { id, stage } });
const flag = (name: string, value: string): Condition => ({ flag: { name, value } });

const bye: DialogueOption = { text: 'Goodbye.' };
const WINGS = 'c7-wings-to-the-front';

export const PACK: ContentPack = {
  id: 'ch7-verge',

  items: {
    // Quest items and war supplies.
    'kings-signet': { id: 'kings-signet', name: "The King's Signet", icon: '💍', kind: 'misc', questItem: true, value: 0, examine: 'Gnorbert\'s signet, found under his cart. It is warm from nobody\'s hand. Proof for Rowan, and for the Queen.' },
    'c7-timber': { id: 'c7-timber', name: 'Hedgewood timber', icon: '🪵', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Straight lengths of hedge timber, for the barricades. Ironsod wants ten.' },
    'c7-shard-iron': { id: 'c7-shard-iron', name: 'Shard-iron bar', icon: '🔩', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'A bar of Rockery Shard iron. It hums faintly against the others in the pack.' },
    'c7-grain': { id: 'c7-grain', name: 'Cloverfield grain', icon: '🌾', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'A sack of grain from the Cloverfield granaries. Ten for the carts.' },
    'c7-rust-tail': { id: 'c7-rust-tail', name: 'Rust-rat tail', icon: '🐀', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Rusted to the tip, and it still twitches a little when you hold it.' },
    'c7-moth-glitter': { id: 'c7-moth-glitter', name: 'Glittering wing-scale', icon: '✨', kind: 'misc', questItem: true, value: 0, examine: 'A Tall-eye shard, smaller than a grain of salt. A scratch on it looks like writing. It is not a letter yet.' },

    // Consumable (thrown).
    'rust-oil': { id: 'rust-oil', name: 'Rust oil', icon: '🛢️', kind: 'misc', stackable: true, value: 40, effect: 'Thrown: target metal enemy takes +20% damage for 10 s.', examine: 'Brown, oily and smelling of old pipes. It bites rust like a dog bites a sock.' },

    // Named weapon: Sedgewick's blade (heirloom, ilvl 28, value about ilvl squared x 8).
    'sedgewicks-edging-blade': { id: 'sedgewicks-edging-blade', name: "Sedgewick's Edging Blade", icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 28, rarity: 'heirloom', damageType: 'slash', hands: 1, weaponClass: 'melee', effect: 'Straight-line strikes hit a 2nd target.', value: 6272, examine: '"Perfectly level. Perfectly cruel."' },

    // Verge smith and herbalist stock: ilvl 25-27, plain (value about ilvl squared).
    'c7-war-hoe': { id: 'c7-war-hoe', name: 'War hoe', icon: '🪓', kind: 'weapon', slot: 'weapon', ilvl: 26, damageType: 'crush', hands: 2, weaponClass: 'melee', value: 676, examine: 'A garden hoe that has been to war and come back with opinions.' },
    'c7-robin-feather-sling': { id: 'c7-robin-feather-sling', name: 'Robin-feather sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 25, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 625, examine: 'Fletched with feathers from Wren\'s robins, who were not consulted.' },
    'c7-spigot-staff': { id: 'c7-spigot-staff', name: 'Spigot staff', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 27, damageType: 'rain', hands: 2, weaponClass: 'staff', value: 729, examine: 'Carved from a length of spigot pipe. It drips when you are not looking.' },
    'c7-royal-basin-plate': { id: 'c7-royal-basin-plate', name: 'Royal Basin plate', icon: '🛡️', kind: 'armor', slot: 'body', ilvl: 27, armorType: 'plate', value: 729, examine: 'Dented by a hundred hedgerows and polished by none of them.' },
    'c7-verge-runner-jerkin': { id: 'c7-verge-runner-jerkin', name: 'Verge-runner jerkin', icon: '🦺', kind: 'armor', slot: 'body', ilvl: 26, armorType: 'leather', value: 676, examine: 'Light, dun and cut close, so the wind cannot get a grip on it.' },
    'c7-rain-woven-smock': { id: 'c7-rain-woven-smock', name: 'Rain-woven smock', icon: '🥼', kind: 'armor', slot: 'body', ilvl: 27, armorType: 'cloth', value: 729, examine: 'Woven from wet straw, which keeps the wet out and the straw in.' },
  },

  enemies: {
    'even-cut-clipper': {
      id: 'even-cut-clipper', name: 'Even Cut clipper', level: 25, rank: 'normal', family: 'fired', damageType: 'slash', aggressive: true,
      loot: [], gold: [3, 10], model: 'gnome', color: 0xc8c8d0, scale: 1, respawnSeconds: 30,
      examine: 'A zealot with a pair of shears on a cord, and a square haircut on everything within reach.',
      wants: 'To trim you, so you are even with everyone.',
    },
    'even-cut-acolyte': {
      id: 'even-cut-acolyte', name: 'Even Cut acolyte', level: 26, rank: 'normal', family: 'fired', damageType: 'slash', aggressive: true,
      loot: [], gold: [3, 10], model: 'gnome', color: 0xe8e0c8, scale: 1, respawnSeconds: 30,
      examine: 'Pushes a hand-mower the way a pilgrim pushes a cart. The mower is always running, and so is the acolyte.',
      wants: 'To pray at the Shed door.',
      moves: [
        { id: 'mower-charge', name: 'Hand-Mower Charge', kind: 'lane', every: 9, telegraph: 1.5, length: 8, width: 2.5, damage: 1.2 },
      ],
    },
    'shorn-hound': {
      id: 'shorn-hound', name: 'Shorn hound', level: 26, rank: 'normal', family: 'shelled', damageType: 'slash', aggressive: true,
      loot: [], gold: [2, 8], model: 'earwig', color: 0x8a7a5a, scale: 1.2, respawnSeconds: 30,
      examine: 'A trained earwig, bred for the Shorn. It keeps its nose down and its pincers up.',
      wants: 'Its handler\'s orders.',
    },
    'rust-rat': {
      id: 'rust-rat', name: 'Rust-rat', level: 27, rank: 'normal', family: 'metal', damageType: 'slash', aggressive: true,
      loot: [{ item: 'c7-rust-tail', chance: 0.9 }], gold: [3, 10], model: 'rat', color: 0x9a5a3a, scale: 1, respawnSeconds: 30,
      examine: 'Fled the Shed with its tail rusted to a stub. It bites metal, which is the only thing it has learned.',
      wants: 'Oil from the Shed.',
    },
    'oil-slug': {
      id: 'oil-slug', name: 'Oil-slug', level: 28, rank: 'normal', family: 'metal', damageType: 'crush', aggressive: true,
      loot: [], gold: [3, 10], model: 'slug', color: 0x2a2a2a, scale: 1.1, respawnSeconds: 30,
      examine: 'Black and slick, and it leaves a trail that makes you slide. Not a friend to anyone with a grip.',
      wants: 'To spread Black Dew.',
    },
    'grass-bag-moth': {
      id: 'grass-bag-moth', name: 'Grass-bag moth', level: 28, rank: 'normal', family: 'winged', damageType: 'crush', aggressive: true,
      loot: [], gold: [2, 8], model: 'moth', color: 0xb8a070, scale: 0.9, respawnSeconds: 30,
      examine: 'Flew out of the Mower\'s belly, with grass stuck to its wings. It flies towards any light it can find.',
      wants: 'Light.',
    },
    'edger-knight': {
      id: 'edger-knight', name: 'Edger-Knight', level: 27, rank: 'elite', family: 'fired', damageType: 'slash', aggressive: true,
      loot: [], gold: [10, 20], model: 'clay', color: 0x9a9aa0, scale: 1.3, respawnSeconds: 120,
      examine: 'A clay knight in a helmet cut to a perfect line. It was never fired hard enough to be alive, and it does not care.',
      wants: 'Sedgewick\'s orders.',
    },
    'high-edger': {
      id: 'high-edger', name: 'High Edger Sedgewick', level: 28, rank: 'boss', family: 'fired', damageType: 'slash', aggressive: true,
      loot: [{ item: 'sedgewicks-edging-blade', chance: 1 }], gold: [60, 90], model: 'clay', color: 0x7a6a5a, scale: 1.8, respawnSeconds: 0,
      examine: 'The Even Cut\'s high priest, a clay gnome with a ruler for a spine. He stands at the centre of the Level and does not blink.',
      wants: 'The Mower freed, to make Fescue perfectly even.',
      moves: [
        { id: 'edging-line', name: 'Edging Line', kind: 'lane', every: 12, telegraph: 2, length: 14, width: 4, damage: 1.8 },
        { id: 'level-ground', name: 'Level Ground', kind: 'buff', every: 20, telegraph: 1.5 },
        { id: 'call-the-faithful', name: 'Call the Faithful', kind: 'summon', every: 25, telegraph: 1, summon: { enemy: 'even-cut-clipper', count: 2 } },
      ],
      lastWords: 'You can\'t stop it. You can only be cut sooner or later.',
    },
  } satisfies Record<string, EnemyDef>,

  spawns: [
    // The Shorn.
    { zone: 'verge', enemy: 'even-cut-clipper', x: -40, z: 20, count: 4, spread: 10 },
    { zone: 'verge', enemy: 'even-cut-acolyte', x: -30, z: 10, count: 3, spread: 8 },
    { zone: 'verge', enemy: 'shorn-hound', x: -50, z: 30, count: 4, spread: 8 },
    // The battlefield and the fence line.
    { zone: 'verge', enemy: 'even-cut-clipper', x: 0, z: -60, count: 3, spread: 10 },
    { zone: 'verge', enemy: 'rust-rat', x: 0, z: -100, count: 4, spread: 10 },
    { zone: 'verge', enemy: 'oil-slug', x: 10, z: -95, count: 3, spread: 8 },
    { zone: 'verge', enemy: 'grass-bag-moth', x: -10, z: -90, count: 4, spread: 10 },
    // The Level.
    { zone: 'verge', enemy: 'edger-knight', x: 60, z: 0, count: 3, spread: 6 },
    { zone: 'verge', enemy: 'high-edger', x: 60, z: 0, count: 1, spread: 0, when: from('c7-the-level', 1) },
  ] satisfies SpawnGroup[],

  objects: {
    'c7-war-table': {
      id: 'c7-war-table', zone: 'verge', name: 'War Table', model: 'generic', color: 0x8a6a3a, verb: 'Study',
      examine: 'A table with a map of the Shorn, pinned with coloured tacks. Every region has a pin, and every pin wants something.',
      text: 'The pins rattle. Something is missing from every region.',
    },
    'c7-kings-cart': {
      id: 'c7-kings-cart', zone: 'verge', name: "The King's cart", x: -60, z: -10, model: 'cart', color: 0x7a5a3a, verb: 'Search',
      examine: 'The King\'s cart, on the Shorn where he fell. The Even Cut keep the grass around it mown to a perfect edge.',
      text: 'Under the seat, wrapped in cloth: the King\'s Signet.',
      giveItem: { item: 'kings-signet', count: 1 }, once: true,
    },
    'c7-hat-brims': {
      id: 'c7-hat-brims', zone: 'verge', name: 'Level-cut hat brims', model: 'generic', color: 0x3a7a3a, scale: 0.6, verb: 'Inspect',
      examine: 'Brims of little straw hats, cut clean as a hedge. Each one has been trimmed to the same height.',
      text: 'Every brim has been cut to the same height. Someone was in a hurry, and still very careful.',
    },
  } satisfies Record<string, WorldObjectSpec>,

  npcs: {
    // Canon copies (named the same as their home packs).
    'c7-ironsod': {
      id: 'c7-ironsod', name: 'Knight-Commander Rowan Ironsod', look: look(0x8a8a8a, 0x5a6a7a, 0x6a5a4a), zone: 'verge', x: 2, z: 80, wander: 0,
      hidden: { not: from(WINGS, 0) },
      examine: 'Head of the army. Dented helm, straight back, and eyes that have not properly closed since the King\'s Fall.',
      greetings: [
        { when: { questStage: { id: 'c7-the-level', stage: 3 } }, node: 'levelTurnIn' },
        { when: { questStage: { id: 'c7-muster', stage: 3 } }, node: 'grainTurnIn' },
        { when: { questStage: { id: 'c7-muster', stage: 2 } }, node: 'ironTurnIn' },
        { when: { questStage: { id: 'c7-muster', stage: 1 } }, node: 'timberTurnIn' },
        { when: active('c7-the-level'), node: 'levelWait' },
        { when: active('c7-no-hats'), node: 'noHatsWait' },
        { when: active('c7-same-table'), node: 'sameWait' },
        { when: active('c7-muster'), node: 'musterWait' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'This time I don\'t get under the cart. Tell me what you need, and I will tell you what it costs.',
          options: [
            { text: 'Show me the War Table muster.', next: 'musterStart', action: { type: 'startQuest', quest: 'c7-muster' }, when: next(WINGS, 'c7-muster') },
            { text: 'I will bring timber from the Hedgewood.', next: 'supplyTimberStart', action: { type: 'startQuest', quest: 'c7-supply-timber' }, when: next(WINGS, 'c7-supply-timber') },
            { text: 'I will bring Shard iron from the Rockery.', next: 'supplyIronStart', action: { type: 'startQuest', quest: 'c7-supply-iron' }, when: next(WINGS, 'c7-supply-iron') },
            { text: 'I will bring grain from Cloverfield.', next: 'supplyGrainStart', action: { type: 'startQuest', quest: 'c7-supply-grain' }, when: next(WINGS, 'c7-supply-grain') },
            { text: 'What happened to the King?', next: 'noHatsStart', action: { type: 'startQuest', quest: 'c7-no-hats' }, when: next(WINGS, 'c7-no-hats') },
            { text: 'Fetch the Queen. She will need the Signet.', next: 'sameStart', action: { type: 'startQuest', quest: 'c7-same-table' }, when: next('c7-no-hats', 'c7-same-table') },
            { text: 'Take us to the Level.', next: 'levelStart', action: { type: 'startQuest', quest: 'c7-the-level' }, when: next('c7-no-hats', 'c7-the-level') },
            { text: 'Your old teacher is on the road, Knight-Commander?', next: 'fernwickStart', action: { type: 'startQuest', quest: 'c7-fernwick-comes-north' }, when: next('c7-muster', 'c7-fernwick-comes-north') },
            bye,
          ],
        },
        musterStart: {
          text: 'Pins for every region. Timber from the Hedgewood, Shard iron from the Rockery, grain from Cloverfield. Use the War Table, then bring me ten of each.',
          options: [bye],
        },
        musterWait: { text: 'Timber, iron, grain. Ten of each, and the table is ready.', options: [bye] },
        timberTurnIn: {
          text: 'Timber. Good straight lengths. The sappers will want them for the barricades.',
          options: [
            { text: 'Here are ten lengths of timber.', action: { type: 'setFlag', flag: 'supply-timber', value: 'filled' }, when: { hasItem: { item: 'c7-timber', count: 10 } } },
            { text: 'I am short. I will be back.', when: { not: { hasItem: { item: 'c7-timber', count: 10 } } } },
          ],
        },
        ironTurnIn: {
          text: 'Shard iron. It hums when you are not listening. Good. It will hum louder near the Mower.',
          options: [
            { text: 'Here are ten Shard-iron bars.', action: { type: 'setFlag', flag: 'supply-iron', value: 'filled' }, when: { hasItem: { item: 'c7-shard-iron', count: 10 } } },
            { text: 'I am short. I will be back.', when: { not: { hasItem: { item: 'c7-shard-iron', count: 10 } } } },
          ],
        },
        grainTurnIn: {
          text: 'Grain for the carts. The Fieldwardens will go faster on a full stomach, and so will the rest of us.',
          options: [
            { text: 'Here are ten sacks of grain.', action: { type: 'setFlag', flag: 'supply-grain', value: 'filled' }, when: { hasItem: { item: 'c7-grain', count: 10 } } },
            { text: 'I am short. I will be back.', when: { not: { hasItem: { item: 'c7-grain', count: 10 } } } },
          ],
        },
        supplyTimberStart: {
          text: 'Eight centipedes in the Hedgewood hedges. Kill them and I will have ten lengths of timber sent up to the front, for you to carry.',
          options: [bye],
        },
        supplyIronStart: {
          text: 'Eight Rockery centipedes at the seam. Their shells come off in strips of Shard iron if you know how to cut them.',
          options: [bye],
        },
        supplyGrainStart: {
          text: 'Eight red ant workers on the Cloverfield anthills. They carry the grain off in their jaws, and you can take it back.',
          options: [bye],
        },
        noHatsStart: {
          text: 'The King\'s cart is on the Shorn. I hid under it, and I knew. Go and look. Then bring me what you find, and any brims that were cut.',
          options: [{ text: 'I will look.' }],
        },
        noHatsWait: { text: 'The cart, the brims, and then Sedge, at the Level gate. Don\'t let him see you counting.', options: [bye] },
        sameStart: {
          text: 'She is at the Verge gate, waiting for proof. Show her the Signet, and she will know what the Even Cut did.',
          options: [{ text: 'I will bring her.' }],
        },
        sameWait: { text: 'She is at the gate with her robins. Take her the Signet.', options: [bye] },
        levelStart: {
          text: 'The Level is perfectly square, and Sedgewick stands in the middle of it. Kill three of his Edger-Knights, then him. He will not stand still for you.',
          options: [{ text: 'Then let us begin.' }],
        },
        levelWait: { text: 'Three Edger-Knights, then Sedgewick himself. Do not let him draw a line on you.', options: [bye] },
        levelTurnIn: {
          text: 'The ground shakes. Far to the north, the Shed door splits open. The Mower is awake.',
          options: [{ text: 'Then let us go and meet it.', action: { type: 'setFlag', flag: 'c8-phase', value: 'ready' } }],
        },
        fernwickStart: {
          text: 'Snail-cart, mind. He is coming anyway, and he will want to see it. Let him.',
          options: [bye],
        },
      },
    },

    'c7-wren': {
      id: 'c7-wren', name: 'Robin-Master Wren Tumble', look: look(0x6a4a2a, 0x8a5a3a, null, { dress: true, freckles: true }), zone: 'verge', x: -6, z: 78, wander: 0,
      hidden: { not: from(WINGS, 0) },
      examine: 'Keeper of the Royal Robins. A robin sits on each shoulder and neither of them is impressed by the Shorn.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Robins can see the whole Shorn from up here. Do not ask them what they think of it.',
          options: [
            { text: 'Fly me back to the Keep.', action: { type: 'travel', zone: 'keep', x: 0, z: 25 } },
            bye,
          ],
        },
      },
    },

    'c7-marigold': {
      id: 'c7-marigold', name: 'Queen Marigold Clayfoot', look: look(0xe0b040, 0xb0306a, null, { hair: { color: 0xc8a050, style: 'pigtails' }, dress: true }), zone: 'verge', x: 6, z: 78, wander: 0,
      hidden: { not: from('c7-same-table', 0) },
      examine: 'Queen of Fescue, at thirty-eight. She has never once been allowed to see the grass outside her own Keep, and she is looking at it now.',
      greetings: [
        { when: { questStage: { id: 'c7-same-table', stage: 0 } }, node: 'sameTurnIn' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'So this is what outside smells like. Stubble and fear.',
          options: [
            { text: 'Majesty, Potsworth has lied to you. Ida wants him shattered.', next: 'judgementStart', action: { type: 'startQuest', quest: 'c7-queens-judgement' }, when: { ...next('c7-same-table', 'c7-queens-judgement'), ...flag('potsworth', 'exposed') } },
            bye,
          ],
        },
        sameTurnIn: {
          text: 'The Signet. My husband\'s hand was on this, once. Now the Crown will hear what the Even Cut did, from me.',
          options: [{ text: 'Majesty, here is the Signet.', next: 'sameDone' }],
        },
        sameDone: {
          text: 'Then the Crown is the Crown again. There is one more debt to pay, if you are willing to go and pay it.',
          options: [
            { text: 'Thank you, Majesty. I will see to Burdock.', action: { type: 'startQuest', quest: 'c7-peace-apology' }, when: flag('hedge', 'peace') },
            { text: 'Thank you, Majesty.', when: { not: flag('hedge', 'peace') } },
          ],
        },
        judgementStart: {
          text: 'Potsworth. He stood at my side, and he lied. Ida will have her justice, and I will have mine. Decide.',
          options: [
            { text: 'Shatter him, as Ida asks.', next: 'judgeShatter', action: { type: 'setFlag', flag: 'c7-judgement', value: 'shattered' } },
            { text: 'Exile him to the front.', next: 'judgeExile', action: { type: 'setFlag', flag: 'c7-judgement', value: 'exiled' } },
          ],
        },
        judgeShatter: {
          text: 'So it is done. The Keep\'s treasury goes cold, and Ida keeps the Valve-Key. Potsworth will not be seen in the Keep again.',
          options: [{ text: 'Let it be done.', action: { type: 'setFlag', flag: 'potsworth', value: 'shattered' } }],
        },
        judgeExile: {
          text: 'Then he goes to the line. He will fight at the finale, in a borrowed helmet, and he will be terrified the whole time.',
          options: [{ text: 'To the line, then.', next: 'judgeExileDone', action: { type: 'setFlag', flag: 'potsworth', value: 'exiled' } }],
        },
        judgeExileDone: {
          text: 'Potsworth, pale, looks at the Shorn as if he has never seen grass before.',
          options: [{ text: 'Dismissed.', action: { type: 'setFlag', flag: 'c7-potsworth-here', value: 'yes' } }],
        },
      },
    },

    'c7-burdock': {
      id: 'c7-burdock', name: 'Mother Burdock', look: look(0x3a5a1a, 0x5a4a2a, 0x8a8a7a), zone: 'verge', x: -12, z: 84, wander: 0.2,
      hidden: { not: from('c7-peace-apology', 0) },
      examine: 'Chieftain of the Wildlings, half-hidden in her own tangle. She came down from the Hedgewood to see the war, and she has not forgiven anyone for it.',
      greetings: [
        { when: { questStage: { id: 'c7-peace-apology', stage: 0 } }, node: 'peaceTalk' },
        { node: 'hub' },
      ],
      nodes: {
        peaceTalk: {
          text: 'An apology from the Crown, in front of the Wildlings. Three hundred years late, and it will do. Tell the Queen I am still here.',
          options: [{ text: 'I will tell her.' }],
        },
        hub: {
          hub: true,
          text: 'You want something from a Wildling, you bring your own fire.',
          options: [bye],
        },
      },
    },

    'c7-sedge': {
      id: 'c7-sedge', name: 'Brother Sedge', look: look(0xe8e8e8, 0x8fbc8f, 0xdddddd), zone: 'verge', x: 40, z: 6, wander: 0,
      hidden: { not: { questAtLeast: { id: 'c7-no-hats', stage: 3 }, not: flag('sedge', 'arrested') } },
      examine: 'Ex-Even Cut, now standing at the Level gate. Soft-spoken, and the first Even Cut anyone has seen change their mind.',
      greetings: [
        { when: { questStage: { id: 'c7-no-hats', stage: 3 } }, node: 'sedgeTalk' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'I wanted an even lawn. I didn\'t want an empty one.',
          options: [bye],
        },
        sedgeTalk: {
          text: 'You found the cart. You found the brims. Now you want me, and I am not going to run. Will you spare me, or arrest me?',
          options: [
            { text: 'Spare him. Take the layout of the Level.', next: 'sedgeDefect', action: { type: 'setFlag', flag: 'c7-sedge-choice', value: 'defected' } },
            { text: 'Arrest him.', next: 'sedgeArrest', action: { type: 'setFlag', flag: 'c7-sedge-choice', value: 'arrested' } },
          ],
        },
        sedgeDefect: {
          text: 'Then here is the Level. Every line in it is one of his. Walk along the lines, and you will see where to cut.',
          options: [{ text: 'Welcome to the line.', action: { type: 'setFlag', flag: 'sedge', value: 'defected' } }],
        },
        sedgeArrest: {
          text: 'Fine. I will sit in the cart and wait for the Shed, with my hands in my lap, the way the Even Cut taught me.',
          options: [{ text: 'Take him away.', action: { type: 'setFlag', flag: 'sedge', value: 'arrested' } }],
        },
      },
    },

    'c7-potsworth': {
      id: 'c7-potsworth', name: 'Lord Chancellor Wendel Potsworth', look: look(0x3a3a4a, 0x5a4a6a, 0xd0d0d0, { glasses: true }), zone: 'verge', x: -2, z: 72, wander: 0.5,
      hidden: { not: flag('c7-potsworth-here', 'yes') },
      examine: 'The Regent in all but name, out of the Keep and into the mud. The pressed collar is gone. The ledger is still there.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'I have never opened the ledger. I was afraid of what it would say about the seals.',
          options: [bye],
        },
      },
    },

    'c7-fernwick': {
      id: 'c7-fernwick', name: 'Elder Fernwick', look: look(0x7b3fb0, 0x4b2a6e, 0xf4f4f4, { glasses: true }), zone: 'verge', x: 10, z: 86, wander: 0,
      hidden: { not: done('c7-muster') },
      examine: 'The oldest gnome in Mossbottom, come north by snail-cart on his knees\' advice. His beard has its own postcode, and now its own weather.',
      greetings: [
        { when: active('c7-fernwick-comes-north'), node: 'fernwickTalk' },
        { node: 'hub' },
      ],
      nodes: {
        fernwickTalk: {
          text: 'Same way you came, I hear. Funny. I have nothing to give you. I just wanted to see it.',
          options: [{ text: 'Thank you for coming, Elder.' }],
        },
        hub: {
          hub: true,
          text: 'I have nothing to give you, you know. I just wanted to see it.',
          options: [bye],
        },
      },
    },

    'c7-herbalist': {
      id: 'c7-herbalist', name: 'Herbalist Yarrowby', look: look(0x3a6a3a, 0x6a8a5a, 0xc0c0a0, { glasses: true }), zone: 'verge', x: 4, z: 86, wander: 0,
      shop: ['ruby-draught', 'spigot-water', 'rust-oil'],
      examine: 'Last Tuft\'s herbalist. Two jars on the belt, and a third jar that hums when the wind comes off the Shorn.',
      greetings: [
        { when: { questStage: { id: 'c7-rust-oil', stage: 1 } }, node: 'oilTurnIn' },
        { when: active('c7-rust-oil'), node: 'oilWait' },
        { when: active('c7-moths-to-flame'), node: 'mothsWait' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Potions for the front, and a little for the wounded. Ask what you like; I have heard it all from the Shorn.',
          options: [
            { text: 'Show me your stock.', action: { type: 'openShop' } },
            { text: 'What is rust oil for?', next: 'oilStart', action: { type: 'startQuest', quest: 'c7-rust-oil' }, when: next(WINGS, 'c7-rust-oil') },
            { text: 'Those grass-bag moths. What do they carry?', next: 'mothsStart', action: { type: 'startQuest', quest: 'c7-moths-to-flame' }, when: next(WINGS, 'c7-moths-to-flame') },
            bye,
          ],
        },
        oilStart: {
          text: 'Rust-rat tails, ten of them. Rain on rusty metal is nothing; a splash of this first, and the rain bites. Bring me the tails and I will show you how it is made.',
          options: [{ text: 'I will bring them.' }],
        },
        oilWait: { text: 'Ten rust-rat tails. They live along the fence line, and they are quick.', options: [bye] },
        oilTurnIn: {
          text: 'Ten tails, and not one of them lucky. Keep the oil; you will find it sells well at the line.',
          options: [{ text: 'Thank you.' }],
        },
        mothsStart: {
          text: 'Twelve grass-bag moths. They come out of the Mower\'s belly and burn in any light. Look in their wings when they fall, and bring me what glitters.',
          options: [{ text: 'I will look.' }],
        },
        mothsWait: { text: 'Twelve moths, then look in their wings. Something glitters there.', options: [bye] },
      },
    },

    'c7-smith': {
      id: 'c7-smith', name: 'Smith Hobnail Ferrule', look: look(0x2a2a2a, 0x4a4a4a, 0x9a8a7a), zone: 'verge', x: -6, z: 91, wander: 0,
      shop: ['c7-war-hoe', 'c7-royal-basin-plate', 'c7-robin-feather-sling', 'c7-verge-runner-jerkin', 'c7-spigot-staff', 'c7-rain-woven-smock'],
      examine: 'Last Tuft\'s smith. Works with a forge made from an old garden roller, and swears that it is the best forge in Fescue.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Verge gear, ilvl twenty-five to twenty-nine. Scuffed at the edges, and sharp where it counts.',
          options: [
            { text: 'Show me your stock.', action: { type: 'openShop' } },
            bye,
          ],
        },
      },
    },
  } satisfies Record<string, NpcDef>,

  quests: {
    'c7-wings-to-the-front': {
      id: 'c7-wings-to-the-front', name: 'Wings to the Front', giver: 'wren', zone: 'keep', level: 25, tier: 'main', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Fly with Wren to Last Tuft, the last tuft of uncut grass before the Shorn.', objective: { type: 'reach', zone: 'verge', x: 0, z: 80, r: 12 } },
      ],
      reward: { gold: 150, items: [] },
    },
    'c7-muster': {
      id: 'c7-muster', name: 'The Muster', giver: 'c7-ironsod', zone: 'verge', level: 26, tier: 'main', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Work the War Table at Last Tuft and pin the regions.', objective: { type: 'interact', object: 'c7-war-table', count: 1 } },
        { text: 'Hand in ten Hedgewood timber to Ironsod.', objective: { type: 'talk', npc: 'c7-ironsod' }, takeItems: [{ item: 'c7-timber', count: 10 }] },
        { text: 'Hand in ten Shard-iron bars to Ironsod.', objective: { type: 'talk', npc: 'c7-ironsod' }, takeItems: [{ item: 'c7-shard-iron', count: 10 }] },
        { text: 'Hand in ten sacks of Cloverfield grain to Ironsod.', objective: { type: 'talk', npc: 'c7-ironsod' }, takeItems: [{ item: 'c7-grain', count: 10 }] },
      ],
      reward: { gold: 300, items: [] },
    },
    'c7-supply-timber': {
      id: 'c7-supply-timber', name: 'Supply Run: Timber', giver: 'c7-ironsod', zone: 'verge', level: 26, tier: 'side', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Kill eight centipedes in the Hedgewood.', objective: { type: 'kill', enemy: 'centipede', count: 8 } },
      ],
      reward: { gold: 40, items: [{ item: 'c7-timber', count: 10 }] },
    },
    'c7-supply-iron': {
      id: 'c7-supply-iron', name: 'Supply Run: Iron', giver: 'c7-ironsod', zone: 'verge', level: 26, tier: 'side', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Kill eight Rockery centipedes at the seam.', objective: { type: 'kill', enemy: 'rockery-centipede', count: 8 } },
      ],
      reward: { gold: 40, items: [{ item: 'c7-shard-iron', count: 10 }] },
    },
    'c7-supply-grain': {
      id: 'c7-supply-grain', name: 'Supply Run: Grain', giver: 'c7-ironsod', zone: 'verge', level: 26, tier: 'side', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Kill eight red ant workers on the Cloverfield anthills.', objective: { type: 'kill', enemy: 'red-ant-worker', count: 8 } },
      ],
      reward: { gold: 40, items: [{ item: 'c7-grain', count: 10 }] },
    },
    'c7-no-hats': {
      id: 'c7-no-hats', name: 'No Hats', giver: 'c7-ironsod', zone: 'verge', level: 27, tier: 'main', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Reach the King\'s cart on the Shorn.', objective: { type: 'reach', zone: 'verge', x: -60, z: -10, r: 8 } },
        { text: 'Search the King\'s cart.', objective: { type: 'interact', object: 'c7-kings-cart', count: 1 } },
        { text: 'Find the level-cut hat brims around the cart.', objective: { type: 'interact', object: 'c7-hat-brims', count: 1 } },
        { text: 'Find Brother Sedge at the Level gate and talk to him.', objective: { type: 'talk', npc: 'c7-sedge' } },
        { text: 'Spare Sedge, or arrest him.', objective: { type: 'choice', flag: 'c7-sedge-choice' } },
      ],
      reward: { gold: 200, items: [] },
    },
    'c7-same-table': {
      id: 'c7-same-table', name: 'The Same Table', giver: 'c7-ironsod', zone: 'verge', level: 28, tier: 'main', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Show the King\'s Signet to Queen Marigold.', objective: { type: 'talk', npc: 'c7-marigold' }, takeItems: [{ item: 'kings-signet', count: 1 }] },
      ],
      reward: { gold: 150, items: [] },
    },
    'c7-peace-apology': {
      id: 'c7-peace-apology', name: 'The Same Table: Peace', giver: 'c7-marigold', zone: 'verge', level: 28, tier: 'main', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Take the Queen\'s apology to Mother Burdock.', objective: { type: 'talk', npc: 'c7-burdock' } },
      ],
      reward: { gold: 100, items: [] },
    },
    'c7-queens-judgement': {
      id: 'c7-queens-judgement', name: "The Queen's Judgement", giver: 'c7-marigold', zone: 'verge', level: 28, tier: 'main', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Decide Potsworth\'s end: shatter him, or exile him to the front.', objective: { type: 'choice', flag: 'c7-judgement' } },
      ],
      reward: { gold: 150, items: [] },
    },
    'c7-the-level': {
      id: 'c7-the-level', name: 'The Level', giver: 'c7-ironsod', zone: 'verge', level: 29, tier: 'finale', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Reach the Level, the Even Cut\'s square fort.', objective: { type: 'reach', zone: 'verge', x: 60, z: 0, r: 12 } },
        { text: 'Kill three Edger-Knights at the Level.', objective: { type: 'kill', enemy: 'edger-knight', count: 3 } },
        { text: 'Kill High Edger Sedgewick.', objective: { type: 'kill', enemy: 'high-edger', count: 1 } },
        { text: 'Tell Ironsod that Sedgewick is dead.', objective: { type: 'talk', npc: 'c7-ironsod' } },
      ],
      reward: { gold: 400, items: [] },
    },
    'c7-rust-oil': {
      id: 'c7-rust-oil', name: 'Rust Oil', giver: 'c7-herbalist', zone: 'verge', level: 26, tier: 'side', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Collect ten rust-rat tails from the fence line.', objective: { type: 'collect', item: 'c7-rust-tail', count: 10 } },
        { text: 'Bring the tails to Yarrowby the herbalist.', objective: { type: 'talk', npc: 'c7-herbalist' }, takeItems: [{ item: 'c7-rust-tail', count: 10 }] },
      ],
      reward: { gold: 60, items: [{ item: 'rust-oil', count: 3 }] },
    },
    'c7-moths-to-flame': {
      id: 'c7-moths-to-flame', name: 'Moths to Flame', giver: 'c7-herbalist', zone: 'verge', level: 28, tier: 'side', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Kill twelve grass-bag moths.', objective: { type: 'kill', enemy: 'grass-bag-moth', count: 12 } },
      ],
      reward: { gold: 50, items: [{ item: 'c7-moth-glitter', count: 1 }] },
    },
    'c7-fernwick-comes-north': {
      id: 'c7-fernwick-comes-north', name: 'Fernwick Comes North', giver: 'c7-ironsod', zone: 'verge', level: 27, tier: 'side', chain: 'Chapter 7: The Verge',
      stages: [
        { text: 'Go and see Elder Fernwick at Last Tuft.', objective: { type: 'talk', npc: 'c7-fernwick' } },
      ],
      reward: { gold: 20, items: [] },
    },
  } satisfies Record<string, QuestDef>,

  // Canon NPCs that gain Chapter 7 lines. Their own packs stay untouched.
  topics: {
    wren: [
      { text: 'Wren, the Queen wants the front. Fly us to Last Tuft.', next: 'c7-wings-start', action: { type: 'startQuest', quest: WINGS }, when: next('c6-who-holds-the-valve', WINGS) },
    ],
  },

  extraNodes: {
    wren: {
      'c7-wings-start': {
        text: 'Last Tuft is past the Hedgewood, and the robins can see the Shorn from there. Hold on to your hat.',
        options: [
          { text: 'Hold on to your hat.', next: 'c7-wings-fly', action: { type: 'setFlag', flag: 'c7-potsworth-here', value: 'yes' }, when: flag('potsworth', 'confessed') },
          { text: 'Hold on to your hat.', next: 'c7-wings-fly', when: { not: flag('potsworth', 'confessed') } },
        ],
      },
      'c7-wings-fly': {
        text: 'Up, up, and mind the robins\' feet.',
        options: [{ text: 'Cast off.', action: { type: 'travel', zone: 'verge', x: 0, z: 80 } }],
      },
    },
  } satisfies Record<string, Record<string, DialogueNode>>,

  allies: [
    { id: 'c7-ally-keep-soldiers', name: 'Keep soldiers', when: {}, effect: 'barricades' },
    { id: 'c7-ally-pipewrights', name: 'Pipewrights', when: {}, effect: 'valve' },
    { id: 'c7-ally-fieldwardens', name: 'Fieldwardens', when: {}, effect: 'stone-cart' },
    // The `cart-speed` row is listed twice because "grain filled OR straw tended" cannot be one condition.
    { id: 'c7-ally-fieldwardens-grain', name: 'Fieldwardens (grain line)', when: flag('supply-grain', 'filled'), effect: 'cart-speed' },
    { id: 'c7-ally-fieldwardens-straw', name: 'Fieldwardens (tended straw)', when: flag('straw', 'tended'), effect: 'cart-speed' },
    { id: 'c7-ally-delver-sappers', name: 'Delver sappers', when: flag('supply-iron', 'filled'), effect: 'sapper-rebuild' },
    { id: 'c7-ally-wildling-archers', name: 'Wildling archers', when: flag('hedge', 'peace'), effect: 'moth-archers' },
    { id: 'c7-ally-hedgewright-axes', name: 'Hedgewright axes', when: flag('supply-timber', 'filled'), effect: 'barricade-hp' },
    { id: 'c7-ally-ant-thousand', name: 'The Ant Thousand', when: flag('ants', 'peace'), effect: 'revive' },
    { id: 'c7-ally-old-gleaner', name: 'Old Gleaner', when: flag('gleaner', 'fed'), effect: 'rope-pin' },
    { id: 'c7-ally-potsworth', name: 'Potsworth', when: flag('c7-potsworth-here', 'yes'), effect: 'potions' },
    { id: 'c7-ally-brother-sedge', name: 'Brother Sedge', when: flag('sedge', 'defected'), effect: 'lane-warning' },
  ] satisfies AllyDef[],
};
