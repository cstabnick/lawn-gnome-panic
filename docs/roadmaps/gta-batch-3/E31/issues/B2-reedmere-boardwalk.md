Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
Reedmere, the Unmown's marsh, has reed beds round its water and a raised wooden boardwalk you can walk on, from the
trail across the water to a viewing platform with a telescope.

## Read first
- `games/gnome-theft-auto/src/unmown/marsh.ts` (your stub: keep `buildReedmere(scene, boxes): void`)
- `games/gnome-theft-auto/src/living/config.ts` (`BOARDWALK` = axis-aligned legs (-1100,-1560) → (-1100,-1625) →
  (-1150,-1625) → (-1150,-1695); `PLATFORM` = { x -1150, z -1699, w 8, d 6 }; `BOARDWALK_WIDTH` 2; `DECK_Y` 0.6)
- `games/gnome-theft-auto/src/coast/boardwalk.ts` lines 280-300 (how the pier registers walkable decks:
  `addRooftop({ id, name, minX, maxX, minZ, maxZ, y, solid: false, parapet: false })` from '../interiors/rooftops', and
  `rooftopById(id)` to avoid duplicates when the world builds twice in tests)
- `games/gnome-theft-auto/src/terrain.ts` `waterAt(x, z)` → `{ surface, depth }` or null
- `packages/prefabs/src/catalog/gta-preserve-kit.ts` (`marsh-boardwalk-deck`: 2 x 3 m section, deck TOP at y 1.0;
  `marsh-boardwalk-rail`: 3 m rail along z, stands on the deck; `viewing-platform`: 8 x 6, top y 1.0, open on -z) and
  `gta-preserve-trail.ts` (`reed-clump`, `bulrush-clump`)

## Facts
- The marsh water `water/reedmere` covers x -1260..-1040, z -1705..-1605 (about 0.7 m deep, shelving). North of it is
  dry land where the trail `trail/reedmere-boardwalk` runs ((-1300,-1460) (-1200,-1520) (-1100,-1560) (-1000,-1520)
  (-900,-1560)). The Reedmere Hide (another worker) is at (-1050, -1550): keep 6 m clear of it.
- Deck height: one level for the whole walk: `deckTop = max(water surface or ground under every leg point) + DECK_Y`
  (sample along each leg every 2 m with `waterAt(...)?.surface ?? heightAt(...)`, take the max), and the first metres
  on land ramp up from the ground: put 3-4 short step boxes (or deck sections lower and lower) at the north end so a
  gnome can walk up (each step at most 0.3 m higher than the one before).

## Change
- `games/gnome-theft-auto/src/unmown/marsh.ts`:
  - Lay `marsh-boardwalk-deck` sections every 3.0 m along each leg (rotated yaw PI/2 on the east-west leg), y set so
    the deck top is `deckTop` (section y = deckTop - 1.0), and the `viewing-platform` at PLATFORM (yaw PI so its open side
    faces the boardwalk coming from the north... check: the platform's open side is -z in the prefab; the boardwalk
    arrives from the north (smaller z), so yaw 0 keeps -z open toward the boardwalk). All in ONE `buildStaticCells`
    batch named 'reedmere-boardwalk'.
  - Rails: `marsh-boardwalk-rail` on both sides of each leg (offset ±(BOARDWALK_WIDTH/2 - 0.05)), lifted to deckTop.
    Leave the rail open where legs meet.
  - Walkable decks: `addRooftop` one rectangle per leg (width BOARDWALK_WIDTH, from leg start to end, ids
    'reedmere-walk-1..3') and one for the platform ('reedmere-platform'), `y: deckTop`, `solid: false`,
    `parapet: false`, guarded with `rooftopById` like the pier. Rail colliders: thin boxes (0.1 m) along each side with
    `h: deckTop + 1.0` so the player does not walk off the side; leave the ends open.
  - Reeds: scatter 120-200 `reed-clump` / `bulrush-clump` placements round the marsh edge (within 8 m inside and 6 m
    outside the water rectangle's edge, deterministic seeded RNG, never within 3 m of the boardwalk/platform or 6 m of
    the hide), on the ground or water bed (`heightAt`; they may stand in shallow water). One `buildStaticCells` batch
    'reedmere-reeds'. No colliders for reeds.
  - A tiny vignette on the platform: a forgotten flask and a sketchbook on the bench (any small existing prefabs, e.g.
    search the catalog for 'flask' / 'notebook' / 'book'), placed at deckTop.
- NEW `games/gnome-theft-auto/src/unmown/marsh.test.ts`: building into a fresh scene does not throw; rooftops
  'reedmere-walk-1..3' and 'reedmere-platform' exist with the same `y`; `rooftopSurfaceBelow(-1100, -1600, 50)` equals
  that y (from '../interiors/rooftops'); no reed placement is within 3 m of a boardwalk leg (test the plan via an exported
  pure helper `planReeds(): {x, z, id}[]` you add).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/unmown/marsh.test.ts src/interiors` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `unmown/*` files, `living/config.ts`, `water.ts`, the level documents, prefabs.
