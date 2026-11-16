Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/bowler.ts` shows the current bowler: a bowl-cut gnome in the player's colours who stands at the aim position, does a four-step run-up and underarm swing in time with the ball, and then reacts big to the result. Each player's gnome has a floating name tag.

## Read first
- `games/gnome-bowling/src/config.ts`: `LOOKS`, `THROW`, `BALL`, `GameState`, `Player`, `ResultKind`, `ROUND`
- `games/gnome-bowling/src/models/config.ts`: `GnomeModel`, `PlayerState`
- `games/gnome-bowling/src/models/gnome.ts`: how `update` animates walking (it sets leg/arm rotation.x from velocity; you pose arms AFTER calling update)
- `games/gnome-bowling/src/game.ts`: `currentPlayer`

## Change
- `games/gnome-bowling/src/bowler.ts`: `createBowler(ctx): System`.

## Behaviour
- Keep one GnomeModel per player (build lazily from `{ ...LOOKS[p.look].look, hat: p.color }` the first time a player index is current; rebuild if `state.players` changes identity, e.g. a new game). Only the current bowler is visible. Hidden in 'title' and 'lobby'.
- Name tag: a `THREE.Sprite` with a CanvasTexture (rounded dark box, name in the player's colour, bold 52px), 1.6 x 0.4 world units, 1.5 m above the feet, `depthWrite false`.
- **Timeline** (the ball is drawn by pins.ts on the SAME timeline, so match it):
  - 'intro' / 'aim': stand at `(state.aimX, 0, -1.2)` facing down the lane (`facing = state.aimYaw`). Ball held at the right hip: right arm `rotation.x = -0.4`, left arm slightly out (`rotation.z = 0.3`). Idle breathing bob; in 'aim', ease the x position smoothly toward `state.aimX` as it changes (move, do not teleport; give the PlayerState a velocity so the legs shuffle).
  - 'approach': `t = state.phaseTime / THROW.approachSeconds`. Feet z = `-1.2 + 1.1 * ease(t)` (ease in-out), x lerps from `state.aimX` toward `state.input.x + 0.25` (the ball is at the right hand, -x side, so the body is 0.25 to the left of the ball). Velocity set from the motion so legs run. Right arm (`arms.right.rotation.x`): pendulum `-0.4` → backswing `+1.4` at t = 0.6 (arm swings back, positive x) → forward to `-0.9` at t = 1 (release, arm pointing down the lane). At t > 0.85 drop into a slide: the body lowers (`model.object.position.y -= 0.12`), left leg forward, right leg back, rig leans forward (`rig.rotation.x = 0.35`), left arm out to the side for balance (`rotation.z = 1.2`).
  - 'roll': hold the follow-through pose at the foul line for 0.5 s, then stand up and watch. "Body English": lean the rig sideways (`rig.rotation.z`) toward where the ball is heading (sign of `sim.ball[i].x - input.x` growing; ±0.3 rad), like a real bowler willing it over.
  - 'result': by `state.result.kind`:
    - strike/double/turkey/hambone: a jump (`position.y` bounce 0.4 m), spin round 360° on the spot (facing += 2π over 0.8 s), both arms up (`-2.8`); turkey and hambone: two jumps and a front flip (set `ps.grounded = false` and `ps.jumpsUsed` 0→2 to trigger the model's built-in flip, see gnome.ts).
    - spare: fist pump (right arm up `-2.6` pulsing), small hop.
    - gutter / miss: turn to face the camera (facing = PI), hands on head (both arms `rotation.x = -2.9`, `rotation.z = ±0.7`), slump (rig.rotation.x = 0.3), then sit down on the approach (lower position.y by 0.25 over 0.6 s).
    - split: scratch head (right arm up to the head, wobbling), shrug.
    - nine / pins: small nod or clap (arms in front, alternating).
  - 'final': the winner dances (hop + sway) if they are local; otherwise hidden is fine.
- All movement eased; no snapping between phases (lerp positions and arm angles with `1 - exp(-12 dt)`).

## Contract
`export function createBowler(ctx: Ctx): System`. Nothing else exported. Approach timeline exactly as above (feet z = -1.2 → -0.1; right hand ends at the release point).

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in bowler.ts
- The current bowler stands, runs up, swings, slides and celebrates per result kind; name tag shows.

## Out of scope
The ball (pins.ts draws it), spectators (lane.ts), the camera. Do not edit any other file, including models/*.
