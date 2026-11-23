Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
The "special paint sprays": ten decals drawn in code on a canvas, and `buildDecals`, which lays them on thin planes over a vehicle's flanks, hood and tail.

## Read first
- `packages/glaze/src/types.ts`: `DecalId`, `DecalPanel`, `VehicleMounts.panels`, `Loadout` (`decal`, `decalColor`, `decalNumber`, `paint`).
- `packages/glaze/src/catalog.ts` lines 18-30: the ten sprays with their names and what each should look like. `packages/glaze/src/ids.ts`: `DECAL_IDS`.
- `packages/glaze/src/decals.ts`: the stub (`Ctx2D`, `DecalPanelKind`, `drawDecal`, `buildDecals`: keep the exported signatures).

## Change
- `packages/glaze/src/decals.ts`:
  - `drawDecal(ctx, id, w, h, color, accent, n, panel)`: draw into a `w` x `h` canvas that is transparent by default (do not fill the background). `color` is a CSS string for the spray, `accent` a CSS string for secondary marks (outlines, centres; `buildDecals` passes a lighter/darker shade of the spray colour), `n` the lucky number 0..99, `panel` one of `'side' | 'top' | 'rear'` (a flank is wide, the hood nearly square, the tail a short wide strip). Only use the `Ctx2D` members. Every spray fills most of the panel and scales with `w` and `h` (no fixed pixel sizes). One short function per spray: `flames` (three or four tapering flame tongues licking from the front-bottom edge toward the back; on `top` lick toward the canvas top; on `rear` a row of small flames along the bottom), `stripes` (two parallel bars along the long axis of the panel; on `top` two bars along the canvas height), `checker` (a band of black-and-white-ish squares in `color` and `accent` along the middle third, 8 rows of squares wide; band horizontal on `side`/`rear`, vertical on `top`), `stars` (a deterministic scatter of 5-point stars, sizes varying, positions from a small integer hash of the index; 9 on a flank), `camo` (8 to 10 overlapping irregular blobs drawn with `bezierCurveTo` or `arc` in `color` and `accent` at `globalAlpha` 0.85), `lightning` (one big jagged bolt, 7 points, filled `color` with `accent` stroke; on `top` rotated upright), `number` (`ctx.font = 'bold ' + Math.round(h * 0.7) + 'px sans-serif'`, centred, `fillText(String(n), w/2, h/2)` with a thick `accent` stroke first; on `rear` and `top` draw it at 60% size), `hats` (a grid of small pointed hats: a triangle plus a brim line, 3 rows; alternate rows offset), `daisies` (a chain of daisies across the panel: 6 petals as small circles round a `accent` centre circle), `drip` (a band along the top edge of the panel with 5 to 7 rounded drips of different lengths hanging down; on `top` along one edge).
  - `buildDecals(mounts, loadout)`: return `null` when `loadout.decal === 'none'` or `mounts.panels` is empty. Otherwise a `THREE.Group` (name `'glaze-decals'`) with one `THREE.Mesh` per panel: `PlaneGeometry(panel.size[0], panel.size[1])`, positioned at `panel.at`, rotated by `panel.rot` DEGREES (`mesh.rotation.set(rx*DEG, ry*DEG, rz*DEG)`, the default XYZ order), material `MeshStandardMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.6, side: THREE.FrontSide })`, `renderOrder = 2`, `castShadow = false`. The panel's `kind` is `'side'` for `left`/`right`, `'top'` for `hood`, `'rear'` for `rear`. Textures: a `CanvasTexture` of 512 x 256 for `side`, 256 x 256 for `top`, 512 x 128 for `rear` (size by `kind`), `colorSpace = THREE.SRGBColorSpace`, drawn by `drawDecal(ctx, loadout.decal, w, h, css(loadout.decalColor), css(accentOf(loadout.decalColor)), loadout.decalNumber, kind)`. `css(0xRRGGBB)` -> `'#rrggbb'`; `accentOf` returns white-ish (`0xf4f4f4`) for dark colours (luminance below 0.5) and near-black (`0x1c1c22`) for light ones. Cache textures in a `Map` keyed by `${decal}:${color}:${number}:${kind}` (the number only matters for `'number'`; use `0` otherwise) so rebuilding is cheap; never dispose them. When `typeof document === 'undefined'` (tests), skip the texture and use a plain `MeshBasicMaterial({ color: loadout.decalColor, transparent: true, opacity: 0.6, depthWrite: false })`.
- `packages/glaze/src/decals.test.ts` (new): a recording fake `Ctx2D` (a Proxy or object whose methods push their name to an array and whose properties accept sets): for every `DecalId` and every panel kind `drawDecal` runs without throwing and makes at least 8 drawing calls (`fill`, `stroke`, `fillRect` or `fillText` among them), and calling it twice records the identical call list (deterministic). `buildDecals` returns `null` for `'none'`, returns a group with one mesh per panel for `'flames'` using `deriveMounts`-like fake mounts (hand-write a `VehicleMounts` with 4 panels from `packages/glaze/src/types.ts`), each mesh's position equals its panel's `at`, and its normal (`new THREE.Vector3(0,0,1).applyEuler(mesh.rotation)`) for the `left` panel (`rot [0, 90, 0]`) is about `(1, 0, 0)`.

## Contract
`drawDecal(ctx: Ctx2D, id: DecalId, w: number, h: number, color: string, accent: string, n: number, panel: DecalPanelKind): void`; `buildDecals(mounts: VehicleMounts, loadout: Loadout): THREE.Group | null`; types `Ctx2D`, `DecalPanelKind` unchanged.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `decals.ts` / `decals.test.ts`.
- `npx vitest run packages/glaze/src/decals.test.ts` passes.

## Out of scope
Every other file.
