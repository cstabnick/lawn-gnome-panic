import { describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({
  play: vi.fn(),
  setEngine: vi.fn(),
  setSkid: vi.fn(),
  unlockAudio: vi.fn(),
}));
import { TAXI } from './config';
import type { Box } from './types';
import { deckApproach, dropSpot, driveToward, pickApproach, segmentClear, taxiFare } from './taxi';
import { groundAt, heightAt } from './terrain';

const box = (minX: number, maxX: number, minZ: number, maxZ: number, h: number): Box => ({ minX, maxX, minZ, maxZ, h });

describe('deckApproach', () => {
  it('comes along the deck when the player stands on it, and not when they are under it', () => {
    const d = groundAt(0, -60);
    const onDeck = deckApproach(0, -60, d);
    expect(onDeck).not.toBeNull();
    if (!onDeck) return;
    // The start is on the Skyway's centre line (z near -60) 25..35 m from the player.
    expect(Math.abs(onDeck.z + 60)).toBeLessThan(6);
    const gap = Math.hypot(onDeck.x, onDeck.z + 60);
    expect(gap).toBeGreaterThanOrEqual(25);
    expect(gap).toBeLessThanOrEqual(35);
    // The street under the deck is not the deck.
    expect(deckApproach(0, -60, heightAt(0, -60))).toBeNull();
  });
});

describe('taxiFare', () => {
  it('is the base fare at the stop and grows with distance, capped', () => {
    expect(taxiFare(0)).toBe(10);
    expect(taxiFare(500)).toBe(30);
    expect(taxiFare(5000)).toBe(60);
  });
});

describe('segmentClear', () => {
  const tall = box(0, 10, -5, 5, 3);

  it('is false when the segment crosses a tall box', () => {
    expect(segmentClear([tall], -5, 0, 15, 0, 0)).toBe(false);
  });

  it('is true beside the box', () => {
    expect(segmentClear([tall], -5, 8, 15, 8, 0)).toBe(true);
  });

  it('ignores a box lower than 0.5', () => {
    expect(segmentClear([box(0, 10, -5, 5, 0.3)], -5, 0, 15, 0, 0)).toBe(true);
  });

  it('counts the padding', () => {
    expect(segmentClear([tall], -5, 7, 15, 7, 0)).toBe(true);
    expect(segmentClear([tall], -5, 7, 15, 7, 2.5)).toBe(false);
  });
});

describe('driveToward', () => {
  it('reaches a target 20 units away without overshooting', () => {
    const v = { x: 0, z: 0, yaw: 0, speed: 0 };
    let rem = 20;
    for (let i = 0; i < 200; i++) {
      rem = driveToward(v, 20, 0, 10, 0.05);
      expect(v.x).toBeLessThanOrEqual(20 + 1e-9);
      if (rem < 0.01) break;
    }
    expect(rem).toBeLessThan(0.5);
    expect(v.speed).toBe(10);
  });
});

describe('pickApproach', () => {
  it('spawns 30 away and stops TAXI.stopDist from the player when nothing is in the way', () => {
    const p = pickApproach([], 100, 100, () => 0, () => false);
    expect(Math.hypot(p.x - 100, p.z - 100)).toBeCloseTo(30);
    expect(Math.hypot(p.stopX - 100, p.stopZ - 100)).toBeCloseTo(TAXI.stopDist);
  });

  it('picks a clear spot when boxes ring the player at 30 with one gap', () => {
    const boxes: Box[] = [];
    for (let k = 1; k < 12; k++) {
      const a = (k * 2 * Math.PI) / 12;
      const x = Math.sin(a) * 30;
      const z = Math.cos(a) * 30;
      boxes.push(box(x - 1, x + 1, z - 1, z + 1, 2));
    }
    const p = pickApproach(boxes, 0, 0, () => 0, () => false);
    const inside = boxes.some((b) => p.x >= b.minX - 2.5 && p.x <= b.maxX + 2.5 && p.z >= b.minZ - 2.5 && p.z <= b.maxZ + 2.5);
    expect(inside).toBe(false);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(30);
  });
});

describe('dropSpot', () => {
  it('stops TAXI.dropOffset from the spawn and faces the stop', () => {
    const spawn = { x: 40, z: -20 };
    const spot = dropSpot([], spawn);
    expect(Math.hypot(spot.stop.x - spawn.x, spot.stop.z - spawn.z)).toBeCloseTo(TAXI.dropOffset);
    const facing = Math.atan2(spot.stop.x - spot.from.x, spot.stop.z - spot.from.z);
    expect(facing).toBeCloseTo(spot.from.yaw);
  });
});
