import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { insideBox } from './collide';
import { GNOMECINO, GREENHOUSE_STRIP, HIGHWAYS, ROAD_LINES, WORLD_HALF } from './config';
import { aboveGround, heightAt } from './terrain';
import type { Fx, Player, Sfx, Vehicle, World } from './types';

export type DestructibleKind =
  | 'hydrant'
  | 'mailbox'
  | 'trash-can'
  | 'cone'
  | 'crate'
  | 'hay-bale'
  | 'umbrella';

export interface LaunchVelocity {
  vx: number;
  vy: number;
  vz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
}

export interface Destructibles {
  update(dt: number, player: Player, vehicles: Vehicle[]): void;
  hitTest(x: number, y: number, z: number): boolean;
  activeGeysers(): { x: number; z: number }[];
}

interface PropPlacement {
  kind: DestructibleKind;
  x: number;
  z: number;
  yaw: number;
}

interface DestructibleProp {
  kind: DestructibleKind;
  homeX: number;
  homeZ: number;
  homeYaw: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  radius: number;
  height: number;
  state: 'intact' | 'flying' | 'settled';
  resetTimer: number;
  geyserTimer: number;
  mesh: THREE.Object3D;
}

const CHAOS_WINDOW_S = 4.0;
const RESET_DELAY_S = 45.0;
const RESET_MIN_DIST = 80.0;
const GEYSER_DURATION_S = 5.0;
const GRAVITY = 22.0;
const GROUND_BOUNCE_Y = 0.2;

/** Compute launch velocity and angular spin when a prop at (propX, propZ) is hit from (hitX, hitZ). */
export function computeSmashLaunch(
  propX: number,
  propZ: number,
  hitX: number,
  hitZ: number,
  speed: number,
): LaunchVelocity {
  const dx = propX - hitX;
  const dz = propZ - hitZ;
  const dist = Math.hypot(dx, dz);
  const nx = dist > 1e-4 ? dx / dist : 1;
  const nz = dist > 1e-4 ? dz / dist : 0;

  const clampedSpeed = Math.max(0, speed);
  const horiz = Math.max(4.5, Math.min(28, clampedSpeed * 0.78 + 3.5));
  const vy = Math.max(4.5, Math.min(16, clampedSpeed * 0.45 + 4.0));

  // Slight deterministic cross-axis wobble so props tumble naturally.
  const cross = ((Math.abs(Math.round(propX * 7 + propZ * 13)) % 5) - 2) * 0.35;
  const vx = nx * horiz - nz * cross;
  const vz = nz * horiz + nx * cross;

  const spinScale = 4 + Math.min(10, clampedSpeed * 0.4);
  return {
    vx,
    vy,
    vz,
    spinX: (nz >= 0 ? 1 : -1) * spinScale * 0.9,
    spinY: (cross >= 0 ? 1 : -1) * spinScale * 0.65,
    spinZ: (nx >= 0 ? -1 : 1) * spinScale * 0.85,
  };
}

/** Award +10..+25 Acorns when smashing 3+ props within the chaos streak window. */
export function chaosBonusForStreak(streak: number): number {
  if (streak < 3) return 0;
  return Math.min(25, 10 + (streak - 3) * 5);
}

function propDimensions(kind: DestructibleKind): { radius: number; height: number } {
  switch (kind) {
    case 'hydrant':
      return { radius: 0.42, height: 1.0 };
    case 'mailbox':
      return { radius: 0.42, height: 1.25 };
    case 'trash-can':
      return { radius: 0.48, height: 1.1 };
    case 'cone':
      return { radius: 0.38, height: 0.85 };
    case 'crate':
      return { radius: 0.6, height: 1.1 };
    case 'hay-bale':
      return { radius: 0.72, height: 1.0 };
    case 'umbrella':
      return { radius: 0.55, height: 2.2 };
  }
}

