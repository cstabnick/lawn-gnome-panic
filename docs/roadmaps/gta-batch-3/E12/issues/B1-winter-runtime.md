Epic: E12-B (winter sports, runtime)
Depends on: E12-A (all modules it calls are now built)
Agent: general-purpose (Sonnet): movement physics + game integration

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`winter/runtime.ts` makes winter sports playable: rent skis or a tea tray at the Woolly Sock Lodge and ride them down
Snowdrop Slope with `slideRider.ts`, ride the Bootlace Tow back up, run the Wool Run and the Tea-Tray Run against the
clock with best times, buy Hot Cocoa, borrow a rod at Theo's shanty, drill ice holes on Pail Pond, count Bear Hug and
ice catches, show a HUD line and touch buttons (Hop, Let go, Ride again), unlock the achievements, and serve the
`WinterApi` hooks. app.ts already calls every method of the `Winter` interface (see "Already wired").

## Already wired (do not change these files)
- `app.ts` creates `installWinter({ ...jobDeps, lendRod, bears, onFoot })` right after tubing; calls `winter.prompt` /
  `winter.interact` (on foot, after jobs and tubing), `winter.drives(v)` / `winter.stepRider(v, inp, dt)` in the
  vehicle-step slot for the vehicle the player drives (`v.driver === 'player'`), `winter.update(dt)` every frame,
  `winter.blips()`, `fishing onCatch -> winter.onCatch(water)`, and exposes `__gta.winter` under `?debug`.
- Vehicle kinds `'tea-tray-sled'` and `'snow-skis'` exist (config.ts VEHICLES; skis have `spec.stand` so the gnome stands),
  are in `net.ts VEHICLE_CODES` (online players see your ride and you on it: nothing else to relay), silent engines,
  untracked by the parked-vehicle ledger. Ordinary get-in/out works on them (E near a parked one).
- `deps` (JobsDeps): `scene, ui, world (world.boxes), hud (hud.toast(text, ms), hud.callout?(title, sub)), economy
  (economy.spend(n, reason): boolean, economy.state().acorns), vehicles, player (player.x/z/vehicle), play(sfx: Sfx),
  unlock(id), increment(id, by?), blocked(): string | null, seatPlayer(v), throwPlayer(v, vx, vy, vz)`, plus
  `lendRod()`, `bears()`, `onFoot()`.

## Read first
- `games/gnome-theft-auto/src/winter/types.ts` (all of it: tunings, places, ids, `Winter`, `WinterApi`, `WinterDebug`).
- `games/gnome-theft-auto/src/winter/runtime.ts` (the stub: `WinterDeps`, `winterApi()`, `installWinter`); keep exports.
- `games/gnome-theft-auto/src/winter/slideRider.ts`, `course.ts`, `tow.ts`, `save.ts`, `iceFishing.ts`, `hill.ts`,
  `pond.ts`, `winterApp.ts`: read only their exported signatures and doc comments.
- `games/gnome-theft-auto/src/tubing/runtime.ts` lines 380-500: a runtime that steps a ridden vehicle (`stepRider` writes
  `v.x/y/z/yaw/speed`, then `syncVehicleMesh(v, dt)`, then tilts `v.object`), spawns a ride (`createVehicle(scene, kind,
  x, z, yaw)`, `deps.vehicles.push`, `deps.seatPlayer`) and removes one (`removeVehicle(scene, v)` + splice).
