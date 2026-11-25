Epic: 2 Places and rides
Depends on: epic 1 (tubing ski physics `SKI`/`towTuning`/`rampKick`/`TOW_COURSES`/`courseNear`, prefabs `water-skis`,
`ski-rack`, `wake-ramp`, `beach-hut`)

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Worker: Sonnet. Other workers edit `src/coast/*.ts`,
`packages/achievements`, `src/mapPois.ts` at the same time. You own `src/tubing/runtime.ts`, `src/tubing/view.ts`,
`src/tubing/runtime.test.ts`, `src/tubing/view.test.ts`, `src/jobs/protocol.ts` (+ its test) only.

## Goal
Water-skiing and tubing on the Saltwater: at the Last Tube (Driftwood's beach hut) the player rents a tube or a pair of
water-skis and, with no boat of their own, is towed by Driftwood's boat round the Saltwater slalom and over the wake
ramp; anyone driving their own boat can tow skiers as well as tubers (online too). Skis are the vehicle kind
`'tow-ski'` (already in `config.ts` VEHICLES, `net.ts`, `types.ts`), so other players see a skier wherever the rider is.

## Read first
- `games/gnome-theft-auto/src/tubing/runtime.ts` (all of it: rack, rental, `hopOn`, `stepRider`, driver tick with NPC
  riders, the `SYS.tow` adapter, HUD, `prompt`/`interact`, `blips`) and `src/tubing/view.ts` (`createTubingView`,
  `buildBuoys`, ropes).
- `games/gnome-theft-auto/src/tubing/types.ts` (`TowMode`, `TubeState.mode`, `SKI`, `towTuning`, `Tubing`, `TubingDebug`),
  `tow.ts` (`newTube(b, slot, sea, mode?)`, `stepTube`, `rampKick(t, ramp)`, `WakeRamp`), `course.ts` (`TOW_COURSES`,
  `OCEAN_COURSE`, `LOCH_COURSE`, `courseNear(x, z)`, `stepRun(..., gates)`).
- `games/gnome-theft-auto/src/jobs/protocol.ts` (`TowWire`, `encodeTow`, `decodeTow`) and its test.
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST.lastTube`, `COAST.wakeRamp`, `COAST.towLoop`, `COAST.towSpeed`,
  `COAST_ACH.waterSkier`, `COAST_ACH.wakeJump`).
- `games/gnome-theft-auto/src/boatTraffic.ts` `steerToward` (and how NPC boats are driven) — for Driftwood's boat.
- `docs/lore/entries/apocrypha/the-last-tube.md`, `driftwood-castaway.md` (his voice for toasts).

## Change
1. **Mode everywhere.** `TubeState.mode` comes from what the rider sits on: a `'tow-ski'` vehicle rides in `'ski'`
   mode, a `'tow-tube'` in `'tube'` mode (`newTube(..., mode)`). `drives(v)`, auto-hook, `hopOn`, rental and the rider
   step accept both kinds (`v.kind === 'tow-tube' || v.kind === 'tow-ski'`). NPC riders: keep tubes; add
   `addNpcRider(mode?: TowMode)` support so a driver can add an NPC skier (trainer: `tubing.addNpcRider()` keeps its
   meaning). The view draws skis for ski riders (a `water-skis` prefab under the rider instead of the tube; the rider
   stands rather than sits: lift the gnome model and lean it with `st.lean`).
2. **Courses.** The driver's run uses `courseNear(boat.x, boat.z)` when the tow line goes out (store the course; HUD and
   blips use its gates and its name); `view.buildBuoys()` builds the buoys of every course in `TOW_COURSES` (it built
   only the loch's). The wake ramp: place prefab `wake-ramp` (scale 5, yaw `COAST.wakeRamp.yaw`, floating at the water
   surface) at `COAST.wakeRamp`; every rider step calls `rampKick(st, COAST.wakeRamp)` before `stepTube`.
3. **The Last Tube.** A second rack at `COAST.lastTube.rack` (keep the Mossbank one): a `beach-hut` (scale 2.2) at
   `COAST.lastTube.hut` with `coastSign("THE LAST TUBE\nTubes 8 · Skis 11\nDriftwood tows. Driftwood is not sorry.", ...)`
   from `../coast/sign`, and a `ski-rack` prop beside the rack. The E prompt there: "Rent a tube (8 🌰)" — and a second
   choice for skis. The game's interaction is one prompt per spot, so put **two spots** 3 m apart: tube rack at
   `rack`, ski rack at `rack.x + 4`. Renting puts the tube / skis in the water at `COAST.lastTube.launch`, seats the
   player on it at once (`deps.seatPlayer`), and starts **Driftwood's tow** (below) unless the player is online and a
   remote boat with its tow line out is within `TOW.hookRange` (then ask to hook on as `hopOn` does today).
4. **Driftwood's tow (solo play).** A local NPC boat (`createVehicle(deps.scene, 'walnut-dinghy' or another small
   existing boat kind, ...)`, `driver = 'npc'`, pushed to `deps.vehicles`) that follows `COAST.towLoop` (closed loop) at
   `COAST.towSpeed`, steering with `steerToward` and moving itself kinematically (set x, z, yaw, speed each frame along the
   loop; keep it on water). The player's tube/skis are towed by it with the same `stepTube` path as a remote host's boat
   (build the `BoatPose` from this boat). The run counts `OCEAN_COURSE` gates with `stepRun(..., OCEAN_COURSE.gates)`;
   gate and finish toasts as today. The tow ends (boat drifts back to the launch and is removed after 20 s) when the
   player falls and does not re-board within 15 s, leaves the vehicle, or completes 2 laps; then toast a Driftwood line
   ("Same time tomorrow. Bring your own sharks."). Riding with Driftwood is local only (other players see your skier
   and tube via the normal vehicle relay, not his boat): say so in a code comment.
5. **Achievements.** While riding in ski mode and not fallen, add towed metres; every whole 10 m call
   `deps.increment(COAST_ACH.waterSkier, 10)` (the catalog target is 2000). On a `'landed'` event in ski mode with
   `air >= 1` that started within 2 s after a `rampKick` returned true: `deps.unlock(COAST_ACH.wakeJump)`.
   Dispatch `window.dispatchEvent(new CustomEvent('gta:tow-run', { detail: { course: id, gates, finished, mode } }))`
   whenever an ocean run passes a gate or finishes (the quest issue listens for it).
6. **Online.** `jobs/protocol.ts`: `TowWire` gains `mode: TowMode` (the driver's tow line mode for NPC riders and the
   HUD); encode it in the existing `on` number as `0` off, `1` tube, `2` ski, and make `decodeTow` accept 0..2 (older
   records with 1 still mean tube). Update the protocol test. Player riders need no wire change (their vehicle kind says
   ski or tube).
7. `tubing.debug()` (`TubingDebug`): add `mode` to `ride` and `course` id to `tow`; add `driftwood: boolean`.
8. Mobile: renting is an E prompt (the touch action button shows "Rent"); lean and hop already map to touch.
9. Tests: `runtime.test.ts` / `view.test.ts` keep passing; add a test that `encodeTow`/`decodeTow` round-trip each mode,
   and a pure test for the Driftwood loop follower if you write it as a pure function (recommended:
   `export function followLoop(loop, s, ds): { x, z, yaw, s }` in `runtime.ts`).

## Contract
Vehicle kind `'tow-ski'` = skis; `TowWire.mode`; window event `'gta:tow-run'` `{ course, gates, finished, mode }`;
achievements `COAST_ACH.waterSkier` (increment by metres, 10 at a time) and `COAST_ACH.wakeJump` (unlock).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files; `npx vitest run src/tubing src/jobs` passes.

## Out of scope
`src/tubing/types.ts`, `tow.ts`, `course.ts` (epic 1 finished them; report a needed change instead), `src/coast/*`,
`app.ts`, `config.ts`, the prefab catalog.
