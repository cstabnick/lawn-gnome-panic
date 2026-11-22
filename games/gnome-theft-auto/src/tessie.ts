// Tessie in the open world (Wild World Epic 7): Driftwood waiting on the Loch Moss shore once the quest unlocks, and,
// after the quest, Tessie surfacing in the loch now and then (a local world event, never relayed) to be ridden again.
import type * as THREE from 'three';
import { gnomeState, makeGnome, randomTownLook } from './gnomes';
import { heightAt, waterAt } from './terrain';
import { BODIES, bodyRadius } from './water';
import { TESSIE, VEHICLES } from './config';
import { GIVERS } from './quests/defs';
import { createVehicle, removeVehicle } from './vehicles';
import type { Blip, Hud, Player, Sfx, Vehicle, World } from './types';

export interface TessieWorldDeps {
  scene: THREE.Scene;
  world: World;
  hud: Hud;
  /** The game's vehicle list: a surfaced Tessie is a 'tessie' boat vehicle pushed here (and spliced out when she dives). */
  vehicles: Vehicle[];
  play(sfx: Sfx): void;
  /** Turfton FM news (app.ts reportNews). */
  report(id: string): void;
  /** The quest has unlocked (the TESSIE.unlockKey save entry is 'done'). */
  unlocked(): boolean;
  /** The Tessie quest is finished (its save is 'done'). */
  questDone(): boolean;
  /** The Tessie quest is the active quest. */
  questActive(): boolean;
}

export interface TessieWorld {
  update(dt: number, player: Player, cutsceneActive: boolean): void;
  blips(): Blip[];
  /** Dev and demos: make Tessie surface now (only after the quest is done). */
  surfaceNow(): void;
  /** Demos: surface Tessie in the loch near (x, z) now, quest or not (?tessie=surface). No-op if one is up. */
  demoSurface(x: number, z: number): void;
}

type Pt = { x: number; z: number };
type Body = (typeof BODIES)[number];
type GnomeModel = ReturnType<typeof makeGnome>;
type DepthAt = (x: number, z: number) => number;

/** Driftwood's colours, spread over a random town look. */
export const DRIFTWOOD_LOOK = { hat: 0x4f9d92, shirt: 0xd9c79e, beard: 0xe5e0d4 };

const LOCH_ID = 'water/loch-moss';
const SURFACE_TRIES = 20;
const SURFACE_GRID = 10;
const ISLAND_CLEAR = 25;
const MIN_SURFACE_DEPTH = 3;
const SURFACE_BELOW = 3;
const DIVE_RATE = 1.5;
const DIVE_DEPTH = 5;
const GIVER_SEE = 25;
const TESSIE_COLOUR = '#45e68b';

const defaultDepth: DepthAt = (x, z) => waterAt(x, z)?.depth ?? 0;

export function lochBody(): Body | undefined {
  return BODIES.find((b) => b.id === LOCH_ID);
}

function spotOk(loch: Body, x: number, z: number, depthAt: DepthAt): boolean {
  if (bodyRadius(loch, x, z) >= 0.6) return false;
  if (Math.hypot(x - TESSIE.island.x, z - TESSIE.island.z) <= ISLAND_CLEAR) return false;
  return depthAt(x, z) > MIN_SURFACE_DEPTH;
}

/**
 * A deep open-water spot in the loch for Tessie to surface at. With `near`, the valid spot nearest to it (a grid
 * search, for demos); otherwise up to SURFACE_TRIES random points in the loch's rectangle. Null if none is found.
 */
