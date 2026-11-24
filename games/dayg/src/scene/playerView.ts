// The player's own gnome (from @lawn/gnome, via makeGnome) walking, crouching, climbing and dying, carrying what the
// player holds, wears on the back and wears on the head. Pose overrides are applied after model.update each frame, so
// they win over the model's own animation.
import * as THREE from 'three';
import { buildGear } from '@lawn/gnome';
import type { PlayerView, PlayerViewOpts, PlayerState } from '../game/types';
import type { ItemId } from '../sim/types';
import { getItem } from '../items/defs';
import { makeGnome, playerLook } from './gnomes';

const CROUCH_LIFT = 0.35;       // rig drop when crouched (gm)
const CROUCH_LEAN = 0.3;        // forward lean when crouched (rad)
const HAT_SLIP = 0.5;           // hat tilt when it slips (rad)
const CLIMB_ARMS_UP = -2.6;     // arms raised forward (negative rotation.x swings the arm forward)
const CLIMB_SWING = 0.45;       // arm alternation amplitude while climbing (rad)
const CLIMB_RATE = 6;           // arm alternation rate (rad/s) while climbing
const STRIKE_TIME = 0.28;       // default right arm swing length (s)
const STRIKE_ARM = -1.75;       // right arm swing peak (rad, forward)
const STRIKE_TWIST = 0.55;      // torso twist into the swing (rad)
const BURST_LIFE = 0.3;         // impact particle lifetime (s)
const BURST_COUNT = 5;          // clay-chip / spark boxes per hit

type AttackStyle = 'thrust' | 'cleave' | 'punch';

interface ImpactParticle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  life: number;
}

function attackStyleFor(id: ItemId | null): AttackStyle {
  if (!id) return 'punch';
  if (id === 'thorn-dagger' || id === 'old-trowel' || id === 'hand-fork') return 'thrust';
  if (id === 'acorn-club' || id === 'garden-mallet') return 'cleave';
  const tags = getItem(id).tags;
  if ((tags.includes('PIERCE') || tags.includes('CUT') || tags.includes('PRY') || tags.includes('DIG')) && !tags.includes('BLUNT')) {
    return 'thrust';
  }
  if (tags.includes('BLUNT') || tags.includes('HAMMER')) return 'cleave';
  return 'punch';
}

function strikeDuration(style: AttackStyle): number {
  if (style === 'thrust') return 0.20;
  if (style === 'cleave') return 0.34;
  return 0.22;
}