function buildPropMesh(kind: DestructibleKind, index: number): THREE.Object3D {
  if (kind === 'mailbox' && getPrefab('mailbox')) {
    const obj = buildPrefab('mailbox');
    obj.scale.setScalar(1.05);
    return obj;
  }
  if (kind === 'crate' && getPrefab('crate')) {
    const obj = buildPrefab('crate');
    obj.scale.setScalar(1.05);
    return obj;
  }
  if (kind === 'hay-bale' && getPrefab('hay-bale')) {
    const obj = buildPrefab('hay-bale');
    obj.scale.setScalar(1.1);
    return obj;
  }

  const group = new THREE.Group();

  if (kind === 'hydrant') {
    const redMat = new THREE.MeshLambertMaterial({ color: 0xd92b2b });
    const capMat = new THREE.MeshLambertMaterial({ color: 0xd8dce3 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.68, 8), redMat);
    body.position.y = 0.34;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), redMat);
    dome.position.y = 0.68;
    const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.46, 6), capMat);
    nozzleL.rotation.z = Math.PI / 2;
    nozzleL.position.y = 0.52;
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 6), capMat);
    nut.position.y = 0.86;
    group.add(body, dome, nozzleL, nut);
    return group;
  }

  if (kind === 'trash-can') {
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x6f7882 });
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x4b525a });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.82, 10), metalMat);
    body.position.y = 0.41;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 10), rimMat);
    lid.position.y = 0.85;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.06), rimMat);
    handle.position.y = 0.92;
    group.add(body, lid, handle);
    return group;
  }

  if (kind === 'cone') {
    const orangeMat = new THREE.MeshLambertMaterial({ color: 0xf4711f });
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xf6f6f2 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.52), orangeMat);
    base.position.y = 0.05;
    base.userData.zfightOk = true; // Sits directly on sidewalk LAYER.edge
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.72, 8), orangeMat);
    cone.position.y = 0.44;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.145, 0.14, 8), stripeMat);
    stripe.position.y = 0.42;
    group.add(base, cone, stripe);
    return group;
  }

  // 'umbrella' — striped café umbrella
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xded6c4 });
  const stripeA = index % 2 === 0 ? 0xd93636 : 0x2a78c4;
  const canopyMat = new THREE.MeshLambertMaterial({ color: stripeA });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0xf7f3e6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.08, 8), poleMat);
  base.position.y = 0.04;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), poleMat);
  pole.position.y = 1.04;
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.45, 8), canopyMat);
  canopy.position.y = 2.02;
  const trim = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.06, 0.08, 8), trimMat);
  trim.position.y = 1.79;
  group.add(base, pole, canopy, trim);
  return group;
}

function isNearRoadLine(x: number, z: number, margin: number): boolean {
  for (const r of ROAD_LINES) {
    if (Math.abs(x - r) < margin || Math.abs(z - r) < margin) return true;
  }
  return false;
}

/** The 14 smashable kerb hydrants downtown (E25: the fire engine refills at any of them). */
export const HYDRANT_SPOTS: readonly (readonly [number, number])[] = [
  [-5.8, -14], [5.8, -32], [-5.8, 22], [5.8, 44],
  [-65.8, -18], [65.8, 18], [-65.8, 42], [65.8, -42],
  [-14, -5.8], [26, 5.8], [-38, 5.8], [48, -5.8],
  [-98, -65.8], [98, 65.8],
];

