// Draws the course's background vehicles that cross the road (runaway mowers, THE COMBINE, golf carts) where
// hazardsAt(track, raceT) says they are. The view only: positions come from the pure hazards.ts function.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import type { HazardDef } from '../courses';
import { hazardsAt } from '../hazards';
import type { Track } from '../track';
import { createMower } from './mower';

export interface HazardView {
  update(raceT: number, dt: number): void;
}

/** One built vehicle, origin on the ground, faces +z. */
interface Built {
  root: THREE.Group;
  /** Height of the warning beacon above the ground, m. */
  top: number;
  /** Turn the wheels, flail the arms, turn the reel. */
  animate(dt: number): void;
}

const RUNAWAY_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0xf2c230, beard: 0xf4f4f4 };
const DRIVER_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x2f9e4a, shirt: 0xd8342c };
const GOLFER_A: GnomeLook = { ...GNORMAN_LOOK, shirt: 0xffb3c6 };
const GOLFER_B: GnomeLook = { ...GNORMAN_LOOK, shirt: 0xbfe6ff };

const BEACON_ON = 0xff8a1a;
const BEACON_OFF = 0x3a2412;

function still(): PlayerState {
  return { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 };
}

/** A gnome standing or sitting at `at` in its parent's space. Animate it with gnome.update(pose, dt). */
function rider(parent: THREE.Object3D, look: GnomeLook, at: THREE.Vector3): { gnome: GnomeModel; pose: PlayerState } {
  const holder = new THREE.Group();
  holder.position.copy(at);
  const gnome = createGnomeModel(look);
  holder.add(gnome.object);
  parent.add(holder);
  return { gnome, pose: still() };
}

/** A named pivot of a prefab. Throws if the prefab lacks it. */
function pivot(root: THREE.Object3D, name: string): THREE.Object3D {
  const p = root.getObjectByName(name);
  if (!p) throw new Error(`hazard prefab has no pivot '${name}'`);
  return p;
}

function buildMower(speed: number): Built {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(1.15);
  root.add(body);
  const mower = createMower('cart', 0xd8342c);
  body.add(mower.object);
  const driver = rider(mower.object, RUNAWAY_LOOK, mower.seat);
  let t = 0;
  return {
    root,
    top: 2.4,
    animate(dt) {
      t += dt;
      mower.update(speed, 0, dt);
      driver.gnome.update(driver.pose, dt);
      // A runaway driver: both arms flail between -2.6 and -0.6 rad, out of step.
      const s = Math.sin(t * 9);
      driver.gnome.arms.left.rotation.x = -1.6 + s;
      driver.gnome.arms.right.rotation.x = -1.6 - s;
    },
  };
}

function buildCombine(speed: number): Built {
  // The combine-harvester prefab at 2x (its own size is half). The gnome is added to the unscaled root, so it stays
  // gnome-sized, and sits in the cab at the prefab's cab floor (y = 1.2 m in prefab units, doubled).
  const root = new THREE.Group();
  root.add(buildPrefab('combine-harvester', { scale: 2 }));
  const reel = pivot(root, 'reel');
  // Wheel radii in world units: the two big wheels 0.45 x 2, the two small 0.275 x 2.
  const wheels = [
    { w: pivot(root, 'wheel-0'), r: 0.9 },
    { w: pivot(root, 'wheel-1'), r: 0.9 },
    { w: pivot(root, 'wheel-2'), r: 0.55 },
    { w: pivot(root, 'wheel-3'), r: 0.55 },
  ];
  const driver = rider(root, DRIVER_LOOK, new THREE.Vector3(0, 2.4, 0.3));
  return {
    root,
    top: 4.2,
    animate(dt) {
      reel.rotation.x += dt * 6;
      for (const { w, r } of wheels) w.rotation.x += (speed / r) * dt;
      driver.gnome.update(driver.pose, dt);
      driver.gnome.arms.left.rotation.x = -1.2;
      driver.gnome.arms.right.rotation.x = -1.2;
    },
  };
}

function buildGolfCart(speed: number): Built {
  const root = buildPrefab('golf-cart', { tint: 0xf4f4f0 });
  // Rear wheels radius 0.3, front 0.2 (the prefab's own sizes).
  const wheels = [
    { w: pivot(root, 'wheel-0'), r: 0.3 },
    { w: pivot(root, 'wheel-1'), r: 0.3 },
    { w: pivot(root, 'wheel-2'), r: 0.2 },
    { w: pivot(root, 'wheel-3'), r: 0.2 },
  ];
  const golfers = [
    rider(root, GOLFER_A, new THREE.Vector3(-0.35, 0.78, -0.2)),
    rider(root, GOLFER_B, new THREE.Vector3(0.35, 0.78, -0.2)),
  ];

  return {
    root,
    top: 2.7,
    animate(dt) {
      for (const { w, r } of wheels) w.rotation.x += (speed / r) * dt;
      for (const g of golfers) g.gnome.update(g.pose, dt);
    },
  };
}

function build(hz: HazardDef): Built {
  if (hz.kind === 'mower') return buildMower(hz.speed);
  if (hz.kind === 'combine') return buildCombine(hz.speed);
  return buildGolfCart(hz.speed);
}

export function createHazardView(scene: THREE.Scene, track: Track): HazardView {
  const beaconGeo = new THREE.SphereGeometry(0.22, 12, 8);
  // One model per HazardDef, in the same order as hazardsAt.
  const models = track.course.hazards.map((hz) => {
    const built = build(hz);
    const beaconMat = new THREE.MeshBasicMaterial({ color: BEACON_OFF });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = built.top;
    built.root.add(beacon);
    scene.add(built.root);
    return { built, beaconMat };
  });

  return {
    update(raceT, dt) {
      const poses = hazardsAt(track, raceT);
      models.forEach((m, i) => {
        const p = poses[i];
        m.built.root.position.set(p.x, 0, p.z);
        // Turn round at the ends of the run instead of flipping in one frame (about 0.3 s for a U-turn).
        const r = m.built.root;
        r.rotation.y += Math.atan2(Math.sin(p.h - r.rotation.y), Math.cos(p.h - r.rotation.y)) * (1 - Math.exp(-dt * 10));
        m.built.animate(dt);
        // Warning beacon: 3 flashes a second while the vehicle is on or near the road, dark otherwise.
        const warn = Math.abs(p.across) < 0.6 && (raceT * 3) % 1 < 0.5;
        m.beaconMat.color.setHex(warn ? BEACON_ON : BEACON_OFF);
      });
    },
  };
}
