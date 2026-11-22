// Ambient AI bowlers on the neighbouring lanes: Wii Sports-style background bowling.
// Pure state machine (createAmbientLane / tickAmbientLane) + 3D view & spatialized audio (createAmbient).
import * as THREE from 'three';
import { buildPrefabInstances } from '@lawn/prefabs';
import {
  BALL, LANE, LOOK_COLORS, LOOKS, THROW,
  type Ctx, type LookId, type SimEvent, type SimResult, type System, type ThrowInput,
} from './config';
import { playAmbientSfx, stopAmbientRoll, updateAmbientRoll } from './audio';
import { createGnomeModel } from './models/gnome';
import type { GnomeModel, PlayerState } from './models/config';
import { npcThrow, type NpcProfile } from './npc';
import { simulateThrow } from './physics';
import { ballAtSample, buildBallModel, posePinsAt, rackPins } from './pins';
import { cursor, frameMarks, freshRack, knockDown } from './scoring';

const PI = Math.PI;
const TAU = Math.PI * 2;
const STAND_Z = -1.2;
const RUN_END_Z = -0.1;
const SLIDE_AT = 0.85;
const ROLL_HOLD_S = 0.5;
const HAND_DX = -0.25;
const HAND_Y = 0.35;
const LEG_Y = 0.3;

const LINEUP_S = 1.2;
const REACT_S = 1.2;
const SWEEP_S = 0.4;
const SETTLE_S = 0.5;
const SWEEP_START_Z = LANE.length - 0.4;
const SWEEP_END_Z = LANE.length + LANE.deckPastHeadPin + 0.3;

export const AMBIENT_LANE_XS: readonly number[] = [
  -3 * LANE.lanePitch,
  -2 * LANE.lanePitch,
  -1 * LANE.lanePitch,
  1 * LANE.lanePitch,
  2 * LANE.lanePitch,
  3 * LANE.lanePitch,
];

export type AmbientPhase = 'wait' | 'lineup' | 'approach' | 'roll' | 'react' | 'sweep';
export type AmbientOutcome = 'strike' | 'spare' | 'bad' | 'normal';

export interface AmbientBowlerSpec {
  laneX: number;
  profile: NpcProfile;
  hatColor: number;
  ballColor: number;
}

export const AMBIENT_SPECS: readonly AmbientBowlerSpec[] = [
  {
    laneX: AMBIENT_LANE_XS[0],
    profile: { id: 'lou', name: 'Al', title: '', look: 'gnorman', color: 0xff8a3d, skill: 0.72, speed: 8.2, spin: 0.45, pitch: 0.8 },
    hatColor: 0xff8a3d,
    ballColor: 0xff7043,
  },
  {
    laneX: AMBIENT_LANE_XS[1],
    profile: { id: 'gnertrude', name: 'Bea', title: '', look: 'gnancy', color: 0xce93d8, skill: 0.62, speed: 5.8, spin: 0.2, pitch: 1.5 },
    hatColor: 0xce93d8,
    ballColor: 0xba68c8,
  },
  {
    laneX: AMBIENT_LANE_XS[2],
    profile: { id: 'robo', name: 'Cy', title: '', look: 'gnorbert', color: 0x3ff0ff, skill: 0.86, speed: 9.0, spin: 0.55, pitch: 0.5 },
    hatColor: 0x3ff0ff,
    ballColor: 0x26c6da,
  },
  {
    laneX: AMBIENT_LANE_XS[3],
    profile: { id: 'chad', name: 'Dot', title: '', look: 'gnelly', color: 0xff3fb4, skill: 0.48, speed: 7.4, spin: 0.7, pitch: 1.4 },
    hatColor: 0xff3fb4,
    ballColor: 0xec407a,
  },
  {
    laneX: AMBIENT_LANE_XS[4],
    profile: { id: 'lou', name: 'Ed', title: '', look: 'lou', color: 0x9be15d, skill: 0.78, speed: 8.6, spin: 0.5, pitch: 0.7 },
    hatColor: 0x9be15d,
    ballColor: 0x66bb6a,
  },
  {
    laneX: AMBIENT_LANE_XS[5],
    profile: { id: 'chad', name: 'Fay', title: '', look: 'gnertrude', color: 0xffd54f, skill: 0.55, speed: 6.4, spin: 0.3, pitch: 1.6 },
    hatColor: 0xffd54f,
    ballColor: 0xffca28,
  },
];

