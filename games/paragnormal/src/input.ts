import type { SimInput } from './sim/types';
import type { TouchControls } from './touch';

export interface InputController {
  sample(dt: number): SimInput;
  consumePauseToggle(): boolean;
  requestLock(): void;
  dispose(): void;
}

function clamp1(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

/** Keyboard and mouse, plus the on-screen touch controls when they are showing. Both feed the same SimInput. */
export function createInput(canvas: HTMLCanvasElement, touch?: TouchControls): InputController {
  const keys = new Set<string>();
  let yawDelta = 0;
  let pitchDelta = 0;
  let interactQueued = false;
  let lanternQueued = false;
  let pauseQueued = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyE') interactQueued = true;
    if (e.code === 'KeyF') lanternQueued = true;
    if (e.code === 'KeyP') pauseQueued = true;
  };

  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.target !== canvas) return;
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onMouseUp = () => {
    dragging = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === canvas) {
      yawDelta -= e.movementX * 0.0024;
      pitchDelta -= e.movementY * 0.0022;
    } else if (dragging) {
      yawDelta -= (e.clientX - lastX) * 0.0035;
      pitchDelta -= (e.clientY - lastY) * 0.003;
      lastX = e.clientX;
      lastY = e.clientY;
    }
  };

  const onBlur = () => {
    keys.clear();
    dragging = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('blur', onBlur);

  return {
    sample(dt: number): SimInput {
      const fwd = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
      const right = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);

      // Keyboard turn fallback (great for headless demos and trackpads)
      const keyYaw = ((keys.has('ArrowLeft') || keys.has('KeyQ') ? 1 : 0) -
        (keys.has('ArrowRight') ? 1 : 0)) * 1.9 * dt;
      const keyPitch = ((keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0)) * 1.3 * dt;

      const t = touch?.read();
      const out: SimInput = {
        moveForward: clamp1(fwd + (t?.forward ?? 0)),
        moveRight: clamp1(right + (t?.right ?? 0)),
        yawDelta: yawDelta + keyYaw + (t?.yawDelta ?? 0),
        pitchDelta: pitchDelta + keyPitch + (t?.pitchDelta ?? 0),
        sprint: keys.has('ShiftLeft') || keys.has('ShiftRight') || !!t?.sprint,
        // Crouch is C only. Ctrl is not bound: Ctrl+W (held Ctrl while moving with W) closes the browser tab, and
        // browsers do not let a page block it, so Ctrl as a game key ends the run by closing the game.
        crouch: keys.has('KeyC') || !!t?.crouch,
        interact: interactQueued || !!t?.interact,
        toggleLantern: lanternQueued || !!t?.lantern,
      };
      yawDelta = 0;
      pitchDelta = 0;
      interactQueued = false;
      lanternQueued = false;
      return out;
    },

    consumePauseToggle(): boolean {
      const v = pauseQueued || (touch?.consumePause() ?? false);
      pauseQueued = false;
      return v;
    },

    requestLock(): void {
      canvas.requestPointerLock?.();
    },

    dispose(): void {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('blur', onBlur);
    },
  };
}
