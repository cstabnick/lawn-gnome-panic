// Story row 44 (docs/design/gnome-theft-auto/story-outline.md): The Bathtub Queen. Captain Samphire Bilge, mid-tour on the Queen,
// says the barges Driftwood read carry the Combine's spare blades and she will crew with anyone who takes one. The player
// takes the Queen's tender out to a barge, boards from the stern, takes a launch loaded with a blade crate and outruns the
// HOA gunboat (cutscene-only) back to the Queen, which raises the crew's colours at night. The comic payoff after row 43's
// sincere beat. The barge and the gunboat are only shown in the scenes; the crate is a prop in the scenes.
// Scenes: cutscene/scenes/story/m44-the-bathtub-queen.ts. Stages: quests/stages/story/s44-the-bathtub-queen.ts.
import type { GiverDef, QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm44-the-bathtub-queen';

/** The tour board at the foot of Long Spoon Pier (E11 stage `coast-pier`): she gives the job from her ship, the player hears it from here. */
const BOARD_GIVER: GiverDef = {
  id: 'bilge-tour-board',
  name: "Captain Bilge's tour board",
  label: "Join Captain Bilge's tour",
  x: 306,
  z: 1170,
  exit: { x: 306, z: 1174, yaw: Math.PI },
  room: 'street',
  letter: '!',
};

/** Where the barge lies (the third of row 43's three), and the tender and the Queen. All on the Saltwater. */
const TENDER: [number, number, number] = [338, 1232, 0];
const BARGE_STERN: [number, number] = [117, 1452];
const QUEEN_FLANK: [number, number] = [300, 1291];

const QUEST: QuestDef = {
  id: ID,
  title: 'The Bathtub Queen',
  giver: 'bilge-tour-board',
  prereq: 'm43-saltbucket-boardwalk',
  chapter: 3,
  rewardAcorns: 500,
  radioBulletin: ID,
  achievement: 'gta-pirate-for-a-night',
  // The barge is the only place the Association is: the gunboat is the chase (steal-deliver's heat).
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm44-the-bathtub-queen-intro' },
  outro: { kind: 'script', script: 'm44-the-bathtub-queen-outro' },
  objectives: [
    {
      kind: 'checkpoints',
      text: "Take the Queen's tender out across the Saltwater to the barge",
      points: [
        { at: [292, 1300], radius: 9, label: 'Past the Queen, out to sea' },
        { at: [226, 1368], radius: 9, label: 'Beyond the buoy course' },
        { at: [160, 1424], radius: 9, label: "In the barge's wake" },
      ],
      vehicle: { kind: 'gravy-boat', at: TENDER },
      requireVehicle: 'gravy-boat',
      maxDamage: 0.6,
      hint: 'The tender is moored off Long Spoon Pier; the barge sits far out, south-west of the Queen',
    },
    {
      kind: 'visit',
      text: "Come alongside the barge's stern and board her",
      at: BARGE_STERN,
      radius: 11,
      hint: 'The black barge, far out on the Saltwater',
      scene: 'm44-the-bathtub-queen-mid',
    },
    {
      kind: 'steal-deliver',
      text: "Take the barge's launch, blade crate aboard, back to the Bathtub Queen before the gunboat catches you",
      vehicleKind: 'clog-cruiser',
      spawnAt: [BARGE_STERN[0] - 8, BARGE_STERN[1] - 5, -Math.PI / 2],
      dropAt: QUEEN_FLANK,
      radius: 11,
      hint: 'The Bathtub Queen, moored at the end of Long Spoon Pier',
      heatOnEnter: 2,
      maxDamage: 0.7,
      banter: [
        'Driftwood: gunboat on your tail! Straight lines are for lawns.',
        'Driftwood: it has a siren. Do not be flattered.',
      ],
    },
  ],
  doneText: 'One blade crate, one captain, one crew. The Bathtub Queen flies your colours, and the sea is open.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['samphire', "Previously: the barges Driftwood read. They haul the Combine's spare blades."],
        ['samphire', 'Take one crate, matey, and the Queen sails with you. Five hundred acorns.'],
        ['samphire', 'The tender waits off the pier. Mind the gulls; they are unionised.'],
      ),
      1: call(['samphire', 'Board her from the stern. Nobody on a barge ever looks behind.']),
      2: call(
        ['driftwood', 'Gunboat on your tail! Zigzag, friend. The Queen is a bright light.'],
        ['driftwood', 'Nobody follows a pirate into a pier. It is bad manners.'],
      ),
    },
  },
  givers: { 'bilge-tour-board': BOARD_GIVER },
  bulletins: {
    [ID]: [
      'Turfton FM: pirate tours at Saltbucket now run twice daily. The Bathtub Queen says every pirate on board is fully insured.',
      'The Association reports three barges and one fewer crate than yesterday. A statement about the weather has been issued instead.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
