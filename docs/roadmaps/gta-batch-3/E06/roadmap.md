# E06 Sky, weather and time: roadmap

Brief: [../E06-sky-weather-and-time.md](../E06-sky-weather-and-time.md). Contracts for later epics (E10, E12, E07):
[contracts.md](contracts.md).

Goal: one weather and time layer the batch can lean on (clear, cloud, mist, rain, snow, fading per region and shared
online without messages), an Options switch, headlights that come on one by one, fewer ambient motes, a visible
time-lapse into cutscenes set at another hour (world time untouched), birds that wander, planes that come and go, and
street/world events a little less often.

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| 1 Foundation | lead: `src/weather/` (types, config with per-region climate and tier budgets, pure schedule, runtime state, stubs for render/options/achievements); atmosphere: fewer/fainter motes (L05), `applyWeatherLook` + `setWeatherLook`, phase API, `timeLapseTo` / `releaseLapse` / `advanceWorldTime`, `render()` (sky without world clock); staggered `setVehicleHeadlights(vehicles, night)` (L02); `EVENT_INTERVAL` 160, `DIRECTOR.gap` 45..90 (L71); app.ts wiring (weather frame in the main, live-scene and plain-scene frames, `setSky` time-lapse hook, toasts, `__gta.weather`) | tsc | 0 (lead) |
| 2 Fill | eight parallel issues, disjoint files | each issue's own checks | 8 |
| 3 Close | lead: lore ruling, contracts, AGENT_INDEX, build, tests, smoke, zfight, phone screenshots, commit | all checks | 0 (lead) |

Online: weather is `weatherForTime(utcSeconds, region)` over 10-minute wall-clock blocks, so peers agree with nothing
on the wire; the Options switch, particle budget and forced kinds are local (like Water waves). Sky-traffic presence is
rolled by the runtime that owns the aircraft; mirrors only mirror. Time of day stays per browser; the time-lapse is local.
Mobile: particles are capped per `quality.ts` tier (`WEATHER_TIERS`; phones start on 'medium' = 40 percent of desktop),
no clouds on 'low'/'min'; weather Off removes the group from the scene. No new controls.
Party slice: none (no new activity).

## Epic 2 issues (all parallel)

| Issue | Worker | Files it owns |
|---|---|---|
| [2A weather render](epic-2/2A-weather-render.md) | sonnet | `src/weather/render.ts` (+ test) |
| [2B weather option, ?weather=, trainer](epic-2/2B-weather-options.md) | haiku | `src/weather/options.ts` (+ test), `src/options.ts` (one row), `src/trainer/sections/world.ts` |
| [2C weather achievements](epic-2/2C-weather-achievements.md) | haiku | `src/weather/achievements.ts` (+ test), `packages/prefabs/src/catalog/gta-weather-gear.ts` (new) + `index.ts`, `packages/achievements/src/catalog.ts` |
| [2D fishing weather](epic-2/2D-fishing-weather.md) | haiku | `src/fishing/{types,pick,species}.ts`, `pick.test.ts` |
| [2E sky presence (L20)](epic-2/2E-sky-presence.md) | haiku | `src/skyTraffic/{types,behaviours,runtime}.ts`, `presence.ts` (+ test) |
| [2F bird wander (L19)](epic-2/2F-bird-wander.md) | haiku | `src/birding/{flock,types}.ts`, `flock.test.ts` |
| [2G cutscene time-lapse hold (L11)](epic-2/2G-cutscene-lapse.md) | haiku | `src/cutscene/director.ts` |
| [2H foundation tests](epic-2/2H-foundation-tests.md) | haiku | `src/weather/schedule.test.ts`, `src/atmosphere.test.ts`, `src/headlights.test.ts`, `src/events/director.test.ts` |

## Decisions

- Kinds: the brief's clear/cloud/rain/snow plus 'mist' (fog only: sea mist at Saltbucket Shore, the Loch, Mossy Wood).
  Drizzle is rain with a low `rainMax` (Pardonlin 0.45). Snow on Snowcap Rise and Frostbite Fells (the Fells' locals
  call it frost glaze; the toast keeps that joke).
- Time-lapse: forward to the scene's hour over 2.6 s while the first shot holds (the director waits), back the shortest
  way over 1.6 s at the end. The world clock never moves; the Options "Time of day" mode is never touched. Intentional
  changes use `advanceWorldTime`.
- Under a plain (frozen) cutscene the world clock still stands still, but the drawn sky now animates (`render()`), so the
  lapse and weather keep moving; live scenes run as before.
- Weather is hidden whenever the camera is off the map (interiors at x >= 5000, cutscene rooms at 3000), so rooms and
  interiors never show rain.
- L19: birding flocks (the ones you see flying between perches and circling), not critter birds.
- L71: `EVENT_INTERVAL` 110 -> 160 s; street-event gap 30..60 -> 45..90 s; first delay kept at 25 s.
