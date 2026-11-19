import { describe, expect, it, vi } from 'vitest';
import { PaintGrid, type PaintFile } from '@lawn/level';
import { paintFromFile, loadWorldPaint } from './worldPaint';

const emptyFile: PaintFile = { format: 'lawn-paint', version: 1, chunk: 64, chunks: {} };

describe('world paint file', () => {
  it('an empty file gives null', () => {
    expect(paintFromFile(emptyFile)).toBeNull();
  });

  it('round-trips a grid with painted cells through the file form', () => {
    const grid = new PaintGrid();
    grid.set(10, -5, 3);
    grid.set(70, 3, 7);
    const back = paintFromFile(grid.toJSON());
    expect(back).not.toBeNull();
    expect(back!.get(10, -5)).toBe(3);
    expect(back!.get(70, 3)).toBe(7);
    expect(back!.get(0, 0)).toBe(0);
  });

  it('a chunk of the wrong size gives null without throwing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad: PaintFile = { ...emptyFile, chunks: { '0,0': 'AAAA' } };
    expect(() => paintFromFile(bad)).not.toThrow();
    expect(paintFromFile(bad)).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('loadWorldPaint returns what the shipped file holds: null when empty, else a grid with bounds', () => {
    const g = loadWorldPaint();
    if (g === null) return;
    expect(g.isEmpty()).toBe(false);
    expect(g.bounds()).not.toBeNull();
  });
});
