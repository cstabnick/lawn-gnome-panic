# Gnome Theft Auto: water waves

Goal (the user's words): "figure out how to add waves to the water too. not super complex sim but convincing enough and
have boats react to it. make sure all multiplayer compatible."

## Design

**One field, two consumers.** `games/gnome-theft-auto/src/waves.ts` is a pure, allocation-free, deterministic wave
field. The water mesh draws it in a vertex shader (`waveShader.ts`) and every floating thing samples the same formula, so
what you see is what a hull rides on.

```
h(x, z, t) = waveAmplitudeScale(x, z) * seaGainAt(t) * detailGain * SUM_i amp_i * sin(kx_i x + kz_i z - w_i t + p_i)
```

- **Components** (`WAVES.components`): a 22 m swell, 13 m and 8.5 m cross swells, 4.2 m wind chop and a 1.7 m ripple,
  spread around one wind direction (`WAVES.windYaw`), deep-water dispersion `w = sqrt(g k)`. Vertical only (Gerstner-lite
  without the sideways shift) so visuals and physics agree exactly.
- **Where** (`waveAmplitudeScale`, static): open Loch Moss 1, the Puddle Sea 1.35, fading to 0 over 22 m from a shore and
  12 m round Tessie's island; rivers and the canal 0.05 (ripples of ~1-2 cm); canal locks calm (`registerCalmSpots`).
- **Sea state** (`seaGainAt`): calm 0.35 / breezy 1 / blustery 1.75. A schedule that depends only on the clock (300 s
  slots, state from a hash of the slot number, 40 s blends), unless `setSeaState(state, at)` forces one (the storm hook;
  online, the host's choice). Peak crest: ~0.15 m calm loch, ~0.33 m breezy, ~0.8 m blustery Puddle Sea.
- **Clock** (`waveTime`): wall-clock UTC seconds since 2025-01-01 plus an online offset, cached once a frame by
  `tickWaveClock()` (app.ts). Unticked (unit tests of other modules) the offset is 0: still water, no test changes.
- **Hook**: `terrain.ts waterAt(x, z).surface` now includes `waveSurfaceOffset(x, z)` (depth stays the still depth, so a
  shore never flickers dry). Boats, NPC boat traffic, moored boats, swimming gnomes, wakes, aircraft water landings and
  the Sling-Lift drop all ride the waves through it with no change of their own.
- **Options**: `?waves=0|low|high` and an Options button "Water waves: off / low / high" (`setWaveDetail`). The quality
  governor's tier feeds `setWaveQualityTier`: 'min' / 'low' draw 3 components and no whitecaps.

### waves.ts API (contract for other workstreams)

```ts
waveHeight(x: number, z: number, t: number): number            // m above the still level
waveSlope(x: number, z: number, t: number, out: { x: number; z: number }): void   // dh/dx, dh/dz
waveAmplitudeScale(x: number, z: number): number                // 0 shore .. 1 loch .. 1.35 sea
waveTime(): number                                              // shared clock, s
setSeaState(state: SeaState | null, at?: number): void          // 'calm' | 'breezy' | 'blustery'; null = schedule
seaState(t?: number): SeaState
seaGainAt(t: number): number
waveSurfaceOffset(x: number, z: number): number                 // the terrain hook (0 unticked / off)
waveDrift(x: number, z: number, t: number, out: { x: number; z: number }): void   // downwind * local height
waveAttitude(x, z, yaw, halfLength, halfBeam, t, out: { heave; pitch; roll }): void
seaRoughness(x: number, z: number): number                      // 0..1
waveShaderState(t: number, out: Float32Array, count?: number): number
tickWaveClock(nowMs?: number): void; setWaveClockOffset(ms: number): void
setWaveDetail(d: 'off' | 'low' | 'high'): void; setWaveQualityTier(t: Tier): void
registerCalmSpots(spots: { x: number; z: number; r: number }[]): void
```

The pure hull step (`craft/hull.ts stepHull`) takes an optional `WaterSampler.drift` (boats.ts passes `waveDrift`);
without it a hull still heaves, pitches and rolls on the waves (its four float points sample `waterAt`), only the
head/following-sea push is missing. `BoatState.air` (s airborne) and `BoatState.slam` (landing speed, m/s) are new
optional fields.

### Online

Waves depend only on (x, z, waveTime(), sea state). Wall clocks already agree to within NTP skew; the host also
publishes one record on a new world-sync system `SYS.sea` (online/seaSync.ts, append-only code 9; 6-8 went to sim jobs) every 2 s:
`[0, round(waveTime*10), forcedState (-1 schedule, 0 calm, 1 breezy, 2 blustery), round(forcedAt*10)]`. Mirrors move
their clock offset when it is more than 0.2 s off and apply the forced state with the host's start time. Remote boats'
poses (y included) come from their owner as before; remotes.ts recomputes pitch / roll from the waves for display.
If a player sets waves off, only their own view is still (documented).

### Not online-specific / out of scope

No Gerstner horizontal displacement, no wave refraction, no interaction of wakes with the field (wakes ride on top).

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0 Foundation (planner, done) | waves.ts real, terrain hook, app tick, options stub, BoatState fields, tsc clean | - |
| 1 Waves everywhere | `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, build, screenshot | 7 |

Hot-file edits (all additive, small): terrain.ts (waterAt + import), app.ts (tick, quality feed, init detail; Epic 1
issue 7 adds the slam / prop-out effects), options.ts (one mount call), types.ts (BoatState air, slam), online/protocol.ts
(SYS.sea), online/install.ts (register), remotes.ts (one call), player.ts (one field), anim/rideAuto.ts (seasick by sea),
sound/engines.ts + audio.ts (propOut), craft/model.ts (optional drift), fishing/sim.ts + fishView.ts (bobber).

## Epic 1 issues

Every issue starts with this shared block:

~~~~text
## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto (three.js 0.187 + TypeScript, Vite, vitest).
Other workers and other planners are editing OTHER files of this same game at the same time: touch only the files listed
under Change. If `npx tsc --noEmit -p games/gnome-theft-auto` shows errors in files you did not touch, ignore them
(mid-edit) and make sure your own files have none. Do not commit, push, stash or switch branches; do not run `vite
build` / `npm run build`; do not start servers or browsers. Run single test files with
`cd games/gnome-theft-auto && npx vitest run <path>` (the full suite is slow and has unrelated failures right now).
No allocation in per-frame code (reuse scratch objects / typed arrays). Repo rules: anything lying flat on another
surface uses flatLayer(material, LAYER.x) from '@lawn/depth' (no z-fight); UI works on a phone (44 px targets, no
hover-only). The game must play exactly as before when waves are off.

## Waves background (already built; do NOT edit games/gnome-theft-auto/src/waves.ts unless told)
src/waves.ts is a pure deterministic wave field. Read its header comment. Key API:
  waveHeight(x, z, t): number            metres above the still water level
  waveSlope(x, z, t, out: {x, z}): void  gradient
  waveAmplitudeScale(x, z): number       0 at shores, 0.05 rivers/canal, 1 open Loch Moss, 1.35 Puddle Sea (static)
  seaGainAt(t): number                   sea-state gain (calm 0.35, breezy 1, blustery 1.75) x detail gain
  waveTime(): number                     shared clock (s) for this frame; tickWaveClock(nowMs?) sets it (app.ts does)
  setSeaState(state: 'calm'|'breezy'|'blustery'|null, at?: number); seaState(t?); forcedSeaState(): {state, at} | null
  waveSurfaceOffset(x, z): number        waveHeight at waveTime(), 0 before the first tick or with waves 'off'
  waveDrift(x, z, t, out: {x, z}): void  downwind unit vector x local significant height (m)
  waveAttitude(x, z, yaw, halfLength, halfBeam, t, out: {heave, pitch, roll}): void
  seaRoughness(x, z): number             0..1
  waveShaderState(t, out: Float32Array, count?): number   per component [kx, kz, phase, amp*gain]; count = components
  WAVE_COMPONENTS (5), WAVES (tuning), setWaveDetail('off'|'low'|'high'), waveDetail(), setWaveQualityTier(tier),
  waveVisualComponents(), waveFoamOn(), registerCalmSpots([{x, z, r}]), setWaveClockOffset(ms), waveClockOffset(),
  resetWaves() (tests: back to unticked still state).
terrain.ts waterAt(x, z) already returns { surface: still + waveSurfaceOffset(x, z), depth: still depth } so anything
that floats on waterAt already rides the waves. Water bodies (water.ts BODIES): Loch Moss centre (-700, -680), half
extents a 150, b 120, Tessie's island at (-760, -720) r 24; the Puddle Sea centre (690, 830), a 200, b 60. A point in
open Loch Moss with scale exactly 1: (-650, -650).
~~~~

### Issue 1.1: waves.ts unit tests

~~~~text
Epic: 1 Waves everywhere. Depends on: none
(shared Environment + Waves background block)

## Goal
src/waves.test.ts proves the wave field is deterministic, bounded, continuous, shore-damped, and that slope and shader
state agree with the height.

## Read first
- games/gnome-theft-auto/src/waves.ts (all of it)
- games/gnome-theft-auto/src/water.ts: BODIES, COURSES, shorePoint(w, ang)

## Change
- games/gnome-theft-auto/src/waves.test.ts (new). beforeEach(resetWaves). Tests:
  1. determinism: waveHeight at 20 (x, z, t) points twice gives identical numbers (toBe); same after resetWaves().
  2. bounds: at (-650,-650) and (690, 830) for t in 0..600 step 0.7: |h| <= waveAmplitudeScale * seaGainAt(t) *
     sum of WAVES.components amplitudes (+1e-9). Finite for t = 1e8 and x, z = +-900.
  3. continuity: |h(x+0.01, z, t) - h(x, z, t)| < 0.01 and |h(x, z, t+0.01) - h(x, z, t)| < 0.02 at many open-water points.
  4. shore damping: waveAmplitudeScale(shorePoint(body, ang)) === 0 for 16 angles of each body (shorePoint returns a
     point exactly on the shore, r = 1); scale(-650,-650) === 1; scale(690, 830) is 1.35; 0 at Tessie's island centre.
  5. rivers: a point of COURSES.find(c => c.id === 'canal').points[1] (not in a body) has scale WAVES.courseGain;
     after registerCalmSpots([{ x, z, r: 10 }]) at that point it is 0.
  6. slope vs finite difference at (-650,-650) for 10 times: waveSlope out.x / out.z within 1e-4 of central differences
     with e = 1e-3.
  7. sea state: setSeaState('blustery', 100) -> seaGainAt(100 + WAVES.blendS + 1) === 1.75 and seaState(500) ===
     'blustery'; setSeaState(null, 1000) -> seaGainAt(1000 + WAVES.blendS + 1) equals the scheduled gain (compare with a
     fresh resetWaves() run at the same t). scheduledSeaState over 2000 slots only returns the three states, calm share
     within 0.2..0.4, blustery 0.1..0.3.
  8. detail: setWaveDetail('off') -> waveHeight 0 at open-water points; 'low' -> exactly WAVES.lowGain x the 'high' value
     (toBeCloseTo 12).
  9. clock: waveSurfaceOffset(-650,-650) === 0 before tickWaveClock; after tickWaveClock(1.8e12) waveTime() ===
     1.8e12/1000 - 1735689600 and waveSurfaceOffset === waveHeight(-650, -650, waveTime()). setWaveClockOffset(500)
     then tickWaveClock(same ms) adds 0.5 s.
  10. shader agreement: out = new Float32Array(4 * WAVE_COMPONENTS); waveShaderState(t, out); at (-650,-650) the sum
      over i of out[4i+3] * scale * Math.sin(out[4i]*x + out[4i+1]*z - out[4i+2]) is within 1e-3 of waveHeight. With
      count 3 the last two amps are 0.
  11. waveAttitude with detail 'off' gives heave/pitch/roll 0; seaRoughness is within [0, 1] (after a tick).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/waves.test.ts passes.
- If a test exposes a real bug in waves.ts, fix waves.ts minimally (keep every exported signature) and say so.

## Out of scope
Every other file.
~~~~

### Issue 1.2: the water mesh moves (shader displacement, whitecaps, wakes ride waves)

~~~~text
Epic: 1 Waves everywhere. Depends on: none
(shared Environment + Waves background block)

## Goal
The loch, the Puddle Sea and the rivers are drawn displaced by exactly waves.ts' field in a vertex shader, with matching
normals, whitecaps on crests and a subtle colour shift by height; wake foam rides the waves. Cheap: the CPU only writes
5 vec4 uniforms a frame.

## Read first
- games/gnome-theft-auto/src/waterMesh.ts (all): bodyFan, courseWater, waterMat, buildWaterMeshes, update.
- games/gnome-theft-auto/src/waves.ts: waveShaderState, waveAmplitudeScale, waveVisualComponents, waveFoamOn,
  registerCalmSpots, waveTime, WAVE_COMPONENTS.
- games/gnome-theft-auto/src/wake.ts
- games/gnome-theft-auto/src/towers/material.ts: an onBeforeCompile example in this codebase.
- games/gnome-theft-auto/src/water.ts: bodyRadius, shorePoint, canalLocks.

## Change
- games/gnome-theft-auto/src/waveShader.ts (new):
  export interface WaveUniforms { uWaves: { value: THREE.Vector4[] }; uWaveFoam: { value: number }; uWaveAmp: { value: number } }
  export function createWaveUniforms(): WaveUniforms   // WAVE_COMPONENTS Vector4s, made once
  export function updateWaveUniforms(u: WaveUniforms, t: number): void
    // a module-level scratch Float32Array(4*WAVE_COMPONENTS); waveShaderState(t, scratch, waveVisualComponents());
    // copy into the Vector4s (x=kx, y=kz, z=phase, w=amp); uWaveFoam = waveFoamOn() ? 1 : 0; uWaveAmp = sum of the w's
    // (0.0001 minimum). No allocation.
  export function applyWaveShader(mat: THREE.MeshStandardMaterial, u: WaveUniforms): void
    // mat.onBeforeCompile = (shader) => { Object.assign(shader.uniforms, u); edit shader.vertexShader / fragmentShader };
    // also set mat.customProgramCacheKey = () => 'gta-waves' (and keep any existing key in the string).
    // Vertex: after '#include <common>' add `uniform vec4 uWaves[N]; attribute float aWaveScale; varying float vWaveH;`
    //   (N = WAVE_COMPONENTS as a literal in the string). Replace '#include <beginnormal_vertex>' with:
    //     float wh = 0.0; vec2 wg = vec2(0.0);
    //     for (int i = 0; i < N; i++) { vec4 c = uWaves[i]; float a = c.w * aWaveScale;
    //       float ph = c.x * position.x + c.y * position.z - c.z; wh += a * sin(ph); wg += a * cos(ph) * c.xy; }
    //     vWaveH = wh;
    //     vec3 objectNormal = normalize(vec3(-wg.x, 1.0, -wg.y));
    //     #ifdef USE_TANGENT
    //       vec3 objectTangent = vec3( tangent.xyz );
    //     #endif
    //   Replace '#include <begin_vertex>' with '#include <begin_vertex>\n transformed.y += wh;'.
    //   (The water meshes are built in world coordinates with an identity transform, so position.xz is world x, z.)
    // Fragment: after '#include <common>' add `uniform float uWaveFoam; uniform float uWaveAmp; varying float vWaveH;`.
    //   After '#include <color_fragment>' add: float hn = clamp(vWaveH / uWaveAmp, -1.0, 1.0);
    //     diffuseColor.rgb *= 0.94 + 0.1 * hn;   (darker troughs, lighter crests)
    //     if (uWaveFoam > 0.5) { float crest = smoothstep(0.55, 0.95, hn) * smoothstep(0.08, 0.3, uWaveAmp);
    //       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 0.95), crest * 0.55); }
- games/gnome-theft-auto/src/waterMesh.ts:
  - At the top of buildWaterMeshes (after the waterOn() check): registerCalmSpots(canalLocks().map(l => ({ x: l.x, z: l.z, r: 12 }))).
  - Every water geometry gets a per-vertex 'aWaveScale' Float32BufferAttribute (itemSize 1) = waveAmplitudeScale(x, z)
    of that vertex. Foam geometries (courseFoam, bodyFoam) do NOT (they use the plain foam material).
  - Replace bodyFan with bodyGrid(w, level): a regular grid of step 2.5 m over [cx - a*grow, cx + a*grow] x
    [cz - b*grow, cz + b*grow] (grow = 1 + 2 / Math.min(a, b) as now). A vertex with bodyRadius(w, x, z) > grow is
    pulled onto the rim: x = cx + (x - cx) * grow / r, z likewise (the superellipse radius is homogeneous, so that lands
    exactly on r = grow). Keep a quad when at least one of its 4 corners has r <= grow. Vertices a=(i,j), b=(i+1,j),
    c=(i,j+1), d=(i+1,j+1) (x grows with i, z with j) make triangles (a, c, b) and (b, c, d): both face up. UV = x/8,
    z/8 as before. Share vertices (index buffer). Expect roughly 12k vertices for the loch and 8k for the sea.
  - Both water materials get applyWaveShader(mat, uniforms) with one shared createWaveUniforms(). After
    computeVertexNormals, grow each water mesh's bounding sphere radius by 1.5 (geometry.computeBoundingSphere(); then
    geometry.boundingSphere!.radius += 1.5) so frustum culling never clips a crest.
  - update(dt): keep the texture scroll; add updateWaveUniforms(uniforms, waveTime()).
- games/gnome-theft-auto/src/wake.ts: each active quad's y follows the water: in the update loop, after moving x/z,
  const w = waterAt(q.mesh.position.x, q.mesh.position.z); if (w) q.mesh.position.y = w.surface + 0.04. (waterAt now
  includes the waves.) Nothing else.

## Contract
waveShader.ts exports exactly the three functions and the interface above. waterMesh.ts keeps `WaterMeshes` and
`buildWaterMeshes(scene)` unchanged.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in waterMesh.ts, waveShader.ts, wake.ts.
- cd games/gnome-theft-auto && npx vitest run src/water.test.ts src/waterworks.test.ts passes.
- Add src/waveShader.test.ts: updateWaveUniforms(u, 123.4) fills the Vector4s equal to waveShaderState(123.4, ...)
  (toBeCloseTo 5) and makes no new Vector4 objects (same references before and after).

## Out of scope
waves.ts, terrain.ts, app.ts, world.ts, every other file.
~~~~

### Issue 1.3: hulls react to waves (airtime, slam, head / following seas, beam roll)

~~~~text
Epic: 1 Waves everywhere. Depends on: none
(shared Environment + Waves background block)

## Goal
The pure hull step (craft/hull.ts stepHull) already heaves / pitches / rolls on the waves because its four float points
sample waterAt (which includes the waves). Add: airtime off big crests with a slam on landing, the head/following sea
push, more roll in beam seas, and tests that a hull stays stable.

## Read first
- games/gnome-theft-auto/src/craft/hull.ts (all), craft/hull.test.ts (how a test builds a sampler and a HullSpec)
- games/gnome-theft-auto/src/craft/model.ts: HullSpec, WaterSampler
- games/gnome-theft-auto/src/boats.ts
- games/gnome-theft-auto/src/types.ts: BoatState (already has optional `air?: number` and `slam?: number`)

## Change
- craft/model.ts WaterSampler: add an optional member
  `drift?(x: number, z: number, out: { x: number; z: number }): void;` with a doc comment (waves.ts waveDrift at waveTime()).
- craft/hull.ts stepHull:
  1. Heave: a = (ty - body.y) * spec.buoyancy - st.vy * spec.heaveDamp, then a = Math.max(a, -9.81) (the water can pull a
     hull down no faster than gravity; at rest nothing changes). Airborne when body.y > ty + 0.12 (ty = mean surface -
     draft as now): then a = -9.81 (no spring, no damping), st.air = (st.air ?? 0) + dt. When the hull was airborne
     (st.air > 0) and now is not: st.slam = Math.max(0, -st.vy) (m/s, downward speed at the moment of landing), st.air =
     0, and st.vy *= 0.35 (the water takes the hit). Otherwise st.slam = 0. On land (no centre water) st.air = 0, st.slam = 0.
  2. While airborne, do not ease pitch/roll toward the water targets; ease pitch toward bow-down 0.08 at rate 1.5/s.
  3. Wave push, only when |body.speed| > 0.5 or c.throttle !== 0, and only if w.drift exists and the boat is afloat (not
     airborne): w.drift(body.x, body.z, scratch) with a module-level scratch {x, z}; along = fx*scratch.x + fz*scratch.z
     (+ = following sea); body.speed += WAVE_PUSH * along * dt * Math.sign(body.speed || 1) where WAVE_PUSH = 1.4
     (head seas slow, following seas surge). Also surf the local slope: slopeAlong = (sBow - sStern) / (2 * hl);
     body.speed -= 9.81 * 0.2 * slopeAlong * dt. Apply before the maxSpeed clamp so the clamp still holds (clamp
     body.speed to [-reverseFrac*maxSpeed, maxSpeed*1.1] after the push).
  4. Beam roll: if drift exists, mag = hypot(scratch.x, scratch.z); if mag > 1e-6, cross = |fx*scratch.z - fz*scratch.x| / mag;
     targetRoll *= 1 + 0.6 * cross.
  5. Keep the non-finite guard; it also resets st.air = 0, st.slam = 0. Return type unchanged ({ shoreBlocked }).
  Export `WAVE_PUSH` as a named const.
- boats.ts: SAMPLER gets drift: (x, z, out) => waveDrift(x, z, waveTime(), out) (import from './waves'). Nothing else.
- craft/hullWaves.test.ts (new). Build a sampler from waves.ts: water(x, z) => ({ surface: waveHeight(x, z, T), depth: 5 }),
  bed: () => -5, drift: (x, z, o) => waveDrift(x, z, T, o), with a test-scoped `let T` advanced by dt each step. Use the
  'gravy-boat' spec via hullSpecOf(VEHICLES['gravy-boat']) (config.ts). Start at (-650, -650), beforeEach(resetWaves).
  Tests:
  a. at rest in 'breezy' (setSeaState('breezy', -1e6)): 60 s at dt 1/60, controls 0: y stays within [surface - draft -
     0.5, surface - draft + 0.5], mean of (y + draft) over the last 30 s within 0.1 of 0 (no sinking or rising from
     wave noise), pitch and roll vary (max |roll| > 0.002) and every value finite; x/z drift < 0.5 m (moored boats do
     not wander).
  b. waves 'off' (setWaveDetail('off')): 10 s at rest: |vy| < 1e-6 at the end, pitch and roll ~0 (jitter-free).
  c. head vs following in 'blustery' (setSeaState('blustery', -1e6)): two boats, full throttle 20 s, yaw = WAVES.windYaw
     (following) and WAVES.windYaw + Math.PI (head); the mean speed of the following one is higher.
  d. airtime: blustery, Puddle Sea point (690, 830) or forced bigger waves: a gravy boat at full throttle head-on for 30 s
     gets st.air > 0 at least once and a st.slam > 0 at least once; no NaN.
  e. determinism: the same run twice gives identical final x, y, z, yaw.
  If (d) cannot get airborne with these numbers, note it in your report rather than changing the gains wildly (a
  bigger forced sea is fine: add a WaterSampler that multiplies waveHeight by 2 for this test only).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/craft/hull.test.ts src/craft/hullWaves.test.ts src/boats.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your files.

## Out of scope
waves.ts, types.ts, app.ts, terrain.ts, vehicles.ts and everything else.
~~~~

### Issue 1.4: online sea sync (shared clock + host's sea state)

~~~~text
Epic: 1 Waves everywhere. Depends on: none
(shared Environment + Waves background block)

## Goal
Every client in a room sees the same waves: the host publishes its wave clock and forced sea state on a new world-sync
system; mirrors adopt them. Offline nothing changes.

## Read first
- games/gnome-theft-auto/src/online/hub.ts: SyncAdapter, SyncFrame, SyncLink, OwnedEnt, MirrorChanges
- games/gnome-theft-auto/src/online/protocol.ts: SYS, SYS_COUNT
- games/gnome-theft-auto/src/online/slingSync.ts + slingSync.test.ts (a small adapter and how it is tested)
- games/gnome-theft-auto/src/online/install.ts
- games/gnome-theft-auto/src/waves.ts: waveTime, setWaveClockOffset, waveClockOffset, setSeaState, forcedSeaState

## Change
- online/protocol.ts: SYS gets `sea: 6` (append only), SYS_COUNT = 7. Add a comment line. Nothing else.
- online/seaSync.ts (new): export const SEA_STATE_CODES = ['calm', 'breezy', 'blustery'] as const;
  export function encodeSea(t: number, forced: { state: SeaState | null; at: number } | null): number[]
    // [0, Math.round(t * 10), forced ? (forced.state ? index : -1) : -2, forced ? Math.round(forced.at * 10) : 0]
    // -2 = never forced (schedule), -1 = forced back to the schedule.
  export function decodeSea(rec: readonly number[]): { t: number; state: SeaState | null | undefined; at: number } | null
    // undefined state = schedule only; null if length !== 4 or the code is out of range.
  export function clockCorrectionMs(hostT: number, myT: number): number   // (hostT - myT) * 1000, 0 when |diff| < 0.2 s
  export function createSeaSync(link: SyncLink): SyncAdapter
    // sys SYS.sea, radius 100000 (everyone), hz 0.5.
    // collect(out, f): only when f.isHost: out.push({ id: 0, x: 0, z: 0, rec: encodeSea(waveTime(), forcedSeaState()) }).
    // receive(ch, f): for each added/changed e with f && e.owner === f.hostId: d = decodeSea(e.rec); if d:
    //   corr = clockCorrectionMs(d.t, waveTime()); if corr !== 0 setWaveClockOffset(waveClockOffset() + corr);
    //   if d.state !== undefined and (forcedSeaState() is null or its state/at differ by > 0.05 s) setSeaState(d.state, d.at).
    //   (Latency makes the host time look ~0.05 s old; the 0.2 s dead band keeps the offset from twitching.)
    // ownerGone: nothing to adopt (ents disposed: nothing to do). update: nothing. reset: nothing (keep the offset: no jump).
- online/install.ts: import createSeaSync and `hub.register(SYS.sea, (link) => createSeaSync(link));` next to the others.
- online/seaSync.test.ts (new): encode/decode round trip (states, schedule, forced-null); decodeSea rejects bad
  lengths and codes; clockCorrectionMs dead band; an adapter test: collect pushes nothing when not host and one record
  when host; receive from the host with t 1 s ahead moves waveClockOffset by ~1000 and with a forced 'blustery' calls
  through so that seaState(at + 1) === 'blustery'; receive from a non-host owner is ignored. Use resetWaves() in
  beforeEach and tickWaveClock(fixed ms) to fix waveTime. Build a minimal SyncFrame object literal as slingSync.test.ts
  or online.test.ts do. Also check parseWireMsg accepts an 'ent' message with y: SYS.sea.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/online/ passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your files.

## Out of scope
hub.ts, replicate.ts, authority.ts, net.ts, waves.ts, app.ts, every other file.
~~~~

### Issue 1.5: 'Water waves: off / low / high' option and ?waves=

~~~~text
Epic: 1 Waves everywhere. Depends on: none
(shared Environment + Waves background block)

## Goal
Fill the stub games/gnome-theft-auto/src/waveOptions.ts: a saved choice, a URL override, and an Options panel button.

## Read first
- games/gnome-theft-auto/src/waveOptions.ts (the stub: keep both exported signatures)
- games/gnome-theft-auto/src/options.ts: how the "Radio text" and "Players on the map" buttons are built and painted
  (class 'gta-opt-mode', innerHTML with a <small> line), and that it calls mountWaveOptions(panel) after the sound options.
- games/gnome-theft-auto/src/mapPrefs.ts: localStorage get/set with try/catch.

## Change
- waveOptions.ts:
  export function parseWaveParam(search: string): WaveDetail | null  // ?waves=0|off -> 'off', low -> 'low', 1|high|on -> 'high', else null
  export function getSavedWaveDetail(): WaveDetail   // localStorage 'gta-waves', default 'high', try/catch
  export function saveWaveDetail(d: WaveDetail): void
  initWaveDetail(search): setWaveDetail(parseWaveParam(search) ?? getSavedWaveDetail()) (a URL value is not saved).
  mountWaveOptions(panel): an <h3>Water</h3> heading and one button (type=button, class 'gta-opt-mode') showing
  `Water waves: ${d}<small>How much the loch and the Puddle Sea roll. Low is gentler and cheaper; off is flat water.</small>`;
  a click cycles off -> low -> high -> off, calls setWaveDetail and saveWaveDetail, and repaints.
- waveOptions.test.ts (new): parseWaveParam cases; initWaveDetail('?waves=0') makes waveDetail() 'off';
  getSavedWaveDetail falls back to 'high' when localStorage throws (stub globalThis.localStorage with a throwing object
  via vi.stubGlobal, restore after). For mountWaveOptions only if the test environment has `document` (check
  vite/vitest config; skip DOM tests if it is node).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/waveOptions.test.ts passes; tsc shows no errors in waveOptions.ts.

## Out of scope
options.ts (already calls mountWaveOptions), app.ts (already calls initWaveDetail), waves.ts.
~~~~

### Issue 1.6: floating things: remote boats, bobber, seasickness

~~~~text
Epic: 1 Waves everywhere. Depends on: none
(shared Environment + Waves background block)

## Goal
Other players' boats pitch and roll on the local waves; a fishing bobber bobs on them; boat passengers get seasick
sooner in rough water.

## Read first
- games/gnome-theft-auto/src/remotes.ts around the `syncVehicleMesh(v, dt)` call for a remote's vehicle (~line 235)
- games/gnome-theft-auto/src/vehicles.ts syncVehicleMesh: a boat's mesh uses v.boat.pitch / v.boat.roll
- games/gnome-theft-auto/src/anim/rideAuto.ts: RideInfo, passengerAnim, LONG_RIDE_S
- games/gnome-theft-auto/src/player.ts ~line 370-385: where rideInfo fields are set before rideAnim.update
- games/gnome-theft-auto/src/fishing/sim.ts (~line 45-75 and ~215: s.surface, s.bobY) and fishing/fishView.ts (~line 132)

## Change
- games/gnome-theft-auto/src/boatWaves.ts (new):
  export function settleOnWaves(v: Vehicle, dt: number): void
    // For a boat whose pose comes from elsewhere (a remote player's): if !v.boat return. waveAttitude(v.x, v.z, v.yaw,
    // v.spec.radius * 0.8, v.spec.radius * 0.4, waveTime(), scratch) with a module-level scratch; ease v.boat.pitch and
    // v.boat.roll toward scratch.pitch / scratch.roll with k = 1 - Math.exp(-4 * dt). No allocation.
- remotes.ts: right before that remote vehicle's syncVehicleMesh(v, dt) call: `if (v.spec.boat) settleOnWaves(v, dt);`
  plus the import. Nothing else in remotes.ts.
- anim/rideAuto.ts: RideInfo gets optional `sea?: number` (0..1 roughness, waves.ts seaRoughness). In passengerAnim the
  boat line becomes: const sea = r.sea ?? 0; return r.rideT > LONG_RIDE_S * (1 - 0.7 * sea) && h < 0.35 + 0.45 * sea ?
  'seasick' : 'boat-lookout'. (sea 0 = exactly the old behaviour.) createRideAnimator's info literal gets sea: 0.
- player.ts: where rideInfo.boat is set, add `rideInfo.sea = v.spec.boat ? seaRoughness(v.x, v.z) : 0;` and add
  `sea: 0` to the rideInfo literal near the top (~line 64) and the import from './waves'.
- fishing/sim.ts: where s.surface is set from the water at the cast spot (s.surface = w), store the still surface:
  s.surface = w - waveSurfaceOffset(tx, tz). fishing/fishView.ts: when the bobber is on the water (phases 'wait',
  'bite', 'reel'), add waveSurfaceOffset(s.bobX, s.bobZ) to `by`. (Unticked in tests, so both are no-ops there.)
- anim/rideSea.test.ts (new): passengerAnim with sea 0 equals the old rule; with sea 1 a boat passenger at rideT 15 can
  be 'seasick' for some seeds; never seasick when boat false. boatWaves.test.ts (new): settleOnWaves on a fake boat
  vehicle object (cast as Vehicle; only x, z, yaw, spec {radius, boat}, boat {pitch, roll, ...} are read) after
  tickWaveClock and setSeaState('blustery', -1e6) at (-650,-650) moves pitch/roll away from 0 and stays finite.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/anim/ src/fishing/ src/boatWaves.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your files.

## Out of scope
waves.ts, vehicles.ts, app.ts, net.ts, craft/*, everything else in remotes.ts and player.ts.
~~~~

### Issue 1.7: slam effects and prop-out engine sound

~~~~text
Epic: 1 Waves everywhere. Depends on: none (reads BoatState.air / BoatState.slam, which already exist in types.ts and
which another worker's hull change fills; until then they stay undefined and your code must simply do nothing)
(shared Environment + Waves background block)

## Goal
When the player's boat lands off a crest: a splash, a splash sound, a little camera shake, and in blustery seas a fast
big hit costs a little hp. While the hull is airborne the outboard races (prop out of the water).

## Read first
- games/gnome-theft-auto/src/sound/engines.ts: EngineCondition, conditionMix
- games/gnome-theft-auto/src/audio.ts ~line 470-520: EngineOpts, setEngine, playerCond
- games/gnome-theft-auto/src/app.ts ~line 1500-1530: the player-vehicle block with `setEngine(true, ...)`; `fx.waterJet?.`,
  `play('splash')`, `chase.shake?.(x)`, `damageVehicle(v, amount)` and `blowUp(v)` exist in app.ts.
- games/gnome-theft-auto/src/types.ts BoatState (air?, slam?)

## Change
- sound/engines.ts: EngineCondition gets `propOut?: number` (0..1, the boat's prop clear of the water). conditionMix:
  after the existing maths, when p (0..1) = clamp01(c.propOut ?? 0) > 0 and not stalled: pitch *= 1 + 0.18 * p and
  level *= 1 - 0.25 * p. propOut 0 or absent = exactly the old result.
- audio.ts: EngineOpts gets `propOut?: number`; setEngine copies it to playerCond.propOut like hp / waterlog.
- app.ts, in the player-vehicle block, just before `setEngine(true, ...)`:
    const b = v.boat;
    if (b && v.driver === 'player') {
      const slam = b.slam ?? 0;
      if (slam > 2.5) {
        const w = waterAt(v.x, v.z);
        fx.waterJet?.(v.x, (w?.surface ?? v.y) + 0.1, v.z);
        play('splash');
        chase.shake?.(Math.min(0.3, slam * 0.05));
        if (seaState() === 'blustery' && slam > 5 && Math.abs(v.speed) > v.spec.maxSpeed * 0.6) damageVehicle(v, 0.03);
      }
    }
  and pass `propOut: v.boat && (v.boat.air ?? 0) > 0.05 ? 1 : 0` in the setEngine opts object. Imports: seaState from
  './waves' (app.ts already imports from './waves': extend that import line), waterAt if not already imported. Check
  hp scale: if damageVehicle amounts elsewhere in app.ts are much bigger than 1 (hp in points, not 0..1), scale 0.03 to
  the same 3 % of full health. Do not touch anything else in app.ts (other planners edit it).
- sound/enginesProp.test.ts (new): conditionMix with propOut 0 equals without; with propOut 1 the pitch is higher and
  the level lower; stalled ignores propOut.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/sound/ passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in app.ts lines you wrote, engines.ts, audio.ts.

## Out of scope
craft/hull.ts, boats.ts, types.ts, waves.ts and every other file.
~~~~

## Results (Epic 1)

All seven issues done (1.1-1.3 and 1.6 by Haiku workers; 1.4, 1.5 and 1.7 by the planner because the shared
subagent limit was full). Planner follow-ups:

- Shore band: outside a still body, the river ripple gain fades in over 15 m (`SHORE_BAND_M`), so the loch rim, the
  foam ring and river mouths stay still (the worker noted 4 cm rim movement).
- Hull ramp (`WAVE_RAMP` 0.7): the plain spring could never lift a hull off a real wave, so a fast hull climbing a face
  is thrown up at 0.7 x (speed x slope) and keeps it past the crest. A gravy boat at full throttle in a blustery sea
  hops (seen in the browser: `air` 0.01-0.28 s). `MAX_RISE` 2.5 m/s: a hull spawned or dropped deep bobs up instead of
  launching. hullWaves.test.ts (d) now uses the real sea.
- Wakes ride the waves without allocating (each quad keeps its still level, adds `waveSurfaceOffset`).
- Shader: colour shift 1 + 0.18 x hn (exactly 1 with waves off), whitecaps from hn 0.32.
- `?sea=calm|breezy|blustery` forces the sea state (demo / dev; online the host's relayed state still wins).

Checks: tsc clean; waves / shader / options / online / craft / fishing / anim / sound / water / swim / boats /
minigames tests pass (31 files, 227 tests); layout golden passes. Headless Edge (844x390, `?sea=blustery`, gravy boat
at (-640, -640) on Loch Moss): no console errors, the moored boat heaves ~0.4 m and rolls +-0.13 rad, driving it hops
off crests; screenshot shows swell bands and whitecaps.

Perf (`node tools/gta-perf.mjs --cpu 4`, phone 390x844 @2x, same machine, no-HMR server; `&waves=0` vs
`&waves=high&sea=blustery`), first two columns per leg as the tool prints them: Loch Moss 88.2 / 6.9 off vs
92.9 / 11.9 on (render 54.7 vs 62.6 ms); the other legs move both ways by more than that (Turfton 439 vs 317,
Tallgrass 62 vs 48), so the cost is within run-to-run noise. CPU side: 5 uniforms a frame for the mesh, and
waterAt adds one waveHeight call (5 sines plus a bounding-box test per body) only where there is water.
