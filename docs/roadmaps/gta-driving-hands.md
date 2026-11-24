# Gnome Theft Auto: driving hands tied to the wheel

Report: "make it so that my wheels are more properly tied to the hands when driving". The hands should stay on the steering
control and turn with it, on every vehicle, for the player, NPC and online drivers, and while getting in and out.

## Causes (with evidence)

Measured with a vitest probe (a seated gnome posed as `player.ts` does, every roster kind, steer -1 / 0 / 1), before the fix:

1. **19 of 25 kinds had nothing to hold.** Only rigged Pay 'n' Glaze kinds with a `steer` mount (push-bike, ride-on, lowrider,
   zero-turn) had grips. Golf cart, every boat, every aircraft, the odd rides, the Boot Float and the Mulch-Spreader had no grip
   data, so their drivers' hands sat in the lap. Most of them also had no turning control at all: the golf cart's, mulch
   spreader's, boot float's and clog cruiser's wheels were plain merged parts, and the aircraft had no stick or yoke.
2. **Both hands dropped off at full lock.** `poseHands` gave up on both hands as soon as one grip was past 1.45 arm lengths.
   Ride-on and lowrider at full lock: the far grip was 0.474 from the shoulder (limit 0.464), so both hands left the wheel (0.11 and
   0.34 off the grips). Zero-turn: 0.56, both hands 0.21 and 0.45 off. Push-bike: the near grip went inside the 0.75 minimum stretch
   and the hand pushed through the bar (0.03 past it).
3. **The player's hands were posed a frame early.** `app.ts` called `player.updateRiding` (seat and hands) before the frame's
   `syncVehicleMesh` placed the vehicle mesh and turned its wheel. The gnome and its hands sat where the vehicle was the frame
   before (speed x dt behind, about 0.33 units at 20 u/s) and the wheel turned a frame after the hands.
4. **Aircraft pilots did not ride the airframe.** `updateRiding` copied the chassis tilt only for ground vehicles, so in a banked
   plane the pilot sat upright, poked out of the cockpit, and the yoke (once there was one) was out of reach.
5. **Getting in ended with a snap.** The mount sequence cleared the hands every frame, so they only started easing onto the wheel
   after the sequence ended, and the seated "settle" phase faced the vehicle's centre: from an off-centre seat (golf cart, copter)
   the gnome sat turned sideways, then snapped round. Getting out snapped the hands off the wheel.
6. **Online drivers' wheels never turned.** Remote steering is not sent, so `steerVis` stayed 0 and the wheel (and the hands on
   it) stayed straight.
7. **Smaller things:** `reachArm` allocated a result object per hand per frame. The teacup's cup handle (a mesh named `handle`)
   was picked up as the steering pivot and yawed with the steering.

## Fix

- `src/driveGrips.ts` (new): `DRIVE_CONTROLS`, one entry per vehicle kind: the control (wheel, handlebar, tiller, lap bars, yoke,
  rim), its pivot, both grips (prefab-local), its turn axis and lock angle. Where the prefab has no turning control, a body
  variant (`@lawn/glaze` `registerSteerVariant`, extended with `groupParts` / `moveParts` / `from` / `addParts`) makes the
  existing wheel part turn, brings it within reach, or adds a yoke, helm or handlebars. Rings that turn about their own face get a
  spoke so the turn shows. `poseControl` turns the pivot about the control's own axis (a tilted golf-cart wheel spins about its
  face, a yoke rolls) on top of any damage-bent rest pose.
- `src/driverHands.ts`: each hand's target is the control pivot's `matrixWorld` applied to the grip's pivot-local point, every
  frame (Glaze rig markers first, so styled wheels keep their own grip radius). Each hand blends on its own, so one hand never drops
  the other. Stretch band 0.55..1.65 arm lengths; the hand ball lands exactly on the grip. A hand that lets go eases from its last
  grip pose (`releaseHands`). `settleHands` re-aims a steering hand after a body-moving driving personality (anim/rideAuto.ts) and
  leaves the arm the personality posed alone. No allocation per frame: module scratch values, one arm-parent inverse per gnome,
  grip frames cached per vehicle and rebuilt only when the body or pivot changes.
- `src/vehicles.ts`: builds the body variants (`resolveBodyPrefab`), turns controls with `poseControl`, records the control pivot
  on the body (`userData.controlPivot`, refreshed after every rebuild), ignores meshes that share a pivot name, and reads an online
  driver's steering off their turn rate.
- `src/app.ts`: `syncVehicleMesh(v, 0)` before `player.updateRiding` and before drawing a mount frame.
- `src/player.ts`: pilots ride the airframe too. `drawMount(pose, dt, v, seat)` holds the wheel while seated (settling in, waiting
  for the door) and lets go smoothly otherwise. `settleHands` after the ride animator. `src/mount.ts`: a seated gnome faces the nose.
- `src/traffic.ts`: `settleHands` after the NPC rider's ride animator.
- `src/glazeMounts.ts`: grip constants exported; zero-turn grips on the rear half of the lap bars (z -0.2), in reach at full lock.

## Per-vehicle grips

