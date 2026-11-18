import * as THREE from 'three';
import type { CreatureAction, PhotoGrade, PhotoScoreBreakdown } from './types';

export interface ScoreSubjectInput {
  /** Projected bounding box coverage of the viewport height/width (0..1+). */
  coverage: number;
  /** Distance of projected subject center from (0, 0) in NDC (0 = dead center, 1.414 = corner). */
  centerDist: number;
  /** 1 = facing straight at the camera, -1 = facing away. */
  facingDot: number;
  /** Active creature animation state when photo was snapped. */
  action: CreatureAction;
  /** Number of Gnomokemon clearly visible in the same frame. */
  inFrameCount: number;
  /** Whether the subject is partially clipped outside NDC [-1, 1]. */
  clipped: boolean;
}

export function gradeFromTotal(total: number): PhotoGrade {
  if (total >= 3400) return 'Divine';
  if (total >= 2600) return 'Gold';
  if (total >= 1700) return 'Silver';
  return 'Bronze';
}

export function computePhotoScore(input: ScoreSubjectInput): PhotoScoreBreakdown {
  // Size (0..1000): sweet spot around 0.28..0.65 of viewport
  let size = 0;
  if (input.coverage > 0.02) {
    if (input.coverage <= 0.55) {
      size = Math.min(1000, Math.round((input.coverage / 0.45) * 1000));
    } else {
      // Slight penalty if way too close/oversized
      size = Math.max(450, Math.round(1000 - (input.coverage - 0.55) * 650));
    }
  }

  // Framing (0..1000): centeredness minus edge-clipping penalty
  let framing = Math.max(0, Math.round((1 - Math.min(1, input.centerDist / 1.15)) * 1000));
  if (input.clipped) framing = Math.max(100, framing - 220);

  // Pose & Direction (0..1000): facing camera + bonus for lively action
  const facingScore = Math.round(((input.facingDot + 1) / 2) * 750);
  const actionBase = input.action === 'idle' ? 140 : 250;
  const pose = Math.min(1000, facingScore + actionBase);

  // Special Bonus (0..1500)
  let special = 0;
  const specialLabels: string[] = [];
  if (input.action === 'eating') {
    special += 600;
    specialLabels.push('Snack Time! (+600)');
  } else if (input.action === 'startled') {
    special += 700;
    specialLabels.push('Startled! (+700)');
  } else if (input.action === 'dancing') {
    special += 650;
    specialLabels.push('Flute Dance! (+650)');
  }

  if (input.inFrameCount >= 2) {
    const multiBonus = Math.min(600, (input.inFrameCount - 1) * 350);
    special += multiBonus;
    specialLabels.push(`Group Shot x${input.inFrameCount} (+${multiBonus})`);
  }

  if (size >= 850 && framing >= 850) {
    special += 200;
    specialLabels.push('Bullseye Framing (+200)');
  }

  const total = size + framing + pose + special;
  return {
    size,
    framing,
    pose,
    special,
    total,
    specialLabels,
    grade: gradeFromTotal(total),
  };
}

export interface EvaluableCreature {
  speciesId: string;
  object: THREE.Object3D;
  action: CreatureAction;
}

export interface EvaluatedShot {
  speciesId: string;
  score: PhotoScoreBreakdown;
}

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _toCam = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _corner = new THREE.Vector3();

/** Evaluates all creatures in the camera view and returns the best subject, or null if none are in frame. */
export function evaluateShot(
  camera: THREE.PerspectiveCamera,
  creatures: readonly EvaluableCreature[],
): EvaluatedShot | null {
  camera.updateMatrixWorld();
  camera.getWorldPosition(_camPos);

  const visible: {
    speciesId: string;
    coverage: number;
    centerDist: number;
    facingDot: number;
    action: CreatureAction;
    clipped: boolean;
    rankMetric: number;
  }[] = [];

  for (const c of creatures) {
    _box.setFromObject(c.object);
    if (_box.isEmpty()) continue;
    _box.getCenter(_center);

    const dist = _center.distanceTo(_camPos);
    if (dist > 28 || dist < 0.3) continue;

    // Check if center is in front of camera
    const projCenter = _center.clone().project(camera);
    if (projCenter.z < -1 || projCenter.z > 1) continue;
    if (Math.abs(projCenter.x) > 1.25 || Math.abs(projCenter.y) > 1.25) continue;

    // Project 8 box corners to estimate screen coverage
    const min = _box.min;
    const max = _box.max;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let ix = 0; ix < 2; ix++) {
      for (let iy = 0; iy < 2; iy++) {
        for (let iz = 0; iz < 2; iz++) {
          _corner.set(ix ? max.x : min.x, iy ? max.y : min.y, iz ? max.z : min.z).project(camera);
          minX = Math.min(minX, _corner.x);
          maxX = Math.max(maxX, _corner.x);
          minY = Math.min(minY, _corner.y);
          maxY = Math.max(maxY, _corner.y);
        }
      }
    }

    const ndcW = Math.max(0, Math.min(1, maxX) - Math.max(-1, minX));
    const ndcH = Math.max(0, Math.min(1, maxY) - Math.max(-1, minY));
    const coverage = Math.max(ndcW / 2, ndcH / 2);
    if (coverage < 0.03) continue;

    const centerDist = Math.hypot(projCenter.x, projCenter.y);
    const clipped = minX < -1 || maxX > 1 || minY < -1 || maxY > 1;

    // Creature forward is +z in local space
    _forward.set(0, 0, 1).applyQuaternion(c.object.getWorldQuaternion(new THREE.Quaternion())).normalize();
    _toCam.subVectors(_camPos, _center).normalize();
    const facingDot = _forward.dot(_toCam);

    const rankMetric = coverage * 1.4 - centerDist * 0.45 + (c.action !== 'idle' ? 0.2 : 0);
    visible.push({
      speciesId: c.speciesId,
      coverage,
      centerDist,
      facingDot,
      action: c.action,
      clipped,
      rankMetric,
    });
  }

  if (visible.length === 0) return null;
  visible.sort((a, b) => b.rankMetric - a.rankMetric);
  const best = visible[0];
  return {
    speciesId: best.speciesId,
    score: computePhotoScore({
      coverage: best.coverage,
      centerDist: best.centerDist,
      facingDot: best.facingDot,
      action: best.action,
      inFrameCount: visible.length,
      clipped: best.clipped,
    }),
  };
}
