// Course levels as lawn-level documents (src/data/levels/<course>.level.json). Each document holds the course's
// terrain (stamps), its rail (the `rail` road, [x, z] points, with each point's lift above the ground in
// data.railLift), the roam zones and cover spots (markers `zone`, `cover`) and the creatures (markers `creature`,
// whose data holds the species, home zone, lift, facing and movement). This file is the only place that reads them.
// Pure data and maths: no prefab registry, so the tests can import it.

import * as THREE from 'three';
import { applyStamps, validateLevelDoc, type LevelDoc, type MarkerDef } from '@lawn/level';
import type { CourseId } from './types';
import lawnDoc from '../data/levels/lawn.level.json';
import desertDoc from '../data/levels/desert.level.json';
import depthsDoc from '../data/levels/depths.level.json';
import kilnDoc from '../data/levels/kiln.level.json';
import oceanDoc from '../data/levels/ocean.level.json';
import nightDoc from '../data/levels/night.level.json';
import frostDoc from '../data/levels/frost.level.json';

/** The game's own block of a course document. */
export interface CourseData {
  /** Height of the rail above the ground at each rail point (same order as the `rail` path's points). */
  railLift: number[];
}

export type CourseDoc = LevelDoc<CourseData>;

export const COURSE_DOCS: Record<CourseId, CourseDoc> = {
  lawn: lawnDoc as unknown as CourseDoc,
  desert: desertDoc as unknown as CourseDoc,
  depths: depthsDoc as unknown as CourseDoc,
  kiln: kilnDoc as unknown as CourseDoc,
  ocean: oceanDoc as unknown as CourseDoc,
  night: nightDoc as unknown as CourseDoc,
  frost: frostDoc as unknown as CourseDoc,
};

/** A creature as the level file states it. `x`/`z` is its home spot on the ground, `lift` its height above it. */
export interface CreatureDef {
  speciesId: string;
  x: number;
  z: number;
  lift: number;
  rotY: number;
  scale?: number;
  zone: number;
  behavior: string;
  speed: number;
  radius: number;
  phase?: number;
}

/** The ground height at (x, z) on a course: its stamps applied to flat ground. */
export function groundHeight(courseId: CourseId, x: number, z: number): number {
  return applyStamps(0, COURSE_DOCS[courseId].stamps, x, z);
}

/** The rail's control points as [x, z, lift]. */
export function railPoints(courseId: CourseId): [number, number, number][] {
  const doc = COURSE_DOCS[courseId];
  const rail = doc.paths.find((p) => p.id === 'rail');
  if (!rail) throw new Error(`${courseId}: no rail path`);
  return rail.points.map(([x, z], i) => [x, z, doc.data.railLift[i] ?? 0]);
}

/** The rail as a curve over the terrain: each point sits its lift above the ground. */
export function buildRailCurve(courseId: CourseId): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    railPoints(courseId).map(([x, z, lift]) => new THREE.Vector3(x, groundHeight(courseId, x, z) + lift, z)),
  );
}

function markersOf(courseId: CourseId, kind: string): MarkerDef[] {
  return COURSE_DOCS[courseId].markers.filter((m) => m.kind === kind);
}

/** Roam zones: circles on the ground, in marker order (a creature's `zone` is an index into this list). */
export function courseZones(courseId: CourseId): { x: number; z: number; radius: number }[] {
  return markersOf(courseId, 'zone').map((m) => ({ x: m.x, z: m.z, radius: m.r ?? 0 }));
}

/** Cover spots: bushes, logs, pots and rocks a shy creature can hide in. */
export function courseCover(courseId: CourseId): { x: number; z: number }[] {
  return markersOf(courseId, 'cover').map((m) => ({ x: m.x, z: m.z }));
}

/** The creatures of a course, in document order. */
export function courseCreatures(courseId: CourseId): CreatureDef[] {
  return markersOf(courseId, 'creature').map((m) => {
    const d = m.data as Record<string, unknown>;
    return {
      speciesId: String(d.species),
      x: m.x,
      z: m.z,
      lift: Number(d.lift ?? 0),
      rotY: Number(d.rotY ?? 0),
      scale: d.scale === undefined ? undefined : Number(d.scale),
      zone: Number(d.zone),
      behavior: String(d.behavior),
      speed: Number(d.speed),
      radius: Number(d.radius),
      phase: d.phase === undefined ? undefined : Number(d.phase),
    };
  });
}

/** Every problem in every course document (empty when all are fine). Used by the tests and by the build's own check. */
export function courseProblems(): Record<CourseId, string[]> {
  const out = {} as Record<CourseId, string[]>;
  for (const id of Object.keys(COURSE_DOCS) as CourseId[]) {
    const doc = COURSE_DOCS[id];
    const problems = validateLevelDoc(doc);
    if (doc.game !== 'gnomeokemon') problems.push(`game: must be "gnomeokemon", is "${doc.game}"`);
    if (doc.id !== id) problems.push(`id: must match the course "${id}"`);
    const rail = doc.paths.find((p) => p.id === 'rail');
    if (!rail) problems.push('paths: no "rail" road');
    else if (doc.data.railLift.length !== rail.points.length) problems.push('data.railLift: one lift per rail point');
    out[id] = problems;
  }
  return out;
}
