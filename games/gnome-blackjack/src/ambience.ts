// Background lounge ambience: a @lawn/prefabs bar in the background, bar patrons, and scantily clad gnome
// waitresses & waiters who enter from off-screen, mingle briefly carrying martinis, and exit without colliding.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { buildStaticPrefabs, type Swatch } from '@lawn/prefabs';

// ---------------------------------------------------------------- types & pure visit/avoidance logic
export type ServerRole = 'waitress' | 'waiter';
export type VisitPhase = 'offscreen' | 'enter' | 'mingle' | 'exit';

export interface Obstacle {
  x: number;
  z: number;
  r: number;
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
  /** Off-screen spawn/exit wing. */
  wing: { x: number; z: number };
  /** Where they walk to mingle/serve. */
  mingle: { x: number; z: number; faceX: number; faceZ: number; durationS: number };
  /** Seconds off-screen between visits, and initial delay (negative = already partway into first entrance). */
  cooldownS: number;
  initialDelayS: number;
}

export interface ServerAgent {
  phase: VisitPhase;
  x: number;
  z: number;
  facing: number;
  vx: number;
  vz: number;
  timer: number;
  visible: boolean;
}

export const SERVER_RADIUS = 0.36;

export function createServerAgent(spec: ServerSpec): ServerAgent {
  if (spec.initialDelayS < 0) {
    // Start already walking in from the wing so the room feels alive immediately.
    const frac = Math.min(0.85, -spec.initialDelayS);
    const x = spec.wing.x + (spec.mingle.x - spec.wing.x) * frac;
    const z = spec.wing.z + (spec.mingle.z - spec.wing.z) * frac;
    return {
      phase: 'enter',
      x,
      z,
      facing: Math.atan2(spec.mingle.x - spec.wing.x, spec.mingle.z - spec.wing.z),
      vx: 0,
      vz: 0,
      timer: 0,
      visible: true,
    };
  }
  return {
    phase: 'offscreen',
    x: spec.wing.x,
    z: spec.wing.z,
    facing: Math.atan2(spec.mingle.x - spec.wing.x, spec.mingle.z - spec.wing.z),
    vx: 0,
    vz: 0,
    timer: spec.initialDelayS,
    visible: false,
  };
}

function shortestAngleDiff(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function steerAndMove(
  agent: ServerAgent,
  index: number,
  agents: readonly ServerAgent[],
  obstacles: readonly Obstacle[],
  tx: number,
  tz: number,
  speed: number,
  dt: number,
): boolean {
  const dx = tx - agent.x;
  const dz = tz - agent.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= speed * dt || dist < 0.08) {
    agent.x = tx;
    agent.z = tz;
    agent.vx = 0;
    agent.vz = 0;
    return true;
  }

  let dirX = dx / dist;
  let dirZ = dz / dist;

  // Pairwise server separation + gentle right-hand passing bias to prevent head-on deadlocks.
  for (let j = 0; j < agents.length; j++) {
    if (j === index) continue;
    const other = agents[j];
    if (!other.visible) continue;
    const ox = agent.x - other.x;
    const oz = agent.z - other.z;
    const od = Math.hypot(ox, oz);
    const minSep = SERVER_RADIUS * 2 + 0.35;
    if (od < minSep && od > 1e-4) {
      const push = (minSep - od) / minSep;
      const nx = ox / od;
      const nz = oz / od;
      dirX += nx * push * 2.2 - nz * push * 0.7;
      dirZ += nz * push * 2.2 + nx * push * 0.7;
    }
  }

  // Static obstacle avoidance (bar, stools, patrons, cocktail tables, blackjack table).
  for (const obs of obstacles) {
    const ox = agent.x - obs.x;
    const oz = agent.z - obs.z;
    const od = Math.hypot(ox, oz);
    const safe = SERVER_RADIUS + obs.r + 0.15;
    if (od < safe && od > 1e-4) {
      const push = (safe - od) / safe;
      const nx = ox / od;
      const nz = oz / od;
      dirX += nx * push * 2.5 - nz * push * 0.5;
      dirZ += nz * push * 2.5 + nx * push * 0.5;
    }
  }

  const len = Math.hypot(dirX, dirZ) || 1;
  dirX /= len;
  dirZ /= len;

  agent.vx = dirX * speed;
  agent.vz = dirZ * speed;
  agent.x += agent.vx * dt;
  agent.z += agent.vz * dt;

  const wantYaw = Math.atan2(dirX, dirZ);
  agent.facing += shortestAngleDiff(agent.facing, wantYaw) * Math.min(1, dt * 8);
  return false;
}

