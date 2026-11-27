// Story row 61 (docs/design/gnome-theft-auto/story-outline.md): Diggs's Medal. The sincere beat of act IV's dip, played quiet and
// plain after the laughs of the armory. Commander Diggs asks the player to his tin bungalow in Pebblewick (not the fort): on the
// wall are fifteen years of guard rosters and one empty nail. The medal that hung there is in the HOA's lost-property shed by the
// fort gate, logged as lost, which he never did. The player cracks the two clerks (who run), takes the medal from the shed's tag
// rail, brings it home in the clerks' own van, and Diggs sits down for the first time in fifteen years and says why he stayed.
// Previously: the Spade Guard is with the crew and the moles opened the armory (rows 59, 60).
// Scenes: cutscene/scenes/story/m61-diggs-medal.ts. Stages: quests/stages/story/s61-diggs-medal.ts.
// The roster wall (E22 prefab) and the hung medal are scene-only: the E10 bungalow interior has a map wall, not a roster wall.
import type { GnomeLook } from '@lawn/gnome';
import type { GiverDef, QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm61-diggs-medal';

/** The giver stands at the lane in front of Diggs's yard gate (home-06, the E10 yard at x 603..626, z 211..231). */
const GIVER: GiverDef = {
  id: 'diggs-bungalow',
  name: "Commander Diggs's bungalow",
  label: 'Report to Commander Diggs',
  x: 611,
  z: 208.4,
  exit: { x: 611, z: 205.6, yaw: 0 },
  room: 'street',
  letter: 'D',
};

/** The HOA clerks of the lost-property shed: beige hats, a beige shirt, no black. They run when the player comes close. */
const CLERK_LOOK: Partial<GnomeLook> = { hat: 0xd8c8a8, shirt: 0xc9b99b };

const QUEST: QuestDef = {
  id: ID,
  title: "Diggs's Medal",
  giver: 'diggs-bungalow',
  prereq: 'm60-the-moles-dig',
  chapter: 4,
  rewardAcorns: 300,
  radioBulletin: ID,
  // A sincere errand with clerks who run: nobody hunts the player on the way, or back.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'diggs-medal-intro' },
  outro: { kind: 'script', script: 'diggs-medal-outro' },
  beats: { 2: 'diggs-medal-shed' },
  objectives: [
    {
      kind: 'visit',
      text: "Step into Diggs's tin bungalow in Pebblewick",
      at: [1.6, -1.0],
      radius: 1.9,
      interior: 'diggs-bungalow',
      hint: 'The tin bungalow on the south edge of Pebblewick, behind the corrugated fence',
      toastOnEnter: 'Two mugs on the stove, one never used. Diggs does not look up: "A medal hung on my wall. Lost property. I did not lose it."',
    },
    {
      kind: 'crack',
      text: 'Crack the two HOA clerks at the lost-property shed by the fort gate',
      targets: [
        { id: 'lostprop-clerk-1', name: 'Clerk Rubric', near: [399.4, 56], hint: 'The lost-property shed, outside the fort gate', look: CLERK_LOOK },
        { id: 'lostprop-clerk-2', name: 'Clerk Docket', near: [397.8, 62.4], hint: 'The lost-property shed, outside the fort gate', look: CLERK_LOOK },
      ],
    },
    {
      kind: 'steal-deliver',
      text: "Take the clerks' van and bring Diggs's medal home to Pebblewick",
      vehicleKind: 'hoa-van',
      spawnAt: [392, 66, Math.PI],
      dropAt: [615, 203.4],
      radius: 7,
      hint: "Diggs's gate, on the south edge of Pebblewick",
      maxDamage: 0.8,
      banter: [
        'Tag 4471: one medal, tin, unclaimed. The tag is still on the ribbon.',
        'The van smells of rubber stamps and other gnomes\' umbrellas.',
        'Fifteen years in a shed, and not one clerk asked whose it was.',
      ],
    },
    {
      kind: 'visit',
      text: 'Walk the medal up the yard to Diggs at his door',
      at: [615, 213.6],
      radius: 3,
      hint: "Diggs, at his door inside the yard",
    },
  ],
  doneText: 'The medal hangs on its nail. Diggs sat down for the first time in fifteen years, and he stays in Pebblewick this evening: the fort can spare him until morning.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['diggs', 'Previously: the Guard stands with you. The moles opened the armory.'],
        ['diggs', 'Report to my bungalow, south edge of Pebblewick, behind the tin fence.'],
        ['diggs', 'Not the fort. Three hundred acorns, and tea. Effective immediately.'],
      ),
      1: call(
        ['diggs', 'The medal is in HOA lost property, the shed outside the fort gate.'],
        ['diggs', 'Clerks only. No violence if avoidable. They will run.'],
      ),
      2: call(['diggs', 'You have it. Bring it home in their van. Light on the brake.']),
      3: call(
        ['yarrow', 'The Commander is at home. Mind the step at his gate.'],
        ['yarrow', 'He has been at attention since noon. Noted, with concern.'],
      ),
    },
  },
  givers: { 'diggs-bungalow': GIVER },
  bulletins: {
    [ID]: [
      'Turfton FM: Pebblewick reports the Commander of Fort Sandpit was seen at home on a weekday, which the town finds suspicious and rather nice.',
      'The Association lost-property desk by the fort gate reports one tin star claimed after fifteen years. The clerks ask the public to remain calm.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
