// Story row 45 (docs/design/gnome-theft-auto/story-outline.md): Rootwell Admissions, act III, chapter 3. Bilge's flag is up and
// the next part of the Combine is guidance: Professor Betony Sextant's stolen star survey. A pigeon brings her letter to the
// rail of Long Spoon Pier (the giver `betony-letter`, the Saltwater behind). The player drives east to Rootwell, enrols as a
// mature student at the registrar's desk in Wicket Lodge (the gate lodge), crosses the quad with a cap pulled low while Dean
// Lovage Inkwell lectures his rows of empty chairs with his back turned, finds Betony in the Long Shelf (E05 interior-visit:
// a visit with `interior`) and meets her on its steps at dusk, where she points at the Anthill. Lovage is pompous and only
// mildly menacing; nothing here is a fight. The student badge is said in doneText (no system). The outline's "mid" scene is
// the Dean's lecture; a fourth short scene (`-enrol`) plays the registrar beat, the funny one.
// Scenes: cutscene/scenes/story/m45-rootwell-admissions.ts. Stages: quests/stages/story/s45-rootwell-admissions.ts.
import { CAMPUS_BUILDINGS, ROOTWELL_ROOMS } from '../../campus/types';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm45-rootwell-admissions';

const LONG_SHELF = CAMPUS_BUILDINGS.find((b) => b.id === 'long-shelf')!;
const WICKET = CAMPUS_BUILDINGS.find((b) => b.id === 'wicket-lodge')!;
/** The registrar's forecourt: the drive's north edge in front of the gate lodge's door. */
const REGISTRAR: [number, number] = [WICKET.door.x - 0.4, WICKET.door.z + 3.6];
/** Where the player stands to cross behind the Dean's lecture (west of his lectern, his back to them). */
const QUAD_CROSSING: [number, number] = [1093, -229];

const QUEST: QuestDef = {
  id: ID,
  title: 'Rootwell Admissions',
  giver: 'betony-letter',
  prereq: 'm44-the-bathtub-queen',
  chapter: 3,
  rewardAcorns: 250,
  radioBulletin: ID,
  // A form, a lecture and a library: nobody from the Hat Watch has a reason to be at Rootwell.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm45-rootwell-admissions-intro' },
  outro: { kind: 'script', script: 'm45-rootwell-admissions-outro' },
  objectives: [
    {
      kind: 'visit',
      text: "Drive east along Route East to Rootwell University and enrol at the registrar's desk in the gate lodge",
      at: REGISTRAR,
      radius: 5,
      hint: 'Wicket Lodge, by the main gate of Rootwell University',
      scene: 'm45-rootwell-admissions-enrol',
    },
    {
      kind: 'visit',
      text: 'Cross the quad with your cap down: the Dean is on his rounds',
      at: QUAD_CROSSING,
      radius: 5,
      hint: "The quad, west of the Dean's lodge",
      scene: 'm45-rootwell-admissions-mid',
    },
    {
      kind: 'visit',
      text: 'Find Professor Sextant in the Long Shelf library',
      at: [ROOTWELL_ROOMS['uni-library'].librarian[0], ROOTWELL_ROOMS['uni-library'].librarian[1]],
      radius: 3,
      interior: 'uni-library',
      hint: 'The Long Shelf, the library on the north side of the quad',
      toastOnEnter: 'A dusty shelf marked Astronomy. A navy hat with a gold star is bobbing behind it.',
    },
    {
      kind: 'visit',
      text: "Follow Betony out onto the Long Shelf's steps",
      at: [LONG_SHELF.door.x, LONG_SHELF.door.z + 1],
      radius: 3.5,
      hint: 'The steps of the Long Shelf, facing the quad',
    },
  ],
  doneText: 'A Rootwell student badge on your hat: the quad gates open by day. The Anthill is marked on your map, and Betony says the lens is waiting.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['betony', "Previously: Captain Bilge flies your flag. The next part of the Combine is guidance."],
        ['betony', 'It runs on my star survey, which was stolen. Rootwell is far east: follow Route East.'],
        ['betony', 'Enrol at the gate lodge as a mature student. Two hundred fifty acorns, and a badge.'],
      ),
      1: call(['betony', 'The Dean is touring. Keep your cap down, and walk like someone owed a lecture.']),
      2: call(['betony', 'I am in the library, in Astronomy. It is the shelf nobody dusts.']),
      3: call(['betony', 'Come out onto the steps. Walls have ears, and the Dean has walls.']),
    },
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [ID]: [
      "Turfton FM: Rootwell University announces its largest mature-student intake in a generation. It is one. The Dean calls the figure 'a trend'.",
      "Rootwell's quad reports a well-attended open-air lecture, if chairs count. The Dean says chairs count, and has asked that the pigeon in the front row stop taking notes.",
    ],
  },
  givers: {
    'betony-letter': {
      id: 'betony-letter',
      name: 'Long Spoon Pier, the rail',
      label: "Read Betony's letter",
      x: 300,
      z: 1175,
      exit: { x: 300, z: 1178, yaw: 0 },
      room: 'street',
      letter: '!',
    },
  },
};
