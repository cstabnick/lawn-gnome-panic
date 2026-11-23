// Chapter 4: "Sandpit Protocol" (The Dust Flats: Desert Airfield & Fort Sandpit).
import type { GnomeLook } from '@lawn/gnome';
import { AIRFIELD, BASE } from '../config';
import type { QuestDef } from './types';

const DIGGS_LOOK: Partial<GnomeLook> = { hat: 0x556b2f, shirt: 0x6b7a3a, beard: 0x4a3b2c };
const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

export const CHAPTER_4_QUESTS: readonly QuestDef[] = [
  {
    id: 'ch4-runway-flares',
    title: 'Runway Flares',
    giver: 'dust-overlook',
    prereq: 'ch3-tundra-drift-run',
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
  },
  {
    id: 'ch4-sandpit-drop',
    title: 'The Sandpit Drop',
    giver: 'dust-overlook',
    prereq: 'ch4-runway-flares',
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
    doneText: 'The Whirligig is yours—and Commander Diggs is tearing out of the gate on a Zero-Turn.',
  },
  {
    id: 'ch4-spade-truce',
    title: 'Nobody Fires the Guard',
    giver: 'dust-overlook',
    prereq: 'ch4-sandpit-drop',
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
  },
];
