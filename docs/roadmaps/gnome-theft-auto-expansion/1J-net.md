Epic: 1 (Modules), issue 1J: online for planes and parachutes (net.ts, remotes.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
Other players see a player's plane, see them hanging under a parachute, and the bigger world and higher altitudes are accepted by the online message check.

## Read first
- games/gnome-theft-auto/src/net.ts: the whole file (`VEHICLE_CODES`, `RemotePose`, `parseMsg`, `poseFromArray`, `createNet`, `setPose`).
- games/gnome-theft-auto/src/remotes.ts: the whole file (puppets, interpolation, vehicle swap on `pose.veh`).
- games/gnome-theft-auto/src/types.ts: `VehicleKind` (now includes 'plane').
- Prefab fact: `parachute-canopy` exists (another worker adds it now): a canopy about 3.4 wide centred at y = 3.0 above the gnome's feet, origin at the feet.

## Change
- games/gnome-theft-auto/src/net.ts:
  - `VEHICLE_CODES` becomes `['push-bike', 'ride-on', 'zero-turn', 'combine', 'whirligig', 'plane']` (append only: older indices must not move).
  - `RemotePose` gains `chute: boolean` (true while the sender hangs under an open parachute). The pose array gets a 10th element `chute` (1 or 0) appended after `soaked`; `poseFromArray` reads it (`p[9] === 1`, false if absent); `createNet`'s `setPose`/send code writes it (round and send like the others, and treat a change of `chute` as a change that triggers an immediate send).
  - `parseMsg` accepts pose arrays of length 9 or 10 (9 from older clients), every element numeric, and the bounds: `Math.abs(p[0]) > 700 || Math.abs(p[2]) > 700` rejected, `p[1] < -5 || p[1] > 400` rejected (planes fly high), vehicle index within `VEHICLE_CODES`.
  - Update the doc comments.
- games/gnome-theft-auto/src/remotes.ts: when `pose.chute` is true and the player is on foot (no vehicle), show a `buildPrefab('parachute-canopy')` canopy on that puppet (created lazily, child of the puppet's gnome model object, hidden otherwise) and pose both arms up (`rotation.x = -2.9`) instead of walking; when the puppet is airborne without a canopy (y above 2 and not in a vehicle) pose the arms out (`rotation.z` +-1.3). A remote plane is created like any other vehicle (`createVehicle(scene, 'plane', ...)`); make sure the remote vehicle's `y` comes from the pose so planes fly at altitude, and run `syncVehicleMesh` for it as the existing code does.

## Contract
`createNet(ev: NetEvents): GtaNet` and the `NetEvents` callbacks are unchanged. `RemotePose` has the new field `chute: boolean`; `GtaNet.setPose(p: RemotePose)` takes it. `VEHICLE_CODES` as above.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in net.ts or remotes.ts (an error in main.ts about the missing `chute` property of the pose is expected until the wiring issue lands).

## Out of scope
types.ts, config.ts, main.ts, every other file.
