// Ambient life for the island: gnome golfers play the other holes in the distance, a castaway drifts
// past on the Gnaft raft, and seagulls circle the shore. Read-only on state; all art is built in code.
import * as THREE from 'three';
import { HOLES, type Ctx, type GameState, type HoleDef, type System } from './config';
import { coastRadius, distToPath, heightAt, holeLength } from './course';
import type { GnomeLook, GnomeModel, PlayerState } from './models/config';
import { createGnomeModel } from './models/gnome';
import { createMowerModel } from './models/mowerModels';

const UP = new THREE.Vector3(0, 1, 0);
const BALL_R = 0.1;
const WALK_SPEED = 1.5; // yd/s
const FLIGHT_SECONDS = 3.5;
const PUTT_SECONDS = 2;
const GREEN_RANGE = 160; // yd: a shot inside this goes onto the green
const CART_SIDE = 4; // yd to the hitter's left
const CART_BACK = 2.5; // yd behind the ball
const RAFT_FIRST = 25; // s after load
const RAFT_SPEED = 3; // yd/s along the arc
const RAFT_OFFSHORE = 170; // yd beyond the coast
const RAFT_ARC = 0.55; // rad either side of the ball's angle
const GULLS = 6;

const HAT_COLORS = [0xd93636, 0x7e57c2, 0x2e8b57, 0xf2c230, 0x2f64c9];
const SHIRT_COLORS = [0x2f64c9, 0xf4f4f4, 0xf2c230, 0x2e8b57, 0xe8743b, 0x8e44ad];
const PANT_COLORS = [0x6b4a2e, 0x2b3a67, 0x5d4037, 0x3a3a3a];
const SKIN_COLORS = [0xf1c27d, 0xf8dcc8, 0xc68642];
const HAIR_COLORS = [0xe2571e, 0x3e2723, 0xf4f4f4];
const CART_COLORS = [0xd8342c, 0x2f64c9, 0x2e8b57, 0xf2c230];
const RAFT_LOOK: GnomeLook = {
  hat: 0xd93636, shirt: 0x2f64c9, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0x222222,
  beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: false,
};

type XZ = { x: number; z: number };
type Step = 'walk' | 'address' | 'swing' | 'flight' | 'putt' | 'drive' | 'toNext';

interface Plan {
  from: XZ;
  to: XZ;
  yaw: number;
  green: boolean;
}
interface Bot {
  model: GnomeModel;
  ps: PlayerState;
}
interface Group {
  hole: number;
  /** Where the ball rests (the start of the current shot). */
  spot: XZ;
  ball: THREE.Mesh;
  ballShown: boolean;
  cart: THREE.Group;
  cartPos: XZ;
  cartYaw: number;
  bots: Bot[];
  plan: Plan;
  step: Step;
  timer: number;
  dur: number;
  player: number;
  segFrom: XZ;
  segTo: XZ;
  segYaw: number;
}
interface Raft {
  root: THREE.Group;
  gnome: GnomeModel;
  gnomeState: PlayerState;
  bobber: THREE.Group;
  line: THREE.Mesh;
  tip: THREE.Vector3;
}
interface Crossing {
  R: number;
  a0: number;
  a1: number;
  s: number;
  total: number;
}
interface Gull {
  obj: THREE.Group;
  left: THREE.Group;
  right: THREE.Group;
  r: number;
  w: number;
  phi0: number;
  y: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const randInt = (a: number, b: number): number => Math.floor(rand(a, b + 1));
const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
const vary = (base: number): number => base * rand(0.7, 1.3);

/** Point `s` yards along a hole's fairway centreline from the tee. */
function pointAlong(hole: HoleDef, s: number): XZ {
  let rem = Math.max(0, s);
  for (let i = 0; i < hole.path.length - 1; i++) {
    const a = hole.path[i];
    const b = hole.path[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (rem <= len || i === hole.path.length - 2) {
      const t = len > 0 ? Math.min(1, rem / len) : 0;
      return { x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t) };
    }
    rem -= len;
  }
  const last = hole.path[hole.path.length - 1];
  return { x: last.x, z: last.z };
}

/** A point `left` yards to the left (+x of the frame) and `forward` yards ahead of `from`, for a frame facing yaw. */
function offset(from: XZ, yaw: number, left: number, forward: number): XZ {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: from.x + c * left + s * forward, z: from.z - s * left + c * forward };
}

