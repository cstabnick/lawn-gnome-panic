# Gnomokemon Snap: character, layouts and hiding

**Goal.** The creatures stop orbiting fixed circles. Each one roams its own zone, looks at Tag, runs off, hides in cover
until Tag has passed, and comes to bait when it is the kind that eats. Each species has its own traits, drawn from the
temperament and the lore's "wants" line. The course layouts move into one `layout.ts` per course.

**Contracts (written by the planner, already in the tree):** `src/snap/layout.ts`, `src/snap/character.ts`, and
`CreatureAction` in `src/snap/types.ts` (now `'idle' | 'eating' | 'startled' | 'dancing' | 'run' | 'hide' | 'graze' | 'look'`).
Stubs compile; the issues below fill them in without changing their exported names or signatures.

| Epic | Issues | Done when |
|---|---|---|
| 1. Data and pure rules (parallel) | 1A layouts, 1B character, 1C animation | `npm test -w games/gnomeokemon` passes; `tsc` passes |
| 2. Integration | 2A game.ts | build, tests, smoke check on the ride |
| 3. Checks | none | build, tests, smoke, demo, PR |

~~~~text
Epic: 1A Course layouts
Depends on: none

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing character.ts (1B) and world.ts (1C) at the same time. Touch only layout.ts and its test.

## Goal
`layoutFor(courseId)` returns the real zones, cover and spawns for all seven courses, converted from the spawn lists in world.ts.

## Read first
- src/snap/layout.ts: the stub. Keep every exported name and signature exactly.
- src/snap/world.ts: `LAWN_SPAWNS`, `DESERT_SPAWNS`, `DEPTHS_SPAWNS`, `KILN_SPAWNS`, `OCEAN_SPAWNS`, `NIGHT_SPAWNS`, `FROST_SPAWNS` (lines 33 to 124). Each has `speciesId`, `pos`, `rotY`, `scale`, `behavior`, `radius`, `speed`, `phase`.
- src/snap/world.ts `getCourseSpawns` (line 126): maps a course id to its list. Mirror its mapping.

## Change
- src/snap/layout.ts: `layoutFor(courseId)` returns `{ zones, cover, spawns }` for each course:
  - `spawns`: one `LayoutSpawn` per entry in the course's existing spawn list, with the same `speciesId`, `pos`, `rotY`, `scale`, and a `zone` index into `zones`.
  - `zones`: group the spawns into roam zones. A zone is a circle `{ x, z, radius }` that covers its spawns' positions with radius `max(spawn.radius) + 1.5` of the spawns it holds (use the spawn's original `radius` field from world.ts). Give each course 3 to 6 zones. Keep zones on the ground, inside the course's play area (x between -12 and 12, z between -34 and 20).
  - `cover`: 2 to 4 `CoverSpot`s per course, at ground positions inside a zone but not on top of a spawn. Put at least one cover spot in each zone.
  - Keep the spawn order identical to world.ts so `zone` and `pos` stay in sync.
- Put the data as plain object literals. No THREE, no imports from world.ts beyond types (`import type`). Do not import world.ts at runtime; if you need the spawn lists, copy the numbers into layout.ts.
- src/snap/layout.test.ts (new): for each course id ('lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost'):
  1. every spawn's `zone` is a valid index;
  2. every spawn's `pos` is within its zone's circle;
  3. the course has at least one zone and at least one cover spot;
  4. every cover spot is within some zone.

## Contract
`layoutFor(courseId: CourseId): CourseLayout` with `Zone`, `CoverSpot`, `LayoutSpawn`, `CourseLayout` as in the stub.

## Done when
- `npm test -w games/gnomeokemon -- layout` passes.
- `npx tsc --noEmit -p games/gnomeokemon` passes.

## Out of scope
world.ts, game.ts, character.ts, and every other file. Do not delete the spawn lists in world.ts; game.ts still uses them until 2A.

Report: the zone count per course and any spawn that could not fit a zone.
~~~~

~~~~text
Epic: 1B Character: personalities and the pure mind
Depends on: none

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing layout.ts (1A) and world.ts (1C) at the same time. Touch only character.ts and its test.

## Goal
`personalityOf` returns real traits for the 42 species, and `stepMind` is a working, deterministic state machine that makes the creatures roam, look, run, hide, and come to bait.

## Read first
- src/snap/character.ts: the stub. Keep every exported name and signature exactly. You may add non-exported helpers.
- src/snap/temperament.ts: `temperamentOf` and the temperament type (read only).
- src/prefabs/dex.ts: each species' `id` and `wants` line (the lore's one-line want).
- docs/design/gnomeokemon/temperaments.md: section 2 (what each temperament does).

