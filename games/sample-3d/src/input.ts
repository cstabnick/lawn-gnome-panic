// src/input.ts
import { firstPad } from '@lawn/gamepad';
import { TUNING, type InputController, type InputState, type TouchControls } from './config';

const DEADZONE = 0.15;

export function createInput(canvas: HTMLCanvasElement, touch?: TouchControls): InputController {
  const held = new Set<string>();
  const edges = new Set<string>();
  let clicked = false;
  let mouseDX = 0;
  let mouseDY = 0;
  let padAWasDown = false;
  let lockAllowed = false;

  const tryLock = (): void => {
    try {
      const r = canvas.requestPointerLock() as unknown;
      if (r instanceof Promise) r.catch(() => {});
    } catch {
      // Pointer lock needs a user gesture; the next click on the canvas will take it.
    }
  };

  window.addEventListener('keydown', (e) => {
    held.add(e.code);
    if (!e.repeat) edges.add(e.code);
    if (e.code === 'Space' || e.code.startsWith('Arrow') || e.code.startsWith('Shift')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
  });

  canvas.addEventListener('click', () => {
    if (lockAllowed) tryLock();
    clicked = true;
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      mouseDX += e.movementX;
      mouseDY += e.movementY;
    }
  });

  const down = (code: string): boolean => held.has(code);
  const edge = (code: string): boolean => edges.has(code);

  return {
    setPointerLockAllowed(allowed: boolean): void {
      lockAllowed = allowed;
      if (allowed) tryLock();
      else if (document.pointerLockElement === canvas) document.exitPointerLock();
    },
    read(dt: number): InputState {
      let moveX = (down('KeyD') || down('ArrowRight') ? 1 : 0) - (down('KeyA') || down('ArrowLeft') ? 1 : 0);
      let moveY = (down('KeyW') || down('ArrowUp') ? 1 : 0) - (down('KeyS') || down('ArrowDown') ? 1 : 0);
      const keyTurn = ((down('KeyE') ? 1 : 0) - (down('KeyQ') ? 1 : 0)) * TUNING.cameraKeyTurnSpeed * dt;
      let lookX = mouseDX * TUNING.cameraLookSensitivity + keyTurn;
      let lookY = mouseDY * TUNING.cameraLookSensitivity;

      let jump = edge('Space');
      let start = edge('Space') || edge('Enter') || clicked;
      let sprint = down('ShiftLeft') || down('ShiftRight');

      const pad = firstPad();
      if (pad) {
        const axis = (i: number): number => {
          const v = pad.axes[i] ?? 0;
          return Math.abs(v) < DEADZONE ? 0 : v;
        };
        moveX += axis(0);
        moveY += -axis(1);
        lookX += axis(2) * TUNING.cameraKeyTurnSpeed * dt;
        lookY += axis(3) * TUNING.cameraKeyTurnSpeed * dt;

        const padADown = pad.buttons[0]?.pressed ?? false;
        if (padADown && !padAWasDown) {
          jump = true;
          start = true;
        }
        padAWasDown = padADown;
        // LB, RB or left-stick click sprints.
        if (pad.buttons[4]?.pressed || pad.buttons[5]?.pressed || pad.buttons[10]?.pressed) sprint = true;
      } else {
        padAWasDown = false;
      }

      if (touch) {
        const t = touch.read();
        moveX += t.moveX;
        moveY += t.moveY;
        lookX += t.lookX;
        lookY += t.lookY;
        if (t.jump) { jump = true; start = true; }
        if (t.sprint) sprint = true;
      }

      moveX = Math.max(-1, Math.min(1, moveX));
      moveY = Math.max(-1, Math.min(1, moveY));

      const out: InputState = { moveX, moveY, jump, sprint, start, lookX, lookY };

      edges.clear();
      clicked = false;
      mouseDX = 0;
      mouseDY = 0;
      return out;
    },
  };
}
