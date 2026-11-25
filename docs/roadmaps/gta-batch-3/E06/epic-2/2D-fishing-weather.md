Epic: E06-2 Fill (Sky, weather and time), issue 2D fishing reads the weather
Depends on: none (the foundation is in place)
Worker: haiku

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`, game `games/gnome-theft-auto`. Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time. Only touch the files listed under Change. Do not commit. Keep LF line endings.

## Goal
Fishing's `weatherAt(region, time)` reads the real weather module instead of its stub rule, and `FishWeather` gains `'rain'`,
so fish bite differently in rain.

## Read first
- `games/gnome-theft-auto/src/fishing/pick.ts`: `weatherAt(region, time)` (line ~18) today: Frostbite Fells 'snow'; Loch Moss at Dawn/Morning 'mist'; else 'clear'.
- `games/gnome-theft-auto/src/fishing/types.ts`: `export type FishWeather = 'clear' | 'mist' | 'snow';` (line 13) and the comment above it.
- `games/gnome-theft-auto/src/fishing/pick.test.ts` (around line 149): the `weatherAt` test.
- `games/gnome-theft-auto/src/fishing/species.ts`: species carry `weather: { mist: 2.5 }` style weights.
- `games/gnome-theft-auto/src/weather/index.ts`: `weatherAt(region): WeatherState` (`{ kind: 'clear'|'cloud'|'mist'|'rain'|'snow'; intensity }`), `forceWeather(kind | null, intensity?, snap?)`, `_resetWeatherForTests()`.

## Change
- `games/gnome-theft-auto/src/fishing/types.ts`: `export type FishWeather = 'clear' | 'mist' | 'rain' | 'snow';` and update the comment: weather comes from `src/weather/` (pick.ts weatherAt).
- `games/gnome-theft-auto/src/fishing/pick.ts`: `import { weatherAt as skyAt } from '../weather';` and rewrite `weatherAt(region, time)` (same signature):
  1. Frostbite Fells is always 'snow' (frost glaze lies on the ice even between falls; this keeps the old odds).
  2. `const w = skyAt(region)`; if `w.kind === 'snow' && w.intensity > 0.15` -> 'snow'; `'rain'` with intensity > 0.15 -> 'rain'; `'mist'` -> 'mist'.
  3. Else Loch Moss at Dawn or Morning -> 'mist' (the old rule stays as the morning mist).
  4. Else 'clear' ('cloud' counts as clear).
  Update the doc comment above it.
- `games/gnome-theft-auto/src/fishing/species.ts`: give two or three existing freshwater species that would plausibly like rain (worms washed in) a `rain` weight between 1.5 and 2.2 in their `weather` record (add the record if missing). Do not change anything else about them.
- `games/gnome-theft-auto/src/fishing/pick.test.ts`: make the existing `weatherAt` test deterministic with `forceWeather('clear')` before it (and `_resetWeatherForTests()` after, in `afterEach`), keep its expectations, and add: with `forceWeather('rain', 0.8)` `weatherAt('turfton', 'Noon')` is 'rain'; Fells stays 'snow' under forced rain; `forceWeather('mist')` gives 'mist' anywhere but the Fells; a rain-loving species has a higher `fishWeight` in rain than in clear.

## Contract
`weatherAt(region: RegionId, time: TimeLabel): FishWeather` keeps its signature (fishing.ts calls it). `FishWeather` adds `'rain'`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/fishing` passes.

## Out of scope
`src/weather/*`, `fishing/fishing.ts`, every other file.
