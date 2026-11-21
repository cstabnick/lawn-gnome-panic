// The gnome's autonomy: pick a need, walk to the furniture that fixes it, use it, go to work and come home.
import { FURNITURE, SPEEDS, WALK_SPEED } from './config';
import { advance, dayOf, endShiftDue, finishShift, pickNeed, shiftDue, startShift } from './sim';
import type { SimEvent } from './sim';
import { approachTile, carpoolTile, facingYaw, findPath, isWalkable, itemCenter } from './world';
import type { Tile } from './world';
import type { App, GnomePuppet, Lot, NeedId, PlacedItem, UseDef } from './types';

export type BrainState = 'idle' | 'walking' | 'using' | 'working';

export interface Brain {
  readonly state: BrainState;
  /** Call every frame. dt = real seconds (walking, animation); simMinutes = game minutes to advance (0 when paused). The brain calls sim.advance itself. */
  update(dt: number, simMinutes: number): void;
  /** The player clicked a placed item in live mode: go and use it now (or toast why not). */
  commandUse(itemId: number): void;
  /** The lot changed under the gnome: re-plan the current path, or drop the plan if the target vanished or is unreachable. */
  replan(): void;
}

type Purpose = 'work' | 'use' | 'wander';

interface Choice {
  item: PlacedItem;
  name: string;
  use: UseDef;
  approach: Tile;
  path: Tile[];
}

const NO_FURNITURE: Record<NeedId, string> = {
  hunger: 'So hungry... a fridge would help',
  energy: 'So tired... a bed would help',
  bladder: 'Need a toilet!',
  hygiene: 'Feeling grubby. A sink or shower would help',
  fun: 'So bored. A telly or a sofa would help',
};

const NEED_OK = 95;

function nearestWalkable(lot: Lot, tx: number, ty: number): Tile | null {
  if (isWalkable(lot, tx, ty)) return { tx, ty };
  for (let r = 1; r <= 24; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (isWalkable(lot, tx + dx, ty + dy)) return { tx: tx + dx, ty: ty + dy };
      }
    }
  }
  return null;
}

