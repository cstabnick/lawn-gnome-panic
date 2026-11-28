import { describe, expect, it } from 'vitest';
import { pickBanter, type BanterTopic } from './banter';
import type { CpuTier } from './cpu';

const TIERS: CpuTier[] = ['casual', 'regular', 'shark', 'cracked'];
const TOPICS: BanterTopic[] = [
  'matchStart',
  'cpuPot',
  'cpuMultiPot',
  'cpuMiss',
  'cpuFoul',
  'playerPot',
  'playerMiss',
  'playerFoul',
  'cpuWin',
  'playerWin',
  'nag',
  'highWager',
  'bankShot',
  'matchPoint',
  'comeback',
];

describe('CPU banter', () => {
  it('returns non-empty lines with all template tokens replaced for every tier and topic', () => {
    for (const tier of TIERS) {
      for (const topic of TOPICS) {
        const line = pickBanter(tier, topic, { player: 'Gnoman', wager: 50 });
        expect(line.length, `${tier}.${topic} empty`).toBeGreaterThan(0);
        expect(line, `${tier}.${topic} leftover token`).not.toMatch(/\{[a-z]+\}/i);
      }
    }
  });
});
