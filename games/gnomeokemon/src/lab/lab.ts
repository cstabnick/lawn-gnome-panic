import * as THREE from 'three';
import { loadBestPhotos } from '../snap/storage';
import { loadSettings } from '../settings';
import { createMirror } from './photographer';
import {
  COLS,
  DOOR_Z,
  EYE_HEIGHT,
  FLOOR_SPACING,
  FRONT_WALL_Z,
  HOUSE_CENTER_X,
  HOUSE_TOP_Y,
  ROOM_CELLS,
  ROOM_SPACING,
  ROOM_VIEW_Z,
  STAIR,
  buildRooms,
  roomOrigin,
  type RoomHandle,
  type RoomId,
} from './rooms';

export type { RoomId };

/** Where the 2D panel sits, so the 3D view can slide to the free part of the screen. */
export interface PanelSpace {
  side: 'left' | 'right';
  /** Fraction of the screen width the panel covers (0..1). */
  frac: number;
  /** Fraction of the screen height a bottom sheet covers (phones). */
  sheet?: number;
}

export interface Lab {
  readonly canvas: HTMLCanvasElement;
  /** Walk to a room's viewpoint through the doorways and up the stairs. `instant` teleports. */
  goTo(room: RoomId, opts?: { instant?: boolean; panel?: PanelSpace }): void;
  /** Walk out through the front door to the garden and the title view of the house. */
  showTitle(opts?: { instant?: boolean }): void;
  /** True while the camera is outside the house. */
  isOutside(): boolean;
  /** Re-read the saved photos (darkroom clothesline) and trophies (office). */
  refresh(): void;
  /** Rebuild the photographer pair in the mirror (after settings changed). */
  refreshMirror(): void;
  /** Stop rendering (while the ride is on screen) or start again. */
  setActive(on: boolean): void;
  dispose(): void;
}

const WALK_SPEED = 6.5;
const TITLE = 'title';

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

/** The walking graph: where a person can stand, and which spots connect. */
interface Graph {
  nodes: Map<string, THREE.Vector3>;
  edges: Map<string, string[]>;
}

function buildGraph(titlePos: THREE.Vector3): Graph {
  const nodes = new Map<string, THREE.Vector3>();
  const edges = new Map<string, string[]>();
  const add = (id: string, x: number, y: number, z: number): void => {
    nodes.set(id, new THREE.Vector3(x, y, z));
  };
  const link = (a: string, b: string): void => {
    edges.set(a, [...(edges.get(a) ?? []), b]);
    edges.set(b, [...(edges.get(b) ?? []), a]);
  };

  const byCell = new Map<string, RoomId>();
  for (const id of Object.keys(ROOM_CELLS) as RoomId[]) {
    const o = roomOrigin(id);
    add(id, o.x, o.y + EYE_HEIGHT, ROOM_VIEW_Z);
    byCell.set(`${ROOM_CELLS[id].col},${ROOM_CELLS[id].row}`, id);
  }

  // Doorways between neighbours on the same floor: stand in front of the door, pass through, stand behind it.
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < COLS - 1; col++) {
      const a = byCell.get(`${col},${row}`);
      const b = byCell.get(`${col + 1},${row}`);
      if (!a || !b) continue;
      const xd = (col + 0.5) * ROOM_SPACING;
      const y = row * FLOOR_SPACING + EYE_HEIGHT;
      add(`${a}>${b}:in`, xd - 1.8, y, DOOR_Z);
      add(`${a}>${b}:door`, xd, y, DOOR_Z);
      add(`${a}>${b}:out`, xd + 1.8, y, DOOR_Z);
      link(a, `${a}>${b}:in`);
      link(`${a}>${b}:in`, `${a}>${b}:door`);
      link(`${a}>${b}:door`, `${a}>${b}:out`);
      link(`${a}>${b}:out`, b);
    }
  }

  // The lobby staircase up to the Grading Office.
  const hx = roomOrigin('hall').x;
  const ox = roomOrigin('office').x;
  add('stair:near', hx - 2.6, EYE_HEIGHT, -0.4);
  add('stair:foot', hx + STAIR.x0 + 0.1, EYE_HEIGHT, STAIR.z);
  add('stair:top', hx + STAIR.x1 - 0.1, FLOOR_SPACING + EYE_HEIGHT, STAIR.z);
  add('stair:exit', ox + 5.3, FLOOR_SPACING + EYE_HEIGHT, -1.2);
  link('hall', 'stair:near');
  link('stair:near', 'stair:foot');
  link('stair:foot', 'stair:top');
  link('stair:top', 'stair:exit');
  link('stair:exit', 'office');

  // Out of the front door into the garden, and the title view.
  add('door:step', hx, EYE_HEIGHT, FRONT_WALL_Z + 1.0);
  add('garden:near', hx, EYE_HEIGHT, 9);
  add('garden:far', hx, EYE_HEIGHT, 22);
  nodes.set(TITLE, titlePos);
  link('hall', 'door:step');
  link('door:step', 'garden:near');
  link('garden:near', 'garden:far');
  link('garden:far', TITLE);
  return { nodes, edges };
}

