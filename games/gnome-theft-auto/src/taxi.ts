// The Turfton Taxi: the player calls it (44px button, Y key, gamepad D-pad left), it drives up, the gnome climbs in
// (mount.ts, run by app.ts), and Mabel Kerbstone takes them back to the Central Bus Stop (world.spawn): a short drive
// off, a fade, and a roll up to the kerb. Numbers in config.ts TAXI.
import type * as THREE from 'three';
import { TAXI } from './config';
import type { Economy } from './economy';
import { heightAt, waterAt } from './terrain';
import { createVehicle, removeVehicle } from './vehicles';
import type { Blip, Box, Hud, Sfx, Vehicle, World } from './types';

export type TaxiPhase = 'idle' | 'approach' | 'waiting' | 'ride' | 'leaving';

/** What update() reports for app.ts: 'jump' = the taxi was moved to the drop-off (snap the camera), 'dropoff' = stopped at the kerb, get out. */
export type TaxiEvent = 'jump' | 'dropoff' | null;

export interface TaxiDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  world: World;
  /** The game's vehicle list: the taxi is pushed here while it exists, and spliced out when it is removed. */
  vehicles: Vehicle[];
  hud: Hud;
  economy: Economy;
  play(sfx: Sfx): void;
  /** Why the taxi cannot be called right now (shown as a toast), or null when it can. app.ts decides (heat, a quest, ...). */
  blocked(): string | null;
  /** The player's ground position. */
  player(): { x: number; z: number };
  /** A ride ended at the Bus Stop (app.ts counts it for the achievement). */
  onDropOff(): void;
}

export interface Taxi {
  phase(): TaxiPhase;
  /** The taxi vehicle while one exists, else null. */
  vehicle(): Vehicle | null;
  /** Call the taxi (button, key, pad), or send it away while it is coming or waiting. */
  toggle(): void;
  /** The taxi while it waits at the kerb (E starts the mount sequence on it), else null. */
  boardable(): Vehicle | null;
  /** The gnome is seated in `v` (mount finished). False if `v` is not the waiting taxi. Charges the fare and starts the ride. */
  onSeated(v: Vehicle): boolean;
  /** True while the taxi drives the player: app.ts does not step the vehicle and holds the controls. */
  riding(): boolean;
  /** Per frame, after the player moved. */
  update(dt: number): TaxiEvent;
  /** The gnome has got out of `v`. False if `v` is not the taxi. The taxi drives off and is removed. */
  onStood(v: Vehicle): boolean;
  /** The taxi's map blip ('taxi' kind) while it comes or waits, else []. */
  blips(): Blip[];
  /** Ends any taxi at once (the player was cracked): removes the vehicle, clears the fade. */
  cancel(): void;
}

/** Fare in Acorns for a trip of `dist` units to the stop: TAXI.baseFare + TAXI.perUnit * dist, rounded, capped at TAXI.maxFare. */
export function taxiFare(dist: number): number {
  return Math.min(TAXI.maxFare, Math.round(TAXI.baseFare + TAXI.perUnit * dist));
}

