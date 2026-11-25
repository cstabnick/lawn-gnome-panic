// Pinwheel Ridge, the wind farm (E13 issue A17): ten giant garden pinwheels along the crest (static masts, ten spinning
// rotors), Ragwort Coilspring's control hut and the substation, the HOA's cables, the pinwheels' names, and Ragwort at work.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { registerCull } from '../cull';
import { gnomeState, makeGnome } from '../gnomes';
import { homeOf, registerHome } from '../homes/data';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import type { JobsDeps } from '../jobs/types';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { PINWHEEL_SIZE, ROOTWELL_SOUNDS, WIND_FARM, type RootwellPart } from './types';

const COLOURS = { red: 0xd8342c, yellow: 0xf2c12e, blue: 0x2a6fdb } as const;
const PLATE_BG = 0xf2e8c8;
const HOA_BG = 0xe8e8e8;
const NAMES = ['MARGARET', 'OLD SPIN', 'THE NEW ONE', 'DOROTHY', 'SULKS', 'BIG RED', 'LITTLE RED', 'WHIRLY BOB', 'SPARE', 'NO. 10 (SHY)'];
/** Masts the HOA re-cabled. */
const HOA_MASTS = [1, 4, 7];
const HALF = Math.PI / 2;
const MAST_SCALE = 2;
const ROTOR_SCALE = 2;
const ROTOR_OFFSET_Y = -9; // the rotor's centre is 4.5 x 2 above its own origin
const ROTOR_FORWARD = 1.4;
const SPIN_RANGE = 900;
const WHOOSH_RANGE = 140;
const RAGWORT_RANGE = 250;

const rotors: THREE.Group[] = [];

/** How many rotors the last buildWindFarm made. */
export function rotorCount(): number {
  return rotors.length;
}

/** How far a prefab reaches along its own front (+z), metres at scale s. */
function front(id: string, fallback: number, s = 1): number {
  return getPrefab(id) ? prefabBox(id).max.z * s : fallback;
}
function back(id: string, fallback: number, s = 1): number {
  return getPrefab(id) ? -prefabBox(id).min.z * s : fallback;
}

/** A plate on the face of a piece that looks along its yaw (`d` metres out, `lateral` to its right). */
function plateAt(x: number, z: number, yaw: number, d: number, text: string, y: number, w: number, h: number, bg = PLATE_BG, lateral = 0): THREE.Mesh {
  const sn = Math.sin(yaw), cs = Math.cos(yaw);
  const px = x + sn * d + cs * lateral, pz = z + cs * d - sn * lateral;
  return textPlate(text, px, heightAt(px, pz) + y, pz, yaw, { w, h, bg });
}

/** A thin dark cable lying on the ground from a to b (a long flat box). */
function cableRun(pts: [number, number][], mat: THREE.Material, thick: number): THREE.Group {
  const grp = new THREE.Group();
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const len = Math.hypot(bx - ax, bz - az);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(thick, thick, len + 0.2), mat);
    m.position.set(mx, heightAt(mx, mz) + thick / 2 + 0.05, mz);
    m.rotation.y = Math.atan2(bx - ax, bz - az);
    grp.add(m);
  }
  return grp;
}

