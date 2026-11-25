Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Three homes out of town stand on their E01 home sites as recognisable places, each with a front door, a name plate, a
mailbox, windows lit at night, story vignettes, a joke sign and the resident or their traces: Sorrel's cottage behind
her radio booth in Mossy Wood (home-05), Diggs' tin bungalow south of Pebblewick (home-06, with a walk-in interior
another worker builds, id `diggs-bungalow`), Fence-Post Frank's shack behind the south welcome sign (home-07).

## Who lives there (from docs/design/gnome-theft-auto/characters.md; `npm run lore -- find <name>` for more)
- **Sorrel** (home-05, centre (-400, 50), 24 x 24, rect x -412..-388, z 38..62; Mossy Wood): host of 88.7 Fescue Public
  Radio from a booth in the woods (booth exit at (-352, 12)); soft-spoken, earnest, pledge drives. Door
  `HOME_DOORS.sorrel` (-386.5, 50) on the east side (yaw π/2), toward the booth.
- **Diggs** (home-06, (615, 220), 24 x 24, rect x 603..627, z 208..232; just south of Pebblewick, desert edge): Fort
  Sandpit's old hand, digs, hoards, distrusts the HOA; a tin bungalow. Door `HOME_DOORS.diggs` (615, 206.5) north side.
- **Fence-Post Frank** (home-07, (45, 260), 24 x 24, rect x 33..57, z 248..272; behind the south welcome sign at
  (0, 225), by Route South): a highway drifter who leans on fence posts and talks to drivers; eats at the diner counter.
  Door `HOME_DOORS.frank` (31.5, 260) on the west side (yaw -π/2) toward the road.

## Read first
- `games/gnome-theft-auto/src/homes/types.ts` (`HOME_DOORS`) and `games/gnome-theft-auto/src/homes/pieces.ts`
  (`HomePiece`, `buildPieces`, `planPieces`, `textPlate`, `litWindow`). Use these; pieces sit on the terrain height
  (`buildPieces` reads `heightAt`). For plates/windows/figures you add yourself, use `heightAt(x, z)` from `../terrain`
  for the ground y.
- `games/gnome-theft-auto/src/gnomes.ts` `makeGnome(parent, look)`.
- Prefab ids (exist; unscaled w x h x d): `thatched-cottage` 7.6 x 4.8 x 6.9, `gnome-cottage` 6.2 x 5.3 x 6.2,
  `nissen-hut` 8.1 x 3.2 x 5.3, `trailer-home` 10.1 x 3.2 x 2.8, `lean-to-shed` 4.2 x 2.7 x 3.1, `caravan`,
  `corrugated-fence`, `chain-link-fence`, `scrap-car`, `tyre-pile`, `oil-drum`, `woodpile`, `pallet-stack`,
  `power-pole`, `water-tower`, `mailbox`, `panelled-door`, `plank-door`, `crate`, `barrel`, `deck-chair`, `chair`,
  `lamp`, `signpost`, `wooden-wall-sign`, `tower-mast`, `tower-dish`. Grep `packages/prefabs/src/catalog/` for others
  (e.g. `radio`, `microphone`, `shovel`, `spade`, `metal-detector`, `kettle`, `bunting`) and only use ids that exist.

## Change
- New `games/gnome-theft-auto/src/homes/outerHomes.ts`:
  `export function outerHomePieces(): HomePiece[]` and `export function buildOuterHomes(scene: THREE.Scene): Box[]`
  (`buildPieces(scene, outerHomePieces(), 'outer-homes')`; plates, windows, figures in a group `'outer-homes-life'`).
  - Sorrel: a `thatched-cottage` with a radio aerial (`tower-mast` or `tower-dish`, scaled) on the roof or beside it, a
    cable run of posts toward the booth, a pledge-drive mug tree / tote bags on the porch, a window lit late. Sign:
    `'88.7 FESCUE PUBLIC RADIO\nLISTENER-SUPPORTED HOUSE'`; plate `'SORREL\nON AIR? KNOCK LATER'`. Vignettes: a
    "thank-you gift" tote bag pile nobody collected; a microphone on a chair facing the woods (rehearsing to the trees);
    a hand-painted "QUIET: RECORDING" board propped against a tree, fallen over.
  - Diggs: a `nissen-hut` (the tin bungalow) inside a `corrugated-fence` yard with a gate gap at the door, a spoil heap
    of dug sand (use a sand/dirt mound prefab if one exists, else `crate`s of "finds"), a `scrap-car` on blocks, a
    hand-painted sign `'NO HOA. NO SURVEYORS.\nNO, NOT EVEN YOU.'`; plate `'DIGGS'`. Vignettes: a half-dug hole with a
    spade standing in it and a deck chair at its edge; jars of buried "treasure" (bottle caps) lined on a plank; a
    hammock between two posts with a newspaper on it.
  - Frank: a `lean-to-shed` against a stretch of fence posts, a `deck-chair` facing the highway, a hand-lettered
    `'FRANK\nNO SOLICITORS\nNO SOLICITING EITHER'` plate, a rack of hitchhiking signs (`signpost` with plates:
    `'SOUTH'`, `'NORTH'`, `'ANYWHERE WITH PIE'`). Vignettes: a coffee cup from the diner on every fence post (a row of
    cups); a stack of road maps weighed down by a stone; a little garden of hubcaps.
  - Residents: Frank as a static `makeGnome` figure leaning on a fence post by the road, facing it (look: brown hat
    `0x6b4a2e`, plaid shirt `0x9c2f2f`, grey beard). Sorrel and Diggs are away at work (their booth and the fort): their
    homes show traces instead (Sorrel: a radio playing on the porch is enough as a prop; Diggs: a fresh hole).
  - Keep each door spot and 1.5 m round it free of colliders; keep everything inside its site rect except plates and
    mailboxes within 2 m of the door.
- New `games/gnome-theft-auto/src/homes/outerHomes.test.ts`: every collider box of `planPieces(outerHomePieces())` lies
  within one of `siteRect('home-05' | 'home-06' | 'home-07')` (2.5 m slack); none contains a door spot or comes within
  1 m of one.

## Contract
`buildOuterHomes(scene): Box[]`, `outerHomePieces(): HomePiece[]`. The lead calls `buildOuterHomes` from app.ts.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/homes/outerHomes.test.ts` passes.

## Out of scope
homes/types.ts, homes/pieces.ts, homes/data.ts, Diggs' interior (another worker), app.ts, prefabs.
