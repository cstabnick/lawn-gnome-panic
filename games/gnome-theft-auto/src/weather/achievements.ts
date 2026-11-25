// Weather achievements (E06): "Caught in the Rain" and "Glazed Over". Seconds are counted per session (not saved).
import type { WeatherState } from './types';
import { WEATHER } from './config';

export interface WeatherAchievementDeps {
  unlock(id: string): unknown;
}

export interface WeatherAchievementFrame {
  dt: number;
  weather: WeatherState;
  /** Weather shown (Options on). Nothing counts while it is off. */
  enabled: boolean;
  /** Out under the sky: on foot or in an open vehicle, not inside an interior, not in a cutscene. */
  exposed: boolean;
}

export interface WeatherAchievements {
  update(f: WeatherAchievementFrame): void;
}

interface Counter {
  kind: WeatherState['kind'];
  id: string;
  limitS: number;
  seconds: number;
  done: boolean;
}

export function createWeatherAchievements(deps: WeatherAchievementDeps): WeatherAchievements {
  const counters: Counter[] = [
    { kind: 'rain', id: 'gta-caught-in-rain', limitS: WEATHER.rainAchievementS, seconds: 0, done: false },
    { kind: 'snow', id: 'gta-glazed-over', limitS: WEATHER.snowAchievementS, seconds: 0, done: false },
  ];

  return {
    update(f) {
      if (!f.enabled || !f.exposed) return;
      for (const c of counters) {
        if (c.done) continue;
        if (f.weather.kind !== c.kind || f.weather.intensity < WEATHER.achievementMinIntensity) continue;
        c.seconds += f.dt;
        if (c.seconds >= c.limitS) {
          c.done = true;
          deps.unlock(c.id);
        }
      }
    },
  };
}