function buildPlacements(): PropPlacement[] {
  const list: PropPlacement[] = [];

  // 1. Hydrants (14) — downtown & inner city kerbsides
  for (const [x, z] of HYDRANT_SPOTS) list.push({ kind: 'hydrant', x, z, yaw: 0 });

  // 2. Mailboxes (14) — sidewalks along Turfton streets
  const mailboxCoords: [number, number][] = [
    [-6.6, -42], [6.6, -14], [-6.6, 44], [6.6, 16],
    [-26, -6.6], [34, 6.6], [-48, -6.6], [16, 6.6],
    [-66.6, -34], [66.6, 32], [-126.6, 22], [126.6, -24],
    [-82, 66.6], [84, -66.6],
  ];
  for (let i = 0; i < mailboxCoords.length; i++) {
    const [x, z] = mailboxCoords[i];
    list.push({ kind: 'mailbox', x, z, yaw: (i % 4) * (Math.PI / 2) });
  }

  // 3. Trash cans (14) — alleys, sidewalks, and storefront corners
  const trashCoords: [number, number][] = [
    [-7.2, -16], [7.2, -28], [-7.2, 18], [7.2, 38],
    [-18, -7.2], [28, 7.2], [-42, 7.2], [44, -7.2],
    [-67.2, 14], [67.2, -26], [-86, 82], [82, -22],
    [-142, 138], [140, -140],
  ];
  for (const [x, z] of trashCoords) list.push({ kind: 'trash-can', x, z, yaw: 0 });

  // 4. Traffic cones (14) — near intersections & construction spots
  const coneCoords: [number, number][] = [
    [-8.5, -8.5], [8.5, -8.5], [-8.5, 8.5], [8.5, 8.5],
    [-68.5, -8.5], [68.5, 8.5], [-8.5, 68.5], [8.5, -68.5],
    [128.5, -128.5], [-128.5, 128.5],
    [52.5, 8.5], [52.5, -8.5],
    [-156, 72], [-144, 72],
  ];
  for (const [x, z] of coneCoords) list.push({ kind: 'cone', x, z, yaw: 0 });

  // 5. Wooden crates (12) — Clay-Mart, Bodega, Fort Sandpit
  const crateCoords: [number, number][] = [
    // Clay-Mart (-150, 150, footprint 34)
    [-131, 140], [-131, 154], [-140, 131], [-156, 131],
    // Bodega (-90, 90, footprint 18)
    [-79, 86], [-79, 94], [-86, 79], [-94, 79],
    // Fort Sandpit (340..408, -34..34, gate 374, 34)
    [366, 40], [382, 40], [336, 14], [336, -14],
  ];
  for (let i = 0; i < crateCoords.length; i++) {
    const [x, z] = crateCoords[i];
    list.push({ kind: 'crate', x, z, yaw: i * 0.4 });
  }

  // 6. Hay bales (10) — Cloverfield Farms roadside (south highway)
  const hayCoords: [number, number][] = [
    [9, 232], [-9, 246], [8, 268], [-32, 314], [-48, 326],
    [19, 384], [2, 396], [52, 444], [69, 456], [31, 520],
  ];
  for (let i = 0; i < hayCoords.length; i++) {
    const [x, z] = hayCoords[i];
    list.push({ kind: 'hay-bale', x, z, yaw: i * 0.5 });
  }

  // 7. Café umbrellas (10) — Greenhouse Strip & Turfton Park edges
  const umbrellaCoords: [number, number][] = [
    // Greenhouse Strip (minX: 45, maxX: 105, minZ: -55, maxZ: 55)
    [GNOMECINO.x - 16, GNOMECINO.z + 12],
    [GREENHOUSE_STRIP.minX + 8, 20],
    [GREENHOUSE_STRIP.minX + 8, 36],
    [GREENHOUSE_STRIP.maxX - 8, 22],
    [GREENHOUSE_STRIP.maxX - 8, -22],
    // Turfton Park (-30, 30) edges
    [-14, 18], [-14, 38], [-46, 18], [-46, 38], [-28, 14],
  ];
  for (let i = 0; i < umbrellaCoords.length; i++) {
    const [x, z] = umbrellaCoords[i];
    list.push({ kind: 'umbrella', x, z, yaw: i * 0.7 });
  }

  return list;
}

function isNearHighway(x: number, z: number, margin: number): boolean {
  for (const hw of HIGHWAYS) {
    for (let i = 0; i < hw.points.length - 1; i++) {
      const [ax, az] = hw.points[i];
      const [bx, bz] = hw.points[i + 1];
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (lenSq || 1)));
      if (Math.hypot(x - (ax + t * dx), z - (az + t * dz)) < margin) return true;
    }
  }
  return false;
}

