// Draws the course's background vehicles that cross the road (runaway mowers, THE COMBINE, golf carts) where
// hazardsAt(track, raceT) says they are. The view only: positions come from the pure hazards.ts function.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import type { HazardDef } from '../courses';
import { hazardsAt } from '../hazards';
import type { Track } from '../track';
import { createMower } from './mower';
import { canvasTexture } from './courses/util';

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
const TYRE = 0x222222;
const METAL = 0x8a8f96;

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

function part(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** A wheel whose axle runs along x; rotation.x spins it. */
function wheel(radius: number, width: number, x: number, y: number, z: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, width, 16);
  geo.rotateZ(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
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

function buildCombine(speed: number, stripes: THREE.Texture): Built {
  const root = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: 0x2f8f3a, roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: TYRE, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: METAL, metalness: 0.4, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.45, roughness: 0.2 });
  const header = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.7 });

  root.add(part(3.2, 2.2, 4.0, green, 0, 1.5, 0));
  root.add(part(2.4, 1.2, 2.0, glass, 0, 3.2, -0.4));
  root.add(part(2.6, 0.12, 2.2, dark, 0, 3.85, -0.4));
  const driver = rider(root, DRIVER_LOOK, new THREE.Vector3(0, 2.6, -0.2));

  // Wide header (4.8 m) with a reel of six bats turning about its own axis (x).
  root.add(part(4.8, 0.5, 0.8, header, 0, 0.95, 2.6));
  const reel = new THREE.Group();
  reel.position.set(0, 1.45, 2.95);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const bat = part(4.6, 0.08, 0.16, metal, 0, 0.3 * Math.cos(a), 0.3 * Math.sin(a));
    bat.rotation.x = a;
    reel.add(bat);
  }
  root.add(reel);

  // Grain pipe on the right side.
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), metal);
  pipe.position.set(1.4, 3.0, 0.6);
  pipe.rotation.z = -0.5;
  pipe.castShadow = true;
  root.add(pipe);

  const wheels = [
    { mesh: wheel(0.9, 0.6, -1.7, 0.9, -1.2, dark), r: 0.9 },
    { mesh: wheel(0.9, 0.6, 1.7, 0.9, -1.2, dark), r: 0.9 },
    { mesh: wheel(0.5, 0.5, -1.5, 0.5, 1.5, dark), r: 0.5 },
    { mesh: wheel(0.5, 0.5, 1.5, 0.5, 1.5, dark), r: 0.5 },
  ];
  for (const w of wheels) root.add(w.mesh);

  return {
    root,
    top: 4.2,
    animate(dt) {
      reel.rotation.x += dt * 6;
      for (const w of wheels) w.mesh.rotation.x += (speed / w.r) * dt;
      driver.gnome.update(driver.pose, dt);
      driver.gnome.arms.left.rotation.x = -1.2;
      driver.gnome.arms.right.rotation.x = -1.2;
    },
  };
}

function buildGolfCart(speed: number): Built {
  const root = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x6b8f3a, roughness: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: METAL, metalness: 0.4, roughness: 0.5 });
  const bagMat = new THREE.MeshStandardMaterial({ color: 0x1f3b73, roughness: 0.7 });
  const tyre = new THREE.MeshStandardMaterial({ color: TYRE, roughness: 0.9 });

  root.add(part(1.4, 0.35, 2.4, white, 0, 0.45, 0));
  root.add(part(0.5, 0.15, 0.6, seatMat, -0.35, 0.7, -0.2));
  root.add(part(0.5, 0.15, 0.6, seatMat, 0.35, 0.7, -0.2));
  root.add(part(1.7, 0.08, 2.3, white, 0, 2.3, 0));
  for (const x of [-0.75, 0.75]) {
    for (const z of [-0.95, 0.95]) root.add(part(0.06, 1.8, 0.06, metal, x, 1.4, z));
  }
  root.add(part(0.35, 0.8, 0.3, bagMat, 0, 0.95, -1.4));

  const wheels = [
    wheel(0.22, 0.12, -0.75, 0.22, -0.85, tyre),
    wheel(0.22, 0.12, 0.75, 0.22, -0.85, tyre),
    wheel(0.22, 0.12, -0.75, 0.22, 0.85, tyre),
    wheel(0.22, 0.12, 0.75, 0.22, 0.85, tyre),
  ];
  for (const w of wheels) root.add(w);

  const golfers = [
    rider(root, GOLFER_A, new THREE.Vector3(-0.35, 0.78, -0.2)),
    rider(root, GOLFER_B, new THREE.Vector3(0.35, 0.78, -0.2)),
  ];

  return {
    root,
    top: 2.7,
    animate(dt) {
      for (const w of wheels) w.rotation.x += (speed / 0.22) * dt;
      for (const g of golfers) g.gnome.update(g.pose, dt);
    },
  };
}

function build(hz: HazardDef, stripes: THREE.Texture): Built {
  if (hz.kind === 'mower') return buildMower(hz.speed);
  if (hz.kind === 'combine') return buildCombine(hz.speed, stripes);
  return buildGolfCart(hz.speed);
}

export function createHazardView(scene: THREE.Scene, track: Track): HazardView {
  // Yellow and black hazard stripes for THE COMBINE's header, made once per view.
  const stripes = canvasTexture(64, 64, (g) => {
    g.fillStyle = '#f2c230';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#222222';
    for (let x = -64; x < 128; x += 32) {
      g.beginPath();
      g.moveTo(x, 64);
      g.lineTo(x + 32, 0);
      g.lineTo(x + 48, 0);
      g.lineTo(x + 16, 64);
      g.closePath();
      g.fill();
    }
  });
  stripes.wrapS = THREE.RepeatWrapping;
  stripes.wrapT = THREE.RepeatWrapping;
  stripes.repeat.set(3, 1);

  const beaconGeo = new THREE.SphereGeometry(0.22, 12, 8);
  // One model per HazardDef, in the same order as hazardsAt.
  const models = track.course.hazards.map((hz) => {
    const built = build(hz, stripes);
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