## Change
- `personalityOf(speciesId, temperament)` (character.ts): return traits for each species. Start from these defaults by temperament, then adjust by the species' `wants` line:
  - docile: boldness 0.7, curiosity 0.3, restlessness 0.3, shyness 0.1
  - curious: boldness 0.6, curiosity 0.9, restlessness 0.6, shyness 0.2
  - skittish: boldness 0.2, curiosity 0.4, restlessness 0.7, shyness 0.9
  - shy: boldness 0.2, curiosity 0.5, restlessness 0.4, shyness 0.9
  - territorial: boldness 0.9, curiosity 0.3, restlessness 0.2, shyness 0.1
  - thief: boldness 0.7, curiosity 0.9, restlessness 0.8, shyness 0.3
  - sentinel: boldness 0.5, curiosity 0.2, restlessness 0.1, shyness 0.2
  - aloof: boldness 0.8, curiosity 0.1, restlessness 0.2, shyness 0.2
  Then write a small table `TRAIT_OVERRIDES: Record<string, Partial<Personality>>` for species that should differ. Give at least 8 species an override (e.g. Thimblekin and Magpie Thief lean to shiny things; Dewdrop splashes so it is curious and restless; Mossback slow and restless 0.1; Armadillan shyness 1.0). Each `quirk` is one short lore line built from the species' `wants` line (under 80 characters, in the creature's terms, never gore).
  Write the quirk for all 42 species. Use the dex `id`s.
- `stepMind(mind, persona, input)` (character.ts): one frame. Rules, in this priority order:
  1. `d` = distance from `input.self` to `input.tag` (xz only).
  2. **Hide:** if `mind.state === 'hide'`: if `d < 9` set `mind.clearTime = 0`, else `mind.clearTime += input.dt`. Stay hidden (velocity 0) until `mind.clearTime >= 1.5`, then set state `'run'`, timer 1.5, target = a point 6 units from self directly away from Tag.
  3. **Shy reaction:** if `persona.shyness > 0.6` and `d < 8` and state is not hide or run: if a cover spot is within 6 units of self, set state `'hide'`, `coverIndex` to it, target = that spot, velocity toward it at 2.5 units/s until within 0.3, then velocity 0. Else set state `'run'` (timer 1.2, target away from Tag).
  4. **Run:** if state `'run'`: velocity toward target at 2.2 units/s, timer -= dt; at timer 0 set state `'roam'`.
  5. **Look:** if `persona.curiosity > 0.5` and `d < 10` and state is `'graze'`, `'roam'` or `'rest'` and `input.rand() < 0.02 * persona.curiosity` per frame: state `'look'`, timer 1.5, velocity 0.
  6. **Lure:** if `input.bait` is not null and state is not hide, run or look and `persona.boldness > 0.4`: state `'lured'`, target = bait, velocity toward bait at 1.6 units/s. When within 0.6 of the bait: state `'graze'`, timer 2, velocity 0.
  7. **Timers:** states `'look'` and `'graze'` and `'rest'` count `timer` down by dt; at 0 go to `'roam'` (or `'graze'` for docile creatures, so they keep nibbling).
  8. **Roam:** if state `'roam'`: if no target or within 0.4 of it, pick a new target inside the zone with `rand()`: angle `2π·rand()`, distance `zone.radius·sqrt(rand())·(0.4 + 0.6·persona.restlessness)`, then keep it inside the zone. Velocity toward target at `0.3 + 0.7·persona.restlessness` units/s. Every 4 to 8 seconds (use timer) a roaming creature may choose `'graze'` (timer 3 to 6) with probability `0.5 - 0.4·persona.restlessness`.
  9. **Rest:** not used by the rules above; leave the state value in the type only.
  Every state change must keep `clearTime` as it is except in rule 2.
  The function must not mutate its inputs: return a new `Mind` object and a new `velocity`.
- `initialMind()`: keep as in the stub (state graze, timer 0).

## Contract
Exports as in the stub: `Personality`, `MindState`, `Point`, `Mind`, `MindInput`, `MindStep`, `personalityOf`, `initialMind`, `stepMind`. Do not add required fields to `Mind` or `MindInput`.

