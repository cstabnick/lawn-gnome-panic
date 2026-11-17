// Background lounge ambience: a @lawn/prefabs bar behind the table and scantily clad gnome waitresses & waiters
// carrying martinis along patrol routes.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { buildPrefab, type Swatch } from '@lawn/prefabs';

// ---------------------------------------------------------------- types & pure patrol logic
export type ServerRole = 'waitress' | 'waiter';

export interface Waypoint {
  x: number;
  z: number;
  /** Seconds to pause at this waypoint (picking up or serving drinks). */
  pauseS?: number;
}

export interface ServerSpec {
  id: string;
  role: ServerRole;
  skin: number;
  hat: number;
  outfit: number;
  accent: number;
  hairColor?: number;
  beard?: number | null;
  liquid: number;
  speed: number;
  route: readonly Waypoint[];
}

export interface PatrolState {
  x: number;
  z: number;
  facing: number;
  vx: number;
  vz: number;
  wpIndex: number;
  pauseLeft: number;
}

export function createPatrolState(route: readonly Waypoint[]): PatrolState {
  const first = route[0] ?? { x: 0, z: -4 };
  const second = route[1] ?? first;
  return {
    x: first.x,
    z: first.z,
    facing: Math.atan2(second.x - first.x, second.z - first.z),
    vx: 0,
    vz: 0,
    wpIndex: route.length > 1 ? 1 : 0,
    pauseLeft: 0,
  };
}

function shortestAngleDiff(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Advance a server's patrol one step. Pure math, unit-tested without Three.js. */
export function stepPatrol(p: PatrolState, route: readonly Waypoint[], speed: number, dt: number): void {
  if (route.length === 0 || dt <= 0) return;
  if (p.pauseLeft > 0) {
    p.pauseLeft = Math.max(0, p.pauseLeft - dt);
    p.vx = 0;
    p.vz = 0;
    return;
  }
  const target = route[p.wpIndex];
  const dx = target.x - p.x;
  const dz = target.z - p.z;
  const dist = Math.hypot(dx, dz);
  const step = speed * dt;
  if (dist <= step || dist < 0.02) {
    p.x = target.x;
    p.z = target.z;
    p.vx = 0;
    p.vz = 0;
    p.pauseLeft = target.pauseS ?? 1.2;
    p.wpIndex = (p.wpIndex + 1) % route.length;
    return;
  }
  const nx = dx / dist;
  const nz = dz / dist;
  p.vx = nx * speed;
  p.vz = nz * speed;
  p.x += nx * step;
  p.z += nz * step;
  const wantYaw = Math.atan2(nx, nz);
  p.facing += shortestAngleDiff(p.facing, wantYaw) * Math.min(1, dt * 8);
}

// ---------------------------------------------------------------- bar prefab layout
interface PropPlacement {
  id: string;
  x: number;
  y?: number;
  z: number;
  yaw?: number;
  scale?: number;
  tint?: Swatch | number;
  trim?: Swatch | number;
}

const BAR_PROPS: readonly PropPlacement[] = [
  // Main bar counter behind the dealer
  { id: 'bar-counter', x: -1.05, z: -3.65, tint: 0x4a1c28, trim: 'wood-light' },
  { id: 'bar-counter', x: 1.05, z: -3.65, tint: 0x4a1c28, trim: 'wood-light' },
  // Bar stools along the front
  { id: 'bar-stool', x: -1.75, z: -2.95, tint: 0x9e1f28, trim: 'brass' },
  { id: 'bar-stool', x: -0.95, z: -2.95, tint: 0x1f6b3a, trim: 'brass' },
  { id: 'bar-stool', x: 0.95, z: -2.95, tint: 0x1f6b3a, trim: 'brass' },
  { id: 'bar-stool', x: 1.75, z: -2.95, tint: 0x9e1f28, trim: 'brass' },
  // Back-bar storage & neon
  { id: 'cupboard', x: -1.45, z: -4.55, trim: 'wood-dark' },
  { id: 'barrel', x: 0.75, z: -4.55 },
  { id: 'barrel', x: 1.5, z: -4.55 },
  { id: 'neon-sign', x: 0, y: 1.75, z: -4.75, tint: 0xff3fb4, trim: 0x3ff0ff },
  // Side cocktail tables
  { id: 'cocktail-table', x: -3.55, z: -2.05, tint: 'wood-dark', trim: 'brass' },
  { id: 'bar-stool', x: -4.1, z: -2.05, tint: 0x9e1f28, trim: 'brass' },
  { id: 'cocktail-table', x: 3.55, z: -2.05, tint: 'wood-dark', trim: 'brass' },
  { id: 'bar-stool', x: 4.1, z: -2.05, tint: 0x9e1f28, trim: 'brass' },
];

export function buildBarArea(scene: THREE.Scene): void {
  for (const p of BAR_PROPS) {
    const obj = buildPrefab(p.id, { tint: p.tint, trim: p.trim, scale: p.scale });
    obj.position.set(p.x, p.y ?? 0, p.z);
    if (p.yaw) obj.rotation.y = p.yaw;
    scene.add(obj);
  }
  // Warm lounge lighting over the bar and side cocktail tables so the bar and waitstaff read clearly.
  for (const [x, y, z, intensity] of [
    [-1.2, 2.0, -3.2, 3.2],
    [1.2, 2.0, -3.2, 3.2],
    [-3.55, 1.8, -2.05, 2.2],
    [3.55, 1.8, -2.05, 2.2],
  ] as const) {
    const light = new THREE.PointLight(0xffb46b, intensity, 9, 1.5);
    light.position.set(x, y, z);
    scene.add(light);
  }
}

// ---------------------------------------------------------------- martini tray & server models
const SERVE_ARM_PITCH = -Math.PI * 0.44;
const SERVE_ARM_ROLL = -0.14;

/** A silver serving tray holding a martini glass with an olive on a toothpick. */
function createMartiniTray(liquidColor: number): THREE.Group {
  const trayGroup = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 0.7, roughness: 0.25 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe6f7ff, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.1,
  });
  const liqMat = new THREE.MeshStandardMaterial({ color: liquidColor, roughness: 0.2, transparent: true, opacity: 0.85 });

  // Tray platter + rim
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.014, 16), metal);
  platter.position.y = 0.008;
  platter.castShadow = true;
  trayGroup.add(platter);

  // Martini glass (centred on tray)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.008, 12), glassMat);
  base.position.y = 0.019;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.085, 8), glassMat);
  stem.position.y = 0.065;
  const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.078, 14, 1, true), glassMat);
  bowl.rotation.x = Math.PI;
  bowl.position.y = 0.142;
  const liquid = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.055, 14), liqMat);
  liquid.rotation.x = Math.PI;
  liquid.position.y = 0.136;

  // Olive + toothpick
  const olive = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.4 }),
  );
  olive.position.set(0.015, 0.165, 0.01);
  const pick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.002, 0.002, 0.065, 6),
    new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 }),
  );
  pick.rotation.z = -0.55;
  pick.position.set(0.025, 0.172, 0.01);

  trayGroup.add(base, stem, bowl, liquid, olive, pick);
  return trayGroup;
}

