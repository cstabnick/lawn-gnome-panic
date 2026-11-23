# Writing cutscenes (Gnome Theft Auto)

A cutscene is plain data: a `SceneScript` (`games/gnome-theft-auto/src/cutscene/script.ts`, every field is commented
there). You do not write any code to stage a scene. This guide covers the format, the audio cues, vehicles, how a
quest plays a scene, and the line-of-sight check that every scene has to pass.

Code map (`src/cutscene/`):

| File | Job |
| --- | --- |
| `script.ts` | The format (types only) |
| `timeline.ts` | `compile(script)` places every step on a timeline; `sampleFrame(tl, t, env)` gives everything on stage at time t (pure, used by the game and the checks) |
| `director.ts` | Plays a script in the game: stage, actors, vehicles, camera, subtitles, audio, triggers, tap / skip |
| `cast.ts` | Named characters (`CAST`: look, voice pitch, held prop, scale) |
| `rooms.ts` | The off-map room sets and their colliders |
| `actors.ts`, `sceneVehicles.ts` | Gnome models and real game vehicles on stage |
| `subtitles.ts`, `textSpeed.ts` | Typewriter dialogue card, the Text speed option, reading-time holds |
| `cueAudio.ts` | Procedural music, ambience, stingers, SFX, engine hums, radio ducking |
| `los.ts`, `check.ts`, `checkStage.ts` | The line-of-sight and collision check (`checkScript`), and its live-game report |
| `legacy.ts` | Old `{ kind: 'dialogue', lines }` quest scenes, converted to scripts |
| `intro.ts` | The first-time intro flyover (camera only) |
| `scenes/` | Scripted scenes by id (`SCENES`) |
| `direct.ts` | Director's helpers: `beat`, `shot`, `cut`, `coverage`, `reaction`, `exchangeLooks` (see Directing) |
| `pacing.ts`, `pacing.baseline.ts`, `lanes.ts` | The pacing and craft checker, the scenes not yet re-directed, the re-direction lanes |

## A scene

```ts
import type { SceneScript } from '../script';

export const BACK_DOOR: SceneScript = {
  id: 'back-door',
  stage: { kind: 'world' },              // or { kind: 'room', room: 'mulch-club' }
  title: 'The Back Door',
  music: 'mystery',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: [-6.25, 14], yaw: Math.PI },
    { id: 'pip', preset: 'pip', at: [-6.25, 22], yaw: Math.PI, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: [-2, 2.2, 10], look: 'you' } },
    { do: 'spawn', id: 'pip' },
    { do: 'walk', who: 'pip', path: [[-6.25, 16.5]] },
    { do: 'cam', shot: { kind: 'dolly', from: [-3, 1.8, 13], to: [-4, 1.6, 15], look: 'pip', s: 4 } },
    { do: 'say', who: 'pip', text: 'You came. Good. Nobody else answers the hat-phone.' },
    { do: 'gesture', who: 'you', name: 'shrug', async: true },
    { do: 'say', who: 'you', text: 'It was ringing in my hat.', stinger: 'comic' },
    { do: 'call', name: 'back-door-met' },
  ],
};
```

Register it in `scenes/index.ts` (`SCENES['back-door'] = BACK_DOOR`). Play it at once with
`http://localhost:5198/?no-intro&cutscene=back-door`. A quest plays scenes at three moments:

- `cutscene: { kind: 'script', script: 'back-door' }`: when the quest is taken at its giver (or put the script inline).
  The game puts the player at the giver's exit afterwards, so end the scene with the player actor near it.
- `outro: { kind: 'script', script: '...' }`: when the last objective is done, before the CONTRACT COMPLETE banner (the
  save is already done). A payoff, or a chapter's closing set piece.
