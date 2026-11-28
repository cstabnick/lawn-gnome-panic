// Loamdeep's runtime (E17 issue J4): the job spots and lamps the room gets, and the part's quiet state in node.
import { describe, expect, it, vi } from 'vitest';
import type { PlacedInterior } from '../../interiors/registry';
import { INTERIOR_THEMES } from '../../interiors/registry';
import { createKit } from '../../interiors/kit';
import type { SocietyDeps } from '../config';
import { buildJobSpots, installLoamdeep } from './runtime';

function fakePlaced(): PlacedInterior {
  return {
    def: {
      id: 'loamdeep',
      name: 'Loamdeep',
      door: { x: 0, z: 0, yaw: 0 },
      exit: { x: 0, z: 0, yaw: 0 },
      size: { w: 104, d: 90, h: 4 },
      theme: 'burrow',
      build() {},
    },
    origin: { x: 5100, y: 0, z: 5100 },
    large: true,
    theme: INTERIOR_THEMES.burrow,
  };
}

describe('Loamdeep job spots', () => {
  it('adds the roots, taper, lamp, sorting and dig spots', () => {
    const { kit, build } = createKit(fakePlaced());
    kit.room();
    buildJobSpots(kit);
    const count = (prompt: string): number => build.spots.filter((s) => s.prompt === prompt).length;
    expect(count('Roots (Root Run)')).toBe(1);
    expect(count('Drop the roots')).toBe(5);
    expect(count('Take a taper (Lamplighter)')).toBe(1);
    expect(count('Light the lamp')).toBe(12);
    expect(count('Sort the post (Post Sorting)')).toBe(1);
    expect(count('Dig a nook (Dig a Nook)')).toBe(3);
  });

  it('adds 24 lamp objects (a lit and an unlit one per lamp point)', () => {
    const { kit } = createKit(fakePlaced());
    kit.room();
    buildJobSpots(kit);
    let lamps = 0;
    kit.group.traverse((o) => {
      if (o.name === 'loamdeep-lamp-lit' || o.name === 'loamdeep-lamp-dark') lamps++;
    });
    expect(lamps).toBe(24);
  });
});

describe('installLoamdeep', () => {
  it('starts with nothing open and no speaker outside Loamdeep', () => {
    const deps = {
      hud: { toast: vi.fn() },
      economy: { earn: vi.fn() },
      ui: {},
    } as unknown as SocietyDeps;
    const part = installLoamdeep(deps);
    expect(part.isOpen?.()).toBe(false);
    expect(part.speaker?.(0, 0)).toBeNull();
    expect(part.blips?.()).toEqual([]);
  });
});
