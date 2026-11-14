# Gnome Golf online: lobby, Together and Gnome w/ Friends, carts of 4, collisions

Goal: Gnome Golf and Gnome Disc can be played online by up to 12 players. Players start in a lobby; the host
picks the game (golf or disc) and the format, then starts. Players can join mid-round, and the scorecard shows
the hole they joined on.

- **Together**: one group. Everyone plays their own ball, farthest from the pin goes next, and every cart drives
  to that ball to watch, so the group funnels toward the hole. 4 gnomes per cart (seats 3 and 4 face backwards),
  with carts in different colours.
- **Gnome w/ Friends** (format `race`): everyone plays their own round at once, in their own cart; first to
  finish wins.
- Balls and thrown gnomes bounce off trees and parked golf carts.

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written directly) | `npm run build -w games/gnome-golf` passes; server knows `gnome-golf`; `online.ts` runs lobby, turns and relays; stubs for `obstacles.ts`, `lobby.ts`, `remotes.ts` | 0 (done by the planner) |
| 2. Systems | each file below filled in; build passes; two browsers can play a round together | 4 in parallel |

Epic 1 (done by the planner): `packages/mp/src/protocol.ts` (`gnome-golf` rules: 1-12 players, starts at once,
late join), `src/config.ts` (online types `Format`, `Golfer`, `RacePose`, `OnlineView`, `OnlineApi`,
`CART_SEATS`, `CART_COLORS`, `CART_BOX`, `CONVOY_GAP`, `NET`, `lookWithHat`), `src/round.ts` (`hooks`,
`canAct`, `isMyBall`, `convoySeats`, `cartCount`, `cartPose`, `convoySpot`, `beginTurn`, `forcePhase`,
`collisionCarts`, `seededWind`), `src/online.ts` (the whole net controller), input gating in `controls.ts` and
`disc.ts`, `cartModel.ts` signature (`createCartModel(opts)`, `seatFacing`), and the fix that hides the disc UI
outside disc mode.

## Epic 2 issues

~~~~text
Issue 2A: Tree and golf cart collisions
Epic: 2. Systems
Depends on: none