/** Plans one shot from `from` on hole `h`: 60% of the remaining path (min 25 yd), or the green inside 160 yd. */
function planShot(h: number, from: XZ): Plan {
  const hole = HOLES[h];
  const total = holeLength(hole);
  const along = distToPath(hole, from.x, from.z).along;
  const remaining = total - along;
  let to: XZ;
  let green = false;
  if (remaining <= GREEN_RANGE) {
    green = true;
    const a = rand(0, Math.PI * 2);
    const d = rand(0, hole.green.r * 0.5);
    to = { x: hole.green.x + Math.cos(a) * d, z: hole.green.z + Math.sin(a) * d };
  } else {
    const want = Math.max(25, 0.6 * remaining);
    to = pointAlong(hole, along + want);
    // Nudge along the path until the ball lands on dry ground (not in a pond).
    for (const off of [0, 8, -8, 16, -16, 24, -24]) {
      const q = pointAlong(hole, Math.min(total - 5, Math.max(along + 5, along + want + off)));
      if (heightAt(q.x, q.z) > 0.5) {
        to = q;
        break;
      }
    }
  }
  return { from: { ...from }, to, yaw: Math.atan2(to.x - from.x, to.z - from.z), green };
}

/** The cart parks 4 yd to the hitter's left and 2.5 yd back from the ball. */
function parkFor(p: Plan): XZ {
  return offset(p.from, p.yaw, CART_SIDE, -CART_BACK);
}

function nextHole(h: number, playerHole: number): number {
  const n = (h + 1) % HOLES.length;
  return n === playerHole ? (n + 1) % HOLES.length : n;
}

function restPoint(p: XZ): THREE.Vector3 {
  return new THREE.Vector3(p.x, heightAt(p.x, p.z) + BALL_R, p.z);
}

function flightPos(a: XZ, b: XZ, u: number): THREE.Vector3 {
  const apex = 0.15 * Math.hypot(b.x - a.x, b.z - a.z);
  const y0 = heightAt(a.x, a.z) + BALL_R;
  const y1 = heightAt(b.x, b.z) + BALL_R;
  return new THREE.Vector3(lerp(a.x, b.x, u), lerp(y0, y1, u) + 4 * apex * u * (1 - u), lerp(a.z, b.z, u));
}

/** Positions a cylinder of height 1 (built along y) so it runs from a to b. */
function placeBetween(m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3): void {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  m.scale.set(1, len, 1);
}

function newPlayerState(): PlayerState {
  return {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
    stamina: 1,
    staminaDelay: 0,
    sprinting: false,
    exhausted: false,
  };
}

function randomLook(): GnomeLook {
  const hair = Math.random() < 0.3 ? { color: pick(HAIR_COLORS), style: 'pigtails' as const } : null;
  return {
    hat: pick(HAT_COLORS),
    shirt: pick(SHIRT_COLORS),
    pants: pick(PANT_COLORS),
    skin: pick(SKIN_COLORS),
    boots: Math.random() < 0.5 ? 0x222222 : 0x6d4c41,
    beard: Math.random() < 0.5 ? pick([0xf4f4f4, 0x8d6e63]) : null,
    hair,
    freckles: false,
    glasses: false,
    dress: hair !== null && Math.random() < 0.7,
  };
}

function makeCart(root: THREE.Group): THREE.Group {
  const cart = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: pick(CART_COLORS), roughness: 0.6 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number): void => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    cart.add(mesh);
  };
  add(new THREE.BoxGeometry(2.2, 0.6, 1.4), paint, 0, 0.65, 0);
  for (const x of [-1.05, 1.05]) {
    for (const z of [-0.5, 0.5]) {
      const wheel = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
      wheel.rotateZ(Math.PI / 2);
      add(wheel, dark, x, 0.35, z);
    }
  }
  add(new THREE.BoxGeometry(2.4, 0.1, 1.6), white, 0, 1.95, 0);
  for (const x of [-1.05, 1.05]) {
    for (const z of [-0.6, 0.6]) add(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 6), white, x, 1.425, z);
  }
  root.add(cart);
  return cart;
}

