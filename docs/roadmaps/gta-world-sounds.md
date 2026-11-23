# Gnome Theft Auto: world sounds

Goal: make the world of `games/gnome-theft-auto` sound alive. Other vehicles' engines, horns, sirens, skids and
crashes with 3D falloff; NPC and police gunfire near and far; footsteps by surface; region ambience beds (city hum,
forest birds, tundra wind, desert, farmland, water lapping, crowds) with time-of-day variants; critter calls; world
event stingers; shop bells, doors and splashes. Procedural WebAudio only (no files). A voice budget and distance
culling keep phones smooth. World and Ambience volume sliders in Options. A small API for other modules:
`playAt(id, pos)`, `play2d`, `duck(key)` / `unduck(key)`, `setAmbienceOverride`, `registerSound`.

Everything lives in `games/gnome-theft-auto/src/sound/`. Online: sounds are local per browser, driven by what each
browser already sees (remote players' vehicles are in the same `vehicles` list), so nothing new goes over the wire.

| Epic | Done when | Issues |
| --- | --- | --- |
| 1 Foundation (planner) | `src/sound/` bus, ids, spatial maths, synth helpers, stubs, app/options wiring; build passes | 0 (written by the planner) |
| 2 Sounds | every recipe, the loop pool, ambience, both watchers and the volume UI filled in; `npm test` + build pass | 9, parallel |
| 3 Integration (planner) | review, tune levels, smoke, gta-perf at phone viewport, commit | 0 |

## Epic 1 (done by the planner)

- `src/sound/ids.ts`: sound id lists, `SoundInfo`, `Recipe`, `RecipeTable`.
- `src/sound/spatial.ts` (+ test): `spatial()`, `admit()`, `duckLevel()`.
- `src/sound/synth.ts`: `noise`, `env`, `burst`, `tone`, `voiced`.
- `src/sound/bus.ts`: listener, `playAt`, `play2d`, voice budget (`MAX_VOICES` 14, phones 8), volumes, ducks, override, `registerSound`, `soundStats`.
- `src/sound/index.ts`: public API + `createWorldSound().update(frame)`, called once a frame from `app.ts`.
- `src/sound/testing/fakeAudio.ts` + `src/sound/recipes/recipes.test.ts`.
- Stubs: `recipes/{vehicles,combat,critters,world}.ts`, `loops.ts`, `ambience.ts`, `watchVehicles.ts`, `watchLife.ts`, `volumeUi.ts`.
- `ambulance.ts`: `sirens()`; `options.ts`: `mountSoundOptions(panel)`; `app.ts`: police shots go through `playAt('gun-hoa')`; old `updateAmbient` / `updateTrafficAudio` removed from `audio.ts`.

## Epic 2 issues

Shared text for every Epic 2 issue (pasted into each):

~~~~text
## Environment
- Repo root (a git worktree): C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a5d6718921cceee5e
  Game: games/gnome-theft-auto. Always use absolute paths.
- Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. `npm install` is already done.
- Do NOT commit, push or use git stash. Do not start a dev server. Do not run `npm run build` or `vite build`.
- Eight other workers are editing other files in games/gnome-theft-auto/src/sound/ at the same time. Edit ONLY the
  files listed under Change. `tsc` may briefly report errors in their files; only errors in your files count.
- Sounds are procedural WebAudio only: no audio files, no new dependencies.
- Keep every exported name and signature already in your stub file exactly as it is (others compile against it).

## The world-sound contract (already in the repo)
src/sound/ids.ts:
  export interface SoundInfo { dist: number /* metres from listener, 0 = non-positional */; rand: number /* 0..1 per play */; param: number /* 0..1 caller intensity, default 0.5 */ }
  export type Recipe = (c: AudioContext, out: AudioNode, t: number, info: SoundInfo) => number;
    // Synthesize into `out` from AudioContext time t. Peak gain about 0.5 max. Every source node (oscillator, buffer
    // source) must be started and stopped by t + returned seconds. Returns the duration (0.03..10 s).
  export type RecipeTable<K> = Partial<Record<K, Recipe>>;
src/sound/synth.ts (helpers; each schedules, stops and disconnects its own nodes):
  noise(c): AudioBuffer                                       // shared 1 s white noise
  env(g: GainNode, peak, t, dur, attack = 0.004): void        // attack then exponential decay to silence at t+dur
  burst(c, out, t, dur, type: BiquadFilterType, f0, f1, peak, q = 1, attack = 0.004): void   // filtered noise, filter sweeps f0->f1
  tone(c, out, type: OscillatorType, t, dur, f0, f1, peak, attack = 0.004): void             // oscillator gliding f0->f1
  voiced(c, out, type, t, dur, f0, f1, peak, rate, depth, cutoff = 2400, attack = 0.02): void // tone + vibrato (depth = fraction of f0) + lowpass
src/sound/bus.ts (import from '../sound/bus' or './bus' inside src/sound):
  playAt(id: string, pos: { x: number; z: number }, opts?: { gain?: number; maxDist?: number; param?: number; bus?: 'world' | 'ambience' }): boolean
     // positional one-shot: falloff, pan, distance lowpass, voice budget, per-id minimum gap. Returns false when culled.
  play2d(id: string, opts?: same): boolean    // centred one-shot
  busOut(): { ctx: AudioContext; world: GainNode; ambience: GainNode } | null   // null until audio is unlocked
  getListener(): { x: number; z: number; yaw: number }
  getAmbienceOverride(): BiomeId | 'silent' | null
  get/setWorldVolume(v 0..1), get/setAmbienceVolume(v 0..1)   // saved in localStorage
src/sound/spatial.ts:
  spatial(sx, sz, lx, lz, yaw, maxDist): { gain: number /*0..1*/; pan: number /*-1..1*/; cutoff: number /*Hz*/; dist: number }
Sound ids (src/sound/ids.ts):
  vehicles: crash-light crash-heavy tyre-squeal horn-car horn-truck horn-bike horn-boat horn-hoa siren-whoop backfire engine-start door-slam brake-hiss
  combat:   gun-pistol gun-shotgun gun-hoa explosion ricochet bullet-whiz
  critters: moo baa oink cluck squirrel bear bee-buzz bird-chirp bird-song crow owl gull frog cricket cicada critter-thud
  steps:    step-asphalt step-ice step-snow step-sand step-mud step-grass step-farm step-rock step-dirt step-gravel step-water
  world:    splash-small splash-big shop-bell door-creak cash event-start event-end crowd-cheer crowd-murmur smash-wood smash-glass metal-clang wind-gust water-lap bell-toll
~~~~

### Issue 2.1: vehicle recipes

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
Every vehicle sound id has a recipe in src/sound/recipes/vehicles.ts.

## Read first
- games/gnome-theft-auto/src/sound/ids.ts, synth.ts (the contract above)
- games/gnome-theft-auto/src/audio.ts: playHorn() and its per-kind horns, 'boom', 'bump' (style reference only; do not edit)

## Change
- games/gnome-theft-auto/src/sound/recipes/vehicles.ts: fill `export const VEHICLE_RECIPES: RecipeTable<VehicleSoundId>`
  with one recipe per id. Use synth.ts helpers. Use info.rand for +-8% pitch variation and info.param as intensity.
  - crash-light: thud (sine 120->45 Hz, 0.18 s) + plastic rattle (bandpass noise 1800->600, 0.15 s). ~0.25 s.
  - crash-heavy: deep boom (sine 80->28, 0.5 s) + crunch (lowpass noise 2500->200, 0.45 s) + 3 scattered high clinks
    (highpass noise 4000, 0.04 s at +0.06/+0.13/+0.22). Louder with param. ~0.6 s.
  - tyre-squeal: bandpass noise Q 8 at 1500->1100 Hz plus a faint triangle 900->820 Hz, 0.35 + 0.4*param s.
  - horn-car: two sawtooth notes 440 and 554 Hz through lowpass 1800, 0.28 s (voiced with tiny vibrato).
  - horn-truck: airhorn, sawtooth 115 + 145 Hz, lowpass 700, 0.6 s.
  - horn-bike: bell ding-ding (sine 2100 + triangle 3150, two strikes 0.14 s apart).
  - horn-boat: foghorn: sawtooth 90 Hz + square 92 Hz, lowpass 500, 1.6 s with slow attack (0.12 s).
  - horn-hoa: official two-tone chirp, square 920 then 680 Hz, 0.1 s each.
  - siren-whoop: one police "whoop": sine/triangle sweeping 500->1400->600 Hz over 0.7 s (tone up then tone down).
  - backfire: sharp pop (highpass noise 3000, 0.03 s) + low thump (sine 90->40, 0.12 s).
  - engine-start: starter crank (3 quick square 60->80 Hz pulses) then a rising sawtooth 50->90 Hz, ~0.9 s.
  - door-slam: low thud + latch click (bandpass noise 3500, 0.02 s at +0.05). ~0.2 s.
  - brake-hiss: air-brake hiss, highpass noise 3000 Hz, 0.5 s with a fast attack.

## Contract
`export const VEHICLE_RECIPES: RecipeTable<VehicleSoundId>`: keep the name and type. Import types from '../ids' and
helpers from '../synth'. Exponential ramps must never target 0 or a negative value (use 0.0001 / >= 1 Hz).

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your file)
- cd games/gnome-theft-auto && npx vitest run src/sound/recipes -t vehicles   passes