/** Advance all waitstaff visit cycles and resolve any pairwise overlaps. Pure math, unit-tested without Three.js. */
export function stepServers(
  agents: ServerAgent[],
  specs: readonly ServerSpec[],
  obstacles: readonly Obstacle[],
  dt: number,
): void {
  if (dt <= 0) return;

  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const s = specs[i];

    switch (a.phase) {
      case 'offscreen': {
        a.visible = false;
        a.vx = 0;
        a.vz = 0;
        a.timer -= dt;
        if (a.timer <= 0) {
          a.phase = 'enter';
          a.x = s.wing.x;
          a.z = s.wing.z;
          a.facing = Math.atan2(s.mingle.x - s.wing.x, s.mingle.z - s.wing.z);
          a.visible = true;
        }
        break;
      }
      case 'enter': {
        a.visible = true;
        const arrived = steerAndMove(a, i, agents, obstacles, s.mingle.x, s.mingle.z, s.speed, dt);
        if (arrived) {
          a.phase = 'mingle';
          a.timer = s.mingle.durationS;
        }
        break;
      }
      case 'mingle': {
        a.visible = true;
        a.vx = 0;
        a.vz = 0;
        const faceYaw = Math.atan2(s.mingle.faceX - a.x, s.mingle.faceZ - a.z);
        a.facing += shortestAngleDiff(a.facing, faceYaw) * Math.min(1, dt * 6);
        a.timer -= dt;
        if (a.timer <= 0) {
          a.phase = 'exit';
        }
        break;
      }
      case 'exit': {
        a.visible = true;
        const arrived = steerAndMove(a, i, agents, obstacles, s.wing.x, s.wing.z, s.speed, dt);
        if (arrived) {
          a.phase = 'offscreen';
          a.visible = false;
          a.timer = s.cooldownS;
        }
        break;
      }
    }
  }

  // Hard separation pass so visible servers never overlap even in tight crossings.
  const minPairDist = SERVER_RADIUS * 2;
  for (let i = 0; i < agents.length; i++) {
    if (!agents[i].visible) continue;
    for (let j = i + 1; j < agents.length; j++) {
      if (!agents[j].visible) continue;
      const dx = agents[j].x - agents[i].x;
      const dz = agents[j].z - agents[i].z;
      const d = Math.hypot(dx, dz);
      if (d < minPairDist) {
        const nx = d > 1e-4 ? dx / d : 1;
        const nz = d > 1e-4 ? dz / d : 0;
        const overlap = (minPairDist - d) * 0.5 + 0.001;
        // Don't shove a stationary mingling server off its spot if the other can yield.
        if (agents[i].phase === 'mingle' && agents[j].phase !== 'mingle') {
          agents[j].x += nx * overlap * 2;
          agents[j].z += nz * overlap * 2;
        } else if (agents[j].phase === 'mingle' && agents[i].phase !== 'mingle') {
          agents[i].x -= nx * overlap * 2;
          agents[i].z -= nz * overlap * 2;
        } else {
          agents[i].x -= nx * overlap;
          agents[i].z -= nz * overlap;
          agents[j].x += nx * overlap;
          agents[j].z += nz * overlap;
        }
      }
    }
  }
}

