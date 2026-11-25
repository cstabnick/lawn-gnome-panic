Epic: E06-2 Fill (Sky, weather and time), issue 2H tests for the foundation
Depends on: none
Worker: haiku

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`, game `games/gnome-theft-auto` (vitest, node environment). Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time. Only touch the files listed under Change (all test files). Do not change any non-test code; if a test shows a real bug, report it with the failing case instead of fixing the code. Do not commit. Keep LF line endings.

## Goal
Unit tests for the weather schedule, the atmosphere's time-lapse and weather look, staggered headlights, and the slower
event cadence.

## Read first
- `games/gnome-theft-auto/src/weather/schedule.ts`: `hash01`, `weatherBlock`, `weatherForTime(utcSeconds, region)`, `stepWeather(cur, target, dt)`; `src/weather/config.ts` (`WEATHER.blockSeconds` 600, `fadeSeconds` 18, `CLIMATE`); `src/weather/index.ts` (`updateWeather`, `getWeather`, `forceWeather`, `onWeather`, `_resetWeatherForTests(now?)`).
- `games/gnome-theft-auto/src/atmosphere.ts`: `createAtmosphere(scene, sun, hemi)` and its controller (`render(dt, x, z, biome)` advances the sky but not the world clock; `getPhase`, `setPhase`, `displayPhase`, `timeLapseTo(target, seconds)`, `releaseLapse(seconds)`, `lapsing()`, `advanceWorldTime(target, seconds)`, `setMode`/`getMode`), the pure `applyWeatherLook(state, overcast, mist)`, `computeAtmosphereState`, `forwardDelta`, `shortestDelta`, `targetPhase`.
- `games/gnome-theft-auto/src/atmosphere.test.ts`: the existing style (append to it).
- `games/gnome-theft-auto/src/vehicles.ts`: `HEADLIGHT_DUSK = [0.3, 0.6]`, `headlightThreshold(id)`, `setVehicleHeadlights(vehicles, night, forceOn)` (vehicles with `.headlights` an Object3D, `.id`, `.exploded`).
- `games/gnome-theft-auto/src/events/director.test.ts` and `src/events/director.ts` (`DIRECTOR.gapMin` 45, `gapMax` 90, `firstDelay` 25).

## Change
- New `games/gnome-theft-auto/src/weather/schedule.test.ts`:
  - `weatherForTime` is deterministic (same args twice, equal) and constant inside a block (t and t + 599 of the same block agree), and over 2000 consecutive blocks for 'turfton' every kind it rolls has a weight in `CLIMATE.turfton` (never 'snow'); 'frostbite-fells' and 'north-highlands' never roll 'rain'; 'dust-flats' is clear more than half the time; 'pardonlin' rain intensity never exceeds 0.45; clear always has intensity 0, others within 0.35..1.
  - Fronts are shared: over 2000 blocks, when 'pardonlin' (rain weight 0.4) is not raining, 'turfton' never rains (rain is the top of the shared roll in both; assert it, or weaken to "turfton rains in at most 2 percent of blocks where pardonlin is clear" if the strict form fails, and say so).
  - `stepWeather`: clear -> rain 1 reaches intensity 1 after 18 s of steps and not before 17 s; rain 1 -> snow 0.5 first fades rain to 0 (kind stays 'rain' while intensity > 0) then switches to 'snow' and rises to 0.5.
  - index.ts: with `_resetWeatherForTests(() => 1000)`, `forceWeather('rain', 1, true)` makes `getWeather()` rain 1 at once; `onWeather` fires once when `updateWeather` changes the kind, not on intensity-only changes.
- `games/gnome-theft-auto/src/atmosphere.test.ts` (append a describe block; build with `new THREE.Scene()`, `new THREE.DirectionalLight()`, `new THREE.HemisphereLight()`):
  - Time-lapse does not move world time: `setPhase(0.3)`; `timeLapseTo('night', 2)` returns seconds 2; after 10 `render(0.25, 0, 0, 'city')` calls `displayPhase()` is 0.75 (within 1e-6), `getPhase()` is still 0.3 and `getMode()` still 'auto', `lapsing()` true; `releaseLapse(1)` then 8 render steps: `displayPhase()` is 0.3 (within 1e-6), `lapsing()` false, mode still 'auto'.
  - The lapse goes forward: halfway through a lapse from 0.3 to 0.75, the display phase is between 0.3 and 0.75.
  - Already there: with `setMode('night')` then a render, `timeLapseTo('night', 2).seconds` is 0.
  - A fixed mode is restored: `setMode('noon')`, lapse to 'golden', release, render: `getMode()` is 'noon' and `displayPhase()` 0.25.
  - `advanceWorldTime('night', 1)` then 6 render steps: `getPhase()` is 0.75 and `lapsing()` false.
  - `applyWeatherLook(s, 0, 0)` returns `s` unchanged; `(s, 1, 0)` lowers `sunIntensity` and `fogFar`; `(s, 0, 1)` lowers `fogNear` and `fogFar` more than overcast does.
  - `forwardDelta(0.9, 0.1)` is 0.2; `shortestDelta(0.1, 0.9)` is -0.2; `targetPhase('golden')` is 0.5.
- New `games/gnome-theft-auto/src/headlights.test.ts`: `headlightThreshold` over ids 1..500 stays inside [0.3, 0.6], spreads (at least 4 of the 6 bins of width 0.05 hold ids, and min/max are more than 0.2 apart), and is stable (same id, same value). `setVehicleHeadlights` on fake vehicles (`{ id, headlights: new THREE.Group(), exploded: false } as unknown as Vehicle`): at night 0.45 some but not all are lit; at 1 all lit; at 0 none; an exploded one never; `forceOn` lights one at 0.
- `games/gnome-theft-auto/src/events/director.test.ts`: add `it('spaces street events further apart (L71)', ...)` asserting `DIRECTOR.gapMin === 45`, `DIRECTOR.gapMax === 90`, `DIRECTOR.firstDelay === 25`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/weather/schedule.test.ts src/atmosphere.test.ts src/headlights.test.ts src/events/director.test.ts` passes.

## Out of scope
Any non-test file. `src/weather/options.test.ts`, `render.test.ts` and `achievements.test.ts` belong to other workers.
