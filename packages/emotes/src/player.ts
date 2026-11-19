// Plays emotes on a @lawn/gnome model. It runs after model.update() each frame and overrides the limbs on top of the
// walk/idle animation, so the model itself needs no emote code and every game's gnome can emote.
import type { GnomeModel } from '@lawn/gnome';
import { emptyPose, getEmote, zeroPose } from './catalog';
import type { EmoteDef } from './types';

/** Seconds to blend back to the model's own animation when an emote is cut short. */
const FADE_OUT_S = 0.2;

export interface EmotePlayer {
  /** The emote playing (or fading out), else null. */
  readonly current: string | null;
  /** Starts an emote from its beginning (replacing any other). False for an unknown id. */
  play(id: string): boolean;
  /** Blends back to the model's own animation. */
  stop(): void;
  /**
   * Call every frame right after model.update(state, dt). moving = the gnome is walking: a running emote stops.
   * Emote only a grounded, living gnome (the body lift is added to the rig height the grounded walk sets each frame).
   */
  update(dt: number, moving?: boolean): void;
  /** Use after rebuilding the model (a new look): the running emote carries on, on the new model. */
  setModel(model: GnomeModel): void;
}

export function createEmotePlayer(initial: GnomeModel): EmotePlayer {
  let model = initial;
  let def: EmoteDef | null = null;
  let t = 0;
  /** Blend weight of the emote over the model's own pose. */
  let weight = 0;
  let fading = false;
  const pose = emptyPose();

  /** Puts every value the player owns back to rest (the model's update owns arm/leg x and the rig height). */
  const clear = (m: GnomeModel): void => {
    m.arms.left.rotation.z = 0;
    m.arms.right.rotation.z = 0;
    if (m.legs) {
      m.legs.left.rotation.z = 0;
      m.legs.right.rotation.z = 0;
    }
    m.rig.position.x = 0;
    m.rig.rotation.set(0, 0, 0);
  };

  const finish = (): void => {
    clear(model);
    def = null;
    weight = 0;
    fading = false;
  };

  return {
    get current() {
      return def?.id ?? null;
    },
    play(id) {
      const next = getEmote(id);
      if (!next) return false;
      clear(model);
      def = next;
      t = 0;
      weight = 1;
      fading = false;
      return true;
    },
    stop() {
      if (def) fading = true;
    },
    update(dt, moving = false) {
      if (!def) return;
      if (moving) fading = true;
      t += dt;
      if (!def.loop && t >= def.duration) {
        finish();
        return;
      }
      if (fading) {
        weight -= dt / FADE_OUT_S;
        if (weight <= 0) {
          finish();
          return;
        }
      }

      zeroPose(pose);
      def.pose(t, pose);
      const w = weight;
      const mix = (base: number, v: number): number => base + (v - base) * w;
      const { arms, legs, rig } = model;
      arms.left.rotation.x = mix(arms.left.rotation.x, pose.armL.x);
      arms.right.rotation.x = mix(arms.right.rotation.x, pose.armR.x);
      arms.left.rotation.z = pose.armL.z * w;
      arms.right.rotation.z = pose.armR.z * w;
      if (legs) {
        legs.left.rotation.x = mix(legs.left.rotation.x, pose.legL.x);
        legs.right.rotation.x = mix(legs.right.rotation.x, pose.legR.x);
        legs.left.rotation.z = pose.legL.z * w;
        legs.right.rotation.z = pose.legR.z * w;
      }
      rig.position.x = pose.shift * w;
      rig.position.y += pose.lift * w;
      rig.rotation.set(pose.tip * w, pose.yaw * w, pose.lean * w);
    },
    setModel(next) {
      model = next;
    },
  };
}
