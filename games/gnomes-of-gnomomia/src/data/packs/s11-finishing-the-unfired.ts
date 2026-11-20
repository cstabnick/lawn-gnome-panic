// Content pack s11-finishing-the-unfired: storyline 11, "Finishing". The Rockery (Flintdelve, Shard Mine ledges, Marble Pits, the Kiln's back chambers).
// Design: docs/design/gnomomia/storylines/11-finishing-the-unfired.md.
// Quest 5 is split in two (engine rule: a stage can't branch): the choice quest pays out, and the fired path is a follow-up quest.
import type { ContentPack, Condition, DialogueNode, Greeting } from '../../config';
import { look } from '../../config';

const Q_ROCKROSE = 's11-something-to-burn';
const Q_GLASS = 's11-ground-glass';
const Q_THREE = 's11-three-at-a-time';
const Q_HYSSOP = 's11-hyssop-says-good-morning';
const Q_LAST = 's11-the-last-warm-mouth';
const Q_LAST_FIRED = 's11-the-last-mouth-fired';

const GLAZE = 's11-kiln-glaze';
const TALL_EYE = 's11-tall-eye-shard';

// Shared gating helpers. "Started" means the quest is done or active; "not started" is its negation.
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const notStarted = (id: string): Condition => ({ not: { questAtLeast: { id, stage: 0 } } });
const onStage = (id: string, stage: number): Condition => ({ questStage: { id, stage } });
const flagIs = (name: string, value: string): Condition => ({ flag: { name, value } });

// Sedum's extra lines, gated per quest stage.
const sedumTurnins: Greeting[] = [
  { when: onStage(Q_ROCKROSE, 1), node: 's11-q1-turnin' },
  { when: onStage(Q_ROCKROSE, 0), node: 's11-q1-wait' },
  { when: onStage(Q_GLASS, 2), node: 's11-q2-turnin' },
  { when: onStage(Q_GLASS, 0), node: 's11-q2-wait' },
  { when: onStage(Q_GLASS, 1), node: 's11-q2-wait' },
  { when: onStage(Q_THREE, 4), node: 's11-q3-turnin' },
  { when: onStage(Q_THREE, 0), node: 's11-q3-wait' },
  { when: onStage(Q_THREE, 1), node: 's11-q3-wait' },
  { when: onStage(Q_THREE, 2), node: 's11-q3-wait' },
  { when: onStage(Q_THREE, 3), node: 's11-q3-wait' },
  { when: onStage(Q_HYSSOP, 1), node: 's11-q4-turnin' },
  { when: onStage(Q_HYSSOP, 0), node: 's11-q4-wait' },
  { when: onStage(Q_LAST_FIRED, 1), node: 's11-q5b-turnin' },
  { when: onStage(Q_LAST_FIRED, 0), node: 's11-q5b-wait' },
  { when: onStage(Q_LAST, 0), node: 's11-q5-wait' },
  { when: onStage(Q_LAST, 1), node: 's11-q5-wait' },
];

// Hyssop Mudpat: the first Unfired finished. She wakes in the back chambers, then walks up to Flintdelve.
const hyssopNodes: Record<string, DialogueNode> = {
  wake: {
    text: 'Is it my turn? They\'ve been calling me Shelf. I\'d like my own name back.',
    options: [
      { text: 'Hyssop, then.', next: 'named-hyssop' },
      { text: 'Sorrel, then.', next: 'named-sorrel' },
      { text: 'Yarrow, then.', next: 'named-yarrow' },
    ],
  },
  'named-hyssop': {
    text: 'Hyssop Mudpat. That\'s the one. Thank you for asking.',
    options: [{ text: 'Glad to.' }],
  },
  'named-sorrel': {
    text: 'Sorrel is a good plant. It isn\'t mine, though. Try again, if you like.',
    options: [{ text: 'Hyssop, then.', next: 'named-hyssop' }, { text: 'Fair enough.' }],
  },
  'named-yarrow': {
    text: 'Yarrow is a good plant too. I\'ll answer to Hyssop, if you don\'t mind.',
    options: [{ text: 'Hyssop, then.', next: 'named-hyssop' }],
  },
  hub: {
    hub: true,
    text: 'Can we go up now? Don\'t tell me it\'s far. I\'ve waited longer than your road has existed.',
    options: [
      { text: 'Walk up to Flintdelve with me.', next: 'escort-start', action: { type: 'startQuest', quest: Q_HYSSOP }, when: { ...done(Q_THREE), ...notStarted(Q_HYSSOP) } },
      { text: 'Goodbye.' },
    ],
  },
  'escort-start': {
    text: 'Up the lift road, then. Keep the pace easy, and I\'ll keep up.',
    options: [{ text: 'Up we go.' }],
  },
  'escort-wait': {
    text: 'Still with you. The lift road is up past the mill.',
    options: [{ text: 'Almost there.' }],
  },
  home: {
    text: 'A bench in the sun. Sedum says she\'ll keep one beside mine. I\'m going to sit on it all day.',
    options: [{ text: 'You\'ve earned it.' }],
  },
};

