// Keep-out rectangles around every cutscene stage spot (src/quests/stages.ts): its centre, actor marks, vehicle marks,
// idle walks and drive paths. Landscaping (landscaping.ts gardens, scenery.ts belts) keeps clear of them so a hedge
// or a tree never lands on a mark. Only used for clearance checks: these are not colliders.
import { STAGES } from './quests/stages';

export interface KeepOut { minX: number; maxX: number; minZ: number; maxZ: number; h: number }

let cache: KeepOut[] | null = null;

/** Points scenes use that are not on a stage: [x, z, half size]. */
const SCENE_SPOTS: readonly (readonly [number, number, number])[] = [
  [-86, -45, 4], // sq-big-lou-embargo-vip: the VIP meet in the park block
  // sq-tessie-tabloid: the tattler's walk on the loch shore, [[-700, -532], [-712, -506]]
  [-700, -532, 4], [-703, -525.5, 4], [-706, -519, 4], [-709, -512.5, 4], [-712, -506, 4],
];

/** Small squares (h = Infinity) over every point a stage needs clear. */
export function stageKeepOut(): readonly KeepOut[] {
  if (cache) return cache;
  const out: KeepOut[] = [];
  const sq = (x: number, z: number, r: number): void => {
    out.push({ minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, h: Infinity });
  };
  const line = (pts: readonly (readonly [number, number])[], r: number): void => {
    for (let k = 0; k < pts.length; k++) {
      sq(pts[k][0], pts[k][1], r);
      if (k + 1 >= pts.length) break;
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) / r);
      for (let i = 1; i < n; i++) sq(ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n, r);
    }
  };
  for (const s of STAGES) {
    sq(s.center[0], s.center[1], 3);
    for (const m of s.marks) sq(m.at[0], m.at[1], 1.5);
    for (const v of s.vehicles) sq(v.at[0], v.at[1], 3);
    for (const w of s.walks) line(w.points, 1.5);
    for (const p of s.paths) line(p.points, 2.5);
  }
  // Scene-only spots (actors a scene places off its stage marks).
  for (const [x, z, r] of SCENE_SPOTS) sq(x, z, r);
  cache = out;
  return out;
}
