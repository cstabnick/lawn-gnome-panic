import { describe, it, expect, vi } from 'vitest';
import { createWeatherAchievements, type WeatherAchievementFrame } from './achievements';

function frame(over: Partial<WeatherAchievementFrame> = {}): WeatherAchievementFrame {
  return { dt: 1, weather: { kind: 'rain', intensity: 1 }, enabled: true, exposed: true, ...over };
}

describe('weather achievements', () => {
  it('unlocks Caught in the Rain once after 121 s of rain', () => {
    const unlock = vi.fn();
    const a = createWeatherAchievements({ unlock });
    for (let i = 0; i < 121; i++) a.update(frame());
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(unlock).toHaveBeenCalledWith('gta-caught-in-rain');
  });

  it('counts nothing when not exposed or when weather is off', () => {
    const unlock = vi.fn();
    const a = createWeatherAchievements({ unlock });
    for (let i = 0; i < 200; i++) a.update(frame({ exposed: false }));
    for (let i = 0; i < 200; i++) a.update(frame({ enabled: false }));
    expect(unlock).not.toHaveBeenCalled();
  });

  it('ignores light rain', () => {
    const unlock = vi.fn();
    const a = createWeatherAchievements({ unlock });
    for (let i = 0; i < 200; i++) a.update(frame({ weather: { kind: 'rain', intensity: 0.2 } }));
    expect(unlock).not.toHaveBeenCalled();
  });

  it('unlocks Glazed Over after 61 s of snow', () => {
    const unlock = vi.fn();
    const a = createWeatherAchievements({ unlock });
    for (let i = 0; i < 61; i++) a.update(frame({ weather: { kind: 'snow', intensity: 1 } }));
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(unlock).toHaveBeenCalledWith('gta-glazed-over');
  });
});
