# E02 Vehicle feel, combat and camera: roadmap

Brief: [../E02-vehicle-feel-combat-camera.md](../E02-vehicle-feel-combat-camera.md). Game: `games/gnome-theft-auto`.

## Foundation (written by the lead, before epic 1)

- `collide.ts`: `Box.shape?: 'round'` (vertical cylinder, radius = half the box's shorter side) in `pushOutOfBoxes`,
  `insideBox`, `groundHeight`; helpers `roundBox`, `roundOf`, `placeRoundBox`, `roundRadius`; unstick in
  `sweepCircleBoxes` (a sweep that starts clear and is pushed into a second box stops at the last clear substep).
  Square boxes behave exactly as before. Tests in `collide.test.ts`.
- `viewPrefs.ts` (new): Options "View" rows, screen shake off / low / normal and first person, stored per browser,
  event `gta:view-prefs`; mounted from `options.ts`.
- `camera.ts`: `shake()` scaled by `SHAKE_SCALE = 0.4` and the Options level, capped at `SHAKE_CAP = 0.3` (L13 done);
  `setFirstPerson(on)` / `firstPerson` stubs on `ChaseCamera`; `update(..., extra.eye)`.
- `simdrive.ts`: `createChassis(v, tune, setup, rideHeight)` and `stepChassis(v, sd, VehicleInput, dt, world)` split out
  of `createSimDrive` / `stepSimDrive` (shared by the player and NPC cars); `SIM_AIR` tuning block (neutral values);
  the bump sound only for the player's car.
- `player.ts` `reseat()` + `app.ts` call after the per-frame vehicle sync (L18 done: the gnome follows the vehicle's late
  moves and suspension heave instead of trailing a frame behind).
- Stubs with final signatures: `casings.ts`, `civilianMods.ts`, `npcChassis.ts`; `Traffic.driverAt?` /
  `Traffic.crackDriver?` in `types.ts`; action `firstPerson` (`ui/actions.ts`, More menu tile) and key `KEYS.firstPerson`
  = F5 (every letter is taken).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Engine pieces | `tsc --noEmit`, each issue's tests | 10 (1-1 .. 1-10), parallel |
| 2 Wiring | `npm run build`, `npm test -w games/gnome-theft-auto`, smoke | 3 (2-1 .. 2-3), parallel |

Epic 1 files (no file under two issues):

| Issue | Items | Changes | Model |
|---|---|---|---|
| 1-1 round scenery colliders | L01 | `biomes.ts`, `world.ts`, `data/layout.golden.json` | haiku |
| 1-2 boats and the canal | L01 | `boats.ts`, `waterworks.ts`, new `canalCruise.test.ts` | sonnet |
| 1-3 airtime, landing, plane reverse | L55, L14 | `simdrive.ts`, `vehicles.ts`, `stunts.ts`, `craft/flight.ts`, `config.ts` (plane specs only), tests | sonnet |
| 1-4 camera: no jumps, first person | L77, L76 | `camera.ts`, new `cameraCorner.test.ts` | sonnet |
| 1-5 acorn shells | L57 | `casings.ts`, new `casings.test.ts`, `packages/prefabs/src/catalog/gta-fleet.ts` | haiku |
| 1-6 knock parts off | L53 | `debris.ts`, `debris.test.ts` | haiku |
| 1-7 civilian mods | L91 | `civilianMods.ts`, new `civilianMods.test.ts` | haiku |
| 1-8 NPC chassis | L93 | `npcChassis.ts`, new `npcChassis.test.ts` | sonnet |
| 1-9 crack driving gnomes | L78 | `traffic.ts`, `app.ts` (hitTest only), `traffic.test.ts` | haiku |
| 1-10 achievements | L57, L78 | `packages/achievements/src/catalog.ts` | haiku |

Epic 2 files:

| Issue | Changes |
|---|---|
| 2-1 traffic on the NPC chassis + civilian mods | `traffic.ts`, `quests/objectivesDrive.ts`, `raceTrack/raceAi.ts` |
| 2-2 app wiring: shells, first person, achievements | `app.ts`, `player.ts` |
| 2-3 parts lost on impact and roll-over | `vehicles.ts`, `simdrive.ts`, `fleetRuntime.ts` |

Online: casings, first person, civilian mods (seeded by the ghost id) and knocked-off parts are local. Damage levels still
sync as before. Mobile: first person has a More-menu tile (44 px) and an Options row; the driver crack uses Fire.

Issue texts: `epic-1/*.md`, `epic-2/*.md`.
