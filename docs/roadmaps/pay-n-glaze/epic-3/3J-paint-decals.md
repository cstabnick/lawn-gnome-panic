Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first. You own only `packages/glaze/src/paint.ts`, `paint.test.ts`, `decals.ts`, `decals.test.ts` (and ONLY the `Loadout` literals in those two test files: make them compile with the new `Loadout` fields, e.g. by building from `defaultLoadout(...)`). Other workers edit other glaze files at the same time.

## Goal
Four new paint finishes (`glitter`, `holo`, `patina`, `chrome`) and six new sprays (`moth`, `koi`, `hazard`, `polka`, `sunburst`, `pinstripe`). `tsc` for `paint.ts` currently fails because the finish switch is not exhaustive.

## Read first
`packages/glaze/src/paint.ts` (the chameleon recipe is the pattern for shader tweaks: `onBeforeCompile` after `#include <normal_fragment_maps>`, `customProgramCacheKey`), `packages/glaze/src/decals.ts` (the `Draw` helper, `pt`, `hash`, one function per spray, `drawDecal`'s switch), `packages/glaze/src/catalog.ts` (names and blurbs of the new products), the existing tests for both.

## Change
- `paint.ts` `buildFinish` (no env map in the game, so metalness stays at or below 0.4):
  - `glitter`: `MeshPhysicalMaterial` roughness 0.35 metalness 0.3 clearcoat 0.6; `onBeforeCompile` adds, after `#include <normal_fragment_maps>`, a sparkle that shimmers as the view moves: `float gzH = fract(sin(dot(floor(gl_FragCoord.xy * 0.5), vec2(12.9898, 78.233))) * 43758.5453); diffuseColor.rgb += step(0.985, gzH) * vec3(0.9);` and `customProgramCacheKey = () => 'glaze-glitter'`.
  - `holo`: `MeshStandardMaterial` roughness 0.25 metalness 0.3 with a stronger view-angle hue rotation than chameleon (`gzA = gzFres * 6.4`, plus a second rotation from `normal.y * 2.0`); cache key `'glaze-holo'`.
  - `patina`: `MeshStandardMaterial` roughness 1 metalness 0, colour = paint mixed 40% toward rust `0x8a4a25` and darkened 10%.
  - `chrome`: `MeshPhysicalMaterial` colour = paint mixed 70% toward `0xdfe6ec`, roughness 0.12, metalness 0.4, clearcoat 1, `emissive 0x1c2024`.
- `decals.ts`: one function per new spray, same style (`Draw`, deterministic via `hash`, scale with `w` and `h`, at least 8 drawing calls, behave on `'side' | 'top' | 'rear'`): `moth` (a pair of big mirrored moth wings with eye spots and a thin body; on a flank one wing pair centred), `koi` (rows of overlapping scale arcs filling the panel, alternating `color`/`accent`), `hazard` (diagonal chevron stripes in `color` and `accent` along the whole panel, 45 degrees), `polka` (a grid of round spots in staggered rows, some with a smaller `accent` dot inside), `sunburst` (16 triangular rays fanning from the lower-left corner for `side`, from the centre for `top`/`rear`), `pinstripe` (two thin parallel lines with a curl at each end and a small diamond in the middle). Add them to the `drawDecal` switch.
- Tests: extend both test files: every new finish returns a material (cached, `metalness <= 0.4`, glitter/holo have `onBeforeCompile` and a cache key), `paintBody` with each new finish paints without error; every new spray draws on every panel kind with at least 8 calls and the identical call list twice.

## Contract
`finishMaterial` and `drawDecal` signatures unchanged; ids from `ids.ts`.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in your four files.
- `npx vitest run packages/glaze/src/paint.test.ts packages/glaze/src/decals.test.ts` passes.

## Out of scope
Every other file.
