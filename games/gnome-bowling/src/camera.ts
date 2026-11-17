// The camera: behind the bowler while aiming, follows the ball, then watches the pins.
// Moves like a TV bowling broadcast. Only this file moves ctx.camera.
import * as THREE from 'three';
import { LANE, ROUND, THROW, type BallResult, type Ctx, type Phase, type System } from './config';

/** Chase camera stops here so it never passes the pins. */
const CHASE_Z_LIMIT = LANE.length - 4;
/** Seconds of shake after the first pin hit. */
const SHAKE_SECONDS = 0.3;
/** Shake amplitude at the moment of impact, metres. */
const SHAKE_AMOUNT = 0.035;
/** Shadow target z while aiming (no ball yet): mid-lane. */
const AIM_SHADOW_Z = 8;

const HIGH_WIDE_POS = new THREE.Vector3(0, 5, -7);
const HIGH_WIDE_LOOK = new THREE.Vector3(0, 0, 9);
const PIN_CAM_POS = new THREE.Vector3(1.1, 0.35, LANE.length - 1.0);
const PIN_CAM_LOOK = new THREE.Vector3(0, 0.2, LANE.length + 0.4);
const HIGH_RESULT_POS = new THREE.Vector3(0, 2.4, LANE.length - 3.5);
const HIGH_RESULT_LOOK = new THREE.Vector3(0, 0, LANE.length + 0.3);

const STRIKE_KINDS: ReadonlySet<BallResult['kind']> = new Set(['strike', 'double', 'turkey', 'hambone']);

interface PanPreset {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  toLook: THREE.Vector3;
  fov: number;
}

/** Varied broadcast pans from out on the lanes looking back across the players and the alley. */
const PAN_ANGLES: readonly PanPreset[] = [
  {
    // Low dolly across the lanes left-to-right.
    fromPos: new THREE.Vector3(-2.5, 1.15, 3.8),
    toPos: new THREE.Vector3(2.5, 1.15, 3.8),
    fromLook: new THREE.Vector3(-1.0, 0.75, -5.0),
    toLook: new THREE.Vector3(1.0, 0.75, -5.0),
    fov: 55,
  },
  {
    // High diagonal swoop right-to-left, descending toward the approach.
    fromPos: new THREE.Vector3(4.2, 3.0, 7.2),
    toPos: new THREE.Vector3(-2.6, 1.65, 3.4),
    fromLook: new THREE.Vector3(0.5, 0.65, -5.5),
    toLook: new THREE.Vector3(-0.8, 0.7, -5.5),
    fov: 58,
  },
  {
    // Mid-lane push-in from left-center to right-front.
    fromPos: new THREE.Vector3(-3.4, 2.2, 8.6),
    toPos: new THREE.Vector3(1.6, 1.35, 2.8),
    fromLook: new THREE.Vector3(-0.4, 0.75, -5.0),
    toLook: new THREE.Vector3(0.4, 0.7, -5.5),
    fov: 52,
  },
  {
    // Low-angle hero rise right-to-left.
    fromPos: new THREE.Vector3(2.6, 0.8, 2.6),
    toPos: new THREE.Vector3(-2.6, 1.9, 5.4),
    fromLook: new THREE.Vector3(0.9, 0.7, -4.8),
    toLook: new THREE.Vector3(-0.9, 0.8, -6.0),
    fov: 56,
  },
  {
    // Wide high balcony sweep left-to-right showing the full alley width.
    fromPos: new THREE.Vector3(-4.6, 3.2, 6.2),
    toPos: new THREE.Vector3(4.6, 3.0, 6.2),
    fromLook: new THREE.Vector3(-1.4, 0.65, -5.5),
    toLook: new THREE.Vector3(1.4, 0.65, -5.5),
    fov: 60,
  },
  {
    // Tighter approach-edge pan right-to-left.
    fromPos: new THREE.Vector3(2.0, 1.35, 2.0),
    toPos: new THREE.Vector3(-2.0, 1.55, 2.4),
    fromLook: new THREE.Vector3(0.7, 0.75, -4.6),
    toLook: new THREE.Vector3(-0.7, 0.75, -5.2),
    fov: 54,
  },
];

