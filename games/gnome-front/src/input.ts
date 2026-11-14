// src/input.ts: keyboard and pointer-lock mouse. Filled in by epic 2 (issue 2.2).
import type { Input, InputState } from './config';

type HeldKey = 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'scoreboard';
type PressKey = 'jumpPressed' | 'reloadPressed' | 'usePressed' | 'grenadePressed';

const HELD: Record<string, HeldKey> = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
  Tab: 'scoreboard',
};

const PRESSED: Record<string, PressKey> = {
  Space: 'jumpPressed',
  KeyR: 'reloadPressed',
  KeyE: 'usePressed',
  KeyG: 'grenadePressed',
};

export function createInput(canvas: HTMLCanvasElement): Input {
  const state: InputState = {
    forward: false, back: false, left: false, right: false, sprint: false, fire: false, firePressed: false, aim: false,
    jumpPressed: false, reloadPressed: false, usePressed: false, grenadePressed: false, scoreboard: false,
    mouseDx: 0, mouseDy: 0, locked: false,
  };

  window.addEventListener('keydown', (e) => {
    const held = HELD[e.code];
    if (held) state[held] = true;
    const pressed = PRESSED[e.code];
    if (pressed && !e.repeat) state[pressed] = true;
    if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    const held = HELD[e.code];
    if (held) state[held] = false;
    if (e.code === 'Tab') e.preventDefault();
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      if (!state.fire) state.firePressed = true;
      state.fire = true;
    }
    if (e.button === 2) state.aim = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) state.fire = false;
    if (e.button === 2) state.aim = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      state.mouseDx += e.movementX;
      state.mouseDy += e.movementY;
    }
  });

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
  });

  // Losing focus releases everything, so a key held during alt-tab does not stick.
  window.addEventListener('blur', () => {
    state.forward = state.back = state.left = state.right = false;
    state.sprint = state.scoreboard = false;
    state.fire = false;
    state.aim = false;
  });

  // Right mouse aims: keep the browser menu away.
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    state,
    endFrame() {
      state.jumpPressed = state.reloadPressed = state.usePressed = state.grenadePressed = state.firePressed = false;
      state.mouseDx = state.mouseDy = 0;
    },
  };
}
