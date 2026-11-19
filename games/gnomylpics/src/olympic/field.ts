// The stadium kit every event view builds from: sky and lights, grass, a 4-lane track, lines, distance signs,
// the four gnomes, a follow camera and the overlay scoreboard. Use only inside createView.
// World: events run along +z from z = 0. Lanes sit side by side on x (laneX). y is up. 1 unit = 1 metre.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import type { SeatInfo } from '@lawn/party';

/** Metres between lane centres. */
export const LANE_W = 1.6;

/** x of lane k's centre. Seat 0 is on the left for a camera behind the start looking down +z. */
export function laneX(k: number): number {
  return (1.5 - k) * LANE_W;
}

/** '#rrggbb' from a seat colour number. */
export function css(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Sky colour, fog, a hemisphere light and a shadow-casting sun. */
export function addSkyAndLights(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x8fd3ff);
  scene.fog = new THREE.Fog(0x8fd3ff, 60, 220);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 1.3));

  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(20, 40, -10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -60;
  cam.right = 60;
  cam.top = 60;
  cam.bottom = -60;
  cam.far = 150;
  cam.updateProjectionMatrix();
  sun.target.position.set(0, 0, 40);
  scene.add(sun.target);
  scene.add(sun);
}

/** A flat grass rectangle, x from -width/2 to width/2, z from z0 to z0 + length, at y = 0. */
export function addGrass(scene: THREE.Scene, width: number, length: number, z0 = -20): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 8 bands of 1 m each per 8 m tile, alternating light and dark mowing stripes.
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#56a544' : '#63b851';
      ctx.fillRect(0, i * 64, 64, 64);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, length / 8);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ color: 0x5cae4a, map }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0, z0 + length / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/** A 4-lane running surface (default red-brown) from z0 to z0 + length, one lane per laneX, white lane lines, at y = 0.01. */
export function addTrack(scene: THREE.Scene, length: number, opts: { z0?: number; color?: number } = {}): void {
  const z0 = opts.z0 ?? -5;
  const color = opts.color ?? 0xc1440e;
  const width = 4 * LANE_W + 0.6;

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ color }),
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0, 0.01, z0 + length / 2);
  surface.receiveShadow = true;
  scene.add(surface);

  // Five lines at the lane boundaries: laneX(0) + LANE_W/2 down to laneX(3) - LANE_W/2.
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (let i = 0; i < 5; i++) {
    const x = laneX(0) + LANE_W / 2 - i * LANE_W;
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.05, length), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.012, z0 + length / 2);
    line.receiveShadow = true;
    scene.add(line);
  }
}

/** A flat strip across all four lanes at z (start, finish, foul line). Default width 0.12 m. */
export function addLine(scene: THREE.Scene, z: number, color: number, width = 0.12): void {
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(4 * LANE_W, width),
    new THREE.MeshStandardMaterial({ color }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, 0.015, z);
  strip.receiveShadow = true;
  scene.add(strip);
}

/** A sign with the number of metres beside the track every `every` metres from fromZ to toZ.
 *  The number shown is z - zeroZ (default zeroZ = 0). */
/** The push mower prefabs, one per seat in turn. Each is a mower from the mowers catalog; the seat colour is not kept. */
const MOWER_IDS = ['push-mower-red', 'push-mower-green', 'push-mower-yellow'] as const;

/** A push mower for seat k, standing on the ground at the origin, front facing +z. `scale` is the prefab's uniform scale. */
export function pushMower(k: number, scale: number): THREE.Group {
  return buildPrefab(MOWER_IDS[k % MOWER_IDS.length], { scale });
}

export function addDistanceMarkers(scene: THREE.Scene, fromZ: number, toZ: number, every: number, zeroZ = 0): void {
  const x = laneX(3) - LANE_W / 2 - 0.8;
  const count = Math.floor((toZ - fromZ) / every + 1e-9);
  for (let i = 0; i <= count; i++) {
    const z = fromZ + i * every;
    const post = buildPrefab('distance-post');
    post.position.set(x, 0, z);
    scene.add(post);

    const label = textSprite(`${Math.round(z - zeroZ)} m`, '#ffffff', 0.45);
    label.position.set(x, 1.1, z);
    scene.add(label);
  }
}

