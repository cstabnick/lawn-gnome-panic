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
`http://localhost:5198/?no-intro&cutscene=back-door`. Give a quest a scene with
`cutscene: { kind: 'script', script: 'back-door' }` in its `QuestDef` (or put the script object inline).

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
| `gesture` `who name [s]` | wave, point, shrug, nod, cheer, handsUp, lean, crossArms, facepalm, bow; sit / stand change the resting pose |
| `spawn` / `despawn` `id [at yaw]` | Put an actor, vehicle or prop on or off stage |
| `hold` `who prop\|null` | Put a prefab in the right hand |
| `give` `from to [prop s]` | Hand it over (both reach, it swaps halfway) |
| `enter` `who vehicle [seat]` | Get in with the real mount sequence (walk, door, climb). Waits until seated |
| `exit` `who` | Get out to the vehicle's exit side. Waits until standing |
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

- `music`: `tension`, `warm`, `heist`, `sad`, `triumph`, `mystery`, `chase`. `{ do: 'music', track, fade }` crossfades
  (default 1.5 s); `track: null` stops. A line can start one: `{ do: 'say', ..., music: 'sad' }`. `SceneScript.music`
  starts one on the first frame.
- `ambience`: `room`, `street`, `forest`, `wind`, `night`, `crowd`, `water`, `rain` (looped beds, crossfading).
- `stinger`: `reveal`, `danger`, `comic`, `sad`, `triumph`, `mystery` (one-shot hits).
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

## Tips

- Start every scene with a `cam` step; before the first one the camera sits at a default spot.
- Use `async: true` to let an actor walk while someone talks.
- `call` steps are how a scene changes the game; keep them at the end, or make them safe to fire early when skipped.
- Find coordinates in the game with `?debug` (`__gta.player.x / z`).
