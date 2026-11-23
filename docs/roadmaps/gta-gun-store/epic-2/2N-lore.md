Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first, then `docs/lore/README.md` (the entry schema and how to write a ruling) and
`docs/lore/canon.md` (house style).

## Goal
The lore knows Ammu-Gnation: an entry for the store and brand, an entry for its mods, and a ruling on why guns are free and mods cost
money. `npm run lore` passes.

## Read first
- `docs/lore/entries/apocrypha/pay-n-glaze.md` and `pay-n-glaze-showroom.md`: the format and voice of a Gnome Theft Auto shop entry.
- `docs/lore/rulings.md`: the last three rulings (R-051 to R-053) for the format; R-016 (guns are parody props, shot gnomes crack, no gore).
- `games/gnome-theft-auto/src/gunMods.ts`: the mod names and blurbs (the in-game facts the entries must match).
- `games/gnome-theft-auto/src/brands.ts`: search `ammu-gnation` (name, colours, slogan, fine print).

## Change
- `docs/lore/entries/apocrypha/ammu-gnation.md` (new): `id: ammu-gnation`, `name: Ammu-Gnation`, `kind: place`, `tier: apocrypha`,
  `setting: apocrypha`, `era: now`, `status: draft`, `games: [gnome-theft-auto]`, `sources: [games/gnome-theft-auto/src/gunStore.ts, games/gnome-theft-auto/src/brands.ts]`,
  `related: [ammu-gnation-mods, pay-n-glaze, fort-sandpit]` (only list ids that exist: check with `npm run lore -- find <word>` and drop any
  that do not). Body: the olive-and-orange walk-in store on the east edge of Turfton, on the road out to the Dust Flats; the slogan; every gun
  in Turfton is free (Fort Sandpit surplus that the Spade Guard lost the list for), so the store sells the shiny bits; the counter, the
  pegboard, the back room where a bolted-on gun turns on a lit plinth; the store will not serve a gnome with the Hat Watch on its tail;
  "What gnomes say" (2 lines) and "Loose threads" (1-2), like the Pay 'n' Glaze entries.
- `docs/lore/entries/apocrypha/ammu-gnation-mods.md` (new, `kind: object`): the catalogue in plain prose by slot (optics, muzzle devices,
  barrels, underbarrel, magazines, stocks, finishes, charms), naming each mod as in gunMods.ts, with what it does in one clause; the kazoo
  and the squeaky duck are real and very popular with nobody; a suppressed shot is quieter but the Hat Watch still notices a cracked gnome.
- `docs/lore/rulings.md`: append `## R-054` in the existing format: **Question:** Gnome Theft Auto now gives every gun away free and sells
  bolt-on mods at Ammu-Gnation. Where do the free guns come from, how do mods attach to a clay gnome's gun, and do the comedy mods change
  R-016? **Ruling:** (decide, short): the guns are Fort Sandpit surplus; mods bolt and glue on like Pay 'n' Glaze parts (R-052's clay-and-iron
  rule); a kazoo or a duck muzzle makes a shot sound silly and does nothing else; nothing a mod does makes a hit gory - R-016 stands.
  **Applies to:** apocrypha, gnome-theft-auto. **Date:** 2026-11-22. **Why:** one line. (If R-054 already exists, use the next free number.)
- Run `npm run lore` (it regenerates `docs/lore/INDEX.md` and checks every entry); fix anything it reports in YOUR files.

## Contract
Entry ids `ammu-gnation` and `ammu-gnation-mods`.

## Done when
- `npm run lore` passes.

## Out of scope
Every other lore entry (do not edit them), `docs/lore/canon.md`, `docs/lore/settings.md`, everything under `games/` and `packages/`.
