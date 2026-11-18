// The Giant Goofy Fetch Dog (from Gnome Company): a poseable rig with 14 blended poses and a bark.
import * as THREE from 'three';

export type DogPose =
  | 'stand' | 'walk' | 'run' | 'sit' | 'lie' | 'roll' | 'shake' | 'spin' | 'eat' | 'sleep' | 'beg' | 'shakeoff' | 'tilt' | 'speak';

export interface DogRig {
  /** Feet at the origin, facing +z. The caller owns root.position, root.rotation.y and root.scale; animateDog never touches them. */
  root: THREE.Group;
  /** Meshes to raycast against for petting and scrubbing. */
  hit: THREE.Object3D[];
  /** An empty Object3D at the mouth; the caller re-parents the ball to it while carrying. */
  mouth: THREE.Object3D;
  /** 0 = clean, 1 = filthy: shows mud spots. */
  setDirt(level: number): void;
}

interface Parts {
  body: THREE.Group;
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  legFL: THREE.Group;
  legFR: THREE.Group;
  legBL: THREE.Group;
  legBR: THREE.Group;
  tail: THREE.Group;
  tongue: THREE.Mesh;
}

// Base joint values a pose blends toward. Angle joints blend the short way round.
type JointKey =
  | 'bY' | 'bX' | 'bRy' | 'bRz' | 'bSy'
  | 'hX' | 'hY' | 'hZ'
  | 'eLx' | 'eRx' | 'eLz' | 'eRz'
  | 'lFL' | 'lFR' | 'lBL' | 'lBR'
  | 'tS';

// Cyclic motions layered on top of the base joints. Each weight blends in and out with the pose.
type ModKey =
  | 'gait' | 'bob' | 'breathe' | 'tail' | 'roll' | 'spin' | 'wiggle'
  | 'paw' | 'nod' | 'sway' | 'shakeoff' | 'snooze';

type Joints = Record<JointKey, number>;
type Mods = Record<ModKey, number>;

const TAU = Math.PI * 2;

const REST: Joints = {
  bY: 0, bX: 0, bRy: 0, bRz: 0, bSy: 1,
  hX: 0, hY: 0, hZ: 0,
  eLx: 0, eRx: 0, eLz: 0, eRz: 0,
  lFL: 0, lFR: 0, lBL: 0, lBR: 0,
  tS: 1,
};
const JOINT_KEYS = Object.keys(REST) as JointKey[];
const ANGLE_KEYS = new Set<JointKey>([
  'bX', 'bRy', 'bRz', 'hX', 'hY', 'hZ', 'eLx', 'eRx', 'eLz', 'eRz', 'lFL', 'lFR', 'lBL', 'lBR',
]);
const MOD_KEYS: ModKey[] = [
  'gait', 'bob', 'breathe', 'tail', 'roll', 'spin', 'wiggle', 'paw', 'nod', 'sway', 'shakeoff', 'snooze',
];
const NO_MODS: Mods = {
  gait: 0, bob: 0, breathe: 0, tail: 0, roll: 0, spin: 0, wiggle: 0,
  paw: 0, nod: 0, sway: 0, shakeoff: 0, snooze: 0,
};

const WAG = 0.55;
const SIT: Partial<Joints> = { bX: -0.45, bY: -0.3, lBL: -1.2, lBR: -1.2, hX: -0.2 };
const LIE: Partial<Joints> = { bY: -0.8, lFL: -1.4, lFR: -1.4, lBL: 1.4, lBR: 1.4, hX: 0.6 };

const moving = (speed: number) => speed > 0.1;
const fixed = (m: Partial<Mods>) => () => m;

interface PoseDef {
  base: Partial<Joints>;
  mods: (speed: number) => Partial<Mods>;
  /** Gait clock rate in rad/s for this speed. */
  clock: (speed: number) => number;
  /** Multiplier on the tail wag rate. */
  wag: number;
}

