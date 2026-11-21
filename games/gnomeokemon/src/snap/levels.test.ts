import { describe, expect, it } from 'vitest';
import { FORD_Z, TUBE_Z, WATER_Y, railSections } from './rail';
import { COURSE_DOCS, buildRailCurve, courseCreatures, courseProblems, groundHeight, railPoints } from './levels';
import type { CourseId } from './types';

const COURSES = Object.keys(COURSE_DOCS) as CourseId[];

/** How many times the rail turns sideways (x changes direction). A straight rail has none. */
function sideTurns(points: [number, number, number][]): number {
  let turns = 0;
  let last = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    if (Math.abs(dx) < 1e-9) continue;
    const sign = Math.sign(dx);
    if (last !== 0 && sign !== last) turns++;
    last = sign;
  }
  return turns;
}

describe('course level documents', () => {
  it('every course document is a valid lawn-level file', () => {
    for (const id of COURSES) expect(courseProblems()[id]).toEqual([]);
  });

  it('every course has a rail, roam zones, cover and creatures', () => {
    for (const id of COURSES) {
      expect(railPoints(id).length).toBeGreaterThanOrEqual(8);
      expect(courseCreatures(id).length).toBeGreaterThan(0);
    }
  });

  for (const id of COURSES) {
    describe(id, () => {
      const rail = railPoints(id);

      it('starts at the gate and ends at the Shed, falling in z all the way', () => {
        expect(rail[0][0]).toBe(0);
        expect(rail[0][1]).toBe(18);
        expect(rail[rail.length - 1][0]).toBe(0);
        expect(rail[rail.length - 1][1]).toBe(-29);
        for (let i = 1; i < rail.length; i++) expect(rail[i][1]).toBeLessThan(rail[i - 1][1]);
      });

      it('winds: the rail turns sideways several times', () => {
        expect(sideTurns(rail)).toBeGreaterThanOrEqual(3);
      });

      it('has real terrain: the ground rises and falls by at least a metre', () => {
        let lo = Infinity;
        let hi = -Infinity;
        for (let x = -12; x <= 12; x += 0.5) {
          for (let z = -30; z <= 18; z += 0.5) {
            const h = groundHeight(id, x, z);
            lo = Math.min(lo, h);
            hi = Math.max(hi, h);
          }
        }
        expect(hi - lo).toBeGreaterThanOrEqual(1);
      });

      it('the graded track is level: the ground along the rail is within 0.35 m of flat', () => {
        const curve = buildRailCurve(id);
        for (let i = 0; i <= 200; i++) {
          const p = curve.getPointAt(i / 200);
          expect(Math.abs(groundHeight(id, p.x, p.z))).toBeLessThanOrEqual(0.35);
        }
      });

      it('never runs under the ground', () => {
        const curve = buildRailCurve(id);
        for (let i = 0; i <= 200; i++) {
          const p = curve.getPointAt(i / 200);
          expect(p.y - groundHeight(id, p.x, p.z)).toBeGreaterThanOrEqual(-1e-6);
        }
      });
    });
  }

  it('no two courses share a rail (the courses should not feel the same)', () => {
    const shapes = COURSES.map((id) => JSON.stringify(railPoints(id).map(([x, z]) => [x, z])));
    expect(new Set(shapes).size).toBe(COURSES.length);
  });
});

describe('lawn water', () => {
  it('the ford runs over a stream bed: the ground under the rail is below the water sheet', () => {
    const curve = buildRailCurve('lawn');
    const sections = railSections(curve);
    const [u0, u1] = sections.ford;
    expect(u1).toBeGreaterThan(u0);
    for (let i = 0; i <= 40; i++) {
      const u = u0 + ((u1 - u0) * i) / 40;
      const p = curve.getPointAt(u);
      expect(p.z).toBeGreaterThanOrEqual(FORD_Z[0] - 0.5);
      expect(p.z).toBeLessThanOrEqual(FORD_Z[1] + 0.5);
      expect(groundHeight('lawn', p.x, p.z)).toBeLessThan(WATER_Y - 0.1);
      expect(p.y).toBeGreaterThan(WATER_Y + 0.2);
    }
  });

  it('the glass tube section is still in the lawn course', () => {
    const sections = railSections(buildRailCurve('lawn'));
    expect(sections.tube[1]).toBeGreaterThan(sections.tube[0]);
    const curve = buildRailCurve('lawn');
    const p = curve.getPointAt(sections.tube[0]);
    expect(p.z).toBeLessThanOrEqual(TUBE_Z[1] + 1);
  });
});
