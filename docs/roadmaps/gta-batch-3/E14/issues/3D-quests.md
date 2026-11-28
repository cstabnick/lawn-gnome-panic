Epic: E14-3 (places and quests)
Depends on: E14-2 (merged in the worktree: race runtime on any track, both tracks, the dirt bike, achievements)
Worker: Sonnet (general-purpose) — quest writing and wiring

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules, places, people, contracts).

## Goal
Four side quests for E14's places, playable and finishable by the quest simulator:

| id | title | giver id (new) | what |
|---|---|---|---|
| `race-rutbottom-knobbly` | Rutbottom: Knobbly Heat | `rutbottom-clary` (Marshal Clary Mudguard, at `CLARY_SPOT`) | `race` on `trackId: 'rutbottom'`, `vehicle: 'dirt-bike'`, 2 laps, 3 rivals, `mustPlace: 3`, achievement `gta-dirt-rookie`, 350 acorns |
| `sq-rutbottom-heats` | Rutbottom Heats | `rutbottom-teasel` (Two-Ton Teasel, at `TEASEL_SPOT`) | `race` on `'rutbottom'`, `vehicle: 'lowrider'` (the Carburettors' rides, back from the impound, on the dirt), 3 laps, rivals Two-Ton Teasel + 2 more, `mustPlace: 1`, achievement `gta-dirt-champion`, 600 acorns |
| `race-capwood-open` | The Capwood Run: Open Stage | `capwood-lulu` (Lugnut Lulu, at the rally paddock) | `race` on `trackId: 'capwood-run'` (point-to-point, `laps: 1`), `vehicle: 'euro-hatch'` (the Petit Pois hatchback: a proper rally car), 3 rivals, `mustPlace: 3`, achievement `gta-rally-finish`, `timeAchievement: { seconds: <gold>, id: 'gta-rally-gold' }`, 500 acorns |
| `sq-capwood-cap-count` | The Cap Count | `capwood-warden` (Warden Chanterelle Stook, outside her hut) | on foot: `checkpoints` through the six `CAP_COUNT_SPOTS` (radius 4, labels from spots.ts, in an order that makes a sensible walk), then a `visit`-style return to the Warden (use whatever objective kind the existing quests use to "go back and talk": look at `sideQuests.ts`), achievement `gta-cap-count`, 250 acorns |

## Read first
- `games/gnome-theft-auto/src/quests/races.ts` (the Fizz Cup: QuestDef shape for races, `RaceRival`, intros/podiums;
  export or copy `TEASEL` from there — exporting it is allowed), `src/quests/types.ts` (`race` objective now has
  `trackId?` and `timeAchievement?`; `checkpoints` objective; `GiverDef`), `src/quests/defs.ts` (`QUESTS` spread,
  `GIVERS`, `placed(id)` reads a `giver/<id>` marker), `src/quests/unlocks.ts` (`SIDE_UNLOCKS`, giver colours ~103) and
  `src/quests/unlocks.test.ts`, `src/quests/sideQuests.ts` (a side quest with a `script` intro)
- givers' markers: `"id": "giver/speedway"` in `src/data/levels/dust-flats.level.json` (format: region-local `x`, `z`,
  `data.exit { dx, dz, yaw }`). Region documents and their origins: `east-campus.level.json` (Rootwell, origin
  (1150, 0)), `frostbite-fells.level.json` (origin (0, -400)), `north-highlands.level.json` (Snowcap Rise, origin
  (0, -1150)). Marker x/z are local: world = origin + local.
- `src/rutbottom/spots.ts` (`CLARY_SPOT`, `TEASEL_SPOT`), `src/capwood/spots.ts` (`WARDEN_HUT`, `CAP_COUNT_SPOTS`),
  `src/raceTrack/tracks.ts` (`TRACKS['capwood-run'].gridSlot(0)`, `.gates()`)
- cutscenes: a quest intro script (`grep -rn "sq-grid-truthers-intro" src/cutscene`), intro cards `{ do: 'intro', who }`
  and the cast (`src/cutscene/cast*`; E09 added 28 intro cards; check whether `clary`, `chanterelle`, `teasel`, `lulu`
  exist and add the missing CAST entries from their looks in `_env.md` / `docs/design/gnome-theft-auto/characters.md`)
- quest sim: `src/questSim/` (solvers `race.ts`, `checkpoints.ts`), `vitest.sim.config.ts`, `npm run quest-sim:suites`
- lore: `npm run lore -- find Teasel`, `docs/lore/entries/apocrypha/the-carburettors.md`, `rutbottom-dirt-bowl.md`, `capwood-run.md`

