// The island course as pure functions of (x, z): ground height and lie. No three.js scene code here.
// physics.ts, round.ts and world.ts all read the same functions, so what you see is what the ball hits.
// createCourse, distToPath and holeLength live in @lawn/golf (shared with other games).
import { HOLES, ISLAND } from './config';
import { createCourse } from '@lawn/golf';

export { createCourse, distToPath, holeLength } from '@lawn/golf';
export type { CourseSource, IslandParams } from '@lawn/golf';

const DEFAULT = createCourse({ island: ISLAND, holes: HOLES });
export const { coastRadius, distToCoast, heightAt, gradientAt, lieAt } = DEFAULT;
