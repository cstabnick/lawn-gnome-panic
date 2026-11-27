// Story row 58 (docs/design/gnome-theft-auto/story-outline.md): The Reeve's Barn. Previously: the crew stole the Whirligig from
// Fort Sandpit and Commander Diggs is hunting it; it cannot stay at the overlook. Pip calls Pebblewick, the one town on the Flats
// that owes nobody anything, and Reeve Yarrow Potsherd offers his hay barn on a condition: the HOA cuts the town's water at sunset
// unless the pump runs, and the pump needs an impeller. Wally keeps a spare in Hangar Two. The player flies it, in the Whirligig,
// to Pebblewick's tin water tower before the cut-off, then sets the Whirligig down in the hay and Yarrow pulls a tarp over the
// rotor; the town bell rings once, for the water.
// - intro: the visit to Yarrow plays it on arrival (day, the square, Yarrow sweeping; the HOA letter). Not a quest `cutscene`: the
//   player takes the job by Pip's call at the overlook and drives out to meet him, so the scene plays where it happens.
// - 0 visit Yarrow on the market square; 1 inspect (Take) Wally's spare impeller at Hangar Two's apron; 2 steal-deliver: fly the
//   Whirligig (parked on the apron by Pip) over the tin water tower, damage-limited; 3 visit: set her down at the barn. The
//   cut-off clock is in the text and the comms, not in code (steal-deliver has no timer).
// - outro: the Whirligig in the hay, the tarp, a hen, and the bell rung once (dusk). No gag after the bell.
// The barn (a stage set, built into the world) stands at (706, 34), doors on +z; the yard in front of it (706, 47) is where she lands.
// Scenes: cutscene/scenes/story/m58-the-reeves-barn.ts. Stages: quests/stages/story/s58-the-reeves-barn.ts.
import { AIRFIELD } from '../../config';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm58-the-reeves-barn';

/** The market square (outskirts/town.ts TOWN.blip is (674, 100)): where Yarrow sweeps at noon. */
const SQUARE: [number, number] = [677, 103];
/** In front of Hangar Two's roller door (lockup/config.ts ESTATES.hangar (480, -64), door on -z): the part sits on Wally's bench. */
const HANGAR_BENCH: [number, number] = [480, -77];
/** Pip parked the Whirligig on the apron beside the hangar, nose to the runway. */
const WHIRLIGIG_PARKED: [number, number, number] = [494, -84, AIRFIELD.yaw];
/** The tin water tower over the well (outskirts/town.ts: (720, 176), tank top about 16 m). */
const TOWER: [number, number] = [720, 176];
/** The yard in front of the barn doors. */
const BARN_YARD: [number, number] = [706, 49];

const QUEST: QuestDef = {
  id: ID,
  title: "The Reeve's Barn",
  giver: 'dust-overlook',
  prereq: 'ch4-sandpit-drop',
  chapter: 4,
  rewardAcorns: 350,
  radioBulletin: ID,
  // A town errand under a cut-off notice: nobody in the Hat Watch comes to Pebblewick to fine a pump.
  hoa: 'off',
  objectives: [
    {
      kind: 'visit',
      text: 'Drive east along Route East to Pebblewick and find Reeve Yarrow on the market square',
      at: SQUARE,
      radius: 9,
      hint: 'Pebblewick market square, at the end of Route East',
      scene: 'm58-the-reeves-barn-intro',
    },
    {
      kind: 'inspect',
      text: "Take Wally's spare spray-pump impeller from the bench at Hangar Two",
      verb: 'Take',
      holdSeconds: 1.5,
      hint: 'Hangar Two, Desert Airfield, off the airfield spur',
      points: [
        {
          at: HANGAR_BENCH,
          label: "The spare impeller on Wally's bench",
          prop: 'pump-impeller',
          radius: 3.5,
          note: 'A brass wheel on a short shaft, a paper tag tied on: FOR THE SPRAY. Nobody has ever seen it spray.',
        },
      ],
    },
    {
      kind: 'steal-deliver',
      text: 'Fly the impeller in the Whirligig to the tin water tower before the sunset cut-off',
      vehicleKind: 'whirligig',
      spawnAt: WHIRLIGIG_PARKED,
      dropAt: TOWER,
      radius: 18,
      hint: "Pebblewick's tin water tower",
      maxDamage: 0.6,
      banter: [
        'Pip: low over the Hat Watch ridge, then straight at the tower. You cannot miss a tower.',
        'Yarrow: the sun is going down. The Association is punctual, and it is the only thing it is.',
      ],
    },
    {
      kind: 'visit',
      text: "Set the Whirligig down in the hay in front of the Reeve's barn",
      at: BARN_YARD,
      radius: 9,
      hint: "The Reeve's barn, north-east of the market square",
    },
  ],
  doneText: 'The pump is humming, the bell has rung, and the Whirligig sleeps under a tarp in Pebblewick. Nothing was ever in the barn.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['pip', 'Previously: we stole the Whirligig, and Diggs is hunting it. She cannot stay at the overlook.'],
        ['pip', 'Pebblewick has a barn, and a reeve who owes nobody anything. Take Route East.'],
        ['pip', "Reeve Yarrow wants a favour first. Three hundred fifty acorns, and a hiding place."],
      ),
      1: call(['pip', 'Wally keeps a spare impeller at Hangar Two. I parked the Whirligig on the apron.']),
      2: call(
        ['yarrow', 'The Association cuts the water at sunset unless the pump runs. In writing.'],
        ['pip', 'Fly her low. Rotor first, tower second, pump third. Easy.'],
      ),
      3: call(['yarrow', 'The pump is humming. The barn is yours, with conditions. Come round to the yard.']),
    },
  },
  bulletins: {
    [ID]: [
      "Turfton FM: Pebblewick's pump is humming again. The Association says the cut-off was never in doubt, and has withdrawn its letter.",
      'Reeve Potsherd confirms that Pebblewick has a bell, a bus and a reeve, and that the hay barn is empty and always has been.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
