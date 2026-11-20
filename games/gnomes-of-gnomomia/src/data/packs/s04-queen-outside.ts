// Content pack s04-queen-outside (Storyline 04, "What Outside Smells Like", Birdbath Keep and Sodbury, levels 12-16). Prefix for new ids: s04-.
// Canon ids referenced, not defined here: marigold, wren (Keep, ch3/ch4 packs), c3-ledger (quest), honeydew-flask (item).
// Trip flag: s04-trip is 'on' from the one-time robin flight until the Keep return flight ('over').
import { look, type ContentPack, type DialogueOption, type DialogueNode, type Greeting, type QuestDef, type EnemyDef, type NpcDef, type SpawnSpec, type WorldObjectSpec } from '../../config';

const ROAD_TRAVEL_SODBURY = { type: 'travel', zone: 'cloverfield', x: 0, z: 10 } as const;
const ROAD_TRAVEL_KEEP = { type: 'travel', zone: 'keep', x: 22, z: -40 } as const;

// Start options added to canon NPCs (topics). They appear on the NPC's hub nodes.
const MARIGOLD_HONEY: DialogueOption = {
  text: 'Does Cloverfield really smell of honey, Majesty?', next: 's04-marigold-honey-start',
  action: { type: 'startQuest', quest: 's04-does-it-smell-of-honey' },
  when: { quest: { id: 's04-does-it-smell-of-honey', status: 'none' }, questAtLeast: { id: 'c3-ledger', stage: 99 } },
};
const MARIGOLD_FINALE: DialogueOption = {
  text: 'You smelled it out there, Majesty. Tell me what it was like.', next: 's04-marigold-finale-start',
  action: { type: 'startQuest', quest: 's04-what-outside-smells-like' },
  when: { quest: { id: 's04-what-outside-smells-like', status: 'none' }, questAtLeast: { id: 's04-home-by-dusk', stage: 99 } },
};

