// Desktop keyboard + pointer-lock mouse input merged with mobile touch state.
import type { AbilitySlot } from './sim/config';
import type { HeroActionInput } from './sim/world';

export interface MobileInputState {
  moveX: number; // -1..1
  moveY: number; // -1..1 (forward positive)
  yawDelta: number;
  pitchDelta: number;
  fireHeld: boolean;
  adsHeld: boolean;
  jumpQueued: boolean;
  dashQueued: boolean;
  slideHeld: boolean;
  reloadQueued: boolean;
  abilityQueued: AbilitySlot | null;
}

export function createInputManager(canvas: HTMLCanvasElement) {
  const keys = new Set<string>();
  let yaw = Math.PI;
  let pitch = -0.05;
  let mouseDownLeft = false;
  let mouseDownRight = false;
  let jumpQueued = false;
  let dashQueued = false;
  let reloadQueued = false;
  let abilityQueued: AbilitySlot | null = null;
  let pointerLocked = false;
  let modalOpen = false;
  let onToggleShop: (() => void) | null = null;
  let onScoreboard: ((open: boolean) => void) | null = null;

  const mobile: MobileInputState = {
    moveX: 0,
    moveY: 0,
    yawDelta: 0,
    pitchDelta: 0,
    fireHeld: false,
    adsHeld: false,
    jumpQueued: false,
    dashQueued: false,
    slideHeld: false,
    reloadQueued: false,
    abilityQueued: null,
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyB') {
      onToggleShop?.();
      return;
    }
    if (e.code === 'Tab') {
      e.preventDefault();
      onScoreboard?.(true);
      return;
    }
    if (modalOpen) return;

    keys.add(e.code);
    if (!e.repeat) {
      if (e.code === 'Space') jumpQueued = true;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') dashQueued = true;
      else if (e.code === 'KeyR') reloadQueued = true;
      else if (e.code === 'KeyQ' || e.code === 'Digit1') abilityQueued = 'Q';
      else if (e.code === 'KeyE' || e.code === 'Digit2') abilityQueued = 'E';
      else if (e.code === 'KeyF' || e.code === 'Digit3') abilityQueued = 'F';
      else if (e.code === 'KeyX' || e.code === 'Digit4') abilityQueued = 'X';
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
    if (e.code === 'Tab') {
      onScoreboard?.(false);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!pointerLocked || modalOpen) return;
    const sens = (mouseDownRight || mobile.adsHeld) ? 0.0014 : 0.0022;
    yaw -= e.movementX * sens;
    pitch = Math.max(-1.05, Math.min(1.05, pitch - e.movementY * sens));
  };

  const onMouseDown = (e: MouseEvent) => {
    if (modalOpen) return;
    if (e.target === canvas && !pointerLocked) {
      canvas.requestPointerLock?.();
    }
    if (e.button === 0) mouseDownLeft = true;
    if (e.button === 2) mouseDownRight = true;
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) mouseDownLeft = false;
    if (e.button === 2) mouseDownRight = false;
  };

  const onPointerLockChange = () => {
    pointerLocked = document.pointerLockElement === canvas;
  };

  const onContextMenu = (e: MouseEvent) => {
    if (e.target === canvas) e.preventDefault();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  window.addEventListener('contextmenu', onContextMenu);

  return {
    mobile,
    setHandlers(shopFn: () => void, scoreFn: (open: boolean) => void) {
      onToggleShop = shopFn;
      onScoreboard = scoreFn;
    },
    setModalOpen(open: boolean) {
      modalOpen = open;
      if (open && document.pointerLockElement === canvas) {
        document.exitPointerLock?.();
      }
      if (open) {
        mouseDownLeft = false;
        mouseDownRight = false;
        keys.clear();
      }
    },
    setYaw(v: number) {
      yaw = v;
    },
    isAds(): boolean {
      return mouseDownRight || mobile.adsHeld;
    },
    sample(): HeroActionInput {
      if (mobile.yawDelta !== 0 || mobile.pitchDelta !== 0) {
        yaw -= mobile.yawDelta;
        pitch = Math.max(-1.05, Math.min(1.05, pitch - mobile.pitchDelta));
        mobile.yawDelta = 0;
        mobile.pitchDelta = 0;
      }

      const fwd =
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) +
        mobile.moveY;
      const right =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
        mobile.moveX;

      const jump = jumpQueued || mobile.jumpQueued;
      const dash = dashQueued || mobile.dashQueued;
      const reload = reloadQueued || mobile.reloadQueued;
      const ability = abilityQueued ?? mobile.abilityQueued;

      jumpQueued = false;
      dashQueued = false;
      reloadQueued = false;
      abilityQueued = null;
      mobile.jumpQueued = false;
      mobile.dashQueued = false;
      mobile.reloadQueued = false;
      mobile.abilityQueued = null;

      return {
        move: {
          forward: Math.max(-1, Math.min(1, fwd)),
          right: Math.max(-1, Math.min(1, right)),
          yaw,
          jumpPressed: jump,
          dashPressed: dash,
          slideHeld: keys.has('ControlLeft') || keys.has('ControlRight') || keys.has('KeyC') || mobile.slideHeld,
        },
        pitch,
        fireHeld: mouseDownLeft || mobile.fireHeld,
        reloadPressed: reload,
        abilityPressed: ability,
      };
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('contextmenu', onContextMenu);
    },
  };
}
