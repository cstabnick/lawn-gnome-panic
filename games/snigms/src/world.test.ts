import { describe, expect, it } from 'vitest';
import {
  approachTile,
  canPlace,
  carpoolTile,
  detectRooms,
  edgesBetween,
  findPath,
  itemAt,
  lotValue,
  moveItem,
  newLot,
  placeItem,
  removeItem,
  roomAt,
  setEdges,
  starterLot,
  type Tile,
} from './world';

describe('edgesBetween', () => {
  it('runs east along the horizontal axis from a', () => {
    expect(edgesBetween({ vx: 0, vy: 0 }, { vx: 3, vy: 0 })).toEqual(['h:0,0', 'h:1,0', 'h:2,0']);
  });
  it('runs west from a, starting next to a', () => {
    expect(edgesBetween({ vx: 3, vy: 0 }, { vx: 0, vy: 0 })).toEqual(['h:2,0', 'h:1,0', 'h:0,0']);
  });
  it('runs south along the vertical axis', () => {
    expect(edgesBetween({ vx: 2, vy: 1 }, { vx: 2, vy: 4 })).toEqual(['v:2,1', 'v:2,2', 'v:2,3']);
  });
  it('snaps a diagonal drag to its dominant axis', () => {
    expect(edgesBetween({ vx: 0, vy: 0 }, { vx: 2, vy: 1 })).toEqual(['h:0,0', 'h:1,0']);
    expect(edgesBetween({ vx: 0, vy: 0 }, { vx: 1, vy: 2 })).toEqual(['v:0,0', 'v:0,1']);
  });
  it('gives horizontal on a tie', () => {
    expect(edgesBetween({ vx: 0, vy: 0 }, { vx: 2, vy: 2 })).toEqual(['h:0,0', 'h:1,0']);
  });
  it('is empty for the same vertex', () => {
    expect(edgesBetween({ vx: 4, vy: 4 }, { vx: 4, vy: 4 })).toEqual([]);
  });
});

describe('setEdges', () => {
  it('counts only real changes and skips out-of-bounds keys', () => {
    const lot = newLot(6, 4);
    expect(setEdges(lot, ['h:0,0', 'h:1,0'], 'wall')).toBe(2);
    expect(setEdges(lot, ['h:0,0'], 'wall')).toBe(0);
    expect(setEdges(lot, ['h:0,0'], 'door')).toBe(1);
    expect(setEdges(lot, ['h:9,9', 'v:9,0'], 'wall')).toBe(0);
    expect(setEdges(lot, ['h:0,0', 'h:1,0'], null)).toBe(2);
    expect(setEdges(lot, ['h:0,0'], null)).toBe(0);
    expect(lot.edges).toEqual({});
  });
});

describe('canPlace and placing', () => {
  it('refuses out of bounds and accepts a rotated bed that fits', () => {
    const lot = newLot(6, 6);
    expect(canPlace(lot, 'bed', 5, 5, 0)).toBe(false); // bed 1 x 2 hangs off the south edge
    expect(canPlace(lot, 'bed', 4, 0, 1)).toBe(true); // rot 1: 2 wide, 1 deep
    expect(canPlace(lot, 'bed', 0, 0, 0)).toBe(true);
  });

  it('refuses overlap with a solid item and allows a solid item beside it', () => {
    const lot = newLot(6, 6);
    expect(placeItem(lot, 'bed', 1, 1, 0)).not.toBeNull(); // (1,1) and (1,2)
    expect(canPlace(lot, 'toilet', 1, 2, 0)).toBe(false);
    expect(canPlace(lot, 'toilet', 2, 1, 0)).toBe(true);
  });

  it('lets a rug sit under a solid item but not on another rug', () => {
    const lot = newLot(6, 6);
    expect(placeItem(lot, 'rug', 0, 0, 0)).not.toBeNull(); // 2 x 2
    expect(canPlace(lot, 'bed', 0, 0, 0)).toBe(true);
    expect(canPlace(lot, 'rug', 1, 1, 0)).toBe(false);
    placeItem(lot, 'toilet', 0, 0, 0);
    expect(itemAt(lot, 0, 0)?.kind).toBe('toilet'); // solid preferred over flat
    expect(itemAt(lot, 1, 1)?.kind).toBe('rug');
  });

  it('refuses a solid item whose footprint is cut by a wall or window, but allows a door', () => {
    const lot = newLot(6, 6);
    // bed at (2,3) rot 0 covers (2,3) and (2,4); the edge between them is h:2,4
    setEdges(lot, ['h:2,4'], 'wall');
    expect(canPlace(lot, 'bed', 2, 3, 0)).toBe(false);
    setEdges(lot, ['h:2,4'], 'window');
    expect(canPlace(lot, 'bed', 2, 3, 0)).toBe(false);
    setEdges(lot, ['h:2,4'], 'door');
    expect(canPlace(lot, 'bed', 2, 3, 0)).toBe(true);
  });

  it('assigns ids, removes, and moves with an ignoreId check', () => {
    const lot = newLot(6, 6);
    const a = placeItem(lot, 'toilet', 2, 1, 0);
    const b = placeItem(lot, 'bed', 4, 4, 0);
    expect(a?.id).toBe(1);
    expect(b?.id).toBe(2);
    expect(lot.nextId).toBe(3);
    expect(moveItem(lot, 1, 4, 4, 0)).toBe(false); // onto the bed
    expect(moveItem(lot, 1, 2, 1, 0)).toBe(true); // onto itself
    expect(moveItem(lot, 1, 0, 0, 0)).toBe(true);
    expect(itemAt(lot, 0, 0)?.id).toBe(1);
    expect(removeItem(lot, 2)?.kind).toBe('bed');
    expect(removeItem(lot, 2)).toBeNull();
    expect(itemAt(lot, 4, 4)).toBeNull();
  });
});

