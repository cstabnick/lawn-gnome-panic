// Story row 60 (docs/design/gnome-theft-auto/story-outline.md): The Moles Dig. Previously: Diggs joined the crew and Vesper's armory
// stayed sealed from Thorne Tower. Old Mother Tumblesoil calls: the Burrowfolk will dig under the wall ("we dig where we are asked")
// and open the armory from below; they need an escort. The outline's new kind `dig` is the E17 fallback: a chase-follow of Nubbin
// (on his post bike: chase-follow has only vehicle leaders) across the sand from a dune south of the fort to the dig mouth
// outside the south wall, a hold-the-button inspect ('Dig') at three points of the shaft head, a survive-derby holding the mouth
// against HOA enforcers while the moles work, then the armory (374, 10), where the floor has opened from below.
// - intro (dusk): the first visit plays it on arrival: Nubbin and two diggers on the dune, Diggs staring. Nubbin plants a tiny
//   pickaxe like a flag; the moles bow; Diggs: "A bow is not a salute." Nubbin: "I shall practise, sir."
// - mid (night): played as the armory step starts (a beat): the hole opens beneath the sealed armory floor, a white scrap on a pickaxe.
// - outro (night): Diggs salutes the first mole out of the floor. The mole is the only one in the fort who salutes correctly. That
//   salute is Diggs's turn from hardliner to ally. Nubbin and the diggers tunnel home (no drop-off).
// The moles are not hit by anything in this quest (the achievement is Salute to a Mole, kept if no mole is cracked); the Hat Watch is
// capped at one hat on the escort ("keep them clear") and on the derby.
// Scenes: cutscene/scenes/story/m60-the-moles-dig.ts. Stages: quests/stages/story/s60-the-moles-dig.ts.
import { CAST } from '../../cutscene/cast';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm60-the-moles-dig';

/** The dune south of the fort, below the gate road: where Nubbin's diggers wait (stage m60-dune-dusk). */
const DUNE: [number, number] = [404, 107];
/** The escort's line: off the dune, north-west up the gentle slope, to the dig mouth outside the south wall (the wall is z = 34). */
const ROUTE: [number, number][] = [[408, 112], [392, 80], [392, 56]];
/** The dig mouth, 12 m south of the wall, and the three points of the shaft head. The tunnel runs north under the wall to the armory. */
const MOUTH: [number, number] = [392, 46];
/** Fort Sandpit's armory inside the gate (the same spot as row 59's last visit). */
const ARMORY: [number, number] = [374, 10];

const QUEST: QuestDef = {
  id: ID,
  title: 'The Moles Dig',
  giver: 'dust-overlook',
  prereq: 'ch4-spade-truce',
  chapter: 4,
  rewardAcorns: 600,
  radioBulletin: ID,
  achievement: 'gta-salute-to-a-mole',
  // Gentle until the derby: no Hat Watch for the meeting, one hat at most while the moles are on the sand and at the mouth.
  hoa: 'off',
  hoaSteps: { 1: { cap: 1 }, 3: { cap: 1 } },
  outro: { kind: 'script', script: 'm60-the-moles-dig-outro' },
  beats: { 4: 'm60-the-moles-dig-mid' },
  objectives: [
    {
      kind: 'visit',
      text: "Go to the dune south of Fort Sandpit and meet Nubbin's diggers",
      at: DUNE,
      radius: 9,
      hint: 'The dune south of the fort, below the gate road',
      scene: 'm60-the-moles-dig-intro',
    },
    {
      kind: 'chase-follow',
      text: "Escort Nubbin and the diggers across the sand to the dig point, clear of the Hat Watch's ridge",
      leaderName: 'Nubbin',
      leaderKind: 'push-bike',
      leaderLook: CAST.nubbin.look,
      waypoints: ROUTE,
      speed: 5,
      maxDist: 28,
      hint: 'Nubbin, on the post bike',
    },
    {
      kind: 'inspect',
      text: 'Dig with the moles: hold at each point of the shaft head',
      verb: 'Dig',
      holdSeconds: 2.5,
      ordered: true,
      hint: 'The dig mouth, outside the fort wall',
      points: [
        {
          at: [388.6, 49.2],
          label: 'Shaft head 1 of 3: the line',
          prop: 'mole-hill',
          radius: 3,
          note: "The sand takes a spade and gives back a squeak. Nubbin has marked the line with a pebble.",
        },
        {
          at: [392.0, 46.4],
          label: 'Shaft head 2 of 3: under the wall',
          prop: 'mole-hill',
          radius: 3,
          note: 'Cool sand, then something old and hard: the wall footing. The diggers go under it like a thought.',
        },
        {
          at: [395.4, 49.2],
          label: 'Shaft head 3 of 3: the last prop',
          prop: 'mole-hill',
          radius: 3,
          note: 'A prop of root, wedged tight. Forty paces north, a floor is waiting to become a ceiling.',
        },
      ],
    },
    {
      kind: 'survive-derby',
      text: 'Hold the tunnel mouth against the HOA enforcers while the moles dig',
      arena: MOUTH,
      radius: 13,
      seconds: 40,
      attackers: 4,
      hint: 'The tunnel mouth, south of the fort wall',
    },
    {
      kind: 'visit',
      text: 'Go through the gate to the armory: the floor is open from below',
      at: ARMORY,
      radius: 8,
      hint: 'Fort Sandpit armory, inside the gate',
    },
  ],
  doneText: 'The armory is open from below, and the Spade Guard\'s tool wall with it. Commander Diggs saluted a mole.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['tumblesoil', "Previously, dear one: Diggs joined us, and Vesper's armory stayed sealed."],
        ['tumblesoil', 'My diggers will go under the wall. We dig where we are asked.'],
        ['tumblesoil', 'Come to the dune south of the fort. They need an escort. Six hundred acorns.'],
      ),
      1: call(['nubbin', 'If you please, keep close. The Hat Watch has a spotter on the ridge.']),
      2: call(['nubbin', 'Three more steps and then the sand falls. Hold the shaft head, if you please.']),
      3: call(
        ['diggs', 'Enforcers at the tunnel mouth. Hold it. Nobody enters that shaft.'],
        ['diggs', 'Forty seconds. Effective immediately.'],
      ),
      4: call(['nubbin', 'The floor is open. Come up, if you please. Mind the keypad.']),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: Fort Sandpit reports unscheduled aeration beneath its armory. The Spade Guard calls it excellent drainage.',
      'Experts agree a mole may now be saluted. The Association says it has never heard of a mole.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