Prefab-local units (multiply by the kind's scale for world units). Stretch is the range over steer -1..1 measured in headless Edge
(1 = arm length 0.32).

| Kind | Control | Grips (left; right is mirrored) | Axis, lock | Stretch | Notes |
| --- | --- | --- | --- | --- | --- |
| push-bike | handlebar (`handle`) | 0.25, 0.625, -0.25 | down, 0.45 | 0.62..1.16 | Glaze mounts |
| ride-on, lowrider | flat wheel | 0.2, 0.56, -0.147 | down, 0.45 | 0.97..1.64 | Glaze mounts, styled wheels via rig markers |
| zero-turn | lap bars | 0.32, 0.6, -0.2 | down, 0.35 | 0.59..1.43 | grips moved back from z -0.1 |
| combine | small wheel in the cab (added) | 0.055, 1.37, 0.25 | (0,-.87,-.5), 0.7 | 0.74..1.33 | |
| plane (crop duster) | yoke (added) | 0.045, 0.4, 0.15 | +z, 0.6 | 1.15..1.26 | |
| whirligig | yoke (added) | 0.12, 0.62, 0.04 | +z, 0.6 | 1.18..1.39 | |
| boot-float | tractor wheel, brought 0.12 back | 0.1125, 0.66, 0.93 | ring face, 0.9 | 0.95..1.53 | old post dropped, column from the front |
| mulch-spreader | own wheel, turns | 0.13, 0.89, 0.27 | ring face, 0.9 | 1.02..1.6 | |
| clog-cruiser | own wheel, 0.25 back | 0.2, 0.95, -1.1 | +z, 0.9 | 1.05..1.57 | |
| watering-can-steamer | helm (added) | 0.15, 1.38, -2.25 | +z, 1.2 | 1.24..1.55 | |
| hoa-patrol-boat | helm on the console (added) | 0.12, 0.88, -0.3 | +z, 1.2 | 1.19..1.5 | |
| pot-rod | own wheel, moved into the pot | 0.09, 0.5, 0.12 | down, 0.45 | 1.22..1.48 | |
| lawn-roller | own tiller bar | 0.18, 0.625, -0.2 | down, 0.45 | 1.06..1.37 | |
| teacup-trundler | own wheel, raised out of the tea | 0.07, 0.56, 0.12 | down, 0.45 | 0.75..0.91 | |
| barrow-buggy | handlebars (added) | 0.15, 0.6, 0.12 | down, 0.45 | 1.01..1.33 | |
| golf-cart | own wheel, 0.08 back | 0.48, 1.07, 0.04 / 0.16, ... | ring face, 0.9 | 1.2..1.65 | column moves with it |
| hedge-hopper | yoke (added) | 0.15, 1.15, 0.08 | +z, 0.6 | 1.07..1.37 | |
| sycamore-copter | yoke (added) | 0.5, 1.0, 0.5 / 0.2, ... | +z, 0.6 | 1.13..1.4 | pilot bench is +x |
| dandelion-drifter | basket rim (does not turn) | 0.25, 0.85, 0.654 | none | 1.23..1.29 | |
| walnut-dinghy, gravy-boat | none | | | | rowed / paddled (anim/rideAuto.ts) |
| snail-coach, hoa-van, taxi | none | | | | closed cabs |
| tessie | none | | | | ridden |

`src/driveGrips.test.ts` checks every kind: both hands within 0.02 of their grips at steer -1, -0.5, 0, 0.5, 1, going forwards and
in reverse, stretch inside the band, the grips on the drawn control and turning with it (a right turn moves the left grip up or
forward), hands still on after a Glaze look change, `settleHands` under a body lean, the table covering every kind but the listed
exceptions, and a pure-maths reach check on the table.

## Screenshots

Headless Edge, dev server on 5436 (`?debug&offline&no-intro&mount=<kind>&mountat=...`), a close-up camera in front of the driver,
one frame each at centre, full left, full right and reversing at full right:
`C:\Users\cpsai\AppData\Local\Temp\claude\cd359eeb18c8ad5a\64352718-8c0a-4946-abb0-2e31bccb7964\scratchpad\hands\<kind>-<centre|left|right|reverse-right>.png`,
with `report.json` (distance from each hand ball to the nearest vertex of the control mesh, and the arm stretch). The capture script is
`...\scratchpad\hands-shots.mjs`. The scratchpad is temporary: re-run the script to make them again.

## Known limits

- Driving personalities (anim/rideAuto.ts) take the LEFT hand off the wheel on purpose for many kinds (golf cart, ride-on,
  lowrider, pot rod, teacup, barrow, boot float, and every NPC). The steering hand stays on.
- Online drivers (remotes.ts, not changed here): their gnome does not take the vehicle's tilt, so on a steep slope or in a banked
  plane their hands can ease off the control. Their steering is estimated from the yaw rate, so reversing turns the wheel the wrong way.
- Distant NPC riders animate on a stride (animStride.ts): between stride frames their hands lag the turning wheel slightly.
- On the Boot Float, the sing-along personality's body sway can pull the right hand off the rim at full lock when it moves past the
  stretch band. The hand comes back when the sway does.
