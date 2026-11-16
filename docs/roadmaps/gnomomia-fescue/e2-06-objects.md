Epic: 2, Systems
Depends on: none

## Goal
World objects (valves, statues, books, carts, graves...) exist in each zone. Clicking one walks to it and uses it, which feeds `interact` quest objectives.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts` `WorldObjectDef`, `src/content.ts` (`OBJECTS`), `src/objects.ts` (stub)
- `src/world.ts` (mesh style; `heightAt`)

## Change
- `src/objects.ts`:
  - **Spawning.** `spawnZoneObjects(scene, zone)` removes the previous objects' group, then builds a mesh for every `OBJECTS` entry with `zone === zone` whose `when` holds (via `checkCondition` from `./quests`). Skip a `once` object whose `state.objects[id] >= 1`.
  - **Meshes**, one small builder per `model`:

    | model | Mesh |
    |---|---|
    | valve | pipe plus red wheel |
    | statue | grey gnome shape |
    | book | lectern plus open book |
    | cart | box on 4 wheels |
    | chest | brown box |
    | sign | post plus board |
    | stone | standing stone |
    | grave | small slab |
    | post | wooden post |
    | trough | long box |
    | generic | sphere |

    Apply `color` and `scale`. Set `userData.objectId = id` on the root and every child mesh.
  - **`objectFromMesh(obj)`** walks up the parents and returns `userData.objectId` or null.
  - **`useObject(id)`**, in order:
    1. Say `def.text` (if set) in quest colour.
    2. Give `giveItem` with `addItem`, and set `setFlag` with `setFlag` from state.
    3. `state.objects[id] = (state.objects[id] ?? 0) + 1`.
    4. Emit `interacted { objectId: id }`.
    5. Remove the mesh if `once`.
  - **Respawn on condition change.** Re-run spawning on `flag-set` and `quest-updated`, since objects can appear when a condition becomes true.
- Provide `export function objectPosition(id: string): THREE.Vector3 | null` for input.ts to walk to.

## Contract
`spawnZoneObjects`, `useObject` and `objectFromMesh` signatures from the stub, plus `objectPosition`. input.ts (another worker) calls `objectFromMesh` on raycast hits, walks within 1.8 m, then calls `useObject`. It shows `def.verb` in the right-click menu and `def.examine` on Examine.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in objects.ts.

## Out of scope
input.ts, quests.ts, entities.ts.
