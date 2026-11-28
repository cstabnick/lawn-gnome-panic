// Life on the campus (E13 issue A18): students on the quad, a paper plane, the groundsman, the Dean and the bell.
// Everything sleeps while the player is more than FAR_AWAY from the quad. Residents are not solid (no colliders).
import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { JobsDeps } from '../jobs/types';
import { createAmbientGnomes, type AmbientGnomeDef } from '../ambientGnomes';
import { registerCull } from '../cull';
import { gnomeState, makeGnome } from '../gnomes';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import { CAMPUS, type RootwellPart } from './types';

const FAR_AWAY = 300;
const BELL_RANGE = 250;
const BELL_AT = { x: 1194, z: -302 };
const RED = 0x8b1e2b;
const CREAM = 0xefe3c8;

const BASE: GnomeLook = {
  hat: 0xd93636, shirt: RED, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};
const look = (o: Partial<GnomeLook>): GnomeLook => ({ ...BASE, ...o });

interface Wp { x: number; z: number; /** Seconds to stand here. */ pause?: number; /** Dean: tip the hat here. */ bow?: boolean }

/** Walking students: each walks its waypoints out and back (legs stay on the quad ring or cross open lawn). */
export const STUDENT_ROUTES: readonly { id: string; look: GnomeLook; speed: number; route: readonly Wp[] }[] = [
  { id: 'long-shelf-plumbob', look: look({ hat: RED, shirt: CREAM }), speed: 1.3,
    route: [{ x: 1110, z: -277.5, pause: 3 }, { x: 1110, z: -260 }, { x: 1180, z: -260 }, { x: 1180, z: -278.5, pause: 3 }] },
  { id: 'tilth-crucible', look: look({ hat: 0x2f6f4e, shirt: RED, beard: null, glasses: true }), speed: 1.5,
    route: [{ x: 1110, z: -125.5, pause: 3 }, { x: 1110, z: -145 }, { x: 1180, z: -145 }, { x: 1180, z: -122.5, pause: 3 }] },
  { id: 'trencher-club', look: look({ hat: 0xd4af37, shirt: CREAM, beard: 0x8a6a3c }), speed: 1.4,
    route: [{ x: 1231.5, z: -215, pause: 4 }, { x: 1205, z: -215 }, { x: 1205, z: -160 }, { x: 1239.5, z: -160, pause: 2 }] },
  { id: 'bedstraw-shelf', look: look({ hat: 0x3b6ea5, shirt: RED, beard: 0xb8b8b8 }), speed: 1.6,
    route: [{ x: 1030, z: -305.5, pause: 2 }, { x: 1030, z: -270 }, { x: 1085, z: -260 }, { x: 1110, z: -260 }, { x: 1110, z: -277.5, pause: 3 }] },
  { id: 'west-lawn', look: look({ hat: 0x7a4fa0, shirt: CREAM, beard: null, freckles: true }), speed: 1.2,
    route: [{ x: 1110, z: -125.5, pause: 4 }, { x: 1110, z: -145 }, { x: 1085, z: -145 }, { x: 1085, z: -260 }, { x: 1110, z: -260 }, { x: 1110, z: -277.5, pause: 4 }] },
  { id: 'heap-barn', look: look({ hat: 0xe07a2f, shirt: RED, beard: 0x6b4a2e }), speed: 1.4,
    route: [{ x: 1265, z: -94.5, pause: 3 }, { x: 1265, z: -130 }, { x: 1205, z: -130 }, { x: 1205, z: -145 }, { x: 1180, z: -145 }, { x: 1180, z: -122.5, pause: 3 }] },
];

/** The groundsman's stripes: up and down the north half of the quad lawn, well clear of the statue. */
export const MOW_ROUTE: readonly Wp[] = (() => {
  const out: Wp[] = [];
  for (let k = 0; k < 10; k++) {
    const z = -254 + k * 4;
    const [a, b] = k % 2 === 0 ? [1095, 1195] : [1195, 1095];
    out.push({ x: a, z }, { x: b, z });
  }
  return out;
})();