/** Standing spot k beside the cart, on its right side (the ball is that way). */
function standSpot(g: Group, k: number): XZ {
  return offset(g.cartPos, g.cartYaw, -1.4 - 0.35 * k, 0.6);
}

/** Riding spot k on the cart. */
function riderSpot(g: Group, k: number): XZ {
  return offset(g.cartPos, g.cartYaw, -0.6 + 0.6 * k, 0.1);
}

function beginWalk(g: Group): void {
  g.step = 'walk';
  g.timer = 0;
  g.dur = 0;
  g.player = randInt(0, 2);
  g.ballShown = true;
  // Everyone gets off the cart where it is parked.
  g.bots.forEach((bot, k) => {
    const s = standSpot(g, k);
    bot.ps.position.set(s.x, heightAt(s.x, s.z), s.z);
    bot.ps.velocity.set(0, 0, 0);
  });
}

function beginDrive(g: Group, step: 'drive' | 'toNext', plan: Plan, dur: number): void {
  g.step = step;
  g.timer = 0;
  g.dur = dur;
  g.plan = plan;
  g.segFrom = { ...g.cartPos };
  g.segTo = parkFor(plan);
  g.segYaw = plan.yaw;
}

function beginPutt(g: Group): void {
  g.step = 'putt';
  g.timer = 0;
  g.dur = PUTT_SECONDS;
  g.segFrom = { ...g.spot };
  const pin = HOLES[g.hole].pin;
  g.segTo = { x: pin.x, z: pin.z };
}

function makeBall(root: THREE.Group): THREE.Mesh {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
  );
  ball.castShadow = true;
  root.add(ball);
  return ball;
}

function makeGroup(root: THREE.Group, hole: number): Group {
  const cart = makeCart(root);
  const ball = makeBall(root);
  const bots: Bot[] = [];
  for (let k = 0; k < 3; k++) {
    const model = createGnomeModel(randomLook());
    root.add(model.object);
    bots.push({ model, ps: newPlayerState() });
  }
  const tee = HOLES[hole].tee;
  const g: Group = {
    hole,
    spot: { x: tee.x, z: tee.z },
    ball,
    ballShown: true,
    cart,
    cartPos: { x: 0, z: 0 },
    cartYaw: 0,
    bots,
    plan: planShot(hole, tee),
    step: 'address',
    timer: 0,
    dur: 1,
    player: 0,
    segFrom: { x: 0, z: 0 },
    segTo: { x: 0, z: 0 },
    segYaw: 0,
  };
  // Start at a random point of the routine: a few shots in, standing over the ball.
  for (let i = randInt(0, 2); i > 0 && !g.plan.green; i--) {
    g.spot = { ...g.plan.to };
    g.plan = planShot(hole, g.spot);
  }
  g.cartPos = parkFor(g.plan);
  g.cartYaw = g.plan.yaw;
  g.player = randInt(0, 2);
  g.dur = vary(2.5);
  g.timer = rand(0, g.dur);
  return g;
}

function teleport(g: Group, h: number): void {
  g.hole = h;
  const tee = HOLES[h].tee;
  g.spot = { x: tee.x, z: tee.z };
  g.plan = planShot(h, g.spot);
  g.cartPos = parkFor(g.plan);
  g.cartYaw = g.plan.yaw;
  beginWalk(g);
}

