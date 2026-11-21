// Public free-roam World Events: rotates every 3 minutes through 90-second dynamic events
// (Dew Convoy on Route South, Lawn Prix Midnight Zero-Turn Trial, and HOA Foreclosure Raid).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { angleDiff } from './collide';
import { BODEGA, CLAY_MART, GNOMECINO, SIDE_VALVE } from './config';
import type { Economy } from './economy';
import { gnomeState, makeGnome, randomTownLook } from './gnomes';
import type { Blip, Hud, Player, Sfx, Vehicle, World } from './types';
import { createVehicle, removeVehicle, stepVehicle, syncVehicleMesh } from './vehicles';

export type WorldEventKind = 'dew-convoy' | 'drift-trial' | 'hoa-raid';

export const EVENT_INTERVAL = 180;
export const EVENT_DURATION = 90;
export const DRIFT_TRIAL_TIME = 45;

export const EVENT_REWARDS: Record<WorldEventKind, number> = {
  'dew-convoy': 300,
  'drift-trial': 250,
  'hoa-raid': 250,
};

export const EVENT_ROTATION: readonly WorldEventKind[] = ['dew-convoy', 'drift-trial', 'hoa-raid'];

export const DRIFT_GATES: readonly [number, number][] = [
  [120, 0],
  [120, 120],
  [0, 120],
  [-120, 120],
  [-120, 0],
  [-120, -120],
];

const RAID_SHOPS: readonly { name: string; x: number; z: number }[] = [
  { name: 'Bodega & Sons', x: BODEGA.x + 12, z: BODEGA.z },
  { name: 'Side-Valve Salvage', x: SIDE_VALVE.x + 15, z: SIDE_VALVE.z },
  { name: 'Clay-Mart', x: CLAY_MART.x + 20, z: CLAY_MART.z },
  { name: 'The Gnomecino', x: GNOMECINO.x - 16, z: GNOMECINO.z },
];

export interface WorldEventsDeps {
  scene: THREE.Scene;
  world: World;
  hud: Hud;
  vehicles: Vehicle[];
  economy?: Economy;
  play?: (sfx: Sfx) => void;
}

export interface WorldEvents {
  update(dt: number, player: Player, cutsceneActive?: boolean): void;
  blips(): Blip[];
  activeEvent(): { kind: WorldEventKind; title: string; remaining: number } | null;
  trigger(kind?: WorldEventKind): void;
}

export function nextEventKind(currentIndex: number): { kind: WorldEventKind; nextIndex: number } {
  const kind = EVENT_ROTATION[currentIndex % EVENT_ROTATION.length];
  return { kind, nextIndex: (currentIndex + 1) % EVENT_ROTATION.length };
}

