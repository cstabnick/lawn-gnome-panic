// Hogweed's Workshop (E17 B2): importing the module defines the interior; building it gives the Updraft spot, the door
// and the clutter.
import { describe, expect, it } from 'vitest';
import { interiorById, type PlacedInterior } from '../../interiors';
import { createKit } from '../../interiors/kit';
import { SOCIETY_INTERIORS, UNDERSPAN } from '../config';
import './workshop';

describe("Hogweed's Workshop", () => {
  it('is defined at import with the workshop door', () => {
    const placed = interiorById(SOCIETY_INTERIORS.workshop) as PlacedInterior | undefined;
    expect(placed).toBeDefined();
    expect(placed!.def.door.x).toBe(UNDERSPAN.workshopDoor.x);
    expect(placed!.def.door.z).toBe(UNDERSPAN.workshopDoor.z);
  });

  it('builds the Updraft spot, a door and the clutter', () => {
    const placed = interiorById(SOCIETY_INTERIORS.workshop)!;
    const { kit, build } = createKit(placed);
    placed.def.build(kit);

    const ride = build.spots.find((s) => s.prompt === 'Ride the Updraft');
    expect(ride).toBeDefined();
    expect(build.exitDoor).not.toBeNull();
    expect(kit.group.children.length).toBeGreaterThanOrEqual(8);
  });
});
