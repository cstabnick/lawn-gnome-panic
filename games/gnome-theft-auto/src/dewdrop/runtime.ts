// The Dewdrop at runtime (E18, L54): once the series is done (bubbleUnlocked), the player's ball waits at DEWDROP_BAY
// by Hogweed's workshop (respawned there if it is lost), a "Buy a Dewdrop (400)" spot at the workshop sells a replacement,
// and Hamster Hour counts seconds in a row inside the ball.
import type { JobsDeps } from '../jobs/types';
import type { Vehicle } from '../types';
import { createVehicle, removeVehicle } from '../vehicles';
import { addInteractSpot } from '../interactables';
import { UNDERSPAN } from '../societies/config';
import { DEWDROP_ACH, DEWDROP_BAY, DEWDROP_KIND, DEWDROP_PRICE, HAMSTER_HOUR_SECONDS, bubbleUnlocked } from './config';

export interface Dewdrop {
  update(dt: number): void;
}

/** Hamster Hour counter: seconds in a row inside the ball, and whether it has already fired this session. */
export interface HamsterState {
  t: number;
  fired: boolean;
}

/**
 * Advance Hamster Hour by one frame. Leaving the ball resets the run. Returns true only on the frame it fires (once per session).
 */
export function hamsterStep(state: HamsterState, inBall: boolean, dt: number): boolean {
  if (!inBall) {
    state.t = 0;
    return false;
  }
  state.t += dt;
  if (!state.fired && state.t >= HAMSTER_HOUR_SECONDS) {
    state.fired = true;
    return true;
  }
  return false;
}

const SPAWN_CHECK_S = 1;
/** Only respawn a ball when the player is at least this far from the bay (never pop it in under their nose). */
const SPAWN_MIN_PLAYER_DIST = 40;
/** A ball within this distance of the bay counts as "the bay's ball". */
const BAY_RADIUS = 60;
/** A ball this far from the bay and empty for LOST_EMPTY_S is removed so it respawns. */
const LOST_DIST = 400;
const LOST_EMPTY_S = 120;
const TOAST_MS = 3500;

function wrecked(v: Vehicle): boolean {
  return !!v.exploded || v.hp <= 0;
}

function distTo(v: { x: number; z: number }, p: { x: number; z: number }): number {
  return Math.hypot(v.x - p.x, v.z - p.z);
}

export function installDewdrop(deps: JobsDeps): Dewdrop {
  const bay = { x: DEWDROP_BAY.x, z: DEWDROP_BAY.z };
  const hamster: HamsterState = { t: 0, fired: false };
  let spawned: Vehicle | null = null;
  let firstCheck = true;
  let checkT = 0;
  let emptyT = 0;
  let spotAdded = false;

  function balls(): Vehicle[] {
    return deps.vehicles.filter((v) => v.kind === DEWDROP_KIND);
  }

  function drop(v: Vehicle): void {
    const i = deps.vehicles.indexOf(v);
    if (i >= 0) deps.vehicles.splice(i, 1);
    removeVehicle(deps.scene, v);
    if (spawned === v) spawned = null;
  }

  function spawnBall(): Vehicle {
    const v = createVehicle(deps.scene, DEWDROP_KIND, DEWDROP_BAY.x, DEWDROP_BAY.z, DEWDROP_BAY.yaw);
    deps.vehicles.push(v);
    spawned = v;
    emptyT = 0;
    return v;
  }

  function addSpot(): void {
    spotAdded = true;
    addInteractSpot({
      x: UNDERSPAN.workshopDoor.x - 2,
      z: UNDERSPAN.workshopDoor.z,
      prompt: `Buy a Dewdrop (${DEWDROP_PRICE} Acorns)`,
      run(_player, d) {
        if (!d.economy.spend(DEWDROP_PRICE, 'Dewdrop')) {
          d.hud.toast(`A new Dewdrop is ${DEWDROP_PRICE} Acorns. Hogweed does not do credit.`, TOAST_MS);
          return false;
        }
        // Replace the bay's ball with a fresh one (never the one the player is driving).
        for (const b of balls()) {
          if (b.driver !== 'player' && distTo(b, bay) <= BAY_RADIUS) drop(b);
        }
        spawnBall();
        d.hud.toast('Hogweed signs another form. Underlined twice.', TOAST_MS);
        return true;
      },
    });
  }

  function check(): void {
    if (!bubbleUnlocked()) return;
    if (!spotAdded) addSpot();

    // Our own ball: drop it when wrecked, or when it has been lost far away and empty for a while.
    if (spawned) {
      if (wrecked(spawned)) {
        drop(spawned);
      } else if (spawned.driver !== 'player' && distTo(spawned, bay) > LOST_DIST) {
        emptyT += SPAWN_CHECK_S;
        if (emptyT >= LOST_EMPTY_S) drop(spawned);
      } else {
        emptyT = 0;
      }
    }

    const driving = deps.player.vehicle?.kind === DEWDROP_KIND;
    const haveOne = balls().some((v) => !wrecked(v) && distTo(v, bay) <= BAY_RADIUS);
    const first = firstCheck;
    firstCheck = false;
    if (haveOne || driving) return;
    const playerFar = distTo(deps.player, bay) > SPAWN_MIN_PLAYER_DIST;
    if (first || playerFar) spawnBall();
  }

  return {
    update(dt: number): void {
      checkT += dt;
      if (checkT >= SPAWN_CHECK_S) {
        checkT = 0;
        check();
      }
      const inBall = deps.player.vehicle?.kind === DEWDROP_KIND;
      if (hamsterStep(hamster, inBall, dt)) deps.unlock(DEWDROP_ACH.hamsterHour);
    },
  };
}