export function pickSurfaceSpot(loch: Body, rand: () => number, depthAt: DepthAt = defaultDepth, near?: Pt): Pt | null {
  if (near) {
    let best: Pt | null = null;
    let bestD = Infinity;
    for (let x = loch.cx - loch.a; x <= loch.cx + loch.a; x += SURFACE_GRID) {
      for (let z = loch.cz - loch.b; z <= loch.cz + loch.b; z += SURFACE_GRID) {
        if (!spotOk(loch, x, z, depthAt)) continue;
        const d = Math.hypot(x - near.x, z - near.z);
        if (d < bestD) { bestD = d; best = { x, z }; }
      }
    }
    return best;
  }
  for (let i = 0; i < SURFACE_TRIES; i++) {
    const x = loch.cx + (rand() * 2 - 1) * loch.a;
    const z = loch.cz + (rand() * 2 - 1) * loch.b;
    if (spotOk(loch, x, z, depthAt)) return { x, z };
  }
  return null;
}

/** A random gap between surfacings, seconds. */
export function surfaceGap(rand: () => number): number {
  const { minGapS, maxGapS } = TESSIE.event;
  return minGapS + rand() * (maxGapS - minGapS);
}

interface VState {
  /** Paddle phase. */
  t: number;
  /** Seconds with nobody driving her. */
  idle: number;
  /** Somebody has ridden her since she surfaced. */
  rode: boolean;
  diving: boolean;
  /** Height when the dive began, for the depth check. */
  startY: number;
  flippers: THREE.Object3D[];
  head: THREE.Object3D | null;
}

