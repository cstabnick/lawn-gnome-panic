// Player actions that cost or refund acorns. Tools (pointer) and UI (buttons) both call these; nothing else edits the lot.
// Each action checks funds, edits app.h, then calls app.lotChanged() / app.stateChanged(),
// plays app.sfx, and shows app.toast(reason) with sfx 'deny' when it refuses.
import { COST, FLOORS, FURNITURE, SELL_RATIO } from './config';
import { canPlace, edgeInBounds, moveItem, placeItem, removeItem, setEdges } from './world';
import type { App, EdgeKey, EdgeKind, FloorKind, PlacedItem, Rot } from './types';

/** ui.ts asks for the job picker through this module; the logic lives in sim.ts. */
export { setJob } from './sim';

const hasKey = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

function refuse(app: App, msg: string): void {
  app.toast(msg);
  app.sfx('deny');
}

/** Buy and place a FURNITURE kind. Needs funds >= price and canPlace. Raises app.event('first-furniture') on the first item. */
export function buyItem(app: App, kind: string, tx: number, ty: number, rot: Rot): PlacedItem | null {
  if (!hasKey(FURNITURE, kind)) return null;
  const def = FURNITURE[kind];
  const lot = app.h.lot;
  if (app.h.funds < def.price) {
    refuse(app, 'Not enough acorns');
    return null;
  }
  if (!canPlace(lot, kind, tx, ty, rot)) {
    refuse(app, 'Cannot place there');
    return null;
  }
  const first = lot.items.length === 0;
  const item = placeItem(lot, kind, tx, ty, rot);
  if (!item) {
    refuse(app, 'Cannot place there');
    return null;
  }
  app.h.funds -= def.price;
  if (first) app.event('first-furniture');
  if (def.price >= 150) app.event('spent-big');
  app.sfx('place');
  app.lotChanged();
  return item;
}

/** Sell an item for SELL_RATIO of its price; clears app.selected if it was selected. */
export function sellItem(app: App, id: number): boolean {
  const lot = app.h.lot;
  const item = lot.items.find((i) => i.id === id);
  if (!item || !hasKey(FURNITURE, item.kind)) return false;
  if (!removeItem(lot, id)) return false;
  app.h.funds += Math.round(FURNITURE[item.kind].price * SELL_RATIO);
  if (app.selected === id) app.selected = null;
  app.sfx('sell');
  app.lotChanged();
  return true;
}

/** Move or turn an item for free (canPlace with ignoreId). */
export function relocateItem(app: App, id: number, tx: number, ty: number, rot: Rot): boolean {
  const lot = app.h.lot;
  const item = lot.items.find((i) => i.id === id);
  if (!item) return false;
  if (!canPlace(lot, item.kind, tx, ty, rot, id) || !moveItem(lot, id, tx, ty, rot)) {
    refuse(app, 'Cannot place there');
    return false;
  }
  app.sfx('place');
  app.lotChanged();
  return true;
}

/** Build `kind` along the edges (charges COST[kind] only for edges that change) or, with kind null, erase them (refunds 70%). Doors and windows replace a wall edge only; a door or window on an empty edge is refused. */
export function buildEdges(app: App, keys: EdgeKey[], kind: EdgeKind | null): number {
  const lot = app.h.lot;
  const unique = [...new Set(keys)].filter((k) => edgeInBounds(lot, k));

  if (kind === null) {
    const existing = unique.filter((k) => lot.edges[k] !== undefined);
    if (existing.length === 0) return 0;
    let refund = 0;
    for (const k of existing) refund += COST[lot.edges[k]] * SELL_RATIO;
    const changed = setEdges(lot, existing, null);
    app.h.funds += Math.round(refund);
    app.sfx('sell');
    app.lotChanged();
    return changed;
  }

  const needsWall = kind === 'door' || kind === 'window';
  if (needsWall && unique.some((k) => lot.edges[k] === undefined)) {
    refuse(app, 'Doors and windows go in a wall');
  }
  const eligible = unique.filter((k) => lot.edges[k] !== kind && (!needsWall || lot.edges[k] === 'wall'));
  if (eligible.length === 0) return 0;

  const hadWall = Object.values(lot.edges).includes('wall');
  const cost = COST[kind];
  const built: EdgeKey[] = [];
  let funds = app.h.funds;
  for (const k of eligible) {
    if (funds < cost) break;
    funds -= cost;
    built.push(k);
  }
  if (built.length === 0) {
    refuse(app, 'Not enough acorns');
    return 0;
  }
  if (built.length < eligible.length) app.toast('Not enough acorns');

  const changed = setEdges(lot, built, kind);
  app.h.funds -= changed * cost;
  if (kind === 'wall' && !hadWall && changed > 0) app.event('first-wall');
  app.sfx(kind === 'door' ? 'door' : 'wall');
  app.lotChanged();
  return changed;
}

/** Paint floor tiles (COST.floor each for tiles whose floor changes; painting 'lawn' is free). */
export function paintFloor(app: App, tiles: { tx: number; ty: number }[], floor: FloorKind): number {
  const lot = app.h.lot;
  if (!(FLOORS as string[]).includes(floor)) return 0;
  const seen = new Set<string>();
  const changing: { tx: number; ty: number; key: string }[] = [];
  for (const t of tiles) {
    if (t.tx < 0 || t.ty < 0 || t.tx >= lot.w || t.ty >= lot.h) continue;
    const key = `${t.tx},${t.ty}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if ((lot.floors[key] ?? 'lawn') !== floor) changing.push({ tx: t.tx, ty: t.ty, key });
  }
  if (changing.length === 0) return 0;

  const cost = floor === 'lawn' ? 0 : COST.floor;
  let funds = app.h.funds;
  let painted = 0;
  for (const t of changing) {
    if (funds < cost) break;
    funds -= cost;
    if (floor === 'lawn') delete lot.floors[t.key];
    else lot.floors[t.key] = floor;
    painted += 1;
  }
  if (painted === 0) {
    refuse(app, 'Not enough acorns');
    return 0;
  }
  if (painted < changing.length) app.toast('Not enough acorns');
  app.h.funds -= painted * cost;
  app.sfx('place');
  app.lotChanged();
  return painted;
}
