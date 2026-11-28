// Pardonlin's two walk-in rooms: registered, doors inside Pardonlin, and both build in node (missing new prefabs are skipped).
import { describe, expect, it } from 'vitest';
import { listInteriors } from '../interiors';
import { createKit } from '../interiors/kit';
import { PL_INTERIOR_IDS } from './interiors';

describe('Pardonlin interiors', () => {
  it('registers both rooms with doors inside Pardonlin', () => {
    const all = listInteriors();
    for (const id of PL_INTERIOR_IDS) {
      const p = all.find((i) => i.def.id === id);
      expect(p, id).toBeTruthy();
      expect(p!.def.door.x).toBeGreaterThan(-1800);
      expect(p!.def.door.x).toBeLessThan(-1398);
    }
  });

  it('builds each room with an NPC, spots and the exit', () => {
    for (const id of PL_INTERIOR_IDS) {
      const p = listInteriors().find((i) => i.def.id === id)!;
      const { kit, build } = createKit(p);
      p.def.build(kit);
      expect(build.npcs.length).toBeGreaterThan(0);
      expect(build.spots.length).toBeGreaterThan(1);
      expect(build.exitDoor).not.toBeNull();
    }
  });
});