const POSES: Record<DogPose, PoseDef> = {
  stand: {
    base: {},
    mods: () => ({ breathe: 0.02, tail: WAG }),
    clock: () => 0,
    wag: 1,
  },
  walk: {
    base: { eLx: 0.15, eRx: 0.15 },
    mods: (s) => (moving(s) ? { gait: 0.5, bob: 0.05, tail: WAG } : { tail: WAG }),
    clock: (s) => s * 1.6,
    wag: 1,
  },
  run: {
    base: { bX: 0.12, eLx: 0.6, eRx: 0.6 },
    mods: (s) => (moving(s) ? { gait: 0.9, bob: 0.15, tail: WAG } : { tail: WAG }),
    // Faster than walk: 1.3x the walk gait rate.
    clock: (s) => s * 1.6 * 1.3,
    wag: 1,
  },
  sit: {
    base: SIT,
    mods: fixed({ tail: WAG }),
    clock: () => 0,
    wag: 1,
  },
  lie: {
    base: LIE,
    mods: fixed({ tail: WAG }),
    clock: () => 0,
    wag: 1,
  },
  roll: {
    base: { ...LIE, lFL: 2.2, lFR: 2.2, lBL: 2.2, lBR: 2.2 },
    mods: fixed({ roll: 1, wiggle: 0.35, tail: WAG }),
    clock: () => 0,
    wag: 1,
  },
  shake: {
    base: { ...SIT, lFR: -1.3 },
    mods: fixed({ paw: 1, tail: WAG }),
    clock: () => 0,
    wag: 1,
  },
  spin: {
    base: {},
    mods: () => ({ spin: 1, gait: 0.6, bob: 0.04, tail: WAG }),
    clock: () => 8,
    wag: 1,
  },
  eat: {
    base: { hX: 0.9 },
    mods: fixed({ nod: 1, tail: WAG }),
    clock: () => 0,
    wag: 1,
  },
  sleep: {
    base: { ...LIE, hX: 0.9, hZ: 0.5 },
    mods: fixed({ snooze: 1 }),
    clock: () => 0,
    wag: 1,
  },
  beg: {
    base: { ...SIT, hX: -0.5, tS: 1.5 },
    mods: fixed({ sway: 1, tail: WAG }),
    clock: () => 0,
    wag: 1.6,
  },
  shakeoff: {
    base: {},
    mods: fixed({ shakeoff: 1, tail: WAG }),
    clock: () => 0,
    wag: 1,
  },
  speak: {
    base: { ...SIT, hX: -0.45, eLx: -0.2, eRx: -0.2 },
    mods: fixed({ tail: WAG }),
    clock: () => 0,
    wag: 1.6,
  },
  tilt: {
    base: { ...SIT, hZ: 0.45, eLx: 0.5, eRx: 0.1, eLz: 0.3, eRz: -0.1 },
    mods: fixed({ tail: WAG }),
    clock: () => 0,
    wag: 0.4,
  },
};

const partsOf = new WeakMap<DogRig, Parts>();

interface State {
  joints: Joints;
  mods: Mods;
  /** Gait phase, advanced by distance (walk, run) or a fixed rate (spin trot). */
  clock: number;
  /** Unwrapped roll angle; only the wrapped value is shown, so the roll never unwinds. */
  zAng: number;
  /** Unwrapped spin angle, same idea. */
  yAng: number;
  /** Bark impulse 0..1, decays fast: head jerks up, mouth/tongue pops, body puffs. */
  bark: number;
}
const stateOf = new WeakMap<DogRig, State>();

