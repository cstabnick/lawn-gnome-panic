# E06 Sky, weather and time
Wave: 3 · Depends on: nothing (E03 owns the cutscene freeze bugs L07/L08, see Scope) · Kind: Engine
Source items:
- L02 when headlights come on, stagger them so they don't ll turn on at once.
- L05 reduce the ambient particles a little bit
- L06 add weather and snow and such. clouds are a bonus too. add option to disable in options
- L11 add a neat transition where time sepeds up rapidly and when a cutscene is expected to start during a different time of day. this shouldn't effect the overall world unless intentional
- L19 more variation in bird flying path. don't just have follow static route
- L20 make some of the world stuff like the planes not always present and sometimes make appearances
- L71 make the world events slightly less frequent

## Goal
One weather and time layer the rest of the batch can lean on: a weather state (clear, cloud, rain, snow) that fades in
and out, an Options switch for it, headlights that come on one by one, fewer ambient motes, a visible time-lapse into
cutscenes set at another hour, and a world that breathes (planes that come and go, birds that do not trace one loop,
events less often). E12 (winter sports) and the story's cutscenes consume it.

## Scope
In:
- `WeatherState` module (new `src/weather/`): state, intensity 0..1, fade, per-region bias (Frostbite Fells snows more),
  rain and snow particle fields, optional cloud layer, overcast dimming of sun and fog through the atmosphere.
- Options row "Weather: on / off" (default on), through the registry E07 adds (see Contracts consumed).
- Stagger headlights (L02). Reduce ambient motes (L05).
- Time-lapse transition for cutscenes whose `sky` differs from the current look (L11).
- Bird flight variety (L19). Sky-traffic intermittency (L20). World-event frequency (L71).

Out:
- Planes or birds hanging in place during cutscenes (L07, L08: E03). This epic only has to not make them worse; the
  time-lapse must keep calling the sky and bird updates they already get.
- Snow gameplay: sledding, skiing, ice fishing (E12).
- A synced day/night clock online (time of day is per browser today; keep it so).

## Code pointers (confirmed)
- `src/atmosphere.ts` (615 lines): `createAtmosphere(scene, sun, hemi)` returns `{update, nightFactor, timeLabel, setMode,
  getMode}`. `CYCLE_SECONDS = 360`, `INITIAL_PHASE = 0.22`, `TimeMode = 'auto'|'noon'|'golden'|'night'`.
  `effectivePhase` maps the three fixed modes to phases 0.25 / 0.5 / 0.75; `computeAtmosphereState(phase, mode, biome)`
  interpolates `KEYFRAMES` and `BIOME_PROFILES`. The phase only advances in `'auto'` mode (a fixed mode freezes it),
  which is why a scene's sky does not change the world.
- Ambient particles (L05): the pooled `MOTE_COUNT = 260` points (`MOTE_SPAN` 64, `MOTE_HEIGHT` 18) in `createAtmosphere`,
  sized and tinted per biome through `BIOME_PROFILES[...].moteSize / moteOpacityDay / moteOpacityNight`. Lower the count
  and those opacities; one constant plus the table.
- Cutscene sky today: `SceneScript.sky?: 'noon'|'golden'|'night'` (`src/cutscene/script.ts:284`), applied in
  `src/cutscene/director.ts:417` (`hooks.setSky?.(script.sky)`, world stages only, never rooms) and undone at
  `director.ts:277` (`setSky(null)`). The hook is wired in `src/app.ts:523`: it saves `sceneSkyBefore`, calls
  `atmosphere.setMode(mode)` and runs 6 settle updates of 0.25 s, so the sky snaps under the fade-in. Roughly 20+
  scenes carry `sky:` (`cutscene/scenes/city/*.ts`, `scenes/side/*.ts`).
- Headlights: `setVehicleHeadlights(vehicles, on, forceOn)` (`src/vehicles.ts:234`) flips every `v.headlights.visible`
  at once; called from `src/app.ts:1399` (live-world frame) and `src/app.ts:1985` (main frame) with `nightF > 0.35`.
  Dressed vehicles keep lamps in their rig (`vehicles.ts:294`, `rig.lights`). Streetlamps and windows switch together
  too: `setTowerNight` (`src/towers/material.ts:76`) and `districts.ts:479 update(dt, nightFactor)`.
- Weather today: none. `src/fishing/pick.ts:18 weatherAt(region, time)` is a stub (`'snow'` for the Fells, `'mist'` at
  Loch Moss dawn/morning, else `'clear'`; type `FishWeather` in `fishing/types.ts:13`). `birding/spawner.ts` has
  `windAt`; read it before adding a second wind source. The one host-shared environment value is the sea state
  (`src/waves.ts setSeaState`, `src/online/seaSync.ts`; Options pattern in `src/waveOptions.ts`, mounted by
  `mountWaveOptions(panel)` in `options.ts`).
- Birds: `src/birding/flock.ts`: `sendFlock` (straight line to a perch), `circleFlock` (fixed circle round a centre,
  `modeT` 20-40 s), `stepFlying`, `stepCircling`; `stepPerched` picks the next perch within +-30 m of `homeX/homeZ`.
  Sky flocks come from `skyFlock` in `birding/birding.ts` (~line 300, ambient species). The "static route" is the
  straight fly-to-perch plus constant-radius circling. Critter birds in `src/critters.ts` / `critters/commons.ts` are
  separate; confirm which the user sees before changing both.
