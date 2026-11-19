// Guns: four real guns (pistol, SMG, shotgun, rifle) with magazines and reloads. Bullets are hitscan rays from the
// crosshair, so what is under the crosshair is what gets hit, at any range. See Weapons in types.ts.
import * as THREE from 'three';
import { buildHeld } from '@lawn/prefabs';
import { insideBox } from './collide';
import { BULLET, GUNS, GUN_ORDER, type GunSpec } from './config';
import type { Fx, GunKind, HitTest, Weapons, World } from './types';

/** Pellets beyond this many draw no tracer (keeps a shotgun blast readable, not noisy). */
const TRACER_PELLETS = 3;

// Module-level scratch vectors: nothing allocates per bullet.
const scratchSpread = new THREE.Vector3();
const scratchDir = new THREE.Vector3();
const scratchOrigin = new THREE.Vector3();
const scratchDelta = new THREE.Vector3();
const scratchP = new THREE.Vector3();
const scratchEnd = new THREE.Vector3();

/** A uniformly random unit vector, written into `out`. */
function randomUnit(out: THREE.Vector3): THREE.Vector3 {
  const z = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return out.set(r * Math.cos(a), r * Math.sin(a), z);
}

/**
 * Fire one bullet from the crosshair. The ray starts at the muzzle's depth along the crosshair line (so the gnome's
 * own body is skipped) and marches along camDir plus the gun's spread. Returns true when it hit something hittable.
 */
function fireBullet(
  spec: GunSpec, tracer: boolean, fx: Fx, muzzle: THREE.Vector3, camOrigin: THREE.Vector3,
  camDir: THREE.Vector3, hitTest: HitTest, world: World,
): boolean {
  randomUnit(scratchSpread);
  scratchDir.copy(camDir).addScaledVector(scratchSpread, spec.spread).normalize();

  const t0 = Math.max(0, scratchDelta.subVectors(muzzle, camOrigin).dot(camDir));
  scratchOrigin.copy(camOrigin).addScaledVector(camDir, t0);

  // Default end: the full range, unless something stops the bullet first.
  scratchEnd.copy(scratchOrigin).addScaledVector(scratchDir, spec.range);
  let hittable = false;

  for (let s = 0; s <= spec.range; s += BULLET.stepLength) {
    scratchP.copy(scratchOrigin).addScaledVector(scratchDir, s);
    const x = scratchP.x;
    const y = scratchP.y;
    const z = scratchP.z;
    if (y <= 0) {
      fx.spark(x, y, z);
      scratchEnd.copy(scratchP);
      break;
    }
    if (insideBox(x, y, z, world.boxes)) {
      fx.spark(x, y, z);
      scratchEnd.copy(scratchP);
      break;
    }
    if (hitTest(x, y, z)) {
      scratchEnd.copy(scratchP);
      hittable = true;
      break;
    }
  }

  if (tracer) fx.tracer(muzzle.x, muzzle.y, muzzle.z, scratchEnd.x, scratchEnd.y, scratchEnd.z);
  return hittable;
}

export function createWeapons(_scene: THREE.Scene, fx: Fx): Weapons {
  const ammoOf: Record<GunKind, number> = {
    pistol: GUNS.pistol.mag,
    smg: GUNS.smg.mag,
    shotgun: GUNS.shotgun.mag,
    rifle: GUNS.rifle.mag,
  };
  let hand: THREE.Object3D | null = null;
  let held: THREE.Group | null = null;
  let visible = true;
  let cooldown = 0;
  let reloadLeft = 0;
  let prevTrigger = false;

  const w: Weapons = {
    gun: 'pistol',
    ammo: ammoOf.pistol,
    mag: GUNS.pistol.mag,
    reloading: false,
    attachTo(h: THREE.Object3D) {
      hand = h;
      if (held) h.add(held);
    },
    setVisible(v: boolean) {
      visible = v;
      if (held) held.visible = v;
    },
    switchGun() {
      const next = GUN_ORDER[(GUN_ORDER.indexOf(w.gun) + 1) % GUN_ORDER.length];
      cancelReload();
      w.gun = next;
      w.mag = GUNS[next].mag;
      w.ammo = ammoOf[next];
      rebuildHeld();
    },
    reload() {
      startReload();
    },
    update(dt, trigger, muzzle, camOrigin, camDir, hitTest, world) {
      if (cooldown > 0) cooldown = Math.max(0, cooldown - dt);
      if (w.reloading) {
        reloadLeft -= dt;
        if (reloadLeft <= 0) {
          reloadLeft = 0;
          w.reloading = false;
          setAmmo(w.mag);
        }
      }

      const rising = trigger && !prevTrigger;
      prevTrigger = trigger;
      if (w.reloading) return 0;

      // Trigger down on an empty magazine: reload instead of firing.
      if (trigger && w.ammo <= 0) {
        startReload();
        return 0;
      }

      const spec = GUNS[w.gun];
      const wants = spec.auto ? trigger : rising;
      if (!wants || cooldown > 0 || w.ammo <= 0) return 0;

      cooldown = 1 / spec.rate;
      setAmmo(w.ammo - 1);
      fx.flash(muzzle.x, muzzle.y, muzzle.z);

      let hits = 0;
      for (let p = 0; p < spec.pellets; p++) {
        const tracer = p < TRACER_PELLETS;
        if (fireBullet(spec, tracer, fx, muzzle, camOrigin, camDir, hitTest, world)) hits++;
      }

      if (w.ammo <= 0) startReload();
      return hits;
    },
  };

  /** Set the rounds for the current gun, remembering them per gun. */
  function setAmmo(n: number): void {
    w.ammo = n;
    ammoOf[w.gun] = n;
  }

  function startReload(): void {
    if (w.reloading || w.ammo >= w.mag) return;
    w.reloading = true;
    reloadLeft = GUNS[w.gun].reload;
  }

  function cancelReload(): void {
    w.reloading = false;
    reloadLeft = 0;
  }

  /** Rebuild the held model for the current gun and put it on the hand. */
  function rebuildHeld(): void {
    if (held) held.removeFromParent();
    held = buildHeld(GUNS[w.gun].prefab);
    held.position.set(0, -0.32, 0.02);
    // The prefab's muzzle is +y; the arm points along its local -y and is raised forward, so this points the muzzle
    // forward.
    held.rotation.x = Math.PI;
    held.visible = visible;
    if (hand) hand.add(held);
  }

  rebuildHeld();
  return w;
}
