Epic: E33 mountain routes, wave 1. Worker: Sonnet.
Depends on: none (prefab ids below may not exist yet while you work: `buildStaticCells` skips unknown ids)

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Another worker is redesigning the route lines at the same time:
your code must work for any line (derive everything from the Track and the ground, never hard-code coordinates).

## Goal
The linear roadside furniture of the mountain routes, placed by rule along any line: steel guard rails (with colliders)
on the two roads where the ground drops away or a bend turns hard, white reflector posts along the roads where there is
no rail, and red-and-white marker poles along the outer (downhill) edge of the Hatband (no rails there: the drop is the
point). It should look placed by a road crew that cared: rails start and end with a flare, no rail across a junction, a
lay-by or a path crossing.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/rails.ts` (the stub you fill in), `routes.ts`, `pads.ts`, `types.ts`
- `games/gnome-theft-auto/src/raceTrack/trackDef.ts` — `TrackSample` (`s, x, z, tx, tz, nx, nz, curv`), `roadTopAt`,
  `frame(s, lat)`, `locate`, `onRoad`
- `games/gnome-theft-auto/src/cull.ts` — `buildStaticCells(placements, { name })`, `StaticPrefabPlacement`
- `games/gnome-theft-auto/src/raceTrack/trackDressing.ts` (how the Speedway's barriers are placed and given colliders)

## Prefabs (made by another worker at the same time, ids fixed)
- `mountain-guard-rail`: one 4.0 m steel W-beam section. Local frame: the section runs along local x from -2.0 to +2.0,
  the beam's face looks toward local +z (the road side), posts behind it; 0.8 m tall, feet at y 0. Place one every 4 m.
- `road-marker-post`: a 1.1 m white reflector post with a black band; faces local +z (toward the road).
- `hatband-pole`: a 1.6 m red-and-white striped marker pole (round, faces anywhere).

## Change
- `src/mountainRoutes/rails.ts`:
  - `export function railRuns(): RailRun[]` (pure; the type is already in the stub: `{ route, side, s0, s1 }`): for every
    route of kind 'road' (`routesOfKind('road')`), for each side (+1 left, -1 right of travel), mark a sample when
    (a) the drop: the ground at lat `side * (width / 2 + 6)` (`heightAt` there) is at least 1.5 m below the road top at
    the edge (`track.roadTopAt(sample, side * width / 2)`), or (b) the outside of a hard bend: `Math.abs(curv) >= 0.04`
    and `side === (curv > 0 ? -1 : 1)`. Then: join marked stretches less than 6 m apart, drop runs shorter than 8 m,
    and cut out every stretch where a rail would block a way through: within 12 m of either end of the route, within 3
    m of a pad (`padDistance(p, x, z) < 3` at the rail position for any pad in `ALL_PADS`), or within 6 m of any other
    route's centre line (`locate(x, z, 6)` on every other route in `ALL_ROUTES`: the Hatband gates and the Brim Walk
    crossing). Rail position for (s, side): `track.frame(s, side * (width / 2 + 0.9))`.
    The terrain grid must be built before reading heights: call `heightAt(0, 0)` first.
  - `export function buildGuardRails(scene: THREE.Scene, boxes: Box[]): void`:
    - rails: for each run, sections every 4 m from s0 to s1; each section's centre at `frame(s + 2, side * (width / 2 +
      0.9))`, y = `heightAt` there, yaw so local +z points at the road: `Math.atan2(-side * nx, -side * nz)` with the
      sample's (nx, nz) at s + 2. The first and last section of a run are pulled 0.4 m further from the road (the flare).
      Colliders: per section three boxes at s + 0.67, s + 2, s + 3.33 on the rail line, each a 0.9 x 0.9 m square
      (`minX = x - 0.45` ...), `h` = ground + 0.85. Push them into `boxes`.
    - reflector posts: along each 'road', both sides, every 25 m (from s 20 to length - 20) where there is no rail run on
      that side within 4 m and no pad within 3 m and no other route within 6 m, at lat `side * (width / 2 + 0.7)`, yaw
      facing the road. No colliders.
    - Hatband poles: along every route of kind 'track', every 12 m, on the downhill side (the side whose ground at lat
      `side * (width / 2 + 4)` is lower), at lat `side * (width / 2 + 0.5)`; skip within 10 m of the route's ends or of
      a pad, or within 6 m of another route. One small collider each (0.3 x 0.3 m, h = ground + 1.6).
    - All placements in one `buildStaticCells(placements, { name: 'e33-roadside' })`, added to `scene`.
  - `export function railStats(): { route: string; metres: number; runs: number }[]` (pure, for tests and the report).
- New test `src/mountainRoutes/rails.test.ts`: rails exist on both roads; on every rail run's samples at least half meet
  rule (a) or (b); no rail position is within 5 m of another route's centre line, within 2 m of a pad, or on the road
  itself (`track.onRoad` false at every rail position); `buildGuardRails(new THREE.Scene(), boxes)` (with
  `installFakeDom()` from `../testing/fakeDom` and `vi.mock('../audio', () => ({ play: () => undefined }))`) adds
  colliders, none of which overlaps the road: for 300 random points on each road (lat within ±(width/2 − 0.2)) no box
  contains the point.

## Contract
Keep `RailRun`, `railRuns(): RailRun[]`, `buildGuardRails(scene, boxes): void` as in the stub; add `railStats()`.
index.ts calls `buildGuardRails(scene, world.boxes)` once.

## Done when
- `npx vitest run src/mountainRoutes/rails.test.ts` passes.
- `npx tsc --noEmit -p .` clean in your files.
- Report: rail metres per road, runs count, how many posts and poles.

## Out of scope
Every other file under `src/mountainRoutes/`, the prefab catalog (another worker), `raceTrack/*`, `cull.ts`.
