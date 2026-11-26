// Story row 22 "Off Air" (docs/design/gnome-theft-auto/story-outline.md): Sorrel's rain tapes are in an HOA van.
// Pip is fetched from Side-Valve (passenger), the van is tailed along the west highway, its guards cracked, and the van
// brought to her booth. Scenes: cutscene/scenes/story/m22-off-air.ts. Sorrel never says "mower" and never says what the
// rain is or where it falls.
import type { GnomeLook } from '@lawn/gnome';
import { homeDoor } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const VAN_DRIVER_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b, beard: 0x6b6b6b };

const OFF_AIR: QuestDef = {
  id: 'm22-off-air',
  title: 'Off Air',
  giver: 'side-valve',
  prereq: 'm21-penthouse-viewing',
  chapter: 2,
  rewardAcorns: 300,
  radioBulletin: 'm22-off-air',
  cutscene: { kind: 'script', script: 'm22-off-air-intro' },
  outro: { kind: 'script', script: 'm22-off-air-outro' },
  // The ride west is a gentle one: no Hat Watch until the van is in sight.
  hoaSteps: { 0: 'off' },
  objectives: [
    {
      kind: 'passenger',
      text: 'Pick up Pip at Side-Valve Salvage and take him west to Sorrel\'s booth',
      who: 'pip',
      name: 'Pip',
      pickup: [-136, 74],
      dropAt: homeDoor('sorrel'),
      radius: 12,
      hint: 'Pip, at Side-Valve Salvage',
      vehicle: { kind: 'ride-on', at: [-141, 78, Math.PI] },
      maxDamage: 0.5,
      banter: [
        'Pip: "West? Nobody said west. I have a very full schedule of staying put."',
        'Pip: "Okay, hear me out: I wave from the car, you do the rest."',
        'Pip: "Trees. So many trees. They are all just standing there. Judging."',
      ],
      onBoard: 'Pip climbs in and holds his toolbox like a seat belt.',
      onDrop: 'Pip stands at Sorrel\'s door. He does not come in.',
    },
    {
      kind: 'chase-follow',
      text: 'Tail the HOA van along the wood tracks at dusk',
      leaderName: 'HOA van',
      leaderKind: 'hoa-van',
      leaderLook: VAN_DRIVER_LOOK,
      waypoints: [[-352, 12], [-320, 20], [-290, 0]],
      speed: 11,
      maxDist: 70,
      hint: 'The HOA van on the west highway',
    },
    {
      kind: 'crack',
      text: 'Crack the two HOA guards guarding the van',
      targets: [
        { id: 'offair-guard-1', name: 'HOA Guard Tally', near: [-284, 4], hint: 'West highway', look: HOA_LOOK },
        { id: 'offair-guard-2', name: 'HOA Guard Clip', near: [-292, -4], hint: 'West highway', look: HOA_LOOK },
      ],
    },
    {
      kind: 'steal-deliver',
      text: 'Take the HOA van and bring the tapes to Sorrel\'s booth',
      vehicleKind: 'hoa-van',
      spawnAt: [-290, 0, Math.PI],
      dropAt: [-360, 56],
      radius: 12,
      hint: 'Sorrel\'s radio booth',
      heatOnEnter: 1,
      maxDamage: 0.6,
      banter: ['Tape bank: a shoebox of cassettes rattles in the back. Every label says RAIN.'],
    },
  ],
  doneText: 'The tapes are home. Sorrel\'s rain fills 88.7, and the HOA van is parked where it cannot confiscate anything.',
};

export const STORY: StoryFile = {
  quests: [OFF_AIR],
  comms: {
    'm22-off-air': {
      0: brief(
        ['sorrel', 'This is Sorrel Tillbrook, 88.7 Fescue Public. The HOA took my rain tapes.'],
        ['sorrel', 'Fetch Pip from Side-Valve Salvage and bring him west. He knows vans.'],
        ['sorrel', 'Get my tapes back and there are three hundred acorns in it.'],
      ),
      1: call(['pip', 'Okay, hear me out. I am not going in there. I will hold the door.']),
      2: call(['sorrel', 'That is the van. Two guards on it. Be firm with them.']),
      3: call(['sorrel', 'Drive the van to my booth. Bring it all the way in.']),
    },
  },
  plans: { 'm22-off-air': { suite: 'story', expect: 'pass' } },
  bulletins: {
    'm22-off-air': [
      'An HOA Weather Compliance van was found parked outside a radio booth in Mossy Wood, empty, with its doors open and its tapes gone.',
      'Listeners to 88.7 Fescue Public report forty-five minutes of rain on terracotta last night. The HOA reminds residents that unlicensed weather is a citable offence.',
    ],
  },
};
