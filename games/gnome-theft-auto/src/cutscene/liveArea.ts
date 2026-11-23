// A live-world scene (SceneScript.world 'live', the default on a world stage) keeps traffic, pedestrians and critters
// running. This works out, purely, the circles kept clear of them while it plays: one round the scene's area (the
// actors', vehicles' and walk paths' points, or SceneScript.clearArea), and a string of small ones along every drive
// path so ambient mowers never cross a scripted getaway. traffic.ts and npcs.ts take the circles (setKeepOut).
import { scenePaths } from './timeline';
import type { SceneScript, StageEnv, Timeline, Vec2 } from './script';

export interface KeepOutZone { x: number; z: number; r: number }

export interface LiveWorld {
  /** The middle of the scene's biggest group (the game centres ambient traffic and pedestrians on the camera). */
  x: number;
  z: number;
  /** The area circles first (one per group of actors / vehicles standing within CLUSTER m of each other), then the drive-path circles. */
  zones: KeepOutZone[];
}

/** Margin round the outermost actor / vehicle point, and the area's radius limits, m. */
const AREA_MARGIN = 9;
const AREA_MIN = 14;
const AREA_MAX = 45;
/** Drive paths: a circle this wide every PATH_SPACING m. */
const PATH_R = 6.5;
const PATH_SPACING = 5;
/** Points this close to a group join it: a scene that cuts between two places gets a circle at each. */
const CLUSTER = 40;

/** Is the scene live? World stages default to live; rooms never are. */
export function isLiveScene(script: SceneScript): boolean {
  return script.stage.kind === 'world' && script.world !== 'paused';
}

const xz = (p: readonly number[]): Vec2 => (p.length === 3 ? [p[0], p[2]] : [p[0], p[1]]);

/** The clear zones of a live scene, or null for a paused or room scene. */
export function liveWorldFor(script: SceneScript, tl: Timeline, env: StageEnv): LiveWorld | null {
  if (!isLiveScene(script)) return null;
  const paths = scenePaths(tl, env);

  let areas: KeepOutZone[];
  if (script.clearArea) {
    areas = [{ x: script.clearArea.at[0], z: script.clearArea.at[1], r: script.clearArea.r }];
  } else {
    const pts: Vec2[] = [];
    for (const a of script.actors ?? []) if (!a.seatedIn) pts.push(xz(a.at));
    for (const v of script.vehicles ?? []) if (v.from !== 'player') pts.push(xz(v.at));
    for (const p of paths) if (p.kind === 'walk') for (const q of p.points) pts.push([q[0], q[2]]);
    if (pts.length === 0) {
      // A camera-only scene: round its first fixed shot, else nowhere in particular (paths still count).
      const cam = (script.steps.find((s) => s.do === 'cam') as Extract<SceneScript['steps'][number], { do: 'cam' }> | undefined)?.shot;
      if (cam && (cam.kind === 'cut' || cam.kind === 'track')) pts.push([cam.pos[0], cam.pos[2]]);
      else if (cam && cam.kind === 'dolly') pts.push([cam.from[0], cam.from[2]]);
    }
    if (pts.length === 0) pts.push([0, 0]);
    // Greedy groups: a point joins the first group with a member within CLUSTER m.
    const groups: Vec2[][] = [];
    for (const p of pts) {
      const g = groups.find((gr) => gr.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < CLUSTER));
      if (g) g.push(p);
      else groups.push([p]);
    }
    groups.sort((a, b) => b.length - a.length);
    areas = groups.map((g) => {
      let cx = 0, cz = 0;
      for (const [x, z] of g) { cx += x; cz += z; }
      cx /= g.length;
      cz /= g.length;
      let far = 0;
      for (const [x, z] of g) far = Math.max(far, Math.hypot(x - cx, z - cz));
      return { x: cx, z: cz, r: Math.min(AREA_MAX, Math.max(AREA_MIN, far + AREA_MARGIN)) };
    });
  }

  const area = areas[0];
  const zones: KeepOutZone[] = [...areas];
  for (const p of paths) {
    if (p.kind !== 'drive') continue;
    let since = Infinity;
    let lx = 0, lz = 0;
    for (const q of p.points) {
      since += Math.hypot(q[0] - lx, q[2] - lz);
      lx = q[0];
      lz = q[2];
      if (since < PATH_SPACING) continue;
      since = 0;
      if (areas.some((a) => Math.hypot(q[0] - a.x, q[2] - a.z) + PATH_R <= a.r)) continue;
      zones.push({ x: q[0], z: q[2], r: PATH_R });
    }
  }
  return { x: area.x, z: area.z, zones };
}

/** Is (x, z) inside any zone (grown by `pad` m)? */
export function inKeepOut(zones: readonly KeepOutZone[] | null, x: number, z: number, pad = 0): boolean {
  if (!zones) return false;
  for (const k of zones) if (Math.hypot(x - k.x, z - k.z) < k.r + pad) return true;
  return false;
}
