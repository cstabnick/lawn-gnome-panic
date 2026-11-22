// Content pack ch2-thatchford: Thatchford Downs and the Calling (chapter 2, levels 6-11). Prefix for new ids: c2-.
import { look, type ClassId, type ContentPack, type DialogueNode, type Greeting } from '../../config';

// The three trainers share one shape: a hub that starts the Calling, a pick node that sets the choice flag,
// a trial node that starts the branch quest, and a turn-in that runs chooseClass and then sets c2-calling-done.
interface TrialText {
  trial: ClassId;
  hello: string;
  pick: string;
  pickText: string;
  trialPitch: string;
  waiting: string;
  turnIn: string;
  turnInText: string;
  sworn: string;
}

function trainerNodes(t: TrialText): Record<string, DialogueNode> {
  const quest = `c2-trial-${t.trial}`;
  return {
    hub: {
      hub: true,
      text: t.hello,
      options: [
        { text: 'I want to take the Calling.', next: 'pick', action: { type: 'startQuest', quest: 'c2-calling' }, when: { minLevel: 5, quest: { id: 'c2-calling', status: 'none' } } },
        { text: 'I have made up my mind about the Calling.', next: 'pick', when: { quest: { id: 'c2-calling', status: 'active' }, flagUnset: 'c2-trial' } },
        { text: 'I am ready for my trial.', next: 'trial', when: { flag: { name: 'c2-trial', value: t.trial }, quest: { id: quest, status: 'none' } } },
        { text: 'Goodbye.' },
      ],
    },
    pick: {
      text: t.pick,
      options: [
        { text: t.pickText, next: 'trial', action: { type: 'setFlag', flag: 'c2-trial', value: t.trial }, when: { flagUnset: 'c2-trial' } },
        { text: 'Not yet.' },
      ],
    },
    trial: {
      text: t.trialPitch,
      options: [{ text: 'Let us begin.', action: { type: 'startQuest', quest } }, { text: 'Not yet.' }],
    },
    waiting: { text: t.waiting, options: [{ text: 'Goodbye.' }] },
    turnIn: {
      text: t.turnIn,
      options: [{ text: t.turnInText, next: 'sworn', action: { type: 'chooseClass', classId: t.trial } }],
    },
    sworn: {
      text: t.sworn,
      options: [{ text: 'Thank you.', action: { type: 'setFlag', flag: 'c2-calling-done', value: 'yes' } }],
    },
  };
}

function trainerGreetings(t: ClassId): Greeting[] {
  return [
    { when: { questStage: { id: `c2-trial-${t}`, stage: 1 } }, node: 'turnIn' },
    { when: { quest: { id: `c2-trial-${t}`, status: 'active' } }, node: 'waiting' },
    { node: 'hub' },
  ];
}

const WARDEN: TrialText = {
  trial: 'warden',
  hello: 'Sergeant Briar Stoutpot. Recruits who cry get sent home. Do you cry?',
  pick: 'Plant your feet. A gnome who has planted can\'t be moved. Want to be a Warden?',
  pickText: 'Make me a Warden.',
  trialPitch: 'Hold the Ford. Stand in the circle at the ford for sixty seconds while the water beetles come. Don\'t step out of it.',
  waiting: 'Sixty seconds at the ford, Recruit. Water beetles come in three waves. Stay in the circle.',
  turnIn: 'You stood the ford. Sixty seconds and not a step backwards. Now then. Are you a Warden?',
  turnInText: 'Then I am a Warden.',
  sworn: 'Sworn. Keep that pot lid up. The ford is yours to hold.',
};

const SLINGER: TrialText = {
  trial: 'slinger',
  hello: 'Hazel Twitchett. Bigger, faster acorns. Ever shot a magpie?',
  pick: 'Don\'t aim at the beetle. Aim at where the beetle is going to be. Want to shoot for me?',
  pickText: 'Make me a Slinger.',
  trialPitch: 'Shiny Thieves. Four magpie thieves on Crowfoot Hill. They fly off at a fifth of their health, so hit them at range.',
  waiting: 'Four magpies on Crowfoot Hill. They have your shiny things. Go and get them back.',
  turnIn: 'Four magpies, and only one of them tried to steal my hat. Good shooting. Are you a Slinger, then?',
  turnInText: 'Then I am a Slinger.',
  sworn: 'Slingers don\'t say thank you. Hit something with it. That is thanks enough.',
};

const MAGE: TrialText = {
  trial: 'mage',
  hello: 'Magister Sorrel Dimm. Sun, Rain, Bloom. Everything else is just weather. Can you feel the kiln in your hands?',
  pick: 'I have a sliver of Blade Shard that hums at night. I want proof the Kiln is magic. Want to learn the spells?',
  pickText: 'Make me a Hedge-Mage.',
  trialPitch: 'Dry Them Out. Six muck sprites, with Sun spells only. Flare, not your trowel. I will know if you cheat.',
  waiting: 'Six muck sprites by the fountains. Sun spells only. I will know.',
  turnIn: 'Six sprites, all dry. Flare, Flare, Flare. You may be a Hedge-Mage after all.',
  turnInText: 'Then I am a Hedge-Mage.',
  sworn: 'Good. Now go and find out what is humming under the Keep. I shall be listening to my shard.',
};

