// The CPU gnomes who sit at the table, and the dealer. Data only: banter lines live in banter.ts (keyed by these ids).
import { GNORMAN_LOOK, type GnomeLook } from '@lawn/gnome';

/** How a CPU plays. cautious: stands on 12+ against a dealer 2-6, 15+ otherwise. normal: basic-ish (stand 17+, or 13+ vs 2-6).
 *  reckless: hits until 18, doubles on any 9-11. */
export type Style = 'cautious' | 'normal' | 'reckless';

export interface Character {
  id: string;
  name: string;
  look: GnomeLook;
  /** Mutter base pitch, Hz (deep: 70..140). */
  voice: number;
  style: Style;
  /** Seat colour. */
  color: number;
  /** Usual bet. */
  bet: number;
}

const look = (o: Partial<GnomeLook>): GnomeLook => ({ ...GNORMAN_LOOK, ...o });

export const CHARACTERS: Record<string, Character> = {
  gnorbert: { id: 'gnorbert', name: 'Gnorbert', voice: 78, style: 'cautious', color: 0x6fa8ff, bet: 5,
    look: look({ hat: 0x2f5fd9, shirt: 0x8a6a3a, beard: 0xdddddd, glasses: true }) },
  gnadine: { id: 'gnadine', name: 'Gnadine', voice: 132, style: 'reckless', color: 0xff6fd0, bet: 25,
    look: look({ hat: 0xc23ab0, shirt: 0x3ab08a, beard: null, hair: { color: 0xe0a040, style: 'pigtails' }, dress: true, freckles: true }) },
  grumbo: { id: 'grumbo', name: 'Grumbo', voice: 70, style: 'normal', color: 0xffb38a, bet: 10,
    look: look({ hat: 0x5a3a2a, shirt: 0x444444, beard: 0x7a5a3a }) },
  pebble: { id: 'pebble', name: 'Lil Pebble', voice: 140, style: 'reckless', color: 0xc6ff4a, bet: 10,
    look: look({ hat: 0x4ac23a, shirt: 0xe0d040, beard: null, freckles: true }) },
  thistle: { id: 'thistle', name: 'Auntie Thistle', voice: 118, style: 'cautious', color: 0xa98bff, bet: 5,
    look: look({ hat: 0x7a4ad9, shirt: 0xd9d9d9, beard: null, hair: { color: 0xcccccc, style: 'pigtails' }, dress: true, glasses: true }) },
  moss: { id: 'moss', name: 'Mossimo', voice: 92, style: 'normal', color: 0x5cff7a, bet: 15,
    look: look({ hat: 0x1f7a3a, shirt: 0x202020, beard: 0x202020 }) },
};

/** Order CPUs are seated in (an empty seat takes the first character not already at the table). */
export const CPU_ORDER: readonly string[] = ['gnorbert', 'gnadine', 'grumbo', 'pebble', 'thistle', 'moss'];

/** The dealer gnome (not a seat). */
export const DEALER_CHAR = { name: 'Old Gnick', voice: 74, look: look({ hat: 0x111111, shirt: 0xf4f4f4, pants: 0x111111, beard: 0xf4f4f4 }) } as const;