export function createBrain(app: App, puppet: GnomePuppet): Brain {
  const lot0 = app.h.lot;
  const start = nearestWalkable(lot0, Math.floor(lot0.w / 2), Math.floor(lot0.h / 2)) ?? { tx: 0, ty: 0 };

  let state: BrainState = 'idle';
  // Gnome world position in tile units: x east, z south. Tile (tx, ty) has its centre at (tx + 0.5, ty + 0.5).
  let gx = start.tx + 0.5;
  let gz = start.ty + 0.5;
  let path: Tile[] = [];
  let stepIdx = 0;
  let purpose: Purpose = 'wander';
  let target: Tile = start; // walking destination, or the approach tile while using
  let targetItemId: number | null = null;
  let useDef: UseDef | null = null;
  let useElapsed = 0;
  let decideIn = 0;
  let wanderIn = 2;
  let firstShiftSeen = false;
  const toastedKeys = new Set<string>();

  puppet.setPosition(gx, gz);
  puppet.setFacing(0);
  puppet.setPose('stand');
  puppet.setVisible(app.h.gnome.workUntil === null);

  const setActivity = (s: string) => {
    if (app.activity !== s) app.activity = s;
  };
  const cur = (): Tile => ({ tx: Math.floor(gx), ty: Math.floor(gz) });
  const setPos = () => puppet.setPosition(gx, gz);
  const findItem = (id: number | null): PlacedItem | null =>
    id === null ? null : app.h.lot.items.find((i) => i.id === id) ?? null;

  const handle = (events: SimEvent[]) => {
    for (const e of events) {
      if (e.type === 'bills') {
        app.toast(`Bills: -${e.amount} acorns${e.paid ? '' : " (can't pay!)"}`);
        app.stateChanged();
      }
    }
  };

  const toastOnce = (key: string, msg: string) => {
    if (toastedKeys.has(key)) return;
    toastedKeys.add(key);
    app.toast(msg);
  };

  const goIdle = (label = 'Hanging around') => {
    state = 'idle';
    path = [];
    purpose = 'wander';
    targetItemId = null;
    useDef = null;
    puppet.setPose('stand');
    setActivity(label);
    decideIn = 0;
  };

  const startWalk = (p: Tile[], why: Purpose, dest: Tile, itemId: number | null, use: UseDef | null, label: string) => {
    path = p;
    stepIdx = 0;
    purpose = why;
    target = dest;
    targetItemId = itemId;
    useDef = use;
    state = 'walking';
    puppet.setPose('walk');
    setActivity(label);
  };

  /** Walks along the path for dt real seconds (sped up by fast-forward). Returns true when the path is done. */
  const moveAlong = (dt: number, simMinutes: number): boolean => {
    const mult = dt > 0 ? Math.max(1, simMinutes / dt / SPEEDS[1]) : 1;
    let budget = WALK_SPEED * dt * mult;
    while (budget > 0 && stepIdx < path.length) {
      const t = path[stepIdx];
      const tx = t.tx + 0.5;
      const tz = t.ty + 0.5;
      const dx = tx - gx;
      const dz = tz - gz;
      const d = Math.hypot(dx, dz);
      if (d > 1e-6) puppet.setFacing(Math.atan2(dx, dz));
      if (d <= budget) {
        gx = tx;
        gz = tz;
        budget -= d;
        stepIdx++;
      } else {
        gx += (dx / d) * budget;
        gz += (dz / d) * budget;
        budget = 0;
      }
    }
    setPos();
    return stepIdx >= path.length;
  };

  const satisfied = (use: UseDef): boolean =>
    Object.entries(use.rates).every(([k, v]) => !((v ?? 0) > 0) || app.h.gnome.needs[k as NeedId] >= NEED_OK);

  const finishUse = () => {
    const spot = nearestWalkable(app.h.lot, target.tx, target.ty) ?? cur();
    gx = spot.tx + 0.5;
    gz = spot.ty + 0.5;
    setPos();
    goIdle();
  };

  const endWork = () => {
    const h = app.h;
    const res = finishShift(h);
    let msg = `Back from work: +${res.pay} acorns`;
    if (!res.good) msg += ' (a grumpy shift: no progress)';
    if (res.promoted) msg += ` Promoted to ${res.title}!`;
    app.toast(msg);
    app.sfx('coin');
    if (res.promoted) app.event('promoted');
    if (!firstShiftSeen) {
      firstShiftSeen = true;
      app.event('first-shift');
    }
    const c = carpoolTile(h.lot);
    gx = c.tx + 0.5;
    gz = c.ty + 0.5;
    setPos();
    puppet.setVisible(true);
    goIdle();
    app.stateChanged();
  };

  const startWork = (): boolean => {
    const lot = app.h.lot;
    const dest = carpoolTile(lot);
    const p = findPath(lot, cur(), dest);
    if (!p) return false;
    startWalk(p, 'work', dest, null, null, 'Heading to work');
    return true;
  };

  const onArrive = () => {
    const h = app.h;
    if (purpose === 'work') {
      if (shiftDue(h)) {
        startShift(h);
        state = 'working';
        puppet.setVisible(false);
        setActivity('At work');
      } else {
        goIdle();
      }
      return;
    }
    if (purpose === 'wander') {
      goIdle();
      return;
    }
    // purpose 'use': the gnome has reached the approach tile
    const item = findItem(targetItemId);
    const def = item ? FURNITURE[item.kind] : undefined;
    const use = def?.use;
    if (!item || !def || !use) {
      goIdle();
      return;
    }
    if (use.cost && h.funds < use.cost) {
      app.toast(`Can't afford the ${def.name.toLowerCase()}`);
      goIdle();
      return;
    }
    if (use.cost) {
      h.funds -= use.cost;
      app.stateChanged();
    }
    if (use.at === 'on') {
      const c = itemCenter(item);
      gx = c.x;
      gz = c.z;
      setPos();
      puppet.setFacing(facingYaw(item.rot));
    } else {
      setPos();
      puppet.setFacing(facingYaw(item.rot) + Math.PI);
    }
    useDef = use;
    state = 'using';
    useElapsed = 0;
    puppet.setPose(use.pose);
    setActivity(use.verb);
    if (use.sfx) app.sfx(use.sfx);
    if (use.action === 'bath') app.event('first-bath');
  };

  const bestItemFor = (n: NeedId): Choice | null => {
    const h = app.h;
    const lot = h.lot;
    const from = cur();
    let best: Choice | null = null;
    for (const item of lot.items) {
      const def = FURNITURE[item.kind];
      const use = def?.use;
      if (!def || !use || !((use.rates[n] ?? 0) > 0)) continue;
      if ((use.cost ?? 0) > h.funds) continue;
      const approach = approachTile(lot, item);
      if (!approach) continue;
      const p = findPath(lot, from, approach);
      if (!p) continue;
      if (!best || p.length < best.path.length) best = { item, name: def.name, use, approach, path: p };
    }
    return best;
  };

  const wander = () => {
    const lot = app.h.lot;
    const from = cur();
    wanderIn = 4 + Math.random() * 4;
    for (let i = 0; i < 12; i++) {
      const t = { tx: from.tx + Math.round(Math.random() * 10 - 5), ty: from.ty + Math.round(Math.random() * 10 - 5) };
      if (!isWalkable(lot, t.tx, t.ty)) continue;
      const p = findPath(lot, from, t);
      if (p) {
        startWalk(p, 'wander', t, null, null, 'Hanging around');
        return;
      }
    }
  };

  const decideNeeds = () => {
    const n = pickNeed(app.h.gnome);
    if (n) {
      const best = bestItemFor(n);
      if (best) {
        startWalk(best.path, 'use', best.approach, best.item.id, best.use, `Walking to the ${best.name.toLowerCase()}`);
        return;
      }
      toastOnce(`${n}:${dayOf(app.h.clock)}`, NO_FURNITURE[n]);
    }
    if (state === 'idle' && wanderIn <= 0) wander();
  };

  /** Shift first, then needs. Runs about twice a real second, not every frame. */
  const tick = () => {
    const h = app.h;
    if (shiftDue(h)) {
      if (!(state === 'walking' && purpose === 'work') && !startWork()) {
        toastOnce(`work:${dayOf(h.clock)}`, "Can't find the way to the carpool");
      }
      return;
    }
    if (state === 'idle' || (state === 'walking' && purpose === 'wander')) decideNeeds();
  };

  const update = (dt: number, simMinutes: number) => {
    puppet.update(dt);
    const h = app.h;

    if (h.gnome.workUntil !== null) {
      if (state !== 'working') {
        state = 'working';
        puppet.setVisible(false);
        setActivity('At work');
      }
      handle(advance(h, simMinutes, null));
      if (endShiftDue(h)) endWork();
      return;
    }

    decideIn -= dt;
    if (decideIn <= 0) {
      decideIn = 0.5;
      tick();
    }

    if (state === 'idle') {
      wanderIn -= dt;
      handle(advance(h, simMinutes, null));
    } else if (state === 'walking') {
      handle(advance(h, simMinutes, null));
      if (moveAlong(dt, simMinutes)) onArrive();
    } else if (state === 'using' && useDef) {
      const use = useDef;
      handle(advance(h, simMinutes, use));
      useElapsed += simMinutes;
      if (useElapsed >= use.maxMinutes || satisfied(use)) finishUse();
    }
  };

  return {
    get state() {
      return state;
    },
    update,
    commandUse(itemId: number) {
      const h = app.h;
      if (h.gnome.workUntil !== null) {
        app.toast('Busy');
        return;
      }
      const item = findItem(itemId);
      if (!item) return;
      const def = FURNITURE[item.kind];
      const use = def?.use;
      if (!def || !use) {
        app.toast(`${def?.name ?? 'That'} does nothing yet`);
        return;
      }
      if (state === 'using' && useDef?.action === 'sleep' && h.gnome.needs.energy < 20) {
        app.toast('Busy');
        return;
      }
      const approach = approachTile(h.lot, item);
      const p = approach ? findPath(h.lot, cur(), approach) : null;
      if (!approach || !p) {
        app.toast(`Can't reach the ${def.name.toLowerCase()}`);
        return;
      }
      startWalk(p, 'use', approach, item.id, use, `Walking to the ${def.name.toLowerCase()}`);
    },
    replan() {
      const lot = app.h.lot;
      if (state === 'walking') {
        let dest: Tile | null = null;
        if (purpose === 'use') {
          const item = findItem(targetItemId);
          dest = item ? approachTile(lot, item) : null;
        } else if (purpose === 'work') {
          dest = carpoolTile(lot);
        } else {
          dest = target;
        }
        if (!dest) {
          goIdle();
          return;
        }
        const p = findPath(lot, cur(), dest);
        if (!p) {
          goIdle();
          return;
        }
        path = p;
        stepIdx = 0;
        target = dest;
        return;
      }
      if (state === 'using' && !findItem(targetItemId)) finishUse();
    },
  };
}
