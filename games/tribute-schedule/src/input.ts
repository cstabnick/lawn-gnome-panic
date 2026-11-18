import type { SimInput } from './sim/types';

export interface InputController {
  sample: () => SimInput;
  requestLock: () => void;
  consumePauseToggle: () => boolean;
  consumeLedgerToggle: () => boolean;
  setTouchMove: (x: number, z: number) => void;
  addTouchLook: (dx: number, dy: number) => void;
  triggerAction: (action: 'interact' | 'nod' | 'chirp' | 'light') => void;
}

export function createInput(canvas: HTMLCanvasElement): InputController {
  const keys = new Set<string>();
  let yawDelta = 0;
  let pitchDelta = 0;
  let pendingInteract = false;
  let pendingNod = false;
  let pendingChirp = false;
  let pendingLight = false;
  let pendingPause = false;
  let pendingLedger = false;

  let touchMoveX = 0;
  let touchMoveZ = 0;

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    const code = e.code;
    keys.add(code);
    if (code === 'KeyE') pendingInteract = true;
    if (code === 'Space' || code === 'KeyN') {
      e.preventDefault();
      pendingNod = true;
    }
    if (code === 'KeyC' || code === 'KeyQ') pendingChirp = true;
    if (code === 'KeyF') pendingLight = true;
    if (code === 'KeyP' || code === 'Escape') pendingPause = true;
    if (code === 'KeyL') pendingLedger = true;
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  canvas.addEventListener('mousedown', () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    } else {
      pendingInteract = true;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      yawDelta -= e.movementX * 0.0024;
      pitchDelta -= e.movementY * 0.0022;
    }
  });

  function sample(): SimInput {
    let mx = touchMoveX;
    let mz = touchMoveZ;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1;

    const out: SimInput = {
      moveX: Math.max(-1, Math.min(1, mx)),
      moveZ: Math.max(-1, Math.min(1, mz)),
      lookYawDelta: yawDelta,
      lookPitchDelta: pitchDelta,
      interact: pendingInteract,
      nod: pendingNod,
      chirp: pendingChirp,
      toggleFlashlight: pendingLight,
    };

    yawDelta = 0;
    pitchDelta = 0;
    pendingInteract = false;
    pendingNod = false;
    pendingChirp = false;
    pendingLight = false;

    return out;
  }

  return {
    sample,
    requestLock: () => {
      try {
        canvas.requestPointerLock?.();
      } catch {
        // ignore on mobile / unsupported browsers
      }
    },
    consumePauseToggle: () => {
      const v = pendingPause;
      pendingPause = false;
      return v;
    },
    consumeLedgerToggle: () => {
      const v = pendingLedger;
      pendingLedger = false;
      return v;
    },
    setTouchMove: (x: number, z: number) => {
      touchMoveX = x;
      touchMoveZ = z;
    },
    addTouchLook: (dx: number, dy: number) => {
      yawDelta -= dx * 0.0045;
      pitchDelta -= dy * 0.0038;
    },
    triggerAction: (action) => {
      if (action === 'interact') pendingInteract = true;
      if (action === 'nod') pendingNod = true;
      if (action === 'chirp') pendingChirp = true;
      if (action === 'light') pendingLight = true;
    },
  };
}