// ---------------------------------------------------------------- bar prefab layout (further in background)
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
  // Main bar counter set back in the lounge behind the dealer
  { id: 'bar-counter', x: -1.05, z: -5.0, tint: 0x4a1c28, trim: 'wood-light' },
  { id: 'bar-counter', x: 1.05, z: -5.0, tint: 0x4a1c28, trim: 'wood-light' },
  // Bar stools along the front of the bar
  { id: 'bar-stool', x: -1.75, z: -4.25, tint: 0x9e1f28, trim: 'brass' },
  { id: 'bar-stool', x: -0.95, z: -4.25, tint: 0x1f6b3a, trim: 'brass' },
  { id: 'bar-stool', x: 0.95, z: -4.25, tint: 0x1f6b3a, trim: 'brass' },
  { id: 'bar-stool', x: 1.75, z: -4.25, tint: 0x9e1f28, trim: 'brass' },
  // Back-bar storage & neon sign
  { id: 'cupboard', x: -1.45, z: -5.95, trim: 'wood-dark' },
  { id: 'barrel', x: 0.75, z: -5.95 },
  { id: 'barrel', x: 1.5, z: -5.95 },
  { id: 'neon-sign', x: 0, y: 1.85, z: -6.15, tint: 0xff3fb4, trim: 0x3ff0ff },
  // Side lounge cocktail tables
  { id: 'cocktail-table', x: -3.9, z: -2.8, tint: 'wood-dark', trim: 'brass' },
  { id: 'bar-stool', x: -4.45, z: -2.8, tint: 0x9e1f28, trim: 'brass' },
  { id: 'cocktail-table', x: 3.9, z: -2.8, tint: 'wood-dark', trim: 'brass' },
  { id: 'bar-stool', x: 4.45, z: -2.8, tint: 0x9e1f28, trim: 'brass' },
];

export const STATIC_OBSTACLES: readonly Obstacle[] = [
  // Blackjack table & dealer keep-out
  { x: 0, z: -0.9, r: 2.75 },
  { x: 0, z: -1.4, r: 0.7 },
  // Bar counters & stools
  { x: -1.05, z: -4.8, r: 0.95 },
  { x: 1.05, z: -4.8, r: 0.95 },
  { x: -1.75, z: -4.25, r: 0.35 },
  { x: -0.95, z: -4.25, r: 0.35 },
  { x: 0.95, z: -4.25, r: 0.35 },
  { x: 1.75, z: -4.25, r: 0.35 },
  // Side cocktail tables & standing patrons
  { x: -3.9, z: -2.8, r: 0.55 },
  { x: 3.9, z: -2.8, r: 0.55 },
  { x: -3.35, z: -2.8, r: 0.35 },
  { x: 3.35, z: -2.8, r: 0.35 },
  // Slot machine bank along right lounge wall
  { x: 4.15, z: -0.35, r: 0.6 },
  { x: 4.15, z: 0.55, r: 0.6 },
  { x: 4.15, z: 1.45, r: 0.6 },
];

export function buildBarArea(scene: THREE.Scene): void {
  scene.add(buildStaticPrefabs(BAR_PROPS, { name: 'bar-props' }));
  for (const [x, y, z, intensity] of [
    [-1.2, 2.2, -4.5, 3.6],
    [1.2, 2.2, -4.5, 3.6],
    [-3.9, 1.9, -2.8, 2.2],
    [3.9, 1.9, -2.8, 2.2],
  ] as const) {
    const light = new THREE.PointLight(0xffb46b, intensity, 10, 1.4);
    light.position.set(x, y, z);
    scene.add(light);
  }
}

// ---------------------------------------------------------------- bar patrons
interface PatronSpec {
  x: number;
  y: number;
  z: number;
  facing: number;
  phaseOffset: number;
  look: GnomeLook;
}

const PATRON_SPECS: readonly PatronSpec[] = [
  // Seated at the bar stools
  {
    x: -1.75, y: 0.38, z: -4.25, facing: Math.PI, phaseOffset: 0.0,
    look: { ...GNORMAN_LOOK, hat: 0x3b6ea5, shirt: 0x6b3a2a, pants: 0x2a2a32, beard: 0x8a5a3a },
  },
  {
    x: 0.95, y: 0.38, z: -4.25, facing: Math.PI, phaseOffset: 2.1,
    look: { ...GNORMAN_LOOK, hat: 0x8a3ab0, shirt: 0x2a6a5a, beard: null, hair: { color: 0x3a2418, style: 'pigtails' }, dress: true },
  },
  // Standing & mingling by the side cocktail tables
  {
    x: -3.35, y: 0, z: -2.8, facing: -Math.PI / 2, phaseOffset: 1.3,
    look: { ...GNORMAN_LOOK, hat: 0xc26a2a, shirt: 0x2e4a3e, beard: 0xd8d8d8, glasses: true },
  },
  {
    x: 3.35, y: 0, z: -2.8, facing: Math.PI / 2, phaseOffset: 3.4,
    look: { ...GNORMAN_LOOK, hat: 0xd94a7a, shirt: 0x4a2a5a, beard: null, hair: { color: 0xe6b850, style: 'pigtails' }, dress: true },
  },
];

