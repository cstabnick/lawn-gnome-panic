// Story row 9 (docs/design/gnome-theft-auto/story-outline.md): Where Asphalt Sleeps. A gentle job: John Bodega's cat has gone
// with her bottlecap. Three sightings near the shop, the Gutter Bowls (Fennel has been feeding her), one skate line for the cap
// (E19's `asphalt-line`, written for this row), and the cat carried home above the shop.
// Scenes: cutscene/scenes/story/m09-where-asphalt-sleeps.ts. Stages: quests/stages/story/s09-where-asphalt-sleeps.ts.
import { homeDoor } from '../../homes/data';
import { SKATE_ORIGIN, SKATE_LINES } from '../../skate/types';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm09-where-asphalt-sleeps';

/** The first gate of Asphalt's Way Down in world metres (the top of the stairs), for the blip. */
const ASPHALT_LINE = SKATE_LINES.find((l) => l.id === 'asphalt-line')!;
const FIRST_GATE: [number, number] = [SKATE_ORIGIN.x + ASPHALT_LINE.gates[0].u, SKATE_ORIGIN.z + ASPHALT_LINE.gates[0].v];

const QUEST: QuestDef = {
  id: ID,
  title: 'Where Asphalt Sleeps',
  // John Bodega's corner: the shop-front giver that already stands at Bodega & Sons.
  giver: 'strangers',
  prereq: 'ch1-tax-break-in',
  chapter: 1,
  rewardAcorns: 200,
  radioBulletin: ID,
  hoa: 'off',
  achievement: 'gta-cap-back',
  cutscene: { kind: 'script', script: 'asphalt-intro' },
  outro: { kind: 'script', script: 'asphalt-outro' },
  objectives: [
    {
      kind: 'inspect',
      text: 'Look for Asphalt: the alley, a dumpster lid, the Bodega roofline',
      verb: 'Look',
      ordered: true,
      hint: 'Three sightings behind Bodega & Sons, in order',
      points: [
        { at: [-85, 71], label: 'Sighting 1 of 3: the alley', note: 'Small paw prints in the lettuce dew, crossing the alley. Her stride, not a pigeon\'s.' },
        { at: [-93, 75], label: 'Sighting 2 of 3: the dumpster lid', note: 'A cat-shaped dent in the lid, a fish bone, and a bottlecap-sized scrape going east.' },
        { at: [-90, 79], label: 'Sighting 3 of 3: the rooftop edge', note: 'Thirteen metres up, a bottlecap catches the sun and rolls out of sight. East.' },
      ],
    },
    {
      kind: 'visit',
      text: 'Follow the paw trail to the Gutter Bowls',
      at: [-45, 95],
      radius: 9,
      hint: "The Gutter Bowls, Founders' Green",
      scene: 'asphalt-mid',
    },
    {
      kind: 'probe',
      text: "Skate Asphalt's Way Down for the cap",
      probe: 'skate-line-asphalt-line',
      absolute: true,
      count: 1,
      at: FIRST_GATE,
      hint: 'Take a board from the rack by the north gate, then roll the chalk: stairs, ledge, flat rail',
    },
    {
      kind: 'visit',
      text: 'Carry Asphalt home to the flat above Bodega & Sons',
      at: homeDoor('bodega'),
      radius: 6,
      hint: 'Bodega & Sons, Old Brick Quarter',
    },
  ],
  doneText: 'Asphalt is back on the counter and the cap has been batted exactly once. John did not look up.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['bodega', 'Asphalt has gone. So has her bottlecap. Three sightings, none of them mine.'],
        ['bodega', 'Previously: you cracked a lot of hats. This job is gentler.'],
        ['bodega', 'Alley, dumpster lid, my roofline. Look. Two hundred acorns.'],
      ),
      1: call(['pip', 'Paw prints heading east! Past the park rail! She knows where she is going.']),
      2: call(['bodega', 'Fennel rang. He says the cap is on the far lip. Skate it.']),
      3: call(['bodega', 'Bring her home, the flat above the shop. She likes the stairs slowly.']),
    },
  },
  bulletins: {
    [ID]: [
      "Turfton FM: Bodega & Sons reports a quiet day. Asphalt the cat was briefly absent, and the bottlecap has been reunited with its owner, who was unmoved.",
      "The Gutter Bowls report one gnome skating a stairs-ledge-rail line with a sleeping cat in their arms. Fennel Gripwax says it is the best form he has seen.",
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
