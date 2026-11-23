// Club Gnome: the Gnomecino Prize Counter cosmetics, bought with chips (card, gambling, Gnomecino and too-much-money gear).
import type { PrefabDef } from '../types';

export const CLUB_GNOME_SHOP: PrefabDef[] = [
  {
    id: 'high-roller-top-hat', name: 'High Roller Top Hat', category: 'armor', uses: ['wear-head'],
    tags: ['top','hat','high','roller','gold','card','casino','head','reward'], emoji: [],
    about: 'A tall black top hat with a gold band and an ace tucked in it. STUB: replace.',
    examine: [
      'Placeholder line one for the High Roller Top Hat, to be written.', 'Placeholder line two for the High Roller Top Hat, to be written.', 'Placeholder line three for the High Roller Top Hat, to be written.', 'Placeholder line four for the High Roller Top Hat, to be written.'],
    parts: [
      { s: 'box', d: [0.2, 0.3, 0.2], at: [0, 0.15, 0], c: 'brass' },
    ],
  },
  {
    id: 'cherry-jackpot-crown', name: 'Triple Cherry Crown', category: 'armor', uses: ['wear-head'],
    tags: ['crown','cherry','cherries','jackpot','slots','gold','casino','head','reward'], emoji: [],
    about: 'A gold crown with three cherries on its points, the slot jackpot. STUB: replace.',
    examine: [
      'Placeholder line one for the Triple Cherry Crown, to be written.', 'Placeholder line two for the Triple Cherry Crown, to be written.', 'Placeholder line three for the Triple Cherry Crown, to be written.', 'Placeholder line four for the Triple Cherry Crown, to be written.'],
    parts: [
      { s: 'box', d: [0.25, 0.15, 0.25], at: [0, 0.075, 0], c: 'brass' },
    ],
  },
  {
    id: 'card-fan', name: 'Fan of Aces', category: 'trinket', uses: ['hold'],
    tags: ['card','cards','ace','aces','fan','casino','hand','reward'], emoji: [],
    about: 'Five playing cards fanned out, all aces. STUB: replace.',
    examine: [
      'Placeholder line one for the Fan of Aces, to be written.', 'Placeholder line two for the Fan of Aces, to be written.', 'Placeholder line three for the Fan of Aces, to be written.', 'Placeholder line four for the Fan of Aces, to be written.'],
    grip: [0, 0.05, 0],
    parts: [
      { s: 'box', d: [0.2, 0.25, 0.03], at: [0, 0.125, 0], c: 'brass' },
    ],
  },
  {
    id: 'chip-stack-tower', name: 'Fistful of Chips', category: 'trinket', uses: ['hold'],
    tags: ['chip','chips','stack','tower','casino','money','hand','reward'], emoji: [],
    about: 'A tall wobbling stack of Gnomecino chips held in one hand. STUB: replace.',
    examine: [
      'Placeholder line one for the Fistful of Chips, to be written.', 'Placeholder line two for the Fistful of Chips, to be written.', 'Placeholder line three for the Fistful of Chips, to be written.', 'Placeholder line four for the Fistful of Chips, to be written.'],
    grip: [0, 0.05, 0],
    parts: [
      { s: 'box', d: [0.08, 0.3, 0.08], at: [0, 0.15, 0], c: 'brass' },
    ],
  },
  {
    id: 'jackpot-chip-medallion', name: 'Jackpot Chip Medallion', category: 'trinket', uses: ['wear-neck'],
    tags: ['chip','medallion','chain','gold','jackpot','casino','neck','reward'], emoji: [],
    about: 'A huge gold casino chip hung on a heavy chain. STUB: replace.',
    examine: [
      'Placeholder line one for the Jackpot Chip Medallion, to be written.', 'Placeholder line two for the Jackpot Chip Medallion, to be written.', 'Placeholder line three for the Jackpot Chip Medallion, to be written.', 'Placeholder line four for the Jackpot Chip Medallion, to be written.'],
    parts: [
      { s: 'cyl', d: [0.05, 0.05, 0.01], at: [0, 0.005, 0.15], c: 'brass', seg: 12 },
    ],
  },
  {
    id: 'overflowing-acorn-sack', name: 'Overflowing Acorn Sack', category: 'armor', uses: ['wear-back'],
    tags: ['sack','bag','money','acorn','acorns','gold','rich','back','reward'], emoji: [],
    about: 'A burlap money sack stuffed so full golden acorns spill out of the top. STUB: replace.',
    examine: [
      'Placeholder line one for the Overflowing Acorn Sack, to be written.', 'Placeholder line two for the Overflowing Acorn Sack, to be written.', 'Placeholder line three for the Overflowing Acorn Sack, to be written.', 'Placeholder line four for the Overflowing Acorn Sack, to be written.'],
    parts: [
      { s: 'box', d: [0.3, 0.35, 0.25], at: [0, 0.175, 0], c: 'brass' },
    ],
  },
];