export interface AmbientLaneState {
  laneX: number;
  profile: NpcProfile;
  phase: AmbientPhase;
  phaseTime: number;
  waitDur: number;
  standing: boolean[];
  rolls: number[];
  aimX: number;
  aimYaw: number;
  startX: number;
  startYaw: number;
  input: ThrowInput | null;
  sim: SimResult | null;
  lastEventT: number;
  outcome: AmbientOutcome;
}

export type AmbientAudioCallback =
  | { type: 'release'; laneX: number }
  | { type: 'sim'; laneX: number; event: SimEvent }
  | { type: 'outcome'; laneX: number; outcome: AmbientOutcome }
  | { type: 'pinsetter'; laneX: number };

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

export function createAmbientLane(spec: AmbientBowlerSpec, initialDelay: number): AmbientLaneState {
  return {
    laneX: spec.laneX,
    profile: spec.profile,
    phase: 'wait',
    phaseTime: 0,
    waitDur: initialDelay,
    standing: freshRack(),
    rolls: [],
    aimX: 0,
    aimYaw: 0,
    startX: 0,
    startYaw: 0,
    input: null,
    sim: null,
    lastEventT: -1,
    outcome: 'normal',
  };
}

function classifyOutcome(rollsAfter: number[], knocked: number, gutter: boolean): AmbientOutcome {
  const marks = frameMarks(rollsAfter).flat();
  const mark = marks[marks.length - 1];
  if (mark === 'X') return 'strike';
  if (mark === '/') return 'spare';
  if (gutter || knocked === 0) return 'bad';
  return 'normal';
}

/** Advances one ambient lane by `dt` seconds. Emits audio/visual cues via `onCue`. */
export function tickAmbientLane(
  lane: AmbientLaneState,
  dt: number,
  rand: () => number = Math.random,
  onCue?: (cue: AmbientAudioCallback) => void,
): void {
  lane.phaseTime += dt;

  switch (lane.phase) {
    case 'wait': {
      if (lane.phaseTime < lane.waitDur) return;
      const input = npcThrow(lane.profile, lane.standing, rand);
      lane.input = input;
      lane.sim = simulateThrow(input, lane.standing);
      lane.startX = lane.aimX;
      lane.startYaw = lane.aimYaw;
      lane.phase = 'lineup';
      lane.phaseTime = 0;
      return;
    }

    case 'lineup': {
      const k = easeInOut(clamp01(lane.phaseTime / LINEUP_S));
      if (lane.input) {
        lane.aimX = lerp(lane.startX, lane.input.x, k);
        lane.aimYaw = lerp(lane.startYaw, lane.input.aim, k);
      }
      if (lane.phaseTime >= LINEUP_S) {
        lane.phase = 'approach';
        lane.phaseTime = 0;
      }
      return;
    }

    case 'approach': {
      if (lane.phaseTime >= THROW.approachSeconds) {
        lane.phase = 'roll';
        lane.phaseTime = 0;
        lane.lastEventT = -1;
        onCue?.({ type: 'release', laneX: lane.laneX });
      }
      return;
    }

    case 'roll': {
      const sim = lane.sim;
      if (!sim) {
        lane.phase = 'wait';
        lane.phaseTime = 0;
        return;
      }
      for (const e of sim.events) {
        if (e.t > lane.lastEventT && e.t <= lane.phaseTime) {
          onCue?.({ type: 'sim', laneX: lane.laneX, event: e });
        }
      }
      lane.lastEventT = lane.phaseTime;

      if (lane.phaseTime >= sim.duration + SETTLE_S) {
        const knocked = knockDown(lane.standing, sim.down);
        lane.rolls.push(knocked);
        lane.outcome = classifyOutcome(lane.rolls, knocked, sim.gutter);
        onCue?.({ type: 'outcome', laneX: lane.laneX, outcome: lane.outcome });
        lane.phase = 'react';
        lane.phaseTime = 0;
      }
      return;
    }

    case 'react': {
      if (lane.phaseTime >= REACT_S) {
        lane.phase = 'sweep';
        lane.phaseTime = 0;
        onCue?.({ type: 'pinsetter', laneX: lane.laneX });
      }
      return;
    }

    case 'sweep': {
      if (lane.phaseTime >= SWEEP_S) {
        const c = cursor(lane.rolls);
        if (c.done) {
          lane.rolls = [];
          lane.standing = freshRack();
        } else if (c.fresh) {
          lane.standing = freshRack();
        }
        lane.input = null;
        lane.sim = null;
        lane.phase = 'wait';
        lane.phaseTime = 0;
        lane.waitDur = 1.4 + rand() * 2.8;
      }
      return;
    }
  }
}