## Done when
- `npm test -w games/gnomeokemon -- character` passes. Write `src/snap/character.test.ts` (new) that checks:
  1. every temperament's default traits are between 0 and 1, and `personalityOf` returns a `quirk` that is non-empty for all 42 dex ids;
  2. a shy creature (shyness 0.9) with a cover spot 3 units away goes to state `'hide'` when Tag is 5 units away;
  3. a hidden creature stays in `'hide'` while Tag is within 9 units, and leaves to `'run'` only after Tag has been 9+ units away for 1.5 seconds (step with dt 0.1);
  4. a roaming creature's position stays inside its zone for 200 steps of 0.1 s with a fixed `rand` (use a seeded function);
  5. a bold creature with bait 4 units away moves toward the bait (velocity dot bait direction > 0) and reaches `'graze'` after arriving;
  6. `stepMind` does not change its input `mind` object.
- `npx tsc --noEmit -p games/gnomeokemon` passes.

## Out of scope
layout.ts, world.ts, game.ts, types.ts and all other files. Do not import THREE or DOM in character.ts.

Report: the test output and any species whose quirk you could not write from its `wants` line.
~~~~

~~~~text
Epic: 1C Creature animation for the new actions
Depends on: none

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing layout.ts (1A) and character.ts (1B) at the same time. Touch only world.ts's `animateLawnCreature` and its test.

## Goal
`animateLawnCreature` draws the four new actions (`run`, `hide`, `graze`, `look`) and takes an optional look direction.

## Read first
- src/snap/world.ts: `animateLawnCreature` at the bottom of the file (around line 980). Read the whole function.
- src/snap/types.ts: `CreatureAction` (now includes `run`, `hide`, `graze`, `look`).

## Change
- src/snap/world.ts `animateLawnCreature`: add an optional seventh parameter `lookYaw = 0` (world yaw the creature should face when `look`). Add branches before the default `else`:
  - `run`: bob faster (`group.position.y = baseY + Math.abs(Math.sin(t * 16)) * 0.12`), tail sways fast (`tail.rotation.y = Math.sin(t * 18) * 0.7`), head forward (`head.rotation.x = 0.15`).
  - `hide`: lower the body into cover (`group.position.y = baseY - 0.35`), squash the scale in y (`group.scale.y = 0.7` and restore to 1 in other branches), head still (`head.rotation.x = 0`, `head.rotation.y = 0`). Do not change `group.rotation.y` here.
  - `graze`: slow nibble (`group.position.y = baseY`), `head.rotation.x = 0.6 + Math.sin(t * 3) * 0.12`, tail still.
  - `look`: keep `group.position.y = baseY`, turn the head to face Tag: `head.rotation.y = wrapAngle(lookYaw - baseRotY)` where `wrapAngle` maps the angle into [-π, π] (write it as a local helper). Do not change `group.rotation.y`.
  - Keep the `scale.y` reset (`group.scale.y = 1`) in the non-hide branches; hide sets it to 0.7. Remember `spawnLawnCreature` sets scale uniformly with `setScalar` when `spawn.scale` is not 1, so for hide use `group.scale.y = (group.userData.baseScaleY ?? 1) * 0.7` and read `baseScaleY` from `group.scale.y` the first time (set `group.userData.baseScaleY` if undefined). This keeps the species' own scale.
- src/snap/world.test.ts (new): test the helper `wrapAngle` only. Export it from world.ts as `export function wrapAngle(a: number): number` so the test can import it. The test checks `wrapAngle(3*Math.PI) ≈ Math.PI` (within 1e-9), `wrapAngle(-3*Math.PI/2) ≈ Math.PI/2`, and `wrapAngle(0.3) === 0.3`. Import `wrapAngle` from `./world`. If importing world.ts pulls in the prefab registry and fails under vitest, move `wrapAngle` into `src/snap/angle.ts` (new) and import from there in both files, and say so in your report.

## Contract
`animateLawnCreature(group, action, t, baseY, baseRotY, lookYaw?)`. The new parameter is optional, so current callers still compile.
`CreatureAction` values `run`, `hide`, `graze`, `look` each have a branch.

## Done when
- `npm test -w games/gnomeokemon -- world` passes (or `angle` if you moved the helper).
- `npx tsc --noEmit -p games/gnomeokemon` passes.

## Out of scope
game.ts, layout.ts, character.ts, types.ts, and the spawn lists. Do not change the behaviour of `eating`, `startled` or `dancing`.

Report: the test output and whether `wrapAngle` moved to angle.ts.
~~~~

~~~~text
Epic: 2A Ride integration: creatures move by mind, hide, and come to bait
Depends on: 1A, 1B, 1C

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Run npm from the repo root with `-w games/gnomeokemon`.
No other worker is editing this game during this epic. You own game.ts.
Repo rules: no harm. Every action keeps its on-screen touch button (Bait, Pester, Flute already exist). No new buttons.

