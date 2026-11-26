// Story row 38 (m38-pail-pond): Pail Pond. Gentian says an HOA radio went through the Pail Pond ice and may know where the
// HOA is taking the Combine's parts. The player drives out to Theo's shanty, fishes three marked holes (an old boot, an
// unimpressed fish, the radio) while the polar bears lounge nearby, and brings the radio to the lodge stove to dry. The
// outro plays the dispatch: deck, guidance, power and money, and where each goes; Pip inks a map on a sock. The four
// parts are in the outro lines and the doneText so a skipped outro loses nothing.
// Scenes: cutscene/scenes/story/m38-pail-pond.ts. Stages: quests/stages/story/s38-pail-pond.ts.
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm38-pail-pond';

/** Pail Pond (winter/types.ts PAIL_POND centre -640, -1060; SHANTY -612, -1040): three marked holes on the ice. */
const SHANTY: [number, number] = [-612, -1040];
/** The lodge stove stands on the porch by the cocoa hatch (LODGE faces east). */
const LODGE_STOVE: [number, number] = [-437, -1020];

const QUEST: QuestDef = {
  id: ID,
  title: 'Pail Pond',
  giver: 'gentian',
  prereq: 'm37-snowdrop-slope',
  chapter: 3,
  rewardAcorns: 250,
  radioBulletin: ID,
  cutscene: { kind: 'script', script: 'm38-pail-pond-intro' },
  outro: { kind: 'script', script: 'm38-pail-pond-outro' },
  objectives: [
    {
      kind: 'visit',
      text: "Drive out across the ice to Theo's shanty on Pail Pond",
      at: SHANTY,
      radius: 9,
      hint: 'Pail Pond, west of the lodge: the red shanty on the ice',
    },
    {
      kind: 'inspect',
      text: 'Fish the three marked holes for the HOA radio (the bears are relaxed)',
      verb: 'Fish',
      holdSeconds: 1.5,
      ordered: false,
      points: [
        { at: [-628, -1048], label: 'Hole 1 of 3', note: 'An old boot. Somebody on Pail Pond has been very patient about it.' },
        { at: [-654, -1066], label: 'Hole 2 of 3', note: 'A fish looks up at you, unimpressed, and goes back down.' },
        { at: [-646, -1086], label: 'Hole 3 of 3', note: 'The HOA radio: beige, frosted and cold. It is not talking, but it looks like it wants to.', prop: 'hoa-radio' },
      ],
      hint: 'Pail Pond, the three holes marked on the ice, by the sleeping bears',
    },
    {
      kind: 'visit',
      text: 'Take the radio back to the lodge and dry it by the stove',
      at: LODGE_STOVE,
      radius: 4,
      hint: 'The Woolly Sock Lodge stove, east of the pond',
    },
  ],
  doneText:
    'The radio dried and talked: four Combine parts, four yards. Deck to Hedgeworth, guidance to Rootwell, power to Pinwheel Ridge, money to Trellisdown. Pip inked it all on a sock, and the sock map is in your journal.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['gentian', 'Previously: you have a bunk and no plan. Up, up, up! I have half a plan.'],
        ['gentian', 'An HOA radio went through the Pail Pond ice. Fish it out, and mind the bears.'],
        ['gentian', 'It may say where the HOA takes its parts. Two hundred fifty acorns.'],
      ),
      1: call(
        ['thermos theo', 'Three holes, one radio. The ice will tell you which, if you hold still.'],
        ['thermos theo', 'The bears are relaxed. Do not take it personally.'],
      ),
      2: call(['gentian', 'Stove is ready! Bring it in before it learns to like the cold.']),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: the HOA denies losing a radio. A spokesman adds that the radio, if it existed, was approved, and that approved radios do not swim.',
      'Ice fishers on Pail Pond report a large quiet crowd of polar bears and a very small catch. Everyone involved says it was a lovely afternoon.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