## Out of scope
Every other file. Do not edit ids.ts, synth.ts, bus.ts, audio.ts or the test.
~~~~

### Issue 2.2: combat recipes

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
NPC/police gunfire and blasts sound right near and far: src/sound/recipes/combat.ts.

## Read first
- games/gnome-theft-auto/src/sound/ids.ts, synth.ts
- games/gnome-theft-auto/src/audio.ts: the 'gunshot', 'shotgun', 'hoa-shot', 'boom' cases of playSfx (style reference)

## Change
- games/gnome-theft-auto/src/sound/recipes/combat.ts: fill `COMBAT_RECIPES` with a recipe for every combat id.
  Distance matters: let far = Math.min(1, info.dist / 150). Near (far < 0.3): crisp crack (highpass noise) + body.
  Far: drop most of the crack, keep a dull thump, and add an echo tail: 2-3 quieter lowpassed copies of the thump at
  +0.18 s, +0.42 s, +0.7 s (each ~0.5x the previous). Return the duration including the tail. Add +-6% pitch with info.rand.
  - gun-pistol: crack (highpass 3000, 0.03 s) + body (sine 140->50, 0.1 s) + echo when far.
  - gun-shotgun: wider blast (lowpass noise 1400->350, 0.25 s) + sine 90->35; longer echo when far.
  - gun-hoa: the HOA sprayer pistol: short "pfft" (bandpass noise 2600, 0.04 s) + triangle 180->65 Hz 0.07 s; echo when far.
  - explosion: big lowpass noise 1800->90 (0.9 s) + sine 70->22 (0.8 s); far adds a rolling rumble (lowpass 300, 1.4 s, slow attack 0.15 s).
  - ricochet: "pyeew": sine 2600->900 Hz over 0.25 s + highpass tick at start.
  - bullet-whiz: bandpass noise Q 4 sweeping 3000->900 Hz over 0.18 s.