// ---------------------------------------------------------------- martini tray & server models
const SERVE_ARM_PITCH = -Math.PI * 0.44;
const SERVE_ARM_ROLL = -0.14;

function createMartiniTray(liquidColor: number): THREE.Group {
  const trayGroup = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 0.7, roughness: 0.25 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe6f7ff, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.1,
  });
  const liqMat = new THREE.MeshStandardMaterial({ color: liquidColor, roughness: 0.2, transparent: true, opacity: 0.85 });

  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.014, 16), metal);
  platter.position.y = 0.008;
  platter.castShadow = true;
  trayGroup.add(platter);

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
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.09, 14), outfitMat);
    top.position.y = 0.52;
    top.castShadow = true;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.255, 0.11, 14), outfitMat);
    skirt.position.y = 0.33;
    skirt.castShadow = true;
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.025), accentMat);
    apron.position.set(0, 0.33, 0.24);
    model.rig.add(top, skirt, apron);
  } else {
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

  const tray = createMartiniTray(spec.liquid);
  tray.position.set(0, -0.32, 0.03);
  tray.rotation.set(-SERVE_ARM_PITCH, 0, -SERVE_ARM_ROLL);
  model.arms.right.add(tray);

  return model;
}

// ---------------------------------------------------------------- ambient servers (enter from wings -> mingle -> exit)
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
    speed: 1.35,
    wing: { x: -7.6, z: -3.2 },
    mingle: { x: -2.4, z: -3.1, faceX: -3.35, faceZ: -2.8, durationS: 1.8 },
    cooldownS: 1.8,
    initialDelayS: -0.55,
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
    speed: 1.4,
    wing: { x: 7.6, z: -3.4 },
    mingle: { x: 2.35, z: -3.2, faceX: 3.35, faceZ: -2.8, durationS: 2.0 },
    cooldownS: 2.0,
    initialDelayS: -0.65,
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
    speed: 1.3,
    wing: { x: -7.6, z: -3.7 },
    mingle: { x: -0.25, z: -3.65, faceX: -0.95, faceZ: -4.25, durationS: 1.9 },
    cooldownS: 2.4,
    initialDelayS: 1.4,
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
    speed: 1.35,
    wing: { x: 7.6, z: -3.8 },
    mingle: { x: 0.45, z: -3.65, faceX: 0.95, faceZ: -4.25, durationS: 1.8 },
    cooldownS: 2.2,
    initialDelayS: 2.8,
  },
];

export interface BarAmbience {
  update(dt: number, t: number): void;
}

export function createBarAmbience(scene: THREE.Scene): BarAmbience {
  buildBarArea(scene);

  const patrons = PATRON_SPECS.map((spec) => {
    const model = createGnomeModel(spec.look);
    scene.add(model.object);
    const pose: PlayerState = {
      position: new THREE.Vector3(spec.x, spec.y, spec.z),
      velocity: new THREE.Vector3(),
      facing: spec.facing,
      grounded: true,
      jumpsUsed: 0,
    };
    return { spec, model, pose };
  });

  const agents = SERVER_SPECS.map(createServerAgent);
  const serverModels = SERVER_SPECS.map((spec) => {
    const model = createServerGnome(spec);
    scene.add(model.object);
    const pose: PlayerState = {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      facing: 0,
      grounded: true,
      jumpsUsed: 0,
    };
    return { model, pose };
  });

  return {
    update(dt: number, t: number): void {
      for (const p of patrons) {
        const sway = 0.08 * Math.sin(t * 1.4 + p.spec.phaseOffset);
        p.pose.facing = p.spec.facing + sway;
        p.model.update(p.pose, dt);
      }

      stepServers(agents, SERVER_SPECS, STATIC_OBSTACLES, dt);
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const sm = serverModels[i];
        sm.model.object.visible = a.visible;
        if (!a.visible) continue;
        sm.pose.position.set(a.x, 0, a.z);
        sm.pose.velocity.set(a.vx, 0, a.vz);
        sm.pose.facing = a.facing;
        sm.model.update(sm.pose, dt);
        // Keep the martini serving arm raised & steady while walking or mingling.
        sm.model.arms.right.rotation.x = SERVE_ARM_PITCH;
        sm.model.arms.right.rotation.z = SERVE_ARM_ROLL;
      }
    },
  };
}
