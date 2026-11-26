// Story row 51 (docs/design/gnome-theft-auto/story-outline.md): The Flock Stands, act III, chapter 3. The gentle laugh before the
// act's turn. In #25 Mother Saxifrage Wader foretold the Even Cut; now the Flock will stand in the Grand Combine's path at
// Hedgeworth, but not with the Standing Lady in it. The player ties the Lady onto a flatbed (an `inspect` at her mound), drives her
// slowly, behind a lawn roller (the slowest ground ride in the game, top speed 7), across the loch road to Thrift Hosepipe's shed in
// Hedgeworth while, in the scenes, the Flock follow on one leg; then stands with them outside the shed, where Saxifrage gives the
// date of the Combine's test: the night of the backers' gala at Hedgeworth (the longest day is the Even Cut's, named by Vesper in row 52). The Flock follow only in the scenes (the slow drive is the roller and a low
// `maxDamage`, never a timer). The Flock allied, the Lady kept at Hedgeworth and the "test date" journal item are the lead's
// (storyMarks.ts, worldChanges).
// Scenes: cutscene/scenes/story/m51-the-flock-stands.ts. Stages: quests/stages/story/s51-the-flock-stands.ts.
import { SHED } from '../../golf/types';
import { WADERS_REST } from '../../societies/config';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm51-the-flock-stands';

/** The mound's foot on the camp side, where the flatbed backs under the Lady, and where the roller waits, nose to the east gate. */
const FLATBED: [number, number] = [WADERS_REST.lady.x + 8.4, WADERS_REST.lady.z + 6.8];
const KNEE: [number, number] = [WADERS_REST.lady.x + 8.6, WADERS_REST.lady.z - 1.6];
const ROLLER: [number, number, number] = [WADERS_REST.lady.x + 15.6, WADERS_REST.lady.z + 8, Math.PI / 2];
/** Where the flatbed stops: beside the shed's west door, north of Thrift's watering spot. */
const DROP: [number, number] = [SHED.door.x - 6.5, SHED.door.z - 7];
/** The end of the Flock's row, a few paces from the flatbed: the player stands here to hear the date. */
const ROW_END: [number, number] = [SHED.door.x - 14.5, SHED.door.z + 6];

const QUEST: QuestDef = {
  id: ID,
  title: 'The Flock Stands',
  giver: 'saxifrage',
  prereq: 'm50-trellisdown-tasting',
  chapter: 3,
  rewardAcorns: 400,
  radioBulletin: ID,
  // A procession on one leg: nothing for the Hat Watch to enforce.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm51-the-flock-stands-intro' },
  outro: { kind: 'script', script: 'm51-the-flock-stands-outro' },
  objectives: [
    {
      kind: 'inspect',
      text: 'Back the flatbed under the Standing Lady and tie her down at the crack in her knee',
      verb: 'Tie',
      holdSeconds: 2,
      hint: "The Standing Lady's mound, Wader's Rest",
      points: [
        {
          at: FLATBED,
          label: 'The flatbed, under the Lady',
          prop: 'flatbed-trailer',
          note: 'The Flock lean as one. The Lady rises an inch, and nobody says anything.',
          radius: 3.5,
        },
        {
          at: KNEE,
          label: "The Lady's knee, at the crack",
          note: "Saxifrage: 'Not too tight. She has stood a long time.' The rope is tied. So it is stood.",
          radius: 3.5,
        },
      ],
    },
    {
      kind: 'steal-deliver',
      text: "Tow the Standing Lady slowly to Thrift's shed in Hedgeworth: the roller waits by the mound",
      vehicleKind: 'lawn-roller',
      spawnAt: ROLLER,
      dropAt: DROP,
      radius: 7,
      maxDamage: 0.25,
      hint: "Thrift's shed, Hedgeworth Links (in through the Kicked Board)",
      banter: [
        'Saxifrage (radio): "Slowly, friend. The Flock follow on one leg, and one leg is not fast."',
        'Saxifrage (radio): "Every bump is a thought. She has had a great many thoughts this morning."',
        'Saxifrage (radio): "The board is loose at the east fence. Take her through gently. She is not a board."',
      ],
    },
    {
      kind: 'visit',
      text: 'Stand with the Flock outside the shed and hear the date',
      at: ROW_END,
      radius: 4,
      hint: "Beside Thrift's shed, Hedgeworth Links",
    },
  ],
  doneText: 'The Flock stand in a row outside a tin shed, on one leg, in the same order. The Standing Lady is safe at Hedgeworth, and the test date is in your journal.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['saxifrage', 'Previously, I foretold the Even Cut. It comes. The Flock will stand in its path.'],
        ['saxifrage', "Not with the Lady in it. Take her to Thrift's shed, in Hedgeworth."],
        ['saxifrage', 'Slowly, friend. Four hundred acorns, and a date. So it is stood.'],
      ),
      1: call(
        ['saxifrage', 'Slowly. The Flock follow on one leg, and the Lady goes no faster than they do.'],
        ['saxifrage', "The way in is the loose board, in the east fence. Gently, friend."],
      ),
      2: call(['saxifrage', 'They must all reach the shed together. Come and stand, and I will say the date.']),
    },
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [ID]: [
      "Turfton FM: a procession of unusual slowness was seen leaving Wader's Rest this morning, led by a lawn roller, a very large pink bird and a great many gnomes standing on one leg. Traffic is moving faster than it was.",
      'Hedgeworth Links reports a flatbed on the ninth fairway and a tall pink visitor beside the groundskeeper\'s shed. The groundskeeper says she is "no trouble, as long as the grass has met her".',
    ],
  },
};

