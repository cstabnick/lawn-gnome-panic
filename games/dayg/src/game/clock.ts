// Sun time: real seconds to sun-hours, day and night, light and season. Emits 'dusk' and 'dawn'.
import { SUN } from '../config';
import type { Tuning } from '../sim/types';
import { isNight, seasonOf } from '../sim/weather';
import type { Bus } from './bus';
import type { Clock } from './types';

export function createClock(bus: Bus, opts: { startSunHours: number; timeScale: number; tuning: Tuning }): Clock {
  const t = opts.tuning;
  const lightAt = (h: number): number => {
    if (isNight(h, t)) return 0;
    const afterDawn = (h - t.clock.nightEndHour) / 2;
    const beforeDusk = (t.clock.nightStartHour - h) / 2;
    return Math.max(0, Math.min(1, afterDawn, beforeDusk));
  };
  const clock: Clock = {
    sunHours: opts.startSunHours, hourOfDay: 0, day: 1, night: false, light: 1, season: t.clock.startSeason, rate: 1,
    update(dt) {
      const advance = (dt * opts.timeScale * clock.rate) / SUN.realSecondsPerSunHour;
      clock.sunHours += advance;
      const wasNight = clock.night;
      recompute();
      if (clock.night !== wasNight) bus.emit(clock.night ? 'dusk' : 'dawn', { day: clock.day });
      return advance;
    },
    setRate(rate) { clock.rate = rate; },
  };
  function recompute(): void {
    clock.hourOfDay = clock.sunHours % 24;
    clock.day = Math.floor(clock.sunHours / 24) + 1;
    clock.night = isNight(clock.hourOfDay, t);
    clock.light = lightAt(clock.hourOfDay);
    clock.season = seasonOf(clock.day, t);
  }
  recompute();
  return clock;
}
