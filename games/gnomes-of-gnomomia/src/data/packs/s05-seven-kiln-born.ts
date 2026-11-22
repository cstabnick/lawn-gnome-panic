// Content pack s05-seven-kiln-born (Storyline 05, "The Seven Kiln-born", Birdbath Keep hub with five claim zones, levels 6-24). Prefix for new ids: s05-.
// Canon ids referenced, not defined here: inkcap (npc, ch3); thistle (mossbottom); grindwell (ch2); haybale (ch4); lichen, grout (ch5/ch6, still stubs);
// mb-moss-statue (object, mossbottom); mole-king, c2-letter-for-the-queen, c3-ledger, c4-great-haul, c5-heartwood (main quests).
// Claim objects show only while their quest stage is active; relic objects show on their collect stage.
import type { Condition, ContentPack, DialogueNode, DialogueOption, Greeting, ItemDef, QuestDef, WorldObjectSpec } from '../../config';

/** True when every condition holds. A Condition holds one quest field, so several quest checks chain through not/not. */
function allOf(...cs: Condition[]): Condition {
  return cs.reduceRight<Condition | undefined>((rest, c) => (rest ? { ...c, not: { not: rest } } : c), undefined) ?? {};
}
const done = (id: string): Condition => ({ quest: { id, status: 'done' } });
const fresh = (id: string): Condition => ({ quest: { id, status: 'none' } });
const onStage = (id: string, stage: number): Condition => ({ questStage: { id, stage } });

/** Basil's start option. Each quest needs the first quest done and its zone's chapter open (the keep exit that leads there). */
const startOption = (quest: string, text: string, next: string, gate: Condition): DialogueOption => ({
  text, next, action: { type: 'startQuest', quest },
  when: allOf(fresh(quest), done('s05-seven-names'), gate),
});

const MOSSBOTTOM_OPEN = done('mole-king');
const THATCHFORD_OPEN = done('c2-letter-for-the-queen');
const CLOVERFIELD_OPEN = done('c3-ledger');
const HEDGEWOOD_OPEN = done('c4-great-haul');
const ROCKERY_OPEN = done('c5-heartwood');

const CLAIM_QUESTS = ['s05-the-well-ring', 's05-the-ford-stone', 's05-vetchs-measure', 's05-ivys-hollow', 's05-stonecrops-mould'];
const RELICS = ['s05-puddlemere-mark', 's05-stoutpot-tankard', 's05-spadewell-dibber', 's05-pailwright-handle', 's05-mallet-head'];

