// Cards and the shoe: pure functions, deterministic from a seed.
import { DECKS, type Card } from './config';

/** mulberry32: returns [0, 1) and advances st.seed (kept a 32-bit unsigned integer). */
export function rand(st: { seed: number }): number {
  st.seed = (st.seed + 0x6D2B79F5) >>> 0;
  let t = st.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const SUITS: Card['s'][] = ['S', 'H', 'D', 'C'];

/** DECKS shuffled decks (Fisher-Yates with rand(st)). */
export function newShoe(st: { seed: number }): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < DECKS; d++) {
    for (const s of SUITS) {
      for (let r = 1; r <= 13; r++) shoe.push({ r, s });
    }
  }
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(rand(st) * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

/** Best total (aces count 11 when that does not bust); soft = an ace is counting 11. */
export function handTotal(cards: Card[]): { total: number; soft: boolean } {
  let sum = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.r === 1) {
      aces++;
      sum += 1;
    } else {
      sum += c.r >= 10 ? 10 : c.r;
    }
  }
  if (aces > 0 && sum + 10 <= 21) return { total: sum + 10, soft: true };
  return { total: sum, soft: false };
}

/** Exactly two cards totalling 21. */
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21;
}

const RANK_LABEL: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const SUIT_LABEL: Record<Card['s'], string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/** 'A♠', '10♥', 'K♦', 'Q♣'. */
export function cardLabel(c: Card): string {
  return (RANK_LABEL[c.r] ?? String(c.r)) + SUIT_LABEL[c.s];
}
