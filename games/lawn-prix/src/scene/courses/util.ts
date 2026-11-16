// Small helpers every course's scenery uses: seeded randomness, canvas textures, finding spots off the track,
// and simple gnome extras. Nothing runs at import time.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { projectOnTrack, type Track } from '../../track';

/** Seeded PRNG (mulberry32): returns numbers in [0, 1). Use it for scenery so every screen builds the same course. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A canvas texture painted by paint(ctx). sRGB colour space. */
export function canvasTexture(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext('2d') as CanvasRenderingContext2D);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Distance from (x, z) to the mown surface's edge, m (negative = on the track). */
export function distFromTrackEdge(track: Track, x: number, z: number): number {
  return Math.abs(projectOnTrack(track, x, z).lateral) - track.width / 2;
}

/** A random spot inside the course bounds (inset from the hedges) at least `clear` metres off the track edge, or null
 *  after 60 tries. */
export function offTrackSpot(track: Track, rng: () => number, clear: number, inset = 3): { x: number; z: number } | null {
  const b = track.course.bounds;
  for (let i = 0; i < 60; i++) {
    const x = b.minX + inset + rng() * (b.maxX - b.minX - 2 * inset);
    const z = b.minZ + inset + rng() * (b.maxZ - b.minZ - 2 * inset);
    if (distFromTrackEdge(track, x, z) >= clear) return { x, z };
  }
  return null;
}

/** A gnome actor for a background show: the shared model plus the pose it is animated from. */
export interface Actor {
  model: GnomeModel;
  pose: PlayerState;
  /** Call every frame after changing pose (position, facing, velocity for the run cycle, grounded). */
  update(dt: number): void;
}

/** A gnome at (x, z) facing yaw, added to scene. look defaults to Gnorman with the given hat/shirt colours. */
export function createActor(scene: THREE.Scene, x: number, z: number, yaw: number, look: Partial<GnomeLook> = {}): Actor {
  const model = createGnomeModel({ ...GNORMAN_LOOK, ...look });
  scene.add(model.object);
  const pose: PlayerState = {
    position: new THREE.Vector3(x, 0, z),
    velocity: new THREE.Vector3(),
    facing: yaw,
    grounded: true,
    jumpsUsed: 0,
  };
  model.update(pose, 0);
  return { model, pose, update: (dt) => model.update(pose, dt) };
}
