// Story row 37 (m37-snowdrop-slope): Snowdrop Slope. Thermos Theo tells the crew the bend is no longer safe (the plows
// know it) and sends them north-west to Gentian Bootlace's Woolly Sock Lodge. The player drives to the foot of the
// Bootlace Tow, where two HOA salt-plows crest the ridge behind the crew (cutscene only), rents skis and runs the Wool
// Run through its gates to lose them (the outline's ski-run is the E12 `winter-ski-runs` probe), and finishes at the lodge
// door, where Gentian gives the crew a bunk. The lodge as the act's base, save point and wardrobe is said in the outro and
// the doneText only: it is not a system.
// Scenes: cutscene/scenes/story/m37-snowdrop-slope.ts. Stages: quests/stages/story/s37-snowdrop-slope.ts.
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm37-snowdrop-slope';

/** The foot of the Bootlace Tow (winter/types.ts TOW.base), where the rope-tow road ends; the Wool Run starts at the top. */
const TOW_FOOT: [number, number] = [-304, -1022];
const WOOL_RUN_START: [number, number] = [-350, -1255];
/** The lodge door (LODGE faces east): the porch spot by the cocoa hatch. */
const LODGE_DOOR: [number, number] = [-438, -1020];

const QUEST: QuestDef = {
  id: ID,
  title: 'Snowdrop Slope',
  giver: 'theo-bend',
  prereq: 'ch3-kiln-resin-ice',
  chapter: 3,
  rewardAcorns: 300,
  radioBulletin: ID,
  achievement: 'gta-woolly-sock-regular',
  cutscene: { kind: 'script', script: 'm37-snowdrop-slope-intro' },
  outro: { kind: 'script', script: 'm37-snowdrop-slope-outro' },
  objectives: [
    {
      kind: 'visit',
      text: 'Drive north-west up the rope-tow road to the foot of Snowdrop Slope',
      at: TOW_FOOT,
      radius: 14,
      hint: 'Snowdrop Slope, the Bootlace Tow, far north-west past the Fells',
      heatOnEnter: 1,
      scene: 'm37-snowdrop-slope-mid',
    },
    {
      kind: 'probe',
      text: 'Rent skis at the lodge rack and run the Wool Run through the gates to lose the plows',
      probe: 'winter-ski-runs',
      count: 1,
      at: WOOL_RUN_START,
      hint: 'Rent skis at the lodge rack, ride the Bootlace Tow up, ski down through the gates',
    },
    {
      kind: 'visit',
      text: 'Take the lodge door: Gentian is holding the gate',
      at: LODGE_DOOR,
      radius: 5,
      hint: 'The Woolly Sock Lodge, at the foot of Snowdrop Slope',
    },
  ],
  doneText:
    "Gentian Bootlace has a bunk for every one of you and a woolly sock on every peg. The Woolly Sock Lodge is the crew's base now: a bed, a wardrobe, a door the plows cannot find. Snowdrop Slope is open to ski whenever you like.",
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['thermos theo', 'Previously: the plows found the Basin. They know my bend now. Drink, then go.'],
        ['thermos theo', 'Up the rope-tow road, north-west. Gentian Bootlace keeps the Woolly Sock Lodge.'],
        ['thermos theo', 'She owes me, and nobody else does. Three hundred acorns for the road.'],
      ),
      1: call(
        ['pip', 'Plows behind us! Big ones! Skis from the lodge rack, then up the tow!'],
        ['pip', 'Run every gate. Plows hate a slalom!'],
      ),
      2: call(['gentian', 'Take the lodge door! I will hold the gate. Three wipes of the boots!']),
    },
  },
  givers: {
    'theo-bend': {
      id: 'theo-bend',
      name: "Thermos Theo's bend",
      label: 'Talk to Thermos Theo',
      x: 44,
      z: -350,
      exit: { x: 38, z: -350, yaw: Math.PI / 2 },
      room: 'street',
      letter: '!',
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: the HOA reports a salt-plow convoy lost in the north-west. A spokesman says the plows were "exploring a priority snowfield" and that the snow knows what it did.',
      'The Woolly Sock Lodge reminds guests that three layers means three layers. A bear on the porch bench has been asked politely to move, twice.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
