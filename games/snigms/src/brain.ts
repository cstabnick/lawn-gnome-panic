// The gnome's autonomy: it picks a need, walks to the furniture that fixes it, goes to work, goes out for a free evening in town,
// and talks with the neighbours it meets there. The player only SUGGESTS (suggestUse, suggestChat, suggestTrip). The gnome weighs
// each suggestion by its temper (obeyChance in config.ts): it may ignore one, and a refused one costs temper. During a crash-out
// (sim.ts tickTemper) every suggestion is refused until the crash ends.
import { CHAT_CHANCE, CHAT_COOLDOWN, CHAT_SECONDS, CRITICAL, FREE_TRIP_CHANCE, FRIEND_STEP, FURNITURE, SOCIAL_RANGE, SPEEDS, TEMPER_REFUSED, TEMPER_UNPAID, TOWN_CLOSE_HOUR, TOWN_OPEN_HOUR, TOWN_STAY_MINUTES, TRIP_MINUTES, WALK_SPEED, obeyChance } from './config';
import { advance, befriend, bumpTemper, dayOf, endShiftDue, finishShift, friendLevel, isCrashed, minuteOfDay, pickNeed, shiftDue, startShift, tickTemper } from './sim';
import type { SimEvent } from './sim';
import { lineFor, personById, type PersonId } from './people';
import type { Neighbours } from './npcs';
import { townGate } from './town';
import { approachTile, carpoolTile, facingYaw, findPath, isWalkable, itemCenter } from './world';
import type { Tile } from './world';
import type { App, GnomePuppet, Lot, NeedId, PlacedItem, UseDef, Where } from './types';

export type BrainState = 'idle' | 'walking' | 'using' | 'working' | 'travelling' | 'chatting';

export interface Brain {
  readonly state: BrainState;
  /** The gnome's position on the lot it is on, in tile units (the neighbours run around it in town). */
  position(): { x: number; z: number };
  /** Call every frame. dt = real seconds (walking, animation); simMinutes = game minutes to advance (0 when paused). The brain calls sim.advance itself. */
  update(dt: number, simMinutes: number): void;
  /** The player suggests the gnome uses a placed item on the lot it is on. The gnome may ignore it (see the file header). */
  suggestUse(itemId: number): void;
  /** The player suggests the gnome goes to a neighbour in town and says hello. */
  suggestChat(id: PersonId): void;
  /** The player suggests a trip: 'town' or 'home'. */
  suggestTrip(to: Where): void;
  /** The lot changed under the gnome: re-plan the current path, or drop the plan if the target vanished or is unreachable. */
  replan(): void;
}

type Purpose = 'work' | 'use' | 'wander' | 'trip' | 'chat';

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
const GNOME_LINES = ['Hello there.', 'Lovely day for it.', 'Heard the mowers are out.', 'Spare acorn going?', 'Good to see you.'];

const NEED_OK = 95;

/** Stands in when no neighbours are wired (tests, the editor). */
const NO_NEIGHBOURS: Neighbours = {
  list: () => [],
  get: () => {
    throw new Error('no neighbours');
  },
  nearest: () => null,
  pause: () => {},
  update: () => {},
};

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

