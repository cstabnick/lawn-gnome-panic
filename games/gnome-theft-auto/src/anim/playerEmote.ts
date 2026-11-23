// The player's emotes: one animator on the player's gnome, started from the emote menu (or the debug hook), stopped
// when the player walks (only for rows that move legs or body) and cut at once by anything that needs the gnome
// (a vehicle, a jump, the gun raised, a fall, the water). app.ts calls update() every frame after the gun pose.
// Ids starting with LAWN_PREFIX are the player's own @lawn/emotes (the Gnome Creator loadout unlocked by achievements,
// the "Mine" tab); they play through @lawn/emotes' own player, so they look the same as in every other game.
import type { GnomeModel } from '@lawn/gnome';
import { createEmotePlayer, getEmote, loadMyEmotes, type EmotePlayer } from '@lawn/emotes';
import { createAnimator, type Animator } from './animator';
import { animById, upperBodyOnly } from './index';
import type { EmoteTile } from './emoteMenu';

/** Prefix for a shared @lawn/emotes id in the menu and play(). */
export const LAWN_PREFIX = 'lawn:';

export interface EmoteGate {
  /** Move keys, stick or jump pushed this frame. */
  moving: boolean;
  /** The gnome is busy: in or mounting a vehicle, airborne, swimming, ragdolling, dead, aiming or firing. */
  blocked: boolean;
}

export interface PlayerEmote {
  readonly animator: Animator;
  /** An emote is playing (or blending out). */
  readonly active: boolean;
  /** Start an emote by id: any library row, or LAWN_PREFIX + a @lawn/emotes id. False for an unknown id. */
  play(id: string): boolean;
  /** Blend out. */
  stop(): void;
  /** Every frame, after model.update() and the gun pose. */
  update(model: GnomeModel, dt: number, gate: EmoteGate): void;
}

/** The "Mine" tab: the player's equipped, unlocked @lawn/emotes as menu tiles. */
export async function myEmoteTiles(): Promise<EmoteTile[]> {
  const mine = await loadMyEmotes();
  return mine.map((e) => ({ id: LAWN_PREFIX + e.id, label: e.label, icon: e.icon }));
}

export function createPlayerEmote(onPlay?: (id: string) => void): PlayerEmote {
  const animator = createAnimator();
  let lawn: EmotePlayer | null = null;
  let lawnModel: GnomeModel | null = null;
  let pending: string | null = null;
  const lawnActive = (): boolean => lawn?.current != null;

  return {
    animator,
    get active() { return animator.active || lawnActive() || pending !== null; },
    play(id) {
      const known = id.startsWith(LAWN_PREFIX) ? !!getEmote(id.slice(LAWN_PREFIX.length)) : !!animById(id);
      if (!known) return false;
      pending = id;
      return true;
    },
    stop() {
      pending = null;
      animator.stop();
      lawn?.stop();
    },
    update(model, dt, gate) {
      if (!lawn || lawnModel !== model) {
        if (lawn) lawn.setModel(model);
        else lawn = createEmotePlayer(model);
        lawnModel = model;
      }
      if (gate.blocked) {
        pending = null;
        if (animator.active) animator.cancel(model);
        if (lawnActive()) {
          lawn.stop();
          lawn.update(1, false); // a long step finishes the fade at once
        }
        return;
      }
      if (pending) {
        if (pending.startsWith(LAWN_PREFIX)) {
          if (animator.active) animator.cancel(model);
          lawn.play(pending.slice(LAWN_PREFIX.length));
        } else {
          if (lawnActive()) {
            lawn.stop();
            lawn.update(1, false);
          }
          animator.play(pending);
        }
        onPlay?.(pending);
        pending = null;
      }
      const def = animator.current;
      if (def && gate.moving && !upperBodyOnly(def)) animator.stop();
      animator.apply(model, dt);
      lawn.update(dt, gate.moving);
    },
  };
}
