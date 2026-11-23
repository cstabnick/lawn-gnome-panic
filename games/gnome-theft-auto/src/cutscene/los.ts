// Line-of-sight and collision checks for cutscene shots, purely on collider boxes and the ground function (no three.js):
// camera not inside geometry, the shot's target visible, actors standing on the ground and not in walls, walk and drive
// paths clear of buildings, vehicles on the ground (boats on water). check.ts runs these over a whole script.
import { VEHICLES } from '../config';
import type { Box } from '../types';
import { groundHeight, insideBox, pushOutOfBoxes } from '../collide';
import type { SceneFrame, ScenePath, Vec3 } from './script';

export interface LosWorld {
  /** Collider boxes (types.ts Box: footprint + top height h; solid from the ground up to h). */
  boxes: readonly Box[];
  /** Ground height (terrain.ts heightAt in the world, 0 in a room). */
  ground(x: number, z: number): number;
  /** Water surface height at (x, z), or null where there is no water (terrain.ts waterAt(x, z)?.surface). */
  water?(x: number, z: number): number | null;
}

export type LosIssueKind =
  | 'camera-inside' | 'camera-underground' | 'camera-in-actor' | 'target-hidden'
  | 'actor-floating' | 'actor-buried' | 'actor-in-wall'
  | 'path-blocked' | 'path-off-ground'
  | 'vehicle-off-ground' | 'boat-off-water';

export interface LosIssue {
  kind: LosIssueKind;
  /** Scene time, seconds (-1 for path issues). */
  t: number;
  /** Index into Timeline.steps of the cam / walk / drive step concerned, or -1. */
  step: number;
  who?: string;
  at: Vec3;
  detail: string;
}

export interface LosOptions {
  /** The camera must be this far from any box and above the ground by this much. Default 0.3. */
  cameraMargin?: number;
  /** A hit within this distance of the target point does not hide it. Default 0.6. */
  targetSlack?: number;
  /** Feet may be this far off the ground. Default 0.25. */
  groundTolerance?: number;
  /** Walking gnome radius. Default 0.3. */
  actorRadius?: number;
}

const DEFAULTS = { cameraMargin: 0.3, targetSlack: 0.6, groundTolerance: 0.25, actorRadius: 0.3 };

/** First thing hit on the segment a -> b, sampled every stepM metres. */
export function segmentHit(a: Vec3, b: Vec3, w: LosWorld, opts?: { stepM?: number }): { point: Vec3; by: 'box' | 'terrain'; frac: number } | null {
  const stepM = opts?.stepM ?? 0.25;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.max(1, Math.ceil(len / stepM));
  for (let i = 1; i <= n; i++) {
    const frac = i / n;
    const x = a[0] + (b[0] - a[0]) * frac;
    const y = a[1] + (b[1] - a[1]) * frac;
    const z = a[2] + (b[2] - a[2]) * frac;
    if (y < w.ground(x, z)) return { point: [x, y, z], by: 'terrain', frac };
    if (insideBox(x, y, z, w.boxes)) return { point: [x, y, z], by: 'box', frac };
  }
  return null;
}

/** What the point is inside of (a box grown by margin, or below the ground + margin), or null. */
export function pointBlocked(p: Vec3, w: LosWorld, margin = 0): 'box' | 'terrain' | null {
  const [x, y, z] = p;
  if (y < w.ground(x, z) + margin) return 'terrain';
  if (w.water) {
    const s = w.water(x, z);
    if (s !== null && y < s + 0.1) return 'terrain';
  }
  if (margin > 0 ? pushOutOfBoxes(x, z, margin, w.boxes, y).hit : insideBox(x, y, z, w.boxes)) return 'box';
  return null;
}

const r1 = (n: number): string => (Math.round(n * 10) / 10).toString();
const at3 = (p: Vec3): string => `(${r1(p[0])}, ${r1(p[1])}, ${r1(p[2])})`;

