import * as THREE from 'three';
import { loadBestPhotos } from '../snap/storage';
import { buildRooms, ROOM_ORDER, ROOM_SPACING, type RoomHandle, type RoomId } from './rooms';

export type { RoomId };


export interface Lab {
  readonly canvas: HTMLCanvasElement;
  /** Glide the camera to a room. `instant` snaps (used on first load). */
  goTo(room: RoomId, opts?: { instant?: boolean; shift?: number; lift?: number }): void;
  /** Re-read the saved photos (darkroom clothesline) and trophies (office). */
  refresh(): void;
  /** Stop rendering (while the ride is on screen) or start again. */
  setActive(on: boolean): void;
  dispose(): void;
}

/** World x of a room's centre. */
export function roomX(room: RoomId): number {
  return ROOM_ORDER.indexOf(room) * ROOM_SPACING;
}

/**
 * The Fescue Field Lab: a dollhouse-style building (front wall removed) of five rooms in a row. The camera glides
 * from room to room along the open front. The 2D menus are plain DOM layered on top of this canvas.
 */
export function createLab(parent: HTMLElement): Lab {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
  parent.append(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x0d140f);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d140f, 24, 70);
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x2a3a2c, 0.8));

  const rooms: RoomHandle[] = buildRooms(scene, loadBestPhotos());

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let targetX = 0;
  let shift = 0;
  let lift = 0;
  let camX = 0;
  let current: RoomId = 'hall';
  let active = true;
  let disposed = false;
  let animId = 0;
  const clock = new THREE.Clock();

  function resize(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1) return;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  /** Slide the picture up so a bottom sheet of menu (`lift` = fraction of the screen height) doesn't hide the room. */
  function applyLift(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (lift > 0 && w > 0 && h > 0) camera.setViewOffset(w, h, 0, h * lift, w, h);
    else camera.clearViewOffset();
  }

  /** How far back the camera sits so a whole room fits the screen width (portrait phones need more). */
  function cameraZ(): number {
    const halfW = shift > 0 ? 10.5 : 6.2;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(7.6, halfW / (tanV * Math.max(0.4, camera.aspect)) - 4.5 + 4);
  }

  function tick(): void {
    if (disposed) return;
    animId = requestAnimationFrame(tick);
    if (!active) {
      clock.getDelta();
      return;
    }
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    resize();

    const dx = targetX - camX;
    camX += dx * (1 - Math.exp(-dt * 3.2));
    const moving = Math.min(1, Math.abs(dx) / 6);

    camPos.set(camX + Math.sin(t * 0.4) * 0.18, 2.05 + Math.sin(t * 0.7) * 0.04 + moving * 0.15, cameraZ());
    camLook.set(camX + Math.sin(t * 0.3) * 0.12, 1.45, -1);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    camera.rotation.z = -dx * 0.004;
    applyLift();

    for (const r of rooms) r.update(t, current);
    renderer.render(scene, camera);
  }
  animId = requestAnimationFrame(tick);

  return {
    canvas,
    goTo(room, opts) {
      current = room;
      shift = opts?.shift ?? 0;
      lift = opts?.lift ?? 0;
      targetX = roomX(room) + shift;
      if (opts?.instant) camX = targetX;
    },
    refresh() {
      const best = loadBestPhotos();
      for (const r of rooms) r.refresh?.(best);
    },
    setActive(on) {
      active = on;
      canvas.style.visibility = on ? 'visible' : 'hidden';
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(animId);
      renderer.dispose();
      canvas.remove();
    },
  };
}
