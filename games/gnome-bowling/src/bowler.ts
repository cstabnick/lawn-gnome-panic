// The current bowler gnome: stance during 'aim', run-up and swing during 'approach', reaction during 'result'.
// Also the winner's victory dance in 'final', and a floating name tag over every player's gnome.
import * as THREE from 'three';
import type { Ctx, GameState, Phase, Player, ResultKind, System } from './config';
import { LOOKS, THROW } from './config';
import { createGnomeModel } from './models/gnome';
import type { GnomeModel, PlayerState } from './models/config';
import { totalScore } from './scoring';

const PI = Math.PI;
const TAU = Math.PI * 2;
/** Feet z when standing ready (the approach starts here). */
const STAND_Z = -1.2;
/** Feet z at the release, the end of the run-up (the foul line). */
const RUN_END_Z = -0.1;
/** Fraction of the run-up at which the slide starts. */
const SLIDE_AT = 0.85;
/** Seconds the follow-through is held after release before standing up. */
const ROLL_HOLD_S = 0.5;
/** Pose smoothing rate (1/s). */
const POSE_RATE = 12;
/** Body position smoothing rate (1/s), for aim, intro and result. */
const POS_RATE = 6;
/** gnome.ts reads velocity for its leg cycle; the run-up is scaled so the legs look like a run. */
const RUN_VELOCITY_SCALE = 3;
/** Hip height and x of the legs inside the rig (gnome.ts). */
const LEG_Y = 0.3;
/** Name tag: world size and height above the feet. */
const TAG_W = 1.6;
const TAG_H = 0.4;
const TAG_Y = 1.5;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const wrapAngle = (a: number): number => ((((a + PI) % TAU) + TAU) % TAU) - PI;

/** Parabolic hop of height h across [start, start + dur]. */
function hop(t: number, start: number, dur: number, h: number): { y: number; air: boolean } {
  const u = (t - start) / dur;
  if (u <= 0 || u >= 1) return { y: 0, air: false };
  return { y: 4 * h * u * (1 - u), air: true };
}

/** What the bowler should look like this frame. Left arm and legs are null when the model walks them. */
interface Target {
  x: number;
  y: number;
  z: number;
  face: number;
  posExact: boolean;
  yExact: boolean;
  faceExact: boolean;
  rArmExact: boolean;
  rigX: number;
  rigZ: number;
  /** Rig height offset (breathing, shrug). */
  bob: number;
  rArm: number;
  rArmZ: number;
  lArmZ: number;
  lArm: number | null;
  legs: { left: number; right: number } | null;
  air: boolean;
  jumpsUsed: number;
}

interface Entry {
  model: GnomeModel;
  sprite: THREE.Sprite;
  tex: THREE.CanvasTexture;
  legs: { left: THREE.Object3D; right: THREE.Object3D } | null;
  ps: PlayerState;
  prev: THREE.Vector3;
  visible: boolean;
  face: number;
  rigX: number;
  rigZ: number;
  rArm: number;
  rArmZ: number;
  lArm: number;
  lArmZ: number;
  legL: number;
  legR: number;
  resultSerial: number;
  resultBase: number;
}

function winnerIndex(players: Player[]): number {
  let best = -1;
  let bestScore = -Infinity;
  players.forEach((p, i) => {
    const s = totalScore(p.rolls);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  });
  return best;
}

function bowlerIndex(state: GameState): number {
  if (state.phase === 'final') return winnerIndex(state.players);
  if (state.phase === 'result' && state.result) return state.result.player;
  return state.current;
}

