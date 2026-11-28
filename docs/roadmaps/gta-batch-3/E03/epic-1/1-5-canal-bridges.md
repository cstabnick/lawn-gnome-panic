Epic: 1 Fixes (parallel) · Item: L23 "fix bridges - they go all the way to the bottom of the canal atm. can drive through though, but visually broken" · Model: sonnet
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
Bridges over the canal (and any other water body with a low deck) look right: the arch and piers end at the bank/bed
level instead of plunging through the canal bed, and boats still pass under.

## Root cause (confirmed by reading; verify the numbers)
`waterworks.ts` ~81-90: every bridge uses prefab `arch-road-bridge` placed at `y = b.deck - ARCH_DECK` (6.5) with only
`scaleX`/`scaleZ` (`WorkPlacement` has no `scaleY`; placements are built ~line 230). The canal deck stands only
`WATER.bridgeClearance.canal = 2.2` above the water (`config.ts` ~808, freeboard 1.6, depth 0.85), so the 6.5 m arch
puts its piers ~4.3 m below the deck: through the canal bed. Bridge decks come from `water.ts` `bridges()` (~567).
Prefab: `packages/prefabs/src/catalog/gta-waterworks.ts` `arch-road-bridge`.

## Change
- `waterworks.ts`: add `scaleY?: number` to `WorkPlacement` and apply it where placements become meshes. For each
  bridge compute the depth it needs: `need = b.deck - bedLevel` where `bedLevel` is the lowest `bedAt`/bank height
  under the bridge span (sample along the span, `water.ts` exports `bedAt`/`waterAt`); if `need < ARCH_DECK` set
  `scaleY = need / ARCH_DECK` and `y = b.deck - need` so the deck top stays at `b.deck`. If squashing makes the deck or
  rails look wrong (check the prefab parts: deck thickness, rail height), instead add a low-profile
  `canal-road-bridge` PrefabDef to `gta-waterworks.ts` (flat deck on two short abutments + rails; rules in
  `docs/roadmaps/prefab-library/_common.md`) and use it where `need < ARCH_DECK`. Keep colliders/deck heights unchanged
  (driving over must behave exactly as before).
- `waterworks.test.ts`: assert that for every bridge placement, the bottom of the placed prefab (`y`, or the prefab's
  scaled bounds) is not below the local bed (`bedAt` at the bridge centre) minus 0.1, and that the deck top equals the
  `bridges()` deck within 0.05.
- If you add a prefab: `npm test -w packages/prefabs` must pass.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/waterworks.test.ts src/water.test.ts src/boatCrossing.test.ts src/canalCruise.test.ts`
  pass (canalCruise has one `it.fails` case another worker is fixing; it may flip during your run - ignore that case).
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.

## Out of scope
`config.ts`, `water.ts` deck heights, `biomes.ts`, `collide.ts`.
