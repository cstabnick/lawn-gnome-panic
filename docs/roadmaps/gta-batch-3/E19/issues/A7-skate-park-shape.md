Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own
`games/gnome-theft-auto/src/skate/park.ts` (a stub: keep every exported name and signature) and the new
`skate/park.test.ts`. Others edit other skate/ files at the same time and compile against the stub's signatures.

## Goal
The Gutter Bowls' ridable shape is one pure height function built from `SKATE_PIECES`; the skateboard rides it
(terrain plus park anywhere in the world), its rails exist in world coordinates, and stepped colliders keep walkers and
vehicles on (and against) the pieces.

## Read first
- `games/gnome-theft-auto/src/skate/types.ts`: `SKATE_ORIGIN`, `SKATE_SITE`, `SkatePiece` (the profile rules in its
  doc comment are the contract), `SKATE_PIECES`, `SkateRailDef`, `SKATE_RAILS`, `SkateRail`, `SkateGround`.
- `games/gnome-theft-auto/src/skate/park.ts`: the stub you fill.
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt(x, z)`, `surfaceAt(x, z)` (a `SurfaceKind` from `surfaces.ts`:
  'asphalt' | 'ice' | 'snow' | 'sand' | 'mud' | 'grass' | 'farm' | 'rock' | 'dirt' | 'gravel' | 'water').
- `games/gnome-theft-auto/src/collide.ts` lines 1-40 and 200-228 (`Box` = `{ minX, maxX, minZ, maxZ, h }`;
  `groundHeight`: a walker steps onto a box top at most 0.35 above its feet; taller box sides are walls).

## Change
`src/skate/park.ts`:
- `pieceHeight(p, u, v)`: the profiles exactly as documented on `SkatePiece` (halfpipe: trough along u0..u1, flat,
  circular transition capped at `height`, then `deck`; bowl: the same by radial distance; wedge: linear rise along its
  yaw from its low end, `width` across; box: flat top; stairs: step i at top - i*rise). null outside the piece.
- `parkHeight(x, z)`: convert to park frame (u = x - SKATE_ORIGIN.x, v = z - SKATE_ORIGIN.z), max over pieces, 0 when
  none. Fast: reject pieces by a precomputed bounding rect first (it runs every frame in the board's sub-steps).
- `parkRails()`: `SKATE_RAILS` converted to world: x = SKATE_ORIGIN.x + u, z = SKATE_ORIGIN.z + v,
  y = heightAt(x, z) + y. Compute once and cache.
- `skateGround()`: `height(x, z) = heightAt(x, z) + parkHeight(x, z)`; `paved(x, z)` = inside `SKATE_SITE`, or
  `surfaceAt(x, z)` is 'asphalt' | 'gravel' | 'rock' | 'ice' (grass, dirt, sand, mud, farm, snow and water are rough);
  `rails: parkRails()`. One shared object (cache it).
- `parkBoxes()`: colliders for walkers and vehicles. Box pieces (`kind: 'box'`) are one exact box each (h = height).
  Every other piece is covered by a 0.5 m grid of cells over its bounding rect: each cell's h = the MINIMUM of
  `pieceHeight` over the cell's 4 corners and centre (so a box top never rises above the ridable surface: a board riding
  the surface is never inside a collider), rounded DOWN to a multiple of 0.1 m; skip cells under 0.1 m or where any
  sample is null (the edge of the piece); merge runs of equal h along x in a row into one box. Then all boxes'
  heights are absolute? No: `Box.h` is a height in world y, so add `heightAt` at the cell centre (the site is flat).
  Keep the total under 3000 boxes; cache the result.

`src/skate/park.test.ts`:
- Profiles at known points (park frame, via `pieceHeight` of the right piece): Long Gutter centre (u 0, v 12) = 0;
  at |dv| = 1.5 + 2.449 the coping height 2.0 (+-0.01); on the deck (|dv| = 4.7) 2.0; outside (|dv| = 6) null.
  Bowl centre 0, at radius 4.95 about 2.0, at 6.0 2.0, at 7 null. Bowl bank half way up = 1.0. Kicker: low end 0,
  0.1 m before the lip ~0.57, past the lip null. Ledge 0.45. Stairs: 0.6, 0.3, 0 down the three runs.
- `parkHeight` at the world points of the above equals those heights, and 0 far outside.
- `parkRails()` has `SKATE_RAILS.length` rails; the flat rail's ends are at x -23 and -19, z 90, y heightAt + 0.47.
- `parkBoxes()`: count under 3000; for 2000 random points in the site, every box covering the point has
  `h <= heightAt + parkHeight + 1e-6`; the ledge box exists with h = heightAt + 0.45.
- `skateGround().paved` is true in the site and false at a grass point you find on the map near it (pick one where
  `surfaceAt` says 'grass').

## Contract
The stub's exports and signatures, unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skate/park.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`skate/types.ts` (if a number there looks wrong, say so in your report; do not edit), other skate/ files.