## Change
- `src/quests/dirtRaces.ts` (new): `export const DIRT_QUEST_IDS = [...] as const` and `export const DIRT_QUESTS:
  readonly QuestDef[]` with the four quests above. Rivals (`RaceRival`, looks and two taunts each, pace 0.88-1.0 for the
  first race, 0.95-1.03 with Teasel's at 1.0 for the Heats, 0.9-1.0 for the rally):
  dirt — Skid Thistlewaite (old-timer, raced Rutbottom since it was a puddle), Polly Pebbledash (young, fearless,
  never touches the brakes), Brakeless Bramble (has not got any); the Heats — Two-Ton Teasel plus Polly and Bramble;
  rally (Carburettors) — Gravel Gertie, Fenwick "Flat-Out" Fogg, Spanner Moss. Each quest: `title`, `giver`,
  `rewardAcorns`, `achievement`, `doneText` (a dry joke), an intro `cutscene` (a short `script` with the giver's intro
  card the first time; Clary: "Three. Two. Go on, then."; Teasel wants a rematch with his sister watching (R-190);
  Lulu keeps the route open to anyone who can beat her time; Chanterelle cites Section Nine and hands over a clipboard),
  `hint`s naming the place. Race `text` lines name the place: "Finish the Knobbly Heat on the podium".
  Gold time for the rally: run the quest-sim race solver (or the autopilot) on the rally and set `seconds` to about
  1.08 x the bot's finish time, rounded to 5 s; write the bot time in a comment.
- `src/quests/defs.ts`: spread `DIRT_QUESTS` into `QUESTS` (next to `RACE_QUESTS`); add the four `GIVERS` (`room:
  'street'`, letters 'R', 'T', 'L', 'W', labels "Talk to Marshal Clary Mudguard" etc.).
- Giver markers (`kind: 'giver'`, ids `giver/rutbottom-clary`, `giver/rutbottom-teasel`, `giver/capwood-lulu`,
  `giver/capwood-warden`): Clary at `CLARY_SPOT`, Teasel at `TEASEL_SPOT` (both in `east-campus.level.json`), Lulu in
  the rally paddock 10-14 m beside `TRACKS['capwood-run'].gridSlot(0)` on the side away from the road, outside
  `barrierOffset` (in `frostbite-fells.level.json`), the Warden 4 m in front of `WARDEN_HUT`'s door (yaw PI: door faces
  north, so (360, -1249); in `north-highlands.level.json`). Exit 5 m in front, facing away. Run
  `npx vitest run src/sites.test.ts src/levels.test.ts` (markers must be valid; givers must not sit in a building or on a
  road: `src/quests/quests.test.ts` checks "trapped inside a building").
- `src/quests/unlocks.ts`: `SIDE_UNLOCKS` rows — the story quests E04 planned (#40/#42) do not exist yet, so use existing
  quests: `race-rutbottom-knobbly` after `ch3-tundra-drift-run`; `sq-rutbottom-heats` after `race-rutbottom-knobbly`;
  `race-capwood-open` after `ch3-tundra-drift-run`; `sq-capwood-cap-count` after `race-capwood-open`; each with a `why`
  ("re-time to #42 / #40 when E21 builds them"). Giver colours for the four givers. Update `unlocks.test.ts` lists if it
  enumerates side quests.
- `src/cutscene/...`: the intro scripts (wherever quest intro scripts are registered) and any missing CAST entries.
- `docs/lore/entries/apocrypha/the-rutbottom-regulars.md` (new lore entry, same front-matter as the others): the six
  rival names, one line each; `npm run lore` must pass.
- `src/quests/dirtRaces.test.ts` (new): the four quests are in `QUESTS`, their givers exist, race objectives name valid
  `trackId`s and vehicle kinds, rally has `laps: 1` and a `timeAchievement`, the cap count visits all six spots.

## Contract
Quest ids exactly as above (lore and the side-quest schedule already list them). Giver ids as above.

## Done when
- `npx tsc --noEmit -p .` passes.
- `npx vitest run src/quests src/sites.test.ts src/levels.test.ts` passes (the "trapped inside a building" test is slow:
  give it time; if it times out at 30 s, run it alone).
- `npm run quest-sim:suites` (from `games/gnome-theft-auto`) finishes the four new quests (report their sim times); if
  the full suite is too slow, run it filtered to your quest ids (see how `vitest.sim.config.ts` selects quests).
- `npm run lore` passes (repo root).

## Out of scope
`raceTrack/*`, `rutbottom/*`, `capwood/*` (other workers), `app.ts`.
