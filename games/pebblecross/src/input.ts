import * as THREE from 'three';
import type { CameraRig } from './camera';

export type TapHit =
  | { kind: 'ground'; x: number; z: number }
  | { kind: 'resident'; id: string }        // userData.residentId
  | { kind: 'place'; id: string }           // userData.placeId, a place (not forage)
  | { kind: 'forage'; id: string };         // userData.placeId, a forage patch

export interface Input {
  onTap(cb: (hit: TapHit) => void): void;
  onKey(cb: (key: 'use' | 'bag' | 'friends' | 'escape') => void): void;
  setPickables(objects: THREE.Object3D[]): void;   // residents, places and forage, re-read each tap
  dispose(): void;
}

const TAP_SLOP_PX = 10;
const WHEEL_ZOOM = 0.001;

/** Zoom change for a pinch: apart (next > prev) gives a negative delta, which zooms in. */
export function pinchZoomDelta(prevDist: number, nextDist: number): number {
  return (prevDist - nextDist) * 0.01;
}

function isTextEntry(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable === true;
}

export function createInput(canvas: HTMLCanvasElement, rig: CameraRig, ground: THREE.Object3D): Input {
  const tapCbs: Array<(hit: TapHit) => void> = [];
  const keyCbs: Array<(key: 'use' | 'bag' | 'friends' | 'escape') => void> = [];
  let pickables: THREE.Object3D[] = [];
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  // Pointer state: where each pointer went down, where it is now, and whether a pinch happened in this gesture.
  const starts = new Map<number, { x: number; y: number }>();
  const current = new Map<number, { x: number; y: number }>();
  let pinching = false;
  let lastPinchDist = 0;

  const pinchDistance = (): number => {
    const pts = [...current.values()];
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  const toNdc = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  };

  // Walk up from a hit object until a userData tag we know turns up.
  const tagOf = (obj: THREE.Object3D): TapHit | null => {
    let o: THREE.Object3D | null = obj;
    while (o) {
      const ud = o.userData as { residentId?: string; placeId?: string; forage?: boolean };
      if (typeof ud.residentId === 'string') return { kind: 'resident', id: ud.residentId };
      if (typeof ud.placeId === 'string') {
        return ud.forage ? { kind: 'forage', id: ud.placeId } : { kind: 'place', id: ud.placeId };
      }
      o = o.parent;
    }
    return null;
  };

  const hitAt = (clientX: number, clientY: number): TapHit | null => {
    toNdc(clientX, clientY);
    ray.setFromCamera(ndc, rig.camera);
    for (const hit of ray.intersectObjects(pickables, true)) {
      const tag = tagOf(hit.object);
      if (tag) return tag;
    }
    const onGround = ray.intersectObject(ground, true);
    if (onGround.length > 0) {
      const p = onGround[0].point;
      return { kind: 'ground', x: p.x, z: p.z };
    }
    return null;
  };

  const emitTap = (hit: TapHit) => {
    for (const cb of tapCbs) cb(hit);
  };

  const onPointerDown = (e: PointerEvent) => {
    starts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (current.size === 2) {
      pinching = true;
      lastPinchDist = pinchDistance();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!current.has(e.pointerId)) return;
    current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (current.size === 2) {
      const next = pinchDistance();
      rig.zoom(pinchZoomDelta(lastPinchDist, next));
      lastPinchDist = next;
    }
  };

  const endPointer = (e: PointerEvent, isCancel: boolean) => {
    const start = starts.get(e.pointerId);
    const wasPinch = pinching;
    starts.delete(e.pointerId);
    current.delete(e.pointerId);
    if (current.size === 0) pinching = false;

    if (isCancel || !start || wasPinch) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (moved >= TAP_SLOP_PX) return;
    const hit = hitAt(e.clientX, e.clientY);
    if (hit) emitTap(hit);
  };

  const onPointerUp = (e: PointerEvent) => endPointer(e, false);
  const onPointerCancel = (e: PointerEvent) => endPointer(e, true);

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    rig.zoom(e.deltaY * WHEEL_ZOOM);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTextEntry(document.activeElement)) return;
    let key: 'use' | 'bag' | 'friends' | 'escape' | null = null;
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') key = 'use';
    else if (e.key === 'b' || e.key === 'B') key = 'bag';
    else if (e.key === 'f' || e.key === 'F') key = 'friends';
    else if (e.key === 'Escape') key = 'escape';
    if (!key) return;
    if (key === 'use') e.preventDefault();   // stop Space from scrolling
    for (const cb of keyCbs) cb(key);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);

  return {
    onTap(cb) {
      tapCbs.push(cb);
    },
    onKey(cb) {
      keyCbs.push(cb);
    },
    setPickables(objects) {
      pickables = objects;
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      tapCbs.length = 0;
      keyCbs.length = 0;
      starts.clear();
      current.clear();
    },
  };
}
