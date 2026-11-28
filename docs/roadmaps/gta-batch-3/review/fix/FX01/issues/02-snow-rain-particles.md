Epic: FX01-B
Depends on: none
Findings: G4#3 (must, D58), G9#26 (should: the streak part)

## Goal
Snow flakes never show as big hard squares near the camera (soft round, size-capped, faded out within ~1.5 m), and
rain streaks are shorter and fainter on small screens.

## Read first
- `weather/render.ts` (all of it, ~300 lines): `snowMat` (a `THREE.PointsMaterial` with a radial-gradient
  `flakeTex` map), `rainMat`, `RAIN_LEN`, the tail constants `tailX/tailY/tailZ`.
- `node_modules/three/src/renderers/shaders/ShaderLib/points.glsl.js` (at the repo root's node_modules): the points
  vertex shader sets `gl_PointSize = size;` then `#ifdef USE_SIZEATTENUATION ... gl_PointSize *= ( scale / - mvPosition.z );`
  right after `#include <project_vertex>`; the fragment has `#include <map_particle_fragment>` then
  `#include <alphatest_fragment>`.

## Change
- `weather/render.ts`:
  - Snow: patch `snowMat` with `onBeforeCompile` (and set `snowMat.customProgramCacheKey = () => 'gta-snow'`):
    vertex: declare `varying float vNear;`; inject after the `#endif` that closes the size-attenuation block (match the
    exact text in points.glsl.js, e.g. replace `#include <logdepthbuf_vertex>` with
    `gl_PointSize = min(gl_PointSize, 14.0 * uPixelRatio);\n vNear = smoothstep(1.0, 2.5, -mvPosition.z);\n#include <logdepthbuf_vertex>`);
    add a uniform `uPixelRatio` (value `Math.min(2, window.devicePixelRatio || 1)` when `window` exists, else 1).
    Fragment: `varying float vNear;` and after `#include <map_particle_fragment>` add `diffuseColor.a *= vNear;`.
    Also set `snowMat.alphaTest = 0.02` and make the flake gradient a little tighter (stops 0 → 1, 0.35 → 0.75,
    1 → 0) so the flake has a soft but round edge. Keep `size: 0.3`.
  - Rain on small screens: when `typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600`
    use a streak length of `RAIN_LEN * 0.6` for the tail and an opacity of `0.25 + 0.2 * w.intensity` (desktop keeps
    `0.4 + 0.3 * w.intensity`). Compute the "small" flag once at creation.
- `weather/render.test.ts` (new, or extend an existing test of this module if one exists in `weather/`): in node there is
  no `document`, so test only what is pure; if nothing pure is exposed, export a small pure helper
  `rainLook(small: boolean, intensity: number): { len: number; opacity: number }` from render.ts, use it in the code,
  and test it.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/weather` (inside games/gnome-theft-auto) passes.

## Out of scope
`weather/config.ts`, `atmosphere.ts` (other issues), the cloud sprites.
