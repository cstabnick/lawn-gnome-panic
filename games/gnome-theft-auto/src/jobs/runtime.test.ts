import { describe, expect, it } from 'vitest';
import { freeSeats, kindsFor, needText, vehicleOk } from './runtime';
import { perksFor } from './defs';
import type { VehicleSpec } from '../types';

// Minimal spec stand-ins: only the fields the helpers read.
const spec = (o: { flies?: boolean; boat?: boolean; seats?: number }): VehicleSpec => ({
  flies: !!o.flies,
  boat: o.boat,
  passengerSeats: Array.from({ length: o.seats ?? 0 }, () => [0, 0, 0] as [number, number, number]),
} as unknown as VehicleSpec);

describe('vehicleOk', () => {
  it('taxi needs a ground car with a spare seat', () => {
    expect(vehicleOk('taxi', spec({ seats: 1 }), 'car' as never)).toBe(true);
    expect(vehicleOk('taxi', spec({ seats: 0 }), 'car' as never)).toBe(false);
    expect(vehicleOk('taxi', spec({ seats: 2, flies: true }), 'car' as never)).toBe(false);
    expect(vehicleOk('taxi', spec({ seats: 2, boat: true }), 'car' as never)).toBe(false);
  });

  it('courier takes any ground vehicle', () => {
    expect(vehicleOk('courier', spec({}), 'push-bike')).toBe(true);
    expect(vehicleOk('courier', spec({ flies: true }), 'push-bike')).toBe(false);
  });

  it('pilot takes aircraft only', () => {
    expect(vehicleOk('pilot', spec({ flies: true }), 'car' as never)).toBe(true);
    expect(vehicleOk('pilot', spec({}), 'car' as never)).toBe(false);
  });

  it('boat takes boats, never a tow tube', () => {
    expect(vehicleOk('boat', spec({ boat: true }), 'gravy-boat')).toBe(true);
    expect(vehicleOk('boat', spec({ boat: true }), 'tow-tube')).toBe(false);
    expect(vehicleOk('boat', spec({}), 'car' as never)).toBe(false);
  });
});

describe('needText', () => {
  it('names the vehicle each job needs', () => {
    expect(needText('taxi')).toBe('Get in a car with a spare seat.');
    expect(needText('courier')).toBe('Get in any car, cart or bike.');
    expect(needText('pilot')).toBe('Get in an aircraft.');
    expect(needText('boat')).toBe('Get in a boat.');
  });
});

describe('freeSeats', () => {
  it('lists seats not taken, highest first', () => {
    expect(freeSeats(4, [2])).toEqual([4, 3, 1]);
    expect(freeSeats(3, [])).toEqual([3, 2, 1]);
  });

  it('is empty when every seat is taken or there are none', () => {
    expect(freeSeats(2, [1, 2])).toEqual([]);
    expect(freeSeats(0, [])).toEqual([]);
  });
});

describe('kindsFor', () => {
  it('taxi gets street fares only, never player calls', () => {
    expect(kindsFor('taxi', perksFor('taxi', 5), { boat: false })).toEqual(['fare']);
  });

  it('courier gets routes', () => {
    expect(kindsFor('courier', perksFor('courier', 1), { boat: false })).toEqual(['route']);
  });

  it('pilot unlocks kinds by level', () => {
    expect(kindsFor('pilot', perksFor('pilot', 1), { boat: false })).toEqual(['charter']);
    expect(kindsFor('pilot', perksFor('pilot', 3), { boat: false })).toEqual(['charter', 'scenic', 'cargo']);
  });

  it('boat kinds need a boat', () => {
    expect(kindsFor('boat', perksFor('boat', 2), { boat: true })).toEqual(['water-taxi', 'ferry']);
    expect(kindsFor('boat', perksFor('boat', 2), { boat: false })).toEqual([]);
  });
});
