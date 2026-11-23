Epic: 1 Modules
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Game: games/gnome-theft-auto (TypeScript, vitest).
In Git Bash, if node is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit OTHER files of this game at the same time. Do not commit, push, stash or switch branches. Do not run
`vite build` or a dev server. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours:
ignore those, fix only errors in your files.

## Goal
Fill `games/gnome-theft-auto/src/lockup/safeSpot.ts`: a pure finder of dry, flat, clear ground near a point, where the
delivery helicopter can set a vehicle down. Plus a unit test. No three.js, no DOM, no imports of terrain or world.

## Read first
- games/gnome-theft-auto/src/lockup/types.ts: `SpotProbe`, `SpotOpts`, `DropSpot`.
- games/gnome-theft-auto/src/lockup/safeSpot.ts: the stub (keep both exported names and signatures).
- games/gnome-theft-auto/src/types.ts line 54: `interface Box { minX; maxX; minZ; maxZ; h }`.

## Change
- games/gnome-theft-auto/src/lockup/safeSpot.ts:
  - `findSafeSpot(cx, cz, probe, opts): DropSpot | null`. Search rings outward from the centre: ring distances
    d = opts.minDist, then +2.5 m each ring, up to and including opts.maxDist. On each ring try
    n = max(8, round(2 * PI * d / 3)) evenly spaced angles, starting angle = ring index * 0.37 (so rings are staggered).
    Candidate (x, z) = (cx + sin(a) * d, cz + cos(a) * d). A candidate is good when ALL hold:
    - `!probe.blocked(x, z, opts.radius)`;
    - at the centre and at the 4 points (x +/- r, z) and (x, z +/- r) with r = opts.radius: `probe.water(px, pz) <= opts.maxWater`
      and `probe.slope(px, pz) <= opts.maxSlope`;
    - the spread of `probe.ground` over those 5 points (max - min) is <= 0.6.
    Return the FIRST good candidate (nearest ring first) as `{ x, y: probe.ground(x, z), z, yaw }` with
    yaw = `Math.atan2(cx - x, cz - z)` (the load faces the centre point). Null when no ring has a good candidate.
  - `boxesBlocked(boxes, half)`: returns `(x, z, r) => boolean`: true when `|x| > half - r` or `|z| > half - r`, or the
    circle overlaps any box grown by r (`x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r`).
- games/gnome-theft-auto/src/lockup/safeSpot.test.ts (new): build fake probes. Tests: flat dry open ground returns a
  spot at distance minDist from the centre with y = ground; a lake (water > 0 within 20 m of the centre) pushes the result
  to beyond 20 m; a box covering the first ring makes it pick a farther or different-angle spot that is not inside the
  box; all water -> null; steep slope everywhere -> null; yaw points at the centre (sin(yaw), cos(yaw) is the unit vector
  from the spot to the centre, toBeCloseTo); boxesBlocked: inside a box true, far away false, beyond half - r true.

## Contract
`findSafeSpot(cx: number, cz: number, probe: SpotProbe, opts: SpotOpts): DropSpot | null` and
`boxesBlocked(boxes: readonly Box[], half: number): (x: number, z: number, r: number) => boolean`, unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/safeSpot.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your two files.

## Out of scope
Every other file (lockup/types.ts is read-only).
