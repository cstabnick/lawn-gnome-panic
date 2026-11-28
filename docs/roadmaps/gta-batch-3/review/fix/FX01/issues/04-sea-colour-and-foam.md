Epic: FX01-B
Depends on: none
Findings: G3#10, G3#11 (should)

## Goal
The Saltwater (the sea along the south edge) looks like a sea: a deeper blue than Loch Moss, white (not beige) crests,
no pale streaks that read as sandbars, and no sea bed poking through the wave troughs near the beach. The shore foam
strip is lit (no glowing band at night), varies in width and opacity along the shore, and washes slowly in and out.
Every other water body keeps today's colour by default.

## Read first
- `config.ts`: the `WATER` block (~line 935-1010): `bodies` (per-body depth, shelf, bank, meshStep), `colour`,
  `deepColour`, `foam`.
- `waterMesh.ts` (all, ~300 lines): `flowTexture()` (paints `WATER.colour` with pale `WATER.foam` streaks; the bodies use
  a clone `bodyTex`, uv = world xz / 8), `waterMat(layer, map)` (cached per layer), `foamMat` (a `MeshBasicMaterial`:
  ignores light, so it glows at night), `bodyFoam()` (a constant-width ring from 0.985 to 1.005 of the shore radius),
  `courseFoam()`.
- `waveShader.ts`: `applyWaveShader(mat, u)`: the crest colour is the constant `vec3(0.93, 0.96, 0.95)`.
- `waves.ts` lines 40-140: `WAVES.bodyGain` ('water/saltwater': 1.6), `WAVES.shoreM` (22: waves fade to 0 over this many
  metres in from a shore), `waveAmplitudeScale(x, z)`.

## Change
- `config.ts` (only inside `WATER.bodies['water/saltwater']`, an additive edit): add optional look fields
  `colour: 0x2b6c94, crest: 0xf6fafc, opacity: 0.94, shoreM: 45`. Do not change depth/shelf/bank (they carve terrain).
  Keep `as const` working: the other bodies simply lack these fields; read them through a typed accessor, e.g.
  `const look = (WATER.bodies as Record<string, { colour?: number; crest?: number; opacity?: number; shoreM?: number }>)[id]`.
- `waterMesh.ts`:
  - `flowTexture(colour = WATER.colour, streak = WATER.foam, streakAlpha = [0.15, 0.3])`: a body with its own `colour`
    gets its own texture with white streaks at about half today's alpha (0.06-0.12) so they no longer read as sand.
  - Per-body material: a body with a `colour` override gets its own material (cache key includes the body id) with its
    texture, `opacity` from the override, and its own crest colour (see waveShader below). Default bodies and courses
    keep the shared material exactly as now.
  - Foam: replace `MeshBasicMaterial` with `MeshLambertMaterial({ color: WATER.foam, transparent: true, opacity: 0.45,
    vertexColors: true })` (lit: dark at night), still on `flatLayer(..., FOAM_LAYER)`. Give the foam geometry a
    `color` attribute (itemSize 4 is not supported by Lambert vertexColors in a simple way: use itemSize 3 RGB and vary
    brightness instead, 0.75..1.0) and vary the ring's inner radius along the shore with a smooth deterministic noise
    (e.g. sum of two sines of k), inner factor between 0.978 and 0.992. For courses, vary `near` the same way.
  - Slow wash: in `update(dt)`, `foamMat.opacity = 0.38 + 0.1 * Math.sin(t * 0.5)` (t accumulated from dt).
- `waveShader.ts`: `applyWaveShader(mat, u, crest?: number)`: when `crest` is given, use it (as a per-material uniform
  `uCrest`, a `THREE.Color` converted to linear: `new THREE.Color(crest)`), else the old constant. Include the crest in
  `customProgramCacheKey` only if the shader text changes (a uniform does not need a new key). Also make the whitecap a
  touch brighter on the sea: mix factor `crest * 0.85` when a crest is given (0.7 otherwise).
- `waves.ts`: the shore fade uses a per-body shore distance: `shoreM` from the body's WATER.bodies entry when present,
  else `WAVES.shoreM`. Store it in the `BodyBox` (`shore: number`) and use it in `waveAmplitudeScale`. This lowers
  trough depth near the beach so the bed never shows through (physics and visuals both read this function).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/waves src/water src/waterMesh src/waveShader` (inside games/gnome-theft-auto; whichever of these
  test files exist) passes. If a waves test pins an amplitude near the Saltwater shore, update its expectation only
  if the new value follows from `shoreM: 45`, and say so in your report.

## Out of scope
Any other `config.ts` block (another epic edits config.ts: keep your edit inside `WATER.bodies['water/saltwater']`),
`coast/**`, terrain carving (`water.ts`), boats.
