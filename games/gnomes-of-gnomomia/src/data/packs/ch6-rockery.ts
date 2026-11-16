// Content pack ch6-rockery: Chapter 6, "Stone" (Flintdelve, the Shard seam, the Kiln, the Backflow). Prefix for new ids: c6-.
// Canonical ids owned here: hammerclod sedum grout cobalt mudtooth; rust-crab drowned-pipewright gromwell; earwig gem-beetle
// rock-louse rockery-centipede deep-mole dowager-mudtooth kiln-guardian unfired kiln-warden; stopping-stone valve-key gnorwins-trowel;
// ruby-draught spigot-water; the c6-brambles-old-master side quest (uses the s14 items s14-shard-ore, s14-bramble-reply, s14-sobriety-tonic, s14-release-roll).
import { look, type Condition, type ContentPack, type DialogueNode, type DialogueOption, type Greeting, type NpcDef } from '../../config';

/** Quest `id` has not been started yet, and `prereq` (if given) is finished. */
const fresh = (id: string): Condition => ({ quest: { id, status: 'none' } });
const next = (prereq: string | null, id: string): Condition => (prereq ? { quest: { id: prereq, status: 'done' }, not: { not: fresh(id) } } : fresh(id));
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const active = (id: string): Condition => ({ quest: { id, status: 'active' } });

const bye: DialogueOption = { text: 'Goodbye.' };

