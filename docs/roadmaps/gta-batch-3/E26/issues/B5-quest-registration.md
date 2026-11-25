Epic: B (building) — E26 street racing
Depends on: epic A (quests/streetRaces.ts and streetRace/meets.ts hold real data)
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
The five street race quests are in the game: registered, their three givers placed at the meets' organisers,
unlocked by story beats, with stages and quest-sim plans, and every quest test green.

## Read first
- `games/gnome-theft-auto/src/quests/streetRaces.ts`: `STREET_QUESTS`, `STREET_QUEST_IDS` (ids sr-kerb-row,
  sr-skyway-midnight, sr-boucle, sr-saltbucket-dash, sr-ring-road; givers street-skyway-foot (1, 2, 5),
  street-pardonlin (3), street-saltbucket (4)).
- `games/gnome-theft-auto/src/streetRace/meets.ts`: `MEETS[id].organiser` {x, z, yaw} — where each giver stands; and
  `streetRace/cast.ts` `MEET_CAST[id].organiser.name`.
- `games/gnome-theft-auto/src/quests/defs.ts`: the E14 givers block (`'rutbottom-clary': { id, name, label,
  ...placed('rutbottom-clary'), room: 'street', letter }`) and `...DIRT_QUESTS` in QUESTS (~line 320).
- `games/gnome-theft-auto/src/data/levels/east-campus.level.json` around `"giver/rutbottom-clary"`: a giver marker
  is `{ "id": "giver/<id>", "kind": "giver", "x": <local x>, "z": <local z>, "data": { "exit": { "dx", "dz", "yaw" } } }`
  in REGION-LOCAL coordinates: local = world - region origin. Find the region with `regionAt(x, z)` and its origin
  `REGIONS[id].origin` (`src/levels.ts`) — print them in a throwaway vitest (delete it afterwards).
- `games/gnome-theft-auto/src/quests/unlocks.ts`: `SIDE_UNLOCKS` rows and the giver colour table (~line 137).
- `games/gnome-theft-auto/src/quests/stages/dirt.ts` + `quests/stages.ts` (STAGES list) + `questSim/plans.ts`.

## Change
- Level json (the right region file for each meet: Turfton or whichever `regionAt` says; Pardonlin; the band region
  for Saltbucket): add `giver/street-skyway-foot`, `giver/street-pardonlin`, `giver/street-saltbucket` at the
  organiser spots (local coords, rounded to 0.1), exit 4 m in front of the organiser (dx, dz from its yaw), yaw facing
  the organiser. Keep the JSON formatting of the file (2-space indent, same key order as neighbours).
- `src/quests/defs.ts`: import `STREET_QUESTS` from './streetRaces' and spread it after `...DIRT_QUESTS`; add three
  GIVERS: `'street-skyway-foot'` (name 'The Skyway Foot (<organiser name>)', label 'Talk to <organiser name>',
  `...placed('street-skyway-foot')`, room 'street', letter 'S'), `'street-pardonlin'` (letter 'P'),
  `'street-saltbucket'` (letter 'D').
- `src/quests/unlocks.ts`: SIDE_UNLOCKS rows (with a `why`): sr-kerb-row after 'ch1-founders-boot', sr-skyway-midnight
  after 'ch2-dew-run', sr-boucle after 'ch2-vespers-offer', sr-saltbucket-dash after 'ch3-salvage-raid', sr-ring-road
  after 'ch3-tundra-drift-run' (each why ends "E20/E21 may re-time."); giver colours: street-skyway-foot '#ff3d7f',
  street-pardonlin '#4f7fd8', street-saltbucket '#f2b33d'.
- `src/quests/unlocks.test.ts`: include `STREET_QUESTS` in the id list and the count (follow how DIRT_QUESTS is used).
- `src/quests/stages/street.ts` (new, like stages/dirt.ts): one stage per giver (`id` 'street-skyway-foot' etc.,
  region from `regionAt` written as the stage's region id string used by neighbours, center = organiser spot,
  radius 10, facing = organiser yaw, time 'night' for skyway-foot else 'day', built 'new', givers [id], usedBy = the
  quests that giver gives, look/sounds one sentence each, marks for the organiser and the player, one camera) and
  add `...STREET_STAGES` to STAGES in `quests/stages.ts`.
- `src/questSim/plans.ts`: `'sr-kerb-row': { suite: 'races', expect: 'pass' }` and the other four the same.
- Regenerate generated files: from games/gnome-theft-auto run
  `UPDATE_GOLDEN=1 npx vitest run src/layout.golden.test.ts` and
  `WRITE_STAGE_DOC=1 npx vitest run src/quests/stages.doc.test.ts`.

## Done when
- From games/gnome-theft-auto: `npx vitest run src/quests src/questSim/coverage.test.ts src/layout.golden.test.ts
  src/levels.test.ts` passes, and `npx tsc --noEmit -p .` passes. Fix stage spots the stage tests reject (move the
  mark or camera a little), never the tests.

## Out of scope
streetRaces.ts, meets.ts, cast.ts, objectivesRace.ts, app.ts.
