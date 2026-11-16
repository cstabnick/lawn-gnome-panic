# Roadmap: Mower Chain (snake.io / agar.io with lawn mowers, online by default)

## Goal

- Open the page and you are in a shared arena: a chain of lawn mowers (head + trailing mowers) mows grass pellets and grows. Hit another chain's body and you die and spill gold clippings. Biggest chain tops the leaderboard.
- **Online by default**: the page auto-queues on the shared server (`packages/mp-server`, game id `mower-chain`, no waiting, drop in any time). The first player in an arena hosts it (runs the world in their browser, bots fill to 14 mowers); everyone else sends inputs and draws host snapshots. If the server is unreachable the game runs the same world locally, offline, with bots.
- One game, `games/mower-chain`: Vite + TypeScript + Phaser 4.2.1, DOM overlay for UI.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner, direct) | config.ts (types, tuning), net/protocol.ts, stubs for every module, `GAMES['mower-chain']` in packages/mp, main.ts, BootScene; `tsc` passes. | direct (done) |
| 2. Four modules | sim+bots, rendering+textures, online session, scenes+HUD are done; `npm run build -w games/mower-chain` passes; smoke test passes; two browsers see each other. | 4, parallel |

## Epic 2

Shared Environment text for every issue:

- Repository root: /home/user/lawn-gnome-panic (Linux, bash). Run commands from the root. Node 22 and npm are installed; `npm install` has been run.
- Game: games/mower-chain, Vite + TypeScript (strict) + Phaser 4.2.1 (`import Phaser from 'phaser';`). No new dependencies.
- Read first: games/mower-chain/src/config.ts (all shared types and TUNING numbers) and your stub file. config.ts, main.ts, net/protocol.ts and scenes/BootScene.ts are read-only. The exported names and signatures in your stub are final: other workers' code already calls them. Replace the bodies, you may add more exports and private helpers.
- Four workers edit four different sets of files at once. Edit only the files your issue names. If `tsc` reports errors only in files you do not own, another worker is mid-edit: wait a minute and re-run; do not edit those files.
- Check with `npx tsc --noEmit -p games/mower-chain`. Do not start a dev server and do not run `vite build`. Do not run `git commit`.
- No external assets; draw everything in code.

### 2.1 Simulation and bots (sim.ts, bot.ts)

~~~~text
Epic: 2
Depends on: none

## Goal
The authoritative game world, pure TypeScript with no Phaser or DOM, plus the bot brain.