function smoothstep(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

export function createCamera(ctx: Ctx): System {
  const cam = ctx.camera;
  const state = ctx.state;
  const key = ctx.lights.key;

  // Smoothed (unshaken) position and look-at; shake is added only to the camera each frame.
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const wantPos = new THREE.Vector3();
  const wantLook = new THREE.Vector3();
  const aimPos = new THREE.Vector3();
  const aimLook = new THREE.Vector3();

  const BASE_FOV = 55;
  const AIM_FOV = 42;
  let started = false;
  let pinCam = false;
  let lastPhase: Phase = state.phase;

  /** Behind and above the bowler. zShift eases the camera forward during the run-up. */
  function setAimView(p: THREE.Vector3, l: THREE.Vector3, zShift: number): void {
    const portrait = cam.aspect < 0.8;
    // Pulled back and slightly wider so most of the bowler gnome is in frame while the pins read clearly.
    const y = portrait ? 2.1 : 1.75;
    const z = (portrait ? -5.2 : -4.4) + zShift;
    p.set(state.aimX * 0.5, y, z);
    l.set(state.aimX * 0.3 + Math.sin(state.aimYaw) * 14, 0.15, 12);
  }

  /** Shake strength for the pin cam: strongest at the first pin hit, gone after SHAKE_SECONDS. */
  function pinShake(): number {
    const sim = state.sim;
    if (!sim) return 0;
    let first = Infinity;
    for (const e of sim.events) {
      if (e.kind === 'ballPin' && e.t <= state.rollTime && e.t < first) first = e.t;
    }
    if (!Number.isFinite(first)) return 0;
    const age = state.rollTime - first;
    if (age < 0 || age >= SHAKE_SECONDS) return 0;
    return SHAKE_AMOUNT * (1 - age / SHAKE_SECONDS);
  }

  return {
    update(dt: number): void {
      const phase = state.phase;
      const phaseChanged = phase !== lastPhase;
      lastPhase = phase;
      if (phase !== 'roll') pinCam = false;

      let rate = 4;
      let snap = false;
      let shake = 0;
      let panPreset: PanPreset | null = null;

      switch (phase) {
        case 'title':
        case 'lobby':
        case 'final': {
          // Slow orbit high over the approach, looking at the pins.
          const t = state.time;
          wantPos.set(Math.sin(t * 0.15) * 3, 2.2, -4 + Math.cos(t * 0.15));
          wantLook.set(0, 0.3, LANE.length);
          break;
        }

        case 'intro': {
          // Swoop from a high wide shot down to the aim view.
          const e = smoothstep(state.phaseTime / ROUND.introSeconds);
          setAimView(aimPos, aimLook, 0);
          wantPos.lerpVectors(HIGH_WIDE_POS, aimPos, e);
          wantLook.lerpVectors(HIGH_WIDE_LOOK, aimLook, e);
          break;
        }

        case 'aim': {
          setAimView(wantPos, wantLook, 0);
          break;
        }

        case 'approach': {
          // Same view, easing slightly forward with the bowler.
          const p = Math.min(1, state.phaseTime / THROW.approachSeconds);
          setAimView(wantPos, wantLook, 0.6 * p);
          break;
        }

        case 'roll': {
          const sim = state.sim;
          if (!sim || sim.ball.length === 0) {
            setAimView(wantPos, wantLook, 0);
            break;
          }
          if (!pinCam && !sim.gutter && state.rollTime > sim.reachPinsAt - 0.25) {
            // Cut to the pin cam: no smoothing on this frame.
            pinCam = true;
            snap = true;
          }
          if (pinCam) {
            wantPos.copy(PIN_CAM_POS);
            wantLook.copy(PIN_CAM_LOOK);
            shake = pinShake();
          } else {
            const idx = Math.min(sim.ball.length - 1, Math.max(0, Math.floor(state.rollTime / sim.sampleDt)));
            const b = sim.ball[idx];
            // Follow the ball; x at half strength so the view stays mostly lane-centred.
            wantPos.set(b.x * 0.5, b.y + 0.75, Math.min(b.z - 2.6, CHASE_Z_LIMIT));
            wantLook.set(b.x * 0.5, 0.2, b.z + 6);
            rate = 8;
          }
          break;
        }

        case 'result': {
          if (state.result && STRIKE_KINDS.has(state.result.kind)) {
            // Slow push-in on the empty deck from the pin cam.
            const push = Math.min(1, state.phaseTime / ROUND.bigResultSeconds);
            wantPos.copy(PIN_CAM_POS);
            wantPos.z += 0.4 * push;
            wantLook.copy(PIN_CAM_LOOK);
          } else {
            // High view down the deck so the leftover pins read clearly.
            wantPos.copy(HIGH_RESULT_POS);
            wantLook.copy(HIGH_RESULT_LOOK);
          }
          break;
        }

        case 'framePan': {
          const idx = Math.max(0, state.frame - 1) % PAN_ANGLES.length;
          panPreset = PAN_ANGLES[idx];
          const e = smoothstep(state.phaseTime / ROUND.framePanSeconds);
          wantPos.lerpVectors(panPreset.fromPos, panPreset.toPos, e);
          wantLook.lerpVectors(panPreset.fromLook, panPreset.toLook, e);
          rate = 10;
          if (phaseChanged) snap = true;
          break;
        }

        default: {
          setAimView(wantPos, wantLook, 0);
          break;
        }
      }

      if (!started || snap) {
        pos.copy(wantPos);
        look.copy(wantLook);
        started = true;
      } else {
        const k = 1 - Math.exp(-rate * dt);
        pos.lerp(wantPos, k);
        look.lerp(wantLook, k);
      }

      cam.position.copy(pos);
      if (shake > 0) {
        cam.position.x += Math.sin(state.time * 71) * shake;
        cam.position.y += Math.sin(state.time * 53) * shake * 0.6;
      }
      cam.lookAt(look);
      // Narrow lens while aiming (the lane is long), preset FOV for framePan, normal lens for everything else.
      const aiming = state.phase === 'aim' || state.phase === 'approach' || state.phase === 'intro';
      const wantFov = panPreset ? panPreset.fov : aiming ? AIM_FOV : BASE_FOV;
      if (Math.abs(cam.fov - wantFov) > 0.05) {
        if (snap) cam.fov = wantFov;
        else cam.fov += (wantFov - cam.fov) * (1 - Math.exp(-4 * dt));
        cam.updateProjectionMatrix();
      }

      // Shadow light follows the action so shadows stay sharp where we look.
      let subjectZ: number = LANE.length;
      if (phase === 'roll') {
        const sim = state.sim;
        if (pinCam || !sim || sim.ball.length === 0) {
          subjectZ = LANE.length;
        } else {
          const idx = Math.min(sim.ball.length - 1, Math.max(0, Math.floor(state.rollTime / sim.sampleDt)));
          subjectZ = sim.ball[idx].z;
        }
      } else if (phase === 'intro' || phase === 'aim' || phase === 'approach') {
        subjectZ = AIM_SHADOW_Z;
      } else if (phase === 'framePan') {
        subjectZ = -4;
      }
      const minTargetZ = phase === 'framePan' ? -5 : 2;
      const targetZ = Math.min(LANE.length, Math.max(minTargetZ, subjectZ));
      key.target.position.set(0, 0, targetZ);
      key.target.updateMatrixWorld();
      key.position.set(key.target.position.x + 2, key.target.position.y + 8, key.target.position.z - 8);
      key.updateMatrixWorld();
    },
  };
}
