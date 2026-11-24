import './globals';
import { describe, expect, it } from 'vitest';
import { QUESTS } from '../quests/defs';
import { buildSimWorld } from './harness';
import { findingKey, staticFindings, tableFindings } from './checks';
import type { Finding } from './types';

// The static content findings the quest data has today: a recorded baseline, not a wish list. A new finding fails the
// test (fix the quest data or add it here with a reason); a fixed one fails it too until it is removed from this list.
const KNOWN_STATIC: string[] = []

describe('quest static checks', () => {
  const sim = buildSimWorld();

  it('finds no static problem in the quest table beyond KNOWN_STATIC', () => {
    const found: Finding[] = [...QUESTS.flatMap((q) => staticFindings(q, sim.world)), ...tableFindings(QUESTS)];
    const keys = new Set(found.map(findingKey));
    const known = new Set(KNOWN_STATIC);
    const fresh = [...keys].filter((k) => !known.has(k));
    const gone = KNOWN_STATIC.filter((k) => !keys.has(k));
    expect(fresh, `new static findings (fix the data or add to KNOWN_STATIC):\n${fresh.join('\n')}`).toEqual([]);
    expect(gone, `fixed, remove from KNOWN_STATIC:\n${gone.join('\n')}`).toEqual([]);
  }, 60_000);
});
