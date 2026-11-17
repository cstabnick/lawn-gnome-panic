// Registry of slot machine types. Start with Classic 3-Bar; add future slot & gambling types here.
import type { SlotMachineSpec } from './types';

export const CLASSIC_3BAR: SlotMachineSpec = {
  id: 'classic-3bar',
  name: 'Classic 3-Bar',
  prefabId: 'slot-machine-classic',
  tint: 'red',
  trim: 'brass',
  reelCount: 3,
  minBet: 5,
  maxBet: 50,
  betSteps: [5, 10, 25, 50],
  symbols: [
    { id: '7', label: '7', glyph: '7', color: '#d92626', weight: 2 },
    { id: 'BAR3', label: '3×BAR', glyph: 'BAR\nBAR\nBAR', color: '#1f1f24', weight: 3, isBar: true },
    { id: 'BAR', label: 'BAR', glyph: 'BAR', color: '#2b2d38', weight: 5, isBar: true },
    { id: 'BELL', label: 'Bell', glyph: '🔔', color: '#d49a1a', weight: 6 },
    { id: 'CLOVER', label: 'Clover', glyph: '🍀', color: '#2f8f3a', weight: 8 },
    { id: 'CHERRY', label: 'Cherry', glyph: '🍒', color: '#c8233a', weight: 9 },
    { id: 'LEMON', label: 'Lemon', glyph: '🍋', color: '#e0b81b', weight: 10 },
  ],
  payouts: [
    { id: 'jackpot-777', label: 'TRIPLE SEVENS!', match: { k: 'three', symbol: '7' }, multiplier: 50, jackpot: true },
    { id: 'triple-3bar', label: 'TRIPLE 3×BAR!', match: { k: 'three', symbol: 'BAR3' }, multiplier: 25, jackpot: true },
    { id: 'triple-bar', label: 'THREE BARS!', match: { k: 'three', symbol: 'BAR' }, multiplier: 15 },
    { id: 'three-bell', label: 'GOLDEN BELLS!', match: { k: 'three', symbol: 'BELL' }, multiplier: 12 },
    { id: 'three-clover', label: 'LUCKY CLOVERS!', match: { k: 'three', symbol: 'CLOVER' }, multiplier: 10 },
    { id: 'any-bar', label: 'MIXED BARS', match: { k: 'any-bar' }, multiplier: 8 },
    { id: 'three-cherry', label: 'TRIPLE CHERRIES!', match: { k: 'three', symbol: 'CHERRY' }, multiplier: 8 },
    { id: 'three-lemon', label: 'LEMON LINE!', match: { k: 'three', symbol: 'LEMON' }, multiplier: 5 },
    { id: 'two-cherry', label: 'DOUBLE CHERRIES', match: { k: 'two', symbol: 'CHERRY' }, multiplier: 2 },
  ],
  spinS: 0.75,
  reelStopStaggerS: 0.42,
  anticipationS: 0.55,
};

export const SLOT_TYPES: Readonly<Record<string, SlotMachineSpec>> = {
  [CLASSIC_3BAR.id]: CLASSIC_3BAR,
};

export function getSlotSpec(typeId: string): SlotMachineSpec {
  return SLOT_TYPES[typeId] ?? CLASSIC_3BAR;
}