function stepGroup(g: Group, dt: number, state: GameState): void {
  g.timer += dt;
  const bot = g.bots[g.player];
  switch (g.step) {
    case 'walk': {
      const p = bot.ps.position;
      const target = offset(g.plan.from, g.plan.yaw, 0.9, 0);
      const dx = target.x - p.x;
      const dz = target.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.05) {
        const step = Math.min(d, WALK_SPEED * dt);
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        bot.ps.velocity.set((dx / d) * WALK_SPEED, 0, (dz / d) * WALK_SPEED);
        bot.ps.facing = Math.atan2(dx, dz);
      } else {
        bot.ps.velocity.set(0, 0, 0);
        g.step = 'address';
        g.timer = 0;
        g.dur = vary(2.5);
      }
      break;
    }
    case 'address':
      if (g.timer >= g.dur) {
        g.step = 'swing';
        g.timer = 0;
        g.dur = vary(0.6);
      }
      break;
    case 'swing':
      if (g.timer >= g.dur) {
        g.step = 'flight';
        g.timer = 0;
        g.dur = FLIGHT_SECONDS;
        g.segFrom = { ...g.plan.from };
        g.segTo = { ...g.plan.to };
      }
      break;
    case 'flight': {
      const u = Math.min(1, g.timer / FLIGHT_SECONDS);
      g.ball.position.copy(flightPos(g.segFrom, g.segTo, u));
      if (u >= 1) {
        g.spot = { ...g.plan.to };
        if (g.plan.green) beginPutt(g);
        else beginDrive(g, 'drive', planShot(g.hole, g.spot), rand(3, 4));
      }
      break;
    }
    case 'putt': {
      const u = Math.min(1, g.timer / PUTT_SECONDS);
      g.ball.position.copy(
        restPoint({ x: lerp(g.segFrom.x, g.segTo.x, u), z: lerp(g.segFrom.z, g.segTo.z, u) }),
      );
      if (u >= 1) {
        // Holed out: the ball is gone and the group rides to the next tee.
        g.ballShown = false;
        g.hole = nextHole(g.hole, state.holeIndex);
        const tee = HOLES[g.hole].tee;
        g.spot = { x: tee.x, z: tee.z };
        const plan = planShot(g.hole, g.spot);
        const park = parkFor(plan);
        const dist = Math.hypot(park.x - g.cartPos.x, park.z - g.cartPos.z);
        beginDrive(g, 'toNext', plan, Math.min(6, Math.max(2, dist / 14)));
      }
      break;
    }
    case 'drive':
    case 'toNext': {
      const u = Math.min(1, g.timer / g.dur);
      const dx = g.segTo.x - g.segFrom.x;
      const dz = g.segTo.z - g.segFrom.z;
      if (Math.hypot(dx, dz) > 0.01) g.cartYaw = Math.atan2(dx, dz);
      g.cartPos = { x: lerp(g.segFrom.x, g.segTo.x, u), z: lerp(g.segFrom.z, g.segTo.z, u) };
      if (u >= 1) {
        g.cartPos = { ...g.segTo };
        g.cartYaw = g.segYaw;
        if (g.step === 'toNext') g.ballShown = true;
        beginWalk(g);
      }
      break;
    }
  }

  // Poses: riders on the cart, the hitter beside the ball, everyone else standing by the cart.
  const riding = g.step === 'drive' || g.step === 'toNext';
  const hitting = g.step === 'address' || g.step === 'swing' || g.step === 'flight' || g.step === 'putt';
  const cartY = heightAt(g.cartPos.x, g.cartPos.z);
  const hitSide = offset(g.spot, g.plan.yaw, 0.9, 0);
  g.bots.forEach((b, k) => {
    const ps = b.ps;
    const p = ps.position;
    if (riding) {
      const r = riderSpot(g, k);
      p.set(r.x, cartY + 0.5, r.z);
      ps.velocity.set(0, 0, 0);
      ps.facing = g.cartYaw;
    } else if (k === g.player && hitting) {
      p.set(hitSide.x, heightAt(hitSide.x, hitSide.z), hitSide.z);
      ps.velocity.set(0, 0, 0);
      ps.facing = Math.atan2(g.spot.x - hitSide.x, g.spot.z - hitSide.z);
    } else if (k === g.player && g.step === 'walk') {
      p.y = heightAt(p.x, p.z); // walking x/z is set above
    } else {
      const s = standSpot(g, k);
      p.set(s.x, heightAt(s.x, s.z), s.z);
      ps.velocity.set(0, 0, 0);
      ps.facing = Math.atan2(g.spot.x - s.x, g.spot.z - s.z);
    }
    b.model.update(ps, dt);
    const armZ = g.step === 'swing' && k === g.player ? lerp(-2.2, 2.0, Math.min(1, g.timer / g.dur)) : 0;
    b.model.arms.left.rotation.z = armZ;
    b.model.arms.right.rotation.z = armZ;
  });

  if (g.step !== 'flight' && g.step !== 'putt') g.ball.position.copy(restPoint(g.spot));
  g.ball.visible = g.ballShown;
  g.cart.position.set(g.cartPos.x, cartY, g.cartPos.z);
  g.cart.rotation.y = g.cartYaw;
}

