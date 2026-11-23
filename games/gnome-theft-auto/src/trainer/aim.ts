// Where the trainer spawns things: the ground point under the camera's aim (the crosshair), or a few metres ahead of the
// player when the aim misses the ground (looking at the sky, or too far).
import * as THREE from 'three';
import { heightAt } from '../terrain';
import type { TrainerCtx, TrainerSpot } from './types';

/** First point along the ray (origin o, unit direction d) that is at or below groundAt, within maxDist; else null. */
export function rayToGround(
  o: { x: number; y: number; z: number },
  d: { x: number; y: number; z: number },
  groundAt: (x: number, z: number) => number,
  maxDist = 80,
  step = 0.5,
): { x: number; z: number } | null {
  for (let t = step; t <= maxDist; t += step) {
    const x = o.x + d.x * t;
    const y = o.y + d.y * t;
    const z = o.z + d.z * t;
    if (y <= groundAt(x, z)) return { x, z };
  }
  return null;
}

/** Ahead of (px, pz) by `dist` along yaw (the game's yaw: 0 faces +z, PI/2 faces +x). */
export function aheadOf(px: number, pz: number, yaw: number, dist: number): { x: number; z: number } {
  return { x: px + Math.sin(yaw) * dist, z: pz + Math.cos(yaw) * dist };
}

const dir = new THREE.Vector3();

/** The spawn spot for the trainer now: the aimed ground point at least 4 m from the player, else 7 m ahead of the camera's view. */
export function trainerSpot(ctx: TrainerCtx): TrainerSpot {
  const cam = ctx.camera;
  cam.getWorldDirection(dir);
  const yaw = Math.atan2(dir.x, dir.z);
  const p = ctx.player.vehicle ? { x: ctx.player.vehicle.x, z: ctx.player.vehicle.z } : { x: ctx.player.x, z: ctx.player.z };
  const hit = rayToGround(cam.position, dir, heightAt);
  if (hit && Math.hypot(hit.x - p.x, hit.z - p.z) >= 4) return { x: hit.x, z: hit.z, yaw };
  const a = aheadOf(p.x, p.z, yaw, 7);
  return { x: a.x, z: a.z, yaw };
}
