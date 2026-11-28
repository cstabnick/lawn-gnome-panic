Epic: FX11 B (after B1-B5) · Issue B6: the coast lore matches the build (GR1)
Depends on: B1-B5 (reads what they built) · Agent: Sonnet · No dev server

(The Environment section the lead gave you applies.)

## Goal
Decision GR1: signature images change the game (done this epic: the bucket, dunes, sand); positions, counts, colours, small facts and new people change the LORE to match the build, and every lore change gets a ruling appended to `docs/lore/rulings.md`. Record everything FX11 built or renamed so the lore and the game agree, and `npm run lore` passes.

## Read first
- `docs/lore/README.md` (entry format, front matter, how rulings are written), `docs/lore/canon.md` (skim), `docs/lore/rulings.md` (the last rulings, R-236..R-239, for the format; number new ones from **R-240** upward in order).
- The FX11 code (read for facts, do not edit): `games/gnome-theft-auto/src/coast/config.ts`, `dunes.ts`, `stalls.ts`, `promenade.ts`, `life.ts`, `beachScenes.ts`, `pier.ts`, `spokewheel.ts`, `pirateShip.ts`, `boardwalk.ts`, `src/tubing/view.ts` (`buildLastTube`), `src/quests/coastQuests.ts`, `src/data/levels/south-shore.level.json` (the dune stamps and the Saltcut's new points; world z = local z + 1150), `src/boatTraffic.ts` (the fishing smack).
- The coast entries in `docs/lore/entries/apocrypha/`: `saltbucket-shore.md`, `saltbucket-boardwalk.md`, `the-boardwalk-stalls.md`, `long-spoon-pier.md`, `the-spokewheel.md`, `the-bathtub-queen.md`, `samphire-bilge.md`, `marram-teaspoon.md`, `spun-sugar-sal.md`, `the-last-tube.md`, `driftwood-castaway.md`, `the-saltcut.md`, `the-saltwater.md`, `dunelow.md`, `reel-ruth.md` (if present). `docs/lore/settings.md` (no new setting row needed).
- `npm run lore -- find <word>` to search; `npm run lore` to validate.

## Change (only under `docs/lore/`)
1. Rulings R-240+ (one per decision, short, each citing the finding (G3#n) and the code that is now the fixed point), at least:
   - The boardwalk deck is 420 x 30 m (x -210..210, z 1102..1132; was 46 m deep), stalls at z 1105.5 (D14, G3#6).
   - The giant bucket: rim about 40 m across centred at (0, 1028) breaking the sand round the coast spur, its handle arching about 14 m over the spur as the town's gateway; the Tall One's spade in a dune at (-46, 1074) (D14, G3#5).
   - The dune band z about 1058-1092 with marram grass and a weathered fence; sand from z 1040 within 460 m of the spur (D14).
   - The five stall keepers (new people): Gil Brinewater (Plank & Pickle), Tam Tinsley (Tin Shy, sulks), Dot Scoopwell (Scoop & Spade), Madame Limpet (The Lucky Limpet), Penny Stubbs (Marram's Office, counts the change) (G3#7, G3#15).
   - Captain Bilge's place: at the head of the pier (300, 1168) by a chalk A-board of tour times (G3#4); the chest at the foot of her bed (G3#14).
   - The side quest `coast-boardwalk-tubing` is titled "The Buoy Run" (G3#16).
   - The Last Tube faces the sea (G3#19); the Spokewheel has a brass bell and is free after "The Wobbly Gondola" (G3#17, G3#15).
   - The Saltcut bends; its mouth at about (730, 1190) with a daymark on the east bank (G3#26); the Pirate Tours stop 4 is on the pier bowl (G3#31).
   - Any new names B3/B5 gave to promenade and beach residents, the beach scenes as a fact list if notable, the fishing smack on the horizon.
2. Entries: update the facts in the existing entries above (positions, sizes, the keepers in the stalls entry with their lines, the pier's silver handle and bowl lip, the Last Tube's notices, the Spokewheel's notices and bell, the bucket and dunes in saltbucket-shore.md "In the games"). Add person entries for the five keepers and for each new named resident from B3/B5 (short: one-line summary, what gnomes say, where they stand in the game with coordinates, look, line). Keep the voice and front-matter format of neighbouring entries.
3. `npm run lore` passes.

## Done when
- `npm run lore` passes (from the repo root).
- `grep -c "^## R-2" docs/lore/rulings.md` grew by the number of rulings you added; each new ruling has a heading `## R-<n>` like its neighbours.

## Out of scope
Code; other games' lore.
