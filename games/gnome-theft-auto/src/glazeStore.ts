// What the player owns at Pay 'n' Glaze: one saved Loadout per vehicle model (VehicleKind), kept in this browser.
// STUB (in-memory only): the Pay 'n' Glaze store issue makes it persist, and adds the ride-height -> handling map.
import { normalizeLoadout, type Loadout } from '@lawn/glaze';
import type { VehicleKind } from './types';

/** The vehicle models Pay 'n' Glaze can dress: the ground vehicles (no flyers, no boats). */
export const GLAZE_KINDS: readonly VehicleKind[] = [
  'push-bike', 'ride-on', 'zero-turn', 'combine', 'lowrider', 'boot-float', 'snail-coach', 'mulch-spreader', 'hoa-van',
];

const owned = new Map<VehicleKind, Loadout>();
const listeners = new Set<(kind: VehicleKind) => void>();

/** The saved loadout for a vehicle model, or null when the player never bought anything for it. */
export function ownedLoadout(kind: VehicleKind): Loadout | null {
  return owned.get(kind) ?? null;
}

/** Save (and normalise) the loadout the player now owns for a model. */
export function saveOwnedLoadout(kind: VehicleKind, l: Loadout): void {
  owned.set(kind, normalizeLoadout(l));
  for (const cb of listeners) cb(kind);
}

export function clearOwnedLoadout(kind: VehicleKind): void {
  owned.delete(kind);
  for (const cb of listeners) cb(kind);
}

/** Be told when a model's owned loadout changes. Returns the unsubscribe function. */
export function onOwnedChange(cb: (kind: VehicleKind) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
