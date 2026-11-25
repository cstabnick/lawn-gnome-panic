Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/trellisLife.ts` gives Trellisdown Vineyard and Brassknock Manor their story: three
vignettes at the vineyard and three at the manor, joke signs, Chicory Snips working his loop with shears, the Countess
on the terrace, frost-pot smoke on cold nights, sounds, and the front-door knocker (E: "Use the knocker": nobody comes).

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `VINEYARD` (`story` spots (-1128, -118), (-1152, -240), (-1190, -96);
  `chicoryLoop`; `rows`, `pressHouse`, `firstVine`, `lodge`, `gate`), `MANOR` (`story` spots (-1185, 62), (-1150, 70),
  (-1112, 58); `countess` (-1138, 19.5) facing north; `door` (-1150, 20.5) = the front door with the knocker;
  `terrace`), `CountryPart`, `COUNTRY_SOUNDS`.
- `games/gnome-theft-auto/src/homes/pieces.ts`: `buildPieces`, `textPlate`.
- `games/gnome-theft-auto/src/campus/story.ts` (static vignettes) and `games/gnome-theft-auto/src/campus/life.ts`
  (walking people, sleep when far, `playAt`); `games/gnome-theft-auto/src/ambientGnomes.ts` (`createAmbientGnomes`,
  `AmbientGnomeDef`, valid `idle` ids in `AMBIENT_GNOMES`).
- `games/gnome-theft-auto/src/jobs/types.ts` `JobsDeps`; `games/gnome-theft-auto/src/atmosphere.ts` `TimeLabel`.

## Change
`src/country/trellisLife.ts` (keep both exported signatures):
- `buildTrellisStory(scene, boxes)`: six static vignettes from prefabs with `buildPieces` (colliders only for things
  taller than 0.5 m; leave walking room), each within 4 m of its story spot. Use existing prefabs: `grape-crate`,
  `grape-dew-bottle`, `frost-pot`, `wheelbarrow`, `watering-can`, `bench`, `ladder` or `stepladder` (grep),
  `manor-urn`, `tasting-table`, `lawn-chair`/`deck-chair`, `parasol` (grep), `crate`, `basket` (grep), `stone-fountain`,
  `teacup`/`teapot` (grep `packages/prefabs/src/catalog` for ids). Readable without text:
  - Vineyard 1 (-1128, -118): a pruning ladder against the end of a row, a basket half full of grapes, and a single
    grape-dew bottle with its brass cap off and a thimble glass beside it (somebody's quiet break).
  - Vineyard 2 (-1152, -240): a frost-pot knocked over and relit, a blanket and an alarm clock on an upturned crate (the
    gardener's cold-night watch post).
  - Vineyard 3 (-1190, -96) by the lodge: a black tanker drum (`gta-dew-barrel` if it exists) under a tarp with three
    empty frost-pot fuel cans in a row (the stolen Black Dew that keeps the frost off; story quest 17 pays it off later).
  - Manor 1 (-1185, 62): a croquet set abandoned mid-game (balls, hoops: use small balls/rings prefabs or `kit`-free
    plain tiny boxes only if no prefab fits), one mallet thrown down.
  - Manor 2 (-1150, 70): a garden tea for one laid for two (a small table, two chairs, two cups, one chair never used).
  - Manor 3 (-1112, 58): a wheelbarrow of pulled-up wildflowers next to a perfectly clipped topiary and an HOA pamphlet
    stand (any sign-board prefab) (the Countess's money and the HOA's taste in one corner).
- Signs (`textPlate`, at least four at each place, house voice, mounted 0.04 off whatever they hang on): vineyard
  ("THIS ROW IS CROOKED ON PURPOSE" at the crooked row's west end, "PICKERS: ONE GRAPE FOR THE BASKET, NONE FOR THE
  MOUTH", "FROST-POTS LIT BY THE GARDENER ONLY", "THE FIRST VINE: DO NOT TOUCH, PRUNE, ADMIRE OR LEAN"); manor ("PRIVATE
  GARDEN · BRASSKNOCK CHARTER 1", "TASTINGS BY INVITATION", "PLEASE DO NOT FEED THE TOPIARY", "DELIVERIES: ROUND THE
  BACK. EVERYONE: ROUND THE BACK").
- `installTrellisLife(deps): CountryPart`:
  - Chicory Snips walks `VINEYARD.chicoryLoop` with pauses (4-8 s; at each pause play `country-vine-snip` at his spot),
    look `{ hat: 0x4e7a32, shirt: 0x7a5a3a, pants: 0x4a3a2a, beard: 0x8a6a4a }`, asleep while the player is > 250 m
    from the vineyard. When the player stands ON a row (within 1 m of a row line, inside `VINEYARD.rows`, not on the
    path) within 25 m of him, a toast at most every 20 s: "Chicory: Off the row. OFF the row."
  - The Countess (an ambient gnome at `MANOR.countess`, look `{ hat: 0x6e1e2a, shirt: 0xe8dcc8, pants: 0x6e1e2a,
    beard: null, dress: true }`, name 'Countess Wisteria Brassknock', bubble "Lovely view. One owns it, you know.") in
    the daytime only.
  - Cold nights: when `deps.timeLabel()` is a night label, a small grey smoke puff sprite or particle above each of 6
    frost-pots near the path (cheap: one `THREE.Points` or a few sprites; hidden by day) and `country-campfire` played
    softly at one of them every 10-15 s while the player is within 80 m.
  - `prompt(x, z)` / `interact(x, z)`: within 1.5 m of `MANOR.door`: "Use the knocker" → `playAt('country-manor-knocker',
    MANOR.door)` and a toast "Nobody comes. A voice from somewhere says: round the back." Return true only when handled.
  - Ambient: every 8-15 s while the player is in the vineyard, play a soft `country-vine-snip` from a random row point
    (somebody pruning out of sight), daytime only.

## Contract
Both signatures unchanged; nothing placed within 1 m of the `chicoryLoop` legs, within 2 m of `MANOR.door` or of the
back door spot (-1150, 41.5).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/flora src/sites.test.ts` passes.

## Out of scope
`src/country/vineyard.ts`, `src/country/manor.ts`, `src/country/manorInterior.ts`, `src/country/types.ts`, every other
file.
