Epic: 2, Systems
Depends on: none

## Goal
The world is built from a `ZoneDef`. Walking into an exit loads the next zone: tear down, rebuild, respawn entities and objects, and place the player.

## Read first
- `games/gnomes-of-gnomomia/src/world.ts` (all of it: terrain, trees, mushroom houses, colliders)
- `src/zones.ts` (stub), `src/data/zones/mossbottom.ts`, `config.ts` `ZoneDef`/`ZoneExit`
- `docs/design/gnomomia/world-map.md` (zone list, themes)

## Change
- `src/world.ts`:
  - **Build and clear.** `buildWorld(scene, zone: ZoneDef)` builds into a single `THREE.Group` it keeps. Add `export function clearWorld(scene)`, which removes and disposes that group and clears colliders.
  - **Read the zone.** Everything that read `REGIONS`/`LAKE`/`HOUSES`/`WELL`/`TUNING.worldHalf` reads the zone instead: `zone.regions`, `zone.lakes`, `zone.houses`, `zone.shrine` and `zone.half`. Draw the shrine as a small stone shrine, or as a well for mossbottom.
  - **Roads** run from the shrine to each region and to each exit.
  - **Theme.** Ground colours come from `theme.ground`/`groundAlt`. `theme.hilliness` scales the noise. `theme.fog`/`sky` set `scene.fog` and the background.
  - **Flora**, chosen by `theme.flora`, density by `floraDensity`:

    | flora | Looks like |
    |---|---|
    | mushroom | today's trees |
    | grass | tall blades |
    | clover | three-leaf clumps |
    | hedge | dark green box shrubs, blocking |
    | rock | grey boulders, blocking |
    | pipe | rusty cylinders; also used for `indoor` |
    | stubble | short yellow tufts |

  - **House styles:** mushroom (current), thatch (cylinder plus straw cone), stone, log, tent, pot (terracotta flowerpot).
  - **`indoor: true`:** ring the map with tall walls, dark ambient light, no sun shadows.
  - **`zone.walls`:** build each segment as a 4 m tall, 1.5 m thick wall (brick-brown for indoor zones, stone grey otherwise), and add colliders along it (one circle collider of r 1 every 1.5 m).
  - **Exits:** a glowing ring (emissive) at `exit.x/z` with radius `r`, and a signpost with `label` (canvas texture). Hidden while `exit.when` is false (use `checkCondition` from `./quests`).
  - Keep `heightAt`, `isBlocked`, `getGroundMesh` and `regionNameAt` exported. They read the current zone.
- `src/zones.ts`:
  - `initZones(scene)` loads `state.zone` (default mossbottom).
  - `loadZone(id, x?, z?)` runs, in order:
    1. `clearWorld`, then `buildWorld(scene, ZONES[id])`.
    2. `spawnZoneEntities(scene, id)`, then `spawnZoneObjects(scene, id)`.
    3. Set `state.zone = id`, then `teleportPlayer(x ?? spawn.x, z ?? spawn.z)`.
    4. Emit `zone-changed`, and say `You arrive in <name>.` in quest colour.
  - `updateZones(dt)`: while the player is inside an exit's radius and its `when` holds, `loadZone(exit.to, exit.arriveX, exit.arriveZ)`. Add a 1 s cooldown after arriving so the player doesn't bounce.
  - An exit whose `to` is the current zone is a **hatch**: just `teleportPlayer(arriveX, arriveZ)`, with no rebuild and no banner.
- `src/main.ts`: delete the `buildWorld(scene)` and `spawnWorldEntities(scene)` lines (and their now-unused imports); `initZones(scene)` is already called right after them and now does the building. **This is the only main.ts change allowed.**

## Contract
`buildWorld(scene: THREE.Scene, zone: ZoneDef): void`, `clearWorld(scene: THREE.Scene): void`. zones.ts keeps its stub signatures. It calls `spawnZoneEntities` (entities.ts) and `spawnZoneObjects` (objects.ts) by their stub signatures.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in world.ts, zones.ts or main.ts.
- Mossbottom looks as it does today, plus the north exit ring once the mole-king quest is done.

## Out of scope
entities.ts, objects.ts, data/zones/* (zone content is epic 3+).
