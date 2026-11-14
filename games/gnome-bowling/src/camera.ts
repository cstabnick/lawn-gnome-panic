// The camera: behind the bowler while aiming, follows the ball, then watches the pins.
// Moves like a TV bowling broadcast. Only this file moves ctx.camera.
import * as THREE from 'three';
import { LANE, ROUND, THROW, type BallResult, type Ctx, type System } from './config';

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
  const AIM_FOV = 36;
  let started = false;
  let pinCam = false;

  /** Behind and above the bowler. zShift eases the camera forward during the run-up. */
  function setAimView(p: THREE.Vector3, l: THREE.Vector3, zShift: number): void {
    const portrait = cam.aspect < 0.8;
    // High enough to see over the bowler's head; the narrow aim FOV (AIM_FOV) makes the far pins read.
    const y = portrait ? 2.5 : 2.15;
    const z = (portrait ? -4.6 : -3.8) + zShift;
    p.set(state.aimX * 0.5, y, z);
    l.set(state.aimX * 0.3 + Math.sin(state.aimYaw) * 18, 0, 17);
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
      if (phase !== 'roll') pinCam = false;

      let rate = 4;
      let snap = false;
      let shake = 0;

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
      // Narrow lens while aiming (the lane is long), normal lens for everything else.
      const aiming = state.phase === 'aim' || state.phase === 'approach' || state.phase === 'intro';
      const wantFov = aiming ? AIM_FOV : BASE_FOV;
      if (Math.abs(cam.fov - wantFov) > 0.05) {
        cam.fov += (wantFov - cam.fov) * (1 - Math.exp(-4 * dt));
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
      }
      const targetZ = Math.min(LANE.length, Math.max(2, subjectZ));
      key.target.position.set(0, 0, targetZ);
      key.target.updateMatrixWorld();
      key.position.set(key.target.position.x + 2, key.target.position.y + 8, key.target.position.z - 8);
      key.updateMatrixWorld();
    },
  };
}
