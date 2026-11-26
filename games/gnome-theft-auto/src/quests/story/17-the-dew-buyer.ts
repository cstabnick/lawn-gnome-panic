// Story row 17 (docs/design/gnome-theft-auto/story-outline.md): The Dew Buyer, act II, chapter 2. Granny's stolen-back Dew
// keeps going missing, one tanker a night, always west. The player tails the unmarked tanker out of Cloverfield and down
// the west highway to the gate of Trellisdown Vineyard (first reach; E16), photographs three frost-pots burning Dew, and
// glimpses the Countess on her terrace. Scenes: cutscene/scenes/story/m17-the-dew-buyer.ts.
import { brief, call, type StoryFile } from './kit';

/** The frost-pots by the vineyard path (country/trellisLife.ts FROST_POTS): the three on the east line. */
const POTS: [number, number][] = [[-1131.5, -68], [-1131.5, -80], [-1131.5, -104]];

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm17-the-dew-buyer',
      title: 'The Dew Buyer',
      giver: 'cloverfield-barn',
      prereq: 'ch2-dew-run',
      chapter: 2,
      rewardAcorns: 300,
      radioBulletin: 'm17-the-dew-buyer',
      // A tail and three photographs: a gentle quest, the Hat Watch has no business in it.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'm17-the-dew-buyer-intro' },
      outro: { kind: 'script', script: 'm17-the-dew-buyer-outro' },
      beats: { 1: 'm17-the-dew-buyer-mid' },
      objectives: [
        {
          kind: 'chase-follow',
          text: 'Tail the unmarked tanker from Route South out the west highway',
          leaderName: 'Unmarked Tanker',
          leaderKind: 'hoa-van',
          leaderLook: { hat: 0x2a2a30, shirt: 0x33343a },
          // Route South, the ring road, the west highway past Mossy Wood, the lane to the vineyard gate.
          waypoints: [[-40, 320], [-300, 150], [-320, 20], [-570, -30], [-870, -30], [-1050, -31], [-1140, -45]],
          speed: 13,
          maxDist: 120,
          hint: 'Unmarked tanker',
        },
        {
          kind: 'visit',
          text: 'Slip past the gate and get among the vine rows',
          at: [-1140, -86],
          radius: 7,
          hint: 'Trellisdown Vineyard gate',
        },
        {
          kind: 'inspect',
          text: 'Photograph the three frost-pots burning Dew',
          verb: 'Photograph',
          points: [
            { at: POTS[0], label: 'Frost-pot 1 of 3', note: 'Thick black smoke, and it smells like Granny\'s barrels. That is not firewood.' },
            { at: POTS[1], label: 'Frost-pot 2 of 3', note: 'The gardener is feeding this one from a watering can. Calm as a Sunday.' },
            { at: POTS[2], label: 'Frost-pot 3 of 3', note: 'Every pot in the line is burning Dew. One tanker a night, gone up the chimney.' },
          ],
          hint: 'The frost-pots by the vineyard path',
        },
      ],
      doneText: 'You know where the Dew goes: up the chimneys of Trellisdown. Granny has more questions than she has pie.',
    },
  ],
  comms: {
    'm17-the-dew-buyer': {
      0: brief(
        ['granny', 'Sugar, the Dew you won back keeps leaving. One tanker a night, always west.'],
        ['granny', 'Tail it from Route South and find who buys it. I pay in pie.'],
        ['granny', 'Three hundred acorns, and a slice. Stay back; the tankers know your hat.'],
      ),
      1: call(['granny', 'Quiet now. Find the vine rows and bring your camera, sugar.']),
      2: call(['granny', 'Who burns good Dew in a vineyard? Take three pictures and come home.']),
    },
  },
  plans: {
    'm17-the-dew-buyer': { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    'm17-the-dew-buyer': [
      "Trellisdown reports an unusually bright frost-pot night. The gardener declined comment, as he declines most things.",
      "Traffic note: an unmarked tanker was seen heading west along the highway, and a hat was seen very far behind it.",
    ],
  },
};
