// The big tent interior (E17 B5): door, residents, and no seating anywhere.
import { describe, expect, it } from 'vitest';
import { interiorById } from '../../interiors';
import { createKit } from '../../interiors/kit';
import { SOCIETY_INTERIORS, WADERS_REST } from '../config';
import './tent';

describe('the big tent interior', () => {
  const placed = interiorById(SOCIETY_INTERIORS.tent);

  it('is defined with the Wader\'s Rest door', () => {
    expect(placed).toBeDefined();
    expect(placed!.def.door).toEqual(WADERS_REST.tentDoor);
    expect(placed!.def.exit).toEqual(WADERS_REST.tentExit);
  });

  it('builds a door, two residents and no seating', () => {
    const { kit, build } = createKit(placed!);
    const ids: string[] = [];
    const spy = {
      ...kit,
      put: (id: string, ...rest: Parameters<typeof kit.put> extends [string, ...infer R] ? R : never) => {
        ids.push(id);
        return kit.put(id, ...rest);
      },
    };
    placed!.def.build(spy);

    expect(build.exitDoor).not.toBeNull();
    expect(build.npcs).toHaveLength(2);
    expect(build.npcs.map((n) => n.id)).toEqual(['plover', 'pipit']);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).not.toMatch(/chair|stool|bench/);
    }
  });
});
