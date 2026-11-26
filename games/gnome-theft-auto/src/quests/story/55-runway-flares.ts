// Story row 55 "Runway Flares" (kept, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def and its comms
// moved here from quests/chapter4.ts and comms.ts (E22 setup); objectives, count and order are unchanged (old saves
// store the step). Prereq is now m54-the-heist-board. Its scene (runway-intro) stays in cutscene/scenes/story/ch4b.ts.
import type { GnomeLook } from '@lawn/gnome';
import { AIRFIELD } from '../../config';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const DIGGS_LOOK: Partial<GnomeLook> = { hat: 0x556b2f, shirt: 0x6b7a3a, beard: 0x4a3b2c };

const RUNWAY: QuestDef = {
  id: 'ch4-runway-flares',
  title: 'Runway Flares',
  giver: 'dust-overlook',
  prereq: 'm54-the-heist-board',
  chapter: 4,
  rewardAcorns: 950,
  radioBulletin: 'ch4-runway-flares',
  cutscene: { kind: 'script', script: 'runway-intro' },
  objectives: [
    {
      kind: 'crack',
      text: 'Clear the two Spade Guard patrols on the Desert Airfield apron',
      targets: [
        { id: 'apron-spade-1', name: 'Spade Guard Apron I', near: [430, -85], hint: 'Desert Airfield', look: DIGGS_LOOK },
        { id: 'apron-spade-2', name: 'Spade Guard Apron II', near: [450, -95], hint: 'Desert Airfield', look: DIGGS_LOOK },
      ],
    },
    {
      kind: 'steal-deliver',
      text: 'Steal a Crop Duster and fly low over the Dust Flats flare zone',
      vehicleKind: 'plane',
      spawnAt: [440, -92, AIRFIELD.yaw],
      dropAt: [310, 120],
      radius: 28,
      hint: 'Dust Flats Flare Zone',
      heatOnEnter: 2,
    },
    {
      kind: 'visit',
      text: 'Drop the second flare over the northern Dust Flats ridge',
      at: [360, -140],
      radius: 30,
      hint: 'Northern Dust Flats',
    },
  ],
  doneText: 'Flares dropped. The Unmowed spotters are in position outside Fort Sandpit.',
};

export const STORY: StoryFile = {
  quests: [RUNWAY],
  comms: {
    'ch4-runway-flares': {
      0: brief(
        ['tansy', 'Fort Sandpit. The Spade Guard\'s fort, and the Whirligig\'s pad.'],
        ['tansy', 'The Unmowed are coming to help. Flares show them where.'],
        ['tansy', 'Commander Diggs runs the fort. He\'s not ours. Not yet.'],
      ),
      1: call(['pip', 'Crop Duster\'s on the apron! Fly low and drop the flare on the Flats!']),
      2: call(['bracken', 'We see the first flare. One more, on the north ridge.']),
    },
  },
  plans: { 'ch4-runway-flares': { suite: 'story', expect: 'pass' } },
};