function createServerGnome(spec: ServerSpec): GnomeModel {
  // Bare skin for shirt & pants so arms, chest/midriff and legs show; outfit pieces are added onto the rig.
  const look: GnomeLook = {
    ...GNORMAN_LOOK,
    hat: spec.hat,
    shirt: spec.skin,
    pants: spec.skin,
    skin: spec.skin,
    boots: spec.outfit,
    beard: spec.beard ?? null,
    hair: spec.hairColor ? { color: spec.hairColor, style: 'pigtails' } : null,
    freckles: spec.role === 'waitress',
    dress: false,
    glasses: false,
  };
  const model = createGnomeModel(look);
  const outfitMat = new THREE.MeshStandardMaterial({ color: spec.outfit, roughness: 0.55 });
  const accentMat = new THREE.MeshStandardMaterial({ color: spec.accent, roughness: 0.45 });

  if (spec.role === 'waitress') {
    // Bandeau bikini top
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.09, 14), outfitMat);
    top.position.y = 0.52;
    top.castShadow = true;
    // Mini skirt / bottoms
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.255, 0.11, 14), outfitMat);
    skirt.position.y = 0.33;
    skirt.castShadow = true;
    // Tiny white cocktail apron
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.025), accentMat);
    apron.position.set(0, 0.33, 0.24);
    model.rig.add(top, skirt, apron);
  } else {
    // Waiter: shirtless chest with crisp collar, bow tie, wrist cuffs & brief shorts
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.155, 0.04, 12), accentMat);
    collar.position.y = 0.65;
    const bowL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.032, 0.02), outfitMat);
    bowL.position.set(0.026, 0.65, 0.155);
    bowL.rotation.z = 0.22;
    const bowR = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.032, 0.02), outfitMat);
    bowR.position.set(-0.026, 0.65, 0.155);
    bowR.rotation.z = -0.22;
    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.242, 0.11, 14), outfitMat);
    shorts.position.y = 0.33;
    shorts.castShadow = true;
    model.rig.add(collar, bowL, bowR, shorts);

    for (const arm of [model.arms.left, model.arms.right]) {
      const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.11), accentMat);
      cuff.position.y = -0.26;
      arm.add(cuff);
    }
  }

  // Serving tray with martini balanced on the right hand
  const tray = createMartiniTray(spec.liquid);
  tray.position.set(0, -0.32, 0.03);
  tray.rotation.set(-SERVE_ARM_PITCH, 0, -SERVE_ARM_ROLL);
  model.arms.right.add(tray);

  return model;
}