/** Walking floor under an actor or vehicle at (x, y, z): the ground, or a box top it stands on. */
function floorUnder(x: number, y: number, z: number, r: number, w: LosWorld): number {
  return Math.max(w.ground(x, z), groundHeight(x, z, r, w.boxes, y));
}

/** Camera and actor / vehicle issues in one sampled frame. */
export function checkFrame(frame: SceneFrame, w: LosWorld, opts?: LosOptions): LosIssue[] {
  const o = { ...DEFAULTS, ...opts };
  const out: LosIssue[] = [];
  const cam = frame.camera;
  const t = frame.t;

  // Camera not inside geometry or underground.
  const camBlock = pointBlocked(cam.pos, w, o.cameraMargin);
  if (camBlock === 'box') {
    out.push({ kind: 'camera-inside', t, step: cam.step, at: cam.pos, detail: `camera inside a box at ${at3(cam.pos)}` });
  } else if (camBlock === 'terrain') {
    out.push({ kind: 'camera-underground', t, step: cam.step, at: cam.pos, detail: `camera underground at ${at3(cam.pos)}` });
  }

  // The shot's target must be visible from the camera.
  const aimAt = (id: string | null): { p: Vec3; who: string | undefined } | null => {
    if (id === null) return null;
    const a = frame.actors[id];
    if (a && a.visible) return { p: [a.x, a.y + a.head, a.z], who: id };
    const v = frame.vehicles[id];
    if (v && v.visible) return { p: [v.x, v.y + 0.8, v.z], who: id };
    return null;
  };
  const targetId = cam.target;
  const targetPoint = aimAt(targetId)?.p ?? cam.look;
  const checkSight = (p: Vec3, who: string | undefined): void => {
    const hit = segmentHit(cam.pos, p, w);
    if (!hit) return;
    const dx = hit.point[0] - p[0], dy = hit.point[1] - p[1], dz = hit.point[2] - p[2];
    if (Math.hypot(dx, dy, dz) > o.targetSlack) {
      out.push({
        kind: 'target-hidden', t, step: cam.step, who, at: hit.point,
        detail: `${who ?? 'the shot target'} hidden by a ${hit.by} at ${at3(hit.point)}`,
      });
    }
  };
  checkSight(targetPoint, targetId ?? undefined);

  // The speaker's head must be visible too, when it is not the camera target.
  if (frame.say) {
    const sayer = frame.actors[frame.say.who];
    if (sayer && sayer.visible && frame.say.who !== targetId) {
      checkSight([sayer.x, sayer.y + sayer.head, sayer.z], frame.say.who);
    }
  }

  // The camera must not sit inside a standing gnome (its body and hat fill the frame). Seated riders are skipped:
  // interior shots sit right next to them.
  for (const a of Object.values(frame.actors)) {
    if (!a.visible || a.seatedIn !== null) continue;
    const r = Math.max(0.3, a.head * 0.45);
    if (Math.hypot(cam.pos[0] - a.x, cam.pos[2] - a.z) < r && cam.pos[1] > a.y - 0.1 && cam.pos[1] < a.y + a.head * 1.35) {
      out.push({ kind: 'camera-in-actor', t, step: cam.step, who: a.id, at: cam.pos,
        detail: `camera inside ${a.id} at ${at3(cam.pos)}` });
    }
  }

  // Actors on their feet: not floating, buried or inside a wall.
  for (const a of Object.values(frame.actors)) {
    if (!a.visible || a.seatedIn !== null || a.mount !== null) continue;
    const floor = floorUnder(a.x, a.y, a.z, 0.2, w);
    if (a.y - floor > o.groundTolerance) {
      out.push({ kind: 'actor-floating', t, step: -1, who: a.id, at: [a.x, a.y, a.z],
        detail: `${a.id} floats ${r1(a.y - floor)} m above the ground at ${at3([a.x, a.y, a.z])}` });
    } else if (floor - a.y > o.groundTolerance) {
      out.push({ kind: 'actor-buried', t, step: -1, who: a.id, at: [a.x, a.y, a.z],
        detail: `${a.id} is ${r1(floor - a.y)} m under the ground at ${at3([a.x, a.y, a.z])}` });
    }
    if (pushOutOfBoxes(a.x, a.z, o.actorRadius, w.boxes, a.y + 0.05).hit) {
      out.push({ kind: 'actor-in-wall', t, step: -1, who: a.id, at: [a.x, a.y, a.z],
        detail: `${a.id} is inside a wall at ${at3([a.x, a.y, a.z])}` });
    }
  }

  // Vehicles: ground vehicles on the ground, boats on water.
  for (const v of Object.values(frame.vehicles)) {
    if (!v.visible) continue;
    const spec = VEHICLES[v.kind];
    if (!spec || spec.flies) continue;
    const at: Vec3 = [v.x, v.y, v.z];
    if (spec.boat) {
      const s = w.water ? w.water(v.x, v.z) : null;
      if (s === null || s === undefined) {
        out.push({ kind: 'boat-off-water', t, step: -1, who: v.id, at,
          detail: `${v.id} is not on water at ${at3(at)}` });
      }
      continue;
    }
    const floor = floorUnder(v.x, v.y, v.z, 0.5, w);
    if (Math.abs(v.y - floor) > 0.4) {
      out.push({ kind: 'vehicle-off-ground', t, step: -1, who: v.id, at,
        detail: `${v.id} is ${r1(v.y - floor)} m off the ground at ${at3(at)}` });
      continue;
    }
    const s = w.water ? w.water(v.x, v.z) : null;
    if (s !== null && s - floor > 0.5) {
      out.push({ kind: 'vehicle-off-ground', t, step: -1, who: v.id, at,
        detail: `${v.id} is in deep water at ${at3(at)}` });
    }
  }
  return out;
}