// =====================================================================
// 3D View & Audio Integration
// =====================================================================

interface LaneView {
  state: AmbientLaneState;
  root: THREE.Group;
  pins: THREE.Group[];
  ball: ReturnType<typeof buildBallModel>;
  bar: THREE.Mesh;
  model: GnomeModel;
  legs: { left: THREE.Object3D; right: THREE.Object3D } | null;
  ps: PlayerState;
  prevPos: THREE.Vector3;
  face: number;
  rigX: number;
  rigZ: number;
  rArm: number;
  rArmZ: number;
  lArm: number;
  lArmZ: number;
}

function findLegs(rig: THREE.Group): LaneView['legs'] {
  let left: THREE.Object3D | null = null;
  let right: THREE.Object3D | null = null;
  for (const c of rig.children) {
    if (c instanceof THREE.Group && Math.abs(c.position.y - LEG_Y) < 1e-6) {
      if (c.position.x > 0) left = c;
      else right = c;
    }
  }
  return left && right ? { left, right } : null;
}

function buildView(scene: THREE.Scene, spec: AmbientBowlerSpec, idx: number): LaneView {
  const root = new THREE.Group();
  root.position.set(spec.laneX, 0, 0);
  scene.add(root);

  // Pin proxies: posed by posePinsAt / rackPins; the visible pins are drawn by createAmbient's instanced mesh.
  const pins: THREE.Group[] = [];
  for (let p = 0; p < 10; p++) {
    const g = new THREE.Group();
    root.add(g);
    pins.push(g);
  }

  const ball = buildBallModel(spec.ballColor);
  ball.group.visible = false;
  root.add(ball.group);

  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(LANE.halfWidth * 2 + 0.15, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.7 }),
  );
  bar.position.y = 0.06;
  bar.visible = false;
  root.add(bar);

  const lookId: LookId = spec.profile.look;
  const model = createGnomeModel({ ...LOOKS[lookId].look, hat: spec.hatColor });
  model.object.traverse((o: THREE.Object3D) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  root.add(model.object);

  const ps: PlayerState = {
    position: new THREE.Vector3(0, 0, STAND_Z),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
    stamina: 1,
    staminaDelay: 0,
    sprinting: false,
    exhausted: false,
  };

  // Stagger initial throws so the alley feels organic from frame 1.
  const initialDelay = 0.5 + ((idx * 1.37) % 3.8);
  const state = createAmbientLane(spec, initialDelay);
  rackPins(pins, state.standing);

  return {
    state,
    root,
    pins,
    ball,
    bar,
    model,
    legs: findLegs(model.rig),
    ps,
    prevPos: ps.position.clone(),
    face: 0,
    rigX: 0,
    rigZ: 0,
    rArm: -0.4,
    rArmZ: 0,
    lArm: 0,
    lArmZ: 0.3,
  };
}

