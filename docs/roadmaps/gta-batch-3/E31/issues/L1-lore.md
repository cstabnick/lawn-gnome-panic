Epic: E31 wave 3 (lore)
Depends on: waves 1-2 (the names are in the code now)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Docs only: edit nothing under `games/` or `packages/`.

## Goal
The lore knowledge base records what E31 added to Gnome Theft Auto, so later story epics can use it.

## Read first
- `docs/lore/README.md` (entry format, front matter, how rulings work) and `docs/lore/canon.md`
- `docs/lore/entries/apocrypha/the-unmown.md` (the existing entry to extend), `docs/lore/rulings.md` (last ruling is
  R-198: yours start at R-199)
- `docs/lore/settings.md` (the GTA apocrypha row near line 93)
- The code for names: `games/gnome-theft-auto/src/living/config.ts`, `src/unmown/vignettes.ts` (`unmownPeople`),
  `src/unmown/station.ts`, `src/living/hamlet*.ts`, `src/living/highTarn.ts`, `src/birding/species.ts` (the last 8
  species), `src/config.ts` VEHICLES 'ranger-buggy' / 'shell-camper' / 'cone-van', `src/unmown/checklist.ts`.

## Change (all under `docs/lore/`)
- Before naming anything new, `npm run lore -- find <word>` for each name; if a name clashes with an existing entry,
  note it in your reply (do not rename code).
- New entries (apocrypha, status draft, games [gnome-theft-auto], sources pointing at the code files):
  `unmown-ranger-station.md` (the station, its rules, the Last Blade, the lost-hat box), `unmown-rangers.md` (Head Ranger
  Burdock Haybright, Junior Ranger Pip Tussock and what they do), `reedmere.md` (the marsh, the boardwalk, the hides, the
  bittern), `last-dandelion.md`, `band-hamlets.md` (Espalier End, Mittenholt, Dunelow: one section each, their
  residents and notices), `high-tarn.md`, `living-world-rides.md` (the Ranger Buggy, the Snail-Shell Camper, the
  Ninety-Nine Cone Van).
- Extend `the-unmown.md`: the "In the games" section lists what is there now (station, Reedmere boardwalk, hides,
  checklist, wildlife) and adds related ids.
- Rulings (append to `rulings.md`, R-199 onwards, 3-5 of them, each short): e.g. the Unmown's rules are enforced by
  politeness only and the HOA may visit but not measure; the outer hamlets were settled by gnomes who left Turfton for
  quieter lawns and each keeps one odd custom; the new small wildlife follows R-021 (nothing dies, knocked over and gets
  up); new birds count toward the life list.
- `settings.md`: add the new places to the GTA apocrypha row (or the row the Unmown is in), one clause.
- Run `npm run lore` until it passes.

## Done when
- `npm run lore` passes.

## Out of scope
Everything outside `docs/lore/`.
