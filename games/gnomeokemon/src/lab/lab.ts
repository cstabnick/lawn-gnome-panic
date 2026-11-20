import * as THREE from 'three';
import { loadBestPhotos } from '../snap/storage';
import { HOUSE_CENTER_X, HOUSE_TOP_Y, buildRooms, roomOrigin, type RoomHandle, type RoomId } from './rooms';

export type { RoomId };

export interface Lab {
  readonly canvas: HTMLCanvasElement;
  /**
   * Glide the camera to a room. `instant` snaps (used on first load). `shift` slides the view sideways (world units)
   * to leave space for a docked panel; `lift` (0..1) slides it up to leave space for a bottom sheet.
   */
  goTo(room: RoomId, opts?: { instant?: boolean; shift?: number; lift?: number }): void;
  /** Pull back to see the house from the garden: the front wall comes back. */
  showOutside(opts?: { instant?: boolean }): void;
  /** Re-read the saved photos (darkroom clothesline) and trophies (office). */
  refresh(): void;
  /** Stop rendering (while the ride is on screen) or start again. */
  setActive(on: boolean): void;
  dispose(): void;
}

function skyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3b6a9a');
  g.addColorStop(0.6, '#8fb8d8');
  g.addColorStop(1, '#f4d9a8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The Fescue Field Lab: a two-storey house with the front wall fading away so the camera can look into each room. The
 * camera glides from room to room (up and down the stairs, so to speak). The 2D menus are plain DOM on top.
 */
export function createLab(parent: HTMLElement): Lab {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
  parent.append(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0x9fc0d8, 70, 170);
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x2a3a2c, 0.8));
  const sun = new THREE.DirectionalLight(0xfff0d0, 0.2);
  sun.position.set(HOUSE_CENTER_X + 14, 26, 20);
  scene.add(sun);

  const { handles: rooms, facade } = buildRooms(scene, loadBestPhotos());

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 260);
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const wantPos = new THREE.Vector3();
  const wantLook = new THREE.Vector3();
  let room: RoomId = 'hall';
  let outside = false;
  let shift = 0;
  let lift = 0;
  let facadeAlpha = 0;
  let active = true;
  let disposed = false;
  let animId = 0;
  let snapNext = true;
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

  /** Camera distance in front of the house so `halfW` world units fit each side of the screen. */
  function fitZ(halfW: number, behind: number): number {
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(7.6, halfW / (tanV * Math.max(0.4, camera.aspect)) - behind);
  }

  function aim(): void {
    if (outside) {
      wantPos.set(HOUSE_CENTER_X, 5.6, fitZ(24, 0) + 8);
      wantLook.set(HOUSE_CENTER_X, HOUSE_TOP_Y * 0.5 + 1.2, 0);
    } else {
      const o = roomOrigin(room);
      const halfW = shift > 0 ? 10.5 : 6.2;
      wantPos.set(o.x + shift, o.y + 2.05, fitZ(halfW, 0.5));
      wantLook.set(o.x + shift, o.y + 1.45, -1);
    }
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

    aim();
    if (snapNext) {
      camPos.copy(wantPos);
      camLook.copy(wantLook);
      snapNext = false;
    }
    const k = 1 - Math.exp(-dt * 3.2);
    const dx = wantPos.x - camPos.x;
    camPos.lerp(wantPos, k);
    camLook.lerp(wantLook, k);

    // Idle sway so the shot is never dead still; a little roll while travelling.
    camera.position.set(camPos.x + Math.sin(t * 0.4) * 0.18, camPos.y + Math.sin(t * 0.7) * 0.04, camPos.z);
    camera.lookAt(camLook.x + Math.sin(t * 0.3) * 0.12, camLook.y, camLook.z);
    camera.rotation.z = -dx * 0.004;
    applyLift();

    // The front wall is only there when you are outside; fade it as the camera moves in.
    const target = outside ? 1 : 0;
    facadeAlpha += (target - facadeAlpha) * (1 - Math.exp(-dt * 3));
    if (Math.abs(target - facadeAlpha) < 0.01) facadeAlpha = target;
    facade.group.visible = facadeAlpha > 0.01;
    for (const m of facade.materials) (m as THREE.Material & { opacity: number }).opacity = facadeAlpha;
    sun.intensity = 0.2 + facadeAlpha * 1.1;

    for (const r of rooms) r.update(t, room);
    renderer.render(scene, camera);
  }
  animId = requestAnimationFrame(tick);

  return {
    canvas,
    goTo(next, opts) {
      room = next;
      outside = false;
      shift = opts?.shift ?? 0;
      lift = opts?.lift ?? 0;
      if (opts?.instant) {
        snapNext = true;
        facadeAlpha = 0;
      }
    },
    showOutside(opts) {
      outside = true;
      shift = 0;
      lift = 0;
      if (opts?.instant) {
        snapNext = true;
        facadeAlpha = 1;
      }
    },
    refresh() {
      const best = loadBestPhotos();
      for (const r of rooms as RoomHandle[]) r.refresh?.(best);
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
