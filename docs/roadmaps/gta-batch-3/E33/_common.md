# E33 common rules (every issue)

## Environment

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a447c2235ebc38793` (a git
  worktree on branch `epic/E33-mountains`). Run every command from there or from `games/gnome-theft-auto` inside it.
  Use absolute paths.
- Shell: Git Bash. If `node`/`npm`/`npx` is not found: `export PATH="/c/Program Files/nodejs:$PATH"` (on its own line).
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash`, `git checkout` or `git reset`.
- Line endings: keep whatever a file already has (most files are LF; a few, e.g. `types.ts`, `net.ts`, prefab
  `catalog/index.ts`, are CRLF). New files are LF. Never rewrite a whole file just to change line endings. Prefer the
  Edit/Write tools over shell heredocs and `sed -i` / python rewrites.
- Other workers are editing OTHER files of the same game at the same time. Edit only the files your issue names. If
  `npx tsc` reports an error in a file you do not own, ignore it (another worker is mid-edit) unless your change caused it.
- Do not start a dev server or a browser. Do not run `vite build`.
- `src/layout.golden.test.ts` is expected to fail while this epic runs (the lead regenerates it). Never regenerate it.

## The game

`games/gnome-theft-auto` (three.js + TypeScript). World coordinates: metres, +x east, +z south (north is -z).
`yaw` is three.js `rotation.y`: 0 faces +z (south), `Math.PI` faces north, `Math.PI / 2` faces +x (east); a direction
(dx, dz) has yaw `Math.atan2(dx, dz)`. The world builds once at start, and also in tests under node (no DOM: never
touch `document` at import time; guard with `typeof document !== 'undefined'`). The terrain height grid is 2 m.

## The mountain routes (src/mountainRoutes/, built by the lead; read, do not change unless your issue owns the file)

- `types.ts`: `RouteKind = 'road' | 'track' | 'trail'`; `RouteDef extends TrackDef { kind; relief: 'ribbon'; blurb }`;
  `RouteSpot { x, z, yaw }`; `PadDef { id, route, x, z, yaw, hw, hd, fade?, lift?, surface? }` (a level rectangle beside
  a route, turned by yaw: hw across, hd along the yaw direction).
- `routes.ts`: `ROUTE_IDS = ['brim-walk', 'hatband', 'spine-cut', 'brim-gap-road']`, `RouteId`, `ROUTE_DEFS`,
  `ROUTES: Record<RouteId, Track>`, `ALL_ROUTES`, `routeKind(id)`, `routesOfKind(kind)`, `routeById(id)`.
- `defs/brimGapRoad.ts` (`BRIM_GAP_ROAD`, `BRIM_GAP_SPOTS`), `defs/hatband.ts` (`HATBAND`, `HATBAND_SPOTS`),
  `defs/brimWalk.ts` (`BRIM_WALK`, `BRIM_WALK_SPOTS`), `defs/hatbrimPads.ts` (`HATBRIM_PADS`), `defs/spineCut.ts`
  (`SPINE_CUT`, `SPINE_CUT_SPOTS`, `SPINE_PADS`). The SPOTS records map a name to a `RouteSpot`.
- `pads.ts`: `ALL_PADS`, `padAt(x, z)`, `padSurfaceAt`, `padDistance(p, x, z)`, `padLocal(p, x, z) -> { u, v }`,
  `padHeight(id)` (absolute level once the terrain is built), `applyPadRelief` (terrain.ts calls it).
- `deps.ts`: `MountainDeps { toast(text, ms?), unlock(id), increment(id, by?), vehicleKind(): VehicleKind | null }`,
  `Area { update(dt, px, pz, night): void; blips(): Blip[] }`, `EMPTY_AREA`.
- `index.ts` `createMountainRoutes(scene, world, deps)` (app.ts calls it once): `buildRouteSurfaces(scene)`,
  `buildGuardRails(scene, world.boxes)`, then the areas `createBrimGapDressing`, `createHatbrimDressing`,
  `createSpineCutDressing`, `createMountainLife`, `createRouteProgress` (each `(scene, world, deps): Area`).
- `driveAlong.ts` (tests only): `driveAlong(track, kind, { speed?, reverse?, maxSeconds?, lookahead?, lane?, grip? })`
  -> `{ reached, seconds, maxLat, maxStall, maxSink, flipped, endS }`: a vehicle on the casual sim chassis follows the
  route from end to end. A test that imports it must first do
  `vi.mock('../audio', () => ({ play: () => undefined }));` and
  `(globalThis as { location?: { search: string } }).location ??= { search: '' };` and then
  `const { driveAlong } = await import('./driveAlong');` (use the right relative paths).
