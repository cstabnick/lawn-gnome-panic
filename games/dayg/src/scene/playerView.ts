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
const STRIKE_STAMINA = 8;       // a stamina drop this big in one frame, on the ground, is a strike
const STRIKE_TIME = 0.25;       // right arm swing length (s)
const STRIKE_ARM = -1.3;        // right arm swing peak (rad, forward)

export function createPlayerView(scene: THREE.Scene): PlayerView {
  const model = makeGnome(playerLook());
  scene.add(model.object);
  let climbPhase = 0;
  let dead = false;
  let rigDrop = 0;   // crouch offset applied last frame, undone before the model's update
  let rigLean = 0;   // crouch lean applied last frame, undone before the model's update
  let prevStamina: number | null = null;
  let strikeLeft = 0; // seconds left in the arm swing

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
    update(p: PlayerState, dt: number, opts: PlayerViewOpts) {
      model.rig.position.y -= rigDrop;
      model.rig.rotation.x -= rigLean;
      rigDrop = rigLean = 0;

      model.object.position.copy(p.pos);
      model.update({ position: p.pos, velocity: p.vel, facing: p.facing, grounded: p.grounded, jumpsUsed: 0 }, dt);

      if (opts.dead !== dead) {
        dead = opts.dead;
        model.setDead(dead);
      }
      if (dead) return; // the model's own death pose stands

      syncGear(opts);

      // Strike: the main loop takes stamina for a swing, so a big drop on the ground starts the arm swing.
      if (prevStamina !== null && p.grounded && prevStamina - p.stamina >= STRIKE_STAMINA) strikeLeft = STRIKE_TIME;
      prevStamina = p.stamina;

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
      } else if (strikeLeft > 0) {
        // Strike swing: the right arm goes forward and back over STRIKE_TIME.
        strikeLeft = Math.max(0, strikeLeft - dt);
        const u = 1 - strikeLeft / STRIKE_TIME;
        model.arms.right.rotation.x = STRIKE_ARM * Math.sin(Math.PI * u);
      }

      // Hat slips: tilt it off the head, and the head item with it.
      const tilt = opts.hatSlips ? HAT_SLIP : 0;
      if (model.hat) model.hat.rotation.z = tilt;
      if (headObj) headObj.rotation.z = tilt;
    },
  };
}
