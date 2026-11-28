// Gnome Golf's ball flight: @lawn/golf's pure physics played on this game's island and trees.
// Deterministic: the same shot always gives the same result. This file only plugs in the course and converts to three.js vectors.
import * as THREE from 'three';
import { previewShot as golfPreview, simulateShot as golfSimulate, type CourseEnv, type ShotResult as GolfShotResult } from '@lawn/golf';
import type { ClubId, Lie, Shot, ShotResult, Wind } from './config';
import { gradientAt, heightAt, lieAt } from './course';
import { collide } from './obstacles';

export { launchSpeed, liePower, powerScale, estimateCarry, powerFor, windVelocity } from '@lawn/golf';

const ENV: CourseEnv = { heightAt, gradientAt, lieAt, collide };

const vec = (p: { x: number; y: number; z: number }): THREE.Vector3 => new THREE.Vector3(p.x, p.y, p.z);

function toThree(r: GolfShotResult): ShotResult {
  return { ...r, points: r.points.map(vec), end: vec(r.end), dropPoint: r.dropPoint ? vec(r.dropPoint) : null };
}

/**
 * Plays a shot from `start` (ground position of the ball) and returns the whole trajectory.
 * pin: the cup position on the current green. Rolling over it slowly enough holes out.
 */
export function simulateShot(start: THREE.Vector3, shot: Shot, lie: Lie, wind: Wind, pin: { x: number; z: number }, opts: { noWind?: boolean; stopAtLanding?: boolean } = {}): ShotResult {
  return toThree(golfSimulate(ENV, start, shot, lie, wind, pin, opts));
}

/**
 * The path of a perfect full-power shot with this club (no wind), for the aim preview: the flight up to its
 * first landing for full swings, the whole roll for the putter (so the green's break shows).
 */
export function previewShot(start: THREE.Vector3, club: ClubId, lie: Lie, yaw: number, pin: { x: number; z: number }): ShotResult {
  return toThree(golfPreview(ENV, start, club, lie, yaw, pin));
}

/**
 * Where a perfect full-power shot with this club would first land (no wind), for the aim marker.
 * Returns the landing point on the ground. For the putter: where the putt would stop on this line.
 */
export function previewLanding(start: THREE.Vector3, club: ClubId, lie: Lie, yaw: number, pin: { x: number; z: number }): THREE.Vector3 {
  return previewShot(start, club, lie, yaw, pin).end;
}
