// Desktop keyboard and mouse (pointer lock) in the DayG control map, merged with the touch source.
import { CAMERA } from '../config';
import type { Input, InputState, TouchSource } from './types';

export function createInput(canvas: HTMLCanvasElement, touch: TouchSource): Input {
  const held = new Set<string>();
  const edges = new Set<string>();
  let attackEdge = false;
  let mouseDX = 0;
  let mouseDY = 0;
  let lockAllowed = true;

  const locked = (): boolean => document.pointerLockElement === canvas;
  const tryLock = (): void => {
    if (!lockAllowed || touch.active() || locked()) return;
    try {
      const r = canvas.requestPointerLock() as unknown;
      if (r instanceof Promise) r.catch(() => {});
    } catch {
      // Pointer lock needs a user gesture; the next click on the canvas takes it.
    }
  };

  addEventListener('keydown', (e) => {
    held.add(e.code);
    if (!e.repeat) edges.add(e.code);
    if (e.code === 'Tab' || e.code === 'Space' || e.code === 'F9' || e.code.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', (e) => held.delete(e.code));
  addEventListener('blur', () => held.clear());

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !lockAllowed) return;
    // The first click only takes the pointer; swings need the lock.
    if (locked()) attackEdge = true;
    else tryLock();
  });

  document.addEventListener('mousemove', (e) => {
    if (!locked()) return;
    mouseDX += e.movementX;
    mouseDY += e.movementY;
  });

  const down = (...codes: string[]): boolean => codes.some((c) => held.has(c));
  const edge = (...codes: string[]): boolean => codes.some((c) => edges.has(c));

  return {
    setPointerLockAllowed(allowed: boolean): void {
      lockAllowed = allowed;
      if (!allowed && locked()) document.exitPointerLock();
    },
    read(_dt: number): InputState {
      let moveX = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
      let moveZ = (down('KeyW', 'ArrowUp') ? 1 : 0) - (down('KeyS', 'ArrowDown') ? 1 : 0);
      const len = Math.hypot(moveX, moveZ);
      if (len > 1) { moveX /= len; moveZ /= len; }

      const out: InputState = {
        moveX, moveZ,
        lookX: mouseDX * CAMERA.lookSensitivity,
        lookY: mouseDY * CAMERA.lookSensitivity,
        sprint: down('ShiftLeft', 'ShiftRight'),
        crouch: edge('KeyC'),
        action: edge('KeyE'),
        attack: attackEdge || edge('KeyF'),
        climb: edge('Space'),
        inventory: edge('Tab', 'KeyI'),
        view: edge('KeyV'),
        map: edge('KeyM'),
        trainer: edge('F9'),
      };

      const t = touch.read();
      const tx = t.moveX ?? 0, tz = t.moveZ ?? 0;
      if (Math.hypot(tx, tz) > Math.hypot(out.moveX, out.moveZ)) { out.moveX = tx; out.moveZ = tz; }
      out.lookX += t.lookX ?? 0;
      out.lookY += t.lookY ?? 0;
      out.sprint ||= !!t.sprint;
      out.crouch ||= !!t.crouch;
      out.action ||= !!t.action;
      out.attack ||= !!t.attack;
      out.climb ||= !!t.climb;
      out.inventory ||= !!t.inventory;
      out.view ||= !!t.view;
      out.map ||= !!t.map;

      edges.clear();
      attackEdge = false;
      mouseDX = 0;
      mouseDY = 0;
      return out;
    },
  };
}
