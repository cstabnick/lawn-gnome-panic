Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first (only the working directory, node and no-commit rules matter here).

## Goal
The Lost & Found Speedway and its people are in the lore knowledge base, consistent with Gnome Theft Auto's existing
apocrypha, and `npm run lore` passes.

## Read first
- `docs/lore/README.md` (entry schema, tiers, rulings format)
- `docs/lore/rulings.md` (the last ruling's number; you append new ones after it)
- Existing entries to match in style and to link in `related`: `docs/lore/entries/apocrypha/dust-flats.md`,
  `vinnie-turbo-sod.md`, `dock-hoewright.md`, `dandelion-fizz.md`, `the-carburettors.md`, `razor-back.md`,
  `buck-iron.md`, `shelldon-mucilage.md`, `snail-mail-express.md`, `tall-one-pencil.md` (if it exists; find with
  `npm run lore -- find pencil`), `pay-n-glaze.md` (find with `npm run lore -- find glaze`)
- `games/gnome-theft-auto/src/quests/races.ts` (the four races, the rivals and their lines: the lore must agree with it)

## Change
All new entries: `tier: apocrypha`, `setting: apocrypha`, `era: now`, `status: canon`, `games: [gnome-theft-auto]`,
`sources:` include `games/gnome-theft-auto/src/quests/races.ts` and/or `games/gnome-theft-auto/src/raceTrack/track.ts`.
Sections: summary paragraph, `## What gnomes say`, `## History` or `## The truth` where useful, `## In the games`
(where it is: the Speedway is on the Dust Flats' alkali pan north-east of the airfield, centre about (741, -467),
reached by a dirt road north from the east-outer highway at (790, 48)), `## Loose threads`.
1. `docs/lore/entries/apocrypha/lost-and-found-speedway.md` — the circuit (1.2 km, clockwise, a climb up the east
   side, a banked hairpin, the Rake-Handle Hop and Frisbee Crest jumps, grandstands built from the Great Spill: the Book
   Stack, the Sneaker, the Cooler, a toppled watering can, a giant hose arching over the north straight, a ruler as the
   pit wall). Its own Pay 'n' Glaze in the pit lane. Free to drive any time; a lap clock at the line. Rivalries:
   Dandelion Fizz (sponsor) vs Acorn-Cola (which courts the Hat Watch); Razor-Back and Buck-Iron works teams; the HOA
   wants it shut for "unlicensed noise" (the same rule Dock Hoewright was fined under). Why "Lost & Found": everything
   it is built from was lost by someone very large, and the gnomes found it.
2. `docs/lore/entries/apocrypha/the-great-spill.md` (kind event) — the night a heap of giant Tall-One things landed
   on the pan (a sneaker, a cooler, a stack of books, a garden hose, a frisbee, a rake, a ruler, a watering can). Nobody
   saw them fall. Theories (dropped, thrown away, lost on a picnic, a sign) stay contradictory. The Carburettors raced
   round the heap first; Dandelion Fizz paid to pave it.
3. `docs/lore/entries/apocrypha/burdock-bellweather.md` (person) — Burdock "Big Flag" Bellweather, race director and
   quest giver at the race desk; a former Hat Watch traffic marshal who switched sides; waves a chequered tea towel
   ("a very serious tea towel").
4. `docs/lore/entries/apocrypha/fizz-cup.md` (event) — the four-race series: Rookie Mow-Down (ride-on mowers),
   Low & Loud Derby (lowriders, vs the Carburettors), Snail-Coach Endurance (vs Shelldon, who races on the gravel
   because he will not touch paving), the Final (zero-turns, vs Vinnie and Dock).
5. One short entry each for the new rivals, or one combined entry `fizz-cup-field.md` (kind faction) listing them:
   Pebble Quickloam, Marigold "Mulch-Mouth" Fennick (Buck-Iron), Tumbleweed Tom, Lugnut Lulu and Two-Ton Teasel
   (Carburettors), Chrome-Dome Delphine, Auntie Periwinkle and her snail Doris, Slow Moe, Sprocket Vane (Razor-Back works).
6. Update existing entries with one line each under `## In the games` (keep everything else): `vinnie-turbo-sod.md`
   (rival in the Fizz Cup Final; resolves his "secret rematch" thread in a sentence or leave it open),
   `dock-hoewright.md` (comes out of retirement for the Final: "I checked the seat bolt. Twice."),
   `shelldon-mucilage.md` (Snail-Coach Endurance, races the whole lap on the run-off), `dust-flats.md` (the Speedway),
   and the Pay 'n' Glaze entry (a second station at the Speedway pit lane). Add the new ids to their `related` lists.
7. `docs/lore/rulings.md`: append a ruling (next number) — "Gnome Theft Auto: what are the giant objects at the
   Speedway?" Ruling: the Tall Ones' lost things; GTA gnomes name them "Tall-One <plain noun>" and use them without
   knowing what they were for; nobody sees the Tall Ones drop anything. Applies to: gnome-theft-auto.
8. Run `npm run lore` (it regenerates `docs/lore/INDEX.md` and checks every entry); fix anything it reports.

## Done when
- `npm run lore` passes
- `npm run lore -- find speedway` lists your entries

## Out of scope
Everything outside `docs/lore/`.
