// The garages at runtime: the Side-Valve Lock-Up (ground), Hangar Two (air) and the Mossbank Boathouse (water). Buy the
// last two on foot; store the vehicle you drive into a LockupSite (T or the store button), take out / scrap at the
// garage sheet, and call any of them in from the phone's Sling-Lift (a scripted chopper, with a drop rule per kind).
// Keeps the one-instance-per-uid rule. app.ts makes one with createLockup and calls update every frame.
import type * as THREE from 'three';
import type { Economy } from '../economy';
import type { Phone } from '../phone/phone';
import type { Sfx, Vehicle, VehicleKind } from '../types';
import { AIRFIELD, MOWER_TINTS, VEHICLES } from '../config';
import { fleetEntry } from '../fleet';
import { removeVehicle, syncVehicleMesh } from '../vehicles';
import { KEYS, isTyping } from '../keys';
import { ESTATES, LOCKUP } from './config';
import { createDeedStore } from './deeds';
import { createLockupStore } from './store';
import { cannotStore, restoreVehicle, snapshotVehicle, storageKindOf } from './snapshot';
import { findSafeSpot } from './safeSpot';
import { findStripSpot } from './stripSpot';
import { findWaterSpot } from './waterSpot';
import { createSlingRig, planSling, startSling, stepSling, type SlingRig } from './sling';
import { createLockupUi, type LockupUi } from './ui';
import {
  STORAGE_KINDS,
  type DeedStore, type DropSpot, type EstateKind, type LockupSite, type LockupStore, type SlingPlan, type SlingState,
  type SpotOpts, type SpotProbe, type StorageKind, type StoredVehicle, type VehicleSnapshot,
} from './types';

export interface LockupPlayer {
  x: number;
  y: number;
  z: number;
  vehicle: Vehicle | null;
}

export interface LockupDeps {
  scene: THREE.Scene;
  /** The shared #ui element. */
  ui: HTMLElement;
  hud: { toast(text: string, ms?: number): void; banner(text: string, ms?: number): void };
  economy: Pick<Economy, 'spend' | 'earn' | 'state'>;
  play(sfx: Sfx): void;
  /** The game's live vehicle list: delivered / taken-out vehicles are pushed into it, stored ones spliced out. */
  vehicles: Vehicle[];
  player(): LockupPlayer;
  /** Put the player on foot at once (no climb-out animation) beside v, and leave v empty and parked. */
  stepOut(v: Vehicle): void;
  /** Why the phone's Sling-Lift cannot be called now (cutscene, shop open, cracked...), or null. */
  blocked(): string | null;
  /** World probes for the drop spot (groundAt, waterDepthAt, slopeAt, boxesBlocked). */
  probe: SpotProbe;
  achievements: { unlock(id: string): unknown };
  phone: Phone;
  /** The store to use (tests); default createLockupStore(localStorage). */
  store?: LockupStore;
  /** The deeds to use (tests); default createDeedStore(localStorage). */
  deeds?: DeedStore;
}

export interface Lockup {
  update(dt: number): void;
  /** The Lock-Up sheet is open (the game holds its controls). */
  isOpen(): boolean;
  /** On foot at a site: 'Open Side-Valve Lock-Up' or 'Buy Hangar Two · 1200 Acorns'; else null. */
  prompt(): string | null;
  /** E on foot at a site: open its sheet, or buy its estate when not owned yet. */
  interact(): void;
  // ---- Trainer / debug API ----
  /** Whether the player owns the garage for kind ('ground' always). */
  owns(kind: StorageKind): boolean;
  /** Buy Hangar Two ('air') or the Mossbank Boathouse ('water') (free: no Acorns). Error sentence or null. */
  buy(kind: EstateKind, free?: boolean): string | null;
  /** Debug: give a garage back (its stored vehicles stay saved). False when it was not owned. */
  sell(kind: EstateKind): boolean;
  list(kind?: StorageKind): readonly StoredVehicle[];
  /** Store v (as if driven into a site, from anywhere). Error sentence or null. */
  storeVehicle(v: Vehicle): string | null;
  /** Add a record with no world vehicle: a fleet variant id or a VehicleKind, full health. Null when full or unknown. */
  addRecord(id: string): StoredVehicle | null;
  /** Remove a record for good (removes its world instance too, unless the player drives it). */
  remove(uid: string): boolean;
  /** Call the Sling-Lift for uid (fee and cooldown apply unless free). Error sentence or null. */
  callDelivery(uid: string, free?: boolean): string | null;
  /** The world instance of uid this session, or null. */
  instanceOf(uid: string): Vehicle | null;
}