function updateViewVisuals(v: LaneView, dt: number, globalTime: number, duck: boolean, laneId: number): void {
  const s = v.state;
  const T = s.phaseTime;
  const ps = v.ps;

  // ---- Pins & sweep bar ----
  if (s.phase === 'sweep') {
    v.bar.visible = true;
    v.bar.position.z = lerp(SWEEP_START_Z, SWEEP_END_Z, clamp01(T / SWEEP_S));
    for (const p of v.pins) p.visible = false;
  } else {
    v.bar.visible = false;
    if (s.phase === 'roll' && s.sim) {
      posePinsAt(v.pins, s.sim, T / s.sim.sampleDt);
    } else if (s.phase === 'react' && s.sim) {
      posePinsAt(v.pins, s.sim, s.sim.ball.length - 1);
    } else {
      rackPins(v.pins, s.standing);
    }
  }

  // ---- Ball ----
  if (s.phase === 'lineup') {
    v.ball.group.visible = true;
    v.ball.group.position.set(s.aimX + HAND_DX, HAND_Y, STAND_Z);
    v.ball.group.rotation.y = s.aimYaw;
    v.ball.mesh.rotation.x = 0;
  } else if (s.phase === 'approach') {
    const p = clamp01(T / THROW.approachSeconds);
    const e2 = easeInOut(p);
    const endX = s.input ? s.input.x : s.aimX;
    const bx = lerp(s.aimX, endX, e2) + HAND_DX;
    const bz = lerp(STAND_Z, RUN_END_Z, e2);
    const arm = p <= 0.6 ? lerp(-0.4, 1.4, easeInOut(p / 0.6)) : lerp(1.4, -0.9, easeInOut((p - 0.6) / 0.4));
    const handY = Math.max(BALL.radius, HAND_Y - 0.1 * Math.max(0, Math.cos(arm)));
    v.ball.group.visible = true;
    v.ball.group.position.set(bx, handY, bz);
    v.ball.group.rotation.y = s.aimYaw;
    v.ball.mesh.rotation.x = 0;
  } else if (s.phase === 'roll' && s.sim) {
    const sim = s.sim;
    const b = ballAtSample(sim, T / sim.sampleDt);
    v.ball.group.visible = b.y > -0.35;
    v.ball.group.position.set(b.x, b.y, b.z);
    v.ball.group.rotation.y = s.input ? s.input.aim : 0;
    v.ball.mesh.rotation.x = b.roll;

    const idx = Math.min(Math.floor(T / sim.sampleDt), sim.ball.length - 1);
    const cur = sim.ball[idx];
    const prev = sim.ball[Math.max(0, idx - 1)];
    const speed = idx > 0 ? Math.hypot(cur.x - prev.x, cur.y - prev.y, cur.z - prev.z) / sim.sampleDt : 0;
    const gutter = sim.events.some((e) => e.kind === 'gutter' && e.t <= T);
    const pit = sim.events.some((e) => e.kind === 'pit' && e.t <= T);
    if (pit || T >= sim.duration) {
      stopAmbientRoll(laneId);
    } else {
      updateAmbientRoll(laneId, s.laneX, speed, gutter, duck);
    }
  } else {
    v.ball.group.visible = false;
    stopAmbientRoll(laneId);
  }

  // ---- Bowler pose ----
  let tx = s.aimX;
  let ty = 0;
  let tz = STAND_Z;
  let tFace = s.aimYaw;
  let tRigX = 0;
  let tRigZ = 0;
  let tRArm = -0.4;
  let tRArmZ = 0;
  let tLArm: number | null = null;
  let tLArmZ = 0.3;
  let legs: { left: number; right: number } | null = null;
  let posExact = false;

  if (s.phase === 'wait' || s.phase === 'sweep') {
    tx = s.aimX;
    tz = STAND_Z;
    tFace = 0;
    tRArm = Math.sin(globalTime * 1.8 + laneId) * 0.05;
    tLArm = Math.sin(globalTime * 1.8 + laneId + PI) * 0.05;
  } else if (s.phase === 'lineup') {
    tx = s.aimX;
    tz = STAND_Z;
    tFace = s.aimYaw;
  } else if (s.phase === 'approach') {
    const p = clamp01(T / THROW.approachSeconds);
    const e2 = easeInOut(p);
    const endX = (s.input ? s.input.x : s.aimX) + 0.25;
    tx = lerp(s.aimX, endX, e2);
    tz = lerp(STAND_Z, RUN_END_Z, e2);
    posExact = true;
    tRArm = p <= 0.6 ? lerp(-0.4, 1.4, easeInOut(p / 0.6)) : lerp(1.4, -0.9, easeInOut((p - 0.6) / 0.4));
    if (p > SLIDE_AT) {
      ty = -0.12;
      tRigX = 0.35;
      legs = { left: -0.9, right: 0.5 };
      tLArm = 0;
      tLArmZ = 1.2;
    }
  } else if (s.phase === 'roll') {
    tx = (s.input ? s.input.x : s.aimX) + 0.25;
    tz = RUN_END_Z;
    if (T < ROLL_HOLD_S) {
      ty = -0.12;
      tRigX = 0.35;
      legs = { left: -0.9, right: 0.5 };
      tLArm = 0;
      tLArmZ = 1.2;
      tRArm = -0.9;
    } else {
      legs = { left: 0, right: 0 };
      tLArm = 0;
      tRArm = -0.4;
      if (s.sim && s.input && s.sim.ball.length > 0) {
        const i = Math.min(s.sim.ball.length - 1, Math.floor(T / s.sim.sampleDt));
        const dx = s.sim.ball[i].x - s.input.x;
        tRigZ = -0.3 * Math.max(-1, Math.min(1, dx / 0.15));
      }
    }
  } else if (s.phase === 'react') {
    tx = (s.input ? s.input.x : s.aimX) + 0.25;
    tz = RUN_END_Z;
    legs = { left: 0, right: 0 };
    if (s.outcome === 'strike' || s.outcome === 'spare') {
      const u = clamp01(T / 0.6);
      ty = u > 0 && u < 1 ? 4 * 0.32 * u * (1 - u) : 0;
      tFace = TAU * easeInOut(clamp01(T / 0.8));
      tRArm = -2.8;
      tLArm = -2.8;
      tRArmZ = 0;
      tLArmZ = 0;
    } else if (s.outcome === 'bad') {
      tFace = PI * 0.7;
      tRArm = -2.9;
      tRArmZ = -0.6;
      tLArm = -2.9;
      tLArmZ = 0.6;
      tRigX = 0.28;
    } else {
      tRArm = -1.2 + 0.3 * Math.max(0, Math.sin(T * 11));
      tLArm = -1.2 + 0.3 * Math.max(0, -Math.sin(T * 11));
    }
  }

  const kPose = 1 - Math.exp(-12 * dt);
  const kPos = 1 - Math.exp(-6 * dt);
  if (posExact) {
    ps.position.x = tx;
    ps.position.z = tz;
  } else {
    ps.position.x = lerp(ps.position.x, tx, kPos);
    ps.position.z = lerp(ps.position.z, tz, kPos);
  }
  ps.position.y = lerp(ps.position.y, ty, kPos);
  v.face = lerp(v.face, tFace, kPose);
  v.rigX = lerp(v.rigX, tRigX, kPose);
  v.rigZ = lerp(v.rigZ, tRigZ, kPose);
  v.rArm = posExact ? tRArm : lerp(v.rArm, tRArm, kPose);
  v.rArmZ = lerp(v.rArmZ, tRArmZ, kPose);
  v.lArmZ = lerp(v.lArmZ, tLArmZ, kPose);

  const safeDt = Math.max(dt, 1e-4);
  ps.facing = v.face;
  ps.velocity.set(
    ((ps.position.x - v.prevPos.x) / safeDt) * 3,
    0,
    ((ps.position.z - v.prevPos.z) / safeDt) * 3,
  );
  v.prevPos.copy(ps.position);
  v.model.update(ps, dt);

  v.model.rig.rotation.x = v.rigX;
  v.model.rig.rotation.z = v.rigZ;
  v.model.arms.right.rotation.x = v.rArm;
  v.model.arms.right.rotation.z = v.rArmZ;
  v.model.arms.left.rotation.z = v.lArmZ;
  if (tLArm !== null) {
    v.lArm = lerp(v.lArm, tLArm, kPose);
    v.model.arms.left.rotation.x = v.lArm;
  } else {
    v.lArm = v.model.arms.left.rotation.x;
  }
  if (legs && v.legs) {
    v.legs.left.rotation.x = legs.left;
    v.legs.right.rotation.x = legs.right;
  }
}

