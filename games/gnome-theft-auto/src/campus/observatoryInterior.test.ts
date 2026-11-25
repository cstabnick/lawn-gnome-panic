// The observatory interior builds, and its telescope spot fires TELESCOPE_EVENT with night true or false by the clock.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createKit } from '../interiors/kit';
import { interiorById } from '../interiors/registry';
import { setTelescopeClock } from './observatoryInterior';
import { TELESCOPE_EVENT } from './types';

const bus = new EventTarget();
beforeAll(() => {
  vi.stubGlobal('window', {
    addEventListener: bus.addEventListener.bind(bus),
    removeEventListener: bus.removeEventListener.bind(bus),
    dispatchEvent: bus.dispatchEvent.bind(bus),
  });
});
afterEach(() => setTelescopeClock(() => null));

function lookWith(label: string | null): boolean | undefined {
  setTelescopeClock(() => label);
  const placed = interiorById('anthill-observatory')!;
  const { kit, build } = createKit(placed);
  placed.def.build(kit);
  const spot = build.spots.find((s) => s.id === 'telescope-eyepiece')!;
  let night: boolean | undefined;
  const on = (e: Event): void => { night = (e as CustomEvent).detail.night; };
  bus.addEventListener(TELESCOPE_EVENT, on);
  spot.run();
  bus.removeEventListener(TELESCOPE_EVENT, on);
  return night;
}

describe('anthill observatory interior', () => {
  it('is defined and builds', () => {
    const placed = interiorById('anthill-observatory');
    expect(placed).toBeDefined();
    const { kit, build } = createKit(placed!);
    placed!.def.build(kit);
    expect(build.exitDoor).not.toBeNull();
    expect(build.spots.some((s) => s.id === 'telescope-eyepiece')).toBe(true);
  });

  it('reports night through the telescope at Neon Night, day at Noon', () => {
    expect(lookWith('Neon Night')).toBe(true);
    expect(lookWith('Noon')).toBe(false);
    expect(lookWith(null)).toBe(false);
  });
});
