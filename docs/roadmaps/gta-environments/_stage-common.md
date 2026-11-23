# Common rules for the stage-data issues (pasted into every 1.x region issue)

## Environment

- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a4aeea01508384993` (a git worktree: work only
  inside it). Run every command from `games/gnome-theft-auto` under it. In Git Bash, if `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` is already done.
- Other workers are editing other files of this game at the same time (the other files in `src/quests/stages/`,
  `src/stageSets.ts`, `src/app.ts`, `docs/lore/`). Edit ONLY the one file your issue owns. Do not commit. Do not start a
  dev server.

## What you are writing

`src/quests/stages/kit.ts` defines `Stage` (read it whole: it is short and fully commented). `src/quests/stages.ts` holds the
`CAST` (characters, their home stage ids and their vehicle mark ids) and joins every region file into `STAGES`.
`src/quests/stages/turfton.ts` has one finished example stage, `bus-stop`: copy its shape.

Use the helpers from `./kit`: `mark(who, at, faceTo, pose, note?, lift?)`, `cam(id, from, look, note, fov?)`,
`car(id, role, kind, at, faceTo, owner?, note?)`. Pass a POINT to face (e.g. the speaker's position) instead of working
out a yaw. Yaw convention if you need one: 0 faces +z (south), `Math.PI / 2` faces +x (east), `Math.PI` faces -z
(north), `-Math.PI / 2` faces -x (west). Camera `from`/`look` are `[x, heightAboveGround, z]`.

Drive on the right. On a road along x = R: heading north (yaw `Math.PI`) drive at x = R + 2.5, heading south (yaw 0) at
x = R - 2.5. On a road along z = R: heading east (yaw `Math.PI / 2`) drive at z = R + 2.5, heading west
(yaw `-Math.PI / 2`) at z = R - 2.5. Turfton's grid roads run along x and z = -180, -120, -60, 0, 60, 120, 180, each
10 m wide (the x = 0 road covers x -5..5). Outside Turfton, roads are the highways in the region level documents
(`src/data/levels/<region>.level.json`, `paths` with `kind: "road"`, coordinates relative to the region origin in
`src/data/world.layout.json`; the issue lists the ones you need in world coordinates).

## What every stage needs (the minimum)

- `id`, `name`, `region` (must equal the region the centre is in), `center`, `radius`, `facing`, `time`, `built`
  ('existing' = nothing added; 'dressed' = an existing place plus `set` props; 'new' = the place exists only through
  `set`), `room` and `givers` where the issue lists them, `usedBy` exactly as listed (quest ids, plus any extra labels).
- `look` and `sounds`: one concrete sentence each (props, light, what you hear).
- `marks`: every character the issue lists, each with a pose and a `note` saying what they are doing, plus a `player`
  mark. Marks on top of something (a stage, a platform, a deck) get `lift` (metres up).
- `cameras`: at least 3: `wide` (an establishing shot 15-30 m away, 3-8 m up), `two-shot` (4-8 m away at 1.5-1.8 m, on
  the player and the main character), and one more (close-up, overhead, or `arrival` watching the pull-up mark). Look
  at about 1.2-1.4 m above the ground at the speaker. The test fails a camera inside a collider or one whose view is
  blocked by a building: move it.
- `walks`: at least one idle walk for each character who lives or works there (2-6 points, `loop` true or false,
  speed 0.8-1.4, pauseS 2-8, `activity` saying what they do at each stop).
- `vehicles`: every vehicle mark the issue lists, with EXACTLY that id (the cast list refers to these ids), plus a
  `pull-up` mark (where an arriving vehicle stops, on or right beside a road) and an `exit` mark (where a getaway
  starts). Give each stage's pull-up and exit ids like `<stage-id>-pull-up` and `<stage-id>-exit`.
- `paths`: an `approach` path from a main road into the pull-up mark and a `getaway` from the exit mark out to a main
  road, each at least 60 m long, plus any chase or patrol path the issue lists. Points follow road centre lines or lane
  lines (see "Drive on the right"); only the first or last few metres leave the road to reach a mark. At least 75% of
  a path's length must be on roads, or set `offRoad: true` (fields, desert, forest tracks: the issue says when). Boat
  paths (boat kinds) must stay on water; plane/whirligig paths are only checked to be on the map.
- `set`: the set dressing the issue lists, as `SetProp`s. Only @lawn/prefabs ids (the issue gives sizes in metres at
  scale 1 as `w x h x d`). A gnome is about 1.4 m tall in this world, so furniture usually takes `scale` 1.4-1.6, and the
  small `gsr-bldg-*` buildings take scale 4-6. Give props a player would bump into
  `solid: [halfWidth, halfDepth, height]` (after scale, before yaw: e.g. a bench 1.2 x 0.5 x 0.4 at scale 1.5 is
  `solid: [0.9, 0.3, 0.75]`); leave small things (pots, lamps, signs, scrolls, posts) without `solid`. A solid prop must
  not cover any mark, vehicle mark, walk or path, and no prop may sit inside or within 1 m of a building collider. Do not
  use flat props (rugs, maps, anything under 5 cm tall): they z-fight with the ground.

## Tools

- Validate: `npx vitest run src/quests/stages.test.ts -t "<stage-id>"` prints every problem with its coordinates and,
  for a spot inside a collider, the nearest clear spot. Fix and re-run until every one of YOUR stages passes. The
  three `stage data` tests (`ids are unique...`, `every giver and every quest has a stage`, `every off-map cutscene
  room...`) check all regions together and will fail until all the region files are written: only fix lines that name
  your stage ids or vehicle ids.
- Look before you place: `PROBE="x,z;x,z" PROBE_R=30 PROBE_S=2 npx vitest run src/quests/stages.probe.test.ts` prints an
  ASCII map around each point (`#` building collider, `s` a set prop's collider, `=` road, `~` water, `@` the point).
  Rows go from north (smaller z, top) to south; columns from west (smaller x, left) to east. The header shows the
  region and ground height. Probe every stage's area first, then place.
- Types: `npx tsc --noEmit -p .` must pass.

## Done when (every region issue)

- `npx tsc --noEmit -p .` passes.
- `npx vitest run src/quests/stages.test.ts -t "<id>"` passes for every stage id in the issue.
- No file other than the one the issue owns is changed (`git status` from the repo root).