function makeRaft(parent: THREE.Group): Raft {
  const root = new THREE.Group();
  root.visible = false;
  parent.add(root);
  const mat = (color: number, side: THREE.Side = THREE.FrontSide): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, side });
  const add = (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    to: THREE.Object3D = root,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    to.add(mesh);
    return mesh;
  };

  // Dirt raft under a 4 x 4 yd grass top (grass top at y = 0.65).
  add(new THREE.BoxGeometry(4.1, 0.5, 4.1), mat(0x6d4c2e), 0, 0, 0);
  add(new THREE.BoxGeometry(4, 0.4, 4), mat(0x4caf50), 0, 0.45, 0);

  const mower = createMowerModel('green');
  mower.group.scale.setScalar(0.8);
  mower.group.position.set(-0.9, 0.65, -0.6);
  root.add(mower.group);

  // Mast and patched sail, the mast on the sail's left edge.
  add(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), mat(0x8d6e63), -1.4, 2.15, 1.3);
  add(new THREE.PlaneGeometry(1.5, 1.8), mat(0xf5ecd0, THREE.DoubleSide), -0.65, 2.6, 1.3);
  add(new THREE.PlaneGeometry(0.4, 0.35), mat(0xb8a77a, THREE.DoubleSide), -0.9, 2.2, 1.31);

  // The castaway, angling a rod out over the water (no sitting pose in the gnome model: he stands).
  const gnome = createGnomeModel(RAFT_LOOK);
  root.add(gnome.object);
  const gnomeState = newPlayerState();
  gnomeState.position.set(1.2, 0.65, 0);
  gnomeState.facing = Math.PI / 2;
  const hand = new THREE.Vector3(1.45, 1.0, 0);
  const tip = new THREE.Vector3(3.85, 0.7, 0);
  const rod = add(new THREE.CylinderGeometry(0.02, 0.02, 1, 5), mat(0x6d4c2e), 0, 0, 0);
  placeBetween(rod, hand, tip);

  const bobber = new THREE.Group();
  root.add(bobber);
  add(new THREE.SphereGeometry(0.07, 8, 6), mat(0xd8342c), 0, 0, 0, bobber);
  add(new THREE.SphereGeometry(0.035, 8, 6), mat(0xffffff), 0, 0.05, 0, bobber);
  const line = add(new THREE.CylinderGeometry(0.004, 0.004, 1, 3), mat(0xffffff), 0, 0, 0);

  return { root, gnome, gnomeState, bobber, line, tip };
}

function makeGull(root: THREE.Group): Gull {
  const obj = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x9aa5ad, roughness: 0.7, side: THREE.DoubleSide });
  obj.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.25), white));
  const wing = (side: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.2, 0, 0);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), grey);
    plane.rotation.x = -Math.PI / 2; // lies flat, spanning x
    plane.position.set(side * 0.35, 0, 0);
    pivot.add(plane);
    obj.add(pivot);
    return pivot;
  };
  const left = wing(1);
  const right = wing(-1);
  root.add(obj);
  return {
    obj,
    left,
    right,
    r: rand(20, 35),
    w: rand(0.25, 0.4) * (Math.random() < 0.5 ? -1 : 1),
    phi0: rand(0, Math.PI * 2),
    y: rand(14, 22),
  };
}

