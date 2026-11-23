// Acorns lying around outdoors: walk over one to pick it up (+PICKUPS.acorns into the Oakcount).
import * as THREE from 'three';
import { createDrop, type Drop } from '@lawn/prefabs';
import { earnAcorns } from '@lawn/oakcount';
import { MAP_IDS, PICKUPS, STORAGE, type MapDef } from './config';
import { isBlocked } from './walk';
import type { World } from './world';

export interface Pickups {
  /** Places this map's pickups (outdoor maps only; none indoors). Call after world.load(map). */
  load(map: MapDef): void;
  /** Spins the acorns and collects any within PICKUPS.radius of my gnome at (x, z). */
  update(dt: number, x: number, z: number): void;
}

/** Prefabs that count as trees and bushes for acorn spots. */
const SPOT_PREFABS = new Set(['broadleaf-tree', 'cone-pine', 'round-bush', 'flowering-bush']);
/** How far in front of (and to the right of) a tree or bush an acorn lies. */
const SPOT_OFFSET = 1.1;
/** Spots must be at least this far from every portal centre. */
const PORTAL_CLEARANCE = 1.5;

/** Small seeded PRNG (mulberry32): the same seed always gives the same sequence. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The acorn spots for one map in one time slot. Pure: the same map and slot always give the same spots.
 * Indoor maps have none.
 */
export function pickupSpots(map: MapDef, slot: number): { id: string; x: number; z: number }[] {
  if (map.indoor) return [];
  const candidates: { x: number; z: number }[] = [];
  for (const p of map.props) {
    if (!SPOT_PREFABS.has(p.prefab)) continue;
    let x = p.x;
    let z = p.z + SPOT_OFFSET;
    if (isBlocked(map, x, z)) {
      x = p.x + SPOT_OFFSET;
      z = p.z;
    }
    if (isBlocked(map, x, z)) continue;
    const nearPortal = map.portals.some((portal) => Math.hypot(portal.x - x, portal.z - z) < PORTAL_CLEARANCE);
    if (nearPortal) continue;
    candidates.push({ x, z });
  }

  const rng = mulberry32(slot * 7919 + MAP_IDS.indexOf(map.id));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, PICKUPS.perMap).map((c) => ({
    id: `${map.id}:${Math.round(c.x * 10)}:${Math.round(c.z * 10)}`,
    x: c.x,
    z: c.z,
  }));
}

function currentSlot(): number {
  return Math.floor(Date.now() / (PICKUPS.slotMinutes * 60000));
}

/** Ids collected in the given slot, from localStorage. A different slot means nothing is collected yet. */
function readCollected(slot: number): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE.pickups);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { slot?: unknown; ids?: unknown };
    if (parsed.slot !== slot || !Array.isArray(parsed.ids)) return new Set();
    return new Set(parsed.ids.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function storeCollected(slot: number, collected: Set<string>): void {
  try {
    localStorage.setItem(STORAGE.pickups, JSON.stringify({ slot, ids: [...collected] }));
  } catch {
    // Storage may be blocked; the pickup still counts for this visit.
  }
}

interface Live {
  id: string;
  x: number;
  z: number;
  drop: Drop;
}

export function createPickups(world: World, onPicked: (acorns: number) => void): Pickups {
  const group = new THREE.Group();
  group.name = 'club-gnome:pickups';
  world.scene.add(group);

  let map: MapDef | null = null;
  let slot = currentSlot();
  let live: Live[] = [];

  function clear(): void {
    for (const item of live) group.remove(item.drop.object);
    live = [];
  }

  function place(): void {
    clear();
    if (!map) return;
    const collected = readCollected(slot);
    for (const spot of pickupSpots(map, slot)) {
      if (collected.has(spot.id)) continue;
      const drop = createDrop('acorn', { fit: 0.3 });
      drop.object.position.set(spot.x, 0, spot.z);
      group.add(drop.object);
      live.push({ id: spot.id, x: spot.x, z: spot.z, drop });
    }
  }

  return {
    load(next: MapDef) {
      map = next;
      slot = currentSlot();
      place();
    },
    update(dt: number, x: number, z: number) {
      const nowSlot = currentSlot();
      if (nowSlot !== slot) {
        slot = nowSlot;
        place();
      }
      for (const item of live) item.drop.update(dt);
      const picked = live.filter((item) => Math.hypot(item.x - x, item.z - z) <= PICKUPS.radius);
      if (picked.length === 0) return;
      const collected = readCollected(slot);
      for (const item of picked) {
        group.remove(item.drop.object);
        collected.add(item.id);
        earnAcorns(PICKUPS.acorns);
        onPicked(PICKUPS.acorns);
      }
      live = live.filter((item) => !picked.includes(item));
      storeCollected(slot, collected);
    },
  };
}
