// Birding: the binocular scope. Hold or tap to raise, look, zoom, snap.
import * as THREE from 'three';
import { KEYS, isTyping } from '../keys';
import { BIRDING, type ScopeFrame } from './types';

export interface Scope {
  viewing(): boolean;
  /** View direction while viewing (chase-camera convention: yaw 0 = +z, pitch positive = down). */
  yaw(): number;
  pitch(): number;
  /** Current zoom (a value from ScopeFrame.zooms) and its label ('4x'). */
  zoom(): number;
  zoomLabel(): string;
  /** Vertical field of view in degrees at the current zoom. */
  fov(): number;
  /** The scope button or key went down (true) or up (false). A short press latches the scope up; a long one is hold-to-view. */
  setHeld(down: boolean): void;
  /** Put the scope down now. */
  lower(): void;
  cycleZoom(): void;
  /** True once after a snap was asked for (mouse, RT, the Snap button). */
  takeSnap(): boolean;
  /** Ask for a snap (the touch Snap button). */
  requestSnap(): void;
  update(f: ScopeFrame): void;
  /** After the chase camera: puts the camera at the eye looking along yaw/pitch with the scope's field of view. No-op when not viewing. */
  applyCamera(eyeX: number, eyeY: number, eyeZ: number, dt: number): void;
  dispose(): void;
}

/** Standard gamepad button indices. */
const PAD_RIGHT = 15;
const PAD_RB = 5;
const PAD_RT = 7;

/** Scratch vectors (no allocation per frame). */
const scratchPos = new THREE.Vector3();
const scratchLook = new THREE.Vector3();

/** Unit forward vector of (yaw, pitch) in the chase-camera convention. Writes into out. */
function forwardOf(yaw: number, pitch: number, out: THREE.Vector3): THREE.Vector3 {
  const cp = Math.cos(pitch);
  return out.set(Math.sin(yaw) * cp, -Math.sin(pitch), Math.cos(yaw) * cp);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** The gamepad currently in use (the first connected one), or null. */
function activePad(): Gamepad | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  const pads = navigator.getGamepads();
  for (let i = 0; i < pads.length; i++) {
    const p = pads[i];
    if (p && p.connected) return p;
  }
  return null;
}

/** Angle (radians) between the view direction (yaw, pitch) from (ex, ey, ez) and the direction to (x, y, z). */
export function angleToView(yaw: number, pitch: number, ex: number, ey: number, ez: number, x: number, y: number, z: number): number {
  const dx = x - ex;
  const dy = y - ey;
  const dz = z - ez;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) return 0;
  const f = forwardOf(yaw, pitch, scratchLook);
  const dot = (f.x * dx + f.y * dy + f.z * dz) / len;
  return Math.acos(clamp(dot, -1, 1));
}

/** Bearing of (x, z) from (fromX, fromZ) relative to yaw: 0 = straight ahead, positive = to the right, in (-PI, PI]. */
export function bearingTo(yaw: number, fromX: number, fromZ: number, x: number, z: number): number {
  const dx = x - fromX;
  const dz = z - fromZ;
  // Camera right at yaw is (-cos, sin); camera forward (horizontal) is (sin, cos).
  const right = dx * -Math.cos(yaw) + dz * Math.sin(yaw);
  const fwd = dx * Math.sin(yaw) + dz * Math.cos(yaw);
  return Math.atan2(right, fwd);
}

