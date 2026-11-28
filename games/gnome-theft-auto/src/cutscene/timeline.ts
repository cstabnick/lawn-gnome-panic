// Compiles a SceneScript into timed steps and samples any moment of it, purely: no three.js, no DOM. The director
// plays a scene with these; the collision checks (los.ts, check.ts) sample the same frames without a browser.
import { VEHICLES } from '../config';
import { exitLocal, exitSeconds, seatPos } from '../seats';
import type { VehicleKind } from '../types';
import { castOf } from './cast';
import type {
  CamShot, CameraSample, LineTiming, Point, SceneFrame, ScenePath, SceneScript, ScriptVehicle, ShotSize, StageEnv,
  Step, Target, TimedStep, Timeline, Vec3,
} from './script';
import { INTRO_SECONDS } from './script';
import { lineTiming } from './textSpeed';

/** A vehicle-local point (x = left, z = nose) turned to the world ground, for a vehicle at (x, z) facing yaw. */
function localToWorld(o: { x: number; z: number; yaw: number }, lx: number, lz: number): { x: number; z: number } {
  const c = Math.cos(o.yaw), s = Math.sin(o.yaw);
  return { x: o.x + lx * c + lz * s, z: o.z - lx * s + lz * c };
}

export const DEFAULT_FOV = 52;
export const WALK_SPEED = 1.6;
export const RUN_SPEED = 4;

/** Spacing of the spline samples (metres) and of the scene path points handed to the collision checks. */
const SPLINE_STEP = 0.25;
const PATH_STEP = 0.5;
/** How far ahead the drive's steering reads its yaw change (metres). */
const LOOK_AHEAD = 0.5;
/** Yaw rate (rad/s) that counts as a full steer. */
const STEER_FULL = 1.5;

/** A horizontal point. y is set only when the script gave one; otherwise it comes from the stage ground. */
interface Pt { x: number; z: number; y?: number }
/** A polyline measured by horizontal arc length. */
interface Line { pts: Pt[]; cum: number[]; total: number }
type Ground = (x: number, z: number) => number;

/** What a compiled walk or drive moves along, kept for sampling and scenePaths. */
interface Geo { kind: 'walk' | 'drive'; who: string; vehicleKind?: VehicleKind; line: Line }
/** Compile-time position of an actor or vehicle. */
interface Mover { pt: Pt; yaw: number; kind?: VehicleKind }

const geos = new WeakMap<TimedStep, Geo>();

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const lerp3 = (a: Vec3, b: Vec3, u: number): Vec3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

function toPt(p: Point): Pt {
  return p.length === 3 ? { x: p[0], y: p[1], z: p[2] } : { x: p[0], z: p[1] };
}

/** A point with its y resolved from the ground when the script did not give one. */
function placeAt(p: Point, ground: Ground): { x: number; y: number; z: number } {
  const q = toPt(p);
  return { x: q.x, y: q.y ?? ground(q.x, q.z), z: q.z };
}

function groundFor(env: StageEnv, kind?: VehicleKind): Ground {
  if (!kind) return (x, z) => env.ground(x, z);
  return (x, z) => env.vehicleGround?.(kind, x, z) ?? env.ground(x, z);
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** Uniform Catmull-Rom through the points (end points duplicated), sampled about every SPLINE_STEP metres. */
function densify(ctrl: Pt[], spline: boolean): Pt[] {
  const n = ctrl.length;
  if (!spline || n < 2) return ctrl;
  const out: Pt[] = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(n - 1, i + 2)];
    const steps = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.z - p1.z) / SPLINE_STEP));
    for (let k = 0; k < steps; k++) {
      const f = k / steps;
      const pt: Pt = { x: catmull(p0.x, p1.x, p2.x, p3.x, f), z: catmull(p0.z, p1.z, p2.z, p3.z, f) };
      if (p1.y !== undefined && p2.y !== undefined) pt.y = lerp(p1.y, p2.y, f);
      out.push(pt);
    }
  }
  out.push(ctrl[n - 1]);
  return out;
}

