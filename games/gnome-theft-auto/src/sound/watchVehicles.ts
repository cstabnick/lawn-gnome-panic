// Watches every other vehicle each frame and makes it heard: engine and siren loops, crashes, skids, horns,
// explosions, sinking. The player's own vehicle is skipped for sound (audio.ts plays it), but its memory is kept
// so that leaving it does not read as a crash.
import type { Driver, Vehicle, VehicleKind } from '../types';
import { playAt } from './bus';
import { createLoopPool, type LoopKind, type LoopPool, type LoopSource } from './loops';
import { createEnginePool, type EnginePool, type EngineSource } from './enginePool';
import { engineSoundFor, engineMixFor, type EngineSound, type EngineCondition } from './engines';

export interface VehicleSoundFrame {
  dt: number;
  vehicles: readonly Vehicle[];
  /** The vehicle the player drives or rides (its own sounds come from audio.ts), or null on foot. */
  playerVehicle: Vehicle | null;
  playerX: number;
  playerZ: number;
  /** Wanted level (watch.heat floored), 0..5. */
  heat: number;
  /** Ambulances on their way (ambulance.ts sirens()). */
  ambulances: readonly { x: number; z: number }[];
}

export interface VehicleSounds {
  update(f: VehicleSoundFrame): void;
}

/** Vehicles farther than this from the player make no sound (explosions excepted). */
const NEAR = 160;
const NEAR2 = NEAR * NEAR;
const HEAVY_KINDS: ReadonlySet<string> = new Set(['combine', 'hoa-van', 'mulch-spreader', 'snail-coach']);
const TRUCK_HORN_KINDS: ReadonlySet<string> = new Set(['combine', 'mulch-spreader', 'snail-coach', 'bin-lorry', 'fire-engine']);

/** Ids of vehicles sounding a fire siren (the fire job adds its engine's id while on a call). */
export const SIREN_VEHICLES = new Set<number>();
const CREW_KINDS: ReadonlySet<string> = new Set(['push-bike', 'tessie']);

const CRASH_COOLDOWN = 0.6;
const SKID_COOLDOWN = 1.2;
const HORN_COOLDOWN = 2.5;
const SWEEP_EVERY = 2;

/** Wrap an angle to -PI..PI. */
export function wrapAngle(a: number): number {
  let x = (a + Math.PI) % (2 * Math.PI);
  if (x < 0) x += 2 * Math.PI;
  return x - Math.PI;
}

/** A crash is a fast drop in speed (over 4 units, faster than 80 units/s^2). Null when it is not one. */
export function crashKind(lastSpeed: number, speed: number, dt: number): 'crash-heavy' | 'crash-light' | null {
  if (!(dt > 0)) return null;
  const drop = Math.abs(lastSpeed) - Math.abs(speed);
  const decel = drop / dt;
  if (!(Math.abs(lastSpeed) > 5 && drop > 4 && decel > 80)) return null;
  return Math.abs(lastSpeed) > 14 ? 'crash-heavy' : 'crash-light';
}

/** The horn a vehicle of this kind honks. Boats first, then bikes, trucks, the HOA van, and cars. */
export function hornFor(kind: VehicleKind, boat: boolean): 'horn-car' | 'horn-truck' | 'horn-bike' | 'horn-boat' | 'horn-hoa' {
  if (kind === 'push-bike' || kind === 'dirt-bike') return 'horn-bike';
  if (boat) return 'horn-boat';
  if (TRUCK_HORN_KINDS.has(kind)) return 'horn-truck';
  if (kind === 'hoa-van') return 'horn-hoa';
  return 'horn-car';
}

/** The looping engine voice for a vehicle, or null for ones with no loop (push bikes, Tessie). */
export function loopKindFor(v: Pick<Vehicle, 'kind' | 'spec'>): LoopKind | null {
  if (CREW_KINDS.has(v.kind)) return null;
  if (v.spec.boat) return 'boat-motor';
  if (v.spec.flies) return 'propeller';
  return HEAVY_KINDS.has(v.kind) ? 'engine-heavy' : 'engine';
}

interface Mem {
  gen: number;
  lastSpeed: number;
  lastYaw: number;
  lastExploded: boolean;
  lastSunk: boolean;
  lastDriver: Driver | undefined;
  crashCd: number;
  skidCd: number;
  hornCd: number;
  engineKey: string;
  sirenKey: string;
  /** The vehicle's engine, made on first use (engines.ts engineSoundFor). */
  profile: EngineSound | null;
  /** The vehicle's damage, waterlog and stall, refreshed every frame (reused, not reallocated). */
  cond: EngineCondition;
  /** Smoothed throttle from the acceleration, -1..1. */
  throttle: number;
}

