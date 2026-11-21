// Chapter 2: "Black Dew & Greenbacks" (Cloverfield Farms & Mossy Wood).
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from './types';

const GRANNY_LOOK: Partial<GnomeLook> = { hat: 0xf08bb4, shirt: 0x8e5ea2, glasses: true, dress: true };
const VESPER_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xf4f4f8, skin: 0xfafafa, glasses: true };
const BRACKEN_LOOK: Partial<GnomeLook> = { hat: 0x3d6e35, shirt: 0x5c4a32, beard: 0xd8d8d0 };
const SORREL_LOOK: Partial<GnomeLook> = { hat: 0x4f7a5a, shirt: 0x6d5c4d };
const PIP_LOOK: Partial<GnomeLook> = { hat: 0xd93636, shirt: 0x2f8a4a, beard: 0x6b5b4b };
const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const PORCELAIN_LOOK: Partial<GnomeLook> = { hat: 0xf4f4f8, shirt: 0xe6e8f0, skin: 0xfafafa };

export const CHAPTER_2_QUESTS: readonly QuestDef[] = [
  {
    id: 'ch2-dew-run',
    title: 'Dew Run on Route South',
    giver: 'cloverfield-barn',
    prereq: 'ch1-founders-boot',
    chapter: 2,
    rewardAcorns: 1200,
    radioBulletin: 'ch2-dew-run',
    cutscene: {
      kind: 'dialogue',
      room: 'cloverfield-barn',
      lines: [
        {
          speaker: 'Granny Gnertrude',
          text: 'Vesper\'s boys are draining the Cloverfield Dew-Wells dry. Ambush their south highway convoy and bring me that tanker.',
          look: GRANNY_LOOK,
          hz: 185,
        },
        {
          speaker: 'Granny Gnertrude',
          text: 'And try not to splatter my prize pumpkins—they\'re load-bearing.',
          look: GRANNY_LOOK,
          hz: 190,
        },
      ],
    },
    objectives: [
      {
        kind: 'convoy-ambush',
        text: 'Ambush the Black Dew convoy on Route South and deliver the hauler to Granny\'s Barn',
        route: [[0, 260], [-40, 320], [10, 390]],
        escorts: 3,
        dropAt: [-25, 330],
        hint: 'Granny Gnertrude\'s Barn',
      },
    ],
    doneText: 'Pure 87-octane Black Dew delivered—and your 5,000-Acorn Clay-Mart Kiln-Debt is finally paid off.',
  },
  {
    id: 'ch2-sprinkler-gauntlet',
    title: 'The Cloverfield Sprinkler Gauntlet',
    giver: 'cloverfield-barn',
    prereq: 'ch2-dew-run',
    chapter: 2,
    rewardAcorns: 650,
    radioBulletin: 'ch2-sprinkler-gauntlet',
    cutscene: {
      kind: 'dialogue',
      room: 'cloverfield-barn',
      lines: [
        {
          speaker: 'Granny Gnertrude',
          text: 'Reginald Vance\'s laser-level squad is trying to foreclose on my back-forty acorn silo! Clear them out and haul the silo rig south.',
          look: GRANNY_LOOK,
          hz: 185,
        },
      ],
    },
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
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Vesper Thorne',
          text: 'Hand over the Golden Acorn and I will wipe Tansy\'s lien and deed you a Patio Heights penthouse. Order over chaos, friend.',
          look: VESPER_LOOK,
          hz: 125,
        },
        {
          speaker: 'Vesper Thorne',
          text: 'No? A pity. Porcelain does not negotiate twice.',
          look: VESPER_LOOK,
          hz: 120,
        },
      ],
    },
    objectives: [
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
    cutscene: {
      kind: 'dialogue',
      room: 'unmowed-hollow',
      lines: [
        {
          speaker: 'Elder Bracken',
          text: 'A Potsworth in Mossy Wood, reeking of Black Dew! You traded Fescue\'s soil for an engine.',
          look: BRACKEN_LOOK,
          hz: 145,
        },
        {
          speaker: 'Sorrel Tillbrook',
          text: 'Steady, Elder. Look at the cracked earthenware tablet—Vesper\'s Grand Combine is patterned after Fescue\'s original 3,000-year-old Mower.',
          look: SORREL_LOOK,
          hz: 175,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'Wait... they\'re really gonna level the whole lawn?',
          look: PIP_LOOK,
          hz: 200,
        },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Scout the Compost Heap armor forge',
        at: [-255, -60],
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
        kind: 'visit',
        text: 'Report back to Elder Bracken in Mossy Wood',
        at: [-350, 40],
        radius: 12,
        hint: 'Unmowed Hollow',
      },
    ],
    doneText: 'The Unmowed confirm it: only an ancient Fescue Stopping Stone can jam Vesper\'s Grand Combine.',
  },
];
