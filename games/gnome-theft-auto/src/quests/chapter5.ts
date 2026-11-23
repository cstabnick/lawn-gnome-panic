// Chapter 5: "The Even Cut" (Turfton Finale & Ending A/B Choice).
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from './types';

const VESPER_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xf4f4f8, skin: 0xfafafa, glasses: true };
const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

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
    cutscene: { kind: 'script', script: 'even-cut-intro' },
    outro: { kind: 'script', script: 'even-cut-outro' },
    objectives: [
      {
        kind: 'crack',
        text: 'Clear Vesper\'s HOA Escort Vanguard along the center meridian',
        targets: [
          { id: 'vanguard-hoa-1', name: 'HOA Vanguard Lead', near: [0, -180], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-2', name: 'HOA Vanguard West', near: [-14, -200], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-3', name: 'HOA Vanguard East', near: [14, -200], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-4', name: 'HOA Vanguard Rear', near: [0, -220], hint: 'Center Meridian', look: HOA_LOOK },
        ],
      },
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
        startZ: -240,
        endZ: 60,
        hint: 'Center Meridian (x = 0)',
      },
      {
        kind: 'crack',
        text: 'Crack Vesper "The Glazier" Thorne in his Gilded Lawn-Throne',
        targets: [
          { id: 'vesper-boss', name: 'Vesper "The Glazier" Thorne', near: [0, 0], hint: 'Downtown Meridian', look: VESPER_LOOK },
        ],
      },
      {
        kind: 'choice',
        text: 'Decide the fate of the Golden Acorn at the jammed Combine',
        optionA: {
          label: 'The Unmowed Monument',
          at: [-12, 0],
          endingText: 'Ending A — The Unmowed Monument: With Elder Bracken and Councilwoman Juniper Vance, wild clover reclaims downtown\'s scar.',
        },
        optionB: {
          label: 'Turfton Rewired',
          at: [12, 0],
          endingText: 'Ending B — Turfton Rewired: With Tansy and the Carburettors, the Golden Acorn powers Turfton\'s neon grid and midnight races.',
        },
      },
    ],
    doneText: 'THE EVEN CUT — Side-Valve rebuilds with Brenda\'s lawn chairs, Diggs guards The Gnomecino, Mulch adds a 3rd red coat, Gnoma bakes Acorn-Flour Cakes. Phone buzzes — Club Gnome: "Heard you\'re good with heavy machinery. Need a guy for a bowling alley."',
  },
];