## Environment
Repo C:\Users\cstab\Documents\gaming, game games/gnome-golf (Vite + TypeScript + three.js). Windows, Git Bash:
if node is not found, run `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files
in this game at the same time (party.ts, cartModel.ts, remotes.ts, lobby.ts, hud.ts): do not touch them. Do not
run `vite build` or `npm run build` (it writes dist/ that others share); use the tsc command below. Do not git commit.
Units: 1 world unit = 1 yard, y is up.

## Goal
Golf balls and thrown gnomes (Gnome Disc) hit trees and parked golf carts instead of passing through them.
Right now trees are only drawn (world.ts) and the physics ignores them.

## Read first
- games/gnome-golf/src/obstacles.ts: the stub you fill in. Keep its exported signatures exactly.
- games/gnome-golf/src/world.ts: "Trees and palms" and "Big trees" sections (createWorld): how the four tree
  kinds are placed (mulberry32 seeds 7 and 21) and their geometry sizes.
- games/gnome-golf/src/physics.ts: simulateShot's while loop (airborne branch calls stepAir; rolling branch
  moves p by v). p and v are plain {x,y,z} objects there.
- games/gnome-golf/src/discPhysics.ts: the simulation loop (b.p and b.v are THREE.Vector3; skidding branch and
  flying branch).
- games/gnome-golf/src/config.ts: CART_BOX, XYZ, FlightEvent.

## Change
- NEW games/gnome-golf/src/trees.ts (pure, no scene; may import course.ts, config.ts and three types):
  move the tree PLACEMENT out of world.ts into exported data so drawing and collisions use the same trees:
    export interface Plant { x: number; y: number; z: number; s: number; yaw: number }
    export interface BigTree { x: number; z: number; s: number; yaw: number }
    export const TREES: { broadleaf: Plant[]; palms: Plant[]; oaks: BigTree[]; pines: BigTree[] }
  Built once at module load with the same seeds and loops as world.ts uses now (mulberry32(7) for broadleaf
  then palms, mulberry32(21) for oaks and pines, including the backdrop pass). Keep the oak lobe offsets
  (OAK_LOBES) and pine tier constants exported too if obstacles.ts needs them.
- games/gnome-golf/src/world.ts: use TREES from trees.ts instead of placing trees itself. Keep the look the same
  (the canopy colours may use a new RNG such as mulberry32(8) since the placement RNG moved).
- games/gnome-golf/src/obstacles.ts: implement collide(p, v, r) and keep setCarts/getCarts:
  Colliders, built once from TREES (s = tree scale, gy = heightAt(x, z) of the tree):
    broadleaf: trunk cylinder radius 0.2*s from gy to gy+4*s; leaves sphere radius 3*s centred gy+4.5*s.
    palms: trunk cylinder radius 0.3*s from gy to gy+7*s; leaves ellipsoid (rx=rz=3.6*s, ry=0.6*s) at gy+7*s.
    oaks: trunk cylinder radius 1.3*s from gy to gy+12*s; crown ellipsoid (11*s, 8*s, 11*s) at gy+15*s; two lobe
      ellipsoids (7*s, 5.5*s, 7*s) at the lobe positions world.ts computes.
    pines: trunk cylinder radius 0.7*s from gy to gy+18*s; three leaf ellipsoids at gy + [10,15,20]*s with
      rx=rz=[6,4.5,3]*s*0.7 and ry=[9,8,6]*s/2.
  Put the colliders in a spatial hash (16-yard cells, keyed by cell x/z; big trees go in every cell they
  overlap) so a check only looks at nearby colliders. collide() runs 120 times per simulated second.
  Responses (mutate p and v; ball radius r):
    trunk (vertical cylinder, horizontal distance < radius + r and gy <= p.y <= top): push p out radially to
      radius + r, reflect the horizontal velocity about the outward normal with restitution 0.5 on the normal
      part and 0.8 kept on the tangential part. Return 'trunk'.
    leaves (p inside an ellipsoid): multiply v.x and v.z by 0.85 and, if v.y > 0, v.y by 0.85 (per call, so a
      ball in a canopy loses most of its speed within a few steps and drops out). Return 'leaves'.
    cart (for each CartObstacle from setCarts: box centred on the cart's (x, z), rotated by its yaw, half-sizes
      CART_BOX.halfWidth across (local x) and CART_BOX.halfLength along (local z), from y to y + CART_BOX.height):
      transform p into cart-local space, expand the box by r; if inside, push p out along the axis of least
      penetration (sides, ends or the roof), reflect that velocity component with restitution 0.55, keep 0.8
      of the others. Return 'cart'.
    Check carts first, then trunks, then leaves; return the first hit, null when clear.
  Local yaw convention: yaw a points along (sin a, 0, cos a) (see the top of config.ts); local x is the
  cart's left-right axis, local z its forward axis.
- games/gnome-golf/src/physics.ts: in simulateShot, after each airborne stepAir() and after each rolling move,
  call collide(p, v, PHYS.ballRadius). On 'trunk' or 'cart' push an event
  { t, kind: 'bounce', lie: lieAt(p.x, p.z), speed } (speed = |v| before the hit) so the bounce sound plays.
  A rolling ball that hits something keeps rolling with the new velocity. Do not change anything else in the
  ball model: a shot that hits nothing must give exactly the same result as before.
- games/gnome-golf/src/discPhysics.ts: the same for the flying gnome (radius 0.35) in the flying and skidding
  branches, with the same 'bounce' event.

## Contract
obstacles.ts (final, used by round.ts which calls setCarts(collisionCarts(state)) before every shot):
  export interface CartObstacle { x: number; y: number; z: number; yaw: number }
  export function setCarts(list: CartObstacle[]): void
  export function getCarts(): readonly CartObstacle[]
  export function collide(p: XYZ, v: XYZ, r: number): 'trunk' | 'leaves' | 'cart' | null
Physics stays deterministic (no Math.random): every client replays the same shot and must get the same flight.

## Done when
- `npx tsc --noEmit -p games/gnome-golf` passes (run from the repo root).
- A node check (write it in your temp dir, not the repo; or reason it through with a small tsx/esbuild script
  if available) or careful reading shows: a ball fired horizontally at a broadleaf trunk bounces back; a ball
  through a canopy slows sharply; a ball fired at a cart set with setCarts([{x, y, z, yaw}]) bounces off it.
- world.ts draws the same number of trees as before (700-candidate broadleaf fill, 160 palms, 70 oaks, 60 pines).

## Out of scope
party.ts, cartModel.ts, remotes.ts, lobby.ts, hud.ts, round.ts, online.ts, config.ts (other workers or done).
~~~~

~~~~text
Issue 2B: 4-seat golf carts, the convoy and online gnomes
Epic: 2. Systems
Depends on: none

## Environment
Repo C:\Users\cstab\Documents\gaming, game games/gnome-golf (Vite + TypeScript + three.js 0.187). Windows, Git
Bash: if node is not found, run `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing
other files in this game at the same time (trees.ts, world.ts, obstacles.ts, physics.ts, discPhysics.ts,
remotes.ts, lobby.ts, hud.ts): do not touch them. Do not run `vite build`/`npm run build`; use the tsc command
below. Do not git commit. Units: yards, y up; yaw a points along (sin a, 0, cos a).