/** Does the segment (ax, az)-(bx, bz) cross the box (slab test)? */
function segHitsRect(ax: number, az: number, bx: number, bz: number, minX: number, maxX: number, minZ: number, maxZ: number): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  let t0 = 0;
  let t1 = 1;
  if (Math.abs(dx) < 1e-9) {
    if (ax < minX || ax > maxX) return false;
  } else {
    let ta = (minX - ax) / dx;
    let tb = (maxX - ax) / dx;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  if (Math.abs(dz) < 1e-9) {
    if (az < minZ || az > maxZ) return false;
  } else {
    let ta = (minZ - az) / dz;
    let tb = (maxZ - az) / dz;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

/** True when the point (x, z) is inside any box grown by `pad` on all sides. */
function inBoxes(boxes: readonly Box[], x: number, z: number, pad: number): boolean {
  return boxes.some((b) => x >= b.minX - pad && x <= b.maxX + pad && z >= b.minZ - pad && z <= b.maxZ + pad);
}

/** True when the segment (ax, az)-(bx, bz) misses every box taller than 0.5, each grown by `pad` on all sides. */
export function segmentClear(boxes: readonly Box[], ax: number, az: number, bx: number, bz: number, pad: number): boolean {
  for (const b of boxes) {
    if (b.h <= 0.5) continue;
    if (segHitsRect(ax, az, bx, bz, b.minX - pad, b.maxX + pad, b.minZ - pad, b.maxZ + pad)) return false;
  }
  return true;
}

const wrapAngle = (a: number): number => {
  let r = a;
  while (r > Math.PI) r -= 2 * Math.PI;
  while (r < -Math.PI) r += 2 * Math.PI;
  return r;
};

/**
 * Turn the vehicle toward (tx, tz) by at most turnRate * dt, then move it along its heading at `speed` without passing
 * the target. Within 3 units of the target it aims straight at it (no turn limit), so it cannot orbit. Returns the
 * remaining distance. Forward is (sin yaw, cos yaw).
 */
export function driveToward(
  v: { x: number; z: number; yaw: number; speed: number }, tx: number, tz: number, speed: number, dt: number, turnRate = 2.4,
): number {
  const dx = tx - v.x;
  const dz = tz - v.z;
  const dist = Math.hypot(dx, dz);
  const want = Math.atan2(dx, dz);
  if (dist < 3) {
    v.yaw = want;
  } else {
    const maxTurn = turnRate * dt;
    const diff = wrapAngle(want - v.yaw);
    v.yaw += Math.max(-maxTurn, Math.min(maxTurn, diff));
  }
  v.speed = speed;
  const step = Math.min(speed * dt, dist);
  v.x += Math.sin(v.yaw) * step;
  v.z += Math.cos(v.yaw) * step;
  return Math.hypot(tx - v.x, tz - v.z);
}

/** Where the taxi appears (x, z, facing yaw) and stops (stopX, stopZ) for a player at (px, pz). */
export function pickApproach(
  boxes: readonly Box[], px: number, pz: number, rand: () => number = Math.random,
  wet: (x: number, z: number) => boolean = (x, z) => waterAt(x, z) !== null,
): { x: number; z: number; yaw: number; stopX: number; stopZ: number } {
  for (const d of TAXI.spawnDists) {
    const start = rand() * 2 * Math.PI;
    for (let k = 0; k < 12; k++) {
      const a = start + (k * 2 * Math.PI) / 12;
      const sx = px + Math.sin(a) * d;
      const sz = pz + Math.cos(a) * d;
      const stx = px + Math.sin(a) * TAXI.stopDist;
      const stz = pz + Math.cos(a) * TAXI.stopDist;
      if (inBoxes(boxes, sx, sz, 2.5) || wet(sx, sz)) continue;
      if (!segmentClear(boxes, sx, sz, stx, stz, 1.6)) continue;
      return { x: sx, z: sz, yaw: Math.atan2(stx - sx, stz - sz), stopX: stx, stopZ: stz };
    }
  }
  const a = rand() * 2 * Math.PI;
  const sx = px + Math.sin(a) * 8;
  const sz = pz + Math.cos(a) * 8;
  const stx = px + Math.sin(a) * TAXI.stopDist;
  const stz = pz + Math.cos(a) * TAXI.stopDist;
  return { x: sx, z: sz, yaw: Math.atan2(stx - sx, stz - sz), stopX: stx, stopZ: stz };
}

/** The drop-off at the stop: the taxi starts at `from` (facing the stop) and rolls to `stop`. */
export function dropSpot(boxes: readonly Box[], spawn: { x: number; z: number }): { from: { x: number; z: number; yaw: number }; stop: { x: number; z: number } } {
  const dirs: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const make = (dx: number, dz: number) => {
    const stop = { x: spawn.x + dx * TAXI.dropOffset, z: spawn.z + dz * TAXI.dropOffset };
    const fx = spawn.x + dx * (TAXI.dropOffset + TAXI.arriveFrom);
    const fz = spawn.z + dz * (TAXI.dropOffset + TAXI.arriveFrom);
    return { from: { x: fx, z: fz, yaw: Math.atan2(stop.x - fx, stop.z - fz) }, stop };
  };
  for (const [dx, dz] of dirs) {
    const spot = make(dx, dz);
    if (inBoxes(boxes, spot.from.x, spot.from.z, 2.5)) continue;
    if (!segmentClear(boxes, spot.from.x, spot.from.z, spot.stop.x, spot.stop.z, 1.6)) continue;
    return spot;
  }
  return make(dirs[0][0], dirs[0][1]);
}

const CSS = `
#gta-taxi-btn{position:fixed;right:calc(env(safe-area-inset-right) + 210px);top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:rgba(20,20,20,.55);color:#fff;font-size:20px;line-height:1;padding:0;cursor:pointer;pointer-events:auto;touch-action:manipulation;}
#gta-taxi-btn.on{border-color:#f2c230;box-shadow:0 0 0 2px rgba(242,194,48,.55);}
#gta-taxi-fade{position:fixed;inset:0;z-index:40;background:#000;pointer-events:none;opacity:0;display:none;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}
#gta-taxi-fade .cap{color:#f2c230;font-weight:800;font-size:18px;text-align:center;padding:12px;}
`;

export function createTaxi(deps: TaxiDeps): Taxi {
  const { world, vehicles, hud, economy } = deps;
  const driver = TAXI.driver;
  let phase: TaxiPhase = 'idle';
  let v: Vehicle | null = null;
  /** Approach stop (where it waits for the gnome). */
  let stop = { x: 0, z: 0 };
  /** Drop-off stop at the Bus Stop kerb. */
  let dropStop = { x: 0, z: 0 };
  let timer = 0;
  /** Ride clock (seconds since the gnome sat down). */
  let t = 0;
  /** Ride clock value when the black-out started, or null before the jump. */
  let blackAt: number | null = null;
  let rideDone = false;
  let fare = 0;

  // ---- UI (guarded so the module can be imported in node) ----
  let btn: HTMLButtonElement | null = null;
  let fadeEl: HTMLDivElement | null = null;
  let captionEl: HTMLDivElement | null = null;
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = CSS;
    deps.ui.appendChild(style);

    btn = document.createElement('button');
    btn.id = 'gta-taxi-btn';
    btn.setAttribute('aria-label', 'Turfton Taxi (Y)');
    btn.title = 'Turfton Taxi (Y)';
    btn.textContent = '🚕';
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', () => toggle());
    deps.ui.appendChild(btn);

    fadeEl = document.createElement('div');
    fadeEl.id = 'gta-taxi-fade';
    captionEl = document.createElement('div');
    captionEl.className = 'cap';
    fadeEl.appendChild(captionEl);
    deps.ui.appendChild(fadeEl);

    window.addEventListener('keydown', (e) => {
      if (e.code !== TAXI.key || e.repeat) return;
      const tag = (e.target as Element | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      toggle();
    });
    window.addEventListener('gta:taxi', () => toggle());
  }

  function syncButton(): void {
    btn?.classList.toggle('on', v !== null);
  }

  function setFade(opacity: number): void {
    if (!fadeEl) return;
    const o = Math.max(0, Math.min(1, opacity));
    fadeEl.style.opacity = String(o);
    fadeEl.style.display = o > 0 ? 'flex' : 'none';
    if (captionEl) captionEl.textContent = `🚕 Turfton Taxi · Meter: ${fare} Acorns`;
  }

  function sendAway(): void {
    if (!v) return;
    // Coming or waiting: turn it round so it drives off away from the player.
    if (phase === 'approach' || phase === 'waiting') v.yaw += Math.PI;
    v.driver = 'none';
    phase = 'leaving';
    timer = 0;
  }

  function removeTaxi(): void {
    if (!v) return;
    const i = vehicles.indexOf(v);
    if (i >= 0) vehicles.splice(i, 1);
    removeVehicle(deps.scene, v);
    v = null;
  }

  function drive(speed: number, dt: number): void {
    if (!v) return;
    v.speed = speed;
    v.x += Math.sin(v.yaw) * speed * dt;
    v.z += Math.cos(v.yaw) * speed * dt;
    v.y = heightAt(v.x, v.z);
  }

  function toggle(): void {
    if (phase === 'approach' || phase === 'waiting') {
      sendAway();
      deps.hud.toast(`${driver}: "Suit yourself, dear."`, 3000);
      return;
    }
    if (phase !== 'idle') return;

    const why = deps.blocked();
    if (why) {
      deps.hud.toast(why, 3500);
      return;
    }
    const p = deps.player();
    const dist = Math.hypot(p.x - world.spawn.x, p.z - world.spawn.z);
    if (dist < TAXI.minTripDist) {
      deps.hud.toast("You're already at the Central Bus Stop.", 3000);
      return;
    }
    const price = taxiFare(dist);
    const acorns = economy.state().acorns;
    if (acorns < price) {
      deps.hud.toast(`Turfton Taxi: the fare to the Bus Stop is ${price} Acorns. You have ${acorns}.`, 4000);
      return;
    }

    const pick = pickApproach(world.boxes, p.x, p.z);
    v = createVehicle(deps.scene, 'taxi', pick.x, pick.z, pick.yaw);
    v.questOwned = true;
    v.y = heightAt(pick.x, pick.z);
    vehicles.push(v);
    stop = { x: pick.stopX, z: pick.stopZ };
    fare = price;
    timer = 0;
    phase = 'approach';
    deps.play('whistle');
    deps.hud.toast(`${driver}: "Turfton Taxi, on my way! Bus Stop fare: ${price} Acorns."`, 4500);
    syncButton();
  }

  function stepRide(dt: number): TaxiEvent {
    if (!v || rideDone) return null;
    t += dt;
    if (blackAt === null) {
      const rideEnd = TAXI.rideOut + TAXI.fadeS;
      if (t < TAXI.rideOut) {
        drive(Math.min(TAXI.rideSpeed, t * 10), dt);
        setFade(0);
        return null;
      }
      if (t < rideEnd) {
        drive(TAXI.rideSpeed, dt);
        setFade((t - TAXI.rideOut) / TAXI.fadeS);
        return null;
      }
      // Black: jump to the drop-off, out of sight.
      const spot = dropSpot(world.boxes, world.spawn);
      v.x = spot.from.x;
      v.z = spot.from.z;
      v.yaw = spot.from.yaw;
      v.y = heightAt(v.x, v.z);
      v.speed = 0;
      dropStop = spot.stop;
      blackAt = t;
      setFade(1);
      return 'jump';
    }
    const arriveStart = blackAt + TAXI.blackS;
    if (t < arriveStart) {
      setFade(1);
      return null;
    }
    const el = t - arriveStart;
    setFade(1 - el / TAXI.fadeS);
    const d0 = Math.hypot(dropStop.x - v.x, dropStop.z - v.z);
    const speed = Math.min(TAXI.rideSpeed, Math.max(3, d0 / Math.max(0.3, TAXI.arriveS - el)));
    const rem = driveToward(v, dropStop.x, dropStop.z, speed, dt);
    if (rem < 0.4 || el > TAXI.arriveS + 1.5) {
      v.x = dropStop.x;
      v.z = dropStop.z;
      v.y = heightAt(v.x, v.z);
      v.speed = 0;
      setFade(0);
      rideDone = true;
      deps.onDropOff();
      deps.hud.toast(`${driver}: "Central Bus Stop. Mind the NO LOITERING stencil."`, 4500);
      return 'dropoff';
    }
    return null;
  }

  return {
    phase: () => phase,
    vehicle: () => v,
    toggle,
    boardable: () => (phase === 'waiting' ? v : null),
    onSeated(seated: Vehicle): boolean {
      if (!v || seated !== v || phase !== 'waiting') return false;
      fare = taxiFare(Math.hypot(v.x - world.spawn.x, v.z - world.spawn.z));
      if (!economy.spend(fare, 'Turfton Taxi')) {
        deps.hud.toast(`${driver}: "Short? This one's on the meter."`, 3500);
      }
      phase = 'ride';
      t = 0;
      blackAt = null;
      rideDone = false;
      deps.hud.toast(`${driver}: "Central Bus Stop. Sit tight."`, 3500);
      return true;
    },
    riding: () => phase === 'ride' && !rideDone,
    update(dt: number): TaxiEvent {
      syncButton();
      if (!v || phase === 'idle') return null;

      if (phase === 'approach' || phase === 'waiting') {
        const why = deps.blocked();
        if (why !== null) {
          sendAway();
          deps.hud.toast(`${driver} won't wait around for that.`, 3500);
          return null;
        }
      }

      if (phase === 'approach') {
        timer += dt;
        const d0 = Math.hypot(stop.x - v.x, stop.z - v.z);
        const rem = driveToward(v, stop.x, stop.z, Math.min(TAXI.approachSpeed, d0 * 2 + 2), dt);
        v.y = heightAt(v.x, v.z);
        if (rem < 0.6 || timer > TAXI.approachTimeout) {
          v.x = stop.x;
          v.z = stop.z;
          v.y = heightAt(v.x, v.z);
          v.speed = 0;
          phase = 'waiting';
          timer = 0;
          deps.hud.toast(`${driver}: "Hop in, dear. Meter's already running."`, 4000);
        }
        return null;
      }

      if (phase === 'waiting') {
        timer += dt;
        const p = deps.player();
        if (timer > TAXI.waitSeconds || Math.hypot(p.x - v.x, p.z - v.z) > TAXI.leaveDist) {
          sendAway();
          deps.hud.toast(`${driver} gave up waiting.`, 3500);
        }
        return null;
      }

      if (phase === 'ride') return stepRide(dt);

      if (phase === 'leaving') {
        timer += dt;
        drive(12, dt);
        if (timer >= TAXI.leaveSeconds) {
          removeTaxi();
          phase = 'idle';
          syncButton();
        }
      }
      return null;
    },
    onStood(out: Vehicle): boolean {
      if (!v || out !== v) return false;
      v.driver = 'none';
      phase = 'leaving';
      timer = 0;
      setFade(0);
      return true;
    },
    blips(): Blip[] {
      if (!v || (phase !== 'approach' && phase !== 'waiting')) return [];
      return [{ x: v.x, z: v.z, color: '#f2c230', quest: 'Turfton Taxi', kind: 'taxi' }];
    },
    cancel(): void {
      removeTaxi();
      phase = 'idle';
      t = 0;
      blackAt = null;
      rideDone = false;
      setFade(0);
      syncButton();
    },
  };
}
