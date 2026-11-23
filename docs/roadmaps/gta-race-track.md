# Gnome Theft Auto: the Lost & Found Speedway

Goal: a race circuit in Gnome Theft Auto's world, in its lore, fun to drive and free to drive on at any time, with a
second Pay 'n' Glaze station, a four-race mini-quest series (the Fizz Cup) in four kinds of vehicle, AI rivals, a
free-roam lap timer with saved best laps, achievements and map markers.

## Decisions (planner)

- **Where:** the north-east of the Dust Flats, on the alkali pan north-east of the airfield, centre (741, -467). A
  `reserve/speedway` marker (hw 143, hd 149) in `dust-flats.level.json` flattens the pan and keeps desert scatter off
  it; `trail/speedway` runs north to it from the east-outer highway at (790, 48); `giver/speedway` is the race desk.
  The north straight sits about 30 m from the Frostbite Fells border, so the snowy ridge is the backdrop.
- **The circuit** is data in `src/raceTrack/track.ts` (pure): 25 control points through a centripetal Catmull-Rom
  spline, about 1,266 m a lap, 14 m wide, clockwise on the map. Elevation is real terrain: `applyTrackRelief()` (called
  by terrain.ts after the flat sites) raises the ground under the road for the east-side climb (3.5 m), the banked
  north-east hairpin, the north straight, the infield hill, and two kickers (Rake-Handle Hop, Frisbee Crest). The sim
  chassis reads heightAt, so the jumps and banking are physical. `surfaces.ts` treats the road and pit lane as asphalt.
- **Minimum lap:** `track.test.ts` laps a stock Zero-Turn with a racing driver at every nerve level: about 55 s with the
  default handling, 36 s in Arcade (35.7 s with boost). Never under 35 s.
- **Lore:** the track is built round the Great Spill, a heap of giant Tall-One junk that fell on the pan one night
  (ruling R-056). Burdock "Big Flag" Bellweather (an ex-Hat Watch traffic marshal) runs it; Dandelion Fizz sponsors the
  Fizz Cup; the HOA wants it shut for unlicensed noise. Rivals: Vinnie "Turbo-Sod" Delacroix, Dock "Full-Throttle"
  Hoewright (back from retirement), Shelldon "No-Trail" Mucilage (races on the gravel, never the paving), Carburettors
  lowriders, and a new field (`fizz-cup-field.md`).
- **Races** are a new objective kind `race` (quests/types.ts) run by `quests/objectivesRace.ts`; the data is
  `quests/races.ts`, spread into QUESTS in defs.ts, given at the `speedway` giver, opened along the story by
  `SIDE_UNLOCKS` (chapters 2 to 4). Each has a scripted intro on the grid and a podium scene after a win
  (`cutscene/scenes/speedway.ts`, checked by the LOS test against the world plus the Speedway's colliders).
- **Second Pay 'n' Glaze:** `src/glazeBay.ts` holds both bays; garages.ts asks it; world.ts and the Speedway dressing
  build the same drive-through building with the same colliders.
- **Online:** free-roam laps work for everyone as is (each browser times its own). Online races are not built: rival AI
  and race state would need a host-run race protocol on @lawn/mp, about the size of this whole feature again.
- **Golden layout:** the reserve, trail and giver markers change the desert scatter near the track, so
  `layout.golden.json` was regenerated once, on purpose.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | track.ts, terrain hook, level-doc markers, stubs, race objective type, race data, achievement defs; tsc clean | written by the planner |
| 2 Parts | every stub filled; tsc, prefabs and achievements tests | 9 parallel haiku-worker issues |
| 3 Integration (planner) | dressing, wiring in app.ts, map markers + legend, scenes, stage, golden regen, sim lap test, zfight, perf, smoke, demo | planner |

Epic 2's issues, as given to the workers (with `gta-race-track/_env.md` pasted into each):

- `gta-race-track/epic-2/2A-structure-prefabs.md`: 14 Speedway structure prefabs (`gta-race-track.ts`)
- `gta-race-track/epic-2/2B-gear-prefabs.md`: 6 achievement reward prefabs (`gta-race-gear.ts`)
- `gta-race-track/epic-2/2C-track-surface.md`: road, run-off, kerbs, start line, grid, pit lane (`trackMesh.ts`)
- `gta-race-track/epic-2/2D-race-ai.md`: rival drivers (`raceAi.ts`)
- `gta-race-track/epic-2/2E-race-runner.md`: the `race` objective and race HUD (`objectivesRace.ts`)
- `gta-race-track/epic-2/2F-lap-timer.md`: free-roam lap timing (`lapTimer.ts`)
- `gta-race-track/epic-2/2G-glaze-bays.md`: two Pay 'n' Glaze bays, phone camera framing, radio over the shop
- `gta-race-track/epic-2/2H-lore.md`: lore entries and the ruling
- `gta-race-track/epic-2/2I-crowd.md`: the instanced cheering crowd (`crowd.ts`)

Planner fixes after review: GateTracker restarts its lap clock; the pit lane and start line moved to their own draw
layers; prefab part names removed from the structure prefabs (named parts are never merged into the static batch: the
dressing was 4,000 draw calls); overlapping tyre stacks skipped on the inside of bends; podium colliders per step.