- `scene: '<id>'` on a `visit` objective: the moment the player arrives (the step completes when it ends): the story
  happening where it happens (Vesper waiting at the diner, the Mayor's handover in Patio Heights).

`scenes.test.ts` fails if a quest names a scene id that does not exist. The main story's scenes live in
`scenes/story/ch*.ts` (plan: `docs/roadmaps/gta-story-cutscenes.md`), with helpers in `scenes/story/kit.ts` that read the
stage spots of `quests/stages.ts` as script values: `spot(stage, cam)` (a camera spot as a `cut`), `markOf(stage, who)`,
`carMark`, `pathOf`, `rideOf(castId)` (a cast member's vehicle kind and Pay 'n' Glaze look), `up(x, z, h)`.

More scenes per quest (`QuestDef`, quests.ts plays them):

- `beats: { 2: 'my-beat' }`: played as objective 2 starts, right after objective 1 is done (wherever the player is
  then); the next objective starts when it ends.
- `outro: { kind: 'script', script: 'my-payoff' }`: played when the quest is complete, before the reward banner. A `choice`
  ending can have its own payoff (`outro: 'scene-id'` on the option), which wins. A `visit` objective can take `scene` (played on arrival).
- A real-world intro leaves the player where its `player: true` actor ends (no jump back to the giver's door). A scene
  staged far from where the player is ("meanwhile") should have no `player: true` actor, so the player is not moved.

The side-quest scenes live in `scenes/side/` (one file per quest); `scenes/side/kit.ts` reads stage marks, cameras,
walks, paths and each character's own vehicle (`castRide`) from `quests/stages.ts`.

### Stages

- **`world`**: real map, world coordinates. `[x, z]` points stand on the ground (`heightAt`, bridges included);
  `[x, y, z]` is exact. The world stays lit; the player's own gnome and gun are hidden. A `player: true` actor stands
  in for the player (wearing their gnome). If that actor ends the scene on foot, the real player is left there.
  - **Live world** (`world: 'live'`, the default on a world stage): ambient traffic, pedestrians, critters, the sky,
    world sounds and effects keep running round the scene, centred on it. The player is safe: no Hat Watch (police
    and heat stand still), no damage, no guns, no quest updates. The scene's area (round every actor's and vehicle's
    start and walk path, or `clearArea: { at, r }`) and a lane along every `drive` path are kept clear: drivers and
    pedestrians inside are moved out behind the fade-in, none spawn nearby, and drivers about to enter wait at the edge
    like traffic at a closed road (`cutscene/liveArea.ts`, `traffic.setKeepOut`, `npcs.setKeepOut`).
  - `world: 'paused'` freezes the whole game while the scene plays, as before (use it for scenes that must be still,
    or that hold the camera far away from the cast).
  - `sky: 'noon' | 'golden' | 'night'` holds the sky at that time of day while the scene plays (settled under the
    fade-in); the player's sky comes back when it ends.
- **`room`**: an off-map set (`mulch-club`, `side-valve`, `cloverfield-barn`, `unmowed-hollow`, `fells-shrine`,
  `dust-overlook`, `street`). Room-local coordinates: floor y 0, back wall z -6.6, side walls x +-7.1, ceiling 4.3 (keep
  cameras below it), cameras stand towards +z. `bodega: true` adds the Bodega & Sons corner at x 30. World lights dim.
  No vehicles in rooms.

### Actors, vehicles, props

- Actor: `armless: true` draws a gnome without its right arm (and without anything held): Pip after the chapter 3 raid.
- Actor: `preset` (a `CAST` name: pip, tansy, vesper, granny, diggs, bracken, loam, bodega, juniper, reginald, sorrel,
  clara, brenda, 'big lou', mossley, burt, driftwood, cedric, bramble, shelldon, wally) or `look` overrides; `player:
  true`; `name` (subtitle label); `hz` (voice pitch); `held` (a `@lawn/prefabs` held id, `null` for empty hands);
  `hidden` until a `spawn`; `seatedIn` a vehicle id to start seated. In the world, preset gnomes are map-sized (scale 1);
  in rooms they are drawn 1.45x as before.
- Vehicle: any `VehicleKind` (mowers, `lowrider`, `hoa-van`, `snail-coach`, `boot-float`, `mulch-spreader`, boats such
  as `walnut-dinghy` or `clog-cruiser`, `plane`, `whirligig`). `tint`, a Pay 'n' Glaze `loadout` (partial: `{ spoiler:
  'picket', underglow: ... }`), `headlights`, `hidden`. `from: 'player'` uses whatever the player is driving when the
  scene starts (moved to `at`, falls back to spawning `kind` when on foot; never removed). `keep: true` leaves a spawned
  vehicle in the world afterwards.
- Prop: a `@lawn/prefabs` id placed in the scene (`size` + `by` to fit it).

### Steps

Steps run in order; each waits for the previous one unless it has `async: true`. `parallel: { tracks: [[...], [...]] }`
runs lists side by side. Camera steps and `shake` never wait (add `wait: true` to a camera move to wait for it).

| Step | Does |
| --- | --- |
| `wait` `s` | Pause |
| `say` `who text [icon hz music stinger sfx]` | A dialogue line (see Dialogue) |
| `walk` `who path [speed run]` | Walk (1.6 m/s) or run (4 m/s) along points from where the actor is |
| `face` `who yaw\|at [s]` | Turn to a yaw or towards an id / point |
| `gesture` `who name [s]` | wave, point, shrug, nod, cheer, handsUp, lean, crossArms, facepalm, bow; emotes flinch, slump, think, clutch, beckon, tipHat, stomp, hug; sit / stand change the resting pose |
| `spawn` / `despawn` `id [at yaw]` | Put an actor, vehicle or prop on or off stage |
| `hold` `who prop\|null` | Put a prefab in the right hand |
| `give` `from to [prop s]` | Hand it over (both reach, it swaps halfway) |
| `enter` `who vehicle [seat]` | Get in with the real mount sequence (walk, door, climb) into the seat it names. Waits until seated |
| `exit` `who` | Get out of its own seat to that seat's side (`seats.ts` `exitLocal`: beside the seat, or the door on that side; seats that would land on the same spot step back a pace). Waits until standing; if the real sequence finishes first, the actor holds its last pose |
| `drive` `vehicle path speed [spline depart arrive]` | Drive / sail / fly a Catmull-Rom spline. `depart` eases from a stop, `arrive` eases to a stop (both default true) |
| `lights` `vehicle on`, `horn` `vehicle` | Headlights, horn |
| `cam` `shot` | Camera (see below) |
| `shake` `amp s` | Camera shake (0.05 subtle .. 0.4 explosion) |
| `music`, `ambience`, `sfx`, `stinger`, `radio` | Audio cues (see below) |
| `call` `name [arg]` | Calls the game's `onTrigger(name, arg)`: quest state, spawns. Also fires when the scene is skipped |
| `title`, `caption` `text\|null` | Title pill at the top; a narration pill at the bottom |
| `fade` `to s` | Fade to (1) or from (0) black. Waits |

### Camera shots

Offsets in a target's frame are `[right, up, forward]`. A `Target` is an id (looked at the head of an actor, the
middle of a vehicle, and followed as it moves) or a point. fov defaults to 52.

| Shot | Use |
| --- | --- |
| `cut` `pos look` | A still camera; the eyes follow a moving target |
| `dolly` `from to look [lookTo s ease fov fovTo]` | Push in, pull out, crane, pan |
| `orbit` `around radius height fromYaw toYaw s` | Circle a target |
| `follow` `who [offset look lag]` | Chase cam behind a vehicle (default `[0, 2.2, -5.5]`), a walk-along, or an interior shot (`offset` near the seat, `lag: 0`) |
| `track` `pos who` | A fixed camera turning to keep a vehicle in frame: drive-bys and arrivals |
| `frame` `who size [toward over side height fov]` | Coverage by shot size (`cu`, `mcu`, `ms`, `fs`, `ws`), placed from where the actors stand: an eyeline single (`toward`), an over-the-shoulder (`over`), low or high angle. Picks the lens for the size and puts the eyes on the upper third, clear of the subtitle card. Moves with the actor: aimed along their run (`toward` where they are going) it leads them like a backing track; to watch an entrance from across the set, use a `track` from a fixed spot. Scene vehicles are not in the LOS colliders, so watch for a parked mower in front of the lens |

Any shot takes `handheld` (metres, 0.01 calm .. 0.05 a raid): a slow operator's drift, added by the director only.

## Vehicles in scenes

```ts
vehicles: [{ id: 'ride', kind: 'lowrider', at: [40, 18], yaw: -Math.PI / 2, loadout: { underglow: 0x7cf0ff } }],
actors: [
  { id: 'pip', preset: 'pip', seatedIn: 'ride', at: [0, 0] },
  { id: 'you', player: true, at: [-6.25, 14] },
],
steps: [
  { do: 'cam', shot: { kind: 'track', pos: [-2, 1.4, 19], who: 'ride' } },     // drive-by entrance
  { do: 'drive', vehicle: 'ride', path: [[20, 18], [0, 18], [-5, 17]], speed: 9, depart: false },
  { do: 'horn', vehicle: 'ride' },
  { do: 'exit', who: 'pip' },
  { do: 'say', who: 'pip', text: 'Get in. The HOA is three hats behind me.' },
  { do: 'enter', who: 'you', vehicle: 'ride', seat: 1 },
  { do: 'cam', shot: { kind: 'follow', who: 'ride' } },                        // chase cam
  { do: 'music', track: 'chase' },
  { do: 'sfx', id: 'skid', at: 'ride', async: true },
  { do: 'drive', vehicle: 'ride', path: [[-30, 17], [-60, 30]], speed: 14, arrive: false },   // getaway
],
```

Drivers (seat 0) put their hands on the steering grips like the player and put their held prop away while they drive;
a Pay 'n' Glaze seat cover (hay bale, throne...) lifts whoever sits on it (`seatCover.ts`). Dev labs to look at all
this: `?cutscene=seat-lab` (every cast member in their own glazed ride), `?cutscene=exit-lab` (everyone out of a
ride-on, a four-seat lowrider and the van at once, then two guns raised), `?cutscene=gun-lab` (the four guns, lowered
and aimed). Actors holding a gun (`held: 'gta-rifle'`) carry it at the ready and aim it on a `point` gesture.

Wheels turn with the speed, the body works its suspension, the engine hums by speed and distance, and the horn and
headlights are real. Seated actors ride in the seat (`seat: 0` driver, `1..` passengers). For an arrival in what the
player drove, use `{ id: 'ride', kind: 'ride-on', from: 'player', at: [...] }` and seat the `player: true` actor in it.

## Dialogue

A `say` line types out letter by letter at the player's **Text speed** (Options > Dialogue: Slow 22, Normal 40, Fast
75 characters a second, or Instant; saved per browser), with mutter voice blips per word at the speaker's pitch; the
speaker nods and gestures while it types. Then it holds for reading time: 238 words a minute, at least 1.5 s, and moves
on by itself. A tap, click, Space or Enter finishes the typing; the next one ends the line. Escape or Skip ends the scene.
Next / Skip buttons are 44 px for phones. Keep lines short (one or two sentences) and check names and facts against
`docs/lore/` (`npm run lore -- find <word>`).

