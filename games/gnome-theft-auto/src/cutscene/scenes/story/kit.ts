// Helpers for the main-story scenes (ch1.ts .. ch5.ts): read the stage spots of quests/stages.ts (marks, camera spots,
// cast rides) as SceneScript values, so a scene stands its cast where they live and drives what they drive.
// Heights in stages.ts camera spots are above the ground; these helpers turn them into exact world points.
import type { Loadout } from '@lawn/glaze';
import { heightAt } from '../../../terrain';
import type { VehicleKind } from '../../../types';
import { castById, stageById } from '../../../quests/stages';
import type { CamShot, Vec2, Vec3 } from '../../script';

/** A point `h` metres above the ground at (x, z). */
export function up(x: number, z: number, h: number): Vec3 {
  return [x, heightAt(x, z) + h, z];
}

/** A stage's camera spot as a still 'cut' shot (its `from` / `look` heights are above the ground there). */
export function spot(stageId: string, camId: string): Extract<CamShot, { kind: 'cut' }> {
  const st = stageById(stageId);
  const c = st?.cameras.find((k) => k.id === camId);
  if (!st || !c) throw new Error(`story kit: no camera "${camId}" at stage "${stageId}"`);
  return { kind: 'cut', pos: up(c.from[0], c.from[2], c.from[1]), look: up(c.look[0], c.look[2], c.look[1]), fov: c.fov };
}

/** The n-th mark of `who` at a stage (a CAST id or a role such as 'player', 'bodyguard'): where they stand and face. */
export function markOf(stageId: string, who: string, n = 0): { at: Vec2; yaw: number } {
  const m = stageById(stageId)?.marks.filter((k) => k.who === who)[n];
  if (!m) throw new Error(`story kit: no mark ${n} for "${who}" at stage "${stageId}"`);
  return { at: [m.at[0], m.at[1]], yaw: m.yaw };
}

/** A vehicle mark at a stage (parked / pull-up / exit spots): where it stands and which way it faces. */
export function carMark(stageId: string, id: string): { at: Vec2; yaw: number; kind: VehicleKind } {
  const v = stageById(stageId)?.vehicles.find((k) => k.id === id);
  if (!v) throw new Error(`story kit: no vehicle mark "${id}" at stage "${stageId}"`);
  return { at: [v.at[0], v.at[1]], yaw: v.yaw, kind: v.kind };
}

/** A stage's drive path points (roads, already checked against the world by stages.test.ts). */
export function pathOf(stageId: string, id: string): Vec2[] {
  const p = stageById(stageId)?.paths.find((k) => k.id === id);
  if (!p) throw new Error(`story kit: no path "${id}" at stage "${stageId}"`);
  return p.points.map((q) => [q[0], q[1]] as Vec2);
}

/** What a cast member drives: its kind and Pay 'n' Glaze look (stages.ts CAST). */
export function rideOf(castId: string): { kind: VehicleKind; loadout?: Partial<Loadout> } {
  const v = castById(castId)?.vehicle;
  if (!v) throw new Error(`story kit: "${castId}" drives nothing`);
  return { kind: v.kind, loadout: v.glaze };
}