## Contract
`export const COMBAT_RECIPES: RecipeTable<CombatSoundId>`: keep name and type. Exponential ramps never to 0.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your file)
- cd games/gnome-theft-auto && npx vitest run src/sound/recipes -t combat   passes

## Out of scope
Every other file.
~~~~

### Issue 2.3: critter recipes

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
Animal and wildlife calls: src/sound/recipes/critters.ts. Cartoonish and garden-scale (the game is about gnomes), soft not shrill.

## Read first
- games/gnome-theft-auto/src/sound/ids.ts, synth.ts

## Change
- games/gnome-theft-auto/src/sound/recipes/critters.ts: fill `CRITTER_RECIPES`, one recipe per critter id.
  info.param: 0.5 = calm call, 1 = alarmed (louder, higher, quicker). info.rand: pitch variation +-10%.
  - moo: sawtooth 140->110 Hz with slow vibrato (voiced, rate 5, depth 0.02, cutoff 900), 0.9 s, slow attack 0.1 s.
  - baa: square ~420 Hz with fast vibrato (rate 18, depth 0.06, cutoff 1800), 0.55 s.
  - oink: two short nasal grunts (sawtooth 190->150 Hz through cutoff 700, 0.12 s each, 0.16 s apart) + a little noise.
  - cluck: 3-4 short clicks (bandpass noise 1200, 0.03 s) with triangle 700->500 blips; alarmed = a longer "bawk".
  - squirrel: rapid chatter: 6-8 tiny sine chirps 2400-3200 Hz, 0.03 s each, 0.05 s apart.
  - bear: low growl: sawtooth 70->55 Hz cutoff 400 with rate 9 vibrato + lowpass noise, 1.1 s.
  - bee-buzz: sawtooth 220 Hz with rate 30 vibrato, cutoff 1200, 0.7 s, slow attack.
  - bird-chirp: 2 quick sine chirps 2200-3200 Hz upward, 0.08 s each.
  - bird-song: a 4-6 note warble (sine, random notes 1800-3600 Hz using info.rand to seed choices), ~1.1 s.
  - crow: "caw" x2: sawtooth 600->480 Hz cutoff 1400 + bandpass noise, 0.25 s each.
  - owl: "hoo-hoo": sine 380->340 Hz, 0.35 s, then 0.25 s pause, 0.5 s.
  - gull: "kyow": triangle 1400->900 Hz with vibrato rate 12, 0.45 s, twice.
  - frog: "ribbit": two square pulses 300->180 Hz cutoff 900, 0.08 s each, with rate 40 vibrato.
  - cricket: 3 pulses of sine 4200 Hz 0.035 s, 0.06 s apart (very quiet, peak 0.15).
  - cicada: buzzing highpass noise 5000 Hz amplitude-tremolo'd (rate 40 via an oscillator into a GainNode's gain), 1.5 s, quiet.
  - critter-thud: soft body fall: sine 110->50 Hz 0.15 s + lowpass noise 800->200 0.12 s.

## Contract
`export const CRITTER_RECIPES: RecipeTable<CritterSoundId>`: keep name and type. Every oscillator you create
yourself (e.g. a tremolo LFO) must be started and stopped by t + returned duration. Exponential ramps never to 0.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your file)
- cd games/gnome-theft-auto && npx vitest run src/sound/recipes -t critters   passes

## Out of scope
Every other file.
~~~~

### Issue 2.4: footstep and world recipes

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
Footsteps on every surface and the world's one-shots: src/sound/recipes/world.ts.

## Read first
- games/gnome-theft-auto/src/sound/ids.ts, synth.ts
- games/gnome-theft-auto/src/surfaces.ts: the SurfaceKind list (asphalt ice snow sand mud grass farm rock dirt gravel water)

