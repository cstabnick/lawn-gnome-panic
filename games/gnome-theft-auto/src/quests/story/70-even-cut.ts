// Story row 70 "The Even Cut", part 3 and the final (docs/design/gnome-theft-auto/story-outline.md, extended finale).
// The old single finale's objectives are split across the parts in their old order (save migration: questSave.ts
// migrateFinaleSave): p3 The Gilded Lawn-Throne = the deck fight half of old objective 2 (boss-combine phase 'guards');
// the final, which KEEPS THE ID ch5-even-cut (old saves record it done), = the jam half of old objective 2 (phase
// 'jam'), old objective 3 (crack Vesper) and old objective 4 (the choice, Endings A/B). Keep each part's objective
// kinds, count and order.
// - p3 (day): on the deck, the Lawn-Throne rises at the far end with a top hat showing over its back, and Vesper's PA
//   comes apart ("And to the gnome in that hat: tonight, it cracks."). The Porcelain Guard down; they sit on the kerb in
//   an even row; the throne's lamp (a porcelain lantern) is lit, and the intake is open.
// - final (day, then dusk): the crew in the street with the Stone and the cigar box: Vesper cannot finish his hat line,
//   the golden kazoo goes off in the silence, the forty-eighth wrench comes out, Tansy says Pip's line and he has nothing.
//   The jam (beat 1, sincere, no gag): the Stone holds, the throne comes down to the road. The hat (beat 2): it comes
//   off, the player picks it up, Vesper is still, and says the hat line one last time and means it; the acorn and the
//   choice. Outro: Clara sits with him on the throne's step; then the epilogue. W17 follows (and W19, Cam's line).
// Kept scenes even-cut-intro / even-cut-outro: cutscene/scenes/story/ch5.ts; new scenes: m70-even-cut.ts; stages:
// quests/stages/story/s70-even-cut.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const VESPER_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xf4f4f8, skin: 0xfafafa, glasses: true };

const P3 = 'ch5-even-cut-p3';
const FINAL = 'ch5-even-cut';

const QUESTS: readonly QuestDef[] = [
  {
    id: P3,
    // E23 L103: a squad shoot-out; the Hat Watch may notice (1 hat) but sends no pursuits.
    hoaSteps: { 0: { cap: 1 } },
    title: 'The Gilded Lawn-Throne',
    giver: 'dust-overlook',
    prereq: 'ch5-even-cut-p2',
    chapter: 5,
    rewardAcorns: 500,
    radioBulletin: P3,
    // Day, on the deck: the throne rises at its far end and the PA comes apart.
    cutscene: { kind: 'script', script: 'even-cut-p3-intro' },
    // Day, on the road: the Guard in an even row on the kerb, the throne's lamp lit.
    outro: { kind: 'script', script: 'even-cut-p3-outro' },
    objectives: [
      {
        kind: 'boss-combine',
        phase: 'guards',
        text: 'Fight Vesper\'s Porcelain Guard across the deck to the Gilded Lawn-Throne',
        startZ: -240,
        endZ: -120,
        hint: 'The Grand Combine on the meridian (x = 0)',
      },
    ],
    doneText: 'The Porcelain Guard is down, all three whole, sitting in a row. The throne\'s lamp is lit: the intake is open.',
  },
  {
    id: FINAL,
    title: 'The Even Cut',
    giver: 'dust-overlook',
    prereq: P3,
    chapter: 5,
    rewardAcorns: 2500,
    achievement: 'gta-even-cut',
    radioBulletin: FINAL,
    // E23 L103: the last of the HOA on the road may notice (1 hat); nobody comes for the player at the throne.
    hoaSteps: { 0: { cap: 1 }, 1: { cap: 1 }, 2: 'off' },
    // Day, in the street ahead of the Combine: the Stone, the cigar box, the plan.
    cutscene: { kind: 'script', script: 'even-cut-intro' },
    // Dusk: Clara on the throne's step, then the epilogue round Turfton.
    outro: { kind: 'script', script: 'even-cut-outro' },
    // The jam (sincere, no gag) as the crack starts; the hat coming off as the choice starts.
    beats: { 1: 'even-cut-jam', 2: 'even-cut-hat' },
    objectives: [
      {
        kind: 'boss-combine',
        phase: 'jam',
        text: 'Hold the Stopping Stone in the Grand Combine\'s intake',
        startZ: -120,
        endZ: 60,
        hint: 'The Combine\'s front intake, on the meridian (x = 0)',
      },
      {
        kind: 'crack',
        text: 'Knock the top hat off Vesper "The Glazier" Thorne at his throne. Stop him; do not shatter him',
        targets: [
          { id: 'vesper-boss', name: 'Vesper "The Glazier" Thorne', near: [0, 0], hint: 'The Lawn-Throne, at the downtown crossing', look: VESPER_LOOK },
        ],
      },
      {
        kind: 'choice',
        text: 'Decide the fate of the Golden Acorn at the jammed Combine',
        optionA: {
          label: 'The Unmowed Monument',
          at: [-12, 0],
          achievement: 'gta-hat-comes-off',
          endingText: 'Ending A — The Unmowed Monument: With Elder Bracken and Councilwoman Juniper Vance, wild clover reclaims downtown\'s scar.',
        },
        optionB: {
          label: 'Turfton Rewired',
          at: [12, 0],
          achievement: 'gta-hat-comes-off',
          endingText: 'Ending B — Turfton Rewired: With Tansy and the Carburettors, the Golden Acorn powers Turfton\'s neon grid and midnight races.',
        },
      },
    ],
    doneText: 'THE EVEN CUT — Clara sits with Vesper. Side-Valve reopens with forty-eight wrenches, Diggs is off duty at The Gnomecino, Mulch adds a 3rd red coat, Granny brings pie. Phone buzzes — Club Gnome: "Heard you\'re good with heavy machinery. Need a gnome for a bowling alley."',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    [P3]: {
      0: brief(
        ['pip', 'You landed on a moving building! On the deck! I watched the whole thing!'],
        ['tansy', 'Throne\'s at the far end, past the bridge. Vesper\'s Porcelain Guard is between.'],
        ['tansy', 'Crack all three on the meridian. Five hundred acorns. Mind the blades.'],
      ),
    },
    [FINAL]: {
      0: brief(
        ['tansy', 'Guard\'s down, lamp\'s lit, intake\'s open. It\'s still rolling south down the meridian.'],
        ['bracken', 'Gnorwin\'s Stone was cut for that mouth. Stand in front of it. Hold it true.'],
        ['tansy', 'Then the hat. Then the acorn. Twenty-five hundred, and we\'re done.'],
      ),
      1: call(['clara', 'He is down at the crossing. Stop him. Please... only the hat.']),
      2: call(['juniper', 'The acorn is loose. Bracken wants a monument. Tansy wants a power grid. Your call.']),
    },
  },
  bulletins: {
    [P3]: [
      'Turfton FM news: a fight on the roof of the Grand Combine. Porcelain was involved. Nobody was swept up.',
      'The HOA says the throne is decorative, and asks that nobody sit on it.',
    ],
    [FINAL]: [
      'THE EVEN CUT: the Grand Combine has stopped at the downtown crossing with a stone in its mouth. Vesper Thorne is unhurt, and has no hat.',
      'Turfton\'s skyline is quiet at last: Side-Valve Salvage is sweeping out the bay, and Mayor Mulch is ordering fresh red paint.',
    ],
  },
  plans: {
    [P3]: { suite: 'story', expect: 'pass' },
    [FINAL]: { suite: 'story', variants: ['A', 'B'], expect: 'pass' },
  },
};