/** A camera-facing text label (canvas texture). height = world height in metres. */
export function textSprite(text: string, color = '#ffffff', height = 0.5): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = 'bold 40px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 128, 32);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 32);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, transparent: true }));
  sprite.scale.set(height * 4, height, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export interface Racer {
  seat: SeatInfo;
  model: GnomeModel;
  /** Fed to model.update by poseRacer; read position from here. */
  pose: PlayerState;
  /** Name label floating above the head, in the seat colour. */
  label: THREE.Sprite;
}

/** One gnome per seat at (laneX(k), 0, startZ), facing +z, with its name label. */
export function addRacers(scene: THREE.Scene, seats: readonly SeatInfo[], startZ = 0): Racer[] {
  return seats.map((seat, k) => {
    const model = createGnomeModel(seat.look);
    model.object.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
    scene.add(model.object);

    const pose: PlayerState = {
      position: new THREE.Vector3(laneX(k), 0, startZ),
      velocity: new THREE.Vector3(),
      facing: 0,
      grounded: true,
      jumpsUsed: 0,
    };
    const label = textSprite(seat.name, css(seat.color), 0.35);
    scene.add(label);
    model.update(pose, 0);
    return { seat, model, pose, label };
  });
}

/** Places a racer and animates it: vz is its speed along +z (drives the run cycle); y > 0 means airborne. */
export function poseRacer(r: Racer, x: number, y: number, z: number, vz: number, dt: number): void {
  r.pose.position.set(x, y, z);
  r.pose.velocity.set(0, y > 0.02 ? 1 : 0, vz);
  r.pose.grounded = y <= 0.02;
  r.pose.facing = 0;
  r.model.update(r.pose, dt);
  r.label.position.set(x, y + 1.9, z);
}

// Per-camera look-at point, so the follow camera eases its aim as well as its position.
const lookTargets = new WeakMap<THREE.Camera, THREE.Vector3>();

/** Eases the camera towards focus + offset and looks at focus (frame-rate independent, rate per second). */
export function followCamera(camera: THREE.PerspectiveCamera, focus: THREE.Vector3, offset: THREE.Vector3, dt: number, rate = 4): void {
  const k = 1 - Math.exp(-dt * rate);
  let look = lookTargets.get(camera);
  if (!look) {
    // First call for this camera: snap position and aim.
    look = focus.clone();
    lookTargets.set(camera, look);
    camera.position.copy(focus).add(offset);
  } else {
    camera.position.lerp(focus.clone().add(offset), k);
    look.lerp(focus, k);
  }
  camera.lookAt(look);
}

export interface Board {
  /** The scoreboard's root element (inside the ui passed to createBoard). */
  el: HTMLElement;
  /** Sets the text after a seat's name, e.g. '12.43 s' or 'FOUL'. */
  set(seat: number, text: string): void;
  /** A big centred message for ms (default 1200), e.g. 'PERFECT!'. A new banner replaces the old one. */
  banner(text: string, color?: string, ms?: number): void;
  /** A smaller hint line at the bottom centre (empty string hides it). */
  hint(text: string): void;
}

/** Scoreboard rows in the top-left (seat colour name + text; my seat in bold), a banner and a hint line. */
export function createBoard(ui: HTMLElement, seats: readonly SeatInfo[], mySeat: number | null): Board {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:system-ui';

  const rows = document.createElement('div');
  rows.style.cssText = 'position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.45);border-radius:10px;padding:8px 12px;font:600 16px system-ui;color:#fff';
  el.appendChild(rows);

  const values: HTMLElement[] = [];
  for (const seat of seats) {
    const row = document.createElement('div');
    const isMine = seat.seat === mySeat;
    row.style.fontWeight = isMine ? '900' : '600';

    const mark = document.createElement('span');
    mark.textContent = isMine ? '▶ ' : '';
    const name = document.createElement('span');
    name.style.color = css(seat.color);
    name.textContent = `● ${seat.name}`;
    const value = document.createElement('span');
    value.textContent = '';
    value.style.marginLeft = '12px';

    row.append(mark, name, value);
    rows.appendChild(row);
    values[seat.seat] = value;
  }

  const banner = document.createElement('div');
  banner.style.cssText = 'position:absolute;top:30%;left:0;right:0;text-align:center;font:900 min(10vw,64px) system-ui;text-shadow:0 3px 8px #000;color:#fff;transform:scale(1);opacity:0;pointer-events:none';
  el.appendChild(banner);
  let bannerTimer: ReturnType<typeof setTimeout> | undefined;

  const hint = document.createElement('div');
  hint.style.cssText = 'position:absolute;bottom:24%;left:0;right:0;text-align:center;font:700 20px system-ui;text-shadow:0 2px 4px #000;color:#fff;display:none';
  el.appendChild(hint);

  ui.appendChild(el);

  return {
    el,
    set(seat, text) {
      const target = values[seat];
      if (target) target.textContent = text;
    },
    banner(text, color = '#ffffff', ms = 1200) {
      if (bannerTimer !== undefined) clearTimeout(bannerTimer);
      banner.textContent = text;
      banner.style.color = color;
      // Scale in from a little larger, then settle.
      banner.style.transition = 'none';
      banner.style.transform = 'scale(1.25)';
      banner.style.opacity = '0';
      void banner.offsetWidth;
      banner.style.transition = 'transform 0.15s, opacity 0.15s';
      banner.style.transform = 'scale(1)';
      banner.style.opacity = '1';
      bannerTimer = setTimeout(() => {
        banner.style.opacity = '0';
        bannerTimer = undefined;
      }, ms);
    },
    hint(text) {
      hint.textContent = text;
      hint.style.display = text ? 'block' : 'none';
    },
  };
}
