import { describe, it, expect } from 'vitest';
import { THROW, type NpcId, type ResultKind, type ThrowInput } from './config';
import { NPCS, NPC_ORDER, npcQuip, npcThrow, type NpcProfile } from './npc';
import { simulateThrow } from './physics';

const FULL = Array.from({ length: 10 }, () => true);
const ONLY_TEN = FULL.map((_, p) => p === 9);
const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Deterministic 0..1 generator (Park-Miller). */
function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A random leave: each pin standing with probability 0.6, from the same seed. */
function randomLeave(seed: number): boolean[] {
  const rand = seeded(seed * 7919);
  return Array.from({ length: 10 }, () => rand() < 0.6);
}

function knocked(throwIn: ThrowInput, standing: readonly boolean[]): number {
  const r = simulateThrow(throwIn, standing);
  return r.down.filter((d, p) => d && standing[p]).length;
}

function averageOnFullRack(profile: NpcProfile): number {
  const total = SEEDS.reduce((sum, seed) => sum + knocked(npcThrow(profile, FULL, seeded(seed)), FULL), 0);
  return total / SEEDS.length;
}

const KINDS: ResultKind[] = ['strike', 'double', 'turkey', 'hambone', 'spare', 'gutter', 'miss', 'split', 'nine', 'pins'];

describe('npcThrow', () => {
  it('always returns a throw inside THROW ranges, for every NPC, full rack and random leaves', () => {
    for (const id of NPC_ORDER) {
      const profile = NPCS[id];
      for (const seed of SEEDS.slice(0, 10)) {
        const full = npcThrow(profile, FULL, seeded(seed));
        const leave = npcThrow(profile, randomLeave(seed), seeded(seed + 100));
        for (const t of [full, leave]) {
          expect(Math.abs(t.x)).toBeLessThanOrEqual(THROW.xRange);
          expect(Math.abs(t.aim)).toBeLessThanOrEqual(THROW.aimRange);
          expect(t.speed).toBeGreaterThanOrEqual(THROW.speedMin);
          expect(t.speed).toBeLessThanOrEqual(THROW.speedMax);
          expect(t.spin).toBeGreaterThanOrEqual(-1);
          expect(t.spin).toBeLessThanOrEqual(1);
        }
      }
    }
  }, 60000);

  it('Robo-Gnome 3000 averages at least 8 pins on a full rack', () => {
    expect(averageOnFullRack(NPCS.robo)).toBeGreaterThanOrEqual(8);
  }, 60000);

  it("Robo-Gnome 3000 averages more pins than Gnome Chad on a full rack", () => {
    expect(averageOnFullRack(NPCS.robo)).toBeGreaterThan(averageOnFullRack(NPCS.chad));
  }, 60000);

  it('Robo-Gnome 3000 picks up a lone 10 pin in at least 6 of 12 seeds', () => {
    const hits = SEEDS.filter((seed) => knocked(npcThrow(NPCS.robo, ONLY_TEN, seeded(seed)), ONLY_TEN) >= 1).length;
    expect(hits).toBeGreaterThanOrEqual(6);
  }, 60000);
});

describe('npcQuip', () => {
  it('returns a non-empty string or null for every NPC and every ResultKind', () => {
    for (const id of Object.keys(NPCS) as NpcId[]) {
      for (const kind of KINDS) {
        for (let i = 0; i < 5; i++) {
          const line = npcQuip(id, kind, 0);
          expect(line === null || (typeof line === 'string' && line.length > 0)).toBe(true);
        }
      }
    }
  });
});
