Epic: 3 Content
Depends on: none (Epics 1-2 are done: every system works; chapters and `sky.ts` are still stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Five other workers are writing the other chapters, floors and the party slice right now. Edit only `games/final-collectathon/src/chapters/ending.ts` and `src/sky.ts`.
- Your dev server, if you run one, uses port **5225** only: `npx vite --port 5225 --strictPort` from `games/final-collectathon`. Stop it when done.
- Repo rules:
  - Beach props (palm trees, a beach ball, shells) are `@lawn/prefabs` (`buildPrefab(id, { scale })`, standing on y = 0, never dispose their meshes, only remove them). The sky, clouds, the planet, sand and sea are terrain/effects you build from three.js primitives.
  - No z-fighting: the sand disc and the sea must not overlap in one plane (sea is a ring whose inner radius equals the sand radius, or sits clearly lower); anything flat laid on the sand (a towel) uses `flatLayer(material, LAYER.decal)` from `@lawn/depth`.
  - Dialogue: dry, short, warm at the end. No references to real games or films. Nothing bleeds.

## Goal

Write the ending (back in reception at nine o'clock: "Hello." / "I'm not taking the job.", then the gnome walks out
of the front doors into white light and flies into the sky to Shellshore, the beach planet, lands, and the credits
roll) and the sky scene `sky.ts` (the flight path, clouds, and Shellshore's beach).

## Read first

- `games/final-collectathon/src/sky.ts` (stub: keep `SKY_LAYOUT`, `FLIGHT`, `BEACH_SPAWN`, `buildSkyFloor` exports and their types) and `src/types.ts`: `ChapterCtx`, `Chapter`, `Floor`, `FloorLayout`, `Box`, `Player.moveTo` (in `fly` mode the stick adds a sideways offset of up to 3 m).
- `games/final-collectathon/src/floors/lobby.ts`: reception (area `front-door` just inside the glass doors at z 6.6..8, `outside` beyond them at z 8.3..9.6; interactables `secretary`, `clock`; Primrose the secretary is NPC `primrose` at (0, -4.1)). `floor.setFrontDoorOpen(true)` slides the doors open and lights the white "outside".
- `games/final-collectathon/src/config.ts`: `ACH`. `src/collect.ts`: `formatCount`.
- `packages/depth/README.md`: `flatLayer`, `LAYER`.

## Change

### `src/sky.ts`

`buildSkyFloor(scene)` builds one scene that contains the whole flight and the beach (dispose what you create in `dispose()`):
- **Sky**: `scene.background` a light blue (`0x9fd3f0`); a big inverted sphere (radius 900, `BackSide`, `MeshBasicMaterial`, vertex colours from pale near the horizon to deeper blue on top) so it looks like a gradient; `scene.fog = new THREE.Fog(0xcfe8f7, 120, 700)`, set back to `null` in `dispose()`.
- **Lights**: `HemisphereLight(0xffffff, 0xe8d6a0, 1.8)` and a warm `DirectionalLight(0xfff0d0, 1.6)` with shadows near the beach (shadow camera around the beach top).
- **The Annex roof** at the start: a 14 x 1 x 12 m box whose top is y = 0 at the origin (`0xd8d0c4`), a little roof door hut, a "BUCKETWORTH & SONS" sign (`CanvasTexture`) on its front edge; far below, a cluster of small coloured boxes and a round fountain disc suggesting Club Gnome's town square (y -40, spread over 120 m). `groundAt` returns 0 on the roof.
- **Clouds**: 30 puffy clouds (each 4-7 white `SphereGeometry` lumps, `MeshLambertMaterial(0xffffff)`, one shared geometry) scattered along the flight path between y 20 and 150, drifting slowly in `update(dt)`.
- **Shellshore**: a planet sphere radius 40 centred at `(0, 160, -260)` with a sea material (`0x4aa8e8`); its top at y 200. On top, the **beach**: a sand disc (a `CylinderGeometry(18, 18, 1, 40)` top at y 200.02, `0xe8d6a0`) sitting on the sphere, with the sea shown by the sphere itself beyond the sand (no flat sea plane, so nothing is coplanar). On the sand: 4 `palm-tree` (scale 2.2), a `beach-ball`, 5 `snail-shell`s as shells, a `chair` as a deckchair facing +z, and a beach towel (a thin box 1.2 x 0.02 x 2, striped `CanvasTexture`, `flatLayer(mat, LAYER.decal)`) at `(2, 200.02, -255)`.
- `groundAt(x, z)`: 200.02 within radius 17.5 of `(0, -260)`; 0 on the roof (|x| <= 7, |z| <= 6); otherwise `-1000`.
- `colliders`: a ring of 24 thin boxes around the sand's edge (radius 17.8, 2 m tall) so the gnome cannot walk off the beach, plus boxes for the palm trunks.
- `SKY_LAYOUT`: keep the stub's fields, but set `spawn: { x: 0, z: 4, facing: Math.PI }` (on the roof, facing north), `areas: { beach: { x0: -17, z0: -277, x1: 17, z1: -243 } }`.
- `FLIGHT` (export, same type): about 26 seconds in total, from the roof up through the clouds to the beach, e.g. `[{ to: [0, 8, -6], seconds: 2.5 }, { to: [-6, 40, -40], seconds: 5 }, { to: [8, 90, -100], seconds: 6 }, { to: [-4, 150, -170], seconds: 6 }, { to: [0, 215, -240], seconds: 4.5 }, { to: [0, 200.02, -252], seconds: 2 }]`.
- `BEACH_SPAWN`: `{ x: 0, y: 200.02, z: -252, facing: 0 }`.

### `src/chapters/ending.ts` (`export const ENDING: Chapter`, id `'ending'`)

1. `ctx.hud.setCountersVisible(false)`, `ctx.setGoal(null)`, `ctx.music('hold-music')`, `ctx.camera('close')`, `ctx.setControls('locked')`, `ctx.player.teleport(0, 0, -1.2, Math.PI)` (in front of the desk, facing her). `await ctx.wait(1)`.
2. secretary "Hello."
3. Hello loop: options `['Hello.', "I'm not taking the job."]`. Pick "Hello." → the next of: secretary "The Interviewer is ready to see you now."; secretary "He says you've done very well. He says that to everyone. He's in the ceiling."; secretary "Hello. ...Hello. We could do this all day. We do, actually." After three Hellos the choice is only `["I'm not taking the job."]`.
4. player "I'm not taking the job." `ctx.sfx('stamp')`.
5. secretary `{ auto: 1.5 }` "Oh."; "Nobody ever says that. They say hello, and then they go upstairs, and then it's nine o'clock again."; "Was it the interview? Or did you nod off in the chair? People do. It's a very comfortable chair."
6. `choose(null, ["I honestly don't know.", 'Both.'])` → secretary "Mm. That's what the last one said. Or the next one."
7. secretary "Well. Mind the step. And don't collect anything on your way out." `ctx.unlock(ACH.notTaking)`.
8. `ctx.floor().setFrontDoorOpen(true)`, `ctx.sfx('door')`, `ctx.camera('follow')`, `ctx.setControls('walk')`, `ctx.setGoal('Leave.')`. `onInteract('secretary')` meanwhile: secretary "Go on. It's lovely out." `await ctx.waitArea('front-door')`.
9. `ctx.setControls('locked')`, `ctx.setGoal(null)`, `await ctx.player.moveTo(0, 0, 9, 1.4)`, `await ctx.hud.fade(1, 0.8, '#ffffff')`.
10. `await ctx.goToFloor('sky')` — note `goToFloor` fades itself (to black); pass through it, then make sure the cover is clear: `await ctx.hud.fade(0, 0.8, '#ffffff')`. `ctx.music('shellshore')`, `ctx.intensity(1)`, `ctx.camera('sky')`, `ctx.setControls('fly')`.
11. Optional acorns: the path climbs, so spawn them one by one with `ctx.spawnAt('acorn', x, z, y)` (not `spawnLine`, which uses one height) at points along the `FLIGHT` segments (linear interpolation between waypoints, 3 per segment, offset 1.5 m sideways alternately so the stick can reach them). `ctx.toast('Acorns (Optional)', 'You can ignore these.')`.
12. Fly: `for (const leg of FLIGHT) await ctx.player.moveTo(...leg.to, leg.seconds)`. While flying (not awaited, at the 4 s and 14 s marks): narrator `{ auto: 2.5 }` "You don't have to collect those."; later narrator `{ auto: 2.5 }` "You never did."
13. Landing: `ctx.player.teleport(BEACH_SPAWN.x, BEACH_SPAWN.y, BEACH_SPAWN.z, BEACH_SPAWN.facing)`, `ctx.setControls('walk')`, `ctx.camera('follow')`, `ctx.sfx('thud')`.
14. `await ctx.wait(2)`; `await ctx.hud.credits([...])` with: `'THE FINAL COLLECTATHON'`, `''`, `'Starring'`, `'You'`, `''`, `'Primrose Paperweight as Herself'`, `'The Interviewer as the Ceiling'`, `'Sorrel Gluepot as the Water Cooler'`, `'Eight Sleeping Coworkers as Themselves, Asleep'`, `''`, `` `Collected: ${formatCount(ctx.collect.total)}` ``, `'Kept: nothing'`, `''`, `'Bucketworth & Sons thank you for your interest in the position.'`, `''`, `'Thank you for not taking the job.'`.
15. Free roam on the beach forever. After 20 s: pa `{ auto: 2 }` "...Hello?" Then the chapter returns (the director marks the game finished); the player stays on the beach with nothing to do, which is the point.

## Contract

Export names and types unchanged: `ENDING: Chapter`; `SKY_LAYOUT`, `FLIGHT`, `BEACH_SPAWN`, `buildSkyFloor` from
`sky.ts` (`office.ts` calls `buildSkyFloor(scene)` for floor id `'sky'`). Use only `ChapterCtx` members in the chapter.

## Done when

- `npx tsc --noEmit -p games/final-collectathon` shows no errors in your two files.
- With your dev server on 5225: `http://localhost:5225/?chapter=ending&fast` plays the dialogue, opens the doors, and after walking out flies to the beach and rolls the credits. `bash tools/smoke.sh "http://localhost:5225/?chapter=ending&fast" fc-hud fc-dialog` reports no console errors. Check a 390x844 window.
- `npm run zfight -- "http://localhost:5225/?chapter=ending&fast"` reports nothing on the beach once you are there (if it only sees the lobby at load, that is fine; check the beach meshes by reading your code once for coplanar faces).

## Out of scope

Every other file in `games/final-collectathon/` (including `office.ts`, `floors/*`, `director.ts`), all packages.