function newMem(v: Vehicle): Mem {
  return {
    gen: 0,
    lastSpeed: v.speed,
    lastYaw: v.yaw,
    lastExploded: v.exploded === true,
    lastSunk: v.sunk === true,
    lastDriver: undefined,
    crashCd: 0,
    skidCd: 0,
    hornCd: 0,
    engineKey: `v${v.id}`,
    sirenKey: `s${v.id}`,
    profile: null,
    cond: {},
    throttle: 0,
  };
}

const AMB_KEYS: string[] = [];
function ambKey(i: number): string {
  while (AMB_KEYS.length <= i) AMB_KEYS.push(`amb${AMB_KEYS.length}`);
  return AMB_KEYS[i];
}

export function createVehicleSounds(): VehicleSounds {
  const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  // Sirens and ambulances: the loop pool. Other vehicles' engines: the engine pool (no pitch or pan chirps).
  const pool: LoopPool = createLoopPool(COARSE ? 2 : 3);
  const enginePool: EnginePool = createEnginePool(COARSE ? 3 : 5);
  const mems = new Map<number, Mem>();
  const frameSources: LoopSource[] = [];
  const sourcePool: LoopSource[] = [];
  const engineFrame: EngineSource[] = [];
  const enginePoolObjs: EngineSource[] = [];
  let used = 0;
  let engineUsed = 0;
  let gen = 0;
  let sweepT = 0;

  function addEngine(
    key: string, x: number, z: number, vx: number, vz: number, speed01: number, throttle: number,
    profile: EngineSound, maxDist: number, cond: EngineCondition, mix: number,
  ): void {
    let s = enginePoolObjs[engineUsed];
    if (!s) {
      s = { key, x, z, vx, vz, speed01, throttle, profile, maxDist, cond, mix };
      enginePoolObjs.push(s);
    } else {
      s.key = key;
      s.x = x;
      s.z = z;
      s.vx = vx;
      s.vz = vz;
      s.speed01 = speed01;
      s.throttle = throttle;
      s.profile = profile;
      s.maxDist = maxDist;
      s.cond = cond;
      s.mix = mix;
    }
    engineUsed++;
    engineFrame.push(s);
  }

  function addSource(key: string, kind: LoopKind, x: number, z: number, level: number): void {
    let s = sourcePool[used];
    if (!s) {
      s = { key, kind, x, z, level };
      sourcePool.push(s);
    } else {
      s.key = key;
      s.kind = kind;
      s.x = x;
      s.z = z;
      s.level = level;
    }
    used++;
    frameSources.push(s);
  }

  return {
    update(f: VehicleSoundFrame): void {
      const dt = f.dt;
      gen++;
      frameSources.length = 0;
      used = 0;
      engineFrame.length = 0;
      engineUsed = 0;
      const px = f.playerX;
      const pz = f.playerZ;
      const pid = f.playerVehicle ? f.playerVehicle.id : -1;

      for (const v of f.vehicles) {
        let m = mems.get(v.id);
        const fresh = m === undefined;
        if (!m) {
          m = newMem(v);
          mems.set(v.id, m);
        }
        m.gen = gen;
        if (m.crashCd > 0) m.crashCd -= dt;
        if (m.skidCd > 0) m.skidCd -= dt;
        if (m.hornCd > 0) m.hornCd -= dt;

        const isPlayer = v.id === pid;
        const dx = v.x - px;
        const dz = v.z - pz;
        const d2 = dx * dx + dz * dz;
        const near = d2 <= NEAR2;
        const ground = !v.spec.flies && !v.spec.boat;

        if (!isPlayer) {
          // Explosions and sinking: any distance for explosions (playAt culls), near only for the splash.
          // Within 30 m app.ts plays its own full-screen 'boom'; only farther blasts are placed here.
          if (v.exploded && !m.lastExploded && d2 > 30 * 30) playAt('explosion', { x: v.x, z: v.z }, { param: 0.5 });
          if (near && v.sunk && !m.lastSunk) playAt('splash-big', { x: v.x, z: v.z }, { param: 0.5 });

          if (near) {
            const moving = Math.abs(v.speed) > 1 || v.driver === 'npc' || v.driver === 'police' || v.driver === 'remote';
            if (!fresh && dt > 0) {
              const crash = crashKind(m.lastSpeed, v.speed, dt);
              if (crash && m.crashCd <= 0) {
                playAt(crash, { x: v.x, z: v.z }, { param: Math.min(1, Math.abs(m.lastSpeed) / 25) });
                m.crashCd = CRASH_COOLDOWN;
              } else if (ground && m.skidCd <= 0) {
                const absSpeed = Math.abs(v.speed);
                const yawRate = Math.abs(wrapAngle(v.yaw - m.lastYaw)) / dt;
                const decel = (Math.abs(m.lastSpeed) - absSpeed) / dt;
                const drop = Math.abs(m.lastSpeed) - absSpeed;
                if (absSpeed > 8 && yawRate * absSpeed > 18) {
                  playAt('tyre-squeal', { x: v.x, z: v.z }, { param: Math.min(1, (yawRate * absSpeed) / 40) });
                  m.skidCd = SKID_COOLDOWN;
                } else if (Math.abs(m.lastSpeed) > 10 && decel > 14 && drop <= 4) {
                  playAt(HEAVY_KINDS.has(v.kind) ? 'brake-hiss' : 'tyre-squeal', { x: v.x, z: v.z }, { param: 0.5 });
                  m.skidCd = SKID_COOLDOWN;
                }
              }
            }

            if (m.lastDriver === 'none' && (v.driver === 'npc' || v.driver === 'police' || v.driver === 'remote')) {
              playAt('engine-start', { x: v.x, z: v.z }, { param: 0.5 });
            }
            if (v.driver === 'police' && m.lastDriver !== 'police' && f.heat >= 1) {
              playAt('siren-whoop', { x: v.x, z: v.z }, { param: 0.5 });
            }

            if (v.driver === 'npc' && ground && m.hornCd <= 0 && Math.abs(v.speed) < 3) {
              // Stuck behind the player: the player is within 7 m, roughly in front of this vehicle.
              const tx = px - v.x;
              const tz = pz - v.z;
              const dist = Math.sqrt(d2);
              if (dist > 0.01 && dist <= 7 && (Math.sin(v.yaw) * tx + Math.cos(v.yaw) * tz) / dist > 0.7
                && Math.random() < dt / 3) {
                playAt(hornFor(v.kind, !!v.spec.boat), { x: v.x, z: v.z }, { param: 0.5 });
                m.hornCd = HORN_COOLDOWN;
              }
            }
            if (v.driver === 'npc' && ground && m.hornCd <= 0 && Math.abs(v.speed) > 1 && d2 <= 60 * 60
              && Math.random() < dt / 40) {
              playAt(hornFor(v.kind, !!v.spec.boat), { x: v.x, z: v.z }, { param: 0.5 });
              m.hornCd = HORN_COOLDOWN;
            }
            if (v.driver === 'npc' && ground && Math.abs(v.speed) > 1 && d2 <= 50 * 50 && Math.random() < dt / 90) {
              playAt('backfire', { x: v.x, z: v.z }, { param: 0.5 });
            }

            // Loops.
            if (moving && !v.exploded && !v.sunk && loopKindFor(v) !== null) {
              const maxSpeed = v.spec.maxSpeed > 0 ? v.spec.maxSpeed : 1;
              if (!m.profile) m.profile = engineSoundFor({ ...v.spec, pitch: v.enginePitch }, v.variant);
              // Throttle: the acceleration, smoothed (0.25 s); at least 0.3 while it moves, so a cruising engine works.
              if (dt > 0) {
                const accel = ((Math.abs(v.speed) - Math.abs(m.lastSpeed)) / dt) / Math.max(0.01, v.spec.accel);
                const a = 1 - Math.exp(-dt / 0.25);
                m.throttle += (Math.max(-1, Math.min(1, accel)) - m.throttle) * a;
              }
              const throttle = Math.abs(m.throttle) < 0.3 ? 0.3 : m.throttle;
              m.cond.hp = v.hp;
              m.cond.waterlog = v.waterlog;
              m.cond.stalled = v.waterlogStalled;
              addEngine(
                m.engineKey, v.x, v.z, Math.sin(v.yaw) * v.speed, Math.cos(v.yaw) * v.speed,
                Math.min(1, Math.abs(v.speed) / maxSpeed), throttle, m.profile, v.spec.flies ? 220 : 75,
                m.cond, engineMixFor(v.driver),
              );
            }
            if (v.driver === 'police' && f.heat >= 1 && !v.exploded && !v.sunk) {
              const siren: LoopKind = v.kind === 'hoa-van' || v.kind === 'hoa-patrol-boat' ? 'siren-hoa' : 'siren-police';
              addSource(m.sirenKey, siren, v.x, v.z, 1);
            }
          }
        }

        if (SIREN_VEHICLES.has(v.id) && !v.exploded) addSource('fire-siren' + v.id, 'siren-ambulance', v.x, v.z, 1);

        m.lastSpeed = v.speed;
        m.lastYaw = v.yaw;
        m.lastExploded = v.exploded === true;
        m.lastSunk = v.sunk === true;
        m.lastDriver = v.driver;
      }

      for (let i = 0; i < f.ambulances.length; i++) {
        const a = f.ambulances[i];
        addSource(ambKey(i), 'siren-ambulance', a.x, a.z, 1);
      }
      enginePool.update(engineFrame, dt);
      pool.update(frameSources);

      sweepT -= dt;
      if (sweepT <= 0) {
        sweepT = SWEEP_EVERY;
        for (const [id, m] of mems) if (m.gen !== gen) mems.delete(id);
      }
    },
  };
}
