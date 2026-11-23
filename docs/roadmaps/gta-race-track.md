# Gnome Theft Auto: the Lost & Found Speedway

Goal: a race circuit in Gnome Theft Auto's world, in its lore, fun to drive and free to drive on at any time, with a
second Pay 'n' Glaze station, a four-race mini-quest series (the Fizz Cup) in four kinds of vehicle, AI rivals, a
free-roam lap timer with saved best laps, achievements and map markers.

## Decisions (planner)

- **Where:** the north-east of the Dust Flats, on the alkali pan north-east of the airfield, centre (741, -467). A
  `reserve/speedway` marker (hw 143, hd 149) in `dust-flats.level.json` flattens the pan and keeps desert scatter off
  it; `trail/speedway` runs north to it from the east-outer highway at (790, 48). The north straight sits about 30 m
  from the Frostbite Fells border, so the snowy ridge is the backdrop.
- **The circuit** is data in `src/raceTrack/track.ts` (pure): 25 control points through a centripetal Catmull-Rom
  spline, 1,224 m a lap, 14 m wide, clockwise on the map. Elevation is real terrain: `applyTrackRelief()` (called by
  terrain.ts after the flat sites) raises the ground under the road for the east-side climb (3.5 m), the banked
  north-east hairpin, the north straight, the infield hill, and two kickers (Rake-Handle Hop at s 405, Frisbee Crest at
  s 1000). The sim chassis reads heightAt, so the jumps and banking are physical. `surfaces.ts` treats the road and pit
  lane as asphalt.
- **Lore:** the track is built round the Great Spill, a heap of giant Tall-One junk that fell on the pan one night.
  Burdock "Big Flag" Bellweather (an ex-Hat Watch traffic marshal) runs it; Dandelion Fizz sponsors the Fizz Cup; the
  HOA wants it shut for unlicensed noise. Rivals: Vinnie "Turbo-Sod" Delacroix, Dock "Full-Throttle" Hoewright (back
  from retirement), Shelldon "No-Trail" Mucilage (races on the gravel, never the paving), Carburettors lowriders.
- **Races** are a new objective kind `race` (quests/types.ts) run by `quests/objectivesRace.ts`; the data is
  `quests/races.ts` (RACE_QUESTS, RACE_UNLOCKS), spread into QUESTS in defs.ts, given at the `speedway` giver.
- **Online:** free-roam laps work for everyone as is (each browser times its own). Online races are not built: rival AI
  and race state would need a host-run race protocol on @lawn/mp, about the size of this whole feature again.
- **Golden layout:** the reserve, trail and giver markers change the desert scatter near the track, so
  `layout.golden.json` is regenerated once, on purpose, at the end (Epic 3).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | track.ts, terrain hook, level-doc markers, stubs, race objective type, race data, achievements defs; tsc clean | written by the planner |
| 2 Parts | every stub filled; `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w packages/prefabs`, `npm test -w packages/achievements` | 9 parallel |
| 3 Integration (planner) | `src/raceTrack/index.ts` wiring in app.ts, map, golden regen, sim lap test, screenshots, perf, zfight, smoke, demo GIF | planner |

Epic 2's issues are below, verbatim as given to the workers.

## Epic 2 issues

~~~~text
ISSUE 2A — Speedway structure prefabs (packages/prefabs/src/catalog/gta-race-track.ts)
(Full text in the worker prompt; see the planner's run log. Summary: 14 PrefabDefs with fixed ids and deck geometry.)
~~~~

(The full issue texts were pasted into each worker's prompt; they are kept below in the order run.)
