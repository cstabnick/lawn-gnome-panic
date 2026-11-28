// The standing pose for a water-skier (tow-ski): knees bent, both arms forward to the tow handle, and the lean shown
// in the hips (the legs), since the vehicle tilt already rolls the whole gnome. Runs after the model's own update and
// the riding pose, so it overrides the arm and leg angles those set. Pure three.js on the model it is given.
import type { GnomeModel } from '@lawn/gnome';

/** Knee bend (rad): the legs swing forward from the hips. */
const KNEE_BEND = 0.35;
/** Arms reach forward to the handle (rad). */
const ARM_REACH = -1.25;
/** Arms angle slightly inward, so the hands meet at the handle (rad). */
const ARM_IN = 0.15;
/** Share of the rider's lean that goes into the hips. */
const HIP_LEAN = 0.25;

/** Poses a standing skier on `model`. `lean` is the rider's steer input (-1..1); it sways the hips. */
export function skiPose(model: GnomeModel, lean: number): void {
  model.arms.left.rotation.x = ARM_REACH;
  model.arms.right.rotation.x = ARM_REACH;
  model.arms.left.rotation.z = ARM_IN;
  model.arms.right.rotation.z = -ARM_IN;
  if (model.legs) {
    model.legs.left.rotation.x = KNEE_BEND;
    model.legs.right.rotation.x = KNEE_BEND;
    model.legs.left.rotation.z = -lean * HIP_LEAN;
    model.legs.right.rotation.z = -lean * HIP_LEAN;
  }
}