## Goal
Online, every player is their own gnome with their colour on the hat. In the lobby and in Together mode the
players ride in a convoy of 4-seat golf carts (seats 3 and 4 on a rear bench facing backwards; carts in
different colours) that drives to whichever ball is being played; the player whose turn it is gets out and
plays, everyone else stays seated watching. In race mode (GNOME W FRIENDS) I ride my own cart in my colour.
Solo play stays exactly as it is now.

## Read first
- games/gnome-golf/src/cartModel.ts: createCartModel(opts: CartOptions) returning CartModel { group, seats,
  seatFacing, animate }. You implement the 4-seat version.
- games/gnome-golf/src/party.ts: today's solo golfer + partner + 2-seat cart (swing pose, holed celebration,
  riding, cigarillo, golf water). Keep this path for solo.
- games/gnome-golf/src/config.ts: section "Online play" (Golfer, OnlineView, CART_SEATS, CART_COLORS, CART_BOX,
  lookWithHat), GameState.online, GOLFER_LOOK.
- games/gnome-golf/src/round.ts: cartPose(state, k), cartCount(state), convoySeats(state), mowerPose(state)
  (= cartPose(state, 0)), canAct(state).
- games/gnome-golf/src/models/gnome.ts: createGnomeModel(look) -> GnomeModel (object, rig, arms, update(ps, dt)).

## Change
- games/gnome-golf/src/cartModel.ts: when opts.seats === 4, build a longer cart that fits inside CART_BOX
  (centred on the origin: |x| <= 0.8, |z| <= 1.5, height <= 2.1): front bench for seats 0 (driver, +x side,
  steering wheel in front of it) and 1, and a rear bench behind it for seats 2 and 3 facing BACKWARDS (its
  backrest between the two benches, a small footrest at the back). seatFacing = [0, 0, Math.PI, Math.PI].
  Longer canopy over both benches, golf bags can go on the sides. opts.color colours the body (default red).
  The 2-seat cart (default) must look exactly as now, apart from opts.color.