/** Drops repeated points and measures the polyline. */
function makeLine(raw: Pt[]): Line {
  const pts: Pt[] = [];
  for (const p of raw) {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 1e-6) pts.push(p);
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  }
  return { pts, cum, total: cum[cum.length - 1] };
}

/** The point and facing a distance s along a line (clamped to its ends). */
function lineAt(line: Line, s: number, fallbackYaw: number): { x: number; z: number; y: number | undefined; yaw: number } {
  const { pts, cum, total } = line;
  if (pts.length === 1 || total <= 0) return { x: pts[0].x, z: pts[0].z, y: pts[0].y, yaw: fallbackYaw };
  const d = Math.min(Math.max(s, 0), total);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const segLen = cum[i] - cum[i - 1];
  const f = segLen > 0 ? (d - cum[i - 1]) / segLen : 0;
  return {
    x: lerp(a.x, b.x, f),
    z: lerp(a.z, b.z, f),
    y: a.y !== undefined && b.y !== undefined ? lerp(a.y, b.y, f) : undefined,
    yaw: Math.atan2(b.x - a.x, b.z - a.z),
  };
}

/** Walk or drive progress for u in [0, 1] and its derivative (eases in / out per the step's flags). */
function ease(u: number, depart: boolean, arrive: boolean): [number, number] {
  if (depart && arrive) return [u * u * (3 - 2 * u), 6 * u * (1 - u)];
  if (depart) return [u * u, 2 * u];
  if (arrive) return [1 - (1 - u) * (1 - u), 2 * (1 - u)];
  return [u, 1];
}

