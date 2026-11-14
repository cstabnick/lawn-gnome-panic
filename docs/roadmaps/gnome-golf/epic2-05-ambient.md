Epic: 2 Systems · Issue 5: ambient life (gnomes on other holes, the raft, seagulls)
Depends on: none

## Goal
`src/ambient.ts` makes the island feel lived in: a few groups of gnome golfers play the other holes in the distance, seagulls wheel over the shore, and now and then a gnome on a little grass raft (the castaway from our game Gnaft) drifts past offshore.

## Read first
- `games/gnome-golf/src/config.ts`: `HOLES`, `GameState`, `ISLAND`
- `games/gnome-golf/src/course.ts`: `heightAt`, `coastRadius`, `distToCoast`
- `games/gnome-golf/src/models/gnome.ts` (exports `createGnomeModel(look)`) and `src/models/config.ts` (`GnomeLook`, `PlayerState`)
- `games/gnome-golf/src/models/mowerModels.ts` (exports `createMowerModel(tier)` with tiers 'reel' | 'green' | 'yellow' | 'red' | 'combine')
- `games/gnome-golf/src/ambient.ts` (stub)

## Change
- `games/gnome-golf/src/ambient.ts`: implement `createAmbient(ctx: Ctx): System`.
  1. **Bot groups**: 3 groups. Each group = 3 gnomes (`createGnomeModel` with random hat/shirt/pants colours from small palettes, beards on some, `hair: { color, style: 'pigtails' }` + `dress: true` on some) + a simple cart (build it locally: a coloured box body 2.2 x 0.6 x 1.4 on 4 dark cylinder wheels, a white roof box on 4 posts; facing +z) + one white ball (sphere r 0.1). Groups start on holes 3, 5 and 7 (index 2, 4, 6) at a random point of their routine.
     Routine per group, on its hole `h` (a simple state machine with timers; vary each step +-30% with Math.random):
       a. `address` 2.5 s: one gnome (rotating who plays) stands beside the ball facing it, others stand by the cart.
       b. `swing` 0.6 s: the player's arms (`model.arms.left/right.rotation.z`) sweep from -2.2 to +2.0.
       c. `ballFlight`: the ball flies along a parabola to the next target T: from the tee or current spot, 60% of the remaining path distance toward the green (min 25 yd), or onto the green when within 160 yd; flight time 3.5 s, apex height 0.15 * distance. On the green they "putt": ball slides along the ground 2 s to the pin and disappears.
       d. `drive` 3-4 s: the cart drives (straight line, y from `heightAt`, facing the travel direction) to beside the new ball spot with all 3 gnomes riding (place them on the cart at y + 0.5), then they get off.
       e. After the putt: the group moves to the next hole `(h + 1) % 9`'s tee (the cart drives there, max 6 s), but **skip any hole equal to `state.holeIndex`** (the player's hole): go to the following one. Also if the group is currently on the player's hole when the player starts it (phase 'intro'), immediately teleport the group to the tee of the hole after it.
     Animate walking with `model.update(ps, dt)` using a PlayerState (`{ position, velocity, facing, grounded: true, jumpsUsed: 0, stamina: 1, staminaDelay: 0, sprinting: false, exhausted: false }`): set velocity to the walking velocity when a gnome walks between the cart and the ball (1.5 yd/s), zero when standing. Override arms after `update` during the swing.
     Positions use the same frame as the player's party: the cart parks 4 yd to the hitter's left and 2.5 yd back from the ball (left of a shot along yaw a is (cos a, 0, -sin a)).
  2. **The raft** ("Gnaft" castaway): a 4 x 4 yd patch of grass on a raft: a green box (4 x 0.4 x 4, colour 0x4caf50) on a brown dirt box underneath (0x6d4c2e, 4.1 x 0.5 x 4.1), a gnome (`createGnomeModel` with hat 0xd93636, shirt 0x2f64c9, pants 0x6b4a2e, skin 0xf1c27d, boots 0x222222, beard 0xf4f4f4, the rest off) sitting near the edge holding a fishing rod (thin brown cylinder 2.5 yd, angled out over the water, with a white line down to a red-white bobber sphere on the water), a little push mower (`createMowerModel('green')`, scale 0.8) parked on the grass, and a stick mast with a patched sail (a cream plane). It appears first after 25 s, then every 70-140 s, if it is not already crossing. Path: let theta = atan2(ball.z, ball.x) of `state.ball`; R = coastRadius(theta) + 170; travel along the circle of radius R from angle theta - 0.55 to theta + 0.55 (or the reverse, random), at 3 yd/s along the arc; the raft yaw follows the travel direction. Bob: y = 0.1 + 0.12 * sin(t * 1.3), roll rotation.z = 0.04 * sin(t * 0.9), pitch rotation.x = 0.03 * sin(t * 1.1). The bobber bobs too. Hidden when not crossing.
  3. **Seagulls**: 6 gulls (white body box 0.5 x 0.2 x 0.25, two grey wing planes that flap: rotation.z = +-0.6 * sin(t * 6)) circling at radius 20-35 yd around points just off the coast nearest to the ball (pick the point at angle theta of the ball, at coastRadius(theta) + 10, recompute when the hole changes), height 14-22 yd, angular speed 0.25-0.4 rad/s, each with its own phase.
- All meshes castShadow except the gulls.

## Contract
`export function createAmbient(ctx: Ctx): System` (signature unchanged). Read-only on `state`. Do not import `cartModel.ts` (another worker is writing it now); build your own simple cart.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/ambient.ts`.
- 3 gnome groups play holes other than `state.holeIndex`; the raft crosses offshore within 30 s of load; gulls circle near the shore.

## Out of scope
Every other file, especially `src/models/*`.