describe('findPath', () => {
  // A 6 x 4 lot with a wall down vertex column x=3.
  const wallColumn = (lot: ReturnType<typeof newLot>, rows: number[]) =>
    setEdges(lot, rows.map((y) => `v:3,${y}`), 'wall');

  it('goes around a wall through the open end', () => {
    const lot = newLot(6, 4);
    wallColumn(lot, [0, 1, 2]);
    const p = findPath(lot, { tx: 0, ty: 0 }, { tx: 5, ty: 0 });
    expect(p).not.toBeNull();
    expect(p).toContainEqual({ tx: 3, ty: 3 });
  });

  it('is null when a full wall blocks the way', () => {
    const lot = newLot(6, 4);
    wallColumn(lot, [0, 1, 2, 3]);
    expect(findPath(lot, { tx: 0, ty: 0 }, { tx: 5, ty: 0 })).toBeNull();
  });

  it('passes through a door', () => {
    const lot = newLot(6, 4);
    wallColumn(lot, [0, 1, 2, 3]);
    setEdges(lot, ['v:3,1'], 'door');
    const p = findPath(lot, { tx: 0, ty: 1 }, { tx: 5, ty: 1 });
    expect(p).not.toBeNull();
    expect(p).toContainEqual({ tx: 3, ty: 1 });
  });

  it('is blocked by a window', () => {
    const lot = newLot(6, 4);
    wallColumn(lot, [0, 2, 3]);
    setEdges(lot, ['v:3,1'], 'window');
    expect(findPath(lot, { tx: 0, ty: 1 }, { tx: 5, ty: 1 })).toBeNull();
  });

  it('needs allowGoalSolid to end on a solid tile', () => {
    const lot = newLot(6, 4);
    placeItem(lot, 'toilet', 5, 3, 0);
    expect(findPath(lot, { tx: 0, ty: 0 }, { tx: 5, ty: 3 })).toBeNull();
    expect(findPath(lot, { tx: 0, ty: 0 }, { tx: 5, ty: 3 }, true)).not.toBeNull();
  });
});

describe('approachTile', () => {
  it('uses the tile in front of the item (rot 0 faces south, rot 2 north)', () => {
    const lot = newLot(6, 6);
    const toilet = placeItem(lot, 'toilet', 2, 2, 0)!;
    expect(approachTile(lot, toilet)).toEqual({ tx: 2, ty: 3 });
    const north = placeItem(lot, 'sink', 4, 4, 2)!;
    expect(approachTile(lot, north)).toEqual({ tx: 4, ty: 3 });
  });

  it('falls back to a free side when the front is walled off', () => {
    const lot = newLot(6, 6);
    const toilet = placeItem(lot, 'toilet', 2, 2, 0)!;
    setEdges(lot, ['h:2,3'], 'wall');
    const t = approachTile(lot, toilet);
    expect(t).not.toBeNull();
    expect(t).not.toEqual({ tx: 2, ty: 3 });
  });

  it('is null when boxed in', () => {
    const lot = newLot(3, 3);
    const toilet = placeItem(lot, 'toilet', 1, 1, 0)!;
    setEdges(lot, ['h:1,1', 'h:1,2', 'v:1,1', 'v:2,1'], 'wall');
    expect(approachTile(lot, toilet)).toBeNull();
  });
});