export function createBrain(app: App, puppet: GnomePuppet, neighbours: Neighbours = NO_NEIGHBOURS): Brain {
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
  let tripTo: Where = 'town';
  let chatWith: PersonId | null = null;
  let chatLeft = 0;
  let townSince: number | null = null; // absolute sim minute the gnome arrived in town (this visit)
  const lastChat: Partial<Record<PersonId, number>> = {};
  const toastedKeys = new Set<string>();

  // A save made in town starts the session at the town gate.
  if (app.h.gnome.where === 'town') {
    const g = townGate();
    gx = g.tx + 0.5;
    gz = g.ty + 0.5;
    townSince = app.h.clock;
  }

  const here = (): Lot => app.here();
  puppet.setPosition(gx, gz);
  puppet.setFacing(0);
  puppet.setPose('stand');
  puppet.setVisible(app.h.gnome.workUntil === null && app.h.gnome.trip === null);

  const setActivity = (s: string) => {
    if (app.activity !== s) app.activity = s;
  };
  const cur = (): Tile => ({ tx: Math.floor(gx), ty: Math.floor(gz) });
  const setPos = () => puppet.setPosition(gx, gz);
  const findItem = (id: number | null): PlacedItem | null =>
    id === null ? null : here().items.find((i) => i.id === id) ?? null;

  const handle = (events: SimEvent[]) => {
    for (const e of events) {
      if (e.type === 'bills') {
        app.toast(`Bills: -${e.amount} acorns${e.paid ? '' : " (can't pay!)"}`);
        if (!e.paid) bumpTemper(app.h.gnome, -TEMPER_UNPAID);
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
    const spot = nearestWalkable(here(), target.tx, target.ty) ?? cur();
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
    h.gnome.where = 'home';
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

  /** Walks to the exit of the lot the gnome is on (the carpool stop at home, the gate in town), then leaves for `to`. */
  const startTrip = (to: Where): boolean => {
    const h = app.h;
    if (h.gnome.where === to || h.gnome.trip) return false;
    const exit = h.gnome.where === 'home' ? carpoolTile(h.lot) : townGate();
    const p = findPath(here(), cur(), exit);
    if (!p) return false;
    tripTo = to;
    if (to === 'town') h.gnome.lastTownDay = dayOf(h.clock);
    startWalk(p, 'trip', exit, null, null, to === 'town' ? 'Heading to town' : 'Heading home');
    return true;
  };

  /** The trip itself: the gnome is off the lot for TRIP_MINUTES, then appears at the other side. */
  const beginTravel = () => {
    const h = app.h;
    h.gnome.trip = { to: tripTo, arriveAt: h.clock + TRIP_MINUTES };
    state = 'travelling';
    puppet.setVisible(false);
    setActivity(tripTo === 'town' ? 'On the road to town' : 'On the road home');
    app.stateChanged();
  };

  const arriveFromTrip = () => {
    const h = app.h;
    const trip = h.gnome.trip;
    if (!trip) return;
    h.gnome.trip = null;
    h.gnome.where = trip.to;
    if (trip.to === 'town') {
      const g = townGate();
      gx = g.tx + 0.5;
      gz = g.ty + 0.5;
      townSince = h.clock;
      app.event('first-town');
      app.toast(`${h.gnome.name} is in town`);
    } else {
      const c = carpoolTile(h.lot);
      gx = c.tx + 0.5;
      gz = c.ty + 0.5;
      townSince = null;
    }
    setPos();
    puppet.setVisible(true);
    goIdle(trip.to === 'town' ? 'Looking around town' : 'Home');
    app.stateChanged();
  };

  /** Starts a chat with a neighbour: both stop, lines are said, friendship grows. */
  const startChat = (id: PersonId): void => {
    const h = app.h;
    const n = neighbours.get(id);
    const p = personById(id);
    state = 'chatting';
    chatWith = id;
    chatLeft = CHAT_SECONDS;
    purpose = 'chat';
    path = [];
    puppet.setPose('stand');
    puppet.setFacing(Math.atan2(n.x - gx, n.z - gz));
    neighbours.pause(id, CHAT_SECONDS + 0.5);
    setActivity(`Chatting with ${p.name}`);
    app.say(h.gnome.name, GNOME_LINES[Math.floor(Math.random() * GNOME_LINES.length)]);
    app.say(p.name, lineFor(p, Math.random()));
    lastChat[id] = h.clock;
    const r = befriend(h.gnome, id, FRIEND_STEP);
    const level = friendLevel(r.after);
    if (friendLevel(r.before) !== level) app.toast(`${p.name} is now a ${level.toLowerCase()}`);
    if (r.before < 50 && r.after >= 50) app.event('first-friend');
    if (r.before < 80 && r.after >= 80) app.event('best-friend');
    app.stateChanged();
  };

  const canChat = (id: PersonId): boolean => {
    const last = lastChat[id];
    return last === undefined || app.h.clock - last >= CHAT_COOLDOWN;
  };

  /** Walks to a neighbour (they move, so the walk is aimed at their tile when it starts). Returns false if there is no way there. */
  const goChat = (id: PersonId): boolean => {
    const n = neighbours.get(id);
    const dest = { tx: Math.floor(n.x), ty: Math.floor(n.z) };
    const p = findPath(here(), cur(), dest);
    if (!p) return false;
    chatWith = id;
    startWalk(p, 'chat', dest, null, null, `Going over to ${personById(id).name}`);
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
    if (purpose === 'trip') {
      beginTravel();
      return;
    }
    if (purpose === 'chat') {
      const id = chatWith;
      if (id !== null && canChat(id)) {
        const n = neighbours.get(id);
        if (Math.hypot(n.x - gx, n.z - gz) <= SOCIAL_RANGE + 1) {
          startChat(id);
          return;
        }
      }
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
    const lot = here();
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

  const wander = (label = 'Hanging around') => {
    const lot = here();
    const from = cur();
    wanderIn = 4 + Math.random() * 4;
    for (let i = 0; i < 12; i++) {
      const t = { tx: from.tx + Math.round(Math.random() * 10 - 5), ty: from.ty + Math.round(Math.random() * 10 - 5) };
      if (!isWalkable(lot, t.tx, t.ty)) continue;
      const p = findPath(lot, from, t);
      if (p) {
        startWalk(p, 'wander', t, null, null, label);
        return;
      }
    }
  };

  /** Needs: the lowest under ACT_BELOW (or only the critical ones, when `criticalOnly`) goes to the furniture that fixes it. */
  const decideNeeds = (criticalOnly: boolean) => {
    const n = pickNeed(app.h.gnome);
    if (n && (!criticalOnly || app.h.gnome.needs[n] < CRITICAL)) {
      const best = bestItemFor(n);
      if (best) {
        startWalk(best.path, 'use', best.approach, best.item.id, best.use, `Walking to the ${best.name.toLowerCase()}`);
        return;
      }
      toastOnce(`${n}:${dayOf(app.h.clock)}:${app.h.gnome.where}`, NO_FURNITURE[n]);
      // Nothing in town fixes it: the gnome goes home for it.
      if (app.h.gnome.where === 'town' && startTrip('home')) return;
    }
    if (state === 'idle' && wanderIn <= 0) wander();
  };

  /** Shift first, then a crash-out (survival only), then company, then needs. Runs about twice a real second, not every frame. */
  const tick = () => {
    const h = app.h;
    const g = h.gnome;
    const inTown = g.where === 'town';
    if (shiftDue(h)) {
      if (inTown) {
        if (!(state === 'walking' && purpose === 'trip') && !g.trip) startTrip('home');
        return;
      }
      if (!(state === 'walking' && purpose === 'work') && !startWork()) {
        toastOnce(`work:${dayOf(h.clock)}`, "Can't find the way to the carpool");
      }
      return;
    }
    if (!(state === 'idle' || (state === 'walking' && purpose === 'wander'))) return;
    if (isCrashed(g)) {
      decideNeeds(true);
      if (state === 'idle') wander('Sulking. Leave me alone.');
      return;
    }
    if (inTown) {
      const m = minuteOfDay(h.clock);
      if (m >= TOWN_CLOSE_HOUR * 60 || (townSince !== null && h.clock - townSince >= TOWN_STAY_MINUTES)) {
        if (startTrip('home')) return;
      }
      const near = neighbours.nearest(gx, gz, SOCIAL_RANGE);
      if (near && canChat(near.id) && Math.random() < CHAT_CHANCE) {
        startChat(near.id);
        return;
      }
    } else {
      const m = minuteOfDay(h.clock);
      const evening = m >= TOWN_OPEN_HOUR * 60 && m < TOWN_CLOSE_HOUR * 60;
      if (evening && g.lastTownDay !== dayOf(h.clock) && Math.random() < FREE_TRIP_CHANCE && startTrip('town')) return;
    }
    decideNeeds(false);
  };

  const update = (dt: number, simMinutes: number) => {
    puppet.update(dt);
    const h = app.h;

    for (const e of tickTemper(h.gnome, h.clock, simMinutes)) {
      if (e.type === 'crashStart') {
        app.event('crash-out');
        app.toast(`${h.gnome.name} is having a moment. Not listening.`);
        if (state === 'walking' || state === 'using' || state === 'chatting') goIdle('Having a moment');
        setActivity('Having a moment');
        app.stateChanged();
      } else {
        app.toast(`${h.gnome.name} calms down.`);
        app.stateChanged();
      }
    }

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

    if (h.gnome.trip) {
      if (state !== 'travelling') {
        state = 'travelling';
        puppet.setVisible(false);
      }
      handle(advance(h, simMinutes, null));
      if (h.clock >= h.gnome.trip.arriveAt) arriveFromTrip();
      return;
    }

    decideIn -= dt;
    if (decideIn <= 0) {
      decideIn = 0.5;
      tick();
    }

    if (state === 'chatting') {
      chatLeft -= dt;
      handle(advance(h, simMinutes, null));
      if (chatLeft <= 0) goIdle('Hanging around town');
    } else if (state === 'idle') {
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

  /** Gate for every suggestion: a crash-out, work or a trip makes the gnome deaf to the player. */
  const open = (): boolean => {
    const h = app.h;
    if (isCrashed(h.gnome)) {
      app.toast(`Not listening. ${h.gnome.name} is having a moment.`);
      return false;
    }
    if (h.gnome.workUntil !== null || h.gnome.trip) {
      app.toast('Busy');
      return false;
    }
    return true;
  };

  /** The gnome weighs the suggestion by its temper. A refusal costs temper and says so. */
  const obeys = (): boolean => {
    const h = app.h;
    if (Math.random() < obeyChance(h.gnome.temper)) {
      app.event('obeyed');
      return true;
    }
    bumpTemper(h.gnome, -TEMPER_REFUSED);
    app.toast(`${h.gnome.name} ignores you.`);
    app.stateChanged();
    return false;
  };

  return {
    get state() {
      return state;
    },
    position: () => ({ x: gx, z: gz }),
    update,
    suggestUse(itemId: number) {
      const h = app.h;
      if (!open()) return;
      const item = findItem(itemId);
      if (!item) {
        app.toast('That is not on this lot');
        return;
      }
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
      const approach = approachTile(here(), item);
      const p = approach ? findPath(here(), cur(), approach) : null;
      if (!approach || !p) {
        app.toast(`Can't reach the ${def.name.toLowerCase()}`);
        return;
      }
      if (!obeys()) return;
      startWalk(p, 'use', approach, item.id, use, `Walking to the ${def.name.toLowerCase()}`);
    },
    suggestChat(id: PersonId) {
      if (!open()) return;
      if (app.h.gnome.where !== 'town') {
        app.toast('Nobody to talk to at home. Try town.');
        return;
      }
      if (!canChat(id)) {
        app.toast(`${personById(id).name} has just talked to them`);
        return;
      }
      if (!obeys()) return;
      if (!goChat(id)) app.toast(`Can't get to ${personById(id).name}`);
    },
    suggestTrip(to: Where) {
      if (!open()) return;
      if (app.h.gnome.where === to) {
        app.toast(to === 'town' ? 'Already in town' : 'Already at home');
        return;
      }
      if (!obeys()) return;
      if (!startTrip(to)) app.toast("Can't find the way");
    },
    replan() {
      const lot = here();
      if (state === 'walking') {
        let dest: Tile | null = null;
        if (purpose === 'use') {
          const item = findItem(targetItemId);
          dest = item ? approachTile(lot, item) : null;
        } else if (purpose === 'work') {
          dest = carpoolTile(app.h.lot);
        } else if (purpose === 'trip') {
          dest = app.h.gnome.where === 'home' ? carpoolTile(app.h.lot) : townGate();
        } else if (purpose === 'chat' && chatWith !== null) {
          const n = neighbours.get(chatWith);
          dest = { tx: Math.floor(n.x), ty: Math.floor(n.z) };
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
