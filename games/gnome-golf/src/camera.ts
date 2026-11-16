// Camera rig: a TV golf broadcast camera driven by the phase machine. Reads state only; moves the camera,
// its look target, the field of view and the sun's shadow box.
import * as THREE from 'three';
import { ROUND, type Ctx, type GameState, type HoleDef, type ShotResult, type System } from './config';
import { heightAt } from './course';
import { previewLanding } from './physics';
import { currentHole, mowerPose } from './round';

interface XZ { x: number; z: number }

/** Desired camera position `p`, look target `t`, and the point the sun's shadow box follows. */
interface Pose {
  p: THREE.Vector3;
  t: THREE.Vector3;
  subject: THREE.Vector3;
}

/** Per-shot camera memory: the landing-cam point (chosen once) and whether the ball has landed. */
interface ShotCam {
  flight: ShotResult;
  landP: THREE.Vector3;
  /** Flight time of the first bounce, roll, cup or water event: a fallback for the landing switch. */
  groundT: number;
  landed: boolean;
}

const FOV_LANDSCAPE = 55;
const FOV_PORTRAIT = 70;
const K_NORMAL = 3;
const K_INTRO = 6;
const SNAP_DIST = 150;
const SNAP_PHASES: ReadonlySet<GameState['phase']> = new Set<GameState['phase']>(['title', 'intro', 'aim']);
const SHADOW_WIDE = 300;
const SHADOW_NARROW = 40;
const SUN_OFFSET = new THREE.Vector3(60, 120, 40);
const HOLD_S = 0.5;
const CHASE_BACK = 14;
const CHASE_UP = 5;
const LAND_SIDE = 18;
const LAND_BACK = 8;
const LAND_UP = 7;
const APEX_LOW_YD = 25;
const INTRO_FLY_END = 0.7;
const INTRO_HEIGHT = 45;
const INTRO_LOOK_AHEAD = 60;
const LANDING_CACHE_MAX = 64;

/** previewLanding costs ~5 ms, so overhead aim poses cache it by the inputs that change it. */
const landingCache = new Map<string, THREE.Vector3>();

function smooth(u: number): number {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
}

function horizDir(yaw: number): THREE.Vector3 {
  return new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
}

/** Unit horizontal vector of v, or a copy of `fallback` when v has no horizontal part. */
function horizUnit(v: THREE.Vector3, fallback: THREE.Vector3): THREE.Vector3 {
  const h = Math.hypot(v.x, v.z);
  if (h < 1e-4) return fallback.clone();
  return new THREE.Vector3(v.x / h, 0, v.z / h);
}

/** Right-hand side of a horizontal direction (see the convention in config.ts). */
function rightOf(d: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(-d.z, 0, d.x);
}

/** Never let the camera go under the terrain + 0.8 yd, or below y = 1. */
function clampAbove(v: THREE.Vector3): void {
  const floor = Math.max(1, heightAt(v.x, v.z) + 0.8);
  if (v.y < floor) v.y = floor;
}

function pathLength(path: readonly XZ[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].z - path[i].z);
  }
  return total;
}

/** Point at arc length `s` along a polyline (clamped to its ends). */
function pathPoint(path: readonly XZ[], s: number): XZ {
  let rem = Math.max(0, s);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (rem <= len) {
      const f = len > 0 ? rem / len : 0;
      return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
    }
    rem -= len;
  }
  const last = path[path.length - 1];
  return { x: last.x, z: last.z };
}

/** Ball position at flight time t, interpolated between the recorded samples. */
function sampleFlight(f: ShotResult, t: number): THREE.Vector3 {
  const pts = f.points;
  const n = pts.length - 1;
  if (n <= 0) return pts[0].clone();
  const idx = Math.min(n, Math.max(0, t / f.sampleDt));
  const i = Math.min(n - 1, Math.floor(idx));
  return pts[i].clone().lerp(pts[i + 1], idx - i);
}

function landingFor(s: GameState): THREE.Vector3 {
  const b = s.ball;
  const key = `${b.x},${b.z},${s.club},${s.lie},${s.aimYaw.toFixed(3)}`;
  const hit = landingCache.get(key);
  if (hit) return hit;
  if (landingCache.size >= LANDING_CACHE_MAX) landingCache.clear();
  const L = previewLanding(b, s.club, s.lie, s.aimYaw, currentHole(s).pin);
  landingCache.set(key, L);
  return L;
}

/** The 'aim' / 'swing' pose: behind the ball (full swing or putter) or overhead of the landing spot. */
/** True on a tall (portrait) screen; set by the rig every frame. */
let portraitView = false;

