// Room colliders for the cutscene LOS check: the back wall and bookshelves of the mulch club, and no side walls outdoors.
import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';

installFakeDom();
const { roomColliders } = await import('./rooms');

describe('roomColliders', () => {
  it('mulch-club has its back wall', () => {
    const wall = roomColliders('mulch-club').find((b) => Math.abs(b.minZ - -6.7) < 0.05 && Math.abs(b.h - 4.2) < 0.05);
    expect(wall).toBeDefined();
  });

  it('mulch-club has a box for each bookshelf', () => {
    const boxes = roomColliders('mulch-club');
    for (const x of [-3.6, 3.6]) {
      const shelf = boxes.find((b) => Math.abs((b.minX + b.maxX) / 2 - x) < 0.6 && Math.abs((b.minZ + b.maxZ) / 2 + 6.1) < 0.8);
      expect(shelf, `bookshelf at x=${x}`).toBeDefined();
    }
  });

  it('street has no side walls', () => {
    const boxes = roomColliders('street');
    expect(boxes.filter((b) => b.maxX > 7)).toEqual([]);
  });

  it('skips the floor and the ceiling', () => {
    for (const room of ['mulch-club', 'street'] as const) {
      const boxes = roomColliders(room);
      expect(boxes.every((b) => b.h > 0.05)).toBe(true);
      // The ceiling sits at 4.2 to 4.4 m, so it is dropped while the 4.2 m walls stay.
      expect(boxes.some((b) => b.h >= 4.3)).toBe(false);
    }
  });

  it('caches per room', () => {
    expect(roomColliders('side-valve')).toBe(roomColliders('side-valve'));
  });
});
