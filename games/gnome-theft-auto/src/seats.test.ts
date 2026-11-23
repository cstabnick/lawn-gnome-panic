import { describe, expect, it } from 'vitest';
import { MOUNT, VEHICLES } from './config';
import { exitLocal, exitSeconds, exitSide, isClosed, passengerCount, seatPos, SeatBook } from './seats';
import type { VehicleKind, VehicleSpec } from './types';

describe('exit spots', () => {
  it('the lowrider\'s four seats each get out at their own spot, at least 0.5 apart', () => {
    const spots = [0, 1, 2, 3].map((s) => exitLocal(VEHICLES.lowrider, s));
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        expect(Math.hypot(spots[i].x - spots[j].x, spots[i].z - spots[j].z)).toBeGreaterThanOrEqual(0.5);
      }
    }
  });

  it('a seat on the right of the centre line (x < -0.05) gets out on the right', () => {
    for (const kind of Object.keys(VEHICLES) as VehicleKind[]) {
      const spec = VEHICLES[kind];
      const seats = 1 + (spec.passengerSeats?.length ?? 0);
      for (let s = 0; s < seats; s++) {
        if (seatPos(spec, s)[0] < -0.05) {
          expect(exitSide(spec, s)).toBe(-1);
          expect(exitLocal(spec, s).x).toBeLessThan(0);
        }
      }
    }
  });

  it('a hoa-van driver gets out at the left door\'s ground spot', () => {
    const spec = VEHICLES['hoa-van'];
    const door = spec.doors![0];
    expect(isClosed(spec)).toBe(true);
    const e = exitLocal(spec, 0);
    expect(e.x).toBeCloseTo(Math.abs(door.at[0]) + MOUNT.standOff, 6);
    expect(e.z).toBeCloseTo(door.at[2], 6);
  });

  it('no two seats of any vehicle get out at the same spot (at least 0.5 apart)', () => {
    for (const [kind, spec] of Object.entries(VEHICLES) as [VehicleKind, VehicleSpec][]) {
      if (isClosed(spec)) continue; // closed vehicles: one door per side, riders queue through it
      const spots = [0, ...(spec.passengerSeats ?? []).map((_, i) => i + 1)].map((s) => exitLocal(spec, s));
      for (let i = 0; i < spots.length; i++) {
        for (let j = i + 1; j < spots.length; j++) {
          const d = Math.hypot(spots[i].x - spots[j].x, spots[i].z - spots[j].z);
          expect(d, `${kind} seats ${i} and ${j}`).toBeGreaterThanOrEqual(0.5);
        }
      }
    }
  });

  it('every vehicle takes a positive time to get out of', () => {
    for (const kind of Object.keys(VEHICLES) as VehicleKind[]) {
      expect(exitSeconds(VEHICLES[kind])).toBeGreaterThan(0);
    }
  });
});

const spec = (extra: Partial<VehicleSpec> = {}): VehicleSpec => ({ ...VEHICLES['ride-on'], ...extra });

describe('seatPos', () => {
  it('seat 0 is the driver seat', () => {
    expect(seatPos(spec(), 0)).toEqual(VEHICLES['ride-on'].seat);
  });

  it('seat k is passengerSeats[k - 1]', () => {
    const s = spec({ passengerSeats: [[1, 2, 3], [4, 5, 6]] });
    expect(seatPos(s, 1)).toEqual([1, 2, 3]);
    expect(seatPos(s, 2)).toEqual([4, 5, 6]);
  });

  it('an unknown seat falls back to the driver seat', () => {
    const s = spec({ passengerSeats: [[1, 2, 3]] });
    expect(seatPos(s, 5)).toEqual(s.seat);
    expect(seatPos(spec({ passengerSeats: undefined }), 1)).toEqual(VEHICLES['ride-on'].seat);
  });
});

describe('passengerCount', () => {
  it('counts only the passenger seats', () => {
    expect(passengerCount(spec({ passengerSeats: [[0, 0, 0], [1, 0, 0]] }))).toBe(2);
    expect(passengerCount(spec({ passengerSeats: undefined }))).toBe(0);
  });

  it('every mower has a sensible seat plan: distinct passenger seats, not on the driver seat', () => {
    for (const s of Object.values(VEHICLES)) {
      const seatsList = s.passengerSeats ?? [];
      expect(seatsList.length, `${s.kind} passengers`).toBeLessThanOrEqual(4);
      const keys = new Set(seatsList.map((p) => p.join(',')));
      expect(keys.size, `${s.kind} has duplicate seats`).toBe(seatsList.length);
      for (const p of seatsList) expect(p.join(','), `${s.kind} seat on the driver`).not.toBe(s.seat.join(','));
    }
  });
});

describe('SeatBook', () => {
  it('hands out the lowest free passenger seat and keeps it for the same rider', () => {
    const book = new SeatBook();
    book.reset(2);
    expect(book.take(10)).toBe(1);
    expect(book.take(11)).toBe(2);
    expect(book.take(10)).toBe(1);
  });

  it('says -1 when the vehicle is full', () => {
    const book = new SeatBook();
    book.reset(1);
    expect(book.take(10)).toBe(1);
    expect(book.take(11)).toBe(-1);
  });

  it('a freed seat goes to the next rider', () => {
    const book = new SeatBook();
    book.reset(2);
    book.take(10);
    book.take(11);
    book.free(10);
    expect(book.take(12)).toBe(1);
    expect(book.riders().sort()).toEqual([11, 12]);
  });

  it('reset drops everyone and sets the new capacity', () => {
    const book = new SeatBook();
    book.reset(1);
    book.take(10);
    book.reset(3);
    expect(book.riders()).toEqual([]);
    expect(book.take(10)).toBe(1);
    expect(book.take(11)).toBe(2);
    expect(book.take(12)).toBe(3);
    expect(book.take(13)).toBe(-1);
  });

  it('with no capacity nobody gets in', () => {
    const book = new SeatBook();
    expect(book.take(10)).toBe(-1);
  });
});
