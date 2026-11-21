import { describe, expect, it } from 'vitest';
import {
  COURSE_ORDER,
  COURSE_STORY,
  FINALE_POINTS,
  collectNewMilestones,
  computeTotalPoints,
  getHighestUnlockedIncompleteCourse,
  getLabRank,
  getNextLockedCourse,
  getUnlockedCourses,
  isCourseUnlocked,
} from './progression';
import type { BestPhotoMap } from './storage';
import type { PhotoGrade, PhotoRecord } from './types';

function fakePhoto(speciesId: string, total: number, grade: PhotoGrade = 'Silver'): PhotoRecord {
  return {
    id: `id-${speciesId}`,
    speciesId,
    dex: '001',
    name: speciesId,
    element: 'bloom',
    capturedAt: 1,
    dataUrl: '',
    score: {
      size: 500,
      framing: 500,
      pose: 500,
      special: Math.max(0, total - 1500),
      total,
      specialLabels: [],
      grade,
    },
    snapshot: {
      dogT: 0,
      cameraPos: [0, 0, 0],
      cameraQuat: [0, 0, 0, 1],
      fov: 50,
      creatures: [],
    },
  };
}

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('progression', () => {
  it('computes total points from best photos', () => {
    const best: BestPhotoMap = {
      sproutling: fakePhoto('sproutling', 2400),
      mossback: fakePhoto('mossback', 3100, 'Gold'),
    };
    expect(computeTotalPoints(best)).toBe(5500);
  });

  it('unlocks courses at their exact point thresholds', () => {
    expect(getUnlockedCourses(0)).toEqual(['lawn']);
    expect(isCourseUnlocked('desert', 9999)).toBe(false);
    expect(isCourseUnlocked('desert', 10000)).toBe(true);
    expect(getUnlockedCourses(30000)).toEqual(['lawn', 'desert', 'depths', 'kiln']);
    expect(getUnlockedCourses(65000)).toEqual(COURSE_ORDER.slice(0, 7));
    expect(getUnlockedCourses(72000)).toEqual(COURSE_ORDER);
  });

  it('returns the next locked course and remaining points', () => {
    expect(getNextLockedCourse(0)).toEqual({ courseId: 'desert', unlockPts: 10000, remainingPts: 10000 });
    expect(getNextLockedCourse(12500)).toEqual({ courseId: 'depths', unlockPts: 20000, remainingPts: 7500 });
    expect(getNextLockedCourse(65000)).toEqual({ courseId: 'city', unlockPts: 72000, remainingPts: 7000 });
    expect(getNextLockedCourse(72000)).toBeNull();
  });

  it('picks the highest unlocked incomplete course for Quick Ride', () => {
    const spawns: Record<string, string[]> = {
      lawn: ['sproutling'],
      desert: ['cactuskin'],
      depths: ['rustcrab'],
    };
    const getter = (c: string): string[] => spawns[c] ?? ['other'];

    // 0 pts -> only lawn unlocked
    expect(getHighestUnlockedIncompleteCourse({}, getter)).toBe('lawn');

    // 10,500 pts -> desert unlocked & incomplete
    const best1: BestPhotoMap = { sproutling: fakePhoto('sproutling', 10500, 'Divine') };
    expect(getHighestUnlockedIncompleteCourse(best1, getter)).toBe('desert');

    // 21,000 pts -> depths unlocked, desert complete -> depths
    const best2: BestPhotoMap = {
      sproutling: fakePhoto('sproutling', 10500),
      cactuskin: fakePhoto('cactuskin', 10500),
    };
    expect(getHighestUnlockedIncompleteCourse(best2, getter)).toBe('depths');
  });

  it('tracks Lab ranks and progress fraction', () => {
    expect(getLabRank(0).current.title).toBe('Porch Intern');
    expect(getLabRank(10000).current.title).toBe('Dewdrop Spotter');
    const mid = getLabRank(17500);
    expect(mid.current.title).toBe('Dewdrop Spotter');
    expect(mid.next?.title).toBe('Field Surveyor');
    expect(mid.progressFrac).toBeCloseTo(0.5);
    expect(getLabRank(120000).next).toBeNull();
  });

  it('announces course unlocks, rank ups, and finale once', () => {
    const store = memoryStorage();
    const best: BestPhotoMap = { sproutling: fakePhoto('sproutling', 10500) };

    const first = collectNewMilestones(10500, best, store);
    expect(first.map((m) => m.kind)).toEqual(['course', 'rank']);
    expect(first[0]).toMatchObject({ kind: 'course', courseId: 'desert', unlockPts: COURSE_STORY.desert.unlockPts });

    // Repeating at the same points yields nothing
    expect(collectNewMilestones(10500, best, store)).toEqual([]);

    // Reaching finale yields remaining courses, rank, and finale
    const finaleBest: BestPhotoMap = { gnomejesus: fakePhoto('gnomejesus', 3000, 'Gold') };
    const end = collectNewMilestones(FINALE_POINTS, finaleBest, store);
    const finale = end.find((m) => m.kind === 'finale');
    expect(finale).toBeDefined();
    if (finale?.kind === 'finale') {
      expect(finale.page036Note).toContain('Even thirty-six');
    }
    expect(collectNewMilestones(FINALE_POINTS, finaleBest, store)).toEqual([]);
  });
});