interface Flight {
  uid: string;
  plan: SlingPlan;
  state: SlingState;
  rig: SlingRig;
  load: Vehicle;
}

const FAB_CSS = `
.gta-lockup-fab{
  position:fixed;display:none;align-items:center;justify-content:center;gap:6px;
  min-width:44px;min-height:44px;padding:10px 18px;border-radius:999px;
  border:2px solid rgba(255,210,63,0.9);background:rgba(22,26,30,0.88);
  color:#ffd23f;font-size:15px;font-weight:800;letter-spacing:0.02em;
  box-shadow:0 4px 14px rgba(0,0,0,0.5);pointer-events:auto;
  font-family:system-ui,-apple-system,sans-serif;touch-action:manipulation;cursor:pointer;
  left:calc(50% + (env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)) / 2);
  transform:translateX(-50%);
  bottom:calc(env(safe-area-inset-bottom,0px) + 112px);
  z-index:35;
}
.gta-lockup-fab:active{transform:translateX(-50%) scale(0.97);}
@media (max-width:600px) and (min-height:501px){
  .gta-lockup-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 380px);}
}
@media (max-height:500px){
  .gta-lockup-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 108px);}
}
`;

/** The estate that holds a kind's garage (null for the always-owned Lock-Up). */
function estateOf(kind: StorageKind) {
  if (kind === 'air') return ESTATES.hangar;
  if (kind === 'water') return ESTATES.boathouse;
  return null;
}

/** Where a stored vehicle of kind waits, for the sentences. */
function placeName(kind: StorageKind): string {
  if (kind === 'air') return 'Hangar Two';
  if (kind === 'water') return 'the Mossbank Boathouse';
  return 'the Lock-Up';
}

