import { describe, expect, it, vi } from 'vitest';
import { DeltaGrid, type DeltaFile } from '@lawn/level';
import { deltasFromFile, loadWorldDeltas } from './worldDeltas';

const emptyFile: DeltaFile = { format: 'lawn-deltas', version: 1, chunk: 64, unit: 0.01, chunks: {} };

describe('world deltas file', () => {
  it('an empty file gives null', () => {
    expect(deltasFromFile(emptyFile)).toBeNull();
  });

  it('round-trips a grid with edits through the file form', () => {
    const grid = new DeltaGrid();
    grid.setUnits(10, -5, 250);
    grid.setUnits(70, 3, -40);
    const back = deltasFromFile(grid.toJSON());
    expect(back).not.toBeNull();
    expect(back!.getUnits(10, -5)).toBe(250);
    expect(back!.getUnits(70, 3)).toBe(-40);
    expect(back!.getUnits(0, 0)).toBe(0);
  });

  it('a chunk of the wrong size gives null without throwing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad: DeltaFile = { ...emptyFile, chunks: { '0,0': 'AAAA' } };
    expect(() => deltasFromFile(bad)).not.toThrow();
    expect(deltasFromFile(bad)).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('loadWorldDeltas returns what the shipped file holds: null when empty, else a grid with at least one value', () => {
    const g = loadWorldDeltas();
    if (g === null) return;
    expect(g.isEmpty()).toBe(false);
    const b = g.bounds();
    expect(b).not.toBeNull();
  });
});
