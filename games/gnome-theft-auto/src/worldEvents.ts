// Public free-roam World Events: rotates every 110s through 6 dynamic events.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { angleDiff } from './collide';
import { BODEGA, CLAY_MART, GNOMECINO, SIDE_VALVE } from './config';
import type { Economy } from './economy';
import { gnomeState, makeGnome, randomTownLook } from './gnomes';
import { perkRewardScale } from './perks';
import type { Blip, Hud, Player, Sfx, Vehicle, World } from './types';
import { heightAt } from './terrain';
import { placeOnGround } from './terrainMesh';
import { createVehicle, removeVehicle, stepVehicle, syncVehicleMesh } from './vehicles';

export type WorldEventKind =
  | 'dew-convoy'
  | 'drift-trial'
  | 'hoa-raid'
  | 'acorn-spill'
  | 'street-drag'
  | 'runaway-combine';

/** Seconds between world events (L71: was 110). */
export const EVENT_INTERVAL = 160;
export const EVENT_DURATION = 90;
export const DRIFT_TRIAL_TIME = 45;
export const ACORN_SPILL_TIME = 60;
export const ACORN_SPILL_TOTAL = 12;
export const ACORN_SPILL_TARGET = 8;

export const EVENT_REWARDS: Record<WorldEventKind, number> = {
  'dew-convoy': 300,
  'drift-trial': 250,
  'hoa-raid': 250,
  'acorn-spill': 275,
  'street-drag': 350,
  'runaway-combine': 325,
};

/** Each event's name (trainer list, events/api.ts). */
export const EVENT_TITLES: Record<WorldEventKind, string> = {
  'dew-convoy': 'Dew Convoy',
  'drift-trial': 'Zero-Turn Drift Trial',
  'hoa-raid': 'HOA Foreclosure Raid',
  'acorn-spill': 'Turfton Acorn Spill',
  'street-drag': 'Turfton Street Drag',
  'runaway-combine': 'Runaway Combine',
};