function aimPose(s: GameState, portrait = portraitView): Pose {
  const b = s.ball;
  const dir = horizDir(s.aimYaw);
  if (s.view === 'overhead') {
    const L = landingFor(s);
    const M = new THREE.Vector3((b.x + L.x) / 2, (b.y + L.y) / 2, (b.z + L.z) / 2);
    const d = Math.hypot(L.x - b.x, L.z - b.z);
    const p = new THREE.Vector3(M.x - dir.x * d * 0.35, M.y + Math.max(30, d * 1.1), M.z - dir.z * d * 0.35);
    return { p, t: M, subject: b.clone() };
  }
  if (s.mode === 'disc') {
    // Gnome Disc: a little higher and further back than golf, so Disco does not hide the basket on short throws.
    return {
      p: new THREE.Vector3(b.x - dir.x * 7, b.y + 3.4, b.z - dir.z * 7),
      t: new THREE.Vector3(b.x + dir.x * 14, b.y + (portrait ? -1.2 : 0), b.z + dir.z * 14),
      subject: b.clone(),
    };
  }
  if (s.club === 'PT') {
    return {
      p: new THREE.Vector3(b.x - dir.x * 3.2, b.y + 1.3, b.z - dir.z * 3.2),
      t: new THREE.Vector3(b.x + dir.x * 6, b.y, b.z + dir.z * 6),
      subject: b.clone(),
    };
  }
  // Portrait: look further down so the golfer sits above the swing meter, which is higher up on a tall screen.
  return {
    p: new THREE.Vector3(b.x - dir.x * 6.5, b.y + 2.3, b.z - dir.z * 6.5),
    t: portrait ? new THREE.Vector3(b.x + dir.x * 12, b.y - 1.6, b.z + dir.z * 12) : new THREE.Vector3(b.x + dir.x * 14, b.y - 0.5, b.z + dir.z * 14),
    subject: b.clone(),
  };
}

/** Flyover pose at arc length s along the hole's path: high above the ground, looking ahead along the path. */
function flyPose(path: readonly XZ[], total: number, s: number): { p: THREE.Vector3; t: THREE.Vector3 } {
  const q = pathPoint(path, s);
  const a = pathPoint(path, Math.min(total, s + INTRO_LOOK_AHEAD));
  return {
    p: new THREE.Vector3(q.x, heightAt(q.x, q.z) + INTRO_HEIGHT, q.z),
    t: new THREE.Vector3(a.x, heightAt(a.x, a.z) + 1, a.z),
  };
}

/** Hole intro: fly the path, then blend (smoothstep) into the aim pose over the last 30%. */
function introPose(s: GameState, aim: Pose): Pose {
  const hole: HoleDef = currentHole(s);
  const total = pathLength(hole.path);
  const u = Math.min(1, Math.max(0, s.phaseTime / ROUND.introSeconds));
  let p: THREE.Vector3;
  let t: THREE.Vector3;
  if (u < INTRO_FLY_END) {
    const f = flyPose(hole.path, total, (u / INTRO_FLY_END) * total);
    p = f.p;
    t = f.t;
  } else {
    const end = flyPose(hole.path, total, total);
    const w = smooth((u - INTRO_FLY_END) / (1 - INTRO_FLY_END));
    p = end.p.lerp(aim.p, w);
    t = end.t.lerp(aim.t, w);
  }
  return { p, t, subject: t.clone() };
}

/** Flight: hold the aim pose for the first half second, chase the ball until it is falling and low, then the landing cam. */
function flightPose(s: GameState, f: ShotResult, sc: ShotCam, aim: Pose): Pose {
  const t = s.phaseTime;
  const p = sampleFlight(f, t);
  // Putts stay on the putter pose and watch the ball.
  if (s.club === 'PT' || t < HOLD_S) return { p: aim.p, t: p, subject: p };
  const prev = sampleFlight(f, Math.max(0, t - f.sampleDt));
  const v = p.clone().sub(prev);
  const falling = v.y < 0;
  const low = p.y - heightAt(p.x, p.z) < APEX_LOW_YD;
  if (!sc.landed && ((falling && low) || t >= sc.groundT)) sc.landed = true;
  if (sc.landed) return { p: sc.landP.clone(), t: p, subject: p };
  const fwd = horizUnit(v, horizDir(s.aimYaw));
  const pos = new THREE.Vector3(p.x - fwd.x * CHASE_BACK, p.y + CHASE_UP, p.z - fwd.z * CHASE_BACK);
  return { p: pos, t: p, subject: p };
}

/** Landing cam: a fixed point beside and behind the rest position, chosen once per shot. */
function makeShotCam(s: GameState, f: ShotResult): ShotCam {
  const start = s.ball;
  const dir = horizUnit(new THREE.Vector3(f.end.x - start.x, 0, f.end.z - start.z), horizDir(s.aimYaw));
  const side = rightOf(dir);
  const landP = new THREE.Vector3(
    f.end.x + side.x * LAND_SIDE - dir.x * LAND_BACK,
    f.end.y + LAND_UP,
    f.end.z + side.z * LAND_SIDE - dir.z * LAND_BACK,
  );
  const ev = f.events.find((e) => e.kind === 'bounce' || e.kind === 'roll' || e.kind === 'cup' || e.kind === 'water');
  return { flight: f, landP, groundT: ev ? ev.t : Infinity, landed: false };
}

