// Plays one row of the animation table on one gnome model: blends in and out over BLEND seconds against whatever
// model.update() (or a gun pose) gave the parts, holds a hand prop while it plays, and puts everything back when done.
// Call apply() every frame AFTER model.update(...) and after any other arm pose.
import * as THREE from 'three';
import { buildGear, type GnomeModel } from '@lawn/gnome';
import { animById } from './index';
import type { AnimDef, AnimPart, AnimPose } from './types';

/** Seconds to blend an animation in, and out again. */
export const BLEND = 0.2;

export interface PlayOptions {
  /** Start this many seconds in (stagger loops so a crowd is not in step). */
  offset?: number;
  /** Time scale, default 1. */
  speed?: number;
  /** Loop even a non-loop row (true) or play a loop row once (false). Default: the row's own `loop`. */
  loop?: boolean;
  /** Called once when the animation has fully blended out (finished or stopped), not when replaced or cancelled. */
  onEnd?: () => void;
}

export interface Animator {
  /** The row playing (or blending out), or null. */
  readonly current: AnimDef | null;
  /** Seconds since play(). */
  readonly time: number;
  /** Blend weight 0..1. */
  readonly weight: number;
  /** Playing or blending out. */
  readonly active: boolean;
  /** Start a row by id (replaces any playing one, keeping its blend weight). False for an unknown id. */
  play(id: string, opts?: PlayOptions): boolean;
  /** Blend out over BLEND seconds, then end. */
  stop(): void;
  /** End now: parts and prop back to rest at once (no onEnd). Pass the model it was playing on. */
  cancel(model: GnomeModel): void;
  /** Advance by dt and pose the model. Call after model.update(...). */
  apply(model: GnomeModel, dt: number): void;
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const ZERO: readonly [number, number, number] = [0, 0, 0];

function limb(model: GnomeModel, part: AnimPart): THREE.Object3D | undefined {
  switch (part) {
    case 'armL': return model.arms?.left;
    case 'armR': return model.arms?.right;
    case 'legL': return model.legs?.left;
    case 'legR': return model.legs?.right;
    case 'body': return model.rig ?? undefined;
  }
}

/**
 * Pose `model` with `pose` at weight w for the listed parts. Limbs blend rotation.x from what update() gave them
 * and y/z from 0; the body blends from upright. lift adds to the rig height. `additive` (onMove rows): limb x is
 * ADDED to what update() gave (the walk swing stays). Exported for tests and the cutscene.
 */
export function applyPose(model: GnomeModel, parts: readonly AnimPart[], pose: AnimPose, w: number, additive = false): void {
  for (const part of parts) {
    const o = limb(model, part);
    if (!o) continue;
    const r = pose[part] ?? ZERO;
    if (part === 'body') o.rotation.set(r[0] * w, r[1] * w, r[2] * w);
    else o.rotation.set(additive ? o.rotation.x + r[0] * w : lerp(o.rotation.x, r[0], w), r[1] * w, r[2] * w);
  }
  if (pose.lift && model.rig) model.rig.position.y += pose.lift * w;
}

/** Put the listed parts back to rest (arms and legs hang, body upright). update() restores rotation.x next frame. */
export function resetParts(model: GnomeModel, parts: readonly AnimPart[]): void {
  for (const part of parts) {
    const o = limb(model, part);
    if (!o) continue;
    o.rotation.set(part === 'body' ? 0 : o.rotation.x, 0, 0);
  }
}

export function createAnimator(): Animator {
  let def: AnimDef | null = null;
  let t = 0;
  let w = 0;
  let speed = 1;
  let loop = false;
  let stopping = false;
  let onEnd: (() => void) | undefined;
  /** The prop in the hand, and the model it hangs on. */
  let prop: THREE.Object3D | null = null;
  let propId: string | null = null;
  /** Props built before, by prefab id (one animator = one gnome, so each prop has one parent at a time). */
  const props = new Map<string, THREE.Object3D | null>();

  const dropProp = (): void => {
    prop?.removeFromParent();
    prop = null;
    propId = null;
  };
  const holdProp = (model: GnomeModel, id: string | undefined): void => {
    if ((id ?? null) === propId) return;
    dropProp();
    if (!id) return;
    if (!props.has(id)) {
      try {
        props.set(id, buildGear('hand', id));
      } catch {
        props.set(id, null);
      }
    }
    const obj = props.get(id) ?? null;
    if (obj && model.arms) model.arms.right.add(obj);
    prop = obj;
    propId = id;
  };

  const a: Animator = {
    get current() { return def; },
    get time() { return t; },
    get weight() { return w; },
    get active() { return def !== null; },

    play(id, opts = {}) {
      const next = animById(id);
      if (!next) return false;
      def = next;
      t = opts.offset ?? 0;
      speed = opts.speed ?? 1;
      loop = opts.loop ?? next.loop;
      stopping = false;
      onEnd = opts.onEnd;
      return true;
    },

    stop() {
      if (def) stopping = true;
    },

    cancel(model) {
      if (def) resetParts(model, def.parts);
      dropProp();
      def = null;
      w = 0;
      onEnd = undefined;
    },

    apply(model, dt) {
      if (!def) return;
      t += dt * speed;
      if (!loop && t >= def.duration) stopping = true;
      w = stopping ? Math.max(0, w - dt / BLEND) : Math.min(1, w + dt / BLEND);
      const tt = loop ? t % def.duration : Math.min(t, def.duration * 0.9999);
      applyPose(model, def.parts, def.pose(tt), w, def.onMove === true);
      holdProp(model, w > 0.3 ? def.prop : undefined);
      if (stopping && w <= 0) {
        resetParts(model, def.parts);
        dropProp();
        def = null;
        const cb = onEnd;
        onEnd = undefined;
        cb?.();
      }
    },
  };
  return a;
}
