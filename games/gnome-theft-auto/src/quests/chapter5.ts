// Chapter 5: "The Even Cut" (Turfton Finale & Ending A/B Choice).
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from './types';

const PIP_LOOK: Partial<GnomeLook> = { hat: 0xd93636, shirt: 0x2f8a4a, beard: 0x6b5b4b };
const TANSY_LOOK: Partial<GnomeLook> = { hat: 0xf2c230, shirt: 0x2b2e34, glasses: true };
const DIGGS_LOOK: Partial<GnomeLook> = { hat: 0x556b2f, shirt: 0x6b7a3a, beard: 0x4a3b2c };
const BODEGA_LOOK: Partial<GnomeLook> = { hat: 0x7c4a2d, shirt: 0x3c4b5c, beard: 0x888888 };

export const CHAPTER_5_QUESTS: readonly QuestDef[] = [
  {
    id: 'ch5-even-cut',
    title: 'The Even Cut',
    giver: 'dust-overlook',
    prereq: 'ch4-spade-truce',
    chapter: 5,
    rewardAcorns: 2500,
    achievement: 'gta-even-cut',
    radioBulletin: 'ch5-even-cut',
    cutscene: {
      kind: 'dialogue',
      room: 'dust-overlook',
      titleCard: 'CHAPTER 5 — THE EVEN CUT',
      lines: [
        {
          speaker: 'Tansy Clayfoot',
          text: 'Vesper\'s Grand Combine just crossed z = -300 on the center meridian. Four minutes until it hits downtown, set to zero-millimeter scalp.',
          look: TANSY_LOOK,
          hz: 165,
        },
        {
          speaker: 'Commander Diggs',
          text: 'Spade Guard\'s with you. Nobody levels my sandbox—or your city—without a permit.',
          look: DIGGS_LOOK,
          hz: 145,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'Let\'s go jam a god-machine with a rock!',
          look: PIP_LOOK,
          hz: 220,
        },
        {
          speaker: 'John Bodega',
          text: 'Down at Bodega & Sons, the neon window rattles as the Grand Combine\'s shadow rolls down x = 0. Asphalt hops down and watches the street.',
          look: BODEGA_LOOK,
          hz: 140,
          bodegaCameo: true,
        },
      ],
    },
    objectives: [
      {
        kind: 'air-drop',
        text: 'Fly to the center meridian and parachute onto the Grand Combine',
        planeAt: [305, 40],
        dropZone: [0, 0, -240],
        radius: 30,
        hint: 'Grand Combine Meridian (x = 0)',
      },
      {
        kind: 'boss-combine',
        text: 'Defeat Vesper\'s Porcelain Guard on the deck and jam the Grand Combine with the Stopping Stone',
        startZ: -300,
        endZ: 180,
        hint: 'Center Meridian (x = 0)',
      },
      {
        kind: 'choice',
        text: 'Decide the fate of the Golden Acorn on the jammed Combine deck',
        optionA: {
          label: 'The Unmowed Monument',
          at: [-12, 180],
          endingText: 'Ending A — The Unmowed Monument: Wild clover reclaims downtown\'s scar. Phone buzzes — Club Gnome: "Heard you\'re good with heavy machinery. Need a guy for a bowling alley."',
        },
        optionB: {
          label: 'Turfton Rewired',
          at: [12, 180],
          endingText: 'Ending B — Turfton Rewired: The Golden Acorn powers Turfton\'s neon grid and midnight races. Phone buzzes — Club Gnome: "Heard you\'re good with heavy machinery. Need a guy for a bowling alley."',
        },
      },
    ],
    doneText: 'THE EVEN CUT — COMPLETE! Phone buzzes from Club Gnome: "Heard you\'re good with heavy machinery. Need a guy for a bowling alley."',
  },
];
