// Desktop + mobile input manager with camera-relative movement and edge-triggered actions.
import type { PlayerActionInput } from './sim/types';

export interface MobileInputState {
  moveX: number;
  moveZ: number;
  sprint: boolean;
  guard: boolean;
  rollQueued: boolean;
  r1Queued: boolean;
  r2Queued: boolean;
  flaskQueued: boolean;
  interactQueued: boolean;
  lockQueued: boolean;
  lookDeltaX: number;
  lookDeltaY: number;
}

export interface InputManager {
  yaw: number;
  pitch: number;
  mobile: MobileInputState;
  setModalOpen: (open: boolean) => void;
  consumeLockToggle: () => boolean;
  sample: () => PlayerActionInput;
}

export function createInputManager(canvas: HTMLCanvasElement): InputManager {
  const keys = new Set<string>();
  let modalOpen = false;
  let yaw = 0; // camera sits at +z behind player, looking down -z toward culvert & boss
  let pitch = 0.28;

  let rollQueued = false;
  let r1Queued = false;
  let r2Queued = false;
  let flaskQueued = false;
  let interactQueued = false;
  let lockQueued = false;
  let guardMouse = false;

  const mobile: MobileInputState = {
    moveX: 0,
    moveZ: 0,
    sprint: false,
    guard: false,
    rollQueued: false,
    r1Queued: false,
    r2Queued: false,
    flaskQueued: false,
    interactQueued: false,
    lockQueued: false,
    lookDeltaX: 0,
    lookDeltaY: 0,
  };

  window.addEventListener('keydown', (e) => {
    if (modalOpen) return;
    if (e.code === 'Tab') {
      e.preventDefault();
      if (!e.repeat) lockQueued = true;
      return;
    }
    if (!e.repeat) {
      if (e.code === 'Space') {
        e.preventDefault();
        rollQueued = true;
      } else if (e.code === 'KeyR') flaskQueued = true;
      else if (e.code === 'KeyE') interactQueued = true;
      else if (e.code === 'KeyQ') lockQueued = true;
      else if (e.code === 'KeyJ') r1Queued = true;
      else if (e.code === 'KeyK') r2Queued = true;
    }
    keys.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
    guardMouse = false;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (modalOpen) return;
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
      return;
    }
    if (e.button === 0) r1Queued = true;
    else if (e.button === 2) r2Queued = true;
    else if (e.button === 1) {
      e.preventDefault();
      lockQueued = true;
    }
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas && !modalOpen) {
      yaw -= e.movementX * 0.0026;
      pitch = Math.max(-0.15, Math.min(1.05, pitch + e.movementY * 0.0022));
    }
  });

  return {
    get yaw() {
      return yaw;
    },
    set yaw(v: number) {
      yaw = v;
    },
    get pitch() {
      return pitch;
    },
    set pitch(v: number) {
      pitch = v;
    },
    mobile,
    setModalOpen(open: boolean) {
      modalOpen = open;
      if (open && document.pointerLockElement === canvas) {
        document.exitPointerLock?.();
      }
    },
    consumeLockToggle(): boolean {
      const hit = lockQueued || mobile.lockQueued;
      lockQueued = false;
      mobile.lockQueued = false;
      return hit;
    },
    sample(): PlayerActionInput {
      if (mobile.lookDeltaX !== 0 || mobile.lookDeltaY !== 0) {
        yaw -= mobile.lookDeltaX * 0.0045;
        pitch = Math.max(-0.15, Math.min(1.05, pitch + mobile.lookDeltaY * 0.0038));
        mobile.lookDeltaX = 0;
        mobile.lookDeltaY = 0;
      }

      if (modalOpen) {
        rollQueued = false;
        r1Queued = false;
        r2Queued = false;
        flaskQueued = false;
        interactQueued = false;
        return {
          moveX: 0, moveZ: 0, sprint: false, guard: false,
          rollPressed: false, r1Pressed: false, r2Pressed: false, flaskPressed: false, interactPressed: false,
        };
      }

      let rawX = mobile.moveX;
      let rawZ = mobile.moveZ;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) rawX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) rawX += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) rawZ -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) rawZ += 1;

      const len = Math.hypot(rawX, rawZ);
      let moveX = 0;
      let moveZ = 0;
      if (len > 0.08) {
        const nx = rawX / Math.max(1, len);
        const nz = rawZ / Math.max(1, len);
        // Camera sits at +sin(yaw), +cos(yaw) behind player, looking along (-sin(yaw), -cos(yaw))
        const fwdX = -Math.sin(yaw);
        const fwdZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);
        moveX = rightX * nx + fwdX * (-nz);
        moveZ = rightZ * nx + fwdZ * (-nz);
      }

      const inp: PlayerActionInput = {
        moveX,
        moveZ,
        sprint: keys.has('ShiftLeft') || keys.has('ShiftRight') || mobile.sprint,
        guard: keys.has('KeyF') || keys.has('KeyC') || guardMouse || mobile.guard,
        rollPressed: rollQueued || mobile.rollQueued,
        r1Pressed: r1Queued || mobile.r1Queued,
        r2Pressed: r2Queued || mobile.r2Queued,
        flaskPressed: flaskQueued || mobile.flaskQueued,
        interactPressed: interactQueued || mobile.interactQueued,
      };
      rollQueued = false;
      r1Queued = false;
      r2Queued = false;
      flaskQueued = false;
      interactQueued = false;
      mobile.rollQueued = false;
      mobile.r1Queued = false;
      mobile.r2Queued = false;
      mobile.flaskQueued = false;
      mobile.interactQueued = false;
      return inp;
    },
  };
}