// Lupin Crock: cracked down one side on the shelf at the end of the back chambers.
const lupinNodes: Record<string, DialogueNode> = {
  hub: {
    hub: true,
    text: 'I\'m cracked down one side. The heat might take the rest of me. I\'d rather know than sit.',
    options: [{ text: 'I\'m sorry. I\'ll take care.' }],
  },
  choice: {
    text: 'Fire me, or let me stay soft on my shelf. Either way it\'s my say, not the Kiln\'s.',
    options: [
      { text: 'Fire her.', next: 'fire-ready', action: { type: 'setFlag', flag: 'unfired', value: 'fired' } },
      { text: 'Let her stay soft.', next: 'kept', action: { type: 'setFlag', flag: 'unfired', value: 'kept' } },
    ],
  },
  'fire-ready': {
    text: 'Then take this glaze. The last mouth needs it, same as the others.',
    options: [{ text: 'Take the glaze.', action: { type: 'giveItem', item: GLAZE, count: 1 } }],
  },
  kept: {
    text: 'Then I\'ll stay soft a while longer. Sit down, if you like. The shelf is warm enough.',
    options: [{ text: 'I\'ll sit with you a while.' }],
  },
  'kept-after': {
    text: 'Still soft, and still on my shelf. Sedum says I\'m still the Kilnkeeper\'s business. Sit, if you like.',
    options: [{ text: 'Goodbye, Lupin.' }],
  },
};

