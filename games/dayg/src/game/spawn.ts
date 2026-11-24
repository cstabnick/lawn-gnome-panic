// Multi-zone player spawn selection: picks a valid, clear ground-level spot in a different region each run.
import { PLAYER_HEIGHT, PLAYER_RADIUS, STEP_UP } from '../config';
import type { RegionDef, RegionId } from '../sim/types';
import type { BlockoutMap } from '../world/types';
import type { Collider } from '../world/collide';
import type { Vec3 } from './types';

const STORAGE_KEY = 'dayg_last_spawn_region';

export function pickZoneSpawn(
  map: BlockoutMap,
  regions: readonly RegionDef[],
  collider: Collider,
  rng: () => number,
): { pos: Vec3; region: RegionId | null } {
  const tmp: Vec3 = { x: 0, y: 0, z: 0 };
  const byRegion = new Map<RegionId, Vec3>();

  // Prefer authored ground-level spots (npc, fire, hatless) that are clear of colliders.
  for (const s of map.spots) {
    if (byRegion.has(s.region)) continue;
    if (s.kind !== 'npc' && s.kind !== 'fire' && s.kind !== 'hatless') continue;
    const y = collider.groundAt(s.x, s.z, 1e6);
    if (y > 4) continue; // avoid high roofs as random spawns
    if (collider.inBounds(s.x, s.z) && collider.move({ x: s.x, y, z: s.z }, 0, 0, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, tmp) === null) {
      byRegion.set(s.region, { x: s.x, y, z: s.z });
    }
  }

  // Fill any remaining regions with a clear spot near their center.
  for (const r of regions) {
    if (byRegion.has(r.id)) continue;
    const cx = (r.rect.x0 + r.rect.x1) / 2;
    const cz = (r.rect.z0 + r.rect.z1) / 2;
    for (const [ox, oz] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [6, 6], [-6, -6]] as const) {
      const x = cx + ox, z = cz + oz;
      const y = collider.groundAt(x, z, 1e6);
      if (y > 4) continue;
      if (collider.inBounds(x, z) && collider.move({ x, y, z }, 0, 0, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, tmp) === null) {
        byRegion.set(r.id, { x, y, z });
        break;
      }
    }
  }

  if (byRegion.size === 0) {
    return { pos: { ...map.playerSpawn }, region: collider.regionAt(map.playerSpawn.x, map.playerSpawn.z) };
  }

  let last: string | null = null;
  try { last = sessionStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }

  let choices = [...byRegion.entries()];
  if (last && choices.length > 1) {
    const filtered = choices.filter(([id]) => id !== last);
    if (filtered.length > 0) choices = filtered;
  }

  const pick = choices[Math.min(choices.length - 1, Math.floor(rng() * choices.length))];
  try { sessionStorage.setItem(STORAGE_KEY, pick[0]); } catch { /* ignore */ }
  return { pos: { ...pick[1] }, region: pick[0] };
}