// ---------------------------------------------------------------- ambient servers
export const SERVER_SPECS: readonly ServerSpec[] = [
  {
    id: 'waitress-ruby',
    role: 'waitress',
    skin: 0xf1c27d,
    hat: 0xc22040,
    outfit: 0xc22040,
    accent: 0xfafafa,
    hairColor: 0xf0c050,
    liquid: 0x9cf7e8,
    speed: 1.05,
    route: [
      { x: -2.4, z: -2.45, pauseS: 1.6 },
      { x: -0.4, z: -2.45, pauseS: 1.2 },
      { x: 2.4, z: -2.45, pauseS: 1.6 },
      { x: 3.0, z: -2.05, pauseS: 2.2 },
      { x: 2.4, z: -2.45, pauseS: 0.6 },
    ],
  },
  {
    id: 'waiter-chip',
    role: 'waiter',
    skin: 0xe6b070,
    hat: 0x1b1b22,
    outfit: 0x1b1b22,
    accent: 0xfafafa,
    beard: 0x3b2818,
    liquid: 0xc8ff88,
    speed: 1.1,
    route: [
      { x: 2.95, z: -2.3, pauseS: 1.8 },
      { x: 1.4, z: -2.35, pauseS: 1.0 },
      { x: -1.4, z: -2.35, pauseS: 1.0 },
      { x: -3.0, z: -2.05, pauseS: 2.2 },
      { x: -1.6, z: -2.4, pauseS: 0.8 },
    ],
  },
  {
    id: 'waitress-jade',
    role: 'waitress',
    skin: 0xf5caa0,
    hat: 0x1f8a5a,
    outfit: 0x1f8a5a,
    accent: 0xffffff,
    hairColor: 0xb84a28,
    liquid: 0xffb3d9,
    speed: 0.85,
    route: [
      { x: -1.5, z: -4.15, pauseS: 2.0 },
      { x: 0.0, z: -4.15, pauseS: 1.5 },
      { x: 1.5, z: -4.15, pauseS: 2.0 },
    ],
  },
  {
    id: 'waiter-velvet',
    role: 'waiter',
    skin: 0xd99b66,
    hat: 0x9e1f28,
    outfit: 0x9e1f28,
    accent: 0xfafafa,
    beard: 0x1a1a1a,
    liquid: 0x9cf7e8,
    speed: 0.95,
    route: [
      { x: -3.0, z: -1.85, pauseS: 1.8 },
      { x: -2.2, z: -2.6, pauseS: 1.4 },
      { x: 0.0, z: -2.6, pauseS: 1.6 },
      { x: 2.2, z: -2.6, pauseS: 1.4 },
      { x: 3.0, z: -1.85, pauseS: 1.8 },
      { x: 2.2, z: -2.6, pauseS: 0.5 },
      { x: -2.2, z: -2.6, pauseS: 0.5 },
    ],
  },
];

export interface BarAmbience {
  update(dt: number, t: number): void;
}

export function createBarAmbience(scene: THREE.Scene): BarAmbience {
  buildBarArea(scene);

  const servers = SERVER_SPECS.map((spec) => {
    const model = createServerGnome(spec);
    scene.add(model.object);
    const patrol = createPatrolState(spec.route);
    const pose: PlayerState = {
      position: new THREE.Vector3(patrol.x, 0, patrol.z),
      velocity: new THREE.Vector3(),
      facing: patrol.facing,
      grounded: true,
      jumpsUsed: 0,
    };
    return { spec, model, patrol, pose };
  });

  return {
    update(dt: number, _t: number): void {
      for (const s of servers) {
        stepPatrol(s.patrol, s.spec.route, s.spec.speed, dt);
        s.pose.position.set(s.patrol.x, 0, s.patrol.z);
        s.pose.velocity.set(s.patrol.vx, 0, s.patrol.vz);
        s.pose.facing = s.patrol.facing;
        s.model.update(s.pose, dt);
        // Keep the martini serving arm raised & steady while walking.
        s.model.arms.right.rotation.x = SERVE_ARM_PITCH;
        s.model.arms.right.rotation.z = SERVE_ARM_ROLL;
      }
    },
  };
}