/** The short tab label of a kind. */
function tabLabel(kind: StorageKind): string {
  if (kind === 'air') return 'Hangar Two';
  if (kind === 'water') return 'Boathouse';
  return 'Lock-Up';
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Sling-Lift fee for a kind's drop. */
function feeFor(kind: StorageKind): number {
  if (kind === 'air') return LOCKUP.delivery.air.fee;
  if (kind === 'water') return LOCKUP.delivery.water.fee;
  return LOCKUP.delivery.fee;
}

/** A fixed-wing aircraft needs a take-off strip; rotor craft and the balloon are lowered like a mower. */
function isFixedWing(kind: VehicleKind): boolean {
  return !!VEHICLES[kind].fixedWing || VEHICLES[kind].air?.regime === 'fixed-wing';
}

function fullAchievement(kind: StorageKind): string {
  if (kind === 'air') return ESTATES.achievements.hangarFull;
  if (kind === 'water') return ESTATES.achievements.boathouseFull;
  return 'gta-lockup-full';
}

export function createLockup(deps: LockupDeps): Lockup {
  const store: LockupStore = deps.store ?? createLockupStore();
  const deeds: DeedStore = deps.deeds ?? createDeedStore();
  /** uid -> the world instance of that stored vehicle this session (one instance per uid). */
  const instances = new Map<string, Vehicle>();
  /** World vehicle -> its uid, so storing it again updates the same record. */
  const uidOf = new WeakMap<Vehicle, string>();
  let cooldown = 0;
  let flight: Flight | null = null;
  let syncTimer = 0;
  let uiTimer = 0;

  /** Unlock the both-estates achievement once the player owns Hangar Two and the Mossbank Boathouse. */
  function checkLanded(): void {
    if (deeds.owns('air') && deeds.owns('water')) deps.achievements.unlock(ESTATES.achievements.both);
  }
  checkLanded();

  function ownedKinds(): StorageKind[] {
    return STORAGE_KINDS.filter((k) => deeds.owns(k));
  }

  /** Remove v from the world and from the live vehicle list. */
  function forget(v: Vehicle): void {
    removeVehicle(deps.scene, v);
    const i = deps.vehicles.indexOf(v);
    if (i >= 0) deps.vehicles.splice(i, 1);
  }

  function register(uid: string, v: Vehicle): void {
    instances.set(uid, v);
    uidOf.set(v, uid);
  }

  function siteAt(x: number, z: number): LockupSite | null {
    for (const s of LOCKUP.sites) {
      if (Math.hypot(x - s.x, z - s.z) <= s.radius) return s;
    }
    return null;
  }

  function spotOpts(maxDist: number): SpotOpts {
    const D = LOCKUP.delivery;
    return { radius: D.clearRadius, minDist: D.minDist, maxDist, maxSlope: D.maxSlope, maxWater: D.maxWater };
  }

  function buy(kind: EstateKind, free = false): string | null {
    const e = estateOf(kind);
    if (!e) return 'Nothing to buy.';
    if (deeds.owns(kind)) return `You already own ${e.name}.`;
    if (!free) {
      const acorns = deps.economy.state().acorns;
      if (acorns < e.price || !deps.economy.spend(e.price, e.name)) {
        return `${e.name} costs ${e.price} Acorns. You have ${acorns}.`;
      }
    }
    deeds.grant(kind);
    deps.hud.banner(`${e.name} is yours`);
    deps.hud.toast(`Three ${kind === 'air' ? 'bays for your aircraft' : 'slips for your boats'}. Call them in from the phone's Sling-Lift.`);
    deps.play('door');
    checkLanded();
    return null;
  }

  function storeVehicle(v: Vehicle): string | null {
    const kind = storageKindOf(v);
    const owned = uidOf.has(v);
    const err = cannotStore(v, kind, owned);
    if (err) return err;
    if (!deeds.owns(kind)) return `You do not own ${estateOf(kind)!.name} yet.`;

    const name = v.spec.name;
    let uid: string | null = null;
    if (owned) {
      const prev = uidOf.get(v) as string;
      if (store.update(prev, snapshotVehicle(v))) uid = prev;
    }
    if (uid === null) {
      const rec = store.add(snapshotVehicle(v), kind);
      if (!rec) {
        const c = store.capacity(kind);
        return `${cap(placeName(kind))} is full (${c}/${c}). Scrap one first.`;
      }
      uid = rec.uid;
    }

    if (deps.player().vehicle === v) deps.stepOut(v);
    forget(v);
    instances.delete(uid);
    uidOf.set(v, uid);

    deps.hud.toast(`${name} stored in ${placeName(kind)} (${store.list(kind).length}/${store.capacity(kind)}).`);
    deps.play('door');
    if (store.free(kind) === 0) deps.achievements.unlock(fullAchievement(kind));
    return null;
  }

  function takeOut(uid: string): string | null {
    const rec = store.get(uid);
    if (!rec) return 'No such vehicle.';
    if (instances.has(uid)) return 'It is already out.';
    const kind = store.kindOf(uid)!;
    const site = LOCKUP.sites.find((s) => s.storageKind === kind);
    if (!site) return `No room outside ${placeName(kind)} right now.`;
    let spot: DropSpot | null;
    if (kind === 'air') {
      const A = LOCKUP.delivery.air;
      spot = findSafeSpot(site.x, site.z, deps.probe, {
        radius: A.clearRadius, minDist: 4, maxDist: 30, maxSlope: A.maxSlope, maxWater: LOCKUP.delivery.maxWater,
      });
    } else if (kind === 'water') {
      const W = LOCKUP.delivery.water;
      spot = findWaterSpot(site.x, site.z, deps.probe, { radius: W.clearRadius, minDist: 4, maxDist: 30, minDepth: W.minDepth });
    } else {
      spot = findSafeSpot(site.x, site.z, deps.probe, spotOpts(30));
    }
    if (!spot) return `No room outside ${placeName(kind)} right now.`;
    const v = restoreVehicle(deps.scene, rec, spot.x, spot.z, spot.yaw);
    v.y = spot.y;
    syncVehicleMesh(v, 0);
    deps.vehicles.push(v);
    register(uid, v);
    deps.hud.toast(`${rec.name} is out of ${placeName(kind)}.`);
    deps.play('door');
    return null;
  }

  function scrap(uid: string): string | null {
    const rec = store.get(uid);
    if (!rec) return 'No such vehicle.';
    const inst = instances.get(uid);
    if (inst && deps.player().vehicle === inst) return 'Get out of it first.';
    if (flight?.uid === uid) return 'It is in the air.';
    if (inst) {
      forget(inst);
      instances.delete(uid);
    }
    store.remove(uid);
    const value = Math.round(LOCKUP.scrapValue * rec.hp);
    deps.economy.earn(value, 'Scrap');
    deps.hud.toast(`Tansy scrapped the ${rec.name}: +${value} Acorns.`);
    return null;
  }

  /** Where a delivered vehicle of kind (and vehicle kind vk) is set down near (x, z), or the refusal sentence. */
  function deliverySpot(kind: StorageKind, vk: VehicleKind, x: number, z: number): { spot: DropSpot; note: string } | string {
    const D = LOCKUP.delivery;
    if (kind === 'water') {
      const W = D.water;
      const opts = { radius: W.clearRadius, minDist: W.minDist, maxDist: W.maxDist, minDepth: W.minDepth };
      const spot = findWaterSpot(x, z, deps.probe, opts)
        ?? findWaterSpot(x, z, deps.probe, { ...opts, maxDist: W.searchMax });
      return spot ? { spot, note: '' } : 'No open water near you deep enough for a boat. Get closer to a shore.';
    }
    if (kind === 'air') {
      if (isFixedWing(vk)) {
        const S = D.air.strip;
        const opts = { radius: S.radius, length: S.length, minDist: S.minDist, maxDist: S.maxDist, maxSlope: S.maxSlope, maxWater: S.maxWater };
        const spot = findStripSpot(x, z, deps.probe, opts)
          ?? findStripSpot(x, z, deps.probe, { ...opts, maxDist: S.searchMax });
        if (spot) return { spot, note: '' };
        const field = findStripSpot(AIRFIELD.x, AIRFIELD.z, deps.probe, { ...opts, minDist: 0, maxDist: 60 });
        if (field) {
          return { spot: field, note: 'No room for a take-off run near you: it is going to the Desert Airfield.' };
        }
        return 'Nowhere clear to set it down.';
      }
      const A = D.air;
      const opts = { radius: A.clearRadius, minDist: D.minDist, maxDist: D.maxDist, maxSlope: A.maxSlope, maxWater: D.maxWater };
      const spot = findSafeSpot(x, z, deps.probe, opts)
        ?? findSafeSpot(x, z, deps.probe, { ...opts, maxDist: D.searchMax });
      return spot ? { spot, note: '' } : 'Nowhere clear and flat for an aircraft near you.';
    }
    const spot = findSafeSpot(x, z, deps.probe, spotOpts(D.maxDist))
      ?? findSafeSpot(x, z, deps.probe, spotOpts(D.searchMax));
    return spot ? { spot, note: '' } : 'Nowhere dry and flat to set it down near you.';
  }

  function callDelivery(uid: string, free = false): string | null {
    const rec = store.get(uid);
    if (!rec) return 'No such vehicle.';
    if (flight) return 'The Sling-Lift is already on its way.';
    const kind = store.kindOf(uid)!;
    if (!deeds.owns(kind)) return `You do not own ${estateOf(kind)!.name}.`;
    if (!free && cooldown > 0) return `The Sling-Lift is refuelling: ${Math.ceil(cooldown)} s.`;
    const inst = instances.get(uid);
    if (inst && deps.player().vehicle === inst) return 'You are already driving it.';
    const fee = feeFor(kind);
    if (!free && deps.economy.state().acorns < fee) return `The Sling-Lift costs ${fee} Acorns.`;

    const p = deps.player();
    const got = deliverySpot(kind, rec.kind, p.x, p.z);
    if (typeof got === 'string') return got;
    const spot = got.spot;

    if (!free) deps.economy.spend(fee, 'Sling-Lift');
    if (inst) {
      store.update(uid, snapshotVehicle(inst));
      forget(inst);
      instances.delete(uid);
    }
    const plan = planSling(spot, Math.random() * Math.PI * 2);
    const state = startSling(plan);
    const rig = createSlingRig(deps.scene);
    const load = restoreVehicle(deps.scene, store.get(uid)!, state.hx, state.hz, spot.yaw);
    register(uid, load);
    flight = { uid, plan, state, rig, load };
    deps.hud.toast(`Sling-Lift is on its way with your ${rec.name}.${got.note ? ` ${got.note}` : ''}`);
    deps.play('whistle');
    return null;
  }

  function tryStore(): void {
    const v = deps.player().vehicle;
    if (!v) return;
    const site = siteAt(v.x, v.z);
    if (!site) return;
    if (site.storageKind === storageKindOf(v) && !deeds.owns(site.storageKind)) {
      const e = estateOf(site.storageKind)!;
      deps.hud.toast(`You do not own ${site.name} yet: buy it on foot (${e.price} Acorns).`);
      deps.play('alarm');
      return;
    }
    const err = storeVehicle(v);
    if (err) {
      deps.hud.toast(err);
      deps.play('alarm');
    }
  }

  // ---- The Lock-Up sheet and the Sling-Lift app ----
  const ui: LockupUi = createLockupUi(deps.ui, {
    store,
    isOut: (uid) => instances.has(uid),
    fee: (k) => feeFor(k),
    cooldownLeft: () => cooldown,
    scrapValue: (rec) => Math.round(LOCKUP.scrapValue * rec.hp),
    deliver: (uid) => callDelivery(uid),
    takeOut,
    scrap,
    tabs: () => ownedKinds().map((k) => ({ kind: k, label: tabLabel(k) })),
    placeName,
  });

  deps.phone.addApp({
    id: 'sling-lift',
    label: 'Sling-Lift',
    icon: '🚁',
    detail: () => `${ownedKinds().map((k) => `${tabLabel(k)} ${store.list(k).length}/${store.capacity(k)}`).join(' · ')} · from ${LOCKUP.delivery.fee} Acorns`,
    run() {
      const why = deps.blocked();
      if (why) deps.hud.toast(why);
      else ui.open('ground', 'phone', 'Sling-Lift');
    },
  });

  // ---- The store button (shown while the player drives a vehicle into an owned site) ----
  const style = document.createElement('style');
  style.textContent = FAB_CSS;
  document.head.appendChild(style);
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'gta-lockup-fab';
  fab.style.display = 'none';
  fab.addEventListener('pointerdown', (e) => e.stopPropagation());
  fab.addEventListener('click', () => tryStore());
  deps.ui.appendChild(fab);

  function refreshFab(): void {
    const p = deps.player();
    const v = p.vehicle;
    let show = false;
    if (!ui.isOpen() && v && v.driver === 'player' && !v.exploded) {
      const site = siteAt(v.x, v.z);
      show = !!site && site.storageKind === storageKindOf(v) && deeds.owns(site.storageKind);
      if (show) {
        const label = `🔒 Store in ${site!.name}`;
        if (fab.textContent !== label) fab.textContent = label;
      }
    }
    fab.style.display = show ? 'inline-flex' : 'none';
  }

  // Store with T while driving into a site (ignored while the sheet is open or while typing).
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code !== KEYS.garage || e.repeat || isTyping(e)) return;
    if (ui.isOpen()) return;
    const v = deps.player().vehicle;
    if (!v || !siteAt(v.x, v.z)) return;
    tryStore();
  });

  return {
    update(dt: number): void {
      cooldown = Math.max(0, cooldown - dt);

      const f = flight;
      if (f) {
        const ev = stepSling(f.state, f.plan, dt);
        if (!f.state.released) {
          f.load.x = f.state.hx;
          f.load.z = f.state.hz;
          f.load.y = f.state.loadY;
          f.load.speed = 0;
          syncVehicleMesh(f.load, 0);
        }
        f.rig.update(f.state, dt);
        if (ev === 'released') {
          const d = f.plan.drop;
          f.load.x = d.x;
          f.load.z = d.z;
          f.load.y = d.y;
          f.load.yaw = d.yaw;
          syncVehicleMesh(f.load, 0);
          deps.vehicles.push(f.load);
          cooldown = LOCKUP.delivery.cooldownS;
          deps.hud.toast(`Sling-Lift: your ${f.load.spec.name} is down.`);
          deps.play('door');
          deps.achievements.unlock('gta-special-delivery');
        } else if (ev === 'gone') {
          f.rig.dispose();
          flight = null;
        }
      }

      syncTimer += dt;
      if (syncTimer >= 2) {
        syncTimer -= 2;
        for (const [uid, v] of [...instances]) {
          if (flight && flight.load === v && !flight.state.released) continue;
          if (v.exploded) {
            const kind = store.kindOf(uid) ?? 'ground';
            store.remove(uid);
            instances.delete(uid);
            deps.hud.toast(`Your ${v.spec.name} was written off. Its slot in ${placeName(kind)} is free.`);
          } else if (!deps.vehicles.includes(v)) {
            instances.delete(uid);
          } else {
            store.update(uid, snapshotVehicle(v));
          }
        }
      }

      uiTimer += dt;
      if (uiTimer >= 1) {
        uiTimer -= 1;
        if (ui.isOpen()) ui.refresh();
      }

      refreshFab();
    },

    isOpen: () => ui.isOpen(),

    prompt(): string | null {
      const p = deps.player();
      if (p.vehicle !== null) return null;
      const site = siteAt(p.x, p.z);
      if (!site) return null;
      if (!deeds.owns(site.storageKind)) return `Buy ${site.name} · ${estateOf(site.storageKind)!.price} Acorns`;
      return `Open ${site.name}`;
    },

    interact(): void {
      const p = deps.player();
      if (p.vehicle !== null) return;
      const site = siteAt(p.x, p.z);
      if (!site) return;
      if (!deeds.owns(site.storageKind)) {
        const err = buy(site.storageKind as EstateKind);
        if (err) {
          deps.hud.toast(err);
          deps.play('alarm');
        }
        return;
      }
      ui.open(site.storageKind, 'site', site.name);
    },

    owns: (kind: StorageKind): boolean => deeds.owns(kind),

    buy,

    sell(kind: EstateKind): boolean {
      const ok = deeds.revoke(kind);
      if (ui.isOpen()) ui.close();
      return ok;
    },

    list: (kind?: StorageKind): readonly StoredVehicle[] => store.list(kind),

    storeVehicle,

    addRecord(id: string): StoredVehicle | null {
      const e = fleetEntry(id);
      let snap: VehicleSnapshot | null = null;
      if (e) {
        snap = { kind: e.kind, variant: e.id, name: e.name, tint: e.tints?.[0] ?? MOWER_TINTS[0], look: null, hp: 1, enginePitch: null };
      } else if (id in VEHICLES) {
        const k = id as VehicleKind;
        snap = { kind: k, variant: null, name: VEHICLES[k].name, tint: MOWER_TINTS[0], look: null, hp: 1, enginePitch: null };
      }
      if (!snap) return null;
      const spec = VEHICLES[snap.kind];
      const kind: StorageKind = spec.flies ? 'air' : spec.boat ? 'water' : 'ground';
      return store.add(snap, kind);
    },

    remove(uid: string): boolean {
      const inst = instances.get(uid);
      if (inst && deps.player().vehicle === inst) return false;
      if (inst) {
        forget(inst);
        instances.delete(uid);
      }
      if (flight?.uid === uid) {
        flight.rig.dispose();
        flight = null;
      }
      return store.remove(uid) !== null;
    },

    callDelivery,

    instanceOf: (uid: string): Vehicle | null => instances.get(uid) ?? null,
  };
}

export type { VehicleKind };