/** Compiles a SceneScript into timed steps: starts, durations, and the walk / drive geometry. */
export function compile(script: SceneScript, timing: LineTiming = lineTiming()): Timeline {
  const vehicleDefs = new Map<string, ScriptVehicle>();
  for (const v of script.vehicles ?? []) vehicleDefs.set(v.id, v);
  const movers = new Map<string, Mover>();
  const seated = new Map<string, string | null>();
  const seatOf = new Map<string, number>();
  for (const v of script.vehicles ?? []) movers.set(v.id, { pt: toPt(v.at), yaw: v.yaw ?? 0, kind: v.kind });
  for (const a of script.actors ?? []) {
    const car = a.seatedIn ? vehicleDefs.get(a.seatedIn) : undefined;
    seated.set(a.id, a.seatedIn ?? null);
    seatOf.set(a.id, a.seat ?? 0);
    movers.set(a.id, { pt: toPt(car ? car.at : a.at), yaw: a.yaw ?? 0 });
  }
  const mover = (id: string): Mover => {
    let m = movers.get(id);
    if (!m) {
      m = { pt: { x: 0, z: 0 }, yaw: 0 };
      movers.set(id, m);
    }
    return m;
  };

  const out: TimedStep[] = [];

  /** Non-blocking: async steps, cams (unless wait), shakes. */
  const blocks = (s: Step): boolean => !s.async && (s.do !== 'cam' || s.wait === true) && s.do !== 'shake';

  const sizeOf = (ts: TimedStep, step: Step): void => {
    switch (step.do) {
      case 'wait':
        ts.dur = step.s;
        break;
      case 'say': {
        const typeDur = Number.isFinite(timing.charsPerSecond) ? step.text.length / timing.charsPerSecond : 0;
        ts.typeDur = typeDur;
        ts.dur = typeDur + timing.holdSeconds(step.text);
        ts.gate = true;
        break;
      }
      case 'walk': {
        const m = mover(step.who);
        const ctrl = [m.pt, ...step.path.map(toPt)];
        const line = makeLine(ctrl);
        const speed = step.speed ?? (step.run ? RUN_SPEED : WALK_SPEED);
        ts.dur = line.total > 0 && speed > 0 ? line.total / speed : 0;
        geos.set(ts, { kind: 'walk', who: step.who, line });
        if (step.path.length > 0) {
          m.pt = ctrl[ctrl.length - 1];
          m.yaw = lineAt(line, line.total, m.yaw).yaw;
        }
        break;
      }
      case 'face':
        ts.dur = step.s ?? 0.4;
        break;
      case 'gesture':
        ts.dur = step.s ?? (step.name === 'sit' || step.name === 'stand' ? 0.6 : 1.2);
        break;
      case 'spawn': {
        const m = mover(step.id);
        if (step.at) m.pt = toPt(step.at);
        if (step.yaw !== undefined) m.yaw = step.yaw;
        break;
      }
      case 'give':
        ts.dur = step.s ?? 1;
        break;
      case 'enter': {
        ts.dur = step.s ?? 2.6;
        ts.gate = true;
        const v = mover(step.vehicle);
        mover(step.who).pt = { ...v.pt };
        seated.set(step.who, step.vehicle);
        seatOf.set(step.who, step.seat ?? 0);
        break;
      }
      case 'exit': {
        ts.dur = step.s ?? 2.2;
        ts.gate = true;
        const vid = seated.get(step.who);
        const car = vid ? movers.get(vid) : undefined;
        const kind = vid ? vehicleDefs.get(vid)?.kind : undefined;
        if (car && kind) {
          const e = exitLocal(VEHICLES[kind], seatOf.get(step.who) ?? 0);
          const m = mover(step.who);
          m.pt = localToWorld({ x: car.pt.x, z: car.pt.z, yaw: car.yaw }, e.x, e.z);
          m.yaw = car.yaw;
        }
        seated.set(step.who, null);
        break;
      }
      case 'drive': {
        const v = mover(step.vehicle);
        const ctrl = [v.pt, ...step.path.map(toPt)];
        const line = makeLine(densify(ctrl, step.spline !== false));
        ts.dur = line.total > 0 && step.speed > 0 ? line.total / step.speed : 0;
        geos.set(ts, { kind: 'drive', who: step.vehicle, vehicleKind: v.kind, line });
        if (step.path.length > 0) {
          v.pt = ctrl[ctrl.length - 1];
          v.yaw = lineAt(line, line.total, v.yaw).yaw;
        }
        break;
      }
      case 'cam':
        ts.dur = step.shot.kind === 'dolly' || step.shot.kind === 'orbit' ? step.shot.s : step.shot.kind === 'frame' && step.shot.push ? step.shot.push.s : 0;
        break;
      case 'shake':
        ts.dur = step.s;
        break;
      case 'fade':
        ts.dur = step.s;
        break;
      case 'intro':
        ts.dur = step.s ?? INTRO_SECONDS;
        break;
      default:
        break;
    }
  };

  /** Places a list of steps from `origin`; returns the latest end time of the list. */
  const run = (steps: Step[], origin: number): number => {
    let cursor = origin;
    let end = origin;
    for (const step of steps) {
      const start = cursor;
      const ts: TimedStep = { step, start, dur: 0, order: out.length, gate: false };
      out.push(ts);
      if (step.do === 'parallel') {
        let trackEnd = start;
        for (const track of step.tracks) trackEnd = Math.max(trackEnd, run(track, start));
        ts.dur = trackEnd - start;
      } else {
        sizeOf(ts, step);
      }
      end = Math.max(end, start + ts.dur);
      if (blocks(step)) cursor = start + ts.dur;
    }
    return end;
  };

  run(script.steps, 0);
  const steps = out.sort((a, b) => a.start - b.start || a.order - b.order);
  const duration = steps.reduce((m, ts) => Math.max(m, ts.start + ts.dur), 0);
  return { script, steps, duration };
}

/** A pose used by the camera: an actor's feet and facing, a vehicle's, or a prop's. */
function poseOf(frame: SceneFrame, id: string): { x: number; y: number; z: number; yaw: number } | null {
  const o = frame.actors[id] ?? frame.vehicles[id] ?? frame.props[id];
  return o ? { x: o.x, y: o.y, z: o.z, yaw: o.yaw } : null;
}