/** The pinwheel masts (static) and rotors (one small group each), the control hut, the substation, vignettes. */
export function buildWindFarm(scene: THREE.Scene, boxes: Box[]): void {
  rotors.length = 0;
  const life = new THREE.Group();
  life.name = 'pinwheel-ridge';
  const g = (x: number, z: number): number => heightAt(x, z);
  const pieces: HomePiece[] = [];
  const add = (p: HomePiece): HomePiece => { pieces.push(p); return p; };

  const mastFront = front('giant-pinwheel-mast', 1.5, MAST_SCALE);
  const mastBack = back('giant-pinwheel-mast', 1.5, MAST_SCALE);

  // The masts: solid is the plinth (a 3 x 3 box), whatever the prefab's own bounds.
  for (const p of WIND_FARM.pinwheels) {
    add({ prefab: 'giant-pinwheel-mast', x: p.x, z: p.z, yaw: p.yaw, scale: MAST_SCALE, solid: false });
    boxes.push({ minX: p.x - 1.5, maxX: p.x + 1.5, minZ: p.z - 1.5, maxZ: p.z + 1.5, h: g(p.x, p.z) + PINWHEEL_SIZE.hub });
  }

  // The hut and the substation (the track meets the hut's door side, north).
  const hut = WIND_FARM.hut, sub = WIND_FARM.substation;
  add({ prefab: 'pinwheel-control-hut', x: hut.x, z: hut.z, yaw: hut.yaw });
  add({ prefab: 'pinwheel-substation', x: sub.x, z: sub.z, yaw: sub.yaw });
  const hutFront = front('pinwheel-control-hut', 2.5);
  const subFront = front('pinwheel-substation', 2.5);
  const hutSn = Math.sin(hut.yaw), hutCs = Math.cos(hut.yaw);

  // Cable drums by the substation and the cable run north downhill toward Turfton (not solid: it lies on the ground).
  add({ prefab: 'cable-drum', x: sub.x + 6, z: sub.z - subFront - 1, yaw: 0.5, solid: false });
  add({ prefab: 'cable-drum', x: sub.x + 8.2, z: sub.z - subFront - 0.2, yaw: 1.8, solid: false });
  const cableMat = new THREE.MeshLambertMaterial({ color: 0x1b1b1f });
  const cx = sub.x - 4;
  life.add(cableRun([[cx, sub.z - 2], [cx, -1250], [cx - 6, -1275], [cx - 4, -1300], [cx - 12, -1320]], cableMat, 0.14));

  // Vignette 1: the HOA's cables at three masts (north side of the plinth: fat black cable, padlocked box, plate,
  // the old thin cable cut and coiled).
  for (const i of HOA_MASTS) {
    const p = WIND_FARM.pinwheels[i];
    const bz = p.z - mastBack - 0.3;
    add({ prefab: 'glaze-extra-toolbox', x: p.x - 0.9, z: bz, yaw: Math.PI, scale: 0.7, solid: false });
    add({ prefab: 'rope-coil', x: p.x + 2.2, z: bz - 0.8, yaw: i, scale: 0.5, solid: false });
    const stake = add({ prefab: 'signpost', x: p.x + 0.9, z: bz - 1.8, yaw: Math.PI, solid: false });
    life.add(cableRun([[p.x - 0.4, bz + 0.2], [p.x - 0.4, bz - 5], [p.x - 2, bz - 9]], cableMat, 0.3));
    life.add(plateAt(stake.x, stake.z, Math.PI, front('signpost', 0.5) + 0.05, 'PROPERTY OF THE HOA\nDO NOT UNPLUG\n(WE WILL KNOW)', 1.9, 1.4, 0.7, HOA_BG));
  }

  // Vignette 2: Ragwort's names, a hand-painted plate on every plinth.
  WIND_FARM.pinwheels.forEach((p, i) => {
    life.add(plateAt(p.x, p.z, p.yaw, mastFront + 0.05, NAMES[i], 0.9, 1.0, 0.3));
  });

  // Vignette 3: a picnic of one beside the hut: bench, thermos (a mug), earmuffs, a spare pinwheel in a flowerpot.
  const px = hut.x + 10, pz = hut.z + 1.5;
  const benchTop = getPrefab('bench') ? prefabBox('bench').max.y : 0.5;
  add({ prefab: 'bench', x: px, z: pz, yaw: Math.PI });
  add({ prefab: 'cocoa-mug', x: px - 0.5, z: pz, yaw: 0.3, y: benchTop, solid: false });
  add({ prefab: 'ammu-range-earmuffs', x: px + 0.5, z: pz, yaw: 0.2, y: benchTop, solid: false });
  add({ prefab: 'flower-pot', x: px + 2, z: pz, yaw: 0, solid: false });
  add({ prefab: 'pinwheel-hat', x: px + 2, z: pz, yaw: 0.4, scale: 0.25, y: getPrefab('flower-pot') ? prefabBox('flower-pot').max.y : 0.3, solid: false });

  // Vignette 4: a hard hat blown onto the substation's fence, and a warning plate.
  const fz = sub.z - subFront - 5;
  const fenceX = sub.x + 12;
  add({ prefab: 'chain-link-fence', x: fenceX, z: fz, yaw: HALF, solid: false });
  add({ prefab: 'chain-link-fence', x: fenceX, z: fz + 4, yaw: HALF, solid: false });
  add({ prefab: 'foreman-hard-hat', x: fenceX, z: fz + 2, yaw: 0.8, y: 1.2, scale: 1.2, solid: false });
  const warn = add({ prefab: 'signpost', x: fenceX - 2.5, z: fz - 0.5, yaw: HALF, solid: false });
  life.add(plateAt(warn.x, warn.z, HALF, front('signpost', 0.5) + 0.05, 'HIGH WIND\nHOLD ON TO EVERYTHING\nINCLUDING OPINIONS', 1.9, 1.6, 0.7));

  // Signs: the track bottom and the hut.
  const ts = WIND_FARM.trackStart;
  const bottom = add({ prefab: 'signpost', x: ts.x + 5, z: ts.z + 3, yaw: 0, solid: false });
  life.add(plateAt(bottom.x, bottom.z, 0, front('signpost', 0.5) + 0.05, "PINWHEEL RIDGE\nTURFTON'S LIGHTS\nARE UP HERE", 1.9, 1.5, 0.8));
  life.add(plateAt(hut.x, hut.z, hut.yaw, hutFront + 0.05, 'CONTROL HUT\nKNOCK. LOUDLY. (WIND)', 2.2, 1.4, 0.6, PLATE_BG, -1.2));

  boxes.push(...buildPieces(scene, pieces, 'pinwheel-ridge'));

  // Rotors: one group each, yaw then spin (Euler order XYZ spins about the rotor's own axis first).
  WIND_FARM.pinwheels.forEach((p, i) => {
    const sn = Math.sin(p.yaw), cs = Math.cos(p.yaw);
    const grp = new THREE.Group();
    grp.name = 'pinwheel-rotor';
    grp.position.set(p.x + sn * ROTOR_FORWARD, g(p.x, p.z) + PINWHEEL_SIZE.hub, p.z + cs * ROTOR_FORWARD);
    grp.rotation.y = p.yaw;
    grp.userData.phase = i * 0.7;
    if (getPrefab('giant-pinwheel-rotor')) {
      const rotor = buildPrefab('giant-pinwheel-rotor', { lights: false, tint: COLOURS[p.colour], trim: 0xffffff });
      rotor.scale.setScalar(ROTOR_SCALE);
      rotor.position.set(0, ROTOR_OFFSET_Y, 0);
      grp.add(rotor);
    }
    life.add(grp);
    registerCull(grp, 'landmark');
    rotors.push(grp);
  });

  // Ragwort's door, 1.5 m in front of the hut.
  const home = homeOf('ragwort');
  if (home) registerHome({ ...home, door: [hut.x + hutSn * (hutFront + 1.5), hut.z + hutCs * (hutFront + 1.5), hut.yaw] });

  scene.add(life);
}