## Change
- games/gnome-theft-auto/src/sound/recipes/world.ts: fill `WORLD_RECIPES` with one recipe per step id and world id.
  Footsteps are a clay gnome's small feet: short (0.06-0.15 s), quiet (peak <= 0.3), +-12% pitch from info.rand,
  info.param 0.5 walk, 1 run (louder). Suggested:
  - step-asphalt: hard tap, highpass noise 2500 0.03 s + sine 180->120 0.04 s.
  - step-ice: glassy tick, highpass 4500 0.02 s + sine 1800 0.03 s quiet.
  - step-snow: crunch, bandpass noise 1200->700 Q 2 0.12 s with attack 0.02.
  - step-sand: soft shush, lowpass noise 1400 0.1 s attack 0.02.
  - step-mud: squelch, lowpass noise 600->250 0.12 s + sine 120->70.
  - step-grass: swish, bandpass noise 2500->1600 0.08 s.
  - step-farm: like grass but drier and lower (bandpass 1800->1100).
  - step-rock: knock, sine 240->150 0.05 s + highpass tick.
  - step-dirt: dull pat, lowpass noise 900 0.06 s + sine 140->90.
  - step-gravel: three tiny bandpass clicks 3000-4500 Hz within 0.05 s.
  - step-water: slosh, lowpass noise 1800->500 0.15 s + sine 300->180.
  World:
  - splash-small: lowpass noise 2800->500 0.35 s + sine 280->140 bloop.
  - splash-big: bigger lowpass noise 2000->200 0.9 s + sine 140->50 + 4 delayed droplet blips (sine 900-1500 Hz, 0.04 s) over 0.6 s.
  - shop-bell: shop door bell: two sine partials 1320 + 2640 Hz and 1980, ring 1.2 s, struck twice 0.18 s apart.
  - door-creak: sawtooth 180->260->200 Hz through a bandpass 900 Q 6 with fast vibrato (rate 25 depth 0.05), 0.6 s.
  - cash: cash register "ka-ching": noise clunk + sine 2600 and 3900 bell, 0.6 s.
  - event-start: a bright 3-note rising stinger (triangle C5 E5 G5, 0.12 s apart) + soft noise whoosh.
  - event-end: a 3-note falling or resolving stinger (G5 E5 C6), ending on a longer note.
  - crowd-cheer: many voices: 6-8 sawtooth "ahh"s 200-500 Hz (cutoff 1400, vibrato) + bandpass noise 1500, 1.2 s, slow attack.
  - crowd-murmur: low indistinct chatter: bandpass noise 500 Q 1.5 + 4 random short voiced blips 150-300 Hz, 1.6 s, quiet.
  - smash-wood: crack + splinter (bandpass 1600->300 0.24 s + triangle 160->45).
  - smash-glass: highpass shatter 6000->3500 0.3 s + 5 tinkles (sine 3000-6000 Hz 0.05 s) over 0.4 s.
  - metal-clang: inharmonic ring: sine 520, 1310, 2150 Hz decaying 0.8 s + highpass tick.
  - wind-gust: bandpass noise sweeping 300->900->400 Hz with 0.4 s attack, 2 s total, quiet.
  - water-lap: gentle lap: lowpass noise 700->300 0.4 s attack 0.1 + faint sine 200->150.
  - bell-toll: town clock bell: sine 220 + 440 + 563 + 880 Hz partials, 3 s decay, peak 0.35.

## Contract
`export const WORLD_RECIPES: RecipeTable<StepSoundId | WorldOnlySoundId>`: keep name and type. Exponential ramps never to 0.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your file)
- cd games/gnome-theft-auto && npx vitest run src/sound/recipes -t world   passes

## Out of scope
Every other file.
~~~~

### Issue 2.5: positional loop pool

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
src/sound/loops.ts: a fixed pool of N looping voices that follow the nearest audible sources (other vehicles'
engines, sirens, boat motors, propellers, bee swarms) with falloff and pan. No nodes are created per frame.

## Read first
- games/gnome-theft-auto/src/sound/loops.ts (the stub: keep LoopKind, LoopSource, LoopPool, createLoopPool exactly)
- games/gnome-theft-auto/src/sound/bus.ts: busOut(), getListener()
- games/gnome-theft-auto/src/sound/spatial.ts: spatial()