/** Issues along one walk or drive path: one per run of consecutive bad points, at the run's first point. */
export function checkPath(path: ScenePath, w: LosWorld, opts?: LosOptions): LosIssue[] {
  const o = { ...DEFAULTS, ...opts };
  const out: LosIssue[] = [];
  type Kind = 'path-blocked' | 'path-off-ground' | 'boat-off-water';
  let spec: (typeof VEHICLES)[keyof typeof VEHICLES] | undefined;
  let r = 0;
  if (path.kind === 'drive') {
    spec = path.vehicleKind ? VEHICLES[path.vehicleKind] : undefined;
    if (!spec) return out;
    r = spec.radius * 0.8;
  }

  // Classify each point: the issue kind it breaks, or null.
  const classify = (x: number, y: number, z: number): Kind | null => {
    const ground = w.ground(x, z);
    const water = w.water ? w.water(x, z) : null;
    if (path.kind === 'walk') {
      if (pushOutOfBoxes(x, z, o.actorRadius, w.boxes, y + 0.05).hit) return 'path-blocked';
      if (water !== null && water - ground > 0.6) return 'path-off-ground';
      return null;
    }
    if (!spec) return null;
    if (spec.flies) return pushOutOfBoxes(x, z, r, w.boxes, y).hit ? 'path-blocked' : null;
    if (spec.boat) return water === null ? 'boat-off-water' : null;
    if (pushOutOfBoxes(x, z, r, w.boxes, y + 0.3).hit) return 'path-blocked';
    if (water !== null && water - ground > 0.5) return 'path-off-ground';
    return null;
  };

  let prev: Kind | null = null;
  for (const p of path.points) {
    const kind = classify(p[0], p[1], p[2]);
    if (kind !== null && kind !== prev) {
      const what = kind === 'path-blocked' ? 'blocked by a building'
        : kind === 'boat-off-water' ? 'off the water' : 'off the ground';
      out.push({ kind, t: -1, step: path.step, who: path.who, at: p,
        detail: `${path.who} path ${what} at ${at3(p)}` });
    }
    prev = kind;
  }
  return out;
}
