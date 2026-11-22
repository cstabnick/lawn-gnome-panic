import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Economy } from './economy';
import type { BiomeId, Blip, Fx, Hud, Player, Sfx, Vehicle } from './types';

export const STUNTS_STORAGE_KEY = 'gta-stunts-v1';

export interface StuntRamp {
  id: string;
  name: string;
  x: number;
  z: number;
  /** Direction the ramp launches toward (radians; yaw 0 faces +z). */
  yaw: number;
  width: number;
  length: number;
  height: number;
  biome: BiomeId;
}

export const STUNT_RAMPS: readonly StuntRamp[] = [
  { id: 'canal-leap', name: 'Canal Leap', x: -162, z: 196, yaw: -Math.PI / 4, width: 6, length: 12, height: 3.0, biome: 'city' },
  { id: 'park-fountain', name: 'Turfton Park Fountain Vault', x: -42, z: 36, yaw: Math.PI / 2, width: 6, length: 11, height: 2.8, biome: 'city' },
  { id: 'greenhouse-neon', name: 'Greenhouse Neon Jump', x: 86, z: 24, yaw: 0, width: 6, length: 12, height: 3.1, biome: 'city' },
  { id: 'bodega-alley', name: 'Bodega Alley Launch', x: -106, z: 74, yaw: Math.PI, width: 5.5, length: 11, height: 2.7, biome: 'city' },
  { id: 'clay-mart-dock', name: 'Clay-Mart Loading Ramp', x: -168, z: 106, yaw: Math.PI / 2, width: 6.5, length: 12, height: 3.0, biome: 'city' },
  { id: 'fort-sandpit', name: 'Fort Sandpit Wall Vault', x: 326, z: 0, yaw: Math.PI / 2, width: 6.5, length: 13, height: 3.6, biome: 'desert' },
  { id: 'desert-mesa', name: 'Desert Mesa Gap', x: 292, z: 134, yaw: -Math.PI / 3, width: 6.5, length: 13, height: 3.4, biome: 'desert' },
  { id: 'airfield-hangar', name: 'Airfield Hangar Launch', x: 432, z: -136, yaw: Math.PI / 2, width: 7, length: 14, height: 3.5, biome: 'desert' },
  { id: 'mossy-log', name: 'Mossy Wood Log Ramp', x: -310, z: -44, yaw: -Math.PI / 2, width: 6, length: 12, height: 3.1, biome: 'forest' },
  { id: 'compost-heap', name: 'Compost Heap Launch', x: -290, z: 112, yaw: Math.PI / 4, width: 6, length: 12, height: 3.0, biome: 'forest' },
  { id: 'frostbite-ridge', name: 'Frostbite Ice Ridge', x: 58, z: -296, yaw: 0, width: 6.5, length: 13, height: 3.3, biome: 'tundra' },
  { id: 'cloverfield-barn', name: 'Cloverfield Barn Leap', x: 56, z: 312, yaw: Math.PI, width: 6.5, length: 13, height: 3.3, biome: 'farmland' },
];

export interface StuntJumpEvaluation {
  qualifies: boolean;
  bonus: number;
  label: string;
  firstTime: boolean;
}

/**
 * Pure elevation query on a ramp footprint.
 * Returns `null` when `(x, z)` is outside the ramp, or `0..ramp.height` along the slope.
 */
export function rampElevationAt(ramp: StuntRamp, x: number, z: number): number | null {
  const fx = Math.sin(ramp.yaw);
  const fz = Math.cos(ramp.yaw);
  const rx = Math.cos(ramp.yaw);
  const rz = -Math.sin(ramp.yaw);
  const dx = x - ramp.x;
  const dz = z - ramp.z;
  const along = dx * fx + dz * fz;
  const across = dx * rx + dz * rz;
  if (Math.abs(across) > ramp.width / 2) return null;
  if (along < -ramp.length / 2 || along > ramp.length / 2) return null;
  const t = (along + ramp.length / 2) / ramp.length;
  return t * ramp.height;
}

