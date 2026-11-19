// Gnome models in the world (mine and other players'), their walk animation, and the DOM labels over their heads:
// name tag (in the player's colour, with 🎮 while they are in a game) and speech/emote bubble.
// STUB: replaced by the avatars issue; keep the export names and signatures.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import type { AvatarPose } from './config';
import type { World } from './world';

export interface Avatars {
  /** Creates the avatar, or rebuilds its model with a new look (keeps its pose and labels). */
  upsert(id: number, look: GnomeLook, name: string, color: number): void;
  remove(id: number): void;
  /** Removes every avatar except `keep` (used when changing map). */
  removeAllExcept(keep: number): void;
  has(id: number): boolean;
  /** Ids of every avatar, mine included. */
  ids(): number[];
  /** Shows this pose at once (my own gnome). */
  setPose(id: number, pose: AvatarPose): void;
  /** Buffers a remote pose taken at the sender's clock sentAt (ms); shown interpolated a little in the past. */
  pushPose(id: number, pose: AvatarPose, sentAt: number): void;
  /** Forgets the interpolation buffer so the next pushed pose shows at once (they changed map). */
  snap(id: number): void;
  /** Speech bubble over their head (chat line or emote emoji). */
  say(id: number, text: string): void;
  /** Animates models, samples remote poses, moves the labels. Call once per frame after the camera moved. */
  update(dt: number): void;
}

export function createAvatars(world: World, ui: HTMLElement): Avatars {
  void ui;
  const models = new Map<number, GnomeModel>();
  const scratch = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 };
  const poses = new Map<number, AvatarPose>();
  return {
    upsert(id, look) {
      const old = models.get(id);
      if (old) world.scene.remove(old.object);
      const m = createGnomeModel(look);
      world.scene.add(m.object);
      models.set(id, m);
    },
    remove(id) {
      const m = models.get(id);
      if (m) world.scene.remove(m.object);
      models.delete(id);
      poses.delete(id);
    },
    removeAllExcept(keep) {
      for (const id of [...models.keys()]) if (id !== keep) this.remove(id);
    },
    has: (id) => models.has(id),
    ids: () => [...models.keys()],
    setPose(id, pose) { poses.set(id, pose); },
    pushPose(id, pose) { poses.set(id, pose); },
    snap() {},
    say() {},
    update(dt) {
      for (const [id, m] of models) {
        const p = poses.get(id);
        if (!p) continue;
        scratch.position.set(p.x, 0, p.z);
        scratch.facing = p.facing;
        m.update(scratch, dt);
      }
    },
  };
}
