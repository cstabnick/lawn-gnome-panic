# E26 Street racing and race modes
Wave: 6 · Depends on: E14 (TrackDef registry), E02 (NPC chassis), E07 (Gnomlet), E08 (Acorns), E28/E30 (Pardonlin), E23 (HOA policy) · Kind: Content
Source items: L112 "add street races. add street race quests and modes f or players to race (as well as racing on the tracks)."

## Goal
Street races through Turfton, the Skyway, Pardonlin and the outer bands, run from three street-race meets with an
organiser, a bookie, a flag-dropper and a crowd; a short street-racing side questline against one rival; and race
modes for players: a solo time trial with best times and a ghost on every registered track, pickup races with wagers
at the meets, and online races between players (lobby, grid, countdown, checkpoints, positions, finish times) over
`@lawn/mp`. A "Race Club" Gnomlet app is the mode picker.

## Scope
In:
- Five street routes as TrackDefs over real roads (`relief: 'none'`): Kerb Row Circuit (downtown grid, circuit), the
  Skyway Sprint (up and along the Turfton Skyway, point to point, the Carburettors' night meet), the Ring Road Run
  (the Carburettors' illicit Ring Road time trial of lore, circuit), La Boucle de Pardonlin (closed-road event
  through the town, circuit), the Saltbucket Dash (out through the east and south bands to the coast, point to point).
- Three meets (environmental storytelling AC: 3+ vignettes, joke signs, residents doing something specific, ambient
  sound, screenshot pass): the Skyway Foot (night meet, Turfton), Pardonlin, Saltbucket (band roadside).
- Five street race quests in a chain with one rival, givers at the meets; a night race (sky held at night), a
  closed-road event (traffic kept off the route, cones), races through live traffic; HOA policy per quest.
- Race modes (`streetRace/session.ts` on the quest race runner): pickup (rivals + wager), trial (best + ghost),
  online (SYS.race lobby/progress). Race Club Gnomlet app. Mobile at 390 x 844.
- Rival AI that copes with traffic on street routes. Achievements with wearable rewards. Lore and rulings (R-223+).
Out (deferred): spectating other players' races, online rivals (NPCs) in online races, mixed-kind fields, a tuning
shop for racers, the Fizz Cup moving onto the streets, E20's m05 night meet scene (E20 builds it at the Skyway Foot).

## Code pointers (confirmed)
- `raceTrack/trackDef.ts` (TrackDef, createTrack, TrackGateTracker), `raceTrack/tracks.ts` (TRACK_IDS, TRACKS,
  ALL_TRACKS; street routes excluded from surface/ford/keep-out queries), `raceTrack/raceAi.ts` (spawnRival,
  driveRival on `stepNpcCar`), `raceTrack/autopilot.ts`, `raceTrack/state.ts` (setRaceActive).
- `quests/objectivesRace.ts` `raceRun(obj, deps, changed, say)`: grid, lights, HUD, ranking, rivals; `quests/types.ts`
  race objective, `QuestDeps`, `RaceRival`; `quests/dirtRaces.ts` (quest data pattern), `quests/defs.ts` (GIVERS,
  `placed()` from level-json markers `giver/<id>`), `quests/unlocks.ts` (SIDE_UNLOCKS, giver colours),
  `quests/stages/*.ts` (every giver and quest needs a stage), `questSim/plans.ts` (every quest needs a plan).
- Roads: `config.ts` ROAD_LINES (-180..180 step 60), CITY_HALF 215, HIGHWAYS (ring-ne/nw/sw/se, east, south,
  east-band-south, south-band-east, pl-*), `highways/skyways.ts` SKYWAYS (turfton-skyway deck at z -60, x -219..550).
- Online: `online/protocol.ts` SYS (append `race: 11`), `online/hub.ts` SyncAdapter, `online/actSync.ts` (one record
  per player pattern), `online/install.ts`.
- Gnomlet: `gnomlet/registry.ts` registerGnomletApp; example `winter/winterApp.ts`. Saves: `cloudSave.ts` MERGES.
- Area pattern: `dirtCountry/types.ts` Area/AreaDeps, `rutbottom/index.ts` + `plan.ts` (props, signs, vignettes,
  residents via createAmbientGnomes, buildStaticCells, buildSignText, playAt).
- app.ts: prompt/interact chain (~line 1873), area updates (~2356), blips (~2525), getIn (~1197).

## Contracts this epic provides
See `gta-batch-3/E26/contracts.md`: street TrackDefs (`relief: 'none'`, `STREET_TRACK_IDS`), `RaceRunOpts` on
`raceRun`, race objective `night` / `closedRoad`, `streetRace/` (MEETS, MEET_CAST, RaceSession, RaceNet), SYS.race,
`gta-racing-v1` save, Race Club app. E20 (m05 night meet) stages at `MEETS['skyway-foot']`.

## Contracts consumed
E14 track registry and race objective; E02 `stepNpcCar`; E07 Gnomlet registry; E08 economy (earn/spend); E23
`hoa` per quest; E06 atmosphere `setMode('night')` (the Tessie precedent); traffic `setKeepOut` (cutscene liveArea).

## Online / mobile / achievements / prefabs / lore
- Online: modes are the point. One SYS.race record per player; the host's lobby; each client runs its own race and
  publishes distance and finish time; positions rank everyone. Players' cars already sync as poses.
- Mobile: wager panel and Race Club app at 44 px targets, 390 x 844; race HUD already mobile.
- Achievements: 6 with wearable rewards (head, neck, back, hand), new prefabs in `gta-street-race-gear.ts`.
- Lore: meets, organisers, bookies, the rival, the routes; rulings from R-223.

## Risks and decisions
- Street routes on real roads: a test checks every sample lies on a road (grid, highway, skyway deck, Pardonlin road).
- Rivals vs traffic: rivals steer round vehicles ahead and are put back on the line when stuck (existing).
- Traffic on a closed-road event uses `setKeepOut`; only one owner at a time (no cutscene runs during a race).
- Teleport to the grid for modes (not quests): a convenience, said in the Race Club app.
- Online clock: each client times from its own GO (start skew ~ one relay hop); fair enough for a prototype.
- E17 builds the Underspan under the Unfinished Span (x 610): the Skyway meet is at the west foot (x -219), far away.

## Done when
Build, tests (incl. tracks, streets, raceSync, session, save, ghost), lore, quest-sim for the five quests, a
two-client online race check (or the reason it could not run), smoke `gta-gnomlet`, screenshots in `E26/screens/`.