export function createTessieWorld(deps: TessieWorldDeps): TessieWorld {
  /** Tessie surfaced by the world event (or surfaceNow). Others are the quest's own boat. */
  const ours = new WeakSet<Vehicle>();
  const states = new Map<Vehicle, VState>();
  let driftwood: GnomeModel | null = null;
  let flags = { unlocked: false, done: false, active: false };
  let flagT = 0;
  let nextAt: number = TESSIE.event.firstDelayS;
  let clock = 0;
  let lastPlayer: Pt | null = null;

  function stateOf(v: Vehicle): VState {
    let s = states.get(v);
    if (!s) {
      const flippers: THREE.Object3D[] = [];
      for (let i = 0; i < 4; i++) {
        const f = v.object.getObjectByName(`flipper-${i}`);
        if (f) flippers.push(f);
      }
      s = {
        t: Math.random() * 6, idle: 0, rode: false, diving: false, startY: v.y,
        flippers, head: v.object.getObjectByName('head') ?? null,
      };
      states.set(v, s);
    }
    return s;
  }

  function removeTessie(v: Vehicle): void {
    const i = deps.vehicles.indexOf(v);
    if (i >= 0) deps.vehicles.splice(i, 1);
    removeVehicle(deps.scene, v);
    states.delete(v);
  }

  function updateDriftwood(dt: number, player: Player, cutsceneActive: boolean): void {
    if (!flags.unlocked) return;
    const giver = GIVERS[TESSIE.giver];
    if (!giver) return;
    if (!driftwood) driftwood = makeGnome(deps.scene, { ...randomTownLook(), ...DRIFTWOOD_LOOK });
    const x = giver.x + 2;
    const z = giver.z;
    const y = heightAt(x, z);
    const dx = player.x - x;
    const dz = player.z - z;
    // Facing the loch (-z) unless the player is close, then turning to them.
    const yaw = Math.hypot(dx, dz) < GIVER_SEE ? Math.atan2(dx, dz) : Math.PI;
    driftwood.update(gnomeState(x, y, z, yaw, 0), dt);
    driftwood.object.visible = !cutsceneActive;
  }

  function startDive(v: Vehicle, s: VState): void {
    s.diving = true;
    s.startY = v.y;
    v.driver = 'npc';
    deps.play('splash');
  }

  function updateTessies(dt: number): void {
    const tessies = deps.vehicles.filter((v) => v.kind === 'tessie');
    for (const v of tessies) {
      const s = stateOf(v);
      const fast = Math.abs(v.speed) > 1;
      s.t += dt * (fast ? 7 : 2.2);
      const amp = fast ? 0.7 : 0.35;
      s.flippers.forEach((f, i) => { f.rotation.z = amp * Math.sin(s.t + i * (Math.PI / 2)); });
      if (s.head) s.head.rotation.x = 0.1 * Math.sin(s.t * 0.3);

      if (s.diving) {
        v.y -= DIVE_RATE * dt;
        v.speed = 0;
        if (s.startY - v.y >= DIVE_DEPTH) removeTessie(v);
        continue;
      }
      if (v.driver !== 'none') {
        s.idle = 0;
        if (v.driver === 'player') s.rode = true;
        continue;
      }
      s.idle += dt;
      const mine = ours.has(v);
      // Ours stays for stayS if nobody has ridden her yet, then diveAfterLeftS after the last rider.
      const limit = mine && !s.rode ? TESSIE.event.stayS : TESSIE.event.diveAfterLeftS;
      if ((mine || !flags.active) && s.idle >= limit) {
        startDive(v, s);
        continue;
      }
      if (mine) v.yaw += Math.sin(clock * 0.15 + s.t * 0.1) * 0.08 * dt;
    }
    for (const v of [...states.keys()]) {
      if (!deps.vehicles.includes(v)) states.delete(v);
    }
  }

  function surfaceAt(spot: Pt): void {
    const hit = waterAt(spot.x, spot.z);
    if (!hit) return;
    const v = createVehicle(deps.scene, 'tessie', spot.x, spot.z, Math.random() * Math.PI * 2);
    v.questOwned = true;
    v.y = hit.surface - (VEHICLES.tessie.draft ?? 0) - SURFACE_BELOW;
    deps.vehicles.push(v);
    ours.add(v);
    deps.play('splash');
    deps.hud.toast('Tessie has surfaced in Loch Moss!', 5000);
    deps.report(TESSIE.bulletins.surfaced);
  }

  function updateEvent(dt: number, player: Player, cutsceneActive: boolean): void {
    if (!flags.done || cutsceneActive) return;
    if (deps.vehicles.some((v) => v.kind === 'tessie')) return;
    if (Math.hypot(player.x - TESSIE.loch.x, player.z - TESSIE.loch.z) > TESSIE.event.nearDist) return;
    nextAt -= dt;
    if (nextAt > 0) return;
    nextAt = surfaceGap(Math.random);
    const body = lochBody();
    const spot = body ? pickSurfaceSpot(body, Math.random) : null;
    if (spot) surfaceAt(spot);
  }

  return {
    update(dt, player, cutsceneActive) {
      clock += dt;
      lastPlayer = { x: player.x, z: player.z };
      if (flagT <= 0) {
        flags = { unlocked: deps.unlocked(), done: deps.questDone(), active: deps.questActive() };
        flagT = 1;
      }
      flagT -= dt;
      updateDriftwood(dt, player, cutsceneActive);
      updateTessies(dt);
      updateEvent(dt, player, cutsceneActive);
    },
    blips() {
      const out: Blip[] = [];
      for (const v of deps.vehicles) {
        if (v.kind !== 'tessie' || !ours.has(v) || states.get(v)?.diving) continue;
        out.push({ x: v.x, z: v.z, color: TESSIE_COLOUR, quest: 'Tessie' });
      }
      return out;
    },
    surfaceNow() {
      if (!deps.questDone() || deps.vehicles.some((v) => v.kind === 'tessie')) return;
      const body = lochBody();
      if (!body) return;
      const spot = pickSurfaceSpot(body, Math.random, defaultDepth, lastPlayer ?? TESSIE.loch);
      if (spot) surfaceAt(spot);
    },
    demoSurface(x, z) {
      if (deps.vehicles.some((v) => v.kind === 'tessie')) return;
      const body = lochBody();
      const spot = body ? pickSurfaceSpot(body, Math.random, defaultDepth, { x, z }) : null;
      if (spot) surfaceAt(spot);
    },
  };
}
