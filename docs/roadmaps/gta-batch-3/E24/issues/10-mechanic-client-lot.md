Epic: E24-2 (workplace jobs, parallel build)
Depends on: none (the mechanic prefabs are made in parallel: skip missing ones with `getPrefab(id)` checks)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Environmental-storytelling issue. You may run ONE dev server on
port **5342** only (`cd games/gnome-theft-auto && npx vite --port 5342 --strictPort`, background) and stop it after.

## Goal
`workplaces/mechanic/lot.ts` builds the client lot beside Turfton's Pay 'n' Glaze: a work-order board, a waiting
bench, a parking spot for the client's car on clear ground, and dressing that tells small stories, and returns the
spots the mechanic runtime uses.

## Read first
- `games/gnome-theft-auto/src/workplaces/mechanic/lot.ts`: the stub (`ClientLot`, `buildClientLot(scene, world)`).
- `games/gnome-theft-auto/src/jobs/visuals.ts` lines ~240-420: `makeDepotProbe(world)` and `buildDepots`: how a kiosk
  is placed on clear dry ground with `findSafeSpot` (`lockup/safeSpot.ts`), `boxesBlocked`, `circleClearOfStreets`
  (`parking.ts`), `heightAt` / `slopeAt` / `waterAt` (`terrain.ts`), `buildPrefab` (`@lawn/prefabs`), and how its
  collider `Box { minX, maxX, minZ, maxZ, h }` is pushed into `world.boxes`.
- `games/gnome-theft-auto/src/config.ts` `PAY_N_GLAZE` (landmark at (90, 150), footprint 22, bay at its centre, radius
  7; the drive-through is open along z, the street is to the north around z = 120) and `glazeBay.ts`.

## Change
- `games/gnome-theft-auto/src/workplaces/mechanic/lot.ts`: `buildClientLot(scene, world)` (idempotent: a second call
  returns the first result):
  - Find, with `findSafeSpot` from the target spots below (radius ~2-3.5 m, `maxDist` 25, `maxSlope` 0.25, `maxWater`
    0), clear ground for: the client car spot (target (102, 130), needs radius 3.5, must NOT be inside the bay circle
    (90, 150) r 7 + 3 and not on a street: `circleClearOfStreets`), the board (target (82, 130)), the bench and client
    stand (next to the car spot, 2.5 m from it). Car yaw: facing the bay (`Math.atan2(90 - x, 150 - z)`).
  - Place `glaze-work-order-board` at the board spot (facing the street), `glaze-client-bench` by the client stand,
    and push colliders for the board and bench (not for the car spot).
  - Storytelling (prefabs only, `getPrefab(id)` guard for each): (1) a "before and after" vignette: a primer-grey
    mower panel (`mower-scrap-panel`) leaning on `glaze-tyre-stack` next to a gleaming pink-rimmed tyre; (2) the
    impatient client: `glaze-client-bench` with a newspaper (`newspaper` if it exists), an empty cup and a
    `glaze-key-hook-board` above it with one key missing; (3) the colour argument: `glaze-swatch-wall` with two
    `glaze-traffic-cone-pink` knocked over in front of it and a `glaze-mud-bucket`. Plus `glaze-oil-drum`s. Keep
    them off the driving line into the bay and off streets (`findSafeSpot` for each cluster).
  - Signs: if the game has a world sign helper (search `grep -rn "export function .*[Ss]ign" games/gnome-theft-auto/src/*.ts`)
    add two: "WORK ORDERS - ASK FOR CASS" and "CLIENT CARS ONLY. YES, EVEN YOURS." ; if there is no helper, skip text.
  - Return `{ board, car, client }` (world coords; `client.yaw` faces the car).
- No other file (the mechanic runtime, another issue, calls `buildClientLot` once).

## Contract
`export function buildClientLot(scene: THREE.Scene, world: World): ClientLot` and `ClientLot` exactly as in the stub.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/mechanic/lot.ts`.
- Temporary check (remove it afterwards): call `buildClientLot(scene, world)` from a `?lotcheck` branch in your own
  code is not possible (app.ts is not yours), so instead write `src/workplaces/mechanic/lot.test.ts` only if `findSafeSpot`
  can run in node with a fake world `{ boxes: [], half: 1800 }` (check `jobs/visuals.test.ts` for a pattern); if not,
  skip the test and say so. The lot is seen in the browser by the end-of-epic screenshot pass.

## Out of scope
`mechanic/types.ts`, `mechanic/briefs.ts`, `mechanic/runtime.ts`, prefab files, `app.ts`, every other file.
