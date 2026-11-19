// Shared 3D gnome animations and cosmetic props (smoking cig + smoke puffs, tipsy beer tankard + sway/sips,
// weapon attack kinds and shield block). Used by both the local player (player.ts) and remote players (net/mmo.ts).
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { buildHeld } from '@lawn/prefabs';

export type AttackKind = 'chop' | 'thrust' | 'ranged' | 'cast';

export const SWING_SECONDS = 0.35;
export const BLOCK_SECONDS = 0.3;

interface SmokePuff {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  life: number;
  vx: number;
  vz: number;
}

export interface GnomeCosmetics {
  update(
    dt: number,
    opts: {
      dead: boolean;
      smoking: boolean;
      tipsy: boolean;
      swinging: boolean;
    },
  ): void;
  triggerPuff(): void;
  triggerSip(): void;
  dispose(): void;
}

const puffWorld = new THREE.Vector3();

function buildCigProp(): { group: THREE.Group; tip: THREE.Object3D } {
  const group = buildHeld('clover-cig', { lights: false });
  group.position.set(0.03, 0.74, 0.16);
  group.rotation.set(Math.PI / 2 + 0.22, 0.25, 0);
  group.visible = false;
  const inner = group.children[0];
  const tip = inner?.children[inner.children.length - 1] ?? group;
  return { group, tip };
}

function buildBeerProp(): THREE.Group {
  const group = buildHeld('stout-tankard', { lights: false });
  group.position.set(0, -0.32, 0.05);
  group.visible = false;
  return group;
}

/** Attaches smoking & drinking cosmetic props and a smoke puff pool to a gnome model. */
export function attachGnomeCosmetics(model: GnomeModel, scene: THREE.Scene): GnomeCosmetics {
  const cig = buildCigProp();
  model.rig.add(cig.group);
  const beerGroup = buildBeerProp();
  model.arms.right.add(beerGroup);

  const puffGeo = new THREE.SphereGeometry(0.035, 6, 5);
  const smokePuffs: SmokePuff[] = [];
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xdcdcdc, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(puffGeo, mat);
    mesh.visible = false;
    scene.add(mesh);
    smokePuffs.push({ mesh, mat, age: 0, life: 1.4, vx: 0, vz: 0 });
  }

  let sipTimer = 0;
  let sipCycle = 0;
  let puffGestureTimer = 0;
  let smokeSpawnTimer = 0;
  let tipsyTime = 0;

  return {
    triggerPuff() {
      puffGestureTimer = 1.1;
    },
    triggerSip() {
      sipTimer = 1.6;
    },
    update(dt, opts) {
      const smoking = !opts.dead && opts.smoking;
      const tipsy = !opts.dead && opts.tipsy;

      cig.group.visible = smoking;
      beerGroup.visible = tipsy;

      // Smoke puffs rising from the cig tip.
      if (smoking) {
        smokeSpawnTimer -= dt;
        if (smokeSpawnTimer <= 0) {
          smokeSpawnTimer = 0.32;
          const slot = smokePuffs.find((p) => !p.mesh.visible);
          if (slot) {
            cig.tip.getWorldPosition(puffWorld);
            slot.mesh.position.copy(puffWorld);
            slot.mesh.scale.setScalar(0.5);
            slot.mesh.visible = true;
            slot.age = 0;
            slot.life = 1.3;
            slot.vx = (Math.random() - 0.5) * 0.2;
            slot.vz = (Math.random() - 0.5) * 0.2;
          }
        }
      }
      for (const p of smokePuffs) {
        if (!p.mesh.visible) continue;
        p.age += dt;
        const t = p.age / p.life;
        if (t >= 1) {
          p.mesh.visible = false;
          continue;
        }
        p.mesh.position.y += dt * 0.55;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.scale.setScalar(0.5 + t * 1.4);
        p.mat.opacity = 0.55 * (1 - t);
      }

      if (tipsy) {
        tipsyTime += dt;
        model.rig.rotation.z = Math.sin(tipsyTime * 2.6) * 0.08;
        sipCycle += dt;
        if (sipCycle >= 5.5) {
          sipCycle = 0;
          sipTimer = 1.4;
        }
      } else {
        tipsyTime = 0;
        sipCycle = 0;
        sipTimer = 0;
        model.rig.rotation.z = 0;
      }

      if (smoking) {
        if (puffGestureTimer > 0) puffGestureTimer = Math.max(0, puffGestureTimer - dt);
      } else {
        puffGestureTimer = 0;
      }

      if (!opts.swinging) {
        if (sipTimer > 0) {
          sipTimer = Math.max(0, sipTimer - dt);
          const lift = Math.sin(Math.PI * (1 - sipTimer / 1.6));
          model.arms.right.rotation.x = -1.65 * lift;
          model.arms.right.rotation.z = -0.3 * lift;
        } else if (puffGestureTimer > 0) {
          const lift = Math.sin(Math.PI * (1 - puffGestureTimer / 1.1));
          model.arms.right.rotation.x = -1.3 * lift;
          model.arms.right.rotation.z = -0.25 * lift;
        } else {
          model.arms.right.rotation.z = 0;
        }
      } else {
        model.arms.right.rotation.z = 0;
      }
    },
    dispose() {
      for (const p of smokePuffs) {
        scene.remove(p.mesh);
        p.mat.dispose();
      }
      puffGeo.dispose();
    },
  };
}

/** Applies weapon swing (chop/thrust/ranged/cast) and shield block arm poses after model.update(). */
export function applyAttackAndBlockPose(
  model: GnomeModel,
  swing: number,
  attackKind: AttackKind,
  block: number,
  holdingShieldInCombat = false,
): void {
  model.rig.rotation.y = 0;
  model.arms.right.position.z = 0;

  if (swing > 0) {
    const s = Math.sin(Math.PI * (1 - Math.max(0, swing) / SWING_SECONDS));
    if (attackKind === 'thrust') {
      model.arms.right.rotation.x = -1.6 * s;
      model.arms.right.position.z = 0.14 * s;
    } else if (attackKind === 'ranged') {
      model.arms.right.rotation.x = -1.7 * s;
      model.arms.left.rotation.x = -0.7 * s;
    } else if (attackKind === 'cast') {
      model.arms.right.rotation.x = -1.9 * s;
      model.arms.left.rotation.x = -0.6 * s;
    } else {
      model.arms.right.rotation.x = -2.4 * s;
      model.rig.rotation.y = -0.35 * s;
    }
  }

  if (block > 0) {
    const b = Math.sin(Math.PI * (1 - Math.max(0, block) / BLOCK_SECONDS));
    model.arms.left.rotation.x = -1.25 * b;
  } else if (holdingShieldInCombat) {
    model.arms.left.rotation.x = Math.min(model.arms.left.rotation.x, -0.45);
  }
}
