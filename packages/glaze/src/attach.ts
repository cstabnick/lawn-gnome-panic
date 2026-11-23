// attachLoadout: dress a built prefab vehicle in a Loadout and keep it dressed. The one entry point a game needs.
//
// Lifecycle:
//   const body = buildGlazeBody(prefabId, { scale, damage });  // built white, tint parts separable
//   const rig = attachLoadout(body, prefabId, loadout);         // dresses the body; then scene.add(body)
//   each frame:  rig.update(dt)
//   on damage:   setPrefabDamage(body, level); rig.apply();     // setPrefabDamage rebuilds the root's children, so re-dress them
//   on change:   rig.set(nextLoadout);                          // re-applies the whole loadout
//
// apply() is idempotent. It first unwraps what an earlier apply did (the 'glaze-shell', the 'glaze-ground' group, the lights),
// then dresses the body again. The shell holds every part of the body except the four wheel pivots, so the ride height moves
// the body but not the wheels. The ground fittings (underglow) stay on the root and do not ride.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { buildDecals } from './decals';
import { buildFittings, type FittingsBuild } from './fittings';
import { buildLamps } from './lamps';
import { getMounts } from './mounts';
import { paintBody } from './paint';
import { normalizeLoadout } from './loadout';
import { applySteer, resolveBodyPrefab } from './steer';
import { applyWheels, type WheelResult } from './wheels';
import type { GlazeBodyOptions, GlazeRig, Loadout, SuspensionState } from './types';

/** Largest body-shell travel for rideHeight -1 / +1, prefab units. */
export const RIDE_TRAVEL = { down: 0.14, up: 0.2 } as const;

/** How far the body may sink on its wheels for rideHeight -1: 0.2 of the biggest stock wheel radius (a body slammed to hub height swallows the wheels), at most RIDE_TRAVEL.down; a vehicle with no measurable wheels gets RIDE_TRAVEL.down. */
export function maxDrop(wheels: WheelResult): number {
  let r = 0;
  for (const w of wheels.wheels) {
    const s = (w?.userData.glazeStock as { radius?: number } | undefined)?.radius;
    if (typeof s === 'number' && Number.isFinite(s)) r = Math.max(r, s);
  }
  return r > 0 ? Math.min(RIDE_TRAVEL.down, Math.max(0.03, 0.2 * r)) : RIDE_TRAVEL.down;
}

const SHELL = 'glaze-shell';
const GROUND = 'glaze-ground';
const WHEEL_NAMES = new Set(['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3']);

/**
 * Build a prefab ready for a rig: the registered steer variant of `prefabId` when there is one, built at tint 0xffffff with `separateTint: true`
 * (so the rig can paint it any colour and finish without rebuilding), at `opts.scale` and `opts.damage`.
 */
export function buildGlazeBody(prefabId: string, opts: GlazeBodyOptions = {}): THREE.Group {
  return buildPrefab(resolveBodyPrefab(prefabId), { scale: opts.scale, tint: 0xffffff, separateTint: true, damage: opts.damage });
}

/**
 * Dress `root` (from buildGlazeBody) in `loadout` and return the rig. `prefabId` is the BASE prefab id (mounts are looked up by it).
 * The rig re-applies everything in `apply()`; call it after setPrefabDamage(root, level) because that rebuilds the root's children.
 */
export function attachLoadout(root: THREE.Group, prefabId: string, loadout: Loadout): GlazeRig {
  let current = normalizeLoadout(loadout);
  const lights = new THREE.Group();
  lights.visible = false;

  // Parts the rig made that live in the shell (housings, fittings, decals). Dropped on unwrap and made again by apply().
  let owned: THREE.Object3D[] = [];
  let wheelResult: WheelResult = { lift: 0, wheels: [], spinners: [] };
  let fittings: FittingsBuild | null = null;
  // Ride height from the loadout and wheels, the seat scale, and the body's spring state (set by setSuspension).
  let rideOffset = 0;
  let seatScale = 1;
  let suspension: SuspensionState = { heave: 0, pitch: 0, roll: 0 };
  let shellGroup: THREE.Group | null = null;
  let gripMarkers: { left: THREE.Object3D; right: THREE.Object3D } | null = null;

  /** Put the body's own children back on the root and remove the rig's shell, ground group and lights. */
  function unwrap(): void {
    const old = root.children.find((c) => c.name === SHELL);
    if (old) {
      for (const child of [...old.children]) {
        if (child === lights || owned.includes(child)) continue;
        root.attach(child);
      }
      root.remove(old);
    }
    for (const ground of root.children.filter((c) => c.name === GROUND)) root.remove(ground);
    lights.removeFromParent();
    owned = [];
  }

  /** Place the shell: heave moves it up and down; pitch and roll tilt it about the body origin (a few hundredths of a radian, so the off-centre pivot is invisible). */
  function placeShell(): void {
    if (!shellGroup) return;
    shellGroup.position.set(0, rideOffset + suspension.heave, 0);
    // SuspensionState pitch is + = nose up; three.js rotation.x is + = nose down, hence the sign.
    shellGroup.rotation.set(-suspension.pitch, 0, suspension.roll);
  }

  function apply(): void {
    unwrap();
    // Mounts are read before anything is added, so the bounding box is the bare body.
    const mounts = getMounts(prefabId, root);
    paintBody(root, current);
    wheelResult = applyWheels(root, mounts, current);
    gripMarkers = applySteer(root, mounts, current).grips;

    const shell = new THREE.Group();
    shell.name = SHELL;
    shellGroup = shell;
    for (const child of [...root.children]) {
      if (!WHEEL_NAMES.has(child.name)) shell.add(child);
    }
    root.add(shell);

    const rideTravel = current.rideHeight < 0 ? current.rideHeight * maxDrop(wheelResult) : current.rideHeight * RIDE_TRAVEL.up;
    rideOffset = rideTravel + wheelResult.lift;
    seatScale = root.scale.y;

    const lamps = buildLamps(mounts, current);
    if (lamps.housings) {
      shell.add(lamps.housings);
      owned.push(lamps.housings);
    }
    lights.clear();
    if (lamps.beams) {
      for (const beam of [...lamps.beams.children]) lights.add(beam);
    }
    shell.add(lights);

    const fit = buildFittings(mounts, current);
    fit.ground.name = GROUND;
    shell.add(fit.group);
    owned.push(fit.group);
    root.add(fit.ground);
    fittings = fit;

    const decals = buildDecals(mounts, current);
    if (decals) {
      shell.add(decals);
      owned.push(decals);
    }
    placeShell();
  }

  const rig: GlazeRig = {
    prefabId,
    get loadout() { return current; },
    set(next) {
      current = normalizeLoadout(next);
      apply();
    },
    apply,
    camberOf(wheel) {
      if (!Number.isInteger(wheel) || wheel < 0 || wheel > 3) return 0;
      return (wheel >= 2 ? current.camberFront : current.camberRear) * Math.PI / 180;
    },
    get seatLift() { return (rideOffset + suspension.heave) * seatScale; },
    lights,
    setLightsOn(on) { lights.visible = on; },
    get grips() { return gripMarkers; },
    setSuspension(s) {
      suspension = { heave: s.heave, pitch: s.pitch, roll: s.roll };
      placeShell();
    },
    update(dt) {
      fittings?.update(dt);
      for (const spinner of wheelResult.spinners) spinner.object.rotation.x += spinner.rate * dt;
    },
    dispose() { unwrap(); },
  };

  apply();
  return rig;
}
