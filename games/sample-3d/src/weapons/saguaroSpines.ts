import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { SAGUARO_SPINES_LEVELS } from '../config';
import type { SaguaroSpinesLevel, Weapon, WeaponContext } from '../config';

const HIT_RADIUS = 0.3;      // a spine hits a critter when its centre is within the critter's radius + this
const SPINE_HEIGHT_Y = 0.6;  // spines fly this far above the gnome's feet
const BURST_TWIST = 0.4;     // radians the ring's starting angle turns each burst, so the gaps move
const SPINE_HALF_LEN = 0.25; // the spine prefab stands on its base; this centres it on the position the game sets
const UP = new THREE.Vector3(0, 1, 0);

/** A spine from the prefab, shifted so its centre is the group's origin (the game aims the group). */
function makeSpine(): THREE.Object3D {
  const holder = new THREE.Group();
  const spine = buildPrefab('saguaro-spine');
  spine.position.y = -SPINE_HALF_LEN;
  holder.add(spine);
  return holder;
}

/** One spine in the air. Flies in a straight line on the ground plane. */
interface Spine {
  mesh: THREE.Object3D;
  x: number;
  z: number;
  dirX: number;
  dirZ: number;
  travelled: number;
  hits: number;
  hitIds: Set<number>;
}

function dist2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function createSaguaroSpines(scene: THREE.Scene): Weapon {
  let level = 1;
  let timer = 1;
  let twist = 0;
  const spines: Spine[] = [];
  const levelStats = (): SaguaroSpinesLevel => SAGUARO_SPINES_LEVELS[level - 1];

  function removeSpine(s: Spine): void {
    scene.remove(s.mesh);
  }

  function burst(ctx: WeaponContext, L: SaguaroSpinesLevel): void {
    const y = ctx.player.y + SPINE_HEIGHT_Y;
    for (let i = 0; i < L.count; i++) {
      const a = twist + (i / L.count) * Math.PI * 2;
      const dirX = Math.sin(a);
      const dirZ = Math.cos(a);
      const mesh = makeSpine();
      mesh.position.set(ctx.player.x, y, ctx.player.z);
      mesh.quaternion.setFromUnitVectors(UP, new THREE.Vector3(dirX, 0, dirZ));
      scene.add(mesh);
      spines.push({
        mesh,
        x: ctx.player.x,
        z: ctx.player.z,
        dirX,
        dirZ,
        travelled: 0,
        hits: 0,
        hitIds: new Set<number>(),
      });
    }
    twist += BURST_TWIST;
    ctx.playSfx('shoot');
  }

  return {
    id: 'saguaroSpines',
    setLevel(l: number) {
      level = Math.min(SAGUARO_SPINES_LEVELS.length, Math.max(1, Math.round(l)));
    },
    update(ctx: WeaponContext) {
      const L = levelStats();

      // Fly and hit
      for (let i = spines.length - 1; i >= 0; i--) {
        const s = spines[i];
        const step = L.speed * ctx.dt;
        s.x += s.dirX * step;
        s.z += s.dirZ * step;
        s.travelled += step;
        s.mesh.position.x = s.x;
        s.mesh.position.z = s.z;

        for (const e of ctx.enemies) {
          if (s.hits > L.pierce) break;
          if (s.hitIds.has(e.id)) continue;
          if (dist2D(s, e.pos) < e.radius + HIT_RADIUS) {
            s.hitIds.add(e.id);
            s.hits++;
            ctx.damage(e.id, L.damage * ctx.stats.damageMult);
          }
        }

        if (s.hits > L.pierce || s.travelled >= L.range) {
          removeSpine(s);
          spines.splice(i, 1);
        }
      }

      // Burst on cooldown
      timer -= ctx.dt;
      if (timer > 0) return;
      burst(ctx, L);
      timer = L.cooldownS * ctx.stats.cooldownMult;
    },
    dispose() {
      for (const s of spines) removeSpine(s);
      spines.length = 0;
    },
  };
}