## Audio cues

All procedural WebAudio (no files), through the game's mute (M).

- `music`: `tension`, `warm`, `heist`, `sad`, `triumph`, `mystery`, `chase`, and the story themes: `turfton` (the main
  theme: Dm7-Gm7-Bbmaj7-A7, a whistled tune over a swung street groove), `turfton-dusk` (the same tune slow and soft, for
  chapter endings), `finale` (the tune at full tilt), `villain` (Vesper: slow minor organ, a chromatic drip, a heartbeat
  kick), `fescue` (Mossy Wood folk flute), `frost` (Frostbite Fells bells), `sandpit` (snare march and bugle).
  `{ do: 'music', track, fade }` crossfades (default 1.5 s); `track: null` stops. A line can start one:
  `{ do: 'say', ..., music: 'sad' }`. `SceneScript.music` starts one on the first frame. A track is data in
  `cueAudio.ts` (`TrackSpec`: chords, bass, an optional arpeggio, `lead` tune per chord and a `drums` pattern string).
- `ambience`: `room`, `street`, `forest`, `wind`, `night`, `crowd`, `water`, `rain` (looped beds, crossfading).
- `stinger`: `reveal`, `danger`, `comic`, `sad`, `triumph`, `mystery`, `villain` (Vesper walks in), `chapter` (a
  chapter title card) (one-shot hits).