- games/gnome-golf/src/party.ts:
  - state.online === null: unchanged behaviour.
  - Online: one gnome per golfer (createGnomeModel(lookWithHat(g.color))), created when first seen (keyed by
    golfer id) and removed from the scene when the golfer leaves (g.left) or the match ends (state.online
    null). Each gets a golf club in its right hand (like today's golfer) shown only while it is the one
    playing, and a name tag above the head: a THREE.Sprite with a canvas texture of the name in the golfer's
    colour on a dark rounded backing (rgba(0,0,0,0.55)), sizeAttenuation true, about 1.6 x 0.4 yd, 2.0 yd
    above the gnome's feet; the tag of the player whose turn it is gets a ▶ before the name.
  - Lobby (state.online.started false) and Together (format 'together'): cartCount(state) 4-seat carts, cart k
    in CART_COLORS[k], placed every frame at cartPose(state, k) (position x/y/z, rotation.y = facing, animate
    with speed while state.phase === 'drive'). Seat each golfer from convoySeats(state): seat world position
    = cart.group.localToWorld(seats[seat]), facing = cart facing + seatFacing[seat]; the driver (seat 0) holds
    the wheel (arms like today's WHEEL_ARM), others rest their arms. Exception, the shooter
    (state.online.turn) when not riding (phase !== 'drive') and the round has started: they stand and play
    exactly like today's solo golfer (state.party.golfer spot, swing angle from swingAngle(), holed
    celebration), using their own gnome. In disc mode the shooter's gnome is hidden unless riding (disc.ts
    draws the thrown gnome), like today.
  - Race (started, format 'race'): like solo but with one 2-seat cart in my golfer's colour at mowerPose(state),
    no partner, and my own gnome (lookWithHat(my colour)) as the golfer. Other players are drawn by remotes.ts,
    not here: in race mode party.ts only draws me.
  - The solo golfer, partner and solo cart are hidden whenever state.online is not null.
  - Cigarillo and golf water: keep them working for solo. Online, attach the cigarillo (and the golfer's can)
    to the gnome that is playing (Object3D.add re-parents), or skip them online if that gets messy.

## Contract
Do not change exported signatures of round.ts/config.ts. createParty(ctx: Ctx): System stays.
createCartModel(opts?: CartOptions): CartModel stays (remotes.ts calls createCartModel({ color })).

## Done when
- `npx tsc --noEmit -p games/gnome-golf` passes (from the repo root).
- Solo play looks unchanged (read through your solo path: same objects, same poses).
- With a fake online state (e.g. in a temporary local test, not committed) cartCount 3 gives three carts in
  red, blue and yellow, 12 gnomes seated, the rear-bench gnomes facing backwards.

## Out of scope
round.ts, config.ts, online.ts, controls.ts, disc.ts, remotes.ts, lobby.ts, hud.ts, physics, world.
~~~~

~~~~text
Issue 2C: Race mode opponents (remotes.ts)
Epic: 2. Systems
Depends on: none

## Environment
Repo C:\Users\cstab\Documents\gaming, game games/gnome-golf (Vite + TypeScript + three.js 0.187). Windows, Git
Bash: if node is not found, run `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other
files in this game at the same time: only edit remotes.ts. Do not run `vite build`/`npm run build`; use the tsc
command below. Do not git commit. Units: yards, y up; yaw a points along (sin a, 0, cos a).

## Goal
In GNOME W FRIENDS (race) mode, every other player's cart, gnome and ball are drawn on the island where they
are, moving smoothly, with a name tag, so you can see who is ahead.

## Read first
- games/gnome-golf/src/remotes.ts: the stub. Keep `export function createRemotes(ctx: Ctx): System`.
- games/gnome-golf/src/config.ts: section "Online play": Golfer (race: RacePose | null), RacePose (hole, phase,
  mode, cart {x,y,z,facing,speed}, riding, golfer {x,y,z,facing}, ball, finishedS), OnlineView, lookWithHat.
- games/gnome-golf/src/cartModel.ts: createCartModel({ color }) -> { group, seats, seatFacing, animate(dt, speed) }.
  Another worker is changing this file's insides at the same time; only use that exported signature.
- games/gnome-golf/src/models/gnome.ts: createGnomeModel(look) -> GnomeModel; models/config.ts PlayerState.
- games/gnome-golf/src/party.ts: how the solo code positions a gnome (place(): fill a PlayerState, call
  model.update(ps, dt)) and seats it on the cart. Read only; do not edit.

## Change
- games/gnome-golf/src/remotes.ts: createRemotes(ctx) returns a System whose update(dt):
  - Shows remote players only when ctx.state.online is set, started, and format === 'race'. Otherwise hides
    (or disposes) everything.
  - For each golfer g with g.id !== online.me, !g.left and g.race !== null: keep one entry keyed by g.id with a
    2-seat cart (createCartModel({ color: g.color })), a gnome (createGnomeModel(lookWithHat(g.color))), a ball
    (small sphere radius 0.12, white, MeshStandardMaterial) and a name tag sprite (canvas texture: the name in
    the golfer's colour on a dark rounded backing rgba(0,0,0,0.55); under it a small line "Hole N · S strokes",
    or "Finished" when race.finishedS !== null; about 2.2 x 0.7 yd, 2.4 yd above the gnome, sizeAttenuation true,
    depthTest false so it shows through trees). Redraw the tag canvas only when its text changes.
  - Smooth toward the latest pose: each frame move the shown cart/gnome/ball position toward the target by
    1 - exp(-10 * dt) and the yaw along the shortest arc. Snap instead if the target is more than 60 yd away.
  - riding: gnome sits on cart seat 0 (cart.group.localToWorld(seats[0]), facing = cart facing), arms forward.
    Otherwise the gnome stands at race.golfer (feet at its y) facing race.golfer.facing.
  - Ball: shown at race.ball in golf mode while race.phase is not 'title', 'card' or 'final'. In disc mode
    (race.mode === 'disc') hide the ball; while race.phase === 'flight' draw the gnome lying flat (rotate its
    object -PI/2 about x) at race.ball instead of standing.
  - Animate the cart with cart.animate(dt, riding ? race.cart.speed : 0).
  - Remove an entry (scene.remove its objects, dispose textures) when the golfer leaves or online play ends.

## Contract
`export function createRemotes(ctx: Ctx): System` (main.ts already calls it, after createParty).

## Done when
- `npx tsc --noEmit -p games/gnome-golf` passes (from the repo root).
- Nothing is added to the scene in solo play (state.online === null).

## Out of scope
Every other file.
~~~~

~~~~text
Issue 2D: Online lobby, online scorecard and turn display (lobby.ts, hud.ts)
Epic: 2. Systems
Depends on: none

## Environment
Repo C:\Users\cstab\Documents\gaming, game games/gnome-golf (Vite + TypeScript, DOM UI). Windows, Git Bash: if
node is not found, run `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files in
this game at the same time: only edit lobby.ts and hud.ts. Do not run `vite build`/`npm run build`; use the tsc
command below. Do not git commit. Repo rule: UI modules append their own container to ctx.ui (the shared #ui
element) and never restyle or hide #ui itself. Phones matter: layouts must work at 360 px wide, touch targets
>= 44 px, use pointerdown like the existing buttons.

## Goal
Players can go online from the title screen, wait in a lobby where the host picks the game and format and
starts, see whose turn it is during play, and see everyone's scores (with the hole each late joiner joined on)
on the scorecard.

## Read first
- games/gnome-golf/src/config.ts: section "Online play": OnlineApi (every method and getter, read the doc
  comments), OnlineView, Golfer, RacePose, Format, GameMode; GameState.online.
- games/gnome-golf/src/hud.ts: title screen (#gh-title, TEE OFF / GNOME DISC buttons, act()), banner, scorecard
  (#gh-card, updateCard, the NEXT HOLE / PLAY AGAIN button), CSS style.
- games/gnome-golf/src/lobby.ts: the stub. Keep `createLobby(ctx: Ctx, online: OnlineApi): System`.
- games/gnome-golf/src/main.ts: createHud(ctx, online) and createLobby(ctx, online) are already wired.

## How online play looks in GameState (online.ts manages it, you only read it and call OnlineApi)
- Not online: state.online === null, online.status 'off'.
- Connecting: online.status 'connecting' (state.online still null).
- Lobby: state.online set, started false, state.phase 'title' (the camera orbits the island). online.status 'lobby'.
- Playing: started true. Together: state.online.turn is the id of the golfer playing now (null between holes);
  phases 'card' and 'final' are shown to everyone at once and only the host can press the button
  (online.canNext()). Race: each player has their own phases; the card button is mine, except on 'final' where
  only the host can send everyone back to the lobby.
- Golfer.scores[i] is null for holes not played; Golfer.joinedHole is the 0-based hole they joined on;
  Golfer.left marks players who left (keep them on the card, greyed, "(left)").
- Golfer colours are 0xRRGGBB numbers; use `#${c.toString(16).padStart(6, '0')}` for CSS. Names come from other
  players: always set them with textContent (never innerHTML).

## Change
- games/gnome-golf/src/hud.ts:
  - Title: add an ONLINE button next to TEE OFF and GNOME DISC (same style, a teal colour), shown only when
    online.available. Pressing it opens lobby.ts's online panel: dispatch
    `window.dispatchEvent(new CustomEvent('golf:online-panel'))` and lobby.ts listens for it.
  - Hide the whole title (#gh-title) whenever state.online !== null or online.status === 'connecting', and while
    lobby.ts's panel is open (lobby.ts adds the class `gl-open` to document.body while its panel is visible).
  - act(): when state.online !== null, the card button and Enter call online.next() (only if online.canNext())
    and never newRound/nextHole directly. Solo behaviour unchanged.
  - Scorecard when state.online is set and started: one row per golfer (state.online.golfers order; for the
    final card sort Together by to-par over holes played, lowest first, and race by finish time (race.finishedS,
    unfinished after, by holes played)). Row header: the name in its colour (textContent), "(you)" for me, a
    small "joined hole N" tag when joinedHole > 0 (N = joinedHole + 1), "(left)" greyed. Cells before
    joinedHole show "–". Keep the par row, the under/over-par circles and the TOT column. Race: add a "Time"
    column (m:ss from race.finishedS, blank until finished). The table scrolls horizontally on phones.
  - Card button online: label NEXT HOLE / BACK TO LOBBY (together final, or race final for the host);
    when !online.canNext() show it disabled (opacity 0.5) with the text WAITING FOR HOST.
  - During play (started, not card/final), Together: a pill under the top banner area (doesn't overlap the
    #gh-left panels or the minimap at the top right) reading "▶ NAME is up" (name in colour), or "Your turn!" in
    gold when online.turn === me. Race: a small leaderboard pill on the left under #gh-shot listing up to 6
    players: name (colour), "H{hole+1}", total strokes, ✓ when finished.
- games/gnome-golf/src/lobby.ts (own root div, own <style>, appended to ctx.ui; class prefix gl-):
  - Online panel (opened by the 'golf:online-panel' event; while open add class gl-open to document.body):
    name input (maxlength 18, prefilled with online.name; on change/submit show online.checkName(name) as an
    error if not null), PLAY PUBLIC (online.join(null, name)), a room code input (4-8 letters/numbers,
    upper-cased as you type) with JOIN ROOM (online.join(code, name)), CREATE ROOM (makes a random 5-character
    code from A-Z without I/O and digits 2-9, then online.join(code, name)), and BACK. Shows "Connecting…" while
    online.status === 'connecting' and online.message in red when it is not ''. Close the panel automatically
    once online.status becomes 'lobby' or 'playing'. Inputs must not trigger game keys: stopPropagation on
    keydown inside the panel.
  - Lobby panel (visible while online.status === 'lobby'): title "LOBBY", "Room CODE · share it with friends"
    (state.online.code) or "Public lobby"; the player list (name in colour, HOST tag on state.online.hostId,
    "(you)"); a game picker (GOLF / GNOME DISC) and a format picker (TOGETHER: "One group, farthest from the
    hole plays next, everyone rides along" / GNOME W FRIENDS: "Everyone plays their own ball at once in their
    own cart. First to finish wins."). The host can click them (online.configure(game, format)); others see the
    current choice (online.game / online.format) highlighted but not clickable. START ROUND for the host
    (online.start()); others see "Waiting for the host to start". LEAVE (online.leave()). Up to 12 players:
    the list must fit on a phone (two columns or scroll).
  - A small LEAVE button during play, only on the scorecard screens (phase 'card'/'final' while online), placed
    so it does not overlap the card's own button; it calls online.leave().
  - update(): refresh only what changed (compare a key string before rewriting DOM).

## Contract
createHud(ctx: Ctx, online: OnlineApi): System and createLobby(ctx: Ctx, online: OnlineApi): System (both
already called from main.ts). Do not change config.ts or online.ts; use OnlineApi as declared.

## Done when
- `npx tsc --noEmit -p games/gnome-golf` passes (from the repo root).
- Solo title, HUD and scorecard behave exactly as before when state.online is null and online.available is
  false (no ONLINE button then).

## Out of scope
Every other file (online.ts, config.ts, round.ts, party.ts, remotes.ts, physics, world).
~~~~