## Change
- games/gnome-theft-auto/src/sound/loops.ts: implement createLoopPool(size).
  - Voices are created lazily on the first update() where busOut() is non-null (return early while it is null).
    Each voice is one generic synth, built once, connected into busOut().world:
      osc (OscillatorNode) -> oscGain
      noise (AudioBufferSourceNode, buffer = noise(ctx) from '../synth', loop = true) -> noiseFilter (bandpass) -> noiseGain
      oscGain + noiseGain -> lowpass (BiquadFilter, follows spatial().cutoff) -> amp (GainNode) -> panner (StereoPanner if available) -> world
      lfo (OscillatorNode) -> lfoDepth (GainNode) -> osc.frequency   (siren wail / propeller flutter)
    Start all sources once; never stop them; silence by amp gain 0.
  - Each update(sources): compute spatial(s.x, s.z, listener.x, listener.z, listener.yaw, s.maxDist ?? default) for
    every source; drop gain < 0.01; sort by gain descending; take the top `size`. Keep a source on the voice it already
    had (match by key) so it does not jump between voices; give new ones free voices. Unused voices ramp amp to 0.
  - Per kind (level = s.level 0..1), set with setTargetAtTime(..., ctx.currentTime, 0.08); skip a set when the value
    changed by < 1% (cache last values per voice), so a still scene schedules nothing:
      engine:         sawtooth 55 + 70*level Hz, oscGain 1, noise bandpass 400 Hz noiseGain 0.15, peak 0.10, lfo off (depth 0)
      engine-heavy:   sawtooth 38 + 40*level Hz, noise bandpass 250 Hz noiseGain 0.25, peak 0.13
      boat-motor:     square 45 + 50*level Hz, noise bandpass 600 noiseGain 0.4 (water churn), peak 0.10, lfo 6 Hz depth 4 Hz
      propeller:      sawtooth 70 + 70*level Hz, lfo 28 Hz depth 6 Hz, noise bandpass 900 noiseGain 0.3, peak 0.14, default maxDist 220
      siren-police:   triangle, wail: lfo 0.45 Hz depth 350 Hz around 900 Hz base, noiseGain 0, peak 0.09, default maxDist 160
      siren-hoa:      square, fast yelp: lfo 4 Hz depth 250 Hz around 780 Hz, noiseGain 0, peak 0.07, default maxDist 160
      siren-ambulance: sine two-tone: lfo type 'square' 1.2 Hz depth 120 Hz around 700 Hz, peak 0.08, default maxDist 160
      bees:           sawtooth 210 Hz + lfo 30 Hz depth 15 Hz, noise bandpass 1500 noiseGain 0.2, peak 0.05*level, default maxDist 25
    (default maxDist for others: 70). amp target = peak * spatial gain (* level for engines: 0.5 + 0.5*level).
    Changing osc.type / lfo.type only when the kind of the voice changes.
  - active(): number of voices whose current target amp > 0.001.
  - Also export a pure helper `export function assignVoices(prev: readonly (string | null)[], wanted: readonly string[]): (string | null)[]`
    that returns, for each voice index, the key it should play (keep keys already on a voice, fill free voices with the rest
    in order, null for unused). Use it in update(). Add src/sound/loops.test.ts testing assignVoices:
    keeps keys in place, fills free slots, drops keys no longer wanted, never assigns one key twice.

## Contract
Keep exactly: `export type LoopKind`, `export interface LoopSource`, `export interface LoopPool`,
`export function createLoopPool(size: number): LoopPool`. Add `assignVoices` as above.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your files)
- cd games/gnome-theft-auto && npx vitest run src/sound/loops   passes

## Out of scope
Every other file (bus.ts, spatial.ts, synth.ts are read-only for you).
~~~~

### Issue 2.6: region ambience

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
src/sound/ambience.ts: a continuous ambience bed per region that cross-fades as the player moves, with time-of-day
variants and occasional positional spot sounds, all under the Ambience volume.

## Read first
- games/gnome-theft-auto/src/sound/ambience.ts (stub: keep AmbienceFrame, Ambience, createAmbience exactly)
- games/gnome-theft-auto/src/sound/bus.ts: busOut(), playAt(), getAmbienceOverride()
- games/gnome-theft-auto/src/terrain.ts: `waterAt(x, z): { surface: number; depth: number } | null`
- BiomeId (src/types.ts): 'city' | 'desert' | 'forest' | 'tundra' | 'farmland' | 'loch' | 'parkland'

