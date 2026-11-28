Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: sonnet (general-purpose)

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` and `docs/roadmaps/gta-batch-3/E32/issues/_canon.md`.

## Goal
The lore knowledge base records that Hedgeworth Links is now nine holes: a ruling, the new places, updated entries.

## Read first
- `docs/lore/README.md` (entry format, front matter, how rulings are written), `docs/lore/canon.md`.
- `docs/lore/rulings.md`: R-193, R-194, R-195 (Hedgeworth) and the last ruling (R-217) for the format.
- `docs/lore/entries/apocrypha/`: `hedgeworth-links.md`, `hedgeworth.md`, `peony-gravelrake.md`,
  `thrift-hosepipe.md`, `basil-divot.md`, `hosepipe-pond.md`, `gnome-yard.md`.
- `docs/lore/settings.md` (the Hedgeworth / apocrypha row) and `docs/lore/INDEX.md` if entries are listed there.

## Change
- `docs/lore/rulings.md`: append **R-226** (Question / Ruling / Applies to / Date 2026-11-25 / Why), e.g. "How many
  holes does Hedgeworth Links have now, and where are 4 to 8?" Ruling: nine; the missing 4-8 are in the Bottom Garden
  through the Turn Gate (names, pars, one-line signatures from the canon); course par 34; R-194 stands as history: the
  card said nine for years and Peony promised the rest every season; play order 1-9 with 9 still by Thrift's shed. Rulings are
  append-only: do not edit R-194, R-226 refers to it.
  E17 and E26 may be adding R-226+ in parallel on other branches: that is expected, the lead renumbers at merge.
- New entries (apocrypha, `games: [gnome-theft-auto]`, status draft, `sources` incl. `docs/lore/rulings.md#r-218` and
  `games/gnome-theft-auto/src/golf/types.ts`): `the-bottom-garden` (place), `the-turn-gate` (place), `the-drip`
  (place: overflow pool below Hosepipe Pond with the giant birdbath). Each with "What gnomes say" (2 sayings), "The
  truth", "In the games" (coordinates from types.ts: Bottom Garden x -1360..-1000, z 829..974; Turn Gate (-1140, 829);
  the Drip (-1248, 934) r 14 m), "Loose threads".
- Update: `hedgeworth-links.md` (nine holes listed with pars, course par 34, the new "In the games" coordinates for
  holes 4-8: tees and greens from types.ts, the maze, the shed roof tee, the side quest `sq-hedgeworth-peonys-promise`,
  achievements `gta-hedgeworth-full-nine`, `gta-nine-under-par`, `gta-out-of-the-maze`), `hedgeworth.md` (the yard
  grew south over the Bottom Garden; 360 by 564 m now), `peony-gravelrake.md` (the promise kept; gives
  `sq-hedgeworth-peonys-promise`), `thrift-hosepipe.md` (laid out 4-8 by hand; the leaking hosepipe), `hosepipe-pond.md`
  (its overflow, the Drip), and `related:` lists both ways for the new entries. `settings.md` / `INDEX.md` if they list
  entries.
- Run `npm run lore` until it passes (it validates front matter, links and related lists).

## Done when
- `npm run lore` passes.
- `npm run lore -- find "Bottom Garden"` finds the new entries.

## Out of scope
Any code. Other lore entries than Hedgeworth's.