/** The Dean: lodge door, statue (stops 6 m short of it), Tilth Hall door; out and back. */
export const DEAN_ROUTE: readonly Wp[] = [
  { x: 1063.5, z: -245, pause: 4 }, { x: 1085, z: -245 }, { x: 1085, z: -202 },
  { x: 1139, z: -202, pause: 3.5, bow: true }, { x: 1085, z: -202 }, { x: 1085, z: -145 }, { x: 1110, z: -145 },
  { x: 1110, z: -125.5, pause: 5 },
];
const DEAN_LOOK = look({ hat: 0x2a2238, shirt: 0x2a2238, pants: 0x1c1826, beard: 0xb0b0b0, glasses: true });

/** The paper-plane pair on the south lawn. */
const PLANE_A = { x: 1139, z: -152 };
const PLANE_B = { x: 1151, z: -152 };
const THROW_EVERY = 4;

const g = (x: number, z: number): number => heightAt(x, z);

const IDLERS: readonly AmbientGnomeDef[] = [
  { id: 'rw-reader', name: 'Fennel', x: 1093, z: -190, yaw: Math.PI / 2, idle: 'think', look: look({ hat: 0x3b6ea5, shirt: CREAM, glasses: true }),
    bubble: 'I study digging. I have never dug.' },
  { id: 'rw-trencher-a', name: 'Pip', x: 1224, z: -212, yaw: 0, idle: 'cross-arms', look: look({ hat: 0xd93636, shirt: RED, beard: null }),
    bubble: 'Four years, one hat. I am on the hat.' },
  { id: 'rw-trencher-b', name: 'Sorrel', x: 1224, z: -218, yaw: Math.PI, idle: 'hands-on-hips', look: look({ hat: 0x2f6f4e, shirt: CREAM }),
    bubble: 'The ants shut the library again. Rent day.' },
  { id: 'rw-bedstraw', name: 'Tansy', x: 1036, z: -302, yaw: 0, idle: 'look-around', look: look({ hat: 0xe07a2f, shirt: RED, beard: 0x6b4a2e }),
    bubble: 'Plumbob Hall drops things off the roof. For science. Mostly my lunch.' },
  { id: 'rw-lecturer', name: 'Dr Cress', x: 1234, z: -163, yaw: -Math.PI / 2, idle: 'tap-foot', look: look({ hat: 0x5a3d6e, shirt: CREAM, beard: 0xbcbcbc, glasses: true }),
    bubble: 'The Dean says the grant is a gift. Gifts do not usually come with a survey.' },
];

interface Walker {
  model: GnomeModel;
  route: readonly Wp[];
  speed: number;
  i: number;
  dir: 1 | -1;
  x: number;
  z: number;
  yaw: number;
  wait: number;
  bow: number;
  /** Extra object that follows (a mower), placed ahead of the gnome. */
  towed?: THREE.Object3D;
}

/** Positions of the walking residents (for tests). */
let walkersForTest: Walker[] = [];
export function campusWalkerPositions(): { x: number; z: number }[] {
  return walkersForTest.map((w) => ({ x: w.x, z: w.z }));
}

function carry(model: GnomeModel, id: string, scale: number): void {
  if (!getPrefab(id)) return;
  const o = buildPrefab(id, { lights: false });
  o.position.set(0.22, 0.5, 0.3);
  o.scale.setScalar(scale);
  model.object.add(o);
}

function makeWalker(scene: THREE.Scene, lk: GnomeLook, route: readonly Wp[], speed: number, start = 0): Walker {
  const model = makeGnome(scene, lk);
  registerCull(model.object, 'gnome');
  const p = route[start];
  const w: Walker = { model, route, speed, i: start, dir: 1, x: p.x, z: p.z, yaw: 0, wait: p.pause ?? 0, bow: 0 };
  model.update(gnomeState(w.x, g(w.x, w.z), w.z, w.yaw, 0), 0.016);
  return w;
}

function stepWalker(w: Walker, dt: number): void {
  let moving = false;
  if (w.wait > 0) {
    w.wait -= dt;
  } else {
    let next = w.i + w.dir;
    if (next < 0 || next >= w.route.length) { w.dir = w.dir === 1 ? -1 : 1; next = w.i + w.dir; }
    const t = w.route[next];
    const dx = t.x - w.x, dz = t.z - w.z;
    const d = Math.hypot(dx, dz);
    const step = w.speed * dt;
    if (d <= step) {
      w.x = t.x; w.z = t.z; w.i = next; w.wait = t.pause ?? 0;
      w.bow = t.bow ? t.pause ?? 0 : 0;
    } else {
      w.x += (dx / d) * step; w.z += (dz / d) * step;
      w.yaw = Math.atan2(dx, dz);
      moving = true;
    }
  }
  if (w.bow > 0) w.bow -= dt;
  const y = g(w.x, w.z);
  w.model.update(gnomeState(w.x, y, w.z, w.yaw, moving ? w.speed : 0), dt);
  // A small bow to the founder's statue: lean the body forward while the hat is tipped.
  w.model.object.rotation.x = w.bow > 0.4 ? 0.35 : 0;
  if (w.towed) {
    w.towed.position.set(w.x + Math.sin(w.yaw) * 1.1, y, w.z + Math.cos(w.yaw) * 1.1);
    w.towed.rotation.y = w.yaw;
  }
}

