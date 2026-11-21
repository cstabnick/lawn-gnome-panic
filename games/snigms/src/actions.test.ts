import { describe, expect, it, vi } from 'vitest';
import { buyItem, buildEdges, paintFloor, relocateItem, sellItem } from './actions';
import { COST, SELL_RATIO, FURNITURE } from './config';
import { newHousehold } from './sim';
import type { App } from './types';

function fakeApp(funds = 1000): App {
  const h = newHousehold({ householdName: 'x', gnomeName: 'y', trait: 'neat', lot: 'empty' });
  h.funds = funds;
  return {
    h,
    mode: 'build',
    speed: 0,
    tool: { tool: 'select', kind: null, floor: 'wood', rot: 0 },
    selected: null,
    walls: 'cut',
    activity: '',
    lotChanged: vi.fn(),
    stateChanged: vi.fn(),
    toast: vi.fn(),
    sfx: vi.fn(),
    event: vi.fn(),
  };
}

describe('buyItem', () => {
  it('places the item, charges the price and raises first-furniture once', () => {
    const app = fakeApp(1000);
    const item = buyItem(app, 'bed', 2, 2, 0);
    expect(item?.kind).toBe('bed');
    expect(app.h.funds).toBe(1000 - FURNITURE.bed.price);
    expect(app.event).toHaveBeenCalledWith('first-furniture');
    expect(app.sfx).toHaveBeenCalledWith('place');
    expect(app.lotChanged).toHaveBeenCalled();

    buyItem(app, 'lamp', 6, 6, 0);
    expect(vi.mocked(app.event).mock.calls.filter((c) => c[0] === 'first-furniture')).toHaveLength(1);
  });

  it('raises spent-big for a purchase of 150 acorns or more', () => {
    const app = fakeApp(1000);
    buyItem(app, 'bathtub', 2, 2, 0);
    expect(app.event).toHaveBeenCalledWith('spent-big');
  });

  it('refuses without the funds, with a toast and the deny sound', () => {
    const app = fakeApp(10);
    expect(buyItem(app, 'bed', 2, 2, 0)).toBeNull();
    expect(app.toast).toHaveBeenCalledWith('Not enough acorns');
    expect(app.sfx).toHaveBeenCalledWith('deny');
    expect(app.h.funds).toBe(10);
    expect(app.h.lot.items).toHaveLength(0);
  });

  it('refuses a spot that cannot take the item', () => {
    const app = fakeApp(1000);
    buyItem(app, 'bed', 2, 2, 0);
    expect(buyItem(app, 'lamp', 2, 2, 0)).toBeNull();
    expect(app.toast).toHaveBeenCalledWith('Cannot place there');
  });
});

describe('sellItem', () => {
  it('refunds SELL_RATIO of the price and clears the selection', () => {
    const app = fakeApp(1000);
    const item = buyItem(app, 'bed', 2, 2, 0)!;
    app.selected = item.id;
    const before = app.h.funds;
    expect(sellItem(app, item.id)).toBe(true);
    expect(app.h.funds).toBe(before + Math.round(FURNITURE.bed.price * SELL_RATIO));
    expect(app.selected).toBeNull();
    expect(app.h.lot.items).toHaveLength(0);
  });

  it('returns false for an unknown id', () => {
    expect(sellItem(fakeApp(), 999)).toBe(false);
  });
});

describe('relocateItem', () => {
  it('moves an item for free', () => {
    const app = fakeApp(1000);
    const item = buyItem(app, 'lamp', 2, 2, 0)!;
    const before = app.h.funds;
    expect(relocateItem(app, item.id, 5, 5, 0)).toBe(true);
    expect(app.h.funds).toBe(before);
  });
});

describe('buildEdges', () => {
  it('builds walls at COST.wall each and raises first-wall once', () => {
    const app = fakeApp(1000);
    expect(buildEdges(app, ['h:2,2', 'h:3,2'], 'wall')).toBe(2);
    expect(app.h.funds).toBe(1000 - 2 * COST.wall);
    expect(app.event).toHaveBeenCalledWith('first-wall');

    vi.mocked(app.event).mockClear();
    expect(buildEdges(app, ['h:4,2'], 'wall')).toBe(1);
    expect(app.event).not.toHaveBeenCalledWith('first-wall');
  });

  it('charges nothing for edges that already have the kind', () => {
    const app = fakeApp(1000);
    buildEdges(app, ['h:2,2'], 'wall');
    const before = app.h.funds;
    expect(buildEdges(app, ['h:2,2'], 'wall')).toBe(0);
    expect(app.h.funds).toBe(before);
  });

  it('refuses a door on an empty edge and builds nothing there', () => {
    const app = fakeApp(1000);
    expect(buildEdges(app, ['h:2,2'], 'door')).toBe(0);
    expect(app.toast).toHaveBeenCalledWith('Doors and windows go in a wall');
    expect(app.h.lot.edges['h:2,2']).toBeUndefined();
  });

  it('replaces a wall with a door for COST.door', () => {
    const app = fakeApp(1000);
    buildEdges(app, ['h:2,2'], 'wall');
    const before = app.h.funds;
    expect(buildEdges(app, ['h:2,2'], 'door')).toBe(1);
    expect(app.h.lot.edges['h:2,2']).toBe('door');
    expect(app.h.funds).toBe(before - COST.door);
  });

  it('builds only what the funds cover and says so', () => {
    const app = fakeApp(7);
    expect(buildEdges(app, ['h:2,2', 'h:3,2'], 'wall')).toBe(1);
    expect(app.toast).toHaveBeenCalledWith('Not enough acorns');
    expect(app.h.funds).toBe(7 - COST.wall);
  });

  it('erases edges with a 70% refund', () => {
    const app = fakeApp(1000);
    buildEdges(app, ['h:2,2'], 'wall');
    const before = app.h.funds;
    expect(buildEdges(app, ['h:2,2'], null)).toBe(1);
    expect(app.h.lot.edges['h:2,2']).toBeUndefined();
    expect(app.h.funds).toBe(before + Math.round(COST.wall * SELL_RATIO));
  });
});

describe('paintFloor', () => {
  it('paints tiles at COST.floor each', () => {
    const app = fakeApp(1000);
    expect(paintFloor(app, [{ tx: 0, ty: 0 }, { tx: 1, ty: 0 }], 'wood')).toBe(2);
    expect(app.h.lot.floors['0,0']).toBe('wood');
    expect(app.h.funds).toBe(1000 - 2 * COST.floor);
  });

  it('painting lawn is free and clears the floor', () => {
    const app = fakeApp(1000);
    paintFloor(app, [{ tx: 0, ty: 0 }], 'tile');
    const before = app.h.funds;
    expect(paintFloor(app, [{ tx: 0, ty: 0 }], 'lawn')).toBe(1);
    expect(app.h.lot.floors['0,0']).toBeUndefined();
    expect(app.h.funds).toBe(before);
  });

  it('refuses with no funds left', () => {
    const app = fakeApp(1);
    expect(paintFloor(app, [{ tx: 0, ty: 0 }], 'stone')).toBe(0);
    expect(app.toast).toHaveBeenCalledWith('Not enough acorns');
  });
});
