# E06 contracts: weather, time-lapse, headlights, sky presence

For E12 (winter sports), E10 (homes: "sleep until night"), E07 (Options registry), E11 (coast) and anyone reading the sky.
Paths are under `games/gnome-theft-auto/src/`.

## Weather (`weather/index.ts`)

```ts
type WeatherKind = 'clear' | 'cloud' | 'mist' | 'rain' | 'snow';
interface WeatherState { kind: WeatherKind; intensity: number } // 0..1; clear is always 0

getWeather(): WeatherState                       // where the player is, faded (what the sky shows)
weatherAt(region: RegionId): WeatherState         // scheduled weather in a region now (no fade; a forced kind wins)
weatherAtPoint(x, z): WeatherState
weatherForTime(utcSeconds, region): WeatherState  // pure; the same on every machine (re-exported from schedule.ts)
onWeather(cb: (w) => void): () => void            // fires when the faded kind changes
setWeatherEnabled(on) / isWeatherEnabled()        // Options view switch (local)
forceWeather(kind | null, intensity = 1, snap = false)  // trainer, demos, ?weather=; null = back to the schedule
updateWeather(dt, x, z)                           // app.ts calls this once per frame; nobody else should
```

- Schedule: 10-minute wall-clock blocks (`WEATHER.blockSeconds`); every region rolls the same number per block (a front
  crosses the map) and its `CLIMATE[region]` weights decide what it means there. Snow falls only in `frostbite-fells`
  and `north-highlands` (Snowcap Rise). Mist: Saltbucket Shore, Loch Moss, Mossy Wood. Pardonlin drizzles
  (`rainMax` 0.45). Tune in `weather/config.ts`.
- **E12:** read `weatherAt('north-highlands')` / `getWeather()` for snowfall; gameplay should use the state even when the
  player switched weather off (`isWeatherEnabled()` is only about drawing). Ski runs can force snow for a race with
  `forceWeather('snow', 0.7)` and must call `forceWeather(null)` afterwards. "Glazed Over" (`gta-glazed-over`, 60 s out
  in falling snow) is E06's; E12 adds its own snow achievements.
- Gameplay: is the gnome exposed? E06 counts "exposed" as outside an interior and not in a cutscene
  (`weather/achievements.ts`).
- URL: `?weather=off|on|clear|cloud|mist|rain|snow`, `?weather=rain:0.4`. Options: "Weather: on / off"
  (`weather/options.ts mountWeatherOptions(panel)`, localStorage `gta-weather`). **E07:** fold this row into the options
  registry (section "World" or "Display"), keeping the key.
- Online: nothing on the wire. Forced kinds and the switch are local.
- Debug: `__gta.weather.force('rain', 0.8, true)`, `.get()`, `.at('pardonlin')` under `?debug`.
- Fishing: `fishing/pick.ts weatherAt(region, time)` maps it to `FishWeather` ('clear' | 'mist' | 'rain' | 'snow').

## Drawing (`weather/render.ts`)

`createWeatherView(scene)` returns `{ root, update(dt, camera, state, { night, tier, visible }), dispose }`. All weather
nodes live under `root` (named 'weather'), which leaves the scene while hidden. Budgets per tier in
`WEATHER_TIERS` (config.ts). app.ts hides it whenever the camera is off the map (interiors, cutscene rooms).

## Atmosphere additions (`atmosphere.ts`)

```ts
getPhase(): number; setPhase(p): void;          // the world clock (0.25 noon, 0.5 golden, 0.75 night)
displayPhase(): number;                          // what the sky is drawn at
timeLapseTo(mode | phase, seconds): TimeLapse    // visual only: scrub forward, then hold
releaseLapse(seconds): TimeLapse                 // scrub back (shortest way) to world time, drop the hold
lapsing(): boolean
advanceWorldTime(mode | phase, seconds = 2): TimeLapse  // intentional: scrubs, then sets the world clock (mode -> 'auto')
render(dt, x, z, biome)                          // draw the sky without advancing the world clock
setWeatherLook(overcast, mist)                   // app.ts feeds it from WEATHER_LOOK
interface TimeLapse { seconds: number; done: Promise<void> }
TIME_LAPSE = { inSeconds: 2.6, outSeconds: 1.6 }
```

- **E10** ("sleep until night"): `await atmosphere.advanceWorldTime('night', 3).done`.
- Cutscenes: a world-stage scene with `sky:` time-lapses into it (director holds the first shot for the returned
  seconds, with a "Time passes…" badge) and scrubs back when it ends. World time never moves.

## Headlights (`vehicles.ts`)

`setVehicleHeadlights(vehicles, night: number, forceOn?)`: each vehicle lights at `headlightThreshold(id)` within
`HEADLIGHT_DUSK` [0.30, 0.60] of the night factor. Pass 1 for "all on", 0 for "off" (scene vehicles do).

## Sky traffic presence (`skyTraffic/`)

`SkyBehaviourDef.presence?: { onFor: [min, max]; offFor: [min, max] }` (seconds). The banner tow flies ~2 minutes, then is
away 3-5. Pure helpers in `skyTraffic/presence.ts`. Rolled by the owning runtime; mirrors (`online/skySync.ts`) only mirror.

## Event cadence

`worldEvents.ts EVENT_INTERVAL` 160 (was 110); `events/director.ts DIRECTOR.gapMin/gapMax` 45/90 (was 30/60).
