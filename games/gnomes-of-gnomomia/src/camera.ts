// RuneScape-style orbit camera around the player: arrow keys, middle-drag or left-drag, the mouse wheel, and on touch
// screens a one-finger drag to turn and a pinch to zoom.
import * as THREE from 'three';
import { TUNING } from './config';
import { settings } from './settings';
import { heightAt } from './terrain';

let cam: THREE.PerspectiveCamera | null = null;
let yaw = 0;
let pitch: number = TUNING.cameraPitchDefault;
let distance: number = TUNING.cameraDistanceDefault;
let snapped = false;

export function getCameraYaw(): number {
  return yaw;
}

export function setCameraYaw(nextYaw: number): void {
  yaw = nextYaw;
}

/** Arrow keys currently held. */
const held = new Set<string>();
const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

let dragging = false;
let dragX = 0;
let dragY = 0;

/** Primary-button pointers down on the canvas (mouse or fingers), for drag-to-orbit and pinch-to-zoom. */
const held1 = new Map<number, { x: number; y: number }>();
const DRAG_PX = 8;
let orbitStart: { x: number; y: number } | null = null;
let orbiting = false;
let pinchDist = 0;

function spread(): number {
  const [a, b] = [...held1.values()];
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
}

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
    const sens = settings.cameraSpeed;
    const ySign = settings.invertY ? -1 : 1;
    yaw -= (e.clientX - dragX) * 0.008 * sens;
    pitch = clamp(pitch + (e.clientY - dragY) * 0.006 * sens * ySign, TUNING.cameraPitchMin, TUNING.cameraPitchMax);
    dragX = e.clientX;
    dragY = e.clientY;
  });
  const endDrag = (): void => {
    dragging = false;
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Left-drag (mouse) or one-finger drag (touch) orbits once it has moved past DRAG_PX, so a short press is still a
  // click (input.ts uses the same 8 px). Two fingers pinch to zoom.
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    held1.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (held1.size === 1) {
      orbitStart = { x: e.clientX, y: e.clientY };
      orbiting = false;
    } else if (held1.size === 2) {
      pinchDist = spread();
      orbitStart = null;
    }
  });
  window.addEventListener('pointermove', (e) => {
    const p = held1.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (held1.size === 1 && orbitStart) {
      if (!orbiting && Math.hypot(e.clientX - orbitStart.x, e.clientY - orbitStart.y) > DRAG_PX) orbiting = true;
      if (orbiting) {
        const sens = settings.cameraSpeed;
        const ySign = settings.invertY ? -1 : 1;
        yaw -= dx * 0.008 * sens;
        pitch = clamp(pitch + dy * 0.006 * sens * ySign, TUNING.cameraPitchMin, TUNING.cameraPitchMax);
      }
    } else if (held1.size === 2) {
      const d = spread();
      if (pinchDist > 0 && d > 0) {
        distance = clamp(distance * (pinchDist / d), TUNING.cameraDistanceMin, TUNING.cameraDistanceMax);
      }
      pinchDist = d;
    }
  });
  const release = (e: PointerEvent): void => {
    held1.delete(e.pointerId);
    // Lifting one finger of a pinch does not turn into an orbit.
    orbitStart = null;
    if (held1.size === 0) orbiting = false;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

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
  const turn = TUNING.cameraKeySpeed * settings.cameraSpeed * dt;
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