## Change
- games/gnome-theft-auto/src/sound/ambience.ts: implement createAmbience().
  Beds (built lazily once busOut() is non-null; all into busOut().ambience; never recreated; silence = gain 0):
  - Build a small fixed set of LAYERS, each = looping noise (noise() from '../synth', loop true) -> BiquadFilter -> GainNode,
    optionally amplitude-modulated by a slow LFO (OscillatorNode -> GainNode -> layer gain.gain):
      wind:   lowpass 380 Hz (tundra: 700 Hz), slow LFO 0.13 Hz for gusting
      hum:    city traffic/electric hum: lowpass noise 160 Hz + a sawtooth 60 Hz oscillator at low gain, both into this layer
      leaves: bandpass 2500 Hz Q 0.7 with LFO 0.3 Hz (forest/parkland rustle)
      water:  lowpass 500 Hz with LFO 0.25 Hz (lapping near water)
      crowd:  bandpass 700 Hz Q 1.2 with LFO 0.6 Hz (people murmur)
      night:  highpass 5500 Hz, LFO 18 Hz at full depth (insect hiss) for night
  - Target gain per layer from the frame (set with setTargetAtTime(target, now, 1.2) so regions cross-fade over ~3 s;
    skip when changed < 0.002):
      biome mix (day): city hum 0.035 wind 0.01; forest leaves 0.03 wind 0.015; parkland leaves 0.02 wind 0.012;
      tundra wind 0.06; desert wind 0.03 (lowpass lower, 300 Hz); farmland wind 0.018 leaves 0.01; loch wind 0.02 water 0.035.
      night (f.night 0..1): hum x (1 - 0.4*night); 'night' layer = 0.012*night outside city/tundra.
      crowd = min(0.05, f.people * 0.006) in city districts (f.district !== null), else min(0.02, f.people * 0.004).
      water: check waterAt at 8 points on a 14 m ring around (f.x, f.z) plus the centre, at most every 0.5 s;
        water layer = 0.04 * (fraction of points wet) (plus the loch base above).
      airborne (f.airborne): every layer except wind x 0.25; wind x 1.8.
      getAmbienceOverride() === 'silent': every target 0. A BiomeId override: use that biome's mix instead of f.biome.
  - Spot sounds: a timer per biome fires every 3-9 s (random), at a random point 15-45 m from the listener
    (angle random), via playAt(id, { x, z }, { bus: 'ambience' }), choosing by biome and time (f.timeLabel /
    f.night >= 0.5 for night):
      forest/parkland day: 'bird-song' / 'bird-chirp' / sometimes 'crow'; night: 'owl', 'cricket'
      farmland day: 'bird-chirp', sometimes distant 'moo' (gain 0.5), 'crow'; night: 'cricket', 'frog'
      loch: 'gull' by day, 'frog' at night, 'water-lap' when near water
      desert day: 'cicada'; night: 'cricket', rare 'wind-gust'
      tundra: 'wind-gust' (frequent), rare 'crow'
      city day: rare 'horn-car' far away (35-60 m, gain 0.4), 'crowd-murmur' when f.people > 3;
        city 'Neon Night': rare distant 'gun-pistol' at 120-180 m with { maxDist: 220, gain: 0.5 } (about once per 40 s), 'horn-car'
      'Dawn' / 'Morning' outside city: double the bird rate (dawn chorus).
      At 'Noon' when the label first becomes Noon in the city: one 'bell-toll' at (0, 0) (the town clock) with { maxDist: 600 }.
    No spot sounds while airborne or while the override is 'silent'.
  - Export a pure `export function bedMix(biome: BiomeId, night: number, people: number, inDistrict: boolean, wet: number, airborne: boolean): Record<'wind' | 'hum' | 'leaves' | 'water' | 'crowd' | 'night', number>`
    holding the gain table above, and use it in update(). Add src/sound/ambience.test.ts testing bedMix:
    tundra is windier than city, city has hum and forest has leaves, water rises with wet, airborne lowers hum and raises wind,
    all values are finite and >= 0.
- Keep it cheap: no node creation after the first build except through playAt; no allocation-heavy work per frame.

## Contract
Keep exactly: `export interface AmbienceFrame`, `export interface Ambience`, `export function createAmbience(): Ambience`.
Add `bedMix` as above.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your files)
- cd games/gnome-theft-auto && npx vitest run src/sound/ambience   passes

## Out of scope
Every other file.
~~~~

### Issue 2.7: vehicle watcher

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
src/sound/watchVehicles.ts: every frame, look at all vehicles and make the other ones heard: engine/siren loops,
crashes, skids, horns, explosions, splashes, police whoops.

## Read first
- games/gnome-theft-auto/src/sound/watchVehicles.ts (stub: keep VehicleSoundFrame, VehicleSounds, createVehicleSounds exactly)
- games/gnome-theft-auto/src/sound/loops.ts: `createLoopPool(size)`, `LoopSource { key; kind; x; z; level; maxDist? }`,
  LoopKind = 'engine' | 'engine-heavy' | 'boat-motor' | 'propeller' | 'siren-police' | 'siren-hoa' | 'siren-ambulance' | 'bees'
  (another worker is implementing it right now; only use those exported names)
- games/gnome-theft-auto/src/types.ts: `Vehicle` (id, kind, spec {maxSpeed, flies, boat?, name}, x, y, z, yaw, speed,
  driver: 'none' | 'player' | 'npc' | 'remote' | 'police', exploded?, sunk?, boostActive?)

