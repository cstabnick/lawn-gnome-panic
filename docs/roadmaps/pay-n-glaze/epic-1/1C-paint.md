Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
Body paint: seven finishes (gloss, matte, metallic, pearl, candy, chameleon, primer) as shared cached materials, and `paintBody` that gives every tinted mesh of a vehicle the loadout's colour and finish.

## Read first
- `packages/glaze/src/types.ts`: `FinishId`, `Loadout`. `packages/glaze/src/ids.ts`: `FINISH_IDS`.
- `packages/glaze/src/paint.ts`: the stub (keep both exported signatures).
- `packages/prefabs/src/build.ts` lines 100-130 (`bakedMaterial`: the baked tint bucket is a `MeshStandardMaterial({ vertexColors: true, roughness: 0.78 })`) and lines 226-262 (`addPart`: a non-baked `'tint'` part is a mesh with `userData.tint = true`).
- three.js 0.187: `MeshStandardMaterial`, `MeshPhysicalMaterial` (`clearcoat`, `clearcoatRoughness`, `sheen`, `sheenColor`, `sheenRoughness`), `Material.onBeforeCompile`, `Material.customProgramCacheKey`.

## Change
- `packages/glaze/src/paint.ts`:
  - `finishMaterial(finish, color, vertexColors)`: cache by `${finish}:${color}:${vertexColors}` in a `Map`; return the cached material when present. The game has a hemisphere + sun light and NO environment map, so keep `metalness` at or below 0.4 (a high metalness without an env map renders black). Recipes (`color` is `new THREE.Color(color)` for all; pass `vertexColors` through; the baked bucket's vertex colours are white, so material colour = paint):
    - `gloss`: `MeshPhysicalMaterial`, `roughness 0.32`, `metalness 0.05`, `clearcoat 0.5`, `clearcoatRoughness 0.2`.
    - `matte`: `MeshStandardMaterial`, `roughness 0.96`, `metalness 0`.
    - `metallic`: `MeshPhysicalMaterial`, `roughness 0.38`, `metalness 0.38`, `clearcoat 0.3`, `clearcoatRoughness 0.3`.
    - `pearl`: `MeshPhysicalMaterial`, `roughness 0.3`, `metalness 0.1`, `clearcoat 1`, `clearcoatRoughness 0.1`, `sheen 1`, `sheenRoughness 0.4`, `sheenColor` = the paint colour lerped 60% toward white.
    - `candy`: `MeshPhysicalMaterial`, `roughness 0.22`, `metalness 0.12`, `clearcoat 1`, `clearcoatRoughness 0.04`, colour = the paint with its saturation raised by 0.15 (use `getHSL`/`setHSL`, clamp to 1) and lightness lowered by 0.04.
    - `primer`: `MeshStandardMaterial`, `roughness 1`, `metalness 0`, colour = the paint lerped 65% toward `0x8a8d90` (flat undercoat grey with a hint of the paint).
    - `chameleon`: `MeshStandardMaterial`, `roughness 0.3`, `metalness 0.25`, plus an `onBeforeCompile(shader)` that inserts, right after the line `#include <normal_fragment_maps>` in `shader.fragmentShader`, this GLSL (a view-angle hue shift: Rodrigues rotation about the grey axis):
      ```glsl
      float gzFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.0);
      float gzA = gzFres * 3.4;
      vec3 gzK = vec3(0.57735);
      diffuseColor.rgb = diffuseColor.rgb * cos(gzA) + cross(gzK, diffuseColor.rgb) * sin(gzA) + gzK * dot(gzK, diffuseColor.rgb) * (1.0 - cos(gzA));
      ```
      and set `customProgramCacheKey = () => 'glaze-chameleon'`. (Use `String.prototype.replace` on the include line; if it is not found, leave the shader unchanged.)
  - `paintBody(root, loadout)`: `root.traverse`; for every `THREE.Mesh` whose `userData.tint === true`: `mesh.material = finishMaterial(loadout.finish, loadout.paint, isVertexColoured(mesh.material))`, where `isVertexColoured` is true when the current material (or the one stored earlier in `mesh.userData.glazeVertexColors`) has `vertexColors` true. Store that boolean on `mesh.userData.glazeVertexColors` the first time so a second call (after the material was already swapped) keeps the right value. Idempotent. Do not touch meshes without `userData.tint`.
- `packages/glaze/src/paint.test.ts` (new): `finishMaterial` returns the same object for the same key and a different one for a different finish/colour/vertexColors; each finish returns a material whose `color.getHex()` is the paint (except `primer`, `candy`: only check they differ from the paint less than they would from black, i.e. just check `isMaterial`); `metalness <= 0.4` for all; `chameleon` has an `onBeforeCompile` function and a cache key. `paintBody` on `buildPrefab('ride-on-mower', { tint: 0xffffff, separateTint: true })` paints at least one mesh (count meshes with `userData.tint`; all of them end with `material === finishMaterial('metallic', 0x2f64c9, <their flag>)` for `{ ...defaultLoadout(0x2f64c9), finish: 'metallic' }`), calling it twice changes nothing, and a mesh without `userData.tint` keeps its material.

## Contract
`finishMaterial(finish: FinishId, color: number, vertexColors: boolean): THREE.Material` and `paintBody(root: THREE.Object3D, loadout: Loadout): void`, as stubbed.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `paint.ts` / `paint.test.ts`.
- `npx vitest run packages/glaze/src/paint.test.ts` passes.

## Out of scope
Every other file.