export function createWorldEvents(deps: WorldEventsDeps): WorldEvents {
  let cooldown = EVENT_INTERVAL;
  let rotationIdx = 0;

  let active: {
    kind: WorldEventKind;
    title: string;
    remaining: number;
    vehicle?: Vehicle;
    escort?: Vehicle;
    gateIdx: number;
    gateMesh?: THREE.Mesh;
  } | null = null;

  function makeGateMesh(x: number, z: number): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 4.0, 28),
      flatLayer(new THREE.MeshBasicMaterial({ color: 0x7cf0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false }), LAYER.marker),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.1, z);
    deps.scene.add(m);
    return m;
  }

  function clearActive(): void {
    if (!active) return;
    if (active.gateMesh) {
      deps.scene.remove(active.gateMesh);
      active.gateMesh.geometry.dispose();
      (active.gateMesh.material as THREE.Material).dispose();
    }
    for (const v of [active.vehicle, active.escort]) {
      if (v && v.driver !== 'player') {
        const idx = deps.vehicles.indexOf(v);
        if (idx >= 0) deps.vehicles.splice(idx, 1);
        removeVehicle(deps.scene, v);
      }
    }
    active = null;
  }

  function completeActive(message: string): void {
    if (!active) return;
    const reward = EVENT_REWARDS[active.kind];
    deps.economy?.earn(reward, `World Event: ${active.title}`);
    deps.hud.banner('WORLD EVENT COMPLETE', 3000);
    deps.hud.toast(`${message} (+${reward} Acorns)`, 6000);
    deps.play?.('steal');
    clearActive();
    cooldown = EVENT_INTERVAL;
  }

  function spawnDriver(v: Vehicle, hat: number, shirt: number): void {
    const look = randomTownLook({ hat, shirt });
    const rider = makeGnome(v.object, look);
    rider.object.position.set(...v.spec.seat);
    rider.update(gnomeState(0, 0, 0, 0, 0, true), 0);
    v.rider = rider;
    v.riderLook = look;
    v.driver = 'npc';
  }

  function startEvent(kind?: WorldEventKind): void {
    clearActive();
    let chosen: WorldEventKind;
    if (kind) {
      chosen = kind;
    } else {
      const next = nextEventKind(rotationIdx);
      chosen = next.kind;
      rotationIdx = next.nextIndex;
    }

    if (chosen === 'dew-convoy') {
      const hauler = createVehicle(deps.scene, 'ride-on', 0, 460, Math.PI, 0xf08a24);
      spawnDriver(hauler, 0x141414, 0x3b3528);
      const escort = createVehicle(deps.scene, 'hoa-van', 0, 474, Math.PI, 0x1c1c22);
      spawnDriver(escort, 0x141414, 0x3b3528);
      deps.vehicles.push(hauler, escort);
      active = { kind: chosen, title: 'Dew Convoy on Route South', remaining: EVENT_DURATION, vehicle: hauler, escort, gateIdx: 0 };
      deps.hud.toast('WORLD EVENT: Dew Convoy spotted on Route South! Intercept for +300 Acorns.', 6500);
    } else if (chosen === 'drift-trial') {
      const [gx, gz] = DRIFT_GATES[0];
      const gateMesh = makeGateMesh(gx, gz);
      active = { kind: chosen, title: 'Zero-Turn Drift Trial', remaining: DRIFT_TRIAL_TIME, gateIdx: 0, gateMesh };
      deps.hud.toast('WORLD EVENT: Zero-Turn Drift Trial! Hit 6 ring-road gates in 45s for +250 Acorns.', 6500);
    } else {
      const shop = RAID_SHOPS[Math.floor(Math.random() * RAID_SHOPS.length)];
      const van = createVehicle(deps.scene, 'hoa-van', shop.x, shop.z, 0, 0x1c1c22);
      spawnDriver(van, 0x141414, 0x3b3528);
      deps.vehicles.push(van);
      active = { kind: chosen, title: 'HOA Foreclosure Raid', remaining: EVENT_DURATION, vehicle: van, gateIdx: 0 };
      deps.hud.toast(`WORLD EVENT: HOA Foreclosure Raid at ${shop.name}! Smash or steal the van for +250 Acorns.`, 6500);
    }
  }

  return {
    trigger(kind) {
      startEvent(kind);
    },

    activeEvent() {
      return active ? { kind: active.kind, title: active.title, remaining: active.remaining } : null;
    },

    blips() {
      if (!active) return [];
      if (active.kind === 'drift-trial') {
        const g = DRIFT_GATES[active.gateIdx];
        return g ? [{ x: g[0], z: g[1], color: '#7cf0ff', quest: `Gate ${active.gateIdx + 1}/${DRIFT_GATES.length}` }] : [];
      }
      if (active.vehicle) {
        return [{ x: active.vehicle.x, z: active.vehicle.z, color: '#ff4fd8', quest: active.title }];
      }
      return [];
    },

    update(dt, player, cutsceneActive = false) {
      if (cutsceneActive) return;

      if (!active) {
        cooldown -= dt;
        if (cooldown <= 0) startEvent();
        return;
      }

      active.remaining -= dt;
      if (active.remaining <= 0) {
        deps.hud.toast(`World Event ended: ${active.title}.`, 4000);
        clearActive();
        cooldown = EVENT_INTERVAL;
        return;
      }

      if (active.kind === 'dew-convoy' && active.vehicle) {
        const hauler = active.vehicle;
        if (hauler.driver === 'npc' && !hauler.exploded) {
          const diff = angleDiff(Math.atan2(0 - hauler.x, 120 - hauler.z), hauler.yaw);
          stepVehicle(hauler, { throttle: 0.75, steer: Math.max(-1, Math.min(1, diff * 2)), lift: 0 }, dt, deps.world);
          syncVehicleMesh(hauler, dt);
        }
        if (active.escort && active.escort.driver === 'npc' && !active.escort.exploded) {
          const diff = angleDiff(Math.atan2(hauler.x - active.escort.x, hauler.z + 12 - active.escort.z), active.escort.yaw);
          stepVehicle(active.escort, { throttle: 0.75, steer: Math.max(-1, Math.min(1, diff * 2)), lift: 0 }, dt, deps.world);
          syncVehicleMesh(active.escort, dt);
        }
        if (hauler.driver === 'player' || hauler.exploded) {
          completeActive('Dew Convoy intercepted!');
        }
      } else if (active.kind === 'drift-trial') {
        const gate = DRIFT_GATES[active.gateIdx];
        if (gate && player.vehicle?.kind === 'zero-turn' && Math.hypot(player.x - gate[0], player.z - gate[1]) <= 6) {
          active.gateIdx++;
          deps.play?.('whistle');
          if (active.gateIdx >= DRIFT_GATES.length) {
            completeActive('Zero-Turn Drift Trial cleared!');
          } else if (active.gateMesh) {
            const [nx, nz] = DRIFT_GATES[active.gateIdx];
            active.gateMesh.position.set(nx, 0.1, nz);
          }
        }
      } else if (active.kind === 'hoa-raid' && active.vehicle) {
        if (active.vehicle.driver === 'player' || active.vehicle.exploded) {
          completeActive('HOA Foreclosure Raid thwarted!');
        }
      }
    },
  };
}