export const PACK: ContentPack = {
  id: 's04-queen-outside',

  quests: {
    's04-does-it-smell-of-honey': {
      id: 's04-does-it-smell-of-honey', name: 'Does It Smell of Honey?', giver: 'marigold', zone: 'keep', level: 12, tier: 'side', chain: 'What Outside Smells Like',
      stages: [
        { text: 'Talk to Queen Marigold on the Basin rim again.', objective: { type: 'talk', npc: 'marigold' } },
        { text: 'Find the Robin Roost on the Keep wall.', objective: { type: 'reach', zone: 'keep', x: 22, z: -46, r: 6 } },
        { text: 'Talk to Robin-Master Wren Tumble.', objective: { type: 'talk', npc: 'wren' } },
      ],
      reward: { gold: 40, items: [] },
    },
    's04-robin-not-horse': {
      id: 's04-robin-not-horse', name: 'A Robin Is Not a Horse', giver: 'wren', zone: 'keep', level: 12, tier: 'main', chain: 'What Outside Smells Like',
      stages: [
        { text: 'Talk to Robin-Master Wren about the flight.', objective: { type: 'talk', npc: 'wren' } },
        { text: 'Board the Robin Roost, then talk to Wren and ask to fly.', objective: { type: 'interact', object: 's04-robin-board', count: 1 } },
        { text: 'Find the Sodbury Granary Tower, north of the wide street.', objective: { type: 'reach', zone: 'cloverfield', x: 10, z: -16, r: 6 } },
      ],
      reward: { gold: 80, items: [] },
    },
    's04-pikemen-on-the-road': {
      id: 's04-pikemen-on-the-road', name: 'Pikemen on the Snail Pens Road', giver: 's04-marigold-outside', zone: 'cloverfield', level: 13, tier: 'main', chain: 'What Outside Smells Like',
      stages: [
        { text: 'Reach Honeydew Ranch.', objective: { type: 'reach', zone: 'cloverfield', x: -50, z: -35, r: 10 } },
        { text: 'Drive off the Keep pikemen on the Snail Pens road. Drive them off; do not crack them.', objective: { type: 'kill', enemy: 's04-keep-pikeman', count: 6 } },
        { text: 'Escort the Queen to the Full Trough.', objective: { type: 'escort', npc: 's04-marigold-outside', zone: 'cloverfield', x: -30, z: -10, r: 5 } },
      ],
      reward: { gold: 150, items: [{ item: 'honeydew-flask', count: 2 }] },
    },
    's04-home-by-dusk': {
      id: 's04-home-by-dusk', name: 'Home by Dusk', giver: 's04-bugle', zone: 'cloverfield', level: 13, tier: 'main', chain: 'What Outside Smells Like',
      stages: [
        { text: 'Talk to Sergeant Bugle Hobnail at the Full Trough.', objective: { type: 'talk', npc: 's04-bugle' } },
        { text: 'Decide with the Sergeant: take the Queen home by dusk, or let her stay one night.', objective: { type: 'choice', flag: 'queen_outside' } },
      ],
      reward: { gold: 100, items: [] },
    },
    's04-dusk-bell': {
      id: 's04-dusk-bell', name: 'Dusk Bell', giver: 's04-rakehandle', zone: 'cloverfield', level: 13, tier: 'side', chain: 'What Outside Smells Like',
      stages: [
        { text: 'Reach the Sodbury schoolhouse.', objective: { type: 'reach', zone: 'cloverfield', x: -12, z: 6, r: 4 } },
        { text: 'Ring the schoolhouse bell.', objective: { type: 'interact', object: 's04-school-bell', count: 1 } },
        { text: 'Talk to Teacher Sage Rakehandle.', objective: { type: 'talk', npc: 's04-rakehandle' } },
      ],
      reward: { gold: 30, items: [] },
    },
    's04-the-quarterly': {
      id: 's04-the-quarterly', name: 'The Quarterly', giver: 's04-bugle', zone: 'cloverfield', level: 14, tier: 'side', chain: 'What Outside Smells Like',
      stages: [
        { text: 'Talk to Sergeant Hobnail about the money he sends home.', objective: { type: 'talk', npc: 's04-bugle' } },
        { text: 'Find the Hobnail cottage in Sodbury\'s east lane.', objective: { type: 'reach', zone: 'cloverfield', x: 16, z: 6, r: 4 } },
        { text: 'Talk to Samphire Hobnail at the gate.', objective: { type: 'talk', npc: 's04-samphire' } },
      ],
      reward: { gold: 30, items: [] },
    },
    's04-what-outside-smells-like': {
      id: 's04-what-outside-smells-like', name: 'What Outside Smells Like', giver: 'marigold', zone: 'keep', level: 16, tier: 'finale', chain: 'What Outside Smells Like',
      stages: [
        { text: 'Talk to Queen Marigold on the Basin.', objective: { type: 'talk', npc: 'marigold' } },
        { text: 'Talk to Robin-Master Wren Tumble.', objective: { type: 'talk', npc: 'wren' } },
      ],
      reward: { gold: 200, items: [] },
    },
  },

  enemies: {
    's04-keep-pikeman': {
      id: 's04-keep-pikeman', name: 'Keep pikeman', level: 12, rank: 'normal', family: 'fired', damageType: 'pierce', aggressive: true,
      loot: [], gold: [4, 10], model: 'clay', color: 0x9a8060, scale: 1, respawnSeconds: 30,
      examine: 'One of the Queen\'s own guards, in Keep steel and a clay helmet. The pike is pointed at you, not quite aimed.',
      wants: 'To bring Her Majesty home by dusk, and not to be blamed for losing her. Orders come from the Chancellor.',
    } as EnemyDef,
  },

  spawns: [
    // Keep pikemen catch up with the party on the Snail Pens road, between the pens and Honeydew Ranch, only during the escort-chase stage.
    { id: 's04-spawn-1', zone: 'cloverfield', enemy: 's04-keep-pikeman', count: 6, spread: 6, when: { questStage: { id: 's04-pikemen-on-the-road', stage: 1 } } },
  ] as readonly SpawnSpec[],

  objects: {
    's04-robin-board': {
      id: 's04-robin-board', zone: 'keep', name: 'Robin Roost perch', model: 'post',
      verb: 'Board', examine: 'A perch of old garden posts on the Keep wall, with a robin asleep on the top one.',
      text: 'You climb up. The robin wakes, looks at you the way robins do, and lets you stay.',
      when: { questStage: { id: 's04-robin-not-horse', stage: 1 } }, once: true, setFlag: { flag: 's04-trip', value: 'on' },
    },
    's04-robin-home': {
      id: 's04-robin-home', zone: 'keep', name: 'Robin Roost perch (home)', model: 'post',
      verb: 'Board', examine: 'The same perch, back on the Keep side of the wall.',
      text: 'The robin takes you home, and the Keep is quiet.',
      when: { quest: { id: 's04-home-by-dusk', status: 'done' }, flag: { name: 's04-trip', value: 'on' } }, once: true, setFlag: { flag: 's04-trip', value: 'over' },
    },
    's04-school-bell': {
      id: 's04-school-bell', zone: 'cloverfield', name: 'Sodbury schoolhouse bell', model: 'post',
      verb: 'Ring', examine: 'The schoolhouse bell, on a rope by the door. It has been rung for one pupil today.',
      text: 'You take the rope and ring it twice. The sound goes down the lane.',
    },
  } as Record<string, WorldObjectSpec>,

  npcs: {
    // The Queen outside the Keep: a separate NPC, not Marigold herself. Visible only while the trip flag is on.
    's04-marigold-outside': {
      id: 's04-marigold-outside', name: 'Queen Marigold (in a borrowed hat)', look: look(0xc9a24a, 0x7a2a4a, null, { hair: { color: 0xd9b26a, style: 'pigtails' } }),
      zone: 'cloverfield', x: 4, z: 6, wander: 0,
      hidden: { not: { flag: { name: 's04-trip', value: 'on' } } },
      examine: 'The Queen of Fescue, in a farmer\'s straw hat that is far too big for her. She is looking at the horizon.',
      greetings: [
        { when: { questStage: { id: 's04-pikemen-on-the-road', stage: 0 } }, node: 's04-mo-honeydew' },
        { when: { questStage: { id: 's04-pikemen-on-the-road', stage: 1 } }, node: 's04-mo-pikemen' },
        { when: { questStage: { id: 's04-pikemen-on-the-road', stage: 2 } }, node: 's04-mo-escort' },
        { when: { flag: { name: 'queen_outside', value: 'stayed' }, quest: { id: 's04-home-by-dusk', status: 'done' } }, node: 's04-mo-stayed' },
        { when: { quest: { id: 's04-home-by-dusk', status: 'done' } }, node: 's04-mo-home' },
        { when: { quest: { id: 's04-pikemen-on-the-road', status: 'done' } }, node: 's04-mo-trough' },
        { node: 's04-mo-hello' },
      ],
      nodes: {
        's04-mo-hello': {
          text: 'Nobody knows me in this hat. Does Sodbury smell of honey? I\'ve been asking since I was eight.',
          options: [
            {
              text: 'Show me the road to Honeydew Ranch.', next: 's04-mo-start',
              action: { type: 'startQuest', quest: 's04-pikemen-on-the-road' },
              when: { quest: { id: 's04-pikemen-on-the-road', status: 'none' }, questAtLeast: { id: 's04-robin-not-horse', stage: 99 } },
            },
            { text: 'Goodbye, Majesty.' },
          ],
        },
        's04-mo-start': {
          text: 'Honeydew Ranch first. Then the Snail Pens road. I want the horizon from the ranch fence. Gnorwin\'s legends never had a fence.',
          options: [{ text: 'Lead on, Majesty.' }],
        },
        's04-mo-honeydew': {
          text: 'Honeydew Ranch. Ma Haybale will feed us, I\'m told. I hope she does.',
          options: [{ text: 'Onward.' }],
        },
        's04-mo-pikemen': {
          text: 'Those are Keep pikes. My own guards, sent by the Chancellor. Drive them off. Don\'t crack them. They\'re only doing as they\'re told.',
          options: [{ text: 'Drive them off.' }],
        },
        's04-mo-escort': {
          text: 'Lead me to the Full Trough. I\'ll walk every step of it.',
          options: [{ text: 'Follow me.' }],
        },
        's04-mo-trough': {
          text: 'The Full Trough. Sergeant Hobnail is out there with the pikes. Go and see him. I\'ll wait here.',
          options: [{ text: 'I will.' }],
        },
        's04-mo-home': {
          text: 'Then I\'ll go home. Take me up the way we came, and tell Wren to keep her ears open.',
          options: [{ text: 'Fly her home.', action: ROAD_TRAVEL_KEEP }],
        },
        's04-mo-stayed': {
          text: 'I slept in a hayloft. Stubble and fear, and I\'d sleep there again. Take me home when you\'re ready.',
          options: [{ text: 'Fly her home.', action: ROAD_TRAVEL_KEEP }],
        },
      },
    } as NpcDef,

    's04-bugle': {
      id: 's04-bugle', name: 'Sergeant Bugle Hobnail', look: look(0x8a8a90, 0x3a4a6a, 0x6a4a2a), zone: 'cloverfield', x: -28, z: -12, wander: 0,
      examine: 'A Keep pikeman sergeant with a dented helmet and a pike he is trying hard not to point at anyone.',
      greetings: [
        { when: { questStage: { id: 's04-home-by-dusk', stage: 0 } }, node: 's04-bugle-dusk' },
        { when: { questStage: { id: 's04-home-by-dusk', stage: 1 } }, node: 's04-bugle-choice' },
        { when: { questStage: { id: 's04-the-quarterly', stage: 0 } }, node: 's04-bugle-quarterly' },
        { node: 's04-bugle-hello' },
      ],
      nodes: {
        's04-bugle-hello': {
          text: 'Gnome, the Queen is not supposed to be out here. Take her home by dusk and I won\'t have to say so.',
          options: [
            {
              text: 'What is the order, Sergeant?', next: 's04-bugle-order',
              action: { type: 'startQuest', quest: 's04-home-by-dusk' },
              when: { quest: { id: 's04-home-by-dusk', status: 'none' }, questAtLeast: { id: 's04-pikemen-on-the-road', stage: 99 } },
            },
            {
              text: 'Anything your family wants carried, Sergeant?', next: 's04-bugle-qstart',
              action: { type: 'startQuest', quest: 's04-the-quarterly' },
              when: { quest: { id: 's04-the-quarterly', status: 'none' }, questAtLeast: { id: 's04-home-by-dusk', stage: 99 } },
            },
            { text: 'Goodbye, Sergeant.' },
          ],
        },
        's04-bugle-order': {
          text: 'Take her home by dusk, and don\'t crack the pikes. They\'re her own guards. Talk to me at the Trough when the sun touches the rim.',
          options: [{ text: 'Understood.' }],
        },
        's04-bugle-dusk': {
          text: 'The Chancellor will want you in the Basin, Majesty. Dusk is coming. Gnome, you\'ll have to decide how this ends.',
          options: [{ text: 'Your call, Sergeant. Ask her.' }],
        },
        's04-bugle-choice': {
          text: 'Tell me, Gnome: home by dusk, or one night on the Trough porch?',
          options: [
            { text: 'Take her home by dusk.', next: 's04-bugle-home', action: { type: 'setFlag', flag: 'queen_outside', value: 'home' } },
            { text: 'Let her stay one night.', next: 's04-bugle-stay', action: { type: 'setFlag', flag: 'queen_outside', value: 'stayed' } },
          ],
        },
        's04-bugle-home': {
          text: 'Then the robin goes at dusk. Tell the Chancellor she was home by dusk. He\'ll believe that.',
          options: [{ text: 'Goodbye, Sergeant.' }],
        },
        's04-bugle-stay': {
          text: 'One night on the porch. The horizon goes dark from here. Tell the Chancellor she saw it.',
          options: [{ text: 'Goodbye, Sergeant.' }],
        },
        's04-bugle-quarterly': {
          text: 'Money home every quarter, the same amount, and no note. Ask my dad about the gate. He\'ll say the same as me, in fewer words.',
          options: [{ text: 'I will ask Samphire.' }],
        },
        's04-bugle-qstart': {
          text: 'Money home, every quarter. There\'s a cottage in Sodbury\'s east lane, and a gate that\'s always open. Go and look at it.',
          options: [{ text: 'I\'ll go.' }],
        },
      },
    } as NpcDef,

    's04-samphire': {
      id: 's04-samphire', name: 'Samphire Hobnail', look: look(0x7a6a3a, 0x6a5a3a, 0xe0dcd0), zone: 'cloverfield', x: 19.5, z: 7, wander: 0,
      examine: 'An old farmer at the gate of a cottage whose garden grows nothing. The gate is open.',
      greetings: [
        { when: { questStage: { id: 's04-the-quarterly', stage: 2 } }, node: 's04-samphire-turnin' },
        { node: 's04-samphire-hello' },
      ],
      nodes: {
        's04-samphire-hello': {
          text: 'The gate\'s open. It always is, in the afternoons. Are you here about the cottage, or the money?',
          options: [{ text: 'Goodbye, Samphire.' }],
        },
        's04-samphire-turnin': {
          text: 'He sends money. No note. Every quarter, the same amount. I keep the gate open for the note.',
          options: [{ text: 'Thank you, Samphire.' }],
        },
      },
    } as NpcDef,

    's04-rakehandle': {
      id: 's04-rakehandle', name: 'Teacher Sage Rakehandle', look: look(0x3a2a5a, 0x5a4a6a, null, { glasses: true }), zone: 'cloverfield', x: -12, z: 6, wander: 0,
      examine: 'The schoolmistress of Sodbury, in a pinafore, with a rope in one hand and a book in the other.',
      greetings: [
        { when: { questStage: { id: 's04-dusk-bell', stage: 2 } }, node: 's04-rakehandle-turnin' },
        { node: 's04-rakehandle-hello' },
      ],
      nodes: {
        's04-rakehandle-hello': {
          text: 'One pupil today. I rang the bell anyway, same as every day.',
          options: [
            {
              text: 'Why do you ring it for one pupil?', next: 's04-rakehandle-start',
              action: { type: 'startQuest', quest: 's04-dusk-bell' },
              when: { quest: { id: 's04-dusk-bell', status: 'none' }, questAtLeast: { id: 's04-robin-not-horse', stage: 99 } },
            },
            { text: 'Goodbye, Teacher.' },
          ],
        },
        's04-rakehandle-start': {
          text: 'Because the bell is for the school, and the school is still here. The rope is by the door. I\'d take it as a kindness if you rang it.',
          options: [{ text: 'I will ring it.' }],
        },
        's04-rakehandle-turnin': {
          text: 'The bell went down the lane, and a dog barked back. That is more company than the school has had all week. Thank you.',
          options: [{ text: 'Goodbye, Teacher.' }],
        },
      },
    } as NpcDef,
  },

  topics: {
    marigold: [MARIGOLD_HONEY, MARIGOLD_FINALE],
  },

  greetingsFirst: {
    marigold: [
      { when: { questStage: { id: 's04-does-it-smell-of-honey', stage: 0 } }, node: 's04-marigold-honey-wait' },
      { when: { questStage: { id: 's04-what-outside-smells-like', stage: 0 } }, node: 's04-marigold-finale-wait' },
    ] as Greeting[],
    wren: [
      { when: { questStage: { id: 's04-does-it-smell-of-honey', stage: 2 } }, node: 's04-wren-honey-turnin' },
      { when: { questStage: { id: 's04-robin-not-horse', stage: 0 } }, node: 's04-wren-flight-wait' },
      { when: { questStage: { id: 's04-robin-not-horse', stage: 1 } }, node: 's04-wren-board' },
      { when: { questStage: { id: 's04-robin-not-horse', stage: 2 } }, node: 's04-wren-fly' },
      { when: { questStage: { id: 's04-what-outside-smells-like', stage: 1 } }, node: 's04-wren-finale-turnin' },
    ] as Greeting[],
  },

  extraNodes: {
    marigold: {
      's04-marigold-honey-start': {
        text: 'Robins go over the rim and come back with honey on their feet. Go up to the Robin Roost, then to Wren. Tell me what she says.',
        options: [{ text: 'I will find out, Majesty.' }],
      },
      's04-marigold-honey-wait': {
        text: 'You went up and came back already? Tell me, did you see the robins? Good. Now go and see Wren.',
        options: [{ text: 'I am going.' }],
      },
      's04-marigold-finale-start': {
        text: 'I want to hear all of it, from the robin\'s back to the schoolhouse bell. Then speak to Wren, she should hear it too.',
        options: [{ text: 'It will take a while, Majesty.' }],
      },
      's04-marigold-finale-wait': {
        text: 'Tell me what it smelled like. I know it was not honey. Then go and find Wren.',
        options: [{ text: 'Stubble and fear, Majesty.' }],
      },
    } as Record<string, DialogueNode>,

    wren: {
      's04-wren-honey-turnin': {
        text: 'The Queen wanted to know whether Cloverfield smells of honey. It smells of wet hay and robin. Tell her that, and ask whether she wants a ride.',
        options: [
          {
            text: 'Then take me to Sodbury.', next: 's04-wren-flight-start',
            action: { type: 'startQuest', quest: 's04-robin-not-horse' },
            when: { quest: { id: 's04-robin-not-horse', status: 'none' }, questAtLeast: { id: 's04-does-it-smell-of-honey', stage: 2 } },
          },
          { text: 'Goodbye, Wren.' },
        ],
      },
      's04-wren-flight-start': {
        text: 'A robin is not a horse. A robin is a robin. Climb on at the roost, and I\'ll take you down to Sodbury once you are up.',
        options: [{ text: 'Right.' }],
      },
      's04-wren-flight-wait': {
        text: 'A robin is not a horse. I said so once. Go and board her at the roost, then come back and ask me properly.',
        options: [{ text: 'Then I will walk.' }],
      },
      's04-wren-board': {
        text: 'The Robin Roost is on the wall, the one with the blue ring. Board the one you find on the top post, and hold on.',
        options: [{ text: 'Goodbye, Wren.' }],
      },
      's04-wren-fly': {
        text: 'She is up. Fly, then. Sodbury, and not a word to the Chancellor about it.',
        options: [{ text: 'Fly to Sodbury.', action: ROAD_TRAVEL_SODBURY }],
      },
      's04-wren-finale-turnin': {
        text: 'The honey question, the horse question, and the bell. She rang it herself, did she? Good. Finish it.',
        options: [{ text: 'It is finished, Wren.' }],
      },
    } as Record<string, DialogueNode>,
  },
};