export const PACK: ContentPack = {
  id: 's11-finishing-the-unfired',

  items: {
    's11-dry-rockrose': {
      id: 's11-dry-rockrose', name: 'Dry rockrose', icon: '🌿', kind: 'misc', questItem: true, stackable: true,
      ilvl: 20, rarity: 'plain', value: 0,
      examine: 'Pale stalks, lighter than they look. Burns with a sweet smell and no complaints.',
    },
    [TALL_EYE]: {
      id: TALL_EYE, name: 'Tall-eye shard', icon: '💎', kind: 'misc', questItem: true, stackable: true,
      ilvl: 20, rarity: 'plain', value: 0,
      examine: 'A chip of the grey-green Tall-eye stone from the Marble Pits. Grind it fine before it is any use.',
    },
    [GLAZE]: {
      id: GLAZE, name: 'Kiln glaze', icon: '🏺', kind: 'misc', questItem: true, stackable: true,
      ilvl: 22, rarity: 'plain', value: 0,
      examine: 'Tall-eye grit ground fine and mixed to a paste. Smells faintly of rain. Used on the Unfired before firing.',
    },
    's11-kiln-tongs': {
      id: 's11-kiln-tongs', name: 'Kiln tongs', icon: '🔧', kind: 'trinket', slot: 'trinket',
      ilvl: 22, rarity: 'sprouted', stats: { sunDamage: 0.06 }, effect: '+6% Sun damage', value: 968,
      examine: 'Long, black, and warm at the grip. Sedum says they have been in the Kiln\'s cupboard since before she was born.',
    },
  },

  npcs: {
    's11-hyssop': {
      id: 's11-hyssop', name: 'Hyssop Mudpat', look: look(0x6b8a3a, 0xd9c7a0, null, { dress: true, freckles: true }), zone: 'rockery', x: -4, z: -98, wander: 1,
      // Appears in the back chambers once the Three at a Time firing has started. Walks to Flintdelve after the escort.
      placements: [{ zone: 'rockery', x: 6, z: 26, when: done(Q_HYSSOP) }],
      hidden: notStarted(Q_THREE),
      greetings: [
        { when: done(Q_HYSSOP), node: 'home' },
        { when: onStage(Q_HYSSOP, 0), node: 'escort-wait' },
        { when: done(Q_THREE), node: 'hub' },
        { node: 'wake' },
      ],
      nodes: hyssopNodes,
      model: 'gnome',
      examine: 'A gnome with clay still under her nails and plant-soft cheeks. She is looking at the Sun as if it owes her something.',
    },
    's11-lupin': {
      id: 's11-lupin', name: 'Lupin Crock', look: look(0x5a4632, 0xb5a27a, null), zone: 'rockery', x: 6, z: -104, wander: 1,
      // The Verge chapter: when fired she stands at the Last Tuft Shrine.
      placements: [{ zone: 'verge', x: 4, z: 84, when: flagIs('unfired', 'fired') }],
      greetings: [
        { when: onStage(Q_LAST, 1), node: 'choice' },
        { when: flagIs('unfired', 'kept'), node: 'kept-after' },
        { node: 'hub' },
      ],
      nodes: lupinNodes,
      model: 'clay',
      examine: 'An Unfired, cracked down one side and not sure how long she has. She has been on the end of the shelf for a long time.',
    },
  },

  quests: {
    [Q_ROCKROSE]: {
      id: Q_ROCKROSE, name: 'Something to Burn', giver: 'sedum', zone: 'rockery', level: 22, tier: 'side', chain: 'Finishing',
      stages: [
        { text: 'Gather six Dry rockrose from the Shard Mine ledges.', objective: { type: 'collect', item: 's11-dry-rockrose', count: 6 } },
        { text: 'Bring the Dry rockrose to Sedum in Flintdelve.', objective: { type: 'talk', npc: 'sedum' }, takeItems: [{ item: 's11-dry-rockrose', count: 6 }] },
      ],
      reward: { gold: 120, items: [{ item: 'sky-tonic', count: 2 }] },
    },
    [Q_GLASS]: {
      id: Q_GLASS, name: 'Ground Glass', giver: 'sedum', zone: 'rockery', level: 22, tier: 'side', chain: 'Finishing',
      stages: [
        { text: 'Collect five Tall-eye shards from the Marble Pits.', objective: { type: 'collect', item: TALL_EYE, count: 5 } },
        { text: 'Grind the Tall-eye shards at the glaze mill in Flintdelve.', objective: { type: 'interact', object: 's11-glaze-mill', count: 1 } },
        { text: 'Bring the glaze to Sedum.', objective: { type: 'talk', npc: 'sedum' } },
      ],
      reward: { gold: 160, items: [{ item: GLAZE, count: 3 }] },
    },
    [Q_THREE]: {
      id: Q_THREE, name: 'Three at a Time', giver: 'sedum', zone: 'rockery', level: 23, tier: 'side', chain: 'Finishing',
      stages: [
        { text: 'Reach the Kiln\'s back chambers.', objective: { type: 'reach', zone: 'rockery', x: 0, z: -102, r: 10 } },
        { text: 'Fire the first glazed Unfired in the left side mouth.', objective: { type: 'interact', object: 's11-side-mouth-1', count: 1 } },
        { text: 'Fire the second glazed Unfired in the middle side mouth.', objective: { type: 'interact', object: 's11-side-mouth-2', count: 1 } },
        { text: 'Fire the third glazed Unfired in the right side mouth.', objective: { type: 'interact', object: 's11-side-mouth-3', count: 1 } },
        { text: 'Tell Sedum how the firings went.', objective: { type: 'talk', npc: 'sedum' } },
      ],
      reward: { gold: 200, items: [{ item: 's11-kiln-tongs', count: 1 }] },
    },
    [Q_HYSSOP]: {
      id: Q_HYSSOP, name: 'Hyssop Says Good Morning', giver: 's11-hyssop', zone: 'rockery', level: 23, tier: 'side', chain: 'Finishing',
      stages: [
        { text: 'Walk Hyssop Mudpat up the lift road to Flintdelve. Keep her in one piece.', objective: { type: 'escort', npc: 's11-hyssop', zone: 'rockery', x: 0, z: 20, r: 6 } },
        { text: 'Tell Sedum that Hyssop has made it up.', objective: { type: 'talk', npc: 'sedum' } },
      ],
      reward: { gold: 180, items: [{ item: 'glaze-pot', count: 2 }] },
    },
    [Q_LAST]: {
      id: Q_LAST, name: 'The Last Warm Mouth', giver: 'sedum', zone: 'rockery', level: 24, tier: 'side', chain: 'Finishing',
      stages: [
        { text: 'Talk to Lupin Crock at the end of the back shelf.', objective: { type: 'talk', npc: 's11-lupin' } },
        { text: 'Decide with Lupin whether to fire her or let her stay soft.', objective: { type: 'choice', flag: 'unfired' } },
      ],
      reward: { gold: 220, items: [] },
    },
    [Q_LAST_FIRED]: {
      id: Q_LAST_FIRED, name: 'The Last Mouth', giver: 'sedum', zone: 'rockery', level: 24, tier: 'side', chain: 'Finishing',
      stages: [
        { text: 'Fire Lupin in the last side mouth, with Sun.', objective: { type: 'interact', object: 's11-side-mouth-3', count: 1 } },
        { text: 'Tell Sedum how Lupin came out.', objective: { type: 'talk', npc: 'sedum' } },
      ],
      // The gold is paid by The Last Warm Mouth; this follow-up only finishes the firing.
      reward: { gold: 0, items: [] },
    },
  },

  objects: {
    's11-rockrose-ledge': {
      id: 's11-rockrose-ledge', zone: 'rockery', name: 'Dry rockrose',
      model: 'generic', color: 0x9aa86a, scale: 0.8, verb: 'Gather',
      examine: 'Pale rockrose stalks growing out of the ledge, warm from the air off the iron.',
      text: 'You cut two stalks. They are lighter than they look.',
      giveItem: { item: 's11-dry-rockrose', count: 2 },
    },
    's11-tall-eye-heap': {
      id: 's11-tall-eye-heap', zone: 'rockery', name: 'Tall-eye spoil',
      model: 'stone', color: 0x7a8a7a, verb: 'Sift',
      examine: 'A heap of grey-green spoil, the Tall-eye stone the gem beetles leave behind.',
      text: 'You sift out a grey-green shard.',
      giveItem: { item: TALL_EYE, count: 1 },
    },
    's11-glaze-mill': {
      id: 's11-glaze-mill', zone: 'rockery', name: 'Glaze mill',
      model: 'stone', color: 0x6e5f49, scale: 1.4, verb: 'Grind',
      examine: 'A stone grinder at the foot of the lift-baskets, behind the smithy. Someone has been grinding here a long time.',
      text: 'The stone turns, and the shards come out as a fine grey paste that smells faintly of rain.',
      once: true,
      takeItem: { item: TALL_EYE, count: 5 },
    },
    's11-side-mouth-1': {
      id: 's11-side-mouth-1', zone: 'rockery', name: 'Side mouth',
      model: 'generic', color: 0xb0562e, scale: 1.2, verb: 'Fire',
      examine: 'A small firing mouth in the Kiln\'s side wall, sized for one gnome at a time. The brick is warm.',
      text: 'You put the glazed Unfired on the tray and cast Sun into the mouth. It holds the heat.',
      when: { hasItem: { item: GLAZE, count: 1 } },
      takeItem: { item: GLAZE, count: 1 },
    },
    's11-side-mouth-2': {
      id: 's11-side-mouth-2', zone: 'rockery', name: 'Side mouth',
      model: 'generic', color: 0xb0562e, scale: 1.2, verb: 'Fire',
      examine: 'The middle side mouth, the one nearest the main hearth. It is the hottest of the three.',
      text: 'You put the glazed Unfired on the tray and cast Sun into the mouth. The glaze begins to glow.',
      when: { hasItem: { item: GLAZE, count: 1 } },
      takeItem: { item: GLAZE, count: 1 },
    },
    's11-side-mouth-3': {
      id: 's11-side-mouth-3', zone: 'rockery', name: 'Side mouth',
      model: 'generic', color: 0xb0562e, scale: 1.2, verb: 'Fire',
      examine: 'The side mouth at the far end. Its tray is still scorched from the last firing.',
      text: 'You put the glazed Unfired on the tray and cast Sun into the mouth. Something inside settles.',
      when: { hasItem: { item: GLAZE, count: 1 } },
      takeItem: { item: GLAZE, count: 1 },
    },
  },

  // Canon NPCs get their quest lines here, through topics (start options), greetingsFirst (stage greetings) and extraNodes (the nodes they point to).
  topics: {
    sedum: [
      { text: 'Is there anything I can haul for you?', next: 's11-q1-start', action: { type: 'startQuest', quest: Q_ROCKROSE }, when: { ...done('c6-kiln-warden'), ...notStarted(Q_ROCKROSE) } },
      { text: 'What else needs doing for the Kiln?', next: 's11-q2-start', action: { type: 'startQuest', quest: Q_GLASS }, when: { ...done(Q_ROCKROSE), ...notStarted(Q_GLASS) } },
      { text: 'Shall we fire one, then?', next: 's11-q3-start', action: { type: 'startQuest', quest: Q_THREE }, when: { ...done(Q_GLASS), ...notStarted(Q_THREE) } },
      { text: 'Who is at the end of the back shelf?', next: 's11-q5-start', action: { type: 'startQuest', quest: Q_LAST }, when: { ...done(Q_THREE), ...notStarted(Q_LAST) } },
      { text: 'Lupin says yes. Let\'s fire her.', next: 's11-q5b-start', action: { type: 'startQuest', quest: Q_LAST_FIRED }, when: { ...done(Q_LAST), ...flagIs('unfired', 'fired'), ...notStarted(Q_LAST_FIRED) } },
    ],
  },

  greetingsFirst: {
    sedum: sedumTurnins,
  },

  extraNodes: {
    sedum: {
      's11-q1-start': {
        text: 'Thirty years I\'ve kept them. Tonight I\'d like to finish one. First, Dry rockrose from the Shard Mine ledges. Six of it, please.',
        options: [{ text: 'Six rockrose. Understood.' }],
      },
      's11-q1-wait': {
        text: 'Six Dry rockrose, from the ledges above the deep seam. Bring it here when you have it.',
        options: [{ text: 'On my way.' }],
      },
      's11-q1-turnin': {
        text: 'Good stalks, light and dry. Sweet smell, no complaints. Thank you.',
        options: [{ text: 'You\'re welcome.' }],
      },
      's11-q2-start': {
        text: 'Tall-eye from the Marble Pits. Five shards, from the gem beetles. Then grind them at the mill behind the smithy.',
        options: [{ text: 'I\'ll get the shards.' }],
      },
      's11-q2-wait': {
        text: 'Five Tall-eye shards from the Marble Pits, and the glaze mill at the foot of the lift-baskets. Fine as flour, mind.',
        options: [{ text: 'Going now.' }],
      },
      's11-q2-turnin': {
        text: 'Ground fine, and it smells faintly of rain. Three glaze for the mouths. Good work.',
        options: [{ text: 'Thanks, Sedum.' }],
      },
      's11-q3-start': {
        text: 'The back chambers, past the main hearth. Three side mouths, one glazed gnome each. Mind the heat.',
        options: [{ text: 'Going to the back.' }],
      },
      's11-q3-wait': {
        text: 'Reach the back chambers, then fire the three side mouths. Each firing takes a glaze.',
        options: [{ text: 'Going now.' }],
      },
      's11-q3-turnin': {
        text: 'Three firings. One of them has asked for her own name. I didn\'t think I\'d see that in my lifetime.',
        options: [{ text: 'Neither did I.' }],
      },
      's11-q4-wait': {
        text: 'Bring Hyssop up the lift road to Flintdelve. I\'ll have the bench ready by the forge.',
        options: [{ text: 'Going up.' }],
      },
      's11-q4-turnin': {
        text: 'She walked up under her own power. A bench in the sun, and a name she chose. Thank you.',
        options: [{ text: 'Glad she made it.' }],
      },
      's11-q5-start': {
        text: 'Lupin is cracked down one side, at the end of the shelf. Go and listen to her. Then the decision is hers and yours.',
        options: [{ text: 'I\'ll go and listen.' }],
      },
      's11-q5-wait': {
        text: 'Lupin is at the end of the shelf. She knows what she wants. Go and hear it.',
        options: [{ text: 'Going.' }],
      },
      's11-q5b-start': {
        text: 'Lupin says yes. Her glaze is in your pack. Fire her in the last side mouth, with Sun, and tell me how she came out.',
        options: [{ text: 'Right.' }],
      },
      's11-q5b-wait': {
        text: 'The last side mouth, at the far end of the back chambers. Lupin\'s glaze and the Sun.',
        options: [{ text: 'Going now.' }],
      },
      's11-q5b-turnin': {
        text: 'Four of them, and not one cracked for good. Better than the Kiln has done in my lifetime. Better than my mother\'s.',
        options: [{ text: 'Thank you, Sedum.' }],
      },
    },
  },
};
