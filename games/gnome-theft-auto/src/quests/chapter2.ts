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
    rewardAcorns: 1750,
    radioBulletin: 'ch2-dew-run',
    cutscene: {
      kind: 'dialogue',
      room: 'cloverfield-barn',
      lines: [
        {
          speaker: 'Granny Gnertrude',
          text: 'Vesper\'s boys are draining the Cloverfield Dew-Wells dry. Pure 87-octane Black Dew—100% unlicensed, just how we like it.',
          look: GRANNY_LOOK,
          hz: 185,
        },
        {
          speaker: 'Granny Gnertrude',
          text: 'Borrow a Buck-Iron Combine, park it across the South Highway by Fence-Post Frank\'s sign to block their convoy, and bring that Dew-Hauler to my barn.',
          look: GRANNY_LOOK,
          hz: 188,
        },
        {
          speaker: 'Granny Gnertrude',
          text: 'And try not to splatter my prize pumpkins—they\'re load-bearing. I keep a double-barrel over them for a reason.',
          look: GRANNY_LOOK,
          hz: 190,
        },
      ],
    },
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
    cutscene: {
      kind: 'dialogue',
      room: 'cloverfield-barn',
      lines: [
        {
          speaker: 'Granny Gnertrude',
          text: 'Reginald Vance\'s laser-level squad is trying to foreclose on my back-forty acorn silo! Rooster "Squall-Box" Weatherby\'s been screaming from the windmill all morning.',
          look: GRANNY_LOOK,
          hz: 185,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'Wait—we\'re towing a silo through oscillating sprinklers? Do you know what cold thermal shock does to cheap kiln glaze?!',
          look: PIP_LOOK,
          hz: 215,
        },
        {
          speaker: 'Granny Gnertrude',
          text: 'Then drive fast, sugar! Clear the surveyors, weave past the windmill, and clear any HOA foreclosure crew at the south barn.',
          look: GRANNY_LOOK,
          hz: 188,
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
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Vesper Thorne',
          text: 'Meet me at the South Highway diner. Hand over the Golden Acorn and Thorne Lawn & Order LLC will wipe Tansy\'s lien and deed you a Patio Heights astro-turf penthouse.',
          look: VESPER_LOOK,
          hz: 125,
        },
        {
          speaker: 'Vesper Thorne',
          text: 'Full Kiln-Shield coverage, zero-millimeter uniformity. Order over chaos, friend.',
          look: VESPER_LOOK,
          hz: 122,
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
        kind: 'visit',
        text: 'Meet Vesper Thorne at the South Highway diner',
        at: [0, 245],
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
    cutscene: {
      kind: 'dialogue',
      room: 'unmowed-hollow',
      lines: [
        {
          speaker: 'Elder Bracken',
          text: 'A Potsworth in Mossy Wood, reeking of Black Dew! Your cousin Wendel Potsworth is regent of Fescue, yet you traded the old soil for Stink-Gro and engines.',
          look: BRACKEN_LOOK,
          hz: 145,
        },
        {
          speaker: 'Sorrel Tillbrook',
          text: 'Steady, Elder. Look at the cracked earthenware tablet—Vesper\'s Grand Combine is patterned after Fescue\'s original 3,000-year-old... the one in the Shed.',
          look: SORREL_LOOK,
          hz: 175,
        },
        {
          speaker: 'Elder Bracken',
          text: 'Only a Fescue Stopping Stone can jam it. Clear Vesper\'s armor welders at the Compost Heap and bring their armored rig back here.',
          look: BRACKEN_LOOK,
          hz: 145,
        },
        {
          speaker: 'Sorrel Tillbrook',
          text: 'After this, 88.7 Fescue Public Radio is playing forty-five minutes of rain on terracotta. Let\'s move.',
          look: SORREL_LOOK,
          hz: 175,
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