- `sfx`: every game sound (`door`, `alarm`, `whistle`, `boom`, `splash`, `gunshot`, ...) plus `footsteps`,
  `door-creak`, `whoosh`, `punch`, `thud`, `skid`, `engine-rev`, `glass`, `cash`, `phone`, `knock`. `at: <target>` pans
  it and fades it with distance from the camera.
- `radio`: Turfton FM's level while the scene plays. Scenes duck it to 0.25 by default (`SceneScript.radio`); it comes
  back to full when the scene ends.

## The line-of-sight and collision check

Every scene must pass `checkScript(script, world.boxes)` (`check.ts`). It samples the timeline every 0.1 s and reports:

- `camera-inside` / `camera-underground`: the camera within 0.3 m of a collider box, under the terrain or under water.
- `camera-in-actor`: the camera inside a standing gnome (its hat fills the frame); seated riders are exempt for interior shots.
- `target-hidden`: a box or the terrain between the camera and the shot's target (or the speaking actor).
- `actor-floating` / `actor-buried` / `actor-in-wall`: an actor not standing on the ground (or a box top), or inside a wall.
- `path-blocked` / `path-off-ground`: a walk or drive path through a building, or a wheeled vehicle into deep water.
- `vehicle-off-ground` / `boat-off-water`: a parked or driving vehicle off the ground; a boat off the water.