export function createScope(camera: THREE.PerspectiveCamera): Scope {
  let viewingNow = false;
  let latched = false;
  /** Seconds the current press has lasted; -1 when not pressed. */
  let pressT = -1;
  /** The current press lowered a latched scope; it must not raise it again. */
  let pressUnlatched = false;
  let yawNow = 0;
  let pitchNow = 0;
  let zoomIndex = 0;
  let snap = false;
  let baseFov = camera.fov;
  let fovNow = camera.fov;
  let zooms: readonly number[] = [];

  // Gamepad edge state.
  let padRight = false;
  let padRB = false;
  let padRT = false;

  const zoomValue = (): number => (viewingNow && zooms.length > 0 ? zooms[Math.min(zoomIndex, zooms.length - 1)] : 1);

  const lower = (): void => {
    viewingNow = false;
    latched = false;
  };

  const cycleZoom = (): void => {
    if (zooms.length > 0) zoomIndex = (zoomIndex + 1) % zooms.length;
  };

  const setHeld = (down: boolean): void => {
    if (down) {
      pressT = 0;
      pressUnlatched = false;
      if (latched) {
        latched = false;
        pressUnlatched = true;
      }
    } else {
      if (pressT >= 0 && pressT < BIRDING.tapSeconds && !pressUnlatched) latched = true;
      pressT = -1;
      pressUnlatched = false;
    }
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === KEYS.binoculars && !e.repeat && !isTyping(e)) setHeld(true);
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === KEYS.binoculars) setHeld(false);
  };
  const onWheel = (e: WheelEvent): void => {
    if (!viewingNow || zooms.length === 0) return;
    if (e.deltaY < 0) zoomIndex = Math.min(zoomIndex + 1, zooms.length - 1);
    else if (e.deltaY > 0) zoomIndex = Math.max(zoomIndex - 1, 0);
  };
  const onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0 && viewingNow) snap = true;
  };

  const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  if (hasWindow) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
  }

  return {
    viewing: () => viewingNow,
    yaw: () => yawNow,
    pitch: () => pitchNow,
    zoom: zoomValue,
    zoomLabel: () => `${zoomValue()}x`,
    fov: () => baseFov / zoomValue(),
    setHeld,
    lower,
    cycleZoom,
    takeSnap() {
      const s = snap;
      snap = false;
      return s;
    },
    requestSnap() {
      if (viewingNow) snap = true;
    },
    update(f: ScopeFrame) {
      if (pressT >= 0) pressT += f.dt;
      zooms = f.zooms;

      // Gamepad: D-pad right is the scope button; RT snaps and RB cycles zoom while viewing.
      const pad = activePad();
      const right = !!pad?.buttons[PAD_RIGHT]?.pressed;
      const rb = !!pad?.buttons[PAD_RB]?.pressed;
      const rt = (pad?.buttons[PAD_RT]?.value ?? 0) > 0.5;
      if (right !== padRight) {
        padRight = right;
        setHeld(right);
      }
      if (viewingNow) {
        if (rt && !padRT) snap = true;
        if (rb && !padRB) cycleZoom();
      }
      padRT = rt;
      padRB = rb;

      const wanted = (pressT >= 0 && !pressUnlatched) || latched;
      if (wanted && f.canView) {
        if (!viewingNow) {
          viewingNow = true;
          yawNow = f.camYaw;
          pitchNow = clamp(f.camPitch - 0.15, BIRDING.pitchMin, BIRDING.pitchMax);
          baseFov = camera.fov;
          fovNow = camera.fov;
          zoomIndex = zooms.length > 0 ? Math.min(zoomIndex, zooms.length - 1) : 0;
        }
        const s = 1 / (0.6 + 0.4 * zoomValue());
        yawNow += f.lookYaw * s;
        pitchNow = clamp(pitchNow + f.lookPitch * s, BIRDING.pitchMin, BIRDING.pitchMax);
      } else {
        lower();
      }
    },
    applyCamera(eyeX: number, eyeY: number, eyeZ: number, dt: number) {
      if (!viewingNow) return;
      const fw = forwardOf(yawNow, pitchNow, scratchLook);
      scratchPos.set(
        eyeX + fw.x * BIRDING.eyeForward,
        eyeY + fw.y * BIRDING.eyeForward,
        eyeZ + fw.z * BIRDING.eyeForward,
      );
      camera.position.copy(scratchPos);
      scratchLook.set(scratchPos.x + fw.x, scratchPos.y + fw.y, scratchPos.z + fw.z);
      camera.lookAt(scratchLook);
      fovNow += (baseFov / zoomValue() - fovNow) * (1 - Math.exp(-12 * dt));
      camera.fov = fovNow;
      camera.updateProjectionMatrix();
    },
    dispose() {
      if (hasWindow) {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('mousedown', onMouseDown);
      }
    },
  };
}