- Sky traffic: `src/skyTraffic/behaviours.ts` `SKY_BEHAVIOURS` (`banner-tow` is `repeat: 'loop'`, `cooldown: 30`,
  anchor (0,0), radius 700, so it is up whenever the player is within 700 m). Scheduler `pickBehaviour`
  (`skyTraffic/runtime.ts:121`), cooldowns set at `runtime.ts:343 / 547 / 565`; knobs in `skyTraffic/config.ts`
  (`SKY.maxActive 4`, `leaveFor 40`, `downedCooldown 120`). Online mirror: `src/online/skySync.ts`.
- World events: two systems. `src/worldEvents.ts` (`EVENT_INTERVAL = 110`, `EVENT_DURATION = 90`, six kinds rotated)
  and the street-event director `src/events/director.ts` (`DIRECTOR.firstDelay 25`, `gapMin 30`, `gapMax 60`,
  `maxActive 2`; catalog in `src/events/catalog/*.ts`, each with its own `cooldown`). L71 means both.
- Live-world cutscenes: `liveWorldFrame` (`src/app.ts`, ~line 1370) updates traffic, npcs, `sky.update`, critters and
  atmosphere; frozen cutscenes update none of them (the cause of L07/L08, E03's).

## Contracts this epic provides
- `src/weather/index.ts`: `getWeather(): {kind: 'clear'|'cloud'|'rain'|'snow'; intensity: number}`, `weatherAt(region)`,
  `setWeatherEnabled(on)`, `onWeather(cb)`, `forceWeather(kind, intensity)` for the trainer and demos (plus a
  `?weather=` URL param like `?waves=`). A pure `weatherForTime(utcSeconds, region)` so tests and peers agree.
- Atmosphere additions: `getPhase()`, `setPhase()`, and `timeLapseTo(modeOrPhase, seconds)` that scrubs the phase
  forward (wrapping) and returns a handle to await; `setMode` stays.
- `setVehicleHeadlights` takes the night factor and a per-vehicle threshold (hash of the vehicle id into about
  0.30..0.60), so lamps come on over the dusk window rather than at one instant.
- `fishing/pick.ts weatherAt` reads the weather module; `FishWeather` gains `'rain'`. E12 and fishing odds use it.
- New `DIRECTOR` and `EVENT_INTERVAL` values; quest-sim runs (`src/questSim/`) must still pass.

## Contracts consumed
- E07's Options registry (`registerOption({section, id, ...})`) for the Weather row. If E07 has not landed, mount the
  row the way `mountWaveOptions(panel)` is mounted and tell E07 to fold it in.
- Region ids from `regionAt` (no new E01 input needed).

## Online / mobile / achievements / prefabs / lore notes
- Online decision: weather is a deterministic function of shared wall-clock blocks (like `radio/broadcast.ts liveAt`:
  hour blocks hashed to a seed) plus region, so every peer sees the same sky with nothing on the wire. The Options
  switch and the particle cost are local (like waves). Sky-traffic appearance is rolled where the record is created
  (the leader, `skySync.ts`), never on mirrors. Time of day stays per browser; the time-lapse is local.
- Mobile: particles are a perf risk. Cap rain and snow points by the `src/quality.ts` tier (read it), about 40 percent
  of the desktop count on phones, no cloud layer on the low tier. Weather Off removes the objects from the scene.
- Achievements: optional "Caught in the Rain" (2 minutes out in rain) and a snow one shared with E12; reward a `neck`
  scarf or `head` umbrella hat prefab. Add to `packages/achievements/src/catalog.ts`; `npm test -w packages/achievements`.
- Prefabs: rain, snow and clouds are effects and stay in the game (say so in the PR). Reward items go through `@lawn/prefabs`.
- Lore: `npm run lore -- find weather`. The Fells' "snow" is frost glaze in `critters/fells.ts` dialogue
  ("It is frost glaze, not snow"); keep that joke compatible (flakes can be glaze).
- Mobile/Options: the new Options row must be 44 px tall like the others.

## Risks and open questions (decisions taken)
- Rain over interiors and rooms: cutscene rooms (`cutscene/rooms.ts`) and E05 interiors must show no weather.
  Decision: all weather nodes live under one group that the cutscene director and interiors hide.
- Time-lapse must not move world time. Decision: a visual scrub of the sky only, between the fade-out and the
  fade-in, then a short reverse scrub back to `sceneSkyBefore` at scene end (not a snap). Intentional world-time
  changes (a "sleep until night" in E10's apartment) call an explicit `advanceWorldTime()` that does move the phase.
- Headlight staggering over traffic pools: compute the threshold once at vehicle creation, no per-frame allocation.
- Fewer motes changes demo screenshots; accept.
- L19 ambiguity (birding flocks vs critter birds). Decision: fix birding flocks (waypoint wander: heading drift,
  altitude change, varying circle radius and direction) and share the helper with any critter-bird fly-by; say in the PR which.
- L20 decision: each sky behaviour gets `presence: {onFor: [min,max], offFor: [min,max]}`; the banner tow flies about
  2 minutes, then is gone 3 to 5. `gta-sky-v1` progress keys are unaffected.
- L71 decision: raise `EVENT_INTERVAL` 110 to about 160 and the director gap to 45-90 s, keep `firstDelay`.

## Done when
- `npm run build -w games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass. New tests: weather schedule
  determinism, headlight threshold spread, time-lapse restores the mode, sky presence windows, event gap constants.
- `npm test -w packages/achievements` if achievements were added; `npm run lore` if lore changed.
- With the dev server up: `bash tools/smoke.sh <url> <markers>` clean; `?weather=snow` and `?weather=rain` look right at
  390x844 and on desktop; the Options toggle removes them; a `sky: 'night'` scene shows the time-lapse then plays;
  `npm run zfight -- <url>` clean.
- PR notes: the weather online decision, and perf on the phone tier.
