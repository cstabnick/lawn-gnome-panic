Epic: 2 Systems · Issue 4: golfer, partner and the mower golf cart
Depends on: none

## Goal
`src/party.ts` puts the player's gnome at the ball (addressing it, swinging with the meter), parks the lawn-mower golf cart and the playing partner just off to the side at every shot, and drives everyone to the ball between shots. `src/cartModel.ts` builds the riding-mower golf cart.

## Read first
- `games/gnome-golf/src/config.ts`: `GameState`, `PartySpots`, `Spot`, `PARTY`, `GOLFER_LOOK`, `PARTNER_LOOK`, `SWING`
- `games/gnome-golf/src/round.ts`: `mowerPose`, `partySpots` (how spots are placed)
- `games/gnome-golf/src/models/gnome.ts` (top 80 lines and the returned object near the end) and `src/models/config.ts` (`GnomeModel`, `PlayerState`)
- `games/gnome-golf/src/party.ts` (stub)

## Change
- `games/gnome-golf/src/cartModel.ts` (new): `export function createCartModel(): { group: THREE.Group; seats: THREE.Vector3[]; animate(dt: number, speed: number): void }`. A riding lawn mower turned golf cart, built facing +z, base at y = 0, about 2.4 yd long, 1.5 wide: red body (0xd8342c) with a cream hood (0xf3e6c4), dark mower deck under the middle, 4 black wheels (bigger at the back, they spin in `animate` by speed), a two-gnome bench seat (seat top at y ~0.75), steering wheel on a column in front of the left seat, a white canopy roof on 4 thin posts (top ~2.1), and a golf bag (brown cylinder with 3 club heads poking out) strapped behind the seat. `seats` = local feet positions for the driver (left, +x) and passenger (right, -x), e.g. (0.32, 0.55, -0.1) and (-0.32, 0.55, -0.1). Engine shake: tiny rotation.z jitter when speed > 0. castShadow on all meshes.
- `games/gnome-golf/src/party.ts`: implement `createParty(ctx: Ctx): System`:
  - Create the golfer `createGnomeModel(GOLFER_LOOK)`, the partner `createGnomeModel(PARTNER_LOOK)` and the cart, add them to `ctx.scene`. Give each gnome a PlayerState object (`{ position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0, stamina: 1, staminaDelay: 0, sprinting: false, exhausted: false }`) and call `model.update(ps, dt)` every frame.
  - **Golf club** in the golfer's hands: a thin grey shaft (`CylinderGeometry(0.012, 0.012, 0.62)`) with a small dark head (box 0.1 x 0.05 x 0.05, a flat-faced box for the putter), added as a child of `model.arms.right`, positioned so it continues the arm downward from the hand (the hand is at local y = -0.32 in the arm pivot): shaft centre at (0, -0.32 - 0.31, 0), head at the bottom.
  - **Parked** (every phase except 'drive'): cart at `mowerPose(state)` (x, y, z, rotation.y = facing), partner standing at `state.party.partner`, golfer at `state.party.golfer` (position + facing). In 'title' still place them at `state.party` spots (the title camera is far away).
  - **Swing pose** (golfer, after `model.update` each frame, overriding the arms): both arms `rotation.set(-0.7, 0, swingAngle)` and `model.rig.rotation.y = swingAngle * 0.25`. The swing happens in the golfer's local x-y plane; the target is the golfer's local +x (left shoulder points at it), so negative swingAngle is the backswing. swingAngle by phase:
    - 'aim' / 'intro' / 'result' / 'drive'-arrival: 0 (address), with a slow waggle `0.08 * sin(t * 3)` in 'aim'.
    - 'swing', `state.swing.stage === 'power'`: `-2.4 * min(1, marker)` (backswing tracks the meter; overswing up to -2.6).
    - 'swing', stage 'accuracy': hold the top (-2.4 * power) and start easing down as the marker falls: `-2.4 * power * clamp(marker / power, 0, 1)`.
    - 'flight', phaseTime < 0.25: sweep from the current angle to +2.2 (follow-through); then hold +2.2 (finish pose) through 'flight' and 'result'. For the putter use 25% of all these angles (a short pendulum).
    - 'holed': arms up celebration (`rotation.set(-2.6, 0, 0)` on both, a little bounce of the whole model y + abs(sin(t*8))*0.15) for birdie or better; otherwise just stand.
  - **Drive** ('drive' phase): hide neither gnome; seat them on the cart: golfer on `seats[0]`, partner on `seats[1]`, transformed by the cart's world matrix (`cart.group.localToWorld(seat.clone())`), facing the cart's facing, velocity zero, arms `rotation.set(-1.2, 0, 0)` (hands on the wheel). `cart.animate(dt, pose.speed)`.
  - **Partner idle**: when parked, the partner faces `state.party.partner.facing` (towards the ball) and claps (both arms rotation.x = -1.4 with rotation.z alternating +-0.3 at 8 Hz) during 'holed', otherwise stands with arms down.
- Use `mowerPose` and nothing else from round.ts; read-only on `state`.

## Contract
- `export function createParty(ctx: Ctx): System` (signature unchanged).
- `export function createCartModel(): { group: THREE.Group; seats: THREE.Vector3[]; animate(dt: number, speed: number): void }` in `src/cartModel.ts` (ambient.ts may later import it for the bot groups, so keep it exactly this).

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/party.ts` or `src/cartModel.ts`.
- In 'aim' the golfer stands beside the ball facing it, holding a club; the cart and partner are parked a few yards to the golfer's left and behind; in 'drive' both ride the cart to the next spot.

## Out of scope
Every other file, especially `src/models/*` (do not edit the gnome or mower model files) and `round.ts`.