## Change
- games/gnome-theft-auto/src/sound/watchVehicles.ts: implement createVehicleSounds().
  - const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    pool = createLoopPool(COARSE ? 3 : 5).
  - Per-vehicle memory in a Map<number, Mem> keyed by v.id: last speed, last yaw, last exploded, last sunk, last driver,
    skid cooldown, horn cooldown, crash cooldown. Delete entries for ids no longer in f.vehicles (check every ~2 s).
  - Skip f.playerVehicle entirely (audio.ts plays its sounds). Skip vehicles farther than 160 m from (f.playerX, f.playerZ)
    except for explosions.
  - Loop sources (reuse one array, cleared each frame):
      moving vehicles (|speed| > 1 or driver 'npc'/'police'/'remote', not exploded, not sunk, kind !== 'push-bike' and
      kind !== 'tessie'): kind = spec.boat ? 'boat-motor' : spec.flies ? 'propeller' :
      ['combine','hoa-van','mulch-spreader','snail-coach'].includes(kind) ? 'engine-heavy' : 'engine';
      level = min(1, |speed| / spec.maxSpeed); key `v${id}`.
      police: when f.heat >= 1 and v.driver === 'police' add a second source key `s${id}`, kind
      v.kind === 'hoa-van' || v.kind === 'hoa-patrol-boat' ? 'siren-hoa' : 'siren-police', level 1.
      ambulances: each f.ambulances[i] -> key `amb${i}`, kind 'siren-ambulance', level 1.
    pool.update(sources).
  - One-shots via playAt(id, { x: v.x, z: v.z }, { param }) from '../sound/bus' (or './bus'):
      crash: drop = |lastSpeed| - |speed|, decel = drop / dt; if |lastSpeed| > 5 and drop > 4 and decel > 80 and crash cooldown <= 0:
        'crash-heavy' when |lastSpeed| > 14 else 'crash-light', param = min(1, |lastSpeed| / 25); cooldown 0.6 s.
      skid: yawRate = |wrapAngle(yaw - lastYaw)| / dt; if |speed| > 8 and yawRate * |speed| > 18 and skid cooldown <= 0 and
        !spec.flies and !spec.boat: 'tyre-squeal', param min(1, yawRate*|speed|/40); cooldown 1.2 s. Also when
        |lastSpeed| > 10 and decel > 14 and drop <= 4 (hard braking, not a crash): 'tyre-squeal' (same cooldown); heavy kinds use 'brake-hiss'.
      explosion: exploded false -> true: 'explosion' (any distance; playAt culls).
      sink: sunk false -> true: 'splash-big'.
      police arrival: a vehicle whose driver becomes 'police' (or first seen with driver 'police') while f.heat >= 1:
        'siren-whoop'.
      NPC horns: for driver 'npc' ground vehicles within 25 m of the player, when the player is within 7 m roughly ahead
        of it (dot of its forward (sin yaw, cos yaw) with the direction to the player > 0.7) and its |speed| < 3 (stuck
        behind the player), horn with probability so it honks about every 2-4 s, horn cooldown 2.5 s:
        horn id by kind: 'push-bike' -> 'horn-bike'; boats -> 'horn-boat'; 'combine' | 'mulch-spreader' | 'snail-coach' -> 'horn-truck';
        'hoa-van' -> 'horn-hoa'; else 'horn-car'. Also a rare random honk (1 in ~40 s per vehicle) for moving npc cars within 60 m.
      backfire: rare (1 in ~90 s per moving npc ground vehicle within 50 m) 'backfire'.
      engine-start: driver 'none' -> 'npc' or 'police' or 'remote' (someone got in): 'engine-start' (and 'door-slam' 0.1 s before it is fine to skip).
  - Export pure helpers used by update() and test them in src/sound/watchVehicles.test.ts:
      `export function wrapAngle(a: number): number` (to -PI..PI)
      `export function crashKind(lastSpeed: number, speed: number, dt: number): 'crash-heavy' | 'crash-light' | null`
      `export function hornFor(kind: VehicleKind, boat: boolean): 'horn-car' | 'horn-truck' | 'horn-bike' | 'horn-boat' | 'horn-hoa'`
      `export function loopKindFor(v: Pick<Vehicle, 'kind' | 'spec'>): LoopKind | null` (null for push-bike and tessie)
    Tests: crashKind(20, 2, 1/60) is heavy, (8, 0, 1/60) light, (20, 19, 1/60) null, (3, 0, 1/60) null; hornFor; wrapAngle;
    loopKindFor for a plane (spec.flies) is 'propeller' and a boat is 'boat-motor'.
  - Keep it allocation-light: no new arrays/objects per vehicle per frame beyond the reused source objects.

## Contract
Keep exactly: `export interface VehicleSoundFrame`, `export interface VehicleSounds`, `export function createVehicleSounds(): VehicleSounds`.
Use only `playAt` from './bus' and `createLoopPool` / `LoopKind` / `LoopSource` from './loops'.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your files)
- cd games/gnome-theft-auto && npx vitest run src/sound/watchVehicles   passes

## Out of scope
Every other file. Do not edit app.ts, loops.ts, bus.ts, types.ts.
~~~~

### Issue 2.8: life watcher

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
src/sound/watchLife.ts: footsteps by surface (player and nearby gnomes), water splashes, critter calls and alarm
calls, world event stingers.

## Read first
- games/gnome-theft-auto/src/sound/watchLife.ts (stub: keep LifeSoundFrame, LifeSounds, createLifeSounds exactly)
- games/gnome-theft-auto/src/surfaces.ts: `surfaceAt(x, z, world): SurfaceSpec` (.kind is a SurfaceKind:
  asphalt ice snow sand mud grass farm rock dirt gravel water). It is not free: call it only when a step lands.
- games/gnome-theft-auto/src/swim.ts: `swimState(x, y, z): 'dry' | 'wade' | 'bob'`
- games/gnome-theft-auto/src/critters.ts: `Critter` (id, kind: 'cow' | 'sheep' | 'pig' | 'hen' | 'squirrel' | 'polar-bear' | 'bee',
  x, z, speed, mode: 'idle' | 'wander' | 'flee' | 'chase' | 'down' | 'script'). Read-only: never write to a critter.
- games/gnome-theft-auto/src/types.ts: `Npc` (id, x, z, state: 'walk' | 'idle' | 'flee' | 'ragdoll')