/** Fewest-hops route between two graph nodes. */
function route(graph: Graph, from: string, to: string): string[] {
  if (from === to) return [to];
  const prev = new Map<string, string>();
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift() as string;
    for (const nb of graph.edges.get(cur) ?? []) {
      if (seen.has(nb)) continue;
      seen.add(nb);
      prev.set(nb, cur);
      if (nb === to) {
        const path = [to];
        let at = to;
        while (prev.has(at)) {
          at = prev.get(at) as string;
          path.unshift(at);
        }
        return path;
      }
      queue.push(nb);
    }
  }
  return [to];
}

/**
 * The Fescue Field Lab: a closed two-storey house. The camera is the player (a gnome on a gnome's shoulders holding a
 * camera) and physically walks: out of the garden through the front door, between rooms through the doorways and up the
 * lobby staircase. The 2D menus are plain DOM on top.
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
  sun.position.set(HOUSE_CENTER_X + 14, 26, 30);
  scene.add(sun);

  const mirror = createMirror();
  const { handles: rooms, facade } = buildRooms(scene, loadBestPhotos(), mirror);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 260);
  const titlePos = new THREE.Vector3(HOUSE_CENTER_X, 3.2, 40);
  const titleLook = new THREE.Vector3(HOUSE_CENTER_X, HOUSE_TOP_Y * 0.5 + 3.2, 0);
  const graph = buildGraph(titlePos);

  // Walker state.
  const pos = titlePos.clone();
  const look = titleLook.clone();
  let queue: THREE.Vector3[] = [];
  let heading = new THREE.Vector3(0, 0, -1);
  let phase = 0;
  let room: RoomId | typeof TITLE = TITLE;
  let finalLook = titleLook.clone();
  let blendDist = 12;
  let panel: PanelSpace | null = null;
  let doorOpen = 0;
  let outsideness = 1;
  let active = true;
  let disposed = false;
  let animId = 0;
  const clock = new THREE.Clock();

  function resize(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1) return;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    const aspect = w / h;
    // Portrait phones need a wider lens to see any of the room.
    const fov = aspect >= 1.4 ? 66 : aspect >= 1 ? 72 : 84;
    if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr) || camera.fov !== fov) {
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      camera.aspect = aspect;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    // The title shot: far enough back to take in the whole house.
    const tanV = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    titlePos.z = Math.max(34, 25 / (tanV * Math.max(0.4, aspect)) + 4);
  }

  /** Slide the picture so the room sits in the free part of the screen, not under a panel or bottom sheet. */
  function applyView(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1) return;
    let ox = 0;
    let oy = 0;
    if (panel && room !== TITLE) {
      ox = (panel.side === 'left' ? -1 : 1) * (panel.frac / 2) * w;
      oy = (panel.sheet ?? 0) * h * 0.5;
    }
    if (ox !== 0 || oy !== 0) camera.setViewOffset(w, h, ox, oy, w, h);
    else camera.clearViewOffset();
  }

  function roomLook(id: RoomId): THREE.Vector3 {
    const o = roomOrigin(id);
    return new THREE.Vector3(o.x, o.y + 1.35, -2.5);
  }

  function nearestNode(): string {
    let best = TITLE;
    let bd = Infinity;
    for (const [id, p] of graph.nodes) {
      const d = p.distanceToSquared(pos) + (id === TITLE ? 400 : 0);
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    return best;
  }

  function walkTo(target: string, instant: boolean): void {
    const dest = graph.nodes.get(target) as THREE.Vector3;
    if (instant) {
      pos.copy(dest);
      queue = [];
      return;
    }
    const path = route(graph, nearestNode(), target);
    queue = path.map((id) => graph.nodes.get(id) as THREE.Vector3);
  }

  /** Length of the walk left, so the gaze can turn to the room before the last few steps. */
  function remaining(): number {
    let d = 0;
    let at = pos;
    for (const p of queue) {
      d += at.distanceTo(p);
      at = p;
    }
    return d;
  }

  const eye = new THREE.Vector3();
  const want = new THREE.Vector3();

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

    // Standing at the title view: follow it as the window is resized.
    if (room === TITLE && queue.length === 0) pos.copy(titlePos);

    // The front door swings OUTWARD (away from whoever is inside) and only while someone is passing through it.
    const inDoorZone = Math.abs(pos.x - facade.doorX) < 4 && pos.z > ROOM_VIEW_Z - 0.2 && pos.z < 18 && pos.y < 3;
    const doorWanted = queue.length > 0 && inDoorZone;

    // Walk along the queue (wait at the door until it is open).
    let moving = false;
    const blockedByDoor = queue.length > 0 && Math.abs(pos.x - facade.doorX) < 1.5 && pos.z > ROOM_VIEW_Z - 0.2 && pos.z < FRONT_WALL_Z + 1.2 && doorOpen < 0.8;
    if (queue.length && !blockedByDoor) {
      const target = queue[0];
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dz = target.z - pos.z;
      const dist = Math.hypot(dx, dy, dz);
      const climbing = Math.abs(dy) > 0.2;
      const step = WALK_SPEED * (climbing ? 0.65 : 1) * dt;
      const horiz = Math.hypot(dx, dz);
      if (horiz > 0.05) heading.set(dx / horiz, 0, dz / horiz);
      if (step >= dist) {
        pos.copy(target);
        queue.shift();
      } else {
        pos.addScaledVector(new THREE.Vector3(dx, dy, dz), step / dist);
      }
      moving = true;
      phase += step * 2.1;
    }

    // Where to look: along the walk, turning to the room as the walk ends.
    if (moving && queue.length) {
      const rem = remaining();
      const w = Math.min(1, Math.max(0, 1 - rem / blendDist));
      want.copy(pos).addScaledVector(heading, 6);
      const slope = (queue[0].y - pos.y) / Math.max(0.5, Math.hypot(queue[0].x - pos.x, queue[0].z - pos.z));
      want.y = pos.y - 0.2 + Math.min(1.6, Math.max(-1, slope * 4));
      want.lerp(finalLook, w);
    } else {
      want.copy(finalLook);
    }
    look.lerp(want, 1 - Math.exp(-dt * 5));

    // The camera is the player's head: a little bob while walking, a slow sway when standing.
    const bob = loadSettings().bob && moving ? Math.abs(Math.sin(phase)) * 0.07 : 0;
    const sway = room === TITLE ? 0.25 : 0.05;
    eye.set(pos.x + Math.sin(t * 0.4) * sway, pos.y + bob + Math.sin(t * 0.7) * 0.02, pos.z);
    camera.position.copy(eye);
    camera.lookAt(look.x + Math.sin(t * 0.3) * 0.08, look.y, look.z);
    if (loadSettings().bob && moving) camera.rotateZ(Math.sin(phase) * 0.006);
    applyView();

    // The front door swings open as the camera nears it from outside, and shuts behind us.
    doorOpen += ((doorWanted ? 1 : 0) - doorOpen) * (1 - Math.exp(-dt * 5));
    facade.door.rotation.y = -doorOpen * 1.5;

    // More sun on the garden, less in the rooms.
    const outTarget = pos.z > FRONT_WALL_Z + 0.5 ? 1 : 0;
    outsideness += (outTarget - outsideness) * (1 - Math.exp(-dt * 3));
    sun.intensity = 0.2 + outsideness * 0.8;

    for (const r of rooms) r.update(t, room === TITLE ? 'hall' : room);
    // The mirror is only redrawn while the camera is upstairs on the left, near the Dressing Room.
    if (pos.y > 3 && pos.x < ROOM_SPACING * 0.5 + 1) mirror.render(renderer, t);
    renderer.render(scene, camera);
  }
  animId = requestAnimationFrame(tick);

  return {
    canvas,
    goTo(next, opts) {
      room = next;
      panel = opts?.panel ?? null;
      finalLook = roomLook(next);
      blendDist = 3.5;
      walkTo(next, Boolean(opts?.instant));
      if (opts?.instant) {
        look.copy(finalLook);
        doorOpen = 0;
      }
    },
    showTitle(opts) {
      room = TITLE;
      panel = null;
      finalLook = titleLook.clone();
      blendDist = 14;
      walkTo(TITLE, Boolean(opts?.instant));
      if (opts?.instant) look.copy(titleLook);
    },
    isOutside: () => pos.z > FRONT_WALL_Z,
    refresh() {
      const best = loadBestPhotos();
      for (const r of rooms as RoomHandle[]) r.refresh?.(best);
    },
    refreshMirror() {
      mirror.refresh();
    },
    setActive(on) {
      active = on;
      canvas.style.visibility = on ? 'visible' : 'hidden';
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(animId);
      mirror.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
