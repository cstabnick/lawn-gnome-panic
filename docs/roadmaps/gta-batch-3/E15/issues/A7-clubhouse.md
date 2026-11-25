Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): buildings, an E05 interior with storytelling, homes

## Environment
Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/clubhouse.ts` stands Hedgeworth's buildings in the yard (the clubhouse with its terrace,
Basil's cottage, Thrift's shed, the cart shelter), defines the walk-in clubhouse interior (pro shop, bar, lounge with
the honours board and the trophy cabinet, the stairs to Peony's rooms), and registers the three regulars' homes.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `CLUBHOUSE`, `PRO_COTTAGE`, `SHED`, `CART_SHELTER`, `CART_SPOTS`,
  `TERRACE`, `CLUBHOUSE_INTERIOR`, `CLUBHOUSE_ROOM`, `HEDGEWORTH_CAST`, `HOLES`, `GolfStore`.
- `games/gnome-theft-auto/src/golf/clubhouse.ts`: the stub (keep `ClubhouseDeps` and the three exports).
- `docs/roadmaps/gta-batch-3/E05/contracts.md` (the `defineInterior` API and kit: `room`, `door`, `put`, `block`,
  `window`, `sign`, `npc`, `spot`, `stairsTo`; `leaveInterior`; the `gta:interior-say` event).
- `games/gnome-theft-auto/src/interiors/showcase/bodega.ts`: a finished shop interior (a counter, shelves, a shopkeeper,
  spots).
- `games/gnome-theft-auto/src/homes/pieces.ts` (`buildPieces`, `HomePiece` with `size`, `textPlate`, `litWindow`) and
  `src/homes/data.ts` (`homeOf`, `registerHome`; rows for `peony`, `basil`, `thrift` are `onSite(...)` on `golf-yard`)
  and how `src/winter/hill.ts` lines 228-236 registers Gentian's home with a door `[x, z, yaw]`.
- Prefabs (new, being made by other workers right now; guard with `getPrefab` and skip what is missing):
  `hedgeworth-clubhouse` (door front centre; size it so its longest side is `CLUBHOUSE.w`), `pro-cottage` (size
  `PRO_COTTAGE.w`), `groundskeeper-shed` (size `SHED.w`), `cart-shelter` (size `CART_SHELTER.w`), `trophy-cabinet`,
  `honours-board`, `club-rack`, `golf-bag`, `tee-time-board`, `scorecard-box`, `ball-washer`. Existing: `bar-counter`,
  `bar-stool` (`bowling.ts`), `trophy-cup` (`gnomeokemon-lab.ts`), tables/chairs/parasols/benches (search the catalog:
  `grep -rn "id: '" packages/prefabs/src/catalog | grep -i "parasol\|patio\|table\|armchair\|rug\|fireplace\|lamp"`).

## Change
`src/golf/clubhouse.ts`:
- `buildHedgeworthBuildings(scene)`: through `buildPieces(scene, pieces, 'hedgeworth-buildings')` (colliders from the
  prefab bounds): the clubhouse at `CLUBHOUSE` (yaw 0, door south), Basil's cottage at `PRO_COTTAGE`, Thrift's shed at
  `SHED` (yaw -PI/2, door west), the cart shelter at `CART_SHELTER`. The terrace in front of the clubhouse: a flat paved
  area over `TERRACE` (`flatLayer(mat, LAYER.area)`), two or three round tables with parasols and chairs, a low wall
  or planters on its south edge with a gap opposite the door, a `tee-time-board` by the door, a `scorecard-box` and a
  `ball-washer` on the way to the first tee (between the terrace and `HOLES[0].tee`, not in play). Text plates
  (`textPlate`, 0.03 m in front of the face): `HEDGEWORTH LINKS · EST. BEFORE THE HEDGES` over the clubhouse door,
  `PRO SHOP · LESSONS · EXCUSES` on the cottage sign board, `GROUNDS. KNOCK. DO NOT WATER THE GROUNDSKEEPER` on the shed,
  `CARTS · CHARGE OVERNIGHT · DO NOT RACE` on the shelter. Lit windows (`litWindow`) on the clubhouse's upstairs
  (Peony's rooms) and the cottage. Return the colliders.
- `defineClubhouseInterior(deps)`: `defineInterior({ id: CLUBHOUSE_INTERIOR, name: 'Hedgeworth Clubhouse', door:
  { x: CLUBHOUSE.door.x, z: CLUBHOUSE.door.z + 1, yaw: Math.PI }, exit: { ...CLUBHOUSE.doorOut, yaw: 0 }, size: CLUBHOUSE_ROOM,
  theme: 'club', ambience: 'silent' or the garden bed if the ambience list has one, prompt: 'Enter the clubhouse', build(kit) {...} })`.
  Define it once (guard against a second call). The room, ~22 x 14:
  - the way out on the south wall; a **pro shop** corner (west): `club-rack`, `golf-bag`s, a small counter with
    Basil's rival price list (sign `CLUBS · BALLS · LUCK (NOT SOLD)`), `kit.npc` an assistant? No: Basil is out on
    the first tee; leave a `kit.sign` on the counter `BACK IN FIVE STROKES`.
  - a **bar** (east): `bar-counter`, three `bar-stool`s, a bottle shelf (blocks or prefabs), a barman `kit.npc` named
    'Old Ferrule' with line "The usual, member? There's only the usual."
  - a **lounge** (middle/north): two armchairs, a rug, a fireplace or a stove if a prefab exists, the `honours-board`
    on the north wall with a `kit.sign` over it `CLUB CHAMPIONS` and names on it ("P. GRAVELRAKE ×9 · B. DIVOT ×1 ·
    A MOLE (DISPUTED)"), the `trophy-cabinet` beside it.
  - stairs (north-east) to Peony's rooms: a `kit.spot` 'Private: Dame Peony's rooms' whose run says (via the
    `gta:interior-say` event) "Peony (upstairs): 'Members only past the third stair, my dear. You are on the second.'"
  - `kit.spot` at the tee-time board inside: prompt 'Book a tee time (start a round)': run = `leaveInterior()` then after
    ~700 ms `const why = deps.startRound(0); if (why) deps.toast(why)`.
  - `kit.spot` at the honours board: prompt 'Read the honours board' -> say a line listing the player's best round from
    `deps.store().data().bestRound` ("Your best: 18 (+2). Not on the board. Yet.") or "Your name is not on the board.".
  - Storytelling vignettes inside (props only, no text needed): a half-finished letter on a desk with a fountain pen
    and a red-stamped envelope (Vesper's mortgage reminder; use a `kit.sign` on the envelope `THORNE & CO. · FINAL
    REMINDER` 0.02 above it), a mole-shaped dent in the club-rack's carpet with a single dropped tee, a golf umbrella
    drying open by the door.
  - `kit.window`s on the south wall either side of the door.
- `registerHedgeworthHomes()`: for each of `peony` (door = the clubhouse door, she lives upstairs), `basil`
  (`PRO_COTTAGE.door`, yaw 0), `thrift` (`SHED.door`, yaw -PI/2): `const home = homeOf(key); if (home) registerHome({
  ...home, door: [x, z, yaw] })`, as winter/hill.ts does. Idempotent.
- New `src/golf/clubhouse.test.ts` (fake DOM): buildings return colliders that are all inside the yard and none in play
  (`inPlay` at each box centre false); after `defineClubhouseInterior` the interior is listed (`interiorById`) with the
  given door; `registerHedgeworthHomes()` gives `homeOf('basil')` a door.

## Contract
The three exports as declared in the stub; interior id `CLUBHOUSE_INTERIOR`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/clubhouse.test.ts src/golf/places.test.ts src/interiors src/homes` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file. People outdoors, signs on the course and vignettes outside belong to life.ts; the fence and
hedges to yard.ts.
