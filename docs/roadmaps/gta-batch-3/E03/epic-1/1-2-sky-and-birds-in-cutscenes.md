Epic: 1 Fixes (parallel) · Items: L07 "the plane with the ad gets stuck in cutscene but banner keeps moving", L08 "birds also stay stuck floating in cutscenes" · Model: haiku
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
During any cutscene the NPC aircraft (and the banner it tows) and bird flocks keep flying together; nothing hangs frozen
in the air while something else moves.

## Root cause (confirmed by reading)
- `app.ts` `frame()` returns early while `cutscene.active` (~line 1485). For live-world scenes it calls
  `liveWorldFrame(dt, live)` (~1416), which calls `sky.update(dt, cx, camera.position.y, cz, null, false)`: that moves
  each aircraft record (`v.x/v.y/v.z/v.yaw` written in `skyTraffic/runtime.ts` update) and steps its banner
  (`stepBanner` -> `banner.update`, which places the banner mesh), but the aircraft MESH is only synced by
  `for (const veh of vehicles) syncVehicleMesh(veh, dt)` (~1752), after the early return. Plane mesh frozen, banner moving.
  In non-live scenes nothing in the sky moves at all (plane frozen in mid-air).
- `birding.update({...})` (~2003) runs only after the early return, so during any cutscene flocks never step
  (`birding/birding.ts` update -> `stepFlock`, `view.update(flocks)`): birds hang mid-air.

## Change
- `skyTraffic/runtime.ts`: add to the `SkyTraffic` interface and implementation `aircraft(): readonly Vehicle[]`
  (the `rec.v` of every current record, no allocation per call: keep and refill one array).
- `app.ts`:
  - New helper `cutsceneSkyFrame(dt: number)` used in the `if (cutscene.active)` branch for BOTH live and non-live
    scenes: for non-live scenes call `sky.update(dt, camera.position.x, camera.position.y, camera.position.z, null, false)`
    (live scenes already call it in `liveWorldFrame`, do not call it twice), then `for (const v of sky.aircraft()) syncVehicleMesh(v, dt)`.
  - In the same branch step birds: `critterTime` is advanced by liveWorldFrame for live scenes only, so advance a time
    value for non-live scenes too (reuse `critterTime += dt` when not live), then
    `birding.update({ dt, time: critterTime, playerX/Y/Z: player position (live scene: liveZones.x / heightAt / liveZones.z),
    onFoot: false, footSpeed: 0, vehicles, timeLabel: atmosphere?.timeLabel() ?? 'Noon', ammo: weapons.ammo,
    lookYaw: 0, lookPitch: 0, camYaw: chase.yaw, camPitch: chase.pitch, paused: true })`. `paused: true` keeps the scope
    down and the birding HUD hidden; the flocks still step (confirm in `birding/birding.ts` that the flock loop runs when
    paused; if it does not, make it run there while keeping the scope and HUD off).
  - Change nothing else in `frame()`.
- Regression test `skyTraffic/runtime.test.ts` (add a `describe`): build `createSkyTraffic` with a `new THREE.Scene()`,
  a minimal fake world/hud/fx/economy/achievements (look at what the deps interface needs; cast with `as never` where a
  full object is not needed), `spawn('banner-tow')` (or the first id from `list()`), update a few frames, and assert
  `aircraft()` contains the spawned vehicle and its `x/z` change between updates. If constructing it headless proves
  impossible (WebGL needed), write the test for whatever pure piece you can and say so in the report.

## Done when
- `npx vitest run src/skyTraffic/runtime.test.ts src/birding` passes (from the game dir).
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for `app.ts` and `skyTraffic/runtime.ts`.

## Out of scope
`liveWorldFrame` traffic/npcs/critters, `quests/`, `birding/flock.ts` physics, every other app.ts section.
