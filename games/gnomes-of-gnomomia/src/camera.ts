// RuneScape-style orbit camera around the player: arrow keys, middle-drag and the mouse wheel.
import * as THREE from 'three';
import { TUNING } from './config';
import { heightAt } from './terrain';

let cam: THREE.PerspectiveCamera | null = null;
let yaw = 0;
let pitch: number = TUNING.cameraPitchDefault;
let distance: number = TUNING.cameraDistanceDefault;
let snapped = false;

/** Arrow keys currently held. */
const held = new Set<string>();
const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

let dragging = false;
let dragX = 0;
let dragY = 0;

// Reused every frame so updateCamera does not allocate.
const focus = new THREE.Vector3();
const desired = new THREE.Vector3();

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** True while the player types in a text field; arrow keys are left alone then. */
function typing(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

export function initCamera(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement): void {
  cam = camera;

  window.addEventListener('keydown', (e) => {
    if (typing() || !ARROWS.includes(e.key)) return;
    e.preventDefault();
    held.add(e.key);
  });
  window.addEventListener('keyup', (e) => held.delete(e.key));
  window.addEventListener('blur', () => held.clear());

  // Middle-drag rotates and tilts the camera.
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 1) return;
    e.preventDefault(); // no browser autoscroll
    dragging = true;
    dragX = e.clientX;
    dragY = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw -= (e.clientX - dragX) * 0.008;
    pitch = clamp(pitch + (e.clientY - dragY) * 0.006, TUNING.cameraPitchMin, TUNING.cameraPitchMax);
    dragX = e.clientX;
    dragY = e.clientY;
  });
  const endDrag = (): void => {
    dragging = false;
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Wheel zooms in and out.
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      distance = clamp(distance * (e.deltaY > 0 ? 1.1 : 1 / 1.1), TUNING.cameraDistanceMin, TUNING.cameraDistanceMax);
    },
    { passive: false },
  );
}

export function updateCamera(dt: number, target: THREE.Vector3): void {
  if (!cam) return;

  // Keys turn at a fixed rate while held. Left/right turn yaw; up/down tilt pitch (up = higher).
  const turn = TUNING.cameraKeySpeed * dt;
  if (held.has('ArrowLeft')) yaw -= turn;
  if (held.has('ArrowRight')) yaw += turn;
  if (held.has('ArrowUp')) pitch += turn;
  if (held.has('ArrowDown')) pitch -= turn;
  pitch = clamp(pitch, TUNING.cameraPitchMin, TUNING.cameraPitchMax);

  // Orbit point sits a little above the player's feet.
  focus.set(target.x, target.y + 1, target.z);
  const horiz = Math.cos(pitch) * distance;
  desired.set(
    focus.x + Math.sin(yaw) * horiz,
    focus.y + Math.sin(pitch) * distance,
    focus.z + Math.cos(yaw) * horiz,
  );
  // Never let the camera sink into the ground.
  const floor = heightAt(desired.x, desired.z) + 0.8;
  if (desired.y < floor) desired.y = floor;

  if (!snapped) {
    cam.position.copy(desired);
    snapped = true;
  } else {
    cam.position.lerp(desired, 1 - Math.exp(-12 * dt));
  }
  cam.lookAt(focus);
}
