import { describe, expect, it } from 'vitest';
import { DISHES, dishesForLevel, makeTickets, ticketStars } from './menu';
import { DISH_IDS } from './types';

describe('chef menu', () => {
  it('has every dish with at least two steps and a diner prefab id', () => {
    for (const id of DISH_IDS) {
      const dish = DISHES[id];
      expect(dish, id).toBeDefined();
      expect(dish.steps.length).toBeGreaterThanOrEqual(2);
      expect(dish.prefab).toBe(`diner-${id}`);
    }
  });

  it('unlocks dishes by level', () => {
    expect(dishesForLevel(1)).toEqual(['acorn-cake', 'dew-clover']);
    expect(dishesForLevel(5)).toEqual(DISH_IDS);
  });

  it('makes deterministic tickets of 8 or 12 with only unlocked dishes', () => {
    const a = makeTickets(2, false, 42);
    const b = makeTickets(2, false, 42);
    expect(a).toEqual(b);
    expect(a).toHaveLength(8);
    expect(makeTickets(2, true, 42)).toHaveLength(12);

    for (const t of a) {
      for (const d of t.dishes) expect(dishesForLevel(2)).toContain(d);
    }
    for (const t of makeTickets(1, true, 9)) {
      for (const d of t.dishes) expect(dishesForLevel(1)).toContain(d);
    }
  });

  it('keeps arrival times non-decreasing and at most one pie per ticket', () => {
    for (const rush of [false, true]) {
      const tickets = makeTickets(5, rush, 123);
      expect(tickets[0].arriveAt).toBe(0);
      for (let i = 1; i < tickets.length; i++) {
        expect(tickets[i].arriveAt).toBeGreaterThanOrEqual(tickets[i - 1].arriveAt);
      }
      for (const t of tickets) {
        expect(t.dishes.filter((d) => d === 'pie-of-the-day').length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('scores served tickets into stars', () => {
    expect(ticketStars([100, 100], 0, 60)).toBe(5);
    expect(ticketStars([100], 60, 60)).toBeLessThan(5);
    expect(ticketStars([], 0, 60)).toBe(1);
  });
});