## Goal
In the ride, each creature is driven by its `Mind` (from `stepMind`), in its layout zone, using the course layout from `layoutFor`. The temperament responses from the last PR (bait, pester, flute, Tag notice) still apply.

## Read first
- src/snap/layout.ts, src/snap/character.ts, src/snap/types.ts: the contracts (read only).
- src/snap/game.ts:
  - `LiveCreature` (around line 28): add the new fields below.
  - the creature construction (around line 283, `getCourseSpawns(courseId).map(...)`): replace with `layoutFor(courseId).spawns`, and build each creature's zone from `layout.zones[sp.zone]`.
  - `applyBait` (around line 400): keep the temperament gate (`baitResult`), but for an approved bait set the creature's mind to `'lured'` with the bait point as target instead of the old walk.
  - the creature update loop (around line 780 onwards): the `idle` movement by `behavior` and the `eating` walk are replaced by the mind. Keep the `startled`, `dancing` and `frozenTime` branches, and the Tag notice branch, working as before.
  - `animateLawnCreature` call sites: pass the look yaw `Math.atan2(dog.x - c.x, dog.z - c.z)` as the 6th argument when the creature's mind state is `'look'`.
- docs/design/gnomeokemon/temperaments.md: section 2.

## Change
- src/snap/game.ts:
  1. `LiveCreature`: add `mind: Mind` (start from `initialMind()`), `persona: Personality` (from `personalityOf(speciesId, temperament)`), `zone: Zone` (from the layout, with the spawn's zone index). Keep existing fields that other code still uses (`basePos`, `baitTarget`, `drift`, `spinY`, `fleeing`, `frozenTime`, `awayTime`, `action`, `actionTimer`).
  2. Each frame, for each creature with `action` `'idle'` or `'eating'`-by-mind, call `stepMind(c.mind, c.persona, { self, tag: dog position xz, bait: the live bait point xz or null, zone, cover: layout.cover, dt, rand: Math.random })`. Store the returned `mind` and apply the `velocity` to `c.group.position` (x and z), clamped so the creature stays within `zone` (radius). Set `c.basePos` to the new position on each frame so the `drift` and `awayTime` logic keep working.
  3. Map `mind.state` to `action`:
     - `'graze'` -> `'graze'`
     - `'roam'` -> `'idle'`
     - `'look'` -> `'look'`
     - `'run'` -> `'run'`
     - `'hide'` -> `'hide'`
     - `'lured'` -> `'eating'`, with `baitTarget` set to the bait point, and the creature turns to face the bait.
     - `'rest'` -> `'idle'`
  4. Bait: when the temperament gate approves a bait (`applyBait`), set `c.mind.state = 'lured'`, `c.mind.target` to the bait point. Keep the existing `eating` timer and `actionTimer` so the creature stops eating after a few seconds. For `'steal'`, keep the existing toast on arrival.
  5. Pester: `'bolt'` now sets `c.mind.state = 'run'` with `timer 1.2` and target 6 units away from the hit point (not the old eating walk). Keep the `fleeing` flag off, since no bonus is given either way. Keep `'display'` and the smear.
  6. Flute: keep the existing behaviour. The `'freeze'` result sets `frozenTime`; while `frozenTime > 0`, skip `stepMind` for that creature.
  7. Remove the old `behavior`-based idle motion (the `patrol`/`orbit`/`hop`/`swoop`/`burrow`/`roll` branches) for creatures that now have a mind. The `behavior` field stays on `LiveCreature` for now; do not delete the `CreatureBehavior` type in world.ts.
  8. Course spawns: `layoutFor(courseId)` replaces `getCourseSpawns(courseId)`. Keep `getCourseSpawns` in world.ts; do not delete it.
- Smear and temperament code: do not change `smear.ts` or `temperament.ts`.

## Contract
Uses the exported functions as declared: `layoutFor`, `stepMind`, `initialMind`, `personalityOf`, `animateLawnCreature` (6th param: look yaw). Do not change those signatures.

## Done when
- `npm run build -w games/gnomeokemon` passes.
- `npm test -w games/gnomeokemon` passes.
- The dev server runs and `?mode=snap&course=lawn` loads with no console errors (run `bash tools/smoke.sh <url> snap-stage` against it). Use a dev port other than 5199.
- In the ride, creatures wander inside their zones, a Shy creature hides in cover as Tag approaches, and a bait draws a Bold creature.

## Out of scope
layout.ts, character.ts, types.ts, world.ts (you may import from it), temperament.ts, smear.ts, gnomokedex.ts, models.ts and all docs.

Report: build, test and smoke results; what you did about the bolt and bait changes; anything in the mind rules that looked wrong in play.
~~~~