export function createDestructibles(
  scene: THREE.Scene,
  world: World,
  fx: Fx,
  play: (sfx: Sfx) => void,
  onBonus: (amount: number, reason: string) => void,
): Destructibles {
  const props: DestructibleProp[] = [];
  const placements = buildPlacements();

  for (let i = 0; i < placements.length; i++) {
    const p = placements[i];
    if (Math.abs(p.x) > WORLD_HALF - 2 || Math.abs(p.z) > WORLD_HALF - 2) continue;
    // Keep clear of city road lanes and outer highways
    if (Math.abs(p.x) <= 215 && Math.abs(p.z) <= 215 && isNearRoadLine(p.x, p.z, 5.8)) continue;
    if (isNearHighway(p.x, p.z, 6.8)) continue;

    const dims = propDimensions(p.kind);
    const pad = dims.radius + 0.45;
    if (world.boxes.some((b) => p.x + pad > b.minX && p.x - pad < b.maxX && p.z + pad > b.minZ && p.z - pad < b.maxZ)) {
      continue;
    }
    if (props.some((o) => Math.hypot(o.homeX - p.x, o.homeZ - p.z) < dims.radius + o.radius + 0.8)) {
      continue;
    }
    // Avoid streetlamp posts placed at v ± 7.5 every 25u from -212.5 along city roads.
    const nearLamp = Math.abs(p.x) <= 215 && Math.abs(p.z) <= 215 && ROAD_LINES.some((v) => {
      const dx = Math.abs(Math.abs(p.x - v) - 7.5);
      const dz = Math.abs(Math.abs(p.z - v) - 7.5);
      const remZ = Math.abs((((p.z + 212.5) % 25) + 25) % 25);
      const remX = Math.abs((((p.x + 212.5) % 25) + 25) % 25);
      return (dx < 1.8 && Math.min(remZ, 25 - remZ) < 1.8) || (dz < 1.8 && Math.min(remX, 25 - remX) < 1.8);
    });
    if (nearLamp) continue;

    const mesh = buildPropMesh(p.kind, i);
    mesh.position.set(p.x, heightAt(p.x, p.z), p.z);
    mesh.rotation.set(0, p.yaw, 0);
    scene.add(mesh);

    props.push({
      kind: p.kind,
      homeX: p.x,
      homeZ: p.z,
      homeYaw: p.yaw,
      x: p.x,
      y: heightAt(p.x, p.z),
      z: p.z,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      radius: dims.radius,
      height: dims.height,
      state: 'intact',
      resetTimer: 0,
      geyserTimer: 0,
      mesh,
    });
  }

  let streakCount = 0;
  let streakTimer = 0;
  let geyserFxTimer = 0;

  function smashProp(prop: DestructibleProp, hitX: number, hitZ: number, speed: number): void {
    if (prop.state !== 'intact') return;
    const launch = computeSmashLaunch(prop.x, prop.z, hitX, hitZ, speed);
    prop.vx = launch.vx;
    prop.vy = launch.vy;
    prop.vz = launch.vz;
    prop.spinX = launch.spinX;
    prop.spinY = launch.spinY;
    prop.spinZ = launch.spinZ;
    prop.state = 'flying';
    prop.resetTimer = RESET_DELAY_S;

    if (prop.kind === 'hydrant') {
      prop.geyserTimer = GEYSER_DURATION_S;
      play('squirt');
    } else {
      play('bump');
    }

    fx.spark(prop.x, heightAt(prop.x, prop.z) + 0.5, prop.z);

    if (streakTimer > 0) {
      streakCount += 1;
    } else {
      streakCount = 1;
    }
    streakTimer = CHAOS_WINDOW_S;

    const bonus = chaosBonusForStreak(streakCount);
    if (bonus > 0) {
      onBonus(bonus, `Chaos Streak x${streakCount}`);
    }
  }

  function update(dt: number, player: Player, vehicles: Vehicle[]): void {
    if (streakTimer > 0) {
      streakTimer = Math.max(0, streakTimer - dt);
      if (streakTimer === 0) streakCount = 0;
    }

    geyserFxTimer += dt;
    const emitGeyserFx = geyserFxTimer >= 0.08;
    if (emitGeyserFx) geyserFxTimer = 0;

    const waterJet = (fx as { waterJet?: (x: number, y: number, z: number) => void }).waterJet;

    for (const prop of props) {
      // Check vehicle collisions with intact props
      if (prop.state === 'intact') {
        for (const v of vehicles) {
          if (Math.abs(v.speed) < 1.2) continue;
          if (aboveGround(v.x, v.y, v.z) > prop.height + 0.4) continue;
          const reach = v.spec.radius + prop.radius;
          const dx = prop.x - v.x;
          const dz = prop.z - v.z;
          if (dx * dx + dz * dz <= reach * reach) {
            smashProp(prop, v.x, v.z, Math.abs(v.speed));
            break;
          }
        }
      }

      // Flying physics + ground bounce (y >= 0.2)
      if (prop.state === 'flying') {
        prop.vy -= GRAVITY * dt;
        prop.x += prop.vx * dt;
        prop.y += prop.vy * dt;
        prop.z += prop.vz * dt;
        prop.mesh.rotation.x += prop.spinX * dt;
        prop.mesh.rotation.y += prop.spinY * dt;
        prop.mesh.rotation.z += prop.spinZ * dt;

        const floorY = heightAt(prop.x, prop.z) + GROUND_BOUNCE_Y;
        if (prop.y <= floorY) {
          prop.y = floorY;
          if (Math.abs(prop.vy) > 2.2) {
            prop.vy = -prop.vy * 0.42;
            prop.vx *= 0.65;
            prop.vz *= 0.65;
            prop.spinX *= 0.6;
            prop.spinY *= 0.6;
            prop.spinZ *= 0.6;
          } else {
            prop.vy = 0;
            prop.vx = 0;
            prop.vz = 0;
            prop.state = 'settled';
          }
        }
        prop.mesh.position.set(prop.x, prop.y, prop.z);
      }

      // Hydrant geyser effect (5s vertical water jet + slight lift for light vehicles)
      if (prop.geyserTimer > 0) {
        prop.geyserTimer = Math.max(0, prop.geyserTimer - dt);
        if (emitGeyserFx) {
          if (waterJet) {
            waterJet(prop.homeX, heightAt(prop.homeX, prop.homeZ) + 0.3, prop.homeZ);
          } else {
            fx.spark(prop.homeX, heightAt(prop.homeX, prop.homeZ) + 0.9, prop.homeZ);
          }
        }
        for (const v of vehicles) {
          if (v.spec.mass > 2) continue;
          if (aboveGround(v.x, v.y, v.z) > 2.4) continue;
          const dx = v.x - prop.homeX;
          const dz = v.z - prop.homeZ;
          if (dx * dx + dz * dz <= 1.6 * 1.6) {
            v.vy = Math.max(v.vy, 5.5);
            if (aboveGround(v.x, v.y, v.z) < 0.25) v.y = heightAt(v.x, v.z) + 0.25;
          }
        }
      }

      // Reset smashed props after 45s when player is > 80m away
      if (prop.state !== 'intact') {
        if (prop.resetTimer > 0) prop.resetTimer -= dt;
        if (prop.resetTimer <= 0) {
          const distToPlayer = Math.hypot(player.x - prop.homeX, player.z - prop.homeZ);
          if (distToPlayer > RESET_MIN_DIST) {
            prop.x = prop.homeX;
            prop.y = heightAt(prop.homeX, prop.homeZ);
            prop.z = prop.homeZ;
            prop.vx = 0;
            prop.vy = 0;
            prop.vz = 0;
            prop.spinX = 0;
            prop.spinY = 0;
            prop.spinZ = 0;
            prop.state = 'intact';
            prop.geyserTimer = 0;
            prop.mesh.position.set(prop.homeX, heightAt(prop.homeX, prop.homeZ), prop.homeZ);
            prop.mesh.rotation.set(0, prop.homeYaw, 0);
          }
        }
      }
    }
  }

  function hitTest(x: number, y: number, z: number): boolean {
    for (const prop of props) {
      if (prop.state !== 'intact') continue;
      const hgt = aboveGround(x, y, z);
      if (hgt < -0.1 || hgt > prop.height + 0.35) continue;
      const r = prop.radius + 0.35;
      const dx = x - prop.x;
      const dz = z - prop.z;
      if (dx * dx + dz * dz <= r * r) {
        smashProp(prop, x - dx * 2, z - dz * 2, 14);
        return true;
      }
    }
    return false;
  }

  function activeGeysers(): { x: number; z: number }[] {
    const out: { x: number; z: number }[] = [];
    for (const prop of props) {
      if (prop.geyserTimer > 0) {
        out.push({ x: prop.homeX, z: prop.homeZ });
      }
    }
    return out;
  }

  return { update, hitTest, activeGeysers };
}