## Change
- games/gnome-theft-auto/src/sound/watchLife.ts: implement createLifeSounds(). Use playAt / play2d from './bus'.
  - Player footsteps: when f.player.onFoot && f.player.grounded && !airborne, accumulate horizontal distance moved
    (from last frame's x/z; ignore jumps > 5 m, i.e. teleports). Every STRIDE = 0.85 m play `step-${kind}` at the player,
    kind = swimState(...) === 'wade' ? 'water' : surfaceAt(x, z, f.world).kind; param = speed > 6 m/s ? 1 : 0.5.
    (speed = distance / dt.) The step ids are `step-${SurfaceKind}`.
  - Splashes: player swimState changes dry -> 'wade' or 'bob': 'splash-small' (bob from a fall: speed or |dy|/dt > 6 -> 'splash-big').
    'bob' -> 'dry' climb-out: 'step-water' param 1.
  - Gnome footsteps: every 0.15 s pick at most 2 nearest Npcs within 14 m in state 'walk' or 'flee'; each has its own
    stride timer (0.42 s walk, 0.26 s flee) in a Map<number, number> keyed by npc id; play `step-${surfaceAt(npc).kind}`
    at the npc with { gain: 0.5 }. Clean the map of ids not seen for 5 s.
  - Critters: for critters within 45 m (check at most every 0.25 s; keep per-critter timers in a Map<number, ...>):
      calm call every 6-16 s (random per critter) when mode is idle/wander: cow 'moo', sheep 'baa', pig 'oink', hen 'cluck',
        squirrel 'squirrel', polar-bear 'bear' (every 15-30 s), bee 'bee-buzz' (every 2-4 s, only within 15 m).
      mode becomes 'flee' or 'chase' (transition): the same call with param 1 (alarmed), bee -> 'bee-buzz' param 1.
      mode becomes 'down': 'critter-thud'.
      At night (f.night >= 0.6) cows/sheep/hens call half as often.
  - World events: f.eventKind changes null -> kind: play2d('event-start'); kind -> null: play2d('event-end').
    Kind 'hoa-raid' starting also plays play2d('horn-hoa').
  - Export pure helpers and test them in src/sound/watchLife.test.ts:
      `export function critterCall(kind: CritterKind): CritterSoundId` (cow->moo ... bee->bee-buzz, polar-bear->bear)
      `export function stepId(kind: SurfaceKind): StepSoundId`
      `export function strideSteps(carry: number, moved: number, stride: number): { steps: number; carry: number }`
        (how many steps land when moving `moved` metres with `carry` metres left over from before)
    Tests: critterCall for every kind; stepId('snow') === 'step-snow'; strideSteps(0.5, 0.5, 0.85) -> 1 step, carry 0.15;
    strideSteps(0, 0.3, 0.85) -> 0 steps, carry 0.3.
  - Keep it cheap: reuse Maps, no per-frame arrays of all critters; skip everything when the list is empty.

## Contract
Keep exactly: `export interface LifeSoundFrame`, `export interface LifeSounds`, `export function createLifeSounds(): LifeSounds`.
Types: `CritterKind` from '../critters', `SurfaceKind` from '../surfaces', `CritterSoundId`, `StepSoundId` from './ids'.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your files)
- cd games/gnome-theft-auto && npx vitest run src/sound/watchLife   passes

## Out of scope
Every other file. Do not edit critters.ts, app.ts, bus.ts.
~~~~

### Issue 2.9: Sound section in Options

~~~~text
Epic: 2 Sounds
Depends on: none
(+ the shared Environment and contract text)

## Goal
src/sound/volumeUi.ts: a "Sound" section in the Options panel with World sounds and Ambience volume sliders,
touch-friendly (44 px tall targets), saving through the bus.

## Read first
- games/gnome-theft-auto/src/sound/volumeUi.ts (stub: keep `export function mountSoundOptions(panel: HTMLElement): void`)
- games/gnome-theft-auto/src/options.ts: how sections are built (a `div.gta-opt-note` with fontWeight 700 as the heading,
  then content), the CSS under `#gta-options`, and where `mountSoundOptions(panel)` is already called. Read only; do not edit.
- games/gnome-theft-auto/src/sound/bus.ts: getWorldVolume, setWorldVolume, getAmbienceVolume, setAmbienceVolume

## Change
- games/gnome-theft-auto/src/sound/volumeUi.ts: implement mountSoundOptions(panel):
  - heading div class 'gta-opt-note', style fontWeight '700', text 'Sound'.
  - two rows, each a <label> holding the name ('World sounds' / 'Ambience'), the percentage, and an
    <input type="range" min="0" max="100" step="5">. Value = Math.round(get*Volume() * 100). On 'input': set*Volume(value / 100)
    and update the percentage text. Row min-height 44px; the range input width 100%, height 32px, accent-color #ffd23f.
  - a note div class 'gta-opt-note': 'World: other vehicles, gunfire, animals, footsteps. Ambience: wind, birds, city hum, water. M mutes everything.'
  - Inject one <style> element (id 'gta-sound-style', only once) with the row styles, scoped under '#gta-options .gta-snd-row'.
  - stopPropagation on 'keydown' of the inputs (so arrow keys don't drive the gnome).
  - Append everything to `panel` in this order: heading, world row, ambience row, note.
  - Give each input an aria-label ('World sounds volume', 'Ambience volume').

## Contract
`export function mountSoundOptions(panel: HTMLElement): void`. Import only from './bus'.

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit -p .   (no errors in your file)

## Out of scope
options.ts and every other file.
~~~~
