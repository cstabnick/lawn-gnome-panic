# GTA: more gnome animations

Goal: Gnome Theft Auto gets a data-driven gnome animation library (45 procedural animations: emotes, dances, idles,
reactions, work poses with hand props), played by id on any gnome model. The player plays them from an emote menu
(😀 button, G, gamepad D-pad down); townsgnomes and the ambient chatter gnomes use them for idle variety and reactions;
cutscene scripts can name any of them as a `gesture`. `listAnims()` / `animById()` and `window.__gta.anim` let the
debug trainer trigger any animation.

## What existed (inventory)

| Where | Animation |
|---|---|
| `packages/gnome` model.update | walk/run cycle, airborne limbs, front flip on air jump, sitting, dead (lie flat), squash and stretch, hair sway |
| `gnomes.ts` | hands-up (flee, cheer) |
| `player.ts` | free-fall spread, chute arms up, aim arm, mount reach/climb, riding lean |
| `driverHands.ts`, `gunHold.ts` | hands on the grips, gun hold |
| `ragdoll.ts`, `bail.ts`, `swim.ts` | tumble, bail, float |
| `ambientGnomes.ts` | a slow body sway only |
| `cutscene/actors.ts` | 20 cutscene gestures (wave, point, shrug, nod, cheer, ...) |

