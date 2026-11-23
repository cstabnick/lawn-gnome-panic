// Interior tracker: which building the player is in, which storey, what the camera and view cut away. Pure: no three.js, no DOM.
import type { Bus } from './bus';
import type { Vec3 } from '../world/collide';
import type { BuildingIndex } from '../world/spaces';
import type { BuildingParts } from '../world/buildingTypes';
import { INTERIOR } from '../config';

export interface InteriorState { building: string | null; storey: number; skip: ReadonlySet<string>; ceilY: number | null; door: string | null }
export interface InteriorTracker { readonly state: InteriorState; update(pos: Vec3, dt: number): void }

const EMPTY: ReadonlySet<string> = new Set<string>();

export function createInteriorTracker(deps: { index: BuildingIndex; bus: Bus }): InteriorTracker {
  const { index, bus } = deps;
  const state: InteriorState = { building: null, storey: 0, skip: EMPTY, ceilY: null, door: null };
  let first = true;
  let cur: BuildingParts | null = null;   // the building the state refers to
  let skipFor: { building: string; storey: number } | null = null;

  const nearestDoor = (b: BuildingParts, pos: Vec3): string | null => {
    let best: string | null = null;
    let bestD = Infinity;
    for (const d of b.doors) {
      const dd = Math.hypot(d.x - pos.x, d.z - pos.z);
      if (dd < bestD) { bestD = dd; best = d.id; }
    }
    return best;
  };

  const leave = (): void => {
    const building = state.building;
    state.building = null;
    state.door = null;
    cur = null;
    skipFor = null;
    if (building !== null) bus.emit('left-building', { building });
  };

  const enter = (b: BuildingParts, pos: Vec3, silent: boolean): void => {
    state.building = b.def.id;
    state.door = nearestDoor(b, pos);
    cur = b;
    skipFor = null;
    if (!silent) bus.emit('entered-building', { building: b.def.id, region: b.def.region, door: state.door });
  };

  return {
    state,
    update(pos: Vec3): void {
      const wasFirst = first;
      first = false;

      // exit: left the footprint of the building we are in (padded, so the doorway itself does not flicker)
      if (state.building !== null) {
        const fp = index.footprintAt(pos.x, pos.y, pos.z, INTERIOR.exitPad);
        if (!fp || fp.def.id !== state.building) leave();
      }

      // enter: deep enough inside an interior rect
      const inside = index.insideAt(pos.x, pos.y, pos.z, INTERIOR.enterInset);
      if (inside && state.building !== inside.def.id) enter(inside, pos, wasFirst);

      if (cur !== null && state.building !== null) {
        const storey = index.storeyAt(cur, pos.y);
        if (!skipFor || skipFor.building !== cur.def.id || skipFor.storey !== storey) {
          state.skip = new Set(cur.cut[storey] ?? []);
          skipFor = { building: cur.def.id, storey };
        }
        state.storey = storey;
        state.ceilY = index.ceilingAt(cur, storey);
      } else {
        state.storey = 0;
        state.skip = EMPTY;
        state.ceilY = null;
      }
    },
  };
}
