Epic: 2 Places and rides
Depends on: epic 1 (prefabs in `packages/prefabs/src/catalog/gta-coast*.ts` exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Worker: Sonnet. Other workers edit `src/coast/spokewheel.ts`,
`src/coast/pirateShip.ts`, `src/tubing/*`, `packages/achievements`, `src/mapPois.ts` at the same time. You own only the
files listed under Change.

## Goal
Saltbucket Boardwalk and Long Spoon Pier stand at the south edge: a plank promenade with six named stalls, lamps,
benches, joke signs and stairs down to the beach, and a walkable spoon-shaped pier out to the Bathtub Queen's mooring.

## Read first
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST.boardwalk`, `COAST.pier`, `COAST.ship.gangplank`).
- `games/gnome-theft-auto/src/coast/boardwalk.ts` (the stub you fill; keep the signature) and `src/coast/index.ts`
  (world.ts already calls `buildCoast(scene, boxes)` → `buildBoardwalk(scene, boxes)`).
- `games/gnome-theft-auto/src/coast/sign.ts`: `coastSign(text, { w, h, bg, fg, post })` for every painted sign.
- `games/gnome-theft-auto/src/pardonlin/wickets.ts`: the pattern to copy (merged box geometry per material,
  `place()` with `getPrefab`/`buildPrefab`/`placeOnGround`, `solid()` colliders from a Box3, `boxes.push({ minX, maxX,
  minZ, maxZ, h })` where `h` is the collider's top in world y).
- `games/gnome-theft-auto/src/interiors/rooftops.ts`: `addRooftop({ id, name, minX, maxX, minZ, maxZ, y, solid: false,
  parapet: false })` makes a box-less walkable deck at height y (terrain.ts `groundAt` stands the player on it when the
  player's feet are at most 2 m below it). This is how the pier and its spur are walked on.
- `docs/lore/entries/apocrypha/saltbucket-boardwalk.md`, `long-spoon-pier.md`, `marram-teaspoon.md` (names, tone).
- `docs/rendering.md`: z-fighting rules (boxes that touch must not share a face; flat things use `flatLayer`).

## Change
1. `src/coast/boardwalk.ts` (`buildBoardwalk(scene, boxes)`):
   - **Deck:** planks over `COAST.boardwalk.rect`, top at ground + `deckLift` (the slot is flat, ground ~-4.24; read
     `heightAt` at the rect centre). Build it as boxes 0.3 m thick (top proud of the ground, bottom below it, so nothing
     lies in the ground's plane), plank seams by alternating two wood tones every 1.2 m along x. Merge geometry **in chunks
     of at most 60 m along x** (one mesh per chunk per material) so the cull system (registers objects under 200 m
     radius) can cull them. No collider for the deck (the player walks over it on the ground, it is 0.22 m proud).
   - **Railing** along the south (beach) edge with gaps at x -120, 0 and 120 (4 m wide) where **stairs** (3 visual steps)
     go down to the sand; railing colliders as thin boxes (h = deck top + 1.0), one per run.
   - **Stalls:** for each `COAST.boardwalk.stalls` entry place prefab `boardwalk-stall` (scale 2.4, yaw from the entry,
     front facing +z) with a different `tint` per stall if `buildPrefab` accepts a tint option (check `@lawn/prefabs`
     `BuildOptions`; else leave default) and a `coastSign(name, { w: 3.2, h: 0.7, post: 0 })` fixed above the awning.
     Solid collider per stall. In front of `tin-shy` place prefab `tin-shy`; by `spun-sugar-sal` a `candyfloss-cart`.
   - **Lamps** (`boardwalk-lamp`, scale 2.2) every `lampStep` m along both long edges, inside the deck; **benches**
     (`park-bench`, scale ~2) facing the sea between lamps on the south edge, every second gap.
   - **Signs with jokes** (acceptance criterion: signage that fits the lore), each a `coastSign` on a post facing where
     people arrive: at the entrance (0, 1090) facing north: "SALTBUCKET BOARDWALK\nEst. the day the bucket sank";
     near the stairs: "NO GULLS\n(they cannot read, but we live in hope)"; by the beach: "THE SALTWATER\nIt is real. Stop asking.";
     at the pier spur: "LONG SPOON PIER\nWalk it slow. The bowl end sways."; on Marram's office: "LOST PROPERTY\nHats, mostly".
     Use your judgment for 2-3 more in the same voice (plain, dry, never naming a Tall One object's purpose).
   - **The spur** (`COAST.pier.spur`, from the boardwalk's east end to the pier handle): walkable rooftop at
     `COAST.pier.deckY` (id `long-spoon-spur`), drawn as a 0.4 m thick plank box with its top at deckY; a visual ramp of
     3 steps at x 210..216 from the boardwalk deck up to it.
   - **The pier:** rooftops `long-spoon-handle` (`COAST.pier.handle`) and `long-spoon-bowl` (`COAST.pier.bowl`) at
     `deckY`. Draw the handle as a 0.4 m plank deck (top at deckY) the width of the handle rect, with a raised steel-grey
     spine strip down its middle (the spoon's handle); draw the bowl as a flattened oval (a cylinder scaled to the bowl
     rect, 0.4 thick, top at deckY + 0.01, a different colour: polished silver-grey) — make sure the bowl top and the
     handle top are not coplanar where they overlap (offset one by 0.02). **Pier posts** (`pier-post`, scale ~3) every
     12 m along both sides of the handle and round the bowl, standing on the sea bed (`waterBedAt` or `heightAt`) and
     reaching the deck underside. **Rails** along both handle sides and round the bowl, except a 6 m gap on the bowl's
     south side at `COAST.ship.gangplank` (x 297..303): colliders as thin boxes with h = deckY + 1.1.
   - **Marram's hut** at `COAST.pier.marramHut`: prefab `beach-hut` (scale 2.2) on the bowl's west side, y = deckY
     (position it directly, not with placeOnGround), solid collider; a `coastSign("MARRAM'S\nNo refunds, many opinions", ...)`.
   - Beach dressing along the beach slot (z 1145..1185): a few `beach-umbrella`, `deck-chair`, `beach-hut` (3-4 huts in a
     row at x -300..-180), a `lifeguard-chair` at (60, 1170), `sandcastle` and `bucket-and-spade` pairs; keep 8 m clear of
     x 140..160 (the Last Tube hut and rack, another issue). Everything on the ground with `placeOnGround`.
2. `src/coast/boardwalk.test.ts` (new, pure where possible): `buildBoardwalk(new THREE.Scene(), boxes)` runs without a
   DOM (signs fall back to plain boards), pushes colliders, and `rooftopById('long-spoon-handle')` / `'long-spoon-bowl'`
   / `'long-spoon-spur'` exist at `COAST.pier.deckY`; `rooftopSurfaceBelow(300, 1200, COAST.pier.deckY + 1)` equals
   deckY; every deck rooftop's y is above the ground under it at 5 sample points (`heightAt(x, z) < y - 0.05`).

## Contract
- `buildBoardwalk(scene: THREE.Scene, boxes: Box[]): void` (signature unchanged).
- Rooftop ids `long-spoon-spur`, `long-spoon-handle`, `long-spoon-bowl` at `COAST.pier.deckY` (the ship issue links its
  gangplank and deck to them).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files; `npx vitest run src/coast/boardwalk.test.ts`
  passes; `npx vitest run src/sites.test.ts src/levels.test.ts` still pass.

## Out of scope
`src/coast/config.ts` (ask in your report if a constant must change), `src/coast/index.ts`, `src/coast/sign.ts`, other
coast modules, `world.ts`, `app.ts`, the prefab catalog (report a missing prefab instead).
