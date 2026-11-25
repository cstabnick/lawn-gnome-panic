// E23 L101: quest pins. Everything a running quest needs to stay in the world (its vehicles, NPCs, props, and the
// player's "quest ride") is pinned here; cleanup never removes a pinned thing while its quest is active, and the auto
// retry brings the quest ride back beside the player.
import type * as THREE from 'three';
import type { Npc, Vehicle, World } from '../types';
import { repaintVehicle, repairVehicle, syncVehicleMesh } from '../vehicles';
import { heightAt } from '../terrain';
import { clearVehicleSpawn } from './objectivesDrive';

export interface QuestPins {
  /** Pin a vehicle: it becomes questOwned (traffic, parking and parkSync leave it be) until released. Idempotent. */
  pinVehicle(v: Vehicle): void;
  /** Pin an NPC: it gets `quest` set (pedestrian trimming skips it) when it has none, until released. Idempotent. */
  pinNpc(n: Npc): void;
  /** Pin a prop (kept in a list so a retry can tell whether it is still in the scene). Idempotent. */
  pinProp(o: THREE.Object3D): void;
  isPinned(v: Vehicle): boolean;
  /** The player's quest ride: also pinned. null clears the ride (and releases it if it was pinned only as the ride). */
  setRide(v: Vehicle | null): void;
  ride(): Vehicle | null;
  vehicles(): readonly Vehicle[];
  npcs(): readonly Npc[];
  props(): readonly THREE.Object3D[];
  /**
   * Forget pinned vehicles that are no longer in `alive` (a runner removed its own vehicle in cleanup); the ride too.
   * E23 fuzz: a runner-spawned ride (a checkpoints job's bike) was pinned as the quest ride, then removed by its runner.
   */
  prune(alive: readonly Vehicle[]): void;
  /** Unpin everything: each vehicle's questOwned and each NPC's quest go back to what they were before pinning. */
  releaseAll(): void;
}

export function createQuestPins(): QuestPins {
  // Previous values, so release can put back exactly what pinning changed.
  const savedVehicles = new Map<Vehicle, boolean | undefined>();
  const savedNpcs = new Map<Npc, string | undefined>();
  const props: THREE.Object3D[] = [];
  // Vehicles pinned explicitly with pinVehicle (not only as the ride).
  const explicit = new Set<Vehicle>();
  let rideVehicle: Vehicle | null = null;

  const pinVehicleRaw = (v: Vehicle) => {
    if (!savedVehicles.has(v)) savedVehicles.set(v, v.questOwned);
    v.questOwned = true;
  };
  const unpinVehicle = (v: Vehicle) => {
    if (!savedVehicles.has(v)) return;
    v.questOwned = savedVehicles.get(v);
    savedVehicles.delete(v);
  };
  // The ride is pinned with its own flag (Vehicle.questPinned), not questOwned: it stays the player's to store or sell.
  const unpinRide = (v: Vehicle) => {
    v.questPinned = false;
  };

  return {
    pinVehicle(v) {
      explicit.add(v);
      pinVehicleRaw(v);
    },
    pinNpc(n) {
      if (!savedNpcs.has(n)) {
        savedNpcs.set(n, n.quest);
        n.quest = n.quest ?? 'pinned';
      }
    },
    pinProp(o) {
      if (!props.includes(o)) props.push(o);
    },
    isPinned: (v) => savedVehicles.has(v) || v === rideVehicle,
    setRide(v) {
      const prev = rideVehicle;
      if (prev && prev !== v) unpinRide(prev);
      rideVehicle = v;
      if (v) v.questPinned = true;
    },
    ride: () => rideVehicle,
    vehicles: () => (rideVehicle && !savedVehicles.has(rideVehicle) ? [...savedVehicles.keys(), rideVehicle] : [...savedVehicles.keys()]),
    npcs: () => [...savedNpcs.keys()],
    props: () => [...props],
    prune(alive) {
      for (const v of [...savedVehicles.keys()]) {
        if (alive.includes(v)) continue;
        savedVehicles.delete(v);
        explicit.delete(v);
      }
      if (rideVehicle && !alive.includes(rideVehicle)) {
        unpinRide(rideVehicle);
        rideVehicle = null;
      }
    },
    releaseAll() {
      for (const v of [...savedVehicles.keys()]) unpinVehicle(v);
      if (rideVehicle) unpinRide(rideVehicle);
      for (const [n, prev] of savedNpcs) n.quest = prev;
      savedNpcs.clear();
      props.length = 0;
      explicit.clear();
      rideVehicle = null;
    },
  };
}

/**
 * Make a wrecked, sunk or damaged vehicle drivable again: full hp, not exploded, not sunk, its charred body rebuilt.
 */
export function restoreVehicle(v: Vehicle): void {
  const wasExploded = !!v.exploded;
  repairVehicle(v);
  if (wasExploded) {
    v.exploded = false;
    repaintVehicle(v, v.tint);
  }
  v.sunk = false;
  v.sunkT = 0;
  v.speed = 0;
  if ('vy' in v) v.vy = 0;
}

/**
 * Restore `v` and park it beside (x, z): about 3.5 m to the side, pushed out of world boxes, stopped, on the ground,
 * driver 'none', mesh synced. Returns where it was put.
 */
export function recoverVehicleNear(v: Vehicle, x: number, z: number, world: World): { x: number; z: number } {
  restoreVehicle(v);
  const [sx, sz] = clearVehicleSpawn(x + 3.5, z, v.spec.radius, world);
  v.x = sx;
  v.z = sz;
  v.y = heightAt(sx, sz);
  if (v.driver !== 'player') v.driver = 'none';
  syncVehicleMesh(v, 0);
  return { x: sx, z: sz };
}
