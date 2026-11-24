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
const STRIKE_TIME = 0.28;       // right arm swing length (s)
const STRIKE_ARM = -1.75;       // right arm swing peak (rad, forward)
const STRIKE_TWIST = 0.55;      // torso twist into the swing (rad)

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
  let strikeHit = false;

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
      strikeLeft = STRIKE_TIME;
      strikeHit = hit;
    },
    update(p: PlayerState, dt: number, opts: PlayerViewOpts) {
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
      if (dead) { slashArc.visible = false; return; } // the model's own death pose stands

      syncGear(opts);

      // Crouch: drop the rig and lean forward.
      const crouched = p.stance === 'crouch' && p.grounded;
      rigDrop = crouched ? CROUCH_LIFT : 0;
      rigLean = crouched ? CROUCH_LEAN : 0;
      model.rig.position.y -= rigDrop;
      model.rig.rotation.x += rigLean;

      // Climbing: face the wall (facing is unchanged), arms raised and alternating.
      if (p.climbing) {
        climbPhase += dt * CLIMB_RATE;
        const s = Math.sin(climbPhase) * CLIMB_SWING;
        model.arms.left.rotation.x = CLIMB_ARMS_UP + s;
        model.arms.right.rotation.x = CLIMB_ARMS_UP - s;
        slashArc.visible = false;
      } else if (strikeLeft > 0) {
        // Strike swing: wind up slightly then slash forward/across with torso twist and arc flash.
        strikeLeft = Math.max(0, strikeLeft - dt);
        const u = 1 - strikeLeft / STRIKE_TIME;
        const swing = Math.sin(Math.PI * u);
        model.arms.right.rotation.x = STRIKE_ARM * swing;
        model.arms.right.rotation.z = -0.35 * swing;
        model.arms.left.rotation.x = 0.45 * swing;
        rigTwist = STRIKE_TWIST * Math.sin(Math.PI * (u - 0.15));
        model.rig.rotation.y += rigTwist;

        slashArc.visible = true;
        slashArc.position.set(p.pos.x + Math.sin(p.facing) * 0.55, p.pos.y + (crouched ? 0.65 : 1.0), p.pos.z + Math.cos(p.facing) * 0.55);
        slashArc.rotation.z = -p.facing + (u - 0.5) * 1.4;
        slashMat.color.setHex(strikeHit ? 0xffd56a : 0xf4efe0);
        slashMat.opacity = 0.65 * Math.sin(Math.PI * u);
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
