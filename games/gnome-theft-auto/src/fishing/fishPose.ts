// Fishing pose: the gnome's arms through the animation library's fishing rows (fish-cast, fish-reel, fish-catch, by id
// via animById + applyPose), and the selected rod held in the right hand. The library is call-only (src/anim/).
import * as THREE from 'three';
import { buildGear, type GnomeModel } from '@lawn/gnome';
import { animById, type AnimDef } from '../anim';
import { applyPose, resetParts } from '../anim/animator';
import type { FishPhase, RodDef } from './types';

export interface FishPose {
  /** Hold this rod (rebuilds the held prop when it changes). */
  setRod(rod: RodDef): void;
  /** Every frame while fishing, after model.update and the emote: pose by phase and hold the rod. */
  apply(model: GnomeModel, phase: FishPhase, phaseT: number, charge: number, dt: number): void;
  /** The rod tip in world space into `out` (call after apply). */
  tip(model: GnomeModel, out: THREE.Vector3): THREE.Vector3;
  /** Put the arms back and drop the rod (fishing stopped). */
  clear(model: GnomeModel): void;
}

/** Seconds for the pose to blend in. */
const RISE = 0.2;
const POSE_PARTS = ['armL', 'armR', 'body'] as const;

interface HeldRod {
  prefab: string;
  /** The built holder group (buildGear('hand', ...)); its first child is the prefab itself. */
  holder: THREE.Object3D;
  /** Tip marker, a child of the prefab at rod.tip. */
  marker: THREE.Object3D;
}

export function createFishPose(): FishPose {
  const castRow: AnimDef | undefined = animById('fish-cast');
  const reelRow: AnimDef | undefined = animById('fish-reel');
  const catchRow: AnimDef | undefined = animById('fish-catch');
  const holders = new Map<string, HeldRod>();
  let held: HeldRod | null = null;
  let w = 0;

  const build = (rod: RodDef): HeldRod => {
    let holder: THREE.Object3D;
    try {
      holder = buildGear('hand', rod.prefab);
    } catch {
      holder = buildGear('hand', 'fishing-rod');
    }
    const marker = new THREE.Object3D();
    (holder.children[0] ?? holder).add(marker);
    holder.visible = true;
    return { prefab: rod.prefab, holder, marker };
  };

  return {
    setRod(rod) {
      if (held?.prefab === rod.prefab) {
        held.marker.position.set(rod.tip[0], rod.tip[1], rod.tip[2]);
        return;
      }
      held?.holder.removeFromParent();
      let entry = holders.get(rod.prefab);
      if (!entry) {
        entry = build(rod);
        holders.set(rod.prefab, entry);
      }
      entry.marker.position.set(rod.tip[0], rod.tip[1], rod.tip[2]);
      held = entry;
    },

    apply(model, phase, phaseT, charge, dt) {
      w = Math.min(1, w + dt / RISE);
      let def: AnimDef | undefined = reelRow;
      let t = 0;
      switch (phase) {
        case 'charge':
          def = castRow;
          t = 0.5 * charge;
          break;
        case 'flight':
          def = castRow;
          t = 0.5 + Math.min(0.9, phaseT);
          break;
        case 'reel':
          def = reelRow;
          t = phaseT % 1.0;
          break;
        case 'landed':
          def = catchRow;
          t = Math.min(phaseT, 1.9);
          break;
        case 'bite':
          def = reelRow;
          t = 0.05 * Math.sin(phaseT * 40);
          break;
        default:
          // idle, wait, lost: the reel row held still.
          def = reelRow;
          t = 0;
          break;
      }
      if (held && held.holder.parent !== model.arms.right) model.arms.right.add(held.holder);
      if (def) applyPose(model, def.parts, def.pose(t), w);
    },

    tip(model, out) {
      if (held && held.holder.parent) {
        held.marker.updateWorldMatrix(true, false);
        return held.marker.getWorldPosition(out);
      }
      return out.set(model.object.position.x, model.object.position.y + 1.4, model.object.position.z);
    },

    clear(model) {
      resetParts(model, POSE_PARTS);
      held?.holder.removeFromParent();
      w = 0;
    },
  };
}
