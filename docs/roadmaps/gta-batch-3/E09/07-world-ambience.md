Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first. `src/sound/ambience.ts` and `src/sound/ambience.test.ts` may be
CRLF: edit them with the Edit tool only.

## Goal
L64 + E06's deferred weather sound: the world ambience hears the weather (a rain bed, wind up in rain, snow muffling
everything) and the batch-3 regions get their own bed tweaks and spot sounds (Snowcap Rise, Saltbucket Shore, Rootwell,
Trellisdown, Pardonlin, the Unmown). The ten region spot-sound recipes stop being placeholder ticks.

## Read first
- `games/gnome-theft-auto/src/sound/ambience.ts`: `AmbienceFrame` (now has optional `weather?: WeatherState | null` and
  `region?: RegionId`, already passed in by `sound/index.ts` from app.ts), `LayerKey`, `LAYER_KEYS`, `ZERO_MIX`, `DAY`,
  `bedMix(...)` (pure), `buildLayers` (`make(filterType, freq, q, lfoHz, depth, humHz?)`), `pickSpot`, and `update()`
  (`windCut`, `spotTimer`, `playAt(id, pos, { bus: 'ambience', gain })`).
- `games/gnome-theft-auto/src/sound/ambience.test.ts`: how `bedMix` is tested (node, window stub).
- `games/gnome-theft-auto/src/sound/recipes/regions.ts`: placeholder recipes for `REGION_SOUNDS` ('surf-wash',
  'buoy-bell', 'snow-creak', 'icicle-tink', 'cafe-clink', 'chapel-chime', 'grass-hiss', 'thunder-far', 'campus-bell',
  'sprinkler-tick'). `Recipe = (c, out, t, info: { dist, rand, param }) => seconds`; every source must be stopped by
  `t + returned seconds + 0.05` (see `src/sound/recipes/recipes.test.ts`).
- `games/gnome-theft-auto/src/sound/synth.ts`: `burst(c, out, t, dur, type, f0, f1, peak, q?, attack?)`,
  `tone(c, out, oscType, t, dur, f0, f1, peak, attack?)`, `voiced(...)`, and `src/sound/recipes/critters.ts` for the
  style (e.g. the gull).
- Region ids (`src/levels.ts RegionId`): 'north-highlands' = Snowcap Rise, 'south-shore' = Saltbucket Shore,
  'east-campus' = Rootwell, 'west-estates' = Trellisdown, 'pardonlin' = Pardonlin, 'the-unmown' = the Unmown.
  `WeatherState` = `{ kind: 'clear' | 'cloud' | 'mist' | 'rain' | 'snow'; intensity: 0..1 }` (`src/weather/types.ts`).

## Change
- `src/sound/ambience.ts`:
  - Add a `rain` layer: `LayerKey` gains `'rain'`, `LAYER_KEYS` and `ZERO_MIX` too; in `buildLayers` `rain:
    make('highpass', 1400, 0.5, 0.17, 0.25)`. `bedMix` returns `rain: 0` (unchanged otherwise).
  - New pure exports:
    ```ts
    /** Weather on top of a bed mix: rain bed and more wind in rain; snow hushes every layer but the wind. */
    export function weatherMix(m: Record<LayerKey, number>, w: WeatherState | null | undefined): Record<LayerKey, number>;
    /** Per-region tweaks for the batch-3 regions (others unchanged). */
    export function regionMix(m: Record<LayerKey, number>, region: RegionId | undefined): Record<LayerKey, number>;
    /** A region or weather spot sound, or null to fall back to the biome's pickSpot. `r` is a random 0..1. */
    export function pickRegionSpot(region: RegionId | undefined, night: boolean, w: WeatherState | null | undefined, r: number): { id: string; gain?: number; near?: [number, number] } | null;
    export type { LayerKey };
    ```
    Numbers: rain: `rain = 0.05 * i` (0.075 * i when i > 0.8), `wind += 0.015 * i`; snow: every layer except wind
    times `1 - 0.5 * i`, `wind = Math.max(wind, 0.03 * i)`; cloud: `wind += 0.004`; clear/mist/null: unchanged. Return a
    new object. Regions: north-highlands wind +0.015; south-shore water +0.03, wind +0.01; east-campus hum = max(hum,
    0.012), leaves +0.008; west-estates leaves +0.012, water +0.008 (fountains); pardonlin hum = max(hum, 0.02), crowd =
    max(crowd, 0.012); the-unmown leaves +0.015, wind +0.006.
    Spots (use `r` to choose; return null about half the time so the biome still speaks): rain with intensity > 0.6:
    'thunder-far' when r < 0.15; south-shore 'surf-wash' / 'buoy-bell' (gain 0.6, near [40, 90]); north-highlands
    'snow-creak' (near [6, 15]) / 'icicle-tink' / 'wind-gust'; pardonlin by day 'cafe-clink' (near [8, 25]) /
    'chapel-chime' (gain 0.5, near [80, 160]); the-unmown 'grass-hiss' (day) and 'cricket' (night); east-campus
    'campus-bell' (gain 0.5, near [80, 160]) rarely (r < 0.1); west-estates 'sprinkler-tick' (near [10, 30]).
  - `update()`: `const mix = silent ? ZERO_MIX : regionMix(weatherMix(bedMix(...), f.weather), f.region)`. In snow
    (`f.weather?.kind === 'snow'`) the wind filter cut is 300. Spots: before `pickSpot`, try
    `pickRegionSpot(f.region, f.night >= 0.5, f.weather, Math.random())`; use it when non-null.
- `src/sound/recipes/regions.ts`: real recipes, each 0.1..3 s, peaks 0.05..0.35, small variation from `info.rand`:
  surf-wash (lowpass noise swell 2.5 s, 300->700->300 Hz), buoy-bell (two-partial bell 520/1300 Hz, 2.5 s decay),
  snow-creak (a slow narrow bandpass sawtooth creak 0.3 s), icicle-tink (2-3 high sine pings 3-5 kHz), cafe-clink (two
  pings 2.6/3.4 kHz), chapel-chime (three bell notes descending, 0.5 s apart), grass-hiss (bandpass 3 kHz noise swell
  1.2 s), thunder-far (lowpass noise 160->60 Hz swell 2.8 s plus a low sine), campus-bell (one big bell 330/830 Hz, 3 s),
  sprinkler-tick (10 highpass ticks 0.09 s apart then a soft hiss).
- `src/sound/ambience.test.ts`: add tests: `weatherMix` with rain 1 has rain > 0 and more wind than clear; snow 1 lowers
  leaves and hum; null leaves the mix equal; `regionMix('south-shore')` raises water; `pickRegionSpot` returns only ids
  that `hasSound` knows (import `ALL_SOUNDS` from `./ids` plus the critter ids) for 50 values of r across regions.

## Contract
`bedMix` keeps its signature. `AmbienceFrame` fields unchanged. Recipe ids unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sound/ambience.test.ts src/sound/recipes/recipes.test.ts` passes.
- `npx tsc --noEmit -p .` passes.
- `git diff --stat` shows no whole-file rewrite of `ambience.ts`.

## Out of scope
`src/sound/index.ts`, `src/app.ts`, `src/sound/ids.ts`, `src/sound/recipes/world.ts` (issue 01), `src/sound/bus.ts`.