- Terrain wiring: `raceTrack/tracks.ts` `GROUND_TRACKS = [...ALL_TRACKS, ...ALL_ROUTES]` shapes the ground in that order
  (so a road's grade wins where it crosses a trail), then the pads are levelled. `trackSurfaceAt` (surfaces.ts) reads
  them, and `nearTrack(x, z, margin)` keeps procedural scenery and settlements off them.

A `Track` (from `createTrack(def)`, `src/raceTrack/trackDef.ts`) gives: `samples()` (about 1 m apart:
`{ s, x, z, tx, tz, nx, nz, yaw, lift, bank, curv }`, (nx, nz) = left normal, `curv` > 0 turns left), `length()`,
`startS()`, `finishS()`, `sampleAt(s)`, `frame(s, lat)` -> `{ x, z, yaw }` (lat > 0 = left of travel),
`roadTopAt(sample, lat)` (absolute road height once the terrain grid is built: call `heightAt(0, 0)` first to build it),
`locate(x, z, reach?)` -> `{ i, s, lat, dist } | null`, `onRoad(x, z)`, `bounds()`, `def` (the RouteDef).

## Places and numbers you may need

- The Hatbrim (landscape.json features `mountain/the-bobble` (690, -1690) r 210 h 125, `mountain/old-pate` (760, -1500)
  r 150 h 80, `ridge/hatbrim` (775,-1450)->(730,-1590)->(690,-1700)->(650,-1800) r 95 h 48). Heights now: the Bobble's
  top about 104 m near (700, -1700); Old Pate's top about 72 m near (750, -1500); Brim Gap about 36-41 m near
  (705, -1585). Snow paint above 32 m, rock paint on slopes steeper than the rock slope.
- The north band road `north-band-east` (width 10) centre line: (10,-960) (40,-1060) (60,-1320) (400,-1330)
  (700,-1295) (1060,-1300) (1060,-1100). The east band road `east-band-north`: (940,24) (950,-400) (950,-850) (1060,-1100).
- Mittenholt (hamlet, E31): centre (550, -1375), radius 75. The High Tarn: water x 910..1040, z -1650..-1570; site
  x 880..1120, z -1680..-1520; bothy (1075, -1605); board (1068, -1570); cairn (1000, -1668); `trail/high-tarn-path`
  (1060,-1300) (1075,-1430) (1072,-1560). Perimeter fence at 1795: keep everything inside |z| <= 1775.
- The Highland Spine (`ridge/highland-spine`): (420,-1080) (560,-1180) (640,-1260), r 70, crest about 29 m. Capwood site
  x 100..400, z -1280..-1080; Pinwheel Ridge site x 700..1000, z -1245..-1155 with trails along z -1252.

## Useful helpers (confirmed)

- `import { buildPrefab, getPrefab } from '@lawn/prefabs'` — `getPrefab(id)` is undefined for a missing id;
  `buildPrefab(id, { lights: false, scale?, tint?, trim? })` returns a `THREE.Group` (front faces +z, feet at y 0).
- `import { buildStaticCells } from '../cull'` — `buildStaticCells(placements, { name: 'my-batch' })` merges many static
  prefabs into culled per-cell batches and returns a `THREE.Group` to `scene.add`. A placement is
  `{ id, x, y, z, yaw?, scale?, tint?, trim? }` (y absolute). It THROWS on an unknown prefab id: filter placements
  with `getPrefab(id)` first. Use it for scenery.
- `import { heightAt, groundAt, waterAt } from '../terrain'`; `import { placeOnGround } from '../terrainMesh'`.
- Colliders: `Box` from `../types` is `{ minX, maxX, minZ, maxZ, h }` (axis-aligned, `h` = absolute top height). Push
  one per solid thing into `world.boxes`. Small things you can walk through get no collider.
- Signs as data: `PlanSign` from `../pardonlin/plan` (`{ kind: 'menu' | 'poster' | 'street' | 'plaque' | 'banner', text,
  x, z, yaw, y?, w?, h? }`) drawn by `buildSignText(signs)` from `../pardonlin/town` (returns a Group to add). Single
  plates: `textPlate(text, x, y, z, yaw, { w, h, bg, fg })` from `../homes/pieces`.
- People: `createAmbientGnomes(scene, defs)` from `../ambientGnomes` returns `{ update(dt, px, pz) }`; a def is
  `{ id, name, x, z, yaw, look: Partial<GnomeLook>, bubble, idle? }` (look: hat, shirt, pants, skin, boots, beard as
  0xRRGGBB, beard may be null, glasses boolean). Idle ids: 'look-around', 'stretch', 'yawn', 'scratch-head', 'tap-foot',
  'hands-on-hips', 'cross-arms', 'sit-ground', 'sleep', 'lean-back', 'think', 'fish', 'dig', 'sweep', 'saw', 'rake',
  'water', 'read'.
- Interact spots: `addInteractSpot({ x, z, y?, prompt, run(player, { hud, economy, fx, play }) => boolean })` from
  `../interactables` (shown within 3.6 m on foot; returns a remover).
- A complete example of route dressing as data + build: `src/capwood/runPlan.ts` (pure plan) and `src/capwood/run.ts`
  (meshes, colliders, residents, sound via `playAt` from `../sound`).

## Repo rules that apply

- No z-fighting: anything flat on the ground or on another surface (a mat, a decal, a road strip) is lifted at least
  0.02 m AND uses a draw layer: `import { LAYER, flatLayer } from '@lawn/depth'`; `flatLayer(material, LAYER.marking)`.
  Two boxes that touch must not share a face (leave a 0.02 gap or overlap them).
- New objects come from `@lawn/prefabs`. Never hand-build a one-off mesh for an item, prop or furniture in the game.
  Plain geometry is fine only for ground features (a road strip, a path).
- Lore: names and jokes fit Gnome Theft Auto's satirical gnome world (gnomes, lawns, mowers, the HOA and its hats, the
  Tall One who owns the yard and never appears). Snowcap Rise is "the high country": drystone walls, cairns, wind-bent
  pines, slate bothies, "Wear two hats." The Hatbrim's names are hat names: the Bobble, Old Pate (a bald dome), Brim Gap,
  the Hatband, the Top Hat café. Keep it warm and dry-funny, never mean.
- Performance: phones must stay smooth. Prefer `buildStaticCells`; no per-frame work in builders; no lights.

## Checks

- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` — no errors in your files.
- Your issue's own vitest command (a test file you own, run alone with `npx vitest run <file>`).