/** The point a target means now (head / centre / a prop's middle), ignoring visibility; null for an unknown id. */
function rawPoint(frame: SceneFrame, id: string): Vec3 | null {
  const a = frame.actors[id];
  if (a) return [a.x, a.y + a.head, a.z];
  const v = frame.vehicles[id];
  if (v) return [v.x, v.y + 0.8, v.z];
  const p = frame.props[id];
  if (p) return [p.x, p.y + 0.3, p.z];
  return null;
}

/** The world point a camera target means in this frame, or null for an unknown / hidden id. */
export function targetPoint(frame: SceneFrame, target: Target): Vec3 | null {
  if (typeof target !== 'string') return target;
  const visible = frame.actors[target]?.visible ?? frame.vehicles[target]?.visible ?? frame.props[target]?.visible;
  return visible ? rawPoint(frame, target) : null;
}

/** A camera target's point, falling back to its last known point (or [0, 1, 0] for an unknown id). */
function pointOf(frame: SceneFrame, target: Target): Vec3 {
  if (typeof target !== 'string') return target;
  return targetPoint(frame, target) ?? rawPoint(frame, target) ?? [0, 1, 0];
}

/** A local-frame offset [right, up, forward] of a pose, in world coordinates. */
function local(o: { x: number; y: number; z: number; yaw: number }, v: Vec3): Vec3 {
  const s = Math.sin(o.yaw);
  const c = Math.cos(o.yaw);
  // forward = (sin, 0, cos), right = (-cos, 0, sin)
  return [o.x - c * v[0] + s * v[2], o.y + v[1], o.z + s * v[0] + c * v[2]];
}

function shotCamera(frame: SceneFrame, shot: CamShot, elapsed: number): Omit<CameraSample, 'step' | 'shake'> {
  switch (shot.kind) {
    case 'cut':
      return {
        pos: shot.pos,
        look: pointOf(frame, shot.look),
        fov: shot.fov ?? DEFAULT_FOV,
        target: typeof shot.look === 'string' ? shot.look : null,
      };
    case 'dolly': {
      const u = shot.s > 0 ? clamp01(elapsed / shot.s) : 1;
      const e = shot.ease === 'linear' ? u : u * u * (3 - 2 * u);
      const from = pointOf(frame, shot.look);
      const to = pointOf(frame, shot.lookTo ?? shot.look);
      const fov0 = shot.fov ?? DEFAULT_FOV;
      return {
        pos: lerp3(shot.from, shot.to, e),
        look: lerp3(from, to, e),
        fov: lerp(fov0, shot.fovTo ?? fov0, e),
        target: typeof shot.look === 'string' ? shot.look : null,
      };
    }
    case 'orbit': {
      const c = pointOf(frame, shot.around);
      const u = shot.s > 0 ? clamp01(elapsed / shot.s) : 1;
      const a = lerp(shot.fromYaw, shot.toYaw, u);
      return {
        pos: [c[0] + Math.sin(a) * shot.radius, c[1] + shot.height, c[2] + Math.cos(a) * shot.radius],
        look: c,
        fov: shot.fov ?? DEFAULT_FOV,
        target: typeof shot.around === 'string' ? shot.around : null,
      };
    }
    case 'follow': {
      const o = poseOf(frame, shot.who) ?? { x: 0, y: 1, z: 0, yaw: 0 };
      return {
        pos: local(o, shot.offset ?? [0, 2.2, -5.5]),
        look: local(o, shot.look ?? [0, 1, 3]),
        fov: shot.fov ?? DEFAULT_FOV,
        target: shot.who,
      };
    }
    case 'track':
      return { pos: shot.pos, look: pointOf(frame, shot.who), fov: shot.fov ?? DEFAULT_FOV, target: shot.who };
    case 'frame':
      return frameCamera(frame, shot, elapsed);
  }
}

/**
 * Shot sizes: the share of the frame's height the gnome fills, the lens (vertical fov) that goes with it, and the aim
 * height (x head height) that puts the eyes on the upper third, clear of the subtitle card. A gnome
 * stands GNOME_HEIGHT x its head height (hat tip). pacing.ts classifies any shot back into these sizes.
 */
