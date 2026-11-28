Epic: E06-2 Fill (Sky, weather and time), issue 2B weather option, ?weather= and trainer
Depends on: none (the foundation is in place)
Worker: haiku

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`, game `games/gnome-theft-auto` (three.js, Vite, TypeScript). Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time. Only touch the files listed under Change. Do not commit. Keep LF line endings.

## Goal
A "Weather: on / off" row in the Options panel (saved in localStorage), a `?weather=` URL parameter, and a Weather block
in the Save Trainer's World tab that forces a kind.

## Read first
- `games/gnome-theft-auto/src/weather/options.ts`: the stub; keep every exported signature.
- `games/gnome-theft-auto/src/weather/index.ts`: `setWeatherEnabled(on)`, `isWeatherEnabled()`, `forceWeather(kind | null, intensity = 1, snap = false)`, `forcedWeather()`, `getWeather()`.
- `games/gnome-theft-auto/src/waveOptions.ts`: the pattern to copy exactly (localStorage key with try/catch, URL param not saved, `mountWaveOptions(panel)` building a `.gta-opt-note` heading and a `.gta-opt-list` with one `button.gta-opt-mode` whose innerHTML is `Label: value<small>help</small>`; the CSS already makes it 48 px tall).
- `games/gnome-theft-auto/src/options.ts` around line 229: `mountWaveOptions(panel);` is where the new row is mounted.
- `games/gnome-theft-auto/src/trainer/sections/world.ts`: `buildTime` and the `button`, `grid`, `heading`, `note` helpers from `../ui`.

## Change
- `games/gnome-theft-auto/src/weather/options.ts`: implement
  - `const KEY = 'gta-weather'` (values `'on'` / `'off'`).
  - `parseWeatherParam(search)`: reads `?weather=`. `0`/`off`/`false` -> `{ enabled: false }`; `1`/`on`/`true` -> `{ enabled: true }`; `clear|cloud|mist|rain|snow` -> `{ enabled: true, force: { kind, intensity: 1 } }`; `rain:0.4` style (kind, colon, number 0..1) -> force with that intensity (clamped); anything else or absent -> `null`. Case-insensitive.
  - `getSavedWeatherEnabled()` (default true, try/catch), `saveWeatherEnabled(on)` (try/catch).
  - `initWeatherOptions(search)`: `const p = parseWeatherParam(search); setWeatherEnabled(p?.enabled ?? getSavedWeatherEnabled()); if (p?.force) forceWeather(p.force.kind, p.force.intensity, true);` (the URL value is not saved).
  - `mountWeatherOptions(panel)`: heading `Weather`, one button `Weather: on|off<small>Rain, snow, mist and clouds. Off clears the sky and saves a little battery.</small>`; a click toggles `setWeatherEnabled(!isWeatherEnabled())`, saves, repaints.
- `games/gnome-theft-auto/src/options.ts`: import `mountWeatherOptions` from `./weather/options` and call `mountWeatherOptions(panel);` right after `mountWaveOptions(panel);` with a comment `// Weather: on / off (src/weather/options.ts; E07's options registry will take this row over).` Nothing else in this file.
- `games/gnome-theft-auto/src/trainer/sections/world.ts`: add `buildWeather(el)` after the time block (call it where `buildTime` is called): heading `Weather`, buttons `Schedule` (forceWeather(null)), `Clear`, `Cloud`, `Mist`, `Rain`, `Drizzle` (rain 0.35), `Snow`, each calling `forceWeather(kind, intensity, true)`, in a `grid(...)`, plus a `note('Forced weather is local to this browser; Schedule goes back to the shared one.')`. Import from `../../weather`.
- New `games/gnome-theft-auto/src/weather/options.test.ts` (vitest, node env; stub `localStorage` with a Map-backed object on `globalThis` in `beforeEach` like `src/waveOptions.test.ts` does if it does): parse cases above; `initWeatherOptions('?weather=off')` leaves `isWeatherEnabled()` false; `initWeatherOptions('?weather=rain:0.4')` makes `getWeather()` `{ kind: 'rain', intensity: 0.4 }`; saved 'off' with no param -> disabled. Call `_resetWeatherForTests()` from `./index` in `beforeEach`.

## Contract
Signatures in `weather/options.ts` stay exactly as in the stub:
`parseWeatherParam(search: string): WeatherParam | null`, `getSavedWeatherEnabled(): boolean`, `saveWeatherEnabled(on: boolean): void`, `initWeatherOptions(search: string): void`, `mountWeatherOptions(panel: HTMLElement): void`. `app.ts` already calls `initWeatherOptions(location.search)` at start.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/weather/options.test.ts src/waveOptions.test.ts` passes.

## Out of scope
`app.ts`, `weather/index.ts`, `weather/render.ts`, `waveOptions.ts`, any other trainer section.