export function evaluateStuntJump(
  airTime: number,
  dist: number,
  yawDelta: number,
  firstTime: boolean,
): StuntJumpEvaluation {
  const qualifies = airTime >= 0.65 && dist >= 12;
  if (!qualifies) {
    return { qualifies: false, bonus: 0, label: '', firstTime };
  }
  const spins = Math.floor(Math.abs(yawDelta) / (Math.PI * 1.7));
  const label = spins >= 1 ? `INSANE ${spins * 360}° STUNT BONUS` : 'INSANE STUNT BONUS';
  const bonus = firstTime ? 150 : 40;
  return { qualifies: true, bonus, label, firstTime };
}

type StuntStorage = Pick<Storage, 'getItem' | 'setItem'>;

function resolveStorage(): StuntStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function loadCompleted(storage: StuntStorage | undefined): Set<string> {
  if (!storage) return new Set();
  try {
    const raw = storage.getItem(STUNTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function saveCompleted(storage: StuntStorage | undefined, completed: Set<string>): void {
  if (!storage) return;
  try {
    storage.setItem(STUNTS_STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    /* ignore storage quota/privacy errors */
  }
}

function buildWedgeGeo(ramp: StuntRamp): THREE.BufferGeometry {
  const hw = ramp.width / 2;
  const hl = ramp.length / 2;
  const h = ramp.height;
  // Local space: +z is launch lip, -z is ground entry
  const positions = new Float32Array([
    // Top slope (2 tris)
    -hw, 0, -hl,   hw, 0, -hl,   hw, h, hl,
    -hw, 0, -hl,   hw, h, hl,   -hw, h, hl,
    // Back vertical face (+z lip)
    -hw, 0, hl,   -hw, h, hl,    hw, h, hl,
    -hw, 0, hl,    hw, h, hl,    hw, 0, hl,
    // Left side (-x)
    -hw, 0, -hl,  -hw, h, hl,   -hw, 0, hl,
    // Right side (+x)
    hw, 0, -hl,    hw, 0, hl,    hw, h, hl,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  geo.rotateY(ramp.yaw);
  geo.translate(ramp.x, 0, ramp.z);
  return geo;
}

function buildRampExtras(
  ramp: StuntRamp,
  chevronGeos: THREE.BufferGeometry[],
  railGeos: THREE.BufferGeometry[],
): void {
  const slopeAngle = Math.atan2(ramp.height, ramp.length);
  const slopeLen = Math.hypot(ramp.length, ramp.height);
  // Chevrons sit 0.04m proud of the slope surface so zero z-fighting
  for (const frac of [0.3, 0.58, 0.82]) {
    const zLocal = -ramp.length / 2 + frac * ramp.length;
    const yLocal = frac * ramp.height + 0.045;
    const c = new THREE.BoxGeometry(ramp.width * 0.58, 0.05, 0.7);
    c.rotateX(-slopeAngle);
    c.translate(0, yLocal, zLocal);
    c.rotateY(ramp.yaw);
    c.translate(ramp.x, 0, ramp.z);
    chevronGeos.push(c);
  }
  // Glowing side guide rails along left and right edges
  for (const s of [-1, 1]) {
    const r = new THREE.BoxGeometry(0.18, 0.28, slopeLen);
    r.rotateX(-slopeAngle);
    r.translate(s * (ramp.width / 2 - 0.14), ramp.height / 2 + 0.14, 0);
    r.rotateY(ramp.yaw);
    r.translate(ramp.x, 0, ramp.z);
    railGeos.push(r);
  }
}

function wrapAngleDelta(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createStunts(
  scene: THREE.Scene,
  hud: Hud,
  economy: Economy,
  fx: Fx,
  play: (sfx: Sfx) => void,
  storage: StuntStorage | undefined = resolveStorage(),
) {
  const completed = loadCompleted(storage);

  // Build merged ramp geometry
  const bodyGeos: THREE.BufferGeometry[] = [];
  const chevronGeos: THREE.BufferGeometry[] = [];
  const railGeos: THREE.BufferGeometry[] = [];
  for (const ramp of STUNT_RAMPS) {
    bodyGeos.push(buildWedgeGeo(ramp));
    buildRampExtras(ramp, chevronGeos, railGeos);
  }

  const addMerged = (geos: THREE.BufferGeometry[], mat: THREE.Material) => {
    const geo = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!geo) return;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  };

  addMerged(bodyGeos, new THREE.MeshStandardMaterial({ color: 0x5c646d, roughness: 0.85 }));
  addMerged(chevronGeos, new THREE.MeshStandardMaterial({ color: 0xffc82c, emissive: 0xffa600, emissiveIntensity: 0.35, roughness: 0.5 }));
  addMerged(railGeos, new THREE.MeshStandardMaterial({ color: 0x38f2ff, emissive: 0x1bd6ff, emissiveIntensity: 0.9, roughness: 0.3 }));

  let activeJump: {
    rampId: string;
    launchX: number;
    launchZ: number;
    airTime: number;
    lastYaw: number;
    yawDelta: number;
  } | null = null;
  let onRampId: string | null = null;

  return {
    update(dt: number, player: Player, _vehicles: Vehicle[]): { airborne: boolean; jumpJustLanded: boolean } {
      let jumpJustLanded = false;
      const v = player.vehicle;
      if (!v || v.spec.flies) {
        activeJump = null;
        onRampId = null;
        return { airborne: false, jumpJustLanded };
      }

      const speed = Math.abs(v.speed);
      let currentRamp: StuntRamp | null = null;
      let currentElev: number | null = null;

      for (const ramp of STUNT_RAMPS) {
        const elev = rampElevationAt(ramp, v.x, v.z);
        if (elev !== null) {
          currentRamp = ramp;
          currentElev = elev;
          break;
        }
      }

      if (currentRamp && currentElev !== null && speed >= 9 && !activeJump) {
        onRampId = currentRamp.id;
        if (v.y < currentElev) v.y = currentElev;
        // Launch cleanly near the lip
        if (currentElev >= currentRamp.height * 0.82) {
          v.vy = Math.min(18, speed * 0.52 + 4.5);
          activeJump = {
            rampId: currentRamp.id,
            launchX: v.x,
            launchZ: v.z,
            airTime: 0,
            lastYaw: v.yaw,
            yawDelta: 0,
          };
          onRampId = null;
        }
      } else if (!currentRamp && onRampId && !activeJump && v.y > 0.3 && speed >= 9) {
        // Exited lip between frames
        v.vy = Math.min(18, speed * 0.52 + 4.5);
        activeJump = {
          rampId: onRampId,
          launchX: v.x,
          launchZ: v.z,
          airTime: 0,
          lastYaw: v.yaw,
          yawDelta: 0,
        };
        onRampId = null;
      } else if (!currentRamp) {
        onRampId = null;
      }

      if (activeJump) {
        v.vy -= 18 * dt;
        v.y += v.vy * dt;
        activeJump.airTime += dt;
        activeJump.yawDelta += wrapAngleDelta(v.yaw - activeJump.lastYaw);
        activeJump.lastYaw = v.yaw;

        if (v.y <= 0) {
          v.y = 0;
          v.vy = 0;
          const dist = Math.hypot(v.x - activeJump.launchX, v.z - activeJump.launchZ);
          const firstTime = !completed.has(activeJump.rampId);
          const evalRes = evaluateStuntJump(activeJump.airTime, dist, activeJump.yawDelta, firstTime);
          if (evalRes.qualifies) {
            if (firstTime) {
              completed.add(activeJump.rampId);
              saveCompleted(storage, completed);
            }
            economy.earn(evalRes.bonus, evalRes.label);
            play('steal');
            fx.confetti(v.x, v.y + 1.2, v.z);
            const sub = `${Math.round(dist)}m • +${evalRes.bonus} Acorns${firstTime ? ' (NEW!)' : ''}`;
            hud.toast(`${evalRes.label}! ${sub}`, 3200);
            (hud as { callout?: (t: string, s?: string) => void }).callout?.(evalRes.label, sub);
            jumpJustLanded = true;
          }
          activeJump = null;
        }
      }

      return { airborne: activeJump !== null, jumpJustLanded };
    },

    completedCount(): number {
      return completed.size;
    },

    totalCount(): number {
      return STUNT_RAMPS.length;
    },

    blips(): Blip[] {
      return STUNT_RAMPS.filter((r) => !completed.has(r.id)).map((r) => ({
        x: r.x,
        z: r.z,
        color: '#38f2ff',
      }));
    },
  };
}