function wrapPi(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function createDogRig(): DogRig {
  const furMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
  const spotMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x5b3a1a, roughness: 1 });
  const dirtGeo = new THREE.SphereGeometry(1, 8, 6);

  const solid = (geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  };

  const dirt: THREE.Mesh[] = [];
  const addDirt = (parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const p = new THREE.Mesh(dirtGeo, dirtMat);
    p.position.set(x, y, z);
    p.scale.set(sx, sy, sz);
    p.visible = false;
    parent.add(p);
    dirt.push(p);
  };

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Torso (original: 1.3 x 1.1 x 2.3 at y 1.45).
  const torso = solid(new THREE.BoxGeometry(1.3, 1.1, 2.3), furMat);
  torso.position.y = 1.45;
  body.add(torso);
  addDirt(body, 0.66, 1.7, 0.5, 0.05, 0.3, 0.35);
  addDirt(body, -0.66, 1.2, -0.4, 0.05, 0.28, 0.4);
  addDirt(body, 0.25, 2.02, -0.7, 0.4, 0.05, 0.35);

  // Head pivot at the neck. Children are positioned relative to it so that rotation 0 matches the original.
  const head = new THREE.Group();
  head.position.set(0, 1.9, 1.0);
  body.add(head);

  const headBox = solid(new THREE.BoxGeometry(1.0, 0.95, 1.1), furMat);
  headBox.position.set(0, 0.25, 0.25);
  head.add(headBox);

  const snout = solid(new THREE.BoxGeometry(0.58, 0.46, 0.65), furMat);
  snout.position.set(0, 0.05, 0.95);
  head.add(snout);

  const nose = solid(new THREE.SphereGeometry(0.14, 8, 8), blackMat);
  nose.position.set(0, 0.18, 1.28);
  head.add(nose);

  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.42), tongueMat);
  tongue.position.set(0.1, -0.18, 1.1);
  tongue.rotation.x = 0.45;
  head.add(tongue);

  for (const ex of [-0.26, 0.26]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), whiteMat);
    w.position.set(ex, 0.42, 0.81);
    head.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), pupilMat);
    p.position.set(ex, 0.42, 0.9);
    head.add(p);
  }

  // Ears hang from their top edge so a flop rotates them about the top.
  const makeEar = (ex: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(ex, 0.525, 0.15);
    head.add(pivot);
    const flap = solid(new THREE.BoxGeometry(0.2, 0.65, 0.45), spotMat);
    flap.position.y = -0.325;
    flap.rotation.z = ex > 0 ? -0.25 : 0.25;
    pivot.add(flap);
    return pivot;
  };
  const earL = makeEar(-0.56);
  const earR = makeEar(0.56);

  // Mouth: where the ball is carried. Child of the head so it moves with it.
  const mouth = new THREE.Object3D();
  mouth.position.set(0, -0.1, 1.35);
  head.add(mouth);

  // Legs hang from their hip or shoulder pivot, bottom at y 0.
  const makeLeg = (x: number, z: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.0, z);
    body.add(pivot);
    const leg = solid(new THREE.CylinderGeometry(0.18, 0.16, 1.0, 8), furMat);
    leg.position.y = -0.5;
    pivot.add(leg);
    addDirt(pivot, 0, -0.4, 0.16, 0.13, 0.18, 0.04);
    return pivot;
  };
  // The dog faces +z, so its left is +x and its right is -x.
  const legFL = makeLeg(0.45, 0.85);
  const legFR = makeLeg(-0.45, 0.85);
  const legBL = makeLeg(0.45, -0.85);
  const legBR = makeLeg(-0.45, -0.85);

  // Tail pivot at the base; the tail itself is tilted as in the original.
  const tail = new THREE.Group();
  tail.position.set(0, 1.95, -1.15);
  body.add(tail);
  const tailMesh = solid(new THREE.CylinderGeometry(0.1, 0.14, 1.0, 8), furMat);
  tailMesh.position.set(0, 0, -0.15);
  tailMesh.rotation.x = -0.7;
  tail.add(tailMesh);

  const rig: DogRig = {
    root,
    hit: [torso, headBox],
    mouth,
    setDirt: (level: number) => {
      dirt.forEach((p, i) => {
        p.visible = level > (i + 1) / (dirt.length + 1);
      });
    },
  };
  partsOf.set(rig, { body, head, earL, earR, legFL, legFR, legBL, legBR, tail, tongue });
  return rig;
}

/**
 * Animate the rig's children toward pose. t = seconds since start, dt = frame seconds,
 * speed = ground speed (units/s) for gait cycle rate, happy = 0..1 (tail wag speed, bounce).
 * Never writes rig.root's transform.
 */
/** One bark: the next frames jerk the head up and puff the body. Safe before the first animateDog call. */
export function barkDog(rig: DogRig): void {
  const st = stateOf.get(rig);
  if (st) st.bark = 1;
}

