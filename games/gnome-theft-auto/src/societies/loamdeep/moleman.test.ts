// DJ Moleman's burrow (E17 B12): the hidden interior is defined, and building it gives the listen and back-up spots.
import { describe, expect, it } from 'vitest';
import { interiorById } from '../../interiors';
import { createKit } from '../../interiors/kit';
import { MOLEMAN_BURROW, SOCIETY_INTERIORS } from '../config';
import './moleman';

describe("DJ Moleman's burrow", () => {
  it('is defined as a hidden interior of the Moleman size', () => {
    const placed = interiorById(SOCIETY_INTERIORS.moleman);
    expect(placed).toBeDefined();
    expect(placed!.def.hiddenDoor).toBe(true);
    expect(placed!.def.name).toBe("DJ Moleman's Burrow");
    expect(placed!.def.size).toEqual(MOLEMAN_BURROW.size);
  });

  it('builds the listen and back-up spots', () => {
    const placed = interiorById(SOCIETY_INTERIORS.moleman)!;
    const { kit, build } = createKit(placed);
    placed.def.build(kit);

    const listen = build.spots.find((s) => s.prompt === 'Listen at the decks');
    expect(listen).toBeDefined();
    expect(listen!.x).toBeCloseTo(MOLEMAN_BURROW.decks[0], 5);
    expect(listen!.z).toBeCloseTo(MOLEMAN_BURROW.decks[1] + 1.6, 5);

    const back = build.spots.find((s) => s.prompt === 'Back up the Long Tunnel');
    expect(back).toBeDefined();
    expect(back!.x).toBeCloseTo(MOLEMAN_BURROW.stairsBack[0], 5);
    expect(back!.z).toBeCloseTo(MOLEMAN_BURROW.stairsBack[1], 5);

    expect(build.spawn).toEqual({ x: MOLEMAN_BURROW.arrive[0], z: MOLEMAN_BURROW.arrive[1], yaw: Math.PI });
  });
});
