Epic: FX01-B
Depends on: none
Findings: G2#30, G6#29 (must, D58: "Leaf and petal sprites for blustery debris. Near-camera fade."), G1#26 part
(soft round firefly points with size falloff), G9#26 part (soften the sun shadow with overcast)

## Goal
The ambient "motes" that drift round the camera (dust, pollen, petals, and fireflies at night) are drawn as small soft
sprites (a seed fluff, a petal, a leaf), tumbling, size-capped and faded out near the camera, instead of flat
untextured squares up to 30-100 px. At night they are soft round glows (fireflies). Rain and cloud soften the sun's
shadows.

## Read first
- `atmosphere.ts`: `MOTE_COUNT`, `MOTE_SPAN`, `MOTE_HEIGHT`, `BIOME_PROFILES` (moteColorDay/Night, moteOpacityDay/Night,
  moteSize per biome), the mote setup (~line 590-635: `positions`, `seeds`, `moteGeo`, `moteMat = new
  THREE.PointsMaterial(...)`, `motes`), and the per-frame update (~line 700-790: sun, hemi, "Update weather motes").
  Also `applyWeatherLook` (~line 470) and `curOvercast`.
- `node_modules/three/src/renderers/shaders/ShaderLib/points.glsl.js` (repo root node_modules) for how points are drawn.

## Change (only `atmosphere.ts`, plus a test)
- Replace `moteMat` (PointsMaterial) with a `THREE.ShaderMaterial` built by a new local function
  `createMoteMaterial(tex)`: `transparent: true, depthWrite: false, fog: true`, uniforms
  `THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor, uOpacity, uSize, uScale, uTime, uNight, uMap }])`.
  - New per-point attribute `aSeed` (Float32, 0..1, from the existing deterministic `seeds[i] / (2π)`).
  - Vertex: `vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;`
    `gl_PointSize = min(uSize * uScale / -mv.z, 22.0);` (uScale = drawing-buffer height / 2, set each frame from the
    renderer is not available here: use `window.innerHeight * Math.min(2, devicePixelRatio) / 2` and refresh it in
    update when it changes), `vNear = smoothstep(0.8, 3.0, -mv.z)`, `vSeed = aSeed`, and
    `vAngle = aSeed * 6.2832 + uTime * (0.6 + aSeed) * (aSeed > 0.5 ? 1.0 : -1.0)` (tumbling). Include
    `#include <fog_pars_vertex>` and, after computing mv, `vec4 mvPosition = mv; #include <fog_vertex>`.
  - Fragment: rotate `gl_PointCoord - 0.5` by `vAngle`, pick one of 4 cells of a 2 x 2 sprite atlas by
    `floor(vSeed * 4.0)`; at night (`uNight > 0.5`) always use cell 0 (the soft round glow). `vec4 t = texture2D(uMap, uv);`
    `gl_FragColor = vec4(uColor * t.rgb, t.a * uOpacity * vNear); if (gl_FragColor.a < 0.01) discard;` then
    `#include <fog_pars_fragment>` (top) / `#include <fog_fragment>` (end). Cells: 0 soft round glow (radial gradient),
    1 petal (soft ellipse, slightly pink-white), 2 leaf (pointed ellipse with a darker mid vein, light green-gold), 3 seed
    fluff (a tiny core with 6-8 faint radiating strands). Draw the atlas on a 128 x 128 canvas (64 px cells) with a
    1-2 px transparent margin per cell; `colorSpace = THREE.SRGBColorSpace`. Tint: the sprite's own colours multiplied by
    `uColor` (the biome's mote colour, as now), so keep the sprite colours near-white with a hint of hue.
  - In node tests there is no `document`: build the canvas texture only when `typeof document !== 'undefined'`, else
    leave `uMap` null and still build the material (the scene must still construct in tests).
  - Update code: where it now sets `moteMat.color/size/opacity`, set `uColor`, `uSize`, `uOpacity`; also set
    `uTime = clock` and `uNight = state.nightFactor`. Keep the movement code. Lower the per-biome `moteSize` values by
    about 25% only if the sprites look bigger than the old squares at 6-10 m (they should read as small specks).
- Sun shadow softening: after `sun.intensity = state.sunIntensity;` set
  `sun.shadow.intensity = 1 - 0.55 * Math.min(1, curOvercast);` (three 0.187 `LightShadow.intensity`, 0..1).
- Export a pure helper and test it in a new `atmosphere.motes.test.ts`:
  `export function moteCell(seed: number, night: number): number` (0..3, night > 0.5 → 0), used by nothing but the test
  and as the documented mapping (keep the shader's mapping identical).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/atmosphere` (inside games/gnome-theft-auto) passes (this runs every atmosphere test file).

## Out of scope
`weather/render.ts`, `weather/config.ts`, `app.ts`, the far fog and the sky colours (unchanged), the cloud sprites.