export const SHOT_SIZES: Record<ShotSize, { fill: number; fov: number; lookAt: number }> = {
  cu: { fill: 1.7, fov: 30, lookAt: 0.81 },
  mcu: { fill: 1.15, fov: 35, lookAt: 0.75 },
  ms: { fill: 0.8, fov: 40, lookAt: 0.67 },
  fs: { fill: 0.5, fov: 45, lookAt: 0.5 },
  ws: { fill: 0.2, fov: 52, lookAt: 0.5 },
};
/** A gnome's height (to the hat tip) over its sample's `head` height. */
export const GNOME_HEIGHT = 1.3;

/** The 'frame' shot: camera placed by shot size round an actor, off its eyeline to `toward`, or over `over`'s shoulder. */
function frameCamera(frame: SceneFrame, shot: Extract<CamShot, { kind: 'frame' }>, elapsed = 0): Omit<CameraSample, 'step' | 'shake'> {
  const a = frame.actors[shot.who];
  let spec = SHOT_SIZES[shot.size];
  if (shot.push) {
    // A push-in (or pull-out): the size eases from `size` to `push.to` over `push.s` seconds.
    const u = shot.push.s > 0 ? clamp01(elapsed / shot.push.s) : 1;
    const e = u * u * (3 - 2 * u);
    const to = SHOT_SIZES[shot.push.to];
    spec = { fill: lerp(spec.fill, to.fill, e), fov: lerp(spec.fov, to.fov, e), lookAt: lerp(spec.lookAt, to.lookAt, e) };
  }
  const fov = shot.fov ?? spec.fov;
  if (!a) return { pos: [0, 1.6, 4], look: [0, 1, 0], fov, target: shot.who };
  const head = a.head;
  const h = head * GNOME_HEIGHT;
  const lookY = a.y + head * spec.lookAt;
  const look: Vec3 = [a.x, lookY, a.z];
  const tanHalf = Math.tan(((fov / 2) * Math.PI) / 180);
  const over = shot.over ? frame.actors[shot.over] : undefined;
  if (over) {
    // Behind the near actor's shoulder, a little above its head, looking at `who`.
    const dx = a.x - over.x;
    const dz = a.z - over.z;
    const len = Math.hypot(dx, dz) || 1;
    const fx = dx / len;
    const fz = dz / len;
    const s = (shot.side ?? 1) >= 0 ? 1 : -1;
    // The over actor's right (as it faces who) is (-fz, fx); side < 0 takes the left shoulder.
    const lx = -fz * s;
    const lz = fx * s;
    const back = Math.max(1.0, over.head * 1.15);
    const pos: Vec3 = [over.x - fx * back + lx * over.head * 0.6, over.y + over.head * 1.0, over.z - fz * back + lz * over.head * 0.6];
    return { pos, look, fov: shot.fov ?? 38, target: shot.who };
  }
  const dist = h / (spec.fill * 2 * tanHalf);
  let base: number;
  const to = shot.toward ? frame.actors[shot.toward] : undefined;
  if (to) base = Math.atan2(to.x - a.x, to.z - a.z);
  else base = a.yaw;
  const ang = base + (((shot.side ?? 25) * Math.PI) / 180);
  const camY = shot.height === 'low' ? a.y + head * 0.35 : shot.height === 'high' ? lookY + h * 0.7 : lookY;
  const pos: Vec3 = [a.x + Math.sin(ang) * dist, Math.max(camY, a.y + 0.25), a.z + Math.cos(ang) * dist];
  return { pos, look, fov, target: shot.who };
}

