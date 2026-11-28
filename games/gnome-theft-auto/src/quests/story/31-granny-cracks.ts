// Story row 31 "Granny Cracks" (docs/design/gnome-theft-auto/story-outline.md): HOA bailiffs chipped Granny at a foreclosure
// and two are still at her farmhouse. The player cracks them, picks Granny up gently (the damage limit is the meter) and
// drives her to the Glaze Clinic, where Squeaky-Clean Midge glues her and Granny, scared for the first time, tells the
// player about her late husband's acorn silo. Sincere: no gag on the outro; the silo is told, never located.
// Scenes: cutscene/scenes/story/m31-granny-cracks.ts.
//
// Bramble's own giver marker ('bramble') is Windfall Croft's west gate, where the later side quest starts; this row's
// whisper is given at the farmhouse's storm cellar, so it adds the giver 'granny-farmhouse' there.
import type { GnomeLook } from '@lawn/gnome';
import { homeDoor } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

/** HOA bailiffs: the black hat and beige coat of every other HOA man, a clipboard's worth of grey in the beard. */
const BAILIFF_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b, beard: 0x6b6b6b };
const BAILIFF_LOOK_B: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b, beard: 0x4a4a4a, glasses: true };

/** The Glaze Clinic's forecourt, out front of the glass doors (the hospital block itself is a building). */
const CLINIC_DOORS: [number, number] = [10, 30];

const GRANNY_CRACKS: QuestDef = {
  id: 'm31-granny-cracks',
  title: 'Granny Cracks',
  giver: 'granny-farmhouse',
  prereq: 'm30-cams-big-night',
  chapter: 2,
  rewardAcorns: 350,
  radioBulletin: 'm31-granny-cracks',
  cutscene: { kind: 'script', script: 'm31-granny-cracks-intro' },
  outro: { kind: 'script', script: 'm31-granny-cracks-outro' },
  achievement: 'gta-gentle-hands',
  // The ride is the gentle part: the Hat Watch is off for the whole run, the bailiffs are the only crime in it.
  hoa: 'off',
  objectives: [
    {
      kind: 'crack',
      text: 'Crack the two HOA bailiffs still at the farmhouse',
      targets: [
        { id: 'granny-bailiff-1', name: 'HOA Bailiff Tulley', near: [-47.6, 333.8], hint: "Granny's farmhouse", look: BAILIFF_LOOK },
        { id: 'granny-bailiff-2', name: 'HOA Bailiff Gripe', near: [-43.4, 334.8], hint: "Granny's farmhouse", look: BAILIFF_LOOK_B },
      ],
    },
    {
      kind: 'passenger',
      text: 'Pick Granny up gently and drive her to the Glaze Clinic',
      who: 'granny',
      name: 'Granny',
      pickup: homeDoor('granny'),
      dropAt: CLINIC_DOORS,
      radius: 12,
      hint: "Granny, at the farmhouse",
      vehicle: { kind: 'ride-on', at: [-60, 340, Math.PI / 2] },
      // The damage limit is the meter: the quest's achievement is the ride with no bump at all.
      maxDamage: 0.15,
      banter: [
        'Granny: Slowly, sugar. The crust is not set.',
        'Granny: Is that a pothole? It feels like a pothole.',
        'Granny: I have never been driven. I find I do not mind.',
      ],
      onBoard: 'Granny settles in with her pie tin held in both hands, and her shotgun left on the porch.',
      onDrop: 'Granny stands very straight at the clinic door and does not go in yet.',
    },
    {
      kind: 'visit',
      text: 'Walk Granny in to Midge',
      at: CLINIC_DOORS,
      radius: 12,
      hint: 'The Glaze Clinic doors',
      scene: 'm31-granny-cracks-mid',
    },
  ],
  doneText: 'Granny is glued, quiet, and holding a dented pie tin. Bramble says the farmhouse key is yours to keep tonight.',
};

export const STORY: StoryFile = {
  quests: [GRANNY_CRACKS],
  comms: {
    'm31-granny-cracks': {
      0: brief(
        ['bramble', "Don't look up. Just listen. Bailiffs came at dawn. They cracked Granny."],
        ['bramble', 'Two are still at her farmhouse. Crack them. Then fetch her, gently.'],
        ['bramble', 'Three hundred fifty acorns. Granny would say pie.'],
      ),
      1: call(['midge', 'Bring her this way! Keep her still! Smooth roads! A hundred forty!']),
      2: call(['granny', 'Walk me in, sugar. Tell Midge I am not frightened. I am sensible.']),
    },
  },
  givers: {
    'granny-farmhouse': {
      id: 'granny-farmhouse',
      name: "Granny's farmhouse",
      label: 'Talk to Farmer Bramble',
      x: -56,
      z: 347,
      exit: { x: -54, z: 350, yaw: -Math.PI / 2 },
      room: 'street',
      letter: '!',
    },
  },
  plans: { 'm31-granny-cracks': { suite: 'story', expect: 'pass' } },
  bulletins: {
    'm31-granny-cracks': [
      'HOA Foreclosure Services confirms two bailiffs are on leave after a Cloverfield visit. Both are expected to return with smaller clipboards.',
      'The Glaze Clinic reports a busy dusk and an intern who has not blinked since Tuesday. A baker was treated and sent home with her pie tin.',
    ],
  },
};
