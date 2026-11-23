Epic: 1, traffic pass
Depends on: none

## Environment
Read `docs/roadmaps/gta-traffic-pass/_env.md` first (working directory, node path, rules: no install, no commit, no dev server,
other workers editing other files).

## Goal
NPC drivers stop doubling back so often: when they pick their next errand they prefer places ahead of them, and the
Snail-Coach bus runs its stops in a loop instead of ping-ponging between the first two.

## Read first
- `games/gnome-theft-auto/src/errands.ts` (all of it, 220 lines): `pickErrand`, `pickBusErrand`, `BUS_ROUTE_PLACES`,
  `freshErrand`, `nextLeg`, `planRoute`.
- `games/gnome-theft-auto/src/traffic.test.ts` lines 1-105: the existing errand tests (they must keep passing) and `gridNodes()`.
- `games/gnome-theft-auto/src/config.ts`: `PLACES` (around line 505; each has `id, x, z, weight, far?`).

## Change
`games/gnome-theft-auto/src/errands.ts`:
1. Add `export const ERRAND_BEHIND_WEIGHT = 0.3;` with a comment: a place behind the driver is this much less likely to be
   picked as its next errand.
2. In `pickErrand`, when `came` is given and both the `from` node and the `came` node exist: heading `h = (from - came)` (x, z).
   A place is "behind" when `(place.x - from.x) * h.x + (place.z - from.z) * h.z < 0`. Its weight in the roll becomes
   `p.weight * ERRAND_BEHIND_WEIGHT`; places ahead keep `p.weight`. Use the adjusted weights for both `total` and the roll.
   Nothing else in `pickErrand` changes (signature, filters, the 6 tries, `planRoute(..., came)`).
3. In `pickBusErrand(w, from, came)`: if `from` is the node of stop `BUS_ROUTE_PLACES[i]` (`w.placeNode.get(id) === from`),
   try the stops in order starting at `i + 1` (wrapping round); otherwise start at index 0. Return the first stop whose node
   is not `from` and whose route plans. Keep the final `pickErrand` fallback.
4. Do not change `freshErrand`, `nextLeg`, `planRoute`, `placeNodes` or any signature.

Create `games/gnome-theft-auto/src/errands.test.ts` (vitest; copy `gridNodes()` from traffic.test.ts; `placeNodes(nodes)`):
1. Bus loop: start at the node of `BUS_ROUTE_PLACES[0]`, call `pickBusErrand` 8 times, each time from the previous errand's
   last path node (`came` = the node before it in that path); the place ids visited are the four stops in order, twice.
2. Bias: node (0, 0) reached from node (0, -60) (heading +z). With a seeded random (write a tiny LCG
   `let s = 1; const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)`), 400 `pickErrand(w, 'ride-on', mid, south, rand)`
   picks; the share of places with `z >= 0` is at least 0.1 higher than over 400 picks with `came` undefined (fresh seed).
3. `nextLeg` with `errand = null` at node (0, 0) coming from (-60, 0): 200 calls never return `to === came`.
   At a dead end (the spur's last node, x = 374) coming from x = 300 it returns `to === came`.
4. `freshErrand(w, 'snail-coach', to, from)` returns a place in `BUS_ROUTE_PLACES`.

## Done when
- `npx vitest run src/errands.test.ts src/traffic.test.ts` passes, run from `games/gnome-theft-auto`
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in errands.ts or errands.test.ts

## Out of scope
traffic.ts, traffic.test.ts (do not edit; just run it), trafficSim.ts, config.ts, every other file.