export function createAmbient(ctx: Ctx): System {
  const views = AMBIENT_SPECS.map((spec, idx) => buildView(ctx.scene, spec, idx));

  // All ambient pins share one set of InstancedMeshes (one per prefab part), instance i = lane * 10 + pin.
  const pinCount = AMBIENT_SPECS.length * 10;
  const pinMesh = buildPrefabInstances(
    'bowling-pin',
    Array.from({ length: pinCount }, () => new THREE.Matrix4()),
    { tint: LOOK_COLORS.pinRed },
  );
  ctx.scene.add(pinMesh);
  // Matrices are identity at this point, so instance 0 holds each part's own matrix.
  const pinParts: { inst: THREE.InstancedMesh; part: THREE.Matrix4 }[] = [];
  for (const c of pinMesh.children) {
    if (!(c instanceof THREE.InstancedMesh)) continue;
    const part = new THREE.Matrix4();
    c.getMatrixAt(0, part);
    c.frustumCulled = false;
    pinParts.push({ inst: c, part });
  }
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  const laneWorld = new THREE.Matrix4();
  const tmp = new THREE.Matrix4();

  const syncPins = (): void => {
    views.forEach((v, L) => {
      v.root.updateMatrix();
      for (let p = 0; p < 10; p++) {
        const i = L * 10 + p;
        const proxy = v.pins[p];
        if (!proxy.visible) {
          for (const { inst } of pinParts) inst.setMatrixAt(i, hidden);
          continue;
        }
        proxy.updateMatrix();
        laneWorld.multiplyMatrices(v.root.matrix, proxy.matrix);
        for (const { inst, part } of pinParts) {
          inst.setMatrixAt(i, tmp.multiplyMatrices(laneWorld, part));
        }
      }
    });
    for (const { inst } of pinParts) inst.instanceMatrix.needsUpdate = true;
  };

  const onCue = (duck: boolean) => (cue: AmbientAudioCallback): void => {
    switch (cue.type) {
      case 'release':
        playAmbientSfx('release', cue.laneX, 0.7, duck);
        break;
      case 'sim': {
        const e = cue.event;
        if (e.kind !== 'release') playAmbientSfx(e.kind, cue.laneX, e.strength, duck);
        break;
      }
      case 'outcome':
        if (cue.outcome === 'strike' || cue.outcome === 'spare') playAmbientSfx('cheer', cue.laneX, 0.7, duck);
        else if (cue.outcome === 'bad') playAmbientSfx('groan', cue.laneX, 0.7, duck);
        break;
      case 'pinsetter':
        playAmbientSfx('pinsetter', cue.laneX, 0.5, duck);
        break;
    }
  };

  return {
    update(dt: number): void {
      const mainBusy = ctx.state.phase === 'roll' || ctx.state.phase === 'result' || ctx.state.phase === 'replay';
      const handleCue = onCue(mainBusy);
      views.forEach((v, idx) => {
        tickAmbientLane(v.state, dt, Math.random, handleCue);
        updateViewVisuals(v, dt, ctx.state.time, mainBusy, idx);
      });
      syncPins();
    },
  };
}