## Change
- games/mower-chain/src/sim.ts: implement `class World` (keep the stub's methods and signatures). Rules, using TUNING from config.ts:
  - World is WORLD_SIZE square. Mowers store a head position, heading (rad), score, alive flag, protectedS, boost flag, last input, and a list of body segment positions.
  - Movement each step(dt): turn heading toward input.angle by at most TURN_RATE*dt along the shortest arc; head moves at SPEED, or BOOST_SPEED while boosting. Boost works only if score >= MIN_BOOST_SCORE; while boosting, lose BOOST_COST*dt score and drop one grass pellet (kind 0) at the tail end every 0.25 s.
  - Body: the number of body segments is min(MAX_SEGS, START_SEGS + floor(score / SCORE_PER_SEG)). Segments follow the head along its path, SEG_SPACING apart (keep a path history of head points; segment i is the point at distance (i+1)*SEG_SPACING back along the path). Segments are shown in MowerSnap.segs as [headX, headY, seg1X, seg1Y, ...].
  - Pellets: keep TUNING.PELLET_COUNT grass pellets (kind 0, value GRASS_VALUE) at random spots; top up each step. A head within HEAD_R + PELLET_R of a pellet eats it: score += value. Gold pellets (kind 1, value GOLD_VALUE) are created when a mower dies and never respawn on their own; remove gold pellets older than 60 s (keep a timestamp per pellet) so they do not pile up.
  - Death: a head within HEAD_R + SEG_R of any BODY segment (not the head) of another alive mower dies (skip while protectedS > 0 for the victim; mowers with protectedS > 0 also cannot kill... they still have solid bodies). Leaving the arena (head outside 0..WORLD_SIZE) also kills ('wall'). Head-on heads touching each other: both are fine (no kill). On death: alive=false, spill DEATH_DROP_FRACTION*score worth of gold pellets (one gold per GOLD_VALUE of score, at most 60) at random body segment positions, push a WorldEvent ({kind:'kill', id, by, name, byName} or {kind:'wall', id, name}).
  - addMower: spawns at a random spot at least SPAWN_MARGIN from the edge, random heading, score 0, protectedS = RESPAWN_PROTECT_S, the full START_SEGS body laid out straight behind the head; push a 'spawn' event. respawn(id): same as addMower with the same name and color, only if that mower is dead.
  - Bots: mowers with id < 0 are bots. Each step, humans = mowers with id > 0; keep max(0, BOT_TARGET - humans) bots alive (add bots named from a list of 20 lawn-themed names like "Mulchy", "Clippy", "Edgar", ids -1, -2, ...; with random PLAYER_COLORS-like colours of your choice). Remove surplus bots when humans join. A dead bot is respawned after 2 s. Every 0.1 s (not every step) each bot calls botInput(selfSnap, allMowerSnaps, pellets, rng) and gets that input.
  - `snapshot(now)`: builds a Snapshot (t = now). Dead mowers are not included in `mowers`. Round segment coordinates to 1 decimal to keep it small.
  - Use a small seeded PRNG (mulberry32) from the constructor seed for all randomness, so no Math.random.
- games/mower-chain/src/bot.ts: implement `botInput`. Behaviour: steer toward the nearest grass/gold pellet within 600 units (gold preferred if similarly close); if a body segment of another mower is within 160 units in front of the head (within +-70 degrees of the current heading), turn away from it (perpendicular, away side); if the head is within 250 of a wall, steer toward the arena center; add small random wobble. Never boost unless fleeing and score >= 30. Compute the heading from segs[0..3] of `self` (angle from segment 1 to the head).

## Contract
Exactly the stub's signatures (World constructor/addMower/removeMower/setInput/respawn/step/snapshot/drainEvents; botInput). `World` must work in a Node-free browser: no imports except from './config' and './bot'.

## Done when
- `npx tsc --noEmit -p games/mower-chain` has no errors in sim.ts or bot.ts.
- Write a throwaway script outside the repo (use the scratchpad dir) that is run with `npx tsx` if available, else skip: create a World(1), addMower(1,'me',0xff0000), step 3000 times at dt=1/30 with random inputs, and confirm it never throws and the snapshot has mowers and pellets. If tsx is unavailable, state so in your report instead.

## Out of scope
Every other file.
~~~~

### 2.2 Rendering and textures (render.ts, textures.ts)

~~~~text
Epic: 2
Depends on: none

## Goal
Draw a Snapshot as a lawn with chains of lawn mowers, and generate all textures in code.

## Change
- games/mower-chain/src/textures.ts: implement `makeTextures(scene)`. With `scene.make.graphics({ x: 0, y: 0 }, false)` draw and `g.generateTexture(key, w, h)` then `g.destroy()` for each key in TEX (config.ts), at the sizes noted there:
  - head (48x48): a top-down push lawn mower facing +x: a WHITE rounded deck rectangle (so `setTint(color)` colours it), two dark wheels at the sides, a thin dark handle line at the back (-x side), a small engine cap, and a darker front "grille" notch. Keep the white deck as the dominant colour.
  - body (40x40): the same mower, smaller and simpler.
  - grass (16x16): a bright green tuft (three short blades). gold (24x24): a golden clipping with a lighter highlight.
  - tile (128x128): seamless light/dark green lawn stripes (two bands of slightly different greens).
- games/mower-chain/src/render.ts: implement `class ArenaView` (keep the stub's constructor/update/destroy signatures):
  - Background: a `scene.add.tileSprite(0, 0, 4000, 4000, TEX.tile)` kept sized to the camera and positioned so it scrolls with the world (simplest: a big tileSprite covering the world, origin 0,0, depth 0). Outside the arena (beyond WORLD_SIZE) draw dark brown fences: a Graphics rectangle outline of the world, 24 px thick, depth 1, color 0x5d3a1a. Set the camera background colour to 0x1d3d1d so outside looks darker.
  - Pellets: one pooled set of Images (grow the pool on demand, hide unused), texture TEX.grass or TEX.gold by kind, depth 2. Only show pellets inside the camera's worldView (plus 50 px).
  - Mowers: for each MowerSnap keep pooled Images: segments drawn back to front (so the head is on top), depth 3 + a little. Segment 0 uses TEX.head, others TEX.body, `setTint(m.color)`, rotated to face along the chain (angle of the vector from the next segment toward this one; the last segment copies the one before it). Scale each segment 1 for head, 0.85 for body. When `boosting`, add a small brownish puff (a few pooled Images with TEX.grass tinted grey) behind the tail: optional, skip if it complicates. When protectedS > 0 make the whole chain alpha blink between 0.4 and 1 (4 Hz). A Text label with `m.name` above the head (pooled, depth 4, font 14px bold white with black stroke 3). Your own mower (id === meId) gets a name too.
  - Smoothness: keep the previous Snapshot; render an interpolated position between prev and current using the elapsed time since the current arrived (use `snap.t` changes to detect a new snapshot; interpolate over the measured gap between the last two snapshot times, clamped to 30..200 ms). Interpolating segment positions linearly is enough. If a mower id is absent from prev, no interpolation for it.
  - Camera: follow the interpolated head of meId (lerp the camera scroll 15% per frame), or the world center if meId is null or absent from the snapshot. Zoom: `base = min(cam.width, cam.height) / TUNING.VIEW_UNITS`; zoom = base * (1 / (1 + 0.12 * Math.log2(1 + segCount / 10)))... use any smooth function that shrinks the zoom slowly as the chain grows, never below 0.45*base; ease toward the target zoom.
  - Minimap: a small Graphics drawn on a second camera is more than needed; instead draw it in the same scene with `setScrollFactor(0)` at the bottom-right corner 120x120 px: arena square, a dot per mower (colour = mower colour, my dot white with a ring). Because the camera zoom scales scroll-factor-0 objects, instead create a second camera `scene.cameras.add(...)` that only shows the minimap objects and make the main camera ignore them (`cam.ignore(obj)`), or skip the minimap entirely if this proves fiddly (report which).
  - `destroy()` destroys every object and camera you created.

## Contract
Texture keys exactly as TEX in config.ts. `new ArenaView(scene)`, `view.update(snap, meId, dtMs)`, `view.destroy()`.

## Done when
- `npx tsc --noEmit -p games/mower-chain` has no errors in render.ts or textures.ts.

## Out of scope
Every file except render.ts and textures.ts. Do not touch the HUD (DOM, another worker).
~~~~

### 2.3 Online session (online.ts)

~~~~text
Epic: 2
Depends on: none

## Goal
The session that connects to the shared matchmaking server by default, hosts or joins the arena, and falls back to a local offline world.

## Read first
- packages/mp/src/client.ts: `serverUrl()`, `createNetClient(url, game, hello)` and the NetClient interface.
- packages/mp/src/protocol.ts: ServerMsg types ('welcome', 'match', 'joined', 'left', 'host', 'relay', 'ended', 'error'), PlayerInfo, TIME constants.
- games/mower-chain/src/net/protocol.ts: the GameMsg union you send and receive.
- games/mower-chain/src/sim.ts: the World API (stub today; another worker implements it, keep to its signatures).
- games/gnome-golf/src/online.ts (first 80 lines only): an example of a game on this server.

## Change
- games/mower-chain/src/online.ts: implement `createSession(name)` returning the `Session` object (keep the interface).
  - Imports: `import { createNetClient, serverUrl } from '@lawn/mp/client'; import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol'; import { checkName } from '@lawn/mp/textFilter';`. Hello game id is HELLO_GAME from config.ts. Use `name` as given if `checkName(name)` accepts it (read textFilter.ts for the return shape), else 'Mower'.
  - Start: status 'connecting'. If `serverUrl()` is '' go offline. Else `client.connect()`, then `client.queue(null, 'mower', name)`. If connect fails or no 'match' message arrives within 4 seconds, go offline (and `client.drop()`).
  - On 'match': record `you` as myId, `hostId`, and the players list. status 'online'. If I am the host (you === hostId): create `new World(seed)`, `addMower` for each human player (id, name, color from PlayerInfo), start stepping. If I am a client: wait for snapshots.
  - Host duties: in `update(dtMs)` accumulate time and call `world.step(1 / TUNING.SIM_HZ)` for each whole SIM step (cap at 5 steps per frame). Every 1000/SNAP_HZ ms send `{k:'snap', s: world.snapshot(performance.now())}` with `client.send(null, ...)`; and `{k:'events', e}` from `world.drainEvents()` when non-empty (also push those to the local event list). The host's own input goes straight to `world.setInput(myId, input)`. Handle relay messages: 'input' -> `world.setInput(from, in)` (validate angle is a finite number, boost boolean); 'respawn' -> `world.respawn(from)`. On 'joined' -> `addMower` for the new player. On 'left' -> `removeMower(id)`. Own 'respawn()' calls `world.respawn(myId)`.
  - Host migration: on a 'host' message, if hostId === myId, become host: create a fresh `World(Date.now())`, add all humans still known, and continue (the arena restarts; acceptable). Track the humans list from 'match', 'joined' and 'left'.
  - Client duties: `setInput` sends `{k:'input', in}` to the host (`client.send(hostId, ...)`) at most INPUT_HZ times a second (store the latest and send from update). Latest 'snap' is stored; `update()` returns the latest snapshot (ArenaView interpolates itself). `respawn()` sends `{k:'respawn'}` to the host. 'events' relayed messages are appended to the event list.
  - If the connection drops or 'ended' arrives, or no snapshot for 5 s as a client, go offline: create a local World(Date.now()), `addMower(1, name, 0x4fd8ff)`, myId = 1, isHost = true, status 'offline'.
  - Offline mode: same host stepping, no sending. `humans` is 1.
  - `humans` = number of human players in the arena. `destroy()` drops the client and stops everything. `drainEvents()` returns and clears queued events.
  - `update()` returns null until the first snapshot (host/offline: the first snapshot is available right after the World exists).

## Contract
Exactly the Session interface and `createSession` signature in the stub.

## Done when
- `npx tsc --noEmit -p games/mower-chain` has no errors in online.ts.
- Re-read your code once for: host stepping uses fixed dt; no allocation of a new World per frame; every message from the network is validated before use.

## Out of scope
Every file except online.ts. packages/mp and packages/mp-server are read-only for you.
~~~~

### 2.4 Scenes and HUD (TitleScene.ts, GameScene.ts, hud.ts)

~~~~text
Epic: 2
Depends on: none

## Goal
The title screen, the game scene that wires session + view + input, and the DOM HUD.

## Change
- games/mower-chain/src/hud.ts: implement `class Hud` (keep the stub's signatures). On construction append your own `div` container to `document.getElementById('ui')` (never restyle or hide #ui itself; #ui is `pointer-events:none`, give your interactive pieces `pointer-events:auto`). Contents:
  - Top-left: my score and length ("LENGTH 12", with length = segs.length/2 of my mower in the snapshot; score rounded).
  - Top-right: leaderboard of the top 8 mowers by score ("1. Mulchy 120"), my row highlighted; bots shown normally.
  - Top-center: a small status chip from `session.status`: 'connecting' -> "Connecting...", 'online' -> "ONLINE · N players" (N = session.humans), 'offline' -> "OFFLINE · playing with bots".
  - Bottom-left: kill feed from addEvents(): up to 5 lines for 5 s each, e.g. "Mulchy mowed Clippy" for kill (byName mowed name), "Clippy hit the fence" for wall. Ignore 'spawn'.
  - Death overlay: shown when meId is not null and my mower is absent from the snapshot (it is dead). Centered panel "You got mowed", final score (remember the last score seen while alive), and a big "PLAY AGAIN" button (click or Enter/Space) calling `onRespawn()` then hiding the panel. Only show it after we have seen ourselves alive at least once.
  - Style: system-ui, white text with a dark text-shadow, semi-transparent dark panels with rounded corners, large enough to read on a phone. `destroy()` removes the container.
- games/mower-chain/src/scenes/TitleScene.ts: Phaser scene `TitleScene` (SCENES.title). Dark green background; a DOM overlay appended to #ui: big title "MOWER CHAIN", a subtitle "Mow grass. Grow your chain. Don't hit anyone else's.", a text input for the name (maxlength 14, placeholder "Your name", value remembered in localStorage key 'mower-chain-name' inside try/catch), and a big PLAY button (also Enter key). Draw a few decorative mowers by showing a chain of 4 `TEX.head`/`TEX.body` images wiggling across the Phaser scene (tinted different colours, simple sine tween). On play: remove the overlay and `this.scene.start(SCENES.game, { name })` (name trimmed, default 'Mower'). The game starts connecting immediately after, so there is no ONLINE button: online is the default.
- games/mower-chain/src/scenes/GameScene.ts: Phaser scene `GameScene` (SCENES.game); `create(data: { name: string })`:
  - `const session = createSession(data.name)`, `const view = new ArenaView(this)`, `const hud = new Hud(() => session.respawn())`.
  - Input: each frame compute the wanted angle from the pointer relative to the screen center: `Math.atan2(pointer.y - cam.height/2, pointer.x - cam.width/2)` (pointer = `this.input.activePointer`; before any pointer move, keep the heading 0). Boost while the left mouse button/touch is held (`pointer.isDown`) or Space is held. Call `session.setInput({ angle, boost })` every frame (online.ts rate-limits itself).
  - `update(_time, delta)`: `const snap = session.update(delta)`; if snap: `view.update(snap, session.myId, delta)`; `hud.addEvents(session.drainEvents())`; `hud.update(snap, session.myId, session)`.
  - On scene shutdown (`this.events.once('shutdown', ...)`) destroy session, view and hud.

## Contract
Uses exactly these existing exports: `createSession(name): Session` (online.ts), `new ArenaView(scene)`, `.update(snap, meId, dtMs)`, `.destroy()` (render.ts), `makeTextures` has already run in BootScene so TEX keys exist. The Hud class signature is the stub's.

## Done when
- `npx tsc --noEmit -p games/mower-chain` has no errors in the three files you own.

## Out of scope
Every other file, especially sim.ts, bot.ts, render.ts, textures.ts, online.ts, config.ts, main.ts.
~~~~
