// Story row 65 (docs/design/gnome-theft-auto/story-outline.md): The Countess Relents, act IV, chapter 4. The Even Line runs through
// the Countess's first vine; she has seen the line, and she sends for the player. She trades the key to the Combine's shield grates
// for her first vine taken to safety (R-234: not to Granny's greenhouse but to the Unmown, the one corner no mower goes, where Head
// Ranger Burdock Haybright writes it in the book). The vine is dug out with Chicory at the press-house wall (a held "Dig"), carried
// in a barrow buggy (the flatbed does not exist as a ground vehicle: the outline's own fallback, and a gardener's rig) from
// Brassknock Manor's vineyard up the west road, past the Hat Watch's lookouts, and west on the Unmown Road to the Ranger Station,
// then planted by the hut wall (a held "Plant"). Scenes: cutscene/scenes/story/m65-the-countess-relents.ts (intro, mid, outro).
import { brief, call, type StoryFile } from './kit';

const ID = 'm65-the-countess-relents';

/** The first vine's spot: 3.5 m west of the press-house wall it grows on (country/types.ts VINEYARD.firstVine). */
const VINE: [number, number] = [-1114.8, -94.6];
/** Where the vine goes in: by the Ranger Station's east wall (unmown/station.ts: the hut is at (-1560, -1148)). */
const PLANTING: [number, number] = [-1552.2, -1147.4];

export const STORY: StoryFile = {
  quests: [
    {
      id: ID,
      title: 'The Countess Relents',
      giver: 'wisteria-terrace',
      prereq: 'm64-all-hats',
      chapter: 4,
      rewardAcorns: 500,
      radioBulletin: ID,
      // A gardener's errand: off, except on the drive, where the Hat Watch's lookouts may notice a barrow but never chase it.
      hoa: 'off',
      hoaSteps: { 1: { cap: 1 } },
      cutscene: { kind: 'script', script: 'countess-relents-intro' },
      outro: { kind: 'script', script: 'countess-relents-outro' },
      objectives: [
        {
          kind: 'inspect',
          text: "Dig the Countess's first vine out of the press-house wall with Chicory",
          verb: 'Dig',
          holdSeconds: 4,
          points: [
            {
              at: VINE,
              label: "The first vine, on the press-house wall",
              note: 'Chicory takes the oldest roots out of the earth like a sleeping child. One bunch of grapes. He counts it twice.',
              radius: 3,
            },
          ],
          hint: 'The press-house at the top of the vineyard path, inside the vineyard gate',
        },
        {
          kind: 'steal-deliver',
          text: "Carry the first vine in Chicory's barrow buggy to the Unmown, past the Hat Watch's lookouts",
          vehicleKind: 'barrow-buggy',
          spawnAt: [-1118.5, -88.5, Math.PI],
          dropAt: [-1540, -1124],
          radius: 8,
          hint: 'Vineyard Lane east to the roundabout, the west road north to its end, the Unmown Road west to the lane end',
          heatOnEnter: 1,
          maxDamage: 0.35,
          banter: [
            'Chicory: "Mind the roots. They have opinions about potholes."',
            'Chicory: "Slow past the lookouts. They count whatever moves faster than a snail."',
            'Chicory: "She has never paid for a thing without being told its price. Today she did."',
            'Chicory: "The Unmown road is long. The vine will not mind. It is older than roads."',
          ],
        },
        {
          kind: 'visit',
          text: 'Carry the crate up to the Ranger Station yard and meet the Head Ranger',
          at: [-1546, -1137],
          radius: 5,
          hint: 'The Ranger Station at the end of the Unmown Lane: boots wiped, hats off to the herons',
          scene: 'countess-relents-mid',
        },
        {
          kind: 'inspect',
          text: "Plant the first vine by the Ranger Station's east wall",
          verb: 'Plant',
          holdSeconds: 3,
          points: [
            {
              at: PLANTING,
              label: 'The planting by the hut wall',
              note: 'The earth takes the roots. Nothing mows here. For the first time in its long life, nothing can.',
              prop: 'first-vine-pot',
              radius: 2.5,
            },
          ],
          hint: 'By the east wall of the hut, past the bird feeder',
        },
      ],
      doneText: "The first vine is in the Unmown and in the Head Ranger's book. The Countess has given up the key to the Combine's shield grates, and her price was something she had never paid before.",
    },
  ],
  comms: {
    [ID]: {
      0: brief(
        ['wisteria', 'Previously: at the overlook, one learned what the Even Line is. One has drawn it.'],
        ['wisteria', 'It crosses my first vine, by the press-house. Chicory will dig. You will carry.'],
        ['wisteria', 'North to the Unmown. Five hundred acorns, and a key. One merely observes.'],
      ),
      1: call(['chicory', 'Loaded. Mind the roots. West road north, the Unmown at the end. Slowly.']),
      2: call(['wisteria', 'You have arrived. Chicory carries the key. He is walking. He left at noon.']),
      3: call(
        ['burdock haybright', 'Plant it by the east wall. Hats off to the herons.'],
        ['burdock haybright', 'Noted in the book. It may stay as long as it likes.'],
      ),
    },
  },
  plans: {
    // The sim's inspect solver never leaves the vehicle (the real game puts the player on foot after the mid scene): the
    // Plant step waits for a gnome on foot. Fix: `if (ctx.player.vehicle) ctx.exit()` at the top of solvers/inspect.ts, then flip to 'pass'.
    [ID]: { suite: 'story', expect: 'pass' },
  },
  givers: {
    'wisteria-terrace': {
      id: 'wisteria-terrace',
      name: "The Countess's terrace, Brassknock Manor",
      label: "Answer the Countess's summons",
      x: -1136.5,
      z: 13.6,
      exit: { x: -1136.5, z: 11.4, yaw: 0 },
      room: 'street',
      letter: '!',
    },
  },
  bulletins: {
    [ID]: [
      'Trellisdown reports a barrow buggy leaving the vineyard at walking pace with a crate on board, a head gardener walking behind, and the Countess watching from the terrace with her glasses lowered.',
      'The Unmown Ranger Station has recorded a new entry in its book: one grape vine, of great age, planted by the east wall. The Head Ranger says it may stay as long as it likes.',
    ],
  },
};