/** Everything on stage at time t. Steps are replayed in timeline order up to t. */
export function sampleFrame(tl: Timeline, t: number, env: StageEnv): SceneFrame {
  const { script } = tl;
  const room = script.stage.kind === 'room';
  const vehicleDefs = new Map<string, ScriptVehicle>();
  for (const v of script.vehicles ?? []) vehicleDefs.set(v.id, v);

  const frame: SceneFrame = {
    t,
    actors: {},
    vehicles: {},
    props: {},
    camera: { pos: [0, 1.6, 4], look: [0, 1, 0], fov: DEFAULT_FOV, step: -1, target: null, shake: 0 },
    say: null,
    title: script.title ?? null,
    caption: null,
    intro: null,
    fade: 0,
  };
  const { actors, vehicles, props } = frame;

  for (const v of script.vehicles ?? []) {
    const p = placeAt(v.at, groundFor(env, v.kind));
    vehicles[v.id] = {
      id: v.id, kind: v.kind, visible: !v.hidden, x: p.x, y: p.y, z: p.z, yaw: v.yaw ?? 0,
      speed: 0, steer: 0, headlights: !!v.headlights, driving: false,
    };
  }
  for (const a of script.actors ?? []) {
    const car = a.seatedIn ? vehicleDefs.get(a.seatedIn) : undefined;
    const p = placeAt(car ? car.at : a.at, groundFor(env, car?.kind));
    const c = castOf(a, { room });
    actors[a.id] = {
      id: a.id, visible: !a.hidden, x: p.x, y: p.y, z: p.z, yaw: a.yaw ?? 0, speed: 0, head: 0.9 * c.scale,
      gesture: null, gestureT: 0, sitting: false, talking: false, held: c.held,
      seatedIn: a.seatedIn ?? null, seat: a.seat ?? 0, mount: null,
    };
  }
  for (const p of script.props ?? []) {
    const at = placeAt(p.at, groundFor(env));
    props[p.id] = { id: p.id, visible: !p.hidden, x: at.x, y: at.y, z: at.z, yaw: p.yaw ?? 0 };
  }

  let fade = 0;
  let shake = 0;
  let say: SceneFrame['say'] = null;
  let camIndex = -1;
  let camShot: CamShot | null = null;
  let camElapsed = 0;

  for (let i = 0; i < tl.steps.length; i++) {
    const ts = tl.steps[i];
    if (ts.start > t) continue;
    const st = ts.step;
    const elapsed = t - ts.start;
    const running = t < ts.start + ts.dur;
    switch (st.do) {
      case 'spawn': {
        const obj = actors[st.id] ?? vehicles[st.id] ?? props[st.id];
        if (!obj) break;
        obj.visible = true;
        if (st.at) {
          const p = placeAt(st.at, groundFor(env, vehicles[st.id]?.kind));
          obj.x = p.x; obj.y = p.y; obj.z = p.z;
        }
        if (st.yaw !== undefined) obj.yaw = st.yaw;
        break;
      }
      case 'despawn': {
        const obj = actors[st.id] ?? vehicles[st.id] ?? props[st.id];
        if (obj) obj.visible = false;
        break;
      }
      case 'walk': {
        const a = actors[st.who];
        const g = geos.get(ts);
        if (!a || !g) break;
        const total = g.line.total;
        const u = ts.dur > 0 ? clamp01(elapsed / ts.dur) : 1;
        const p = lineAt(g.line, u * total, a.yaw);
        a.x = p.x; a.z = p.z; a.y = p.y ?? env.ground(p.x, p.z); a.yaw = p.yaw;
        a.speed = running ? total / ts.dur : 0;
        break;
      }
      case 'face': {
        const a = actors[st.who];
        if (!a) break;
        const from = a.yaw;
        let target: number | null = null;
        if (st.yaw !== undefined) target = st.yaw;
        else if (typeof st.at === 'string') {
          const o = poseOf(frame, st.at);
          if (o) target = Math.atan2(o.x - a.x, o.z - a.z);
        } else if (st.at) target = Math.atan2(st.at[0] - a.x, st.at[1] - a.z);
        if (target === null) break;
        const s = st.s ?? 0.4;
        const u = s > 0 ? clamp01(elapsed / s) : 1;
        a.yaw = from + wrap(target - from) * u;
        break;
      }
      case 'gesture': {
        const a = actors[st.who];
        if (!a) break;
        if (st.name === 'sit') a.sitting = true;
        else if (st.name === 'stand') a.sitting = false;
        if (running) {
          a.gesture = st.name;
          a.gestureT = elapsed;
        }
        break;
      }
      case 'hold': {
        const a = actors[st.who];
        if (a) a.held = st.prop;
        break;
      }
      case 'give': {
        const from = actors[st.from];
        const to = actors[st.to];
        if (!from || !to) break;
        const s = st.s ?? 1;
        if (elapsed >= s / 2) {
          to.held = st.prop ?? from.held;
          from.held = null;
        }
        if (running) {
          from.gesture = 'point'; from.gestureT = elapsed;
          to.gesture = 'point'; to.gestureT = elapsed;
        }
        break;
      }
      case 'enter': {
        const a = actors[st.who];
        const v = vehicles[st.vehicle];
        if (!a || !v) break;
        if (running) {
          const u = clamp01(elapsed / ts.dur);
          const seat = seatPos(VEHICLES[v.kind], st.seat ?? 0);
          const sp = localToWorld(v, seat[0], seat[2]);
          a.x = lerp(a.x, sp.x, u); a.y = lerp(a.y, v.y + seat[1], u); a.z = lerp(a.z, sp.z, u);
          a.mount = { vehicle: st.vehicle, mode: 'enter', t: elapsed, dur: ts.dur };
        } else {
          a.mount = null;
          a.seatedIn = st.vehicle;
          a.seat = st.seat ?? 0;
        }
        break;
      }
      case 'exit': {
        const a = actors[st.who];
        const v = a?.seatedIn ? vehicles[a.seatedIn] : undefined;
        if (!a || !v) break;
        const spec = VEHICLES[v.kind];
        const e = exitLocal(spec, a.seat);
        const end = localToWorld(v, e.x, e.z);
        const ex = end.x, ez = end.z;
        const ey = env.ground(ex, ez);
        if (running) {
          // The estimate moves at the real sequence's pace (mount.ts), from the seat to the spot outside.
          const u = clamp01(elapsed / Math.min(ts.dur, exitSeconds(spec)));
          const seat = seatPos(spec, a.seat);
          const sp = localToWorld(v, seat[0], seat[2]);
          a.mount = { vehicle: v.id, mode: 'exit', t: elapsed, dur: ts.dur };
          a.x = lerp(sp.x, ex, u); a.y = lerp(v.y + seat[1], ey, u); a.z = lerp(sp.z, ez, u);
          a.yaw = v.yaw;
        } else {
          a.mount = null;
          a.seatedIn = null;
          a.x = ex; a.y = ey; a.z = ez;
          a.yaw = v.yaw;
        }
        break;
      }
      case 'drive': {
        const v = vehicles[st.vehicle];
        const g = geos.get(ts);
        if (!v || !g) break;
        const L = g.line.total;
        const u = ts.dur > 0 ? clamp01(elapsed / ts.dur) : 1;
        const [p, dp] = ease(u, st.depart ?? true, st.arrive ?? true);
        const arc = p * L;
        const cur = lineAt(g.line, arc, v.yaw);
        const speed = running ? (L * dp) / ts.dur : 0;
        v.x = cur.x;
        v.z = cur.z;
        v.y = cur.y ?? groundFor(env, v.kind)(cur.x, cur.z);
        v.yaw = cur.yaw;
        v.speed = speed;
        v.driving = running;
        const ahead = lineAt(g.line, Math.min(L, arc + LOOK_AHEAD), cur.yaw);
        const yawRate = (wrap(ahead.yaw - cur.yaw) / LOOK_AHEAD) * speed;
        v.steer = Math.max(-1, Math.min(1, yawRate / STEER_FULL));
        break;
      }
      case 'lights': {
        const v = vehicles[st.vehicle];
        if (v) v.headlights = st.on;
        break;
      }
      case 'say': {
        if (!running) break;
        const len = st.text.length;
        const typeDur = ts.typeDur ?? 0;
        const shown = typeDur > 0 ? Math.min(len, Math.floor((elapsed * len) / typeDur)) : len;
        say = { step: i, who: st.who, text: st.text, shown, typing: shown < len };
        break;
      }
      case 'title':
        frame.title = st.text;
        break;
      case 'caption':
        frame.caption = st.text;
        break;
      case 'intro':
        if (running) frame.intro = { step: i, who: st.who, t: elapsed, dur: ts.dur };
        break;
      case 'fade':
        fade = running ? lerp(fade, st.to, clamp01(elapsed / st.s)) : st.to;
        break;
      case 'shake':
        if (running) shake += st.amp * (1 - elapsed / st.s);
        break;
      case 'cam':
        camIndex = i;
        camShot = st.shot;
        camElapsed = elapsed;
        break;
      default:
        break;
    }
  }

  // A seated actor rides its vehicle (an exit in progress is drawn by the director's mount sequence instead).
  for (const a of Object.values(actors)) {
    if (!a.seatedIn || a.mount?.mode === 'exit') continue;
    const v = vehicles[a.seatedIn];
    if (v) {
      a.x = v.x; a.y = v.y; a.z = v.z; a.yaw = v.yaw;
    }
  }
  for (const a of Object.values(actors)) a.talking = !!say && say.who === a.id && say.typing;

  frame.say = say;
  frame.fade = fade;
  frame.camera = camShot
    ? { ...shotCamera(frame, camShot, camElapsed), step: camIndex, shake }
    : { ...frame.camera, shake };
  return frame;
}

