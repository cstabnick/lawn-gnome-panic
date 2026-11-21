// Chapter 3: "Cold Clay" (Betrayal, Exile & Frostbite Fells).
import type { GnomeLook } from '@lawn/gnome';
import { SIDE_VALVE } from '../config';
import type { QuestDef } from './types';

const PIP_LOOK: Partial<GnomeLook> = { hat: 0xd93636, shirt: 0x2f8a4a, beard: 0x6b5b4b };
const TANSY_LOOK: Partial<GnomeLook> = { hat: 0xf2c230, shirt: 0x2b2e34, glasses: true };
const LOAM_LOOK: Partial<GnomeLook> = { hat: 0x4a3828, shirt: 0x3b3530, glasses: true, beard: 0xc8c0b4 };
const BODEGA_LOOK: Partial<GnomeLook> = { hat: 0x7c4a2d, shirt: 0x3c4b5c, beard: 0x888888 };
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
    cutscene: {
      kind: 'dialogue',
      room: 'side-valve',
      lines: [
        {
          speaker: 'Tansy Clayfoot',
          text: 'A bribed Carburettor sold us out for a Patio Heights racing charter! Vesper\'s got the Golden Acorn—I\'m slipping into the Under-Deck storm drain.',
          look: TANSY_LOOK,
          hz: 170,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'My arm—crack took a piece clean off the shoulder! Take my Zero-Turn and head north up the Ring Road!',
          look: PIP_LOOK,
          hz: 220,
        },
        {
          speaker: 'John Bodega',
          text: 'Sirens tear past Bodega & Sons in the rain. Asphalt doesn\'t even blink, just bats a bottlecap across the counter.',
          look: BODEGA_LOOK,
          hz: 140,
          bodegaCameo: true,
        },
      ],
    },
    objectives: [
      {
        kind: 'crack',
        text: 'Break through the HOA raid outside Side-Valve Salvage',
        targets: [
          { id: 'raid-hoa-1', name: 'HOA Raider Ash', near: [-140, 72], hint: 'Side-Valve Alley', look: HOA_LOOK },
          { id: 'raid-hoa-2', name: 'HOA Raider Slate', near: [-155, 65], hint: 'Side-Valve Alley', look: HOA_LOOK },
          { id: 'raid-hoa-3', name: 'HOA Raider Clay', near: [-130, 82], hint: 'Side-Valve Alley', look: HOA_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Escape north in Pip\'s Zero-Turn to Frostbite Fells',
        vehicleKind: 'zero-turn',
        spawnAt: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z, 0],
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
    cutscene: {
      kind: 'dialogue',
      room: 'fells-shrine',
      lines: [
        {
          speaker: 'Pip Potsworth',
          text: 'I\'m fine! It\'s just a hairline fracture! Wait—did I just hear my elbow rattle?',
          look: PIP_LOOK,
          hz: 215,
        },
        {
          speaker: 'Father Loam',
          text: 'Bring him to the Frozen Birdbath Basin, my children. Grab Kiln-Resin from the northern shrine and hold the ice for ninety seconds while I set his glaze.',
          look: LOAM_LOOK,
          hz: 135,
        },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Fetch Kiln-Resin from the northern shrine',
        at: [-30, -520],
        radius: 12,
        hint: 'Kiln-Resin Shrine',
      },
      {
        kind: 'survive-derby',
        text: 'Survive the 90-second Frozen Birdbath Derby against HOA snow-pursuit mowers',
        arena: [0, -350],
        radius: 42,
        seconds: 90,
        attackers: 6,
        hint: 'Frozen Birdbath Basin',
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
    cutscene: {
      kind: 'dialogue',
      room: 'fells-shrine',
      lines: [
        {
          speaker: 'Father Loam',
          text: 'Tansy\'s micro-scroll says: "Found the Stopping Stone. Meet me in the Dust Flats."',
          look: LOAM_LOOK,
          hz: 135,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'Take this ice-packed Black Dew Zero-Turn east down the ring road. Keep it clean—the loyal Carburettors need every drop.',
          look: PIP_LOOK,
          hz: 210,
        },
      ],
    },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Run the ice-packed Zero-Turn across the ring road to the Dust Flats Overlook',
        vehicleKind: 'zero-turn',
        spawnAt: [10, -340, Math.PI / 2],
        dropAt: [280, 40],
        radius: 16,
        hint: 'Dust Flats Overlook',
        maxDamage: 0.35,
      },
    ],
    doneText: 'You made the Dust Flats intact. Time to take the sky from Fort Sandpit.',
  },
];
