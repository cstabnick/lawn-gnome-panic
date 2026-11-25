Epic: E28-2 Fill (GTA batch 3, world expansion II)
Depends on: none

(Read `docs/roadmaps/gta-batch-3/E28/epic-2/_env.md` first: environment, coordinates and the new places.)

## Goal
Birding works in the two new regions (the species test wants at least 3 species per region: `pardonlin` and
`the-unmown` have none yet), and the map names the new places: Pardonlin, the Unmown, the three Wickets, the Hatwheel,
Trellis Cross and the Anthill Ring.

## Read first
- `games/gnome-theft-auto/src/birding/species.ts` (each species' `regions: { '<region id>': weight }`) and
  `src/birding/species.test.ts` (line ~52: "has at least 3 species in every region"; other rules about weights/rarity).
- `games/gnome-theft-auto/src/mapPois.ts`: `placeBlips()` (the `at(kind, x, z, label)` helper and the list it returns)
  and `src/mapIcons.ts` `PLACE_STYLE` (the blip kinds that exist: use existing kinds, e.g. 'park', 'edge', or whatever
  kind fits a town and a gate; do not add a kind unless `PLACE_STYLE` and its test make that a one-line change).
- `games/gnome-theft-auto/src/mapPois.test.ts` / `src/mapIcons.test.ts` if they pin blip counts.

## Change
- `src/birding/species.ts`: add region weights so `pardonlin` gets at least 4 existing species that fit a continental
  town garden (pigeon/sparrow/blackbird-like town birds, a heron or kingfisher-like river bird) and `the-unmown` at least
  5 that fit a wild meadow and reed bed (warblers, larks, a harrier or owl-like rarity, ducks/waders). Use weights like
  the existing ones (0.5-2.5). Do not add new species (E31 adds the preserve's own birds).
- `src/mapPois.ts`: blips for Pardonlin (-1600, -100), the Unmown (-1000, -1600), the Grand Wicket (-1400, -30), the
  North Wicket (-1400, -500), the Harbour Wicket (-1400, 1000), the Hatwheel (-1555, -30), Trellis Cross (-950, -30),
  the Anthill Ring (940, 40), Pardonlin Basin (-1600, 1040), Unmown Ranger Station (-1560, -1150).
- Fix any test that pins the old blip count by updating the count (not by removing blips).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `cd games/gnome-theft-auto && npx vitest run src/birding src/mapPois src/mapIcons` passes (only the test files that
  exist).

## Out of scope
Any file but `src/birding/species.ts`, `src/mapPois.ts` and the map/birding tests named above.
