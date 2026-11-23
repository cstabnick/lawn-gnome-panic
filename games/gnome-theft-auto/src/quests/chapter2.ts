// Chapter 2: "Black Dew & Greenbacks" (Cloverfield Farms & Mossy Wood).
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from './types';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const PORCELAIN_LOOK: Partial<GnomeLook> = { hat: 0xf4f4f8, shirt: 0xe6e8f0, skin: 0xfafafa };

export const CHAPTER_2_QUESTS: readonly QuestDef[] = [
  {
    id: 'ch2-dew-run',
    title: 'Dew Run on Route South',
    giver: 'cloverfield-barn',
    prereq: 'ch1-founders-boot',
    chapter: 2,
    rewardAcorns: 1750,
    radioBulletin: 'ch2-dew-run',
    cutscene: { kind: 'script', script: 'dew-run-intro' },
    outro: { kind: 'script', script: 'dew-run-outro' },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Steal a Buck-Iron Combine and park it across the South Highway to blockade the convoy',
        vehicleKind: 'combine',
        spawnAt: [-60, 290, Math.PI / 2],
        dropAt: [0, 260],
        radius: 14,
        hint: 'South Highway Blockade',
      },
      {
        kind: 'convoy-ambush',
        text: 'Ambush the Black Dew convoy on Route South and deliver the hauler to Granny\'s Barn',
        route: [[0, 260], [-40, 320], [10, 390]],
        escorts: 3,
        dropAt: [-25, 330],
        hint: 'Granny Gnertrude\'s Barn',
      },
    ],
    doneText: 'Pure 87-octane Black Dew delivered! Granny laughs: "Now we can cook." Your 5,000-Acorn Clay-Mart Kiln-Debt is finally paid off.',
  },
  {
    id: 'ch2-sprinkler-gauntlet',
    title: 'The Cloverfield Sprinkler Gauntlet',
    giver: 'cloverfield-barn',
    prereq: 'ch2-dew-run',
    chapter: 2,
    rewardAcorns: 650,
    radioBulletin: 'ch2-sprinkler-gauntlet',
    cutscene: { kind: 'script', script: 'sprinkler-intro' },
    outro: { kind: 'script', script: 'sprinkler-outro' },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the HOA laser-level squad around Cloverfield',
        targets: [
          { id: 'laser-hoa-1', name: 'Surveyor Peel', near: [-10, 355], hint: 'Cloverfield Barn', look: HOA_LOOK },
          { id: 'laser-hoa-2', name: 'Surveyor Loam', near: [15, 345], hint: 'Cloverfield Fields', look: HOA_LOOK },
          { id: 'laser-hoa-3', name: 'Surveyor Tine', near: [0, 310], hint: 'South Highway Bend', look: HOA_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Haul Granny\'s armored silo rig to the southern barn',
        vehicleKind: 'ride-on',
        spawnAt: [-20, 355, 0],
        dropAt: [40, 440],
        radius: 12,
        hint: 'Cloverfield South Barn',
        heatOnEnter: 2,
        maxDamage: 0.45,
      },
      {
        kind: 'crack',
        text: 'Crack the HOA foreclosure team waiting at the southern barn',
        targets: [
          { id: 'foreclose-hoa-1', name: 'Bailiff Mulch', near: [36, 444], hint: 'Cloverfield South Barn', look: HOA_LOOK },
          { id: 'foreclose-hoa-2', name: 'Bailiff Sod', near: [44, 444], hint: 'Cloverfield South Barn', look: HOA_LOOK },
        ],
      },
    ],
    doneText: 'Silo secured. Granny slips you a crate of forged HOA permits.',
  },
  {
    id: 'ch2-vespers-offer',
    title: 'Order Over Chaos',
    giver: 'cloverfield-barn',
    prereq: 'ch2-sprinkler-gauntlet',
    chapter: 2,
    rewardAcorns: 750,
    radioBulletin: 'ch2-vespers-offer',
    cutscene: { kind: 'script', script: 'vespers-offer-intro' },
    objectives: [
      {
        kind: 'visit',
        text: 'Meet Vesper Thorne at the South Highway diner',
        at: [0, 245],
        scene: 'vesper-diner',
        radius: 12,
        hint: 'South Highway Diner',
        toastOnEnter: 'It\'s a trap! Porcelain Guards surround the diner!',
      },
      {
        kind: 'crack',
        text: 'Fight through Vesper\'s Porcelain Guard ambush',
        targets: [
          { id: 'porcelain-ambush-1', name: 'Porcelain Guard I', near: [-6, 240], hint: 'South Highway', look: PORCELAIN_LOOK },
          { id: 'porcelain-ambush-2', name: 'Porcelain Guard II', near: [6, 240], hint: 'South Highway', look: PORCELAIN_LOOK },
          { id: 'porcelain-ambush-3', name: 'Porcelain Guard III', near: [0, 252], hint: 'South Highway', look: PORCELAIN_LOOK },
        ],
      },
      {
        kind: 'visit',
        text: 'Break west toward Mossy Wood',
        at: [-180, 0],
        radius: 14,
        hint: 'West Highway Gate',
      },
    ],
    doneText: 'You turned down Vesper\'s penthouse. Now the whole HOA has your glaze on file.',
  },
  {
    id: 'ch2-unmowed-tablet',
    title: 'The Cracked Tablet',
    giver: 'unmowed-hollow',
    prereq: 'ch2-vespers-offer',
    chapter: 2,
    rewardAcorns: 800,
    radioBulletin: 'ch2-unmowed-tablet',
    cutscene: { kind: 'script', script: 'tablet-intro' },
    outro: { kind: 'script', script: 'tablet-outro' },
    objectives: [
      {
        kind: 'visit',
        text: 'Scout the Compost Heap armor forge',
        at: [-255, -60],
        scene: 'compost-forge',
        radius: 14,
        hint: 'The Compost Heap',
      },
      {
        kind: 'crack',
        text: 'Crack the HOA welders armoring the Combine plates',
        targets: [
          { id: 'heap-welder-1', name: 'HOA Welder Slag', near: [-250, -55], hint: 'Compost Heap', look: HOA_LOOK },
          { id: 'heap-welder-2', name: 'HOA Welder Cinder', near: [-260, -65], hint: 'Compost Heap', look: HOA_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Hijack the HOA armor-plate Ride-On from the Compost Heap to Unmowed Hollow',
        vehicleKind: 'ride-on',
        spawnAt: [-255, -52, Math.PI],
        dropAt: [-345, 34],
        radius: 12,
        hint: 'Unmowed Hollow',
        heatOnEnter: 2,
      },
    ],
    doneText: 'The Unmowed confirm it: only an ancient Fescue Stopping Stone can jam Vesper\'s Grand Combine.',
  },
];
