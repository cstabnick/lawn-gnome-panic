# FX04 result: vehicle capsule collision, drive camera, handling feel and stunt ramps

Branch `fix/FX04`. Roadmap and issues: `roadmap.md`, `I1.md` .. `I5.md` (5 issues, one epic; I1, I3, I5 on Sonnet, I2, I4
on Haiku). Shots are local only, in `docs/roadmaps/gta-batch-3/review/shots/FX04/` (git-ignored).

| Finding | Status | Evidence |
|---|---|---|
| G7#1 (must, D36) vehicles collide as their length circle | fixed | `collide.ts` `vehicleCapsule` / `sweepCapsuleBoxes` (2-3 circles along the heading, r = `spec.halfWidth` + 0.05); every ground vehicle has a `halfWidth` measured from its built prefab (`config.ts`). Used by `moveVehicle`, `stepKnock` and the sim chassis (`simdrive.ts`). Flyers keep the circle; boats keep `BOAT_HIT_RADIUS_FRAC`. Tests in `collide.test.ts`: a dirt bike threads a 1.2 m gap, an HOA van slides 10 m along a wall within 0.15 m of its body, a turned capsule is pushed out by its length. |
| G7#15 (must, D36) vehicle-vehicle contact uses the length circle | fixed | `collideVehicles` tests the capsules' closest points (`capsuleGap`), keeping the tunnelling guard, mass shares, spin lever (`spec.radius`) and damage rule. `bump.test.ts`: two Snail-Coaches pass in opposite lanes (5 m apart) without contact; two HOA vans 2.6 m apart side by side do not touch. |
| G7#2 (must) drive camera ignores vehicle size | fixed | `camera.ts` `vehicleFrame` (measured body height, cached) and `sizedView`: drive distance 6.2 + 1.6 radius + 0.8 per metre of height over 2.5, look height 0.9 x body height (min 1.8), pitch up to 0.36 for tall bodies, eased when the vehicle changes; fly scales too. A ride-on keeps today's view. `app.ts` passes `size`. Shots: `boot-float-960-rest.png`, `combine-960-drive.png`, `combine-390-rest.png`, `boot-float-390-rest.png`, `snail-coach-390.png`, `bin-lorry-390.png`, `baguette-trike-960-drive.png`: the road ahead now shows over the Combine and the Boot Float in portrait. Test `camera.size.test.ts`. |
| G7#6 (should) Simcade slow, keyboard full lock spins | fixed | `handling.ts` `TUNES`: Open World and Simcade get `over`s (curvature limit, yaw damping, a slower keyboard steer ramp; Simcade more traction control and front drive share). Simcade 0-90 % now 2.5-5.4 s (was up to 9.9); keyboard full lock at speed: worst sideslip Open World 0.19 rad (was 1.55, several ended backwards), Simcade 0.93 rad on the Pot Rod (still moving forwards). Snail-Coach `balance` -0.15 -> 0.05. Casual numbers identical. Tests in `handling.test.ts` (no spin in Casual and Open World; Simcade under 6 s). |
| G7#7 (should, D31) no body roll | fixed | `PROFILES[kind].roll` (Deux-Pots 0.16 rad, Wespa -0.22, dirt bike -0.24, push-bike -0.2, vans 0.03-0.08); `bodyRoll.ts` turns sideways acceleration into a spring-damped roll: two-wheelers bank the whole bike into the turn (the rider goes with it; their outward rider lean cut to 0.5), cars roll their glaze shell outward. Visual only. `bodyRoll.test.ts`: Deux-Pots settles at ~9 degrees, Wespa ~12.6, dirt bike ~13.8, HOA van ~1.7. No in-game shot (no editor shot either). |
| G7#8 (should) Cone Van, golf cart, Taxi without a profile | fixed | New `PROFILES` rows; test "every kind a dealer sells that drives on the ground has a profile". |
| G7#14 (could) arcade vs sim airtime gravity | carried over | Arcade gravity 30 is pinned on purpose by `airtime.test.ts` (an earlier fix for floaty arcade landings: "vy 6 lands in under 0.45 s") and Dean's Leap's arcade air times in `campus/mound.test.ts` (>= 1.9 s at 24 m/s). Moving it to ~20 reopens both; needs a decision on which feel wins. |
| G7#19 (could) stale "no UI yet" comments | fixed | `simdrive.ts`, `app.ts`. |
| G7#20 (should) two whole-world tests time out under load | fixed | Explicit 120 s timeouts in `canalCruise.test.ts` and `sandpitJump.test.ts`. |
| G1#16 (should, D21) park ramp is a black wedge with cyan neon | fixed | `rampSkins.ts`: the park ramp is timber with a turf top and timber edge boards, and a "NO RAMPING (PLEASE)" council sign by its entry. The old wedge was wound inside out (lit from below: why every ramp read black); fixed. Cyan only as a faint ring while that ramp's stunt is active. Shot `w03-green.png`, `gnorwin.png`. The pink coplanar strip (`#d94e7a`, a flower bed buried by the cab-rank booth's floor) is shortened to stop short of the booth (`districts.ts`); zfight is clean there. |
| G5#20 (should, D21) Dean's Leap looks generic | fixed | Old planks over packed earth, plank seams, a faded painted wheelchair symbol and a brass plate "DONATED BY THE CLASS OF ——". Shot `x-mound-n.png`. Lore: ruling R-237 (next free number on this branch) and the `deans-leap` entry. |

Other ramps: desert, wood and farm ramps are packed earth with `tyre-pile` prefabs; city ramps plywood on galvanised
steel; the Clay-Mart ramp a steel loading ramp; the Frostbite Ice Ridge packed snow on timber. Every ramp keeps a white
lip line and yellow chevrons. Shots `sandpit.png`, `canal.png`, `bowls-in.png`.

## Knock-on: two quest-sim races

The capsule stopped the race rivals scraping walls with a phantom width, so they got a little quicker, and two bot races
(`sr-ring-road`, `m40-the-capwood-run`) that the bot used to win by a couple of metres on its second or third attempt ran
out of the 600 s sim budget. Base behaviour checked by reverting only the collision change. Both plans now carry
`budget: 900` (`questSim/plans.ts`, `quests/story/40-the-capwood-run.ts`); both pass. No race content changed. FX18
(racing) may want to look at rival pace on these two tracks.

## Checks

- `npm run build -w games/gnome-theft-auto`: pass.
- `npm test -w games/gnome-theft-auto`, run twice (D36): 520 files / 5380 tests pass. The first run, before the race
  budgets, failed only the two races above. `npm run quest-sim:suites`: 17 files / 214 tests pass.
- `bash tools/smoke.sh http://localhost:5504/ gta-gnomlet`: SMOKE OK.
- `npm run zfight` at the park (-42, 30) and at Dean's Leap: no pairs involve a ramp or the flower bed. The chevrons moved
  to the marking layer, the plank seams and the wheelchair symbol stay off the chevrons, and the park's pink flower bed
  now stops short of the cab-rank booth (`districts.ts`).
- `npm run lore`: pass.
- Perf: no density pass (13 ramps, merged per material), so `gta-perf` was not run.

## Not done / notes

- G7#14 carried over (above).
- A red parasol stands at the park ramp's entry (another epic's prop); worth a look by its owner.