/** steps with from <= start < to, in timeline order. */
export function eventsBetween(tl: Timeline, from: number, to: number): TimedStep[] {
  return tl.steps.filter((s) => s.start >= from && s.start < to);
}

/** Every walk and drive path, densified to points about every 0.5 m, for the collision checks. */
export function scenePaths(tl: Timeline, env: StageEnv): ScenePath[] {
  const out: ScenePath[] = [];
  tl.steps.forEach((ts, index) => {
    const g = geos.get(ts);
    if (!g) return;
    const ground = g.kind === 'drive' ? groundFor(env, g.vehicleKind) : groundFor(env);
    const n = Math.max(1, Math.ceil(g.line.total / PATH_STEP));
    const points: Vec3[] = [];
    for (let k = 0; k <= n; k++) {
      const p = lineAt(g.line, (g.line.total * k) / n, 0);
      points.push([p.x, p.y ?? ground(p.x, p.z), p.z]);
    }
    out.push({ who: g.who, kind: g.kind, vehicleKind: g.vehicleKind, step: index, points });
  });
  return out;
}

// ---- GR6: scene weather and key light ---------------------------------------------------------------------------------

/**
 * The weather a world scene plays in (SceneScript.weather): the scene's own pick, else rain under a 'rain' / 'storm'
 * bed, snow under a 'snow' bed, else clear. null: keep the world's weather (a room stage, or `weather: 'world'`).
 */
