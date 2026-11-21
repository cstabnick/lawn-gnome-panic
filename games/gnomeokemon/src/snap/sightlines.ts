// Sight-line tracer: casts rays from the ride camera along the rail to see how much of it is visible.
// Pure maths, no DOM or renderer. Use it to tune the blockers from occluders.ts.

import * as THREE from 'three';

export interface SightReport {
  samples: number;
  visible: number;
  blockedBy: Record<string, number>;
}

/** Default look-ahead, in curve u: how far along the rail the camera is aimed. */
const LOOK_AHEAD = 0.15;

export function traceSightlines(
  curve: THREE.CatmullRomCurve3,
  occluders: readonly THREE.Object3D[],
  opts: {
    cameraHeight?: number;
    cameraBack?: number;
    samples?: number;
    maxRange?: number;
    lookAhead?: number;
  } = {},
): SightReport {
  const cameraHeight = opts.cameraHeight ?? 3.0;
  const cameraBack = opts.cameraBack ?? 0.95;
  const samples = opts.samples ?? 120;
  const maxRange = opts.maxRange ?? 40;
  const lookAhead = opts.lookAhead ?? LOOK_AHEAD;

  const report: SightReport = { samples, visible: 0, blockedBy: {} };
  const targets = [...occluders];
  const raycaster = new THREE.Raycaster();
  const tangent = new THREE.Vector3();
  const eye = new THREE.Vector3();
  const target = new THREE.Vector3();
  const dir = new THREE.Vector3();

  for (let i = 0; i < samples; i++) {
    const u = samples > 1 ? i / (samples - 1) : 0;
    curve.getTangentAt(u, tangent);
    curve.getPointAt(u, eye);
    eye.addScaledVector(tangent, -cameraBack);
    eye.y += cameraHeight;
    curve.getPointAt(Math.min(u + lookAhead, 1), target);

    dir.subVectors(target, eye);
    const distance = dir.length();
    if (distance === 0) {
      report.visible++;
      continue;
    }
    dir.divideScalar(distance);
    raycaster.set(eye, dir);
    raycaster.far = Math.min(distance, maxRange);

    const hits = raycaster.intersectObjects(targets, true);
    if (hits.length > 0 && hits[0].distance < distance) {
      const name = hits[0].object.name || 'unnamed';
      report.blockedBy[name] = (report.blockedBy[name] ?? 0) + 1;
    } else {
      report.visible++;
    }
  }
  return report;
}

export function visibleFraction(report: SightReport): number {
  return report.samples > 0 ? report.visible / report.samples : 0;
}