/** The desired camera pose for the current phase. Read-only on state; `pos` is the camera's current position. */
function desiredPose(s: GameState, pos: THREE.Vector3, sc: ShotCam | null): Pose {
  switch (s.phase) {
    case 'title': {
      const t = s.time;
      return {
        p: new THREE.Vector3(Math.cos(t * 0.05) * 950, 320, Math.sin(t * 0.05) * 800),
        t: new THREE.Vector3(0, 0, 0),
        subject: new THREE.Vector3(0, 0, 0),
      };
    }
    case 'intro':
      return introPose(s, aimPose(s));
    case 'aim':
    case 'swing':
      return aimPose(s);
    case 'flight':
      if (s.flight && sc) return flightPose(s, s.flight, sc, aimPose(s));
      return aimPose(s);
    case 'result': {
      const end = s.flight ? s.flight.end : s.ball;
      return { p: pos.clone(), t: end.clone(), subject: end.clone() };
    }
    case 'drive': {
      const m = mowerPose(s);
      const f = horizDir(m.facing);
      return {
        p: new THREE.Vector3(m.x - f.x * 9, m.y + 4.5, m.z - f.z * 9),
        t: new THREE.Vector3(m.x + f.x * 6, m.y + 1, m.z + f.z * 6),
        subject: new THREE.Vector3(m.x, m.y, m.z),
      };
    }
    case 'holed': {
      const pin = currentHole(s).pin;
      const py = heightAt(pin.x, pin.z);
      const dir = horizDir(s.aimYaw);
      const side = rightOf(dir);
      const t = new THREE.Vector3(pin.x, py, pin.z);
      return {
        p: new THREE.Vector3(pin.x + side.x * 3 - dir.x * 3, py + 1.4, pin.z + side.z * 3 - dir.z * 3),
        t,
        subject: t.clone(),
      };
    }
    case 'card':
    case 'final': {
      const g = currentHole(s).green;
      const gy = heightAt(g.x, g.z);
      const a = s.time * 0.15;
      return {
        p: new THREE.Vector3(g.x + Math.cos(a) * 30, gy + 14, g.z + Math.sin(a) * 30),
        t: new THREE.Vector3(g.x, gy, g.z),
        subject: new THREE.Vector3(g.x, gy, g.z),
      };
    }
    default:
      return aimPose(s);
  }
}

export function createCameraRig(ctx: Ctx): System {
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  let initialized = false;
  let lastPhase: GameState['phase'] | null = null;
  let shotCam: ShotCam | null = null;
  let shadowWide: boolean | null = null;

  return {
    update(dt: number): void {
      const s = ctx.state;
      portraitView = ctx.camera.aspect < 1;
      const cam = ctx.camera;
      const phaseChanged = s.phase !== lastPhase;
      lastPhase = s.phase;

      if (s.phase === 'flight' && s.flight && (!shotCam || shotCam.flight !== s.flight)) {
        shotCam = makeShotCam(s, s.flight);
      }

      const want = desiredPose(s, pos, shotCam);
      clampAbove(want.p);

      if (!initialized || (phaseChanged && SNAP_PHASES.has(s.phase) && pos.distanceTo(want.p) > SNAP_DIST)) {
        pos.copy(want.p);
        look.copy(want.t);
        initialized = true;
      } else {
        const k = s.phase === 'intro' ? K_INTRO : K_NORMAL;
        const a = 1 - Math.exp(-k * dt);
        pos.lerp(want.p, a);
        look.lerp(want.t, a);
      }
      clampAbove(pos);
      cam.position.copy(pos);
      cam.lookAt(look);

      const fov = cam.aspect < 1 ? FOV_PORTRAIT : FOV_LANDSCAPE;
      if (cam.fov !== fov) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }

      // Sun: its shadow box follows the subject; wide over the whole island for title and intro.
      const sun = ctx.lights.sun;
      sun.target.position.copy(want.subject);
      sun.position.copy(want.subject).add(SUN_OFFSET);
      const wide = s.phase === 'title' || s.phase === 'intro';
      if (shadowWide !== wide) {
        const h = wide ? SHADOW_WIDE : SHADOW_NARROW;
        const sc = sun.shadow.camera;
        sc.left = -h;
        sc.right = h;
        sc.top = h;
        sc.bottom = h;
        sc.updateProjectionMatrix();
        shadowWide = wide;
      }
    },
  };
}
