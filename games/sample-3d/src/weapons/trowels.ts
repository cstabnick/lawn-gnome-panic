import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Weapon, WeaponContext, TrowelLevel } from '../config';
import { TROWEL_LEVELS } from '../config';

function dist2D(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

function buildTrowel(): THREE.Group {
  const g = new THREE.Group();
  const trowel = buildPrefab('iron-trowel', { scale: 1.6 });
  trowel.rotation.z = -Math.PI / 2;
  g.add(trowel);
  return g;
}

export function createTrowels(scene: THREE.Scene): Weapon {
  let level = 1;
  let angle = 0;
  const meshes: THREE.Group[] = [];
  const cooldowns = new Map<number, number>();
  const cur = (): TrowelLevel => TROWEL_LEVELS[level - 1];

  return {
    id: 'trowels',
    setLevel(lv: number) {
      level = lv;
    },
    update(ctx: WeaponContext) {
      const L = cur();

      while (meshes.length < L.count) {
        const g = buildTrowel();
        scene.add(g);
        meshes.push(g);
      }
      while (meshes.length > L.count) {
        const g = meshes.pop()!;
        scene.remove(g);
      }

      angle += 2 * Math.PI * L.revPerSec * ctx.dt;
      const count = meshes.length;
      for (let i = 0; i < count; i++) {
        const a = angle + (i * 2 * Math.PI) / count;
        meshes[i].position.set(
          ctx.player.x + Math.cos(a) * L.radius,
          ctx.player.y + 0.55,
          ctx.player.z + Math.sin(a) * L.radius,
        );
        meshes[i].rotation.y = -a;
      }

      for (const [id, t] of cooldowns) {
        const next = t - ctx.dt;
        if (next <= 0) cooldowns.delete(id);
        else cooldowns.set(id, next);
      }

      const damage = L.damage * ctx.stats.damageMult;
      for (const g of meshes) {
        for (const e of ctx.enemies) {
          if (cooldowns.has(e.id)) continue;
          if (dist2D(g.position.x, g.position.z, e.pos.x, e.pos.z) < e.radius + 0.35) {
            ctx.damage(e.id, damage);
            cooldowns.set(e.id, L.hitCooldownS);
          }
        }
      }
    },
    dispose() {
      for (const g of meshes) scene.remove(g);
      meshes.length = 0;
      cooldowns.clear();
    },
  };
}