/** Turns the rotors, Ragwort Coilspring, the whoosh. */
export function installWindFarm(deps: JobsDeps): RootwellPart {
  const hut = WIND_FARM.hut;
  const door = homeOf('ragwort')?.door;
  const start: [number, number] = door ? [door[0], door[1]] : [hut.x, hut.z - 4];
  const mast = WIND_FARM.pinwheels[4];
  // Door, round the hut's west side, up the slope to a spot below mast 5's vanes.
  const route: [number, number][] = [start, [start[0] - 14, start[1] + 3], [mast.x + 3, mast.z - 18], [mast.x, mast.z + 7]];
  const lens = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const SPEED = 0.8, LOOK = 5, REST = 3;
  const cycle = (2 * total) / SPEED + LOOK + REST;

  const ragwort = makeGnome(deps.scene, {
    hat: 0xc0c4c8, shirt: 0x7a7f86, pants: 0x7a7f86, skin: 0xe0ac69, boots: 0x222222, beard: null, hair: null,
    freckles: false, dress: false, glasses: true, bowlCut: null,
    ...(getPrefab('pinwheel-hat') ? { equipment: { head: 'pinwheel-hat' } } : {}),
  });
  ragwort.object.name = 'ragwort';
  registerCull(ragwort.object, 'gnome');

  /** Position along the route at distance s. */
  const at = (s: number): { x: number; z: number; yaw: number } => {
    let rest = Math.max(0, Math.min(total, s));
    for (let i = 0; i < lens.length; i++) {
      if (rest <= lens[i] || i === lens.length - 1) {
        const f = lens[i] > 0 ? Math.min(1, rest / lens[i]) : 0;
        const a = route[i], b = route[i + 1];
        return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) };
      }
      rest -= lens[i];
    }
    return { x: start[0], z: start[1], yaw: 0 };
  };

  let whooshIn = 2;
  return {
    update(dt, t) {
      const px = deps.player.x, pz = deps.player.z;
      let nearest = Infinity;
      for (let i = 0; i < WIND_FARM.pinwheels.length; i++) {
        const p = WIND_FARM.pinwheels[i];
        nearest = Math.min(nearest, Math.hypot(px - p.x, pz - p.z));
      }
      if (nearest < SPIN_RANGE) {
        for (const r of rotors) r.rotation.z = t * PINWHEEL_SIZE.spin + (r.userData.phase as number);
      }
      whooshIn -= dt;
      if (whooshIn <= 0) {
        whooshIn = 3 + Math.random() * 2;
        if (nearest < WHOOSH_RANGE) {
          const p = WIND_FARM.pinwheels.reduce((a, b) => (Math.hypot(px - b.x, pz - b.z) < Math.hypot(px - a.x, pz - a.z) ? b : a));
          playAt(ROOTWELL_SOUNDS.turbine, { x: p.x, z: p.z }, { bus: 'ambience' });
        }
      }

      if (Math.hypot(px - hut.x, pz - hut.z) > RAGWORT_RANGE) return;
      // Out to the mast, a look up at the vanes, back to the hut, a rest.
      const m = t % cycle;
      const walk = total / SPEED;
      let s = 0, yaw = 0, speed = SPEED, look = false;
      if (m < walk) { s = m * SPEED; }
      else if (m < walk + LOOK) { s = total; look = true; speed = 0; }
      else if (m < 2 * walk + LOOK) { s = total - (m - walk - LOOK) * SPEED; }
      else { s = 0; speed = 0; }
      const here = at(s);
      yaw = look ? 0 : speed === 0 ? Math.PI : here.yaw + (m > walk + LOOK && m < 2 * walk + LOOK ? Math.PI : 0);
      const y = heightAt(here.x, here.z);
      ragwort.object.position.set(here.x, y, here.z);
      ragwort.object.rotation.y = yaw;
      ragwort.update(gnomeState(here.x, y, here.z, yaw, speed), dt);
      if (look) ragwort.arms.right.rotation.x = -2.5 + Math.sin(t * 2) * 0.1;
    },
  };
}
