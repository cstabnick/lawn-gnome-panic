// Story row 36 "Kiln-Resin & Black Ice" (rewrite, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def
// and its comms moved here from quests/chapter3.ts and comms.ts (E21 setup); objectives, count and order are unchanged.
// Its scenes (kiln-resin-intro, kiln-resin-outro) stay in cutscene/scenes/story/ch3b.ts, rewritten in E21: the scroll now
// says Vesper builds the Combine in parts out at the edges (the Dust Flats line moved to row 53), and Theo points north.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

const KILN_RESIN: QuestDef = {
  id: 'ch3-kiln-resin-ice',
  title: 'Kiln-Resin & Black Ice',
  giver: 'fells-basin',
  prereq: 'ch3-salvage-raid',
  chapter: 3,
  rewardAcorns: 900,
  radioBulletin: 'ch3-kiln-resin-ice',
  cutscene: { kind: 'script', script: 'kiln-resin-intro' },
  outro: { kind: 'script', script: 'kiln-resin-outro' },
  objectives: [
    {
      kind: 'visit',
      text: 'Fetch Kiln-Resin from the northern shrine',
      at: [-30, -520],
      radius: 12,
      hint: 'Kiln-Resin Shrine',
    },
    {
      kind: 'crack',
      text: 'Crack the HOA salt-plow crew blocking the Frozen Birdbath approach',
      targets: [
        { id: 'plow-hoa-1', name: 'Salt-Plow Driver Grit', near: [-12, -390], hint: 'North Basin Approach', look: HOA_LOOK },
        { id: 'plow-hoa-2', name: 'Salt-Plow Driver Frost', near: [12, -390], hint: 'North Basin Approach', look: HOA_LOOK },
      ],
    },
    {
      kind: 'survive-derby',
      text: 'Survive the 90-second Frozen Birdbath Derby against HOA snow-pursuit mowers',
      arena: [0, -350],
      radius: 42,
      seconds: 90,
      attackers: 8,
      hint: 'Frozen Birdbath Basin',
    },
    {
      kind: 'visit',
      text: 'Pick up the snail-mail scroll from Shelldon\'s courier snail by Thermos Theo\'s barrel',
      at: [40, -330],
      radius: 10,
      hint: 'Thermos Theo\'s Bend',
    },
  ],
  doneText: 'Pip\'s arm is glued tight with Kiln-Resin, and Tansy\'s scroll says the Combine is built in parts, out at the edges. The road north is next.',
};

export const STORY: StoryFile = {
  quests: [KILN_RESIN],
  comms: {
    'ch3-kiln-resin-ice': {
      0: brief(
        ['loam', 'The raid took the shop, the Acorn, the boy\'s arm. Resin mends one.'],
        ['loam', 'Fetch Kiln-Resin from the northern shrine, up the highway. The plows are watching that road.'],
        ['loam', 'Nine hundred acorns, my child, and Pip keeps his arm.'],
      ),
      1: call(['loam', 'Salt-plows block the approach. Crack the two drivers, and mind the ice.']),
      2: call(['pip', 'Here they come, eight of them! Keep them off the basin while it sets!']),
      3: call(['thermos theo', 'A snail came to my barrel, round the bend. Scroll for you. Tea first.']),
    },
  },
  bulletins: {
    'ch3-kiln-resin-ice': [
      'Turfton FM: Frostbite Fells reports a hillside shrine visited by a stranger and a very empty jar. Father Loam says the jar is full again, and the Kiln is satisfied.',
      'HOA crews on the North Basin Approach report eight snow-pursuit mowers lost on the Frozen Birdbath. The HOA blames the ice. The ice declines to comment.',
    ],
  },
  plans: {
    'ch3-kiln-resin-ice': { suite: 'story', expect: 'pass' },
  },
};
