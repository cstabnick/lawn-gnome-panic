# Gnome Theft Auto: cutscene engine

Goal: scenes as data. A `SceneScript` (games/gnome-theft-auto/src/cutscene/script.ts) stages a scene in an off-map
room or in the real world, with actors that walk, turn, gesture, hold and hand over props, get in and out of real game
vehicles (mount.ts), vehicles that drive along splines, camera moves (cut, dolly, orbit, follow, track, shake), audio
cues (music with crossfades, ambience, stingers, SFX, radio ducking), triggers back into quest state, and typewriter
dialogue at the player's text speed. A line-of-sight and collision check validates every shot and path (vitest and
`?cutscenecheck`), and the first-time intro flyover is rebuilt on it so every shot passes.

Status: done (all three epics). Planner fixes after review: camera framing in the example scenes, a
`camera-in-actor` check, quest scene triggers as a `gta:cutscene-trigger` window event, a 30 s vitest timeout.

Online: cutscenes are local to each browser (a quest scene plays for the player who took the quest); nothing is relayed.

| Epic | Done when | Issues |
| --- | --- | --- |
| 1 Foundation (planner) | `script.ts` types, `cast.ts` (presets moved out of quests/cutscene.ts), `textSpeed.ts`, stubs for every module; tsc passes | 0 (written by the planner) |
| 2 Modules | timeline, LOS, subtitles + Options, cue audio, actors, scene vehicles, rooms extraction; build + tests pass | 7 |
| 3 Integration | director, cutscene.ts / quests / app wiring with `?cutscene=<id>`, check.ts + `?cutscenecheck`, intro on the timeline and passing, example scenes | 5 |
| 4 Finish (planner) | authoring guide, review, smoke, demo GIFs, commit | 0 |

Files (all under games/gnome-theft-auto/src/cutscene/ unless noted):

