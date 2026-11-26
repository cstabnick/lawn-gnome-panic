Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: sonnet (general-purpose)

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` and `docs/roadmaps/gta-batch-3/E32/issues/_canon.md`.

## Goal
Hedgeworth's life covers the nine holes: tee signs with jokes for holes 4..8 (and The Ninth's joke updated now the
"other five" exist), the **mole** that finally pops out of a molehill by the ninth green (E15 skipped it: no prefab),
residents doing something specific in the Bottom Garden, and ambient life (a sprinkler, birds at the birdbath).

## Read first
- `games/gnome-theft-auto/src/golf/life.ts` (378 lines): `HOLE_JOKES`, the tee-sign loop (it already loops `HOLES`),
  `SPRINKLERS`, the members, the mole block (`firstOf(['mole'])`, `put(... MOLEHILLS[0] ...)`) and `update()` (find how
  the mole is meant to pop; if no animation code exists, write it).
- `games/gnome-theft-auto/src/golf/life.test.ts`
- `games/gnome-theft-auto/src/golf/types.ts`: `HOLES`, `MOLEHILLS`, `HEDGEWORTH_CAST`, `POTTING_SHED`, `inPlay`.
- `packages/prefabs/src/catalog/gta-golf-plants.ts` around `mole-hill` (style), and `packages/prefabs/README.md`
  (category for a creature: check what other animals use, e.g. grep `category: 'critter'` or `'creature'`).

## Change
- `packages/prefabs/src/catalog/gta-golf-nine-critters.ts` (yours): `mole`: a plump velvety dark-grey mole about
  0.35 m long, pink star-ish nose, big pink digging paws held forward, tiny eyes; origin at the belly bottom so it can
  rise out of a molehill (front +z). Five `examine` lines (Hedgeworth officially has no moles). `npm test -w
  packages/prefabs` must pass for it.
- `src/golf/life.ts`:
  1. `HOLE_JOKES`: add 4..8 and replace 9. Suggested (improve if you can, keep them short, one line, ≤ 40 chars):
     4 `Peony's Promise: kept, eventually.`, 5 `The Maze: the hedges know the way.`, 6 `The Drip: the birds are
     judging.`, 7 `The Potting Shed: mind the gutter.`, 8 `The Rhubarb Patch: the plants were here first.`, 9 `The
     Ninth: it really is, now.`
  2. Hole 7's tee sign must stand on the ground beside the shed, not inside it: for a hole with `teeY`, put the sign
     at the ladder side (`POTTING_SHED.ladder` + 1.5 m east). Check every new tee sign is off the fairway and not inside
     a hedge (the maze tee at (-1318, 845) has the maze walls south of it: put the sign on the north side if needed).
  3. **The mole**: pops up from `MOLEHILLS[0]` (and on later pops from a different molehill, cycling), every 25-35 s:
     rises over 0.4 s, looks left and right for ~2 s (small yaw wobble), sinks over 0.4 s. Only when the player is
     within 60 m (use the existing distance logic in `update` if any). Hidden when not popping. A molehill that the
     player patted flat (the save) — ignore that, the mole is decoration.
  4. **Residents in the Bottom Garden** (unnamed members, built like the two existing members with `makeGnome` and
     `memberLook`): (a) a member lost in hole 5's maze, standing in a dead end near (-1350, 925), turning slowly
     every few seconds, holding a scorecard (`golf-scorecard` or similar prefab if one exists, else nothing); (b) a
     member on the bank of the Drip near (-1262, 918) fishing a ball out with a long net or stick, crouching; (c) Basil
     stays where he is; Thrift stays. Keep them out of `inPlay(x, z, 1)`.
  5. A sprinkler on hole 8's fairway side (add to `SPRINKLERS`, off the fairway, e.g. (-1012, 920)), and birds: if the
     game has a small bird prefab (grep `songbird`, `sparrow`, `robin`, `bird` in the prefab ids), 2-3 birds perched on
     the rim of the giant birdbath at (-1248, 934) (bowl rim about 4.2 m up, ~2.3 m radius; the birdbath itself is built
     by another file, so place the birds only and accept they may need a height tweak), hopping occasionally.
- `src/golf/life.test.ts`: tests for: 9 tee signs; the mole object exists when the prefab is registered and is hidden at
  t = 0; the new residents are outside `inPlay`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/life.test.ts` passes; `npm test -w packages/prefabs` passes for
  `mole`; `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- Screenshots (scratchpad `B7/`): `mole:-1052,622,3.14` (wait long enough or temporarily force a pop while checking,
  then remove the forcing), `drip:-1268,912,0.6`, `maze:-1340,920,1.2`. Look at them and fix what looks wrong.

## Out of scope
bottomGarden.ts (props, birdbath, shed), yard.ts, runtime.ts, types.ts.