export const PACK: ContentPack = {
  id: 's05-seven-kiln-born',

  quests: {
    's05-seven-names': {
      id: 's05-seven-names', name: 'The Seven Names', giver: 'inkcap', zone: 'keep', level: 10, tier: 'side', chain: 'The Seven Kiln-born',
      stages: [
        { text: 'Talk to Archivist Basil Inkcap again about the three copies of the roll.', objective: { type: 'talk', npc: 'inkcap' } },
        { text: 'Read the Seven Ledger shelf in the Archive.', objective: { type: 'interact', object: 's05-seven-ledger', count: 1 } },
        { text: 'Tell Basil what the Seven Ledger says.', objective: { type: 'talk', npc: 'inkcap' } },
      ],
      reward: { gold: 70, items: [] },
    },
    's05-the-well-ring': {
      id: 's05-the-well-ring', name: 'The Well Ring', giver: 'inkcap', zone: 'mossbottom', level: 6, tier: 'side', chain: 'The Seven Kiln-born',
      stages: [
        { text: 'Examine the moss kiln-daughter statue beside the Mossbottom well.', objective: { type: 'interact', object: 'mb-moss-statue', count: 1 } },
        { text: 'Ask Old Thistle about the Moss verse.', objective: { type: 'talk', npc: 'thistle' } },
        { text: 'Reach Puddlemere, the lake to the north-east.', objective: { type: 'reach', zone: 'mossbottom', x: 72, z: -42, r: 8 } },
        { text: 'Find the Puddlemere Mark in the drowned cart on the far bank.', objective: { type: 'collect', item: 's05-puddlemere-mark', count: 1 } },
      ],
      reward: { gold: 30, items: [] },
    },
    's05-the-ford-stone': {
      id: 's05-the-ford-stone', name: 'The Ford Stone', giver: 'inkcap', zone: 'thatchford', level: 10, tier: 'side', chain: 'The Seven Kiln-born',
      stages: [
        { text: 'Reach the ford over the Hose in Thatchford.', objective: { type: 'reach', zone: 'thatchford', x: 5, z: -1, r: 6 } },
        { text: 'Step on the Ford Stone, the first of the stepping stones.', objective: { type: 'interact', object: 's05-ford-stone', count: 1 } },
        { text: 'Ask Rye Grindwell about the ford stones.', objective: { type: 'talk', npc: 'grindwell' } },
        { text: 'Find the Stoutpot Tankard in the Puddleby cellar.', objective: { type: 'collect', item: 's05-stoutpot-tankard', count: 1 } },
      ],
      reward: { gold: 60, items: [] },
    },
    's05-vetchs-measure': {
      id: 's05-vetchs-measure', name: "Vetch's Measure", giver: 'inkcap', zone: 'cloverfield', level: 12, tier: 'side', chain: 'The Seven Kiln-born',
      stages: [
        { text: "Count Vetch's clover rows at Honeydew Ranch.", objective: { type: 'interact', object: 's05-clover-rows', count: 1 } },
        { text: 'Tell Ma Haybale how many rows you counted.', objective: { type: 'talk', npc: 'haybale' } },
        { text: 'Find the Spadewell Dibber in the Sodbury schoolhouse.', objective: { type: 'collect', item: 's05-spadewell-dibber', count: 1 } },
      ],
      reward: { gold: 160, items: [] },
    },
    's05-ivys-hollow': {
      id: 's05-ivys-hollow', name: "Ivy's Hollow", giver: 'inkcap', zone: 'hedgewood', level: 16, tier: 'side', chain: 'The Seven Kiln-born',
      stages: [
        { text: 'Reach Barkhollow in the Hedgewood.', objective: { type: 'reach', zone: 'hedgewood', x: 80, z: -20, r: 8 } },
        { text: 'Look inside the hollow stump behind Barkhollow.', objective: { type: 'interact', object: 's05-ivys-hollow', count: 1 } },
        { text: 'Tell Old Lichen what the hollow says.', objective: { type: 'talk', npc: 'lichen' } },
        { text: 'Find the Pailwright Pail-handle in the Sawdust Mill ruins.', objective: { type: 'collect', item: 's05-pailwright-handle', count: 1 } },
      ],
      reward: { gold: 75, items: [] },
    },
    's05-stonecrops-mould': {
      id: 's05-stonecrops-mould', name: "Stonecrop's Mould", giver: 'inkcap', zone: 'rockery', level: 20, tier: 'side', chain: 'The Seven Kiln-born',
      stages: [
        { text: 'Reach the old face of the Shard Mine in the Rockery.', objective: { type: 'reach', zone: 'rockery', x: 40, z: -22, r: 6 } },
        { text: 'Look at Stonecrop\'s Mould in the rock.', objective: { type: 'interact', object: 's05-stonecrop-mould', count: 1 } },
        { text: 'Ask Grout what he hears in the rock.', objective: { type: 'talk', npc: 'grout' } },
        { text: 'Find the Stonecrop Mallet Head in the Marble Pits.', objective: { type: 'collect', item: 's05-mallet-head', count: 1 } },
      ],
      reward: { gold: 150, items: [] },
    },
    's05-write-it-down': {
      id: 's05-write-it-down', name: 'Write It Down', giver: 'inkcap', zone: 'keep', level: 24, tier: 'main', chain: 'The Seven Kiln-born',
      stages: [
        {
          text: 'Hand Basil the five claims: the Puddlemere Mark, the Stoutpot Tankard, the Spadewell Dibber, the Pailwright Pail-handle and the Stonecrop Mallet Head.',
          objective: { type: 'talk', npc: 'inkcap' },
          takeItems: RELICS.map((item) => ({ item, count: 1 })),
        },
        { text: 'Decide with Basil what is written down.', objective: { type: 'choice', flag: 'seven' } },
        { text: 'Go back to Basil for the last word.', objective: { type: 'talk', npc: 'inkcap' } },
      ],
      reward: { gold: 300, items: [{ item: 's05-blank-name-bead', count: 1 }] },
    },
  } as Record<string, QuestDef>,

  items: {
    's05-puddlemere-mark': { id: 's05-puddlemere-mark', name: 'Puddlemere Mark', icon: '🍄', kind: 'misc', ilvl: 2, rarity: 'plain', questItem: true, value: 0, examine: "A clay lid with a mushroom stamp. Moss's mark, if you trust the well." },
    's05-stoutpot-tankard': { id: 's05-stoutpot-tankard', name: 'Stoutpot Tankard', icon: '🍺', kind: 'misc', ilvl: 8, rarity: 'plain', questItem: true, value: 0, examine: "A dented tankard with a ford-stone mark on the lip. Rush's, if Thatchford is right." },
    's05-spadewell-dibber': { id: 's05-spadewell-dibber', name: 'Spadewell Dibber', icon: '🌱', kind: 'misc', ilvl: 12, rarity: 'plain', questItem: true, value: 0, examine: 'A seed dibber with seven notches on its handle, one filed flat.' },
    's05-pailwright-handle': { id: 's05-pailwright-handle', name: 'Pailwright Pail-handle', icon: '🪣', kind: 'misc', ilvl: 16, rarity: 'plain', questItem: true, value: 0, examine: "Half a pail handle with a hollow-stump carving. Ivy's, if the Hedgewood is right." },
    's05-mallet-head': { id: 's05-mallet-head', name: 'Stonecrop Mallet Head', icon: '🔨', kind: 'misc', ilvl: 20, rarity: 'plain', questItem: true, value: 0, examine: "A mallet head with a glaze of old clay. Stonecrop's, or a Rockery miner's who liked the story." },
    's05-blank-name-bead': {
      id: 's05-blank-name-bead', name: 'Blank Name Bead', icon: '📿', kind: 'trinket', slot: 'trinket', ilvl: 18, rarity: 'blooming',
      stats: { endurance: 3, critDamage: 5 }, value: 1296,
      examine: 'A clay bead with nothing written on it. It is warm when you hold it. Whoever wears it has to decide what to call the seventh one.',
    },
  } as Record<string, ItemDef>,

  objects: {
    's05-seven-ledger': {
      id: 's05-seven-ledger', zone: 'keep', name: 'Seven Ledger shelf', x: -22, z: -31, model: 'book',
      verb: 'Read', examine: 'The Archive\'s shelf of the Seven Roll. Two copies list seven names. The third has a line scraped to the grain.',
      text: 'Seven names in a neat hand. On the lower shelf, the third copy, with one line scraped so hard the paper has thinned.',
      when: onStage('s05-seven-names', 1),
    },
    's05-clover-rows': {
      id: 's05-clover-rows', zone: 'cloverfield', name: "Vetch's clover rows", model: 'generic',
      verb: 'Count', examine: 'Clover planted in rows at Honeydew Ranch. The rows are uneven, and one end has been filed flat.',
      text: 'Seven rows. Six are thick with clover. The seventh is thinner, as if someone planted it and then wanted it back.',
      when: onStage('s05-vetchs-measure', 0),
    },
    's05-ford-stone': {
      id: 's05-ford-stone', zone: 'thatchford', name: 'Ford Stone', model: 'stone',
      verb: 'Step', examine: 'The first of the stepping stones across the Hose. One face is cut with a mark that has almost worn away.',
      text: 'You step onto it. It rocks, and holds.',
      when: onStage('s05-the-ford-stone', 1),
    },
    's05-puddleby-cellar': {
      id: 's05-puddleby-cellar', zone: 'thatchford', name: 'Puddleby cellar', model: 'chest',
      verb: 'Search', examine: 'A cellar hatch under a stack of Puddleby crates. The damp has got into the hinges.',
      text: 'Under the sacks: a dented tankard with a ford-stone mark on the lip.',
      giveItem: { item: 's05-stoutpot-tankard', count: 1 }, once: true,
      when: onStage('s05-the-ford-stone', 3),
    },
    's05-puddlemere-cart': {
      id: 's05-puddlemere-cart', zone: 'mossbottom', name: 'Puddlemere cart, far bank', model: 'cart',
      verb: 'Search', examine: 'Another cart, sunk on the far side of Puddlemere. Its name board has gone to moss.',
      text: 'Under the wet sacking there is a clay lid with a mushroom stamp.',
      giveItem: { item: 's05-puddlemere-mark', count: 1 }, once: true,
      when: onStage('s05-the-well-ring', 3),
    },
    's05-schoolhouse-desk': {
      id: 's05-schoolhouse-desk', zone: 'cloverfield', name: 'Schoolhouse desk', model: 'generic',
      verb: 'Open', examine: 'A pupil\'s desk by the schoolhouse wall, with a seed dibber stuck through the lid.',
      text: 'The dibber has seven notches on its handle, one of them filed flat.',
      giveItem: { item: 's05-spadewell-dibber', count: 1 }, once: true,
      when: onStage('s05-vetchs-measure', 2),
    },
    's05-ivys-hollow': {
      id: 's05-ivys-hollow', zone: 'hedgewood', name: "Ivy's Hollow", model: 'generic',
      verb: 'Look', examine: 'A hollow stump behind Barkhollow, big enough to sit in. Someone has carved a verse on the inside.',
      text: 'Inside the stump, a carved verse. The last line is only a scratch.',
      when: onStage('s05-ivys-hollow', 1),
    },
    's05-sawdust-ruins': {
      id: 's05-sawdust-ruins', zone: 'hedgewood', name: 'Sawdust Mill ruins', model: 'generic',
      verb: 'Search', examine: 'Charred sawdust and a broken wheel: all that is left of the mill cutting line.',
      text: 'Half a pail handle, carved with a hollow stump.',
      giveItem: { item: 's05-pailwright-handle', count: 1 }, once: true,
      when: onStage('s05-ivys-hollow', 3),
    },
    's05-stonecrop-mould': {
      id: 's05-stonecrop-mould', zone: 'rockery', name: "Stonecrop's Mould", model: 'stone',
      verb: 'Examine', examine: 'A gnome-shaped hollow in the old face of the Shard Mine, opened by a crack after the First Rumble. A trowel is pressed in beside its hand.',
      text: 'Somewhere deep in the rock, something thumps once, then is quiet.',
      when: onStage('s05-stonecrops-mould', 1),
    },
    's05-marble-pits': {
      id: 's05-marble-pits', zone: 'rockery', name: 'Marble Pits spoil heap', model: 'chest',
      verb: 'Search', examine: 'A spoil heap at the mouth of the Marble Pits, sorted by colour.',
      text: 'A mallet head with a glaze of old clay. Somebody has tied a string to the handle hole.',
      giveItem: { item: 's05-mallet-head', count: 1 }, once: true,
      when: onStage('s05-stonecrops-mould', 3),
    },
  } as Record<string, WorldObjectSpec>,

  topics: {
    // Basil's hub gets one start option per claim, and the write-down once all five claims are done.
    inkcap: [
      {
        text: 'Show me the three copies of the Seven Roll.', next: 's05-ba-q1-start',
        action: { type: 'startQuest', quest: 's05-seven-names' },
        when: allOf(fresh('s05-seven-names'), done('c3-ledger')),
      },
      startOption('s05-the-well-ring', 'The Well Ring: what does Mossbottom remember?', 's05-ba-q2-start', MOSSBOTTOM_OPEN),
      startOption('s05-the-ford-stone', 'The Ford Stone: what does Thatchford remember?', 's05-ba-q3-start', THATCHFORD_OPEN),
      startOption('s05-vetchs-measure', "Vetch's Measure: what does Cloverfield remember?", 's05-ba-q4-start', CLOVERFIELD_OPEN),
      startOption("s05-ivys-hollow", "Ivy's Hollow: what does the Hedgewood remember?", 's05-ba-q5-start', HEDGEWOOD_OPEN),
      startOption('s05-stonecrops-mould', "Stonecrop's Mould: what does the Rockery remember?", 's05-ba-q6-start', ROCKERY_OPEN),
      {
        text: 'The five claims are in. Which do you want written down?', next: 's05-ba-q7-start',
        action: { type: 'startQuest', quest: 's05-write-it-down' },
        when: allOf(fresh('s05-write-it-down'), ...CLAIM_QUESTS.map(done)),
      },
    ] as DialogueOption[],
  },

  greetingsFirst: {
    inkcap: [
      { when: onStage('s05-seven-names', 0), node: 's05-ba-q1-talk' },
      { when: onStage('s05-seven-names', 2), node: 's05-ba-q1-done' },
      { when: onStage('s05-write-it-down', 0), node: 's05-ba-q7-claims' },
      { when: onStage('s05-write-it-down', 1), node: 's05-ba-q7-choice' },
      { when: onStage('s05-write-it-down', 2), node: 's05-ba-q7-done' },
    ] as Greeting[],
    thistle: [{ when: onStage('s05-the-well-ring', 1), node: 's05-th-well' }] as Greeting[],
    grindwell: [{ when: onStage('s05-the-ford-stone', 2), node: 's05-gw-ford' }] as Greeting[],
    haybale: [{ when: onStage('s05-vetchs-measure', 1), node: 's05-hb-vetch' }] as Greeting[],
    lichen: [{ when: onStage('s05-ivys-hollow', 2), node: 's05-li-ivy' }] as Greeting[],
    grout: [{ when: onStage('s05-stonecrops-mould', 2), node: 's05-gt-mould' }] as Greeting[],
  },

  extraNodes: {
    inkcap: {
      's05-ba-q1-start': {
        text: 'There are three accounts of that, all wrong in interesting ways. Seven names, and one copy has a hole in it. Let me look at the roll before you go anywhere.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q1-talk': {
        text: 'The Archive keeps the Seven Ledger on the shelf behind me. Read it, then tell me what the scraped line says.',
        options: [{ text: 'I\'ll look.' }],
      },
      's05-ba-q1-done': {
        text: 'Seven names, and one blot. That is more than the Archive knew this morning. Forty gold, and my thanks.',
        options: [{ text: 'Thank you, Basil.' }],
      },
      's05-ba-q2-start': {
        text: 'Moss sat on the rim of the well and sang while the mushrooms came up. Start with the statue beside it. Then ask Thistle how she sang it.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q3-start': {
        text: 'Rush Stoutpot built the ford, the songs say, and Thatchford says he did it alone. Stand on the ford and count the stones for yourself.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q4-start': {
        text: 'Vetch planted the first clover, and Cloverfield has a rhyme about seven rows. Count the rows at Honeydew Ranch before you believe any of it.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q5-start': {
        text: 'Ivy Pailwright waited in a hollow stump, the Hedgewood says, for the Gardeners. Mossbottom says she went after them. The hollow will tell us which.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q6-start': {
        text: 'Stonecrop Mallet is in the rock, if the Rockery is right. The old face of the Shard Mine is where to look. Be careful on the way up.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q7-start': {
        text: 'Five villages, five verses, one blot. Gnorwin is the only name nobody argues with. Bring me the five claims and we will decide what is written down.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q7-claims': {
        text: 'Five claims, pinned to my table one at a time. Mossbottom, Thatchford, Cloverfield, the Hedgewood, the Rockery. Gnorwin is the only name they all agree on.',
        options: [{ text: 'Go on.' }],
      },
      's05-ba-q7-choice': {
        text: 'Which do you want written down? The roll has a blot in the seventh place, and I have never known who scratched it out.',
        options: [
          { text: 'Write all five claims, and leave the blot blank.', next: 's05-ba-q7-wrote', action: { type: 'setFlag', flag: 'seven', value: 'wrote' } },
          { text: 'Write Gnorwin alone; the rest are local stories.', next: 's05-ba-q7-gnorwin', action: { type: 'setFlag', flag: 'seven', value: 'gnorwin' } },
        ],
      },
      's05-ba-q7-wrote': {
        text: 'Basil pins the five claims to the Archive wall, one under the other, with a space in the middle that he does not fill. He says he will leave it blank until someone tells him whose name it is.',
        options: [{ text: 'Goodbye, Basil.' }],
      },
      's05-ba-q7-gnorwin': {
        text: 'Basil writes one line in the roll: Gnorwin Clayfoot, first king. He looks at the rest of the claims for a long moment, then puts them in a drawer.',
        options: [{ text: 'Goodbye, Basil.' }],
      },
      's05-ba-q7-done': {
        text: 'Thank you. Here is the Blank Name Bead. It is warm, and it has nothing written on it. That is the part I could not write myself.',
        options: [{ text: 'Thank you, Basil.' }],
      },
    } as Record<string, DialogueNode>,
    thistle: {
      's05-th-well': {
        text: 'Moss? She sat on the rim and sang while the mushrooms came up. Sang it wrong, mind. Sang it like she was counting.',
        options: [{ text: 'Thank you, Thistle.' }],
      },
    },
    grindwell: {
      's05-gw-ford': {
        text: 'Rush carried the ford stones on his back, the song says. Count them. I did. There are five. Say it was seven gnomes, and I\'ll count you out of the river.',
        options: [{ text: 'Thank you, Rye.' }],
      },
    },
    haybale: {
      's05-hb-vetch': {
        text: 'Vetch planted the first clover. Seven rows, the rhyme says. My granny sang six rows and no Vetch at all. You pick.',
        options: [{ text: 'I\'ll think on it.' }],
      },
    },
    lichen: {
      's05-li-ivy': {
        text: 'Ivy stayed in the hollow to wait for the Gardeners. I sing her verse every winter and leave the blank line empty. It is the only line I am sure of.',
        options: [{ text: 'Thank you, Lichen.' }],
      },
    },
    grout: {
      's05-gt-mould': {
        text: 'It breathes out, that mould. Only when the Mower is further along. Thump. Turn. There is a trowel beside its hand, if you were wondering. I wasn\'t.',
        options: [{ text: 'Thank you, Grout.' }],
      },
    },
  },
};