| File | Owner |
| --- | --- |
| script.ts, cast.ts, textSpeed.ts, scenes/index.ts | Epic 1 (planner) |
| timeline.ts, timeline.test.ts | 2A |
| los.ts, los.test.ts | 2B |
| subtitles.ts, ../options.ts | 2C |
| cueAudio.ts | 2D |
| actors.ts, actors.test.ts | 2E |
| sceneVehicles.ts | 2F |
| rooms.ts, ../quests/cutscene.ts | 2G |
| director.ts | 3A |
| ../quests/cutscene.ts, ../quests/types.ts, ../quests/quests.ts, ../app.ts, legacy.ts | 3B |
| check.ts, cutscenes.test.ts, checkStage.ts | 3C |
| ../introTour.ts, intro.ts, intro.test.ts | 3D |
| scenes/*.ts (example scenes), ../../demos/cutscene-*.json | 3E |

## Epic 2 issues

The common environment block (pasted into every issue):

~~~~text
## Environment
- Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a2f9bbc8ec58532c6 (a git worktree; run
  everything from here, never cd elsewhere). Windows, Git Bash. If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
- npm install has been run. Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187, vitest).
- Type-check: npx tsc --noEmit -p games/gnome-theft-auto . Single test file: (cd games/gnome-theft-auto && npx vitest run src/cutscene/<file>.test.ts).
  Do NOT run vite build or start a dev server. Some unrelated world-building tests time out on this busy machine; ignore those.
- Other workers are editing other files of this game at the same time. Change only the files this issue names. Keep
  every exported signature of a stub exactly as it is (other workers compile against it).
- Do not commit. Comments: short, plain, say what the code does.
- The format types are in games/gnome-theft-auto/src/cutscene/script.ts: read it first, it is the contract.
~~~~

~~~~text
Epic: 2 Modules — Issue 2A: timeline.ts (compile + sample a SceneScript)
Depends on: none

(Environment block above.)

## Goal
games/gnome-theft-auto/src/cutscene/timeline.ts turns a SceneScript into timed steps and samples any moment into a
SceneFrame, purely (no three.js, no DOM). Plus timeline.test.ts.

## Read first
- src/cutscene/script.ts: every type (Step, CamShot, Timeline, TimedStep, SceneFrame, ActorSample, VehicleSample, ScenePath, StageEnv, LineTiming).
- src/cutscene/timeline.ts: the stub; keep all exported names and signatures (compile, sampleFrame, eventsBetween, scenePaths, targetPoint, DEFAULT_FOV, WALK_SPEED, RUN_SPEED).
- src/cutscene/cast.ts: castOf(actor, { room }) gives scale and held prop.
- src/cutscene/textSpeed.ts: lineTiming().

## Change
src/cutscene/timeline.ts. You may import: './script' types, './cast' (castOf), './textSpeed', '../config' (VEHICLES:
Record<VehicleKind, VehicleSpec> with spec.radius, spec.seat). Nothing else (no three, no terrain).

compile(script, timing = lineTiming()):
- Walk script.steps with a cursor (starts at 0). Each step gets start = cursor and a dur; then cursor += dur unless the
  step does not block. Non-blocking: any step with async: true; 'cam' unless wait: true; 'shake'. Instant steps have dur 0.
- 'parallel': each track is compiled the same way starting at the parallel's start; the parallel's dur = latest track
  end - start. Push the parallel step itself first, then its children (order = push order, 0,1,2...).
- Durations: wait s; say: typeDur = Number.isFinite(cps) ? text.length / cps : 0, dur = typeDur + timing.holdSeconds(text),
  gate true, set TimedStep.typeDur; walk: path length (horizontal, from the actor's position when the step starts) /
  (speed ?? (run ? RUN_SPEED : WALK_SPEED)); face: s ?? 0.4; gesture: s ?? 1.2 ('sit'/'stand': s ?? 0.6); give: s ?? 1;
  enter: s ?? 2.6, gate true; exit: s ?? 2.2, gate true; drive: length of the (spline) path / speed; cam: the shot's s
  for 'dolly'/'orbit', else 0; shake: s; fade: s; everything else 0. gate is false except say/enter/exit.
- To know where a walk or drive starts, track each actor's and vehicle's position while compiling (in push order): start
  from the script's `at`; a walk ends at its last point; a drive ends at its last point; spawn with `at` moves it; exit
  puts the actor at the exit point (below).
- steps sorted by start, then order. duration = max(start + dur) (0 if none).

Positions: a Point [x, z] gets y from env (actors: env.ground(x, z); vehicles: env.vehicleGround?.(kind, x, z) ??
env.ground(x, z)); [x, y, z] is exact. Yaw convention: forward = (sin yaw, 0, cos yaw); the yaw facing from a to b is
Math.atan2(bx - ax, bz - az).

Spline for drive (spline !== false): uniform Catmull-Rom through [start, ...path] (duplicate the end points as the
outer control points), densified to points about 0.25 m apart; else straight segments. Walks use straight segments.
Measure by arc length. Drive progress p over u = (t - start) / dur in [0, 1]: depart && arrive (both default true):
u*u*(3-2u); depart only: u*u; arrive only: 1-(1-u)*(1-u); neither: u. speed = path length * dp/du / dur (0 outside the
step); yaw from the path direction at that point; steer = clamp(yawRate / 1.5, -1, 1) where yawRate is the yaw change per
second along the path (estimate from a point 0.5 m ahead); driving true while start <= t < start + dur.

sampleFrame(tl, t, env): start from the script's defs, then apply every step with start <= t in timeline order:
- Actor initial state: x/y/z from `at`, yaw ?? 0, visible = !hidden, held = castOf(def, { room }).held (room =
  script.stage.kind === 'room'), head = 0.9 * castOf(...).scale, seatedIn = def.seatedIn ?? null, seat = def.seat ?? 0,
  speed 0, gesture null, sitting false, talking false, mount null.
- Vehicle initial: at, yaw ?? 0, visible = !hidden, headlights = !!def.headlights, speed 0, steer 0, driving false.
  Prop initial: at, yaw, visible = !hidden.
- spawn: visible true, and position/yaw if given. despawn: visible false. (Ids may name an actor, vehicle or prop.)
- walk: along [current position, ...path], progress (t-start)/dur clamped; yaw along the current segment; speed = path
  length / dur while t < start + dur, else 0.
- face: target yaw = yaw, or towards `at` (an id's current x/z, or [x, z]); turn by the shortest angle, linearly over s.
- gesture: while t < start + dur: gesture = name, gestureT = t - start. 'sit' sets sitting = true, 'stand' sets false (at start).
- hold: held = prop. give: from t >= start + dur / 2: to.held = prop ?? from's held, from.held = null; while it runs
  both have gesture 'point'.
- enter: while running: mount = { vehicle, mode: 'enter', t: t - start, dur }, position lerped from the start position
  to the vehicle's; after: seatedIn = vehicle, seat = step.seat ?? 0, mount null.
- exit: while running: mount = { vehicle: seatedIn, mode: 'exit', ... }; after: seatedIn = null, position = exit point
  of that vehicle: d = VEHICLES[kind].radius + 0.8, x = vx + cos(vyaw) * d, z = vz - sin(vyaw) * d, y = env.ground, yaw = vehicle yaw.
- A seated actor (seatedIn set) takes its vehicle's x/y/z/yaw each frame (the director moves the model to the seat).
- drive: as above. lights: headlights = on. horn: nothing (an event only).
- say: while start <= t < start + dur: frame.say = { step: index in tl.steps, who, text, shown, typing } with
  shown = cps finite ? min(len, floor((t - start) * cps)) : len and typing = shown < len; the actor with id `who` (if
  any) has talking = typing.
- title / caption: the latest value (script.title is the initial title). fade: lerp from the previous fade value to `to`
  over s (initial 0).
- shake: while running, camera.shake += amp * (1 - (t - start) / s).
- Camera: the latest 'cam' step with start <= t (step = its index); before any: pos [0, 1.6, 4], look [0, 1, 0], step -1.
  cut: pos, look = targetPoint(look). dolly: u = clamp((t-start)/s), eased u*u*(3-2u) unless ease 'linear'; pos lerp
  from/to; look lerp between targetPoint(look) and targetPoint(lookTo ?? look); fov lerp fov ?? 52 .. fovTo ?? fov ?? 52.
  orbit: c = targetPoint(around); a = fromYaw + (toYaw - fromYaw) * clamp(u); pos = c + [sin a * radius, height,
  cos a * radius]; look = c. follow: o = who's pose (actor or vehicle x/y/z/yaw); with forward f = (sin yaw, 0, cos yaw),
  right r = (-cos yaw, 0, sin yaw): pos = o + r*off[0] + up*off[1] + f*off[2] (offset default [0, 2.2, -5.5]); look = o +
  same with look default [0, 1, 3]; lag is ignored here (the director smooths). track: pos fixed, look = targetPoint(who).
  fov = shot fov ?? DEFAULT_FOV. target = the id in look / around / who when it is a string, else null.
  If a target id is unknown or hidden, use its last known point, else [0, 1, 0].
targetPoint(frame, target): Vec3 as is; actor id -> [x, y + head, z]; vehicle id -> [x, y + 0.8, z]; prop -> [x, y + 0.3, z];
hidden or unknown -> null.
eventsBetween(tl, from, to): steps with from <= start < to, in tl.steps order (keep the stub's body if it already does).
scenePaths(tl, env): one ScenePath per walk step (who, kind 'walk', points from its start position along the path) and per
drive step (who = vehicle id, kind 'drive', vehicleKind, spline points); points about every 0.5 m, y from env as above
(vehicle points keep a given y).

src/cutscene/timeline.test.ts (vitest, import { describe, it, expect } from 'vitest'): a fixed timing
{ charsPerSecond: 10, holdSeconds: () => 1 } and env { ground: () => 0 }. Cover: sequential starts; async; cam not
blocking; parallel duration; say dur and shown/typing halfway; walk position halfway and yaw; enter then seated actor
moving with a driven vehicle; drive arrive/depart speed 0 at both ends and > 0 mid; follow camera behind a vehicle with
yaw PI/2 (vehicle at [0,0,0] yaw PI/2, default offset: pos ≈ [-5.5, 2.2, 0]); orbit at u = 0; eventsBetween; scenePaths
point spacing <= 0.6.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/cutscene/timeline.test.ts) passes.

## Out of scope
Every other file. No three.js or DOM in timeline.ts.
~~~~

~~~~text
Epic: 2 Modules — Issue 2B: los.ts (line-of-sight and collision checks)
Depends on: none

(Environment block above.)

## Goal
games/gnome-theft-auto/src/cutscene/los.ts implements its stub: segment and point tests against collider boxes and the
ground, and per-frame / per-path cutscene checks. Plus los.test.ts.

## Read first
- src/cutscene/los.ts: the stub. Keep every exported name, type and signature (LosWorld, LosIssueKind, LosIssue,
  LosOptions, segmentHit, pointBlocked, checkFrame, checkPath).
- src/cutscene/script.ts: SceneFrame (camera, actors, vehicles, say), ScenePath, Vec3.
- src/collide.ts: insideBox(x, y, z, boxes) (point inside a box taller than y), pushOutOfBoxes(x, z, r, boxes, y)
  (.hit = the circle overlaps a box whose top h > y), groundHeight(x, z, r, boxes, maxY) (highest walk-on surface:
  terrain or a box top at or below maxY + 0.35; NOTE it calls terrain heightAt for the terrain part: in los.ts use
  Math.max(w.ground(x, z), groundHeight(...)) only for box tops, see below). All are grid accelerated: use them, never
  loop over all boxes yourself (the world has thousands).
- src/types.ts: Box { minX, maxX, minZ, maxZ, h } (solid from the ground up to h).
- src/config.ts: VEHICLES[kind] with radius, boat, flies.

## Change
src/cutscene/los.ts:
- segmentHit(a, b, w, { stepM = 0.25 }): march n = max(1, ceil(len / stepM)) points at frac = i / n for i = 1..n;
  the first point that is below w.ground(x, z) -> { by: 'terrain' }, or inside a box (insideBox(x, y, z, w.boxes)) ->
  { by: 'box' }; returns { point, by, frac } or null.
- pointBlocked(p, w, margin = 0): 'terrain' if p.y < w.ground(p.x, p.z) + margin, or (w.water and p.y < water + 0.1);
  'box' if (margin > 0 ? pushOutOfBoxes(p.x, p.z, margin, w.boxes, p.y).hit : insideBox(...)); else null.
- checkFrame(frame, w, opts): defaults cameraMargin 0.3, targetSlack 0.6, groundTolerance 0.25, actorRadius 0.3.
  - Camera: pointBlocked(camera.pos, w, cameraMargin) -> 'camera-inside' (box) / 'camera-underground' (terrain or water).
  - Aim: the target point = camera.target's head/centre (actor: [x, y + head, z]; vehicle: [x, y + 0.8, z]; if the id
    is not a visible actor/vehicle, use camera.look). segmentHit(camera.pos, target); a hit farther than targetSlack
    from the target -> 'target-hidden' (who = camera.target).
  - The speaker: if frame.say and frame.actors[frame.say.who] is visible and it is not the camera target, the same
    test to its head -> 'target-hidden' with who.
  - Each visible actor that is not seated (seatedIn null) and not mounting (mount null): floor = max(w.ground(x, z),
    groundHeight(x, z, 0.2, w.boxes, y)) ; y - floor > groundTolerance -> 'actor-floating'; floor - y > groundTolerance
    -> 'actor-buried'; pushOutOfBoxes(x, z, actorRadius, w.boxes, y + 0.05).hit -> 'actor-in-wall'.
  - Each visible vehicle by VEHICLES[kind]: boat: w.water missing or w.water(x, z) === null -> 'boat-off-water';
    flies: skip; ground: floor as above (r = 0.5); |y - floor| > 0.4 -> 'vehicle-off-ground'; w.water(x, z) = s with
    s - floor > 0.5 -> 'vehicle-off-ground' ("in deep water").
  - t = frame.t, step = camera.step for camera issues, -1 otherwise; at = the point; detail = a short readable sentence
    with rounded numbers, e.g. "camera inside a box at (12.3, 4.0, -8.1)".
- checkPath(path, w, opts): along path.points; walk: pushOutOfBoxes(x, z, actorRadius, boxes, y + 0.05).hit ->
  'path-blocked'; water surface - ground > 0.6 -> 'path-off-ground'. drive: spec = VEHICLES[path.vehicleKind]; r =
  spec.radius * 0.8; flies: pushOutOfBoxes(x, z, r, boxes, y).hit -> 'path-blocked'; boat: water null ->
  'boat-off-water'; ground: pushOutOfBoxes(x, z, r, boxes, y + 0.3).hit -> 'path-blocked', water - ground > 0.5 ->
  'path-off-ground'. Report one issue per run of consecutive bad points (the first point of the run), t = -1,
  step = path.step, who = path.who.

src/cutscene/los.test.ts: synthetic world { boxes: [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1, h: 3 }], ground: () => 0 }.
Note collide.ts caches its grid per boxes array object: build each test's boxes array once and reuse it. Tests: segment
through the box hits 'box'; over it (y 4) is clear; into the ground hits 'terrain'; pointBlocked with margin near the
wall; a hand-built SceneFrame (fill every field of SceneFrame/CameraSample/ActorSample yourself) with the camera inside
the box -> 'camera-inside'; a box between camera and actor -> 'target-hidden'; actor at y 1 on open ground ->
'actor-floating'; actor standing on top of the box (y 3) is fine; a walk path through the box -> exactly one
'path-blocked'; a 'walnut-dinghy' drive path with water () => null -> 'boat-off-water'.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/cutscene/los.test.ts) passes.

## Out of scope
Every other file (timeline.ts is someone else's: do not import it).
~~~~

~~~~text
Epic: 2 Modules — Issue 2C: typewriter subtitles + the Text speed option
Depends on: none

(Environment block above.)

## Goal
src/cutscene/subtitles.ts builds the dialogue card that types a line out letter by letter with mutter blips, and
Options (src/options.ts) gains a persisted "Text speed" setting.

## Read first
- src/cutscene/subtitles.ts: the stub; keep the exported names and signatures (SubtitleLine, Subtitles, createSubtitles).
- src/cutscene/textSpeed.ts: TextSpeed, TEXT_SPEEDS, getTextSpeed, setTextSpeed (already written; use as is).
- src/quests/cutscene.ts lines ~150-215 (subBox, subHead, subSpeaker, subBadge, subText, nextBtn, skipBtn): copy that
  look (inline cssText) for the card.
- packages/mutter/src/index.ts: Mutter.say(text, hz, { maxLetters }) returns seconds; stop().
- src/options.ts: the "Radio" section (radioHead / radioList / radioBtn / paintRadio / buttons.set('radio-text', ...)) is the pattern.

## Change
- src/cutscene/subtitles.ts createSubtitles(parent, voice, handlers, opts):
  - A card div appended to parent (position:absolute, bottom: calc(11vh + max(10px, env(safe-area-inset-bottom))),
    left/right max(12px, env(safe-area-inset-left/right)), max-width 720px, centred), hidden until show(). Speaker
    name (gold #ffd23f), icon badge, text, and an actions row with Next (shows 'Done ▶' when last) and Skip ▶▶ buttons
    (min-height 44px, min-width 96px, touch-action:manipulation). Skip is hidden when opts.skippable === false.
  - Next button pointerdown and a pointerdown anywhere on the card -> e.stopPropagation(); handlers.onNext().
    Skip pointerdown -> stopPropagation; handlers.onSkip().
  - The text element holds two spans: the typed part and the rest with visibility:hidden (so the card does not change
    size while typing). reveal(n) clamps n to [0, length] and updates the spans only when n changed.
  - Voice: when reveal moves past the first letter of a word (a letter at index 0 or after whitespace), call
    voice.stop() then voice.say(thatWord, line.hz, { maxLetters: 4 }) (the word = letters up to the next whitespace).
    If one reveal call uncovers more than 12 characters (an instant reveal or a tap to finish), speak only the first
    new word.
  - show(line, last) resets to 0 shown, sets the label, icon and text, shows the card. hide() hides it and calls
    voice.stop(). destroy() removes it.
- src/options.ts: after the Radio section, a "Dialogue" section in the same pattern: a heading div
  ('gta-opt-note', bold, text 'Dialogue') and one 'gta-opt-mode' button that reads
  `Text speed: ${label}<small>How fast cutscene lines type out. Tap a line to finish it; tap again for the next.</small>`
  with label Slow / Normal / Fast / Instant from getTextSpeed(); a click goes to the next of TEXT_SPEEDS (wrapping) with
  setTextSpeed and repaints. Register it with buttons.set('text-speed', btn) so the gamepad can reach it. Import from
  './cutscene/textSpeed'. Change nothing else in options.ts (other people edit it too: keep the diff small).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- Reading the code: the card's buttons are at least 44 px tall; no hover-only UI.

## Out of scope
Every other file. Do not touch quests/cutscene.ts (another worker moves code out of it now).
~~~~

~~~~text
Epic: 2 Modules — Issue 2D: cueAudio.ts (procedural cutscene music, ambience, stingers, SFX, radio duck)
Depends on: none

(Environment block above.)

## Goal
src/cutscene/cueAudio.ts implements its stub with WebAudio only (no files): music loops that crossfade, ambience beds,
stingers, extra SFX, engine hums, and ducking of the Turfton FM radio.

## Read first
- src/cutscene/cueAudio.ts: the stub; keep exported names and signatures (EngineVoice, CueAudio, createCueAudio).
- src/cutscene/script.ts: MusicTrack, AmbienceBed, Stinger, CueSfx.
- src/audio.ts lines 1-140: getAudioOutput() -> { ctx, master, muted } | null (null until the player has interacted);
  play(s: Sfx); how noise buffers, tone() and decay envelopes are built (copy the style, do not export anything new from
  audio.ts and do not edit it: another worker is changing it).
- packages/music/src/engine.ts: setMusicVolume(gain 0..1) (exported from '@lawn/music'): the radio's music level.

## Change
src/cutscene/cueAudio.ts, createCueAudio():
- Get the output lazily on every call: const out = getAudioOutput(); if null, the call does nothing (music/ambience
  remember the wanted state and start on the next call that finds a context). Route everything through one cue
  GainNode (level 0.9) connected to out.master, so the game's M mute applies.
- music(track, fade = 1.5): each track is a GainNode with its own voices; switching ramps the old one to 0 over fade
  (linearRampToValueAtTime) and stops/disconnects it after, the new one ramps 0 -> its level. Same track again: no-op.
  null: fade out. Voices: a chord pad (2-3 detuned 'sawtooth'/'triangle' oscillators per note through a lowpass
  BiquadFilter ~1200 Hz), plus a simple bass note per chord and, for some tracks, an arpeggio, scheduled ahead with a
  setInterval(…, 100) look-ahead scheduler (schedule notes up to 0.3 s ahead using ctx.currentTime). A 4-chord loop
  per track, 2 s per chord unless noted: tension (A minor, low pulsing bass on 8ths, 1.6 s chords), warm (C major
  I-vi-IV-V, soft triangles), heist (D minor with a walking bass, swung arpeggio), sad (F major / D minor slow 2.6 s,
  no bass pulse), triumph (C major I-IV-V-I with a bright arpeggio), mystery (E minor with a raised 4th, sparse
  triangle bell notes), chase (fast 1 s chords, driving bass 16ths). Levels about 0.12-0.18.
- ambience(bed, fade = 2): looped noise (an AudioBufferSourceNode with loop = true over a 2 s white-noise buffer)
  through filters, crossfading like music: room (lowpass 300 Hz, very quiet hum), street (bandpass 600 Hz plus a
  slow LFO on gain), forest (highpass 2500 Hz gentle, plus a random bird chirp every 2-6 s: a sine sweep 2.5-4 kHz),
  wind (bandpass 400 Hz with a slow LFO on frequency), night (crickets: a 4.5 kHz square pulsed by an LFO, quiet),
  crowd (bandpass 900 Hz, some modulation), water (lowpass 700 Hz with LFO), rain (highpass 1500 Hz, steadier).
- sfx(id, { pan = 0, gain = 1 }): if id is a game Sfx (this list: 'squirt','crack','steal','door','alarm','whistle',
  'washed','bump','gunshot','shotgun','reload','chute','handbrake','handbrake-release','boom','boost','stunt','splash',
  'shutter','smash','drink','hoa-shot','gnome-hit','player-crack') call play(id) from '../audio'; else synthesize
  through a StereoPannerNode: footsteps (4 soft noise ticks 0.25 s apart), door-creak (a slow sawtooth sweep with
  bandpass), whoosh (noise through a sweeping bandpass), punch (low sine thump + noise click), thud (low sine 60 Hz
  decay), skid (noise bandpass 1800 Hz, 0.6 s), engine-rev (sawtooth 60 -> 180 Hz and back over 0.9 s through
  lowpass), glass (several short high sine pings + noise), cash (two bright 'square' blips then a bell), phone (two
  alternating 900/1400 Hz rings), knock (three short lowpassed noise knocks).
- stinger(id): one short musical hit, ~1-2.5 s: reveal (rising major arpeggio), danger (low minor cluster + tom), comic
  (slide whistle: sine 400 -> 1200 -> 600), sad (descending minor 3 notes), triumph (fanfare major chord), mystery (tritone bells).
- radio(level): setMusicVolume(clamp(level, 0, 1)) from '@lawn/music'.
- engine(): a 'sawtooth' oscillator + a 'square' an octave down through a lowpass, gain 0; set(speed01, gain = 1)
  sets frequency 45 + 110 * speed01 and gain 0.05 * gain * (0.4 + 0.6 * speed01) with setTargetAtTime(…, 0.05);
  stop() ramps to 0 and stops. If there is no context when engine() is called, return a no-op voice.
- stopAll(fade = 0.8): music(null, fade), ambience(null, fade), stop every engine voice, radio(1).
- Disconnect and stop every node you end (no leaks across many scenes). Guard against exceptions from stopped nodes.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- Importing the module does not touch window or the AudioContext (only calls do).

## Out of scope
Every other file, especially src/audio.ts and src/radio/ (read only).
~~~~

~~~~text
Epic: 2 Modules — Issue 2E: actors.ts (scene gnomes: walk, gestures, talking, props, seats, mount poses)
Depends on: none

(Environment block above.)

## Goal
src/cutscene/actors.ts implements its stub: a gnome model per script actor, posed every frame from an ActorSample.
Plus actors.test.ts for the pure gesturePose.

## Read first
- src/cutscene/actors.ts: the stub; keep exported names and signatures (StageActor, GesturePose, gesturePose,
  createStageActor, poseActor, setHeld, drawMountPose, removeStageActor).
- src/cutscene/script.ts: ActorSample, Gesture, ScriptActor, Vec3.
- src/cutscene/cast.ts: ResolvedCast { look, hz, held, scale, name }.
- src/gnomes.ts: makeGnome(parent, look), gnomeState(x, y, z, yaw, speed, sitting) (a PlayerState for model.update),
  poseHandsUp (arm pivots: rotation.x about -2.85 points an arm up; left arm splays with +z, right with -z).
- src/player.ts drawMount (around line 291): how a MountPose is drawn on a gnome model (copy it).
- src/quests/cutscene.ts: how a held prop is attached (buildHeld(id) from '@lawn/prefabs'; prop.position.set(0, -0.32,
  0.02); prop.rotation.x = Math.PI; model.arms.right.add(prop)) and the talking arm (arms.right.rotation.set(-0.55 -
  Math.abs(Math.sin(clock * 5.5)) * 0.35, 0, 0.15)). Read only.
- packages/gnome/src/types.ts GnomeModel: object, arms.left/right, rig (the body under object), update(state, dt).
  model.update copies state.position into object.position and sets object.rotation.y = facing.

## Change
src/cutscene/actors.ts:
- gesturePose(name, t, dur): pure. env = clamp(min(t / 0.2, (dur - t) / 0.2), 0, 1) scales every rotation, pitch and
  bob (smooth in and out). Poses (rotation [x, y, z] radians): wave: right [-2.6, 0, -0.3 + sin(t*10)*0.35]; point:
  right [-1.55, 0, 0]; shrug: left [-0.5, 0, 0.6], right [-0.5, 0, -0.6], bob 0.05*|sin(t*6)|; nod: pitch sin(t*8)*0.15
  for the first 0.8 s; cheer: left [-2.9 + sin(t*9)*0.12, 0, 0.3], right [-2.9 - sin(t*9)*0.12, 0, -0.3], bob
  0.15*|sin(t*8)|; handsUp: left [-2.85, 0, 0.3], right [-2.85, 0, -0.3]; lean: pitch 0.25, right [-0.7, 0, 0.3];
  crossArms: left [-1.3, 0, -0.8], right [-1.3, 0, 0.8]; facepalm: right [-2.3, 0, 0.5], pitch 0.15; bow: pitch
  0.6*sin(PI*t/dur); sit / stand: all zero. Arms not mentioned are [0, 0, 0].
- createStageActor(parent, def, cast): makeGnome(parent, cast.look), object.scale.setScalar(cast.scale), meshes cast
  shadows (makeGnome does it), setHeld(a, cast.held), object.visible = !def.hidden. Return the StageActor.
- poseActor(a, s, dt, clock, seat?):
  - object.visible = s.visible; if not visible return.
  - seat given: if object.parent !== seat.object, seat.object.add(object); model.update(gnomeState(seat.local[0],
    seat.local[1], seat.local[2], 0, 0, true), dt) (the seat space faces the vehicle's nose, so yaw 0).
    Note vehicle roots are unscaled but a seated gnome keeps its own scale.
  - no seat: if object.parent !== a.parent, a.parent.add(object); model.update(gnomeState(s.x, s.y, s.z, s.yaw,
    s.speed, s.sitting), dt).
  - After update (it animates the arms): if s.gesture: p = gesturePose(s.gesture, s.gestureT, a gesture length of
    max(s.gestureT + 0.2, 1.2) is fine) -> arms.left/right.rotation.set(...p), rig.rotation.x = p.pitch, object.position.y
    += p.bob. Else if s.talking: the talking arm above plus rig.rotation.x = Math.sin(clock * 14) * 0.05 (a nodding
    head bob while the line types). Else rig.rotation.x = 0.
  - if s.held !== a.heldId: setHeld(a, s.held).
- setHeld(a, prefab): remove the old held object; if prefab, buildHeld(prefab) attached as above (wrap buildHeld in
  try/catch: an unknown id holds nothing). Update heldId / heldObj.
- drawMountPose(a, pose, dt): parent back to a.parent if needed; copy player.ts drawMount (state from the pose,
  model.update, arm reach / climb after).
- removeStageActor(a): remove from its parent.

src/cutscene/actors.test.ts: gesturePose returns zeros at t = 0 (env 0) for 'wave'; at mid time 'point' right[0]
≈ -1.55; 'bow' pitch peaks mid; 'sit' all zero.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/cutscene/actors.test.ts) passes.

## Out of scope
Every other file (gnomes.ts, player.ts and quests/cutscene.ts are read only).
~~~~

~~~~text
Epic: 2 Modules — Issue 2F: sceneVehicles.ts (real game vehicles as scene actors)
Depends on: none

(Environment block above.)

## Goal
src/cutscene/sceneVehicles.ts implements its stub so a script can spawn any game vehicle (glaze looks included) and
pose it every frame from a VehicleSample with wheels turning, suspension and headlights.

## Read first
- src/cutscene/sceneVehicles.ts: the stub; keep exported names and signatures (vehicleMode, vehicleGroundFor,
  spawnSceneVehicle, poseSceneVehicle, seatLocal, removeSceneVehicle).
- src/cutscene/script.ts: ScriptVehicle, VehicleSample, Vec3.
- src/vehicles.ts: createVehicle (line ~224), syncVehicleMesh (~453: places object from v.x/y/z/yaw, or from v.sim if
  set; turns wheels from v.speed; body suspension only when driver !== 'none' or speed !== 0), setVehicleHeadlights
  (~197), setVehicleLook (~770), removeVehicle (~686), seatWorld (~693: seat positions incl. v.rig?.seatLift).
- src/boats.ts floatHeight(v): waterAt(x, z).surface - (spec.draft ?? 0.25).
- src/terrain.ts: heightAt(x, z), waterAt(x, z) -> { surface, depth } | null.
- @lawn/glaze: normalizeLoadout(input, paintFallback) (packages/glaze/src/loadout.ts).

## Change
src/cutscene/sceneVehicles.ts:
- vehicleGroundFor(kind, x, z): boats: waterAt(x, z) ? surface - (VEHICLES[kind].draft ?? 0.25) : heightAt(x, z);
  others heightAt(x, z).
- spawnSceneVehicle(scene, def): createVehicle(scene, def.kind, x, z, def.yaw ?? 0, def.tint); if def.at has 3 numbers,
  v.y = at[1]; else v.y = vehicleGroundFor(kind, x, z). If def.loadout and v.look: setVehicleLook(v, normalizeLoadout({
  ...v.look, ...def.loadout }, v.tint)). v.questOwned = true; v.driver = 'none'; headlights: setVehicleHeadlights([v],
  !!def.headlights); v.object.visible = !def.hidden; syncVehicleMesh(v, 0).
- poseSceneVehicle(v, s, dt): if v.sim, set v.sim = undefined (the scripted pose replaces the physics chassis; the
  director gives the player's vehicle a fresh one afterwards). v.x/y/z/yaw = sample; v.speed = s.speed; v.vy = 0;
  v.steerVis += (s.steer - v.steerVis) * min(1, dt * 6); v.driver = s.driving ? 'npc' : 'none' (so the body works its
  suspension while driving); v.object.visible = s.visible; setVehicleHeadlights([v], s.headlights); syncVehicleMesh(v,
  dt). If v.boat exists, leave pitch/roll as they are (syncVehicleMesh reads them) but bring them towards 0 a little each
  frame (multiply by 0.95).
- seatLocal(v, seat): seat 0 or a missing passenger seat -> spec.seat; else spec.passengerSeats[seat - 1]; add
  v.rig?.seatLift ?? 0 to y. Return a new [x, y, z].
- removeSceneVehicle(scene, v): removeVehicle(scene, v).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.

## Out of scope
Every other file (vehicles.ts, boats.ts are read only).
~~~~

~~~~text
Epic: 2 Modules — Issue 2G: rooms.ts (move the room sets out of quests/cutscene.ts, add their colliders)
Depends on: none

(Environment block above.)

## Goal
The off-map story room sets live in src/cutscene/rooms.ts (stub exists), quests/cutscene.ts uses them unchanged in
behaviour, and roomColliders(room) gives the room's walls and set pieces as collider boxes for the LOS check.

## Read first
- src/cutscene/rooms.ts: the stub; keep exported names and signatures (ROOM_ORIGIN, BODEGA_OFFSET, RoomTheme,
  ROOM_THEMES, BuiltRoom, buildRoom, roomColliders, fitPrefab).
- src/quests/cutscene.ts: ORIGIN, BODEGA_OFFSET, ROOM_THEMES, fit(), buildRoomShell, buildThemedSet, buildBodegaCorner
  (it sets the bodegaKeeper and asphaltCat variables), buildContract, buildDialogue, begin (uses ROOM_THEMES[...].bg).
- src/types.ts: Box { minX, maxX, minZ, maxZ, h }.

## Change
- src/cutscene/rooms.ts: move ROOM_THEMES (typed Record<CutsceneRoom, RoomTheme>), fit (as fitPrefab), buildRoomShell,
  buildThemedSet and buildBodegaCorner here verbatim (same geometry, colours, lights, props). buildRoom(room, { set =
  true, bodega = false }) makes the group at ROOM_ORIGIN, adds the shell, the themed set when set, and the Bodega
  corner when bodega, returning { group, bodega: { keeper, cat } | null } (keeper and cat are what buildBodegaCorner
  made). Imports it needs: three, buildPrefab from '@lawn/prefabs', makeGnome from '../gnomes', BASE_SPEAKER_LOOK and
  CAST from './cast'.
- roomColliders(room): build buildRoom(room, { set: true, bodega: false }); group.updateMatrixWorld(true); for each
  direct child of the group that is a Mesh or Group (skip lights and light targets), Box3().setFromObject(child), shift
  by -ROOM_ORIGIN (so the box is room-local), skip it if max.y <= 0.05 (the floor, rugs) or min.y >= 3.0 (the ceiling),
  else push { minX, maxX, minZ, maxZ, h: max.y }. Cache the result per room in a Map. Return it.
- src/quests/cutscene.ts: delete the moved code; import from '../cutscene/rooms' and use ROOM_ORIGIN where it used
  ORIGIN, ROOM_THEMES, fitPrefab where it used fit, buildRoom(req.room, ...) in buildDialogue (with bodega: true, then
  bodegaKeeper / asphaltCat from the result) and in buildContract (set: false, then its own desk, chair, posters as now;
  buildContract built the shell only, so keep that). Behaviour must stay exactly the same. Remove imports that become
  unused.
- Add src/cutscene/rooms.test.ts: installFakeDom() from '../testing/fakeDom' first, then a dynamic import of './rooms'
  (see src/clearCourse.test.ts for the pattern); for 'mulch-club' roomColliders returns a box for the back wall (minZ
  about -6.7, h about 4.2) and the boxes for its bookshelves; for 'street' no side walls (no box with maxX > 7).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/cutscene/rooms.test.ts) passes.
- (cd games/gnome-theft-auto && npx vitest run src/quests/quests.test.ts) still passes.

## Out of scope
Every other file. Leave the contract-mode logic, overlay and dialogue logic of quests/cutscene.ts as it is (Epic 3
replaces the dialogue path).
~~~~

## Epic 3 issues

Same environment block as Epic 2. Epic 2 is done: timeline.ts, los.ts, subtitles.ts, cueAudio.ts, actors.ts,
sceneVehicles.ts and rooms.ts are implemented; check.ts (checkScript, checkTimeline, envFor, losFor, formatIssues) is
written. Stubs that Epic 3 fills: director.ts, legacy.ts, checkStage.ts, intro.ts.

~~~~text
Epic: 3 Integration — Issue 3A: director.ts (play a SceneScript in the game)
Depends on: none

(Environment block above.)

## Goal
src/cutscene/director.ts implements createDirector: it plays any SceneScript in the running game.

## Read first
- src/cutscene/director.ts: the stub. Keep every exported name and signature (DirectorHooks, ScenePlayOptions, Director, createDirector).
- src/cutscene/script.ts: the format (SceneScript, Step, TimedStep, SceneFrame...).
- src/cutscene/timeline.ts: compile(script, lineTiming()), sampleFrame(tl, t, env), eventsBetween(tl, from, to), targetPoint(frame, target).
- src/cutscene/check.ts: envFor(script) (the StageEnv to sample with).
- src/cutscene/actors.ts, sceneVehicles.ts, subtitles.ts, cueAudio.ts, rooms.ts, cast.ts (castOf): the building blocks; read their exports.
- src/quests/cutscene.ts: the overlay (letterbox bars, title pill, fade), setLights (dim world lights except the
  stage's), scene background/fog swap for rooms, the 'in' / 'play' / 'out' / 'after' phases, voice unlock. Copy those
  patterns; do not edit that file (another worker does).
- src/mount.ts: beginMount(mode, v, from) and stepMount(seq, dt) -> MountFrame { pose, door, done }; src/vehicles.ts
  setDoorOpen(v, pivot, open). src/audio.ts playHorn(kind).

## Change
src/cutscene/director.ts, createDirector(scene, ui, hooks):
- DOM: one overlay div appended to ui (position:fixed; inset:0; z-index:60; display:none; pointer-events:auto;
  font-family system-ui): top and bottom letterbox bars (11vh, black), a title pill at the top (like cutscene.ts
  titleEl), a caption pill at the bottom above the bar (gold text on dark, max-width 88vw, centred), a Skip button at
  the top right (min 44 px, safe-area aware; shown only while no line card is up and the script is skippable), the
  subtitle card (createSubtitles(overlay, voice, { onNext: tap, onSkip: skip }, { skippable })), and a full-screen
  black fade div on top (pointer-events:none). Overlay pointerdown anywhere -> tap(). Keys while active: Escape ->
  skip(); Space or Enter -> preventDefault + tap().
- Voice: createMutter({ gain: () => 0.22 }) from '@lawn/mutter', unlocked on window pointerdown / keydown (like cutscene.ts).
  Audio: createCueAudio().
- play(script, onDone, opts): ignore if active. Exit pointer lock. tl = compile(script, lineTiming()); env = envFor(script).
  Room stage: buildRoom(room, { set: true, bodega: stage.bodega }), scene.add(group); actors' parent = group; swap
  scene.background / fog to the room theme's bg (Fog(bg, 14, 40)); dim other lights to 30%. Camera positions are
  room-local: add ROOM_ORIGIN to camera pos and look. Vehicles on a room stage: console.warn and skip them.
  World stage: a THREE.Group at the origin added to scene is the actors' and props' parent; hooks.setPlayerVisible?.(false).
  Actors: createStageActor(parent, def, castOf(def, { room, playerLook: hooks.playerLook?.() })).
  Vehicles: from 'player' and hooks.playerVehicle?.() returns one -> use that Vehicle (remember its driver to restore;
  it is moved to the script's `at`); else spawnSceneVehicle(scene, def). One cue engine voice per vehicle.
  Props: fitPrefab(prefab, size, by ?? 'w') when size is given, else buildPrefab(prefab, { lights: false }) from
  '@lawn/prefabs'; added to parent.
  Music / ambience from the script; audio.radio(script.radio ?? 0.25). hooks.setUiVisible(false). Save camera fov.
  clock = 0; the last fired time = 0; phase 'in' (fade from black over fadeIn ?? 0.7 while the clock already runs).
- update(dt, camera): nothing when idle.
  - Advance: next = clock + dt (or a pending jump from tap()). Gate: for an 'enter'/'exit' TimedStep that is running
    and whose mount sequence is not done, do not let next pass start + dur - 0.001 (the clock waits for the real mount).
  - Fire one-shot steps from eventsBetween(tl, lastFired, next) in order, each once (keep a Set of fired orders):
    say -> subtitles.show({ speaker: the actor's cast name or the who label, text, icon, hz: step.hz ?? actor cast hz ?? 100 },
    last = no later say step) plus its music / stinger / sfx cues; music / ambience / stinger / radio -> audio;
    sfx -> audio.sfx(id, { pan, gain }) where for `at` pan = clamp(dot(camera right, unit(target - camera)), -1, 1)
    and gain *= clamp(1 - distance / 60, 0.1, 1); horn -> playHorn(v.kind); call -> opts.onTrigger?.(name, arg);
    enter -> beginMount('enter', v, actor's current world position); exit -> beginMount('exit', v, same).
  - frame = sampleFrame(tl, clock, env).
  - Actors: a running mount sequence -> f = stepMount(seq, dt); drawMountPose(actor, f.pose, dt); f.door ->
    setDoorOpen(v, f.door.pivot, f.door.open); f.done -> mark it done (keep the seat pose: for 'enter' pose the actor
    seated in the vehicle from then on; for 'exit' keep it standing at the last pose until the sample agrees).
    Else seated (sample.seatedIn) -> poseActor(a, s, dt, clock, { object: v.object, local: seatLocal(v, s.seat) });
    else poseActor(a, s, dt, clock).
  - Vehicles: poseSceneVehicle(v, s, dt); engine.set(Math.min(1, Math.abs(s.speed) / v.spec.maxSpeed), visible ?
    clamp(1 - distance to camera / 50, 0, 1) : 0). Props: position, yaw, visible.
  - Bodega corner (room stage with bodega): animate the keeper sweeping and the cat like cutscene.ts animateDialogue.
  - Camera: pos / look from frame.camera (+ROOM_ORIGIN in rooms). 'follow' shots with lag > 0 (default 0.35): smooth
    the position with k = 1 - Math.exp(-dt / lag), snapping on the first frame of a shot. Shake: add
    (Math.random() - 0.5) * 2 * shake to each axis of pos. camera.fov = frame.camera.fov; updateProjectionMatrix;
    position.set; lookAt.
  - Subtitles: frame.say -> subtitles.reveal(frame.say.shown); none -> subtitles.hide(). Title / caption pills follow
    frame.title / frame.caption (hidden when null). Fade div opacity = max(frame.fade, the phase fade).
  - When clock >= tl.duration: phase 'out' (fade to black over fadeOut ?? 0.7, still rendering the last frame), then
    end(): put kept and player vehicles at their final sampled pose; remove actors (removeStageActor), props, the stage
    group; spawned vehicles: keep && world stage -> v.driver = 'none', hooks.adoptVehicle?.(v); else
    removeSceneVehicle(scene, v). The player's vehicle: restore its driver, hooks.resetVehicle?.(v). A `player: true`
    actor that ends on foot -> hooks.placePlayer?.(x, z, yaw). audio.stopAll(); voice.stop(); subtitles.hide();
    lights, background, fog and fov back; hooks.setPlayerVisible?.(true); hooks.setUiVisible(true); onDone().
    Then phase 'after': fade back from black over 0.5 s and hide the overlay.
- tap(): if a line is on screen (frame.say): typing -> jump the clock to its start + typeDur; done typing -> jump to
  its start + dur. Otherwise nothing.
- skip(): only when skippable (default true) and playing: fire every 'call' step not yet fired, in order; voice.stop();
  go to phase 'out'.
- clock getter: the scene time, or -1 when idle. active: true from play() until onDone has run.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- Reading the code: every tap target is at least 44 px, Escape skips, Space / Enter / tap finish then advance a line.

## Out of scope
Every other file (quests/cutscene.ts and app.ts are another worker's; they call createDirector).
~~~~

~~~~text
Epic: 3 Integration — Issue 3B: wire scripted scenes into quests, the old cutscene and the game
Depends on: none

(Environment block above.)

## Goal
Quests can name a scripted scene; the old dialogue cutscenes play on the director (typewriter text) through
legacy.ts; app.ts gives the director its hooks and `?cutscene=<id>` plays any scene; `?cutscenecheck` runs the check.

## Read first
- src/cutscene/director.ts: createDirector(scene, ui, hooks: DirectorHooks) -> Director { active, play(script, onDone,
  opts?: ScenePlayOptions), update(dt, camera), skip(), clock }. Another worker is implementing it now; use only this
  signature.
- src/cutscene/legacy.ts (stub you fill), src/cutscene/scenes/index.ts (SCENES), src/cutscene/checkStage.ts
  (runCutsceneCheck(opts: CheckStageOptions) stub, another worker fills it).
- src/cutscene/script.ts (SceneScript, Step), src/cutscene/cast.ts (speakerLookAndHz(line)).
- src/quests/types.ts: CutsceneSpec, CutsceneRequest, CutsceneHandle.
- src/quests/cutscene.ts: the whole file. src/quests/quests.ts requestFor (around line 553).
- src/app.ts: createCutscene call (~line 227), frame() cutscene handling (~line 801), introTour.startIfFirstTime
  (~line 1387), the ?debug __gta object (end of file), refreshDriving (~line 1272), player (player.model,
  player.vehicle, player.respawn), weapons.setVisible.

## Change
- src/quests/types.ts: CutsceneSpec gains `| { kind: 'script'; script: string | SceneScript }` (a SCENES id or an inline
  script). CutsceneRequest gains `| { kind: 'script'; script: SceneScript; room?: undefined }`. CutsceneHandle: `mode`
  becomes 'contract' | 'dialogue' | 'script'; play(req, onDone, opts?: ScenePlayOptions) (import type from
  '../cutscene/director').
- src/quests/quests.ts requestFor: when q.cutscene?.kind === 'script', resolve the id through SCENES (or use the object)
  and return { kind: 'script', script }; an unknown id -> console.warn and fall through to the contract. Nothing else
  changes in quests.ts (other people edit it: keep the diff to these lines).
- src/cutscene/legacy.ts legacyDialogueScript(req): stage { kind: 'room', room, bodega: true if any line has
  bodegaCameo }, title = titleCard. One actor per line i (id `line${i}`): from speakerLookAndHz(line): look (full),
  hz, held ?? null, scale, name = line.speaker, at [0, -2.5], yaw 0, hidden true. Steps: { do: 'music', track: 'warm' }
  is NOT added (keep it quiet like before); for each line: despawn the previous line's actor (if one is up and this
  line is not a cameo), spawn this one (non-cameo lines), a camera: non-cameo -> { do: 'cam', shot: { kind: 'dolly',
  from: [-0.35, 1.45, 0.7], to: [0.35, 1.45, 0.7], look: [0, 1.1, -2.5], s: 6, ease: 'linear' } }; cameo -> { kind:
  'cut', pos: [30.4, 1.5, 1.5], look: [30, 1.1, -1.6] }; then { do: 'say', who: non-cameo ? `line${i}` : line.speaker,
  text, icon: line.icon ?? (cameo ? '🧹' : undefined), hz }. No lines -> one Narrator line 'Meanwhile in Turfton...'.
- src/quests/cutscene.ts: createCutscene(scene, ui, hooks: DirectorHooks) builds a director with the same hooks.
  play: 'script' -> director.play(req.script, done, opts); 'dialogue' -> director.play(legacyDialogueScript(req), done,
  opts); contract as now. `active` is true while either runs (make it a getter); `mode` reports the running one;
  update(dt, camera) runs both (the director's update is a no-op when idle); skip() skips whichever runs. Delete the
  old dialogue-only code that is no longer used (subtitle box, next/skip buttons for dialogue, applyDialogueLine,
  buildDialogue, animateDialogue, speakerModel, the dialogue keyboard handler, the bodega pieces if unused); keep the
  contract mode working exactly as before (its Skip button, posters, shots). Remove unused imports.
- src/app.ts (keep the diff small; others edit app.ts too):
  - createCutscene hooks: setUiVisible as now; setPlayerVisible(v) { player.model.object.visible = v;
    weapons.setVisible(v); }; playerVehicle: () => player.vehicle; adoptVehicle: (v) => { vehicles.push(v); };
    playerLook: () => myLook; resetVehicle: () => refreshDriving(); placePlayer(x, z, yaw) { if (!player.vehicle) {
    player.respawn(x, z, yaw); chase.yaw = yaw; } }. (refreshDriving is a function declaration further down: it is
    hoisted, fine.)
  - frame(): `cutscene.mode !== 'dialogue'` becomes `cutscene.mode === 'contract'` (only the silent contract skips on
    jump / enter / fire).
  - Startup: `?cutscene=<id>` with SCENES[id]: after 1500 ms, cutscene.play({ kind: 'script', script: SCENES[id] },
    () => hud.toast(`Scene "${id}" done`, 3000), { onTrigger: (n, a) => console.log('[cutscene] trigger', n, a) }).
    Unknown id -> hud.toast listing Object.keys(SCENES). `?cutscenecheck` -> runCutsceneCheck({ scene, camera,
    boxes: world.boxes, ui, spawn: world.spawn }) after 1000 ms.
  - ?debug __gta: add cutscene and scenes: SCENES.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/quests/quests.test.ts) passes.

## Out of scope
director.ts, checkStage.ts, introTour.ts, intro.ts, scenes/ (other workers). The intro skips itself for ?cutscene and
?cutscenecheck (another worker adds that).
~~~~

~~~~text
Epic: 3 Integration — Issue 3C: the cutscene check in tests and in the live game (?cutscenecheck)
Depends on: none

(Environment block above.)

## Goal
npm test checks every old quest dialogue scene (through legacy.ts) and every room set; `?cutscenecheck` runs the check
on every scene in the live game, including a raycast against the real meshes, and shows a report.

## Read first
- src/cutscene/check.ts: checkScript(script, worldBoxes, opts), checkTimeline(tl, env, w, opts), envFor, losFor, formatIssues.
- src/cutscene/los.ts: LosIssue. src/cutscene/timeline.ts: compile, sampleFrame, targetPoint. src/cutscene/textSpeed.ts lineTiming.
- src/cutscene/legacy.ts: legacyDialogueScript(req: { room, lines, titleCard? }) (another worker fills it now: use
  only that signature). src/cutscene/intro.ts: introScript(spawn) (another worker fills it). src/cutscene/scenes/index.ts SCENES.
- src/cutscene/checkStage.ts: the stub (keep CheckStageOptions and runCutsceneCheck as they are).
- src/quests/defs.ts: QUESTS, GIVERS (each giver has a room); a quest's cutscene { kind: 'dialogue', room?, lines, titleCard? }.
- src/layout.golden.test.ts lines 30-45 and src/testing/fakeDom.ts: how a test builds the real world in node.

## Change
- src/cutscene/cutscenes.test.ts: installFakeDom() first, then dynamic imports. For every quest in QUESTS with a
  'dialogue' cutscene: script = legacyDialogueScript({ room: cutscene.room ?? GIVERS[q.giver].room, lines, titleCard });
  expect(formatIssues(q.id, checkScript(script, []))).toBe(`${q.id}: all shots pass`) (room stages need no world
  boxes). One `it` per quest (it.each). A timeout of 60 s per test (third argument of it) since the machine is busy.
- src/cutscene/checkStage.ts runCutsceneCheck(opts): scenes = [introScript(opts.spawn), ...Object.values(SCENES)].
  For each: issues = checkScript(script, opts.boxes). World-stage scripts also get a mesh pass: tl = compile(script,
  lineTiming('normal')), sample every 0.25 s; for each frame, the target point (camera.target through targetPoint, else
  camera.look); a THREE.Raycaster from camera pos towards it with far = distance - 0.6; raycaster.intersectObjects(
  opts.scene.children, true), ignoring hits whose object is not visible or whose material is transparent with opacity
  < 0.5, and ignoring Sprites and Points; the first hit -> a LosIssue { kind: 'target-hidden', t, step: camera.step,
  who: target id, at: hit point, detail: `hidden by mesh "${hit.object.name || hit.object.type}"` } (collapse repeats
  like check.ts does: same kind / who / step on consecutive samples count once). Render a report panel appended to
  opts.ui: a div id="cutscene-check" with data-issues="<total>", fixed, top 10px left 10px, max-height 80vh, overflow
  auto, monospace 12px, dark background, a close button (44 px); its text is formatIssues per scene. Also console.log
  the report and set (window as any).__cutsceneCheck = { total, byScene: Record<id, LosIssue[]> }.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/cutscene/cutscenes.test.ts) runs. If a quest scene fails because of
  a real problem in the shared legacy staging (the same dolly for every line), report the issues in your final message
  instead of changing legacy.ts.

## Out of scope
Every other file (legacy.ts, intro.ts, scenes/ belong to other workers).
~~~~

~~~~text
Epic: 3 Integration — Issue 3D: the intro flyover on the timeline, every shot passing
Depends on: none

(Environment block above.)

## Goal
The first-time intro (src/introTour.ts) plays a camera-only world-stage SceneScript from src/cutscene/intro.ts, and
src/cutscene/intro.test.ts proves every shot passes the line-of-sight and collision check against the real world.

## Read first
- src/introTour.ts: the current intro (3 aerial legs and a descent behind the player; its DOM, Skip button, captions,
  localStorage key, startIfFirstTime / update / skip / active API used by app.ts). It clips through buildings today.
- src/cutscene/intro.ts: the stub introScript(spawn).
- src/cutscene/script.ts: SceneScript, CamShot ('dolly' with from/to/look/lookTo/s/fov/fovTo), the 'caption' step.
- src/cutscene/timeline.ts: compile(script, timing), sampleFrame(tl, t, env) -> frame.camera { pos, look, fov } and frame.caption.
- src/cutscene/check.ts: checkScript(script, worldBoxes) and formatIssues(id, issues).
- src/layout.golden.test.ts lines 30-45 + src/testing/fakeDom.ts: building the real world in a test.
- src/config.ts: SPAWN, CITY_HALF, BIOMES / PLACES / landmark constants (MULCH_CLUB, THORNE_TOWER, ...) for places worth flying past.

## Change
- src/cutscene/intro.ts introScript(spawn): stage { kind: 'world' }, no actors, steps: a sequence of { do: 'caption',
  text } and { do: 'cam', wait: true, shot: { kind: 'dolly', ... } } legs keeping the spirit of the old intro (the same
  three captions: 'WELCOME TO TURFTON — EVERY BLADE OF GRASS IS SPONSORED', 'MOWERS ARE FOR BORROWING. THE HAT WATCH
  IS WATCHING.', 'FIVE BIOMES. ZERO PERMITS. ONE GOLDEN ACORN.', then 'MEET PIP POTSWORTH ACROSS THE STREET'), about
  14-16 s in all, legs joined end to start (each leg's `from` = the previous `to`, look continuous) so it is one
  smooth flight, the last leg ending 6.5 m behind the spawn (opposite its facing: forward = (sin yaw, 0, cos yaw)) and
  3.2 m up, looking at [spawn.x, ground + 1, spawn.z], fov 56. Use the terrain height (heightAt from '../terrain') to keep
  legs well above hills.
- src/introTour.ts: keep its exported API, DOM, CSS, SEEN_KEY and skip logic. Replace LEGS and the leg maths: on
  startIfFirstTime, tl = compile(introScript({ x: target spawn... }), lineTiming()) — the spawn comes from a new
  optional hooks field `spawn?: { x: number; z: number; yaw: number }` (fallback: SPAWN from '../config'); update()
  advances its own clock, frame = sampleFrame(tl, clock, { ground: heightAt }), camera.fov / position / lookAt from
  frame.camera, cap.textContent = frame.caption ?? ''; when clock >= tl.duration restore the fov and finish(). Also skip
  the intro when the URL has 'cutscene' or 'cutscenecheck' (add to the params.has list).
- src/cutscene/intro.test.ts: installFakeDom(), build the world as layout.golden.test.ts does, issues =
  checkScript(introScript(SPAWN), world.boxes); expect(formatIssues('intro', issues)).toBe('intro: all shots pass').
  Timeout 120 s (third argument of it). Iterate on intro.ts until it passes: the report says the time, the step and
  where the camera is inside a box or a target is hidden; raise the leg or move it.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/cutscene/intro.test.ts) passes with zero issues.

## Out of scope
app.ts (it passes no spawn today; the fallback SPAWN is the same place), every other file.
~~~~

~~~~text
Epic: 3 Integration — Issue 3E: example scenes (vehicles, the real world, a room) and their demos
Depends on: none

(Environment block above.)

## Goal
Three example scenes in src/cutscene/scenes/ that show off the format and pass the check, registered in SCENES, plus a
test over all of SCENES and demo JSON files to record them.

## Read first
- src/cutscene/script.ts: the whole format (read every comment).
- src/cutscene/check.ts: checkScript(script, worldBoxes), formatIssues.
- src/cutscene/scenes/index.ts: SCENES (you own this file now).
- src/cutscene/cast.ts: CAST preset names (pip, tansy, bodega, juniper, ...).
- src/config.ts: SPAWN (-6.25, 14, yaw 0, on a Turfton sidewalk), CITY_HALF, ROAD_PITCH, ROAD_WIDTH, VEHICLES kinds.
- src/layout.golden.test.ts lines 30-45 + src/testing/fakeDom.ts: building the real world in a test.
- docs/lore/canon.md and `npm run lore -- find pip` (lore rules for names and lines: Pip Potsworth, Tansy, Turfton).
- games/gnome-theft-auto/demos/drey-raid.json: the demo JSON format (setup -> query string).

## Change
- src/cutscene/scenes/streetPickup.ts export const STREET_PICKUP: SceneScript (id 'street-pickup'), world stage near
  SPAWN on a real road: Pip arrives in a 'lowrider' driven along a road (drive with arrive: true, a 'track' camera for
  the drive-by entrance, horn), gets out ('exit'), walks to the player actor (player: true, standing at SPAWN), they
  talk (3-5 short lines with gestures: wave, point, shrug), Pip hands over a prop (give, e.g. 'gta-pistol' or any
  @lawn/prefabs held id used in quests/cutscene.ts), both get in ('enter', seat 1 for the player actor), and the
  getaway (drive with depart: true, arrive: false, a 'follow' chase camera, music 'heist', a 'skid' sfx and a stinger).
  Ambience 'street'. A 'call' step { name: 'pickup-done' } at the end.
- src/cutscene/scenes/pullUp.ts PULL_UP (id 'pull-up'): a ScriptVehicle with from: 'player' (kind 'ride-on' fallback)
  pulling up at a kerb, an 'follow' interior shot (offset near the seat, lag 0), the player actor seated in it gets out,
  a short exchange with a shopkeeper (preset 'bodega') outside a shop, ambience 'street'.
- src/cutscene/scenes/backRoom.ts BACK_ROOM (id 'back-room'): room stage 'mulch-club', two actors (preset 'juniper'
  walking in from the side to the desk area, a second gnome), an orbit shot, a dolly, music 'mystery' crossfading to
  'tension' on a line, a 'call' step, a title.
- src/cutscene/scenes/index.ts: SCENES = { 'street-pickup': STREET_PICKUP, 'pull-up': PULL_UP, 'back-room': BACK_ROOM }.
- src/cutscene/scenes/scenes.test.ts: installFakeDom(), build the world once (as layout.golden.test.ts), it.each over
  Object.entries(SCENES): expect(formatIssues(id, checkScript(s, world.boxes))).toBe(`${id}: all shots pass`). Timeout
  120 s. Iterate on the scenes' coordinates until every one passes (keep cameras 2+ m from buildings, paths on roads).
- games/gnome-theft-auto/demos/cutscene-street.json and cutscene-room.json: url http://localhost:5301/, setup
  { "offline": true, "no-intro": true, "cutscene": "street-pickup" } (and "back-room"), warmup 3, duration long enough
  for the scene (about its timeline duration + 2 s, at most 40), size [640, 400], fps 12, no steps (lines auto-advance).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- (cd games/gnome-theft-auto && npx vitest run src/cutscene/scenes/scenes.test.ts) passes with zero issues.

## Out of scope
Every other file. Do not start a dev server.
~~~~