Gaps: the player had no emotes; idle townsgnomes stood still; no dances, sitting on the ground, sleeping, cowering,
working poses, stumbles; ambient gnomes never moved.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | `src/anim/types.ts` (ids, AnimDef), `index.ts`, `animator.ts`, `playerEmote.ts`, stubs, `anim.test.ts`, `KEYS.emote = 'KeyG'` | written directly |
| 1 Library + wiring | all 45 rows, emote menu, NPC/ambient idles, cutscene gestures; `npm test -w games/gnome-theft-auto -- src/anim src/cutscene src/keys` | 8 parallel |
| 2 Second batch (asked for "more") | 62 more rows in new files: `emotesB.ts` (12), `reactsB.ts` (14), `roles.ts` (12 job idles, category `role`), `hunt.ts` (12, `hunt`), `ride.ts` (12 seated, `ride`); 107 rows in all; menu tabs from `ANIM_TABS` | 5 (written by the planner when the worker pool was full; issue text kept in the scratch issues) |
| 3 Player hookup (planner) | app.ts: emote controller after the gun pose, menu (with a "Mine" tab of the player's @lawn/emotes loadout), `window.__gta.anim`, achievement `gta-showboat` (reward: new shared emote `showboat-strut` in `@lawn/emotes`) | written directly |

Online: emotes are local only (net.ts is out of this workstream's scope); remote players do not see them yet.

## Epic 1 issues

Shared blocks pasted into every issue below:

~~~~text
## Environment (shared)
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Game: games/gnome-theft-auto.
Git Bash: if node is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit other files in this same game at the same time. Edit ONLY the files listed under Change.
Do not commit, push, stash or switch branches. Do not run `vite build` or start dev servers.
`npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours (other workers mid-edit):
ignore those, fix only errors in your files.
~~~~

~~~~text
## Pose conventions (shared, from src/anim/types.ts)
The shared gnome model (@lawn/gnome createGnomeModel). Angles in radians. Poses are applied AFTER model.update().
  armL / armR  pivot at the shoulder; [0,0,0] hangs straight down. x < 0 swings the arm forward and up
               (-1.57 straight forward, -2.9 straight up), x > 0 swings it back. z swings it out sideways:
               LEFT arm z > 0 is outward, RIGHT arm z < 0 is outward (left [0,0,1.5] + right [0,0,-1.5] = a T-pose).
               Crossing an arm in front of the chest: x about -1.3 and z toward the other side (left z -0.8, right z +0.8).
               y twists the arm about its own length (rarely needed). Arms are rigid: no elbows.
  legL / legR  pivot at the hip (0.3 m up); x < 0 swings the leg forward (-1.57 = straight out, as when sitting),
               x > 0 back. LEFT leg z > 0 / RIGHT leg z < 0 swing it out sideways.
  body         [rx, ry, rz] rotates the whole rig about the FEET: rx > 0 leans forward (0.6 = a deep bow),
               rx < 0 leans back (-1.57 lies flat on the back: add lift 0.24 so it rests on the ground);
               ry > 0 turns the body to its left; rz > 0 tilts it to its right, rz < 0 to its left.
  lift         metres added to the rig's height: +0.3 a hop, -0.26 sits the hips on the ground (legs at x -1.57).
The head is part of the body: a nod is a small body rx (0.12), a head shake a small body ry (0.25).
Gnome left is +x; the gnome faces +z.

The row type (src/anim/types.ts, final; do not edit types.ts):
  export interface AnimDef<Id extends AnimId = AnimId> {
    id: Id; label: string /* <= 12 chars */; icon: string /* one emoji */; category: AnimCategory;
    duration: number /* s, one play or one loop cycle */; loop: boolean;
    parts: readonly AnimPart[] /* 'armL'|'armR'|'legL'|'legR'|'body' */; emote: boolean /* shown in the emote menu */;
    prop?: string /* @lawn/prefabs id held in the right hand */;
    pose(t: number): AnimPose /* 0 <= t < duration */;
  }
  export type AnimPose = Partial<Record<AnimPart, Vec3>> & { lift?: number };   // Vec3 = [number, number, number]

Rules the test (src/anim/anim.test.ts) checks for every row:
- pose(t) returns EXACTLY the parts in `parts` (each a 3-number array) plus optional `lift`; no other keys.
- every angle |a| <= PI, finite; |lift| <= 0.6. label 1..12 chars; icon non-empty; duration > 0.
- loop rows: pose(0) equals pose(duration - 0.0001) to 1 decimal. Build loops from Math.sin/Math.cos of
  (2 * Math.PI * k * t / duration) with whole-number k, so they wrap seamlessly.
- pure: no Math.random, no module state. The animator blends 0.2 s in and out, so non-loops may start/end anywhere.
- A row whose parts are only armL/armR (and no lift) is "upper body": it keeps playing while the gnome walks.
  Any row with legL, legR or body stops when the gnome walks. Keep wave/point/clap-style gestures arms-only.
Write small helpers at the top of the file (e.g. `const TAU = Math.PI * 2; const s = (t, d, k = 1) => Math.sin(TAU * k * t / d);`
and an ease `const ease = (x) => x * x * (3 - 2 * x)` with clamped x) rather than repeating math.
~~~~

### Issue 1.1: emote rows

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)> <Pose conventions (shared)>

## Goal
src/anim/emotes.ts holds the 14 emote animations, one AnimDef per id in EMOTE_IDS, in that order.

## Read first
- games/gnome-theft-auto/src/anim/types.ts: the contract and EMOTE_IDS.
- games/gnome-theft-auto/src/cutscene/actors.ts lines 30-130 (gesturePose): existing arm numbers for wave, point,
  shrug, cheer, facepalm, bow, beckon, tipHat. Reuse them as starting values (do not import from it).

## Change
- games/gnome-theft-auto/src/anim/emotes.ts: replace the stub's empty array. Keep the export name and type:
  `export const EMOTE_ANIMS: readonly AnimDef<EmoteAnimId>[] = [ ... ];`
  All rows: category 'emote', emote: true, no prop.
  | id | label | icon | dur | loop | parts | what it looks like |
  | wave | Wave | 👋 | 1.6 | false | armR | right arm up (x -2.6), hand side to side (z -0.3 +/- 0.35, ~1.6 Hz) |
  | point | Point | 👉 | 1.4 | false | armR | right arm straight forward (x -1.55), a small jab forward at the start |
  | shrug | Shrug | 🤷 | 1.2 | false | armL, armR, body | both arms out low (x -0.5, z +/-0.6), body tilts slightly side to side (rz +/-0.05) |
  | cheer | Cheer | 🙌 | 2.0 | false | armL, armR, body, lift | both arms straight up pumping, small hops (lift 0..0.15) |
  | clap | Clap | 👏 | 1.6 | false | armL, armR | both arms forward (x -1.3), z swinging in and out so the hands meet ~4 times a second |
  | facepalm | Facepalm | 🤦 | 1.6 | false | armR, body | right arm up to the face (x -2.3, z 0.5), body leans forward 0.15 and shakes ry slowly |
  | thumbs-up | Thumbs Up | 👍 | 1.4 | false | armR | right arm forward and up (x -1.9, z -0.2), a little bounce |
  | salute | Salute | 🫡 | 1.5 | false | armR, body | right arm to the brow (x -2.6, z 0.7), body stiff and straight (rx -0.05) |
  | bow | Bow | 🙇 | 1.8 | false | armL, armR, body | body rx eases 0 -> 0.6 -> 0, right arm across the belly (x -0.9, z 0.6), left arm back (x 0.4) |
  | shake-fist | Shake Fist | ✊ | 1.6 | false | armR, body | right arm up (x -2.5), shaking fast in x (+/-0.25 at ~6 Hz), body leans forward 0.1 |
  | beckon | Come Here | 🫴 | 1.6 | false | armR | right arm forward (x -1.5) curling back toward the body twice a second |
  | laugh | Laugh | 😂 | 2.0 | false | armL, armR, body | arms across the belly (x -0.9, left z -0.5, right z 0.5), body bobs rx 0.05..0.25 at ~4 Hz |
  | taunt | Taunt | 😜 | 2.0 | false | armL, armR, body, legR | arms out to the sides (z +/-1.2) waggling, right leg kicks out (x -0.5) twice, body ry turns side to side |
  | flex | Flex | 💪 | 1.8 | false | armL, armR, body | both arms out and up (x -1.2, z +/-1.4), pulsing, body leans back -0.08 |
  Import: `import type { AnimDef, EmoteAnimId } from './types';`

## Contract
The export name, type and id order above are final; index.ts, the emote menu and npcs.ts read them.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/anim/emotes.ts.
- `npm test -w games/gnome-theft-auto -- src/anim -t "emote rows"` passes. (Other "rows" groups and "has every id exactly
  once" fail until the other workers finish; that is expected.)

## Out of scope
Every other file, including the other src/anim files and types.ts.
~~~~

### Issue 1.2: dance rows

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)> <Pose conventions (shared)>

## Goal
src/anim/dances.ts holds the 5 dances, one AnimDef per id in DANCE_IDS, in that order.

## Read first
- games/gnome-theft-auto/src/anim/types.ts: the contract and DANCE_IDS.

## Change
- games/gnome-theft-auto/src/anim/dances.ts: replace the stub's empty array. Keep:
  `export const DANCE_ANIMS: readonly AnimDef<DanceAnimId>[] = [ ... ];`
  All rows: category 'dance', loop: true, emote: true, no prop, parts ['armL','armR','legL','legR','body'] (and lift when used).
  | id | label | icon | dur | what it looks like |
  | dance-jig | Jig | ☘️ | 1.6 | hands on hips (arms x 0.3, z +/-0.7), legs kick forward alternately (x -0.8), small hops (lift 0..0.12 twice per cycle) |
  | dance-robot | Robot | 🤖 | 2.4 | stiff stepped moves: arms bent forward (x -1.57) snapping between positions every 0.3 s (use Math.floor steps but make t=0 and t=dur match), body ry snapping +/-0.4 |
  | dance-disco | Disco | 🕺 | 2.0 | right arm points up-right (x -2.7, z -0.6) then down-left across the body (x -0.6, z 0.6), left hand on hip, hips sway body rz +/-0.12 |
  | dance-flail | Flail | 🙃 | 1.2 | both arms whirl (x and z on sin/cos of different multiples), body ry and rz wobble, knees bounce (lift -0.05..0.05) |
  | dance-hop | Bunny Hop | 🐰 | 1.0 | feet together hops twice per cycle (lift 0..0.25), arms tucked forward (x -1.0), body rx leans 0.1 on landing |
  Import: `import type { AnimDef, DanceAnimId } from './types';`

## Contract
Export name, type and id order final.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/anim/dances.ts.
- `npm test -w games/gnome-theft-auto -- src/anim -t "dance rows"` passes (other groups may fail until other workers finish).

## Out of scope
Every other file.
~~~~

### Issue 1.3: idle rows

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)> <Pose conventions (shared)>

## Goal
src/anim/idles.ts holds the 11 idle animations, one AnimDef per id in IDLE_IDS, in that order. Townsgnomes play these
while standing about between walks, so they must look calm and natural, and loops must look good repeated.

## Read first
- games/gnome-theft-auto/src/anim/types.ts: the contract and IDLE_IDS.

## Change
- games/gnome-theft-auto/src/anim/idles.ts: replace the stub's empty array. Keep:
  `export const IDLE_ANIMS: readonly AnimDef<IdleAnimId>[] = [ ... ];`
  All rows: category 'idle', no prop.
  | id | label | icon | dur | loop | emote | parts | what it looks like |
  | look-around | Look Around | 👀 | 4.0 | true | false | body | body ry turns left (0.5), holds, right (-0.5), holds, back to 0 |
  | stretch | Stretch | 🙆 | 2.6 | false | true | armL, armR, body | arms rise straight up (x -2.9, z +/-0.15) as the body leans back (rx -0.15), hold, settle |
  | yawn | Yawn | 🥱 | 2.4 | false | true | armR, body | right hand to the mouth (x -2.2, z 0.45), body leans back slightly then sags forward |
  | scratch-head | Scratch Head | 🤔 | 2.0 | false | true | armR, body | right arm up to the hat (x -2.8, z 0.6) with a fast scratch (+/-0.1 at 5 Hz), body tilts rz 0.06 |
  | tap-foot | Tap Foot | 🦶 | 1.0 | true | true | armL, armR, legR | hands on hips (arms x 0.3, z +/-0.7), right leg taps forward (x -0.25 .. 0) twice per cycle |
  | hands-on-hips | Hands On Hips | 🧍 | 3.0 | true | true | armL, armR, body | hands on hips (x 0.3, z +/-0.7), slow breathing sway body rx 0..0.03 |
  | cross-arms | Cross Arms | 🙅 | 3.0 | true | true | armL, armR, body | arms crossed in front (left [-1.3,0,-0.8], right [-1.3,0,0.8]), slow body ry +/-0.08 |
  | sit-ground | Sit | 🪑 | 4.0 | true | true | armL, armR, legL, legR, body + lift | legs straight out (x -1.57), lift -0.26, arms resting back (x 0.5), body leaning back rx -0.1 with a slow breath |
  | sleep | Sleep | 😴 | 4.0 | true | true | armL, armR, legL, legR, body + lift | lying on the back: body rx -1.57, lift 0.24, legs 0, arms by the sides (z +/-0.2), a slow breath in body rx (+/-0.02) |
  | lean-back | Lean Back | 😎 | 3.0 | true | true | armL, armR, legR, body | as against a wall: body rx -0.12, arms behind (x 0.5), right leg crossed (x -0.2, z 0.25) |
  | think | Think | 💭 | 3.0 | true | true | armL, armR, body | right hand to the beard (x -2.1, z 0.75), left arm across the body (x -0.9, z -0.7), slow body rx 0.04..0.08 |
  Import: `import type { AnimDef, IdleAnimId } from './types';`

## Contract
Export name, type and id order final.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/anim/idles.ts.
- `npm test -w games/gnome-theft-auto -- src/anim -t "idle rows"` passes (other groups may fail until other workers finish).

## Out of scope
Every other file.
~~~~

### Issue 1.4: reaction rows

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)> <Pose conventions (shared)>

## Goal
src/anim/reacts.ts holds the 8 reaction animations, one AnimDef per id in REACT_IDS, in that order.

## Read first
- games/gnome-theft-auto/src/anim/types.ts: the contract and REACT_IDS.
- games/gnome-theft-auto/src/gnomes.ts poseHandsUp: the hands-up numbers (-2.85, z +/-0.3).

## Change
- games/gnome-theft-auto/src/anim/reacts.ts: replace the stub's empty array. Keep:
  `export const REACT_ANIMS: readonly AnimDef<ReactAnimId>[] = [ ... ];`
  All rows: category 'react', no prop.
  | id | label | icon | dur | loop | emote | parts | what it looks like |
  | cower | Cower | 😨 | 1.2 | true | true | armL, armR, legL, legR, body + lift | crouched: legs forward a little (x -0.6), lift -0.12, body rx 0.35, both arms over the head (x -2.6, z -/+0.4 crossing inward: left z -0.4, right z 0.4), a trembling shake in body rz (+/-0.03 at 10 Hz, whole cycles) |
  | panic | Panic | 😱 | 0.6 | true | false | armL, armR | ARMS ONLY (it plays while running away): both arms up and flailing out of phase (x -2.6 +/- 0.4, z +/-0.5) |
  | stumble | Stumble | 🥴 | 1.0 | false | false | armL, armR, legL, body | a trip: body pitches forward to rx 0.5 then recovers to 0, arms fling forward (x -1.8, z +/-0.6), left leg kicks back (x 0.6) |
  | hurt | Hurt | 🤕 | 1.4 | false | false | armL, armR, body | doubled over: body rx 0.4 easing back, left arm across the belly (x -0.9, z -0.6), right arm hangs (x 0.2) |
  | knockdown | Knockdown | 💫 | 1.6 | false | true | armL, armR, legL, legR, body + lift | falls backwards: body rx 0 -> -1.57 over the first 0.5 s (ease in), lift 0 -> 0.24, arms fly up then rest out (z +/-1.0), legs kick up (x -0.6) then rest at 0; stays down to the end |
  | get-up | Get Up | 🧎 | 1.4 | false | false | armL, armR, legL, legR, body + lift | the reverse of the end of knockdown: from lying (rx -1.57, lift 0.24) through sitting (rx -0.2, legs x -1.57, lift -0.26) to standing (all 0), arms pushing off the ground (x 0.8) in the middle |
  | dizzy | Dizzy | 😵‍💫 | 2.0 | true | true | armL, armR, body | body circles: rx = 0.12 * sin, rz = 0.12 * cos (one turn per cycle), arms loose out to the sides (z +/-0.5) swaying |
  | flinch | Flinch | 😖 | 0.8 | false | false | armL, armR, body | a jolt back: body rx -0.28 decaying (exp), hands half up in front of the face (x -1.9, z +/-0.5 inward: left -0.3, right 0.3) |
  Import: `import type { AnimDef, ReactAnimId } from './types';`

## Contract
Export name, type and id order final. 'panic' must stay arms-only (npcs.ts plays it while the gnome runs).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/anim/reacts.ts.
- `npm test -w games/gnome-theft-auto -- src/anim -t "react rows"` passes (other groups may fail until other workers finish).

## Out of scope
Every other file.
~~~~

### Issue 1.5: work rows

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)> <Pose conventions (shared)>

## Goal
src/anim/work.ts holds the 7 working poses, one AnimDef per id in WORK_IDS, in that order, each holding a prop in the
right hand (the animator attaches `prop` to the right arm with buildGear('hand', prop), so the prop moves with armR).

## Read first
- games/gnome-theft-auto/src/anim/types.ts: the contract and WORK_IDS.
- packages/prefabs/src/catalog/tools.ts: the prefabs used below (fishing-rod, dibber, broom, hand-saw, hand-rake,
  watering-can) and packages/prefabs/src/catalog/documents.ts (red-book). Only check they exist; do not edit them.

## Change
- games/gnome-theft-auto/src/anim/work.ts: replace the stub's empty array. Keep:
  `export const WORK_ANIMS: readonly AnimDef<WorkAnimId>[] = [ ... ];`
  All rows: category 'work', loop: true, emote: true.
  | id | label | icon | dur | prop | parts | what it looks like |
  | fish | Fish | 🎣 | 4.0 | fishing-rod | armL, armR, body | rod held out forward (right x -1.2), left hand near it (x -1.0, z -0.3), a small twitch every cycle, body rx 0.05 |
  | dig | Dig | ⛏️ | 1.4 | dibber | armL, armR, body | jab down: body rx 0.15..0.45, both arms forward-down (x -0.6 .. -1.1) in step, one stroke per cycle |
  | sweep | Sweep | 🧹 | 1.2 | broom | armL, armR, body | arms low forward (x -0.7), swinging side to side together (z between -0.4 and 0.4), body ry +/-0.2 with it |
  | saw | Saw | 🪚 | 0.8 | hand-saw | armR, body | right arm forward (x -1.0) pushing in and out (x +/-0.35, one stroke per cycle), body rx 0.25 |
  | rake | Rake | 🍂 | 1.6 | hand-rake | armL, armR, body | reach forward (arms x -1.4, body rx 0.3) then pull back (arms x -0.6, body rx 0.1) |
  | water | Water | 🪴 | 3.0 | watering-can | armR, body | can held forward (x -1.1), tipping slowly (right arm y +/-0.3), body rx 0.12 |
  | read | Read | 📖 | 3.0 | red-book | armL, armR, body | both arms forward-up holding the book (x -1.5, left z -0.25, right z 0.25), head down (body rx 0.12), a page turn (left arm z swings out 0.3 and back) once per cycle |
  Import: `import type { AnimDef, WorkAnimId } from './types';`

## Contract
Export name, type, id order and the prop ids final (the test checks every prop id resolves with getPrefab).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/anim/work.ts.
- `npm test -w games/gnome-theft-auto -- src/anim -t "work rows"` passes, and `-t "holds a work prop"` passes.

## Out of scope
Every other file, including packages/prefabs.
~~~~

### Issue 1.6: emote menu (touch, keyboard, gamepad)

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)>

## Goal
src/anim/emoteMenu.ts: a working emote menu. A round 😀 button (touch and mouse) opens a panel with one tab per
category and one tile per animation; picking a tile plays it on the player. G on the keyboard and D-pad down on a
gamepad open it too. Works on a phone (portrait 390x844 and landscape), every target at least 44 px.

## Read first
- games/gnome-theft-auto/src/anim/emoteMenu.ts: the stub; its exported interfaces are FINAL (app.ts already codes against them).
- games/gnome-theft-auto/src/anim/index.ts: `listAnims({ category, emote: true })` returns AnimDef rows
  ({ id, label, icon, category, ... }). Categories in tab order: 'emote' (tab "Emotes"), 'dance' ("Dances"),
  'idle' ("Poses"), 'work' ("Work"), 'react' ("Reactions"). The rows are being written by other workers right now, so
  the lists may be empty while you work: read them when the panel opens, never at import time, and show "Nothing here yet" for an empty tab.
- games/gnome-theft-auto/src/keys.ts: `KEYS.emote` ('KeyG') and `KEYS.close` ('Escape'), `isTyping(e)`.
- games/gnome-theft-auto/src/gamepad.ts: the BTN table and the line `if (edge(BTN.LEFT)) window.dispatchEvent(new Event('gta:taxi'));`.
- games/gnome-theft-auto/src/input.ts around line 282: `pad.read(shownMode ?? 'foot', dt, document.body.dataset.options === 'open')`
  and the `button()` helper near line 102 for the house style of round touch buttons.

## Change
- games/gnome-theft-auto/src/anim/emoteMenu.ts: implement createEmoteMenu(deps) keeping every exported name and signature.
  - DOM: one container div appended to deps.ui (never restyle or hide deps.ui itself). Inline styles only.
    Everything that takes input sets `pointer-events:auto` and `touch-action:none`, and stops pointerdown propagation
    (e.stopPropagation()) so the camera/stick under it does not react.
  - Button: 56 px round, text 😀, class 'gta-emote-btn', `position:absolute; right:calc(12px + env(safe-area-inset-right));
    top:calc(40% + env(safe-area-inset-top))`, semi-transparent dark background, white border like input.ts buttons.
    Shown only while deps.canOpen() is true (update() sets display each frame). Tap toggles the menu.
  - Add one <style> element (once) with `body.gta-in-scene .gta-emote-btn, body.gta-in-scene .gta-emote-panel { display:none !important; }`
    so cutscenes hide it.
  - Panel (class 'gta-emote-panel'): centred, `width:min(92vw, 520px); max-height:min(80vh, 560px); overflow-y:auto`,
    dark rounded card. A tab row (5 tabs, each >= 44 px tall) and a grid of tiles
    (`display:grid; grid-template-columns:repeat(auto-fill, minmax(76px, 1fr)); gap:8px`), each tile a <button>
    >= 64 px tall with the icon (24 px) over the label (12 px), plus a small number 1-9 in the corner for the first 9
    tiles. A close (✕) button, 44 px. Picking a tile: deps.play(def.id), then close().
  - open(): only if deps.canOpen(). Sets `document.body.dataset.emotes = 'open'`, calls `document.exitPointerLock?.()`
    so the mouse can click, renders the current tab. close(): hides, `delete document.body.dataset.emotes`.
    The last used tab is remembered while the page is open.
  - Keyboard (one window keydown listener; ignore when isTyping(e) or e.repeat):
    `e.code === KEYS.emote` toggles; `e.code === KEYS.close` closes when open;
    while open, `e.code.startsWith('Digit')` plays tile n (Digit1 = first tile) of the current tab.
    (Write the comparisons with KEYS.* constants; a test greps for literal `.code === 'KeyX'` strings.)
  - Gamepad: `window.addEventListener('gta:emote', () => toggle())`. While open, update(dt) polls
    `firstPad()` (import { firstPad } from '@lawn/gamepad'; buttons[i].pressed, axes[0..1]) with your own previous-frame
    button array for edges. Button indexes: A 0, B 1, LB 4, RB 5, UP 12, DOWN 13, LEFT 14, RIGHT 15.
    D-pad or left stick (deadzone 0.5, repeat every 0.2 s while held) moves a highlighted tile (outline) through the
    grid (count the columns from the rendered tiles' offsetTop, or use left/right = +-1, up/down = +-cols where
    cols = Math.max(1, Math.round(grid.clientWidth / 84))); LB/RB switch tab; A plays the highlighted tile; B closes.
  - update(dt): show/hide the button from deps.canOpen(); if the menu is open and canOpen() is false, close().
- games/gnome-theft-auto/src/gamepad.ts: add, right after the taxi line,
  `if (edge(BTN.DOWN)) window.dispatchEvent(new Event('gta:emote'));`
  and add "D-pad down emote menu" to the "Anywhere" line of the header comment. Nothing else.
- games/gnome-theft-auto/src/input.ts: change only the pad.read blocked argument to
  `document.body.dataset.options === 'open' || document.body.dataset.emotes === 'open'`
  so the game ignores the pad while the menu has it. Nothing else.

## Contract (final, already in the stub)
  export interface EmoteMenuDeps { ui: HTMLElement; canOpen(): boolean; play(id: string): void; }
  export interface EmoteMenu { open(): void; close(): void; toggle(): void; isOpen(): boolean; update(dt: number): void; }
  export function createEmoteMenu(deps: EmoteMenuDeps): EmoteMenu;

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/anim/emoteMenu.ts, src/gamepad.ts or src/input.ts.
- `npm test -w games/gnome-theft-auto -- src/keys` passes (no literal key codes outside keys.ts).
- Not testable without a browser here: say in your report what you could not check (phone viewport, real pad).

## Out of scope
app.ts (the planner wires the menu in), keys.ts, every other src/anim file, hud.ts, weaponWheel.ts.
~~~~

### Issue 1.7: townsgnome and ambient-gnome idle variety

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)>

## Goal
Pedestrians (npcs.ts) and the 26 ambient chatter gnomes (ambientGnomes.ts) use the new animation library: idle
pedestrians do something while they stand (stretch, look around, tap a foot...), grumpy ones shake a fist at a horn,
spectators clap or cheer, some fleeing gnomes flail; ambient gnomes each have their own idle loop (fishing, reading,
sweeping, sitting...) and wave when the player comes near.

## Read first
- games/gnome-theft-auto/src/anim/animator.ts: `createAnimator(): Animator` with
  `play(id: string, opts?: { offset?: number; speed?: number; loop?: boolean; onEnd?: () => void }): boolean`,
  `stop()` (blend out 0.2 s), `cancel(model)` (reset at once), `apply(model, dt)` (call AFTER model.update and after any
  other arm pose), getters `active`, `current` (AnimDef | null). One animator per gnome. It attaches a work row's prop
  to the right hand by itself and removes it when the animation ends.
- games/gnome-theft-auto/src/anim/types.ts: the id lists (EMOTE_IDS, IDLE_IDS, REACT_IDS, WORK_IDS) and type AnimId.
  The rows are being written by other workers right now; only use ids from these lists (play() returns false for a
  row not written yet, which is harmless).
- games/gnome-theft-auto/src/anim/index.ts: `pickFor(key, ids)` stable pick by a string key.
- games/gnome-theft-auto/src/npcs.ts: Aux/freshAux (per-gnome private state, `trait`: 'normal' | 'grumpy' | 'spectator'),
  tick() (states walk/idle/flee/ragdoll, the "Animate" block at its end that calls n.model.update then poseHandsUp),
  knockNpc, startFlee, reactToHorn, cheerAt, crack, and wherever a gnome is recycled or removed.
- games/gnome-theft-auto/src/ambientGnomes.ts: AmbientGnomeDef, AMBIENT_GNOMES (read each `id` and `bubble`),
  createAmbientGnomes (update(): the bubble pops when the player is within ~10.5 m; `e.model.rig.rotation.z` sway).

## Change
- games/gnome-theft-auto/src/npcs.ts:
  - Aux gets `anim: Animator` (createAnimator() in freshAux).
  - Pools (module constants, typed `readonly AnimId[]`):
    IDLE_NORMAL = ['look-around','stretch','yawn','scratch-head','tap-foot','hands-on-hips','think'];
    IDLE_GRUMPY = ['cross-arms','tap-foot','hands-on-hips','look-around'];
    IDLE_SPECTATOR = ['look-around','clap','point','think','hands-on-hips'].
  - When a gnome arrives and turns 'idle' (not crowded): with chance 0.7 play a random id from its trait's pool, with
    `offset: Math.random()`, and make its idle time at least 2.5 s. When the idle ends (back to 'walk'), anim.stop().
  - startFlee: anim.cancel(n.model) first; then half the time play 'panic' (arms only, loops) for the flee, else keep
    the existing poseHandsUp. Stop the panic when the flee ends.
  - reactToHorn grumpy branch: play 'shake-fist' instead of setting cheerT (keep the facing, idle 2.0 and the yelled line).
  - cheerAt: spectators play 'cheer', others 'clap' (instead of cheerT) and keep the facing and count.
  - knockNpc, crack, recycle and removal paths: anim.cancel(n.model) so nothing is left posed.
  - After the ragdoll gets up (tickRagdoll), play 'dizzy' for one cycle (`loop: false`) only if the gnome is not fleeing.
    If it flees right after, skip it.
  - The "Animate" block: model.update(ps, dt); then the hands-up pose only when fleeing without 'panic'; then
    `a.anim.apply(n.model, dt)` last. Keep `cheerT` if other code still reads it; otherwise remove it cleanly.
- games/gnome-theft-auto/src/ambientGnomes.ts:
  - AmbientGnomeDef gets an optional `idle?: AnimId` (import type { AnimId } from './anim/types').
    Set it on the defs whose bubble or id suggests one: a fisher by water -> 'fish', a reader/scholar -> 'read',
    a gardener -> 'water' or 'rake', a sweeper/cleaner -> 'sweep', a builder -> 'saw', a lazy or old gnome -> 'sit-ground'
    or 'sleep', a dancer or musician -> 'dance-jig', a broker or boss -> 'cross-arms', a watcher -> 'look-around'.
    At least 12 defs get one. Do not change any name, bubble, position or look (a test checks the text).
  - Others get `pickFor(def.id, ['hands-on-hips','look-around','think','tap-foot','cross-arms','lean-back'])`.
  - Each entry gets an Animator playing its idle (loop, offset by its phase). When the bubble pops for the player and
    the idle is not 'sit-ground', 'sleep' or a work row, play 'wave' once (`loop: false`) with
    onEnd -> play the idle again. While lying/sitting/working, keep the idle.
  - Only apply the rig.rotation.z sway when the playing row does not list 'body'; call animator.apply(model, dt) after
    model.update and the sway.
  - The 1e6 "cutscene hide" call (px 1e6) must not trigger the wave.

## Contract
No exported signature changes (Npcs in types.ts and createAmbientGnomes keep their shapes).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/npcs.ts or src/ambientGnomes.ts.
- `npm test -w games/gnome-theft-auto -- src/ambientGnomes` passes.

## Out of scope
types.ts, gnomes.ts, every src/anim file, app.ts, vibeNpcs.ts, cutscene files.
~~~~

### Issue 1.8: cutscene gestures from the library

~~~~text
Epic: 1 Library + wiring
Depends on: none

<Environment (shared)>

## Goal
A cutscene script step `{ do: 'gesture', who, name, s }` can name any animation-library id (e.g. 'dance-jig',
'sit-ground', 'cower', 'fish', 'laugh') as well as the 20 existing gestures, which keep their exact current behaviour.

## Read first
- games/gnome-theft-auto/src/cutscene/script.ts: `export type Gesture = ...` (around line 104) and its doc comment.
- games/gnome-theft-auto/src/cutscene/actors.ts: gesturePose (pure, a switch over the 20 names), poseActor (applies
  a gesture after model.update), StageActor.
- games/gnome-theft-auto/src/cutscene/actors.test.ts: the test style.
- games/gnome-theft-auto/src/anim/animator.ts: `applyPose(model, parts, pose, w)` (writes the listed parts at weight w:
  limbs blend rotation.x from what update() gave them and y/z from 0, body from upright; adds pose.lift to
  model.rig.position.y) and `resetParts(model, parts)`; `BLEND` (0.2 s).
- games/gnome-theft-auto/src/anim/index.ts: `animById(id)` -> AnimDef | undefined
  (AnimDef: { id, duration, loop, parts, pose(t) }). Rows are being written by other workers now; animById may return
  undefined until they land; treat undefined as "no gesture".

## Change
- games/gnome-theft-auto/src/cutscene/script.ts: `import type { AnimId } from '../anim/types';` and make
  `export type Gesture = <the existing 20 names unchanged> | AnimId;` Add one sentence to the doc comment: any
  animation-library id (src/anim/types.ts) also works; it loops for `s` seconds if it is a loop row.
- games/gnome-theft-auto/src/cutscene/actors.ts:
  - Export `const LEGACY_GESTURES: ReadonlySet<string>` with the 20 existing names. In poseActor, a gesture in that
    set goes down the existing path, byte-for-byte the same behaviour.
  - Any other gesture: `const def = animById(s.gesture)`; if found, t = s.gestureT;
    tt = def.loop ? t % def.duration : Math.min(t, def.duration * 0.9999); w = Math.min(1, t / BLEND);
    if not driving (and for a gun-holding actor call clearGunArms first, as the existing path does)
    `applyPose(a.model, def.parts, def.pose(tt), w)`. Remember the row on the actor (add an optional
    `anim?: AnimDef | null` field to StageActor) and when the gesture changes away from it, call
    `resetParts(a.model, prev.parts)` once so no tilt, lift or arm splay is left behind.
  - Do not touch gesturePose's existing cases or the seat/talking/gun paths.
- games/gnome-theft-auto/src/cutscene/actors.test.ts: add tests: (1) a library gesture ('sit-ground' or, if its row is
  missing, skip with an early return) moves model.rig.position.y below 0.01 / changes the rig rotation mid-play;
  (2) after the gesture goes back to null, model.rig.rotation is zero and arms' rotation.z is 0;
  (3) 'wave' still uses the legacy path (gesturePose values on the right arm).

## Contract
ActorSample, ScriptActor and the gesture step shape are unchanged apart from the wider Gesture union.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/cutscene/.
- `npm test -w games/gnome-theft-auto -- src/cutscene` passes (actors, timeline, pacing, cutscenes tests).

## Out of scope
timeline.ts, director.ts, pacing.ts, scenes/, every src/anim file.
~~~~

## Round 3: character

Asked for: "keep fleshing out the animations with character in different bits". Written by the planner directly (the
rows, pickers and wiring were smaller to write than to specify). 74 more rows, 181 in all.

| File | Rows | What |
|---|---|---|
| `src/anim/styles.ts` | 19 | walk/run overlays per archetype (`walk-swagger`, `-shuffle`, `-tiptoe`, `-sulk`, `-jaunty`, `-nervous`, `-proud`, `-sleepy`, `-pompous`, `run-flail`, `run-pump`, `run-sneak`) and standing styles (`idle-*`), category `style` |
| `src/anim/moods.ts` | 5 | mood layers `mood-happy/angry/scared/bored/tipsy`, category `style` |
| `src/anim/bits.ts` | 18 | town life: wait for the bus, read a map, check a watch, window-shop, haggle, argue, gossip, count acorns, tie a shoe, hiccups, sweat (Dust Flats), shiver (Fells), dust a hat, pat pockets, snack, sip, feed birds, sit on a bench; category `bit` |
| `src/anim/reactsC.ts` | 12 | reactions to the new sights: flyover look-up, banner-plane wave, bird spotted, fish caught / bad luck, tuft combing, skyway gawk, answer the phone, duck a low plane, race fan, horn startle, snapshot |
| `src/anim/social.ts` | 12 | pair rows (`pair` names the partner's row; `PAIR_GAP` 0.9 m apart, facing): handshake, high five, fist bump, hug, dance duo, row, natter, laugh, cheers, bow, whisper/listen |
| `src/anim/drive.ts` | 8 | driving personalities on top of the grips (left arm and body only): one hand, white knuckles, road rage, elbow out, sing-along, lean back, honk-pound, drowsy |

New row fields: `onMove` (plays over the walk cycle; limb x is added to the walk swing, see `applyPose(..., additive)`)
and `pair`. Lookups: `pairOf(id)`; menu tabs add Style, Bits and Together (`ANIM_TABS`).

Pickers (pure, tested in `src/anim/round3.test.ts`):
- `rideAuto.ts`: `passengerAnim` (heli/plane/boat/golf cart/hang on at speed; doze or seasick after `LONG_RIDE_S`),
  `driverAnim` (rowed dinghy, per-vehicle personality, white knuckles flat out), `createRideAnimator()`.
- `persona.ts`: `personaFor(trait)`, `walkStyleFor`, `idleFor(persona, biome)` (Fells shiver, Dust Flats sweat, park
  birds, loch view, sleepy at night via `setAnimWorld({ night })`), `pairFor`, `yawToward`.
- `playerIdle.ts`: `createIdleFidget()`: after `IDLE_DELAY` s standing still, a fidget by place and time.

Wiring: `player.ts` updateRiding (seat poses, driver personality, road rage on the horn; reset on every get-off),
`traffic.ts` (NPC drivers' personality, near ones only), `npcs.ts` (archetype walk styles and idles, pairs between
idle gnomes, soft knocks get up dazed (`get-up` then dizzy / dust-off / fist) instead of always fleeing, horn startle,
look up at flyovers), `ambientGnomes.ts` (a bit of character every 20-45 s out of the player's way), `app.ts` (horn to
the rider, night for the pickers, the player's idle fidget, get-up after a tumble via `emote.playQuiet`).
Cutscenes take every new id as a `gesture` already (the Gesture union includes AnimId).

Not done: remote players' seats (remotes.ts belongs to online-sync: `createRideAnimator().update(model, info, dt)`
after `poseHands` is all it needs); pair animations between two players online.
