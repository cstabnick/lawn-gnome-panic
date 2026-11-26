// World-change builders (E18, L68): each change in defs.ts WORLD_CHANGES gets its props from one builder, registered
// here by a rows/*.ts module (rows/index.ts imports them all). A builder makes one THREE.Group of props, NPC stand-ins,
// signs and lights for its change; the runtime (runtime.ts) adds it to the scene only while the change is on, and calls
// `update` while it is shown. Builders never edit baked static batches, never block a road, door or quest spot, and use
// @lawn/prefabs (buildPrefab) for every object.
import type * as THREE from 'three';

/** What a builder gets. */
export interface WorldChangeCtx {
  scene: THREE.Scene;
  /** Ground height at a world point (terrain.ts heightAt). */
  groundY(x: number, z: number): number;
  /** 0 by day .. 1 at night (atmosphere nightFactor); 0 when there is no sky. */
  night(): number;
  /** W17: the ending the finale picked ('A' when none was recorded). */
  ending(): 'A' | 'B';
}

/** One built change. */
export interface WorldChangeBuilt {
  /** Everything the change shows. Added to the scene while on, removed while off. */
  root: THREE.Object3D;
  /** Per frame while shown (lit windows, a peeking mole, spinning blades). `t` is seconds since shown. */
  update?(dt: number, t: number): void;
  /** Called when the change is switched off after being shown (stop anything the update started). Optional. */
  hide?(): void;
}

export type WorldChangeBuilder = (ctx: WorldChangeCtx) => WorldChangeBuilt;

const BUILDERS = new Map<string, WorldChangeBuilder>();

/** Register the builder for change `id` (a WORLD_CHANGES id). A second registration for the same id replaces the first. */
export function registerWorldChange(id: string, build: WorldChangeBuilder): void {
  BUILDERS.set(id, build);
}

/** The builder for `id`, or undefined (a dormant row with no props yet). */
export function worldChangeBuilder(id: string): WorldChangeBuilder | undefined {
  return BUILDERS.get(id);
}

/** Ids that have a builder. */
export function builtWorldChangeIds(): string[] {
  return [...BUILDERS.keys()];
}