export function createPlayerView(scene: THREE.Scene): PlayerView {
  const model = makeGnome(playerLook());
  scene.add(model.object);
  // Subtle melee slash arc visible in both third-person and close/first-person view.
  const slashGeo = new THREE.RingGeometry(0.45, 0.72, 16, 1, -0.8, 1.6);
  const slashMat = new THREE.MeshBasicMaterial({ color: 0xf4efe0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const slashArc = new THREE.Mesh(slashGeo, slashMat);
  slashArc.rotation.x = Math.PI / 2;
  slashArc.position.set(0, 1.0, 0.45);
  slashArc.visible = false;
  scene.add(slashArc);

  let climbPhase = 0;
  let dead = false;
  let rigDrop = 0;   // crouch offset applied last frame, undone before the model's update
  let rigLean = 0;   // crouch lean applied last frame, undone before the model's update
  let rigTwist = 0;  // strike torso twist applied last frame
  let strikeLeft = 0; // seconds left in the arm swing
  let strikeDur = STRIKE_TIME;
  let strikeStyle: AttackStyle = 'punch';
  let strikeHit = false;
  let pendingBurst = false;

  const chipGeo = new THREE.BoxGeometry(0.055, 0.055, 0.055);
  const particles: ImpactParticle[] = [];

  function spawnImpactBurst(pos: THREE.Vector3, facing: number, crouched: boolean): void {
    const ox = pos.x + Math.sin(facing) * 0.72;
    const oy = pos.y + (crouched ? 0.65 : 1.0);
    const oz = pos.z + Math.cos(facing) * 0.72;
    for (let i = 0; i < BURST_COUNT; i++) {
      const color = i % 2 === 0 ? 0xc88a5b : 0xffd56a;
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(chipGeo, mat);
      mesh.position.set(ox, oy, oz);
      scene.add(mesh);
      const spread = facing + (i - (BURST_COUNT - 1) / 2) * 0.55;
      const speed = 1.6 + (i % 3) * 0.65;
      particles.push({
        mesh,
        mat,
        vx: Math.sin(spread) * speed,
        vy: 1.4 + (i % 2) * 0.9,
        vz: Math.cos(spread) * speed,
        rx: (i % 2 === 0 ? 1 : -1) * 9,
        ry: (i % 3 === 0 ? 1 : -1) * 11,
        life: BURST_LIFE,
      });
    }
  }

  function updateParticles(dt: number): void {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.mesh.removeFromParent();
        pt.mat.dispose();
        particles.splice(i, 1);
        continue;
      }
      pt.vy -= 6.5 * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.x += pt.rx * dt;
      pt.mesh.rotation.y += pt.ry * dt;
      const t = pt.life / BURST_LIFE;
      pt.mat.opacity = t;
      pt.mesh.scale.setScalar(0.5 + 0.5 * t);
    }
  }

  let heldId: ItemId | null = null;
  let heldObj: THREE.Object3D | null = null;
  let backId: ItemId | null = null;
  let backObj: THREE.Object3D | null = null;
  let headId: ItemId | null = null;
  let headObj: THREE.Object3D | null = null;

  function syncGear(opts: PlayerViewOpts): void {
    if (opts.held !== heldId) {
      heldId = opts.held;
      if (heldObj) heldObj.removeFromParent();
      heldObj = null;
      if (heldId) {
        // Hand anchor (grip) comes from @lawn/gnome; the held prefab is built around its grip.
        const prefab = getItem(heldId).prefab;
        heldObj = buildGear('hand', prefab);
        model.arms.right.add(heldObj);
      }
      model.setEquipmentOverride?.('hand', heldId !== null);
    }
    if (opts.back !== backId) {
      backId = opts.back;
      if (backObj) backObj.removeFromParent();
      backObj = null;
      if (backId) {
        backObj = buildGear('back', getItem(backId).prefab);
        model.rig.add(backObj);
      }
      model.setEquipmentOverride?.('back', backId !== null);
    }
    if (opts.head !== headId) {
      headId = opts.head;
      if (headObj) headObj.removeFromParent();
      headObj = null;
      if (headId) {
        headObj = buildGear('head', getItem(headId).prefab);
        model.rig.add(headObj);
      }
      // A worn head item replaces the cone hat; without one the customizer's headgear comes back.
      model.setEquipmentOverride?.('head', headId !== null);
      if (headId && model.hat) model.hat.visible = false;
    }
  }

  return {
    model,
    triggerAttack(hit = false) {
      strikeStyle = attackStyleFor(heldId);
      strikeDur = strikeDuration(strikeStyle);
      strikeLeft = strikeDur;
      strikeHit = hit;
      if (hit) pendingBurst = true;
    },
    update(p: PlayerState, dt: number, opts: PlayerViewOpts) {
      updateParticles(dt);

      model.rig.position.y -= rigDrop;
      model.rig.rotation.x -= rigLean;
      model.rig.rotation.y -= rigTwist;
      rigDrop = rigLean = rigTwist = 0;

      model.object.position.copy(p.pos);
      model.update({ position: p.pos, velocity: p.vel, facing: p.facing, grounded: p.grounded, jumpsUsed: 0 }, dt);

      if (opts.dead !== dead) {
        dead = opts.dead;
        model.setDead(dead);
      }
      if (dead) { slashArc.visible = false; pendingBurst = false; return; } // the model's own death pose stands

      syncGear(opts);

      // Crouch: drop the rig and lean forward.
      const crouched = p.stance === 'crouch' && p.grounded;
      rigDrop = crouched ? CROUCH_LIFT : 0;
      rigLean = crouched ? CROUCH_LEAN : 0;
      model.rig.position.y -= rigDrop;
      model.rig.rotation.x += rigLean;

      if (pendingBurst) {
        pendingBurst = false;
        spawnImpactBurst(p.pos, p.facing, crouched);
      }

      // Climbing: face the wall (facing is unchanged), arms raised and alternating.
      if (p.climbing) {
        climbPhase += dt * CLIMB_RATE;
        const s = Math.sin(climbPhase) * CLIMB_SWING;
        model.arms.left.rotation.x = CLIMB_ARMS_UP + s;
        model.arms.right.rotation.x = CLIMB_ARMS_UP - s;
        slashArc.visible = false;
      } else if (strikeLeft > 0) {
        // Weapon-aware strike animation.
        strikeLeft = Math.max(0, strikeLeft - dt);
        const u = 1 - strikeLeft / strikeDur;
        const swing = Math.sin(Math.PI * u);
        if (strikeStyle === 'thrust') {
          // Quick forward jab for daggers / trowels.
          const jab = Math.sin(Math.PI * Math.min(1, u * 1.15));
          model.arms.right.rotation.x = -1.45 * jab;
          model.arms.right.rotation.z = 0.08 * jab;
          model.arms.left.rotation.x = 0.35 * jab;
          rigTwist = 0.35 * jab;
          slashArc.rotation.z = -p.facing;
          slashArc.scale.set(0.75, 1.15, 1);
        } else if (strikeStyle === 'cleave') {
          // Wide overhead windup + heavy cleave for clubs / mallets.
          const wind = u < 0.28 ? -0.55 * (u / 0.28) : Math.sin(Math.PI * ((u - 0.28) / 0.72));
          model.arms.right.rotation.x = (u < 0.28 ? 0.65 * (u / 0.28) : -2.15 * wind);
          model.arms.right.rotation.z = -0.48 * swing;
          model.arms.left.rotation.x = 0.6 * swing;
          rigTwist = 0.68 * Math.sin(Math.PI * (u - 0.2));
          slashArc.rotation.z = -p.facing + (u - 0.5) * 1.85;
          slashArc.scale.set(1.25, 1.25, 1);
        } else {
          // Snappy punch for fists.
          model.arms.right.rotation.x = STRIKE_ARM * swing;
          model.arms.right.rotation.z = -0.18 * swing;
          model.arms.left.rotation.x = 0.55 * swing;
          rigTwist = STRIKE_TWIST * Math.sin(Math.PI * (u - 0.15));
          slashArc.rotation.z = -p.facing + (u - 0.5) * 1.1;
          slashArc.scale.set(0.85, 0.85, 1);
        }
        model.rig.rotation.y += rigTwist;

        slashArc.visible = true;
        slashArc.position.set(p.pos.x + Math.sin(p.facing) * 0.55, p.pos.y + (crouched ? 0.65 : 1.0), p.pos.z + Math.cos(p.facing) * 0.55);
        slashMat.color.setHex(strikeHit ? 0xffd56a : 0xf4efe0);
        slashMat.opacity = 0.65 * swing;
      } else {
        slashArc.visible = false;
      }

      // Hat slips: tilt it off the head, and the head item with it.
      const tilt = opts.hatSlips ? HAT_SLIP : 0;
      if (model.hat) model.hat.rotation.z = tilt;
      if (headObj) headObj.rotation.z = tilt;
    },
  };
}
