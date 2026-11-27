// Story row 57 "The Sandpit Drop" (kept, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def and its
// comms moved here from quests/chapter4.ts and comms.ts (E22 setup); objectives, count and order are unchanged (old saves
// store the step). Prereq is now m56-mortar-for-a-mower. Scenes stay in ch4b.ts (sandpit-drop-intro) and ch4c.ts
// (sandpit-drop-outro).
import type { GnomeLook } from '@lawn/gnome';
import { BASE } from '../../config';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const DIGGS_LOOK: Partial<GnomeLook> = { hat: 0x556b2f, shirt: 0x6b7a3a, beard: 0x4a3b2c };

const DROP: QuestDef = {
  id: 'ch4-sandpit-drop',
  title: 'The Sandpit Drop',
  giver: 'dust-overlook',
  prereq: 'm56-mortar-for-a-mower',
  chapter: 4,
  rewardAcorns: 1200,
  achievement: 'gta-mid-air-jack',
  radioBulletin: 'ch4-sandpit-drop',
  cutscene: { kind: 'script', script: 'sandpit-drop-intro' },
  outro: { kind: 'script', script: 'sandpit-drop-outro' },
  objectives: [
    {
      kind: 'air-drop',
      text: 'Fly over Fort Sandpit, parachute onto the pad, and steal The Whirligig',
      planeAt: [415, -92],
      dropZone: [BASE.padX, 0, BASE.padZ],
      radius: 22,
      targetVehicle: 'whirligig',
      hint: 'Fort Sandpit Whirligig Pad',
      heatOnLand: 2,
      heatOnBoard: 3,
    },
    {
      kind: 'crack',
      text: 'Clear the Spade Guard perimeter snipers if they block your takeoff',
      targets: [
        { id: 'sandpit-sniper-1', name: 'Spade Guard Sniper I', near: [368, 30], hint: 'Fort Sandpit Perimeter', look: DIGGS_LOOK },
        { id: 'sandpit-sniper-2', name: 'Spade Guard Sniper II', near: [348, 6], hint: 'Fort Sandpit Perimeter', look: DIGGS_LOOK },
      ],
    },
    {
      kind: 'visit',
      text: 'Fly The Whirligig back to Dust Flats Overlook',
      at: [280, 40],
      radius: 18,
      hint: 'Dust Flats Overlook',
    },
  ],
  doneText: 'The Whirligig is yours, and it joins the crew\'s vehicles. Commander Diggs is tearing out of the gate on a Zero-Turn.',
};

export const STORY: StoryFile = {
  quests: [DROP],
  comms: {
    'ch4-sandpit-drop': {
      0: brief(
        ['pip', 'Hogweed fitted the mortar and the parachute rig. The gate has five snipers, so no gate.'],
        ['pip', 'Fly the Crop Duster over Fort Sandpit and jump. We go in from above.'],
        ['tansy', 'When the ring goes green over the pad, bail out. Twelve hundred acorns.'],
      ),
      1: call(['tansy', 'Whirligig boarded. Three-hat heat. Snipers are waking up: crack them, then lift off.']),
      2: call(['pip', 'Diggs is behind you! Bring her to the overlook. Lower than you think.']),
    },
  },
  plans: { 'ch4-sandpit-drop': { suite: 'story', expect: 'pass' } },
};
