// E25 Gnomazon: the stock, orders, the right box, scoring a parcel, the quota and Kippy's lines. Pure.
// STUB: issue 15 fills it in.
import type { BoxSize, Order, PackedParcel, ParcelScore, StockItem } from './types';

export const STOCK: readonly StockItem[] = [
  { id: 'trowel', name: 'Trowel', prefab: 'old-trowel', emoji: '🪛', size: 1 },
];

/** Kippy (KPI-9), the manager-bot. Encouraging. Numerically. */
export const KIPPY_LINES: Record<'start' | 'good' | 'bad' | 'idle' | 'quota' | 'end', readonly string[]> = {
  start: ['Welcome back, Associate.'],
  good: ['Great job.'],
  bad: ['Interesting choice.'],
  idle: ['I see you are resting. I am also resting. I am not resting.'],
  quota: ['Quota met.'],
  end: ['Shift complete.'],
};

export function stockItem(id: string): StockItem | undefined {
  return STOCK.find((s) => s.id === id);
}

/** The smallest box that fits `items`. */
export function rightBox(items: readonly string[]): BoxSize {
  void items;
  return 'S';
}

export function makeOrder(level: number, seed: number, id: number): Order {
  void level; void seed;
  return { id, items: ['trowel'], dest: '1 Fern Row', labels: ['1 Fern Row', '2 Fern Row', '3 Fern Row'], box: 'S' };
}

export function scoreParcel(p: PackedParcel): ParcelScore {
  void p;
  return { stars: 3, rightItems: true, rightBox: true, rightLabel: true, taped: true, line: 'Great job.' };
}

export function quotaFor(level: number): number {
  return 7 + Math.max(0, level - 1);
}