export function animateDog(rig: DogRig, pose: DogPose, t: number, dt: number, speed: number, happy: number): void {
  const parts = partsOf.get(rig);
  if (!parts) return;
  const def = POSES[pose];

  const targetJoints: Joints = { ...REST, ...def.base };
  const targetMods: Mods = { ...NO_MODS, ...def.mods(speed) };

  let st = stateOf.get(rig);
  if (!st) {
    st = { joints: { ...targetJoints }, mods: { ...targetMods }, clock: 0, zAng: 0, yAng: 0, bark: 0 };
    stateOf.set(rig, st);
  }

  // Blend every joint and modulator toward this pose.
  const k = Math.min(1, dt * 10);
  for (const key of JOINT_KEYS) {
    const cur = st.joints[key];
    const diff = targetJoints[key] - cur;
    st.joints[key] = cur + (ANGLE_KEYS.has(key) ? wrapPi(diff) : diff) * k;
  }
  for (const key of MOD_KEYS) {
    st.mods[key] += (targetMods[key] - st.mods[key]) * k;
  }

  // Cyclic clocks advance only while their pose runs.
  st.clock += dt * def.clock(speed);
  if (pose === 'roll') st.zAng += dt * Math.PI; // a full turn every 2 s
  if (pose === 'spin') st.yAng += dt * (TAU / 0.8); // a full turn every 0.8 s

  // Bark impulse: a sharp jerk that eases out over ~0.25 s.
  const bk = st.bark * st.bark;
  st.bark = Math.max(0, st.bark - dt * 4);

  const j = st.joints;
  const m = st.mods;
  const c = st.clock;
  const gait = m.gait * Math.sin(c);
  const bob = m.bob * Math.abs(Math.sin(c));
  const shakeS = m.shakeoff * Math.sin(TAU * 9 * t);
  const wiggle = (ph: number) => m.wiggle * Math.sin(t * 9 + ph);

  // Body: whole-body pose plus bob, breathing, roll, spin, shake-off and sleep breathing.
  parts.body.position.y = j.bY + bob + m.breathe * Math.sin(t * 3.1) + bk * 0.08;
  parts.body.rotation.x = j.bX;
  parts.body.rotation.y = j.bRy + m.spin * wrapPi(st.yAng);
  parts.body.rotation.z = j.bRz + m.roll * wrapPi(st.zAng) + shakeS * 0.35;
  parts.body.scale.y = j.bSy + m.snooze * 0.03 * Math.sin(TAU * 0.4 * t);

  // Head: pitch, sway (beg), nod (eat), shake-off flap.
  parts.head.rotation.x = j.hX + m.nod * 0.15 * Math.sin(TAU * 5 * t) - bk * 0.55;
  parts.head.rotation.y = j.hY + m.sway * 0.35 * Math.sin(t * 1.4);
  parts.head.rotation.z = j.hZ + shakeS * 0.2;

  // Ears: base pose, a little flop from the bob, and the shake-off flap (opposite sides).
  const flop = bob * 1.5;
  parts.earL.rotation.x = j.eLx + flop + shakeS * 0.4 - bk * 0.5;
  parts.earR.rotation.x = j.eRx + flop - shakeS * 0.4 - bk * 0.5;
  parts.earL.rotation.z = j.eLz;
  parts.earR.rotation.z = j.eRz;

  // Legs: diagonal pairs in phase (FL with BR), plus roll wiggle and the raised paw.
  parts.legFL.rotation.x = j.lFL + gait + wiggle(0);
  parts.legFR.rotation.x = j.lFR - gait + m.paw * 0.25 * Math.sin(TAU * 6 * t) + wiggle(1.3);
  parts.legBL.rotation.x = j.lBL - gait + wiggle(2.6);
  parts.legBR.rotation.x = j.lBR + gait + wiggle(3.9);

  parts.tongue.scale.z = j.tS + bk * 0.8;

  // Tail wag in every pose except sleep (its weight is 0 there).
  const wag = (6 + happy * 14) * def.wag;
  parts.tail.rotation.z = m.tail * Math.sin(t * wag);
}
