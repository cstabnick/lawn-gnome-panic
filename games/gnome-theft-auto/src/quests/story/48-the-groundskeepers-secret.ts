// Story row 48 (docs/design/gnome-theft-auto/story-outline.md): The Groundskeeper's Secret. Thrift has hidden a mole family
// under the ninth green for a year and Basil Divot, who has hated moles since a final, is coming with a trap-line. The player
// drives the family in a golf cart from the ninth green to Thrift's shed, leads Basil's cart down the trap-lined cart path and
// back, and then shows him the two things that clear the mole of the final: the sprinkler head and the ball. A mole moved
// Basil's ball because the sprinkler was about to drown it. Basil kneels on the ninth, puts a hand on Nubbin's back (sincere,
// no gag on top) and points down to Loamdeep. Nubbin is the mole; the family is "the mole family" in the passenger step.
// Scenes: cutscene/scenes/story/m48-the-groundskeepers-secret.ts. Stages: quests/stages/story/s48-the-groundskeepers-secret.ts.
import { HOLES, SHED } from '../../golf/types';
import type { CheckpointDef, QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm48-the-groundskeepers-secret';

const NINTH = HOLES[3].green;
/** Where the mole family waits: the south-west edge of the ninth green, a few strides from the bunker. */
const FAMILY: [number, number] = [NINTH.x - 8, NINTH.z + 7];
/** Thrift's shed door (west face), where the family is let out. */
const SHED_DOOR: [number, number] = [SHED.door.x, SHED.door.z + 2];

/** Basil's trap-line: the cart path east of the shed, south along it, back up the ninth fairway to the green. */
const TRAP_LINE: CheckpointDef[] = [
  { at: [-1026, 606], radius: 6, label: 'The cart path: a mole trap, red flag up' },
  { at: [-1028, 654], radius: 6, label: 'The cart path: a second trap, a third beside it' },
  { at: [-1046, 698], radius: 6, label: 'The bend: a trap hidden in the clippings' },
  { at: [-1100, 700], radius: 7, label: 'The ninth fairway: the traps run out' },
  { at: [-1068, 652], radius: 6, label: 'Back at the ninth green, ahead of his cart' },
];

const QUEST: QuestDef = {
  id: ID,
  title: "The Groundskeeper's Secret",
  giver: 'thrift',
  prereq: 'm47-hedgeworth-links',
  chapter: 3,
  rewardAcorns: 350,
  radioBulletin: ID,
  // Moles, a pro with a grudge and a groundskeeper: nobody in the Hat Watch has ever looked under a green.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm48-the-groundskeepers-secret-intro' },
  outro: { kind: 'script', script: 'm48-the-groundskeepers-secret-outro' },
  objectives: [
    {
      kind: 'passenger',
      text: "Drive the mole family from the ninth green to Thrift's shed, gently",
      who: 'nubbin',
      name: 'the mole family',
      pickup: FAMILY,
      dropAt: SHED_DOOR,
      radius: 6,
      maxDamage: 0.35,
      vehicle: { kind: 'golf-cart', at: [FAMILY[0] + 3.5, FAMILY[1] - 3, -Math.PI / 2] },
      hint: "The ninth green, then Thrift's shed. A golf cart is parked by the green.",
      banter: [
        'Nubbin: "If you please, we are very small and the cart is very loud."',
        'The smallest pup: "Again! Go over the bump again!"',
        'Nubbin: "Thrift said the ride was gentle. He did not say who for."',
      ],
      onBoard: 'Nubbin: "Mind the bumps, if you please. There are eleven of us and one satchel."',
      onDrop: 'Thrift, from the shed door: "In, in. Mind the watering can. It is my best one."',
    },
    {
      kind: 'checkpoints',
      text: "Lead Basil's cart down his own trap-line and back to the ninth green before he finds the shed",
      points: TRAP_LINE,
      maxDamage: 0.4,
      seconds: 100,
      hint: "The cart path round the east side of the course: take the golf cart (or run), keep ahead of Basil, mind the red flags",
    },
    {
      kind: 'inspect',
      text: "Show Basil what moved his ball: the sprinkler head, then the ball itself",
      verb: 'Show',
      ordered: true,
      hint: 'The ninth green, by the cup',
      scene: 'm48-the-groundskeepers-secret-mid',
      points: [
        {
          at: [-1063.5, 639.4],
          radius: 2.2,
          label: 'The sprinkler head, a stride from the cup',
          note: 'A pop-up sprinkler, set a stride from the cup. Anything lying here at seven o\'clock gets a soaking.',
          prop: 'sprinkler-head',
        },
        {
          at: [-1062.4, 641.4],
          radius: 2.2,
          label: "Basil's ball, on the lip of the cup",
          note: 'The ball Basil lost the final by: scuffed by tiny teeth, rolled, every time, one hand out of the spray.',
          prop: 'golf-ball',
        },
      ],
    },
  ],
  doneText: 'Basil knelt on the ninth green and a mole forgave him. The family is safe in the shed, and Loamdeep is under your feet.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['thrift', 'Previously: you saw a molehill, and did not ask. There is a family under my ninth.'],
        ['thrift', 'Basil is coming with a trap-line. Drive them to my shed, gently.'],
        ['thrift', 'Three hundred and fifty acorns. And do not sneeze near the grass.'],
      ),
      1: call(['thrift', 'He lays traps along the cart path. Run it ahead of him, mind the flags.']),
      2: call(
        ['basil', 'Where are the pests, Thrift? I can smell fur. As they say.'],
        ['thrift', 'Show him the sprinkler, then the ball. It was never the mole.'],
      ),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: Hedgeworth Links reports that its ninth green has been declared "closed for a ball-related reappraisal". The club pro was seen kneeling on it after dark.',
      'A groundskeeper has asked the public to stop calling a certain mole a thief. "He has an excellent character," the groundskeeper says, "and a very small satchel."',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