export const EVENT_ROTATION: readonly WorldEventKind[] = [
  'dew-convoy',
  'drift-trial',
  'hoa-raid',
  'acorn-spill',
  'street-drag',
  'runaway-combine',
];

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

  interface AcornCrate {
    x: number;
    z: number;
    mesh: THREE.Mesh;
    collected: boolean;
  }

  let active: {
    kind: WorldEventKind;
    title: string;
    remaining: number;
    vehicle?: Vehicle;
    escort?: Vehicle;
    rivals?: Vehicle[];
    gateIdx: number;
    gateMesh?: THREE.Mesh;
    crates?: AcornCrate[];
    collected?: number;
    raceStarted?: boolean;
    elapsed: number;
  } | null = null;

  function makeGateMesh(x: number, z: number, color = 0x7cf0ff): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 4.0, 28),
      flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false }), LAYER.marker),
    );
    m.rotation.x = -Math.PI / 2;
    placeOnGround(m, x, z, 0.1, true);
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
    if (active.crates) {
      for (const c of active.crates) {
        if (!c.collected) deps.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
      }
    }
    const eventVehicles = [active.vehicle, active.escort, ...(active.rivals ?? [])];
    for (const v of eventVehicles) {
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
    const reward = Math.round(EVENT_REWARDS[active.kind] * perkRewardScale());
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
    v.questOwned = true;
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
      active = { kind: chosen, title: 'Dew Convoy on Route South', remaining: EVENT_DURATION, vehicle: hauler, escort, gateIdx: 0, elapsed: 0 };
      deps.hud.toast('WORLD EVENT: Dew Convoy spotted on Route South! Intercept for +300 Acorns.', 6500);
    } else if (chosen === 'drift-trial') {
      const [gx, gz] = DRIFT_GATES[0];
      const gateMesh = makeGateMesh(gx, gz);
      active = { kind: chosen, title: 'Zero-Turn Drift Trial', remaining: DRIFT_TRIAL_TIME, gateIdx: 0, gateMesh, elapsed: 0 };
      deps.hud.toast('WORLD EVENT: Zero-Turn Drift Trial! Hit 6 ring-road gates in 45s for +250 Acorns.', 6500);
    } else if (chosen === 'hoa-raid') {
      const shop = RAID_SHOPS[Math.floor(Math.random() * RAID_SHOPS.length)];
      const van = createVehicle(deps.scene, 'hoa-van', shop.x, shop.z, 0, 0x1c1c22);
      spawnDriver(van, 0x141414, 0x3b3528);
      deps.vehicles.push(van);
      active = { kind: chosen, title: 'HOA Foreclosure Raid', remaining: EVENT_DURATION, vehicle: van, gateIdx: 0, elapsed: 0 };
      deps.hud.toast(`WORLD EVENT: HOA Foreclosure Raid at ${shop.name}! Smash or steal the van for +250 Acorns.`, 6500);
    } else if (chosen === 'acorn-spill') {
      const crates: AcornCrate[] = [];
      const cx = 0;
      const cz = 60;
      for (let i = 0; i < ACORN_SPILL_TOTAL; i++) {
        const angle = (i / ACORN_SPILL_TOTAL) * Math.PI * 2;
        const radius = 10 + (i % 3) * 7;
        const x = cx + Math.cos(angle) * radius;
        const z = cz + Math.sin(angle) * radius;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.9, 0.9),
          new THREE.MeshBasicMaterial({ color: 0xffd23f }),
        );
        mesh.position.set(x, heightAt(x, z) + 0.6, z);
        deps.scene.add(mesh);
        crates.push({ x, z, mesh, collected: false });
      }
      active = { kind: chosen, title: 'Turfton Acorn Spill', remaining: ACORN_SPILL_TIME, gateIdx: 0, crates, collected: 0, elapsed: 0 };
      deps.hud.toast('WORLD EVENT: Acorn Spill at Turfton Plaza! Collect 8 glowing crates in 60s for +275 Acorns.', 6500);
    } else if (chosen === 'street-drag') {
      const r1 = createVehicle(deps.scene, 'zero-turn', -3.5, -150, 0, 0xef4444);
      const r2 = createVehicle(deps.scene, 'zero-turn', 3.5, -150, 0, 0x3b82f6);
      spawnDriver(r1, 0xef4444, 0x1e293b);
      spawnDriver(r2, 0x3b82f6, 0x1e293b);
      deps.vehicles.push(r1, r2);
      const gateMesh = makeGateMesh(0, 150, 0xffd23f);
      active = { kind: chosen, title: 'Turfton Street Drag', remaining: EVENT_DURATION, rivals: [r1, r2], gateIdx: 0, gateMesh, raceStarted: false, elapsed: 0 };
      deps.hud.toast('WORLD EVENT: Underground Street Drag at (0, -150)! Line up and beat 2 Zero-Turns to (0, 150) for +350 Acorns.', 6500);
    } else {
      const combine = createVehicle(deps.scene, 'combine', 0, 320, Math.PI, 0xd97706);
      combine.questOwned = true;
      deps.vehicles.push(combine);
      active = { kind: chosen, title: 'Runaway Combine', remaining: EVENT_DURATION, vehicle: combine, gateIdx: 0, elapsed: 0 };
      deps.hud.toast('WORLD EVENT: Runaway Combine tearing down South Highway! Hijack or destroy it for +325 Acorns.', 6500);
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
      if (active.kind === 'acorn-spill' && active.crates) {
        const out: Blip[] = [];
        for (const c of active.crates) {
          if (c.collected) continue;
          out.push({
            x: c.x,
            z: c.z,
            color: '#ffd23f',
            quest: out.length === 0 ? `Acorns (${active.collected ?? 0}/${ACORN_SPILL_TARGET})` : undefined,
          });
        }
        return out;
      }
      if (active.kind === 'street-drag') {
        return active.raceStarted
          ? [{ x: 0, z: 150, color: '#7cf0ff', quest: 'Drag Finish' }]
          : [{ x: 0, z: -150, color: '#ffd23f', quest: 'Street Drag Start' }];
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

      active.elapsed += dt;
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
            // The ring was tilted onto the slope when it was made: reset that tilt before re-leaning it at the new gate.
            active.gateMesh.rotation.set(-Math.PI / 2, 0, 0);
            placeOnGround(active.gateMesh, nx, nz, 0.1, true);
          }
        }
      } else if (active.kind === 'hoa-raid' && active.vehicle) {
        if (active.vehicle.driver === 'player' || active.vehicle.exploded) {
          completeActive('HOA Foreclosure Raid thwarted!');
        }
      } else if (active.kind === 'acorn-spill' && active.crates) {
        for (const c of active.crates) {
          if (c.collected) continue;
          c.mesh.rotation.y += dt * 2.2;
          c.mesh.position.y = heightAt(c.x, c.z) + 0.6 + Math.sin(active.elapsed * 4 + c.x) * 0.14;
          if (Math.hypot(player.x - c.x, player.z - c.z) <= 3.0) {
            c.collected = true;
            deps.scene.remove(c.mesh);
            active.collected = (active.collected ?? 0) + 1;
            deps.play?.('steal');
            if (active.collected >= ACORN_SPILL_TARGET) {
              completeActive('Acorn Spill gathered!');
              return;
            }
          }
        }
      } else if (active.kind === 'street-drag' && active.rivals) {
        if (!active.raceStarted) {
          if (Math.hypot(player.x - 0, player.z - -150) <= 22) {
            active.raceStarted = true;
            deps.play?.('whistle');
            deps.hud.toast('GO! Race to the finish ring at (0, 150)!', 3000);
          }
        } else {
          for (let i = 0; i < active.rivals.length; i++) {
            const r = active.rivals[i];
            if (r.driver === 'npc' && !r.exploded) {
              const laneX = i === 0 ? -3.5 : 3.5;
              const diff = angleDiff(Math.atan2(laneX - r.x, 150 - r.z), r.yaw);
              stepVehicle(r, { throttle: 1.0, steer: Math.max(-1, Math.min(1, diff * 2)), lift: 0 }, dt, deps.world);
              syncVehicleMesh(r, dt);
              if (r.z >= 150 && Math.abs(r.x) <= 12) {
                deps.hud.toast('Street Drag lost — rival crossed the finish first!', 4500);
                clearActive();
                cooldown = EVENT_INTERVAL;
                return;
              }
            }
          }
          if (Math.hypot(player.x - 0, player.z - 150) <= 7) {
            completeActive('Street Drag won!');
          }
        }
      } else if (active.kind === 'runaway-combine' && active.vehicle) {
        const combine = active.vehicle;
        if (combine.driver === 'none' && !combine.exploded) {
          const targetZ = combine.z > 0 ? -120 : 320;
          const diff = angleDiff(Math.atan2(0 - combine.x, targetZ - combine.z), combine.yaw);
          const wobble = Math.sin(active.elapsed * 2.3) * 0.2;
          stepVehicle(combine, { throttle: 0.95, steer: Math.max(-1, Math.min(1, diff * 2 + wobble)), lift: 0 }, dt, deps.world);
          syncVehicleMesh(combine, dt);
        }
        if (combine.driver === 'player' || combine.exploded) {
          completeActive('Runaway Combine stopped!');
        }
      }
    },
  };
}
