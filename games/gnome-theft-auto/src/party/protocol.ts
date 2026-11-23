// Parties on the wire. GTA free roam has no host: every player relays their own state, so a party is just a shared
// code. Each player broadcasts the code of the party they are in ('' = none); everyone who shows the same code is in
// the same party. Invites carry the code; party chat and pings go to each member directly. net.ts carries these as
// { k: 'pty', d: PartyMsg }.
import { CHAT_MAX, censorText, tidyText } from '@lawn/mp/textFilter';

/**
 * 'code' = the party I am in ('' = none); broadcast on change and resent to each player who joins.
 * 'inv'  = join my party (sent to one player). 'say' = a party chat line. 'ping' = look here (world x/z).
 */
export type PartyMsg =
  | { o: 'code'; c: string }
  | { o: 'inv'; c: string }
  | { o: 'say'; m: string }
  | { o: 'ping'; x: number; z: number };

/** Most players in one party (me included). */
export const PARTY_MAX = 8;
/** A party code: four letters with no vowels, so a random one never spells a word. */
export const PARTY_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';
export const PARTY_CODE_RE = /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/;

/** A fresh random party code. */
export function newPartyCode(rand: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += PARTY_LETTERS[Math.floor(rand() * PARTY_LETTERS.length) % PARTY_LETTERS.length];
  return s;
}

/** A typed-in code made canonical (trimmed, upper case), or null when it is not a valid code. */
export function normaliseCode(raw: string): string | null {
  const c = raw.trim().toUpperCase();
  return PARTY_CODE_RE.test(c) ? c : null;
}

/** A chat line made safe to show: tidied, censored, cut to CHAT_MAX. null when empty. */
export function cleanChat(raw: string): string | null {
  const t = tidyText(raw);
  if (!t) return null;
  return censorText(t).slice(0, CHAT_MAX);
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Read a PartyMsg off the wire; anything malformed is null. */
export function parsePartyMsg(d: unknown): PartyMsg | null {
  if (typeof d !== 'object' || d === null) return null;
  const o = d as Record<string, unknown>;
  if (o.o === 'code' && typeof o.c === 'string' && (o.c === '' || PARTY_CODE_RE.test(o.c))) return { o: 'code', c: o.c };
  if (o.o === 'inv' && typeof o.c === 'string' && PARTY_CODE_RE.test(o.c)) return { o: 'inv', c: o.c };
  if (o.o === 'say' && typeof o.m === 'string' && o.m.length <= CHAT_MAX * 2) {
    const m = cleanChat(o.m);
    return m ? { o: 'say', m } : null;
  }
  if (o.o === 'ping' && isNum(o.x) && isNum(o.z) && Math.abs(o.x) <= 700 && Math.abs(o.z) <= 700) {
    return { o: 'ping', x: o.x, z: o.z };
  }
  return null;
}