describe('detectRooms', () => {
  // A 4 x 3 room at tiles x 2..5, y 2..4 inside a 10 x 10 lot.
  const boxWalls = (lot: ReturnType<typeof newLot>) => {
    const keys: string[] = [];
    for (let x = 2; x < 6; x++) keys.push(`h:${x},2`, `h:${x},5`);
    for (let y = 2; y < 5; y++) keys.push(`v:2,${y}`, `v:6,${y}`);
    setEdges(lot, keys, 'wall');
  };

  it('finds a closed box as one enclosed room with its kind', () => {
    const lot = newLot(10, 10);
    boxWalls(lot);
    placeItem(lot, 'bed', 2, 2, 0);
    const rooms = detectRooms(lot);
    const enclosed = rooms.filter((r) => r.enclosed);
    expect(enclosed).toHaveLength(1);
    expect(enclosed[0].tiles).toHaveLength(12);
    expect(enclosed[0].kind).toBe('bedroom');
    expect(rooms).toHaveLength(2); // the outside is a region too, not enclosed
    expect(roomAt(rooms, 3, 3)?.enclosed).toBe(true);
    expect(roomAt(rooms, 0, 0)?.enclosed).toBe(false);
  });

  it('is not enclosed with one open gap', () => {
    const lot = newLot(10, 10);
    boxWalls(lot);
    setEdges(lot, ['v:6,3'], null);
    expect(detectRooms(lot).filter((r) => r.enclosed)).toHaveLength(0);
  });

  it('keeps a walled box with a door to the lawn as its own enclosed room', () => {
    const lot = newLot(10, 10);
    boxWalls(lot);
    setEdges(lot, ['h:3,5'], 'door');
    const enclosed = detectRooms(lot).filter((r) => r.enclosed);
    expect(enclosed).toHaveLength(1);
    expect(enclosed[0].tiles).toHaveLength(12);
  });

  it('a door on a wall splits two rooms, both enclosed', () => {
    const lot = newLot(10, 10);
    boxWalls(lot);
    setEdges(lot, ['v:4,2', 'v:4,3', 'v:4,4'], 'wall');
    setEdges(lot, ['v:4,3'], 'door');
    const enclosed = detectRooms(lot).filter((r) => r.enclosed);
    expect(enclosed).toHaveLength(2);
  });
});

describe('starterLot', () => {
  it('has a south door, two windows and an interior door', () => {
    const lot = starterLot();
    expect(lot.edges['h:11,12']).toBe('door');
    expect(lot.edges['h:13,6']).toBe('window');
    expect(lot.edges['v:16,8']).toBe('window');
    expect(lot.edges['v:12,10']).toBe('door');
    expect(lot.edges['v:12,9']).toBe('wall');
    expect(lot.floors['9,8']).toBe('tile');
    expect(lot.floors['13,8']).toBe('wood');
  });

  it('joins the narrow west room to the main room through the interior door', () => {
    const lot = starterLot();
    const west: Tile = { tx: 9, ty: 8 };
    const main: Tile = { tx: 13, ty: 8 };
    const path = findPath(lot, west, main);
    expect(path).not.toBeNull();
    expect(path).toContainEqual({ tx: 12, ty: 10 });

    const walled = starterLot();
    setEdges(walled, ['v:12,10'], 'wall');
    expect(findPath(walled, west, main)).toBeNull();
    const rooms = detectRooms(walled);
    expect(roomAt(rooms, 9, 8)?.id).not.toBe(roomAt(rooms, 13, 8)?.id);
  });

  it('has a path from the carpool stop through the front door', () => {
    const lot = starterLot();
    const p = findPath(lot, carpoolTile(lot), { tx: 11, ty: 11 });
    expect(p).not.toBeNull();
    expect(p).toContainEqual({ tx: 11, ty: 12 });
  });
});

describe('lotValue', () => {
  it('sums the prices of the items on the lot', () => {
    const lot = newLot(6, 6);
    placeItem(lot, 'toilet', 0, 0, 0); // 70
    placeItem(lot, 'bed', 2, 2, 0); // 120
    expect(lotValue(lot)).toBe(190);
    removeItem(lot, 1);
    expect(lotValue(lot)).toBe(120);
  });
});
