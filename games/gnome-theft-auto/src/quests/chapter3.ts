// Chapter 3: "Cold Clay" (Betrayal, Exile & Frostbite Fells).
import type { GnomeLook } from '@lawn/gnome';
import { SIDE_VALVE } from '../config';
import type { QuestDef } from './types';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

export const CHAPTER_3_QUESTS: readonly QuestDef[] = [
  {
    id: 'ch3-salvage-raid',
    title: 'The Salvage Raid',
    giver: 'side-valve',
    prereq: 'ch2-unmowed-tablet',
    chapter: 3,
    rewardAcorns: 600,
    radioBulletin: 'ch3-salvage-raid',
    cutscene: { kind: 'script', script: 'salvage-raid-intro' },
    outro: { kind: 'script', script: 'salvage-raid-outro' },
    objectives: [
      {
        kind: 'crack',
        text: 'Break through Turncoat Cam and the HOA raid outside Side-Valve Salvage',
        targets: [
          { id: 'raid-turncoat', name: 'Turncoat Cam', near: [-146, 70], hint: 'Side-Valve Alley', look: { hat: 0xf4f4f8, shirt: 0xc9b99b } },
          { id: 'raid-hoa-1', name: 'HOA Raider Ash', near: [-140, 72], hint: 'Side-Valve Alley', look: HOA_LOOK },
          { id: 'raid-hoa-2', name: 'HOA Raider Slate', near: [-155, 65], hint: 'Side-Valve Alley', look: HOA_LOOK },
          { id: 'raid-hoa-3', name: 'HOA Raider Clay', near: [-130, 82], hint: 'Side-Valve Alley', look: HOA_LOOK },
        ],
      },
      {
        kind: 'visit',
        text: 'Hit the northwest Ring Road to shake the downtown cordon',
        at: [-260, -260],
        radius: 22,
        hint: 'Northwest Ring Road',
      },
      {
        kind: 'steal-deliver',
        text: 'Escape north in Pip\'s Zero-Turn to Frostbite Fells',
        vehicleKind: 'zero-turn',
        spawnAt: [-255, -265, Math.PI / 4],
        dropAt: [0, -340],
        radius: 16,
        hint: 'Frozen Birdbath Basin (Frostbite Fells)',
        heatOnEnter: 3,
      },
    ],
    doneText: 'Side-Valve Salvage is sealed, Vesper holds the Golden Acorn, and you\'re on the run in Frostbite Fells.',
  },
  {
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
        text: 'Pick up Shelldon\'s snail-mail scroll by Thermos Theo\'s barrel',
        at: [40, -330],
        radius: 10,
        hint: 'Thermos Theo\'s Bend',
      },
    ],
    doneText: 'Pip\'s clay arm is glued tight with Kiln-Resin—just as one of Shelldon\'s snails delivers a scroll from Tansy.',
  },
  {
    id: 'ch3-tundra-drift-run',
    title: 'Volatile on Ice',
    giver: 'fells-basin',
    prereq: 'ch3-kiln-resin-ice',
    chapter: 3,
    rewardAcorns: 850,
    radioBulletin: 'ch3-tundra-drift-run',
    cutscene: { kind: 'script', script: 'tundra-intro' },
    outro: { kind: 'script', script: 'tundra-outro' },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Run the ice-packed Zero-Turn across the ring road to the Dust Flats Overlook',
        vehicleKind: 'zero-turn',
        spawnAt: [10, -335, Math.PI / 2],
        dropAt: [280, 40],
        radius: 16,
        hint: 'Dust Flats Overlook',
        heatOnEnter: 2,
        maxDamage: 0.35,
      },
      {
        kind: 'crack',
        text: 'Clear the HOA spotters watching the Dust Flats Overlook',
        targets: [
          { id: 'overlook-hoa-1', name: 'HOA Spotter Dust', near: [275, 45], hint: 'Dust Flats Overlook', look: HOA_LOOK },
          { id: 'overlook-hoa-2', name: 'HOA Spotter Grit', near: [285, 35], hint: 'Dust Flats Overlook', look: HOA_LOOK },
        ],
      },
    ],
    doneText: 'You made the Dust Flats intact. Time to take the sky from Fort Sandpit.',
  },
];
