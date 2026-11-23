Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first. Also read `docs/roadmaps/prefab-library/_common.md` for the prefab
format, EXCEPT its "Environment" and "Examine voice" sections. Examine voice here: Gnome Theft Auto, a parody crime
world; no new named characters except these, who exist: Vinnie "Turbo-Sod" Delacroix (champion zero-turn racer),
Burdock "Big Flag" Bellweather (race director, waves a chequered tea towel), Dock "Full-Throttle" Hoewright (radio DJ),
Shelldon "No-Trail" Mucilage (snail courier who will not touch paved roads), the Carburettors (street-racing crew),
Dandelion Fizz (soda brand). Place: the Lost & Found Speedway on the Dust Flats.

## Goal
Six wearable achievement rewards exist in `packages/prefabs/src/catalog/gta-race-gear.ts`, and
`npm test -w packages/achievements` passes (the six achievements already reference these ids).

## Read first
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- Wearable examples: in `packages/prefabs/src/catalog/cosmetics-head-a.ts` (any 'wear-head' item),
  `cosmetics-neck.ts` ('wear-neck'), `cosmetics-back.ts` ('wear-back'), and `brass-calipers` in `gta-story.ts`
  (a hand reward: `uses: ['hold']` + `grip`). Copy their scale, origin and orientation conventions exactly.
- `packages/achievements/src/catalog.ts`, search `gta-speedway`: the six defs and the slot each id goes in.
- `packages/achievements/src/achievements.test.ts`: what it checks (prefab exists, has the slot's use).

## Change
`packages/prefabs/src/catalog/gta-race-gear.ts`: fill `GTA_RACE_GEAR` with:
1. `speedway-chequered-cap` "Chequered Speedway Cap": a racing cap, black-and-white chequered crown (alternating small
   parts), a short brim, `uses: ['wear-head']`, category 'armor'.
2. `speedway-stopwatch-pendant` "Stopwatch Pendant": a chunky silver stopwatch on a cord, `uses: ['wear-neck']`, category 'trinket'.
3. `speedway-fizz-rosette` "Fizz Cup Rosette": a yellow (0xffd21f) prize rosette with two ribbon tails on a neck ribbon,
   `uses: ['wear-neck']`, category 'trinket'.
4. `speedway-exhaust-pack` "Twin-Exhaust Backpack": a small chrome backpack frame with two upturned exhaust pipes and
   an orange (0xff6a00) Carburettors flame decal, `uses: ['wear-back']`, category 'armor'.
5. `speedway-shell-visor` "Snail-Shell Visor": a sun visor whose crown is a spiral snail shell, `uses: ['wear-head']`, category 'armor'.
6. `speedway-fizz-cup` "The Fizz Cup": a gold trophy cup with two handles and a yellow fizz-bubble lid, held upright,
   `uses: ['hold']` with a `grip` at its stem, category 'trinket'. (Rare reward.)
Each: tags, `emoji: []`, `about`, 5 examine lines, sizes like the examples (a hat is about 0.45 tall; a hand item
about 0.3), lowest point y = 0.

## Contract
The six ids exactly as above, with those uses.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in gta-race-gear.ts
- `npm test -w packages/prefabs` passes for your ids (ignore gta-race-track.ts failures from the other worker)
- `npm test -w packages/achievements` passes

## Out of scope
Every other file, including packages/achievements/src/catalog.ts (already written) and catalog/index.ts.