export function createAmbient(ctx: Ctx): System {
  const root = new THREE.Group();
  ctx.scene.add(root);
  let clock = 0;

  const groups = [2, 4, 6].map((h) => makeGroup(root, h));
  const raft = makeRaft(root);
  const gulls = Array.from({ length: GULLS }, () => makeGull(root));

  let crossing: Crossing | null = null;
  let nextRaft = RAFT_FIRST;
  let gullHole = -1;
  let gullTarget: XZ = { x: 0, z: 0 };
  let gullC: XZ = { x: 0, z: 0 };

  return {
    update(dt: number): void {
      clock += dt;
      const state = ctx.state;

      // Gnome groups.
      for (const g of groups) {
        if (state.phase === 'intro' && g.hole === state.holeIndex) {
          teleport(g, nextHole(g.hole, state.holeIndex));
        }
        stepGroup(g, dt, state);
      }

      // Seagulls circle a point just offshore of the ball's coast, moved when the hole changes.
      if (state.holeIndex !== gullHole) {
        const first = gullHole < 0;
        gullHole = state.holeIndex;
        const th = Math.atan2(state.ball.z, state.ball.x);
        const r = coastRadius(th) + 10;
        gullTarget = { x: Math.cos(th) * r, z: Math.sin(th) * r };
        if (first) gullC = { ...gullTarget };
      }
      const k = 1 - Math.exp(-dt * 0.5);
      gullC = { x: lerp(gullC.x, gullTarget.x, k), z: lerp(gullC.z, gullTarget.z, k) };
      for (const gl of gulls) {
        const phi = gl.phi0 + gl.w * clock;
        const dir = Math.sign(gl.w);
        gl.obj.position.set(
          gullC.x + gl.r * Math.cos(phi),
          gl.y + 0.3 * Math.sin(clock * 1.7 + gl.phi0),
          gullC.z + gl.r * Math.sin(phi),
        );
        gl.obj.rotation.y = Math.atan2(-Math.sin(phi) * dir, Math.cos(phi) * dir);
        const flap = 0.6 * Math.sin(clock * 6 + gl.phi0);
        gl.left.rotation.z = flap;
        gl.right.rotation.z = -flap;
      }

      // The Gnaft raft drifts along an arc offshore.
      if (!crossing && clock >= nextRaft) {
        const th = Math.atan2(state.ball.z, state.ball.x);
        const R = coastRadius(th) + RAFT_OFFSHORE;
        const dirA = Math.random() < 0.5 ? 1 : -1;
        crossing = {
          R,
          a0: th - RAFT_ARC * dirA,
          a1: th + RAFT_ARC * dirA,
          s: 0,
          total: R * 2 * RAFT_ARC,
        };
      }
      if (crossing) {
        const c = crossing;
        c.s += RAFT_SPEED * dt;
        if (c.s >= c.total) {
          crossing = null;
          raft.root.visible = false;
          nextRaft = clock + rand(70, 140);
        } else {
          const phi = lerp(c.a0, c.a1, c.s / c.total);
          const dir = Math.sign(c.a1 - c.a0);
          raft.root.visible = true;
          raft.root.position.set(c.R * Math.cos(phi), 0.1 + 0.12 * Math.sin(clock * 1.3), c.R * Math.sin(phi));
          raft.root.rotation.set(
            0.03 * Math.sin(clock * 1.1),
            Math.atan2(-Math.sin(phi) * dir, Math.cos(phi) * dir),
            0.04 * Math.sin(clock * 0.9),
          );
        }
      }
      raft.gnome.update(raft.gnomeState, dt);
      // The bobber sits on the water (y = 0 in world space) and bobs.
      raft.bobber.position.set(raft.tip.x, -raft.root.position.y + 0.03 + 0.02 * Math.sin(clock * 2.1), 0);
      placeBetween(raft.line, raft.tip, raft.bobber.position);
    },
  };
}
