import { describe, expect, it } from 'vitest';
import { allGnomeokemon } from '../prefabs/registry';
import { EMPTY_LINES, GRADE_LINES, INTRO_LINES, JUDGING_LINES, OUTRO_LINES, SPECIAL_LINES, SPECIES_LINES, SUBMIT_LINES, linesFor, pickLine } from './jesus';
import type { PhotoRecord } from './types';

describe('Gnome Jesus lines', () => {
  it('has lots of lines per grade', () => {
    for (const grade of ['Divine', 'Gold', 'Silver', 'Bronze'] as const) {
      expect(GRADE_LINES[grade].length).toBeGreaterThanOrEqual(12);
      expect(OUTRO_LINES[grade].length).toBeGreaterThanOrEqual(3);
    }
    expect(INTRO_LINES.length).toBeGreaterThanOrEqual(10);
    expect(JUDGING_LINES.length).toBeGreaterThanOrEqual(10);
    expect(SUBMIT_LINES.length).toBeGreaterThanOrEqual(6);
    expect(EMPTY_LINES.length).toBeGreaterThanOrEqual(6);
  });

  it('gives every Gnomokemon at least three lines of its own, and only for real ids', () => {
    const ids = new Set(allGnomeokemon().map((e) => e.prefab.id));
    for (const id of ids) expect(SPECIES_LINES[id]?.length ?? 0, id).toBeGreaterThanOrEqual(3);
    for (const id of Object.keys(SPECIES_LINES)) expect(ids.has(id), id).toBe(true);
  });

  it('has no empty, duplicated or overlong lines', () => {
    const all = [
      ...INTRO_LINES, ...SUBMIT_LINES, ...JUDGING_LINES, ...EMPTY_LINES,
      ...Object.values(GRADE_LINES).flat(), ...Object.values(OUTRO_LINES).flat(),
      ...Object.values(SPECIAL_LINES).flat(), ...Object.values(SPECIES_LINES).flat(),
    ];
    expect(new Set(all).size).toBe(all.length);
    for (const l of all) {
      expect(l.trim().length).toBeGreaterThan(5);
      expect(l.length, l).toBeLessThanOrEqual(150);
    }
  });

  it('does not repeat a line until the pool is used up', () => {
    const pool = ['a', 'b', 'c'];
    const seen = new Set([pickLine(pool), pickLine(pool), pickLine(pool)]);
    expect(seen.size).toBe(3);
  });

  it('says the species line first, then a grade line', () => {
    const pic = {
      speciesId: 'sproutling',
      score: { grade: 'Gold', specialLabels: ['Snack Time! (+600)'] },
    } as unknown as PhotoRecord;
    const out = linesFor(pic, () => 0);
    expect(SPECIES_LINES.sproutling).toContain(out.verdict[0]);
    expect(GRADE_LINES.Gold).toContain(out.verdict[1]);
    expect(SPECIAL_LINES['Snack Time']).toContain(out.verdict[2]);
  });
});
