import { describe, expect, it } from 'vitest';
import { VEHICLES } from './config';
import { passengerCount, seatPos, SeatBook } from './seats';
import type { VehicleSpec } from './types';

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
