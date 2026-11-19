// A ghost made by the CPU driver, for demos and smoke tests ('#seedghost'): the pure sim plays a whole solo trial
// headless, so a fresh browser profile has something to race. Not used in normal play.
import { RACE, type CourseId, type VehicleId } from './config';
import { createRecorder, type GhostRun } from './ghost';
import { cpuInput, createRace, stepRace } from './sim';

const STEP = 1 / 60;

/** One full solo trial driven by the CPU driver at the given top-speed factor, or null if it never finishes. */
export function recordCpuGhost(course: CourseId, vehicle: VehicleId, color: number, skill = 0.9): GhostRun | null {
  const race = createRace([{ vehicle, skill }], course);
  race.boxes = race.boxes.map(() => Infinity);
  const rec = createRecorder();
  rec.push(race.karts[0], 0);
  const lapTimes: number[] = [];
  for (let i = 0; i < 400 / STEP && race.karts[0].fin === null; i++) {
    const lap = race.karts[0].lap;
    stepRace(race, [cpuInput(race, 0)], STEP);
    rec.push(race.karts[0], race.t);
    if (race.karts[0].lap > lap) lapTimes.push(race.t);
  }
  return rec.finish({ course, vehicle, laps: RACE.laps, lapTimes, fin: race.karts[0].fin, color, gnome: null,
    name: 'Gnorbert', at: new Date().toISOString() });
}
