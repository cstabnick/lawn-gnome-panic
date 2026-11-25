Epic: E05-2 Interiors and rooftops (showcase interiors run in the same wave)
Depends on: none (codes against the InteriorKit interface)
Also read and follow: `docs/roadmaps/gta-batch-3/E05/issues/3-showcase-common.md` (environment, rules, done-when).

## Goal
The Thorne Even-Estates sales floor inside the Double Pot is a furnished walk-in room with a lift to the Thorne
Helipad on the tunnel-roof slab, and a lift kiosk on the slab that brings the player back down:
`games/gnome-theft-auto/src/interiors/showcase/doublePot.ts`.

## Read first
- `games/gnome-theft-auto/src/interiors/types.ts` (`kit.stairsTo(x, z, to, prompt)`: `to` a world pose `{x, y, z, yaw}` leaves the interior to that point).
- `games/gnome-theft-auto/src/interiors/showcase/doublePot.ts` (the stub: keep id, name, door, exit, size, theme, `DOUBLE_POT_ROOF_ARRIVAL`, `DOUBLE_POT_ROOF_LIFT`).
- `games/gnome-theft-auto/src/interactables.ts`: `addInteractSpot({ x, z, y?, prompt, run })` (with `y`, only answers a player within 2 m of that height, so people in the tunnel under the slab do not see it).
- `games/gnome-theft-auto/src/interiors/runtime.ts`: `enterInterior(id)`.
- `docs/lore/rulings.md` R-166 (Thorne Even-Estates, Levelright Construction, Vesper's HOA, the Double Pot).

## Change
`doublePot.ts`: keep the def's fields; add `ambience: 'silent'`; write `build(kit)`; add two exports.
Room 18 x 14 x 4.5 (x -9..9, z -7..7), door on the east wall `kit.door(8.8, 0, -Math.PI / 2)` (keep). Layout:
- `kit.room()`; a beige carpet `put('rug', -1, 0, 0, { solid: false, size: 7, tint: 0xd8c8a8 })`.
- The scale model: plinth `kit.block(2.4, 0.9, 2.4, -2, 0, { color: 0xe0d6c2 })`; on it `gnome-cottage` (y 0.9,
  size 1.8, tint 0xd8c8a8, solid false) and three more identical small `gnome-cottage` (size 0.6, same tint) in a row
  at (-2.7..-1.3, 0.8) y 0.9 solid false (every home identical: that is the luxury).
- Sales desk: `kit.block(3, 1.0, 1, 3, -4.6, { color: 0xbcae94 })`, a `ledger` on it (y 1.0, solid false), a `chair`
  behind at (3, -5.6) yaw 0. Resident: `kit.npc({ id: 'sales', name: 'Even-Estates sales gnome', x: 3.8, z: -5.6, yaw: 0, look: { hat: 0xd8c8a8, shirt: 0xbcae94, beard: 0xeeeeee }, line: 'Every home identical. That is the luxury. Sign here, here, and here, also here.' })`.
- Posters (signs, bg 0xf3ecdc, fg 0x5d4e37): north wall (-5, 2.6, -6.95) yaw 0 "THORNE EVEN-ESTATES\nEVERY LAWN THE SAME LENGTH" (w 3, h 1);
  north wall (1, 2.6, -6.95) yaw 0 "HOA RULE 1: BEIGE.\nRULE 2: SEE RULE 1." (w 2.4, h 0.9);
  south wall (-3, 2.4, 6.95) yaw `Math.PI` "NOW SELLING PHASE 3\n(PHASES 1 AND 2 PENDING)" (w 2.8, h 0.9).
- Vignette 1, the bin of rejected colours: a `barrel` at (6.8, 5.6) with four small `kit.block(0.25, 0.04, 0.35, ...)`
  swatches (solid false) in red 0xe53935, green 0x43a047, blue 0x1e88e5, yellow 0xfdd835 lying round its foot and a sign
  on the south wall above it (6.8, 1.8, 6.95) yaw `Math.PI`: "REJECTED COLOURS" (w 1.4, h 0.4).
- Vignette 2, the lawn measured to the millimetre: a second small `rug` (size 1.6, tint 0x6b8e23, solid false) at (5.5, 2)
  as a sample turf, `brass-calipers` on it (solid false, y 0.02) and `tall-one-pencil` beside it.
- Vignette 3, the waiting area where one chair faces the wall (someone wore the wrong hat): three `chair` along the
  south wall at (0.5, 6.2), (1.5, 6.2), (2.5, 6.2) yaw `Math.PI`, the third turned to face the wall (yaw 0).
- Windows on the north wall (the west wall holds the lift): `kit.window(-7.5, -6.95, 0)` and `kit.window(6.5, -6.95, 0)`.
- The lift on the west wall: doors `kit.block(0.15, 2.4, 1.6, -8.85, 0, { color: 0xb0bec5, solid: false })`, a sign above
  (-8.95 + 0.05, 2.9, 0) yaw `Math.PI / 2` "LIFT: ROOF / HELIPAD" (w 1.4, h 0.35), and
  `kit.stairsTo(-8.0, 0, DOUBLE_POT_ROOF_ARRIVAL, 'Take the lift to the Thorne Helipad')`.
- Export `installDoublePotRoofLift(): void`: call `addInteractSpot({ x: DOUBLE_POT_ROOF_LIFT.x, z: DOUBLE_POT_ROOF_LIFT.z, y: DOUBLE_POT_ROOF_LIFT.y, prompt: 'Take the lift down', run: () => enterInterior(DOUBLE_POT_INTERIOR) })` once (module flag).
- Export `buildDoublePotRoof(scene: THREE.Scene): void`: a lift kiosk on the slab, `buildPrefab('cab-rank-booth', { lights: false })`
  (from `@lawn/prefabs`; if the grep shows it is missing use `portacabin` scaled to 3 m wide) placed at
  (DOUBLE_POT_ROOF_LIFT.x, 9.02, DOUBLE_POT_ROOF_LIFT.z + 0.8) yaw `Math.PI`, scaled so its widest side is 2.4 m
  (Box3, like `fitPrefab` in `src/cutscene/rooms.ts`). Call `installDoublePotRoofLift()` from it.
  (app.ts calls `buildDoublePotRoof(scene)` once; that wiring is done by the planner, not you.)

## Contract
Interior id `double-pot-sales` (exported `DOUBLE_POT_INTERIOR`); `DOUBLE_POT_ROOF_ARRIVAL`, `DOUBLE_POT_ROOF_LIFT`;
`buildDoublePotRoof(scene)`, `installDoublePotRoofLift()`.

## Out of scope
Every other file (rooftopsBuild.ts registers the slab and its helipad; app.ts wiring is the planner's).
