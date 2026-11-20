// Content pack ch3-keep: The Keep and the Ledger (Birdbath Keep + Drainpipe Gutters, levels 10-12). Prefix for new ids: c3-.
import { look, type ContentPack } from '../../config';

export const PACK: ContentPack = {
  id: 'ch3-keep',

  items: {
    // Royal armoury stock (plain, ilvl 10-12: value about ilvl squared).
    'c3-keep-spear': { id: 'c3-keep-spear', name: 'Royal spear', icon: '🔱', kind: 'weapon', slot: 'weapon', ilvl: 11, damageType: 'pierce', hands: 2, weaponClass: 'melee', value: 121, examine: 'Polished every morning by someone who was not asked to.' },
    'c3-keep-sling': { id: 'c3-keep-sling', name: 'Royal sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 10, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 100, examine: 'Fires gravel that has been properly approved.' },
    'c3-keep-staff': { id: 'c3-keep-staff', name: 'Royal Warrant staff', icon: '🪄', kind: 'weapon', slot: 'weapon', ilvl: 12, damageType: 'crush', hands: 2, weaponClass: 'staff', value: 144, examine: 'Its head is carved with a robin. That is not a coincidence.' },
    'c3-keep-helm': { id: 'c3-keep-helm', name: 'Keep helm', icon: '⛑️', kind: 'armor', slot: 'head', ilvl: 12, armorType: 'plate', value: 144, examine: 'Polished so bright you can see your own worries in it.' },
    'c3-keep-cuirass': { id: 'c3-keep-cuirass', name: 'Keep cuirass', icon: '🛡️', kind: 'armor', slot: 'body', ilvl: 11, armorType: 'plate', value: 121, examine: 'Rattles when the guard is nervous. The guard is always nervous.' },
    'c3-keep-jerkin': { id: 'c3-keep-jerkin', name: 'Waxed jerkin', icon: '🦺', kind: 'armor', slot: 'body', ilvl: 10, armorType: 'leather', value: 100, examine: 'Royal pasture leather, waxed against the damp of the Gutters.' },
    'c3-keep-boots': { id: 'c3-keep-boots', name: 'Court boots', icon: '👢', kind: 'armor', slot: 'feet', ilvl: 11, armorType: 'leather', value: 121, examine: 'Built for standing very still while a Queen speaks.' },
    'c3-keep-robe': { id: 'c3-keep-robe', name: 'Clerk\'s robe', icon: '🥼', kind: 'armor', slot: 'body', ilvl: 11, armorType: 'cloth', value: 121, examine: 'Ink on the cuffs already. It came that way from the Archive.' },
    'c3-keep-cap': { id: 'c3-keep-cap', name: 'Scholar\'s cap', icon: '🎓', kind: 'armor', slot: 'head', ilvl: 10, armorType: 'cloth', value: 100, examine: 'For gnomes who read the records, and then read them again.' },

    // Named drops and chest loot.
    'c3-clog-gloves': { id: 'c3-clog-gloves', name: 'Clog-Gloves', icon: '🧤', kind: 'armor', slot: 'hands', ilvl: 12, rarity: 'sprouted', armorType: 'leather', value: 288, examine: 'Disgusting. Effective. Immune to Suction-type pulls.' },
    'c3-pipewrights-wrench': { id: 'c3-pipewrights-wrench', name: 'Pipewright\'s Wrench', icon: '🔧', kind: 'weapon', slot: 'weapon', ilvl: 12, rarity: 'sprouted', damageType: 'crush', hands: 1, weaponClass: 'melee', value: 288, examine: 'Engraved "G." Does fifteen percent more damage to metal, which the Keep has never mentioned.' },

    // Herbalist stock.
    'rose-draught': { id: 'rose-draught', name: 'Rose draught', icon: '🌹', kind: 'potion', heal: 60, stackable: true, value: 45, examine: 'Tastes of a summer garden. Restores 60 hit points.' },
    'sky-tonic': { id: 'sky-tonic', name: 'Sky tonic', icon: '🧴', kind: 'potion', mana: 60, stackable: true, value: 45, examine: 'Pale blue and cold on the tongue. Restores 60 mana.' },

    // Quest items.
    'gnorwin-ledger': { id: 'gnorwin-ledger', name: 'Gnorwin\'s Ledger', icon: '📕', kind: 'misc', questItem: true, value: 0, examine: 'Gnorwin\'s own accounts, soaked and underlined. The last page has the line that everyone quotes.' },
    'gromwell-notes': { id: 'gromwell-notes', name: 'Gromwell\'s Notes', icon: '📝', kind: 'misc', questItem: true, value: 0, examine: '"The seals are clay. I said Shard iron. Someone said cheaper." In a shaky hand, in the margin of a tool list.' },
  },

  enemies: {
    'gutter-rat': {
      id: 'gutter-rat', name: 'Gutter rat', level: 10, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [], gold: [1, 5],
      model: 'rat', color: 0x4a4038, scale: 1, respawnSeconds: 30,
      examine: 'Sleek, grey and well fed on whatever the Keep flushes down the pipes.', wants: 'Dry ledges.',
    },
    'pipe-leech': {
      id: 'pipe-leech', name: 'Pipe leech', level: 11, rank: 'normal', family: 'soft', damageType: 'pierce', aggressive: true,
      loot: [], gold: [1, 5],
      model: 'leech', color: 0x2a3a2a, scale: 1.1, respawnSeconds: 30,
      examine: 'It clings to the pipe wall and waits for something warm to float past.', wants: 'Warm bodies.',
    },
    clogmaw: {
      id: 'clogmaw', name: 'Clogmaw', level: 12, rank: 'boss', family: 'soft', damageType: 'crush', aggressive: true,
      loot: [{ item: 'gnorwin-ledger', chance: 1 }, { item: 'c3-clog-gloves', chance: 0.5 }], gold: [60, 90],
      model: 'slug', color: 0x5a6a3a, scale: 2.4, respawnSeconds: 0,
      examine: 'A blockage of hair, roots and slime that has started to move. It sucks at anything that comes down the pipe.',
      wants: 'To flow. It is a blockage that wants to move.',
      moves: [
        { id: 'suction', name: 'Suction', kind: 'pull', every: 12, telegraph: 1.5, radius: 8, damage: 0.8 },
        { id: 'hairball', name: 'Hairball', kind: 'pool', every: 10, telegraph: 1.2, radius: 3, damage: 0.5, status: 'rooted', statusSeconds: 3 },
        { id: 'slime-spill', name: 'Slime Spill', kind: 'summon', every: 25, telegraph: 1, summon: { enemy: 'c3-slime-blob', count: 2 } },
      ],
      lastWords: 'Gurgle. Clear.',
    },
    'c3-slime-blob': {
      id: 'c3-slime-blob', name: 'Slime blob', level: 11, rank: 'trivial', family: 'soft', damageType: 'crush', aggressive: true,
      loot: [], gold: [0, 1],
      model: 'slug', color: 0x7fbf4a, scale: 0.6, respawnSeconds: 0,
      examine: 'A piece of Clogmaw that broke off and wants to go back.', wants: 'To rejoin the blockage.',
    },
  },

  npcs: {
    potsworth: {
      id: 'potsworth', name: 'Lord Chancellor Wendel Potsworth', look: look(0x3a3a4a, 0x5a4a6a, 0xd0d0d0, { glasses: true }), zone: 'keep', x: -5, z: -40, wander: 0.5,
      examine: 'The Regent in all but name. Pressed collar, pressed smile, and a ledger he never opens.',
      greetings: [
        { when: { questStage: { id: 'c3-an-audience', stage: 0 } }, node: 'audienceTurnIn' },
        { when: { questStage: { id: 'c3-potsworths-errand', stage: 1 } }, node: 'errandTurnIn' },
        { when: { quest: { id: 'c3-potsworths-errand', status: 'active' } }, node: 'errandWait' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Myths are expensive. The treasury isn\'t. Was there something, or are you here to be pleasant?',
          options: [
            { text: 'I would like an audience with the Queen.', next: 'audience', action: { type: 'startQuest', quest: 'c3-an-audience' }, when: { quest: { id: 'c3-an-audience', status: 'none' }, questAtLeast: { id: 'c2-letter-for-the-queen', stage: 1 } } },
            { text: 'Is there any work for me?', next: 'errandAsk', action: { type: 'startQuest', quest: 'c3-potsworths-errand' }, when: { quest: { id: 'c3-potsworths-errand', status: 'none' }, questAtLeast: { id: 'c3-ledger', stage: 1 } } },
            { text: 'Goodbye.' },
          ],
        },
        audience: {
          text: 'An audience. Certainly. Put your request in writing, and I shall see that it is filed beside all the others.',
          options: [{ text: 'I will wait for her.' }],
        },
        audienceTurnIn: {
          text: 'Her Majesty doesn\'t see *letters*, Recruit. She is not a post office. Good day.',
          options: [{ text: 'Then I will find another way in.' }],
        },
        errandAsk: {
          text: 'Three seasons of tax owed from Cloverfield. Start at Sodbury and ask for it politely. Do not ask why it is late.',
          options: [{ text: 'I will go to Cloverfield.' }],
        },
        errandWait: { text: 'Cloverfield, Recruit. The tax is still owed, and the bill is still in my drawer.', options: [{ text: 'On my way.' }] },
        errandTurnIn: {
          text: 'You went and you asked. Did they pay, or did they say something rude about the Crown?',
          options: [{ text: 'They said they will pay when the granary is full.' }],
        },
      },
    },

    inkcap: {
      id: 'inkcap', name: 'Archivist Basil Inkcap', look: look(0x2a2a2a, 0x6a6a5a, 0xc0c0c0, { glasses: true }), zone: 'keep', x: -12, z: -30, wander: 0,
      examine: 'Keeper of the Royal Archive. Ink on his cuffs, ink on his chin, and undelivered replies under one arm.',
      greetings: [
        { when: { questStage: { id: 'c3-three-accounts', stage: 3 } }, node: 'accountsTurnIn' },
        { when: { quest: { id: 'c3-three-accounts', status: 'active' } }, node: 'accountsWait' },
        { when: { questStage: { id: 'c2-postage-due', stage: 1 } }, node: 'lettersTurnIn' },
        { when: { questStage: { id: 'c3-fifty-two-letters', stage: 0 } }, node: 'repliesTurnIn' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'There are three accounts of that. All wrong, in interesting ways. Sit down, if you can find a chair under the paper.',
          options: [
            { text: 'What are the three accounts?', next: 'accounts', action: { type: 'startQuest', quest: 'c3-three-accounts' }, when: { quest: { id: 'c3-three-accounts', status: 'none' }, questAtLeast: { id: 'c3-an-audience', stage: 1 } } },
            { text: 'Can I help with the Archive?', next: 'replies', action: { type: 'startQuest', quest: 'c3-fifty-two-letters' }, when: { quest: { id: 'c3-fifty-two-letters', status: 'none' }, questAtLeast: { id: 'c2-postage-due', stage: 2 } } },
            { text: 'Goodbye.' },
          ],
        },
        accounts: {
          text: 'Three records. The Long Lawn, Bartholomew\'s Charter and Gromwell\'s Pressure Notes. Read each one, then tell me which account is lying.',
          options: [{ text: 'I will read them.' }],
        },
        accountsWait: {
          text: 'The Long Lawn, Bartholomew\'s Charter, Gromwell\'s Pressure Notes. The Archive is dim. Read them all.',
          options: [{ text: 'On it.' }],
        },
        accountsTurnIn: {
          text: 'Gnorwin\'s own ledger was moved to the old vault, which flooded in the Backflow. It\'s in the Gutters now. Under everything.',
          options: [{ text: 'Then the Queen should hear about it.', next: 'queenNote', action: { type: 'startQuest', quest: 'c3-queen-in-archive' } }],
        },
        queenNote: {
          text: 'Her Majesty reads here when the court is asleep. She is in the Archive tonight. Go and find her.',
          options: [{ text: 'Goodbye.' }],
        },
        lettersTurnIn: {
          text: 'Tansy\'s letters. Fifty-two of them, in her small careful hand. Every one was sent to me, and none arrived. Well. Now they have.',
          options: [{ text: 'Thank you.' }],
        },
        replies: {
          text: 'Fifty-two letters need fifty-two replies, and I have written none of them. Write them with me, one at a time, and send them with the next post.',
          options: [{ text: 'We will start now.' }],
        },
        repliesTurnIn: {
          text: 'Fifty-two replies, and the first one is already sealed. Tansy will be astonished, and then she will be insufferable.',
          options: [{ text: 'Goodbye.' }],
        },
      },
    },

    ironsod: {
      id: 'ironsod', name: 'Knight-Commander Rowan Ironsod', look: look(0x8a8a8a, 0x5a6a7a, 0x6a5a4a), zone: 'keep', x: 4, z: -17.5, wander: 0.5,
      examine: 'Head of the army. Dented helm, straight back, and eyes that have not properly closed since the King\'s Fall.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'I was a squire. I hid under the King\'s cart. I have been hiding ever since.',
          options: [
            { text: 'Why did you hide?', next: 'cart' },
            { text: 'Goodbye.' },
          ],
        },
        cart: {
          text: 'The men who came out of the grass had no hats. Not one of them, in the middle of summer. I have thought about that for thirty years.',
          options: [{ text: 'Who were they?', next: 'ambush' }, { text: 'Goodbye.' }],
        },
        ambush: {
          text: 'I did not see faces. I have a strong opinion about one polite gnome who talks so kindly about lawns. I have no proof. I never needed it to be right about him.',
          options: [{ text: 'Goodbye.' }],
        },
      },
    },

    sedgewick: {
      id: 'sedgewick', name: 'High Edger Sedgewick', look: look(0xe8e8e8, 0x6a8f5a, 0xf0f0f0), zone: 'keep', x: 6, z: -17.5, wander: 0.5,
      examine: 'High Edger of the Even Cut, and adviser at court. Gentle voice, grass-green cloak and very still hands.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Good morning. Peace is a lawn where no blade stands taller than another. Her Majesty is kind to let me advise her. Is there something I may help with?',
          options: [
            { text: 'Tell me about the Even Cut.', next: 'evenCut' },
            { text: 'Goodbye.' },
          ],
        },
        evenCut: {
          text: 'We keep things even. When the Mower comes, it will not hate you, you know. It will simply make you even.',
          options: [{ text: 'That sounds very final.', next: 'hub' }],
        },
      },
    },

    marigold: {
      id: 'marigold', name: 'Queen Marigold Clayfoot', look: look(0xe0b040, 0xb0306a, null, { hair: { color: 0xc8a050, style: 'pigtails' }, dress: true }), zone: 'keep', x: 2, z: -17.5, wander: 0,
      placements: [{ zone: 'keep', x: -14, z: -27, when: { quest: { id: 'c3-queen-in-archive', status: 'active' } } }],
      examine: 'Queen of Fescue, at thirty-eight. She has never once been allowed to see the grass outside her own Keep.',
      greetings: [
        { when: { questStage: { id: 'c3-queen-in-archive', stage: 0 } }, node: 'archiveTurnIn' },
        { when: { questStage: { id: 'c3-ledger', stage: 0 } }, node: 'ledgerTurnIn' },
        { when: { quest: { id: 'c3-ledger', status: 'active' } }, node: 'ledgerWait' },
        { when: { quest: { id: 'c3-into-the-gutters', status: 'active' } }, node: 'gutterWait' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Tell me, does Cloverfield really smell of honey? I have never been allowed to find out.',
          options: [
            { text: 'Is there work for the Crown, Majesty?', next: 'gutterAsk', action: { type: 'startQuest', quest: 'c3-into-the-gutters' }, when: { quest: { id: 'c3-into-the-gutters', status: 'none' }, questAtLeast: { id: 'c3-queen-in-archive', stage: 1 } } },
            { text: 'What does Gnorwin\'s Ledger say?', next: 'ledgerAsk', action: { type: 'startQuest', quest: 'c3-ledger' }, when: { quest: { id: 'c3-ledger', status: 'none' }, questAtLeast: { id: 'c3-into-the-gutters', stage: 3 } } },
            { text: 'Goodbye.' },
          ],
        },
        archiveTurnIn: {
          text: 'You are the one who read Inkcap\'s three accounts. Good. I have read your letter, Recruit, every word and then twice. Find me Gnorwin\'s Ledger, since nobody else will.',
          options: [{ text: 'I will find it, Majesty.' }],
        },
        gutterAsk: {
          text: 'The Gutters, under the Keep. The Ledger was moved there when the old vault flooded. Go down the stairs by Ida\'s bench and mind the rats.',
          options: [{ text: 'I will go down.' }],
        },
        gutterWait: {
          text: 'Under everything, in the Gutters. Bring Gnorwin\'s Ledger up, and mind the rats.',
          options: [{ text: 'I will.' }],
        },
        ledgerAsk: {
          text: 'The Ledger says a great deal. Read it, then come back and tell me what it says. I will not believe a word of it until you do.',
          options: [{ text: 'I will read it.' }],
        },
        ledgerWait: {
          text: 'Read it twice before you speak to me. Then tell me what it says.',
          options: [{ text: 'Yes, Majesty.' }],
        },
        ledgerTurnIn: {
          text: 'Read it aloud, Recruit, word for word: "Water to bog its feet. Stone to stop its mouth. Wood to still its heart. And carts and hands enough to bring them." Royal Warrant, to you. Do not make me regret it.',
          options: [{ text: 'I will not make you regret it.' }],
        },
      },
    },

    wren: {
      id: 'wren', name: 'Robin-Master Wren Tumble', look: look(0x6a4a2a, 0x8a5a3a, null, { dress: true, freckles: true }), zone: 'keep', x: 27, z: -44, wander: 0,
      examine: 'Keeper of the Royal Robins. A robin sits on each shoulder and neither of them is impressed.',
      greetings: [
        { when: { questAtLeast: { id: 'c3-an-audience', stage: 1 }, not: { questAtLeast: { id: 'c3-three-accounts', stage: 4 } } }, node: 'hint' },
        { node: 'hub' },
      ],
      nodes: {
        hint: {
          text: 'The Queen has no time for letters, and Potsworth has no time for anybody. Try the Archive at night. Quietly. Robins never tell.',
          options: [{ text: 'Thank you, Wren.', next: 'hub' }],
        },
        hub: {
          hub: true,
          text: 'A robin is not a horse. A robin is a robin.',
          options: [
            { text: 'Fly me to the Verge.', action: { type: 'travel', zone: 'verge', x: 0, z: 70 }, when: { quest: { id: 'c7-wings-to-the-front', status: 'done' } } },
            { text: 'What do the robins do?', next: 'robins' },
            { text: 'Goodbye.' },
          ],
        },
        robins: {
          text: 'They carry messages, which the Queen forgets to read, and sometimes they carry you, when the Queen orders it.',
          options: [{ text: 'Thank you.', next: 'hub' }],
        },
      },
    },

    ida: {
      id: 'ida', name: 'Master Pipewright Ida Gromwell', look: look(0x3a6a7a, 0x4a4a4a, null, { bowlCut: 0x5a3a1a, glasses: true }), zone: 'keep', x: -30, z: 24, wander: 0.5,
      examine: 'Master Pipewright and keeper of the Deeps. Oil to the elbows, a spanner in her belt, and eyes that never look away from a gauge.',
      greetings: [
        { when: { questStage: { id: 'c3-idas-father', stage: 1 } }, node: 'fatherTurnIn' },
        { when: { questStage: { id: 'c3-letter-from-puddlemere', stage: 0 } }, node: 'letterTurnIn' },
        { when: { quest: { id: 'c3-idas-father', status: 'active' } }, node: 'fatherWait' },
        { node: 'hub' },
      ],
      nodes: {
        hub: {
          hub: true,
          text: 'Water goes where you tell it. Gnomes don\'t. What do you need, Recruit? I have a Deeps to hold up.',
          options: [
            { text: 'Was your father\'s work ever left behind?', next: 'father', action: { type: 'startQuest', quest: 'c3-idas-father' }, when: { quest: { id: 'c3-idas-father', status: 'none' } } },
            { text: 'I have a letter for you, from Puddlemere.', next: 'letterAsk', action: { type: 'startQuest', quest: 'c3-letter-from-puddlemere' }, when: { quest: { id: 'c3-letter-from-puddlemere', status: 'none' }, hasItem: { item: 'mb-soggy-letter', count: 1 } } },
            { text: 'Goodbye.' },
          ],
        },
        father: {
          text: 'My father left his toolbox in the Gutters the day the Backflow took the lower pipes. Find it. Bring me whatever he wrote down.',
          options: [{ text: 'I will look for it.' }],
        },
        fatherWait: {
          text: 'Gromwell\'s toolbox, Recruit. Down in the Gutters, past the rats. He always did leave things in the wet.',
          options: [{ text: 'On my way.' }],
        },
        fatherTurnIn: {
          text: 'Spanners, I expect. He always lost spanners. Anything else in the box?',
          options: [{ text: 'Nothing I could give you.' }],
        },
        letterAsk: {
          text: 'Puddlemere? Hand it over, carefully. It has been in a lake, and I can see the lake in it.',
          options: [{ text: 'Goodbye.' }],
        },
        letterTurnIn: {
          text: 'One of the forty. Written the day before the Backflow, and still worried about the seals. Nobody listened to him either. Thank you for bringing it up.',
          options: [{ text: 'I am sorry, Ida.' }],
        },
      },
    },

    'c3-ferrule': {
      id: 'c3-ferrule', name: 'Armourer Ferrule', look: look(0x4a4a4a, 0x8a1e1e, 0x9a9a9a), zone: 'keep', x: -8, z: 20, wander: 0,
      examine: 'Royal armourer. Forty years of sparks in the beard and a lot of very good steel in the back.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Royal issue, Recruit. Every piece tested by a Knight-Commander, who is still very strict about it.',
          options: [{ text: 'Show me your stock.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
        },
      },
      shop: [
        'c3-keep-spear', 'c3-keep-sling', 'c3-keep-staff', 'c3-keep-helm', 'c3-keep-cuirass',
        'c3-keep-jerkin', 'c3-keep-boots', 'c3-keep-robe', 'c3-keep-cap',
      ],
    },

    'c3-lumley': {
      id: 'c3-lumley', name: 'Mistress Thyme Lumley', look: look(0x3a7a3a, 0xd0e0b0, null, { dress: true, freckles: true }), zone: 'keep', x: 10, z: 20, wander: 0,
      examine: 'Herbalist to the Keep. Sleeves rolled, a basket of petals, and a row of tonics labelled in tiny, firm writing.',
      greetings: [{ node: 'hub' }],
      nodes: {
        hub: {
          hub: true,
          text: 'Rose for the body, sky for the mind. Don\'t drink both at once. The last gnome who tried is still rather blue.',
          options: [{ text: 'Show me your tonics.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
        },
      },
      shop: ['rose-draught', 'sky-tonic'],
    },
  },

  quests: {
    'c3-an-audience': {
      id: 'c3-an-audience', name: 'An Audience', giver: 'potsworth', zone: 'keep', level: 11, tier: 'main', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Ask Chancellor Potsworth for an audience with the Queen.', objective: { type: 'talk', npc: 'potsworth' } },
      ],
      reward: { gold: 40, items: [] },
    },
    'c3-three-accounts': {
      id: 'c3-three-accounts', name: 'Three Accounts', giver: 'inkcap', zone: 'keep', level: 11, tier: 'main', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Read The Long Lawn in the Archive.', objective: { type: 'interact', object: 'c3-record-long-lawn', count: 1 } },
        { text: 'Read Bartholomew\'s Charter in the Archive.', objective: { type: 'interact', object: 'c3-record-charter', count: 1 } },
        { text: 'Read Gromwell\'s Pressure Notes in the Archive.', objective: { type: 'interact', object: 'c3-record-pressure-notes', count: 1 } },
        { text: 'Tell Archivist Inkcap which account is lying.', objective: { type: 'talk', npc: 'inkcap' } },
      ],
      reward: { gold: 60, items: [] },
    },
    'c3-queen-in-archive': {
      id: 'c3-queen-in-archive', name: 'The Queen in the Archive', giver: 'marigold', zone: 'keep', level: 11, tier: 'main', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Find Queen Marigold in the Archive and tell her what you have read.', objective: { type: 'talk', npc: 'marigold' } },
      ],
      reward: { gold: 60, items: [] },
    },
    'c3-into-the-gutters': {
      id: 'c3-into-the-gutters', name: 'Into the Gutters', giver: 'marigold', zone: 'keep', level: 11, tier: 'main', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Go down the stairs by Ida\'s bench and reach the Drainpipe Gutters.', objective: { type: 'reach', zone: 'deeps', x: 0, z: 65, r: 25 } },
        { text: 'Kill Clogmaw, the blockage in the Gutters.', objective: { type: 'kill', enemy: 'clogmaw', count: 1 } },
        { text: 'Collect Gnorwin\'s Ledger from the Gutters.', objective: { type: 'collect', item: 'gnorwin-ledger', count: 1 } },
      ],
      reward: { gold: 120, items: [] },
    },
    'c3-ledger': {
      id: 'c3-ledger', name: 'What the Ledger Says', giver: 'marigold', zone: 'keep', level: 12, tier: 'finale', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Read Gnorwin\'s Ledger aloud to Queen Marigold, word for word.', objective: { type: 'talk', npc: 'marigold' } },
      ],
      reward: { gold: 200, items: [] },
    },

    'c3-idas-father': {
      id: 'c3-idas-father', name: 'Ida\'s Father', giver: 'ida', zone: 'keep', level: 10, tier: 'side', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Find Gromwell\'s toolbox in the Gutters and open it.', objective: { type: 'interact', object: 'c3-gromwell-toolbox', count: 1 } },
        { text: 'Tell Master Pipewright Ida what the toolbox held.', objective: { type: 'talk', npc: 'ida' } },
      ],
      reward: { gold: 40, items: [] },
    },
    'c3-potsworths-errand': {
      id: 'c3-potsworths-errand', name: 'Potsworth\'s Errand', giver: 'potsworth', zone: 'keep', level: 11, tier: 'side', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Reach Sodbury in Cloverfield and ask for the overdue tax.', objective: { type: 'reach', zone: 'cloverfield', x: 0, z: 0, r: 26 } },
        { text: 'Report back to Chancellor Potsworth.', objective: { type: 'talk', npc: 'potsworth' } },
      ],
      reward: { gold: 50, items: [] },
    },
    'c3-letter-from-puddlemere': {
      id: 'c3-letter-from-puddlemere', name: 'The Letter from Puddlemere', giver: 'ida', zone: 'keep', level: 10, tier: 'side', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Hand the soggy letter from Puddlemere to Master Pipewright Ida.', objective: { type: 'talk', npc: 'ida' }, takeItems: [{ item: 'mb-soggy-letter', count: 1 }] },
      ],
      reward: { gold: 30, items: [] },
    },
    'c3-fifty-two-letters': {
      id: 'c3-fifty-two-letters', name: 'Fifty-Two Letters', giver: 'inkcap', zone: 'keep', level: 10, tier: 'side', chain: 'Chapter 3: The Keep and the Ledger',
      stages: [
        { text: 'Write the fifty-two replies to Tansy with Archivist Inkcap.', objective: { type: 'talk', npc: 'inkcap' } },
      ],
      reward: { gold: 40, items: [] },
    },
  },

  spawns: [
    { id: 'c3-spawn-1', zone: 'deeps', enemy: 'gutter-rat', x: 12, z: 65, count: 6, spread: 14 },
    { id: 'c3-spawn-2', zone: 'deeps', enemy: 'pipe-leech', x: -12, z: 60, count: 4, spread: 10 },
    { id: 'c3-spawn-3', zone: 'deeps', enemy: 'clogmaw', x: 0, z: 42, count: 1, spread: 0 },
  ],

  objects: {
    'c3-record-long-lawn': {
      id: 'c3-record-long-lawn', zone: 'keep', name: 'The Long Lawn', x: -22, z: -31, model: 'book',
      verb: 'Read', examine: 'A lawn-measurement ledger from the Charter years. Every blade in the kingdom, counted twice.',
      text: 'Every measurement agrees with every other, which is suspicious in a lawn.', once: true,
      when: { quest: { id: 'c3-three-accounts', status: 'active' } },
    },
    'c3-record-charter': {
      id: 'c3-record-charter', zone: 'keep', name: 'Bartholomew\'s Charter', model: 'book',
      verb: 'Read', examine: 'The old Charter, sealed in a hurry with a thumbprint still in the wax.',
      text: 'The Charter names the old vault as the safe keeping for the Ledger. Somebody has since crossed out the word "dry".', once: true,
      when: { quest: { id: 'c3-three-accounts', status: 'active' } },
    },
    'c3-record-pressure-notes': {
      id: 'c3-record-pressure-notes', zone: 'keep', name: 'Gromwell\'s Pressure Notes', model: 'book',
      verb: 'Read', examine: 'Pipe pressure readings, month by month, in a Pipewright\'s cramped hand.',
      text: 'Readings for the Deeps, month by month. In the last margin, in fresher ink: "The seals will hold. Probably. Someone said cheaper."', once: true,
      when: { quest: { id: 'c3-three-accounts', status: 'active' } },
    },
    'c3-gromwell-toolbox': {
      id: 'c3-gromwell-toolbox', zone: 'deeps', name: 'Gromwell\'s toolbox', x: -12, z: 66, model: 'chest',
      verb: 'Open', examine: 'A dented toolbox with a Pipewright\'s mark. The rust is on the lid, but the hinge is clean, as if somebody still opens it.',
      text: 'Spanners, a dead candle, and a folded note in a tidy hand.', once: true,
      giveItem: { item: 'gromwell-notes', count: 1 },
      when: { quest: { id: 'c3-idas-father', status: 'active' } },
    },
    'c3-pipewrights-chest': {
      id: 'c3-pipewrights-chest', zone: 'deeps', name: 'Pipewright\'s chest', x: 10, z: 72, model: 'chest',
      verb: 'Open', examine: 'A chest bolted to the pipe, with a brass hasp. Someone wanted this kept dry.',
      text: 'A wrench, engraved with a single G.', once: true,
      giveItem: { item: 'c3-pipewrights-wrench', count: 1 },
    },
  },
};