/** Students on the quad, the Dean, the bell and the campus sounds. */
export function installCampusLife(deps: JobsDeps): RootwellPart {
  const scene = deps.scene;
  const walkers: Walker[] = [];

  STUDENT_ROUTES.forEach((s, n) => {
    const w = makeWalker(scene, s.look, s.route, s.speed, n % s.route.length);
    carry(w.model, 'red-book', 0.5);
    walkers.push(w);
  });

  const groundsman = makeWalker(scene, look({ hat: 0x6b8e23, shirt: 0x556b2f, beard: 0x8a6a3c }), MOW_ROUTE, 0.8);
  if (getPrefab('reel-mower')) {
    const mower = buildPrefab('reel-mower', { lights: false });
    mower.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    scene.add(mower);
    registerCull(mower, 'prop');
    groundsman.towed = mower;
  }
  walkers.push(groundsman);

  const dean = makeWalker(scene, DEAN_LOOK, DEAN_ROUTE, 1.8);
  carry(dean.model, 'ledger', 0.6);
  walkers.push(dean);
  walkersForTest = walkers;

  // The paper-plane pair: two thrower gnomes and a plane on a parabola.
  const a = makeGnome(scene, look({ hat: 0xd93636, shirt: CREAM, beard: null }));
  const b = makeGnome(scene, look({ hat: 0x3b6ea5, shirt: RED }));
  registerCull(a.object, 'gnome');
  registerCull(b.object, 'gnome');
  const plane = getPrefab('paper-plane') ? buildPrefab('paper-plane', { lights: false }) : null;
  if (plane) { scene.add(plane); registerCull(plane, 'prop'); }
  let throwT = 0;
  const toward = (p: { x: number; z: number }, q: { x: number; z: number }): number => Math.atan2(q.x - p.x, q.z - p.z);
  const poseThrowers = (dt: number): void => {
    a.update(gnomeState(PLANE_A.x, g(PLANE_A.x, PLANE_A.z), PLANE_A.z, toward(PLANE_A, PLANE_B), 0), dt);
    b.update(gnomeState(PLANE_B.x, g(PLANE_B.x, PLANE_B.z), PLANE_B.z, toward(PLANE_B, PLANE_A), 0), dt);
  };
  poseThrowers(0.016);

  const idlers = createAmbientGnomes(scene, IDLERS);

  let bellT = 20 + Math.random() * 40;

  return {
    update(dt: number): void {
      const p = deps.player;
      if (Math.hypot(p.x - CAMPUS.quadCentre.x, p.z - CAMPUS.quadCentre.z) > FAR_AWAY) return;

      for (const w of walkers) stepWalker(w, dt);
      idlers.update(dt, p.x, p.z);

      throwT = (throwT + dt) % (THROW_EVERY * 2);
      poseThrowers(dt);
      if (plane) {
        const leg = (throwT % THROW_EVERY) / THROW_EVERY;
        const from = throwT < THROW_EVERY ? PLANE_A : PLANE_B, to = throwT < THROW_EVERY ? PLANE_B : PLANE_A;
        const x = from.x + (to.x - from.x) * leg;
        const z = from.z + (to.z - from.z) * leg;
        plane.position.set(x, g(x, z) + 1.1 + 2.2 * 4 * leg * (1 - leg), z);
        plane.rotation.y = toward(from, to);
      }

      if (Math.hypot(p.x - BELL_AT.x, p.z - BELL_AT.z) <= BELL_RANGE) {
        bellT -= dt;
        if (bellT <= 0) {
          bellT = 60 + Math.random() * 30;
          playAt('campus-bell', { x: BELL_AT.x, z: BELL_AT.z }, { bus: 'ambience' });
        }
      }
    },
  };
}