- `games/gnome-theft-auto/src/collide.ts`: `sweepCircleBoxes(x0, z0, x1, z1, r, boxes, y)`, `wallBounce(vx, vz, nx, nz)`,
  `clampToWorld(x, z, half, r)`.
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt(x, z)`, `surfaceAt(x, z)` (returns the paint's surface kind: 'snow',
  'ice', 'grass', ...).

## Change
`src/winter/runtime.ts`, `installWinter(deps)`:
- Setup: `store = createWinterStore()`; `registerWinterItems()`; scenery `hill = buildSnowdropSlope(deps.scene)`,
  `pond = buildPailPond(deps.scene)`, `deps.world.boxes.push(...hill.boxes, ...pond.boxes)`; `ice =
  createIceFishing({ scene, surfaceAt, heightAt, toast: (t) => deps.hud.toast(t, 3000), play: () => deps.play('shutter'),
  onHole: () => store.recordHole() })`; `registerWinterApp({ store: () => store, dropSled, startRun: api.startRun,
  toast })`. Set the module's `api` so `winterApi()` returns it.
- Ground for the rider: `{ height: heightAt, surface: (x, z) => { const k = surfaceAt(x, z); return k === 'snow' ? 'snow' :
  k === 'ice' ? 'ice' : 'other'; } }`. Tuning: `SKI` for 'snow-skis', `SLED` for 'tea-tray-sled'. Fresh powder: while
  `getWeather()` (from `../weather`) is `{ kind: 'snow', intensity > 0.3 }` and the rider is on the slope, use a copy of
  the tuning with `muSnow * 0.85` and toast "Fresh powder!" once per snowfall.
- Per-ride state in a `Map<Vehicle, Ride>`: `{ slide: SlideState, runs: RunState[] (newRun for each RUNS entry whose ride
  === v.kind), tow: TowRide | null, prevX, prevZ }`, created on the first `stepRider` call (`newSlide(v.x, v.z, v.yaw,
  ground)`), dropped when the player is no longer on it.
- `drives(v)`: `v.driver === 'player' && (v.kind === 'tea-tray-sled' || v.kind === 'snow-skis')`.
- `stepRider(v, inp, dt)`:
  - Input: steer = inp.moveX; brake = max(0, -inp.moveY); push = max(0, inp.moveY); jump = inp.jump || hopPressed
    (the touch Hop button).
  - Tow: when not towing and `canGrab(v.x, v.z, speed)` and push > 0.5 (or the touch "Grab tow" button): start a tow
    (`startTow()`), toast once "Hold on. Let go at the top." While towing: `stepTow`; the ride follows `towPoint(s)` (y on
    `heightAt`, yaw = the line's yaw), slide velocity = line direction * TOW.speed; jump or brake > 0.5 or the "Let go"
    button lets go early; at `done` the ride is let go at the top facing south (yaw 0) with zero speed and a toast "Top
    of Snowdrop Slope. The Wool Run starts west of here." Runs are not stepped while towing.
  - Otherwise: `stepSlide(slide, input, ground, tune, dt)`; then walls: `sweepCircleBoxes(prev, new, v.spec.radius,
    deps.world.boxes, slide.y)`; on a hit: `wallBounce` the velocity; if the impact > `tune.crashSpeed`: throw the player
    (`deps.throwPlayer(v, vx * 0.5, 3, vz * 0.5)`), toast "Tumble! Nobody cracks on snow." and stop processing this ride.
    `clampToWorld` with `WORLD_HALF` from config. On a `landed` event with air > 0.6 s: `deps.play('stunt')`; with spins
    >= 1 toast "Spin! (n)".
  - Write back like tubing: `v.x, v.y = slide.y, v.z, v.yaw = slide.yaw, v.speed = forward speed`, `syncVehicleMesh(v,
    dt)`, then tilt `v.object` to the slide's normal (pitch from the normal along the heading, roll along the side) plus a
    lean roll `-slide.lean * 0.25` (skis) / `0.15` (sled).
  - Runs: for each of the ride's runs `stepRun(run, prevX, prevZ, v.x, v.z, dt)`: 'start' -> `hud.callout('GO!', run
    name)`; 'gate' -> ok: `play('whistle')`, miss: toast "Missed gate (+3 s)"; 'finish' -> `store.recordRun(id, seconds,
    clean)`; achievements: tea-tray-run -> `unlock(WINTER_ACHIEVEMENTS.teaTray)`; wool-run -> `unlock(firstTracks)`, and
    `unlock(blackDiamond)` if clean and seconds <= `BLACK_DIAMOND_S`; callout `formatTime(seconds)` with "New best!" or
    "Best x:xx.x"; notify `onFinish` listeners with `{ ...result, ride: v.kind }`; show the Ride again button; reset that
    run to `newRun(def)` so it can be run again. A 'running' run aborts (no record) when the rider gets off or tumbles.
  - Keep `prevX/prevZ` per ride.
- HUD (own container appended to `deps.ui`, `pointer-events: none` except on its buttons, top-centre under the safe-area
  inset, small dark pill): while riding a winter ride: speed in km/h (`* 3.6`, rounded), the run clock `formatTime(t)`
  and "gates n/6" while a run is running, best time of that run; near the tow base: "Push forward to grab the Bootlace
  Tow". Touch buttons (only when `matchMedia('(pointer: coarse)').matches`, each >= 44 x 44 px, bottom-left above other
  controls is fine): "Hop" (sets hopPressed for one step), "Let go" (only while towing), "Grab tow" (only at the base).
  "Ride again" (all devices, shown 8 s after a finish): calls `api.startRun(lastRunId)`. Hide the whole HUD when not on a
  winter ride and not at the base. No hover-only UI; fits 390x844 and 844x390.
- On foot, `prompt(x, z)` / `interact(x, z)` (only when `deps.onFoot()`; within `RANGE` of a spot):
  - `SKI_RACK`: "Rent skis (8 Acorns)" -> `economy.spend(RENT.skis, 'Woolly Sock Lodge')`, spawn 'snow-skis' 3 m east of
    the rack facing south (yaw 0), seat the player; no money -> toast "Gentian: 'Skis are 8 Acorns. Charm is free and
    does not work.'".
  - `SLED_STACK`: owned sled -> "Take your tea tray" (free); else if the player finished the Tea-Tray Run at least once and
    has >= `RENT.ownSled` Acorns -> "Buy a tea tray to keep (30 Acorns)" (sets `store.buySled()`, toast that the Snowdrop
    app can drop it on any snow); else "Rent a tea tray (4 Acorns)".
  - `COCOA_HATCH`: "Buy Hot Cocoa (6 Acorns)" -> spend, `addItem(HOT_COCOA_ID)` from `../inventory` (refund with
    `economy.earn` if it returns 0: "Your bag is full."), toast "Hot Cocoa in your bag. Three marshmallows, by the rules."
  - Within `RANGE + 1` of `SHANTY` with no rod (check via `deps.lendRod()` only on interact; for the prompt use a cached
    "lent" flag): "Borrow a jigging rod from Theo" -> `deps.lendRod()` -> toast "Theo: 'Bring it back. Or don't. It is a
    bent pin.'" (if it returns false: toast "Theo: 'You have a rod. Use it.'").
  - Else `ice.prompt(x, z)` / `ice.interact(x, z)`.
  - Rentals: at most `RENT.max` rented rides of each kind exist; renting another removes the oldest one nobody rides
    (`removeVehicle` + splice from `deps.vehicles`). A rented ride left more than 400 m from the player is removed.
- `update(dt)`: `t += dt`; `hill.update(dt, t, px, pz)`, `pond.update(...)`, `ice.update(dt, px, pz, deps.onFoot())`;
  every 0.5 s Bear Hug: on foot, for each of `deps.bears()` within `HUG_RANGE`: key = `${Math.round(b.x)},${Math.round(
  b.z)}`; a new key -> `store.hug(key)`, `deps.increment(WINTER_ACHIEVEMENTS.bearHug, 1)`, toast "The polar bear lets you
  stand there. (n/9)"; HUD refresh; drop ride state for vehicles no longer ridden.
- `onCatch(water)`: on 'ice': `store.recordIceCatch()`, `deps.increment(WINTER_ACHIEVEMENTS.iceStation, 1)`.
- `blips()`: three place blips `{ x, z, kind, label, color: PLACE_STYLE[kind].color }` (`PLACE_STYLE` from
  `../mapIcons`): 'ski' at `LODGE` "Snowdrop Slope", 'bears' at `BEAR_DECK` "Bear Deck", 'icefish' at `PAIL_POND`
  "Pail Pond".
- `api.startRun(id)`: `deps.blocked()` -> its reason; the player in a non-winter vehicle -> "Get out first."; else take
  (or spawn, free) the run's ride at (start.x, start.z - 8) facing south (yaw 0), height on the ground, reset its slide
  state, seat the player; null. `api.isOnSlope(x, z)`: `inSite('ski-hill', x, z)` (from `../sites`) and `surfaceAt ===
  'snow'`. `api.onFinish(cb)`: listener set, returns an unsubscribe.
- `dropSled()`: not owned -> "Buy a tea tray at the Woolly Sock Lodge first."; not on foot -> "Get out first."; ground
  under the player not snow/ice -> "You need snow or ice."; else spawn 'tea-tray-sled' at the player facing their way and
  seat them; null.
- `debug()`: fill `WinterDebug` from the state.
- New `src/winter/runtime.test.ts` (keep it pure where you can: export small pure helpers from runtime.ts, e.g.
  `rideInput(inp, hop)` and `lodgeAction(spot, ctx)` that returns which action/prompt applies, and test those; plus one
  integration test of `stepRider` on the real terrain only if it runs headless in under 5 s): skis started at the Wool
  Run start (via the same code `startRun` uses, with fake deps) and stepped with no input for 40 s of 1/30 s steps reach
  the finish line, finish once, and record a run in a fake storage (inject the store if you need to: an optional
  `opts?: { storage }` second parameter on `installWinter` is fine, defaulting to the real one).

## Contract
`installWinter(deps): Winter`, `winterApi()`, `WinterDeps` as in the stub (you may add an optional second parameter).
Never edit `app.ts`, `types.ts` or the modules of other issues; report what they lack.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- Report the time a straight no-input ski run and sled run take from start to finish (from your test), so the lead can
  tune `parS` / `BLACK_DIAMOND_S`.

## Out of scope
`app.ts`, `winter/types.ts`, the other winter modules, quests.