export function sceneWeather(script: SceneScript): Exclude<SceneScript['weather'], 'world' | undefined> | null {
  if (script.stage.kind !== 'world') return null;
  const w = script.weather;
  if (w === 'world') return null;
  if (w) return w;
  if (script.ambience === 'rain' || script.ambience === 'storm') return 'rain';
  if (script.ambience === 'snow') return 'snow';
  return 'clear';
}

/** 0..1: how much of a key light (SceneKeyLight from / until) is on at scene time t, eased over 0.8 s each way. */
export function keyLightLevel(from: number | undefined, until: number | undefined, t: number): number {
  const EASE = 0.8;
  const on = from === undefined ? 1 : Math.min(1, Math.max(0, (t - from) / EASE));
  const off = until === undefined ? 1 : Math.min(1, Math.max(0, (until - t) / EASE));
  return Math.min(on, off);
}

/**
 * Does a scene want the camera-side face fill (SceneScript.faceFill)? `night` is the world's own night factor (0 day ..
 * 1 night), used when the scene holds no `sky`. Rooms are lit by their own lamps, so they never get one unless asked.
 */
export function wantsFaceFill(script: SceneScript, night: number): boolean {
  if (script.faceFill === false) return false;
  if (script.faceFill !== undefined) return true;
  if (script.stage.kind !== 'world') return false;
  if (script.sky) return script.sky !== 'noon';
  return night > 0.35;
}
