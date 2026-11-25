// Surface classification and driving-feel multipliers for Gnome Theft Auto.
import { AIRFIELD, CITY_HALF, HIGHWAYS, ROAD_LINES, ROAD_WIDTH, biomeAt } from './config';
import { paintedSurfaceAt } from './terrainPaint';
import type { VehicleKind, World } from './types';
import { bridgeDeckAt, waterDepthAt } from './water';
import { fordWaterAt, trackSurfaceAt } from './raceTrack/tracks';

export type SurfaceKind = 'asphalt' | 'ice' | 'snow' | 'sand' | 'mud' | 'grass' | 'farm' | 'rock' | 'dirt' | 'gravel' | 'water';

export interface SurfaceSpec {
  kind: SurfaceKind;
  speedMult: number;
  accelMult: number;
  turnMult: number;
  lateralGrip: number;
  bumpAmp: number;
  trailKind: 'smoke' | 'sand' | 'snow' | 'grass' | 'none';
}

const ROAD_HALF = ROAD_WIDTH / 2 + 0.5;
const BIRDBATH_X = 0;
const BIRDBATH_Z = -350;
const BIRDBATH_RADIUS = 13;

const HEAVY_ALL_TERRAIN = new Set<VehicleKind>(['combine', 'mulch-spreader', 'zero-turn']);

const SURFACES: Record<SurfaceKind, SurfaceSpec> = {
  asphalt: { kind: 'asphalt', speedMult: 1, accelMult: 1, turnMult: 1, lateralGrip: 1.0, bumpAmp: 0, trailKind: 'none' },
  ice: { kind: 'ice', speedMult: 0.96, accelMult: 0.72, turnMult: 0.85, lateralGrip: 0.25, bumpAmp: 0, trailKind: 'snow' },
  snow: { kind: 'snow', speedMult: 0.90, accelMult: 0.82, turnMult: 0.88, lateralGrip: 0.48, bumpAmp: 0.02, trailKind: 'snow' },
  sand: { kind: 'sand', speedMult: 0.90, accelMult: 0.85, turnMult: 0.90, lateralGrip: 0.70, bumpAmp: 0.03, trailKind: 'sand' },
  mud: { kind: 'mud', speedMult: 0.86, accelMult: 0.80, turnMult: 0.86, lateralGrip: 0.65, bumpAmp: 0.05, trailKind: 'grass' },
  farm: { kind: 'farm', speedMult: 0.92, accelMult: 0.88, turnMult: 0.92, lateralGrip: 0.78, bumpAmp: 0.04, trailKind: 'grass' },
  grass: { kind: 'grass', speedMult: 0.95, accelMult: 0.92, turnMult: 0.96, lateralGrip: 0.88, bumpAmp: 0.02, trailKind: 'grass' },
  // Terrain paint (Epic 5): steep rock, packed trail dirt, loose shingle.
  rock: { kind: 'rock', speedMult: 0.86, accelMult: 0.84, turnMult: 0.92, lateralGrip: 0.9, bumpAmp: 0.06, trailKind: 'none' },
  dirt: { kind: 'dirt', speedMult: 0.97, accelMult: 0.95, turnMult: 0.97, lateralGrip: 0.82, bumpAmp: 0.02, trailKind: 'sand' },
  gravel: { kind: 'gravel', speedMult: 0.9, accelMult: 0.86, turnMult: 0.9, lateralGrip: 0.68, bumpAmp: 0.04, trailKind: 'sand' },
  // Shallow water (Epic 4): the canal floor and the river edges. Deeper than WATER.stallDepth a mower sinks (vehicles.ts).
  water: { kind: 'water', speedMult: 0.5, accelMult: 0.55, turnMult: 0.8, lateralGrip: 0.6, bumpAmp: 0.03, trailKind: 'none' },
};

function distSqToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const lenSq = vx * vx + vz * vz;
  if (lenSq <= 1e-8) return wx * wx + wz * wz;
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq));
  const dx = wx - t * vx;
  const dz = wz - t * vz;
  return dx * dx + dz * dz;
}

function onCityRoad(x: number, z: number): boolean {
  if (Math.abs(x) > CITY_HALF || Math.abs(z) > CITY_HALF) return false;
  for (const line of ROAD_LINES) {
    if (Math.abs(x - line) <= ROAD_HALF || Math.abs(z - line) <= ROAD_HALF) return true;
  }
  return false;
}

function onHighway(x: number, z: number): boolean {
  const maxDistSq = ROAD_HALF * ROAD_HALF;
  for (const hw of HIGHWAYS) {
    const pts = hw.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      if (distSqToSegment(x, z, ax, az, bx, bz) <= maxDistSq) return true;
    }
  }
  return false;
}

function onAirfieldRunway(
  x: number,
  z: number,
  airfield: Pick<World['airfield'], 'x' | 'z' | 'yaw' | 'length' | 'width'>,
): boolean {
  const dx = x - airfield.x;
  const dz = z - airfield.z;
  const fx = Math.sin(airfield.yaw);
  const fz = Math.cos(airfield.yaw);
  const rx = Math.cos(airfield.yaw);
  const rz = -Math.sin(airfield.yaw);
  const along = dx * fx + dz * fz;
  const across = dx * rx + dz * rz;
  return Math.abs(along) <= airfield.length / 2 && Math.abs(across) <= airfield.width / 2;
}

export function surfaceAt(
  x: number,
  z: number,
  world: Partial<Pick<World, 'biomeAt' | 'airfield'>>,
  vehicleKind?: VehicleKind,
): SurfaceSpec {
  let kind: SurfaceKind;
  // Terrain paint (trails, rock, river mud, the regions' own paint); null while the terrain is flat.
  const painted = paintedSurfaceAt(x, z);
  let track: SurfaceKind | null = null;
  if ((waterDepthAt(x, z) > 0.05 && bridgeDeckAt(x, z) === null) || fordWaterAt(x, z)) {
    kind = 'water';
  } else if (onCityRoad(x, z) || onHighway(x, z) || onAirfieldRunway(x, z, world.airfield ?? AIRFIELD)) {
    kind = 'asphalt';
  } else if ((track = trackSurfaceAt(x, z))) {
    // A race track's road (raceTrack/tracks.ts): asphalt at the Speedway, dirt at Rutbottom and on the Capwood Run.
    kind = track;
  } else if ((x - BIRDBATH_X) ** 2 + (z - BIRDBATH_Z) ** 2 <= BIRDBATH_RADIUS * BIRDBATH_RADIUS) {
    kind = 'ice';
  } else if (painted) {
    kind = painted;
  } else {
    const biome = typeof world.biomeAt === 'function' ? world.biomeAt(x, z) : biomeAt(x, z);
    switch (biome) {
      case 'tundra': kind = 'snow'; break;
      case 'desert': kind = 'sand'; break;
      case 'forest': kind = 'mud'; break;
      case 'farmland': kind = 'farm'; break;
      case 'city':
      default:
        kind = 'grass';
        break;
    }
  }

  const base = SURFACES[kind];
  if (kind !== 'asphalt' && vehicleKind && HEAVY_ALL_TERRAIN.has(vehicleKind)) {
    return { ...base, speedMult: 1 - (1 - base.speedMult) * 0.5 };
  }
  return base;
}
