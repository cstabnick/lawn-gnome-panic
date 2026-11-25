Epic: E23-1 Framework (parallel)
Depends on: none
Model: sonnet

## Environment
Read `docs/roadmaps/gta-batch-3/E23/env.md` first (worktree, toolchain, line endings, contracts in place, rules).

## Goal
The Hat Watch (`police.ts`) gets (a) a heat cap quests can set, (b) units that are *dispatched* after a delay from
out of view instead of popping in 25-75 m away, (c) cooling that needs broken line of sight, and (d) a search area +
evade progress the HUD can draw. User's words: "fighting the hat right now is effectively impossible ... they currently
teleport in really quick and player has no visual aid to see how to lose levels." Keep the charm: the HOA van, its
gold ring, citations, roadblocks and level counts stay as they are.

## Read first
- `police.ts` (whole file, ~820 lines): `createWatch`, `spawnOfficer` (l.~164, walk points 25..45 m), `spawnPursuit`
  (l.~374, `levelNodes(.., 32, 75)`), roadblock (l.~528, 45..75 m: leave as is, a roadblock ahead is fair),
  `stepPursuits`, `tick` (cooling with `unseenFor`, `SEEN_DISTANCE` 30, `isPlayerHidden()`), the `w: Watch` object
  (`addHeat`, `clear`).
- `config.ts` `HEAT`, `WATCH` (incl. the E23 fields at its end), `MAX_HEAT`.
- `types.ts` `Watch`, `WatchSearch`, `Box` (`{minX,maxX,minZ,maxZ,h}`), `World.boxes`.
- `police.levels.test.ts` (existing test style).

## Change
- `police.ts`:
  1. **Cap.** `let cap: number | null = null`. `w.setCap(c)`: store it; if `c !== null && w.heat > c` set `w.heat = c`
     (when c is 0 also do what `clear()` does to officers/pursuits/roadblock, but keep guards and squads).
     `addHeat` clamps to `Math.min(MAX_HEAT, cap ?? MAX_HEAT)`. In `tick`, also clamp heat to the cap every frame.
  2. **Dispatch delay.** Track `lastLevel`. When `Math.floor(heat)` rises above `lastLevel`, set
     `dispatchT = WATCH.dispatchDelay[level]`. While `dispatchT > 0` (count down by dt) do NOT spawn new officers or
     pursuits (units already present keep acting). Level 1 from 0 also waits its 6 s.
  3. **Out of view spawns.** Keep a heading estimate from the player's movement between ticks (`hx, hz` unit vector
     from the last position delta when it moved > 0.05 m; keep the old one otherwise; start (0, 1)). Officers: walk
     points with distance in [`WATCH.officerSpawnMin`, `WATCH.officerSpawnMax`]; prefer points behind the player
     (`dot((p - player)/d, heading) < -0.2`), fall back to any in range, then fall back to the old 25..45 band but never
     under `WATCH.spawnNever`; if none, spawn nothing this frame. Pursuits: `levelNodes(nodes, px, pz, py,
     WATCH.pursuitSpawnMin, WATCH.pursuitSpawnMax)` with the same behind-preference; the existing ground fallback uses
     the same band. Never spawn within `WATCH.spawnNever`.
  4. **Line of sight.** `export function lineOfSight(boxes: Box[], ax, az, bx, bz): boolean` (pure, exported): false
     when the 2D segment crosses any box with `h >= 1.6` (slab test on the AABB; ignore `shape`). In `tick`'s cooling,
     a unit/pursuit counts as seeing the player only if within `SEEN_DISTANCE` (raise it to 40) AND `lineOfSight`.
     Cache: only test boxes whose AABB overlaps the segment's AABB.
  5. **Search area.** While seen: `searchX/Z = player pos`. Radius `WATCH.searchRadius + WATCH.searchRadiusPerLevel *
     (level - 1)`. Cooling: heat cools (`HEAT.coolRate`) once `unseenFor > HEAT.coolDelay`; outside the search circle
     it cools twice as fast and `unseenFor` counts 1.5x. Officers with no sight walk toward the search centre instead
     of straight at the player (find where units steer toward the player in `stepUnit` and use the search centre when
     the unit cannot see the player and is > 12 m away).
  6. `w.search()`: null when `Math.floor(heat) < 1`, else `{ x: searchX, z: searchZ, r, seen, inside, evade, level,
     dispatchIn: Math.max(0, dispatchT) }` where `evade` = while seen 0; while `unseenFor <= coolDelay`:
     `0.5 * unseenFor / coolDelay`; after: `0.5 + 0.5 * (1 - (heat - level))` (the fraction of this level cooled off),
     clamped 0..1.
  7. `clear()` also resets `dispatchT`, `lastLevel`, `unseenFor` (cap stays).
- `police.rebalance.test.ts` (new): `lineOfSight` (clear, blocked, low box `h < 1.6` ignored); a `createWatch` with a
  tiny fake world (see how `police.levels.test.ts` / other tests build one, or construct `{ walkPoints, roads: { nodes:
  [] }, boxes: [], base: {...} }` as the code needs) showing: `setCap(1)` then `addHeat(3)` → heat 1; `setCap(0)` →
  heat 0; after `addHeat(1)` no officer is spawned within the first 5 s of updates and none ever closer than 50 m;
  `search()` null at heat 0 and `evade` rises while no unit sees the player.

## Contract
`Watch.setCap?(cap: number | null): void`, `Watch.search?(): WatchSearch | null` (shapes in `types.ts`, do not change).
`export function lineOfSight(boxes: Box[], ax: number, az: number, bx: number, bz: number): boolean` in `police.ts`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for `police.ts` and the new test.
- `cd games/gnome-theft-auto && npx vitest run src/police.rebalance.test.ts src/police.levels.test.ts` passes.

## Out of scope
`hud.ts` (issue 1-4), `app.ts` (lead), `config.ts` / `types.ts` (contracts fixed; ask in your report if a number must
change), quests.
