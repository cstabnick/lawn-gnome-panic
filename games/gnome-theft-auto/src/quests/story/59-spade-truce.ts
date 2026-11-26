// Story row 59 "Nobody Fires the Guard" (kept, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def and
// its comms moved here from quests/chapter4.ts and comms.ts (E22 setup); objectives, count and order are unchanged (old
// saves store the step). Prereq is now m58-the-reeves-barn. Scenes stay in ch4c.ts (spade-truce-intro) and ch4.ts
// (spade-truce-outro).
import type { GnomeLook } from '@lawn/gnome';
import { BASE } from '../../config';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const DIGGS_LOOK: Partial<GnomeLook> = { hat: 0x556b2f, shirt: 0x6b7a3a, beard: 0x4a3b2c };
const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

const TRUCE: QuestDef = {
  id: 'ch4-spade-truce',
  // E23 L103: a squad shoot-out; the Hat Watch may notice (1 hat) but sends no pursuits.
  hoaSteps: { 1: { cap: 1 } },
  title: 'Nobody Fires the Guard',
  giver: 'dust-overlook',
  prereq: 'm58-the-reeves-barn',
  chapter: 4,
  rewardAcorns: 1000,
  radioBulletin: 'ch4-spade-truce',
  cutscene: { kind: 'script', script: 'spade-truce-intro' },
  outro: { kind: 'script', script: 'spade-truce-outro' },
  objectives: [
    {
      kind: 'chase-follow',
      text: 'Follow Commander Diggs back to the Fort Sandpit gate',
      leaderName: 'Commander Diggs',
      leaderKind: 'zero-turn',
      leaderLook: DIGGS_LOOK,
      waypoints: [[300, 40], [340, 56], [BASE.gateX, BASE.gateZ]],
      speed: 18,
      maxDist: 80,
      hint: 'Fort Sandpit Gate',
    },
    {
      kind: 'crack',
      text: 'Crack the HOA lockout enforcers outside Fort Sandpit',
      targets: [
        { id: 'armory-hoa-1', name: 'Lockout Enforcer Cobb', near: [368, 42], hint: 'Fort Sandpit Gate', look: HOA_LOOK },
        { id: 'armory-hoa-2', name: 'Lockout Enforcer Marl', near: [380, 42], hint: 'Fort Sandpit Gate', look: HOA_LOOK },
        { id: 'armory-hoa-3', name: 'Lockout Enforcer Shale', near: [374, 52], hint: 'Fort Sandpit Gate', look: HOA_LOOK },
      ],
    },
    {
      kind: 'visit',
      text: 'Reclaim the Fort Sandpit armory inside the gate',
      at: [374, 10],
      radius: 12,
      hint: 'Fort Sandpit Armory',
    },
  ],
  doneText: 'Spade Guard, Unmowed, Carburettors, and Cloverfield—every crew in four biomes is now aligned against Vesper.',
};

export const STORY: StoryFile = {
  quests: [TRUCE],
  comms: {
    'ch4-spade-truce': {
      0: brief(
        ['tansy', 'Vesper fired the Spade Guard by phone. Diggs took it personally.'],
        ['tansy', 'Help him take the armory back. Every free gun in Turfton came out of it.'],
      ),
      1: call(['diggs', 'HOA lockout at my gate. Crack them. Nobody locks the Guard out.']),
      2: call(['diggs', 'Gate\'s clear. Armory\'s inside. Walk in like you own it. I do.']),
    },
  },
  plans: { 'ch4-spade-truce': { suite: 'story', expect: 'pass' } },
};