export const PACK: ContentPack = {
  id: 'ch2-thatchford',

  items: {
    // Thatchford smith stock (plain, ilvl 7-10).
    'c2-hand-fork': { id: 'c2-hand-fork', name: 'Hand fork', icon: '🍴', kind: 'weapon', slot: 'weapon', ilvl: 7, damageType: 'pierce', hands: 1, weaponClass: 'melee', value: 49, examine: 'For digging, for spearing, and for supper.' },
    'c2-bricklayers-mallet': { id: 'c2-bricklayers-mallet', name: 'Bricklayer\'s mallet', icon: '🔨', kind: 'weapon', slot: 'weapon', ilvl: 8, damageType: 'crush', hands: 2, weaponClass: 'melee', value: 64, examine: 'Built the ford. Could build a wall with the same swing.' },
    'c2-bottlecap-helm': { id: 'c2-bottlecap-helm', name: 'Bottlecap helm', icon: '🪖', kind: 'armor', slot: 'head', ilvl: 9, armorType: 'plate', value: 81, examine: 'Three bottle caps, riveted to a tin hat. It clinks when you nod.' },
    'c2-bottlecap-cuirass': { id: 'c2-bottlecap-cuirass', name: 'Bottlecap cuirass', icon: '🥋', kind: 'armor', slot: 'body', ilvl: 10, armorType: 'plate', value: 100, examine: 'Dozens of bottle caps on a leather back. Smells faintly of ale.' },
    'c2-bottlecap-greaves': { id: 'c2-bottlecap-greaves', name: 'Bottlecap greaves', icon: '🦵', kind: 'armor', slot: 'legs', ilvl: 8, armorType: 'plate', value: 64, examine: 'Clink, clink, clink. Stealth is not an option.' },
    'c2-ash-slingshot': { id: 'c2-ash-slingshot', name: 'Ash slingshot', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 8, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 64, examine: 'Ash wood, springy as a cat.' },
    'c2-hollow-stem-blowpipe': { id: 'c2-hollow-stem-blowpipe', name: 'Hollow-stem blowpipe', icon: '🎋', kind: 'weapon', slot: 'weapon', ilvl: 7, damageType: 'pierce', hands: 1, weaponClass: 'blowpipe', value: 49, examine: 'The stem is hollow. The dart is not, which is the point.' },
    'c2-mole-hide-jerkin': { id: 'c2-mole-hide-jerkin', name: 'Mole-hide jerkin', icon: '🦺', kind: 'armor', slot: 'body', ilvl: 9, armorType: 'leather', value: 81, examine: 'Soft, dark and smelling of tunnels. Moles would not approve.' },
    'c2-hazel-staff': { id: 'c2-hazel-staff', name: 'Hazel staff', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 9, damageType: 'crush', hands: 2, weaponClass: 'staff', value: 81, examine: 'Straight, pale and humming faintly.' },
    // The smith's better pieces, kept behind the counter (sprouted, value 2 x ilvl^2).
    'c2-tempered-fork': { id: 'c2-tempered-fork', name: 'Tempered hand fork', icon: '🍴', kind: 'weapon', slot: 'weapon', ilvl: 10, rarity: 'sprouted', damageType: 'pierce', hands: 1, weaponClass: 'melee', stats: { strength: 1 }, value: 200, prefab: 'hand-fork', examine: 'Quenched twice and filed sharp. He keeps it behind the counter for gnomes who ask.' },
    'c2-whip-ash-slingshot': { id: 'c2-whip-ash-slingshot', name: 'Whip-ash slingshot', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 10, rarity: 'sprouted', damageType: 'pierce', hands: 1, weaponClass: 'sling', stats: { agility: 1 }, value: 200, prefab: 'twig-slingshot', examine: 'Seasoned ash and a doubled band. It snaps back like a gate in the wind.' },
    'c2-ringed-hazel-staff': { id: 'c2-ringed-hazel-staff', name: 'Ringed hazel staff', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 10, rarity: 'sprouted', damageType: 'crush', hands: 2, weaponClass: 'staff', stats: { intelligence: 1 }, value: 200, prefab: 'hazel-staff', examine: 'Hazel with three copper rings hammered on. It hums a little louder than the plain one.' },
    'c2-quilted-tabard': { id: 'c2-quilted-tabard', name: 'Quilted tabard', icon: '🥼', kind: 'armor', slot: 'body', ilvl: 10, rarity: 'sprouted', armorType: 'cloth', stats: { endurance: 1 }, value: 200, prefab: 'cloth-smock', examine: 'Thick sacking, quilted in squares and dyed the brown of the Downs. It turns a thorn.' },
    'c2-felted-hood': {
      id: 'c2-felted-hood', name: 'Felted hood', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 10, rarity: 'sprouted', armorType: 'cloth', stats: { endurance: 1 }, value: 200, prefab: 'mushroom-hood',
      examine: 'Felt pressed by the fountains, warm and dry in any rain.',
      gate: { when: { quest: { id: 'c2-pressures-wrong', status: 'done' } }, why: 'Dock\'s felt is pressed at the Spinning Fountains, and their pressure\'s wrong. Finish Pressure\'s Wrong.' },
    },
    'c2-petal-silk-smock': { id: 'c2-petal-silk-smock', name: 'Petal-silk smock', icon: '👘', kind: 'armor', slot: 'body', ilvl: 8, armorType: 'cloth', value: 64, examine: 'Light as a petal and twice as pink.' },

    // Food and the Calling's class weapons (Sprouted, ilvl 6).
    'c2-toadstool-stew': { id: 'c2-toadstool-stew', name: 'Toadstool stew', icon: '🍲', kind: 'potion', heal: 12, stackable: true, value: 8, examine: 'Hot, thick and from the back kitchen of the Tipsy Toadstool. Restores 12 hit points.' },
    'c2-warden-trowel': { id: 'c2-warden-trowel', name: 'Warden\'s trowel', icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 6, rarity: 'sprouted', damageType: 'slash', hands: 1, weaponClass: 'melee', value: 72, examine: 'Sergeant Stoutpot\'s spare. It has planted a few things in its time.' },
    'c2-slinger-sling': { id: 'c2-slinger-sling', name: 'Slinger\'s sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 6, rarity: 'sprouted', damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 72, examine: 'Hazel\'s old sling. The pouch is still warm from the last shot.' },
    'c2-mage-staff': { id: 'c2-mage-staff', name: 'Hedge-Mage staff', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 6, rarity: 'sprouted', damageType: 'crush', hands: 2, weaponClass: 'staff', value: 72, examine: 'Magister Dimm\'s first staff. It still has a sliver of Blade Shard in its grip.' },

    // Rotgut's drop.
    'c2-rotguts-fork': { id: 'c2-rotguts-fork', name: 'Rotgut\'s Fork', icon: '🍴', kind: 'weapon', slot: 'weapon', ilvl: 11, rarity: 'heirloom', damageType: 'pierce', hands: 2, weaponClass: 'melee', value: 968, effect: 'Hits poison.', examine: 'It has eaten from more bins than you have.' },

    // Consumables named in items.md.
    'glaze-pot': { id: 'glaze-pot', name: 'Glaze pot', icon: '🏺', kind: 'potion', stackable: true, value: 12, effect: 'Absorb 10% max HP for 10 s.', examine: 'A little pot of glaze. Brush it on and you are briefly harder to crack.' },
    'salt-pinch': { id: 'salt-pinch', name: 'Salt pinch', icon: '🧂', kind: 'misc', stackable: true, value: 8, effect: 'Thrown: 40 damage to soft enemies, Slowed.', examine: 'Stings the eyes of anything soft. Gnomes too, if you are careless.' },

    // Quest items.
    'tremor-tally': { id: 'tremor-tally', name: 'Rye\'s Tremor Tally', icon: '📜', kind: 'misc', questItem: true, value: 0, examine: 'Thirty-one years of marks, closer together each year.' },
    'c2-hose-reed': { id: 'c2-hose-reed', name: 'Hose reed', icon: '🌾', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Long, green and ideal for binding a wheel.' },
    'c2-clay-chunk': { id: 'c2-clay-chunk', name: 'Clay chunk', icon: '🟫', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Raw clay from the Hose bank. Somebody made something out of this, once.' },
    'c2-tansy-letters': { id: 'c2-tansy-letters', name: 'Tansy\'s letters', icon: '✉️', kind: 'misc', questItem: true, value: 0, examine: 'Fifty-two letters to the Archive, never sent. Postage is owed.' },
    'c2-letter-of-passage': { id: 'c2-letter-of-passage', name: 'Letter of passage', icon: '📨', kind: 'misc', questItem: true, value: 0, examine: 'Take it to the Keep. Don\'t say the Reeve sent you.' },
  },

  enemies: {
    'water-beetle': {
      id: 'water-beetle', name: 'Water beetle', level: 6, rank: 'normal', family: 'shelled', damageType: 'slash', aggressive: true,
      loot: [{ item: 'beetle-shell', chance: 0.6 }, { item: 'c2-clay-chunk', chance: 0.4 }], gold: [0, 6],
      model: 'beetle', color: 0x2f5d6b, scale: 1.1, respawnSeconds: 30,
      examine: 'It dives under the Hose and comes up somewhere else, looking pleased about it.', wants: 'Its stretch of the Hose bank.',
    },
    'hose-leech': {
      id: 'hose-leech', name: 'Hose leech', level: 7, rank: 'normal', family: 'soft', damageType: 'pierce', aggressive: true,
      loot: [{ item: 'c2-hose-reed', chance: 0.6 }], gold: [1, 4],
      model: 'leech', color: 0x3a4a2a, scale: 1, respawnSeconds: 30,
      examine: 'It has strong opinions about gnome sap.', wants: 'Gnome sap.',
    },
    'muck-sprite': {
      id: 'muck-sprite', name: 'Muck sprite', level: 7, rank: 'normal', family: 'soft', damageType: 'crush', aggressive: true,
      loot: [], gold: [1, 4],
      model: 'slug', color: 0x4a7fa0, scale: 0.9, respawnSeconds: 30,
      examine: 'A living puddle with a grudge, leaking out of the fountains.', wants: 'To splash.',
    },
    'brown-rat': {
      id: 'brown-rat', name: 'Brown rat', level: 8, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [], gold: [1, 5],
      model: 'rat', color: 0x6b5a4a, scale: 1, respawnSeconds: 30,
      examine: 'Fat from the Thatchford bins. It has never once been sorry.', wants: 'Food stores.',
    },
    'magpie-thief': {
      id: 'magpie-thief', name: 'Magpie thief', level: 8, rank: 'normal', family: 'winged', damageType: 'pierce', aggressive: true,
      loot: [{ item: 'mb-tin-ring', chance: 0.2 }], gold: [2, 8],
      model: 'crow', color: 0x1c1c22, scale: 1, respawnSeconds: 30,
      examine: 'It steals shiny things. It will steal yours, given half a chance.', wants: 'Shiny things.',
    },
    earthworm: {
      id: 'earthworm', name: 'Giant earthworm', level: 9, rank: 'normal', family: 'soft', damageType: 'crush', aggressive: false,
      loot: [], gold: [0, 2],
      model: 'worm', color: 0x9a6b5a, scale: 1.2, respawnSeconds: 30,
      examine: 'Passive unless hit. It turns the compost, which is more than most of us do.', wants: 'To turn the compost.',
    },
    'heap-rat': {
      id: 'heap-rat', name: 'Heap rat', level: 9, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [], gold: [1, 4],
      model: 'rat', color: 0x4a4038, scale: 1, respawnSeconds: 30,
      examine: 'Organised. That is the worrying part.', wants: 'The Heap is their kingdom.',
    },
    'grub-swarm': {
      id: 'grub-swarm', name: 'Grub swarm', level: 10, rank: 'trivial', family: 'soft', damageType: 'crush', aggressive: true,
      loot: [], gold: [0, 2],
      model: 'worm', color: 0xd8c8a0, scale: 0.5, respawnSeconds: 30,
      examine: 'Always four of them. Never three, never five.', wants: 'Rot to eat.',
    },
    rotgut: {
      id: 'rotgut', name: 'Rotgut, Rat of the Heap', level: 11, rank: 'boss', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [{ item: 'c2-rotguts-fork', chance: 1 }, { item: 'red-potion', chance: 1, count: 2 }], gold: [60, 90],
      model: 'rat', color: 0x5a4a3a, scale: 2.4, respawnSeconds: 0,
      examine: 'The rat on the throne of peelings. He is very fat and very much in charge.', wants: 'His throne of peelings.',
      moves: [
        { id: 'belly-flop', name: 'Belly Flop', kind: 'ring', every: 12, telegraph: 1.5, radius: 4, damage: 1.2, status: 'staggered', statusSeconds: 1 },
        { id: 'rat-pack', name: 'Rat Pack', kind: 'summon', every: 25, telegraph: 1, belowHpPct: 0.6, summon: { enemy: 'heap-rat', count: 2 } },
        { id: 'steaming-rot', name: 'Steaming Rot', kind: 'pool', every: 14, telegraph: 1.2, radius: 2.5, damage: 0.45, status: 'poisoned', statusSeconds: 4 },
      ],
      lastWords: 'The bins were mine.',
    },
  },

  npcs: {
    burlap: {
      id: 'burlap', name: 'Reeve Yarrow Burlap', look: look(0x6b5a3a, 0x7a6a4a, 0x9c8f7a, { glasses: true }), zone: 'thatchford', x: 6, z: 4, wander: 0.5,
      examine: 'Reeve of Thatchford. A ledger in one hand, a cup of tea in the other, and neither is steady.',
      greetings: [
        { when: { questStage: { id: 'c2-letter-for-the-queen', stage: 0 } }, node: 'letterTurnIn' },
        { when: { questStage: { id: 'c2-word-to-the-reeve', stage: 0 } }, node: 'wordTurnIn' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'A rumble? Carts. It\'s always carts. The ford is open, the market is open, and I have forty things to sign.',
          options: [
            { text: 'The moles are running north. Fernwick says the ground is moving.', next: 'warning', action: { type: 'startQuest', quest: 'c2-word-to-the-reeve' }, when: { quest: { id: 'c2-word-to-the-reeve', status: 'none' }, questAtLeast: { id: 'mb-what-moles-know', stage: 3 } } },
            { text: 'Is there anything I can do for the Queen?', next: 'letterAsk', action: { type: 'startQuest', quest: 'c2-letter-for-the-queen' }, when: { quest: { id: 'c2-letter-for-the-queen', status: 'none' }, questAtLeast: { id: 'c2-pressures-wrong', stage: 6 }, hasItem: { item: 'tremor-tally', count: 1 } } },
            { text: 'Something is eating the bins at the Compost Heap.', next: 'heap', action: { type: 'startQuest', quest: 'c2-the-heap' }, when: { quest: { id: 'c2-the-heap', status: 'none' }, flagSet: 'c2-calling-done' } },
            { text: 'Goodbye.' },
          ],
        },
        warning: { text: 'Carts. It\'s always carts. Go and count some wheels, if you are bored.', options: [{ text: 'I will look into it.' }] },
        wordTurnIn: { text: 'Back again? Carts. It\'s always carts.', options: [{ text: 'So you keep saying.' }] },
        letterAsk: { text: 'Tally and Nettle\'s report, for the Queen? Bring me Rye\'s tally and Nettle\'s word. Then we will see what kind of trouble we are in.', options: [{ text: 'I will bring them.' }] },
        letterTurnIn: { text: 'Rye\'s tally. Nettle\'s report. The pressure under the Keep. Fine. *Fine.* Take it to the Keep. Don\'t say I sent you.', options: [{ text: 'I will not say a word.' }] },
        heap: { text: 'Rotgut, Rat of the Heap. He has a throne of peelings and an army of his own. Mind the steam.', options: [{ text: 'I will deal with him.' }] },
      },
    },

    stoutpot: {
      id: 'stoutpot', name: 'Sergeant Briar Stoutpot', look: look(0x8b1e1e, 0x5a5a5a, 0xb0b0b0), zone: 'thatchford', x: 7, z: -12, wander: 0, trainer: 'warden',
      examine: 'Warden trainer. She stands like a fence post that has been told off.',
      greetings: trainerGreetings('warden'),
      nodes: trainerNodes(WARDEN),
    },
    twitchett: {
      id: 'twitchett', name: 'Hazel Twitchett', look: look(0x2e6b3a, 0x6b4a2a, null, { hair: { color: 0xc0692a, style: 'pigtails' } }), zone: 'thatchford', x: 13, z: -12, wander: 0, trainer: 'slinger',
      examine: 'Slinger trainer. A Barkhollow hunter who came home alone once, and does not talk about it.',
      greetings: trainerGreetings('slinger'),
      nodes: trainerNodes(SLINGER),
    },
    dimm: {
      id: 'dimm', name: 'Magister Sorrel Dimm', look: look(0x3a2a6b, 0x2a2a3a, 0xe0e0e0, { glasses: true }), zone: 'thatchford', x: 10, z: -7, wander: 0, trainer: 'mage',
      examine: 'Hedge-Mage trainer. He keeps one hand on his coat pocket, where the shard is.',
      greetings: trainerGreetings('mage'),
      nodes: trainerNodes(MAGE),
    },
    puddleby: {
      id: 'puddleby', name: 'Dill Puddleby', look: look(0x7a4a2a, 0xb07a3a, 0x7a4a2a), zone: 'thatchford', x: -8, z: 4, wander: 0.5, shop: ['c2-toadstool-stew', 'mushroom', 'cigs', 'beer'],
      examine: 'Innkeeper of the Tipsy Toadstool. Knows which merchants are Even Cut, and will say so for a favour.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Rest XP\'s on the house. Ale isn\'t.',
          options: [
            { text: 'Show me the menu.', action: { type: 'openShop' } },
            { text: 'Who sits at that laid table?', next: 'table', action: { type: 'startQuest', quest: 'c2-empty-table' }, when: { quest: { id: 'c2-empty-table', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        table: {
          text: 'Forty Pipewrights, lost in the Backflow, and most of them were ours. We toast the empty chair every night. Go on, sit in it. The room goes quiet, that\'s all.',
          options: [{ text: 'I will sit there.' }],
        },
      },
    },
    grindwell: {
      id: 'grindwell', name: 'Rye Grindwell', look: look(0x5a5a3a, 0xd8d0b8, 0xeeeeee), zone: 'thatchford', x: -13, z: -17, wander: 0,
      examine: 'The miller. Flour in his eyebrows and a tally stick in his hand, notched all the way up.',
      greetings: [
        { when: { questStage: { id: 'c2-tremor-tally', stage: 3 } }, node: 'tallyTurnIn' },
        { when: { quest: { id: 'c2-tremor-tally', status: 'active' } }, node: 'waiting' },
        { when: { quest: { id: 'c2-tremor-tally', status: 'done' } }, node: 'done' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'My wheel is cracked and my tally is getting longer. Want to hear about it?',
          options: [
            { text: 'What happened to your wheel?', next: 'wheel', action: { type: 'startQuest', quest: 'c2-tremor-tally' }, when: { quest: { id: 'c2-tremor-tally', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        wheel: {
          text: 'The wheel cracked the night of the First Rumble. I have counted every tremor since. Bring three hose reeds for the bindings, clear five beetles out of the spokes, then look at the wheel yourself.',
          options: [{ text: 'I will bring the reeds.' }],
        },
        waiting: { text: 'Three reeds, five beetles, one good look at the wheel. Then come back and I will show you the tally.', options: [{ text: 'On my way.' }] },
        tallyTurnIn: {
          text: 'Thirty-one years of marks, and the last ones are close together. Count them. Then tell me it\'s carts.',
          options: [{ text: 'I will tell Burlap.' }],
        },
        done: { text: 'The tally is with the Reeve now. Good luck getting him to read it.', options: [{ text: 'Goodbye.' }] },
      },
    },
    nettle: {
      id: 'nettle', name: 'Nettle', look: look(0x3a7a6a, 0x9ad0b0, null, { freckles: true, dress: true }), zone: 'thatchford', x: -6, z: -4, wander: 0.5,
      examine: 'Pipewright apprentice to Ida Gromwell. Overalls, spanner and an expression that has been bothered for years.',
      greetings: [
        { when: { questStage: { id: 'c2-pressures-wrong', stage: 5 } }, node: 'pressureTurnIn' },
        { when: { quest: { id: 'c2-pressures-wrong', status: 'active' } }, node: 'waiting' },
        { when: { quest: { id: 'c2-pressures-wrong', status: 'done' } }, node: 'done' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Pressure\'s wrong. Pressure\'s been wrong since before I was glazed. Don\'t ask me how I know. Ask me what to do.',
          options: [
            { text: 'What is wrong with the fountains?', next: 'ask', action: { type: 'startQuest', quest: 'c2-pressures-wrong' }, when: { quest: { id: 'c2-pressures-wrong', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        ask: {
          text: 'Go to the Spinning Fountains and turn the four valves, one at a time. Keep your head down. The sprites come out of the pipes when you do.',
          options: [{ text: 'On my way.' }],
        },
        waiting: { text: 'Four valves, one at a time. Keep your head down and listen to the pipes.', options: [{ text: 'On my way.' }] },
        pressureTurnIn: {
          text: 'Pressure\'s coming from under the Keep. From the Deeps. Tell the Reeve, and watch him not want to hear it.',
          options: [{ text: 'Thanks, Nettle.' }],
        },
        done: { text: 'The fountains are quiet. For now.', options: [{ text: 'Goodbye.' }] },
      },
    },
    sedge: {
      id: 'sedge', name: 'Brother Sedge', look: look(0xe8e8e8, 0x8fbc8f, 0xdddddd), zone: 'thatchford', x: -12, z: -14, wander: 1,
      examine: 'Preacher of the Even Cut in the square. Soft-spoken, friendly, and the creepiest gnome in town.',
      greetings: [
        { when: { flagSet: 'sedge' }, node: 'after' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Peace is a lawn where no blade stands taller than another. Would you like to help spread the word?',
          options: [
            { text: 'What are the pamphlets?', next: 'pamphlets', when: { flagUnset: 'sedge' } },
            { text: 'Goodbye.' },
          ],
        },
        pamphlets: {
          text: 'Five pamphlets, "The Even Lawn". Hand them out in the square, where people can see you doing it. Or burn them, if you think I shouldn\'t have asked.',
          options: [
            { text: 'I will hand them out.', next: 'trusted', action: { type: 'startQuest', quest: 'c2-sedge-pamphlets' } },
            { text: 'I will burn them.', next: 'wary', action: { type: 'startQuest', quest: 'c2-sedge-pamphlets' } },
          ],
        },
        trusted: {
          text: 'Wonderful. Perfect lawns for everyone. You will hear a little more from me, later.',
          options: [{ text: 'Peace.', action: { type: 'setFlag', flag: 'sedge', value: 'trusted' } }],
        },
        wary: {
          text: 'Hm. Burn them, then. The lawn remembers who was careless.',
          options: [{ text: 'Goodbye.', action: { type: 'setFlag', flag: 'sedge', value: 'wary' } }],
        },
        after: {
          text: 'Peace to you. Keep off the grass at the Neat Chapel. Trust me on that one.',
          options: [{ text: 'Goodbye.' }],
        },
      },
    },
    clementine: {
      id: 'clementine', name: 'Clementine Wick', look: look(0xc04a6a, 0xf0e0e0, null, { dress: true, freckles: true }), zone: 'thatchford', x: 14, z: 2, wander: 0.5, shop: ['glaze-pot', 'salt-pinch'],
      examine: 'Postmistress and general dealer. Holds more undelivered post than the Archive.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Post, supplies or gossip? Supplies are cheaper.',
          options: [
            { text: 'Let me see the general stock.', action: { type: 'openShop' } },
            { text: 'Tell me about the letters in the back.', next: 'postage', when: { quest: { id: 'c2-postage-due', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        postage: {
          text: 'Tansy\'s letters to the Archive. Fifty-two of them, never sent. Two pence a letter, so you do the sums. Carry them to Archivist Inkcap in the Keep and that will be the end of it.',
          options: [{ text: 'I will carry them.', next: 'letters', action: { type: 'startQuest', quest: 'c2-postage-due' } }],
        },
        letters: {
          text: 'Here. Mind the damp, they have been in the back since the Backflow.',
          options: [{ text: 'Thank you.', action: { type: 'giveItem', item: 'c2-tansy-letters', count: 1 } }],
        },
      },
    },
    'c2-smith': {
      id: 'c2-smith', name: 'Dock Clodpate, the Smith', look: look(0x2a2a2a, 0x6a2e1a, 0x3a2a1a), zone: 'thatchford', x: -16, z: 6, wander: 0,
      examine: 'Thatchford\'s smith. A forge in the middle of a toadstool roof, which is a bold choice.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Blades, plate and the odd slingshot. Plain iron, a fair price, and no bragging about it.',
          options: [{ text: 'Show me your wares.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
        },
      },
      shop: [
        'c2-hand-fork', 'c2-bricklayers-mallet', 'c2-bottlecap-helm', 'c2-bottlecap-cuirass', 'c2-bottlecap-greaves',
        'c2-ash-slingshot', 'c2-hollow-stem-blowpipe', 'c2-mole-hide-jerkin', 'c2-hazel-staff', 'c2-petal-silk-smock',
        'c2-tempered-fork', 'c2-whip-ash-slingshot', 'c2-ringed-hazel-staff', 'c2-quilted-tabard', 'c2-felted-hood',
      ],
    },
    'c2-kilnwright': {
      id: 'c2-kilnwright', name: 'Rue Brickwell, Kilnwright', look: look(0xa0522d, 0x8a7a60, 0x9a9a9a), zone: 'thatchford', x: 12, z: 10, wander: 0.5,
      examine: 'Makes gnomes out of the town kiln\'s clay when the town needs one. Glazes are her hobby.',
      greetings: [
        { when: { questStage: { id: 'c2-cracked-pots', stage: 1 } }, node: 'turnIn' },
        { when: { quest: { id: 'c2-cracked-pots', status: 'active' } }, node: 'waiting' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'I need clay chunks from the Hose banks. The ones the water has cracked. You know what happens to a cracked gnome.',
          options: [
            { text: 'I will fetch six chunks.', action: { type: 'startQuest', quest: 'c2-cracked-pots' }, when: { quest: { id: 'c2-cracked-pots', status: 'none' } } },
            { text: 'Goodbye.' },
          ],
        },
        waiting: { text: 'Six clay chunks from the Hose banks. Cracked ones are best.', options: [{ text: 'On my way.' }] },
        turnIn: {
          text: 'Six chunks. Look at the grain: that is the Hose, that is the Kiln. Gnomes are fired clay, you know. Glaze pots are next.',
          options: [{ text: 'Thanks, Rue.', action: { type: 'setFlag', flag: 'c2-glaze-unlocked', value: 'yes' } }],
        },
      },
    },
  },

  quests: {
    'c2-calling': {
      id: 'c2-calling', name: 'The Calling', giver: 'stoutpot', zone: 'thatchford', level: 5, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Pick your trainer in the guildhall and take their trial.', objective: { type: 'choice', flag: 'c2-trial' } },
        { text: 'Finish your trial and take your class from your trainer.', objective: { type: 'choice', flag: 'c2-calling-done' } },
      ],
      reward: { gold: 0, items: [] },
    },
    'c2-trial-warden': {
      id: 'c2-trial-warden', name: 'Hold the Ford', giver: 'stoutpot', zone: 'thatchford', level: 6, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Defend the ford for sixty seconds, without leaving the circle.', objective: { type: 'defend', zone: 'thatchford', x: 0, z: 0, r: 6, seconds: 60, waves: [{ enemy: 'water-beetle', count: 3, at: 0 }, { enemy: 'water-beetle', count: 3, at: 20 }, { enemy: 'water-beetle', count: 4, at: 40 }] } },
        { text: 'Report back to Sergeant Stoutpot.', objective: { type: 'talk', npc: 'stoutpot' } },
      ],
      reward: { gold: 40, items: [{ item: 'c2-warden-trowel', count: 1 }] },
    },
    'c2-trial-slinger': {
      id: 'c2-trial-slinger', name: 'Shiny Thieves', giver: 'twitchett', zone: 'thatchford', level: 6, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Kill 4 magpie thieves on Crowfoot Hill.', objective: { type: 'kill', enemy: 'magpie-thief', count: 4 } },
        { text: 'Report back to Hazel Twitchett.', objective: { type: 'talk', npc: 'twitchett' } },
      ],
      reward: { gold: 40, items: [{ item: 'c2-slinger-sling', count: 1 }] },
    },
    'c2-trial-mage': {
      id: 'c2-trial-mage', name: 'Dry Them Out', giver: 'dimm', zone: 'thatchford', level: 6, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Kill 6 muck sprites by the Spinning Fountains.', objective: { type: 'kill', enemy: 'muck-sprite', count: 6 } },
        { text: 'Report back to Magister Dimm.', objective: { type: 'talk', npc: 'dimm' } },
      ],
      reward: { gold: 40, items: [{ item: 'c2-mage-staff', count: 1 }] },
    },

    'c2-word-to-the-reeve': {
      id: 'c2-word-to-the-reeve', name: 'Word to the Reeve', giver: 'burlap', zone: 'thatchford', level: 6, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Tell Reeve Burlap that the ground is moving.', objective: { type: 'talk', npc: 'burlap' } },
      ],
      reward: { gold: 40, items: [] },
    },
    'c2-tremor-tally': {
      id: 'c2-tremor-tally', name: 'The Tremor Tally', giver: 'grindwell', zone: 'thatchford', level: 7, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Gather 3 hose reeds from the Hose banks.', objective: { type: 'collect', item: 'c2-hose-reed', count: 3 } },
        { text: 'Kill 5 water beetles nesting in the mill wheel.', objective: { type: 'kill', enemy: 'water-beetle', count: 5 } },
        { text: 'Look at the mill wheel.', objective: { type: 'interact', object: 'c2-mill-wheel', count: 1 } },
        { text: 'Tell Rye what the wheel says.', objective: { type: 'talk', npc: 'grindwell' }, takeItems: [{ item: 'c2-hose-reed', count: 3 }] },
      ],
      reward: { gold: 60, items: [{ item: 'tremor-tally', count: 1 }] },
    },
    'c2-pressures-wrong': {
      id: 'c2-pressures-wrong', name: 'Pressure\'s Wrong', giver: 'nettle', zone: 'thatchford', level: 8, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Reach the Spinning Fountains.', objective: { type: 'reach', zone: 'thatchford', x: -55, z: -35, r: 24 } },
        { text: 'Turn the first fountain valve.', objective: { type: 'interact', object: 'c2-fountain-valve-1', count: 1 } },
        { text: 'Turn the second fountain valve.', objective: { type: 'interact', object: 'c2-fountain-valve-2', count: 1 } },
        { text: 'Turn the third fountain valve.', objective: { type: 'interact', object: 'c2-fountain-valve-3', count: 1 } },
        { text: 'Turn the fourth fountain valve.', objective: { type: 'interact', object: 'c2-fountain-valve-4', count: 1 } },
        { text: 'Report to Nettle.', objective: { type: 'talk', npc: 'nettle' } },
      ],
      reward: { gold: 100, items: [] },
    },
    'c2-the-heap': {
      id: 'c2-the-heap', name: 'The Heap', giver: 'burlap', zone: 'thatchford', level: 10, tier: 'main', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Reach the Compost Heap.', objective: { type: 'reach', zone: 'thatchford', x: 65, z: 45, r: 18 } },
        { text: 'Kill Rotgut, Rat of the Heap.', objective: { type: 'kill', enemy: 'rotgut', count: 1 } },
      ],
      reward: { gold: 150, items: [] },
    },
    'c2-letter-for-the-queen': {
      id: 'c2-letter-for-the-queen', name: 'A Letter for the Queen', giver: 'burlap', zone: 'thatchford', level: 10, tier: 'finale', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Take Rye\'s tally and Nettle\'s report to Reeve Burlap.', objective: { type: 'talk', npc: 'burlap' }, takeItems: [{ item: 'tremor-tally', count: 1 }] },
      ],
      reward: { gold: 200, items: [{ item: 'c2-letter-of-passage', count: 1 }] },
    },

    'c2-empty-table': {
      id: 'c2-empty-table', name: 'The Empty Table', giver: 'puddleby', zone: 'thatchford', level: 6, tier: 'side', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Sit at the laid table in the Tipsy Toadstool.', objective: { type: 'interact', object: 'c2-laid-table', count: 1 } },
      ],
      reward: { gold: 20, items: [] },
    },
    'c2-postage-due': {
      id: 'c2-postage-due', name: 'Postage Due', giver: 'clementine', zone: 'thatchford', level: 7, tier: 'side', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Take Tansy\'s 52 letters from Clementine.', objective: { type: 'collect', item: 'c2-tansy-letters', count: 1 } },
        { text: 'Carry the letters to Archivist Inkcap in the Keep.', objective: { type: 'talk', npc: 'inkcap' }, takeItems: [{ item: 'c2-tansy-letters', count: 1 }] },
      ],
      reward: { gold: 40, items: [] },
    },
    'c2-sedge-pamphlets': {
      id: 'c2-sedge-pamphlets', name: 'Brother Sedge\'s Pamphlets', giver: 'sedge', zone: 'thatchford', level: 6, tier: 'side', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Hand out the five pamphlets in the square, or burn them.', objective: { type: 'choice', flag: 'sedge' } },
      ],
      reward: { gold: 20, items: [] },
    },
    'c2-cracked-pots': {
      id: 'c2-cracked-pots', name: 'Cracked Pots', giver: 'c2-kilnwright', zone: 'thatchford', level: 7, tier: 'side', chain: 'Chapter 2: It\'s Always Carts',
      stages: [
        { text: 'Collect 6 clay chunks from the Hose banks.', objective: { type: 'collect', item: 'c2-clay-chunk', count: 6 } },
        { text: 'Bring the clay to the kilnwright.', objective: { type: 'talk', npc: 'c2-kilnwright' }, takeItems: [{ item: 'c2-clay-chunk', count: 6 }] },
      ],
      reward: { gold: 30, items: [] },
    },
  },

  spawns: [
    { id: 'c2-spawn-1', zone: 'thatchford', enemy: 'water-beetle', count: 5, spread: 14 },
    { id: 'c2-spawn-2', zone: 'thatchford', enemy: 'water-beetle', count: 3, spread: 4 },
    { id: 'c2-spawn-3', zone: 'thatchford', enemy: 'hose-leech', count: 4, spread: 12 },
    { id: 'c2-spawn-4', zone: 'thatchford', enemy: 'muck-sprite', count: 6, spread: 14 },
    { id: 'c2-spawn-5', zone: 'thatchford', enemy: 'brown-rat', count: 4, spread: 8 },
    { id: 'c2-spawn-6', zone: 'thatchford', enemy: 'magpie-thief', count: 4, spread: 10 },
    { id: 'c2-spawn-7', zone: 'thatchford', enemy: 'earthworm', count: 3, spread: 8 },
    { id: 'c2-spawn-8', zone: 'thatchford', enemy: 'heap-rat', count: 5, spread: 10 },
    { id: 'c2-spawn-9', zone: 'thatchford', enemy: 'grub-swarm', count: 4, spread: 4 },
    { id: 'c2-spawn-10', zone: 'thatchford', enemy: 'rotgut', count: 1, spread: 0 },
  ],

  objects: {
    'c2-mill-wheel': {
      id: 'c2-mill-wheel', zone: 'thatchford', name: 'Mill wheel', model: 'generic',
      verb: 'Inspect', examine: 'The great wheel, cracked on the night of the First Rumble. Its spokes are notched with tally marks.',
      text: 'Thirty-one years of marks. The newest ones are close together.',
    },
    'c2-fountain-valve-1': {
      id: 'c2-fountain-valve-1', zone: 'thatchford', name: 'Fountain valve', model: 'valve',
      verb: 'Turn', examine: 'A brass valve on a sprinkler stem, hissing quietly.',
      text: 'You turn the valve. The fountain stutters, and something wet crawls out of the pipe.', once: true,
    },
    'c2-fountain-valve-2': {
      id: 'c2-fountain-valve-2', zone: 'thatchford', name: 'Fountain valve', model: 'valve',
      verb: 'Turn', examine: 'A brass valve on a sprinkler stem, hissing quietly.',
      text: 'You turn the valve. The fountain stutters, and something wet crawls out of the pipe.', once: true,
    },
    'c2-fountain-valve-3': {
      id: 'c2-fountain-valve-3', zone: 'thatchford', name: 'Fountain valve', model: 'valve',
      verb: 'Turn', examine: 'A brass valve on a sprinkler stem, hissing quietly.',
      text: 'You turn the valve. The fountain stutters, and something wet crawls out of the pipe.', once: true,
    },
    'c2-fountain-valve-4': {
      id: 'c2-fountain-valve-4', zone: 'thatchford', name: 'Fountain valve', model: 'valve',
      verb: 'Turn', examine: 'A brass valve on a sprinkler stem, hissing quietly.',
      text: 'You turn the valve. The fountain stutters, and something wet crawls out of the pipe.', once: true,
    },
    'c2-laid-table': {
      id: 'c2-laid-table', zone: 'thatchford', name: 'Laid table', model: 'generic',
      verb: 'Sit', examine: 'A table laid for forty, with forty cups. One is still full.',
      text: 'The room goes quiet. Dill starts the toast, and nobody finishes it.', once: true,
      setFlag: { flag: 'c2-forty-list', value: 'yes' },
    },
  },
};