export const PACK: ContentPack = {
  id: 'ch6-rockery',

  items: {
    // Consumables (Flintdelve's general stock).
    'ruby-draught': { id: 'ruby-draught', name: 'Ruby draught', icon: '🍷', kind: 'potion', heal: 120, stackable: true, value: 90, examine: 'Thick and sweet, like cherry jam that has been to war. Restores 120 hit points.' },
    'spigot-water': { id: 'spigot-water', name: 'Spigot water', icon: '💧', kind: 'potion', mana: 120, stackable: true, value: 90, examine: 'Cold, clean and from somewhere else entirely. Restores 120 mana.' },

    // Mining drops.
    'c6-slate': { id: 'c6-slate', name: 'Slate chip', icon: '🪨', kind: 'misc', stackable: true, value: 6, examine: 'Flat, grey and warm for no reason.' },
    'c6-shard-ore': { id: 'c6-shard-ore', name: 'Shard ore', icon: '🔩', kind: 'misc', stackable: true, value: 20, examine: 'Hums very quietly when you hold it up to your ear.' },
    'c6-tall-eye-shard': { id: 'c6-tall-eye-shard', name: 'Tall-eye shard', icon: '🔮', kind: 'misc', stackable: true, value: 30, examine: 'A splinter of glass marble. Something very tall looked through it once.' },
    'c6-shiny-scrap': { id: 'c6-shiny-scrap', name: 'Shiny scrap', icon: '⚙️', kind: 'misc', stackable: true, value: 4, examine: 'Rust-proof, nearly. The Keep would like it back.' },

    // Quest items.
    'stopping-stone': { id: 'stopping-stone', name: 'The New Stopping Stone', icon: '🪨', kind: 'misc', questItem: true, value: 0, examine: 'A grey cone of fired Shard, still warm. It hums in the key of the Mower.' },
    'valve-key': { id: 'valve-key', name: "Gromwell's Valve-Key", icon: '🗝️', kind: 'misc', questItem: true, value: 0, examine: 'A key the length of your forearm. It opens the Great Valve. Ida keeps it after.' },

    // Flintdelve smith stock: Shard-iron gear, ilvl 20-23 (plain: value about ilvl squared).
    'c6-shard-iron-trowel': { id: 'c6-shard-iron-trowel', name: 'Shard-iron trowel', icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 21, damageType: 'slash', hands: 1, weaponClass: 'melee', value: 441, examine: 'Dug the Shard seam for a week and came out sharper.' },
    'c6-delvers-mattock': { id: 'c6-delvers-mattock', name: "Delver's mattock", icon: '⛏️', kind: 'weapon', slot: 'weapon', ilvl: 22, damageType: 'crush', hands: 2, weaponClass: 'melee', value: 484, examine: 'One side breaks rock. The other side breaks the rock\'s opinion.' },
    'c6-shard-tipped-sling': { id: 'c6-shard-tipped-sling', name: 'Shard-tipped sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 20, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 400, examine: 'Fires chips of the humming stuff. They come back, usually.' },
    'c6-marble-shooter': { id: 'c6-marble-shooter', name: 'Marble shooter', icon: '🔴', kind: 'weapon', slot: 'weapon', ilvl: 21, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 441, examine: 'A marble for every enemy, and a grudge for the ones you miss.' },
    'c6-slate-rod': { id: 'c6-slate-rod', name: 'Slate rod', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 22, damageType: 'rain', hands: 2, weaponClass: 'staff', value: 484, examine: 'Cold to hold, and it sounds like rain on a roof when you tap it.' },
    'c6-shard-iron-plate': { id: 'c6-shard-iron-plate', name: 'Shard-iron plate', icon: '🛡️', kind: 'armor', slot: 'body', ilvl: 22, armorType: 'plate', value: 484, examine: 'Mirror-bright on the outside. Don\'t look too long: you will see the Shard looking back.' },
    'c6-shard-iron-helm': { id: 'c6-shard-iron-helm', name: 'Shard-iron helm', icon: '⛑️', kind: 'armor', slot: 'head', ilvl: 21, armorType: 'plate', value: 441, examine: 'Hums, faintly, when you stand near a grudge.' },
    'c6-earwig-hide-jerkin': { id: 'c6-earwig-hide-jerkin', name: 'Earwig-hide jerkin', icon: '🦺', kind: 'armor', slot: 'body', ilvl: 21, armorType: 'leather', value: 441, examine: 'Stiff, shiny, and it smells of crevices. You get used to it.' },
    'c6-kiln-felt-smock': { id: 'c6-kiln-felt-smock', name: 'Kiln-felt smock', icon: '🥼', kind: 'armor', slot: 'body', ilvl: 22, armorType: 'cloth', value: 484, examine: 'Warm in the cold and cold in the warm. Kiln-felt keeps its own opinion about the weather.' },
    'c6-tall-eye-charm': { id: 'c6-tall-eye-charm', name: 'Tall-eye charm', icon: '🧿', kind: 'trinket', slot: 'trinket', ilvl: 21, rarity: 'sprouted', stats: { intelligence: 2 }, value: 882, examine: 'A marble with something looking through it, politely.' },

    // Named drops and rewards.
    'c6-hammerclods-pick': { id: 'c6-hammerclods-pick', name: "Hammerclod's Pick", icon: '⛏️', kind: 'weapon', slot: 'weapon', ilvl: 22, rarity: 'heirloom', damageType: 'crush', hands: 2, weaponClass: 'melee', effect: '+20% damage against fired clay', value: 3872, examine: 'Forewoman Hammerclod\'s mother\'s pick. "Iron\'s iron. If it sings while I dig, I dig louder."' },
    'c6-kiln-wardens-heart': { id: 'c6-kiln-wardens-heart', name: "Kiln Warden's Heart", icon: '❤️‍🔥', kind: 'trinket', slot: 'trinket', ilvl: 24, rarity: 'kilnfired', effect: 'Once per fight, when you would crack, you are re-fired at 30% HP instead.', value: 4608, examine: '"Warm. It beats if you hold it long enough."' },
    'c6-gromwells-last-seal': { id: 'c6-gromwells-last-seal', name: "Gromwell's Last Seal", icon: '🛡️', kind: 'offhand', slot: 'offhand', ilvl: 25, rarity: 'heirloom', armorType: 'shield', effect: 'Rain Ward +25%', value: 5000, examine: '"Shard iron, not clay. He did it right."' },
    'gnorwins-trowel': { id: 'gnorwins-trowel', name: "Gnorwin's Trowel", icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 24, rarity: 'kilnfired', damageType: 'slash', hands: 1, weaponClass: 'melee', effect: '+50% damage against the Mower', value: 4608, examine: '"It has dug a thousand flowerbeds, and one grave, and it isn\'t done."' },
  },

  enemies: {
    earwig: {
      id: 'earwig', name: 'Earwig', level: 19, rank: 'normal', family: 'shelled', damageType: 'slash', aggressive: true,
      loot: [{ item: 'c6-slate', chance: 0.3 }], gold: [1, 6],
      model: 'earwig', color: 0x5a3a2a, scale: 1, respawnSeconds: 30,
      examine: 'Long, glossy and quick, with pincers that have been sharpened on the Spigot\'s rocks. It hides in every crevice it can find.',
      wants: 'Crevices. Dark ones, with a bit of damp.',
    },
    'gem-beetle': {
      id: 'gem-beetle', name: 'Gem beetle', level: 20, rank: 'normal', family: 'shelled', damageType: 'crush', aggressive: true,
      loot: [{ item: 'c6-tall-eye-shard', chance: 0.7 }], gold: [2, 8],
      model: 'beetle', color: 0x2a6a7a, scale: 1.1, respawnSeconds: 30,
      examine: 'A beetle with a shell like a marble, and it eats marble grit to keep the shell bright.',
      wants: 'Tall-eyes. It eats glass grit.',
    },
    'rock-louse': {
      id: 'rock-louse', name: 'Rock-louse', level: 21, rank: 'trivial', family: 'shelled', damageType: 'pierce', aggressive: true,
      loot: [], gold: [0, 2],
      model: 'earwig', color: 0x6a6a5a, scale: 0.6, respawnSeconds: 20,
      examine: 'They come in swarms, all of them sitting on the warm rock above the humming iron.',
      wants: 'Warmth from the humming iron.',
    },
    'rockery-centipede': {
      id: 'rockery-centipede', name: 'Rockery centipede', level: 21, rank: 'normal', family: 'shelled', damageType: 'pierce', aggressive: true,
      loot: [{ item: 'c6-shard-ore', chance: 0.4 }], gold: [2, 8],
      model: 'centipede', color: 0x7a4a2a, scale: 1.2, respawnSeconds: 30,
      examine: 'Many legs, all of them going in the same direction: towards the deep seam.',
      wants: 'The deep seam, and to stay near it.',
    },
    'deep-mole': {
      id: 'deep-mole', name: 'Deep mole', level: 22, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [{ item: 'c6-shard-ore', chance: 0.2 }], gold: [2, 8],
      model: 'mole', color: 0x3a2e28, scale: 1.1, respawnSeconds: 30,
      examine: 'A mole from the clan under the mountain. It hasn\'t seen the sky in three hundred years and doesn\'t trust yours.',
      wants: 'The clan safe.',
    },
    'dowager-mudtooth': {
      id: 'dowager-mudtooth', name: 'Dowager Mudtooth', level: 23, rank: 'miniboss', family: 'furred', damageType: 'crush', aggressive: true,
      loot: [{ item: 'c6-shard-ore', chance: 1 }], gold: [40, 60],
      model: 'mole', color: 0x2b211c, scale: 2.4, respawnSeconds: 0,
      examine: 'Grubthorn\'s great-grandmother, larger than he ever was and blind in one eye. She fights because you lied to her.',
      wants: 'Honesty about Grubthorn.',
      moves: [
        { id: 'undermine', name: 'Undermine', kind: 'vanish', every: 14, telegraph: 1.5, radius: 3, damage: 1.4 },
        { id: 'mud-slam', name: 'Mud Slam', kind: 'ring', every: 10, telegraph: 1.5, radius: 5, damage: 0.8, status: 'slowed', statusSeconds: 3 },
      ],
      lastWords: 'Then it is true. He ran.',
    },
    'kiln-guardian': {
      id: 'kiln-guardian', name: 'Kiln guardian', level: 23, rank: 'elite', family: 'fired', damageType: 'crush', aggressive: true,
      loot: [{ item: 'c6-shard-ore', chance: 0.5 }], gold: [10, 20],
      model: 'clay', color: 0x8a4a2a, scale: 1.6, respawnSeconds: 120,
      examine: 'A fired-clay golem left by the Kiln-born. It was ordered to guard the Kiln, and it still believes the order is current.',
      wants: 'To guard the Kiln, as the Kiln-born ordered.',
    },
    unfired: {
      id: 'unfired', name: 'The Unfired', level: 23, rank: 'normal', family: 'unfired', damageType: 'crush', aggressive: true,
      hpOverride: 620,
      loot: [], gold: [0, 0],
      model: 'clay', color: 0xb8a48a, scale: 1, respawnSeconds: 30,
      examine: 'Soft clay in the shape of a gnome, with the eyes painted on and not yet finished. It is not evil. It wants to be finished.',
      wants: 'To be finished.',
      lastWords: 'Oh.',
    },
    'kiln-warden': {
      id: 'kiln-warden', name: 'The Kiln Warden', level: 24, rank: 'boss', family: 'fired', damageType: 'crush', aggressive: true,
      loot: [{ item: 'c6-kiln-wardens-heart', chance: 1 }], gold: [60, 90],
      model: 'clay', color: 0xb05a2a, scale: 3, respawnSeconds: 0,
      examine: 'A giant fired-clay gnome statue that tests anyone who would use the Kiln. Its face is turned towards your trowel.',
      wants: 'To test whoever would use the Kiln.',
      moves: [
        { id: 'kiln-heat', name: 'Kiln Heat', kind: 'ring', every: 12, telegraph: 1.5, radius: 6, damage: 0.8, status: 'burning', statusSeconds: 6 },
        { id: 'reshape', name: 'Reshape', kind: 'summon', every: 25, telegraph: 1, summon: { enemy: 'unfired', count: 2 } },
      ],
      lastWords: 'Clayfoot.',
    },
    'rust-crab': {
      id: 'rust-crab', name: 'Rust crab', level: 24, rank: 'normal', family: 'metal', damageType: 'crush', aggressive: true,
      loot: [{ item: 'c6-shiny-scrap', chance: 0.8 }], gold: [3, 10],
      model: 'metal', color: 0x8a4a2a, scale: 1.1, respawnSeconds: 30,
      examine: 'A crab made of old Keep pipe-fittings. Rust-proof, nearly. Rain beats metal, and this is the first thing that teaches you so.',
      wants: 'Shiny scrap.',
    },
    'drowned-pipewright': {
      id: 'drowned-pipewright', name: 'Drowned Pipewright', level: 24, rank: 'normal', family: 'fired', damageType: 'slash', aggressive: false,
      loot: [{ item: 'c6-shiny-scrap', chance: 0.3 }], gold: [3, 10],
      model: 'gnome', color: 0x3a5a6a, scale: 1, respawnSeconds: 30,
      examine: 'A Pipewright who went down with the Backflow thirty years ago, still working at a broken valve. It does not notice you until you hit it.',
      wants: 'To finish its shift.',
    },
    gromwell: {
      id: 'gromwell', name: 'Gromwell, Who Holds the Valve', level: 25, rank: 'boss', family: 'fired', damageType: 'crush', aggressive: true,
      loot: [{ item: 'valve-key', chance: 1 }, { item: 'c6-gromwells-last-seal', chance: 1 }], gold: [80, 120],
      model: 'gnome', color: 0x5a4a3a, scale: 1.6, respawnSeconds: 0,
      examine: 'The Pipewright still at his post, rust-bound and cracked, holding the Great Valve shut for thirty years. If Ida came down with you, she is talking to him while you fight.',
      wants: 'To keep the flood from the Keep, still, thirty years on.',
      moves: [
        { id: 'valve-wrench', name: 'Valve Wrench', kind: 'cone', every: 8, telegraph: 1.5, length: 7, width: 5, damage: 1.6 },
        { id: 'pressure-burst', name: 'Pressure Burst', kind: 'cone', every: 12, telegraph: 1.5, length: 6, width: 6, damage: 1, status: 'soaked', statusSeconds: 6 },
        { id: 'seal-the-room', name: 'Seal the Room', kind: 'pool', every: 15, telegraph: 3, radius: 14, damage: 1.2, belowHpPct: 0.3 },
      ],
      lastWords: 'Is it dry up there? Good. Good.',
    },
  },

  spawns: [
    // Flintdelve's outskirts and the Rockery (kept inside the stub zone's half of 80; see the zone issue).
    { zone: 'rockery', enemy: 'earwig', x: -60, z: -50, count: 4, spread: 8 },
    { zone: 'rockery', enemy: 'gem-beetle', x: -60, z: 40, count: 4, spread: 10 },
    { zone: 'rockery', enemy: 'rock-louse', x: 40, z: -14, count: 4, spread: 8 },
    { zone: 'rockery', enemy: 'rockery-centipede', x: 40, z: -30, count: 4, spread: 8 },
    { zone: 'rockery', enemy: 'deep-mole', x: 56, z: 46, count: 4, spread: 8, when: { not: { flag: { name: 'mudtooth', value: 'trust' } } } },
    { zone: 'rockery', enemy: 'dowager-mudtooth', x: 60, z: 56, count: 1, spread: 0, when: { flag: { name: 'mudtooth', value: 'lie' } } },
    { zone: 'rockery', enemy: 'kiln-guardian', x: -10, z: -66, count: 2, spread: 6 },
    { zone: 'rockery', enemy: 'unfired', x: 0, z: -100, count: 6, spread: 3 },
    { zone: 'rockery', enemy: 'kiln-warden', x: 0, z: -80, count: 1, spread: 0 },
    // The Backflow (deeps zone).
    { zone: 'deeps', enemy: 'rust-crab', x: 0, z: -40, count: 4, spread: 6 },
    { zone: 'deeps', enemy: 'drowned-pipewright', x: 6, z: -66, count: 3, spread: 6 },
    { zone: 'deeps', enemy: 'gromwell', x: 0, z: -84, count: 1, spread: 0 },
  ],

  objects: {
    'c6-shard-wall': {
      id: 'c6-shard-wall', zone: 'rockery', name: 'Mirror-bright Shard wall', x: 50, z: -32, model: 'stone', color: 0xcfe8f0, scale: 1.4, verb: 'Touch',
      examine: 'Mirror-bright. Your face looks back, smaller than you expected, and behind it something hums.',
      text: 'Your reflection is slow to follow you.',
    },
    'c6-clay-seal-1': {
      id: 'c6-clay-seal-1', zone: 'deeps', name: 'Valve seal', x: -6, z: -44, model: 'valve', color: 0xa07a50, verb: 'Break', once: true,
      examine: 'A valve seal, shaped and painted to look like Shard iron. It is clay.',
      text: 'The seal cracks like a flowerpot. It was never iron.',
    },
    'c6-clay-seal-2': {
      id: 'c6-clay-seal-2', zone: 'deeps', name: 'Valve seal', x: 8, z: -64, model: 'valve', color: 0xa07a50, verb: 'Break', once: true,
      examine: 'Another valve seal. The thumbprint in the clay is small, and it is Gromwell\'s.',
      text: 'The seal cracks along the thumbprint.',
    },
    'c6-clay-seal-3': {
      id: 'c6-clay-seal-3', zone: 'deeps', name: 'Valve seal', x: -4, z: -70, model: 'valve', color: 0xa07a50, verb: 'Break', once: true,
      examine: 'The third valve seal. It was the one that was supposed to hold the Backflow back.',
      text: 'It was clay all along. The water comes straight through.',
    },
    'c6-pipewright-roll': {
      id: 'c6-pipewright-roll', zone: 'deeps', name: 'Pipewright roll', x: 10, z: -44, model: 'book', color: 0x6a5a3a, verb: 'Read',
      examine: 'A roll of names, the Pipewrights who went down in the Backflow. Most are signed. One has a thistle drawn beside it.',
      text: 'Primrose. The name is underlined twice.',
    },
  },

  npcs: {
    hammerclod: {
      id: 'hammerclod', name: 'Forewoman Saxifraga "Sax" Hammerclod', look: look(0x6b3a1a, 0x5a4a3a, 0x8a5a2a), zone: 'rockery', x: -4, z: 16, wander: 0.5,
      examine: 'Head of the Delvers. Helmet pushed back, lamp on a string, and a face that has stopped the mine three times this year without telling the Keep.',
      greetings: [
        { when: { questStage: { id: 'c6-humming-seam', stage: 3 } }, node: 'seamTurnIn' },
        { when: active('c6-humming-seam'), node: 'seamWait' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Iron\'s iron. If it sings while I dig, I dig louder.',
          options: [
            { text: 'What is humming down there?', next: 'hum' },
            { text: 'I will clear the Shard Mine for you.', next: 'seamStart', action: { type: 'startQuest', quest: 'c6-humming-seam' }, when: next('c6-new-stopping-stone', 'c6-humming-seam') },
            { text: 'Show me your stock.', action: { type: 'openShop' } },
            bye,
          ],
        },
        hum: {
          text: 'Shard. The Mower broke its blade on these rocks, and what is left of the edge is buried in my mine. Grout says it is getting closer. Grout is blind, mind, and says a lot.',
          options: [{ text: 'Thanks, Sax.' }],
        },
        seamStart: {
          text: 'The deep seam is at the far face of the Shard Mine. Kill eight centipedes there, touch the wall, then come back and tell me what you saw.',
          options: [bye],
        },
        seamWait: { text: 'Eight centipedes, then the mirror wall. Don\'t stare into it too long.', options: [bye] },
        seamTurnIn: {
          text: 'You saw it. Your own face in it, eh? Take the pick. It was my mother\'s. Mind the Shard: it hums when it is listening.',
          options: [bye],
        },
      },
      shop: ['ruby-draught', 'spigot-water'],
    },

    sedum: {
      id: 'sedum', name: 'Kilnkeeper Sedum', look: look(0x9a6a2a, 0xb8a27a, 0xd8d8d8), zone: 'rockery', x: 4, z: 18, wander: 0,
      examine: 'Keeper of the Kiln, a hereditary job that nobody needed for three hundred years. Ash in the creases of her apron.',
      greetings: [
        { when: { questStage: { id: 'c6-new-stopping-stone', stage: 0 } }, node: 'stoneTurnIn' },
        { when: done('c6-firing-the-stone'), node: 'fired' },
        { when: active('c6-firing-the-stone'), node: 'firingWait' },
        { when: done('c6-kiln-warden'), node: 'wardenDone' },
        { when: active('c6-kiln-warden'), node: 'wardenWait' },
        { when: active('c6-the-unfired'), node: 'unfiredWait' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'It has never been lit in my lifetime, or my mother\'s, or hers. Yet it was lit four nights before you came, and nobody will tell me who.',
          options: [
            { text: 'Can you fire a new Stopping Stone?', next: 'stoneStart', action: { type: 'startQuest', quest: 'c6-new-stopping-stone' }, when: next('c5-heartwood', 'c6-new-stopping-stone') },
            { text: 'What is in the Kiln\'s back chambers?', next: 'unfiredStart', action: { type: 'startQuest', quest: 'c6-the-unfired' }, when: next('c6-humming-seam', 'c6-the-unfired') },
            { text: 'What guards the Kiln?', next: 'wardenStart', action: { type: 'startQuest', quest: 'c6-kiln-warden' }, when: next('c6-the-unfired', 'c6-kiln-warden') },
            { text: 'Fire the Stone now.', next: 'firingStart', action: { type: 'startQuest', quest: 'c6-firing-the-stone' }, when: next('c6-kiln-warden', 'c6-firing-the-stone') },
            bye,
          ],
        },
        stoneStart: {
          text: 'Fire a new Stone? In the Kiln? The front gate fell in the First Rumble. The only other way in is the moles\' deep way, so go and see Mudtooth. Then come back and I will light it.',
          options: [{ text: 'I will find the way.' }],
        },
        stoneTurnIn: {
          text: 'You came back. That is the first thing this week that went right. The Stone is in the Kiln\'s back chambers. Fire it when you are ready, and I will keep the fire going.',
          options: [{ text: 'Let us go.' }],
        },
        unfiredStart: {
          text: 'Rows of clay gnomes, never finished. Some of them move. They are not evil. They want to be finished. Clear the back chambers, and I will visit them with a cup of tea after.',
          options: [{ text: 'I will clear them.' }],
        },
        unfiredWait: { text: 'The Unfired are still in the back chambers. Be gentle with them, if you can.', options: [bye] },
        wardenStart: {
          text: 'The Kiln Warden stands in the middle of the Kiln. It tests anyone who would use the Kiln. Beat it, and I can fire the Stone.',
          options: [{ text: 'I will beat it.' }],
        },
        wardenWait: { text: 'It has not knelt yet. Careful: it burns.', options: [bye] },
        wardenDone: {
          text: 'It knelt, and it said "Clayfoot." I saw a shape walk out of the lit Kiln towards the Spigot, four nights before you washed up. I have told nobody. I am telling you now.',
          options: [{ text: 'What does it mean?' }],
        },
        firingStart: {
          text: 'Stand at the Kiln while I light it. Hold the Unfired off me for two minutes. Don\'t look at the Stone too long; it hums.',
          options: [{ text: 'Light it.' }],
        },
        firingWait: { text: 'Hold the Kiln. Two minutes. I cannot fire and fight at the same time.', options: [bye] },
        fired: {
          text: 'It is lit. The Stone is in the fire, and the blade is slowing. I should have lit it years ago.',
          options: [bye],
        },
      },
      shop: [],
    },

    grout: {
      id: 'grout', name: 'Grout', look: look(0x5a5a4a, 0x6a6a5a, 0xe0e0d0, { glasses: true }), zone: 'rockery', x: -8, z: 26, wander: 0.5,
      examine: 'A blind old miner with his hand on the Flintdelve wall, listening. He does not look up when you come close.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Thump. Turn. Thump. It is further along than last month.',
          options: [{ text: 'What is it?', next: 'what' }, bye],
        },
        what: {
          text: 'A heartbeat, friend. Big as a hill, and slower than a hill has any right to be. Sax says I am making it up. I am not.',
          options: [{ text: 'I believe you.' }],
        },
      },
    },

    cobalt: {
      id: 'cobalt', name: 'Smith Cobalt Anvilroot', look: look(0x2a2a3a, 0x3a3a4a, 0xc0c0c0, { glasses: true }), zone: 'rockery', x: 6, z: 24, wander: 0,
      examine: 'Flintdelve\'s master smith. Good hands, and a forge that is never allowed to go cold.',
      greetings: [
        { when: { questStage: { id: 'c6-gnorwins-trowel', stage: 0 } }, node: 'trowelTurnIn' },
        { when: { questStage: { id: 'c6-brambles-old-master', stage: 1 } }, node: 'brambleOre' },
        { when: { questStage: { id: 'c6-brambles-old-master', stage: 2 } }, node: 'brambleTurnIn' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Shard iron. Bring me a bar of it and I will show you a blade. Bramble could have done it too, if he had stayed sober.',
          options: [
            { text: 'Show me your iron.', action: { type: 'openShop' } },
            { text: 'Can you reforge my trowel?', next: 'trowelStart', action: { type: 'startQuest', quest: 'c6-gnorwins-trowel' }, when: next('c6-kiln-warden', 'c6-gnorwins-trowel') },
            { text: 'Bramble has been sober. Will you forgive him?', next: 'bramblePlea', action: { type: 'startQuest', quest: 'c6-brambles-old-master' }, when: fresh('c6-brambles-old-master') },
            bye,
          ],
        },
        bramblePlea: {
          text: 'Forgive him? He had good hands and a bad thirst, and I kicked him out of my forge. Bring me six Shard ore, and bring me his reply, his tonic and the release roll. Then we will see.',
          options: [{ text: 'I will bring them.' }],
        },
        brambleOre: {
          text: 'Six Shard ore. Good. Hand it over, and wait while I look at it. Now, the rest of what he sent you.',
          options: [bye],
        },
        trowelStart: {
          text: 'The Clayfoot mark. I saw it under the rust the moment you walked in. I would not touch it until the Warden knelt. Now it has. Bring me the trowel, in your pack, when you are next here.',
          options: [bye],
        },
        trowelTurnIn: {
          text: 'Kiln fire and Shard iron. It will dig a thousand more flowerbeds and one more grave, and it will sing near the Mower. Take it.',
          options: [bye],
        },
        brambleTurnIn: {
          text: 'His reply, and the tonic, and the release roll with my hand on it. Regret, underneath. I wrote that. Tell him the forge is still lit.',
          options: [bye],
        },
      },
      shop: [
        'c6-shard-iron-trowel', 'c6-delvers-mattock', 'c6-shard-iron-plate', 'c6-shard-iron-helm', 'c6-shard-tipped-sling',
        'c6-marble-shooter', 'c6-earwig-hide-jerkin', 'c6-slate-rod', 'c6-tall-eye-charm', 'c6-kiln-felt-smock',
      ],
    },

    'c6-delver-trainer': {
      id: 'c6-delver-trainer', name: 'Delver Sergeant Flint', look: look(0x4a4a2a, 0x5a4a3a, 0x9a8a6a), zone: 'rockery', x: 0, z: 30, wander: 0, trainer: 'warden',
      examine: 'A Delver who trains Wardens on the slope above the lift-baskets. He has a bruise for every lesson.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'The Delvers train on the slope. Carry a mattock up it, and you will know what it is to be a Warden.',
          options: [bye],
        },
      },
    },

    'c6-raftwright': {
      id: 'c6-raftwright', name: 'Raftwright Dunning', look: look(0x7a5a2a, 0x3a5a6a, 0x8a7a5a), zone: 'rockery', x: -40, z: 40, wander: 0,
      examine: 'Keeps the leaf-raft at the dock. Has ridden the Hose more times than the Hose has ridden him.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Leaf-raft to Thatchford. Sit still, mind your knees, and don\'t wave at the ducks. The Hose is faster than the road and wetter than both.',
          options: [
            { text: 'Take me down the Hose.', next: 'ride', action: { type: 'startQuest', quest: 'c6-raft-down-the-hose' }, when: fresh('c6-raft-down-the-hose') },
            { text: 'Take the raft to Thatchford.', action: { type: 'travel', zone: 'thatchford', x: -30, z: 20 }, when: { not: fresh('c6-raft-down-the-hose') } },
            bye,
          ],
        },
        ride: {
          text: 'Cast off, then. Hold on to the paddle.',
          options: [{ text: 'Cast off.', action: { type: 'travel', zone: 'thatchford', x: -30, z: 20 } }],
        },
      },
    },

    mudtooth: {
      id: 'mudtooth', name: 'Dowager Mudtooth', look: look(0x3a2a22, 0x4a3a2a, 0xd8d0c0), zone: 'rockery', x: 60, z: 50, wander: 0,
      model: 'mole', scale: 2,
      hidden: { flag: { name: 'mudtooth', value: 'lie' } },
      examine: 'Grubthorn\'s great-grandmother: an old mole matriarch, blind in one eye and not blind to you. Her clan lives under the Rockery.',
      greetings: [
        { when: { flag: { name: 'mudtooth', value: 'trust' } }, node: 'trustTalk' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Oh, it is you. You killed my great-grandson. Tell me true, and I will show you the deep way. That is my offer, and it is the only one.',
          options: [
            { text: 'Grubthorn is dead. I have his crown.', next: 'honest', action: { type: 'startQuest', quest: 'c6-honest-words' }, when: next('c6-new-stopping-stone', 'c6-honest-words') },
            { text: 'Let us talk about Grubthorn.', next: 'honest', when: { quest: { id: 'c6-honest-words', status: 'active' }, flagUnset: 'mudtooth' } },
            bye,
          ],
        },
        honest: {
          text: 'Then tell me what happened to him. The truth, or a lie. I will know which.',
          options: [
            { text: 'The truth: he was running, and I killed him in the tunnels.', next: 'trust', action: { type: 'setFlag', flag: 'mudtooth', value: 'trust' }, when: { hasItem: { item: 'mole-crown', count: 1 } } },
            { text: 'Lie to her.', next: 'lie', action: { type: 'setFlag', flag: 'mudtooth', value: 'lie' } },
          ],
        },
        trust: {
          text: 'He was running. I knew that. Thank you for not dressing it up. The deep way is open to you, and my clan will not dig against yours.',
          options: [{ text: 'Thank you.' }],
        },
        lie: {
          text: 'Then you will dig your own way, and I will see what your digging costs. Stand where you are.',
          options: [{ text: 'I am ready.' }],
        },
        trustTalk: {
          text: 'The deep moles are yours to walk among now. Mind the mud, and mind the Shard.',
          options: [bye],
        },
      },
    },

    'c6-ida-below': {
      id: 'c6-ida-below', name: 'Master Pipewright Ida Gromwell', look: look(0x3a6a7a, 0x4a4a4a, null, { bowlCut: 0x5a3a1a, glasses: true }), zone: 'deeps', x: 4, z: -80, wander: 0,
      hidden: { not: { flag: { name: 'c6-ida-speaks', value: 'yes' } } },
      examine: 'Ida, come down to the Great Valve. She has a spanner in one hand and her father\'s gauge in the other, and she is talking to him.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Keep him talking. I have his valve in one hand and his voice in the other. He is listening, Recruit. Let me finish.',
          options: [{ text: 'Go on, Ida.' }],
        },
      },
    },
  },

  // Canon NPCs that gain Chapter 6 lines. Their own packs stay untouched.
  topics: {
    thistle: [
      { text: 'Thistle, is there anything of yours down in the Backflow?', next: 'c6-path-start', action: { type: 'startQuest', quest: 'c6-path-home' }, when: { flag: { name: 'c2-forty-list', value: 'yes' }, quest: { id: 'c6-path-home', status: 'none' } } },
    ],
    ida: [
      { text: 'The old valve seals in the Backflow. Show me the way down.', next: 'c6-drains-start', action: { type: 'startQuest', quest: 'c6-down-the-drains' }, when: next('c6-firing-the-stone', 'c6-down-the-drains') },
      { text: 'The seals in the Backflow are clay, Ida.', next: 'c6-seals-start', action: { type: 'startQuest', quest: 'c6-clay-seals' }, when: next('c6-down-the-drains', 'c6-clay-seals') },
      { text: 'Now, Ida: what do we do about Potsworth?', next: 'c6-seals-start', when: { quest: { id: 'c6-clay-seals', status: 'active' }, flagUnset: 'potsworth' } },
      { text: 'Gromwell, Ida. Let us end it.', next: 'c6-valve-choice', action: { type: 'startQuest', quest: 'c6-who-holds-the-valve' }, when: next('c6-clay-seals', 'c6-who-holds-the-valve') },
      { text: 'Ida, what do I do at the Valve?', next: 'c6-valve-choice', when: { quest: { id: 'c6-who-holds-the-valve', status: 'active' }, flagUnset: 'c6-ida-speaks' } },
    ],
    potsworth: [
      { text: 'Lord Potsworth, I have Gromwell\'s notes. The seals are clay.', next: 'c6-potsworth-confront', when: { quest: { id: 'c6-clay-seals', status: 'active' }, flagUnset: 'potsworth', hasItem: { item: 'gromwell-notes', count: 1 } } },
    ],
  },

  greetingsFirst: {
    ida: [
      { when: { questStage: { id: 'c6-down-the-drains', stage: 4 } }, node: 'c6-drains-turnin' },
      { when: { questStage: { id: 'c6-who-holds-the-valve', stage: 2 }, flag: { name: 'c6-ida-speaks', value: 'yes' } }, node: 'c6-valve-yes' },
      { when: { questStage: { id: 'c6-who-holds-the-valve', stage: 2 }, flag: { name: 'c6-ida-speaks', value: 'no' } }, node: 'c6-valve-no' },
    ],
    thistle: [
      { when: { questStage: { id: 'c6-path-home', stage: 1 } }, node: 'c6-path-turnin' },
    ],
  },

  extraNodes: {
    ida: {
      'c6-drains-start': {
        text: 'The old valve seals in the Backflow, and the rust. Three seals, all of them clay, and none of them should be. Go down and break them. Then come back and tell me what you found.',
        options: [{ text: 'I will go down.' }],
      },
      'c6-seals-start': {
        text: 'Clay, you say. Then Potsworth lied to the Queen, and the Pipewrights paid for it. He must answer for it. Or you can go to him yourself, with Gromwell\'s notes.',
        options: [
          { text: 'Tell Ida: Potsworth must answer for it.', action: { type: 'setFlag', flag: 'potsworth', value: 'exposed' } },
          { text: 'Not yet.' },
        ],
      },
      'c6-valve-choice': {
        text: 'He is still at the Great Valve, holding the flood off the Keep. I am coming down with you, or I am not. Which is it?',
        options: [
          { text: 'Let me come down with you. Let me talk to him.', action: { type: 'setFlag', flag: 'c6-ida-speaks', value: 'yes' } },
          { text: 'Stay up here, Ida.', action: { type: 'setFlag', flag: 'c6-ida-speaks', value: 'no' } },
        ],
      },
      'c6-drains-turnin': {
        text: 'Clay. I knew it. Thirty years of Shard-iron tithes went into clay seals, and my father\'s toolbox went into the mud. Good work. There is one more thing to do, I think.',
        options: [{ text: 'What comes next?' }],
      },
      'c6-valve-yes': {
        text: 'He heard me. At the end, he heard me.',
        options: [{ text: 'I know, Ida.' }],
      },
      'c6-valve-no': {
        text: 'You should have let me come.',
        options: [{ text: 'I am sorry.' }],
      },
    },
    potsworth: {
      'c6-potsworth-confront': {
        text: 'Clay. I cut the costs, and the Pipewrights paid for them. I will tell the Queen myself. I have been hiding it for thirty years, and I am tired.',
        options: [{ text: 'Good. Tell her.', action: { type: 'setFlag', flag: 'potsworth', value: 'confessed' } }],
      },
    },
    thistle: {
      'c6-path-start': {
        text: 'Down in the Backflow? Hrm. There is a roll of every Pipewright who went down. Read it, and tell me what it says. I can take a long answer.',
        options: [{ text: 'I will look.' }],
      },
      'c6-path-turnin': {
        text: 'Primrose. Hrm. Hrm. He puts the broom down and sits on the bench at the end of the path. He does not say anything for a long time.',
        options: [{ text: 'I am sorry, Thistle.' }],
      },
    },
  },

  quests: {
    // Main chapter.
    'c6-new-stopping-stone': {
      id: 'c6-new-stopping-stone', name: 'A New Stopping Stone', giver: 'sedum', zone: 'rockery', level: 19, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Go back to Kilnkeeper Sedum. The front gate fell, so the Kiln has to be reached by the moles\' deep way.', objective: { type: 'talk', npc: 'sedum' } },
      ],
      reward: { gold: 120, items: [] },
    },
    'c6-humming-seam': {
      id: 'c6-humming-seam', name: 'The Humming Seam', giver: 'hammerclod', zone: 'rockery', level: 21, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Find the deep seam at the far face of the Shard Mine.', objective: { type: 'reach', zone: 'rockery', x: 46, z: -26, r: 8 } },
        { text: 'Kill eight rockery centipedes at the seam.', objective: { type: 'kill', enemy: 'rockery-centipede', count: 8 } },
        { text: 'Touch the mirror-bright Shard wall.', objective: { type: 'interact', object: 'c6-shard-wall', count: 1 } },
        { text: 'Tell Sax Hammerclod what you saw in the wall.', objective: { type: 'talk', npc: 'hammerclod' } },
      ],
      reward: { gold: 150, items: [{ item: 'c6-hammerclods-pick', count: 1 }] },
    },
    'c6-honest-words': {
      id: 'c6-honest-words', name: 'Honest Words', giver: 'mudtooth', zone: 'rockery', level: 22, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Answer Dowager Mudtooth about Grubthorn: the truth, or a lie.', objective: { type: 'choice', flag: 'mudtooth' } },
      ],
      reward: { gold: 60, items: [] },
    },
    'c6-the-unfired': {
      id: 'c6-the-unfired', name: 'The Unfired', giver: 'sedum', zone: 'rockery', level: 23, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Reach the Kiln\'s back chambers, where the Unfired stand in rows.', objective: { type: 'reach', zone: 'rockery', x: 0, z: -102, r: 8 } },
        { text: 'Finish eight Unfired. They sigh when they go, and they go gently.', objective: { type: 'kill', enemy: 'unfired', count: 8 } },
      ],
      reward: { gold: 120, items: [] },
    },
    'c6-kiln-warden': {
      id: 'c6-kiln-warden', name: 'The Kiln Warden', giver: 'sedum', zone: 'rockery', level: 24, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Defeat the Kiln Warden. At the end, it kneels and says a name.', objective: { type: 'kill', enemy: 'kiln-warden', count: 1 } },
      ],
      reward: { gold: 150, items: [] },
    },
    'c6-firing-the-stone': {
      id: 'c6-firing-the-stone', name: 'Firing the Stone', giver: 'sedum', zone: 'rockery', level: 24, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        {
          text: 'Hold the Kiln for two minutes while Sedum fires the Stone. The Unfired keep coming.',
          objective: {
            type: 'defend', zone: 'rockery', x: 0, z: -80, r: 18, seconds: 120,
            waves: [{ enemy: 'unfired', count: 3, at: 0 }, { enemy: 'unfired', count: 4, at: 30 }, { enemy: 'unfired', count: 5, at: 60 }, { enemy: 'unfired', count: 6, at: 90 }],
          },
        },
      ],
      reward: { gold: 200, items: [{ item: 'stopping-stone', count: 1 }] },
    },
    'c6-down-the-drains': {
      id: 'c6-down-the-drains', name: 'Down the Drains', giver: 'ida', zone: 'keep', level: 24, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Go down through the hatch into the Backflow, to the rust and the forty tools.', objective: { type: 'reach', zone: 'deeps', x: 0, z: -55, r: 20 } },
        { text: 'Break the first valve seal. It is clay.', objective: { type: 'interact', object: 'c6-clay-seal-1', count: 1 } },
        { text: 'Break the second valve seal.', objective: { type: 'interact', object: 'c6-clay-seal-2', count: 1 } },
        { text: 'Break the third valve seal.', objective: { type: 'interact', object: 'c6-clay-seal-3', count: 1 } },
        { text: 'Bring Ida the proof that the seals are clay.', objective: { type: 'talk', npc: 'ida' } },
      ],
      reward: { gold: 100, items: [] },
    },
    'c6-clay-seals': {
      id: 'c6-clay-seals', name: 'Clay Seals', giver: 'ida', zone: 'keep', level: 25, tier: 'main', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Decide Potsworth\'s end: tell Ida, or confront him with Gromwell\'s notes.', objective: { type: 'choice', flag: 'potsworth' } },
      ],
      reward: { gold: 100, items: [] },
    },
    'c6-who-holds-the-valve': {
      id: 'c6-who-holds-the-valve', name: 'Who Holds the Valve', giver: 'ida', zone: 'keep', level: 25, tier: 'finale', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Decide whether Ida comes down to the Great Valve with you.', objective: { type: 'choice', flag: 'c6-ida-speaks' } },
        { text: 'Kill Gromwell, Who Holds the Valve, at the Great Valve. If Ida came down, she is talking to him while you fight.', objective: { type: 'kill', enemy: 'gromwell', count: 1 } },
        { text: 'Tell Ida that Gromwell is still.', objective: { type: 'talk', npc: 'ida' } },
      ],
      reward: { gold: 200, items: [] },
    },

    // Side quests.
    'c6-brambles-old-master': {
      id: 'c6-brambles-old-master', name: "Bramble's Old Master", giver: 'cobalt', zone: 'rockery', level: 22, tier: 'side', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Bring Cobalt six Shard ore from the Shard shelf.', objective: { type: 'collect', item: 's14-shard-ore', count: 6 } },
        { text: 'Hand Cobalt the six Shard ore.', objective: { type: 'talk', npc: 'cobalt' }, takeItems: [{ item: 's14-shard-ore', count: 6 }] },
        {
          text: 'Give Cobalt Bramble\'s reply, the sobriety tonic and the release roll.',
          objective: { type: 'talk', npc: 'cobalt' },
          takeItems: [{ item: 's14-bramble-reply', count: 1 }, { item: 's14-sobriety-tonic', count: 1 }, { item: 's14-release-roll', count: 1 }],
        },
      ],
      reward: { gold: 100, items: [] },
    },
    'c6-gnorwins-trowel': {
      id: 'c6-gnorwins-trowel', name: "Gnorwin's Trowel", giver: 'cobalt', zone: 'rockery', level: 24, tier: 'side', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Tell Cobalt about the trowel you washed up with. He will reforge one like it in Kiln fire.', objective: { type: 'talk', npc: 'cobalt' } },
      ],
      reward: { gold: 0, items: [{ item: 'gnorwins-trowel', count: 1 }] },
    },
    'c6-raft-down-the-hose': {
      id: 'c6-raft-down-the-hose', name: 'Raft Down the Hose', giver: 'c6-raftwright', zone: 'rockery', level: 20, tier: 'side', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Ride the leaf-raft down the Hose to the brook where you first washed up.', objective: { type: 'reach', zone: 'thatchford', x: 4, z: 30, r: 12 } },
      ],
      reward: { gold: 30, items: [] },
    },
    'c6-path-home': {
      id: 'c6-path-home', name: 'The Path Home', giver: 'thistle', zone: 'mossbottom', level: 24, tier: 'side', chain: 'Chapter 6: Stone',
      stages: [
        { text: 'Find the Pipewright roll in the Backflow and read it.', objective: { type: 'interact', object: 'c6-pipewright-roll', count: 1 } },
        { text: 'Tell Old Thistle what the roll says.', objective: { type: 'talk', npc: 'thistle' } },
      ],
      reward: { gold: 0, items: [] },
    },
  },
};

// Silence unused-type warnings for the shapes this file documents.
export type _Ch6Shapes = [DialogueNode, Greeting, NpcDef];
