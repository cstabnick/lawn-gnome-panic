// The portal registry: every building more than one game can walk into. Adding one is a registerPortal call
// (see portals.ts).
import type { PortalDef, PortalDoor } from './types';

const REG = new Map<string, PortalDef>();
const ID_RE = /^[a-z0-9-]{1,40}$/;

/** Adds (or replaces) a portal. Throws on a malformed def, so a typo fails at load, not at the door. */
export function registerPortal(def: PortalDef): PortalDef {
  if (!ID_RE.test(def.id)) throw new Error(`portal id must match ${ID_RE}: ${def.id}`);
  if (!def.host.game || !Number.isInteger(def.host.devPort)) throw new Error(`portal ${def.id}: host game and devPort needed`);
  if (def.doors.length === 0) throw new Error(`portal ${def.id}: at least one door`);
  for (const d of def.doors) {
    if (d.mode === 'native' && d.game !== def.host.game) throw new Error(`portal ${def.id}: a native door must be in the host game`);
  }
  REG.set(def.id, def);
  return def;
}

export function getPortal(id: string): PortalDef | undefined {
  return REG.get(id);
}

export function listPortals(): PortalDef[] {
  return [...REG.values()];
}

/** The doors standing in one game: what that game should place and wire. */
export function doorsFor(game: string): { portal: PortalDef; door: PortalDoor }[] {
  const out: { portal: PortalDef; door: PortalDoor }[] = [];
  for (const portal of REG.values()) for (const door of portal.doors) if (door.game === game) out.push({ portal, door });
  return out;
}