function findLegs(rig: THREE.Group): Entry['legs'] {
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

function makeTag(name: string, color: number): { sprite: THREE.Sprite; tex: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = 'rgba(20,10,40,0.85)';
    g.beginPath();
    g.moveTo(24, 0);
    g.lineTo(488, 0);
    g.quadraticCurveTo(512, 0, 512, 24);
    g.lineTo(512, 104);
    g.quadraticCurveTo(512, 128, 488, 128);
    g.lineTo(24, 128);
    g.quadraticCurveTo(0, 128, 0, 104);
    g.lineTo(0, 24);
    g.quadraticCurveTo(0, 0, 24, 0);
    g.closePath();
    g.fill();
    g.font = 'bold 52px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#' + color.toString(16).padStart(6, '0');
    g.fillText(name, 256, 66, 480);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(TAG_W, TAG_H, 1);
  sprite.position.set(0, TAG_Y, 0);
  sprite.renderOrder = 5;
  return { sprite, tex };
}

function buildEntry(ctx: Ctx, p: Player, state: GameState): Entry {
  const model = createGnomeModel({ ...(p.customLook ?? LOOKS[p.look].look), hat: p.color });
  ctx.scene.add(model.object);
  const { sprite, tex } = makeTag(p.name, p.color);
  model.object.add(sprite);
  const ps: PlayerState = {
    position: new THREE.Vector3(state.aimX, 0, STAND_Z),
    velocity: new THREE.Vector3(),
    facing: state.aimYaw,
    grounded: true,
    jumpsUsed: 0,
    stamina: 1,
    staminaDelay: 0,
    sprinting: false,
    exhausted: false,
  };
  return {
    model,
    sprite,
    tex,
    legs: findLegs(model.rig),
    ps,
    prev: ps.position.clone(),
    visible: false,
    face: state.aimYaw,
    rigX: 0,
    rigZ: 0,
    rArm: -0.4,
    rArmZ: 0,
    lArm: 0,
    lArmZ: 0.3,
    legL: 0,
    legR: 0,
    resultSerial: -1,
    resultBase: state.aimYaw,
  };
}

function disposeEntry(ctx: Ctx, e: Entry): void {
  ctx.scene.remove(e.model.object);
  e.tex.dispose();
  (e.sprite.material as THREE.SpriteMaterial).dispose();
}

/** The slide: body low, left leg forward, right leg back, leaning forward, left arm out for balance. */
function slide(t: Target): void {
  t.y = -0.12;
  t.rigX = 0.35;
  t.legs = { left: -0.9, right: 0.5 };
  t.lArm = 0;
  t.lArmZ = 1.2;
}

function targetsFor(state: GameState, e: Entry): Target {
  const T = state.phaseTime;
  const aimX = state.aimX;
  const aimYaw = state.aimYaw;
  const stillX = state.input ? state.input.x + 0.25 : aimX;
  const t: Target = {
    x: aimX, y: 0, z: STAND_Z, face: aimYaw,
    posExact: false, yExact: false, faceExact: false, rArmExact: false,
    rigX: 0, rigZ: 0, bob: 0,
    rArm: -0.4, rArmZ: 0, lArmZ: 0.3,
    lArm: null, legs: null, air: false, jumpsUsed: 0,
  };

  switch (state.phase) {
    case 'intro':
    case 'aim': {
      // Stand ready, ball at the right hip; breathe.
      t.bob = 0.012 * (1 + Math.sin(state.time * 2.6)) / 2;
      return t;
    }
    case 'approach': {
      const p = clamp01(T / THROW.approachSeconds);
      const e2 = easeInOut(p);
      const endX = (state.input ? state.input.x : aimX) + 0.25; // the ball is in the right hand, 0.25 to the right
      t.x = lerp(aimX, endX, e2);
      t.z = lerp(STAND_Z, RUN_END_Z, e2);
      t.posExact = true;
      t.rArmExact = true;
      // Pendulum: -0.4 forward, back to +1.4 at 0.6, then through to -0.9 at the release.
      t.rArm = p <= 0.6
        ? lerp(-0.4, 1.4, easeInOut(p / 0.6))
        : lerp(1.4, -0.9, easeInOut((p - 0.6) / 0.4));
      if (p > SLIDE_AT) slide(t);
      return t;
    }
    case 'roll': {
      t.x = stillX;
      t.z = RUN_END_Z;
      if (state.rollTime < ROLL_HOLD_S) {
        slide(t);
        t.rArm = -0.9;
        return t;
      }
      // Stand up and watch. Body English: lean toward where the ball is going.
      t.legs = { left: 0, right: 0 };
      t.lArm = 0;
      t.lArmZ = 0.3;
      t.rArm = -0.4;
      const sim = state.sim;
      const inp = state.input;
      if (sim && inp && sim.ball.length > 0) {
        const i = Math.min(sim.ball.length - 1, Math.floor(state.rollTime / sim.sampleDt));
        const dx = sim.ball[i].x - inp.x;
        t.rigZ = -0.3 * Math.max(-1, Math.min(1, dx / 0.15)); // negative rig z leans toward +x (the bowler's left)
      }
      return t;
    }
    case 'result': {
      const kind: ResultKind = state.result ? state.result.kind : 'pins';
      t.x = stillX;
      t.z = RUN_END_Z;
      t.legs = { left: 0, right: 0 };
      t.lArm = 0;
      t.lArmZ = 0.3;
      switch (kind) {
        case 'strike':
        case 'double': {
          const h = hop(T, 0.05, 0.6, 0.4);
          t.y = h.y;
          t.yExact = true;
          t.air = h.air;
          t.face = e.resultBase + TAU * easeInOut(clamp01(T / 0.8));
          t.faceExact = true;
          t.rArm = -2.8;
          t.lArm = -2.8;
          t.rArmZ = 0;
          t.lArmZ = 0;
          break;
        }
        case 'turkey':
        case 'hambone': {
          // Two jumps; the second is a front flip (the model flips on a 0 -> 2 jumpsUsed in the air).
          const a = hop(T, 0.05, 0.5, 0.45);
          const b = hop(T, 0.75, 0.5, 0.55);
          t.y = Math.max(a.y, b.y);
          t.yExact = true;
          t.air = a.air || b.air;
          t.jumpsUsed = b.air ? 2 : 0;
          t.rArm = -2.8;
          t.lArm = -2.8;
          t.rArmZ = 0;
          t.lArmZ = 0;
          break;
        }
        case 'spare': {
          const h = hop(T, 0.05, 0.5, 0.15);
          t.y = h.y;
          t.yExact = true;
          t.air = h.air;
          t.rArm = -2.6 + 0.2 * (0.5 + 0.5 * Math.sin(T * 10)); // fist pump
          t.lArmZ = 0.4;
          break;
        }
        case 'gutter':
        case 'miss': {
          // Turn to the camera, hands on head, slump, then sit down on the approach.
          t.face = PI;
          t.rArm = -2.9;
          t.rArmZ = -0.7;
          t.lArm = -2.9;
          t.lArmZ = 0.7;
          t.rigX = 0.3;
          t.y = T < 0.5 ? 0 : -0.25 * easeInOut(clamp01((T - 0.5) / 0.6));
          break;
        }
        case 'split': {
          // Scratch the head, shrug.
          t.rArm = -2.4 + 0.25 * Math.sin(T * 8);
          t.rArmZ = 0;
          t.lArm = -0.3;
          t.lArmZ = 0.8;
          t.bob = 0.02 * Math.max(0, Math.sin(T * 6));
          break;
        }
        default: {
          // nine / pins: clap, arms in front, alternating.
          t.rArm = -1.3 + 0.35 * Math.max(0, Math.sin(T * 12));
          t.lArm = -1.3 + 0.35 * Math.max(0, -Math.sin(T * 12));
          break;
        }
      }
      return t;
    }
    case 'final': {
      // The winner dances: hop and sway.
      t.x = aimX;
      t.z = STAND_Z;
      t.y = 0.15 * Math.abs(Math.sin(T * 6));
      t.yExact = true;
      t.rigZ = 0.2 * Math.sin(T * 4);
      t.rArm = -2.2 + 0.4 * Math.sin(T * 8);
      t.lArm = -2.2 - 0.4 * Math.sin(T * 8);
      t.rArmZ = -0.2;
      t.lArmZ = 0.2;
      t.legs = { left: 0, right: 0 };
      return t;
    }
    default:
      return t;
  }
}

function poseEntry(ctx: Ctx, state: GameState, e: Entry, dt: number, snap: boolean): void {
  void ctx;
  const r = state.result;
  if (state.phase === 'result' && r && r.serial !== e.resultSerial) {
    e.resultSerial = r.serial;
    e.resultBase = e.face;
  }
  const t = targetsFor(state, e);
  const kPose = snap ? 1 : 1 - Math.exp(-POSE_RATE * dt);
  const kPos = snap ? 1 : 1 - Math.exp(-POS_RATE * dt);
  const ps = e.ps;
  const pos = ps.position;

  if (t.posExact) {
    pos.x = t.x;
    pos.z = t.z;
  } else {
    pos.x = lerp(pos.x, t.x, kPos);
    pos.z = lerp(pos.z, t.z, kPos);
  }
  pos.y = t.yExact ? t.y : lerp(pos.y, t.y, kPos);

  if (t.faceExact) e.face = t.face;
  else e.face += wrapAngle(t.face - e.face) * kPose;
  e.rigX = lerp(e.rigX, t.rigX, kPose);
  e.rigZ = lerp(e.rigZ, t.rigZ, kPose);
  e.rArm = t.rArmExact ? t.rArm : lerp(e.rArm, t.rArm, kPose);
  e.rArmZ = lerp(e.rArmZ, t.rArmZ, kPose);
  e.lArmZ = lerp(e.lArmZ, t.lArmZ, kPose);

  ps.facing = e.face;
  ps.grounded = !t.air;
  ps.jumpsUsed = t.jumpsUsed;
  if (snap) {
    ps.velocity.set(0, 0, 0);
  } else {
    const d = Math.max(dt, 1e-4);
    const s = state.phase === 'approach' ? RUN_VELOCITY_SCALE : 1;
    ps.velocity.set((pos.x - e.prev.x) / d * s, (pos.y - e.prev.y) / d, (pos.z - e.prev.z) / d * s);
  }

  e.model.update(ps, dt);

  // Apply the pose after the model's own animation has run.
  const model = e.model;
  model.rig.position.y = t.bob;
  model.rig.rotation.x = e.rigX;
  model.rig.rotation.z = e.rigZ;
  model.arms.right.rotation.x = e.rArm;
  model.arms.right.rotation.z = e.rArmZ;
  model.arms.left.rotation.z = e.lArmZ;
  if (t.lArm !== null) {
    e.lArm = lerp(e.lArm, t.lArm, kPose);
    model.arms.left.rotation.x = e.lArm;
  } else {
    e.lArm = model.arms.left.rotation.x; // the model walks the left arm: follow it
  }
  if (e.legs) {
    if (t.legs) {
      e.legL = lerp(e.legL, t.legs.left, kPose);
      e.legR = lerp(e.legR, t.legs.right, kPose);
    } else {
      e.legL = e.legs.left.rotation.x; // the model walks the legs: follow it
      e.legR = e.legs.right.rotation.x;
    }
    e.legs.left.rotation.x = e.legL;
    e.legs.right.rotation.x = e.legR;
  }

  e.prev.copy(pos);
}

export function createBowler(ctx: Ctx): System {
  const entries = new Map<number, Entry>();
  let playersRef: Player[] | null = null;
  let lastPhase: Phase | null = null;

  return {
    update(dt: number) {
      const state = ctx.state;
      if (state.players !== playersRef) {
        // New game (or new roster): rebuild every gnome.
        for (const e of entries.values()) disposeEntry(ctx, e);
        entries.clear();
        playersRef = state.players;
      }

      const phase = state.phase;
      const phaseChanged = phase !== lastPhase;
      lastPhase = phase;

      const idx = bowlerIndex(state);
      const player = state.players[idx] as Player | undefined;
      const shown = player !== undefined
        && phase !== 'title'
        && phase !== 'lobby'
        && (phase !== 'final' || player.local);

      for (const [i, e] of entries) {
        if (!shown || i !== idx) {
          e.visible = false;
          e.model.object.visible = false;
        }
      }
      if (!shown || !player) return;

      let e = entries.get(idx);
      if (!e) {
        e = buildEntry(ctx, player, state);
        entries.set(idx, e);
      }
      // Teleport (no walk) when this gnome appears, and when the stance resets for intro, aim or the dance.
      const snap = !e.visible || (phaseChanged && (phase === 'intro' || phase === 'aim' || phase === 'final'));
      e.visible = true;
      e.model.object.visible = true;
      // The tag would float over the lane in the aiming camera; the HUD names the bowler then.
      e.sprite.visible = !(phase === 'aim' || phase === 'approach' || phase === 'roll');
      poseEntry(ctx, state, e, dt, snap);
    },
  };
}