Run it:

- `npm test -w games/gnome-theft-auto` checks every `SCENES` entry (`scenes/scenes.test.ts`), every old quest dialogue
  scene (`cutscenes.test.ts`) and the intro (`intro.test.ts`) against the real world built in node. A failure prints one
  line per problem: time, step index, kind, who, and where.
- In the browser, `?no-intro&cutscenecheck` runs the same check in the live game plus a raycast against the real
  meshes (trees, props and other things without colliders), and shows the report in a panel (also
  `window.__cutsceneCheck`).

Fix a problem by moving the camera (2+ m from buildings is safe), raising a leg, or moving a path onto a road. In a room,
remember the colliders are the set pieces and walls of `rooms.ts`.

## Triggers

A `call` step reaches the game in two ways: code that plays a scene itself passes
`cutscene.play(req, onDone, { onTrigger(name, arg) { ... } })`; scenes started by a quest giver (and `?cutscene=`)
dispatch a window event any system can listen to:

```ts
window.addEventListener('gta:cutscene-trigger', (e) => {
  const { name, arg, quest } = (e as CustomEvent<{ name: string; arg?: unknown; quest: string | null }>).detail;
  if (name === 'back-door-met') { /* spawn the getaway mower, set a flag, unlock... */ }
});
```

When the player skips, every `call` not yet reached still fires, in order, so quest state never misses a step.

## Directing

The direction bible ([direction/bible.md](direction/bible.md)) says how a scene should play: tone, characters, pacing
numbers, camera and music language. `direct.ts` writes the common moves:

```ts
import { beat, coverage, cut, reaction, shot } from '../../direct';

const TALK = coverage('tansy', 'player', 1);       // every shot of this exchange on one side of the line
steps: [
  { do: 'cam', shot: spot(PB, 'wide') },           // establish with the stage spot, then cover with frame shots
  cut(TALK.single('tansy', 'mcu')),                 // eyeline single
  { do: 'say', who: 'tansy', text: 'Their bikes. Not my bay, not my problem.' },
  cut(TALK.ots('player')),                          // the player over Tansy's shoulder
  ...reaction('pip', { toward: 'tansy', gesture: 'slump' }),   // a reaction shot and a beat
  beat('silence'),                                  // tiny 0.3, beat 0.7, pause 1.2, silence 2.0
  cut(shot('turncoat', 'fs', { side: 15, handheld: 0.02 })),
],
```

A scene's `direction` field holds its director's notes path, an explicit `kind` (intro, outro, arrival, chapter-open,
chapter-close, race-intro, race-podium) and `waive` entries for rules it breaks on purpose. The engine ignores it.

### The pacing checker

`pacing.ts` reads a compiled scene like an editor: lines over 16 words, cuts in the middle of a line, flash cuts and
shots held too long for their size, dead air, a speaker out of frame, too small or seen from behind while talking, the
camera jumping the 180-degree line, monologues, narration doing the acting, no hook, and scenes over their length
target. Thresholds are `PACING` (quoted in the bible).

- `npm run cutscene-report -w games/gnome-theft-auto` prints every scene's faults, grouped by re-direction lane
  ([direction/lanes.md](direction/lanes.md)).
- `npm test` runs `pacing.test.ts`: a scene listed in `pacing.baseline.ts` (not yet re-directed) is only reported; every
  other scene must have no unwaived fault. Remove a scene's id from the baseline when it passes; a baseline entry that
  passes fails the test, so the list only shrinks.

## Tips

- Start every scene with a `cam` step; before the first one the camera sits at a default spot.
- Use `async: true` to let an actor walk while someone talks.
- `call` steps are how a scene changes the game; keep them at the end, or make them safe to fire early when skipped.
- Find coordinates in the game with `?debug` (`__gta.player.x / z`).
