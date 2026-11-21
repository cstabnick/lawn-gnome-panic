// Pull-Tab ticket catalog: Trollin' Gnomes (Gnome & Goblin), Goblinomicon (Goblin), and Turfton Heat (Gnome Theft Auto).
import type { PullTabSpec, PullTabThemeId } from './types';

export const TROLLIN_GNOMES: PullTabSpec = {
  id: 'trollin-gnomes',
  name: "TROLLIN' GNOMES",
  subtitle: 'Gnomes, Goblins & Garden Luck',
  cost: 5,
  accent: '#ffd54f',
  cardBg: '#233b54',
  border: '#d62828',
  tabBg: '#d62828',
  symbols: [
    { id: 'GNOME', label: 'Red-Cap', glyph: '🎅', color: '#e63946', weight: 4 },
    { id: 'GOBLIN', label: 'Goblin', glyph: '🧌', color: '#52b788', weight: 6 },
    { id: 'PONY', label: 'Pony', glyph: '🐴', color: '#d4a373', weight: 8 },
    { id: 'SNAIL', label: 'Snail', glyph: '🐌', color: '#a7c957', weight: 10 },
    { id: 'SHROOM', label: 'Toadstool', glyph: '🍄', color: '#e76f51', weight: 12 },
  ],
  payouts: [
    { id: '3-gnome', label: 'TRIPLE RED-CAPS!', symbolId: 'GNOME', payout: 300, jackpot: true },
    { id: '3-goblin', label: 'THREE GOBLINS!', symbolId: 'GOBLIN', payout: 40 },
    { id: '3-pony', label: 'GARDEN PONIES!', symbolId: 'PONY', payout: 20 },
    { id: '3-snail', label: 'SNAIL DERBY!', symbolId: 'SNAIL', payout: 10 },
    { id: '3-shroom', label: 'TOADSTOOLS!', symbolId: 'SHROOM', payout: 5 },
  ],
};

export const GOBLINOMICON_TICKET: PullTabSpec = {
  id: 'goblinomicon',
  name: 'GOBLINOMICON',
  subtitle: 'Peat-Ink Tallies & Goblin Metal',
  cost: 10,
  accent: '#8ce99a',
  cardBg: '#1b2d22',
  border: '#40916c',
  tabBg: '#2d6a4f',
  symbols: [
    { id: 'TOME', label: 'Goblinomicon', glyph: '📖', color: '#8ce99a', weight: 4 },
    { id: 'METAL', label: 'Goblin Metal', glyph: '🥁', color: '#adb5bd', weight: 6 },
    { id: 'MOUND', label: 'Warm Mound', glyph: '🪨', color: '#b08968', weight: 8 },
    { id: 'PICK', label: 'Sapper Pick', glyph: '⛏️', color: '#ced4da', weight: 10 },
    { id: 'CLOVER', label: 'Peat Clover', glyph: '🍀', color: '#52b788', weight: 12 },
  ],
  payouts: [
    { id: '3-tome', label: 'THE GOBLINOMICON!', symbolId: 'TOME', payout: 500, jackpot: true },
    { id: '3-metal', label: 'GOBLIN METAL!', symbolId: 'METAL', payout: 100 },
    { id: '3-mound', label: 'WARM MOUNDS!', symbolId: 'MOUND', payout: 50 },
    { id: '3-pick', label: 'STUBBLE-SAPPERS!', symbolId: 'PICK', payout: 20 },
    { id: '3-clover', label: 'PEAT CLOVER!', symbolId: 'CLOVER', payout: 10 },
  ],
};

export const TURFTON_HEAT: PullTabSpec = {
  id: 'gnome-theft-auto',
  name: 'TURFTON HEAT',
  subtitle: 'Gnome Theft Auto · Mulch Club Special',
  cost: 25,
  accent: '#ffbe0b',
  cardBg: '#2b1d2e',
  border: '#ff006e',
  tabBg: '#9d0208',
  symbols: [
    { id: 'GOLDHAT', label: 'Gold Hat', glyph: '👑', color: '#ffbe0b', weight: 4 },
    { id: 'WHIRLIGIG', label: 'Whirligig', glyph: '🚁', color: '#4cc9f0', weight: 6 },
    { id: 'DUSTER', label: 'Crop Duster', glyph: '✈️', color: '#f4a261', weight: 8 },
    { id: 'WATCH', label: 'Hat Watch', glyph: '🚓', color: '#4895ef', weight: 10 },
    { id: 'CLINIC', label: 'Glaze Clinic', glyph: '🚑', color: '#e63946', weight: 12 },
  ],
  payouts: [
    { id: '3-goldhat', label: "DON COMPOST'S GOLD!", symbolId: 'GOLDHAT', payout: 1250, jackpot: true },
    { id: '3-whirligig', label: 'WHIRLIGIG ESCAPE!', symbolId: 'WHIRLIGIG', payout: 250 },
    { id: '3-duster', label: 'DUST FLATS RUN!', symbolId: 'DUSTER', payout: 100 },
    { id: '3-watch', label: '3-HAT HEAT!', symbolId: 'WATCH', payout: 50 },
    { id: '3-clinic', label: 'GLAZE CLINIC!', symbolId: 'CLINIC', payout: 25 },
  ],
};

export const PULLTAB_THEMES: readonly PullTabSpec[] = [
  TROLLIN_GNOMES,
  GOBLINOMICON_TICKET,
  TURFTON_HEAT,
];

export function getPullTabSpec(id: PullTabThemeId): PullTabSpec {
  return PULLTAB_THEMES.find((t) => t.id === id) ?? TROLLIN_GNOMES;
}
