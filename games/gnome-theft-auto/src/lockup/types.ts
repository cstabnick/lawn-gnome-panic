// Shared types of the player's garages (the Lock-Up) and the Sling-Lift delivery. Every lockup/*.ts module imports
// its contracts from here. Generic over StorageKind so a later hangar ('air') and boathouse ('water') reuse it all.
import type { VehicleKind } from '../types';

/** What a garage holds: 'ground' (the Lock-Up, now), 'air' (a hangar, later), 'water' (a boathouse, later). */
export type StorageKind = 'ground' | 'air' | 'water';
export const STORAGE_KINDS: readonly StorageKind[] = ['ground', 'air', 'water'];

/** One owned vehicle, saved with everything needed to rebuild it. JSON-safe. */
export interface StoredVehicle {
  /** Unique id given when it was first stored ('lk-' + base36 time + '-' + 4 base36 random chars). One world instance per uid. */
  uid: string;
  kind: VehicleKind;
  /** fleet.ts variant id (FleetEntry.id), or null for a stock vehicle. */
  variant: string | null;
  /** Shown name (v.spec.name when stored). */
  name: string;
  /** v.tint. */
  tint: number;
  /** @lawn/glaze encodeLoadout(v.look) code, or null (flyers, boats, or no look). */
  look: string | null;
  /** Hit points 0 < hp <= 1. */
  hp: number;
  /** v.enginePitch, or null. */
  enginePitch: number | null;
  /** ms since epoch when it was first stored. */
  storedAt: number;
}

/** The vehicle's state without the store's own fields (what snapshotVehicle returns and LockupStore.add takes). */
export type VehicleSnapshot = Omit<StoredVehicle, 'uid' | 'storedAt'>;

/** The saved JSON under LOCKUP.saveKey. Slot order is list order. */
export interface LockupSave {
  v: 1;
  slots: Record<StorageKind, StoredVehicle[]>;
}

/** A place a vehicle is driven into to be stored. */
export interface LockupSite {
  id: string;
  name: string;
  storageKind: StorageKind;
  x: number;
  z: number;
  /** A driven vehicle whose centre is within this many metres can be stored. */
  radius: number;
}

export interface LockupStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LockupStore {
  /** Stored vehicles of one kind in slot order (all kinds, ground then air then water, when kind is omitted). */
  list(kind?: StorageKind): readonly StoredVehicle[];
  get(uid: string): StoredVehicle | null;
  /** Which kind's slots hold uid, or null. */
  kindOf(uid: string): StorageKind | null;
  capacity(kind: StorageKind): number;
  /** capacity - list(kind).length, never below 0. */
  free(kind: StorageKind): number;
  /** A new slot for snap (new uid, storedAt = now). Null when that kind is full. Persists. */
  add(snap: VehicleSnapshot, kind: StorageKind): StoredVehicle | null;
  /** Replace the vehicle fields of an existing record (uid and storedAt kept). False for an unknown uid. Persists only when something changed. */
  update(uid: string, snap: VehicleSnapshot): boolean;
  /** Take a record out for good (scrap, written off, debug). Returns it, or null. Persists. */
  remove(uid: string): StoredVehicle | null;
  /** Called after every change that persisted. Returns an unsubscribe function. */
  onChange(cb: () => void): () => void;
}

/** Sling-Lift flight phases, in order. */
export type SlingPhase = 'inbound' | 'lowering' | 'release' | 'outbound' | 'done';

/** Where the Sling-Lift drops its load. y = the ground height at (x, z); yaw = the load's heading. */
export interface DropSpot {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface SlingPlan {
  /** Where the chopper appears (ground plane) and the drop point. */
  fromX: number;
  fromZ: number;
  drop: DropSpot;
  /** Absolute heights: cruising on the way in, hovering over the drop. */
  cruiseY: number;
  hoverY: number;
}

/** The chopper and its load this frame (pure data; sling.ts stepSling moves it). */
export interface SlingState {
  phase: SlingPhase;
  /** Seconds spent in the current phase. */
  t: number;
  /** Chopper position (its prefab origin, the skids) and heading (yaw, radians, prefab +z forward). */
  hx: number;
  hy: number;
  hz: number;
  heading: number;
  /** The load's height (its origin, the wheels' contact); it hangs straight under (hx, hz). */
  loadY: number;
  /** True once the load is set down (phase release and after): the rope is gone and the load is a normal vehicle. */
  released: boolean;
}

/** Probes of the world the safe-spot finder needs (injected so it stays pure and testable). */
export interface SpotProbe {
  /** Ground height (land or deck) at (x, z). */
  ground(x: number, z: number): number;
  /** Water depth at (x, z) (0 where dry). */
  water(x: number, z: number): number;
  /** Slope at (x, z), rise over run. */
  slope(x: number, z: number): number;
  /** True when a circle of radius r at (x, z) overlaps a building / wall collider or leaves the world. */
  blocked(x: number, z: number, r: number): boolean;
}

export interface SpotOpts {
  radius: number;
  minDist: number;
  maxDist: number;
  maxSlope: number;
  maxWater: number;
}

// ---- Hangar Two and the Mossbank Boathouse (docs/roadmaps/gta-hangar-boathouse.md) ----

/** The garages a gnome buys: 'air' = Hangar Two (Desert Airfield), 'water' = the Mossbank Boathouse (Loch Moss). */
export type EstateKind = 'air' | 'water';
export const ESTATE_KINDS: readonly EstateKind[] = ['air', 'water'];

/** The saved JSON under ESTATES.saveKey ('gta-estates-v1'). */
export interface EstatesSave {
  v: 1;
  owned: Record<EstateKind, boolean>;
}

/** Which estates the player owns. The Lock-Up ('ground') is always owned. */
export interface DeedStore {
  /** 'ground' is always true; 'air' / 'water' once bought. */
  owns(kind: StorageKind): boolean;
  /** Mark kind owned and persist (no Acorns here: the runtime spends them). False when already owned. */
  grant(kind: EstateKind): boolean;
  /** Debug: forget a purchase and persist. False when it was not owned. */
  revoke(kind: EstateKind): boolean;
  /** Called after every change that persisted. Returns an unsubscribe function. */
  onChange(cb: () => void): () => void;
}

/** Search for open water to set a boat down on (findWaterSpot in waterSpot.ts). */
export interface WaterSpotOpts {
  /** Clear radius of the boat (m): all 5 probe points (centre and 4 at this radius) must be deep enough. */
  radius: number;
  minDist: number;
  maxDist: number;
  /** Shallowest water allowed at every probe point (m). */
  minDepth: number;
}

/** Search for a take-off strip for a fixed-wing aircraft (findStripSpot in stripSpot.ts). */
export interface StripOpts {
  /** Clear radius of the aircraft (m), checked at every sample along the strip. */
  radius: number;
  /** Length of clear, dry, flat ground needed ahead of the drop point along `yaw` (m). */
  length: number;
  minDist: number;
  maxDist: number;
  maxSlope: number;
  maxWater: number;
}

/** A collider rectangle in a building's own frame (x across, z depth, metres, origin at the building's origin). */
export interface LocalRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Top height above the building's origin (m). */
  h: number;
}
