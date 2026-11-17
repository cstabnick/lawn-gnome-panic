import * as THREE from 'three';
import { HABOOB_LEVELS, type Weapon, type WeaponContext } from '../config';
import { heightAt } from '../terrain';

const DUST_COLOR = 0xc9a26b;
const PUFF_MIN = 40;
const PUFF_MAX = 60;
const PUFF_MIN_FRAC = 0.2;      // innermost orbit, as a fraction of the storm radius
const PUFF_H_MIN = 0.2;
const PUFF_H_MAX = 1.8;
const ORBIT_MIN = 1.5;          // rad/s
const ORBIT_MAX = 3.0;
const BOB_AMP = 0.08;
const BOB_RATE = 4;
const RING_LIFT = 0.05;

interface Puff {
  mesh: THREE.Mesh;
  frac: number;     // orbit radius as a 0..1 fraction of the storm radius
  height: number;   // base height above the gnome's feet
  speed: number;    // rad/s
  angle: number;    // current orbit angle
  phase: number;    // bob phase
}

export function createHaboob(scene: THREE.Scene): Weapon {
  let level = 1;
  let tickTimer = HABOOB_LEVELS[0].tickS;
  let clock = 0;
  const levelStats = () => HABOOB_LEVELS[level - 1];

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const puffGeometry = new THREE.SphereGeometry(0.25, 6, 4);
  const puffMaterial = new THREE.MeshBasicMaterial({
    color: DUST_COLOR,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const puffCount = PUFF_MIN + Math.floor(Math.random() * (PUFF_MAX - PUFF_MIN + 1));
  const puffs: Puff[] = [];
  for (let i = 0; i < puffCount; i++) {
    const mesh = new THREE.Mesh(puffGeometry, puffMaterial);
    group.add(mesh);
    puffs.push({
      mesh,
      frac: PUFF_MIN_FRAC + (1 - PUFF_MIN_FRAC) * Math.sqrt(Math.random()),
      height: PUFF_H_MIN + (PUFF_H_MAX - PUFF_H_MIN) * Math.random(),
      speed: ORBIT_MIN + (ORBIT_MAX - ORBIT_MIN) * Math.random(),
      angle: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Faint ground ring, rebuilt whenever the radius changes.
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: DUST_COLOR,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.BufferGeometry(), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  function rebuildRing(radius: number): void {
    ring.geometry.dispose();
    ring.geometry = new THREE.RingGeometry(radius * 0.95, radius, 32);
  }
  rebuildRing(levelStats().radius);

  return {
    id: 'haboob',
    setLevel(l: number) {
      const next = Math.min(HABOOB_LEVELS.length, Math.max(1, Math.round(l)));
      if (next === level) return;
      level = next;
      rebuildRing(levelStats().radius);
    },
    update(ctx: WeaponContext) {
      const L = levelStats();
      group.visible = true;
      group.position.copy(ctx.player);

      // Visual: puffs orbit and bob around the gnome.
      clock += ctx.dt;
      for (const p of puffs) {
        p.angle += p.speed * ctx.dt;
        const r = p.frac * L.radius;
        p.mesh.position.set(
          Math.cos(p.angle) * r,
          p.height + BOB_AMP * Math.sin(BOB_RATE * clock + p.phase),
          Math.sin(p.angle) * r,
        );
      }

      // Ring sits on the ground under the gnome, even when the gnome stands on something.
      ring.position.set(0, heightAt(ctx.player.x, ctx.player.z) - ctx.player.y + RING_LIFT, 0);

      // Damage and slow on each tick.
      tickTimer -= ctx.dt;
      if (tickTimer <= 0) {
        tickTimer += L.tickS;
        for (const e of ctx.enemies) {
          if (dist2D(ctx.player, e.pos) < L.radius + e.radius) {
            ctx.damage(e.id, L.damage * ctx.stats.damageMult);
            ctx.slow(e.id, L.slowFactor, L.slowS);
          }
        }
      }
    },
    dispose() {
      scene.remove(group);
      puffGeometry.dispose();
      puffMaterial.dispose();
      ring.geometry.dispose();
      ringMaterial.dispose();
      puffs.length = 0;
    },
  };
}

function dist2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
