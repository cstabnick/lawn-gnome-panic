// Helpers for the side-quest scenes: read a stage spot (quests/stages.ts) and a cast member's own vehicle, so scenes are
// written against the same marks, cameras and glaze looks the world uses. Pure data in, plain script data out.
import { heightAt } from '../../../terrain';
import { castById, stageById, type Stage } from '../../../quests/stages';
import type { CamShot, Point, ScriptVehicle, Vec2, Vec3 } from '../../script';

function stage(id: string): Stage {
  const s = stageById(id);
  if (!s) throw new Error(`[side scenes] no stage "${id}"`);
  return s;
}

/** A stage's actor mark for `who` (a CAST id or role such as 'player'): where they stand and which way they face. */
export function markOf(stageId: string, who: string): { at: Vec2; yaw: number } {
  const m = stage(stageId).marks.find((k) => k.who === who);
  if (!m) throw new Error(`[side scenes] stage "${stageId}" has no mark for "${who}"`);
  return { at: [m.at[0], m.at[1]], yaw: m.yaw };
}

/** A stage camera spot as absolute world points (its heights are above the ground there). */
export function camOf(stageId: string, camId: string): { pos: Vec3; look: Vec3; fov: number } {
  const c = stage(stageId).cameras.find((k) => k.id === camId);
  if (!c) throw new Error(`[side scenes] stage "${stageId}" has no camera "${camId}"`);
  const [fx, fh, fz] = c.from;
  const [lx, lh, lz] = c.look;
  return { pos: [fx, heightAt(fx, fz) + fh, fz], look: [lx, heightAt(lx, lz) + lh, lz], fov: c.fov };
}

/** A still shot from a stage camera spot (its own look point and fov unless overridden). */
export function stageCut(stageId: string, camId: string, fov?: number): CamShot {
  const c = camOf(stageId, camId);
  return { kind: 'cut', pos: c.pos, look: c.look, fov: fov ?? c.fov };
}

/** A point `h` metres above the ground at (x, z): for camera positions and look points. */
export function above(x: number, z: number, h: number): Vec3 {
  return [x, heightAt(x, z) + h, z];
}

/** A stage's walk loop for `who`, as walk-path points. */
export function walkOf(stageId: string, who: string): Vec2[] {
  const w = stage(stageId).walks.find((k) => k.who === who);
  if (!w) throw new Error(`[side scenes] stage "${stageId}" has no walk for "${who}"`);
  return w.points.map((p) => [p[0], p[1]] as Vec2);
}

/** A stage's drive path by id, as drive points. */
export function pathOf(stageId: string, pathId: string): Vec2[] {
  const p = stage(stageId).paths.find((k) => k.id === pathId);
  if (!p) throw new Error(`[side scenes] stage "${stageId}" has no path "${pathId}"`);
  return p.points.map((q) => [q[0], q[1]] as Vec2);
}

/**
 * A cast member's own vehicle (CAST in quests/stages.ts: kind and Pay 'n' Glaze look), as a scene vehicle with id `id`.
 * `at` / `yaw` default to its parked mark. `extra` adds or overrides fields (hidden, headlights, keep, from...).
 */
export function castRide(castId: string, id: string, at?: Point, yaw?: number, extra: Partial<ScriptVehicle> = {}): ScriptVehicle {
  const c = castById(castId);
  if (!c?.vehicle) throw new Error(`[side scenes] cast "${castId}" has no vehicle`);
  let place: Point | undefined = at;
  let face = yaw;
  if (!place) {
    const home = stage(c.home);
    const m = [home, ...c.haunts.map((h) => stageById(h)).filter((s): s is Stage => !!s)]
      .flatMap((s) => s.vehicles)
      .find((v) => v.id === c.vehicle!.parkedAt);
    if (!m) throw new Error(`[side scenes] no parked mark "${c.vehicle.parkedAt}" for "${castId}"`);
    place = [m.at[0], m.at[1]];
    face ??= m.yaw;
  }
  return { id, kind: c.vehicle.kind, at: place, yaw: face ?? 0, ...(c.vehicle.glaze ? { loadout: c.vehicle.glaze } : {}), ...extra };
}
