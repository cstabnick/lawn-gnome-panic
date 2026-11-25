// Procedural hero combat, movement, and ability-cast animations layered over @lawn/gnome's locomotion.
import type { GnomeModel } from '@lawn/gnome';
import { HERO_SCALES } from './heroModels';
import type { AbilitySlot, HeroId } from './sim/config';
import type { HeroEntity } from './sim/world';

export interface HeroAnimState {
  castTimer: number;
  castDuration: number;
  castAbility: AbilitySlot | null;
  castHeroId: HeroId;
  recoilTimer: number;
  landTimer: number;
  wasGrounded: boolean;
}

export function createHeroAnimState(heroId: HeroId = 'bramble'): HeroAnimState {
  return {
    castTimer: 0,
    castDuration: 0.42,
    castAbility: null,
    castHeroId: heroId,
    recoilTimer: 0,
    landTimer: 0,
    wasGrounded: true,
  };
}

export function triggerShotAnim(anim: HeroAnimState): void {
  anim.recoilTimer = 0.13;
}

export function triggerCastAnim(anim: HeroAnimState, heroId: HeroId, ability: AbilitySlot): void {
  anim.castHeroId = heroId;
  anim.castAbility = ability;
  anim.castDuration = ability === 'X' ? 0.65 : 0.42;
  anim.castTimer = anim.castDuration;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function applyHeroAnimation(
  model: GnomeModel,
  h: HeroEntity,
  anim: HeroAnimState,
  dt: number,
  timeS: number,
): void {
  // Decay timers
  anim.recoilTimer = Math.max(0, anim.recoilTimer - dt);
  anim.castTimer = Math.max(0, anim.castTimer - dt);
  anim.landTimer = Math.max(0, anim.landTimer - dt);

  if (h.move.grounded && !anim.wasGrounded) {
    anim.landTimer = 0.14;
  }
  anim.wasGrounded = h.move.grounded;

  // Reset additive offsets on rig & limbs
  const [sx, sy, sz] = HERO_SCALES[h.heroId];
  model.rig.scale.set(sx, sy, sz);
  model.rig.rotation.set(0, 0, 0);
  model.rig.position.set(0, 0, 0);
  model.arms.left.rotation.z = 0;
  model.arms.right.rotation.z = 0;
  model.object.rotation.x = 0;

  // 1. Combat Aiming & Shot Recoil
  const recoilFrac = anim.recoilTimer / 0.13;
  model.arms.right.rotation.x = -Math.PI * 0.4 - h.pitch * 0.65 - recoilFrac * 0.42;
  if (recoilFrac > 0) {
    model.rig.rotation.y += recoilFrac * 0.16;
  }

  // 2. Reload Animation
  if (h.reloadTimer > 0) {
    const bob = Math.sin(timeS * 14) * 0.18;
    model.arms.right.rotation.x = -0.7 + bob;
    model.arms.right.rotation.z = -0.35;
    model.arms.left.rotation.x = -1.05 - bob;
    model.arms.left.rotation.z = 0.48;
    model.rig.rotation.x += 0.1;
  }

  // 3. Slide Pose
  if (h.move.sliding) {
    model.rig.rotation.x = -0.45;
    model.rig.position.y = -0.18;
    model.arms.left.rotation.z = 0.65;
    model.arms.left.rotation.x = -0.4;
    if (model.legs) {
      model.legs.left.rotation.x = -0.75;
      model.legs.right.rotation.x = -0.45;
    }
  }

  // 4. Dash Pose
  if (h.move.dashTimer > 0) {
    model.rig.rotation.x += 0.38;
    model.arms.left.rotation.x = 0.9;
  }

  // 5. Air-Strafe Banking
  if (!h.move.grounded && !h.move.sliding) {
    const rightX = Math.cos(h.yaw);
    const rightZ = -Math.sin(h.yaw);
    const latVel = rightX * h.move.vel.x + rightZ * h.move.vel.z;
    model.rig.rotation.z = clamp(-latVel * 0.028, -0.32, 0.32);
  }

  // 6. Landing Squash
  if (anim.landTimer > 0) {
    const env = Math.sin((1 - anim.landTimer / 0.14) * Math.PI);
    model.rig.scale.set(sx * (1 + 0.08 * env), sy * (1 - 0.14 * env), sz * (1 + 0.08 * env));
  }

  // 7. Ability Cast Animations
  if (anim.castTimer > 0 && anim.castAbility) {
    const p = 1 - anim.castTimer / Math.max(0.01, anim.castDuration);
    const env = Math.sin(p * Math.PI);

    if (anim.castAbility === 'X') {
      // Ultimate: both arms raised high overhead, wind-back into slam/thrust + power pulse
      model.arms.left.rotation.x = -2.5 * env;
      model.arms.right.rotation.x = -2.1 * env;
      model.arms.left.rotation.z = 0.45 * env;
      model.arms.right.rotation.z = -0.45 * env;
      model.rig.rotation.x += (p < 0.45 ? -0.28 : 0.35) * env;
      const pulse = 1 + 0.08 * env;
      model.rig.scale.multiplyScalar(pulse);
    } else if (anim.castHeroId === 'bramble' && anim.castAbility === 'Q') {
      // Bramble Q (Mulch Charge): heavy forward shoulder-charge lean + shield thrust
      model.rig.rotation.x += 0.5 * env;
      model.arms.left.rotation.x = -1.6 * env;
    } else if (anim.castHeroId === 'hookwort' && anim.castAbility === 'Q') {
      // Hookwort Q (Garden Hook): thrust left arm forward then yank back
      const yank = Math.sin(p * Math.PI * 2);
      model.arms.left.rotation.x = -1.75 * yank;
      model.rig.rotation.y += 0.35 * yank;
    } else if (anim.castHeroId === 'hookwort' && anim.castAbility === 'E') {
      // Hookwort E (Mulch Uppercut): upward swing + torso twist
      model.arms.left.rotation.x = -2.1 * env;
      model.rig.rotation.y += 0.55 * env;
      model.rig.rotation.x -= 0.2 * env;
    } else if (anim.castAbility === 'F') {
      // Utility / Buff / Mobility: energetic arm flourish + spring lift
      model.arms.left.rotation.z = 0.85 * env;
      model.arms.left.rotation.x = -1.3 * env;
      model.rig.rotation.y -= 0.35 * env;
      model.rig.position.y += 0.12 * env;
    } else {
      // Default Q / E offensive cast: wind back then thrust forward
      const thrust = p < 0.3 ? 0.5 * (p / 0.3) : -1.95 * Math.sin(((p - 0.3) / 0.7) * Math.PI);
      model.arms.left.rotation.x = thrust;
      model.rig.rotation.y += 0.32 * env;
      model.rig.rotation.x += 0.22 * env;
    }
  }
}
