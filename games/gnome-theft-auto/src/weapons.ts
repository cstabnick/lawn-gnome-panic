// Guns & garden-scale mayhem arsenal: four hitscan guns + five comedy weapons (Leaf-Blower Cannon, Acorn Mortar,
// Tow-Cable Whip, Dandelion Puff-Grenade, Acorn Trip-Mine). See Weapons in types.ts.
// All guns are free and unlocked; Ammu-Gnation sells mods, not guns.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { GnomeModel } from '@lawn/gnome';
import { insideBox } from './collide';
import { BULLET, GUNS, GUN_ORDER, type GunSpec } from './config';
import { AIM, moddedGun, normalizeGunLoadout, type GunLoadout, type ModdedGun } from './gunMods';
import { buildModdedGun } from './gunRig';
import { clearGunArms, muzzleWorld as gunMuzzle, placeInHand, poseGunArms } from './gunHold';
import { aboveGround, heightAt } from './terrain';
import { damageVehicle } from './vehicles';
import type { Fx, GunKind, HitTest, WeaponContext, Weapons, World } from './types';

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
  spec: GunSpec, spread: number, tracer: boolean, fx: Fx, muzzle: THREE.Vector3, camOrigin: THREE.Vector3,
  camDir: THREE.Vector3, hitTest: HitTest, world: World,
): boolean {
  randomUnit(scratchSpread);
  scratchDir.copy(camDir).addScaledVector(scratchSpread, spread).normalize();

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
    if (y <= heightAt(x, z)) {
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

interface ArcProjectile {
  kind: 'mortar' | 'dandelion';
  mesh: THREE.Mesh;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
}

interface PlacedMine {
  mesh: THREE.Object3D;
  x: number; z: number;
  armedIn: number;
}

const MAX_MINES = 3;
const MORTAR_GEO = new THREE.SphereGeometry(0.16, 8, 6);
const MORTAR_MAT = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
const DANDELION_GEO = new THREE.SphereGeometry(0.18, 8, 6);
const DANDELION_MAT = new THREE.MeshLambertMaterial({ color: 0xfafaf2 });

export function createWeapons(scene: THREE.Scene, fx: Fx): Weapons {
  // Each gun's fitted mods and the numbers they give (rate, spread, mag, ...), filled for every gun up front.
  const loadouts = {} as Record<GunKind, GunLoadout>;
  const specs = {} as Record<GunKind, ModdedGun>;
  for (const kind of GUN_ORDER) {
    loadouts[kind] = {};
    specs[kind] = moddedGun(kind, {});
  }
  const ammoBy = {} as Record<GunKind, number>;
  for (const kind of GUN_ORDER) ammoBy[kind] = specs[kind].mag;
  const unlocked = new Set<GunKind>(GUN_ORDER);
  const projectiles: ArcProjectile[] = [];
  const mines: PlacedMine[] = [];
  let hand: THREE.Object3D | null = null;
  let held: THREE.Group | null = null;
  let visible = true;
  let posed = false;
  let cooldown = 0;
  let reloadLeft = 0;
  let prevTrigger = false;
  let aimT = 0;
  /** The mods shown on the held gun instead of the fitted ones (the Mod Kit's live preview); null = fitted. */
  let previewMods: GunLoadout | null = null;

  const w: Weapons = {
    gun: 'pistol',
    ammo: ammoBy.pistol,
    mag: specs.pistol.mag,
    reloading: false,
    attachTo(h: THREE.Object3D) {
      hand = h;
      if (held) placeInHand(held, GUNS[w.gun].prefab, h);
    },
    poseArms(model: GnomeModel, aiming: boolean, pitch: number) {
      if (!held || !visible) return;
      poseGunArms(model, GUNS[w.gun].prefab, { aiming, pitch }, held);
      posed = true;
    },
    relaxArms(model: GnomeModel) {
      if (!posed) return;
      posed = false;
      clearGunArms(model, held);
    },
    muzzleWorld(out: THREE.Vector3) {
      if (!held) return false;
      gunMuzzle(held, out);
      return true;
    },
    setVisible(v: boolean) {
      visible = v;
      if (held) held.visible = v;
    },
    // Kept for callers; every gun is already unlocked from the start.
    unlock(kind: GunKind) {
      unlocked.add(kind);
    },
    selectGun(kind: GunKind) {
      if (!unlocked.has(kind)) unlocked.add(kind);
      if (w.gun === kind) return;
      cancelReload();
      w.gun = kind;
      w.mag = specs[kind].mag;
      w.ammo = ammoBy[kind];
      previewMods = null;
      rebuildHeld();
    },
    switchGun() {
      const idx = GUN_ORDER.indexOf(w.gun);
      for (let i = 1; i <= GUN_ORDER.length; i++) {
        const next = GUN_ORDER[(idx + i) % GUN_ORDER.length];
        if (unlocked.has(next)) {
          w.selectGun(next);
          return;
        }
      }
    },
    reload() {
      startReload();
    },
    spec() {
      return specs[w.gun];
    },
    setLoadout(kind: GunKind, mods: GunLoadout) {
      loadouts[kind] = normalizeGunLoadout(kind, mods);
      const before = specs[kind];
      specs[kind] = moddedGun(kind, loadouts[kind]);
      // A full magazine stays full at the new size; a partly used one keeps its rounds (clamped to the new size).
      const newMag = specs[kind].mag;
      ammoBy[kind] = ammoBy[kind] >= before.mag ? newMag : Math.min(ammoBy[kind], newMag);
      if (kind === w.gun) {
        w.mag = newMag;
        w.ammo = ammoBy[kind];
        previewMods = null;
        rebuildHeld();
      }
    },
    loadoutOf(kind: GunKind): GunLoadout {
      return { ...loadouts[kind] };
    },
    previewLoadout(kind: GunKind, mods: GunLoadout | null): void {
      w.selectGun(kind);
      previewMods = mods ? normalizeGunLoadout(kind, mods) : null;
      rebuildHeld();
    },
    ammoOf(kind: GunKind): number {
      return kind === w.gun ? w.ammo : ammoBy[kind];
    },
    setAim(t: number) {
      aimT = Math.max(0, Math.min(1, t));
    },
    update(dt, trigger, muzzle, camOrigin, camDir, hitTest, world, ctx) {
      stepProjectiles(dt, world, ctx);
      stepMines(dt, ctx);

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

      const spec = specs[w.gun];
      const wants = spec.auto ? trigger : rising;
      if (!wants || cooldown > 0 || w.ammo <= 0) return 0;

      cooldown = 1 / spec.rate;
      setAmmo(w.ammo - 1);

      let hits = 0;
      if (w.gun === 'leaf-blower') {
        hits = fireLeafBlower(muzzle, camDir, ctx);
      } else if (w.gun === 'acorn-mortar') {
        spawnProjectile('mortar', muzzle, camDir);
      } else if (w.gun === 'tow-whip') {
        hits = fireTowWhip(muzzle, camDir, hitTest, ctx);
      } else if (w.gun === 'dandelion-grenade') {
        spawnProjectile('dandelion', muzzle, camDir);
      } else if (w.gun === 'trip-mine') {
        placeMine(muzzle, camDir);
      } else {
        fx.flash(muzzle.x, muzzle.y, muzzle.z);
        // Aiming shrinks the spread toward AIM.spreadMul of the hip-fire spread.
        const spread = spec.spread * (1 + (AIM.spreadMul - 1) * aimT);
        for (let p = 0; p < spec.pellets; p++) {
          const tracer = p < TRACER_PELLETS;
          if (fireBullet(spec, spread, tracer, fx, muzzle, camOrigin, camDir, hitTest, world)) hits++;
        }
      }

      if (w.ammo <= 0) startReload();
      return hits;
    },
  };

  function fireLeafBlower(muzzle: THREE.Vector3, camDir: THREE.Vector3, ctx?: WeaponContext): number {
    const hLen = Math.hypot(camDir.x, camDir.z) || 1;
    const dx = camDir.x / hLen;
    const dz = camDir.z / hLen;
    fx.airBlast(muzzle.x, muzzle.y, muzzle.z, dx, dz);
    if (!ctx) return 0;

    let hits = 0;
    for (const n of ctx.npcs.list) {
      const rx = n.x - muzzle.x;
      const rz = n.z - muzzle.z;
      const d = Math.hypot(rx, rz);
      if (d > 16 || d < 0.1) continue;
      const dot = (rx * dx + rz * dz) / d;
      if (dot < 0.7) continue;
      const force = 12 + (1 - d / 16) * 8;
      ctx.npcs.knock(n, (rx / d) * force, 5 + Math.random() * 3, (rz / d) * force, (Math.random() - 0.5) * 8, muzzle.x, muzzle.z);
      hits++;
    }
    hits += ctx.watch.knockArea?.(muzzle.x + dx * 6, muzzle.z + dz * 6, 10, 14, 6, muzzle.x, muzzle.z) ?? 0;
    for (const v of ctx.vehicles) {
      if (v.driver === 'player' || v.exploded || v.spec.mass > 5) continue;
      const rx = v.x - muzzle.x;
      const rz = v.z - muzzle.z;
      const d = Math.hypot(rx, rz);
      if (d > 16 || d < 0.2) continue;
      const dot = (rx * dx + rz * dz) / d;
      if (dot < 0.7) continue;
      const push = (14 / Math.max(1, v.spec.mass)) * (1 - d / 18);
      const k = v.knock ?? (v.knock = { x: 0, z: 0, spin: 0 });
      k.x += (rx / d) * push;
      k.z += (rz / d) * push;
      k.spin += (Math.random() - 0.5) * 1.5;
      hits++;
    }
    return hits;
  }

  function fireTowWhip(muzzle: THREE.Vector3, camDir: THREE.Vector3, hitTest: HitTest, ctx?: WeaponContext): number {
    const hLen = Math.hypot(camDir.x, camDir.z) || 1;
    const dx = camDir.x / hLen;
    const dz = camDir.z / hLen;
    fx.tracer(muzzle.x, muzzle.y, muzzle.z, muzzle.x + dx * 5, Math.max(0.4, muzzle.y + camDir.y * 5), muzzle.z + dz * 5);
    let hits = 0;

    // Sample along the 5-unit whip arc for hitTest (officers, remotes, etc.).
    for (let s = 0.8; s <= 5; s += 0.7) {
      const px = muzzle.x + camDir.x * s;
      const py = Math.max(0.2, muzzle.y + camDir.y * s);
      const pz = muzzle.z + camDir.z * s;
      if (hitTest(px, py, pz)) { hits++; break; }
    }

    if (!ctx) return hits;
    for (const n of ctx.npcs.list) {
      const rx = n.x - muzzle.x;
      const rz = n.z - muzzle.z;
      const d = Math.hypot(rx, rz);
      if (d > 5 || d < 0.1) continue;
      if ((rx * dx + rz * dz) / d < 0.45) continue;
      ctx.npcs.knock(n, -dx * 8, 4.5, -dz * 8, 6, muzzle.x, muzzle.z);
      hits++;
    }
    hits += ctx.watch.knockArea?.(muzzle.x + dx * 2.5, muzzle.z + dz * 2.5, 3.5, 8, 4.5, muzzle.x, muzzle.z) ?? 0;
    for (const v of ctx.vehicles) {
      if (v.driver === 'player' || v.exploded) continue;
      const rx = v.x - muzzle.x;
      const rz = v.z - muzzle.z;
      const d = Math.hypot(rx, rz);
      if (d > 5 + v.spec.radius) continue;
      if (d > 0.2 && (rx * dx + rz * dz) / d < 0.35) continue;
      if (v.driver === 'npc') {
        const out = ctx.traffic.ejectDriver(v);
        if (out) {
          ctx.npcs.spawnFleeing(out.x, out.z, muzzle.x, muzzle.z, out.look);
          ctx.onToast?.('Yanked right off the seat!');
        }
      }
      const dmg = v.kind === 'hoa-van' ? 0.35 : 0.25;
      damageVehicle(v, dmg);
      fx.spark(v.x, v.y + 0.8, v.z);
      if (v.hp <= 0) ctx.onBlowUp?.(v);
      hits++;
    }
    return hits;
  }

  function spawnProjectile(kind: ArcProjectile['kind'], muzzle: THREE.Vector3, camDir: THREE.Vector3): void {
    const speed = kind === 'mortar' ? 24 : 16;
    const up = kind === 'mortar' ? 10 : 6;
    const mesh = new THREE.Mesh(
      kind === 'mortar' ? MORTAR_GEO : DANDELION_GEO,
      kind === 'mortar' ? MORTAR_MAT : DANDELION_MAT,
    );
    mesh.position.copy(muzzle);
    scene.add(mesh);
    projectiles.push({
      kind, mesh,
      x: muzzle.x, y: muzzle.y, z: muzzle.z,
      vx: camDir.x * speed, vy: camDir.y * speed + up, vz: camDir.z * speed,
      life: 5,
    });
  }

  function detonateProjectile(p: ArcProjectile, ctx?: WeaponContext): void {
    if (p.kind === 'mortar') {
      fx.explode(p.x, Math.max(0.2, p.y), p.z);
      ctx?.onPlay?.('boom');
      if (ctx) {
        for (const n of ctx.npcs.list) {
          const rx = n.x - p.x;
          const rz = n.z - p.z;
          const d = Math.hypot(rx, rz);
          if (d <= 6) {
            const nx = d > 0.05 ? rx / d : 1;
            const nz = d > 0.05 ? rz / d : 0;
            ctx.npcs.knock(n, nx * 10, 6.5, nz * 10, 7, p.x, p.z);
          }
        }
        ctx.watch.knockArea?.(p.x, p.z, 6, 11, 6.5, p.x, p.z);
        for (const v of ctx.vehicles) {
          if (v.driver === 'player' || v.exploded) continue;
          const d = Math.hypot(v.x - p.x, v.z - p.z);
          if (d <= 6 + v.spec.radius) {
            damageVehicle(v, 0.35);
            if (v.hp <= 0) ctx.onBlowUp?.(v);
          }
        }
      }
    } else {
      fx.dandelionCloud(p.x, Math.max(0.1, p.y), p.z);
      ctx?.onPlay?.('chute');
      if (ctx) {
        const sneezed = ctx.watch.onSneeze(p.x, p.z, 8);
        if (sneezed > 0) ctx.onToast?.(`Dandelion puff! ${sneezed} officer${sneezed > 1 ? 's' : ''} sneezing!`);
      }
    }
  }

  function stepProjectiles(dt: number, world: World, ctx?: WeaponContext): void {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      const g = p.kind === 'mortar' ? 20 : 18;
      p.vy -= g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);

      let hit = aboveGround(p.x, p.y, p.z) <= 0 || p.life <= 0 || insideBox(p.x, p.y, p.z, world.boxes);
      if (!hit && ctx) {
        for (const v of ctx.vehicles) {
          if (v.driver === 'player' || v.exploded) continue;
          if (Math.hypot(v.x - p.x, v.z - p.z) <= v.spec.radius && p.y <= v.y + 1.5) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        detonateProjectile(p, ctx);
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }
  }

  function placeMine(muzzle: THREE.Vector3, camDir: THREE.Vector3): void {
    const hLen = Math.hypot(camDir.x, camDir.z) || 1;
    const x = muzzle.x + (camDir.x / hLen) * 1.6;
    const z = muzzle.z + (camDir.z / hLen) * 1.6;
    const mesh = buildPrefab('acorn-trip-mine', { scale: 2.2 });
    mesh.position.set(x, heightAt(x, z), z);
    scene.add(mesh);
    mines.push({ mesh, x, z, armedIn: 0.8 });
    while (mines.length > MAX_MINES) {
      const oldest = mines.shift()!;
      scene.remove(oldest.mesh);
    }
  }

  function stepMines(dt: number, ctx?: WeaponContext): void {
    if (!ctx) return;
    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i];
      if (m.armedIn > 0) { m.armedIn -= dt; continue; }
      let tripped = false;
      for (const v of ctx.vehicles) {
        if (v.driver === 'player' || v.exploded || v.y > 1.5) continue;
        if (Math.hypot(v.x - m.x, v.z - m.z) <= 2.2 + v.spec.radius * 0.5) {
          fx.spark(m.x, 0.4, m.z);
          fx.crack(m.x, 0.5, m.z, 0xd4af37);
          ctx.onPlay?.('boom');
          v.vy = 10;
          const k = v.knock ?? (v.knock = { x: 0, z: 0, spin: 0 });
          k.x += (Math.random() - 0.5) * 6;
          k.z += (Math.random() - 0.5) * 6;
          k.spin = 4;
          damageVehicle(v, 0.2);
          if (v.hp <= 0) ctx.onBlowUp?.(v);
          tripped = true;
          break;
        }
      }
      if (tripped) {
        scene.remove(m.mesh);
        mines.splice(i, 1);
      }
    }
  }

  /** Set the rounds for the current gun, remembering them per gun. */
  function setAmmo(n: number): void {
    w.ammo = n;
    ammoBy[w.gun] = n;
  }

  function startReload(): void {
    if (w.reloading || w.ammo >= w.mag) return;
    w.reloading = true;
    reloadLeft = specs[w.gun].reload;
  }

  function cancelReload(): void {
    w.reloading = false;
    reloadLeft = 0;
  }

  /** Rebuild the held model for the current gun and put it on the hand. */
  function rebuildHeld(): void {
    if (held) held.removeFromParent();
    held = buildModdedGun(w.gun, previewMods ?? loadouts[w.gun]);
    held.visible = visible;
    if (hand) placeInHand(held, GUNS[w.gun].prefab, hand);
  }

  rebuildHeld();
  return w;
}
