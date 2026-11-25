// The Burrowfolk's halls (E17 B11): the moles and their talk spots are placed, and the animation runs without errors.
import { describe, expect, it } from 'vitest';
import type { PlacedInterior } from '../../interiors/registry';
import { INTERIOR_THEMES } from '../../interiors/registry';
import { createKit } from '../../interiors/kit';
import { LOAMDEEP, SOCIETY_CAST } from '../config';
import { buildMoleFolk, updateMoleFolk } from './folk';

function fakePlaced(): PlacedInterior {
  return {
    def: {
      id: 'loamdeep',
      name: 'Loamdeep',
      door: { x: 0, z: 0, yaw: 0 },
      exit: { x: 0, z: 0, yaw: 0 },
      size: LOAMDEEP.size,
      theme: 'burrow',
      build() {},
    },
    origin: { x: 5100, y: 0, z: 5100 },
    large: true,
    theme: INTERIOR_THEMES.shop,
  };
}

/** Every point of LOAMDEEP.spots (the interact points), flattened. */
function spotPoints(): [number, number][] {
  const s = LOAMDEEP.spots;
  const out: [number, number][] = [];
  const add = (p: readonly [number, number]) => out.push([p[0], p[1]]);
  add(s.tumblesoil); add(s.tumblesoilFront); add(s.rootPickup); add(s.taper); add(s.sortingDesk);
  add(s.decks); add(s.danceFloor); add(s.longTunnel); add(s.longTunnelArrive);
  for (const p of Object.values(s.rootDrops)) add(p);
  for (const p of s.digFaces) add(p);
  for (const p of s.speakers) add(p);
  return out;
}

describe('Loamdeep folk', () => {
  it('places at least 12 moles and the Tumblesoil talk spot', () => {
    const { kit, build } = createKit(fakePlaced());
    kit.room();
    const before = kit.group.children.length;
    buildMoleFolk(kit);
    expect(kit.group.children.length - before).toBeGreaterThanOrEqual(12);
    expect(build.spots.some((s) => s.prompt === 'Talk to ' + SOCIETY_CAST.tumblesoil)).toBe(true);
    expect(build.spots.some((s) => s.prompt === 'Talk to Old Mother Tumblesoil')).toBe(true);
  });

  it('keeps every talk spot at least 1.0 m from the interact points', () => {
    const { kit, build } = createKit(fakePlaced());
    kit.room();
    buildMoleFolk(kit);
    const talks = build.spots.filter((s) => s.prompt.startsWith('Talk to '));
    expect(talks.length).toBeGreaterThanOrEqual(8);
    const points = spotPoints();
    for (const t of talks) {
      for (const [x, z] of points) {
        expect(Math.hypot(t.x - x, t.z - z)).toBeGreaterThanOrEqual(1.0);
      }
    }
  });

  it('animates without throwing, inside and outside Loamdeep', () => {
    expect(() => updateMoleFolk(0.016, 1)).not.toThrow();
  });
});
