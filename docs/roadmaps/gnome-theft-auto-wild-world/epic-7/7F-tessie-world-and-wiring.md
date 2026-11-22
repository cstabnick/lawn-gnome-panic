Epic: 7 (Gnome Theft Auto Wild World: the Tessie side quest)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there. Use absolute paths.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push or open a PR. Do not start a dev server.
- Five other workers are editing other files at the same time (`quests/objectivesTessie.ts`, `quests/objectivesTessieEscort.ts`, `quests/tessieQuest.ts`, `radio/content.ts`, prefab files, the achievements catalog, lore). Edit only the files this issue names.
- Repo rules: nothing is ever wet, soaked or dripping (R-021). New visible things come from `@lawn/prefabs` / `@lawn/gnome` (`makeGnome` in `src/gnomes.ts`), never hand-built one-off meshes. Online: the Tessie quest and her appearances are single-player and local (never relayed). Mobile: add no buttons.

## Goal

(1) Fill in `games/gnome-theft-auto/src/tessie.ts` (now a stub): Driftwood standing on the Loch Moss shore once the quest unlocks; after the quest, Tessie surfacing in the loch now and then as a local world event, rideable like a boat; and the open-world housekeeping for any 'tessie' vehicle (flipper animation, diving when left alone). (2) Wire the Tessie quest into `games/gnome-theft-auto/src/app.ts`: the unlock callback, the `?tessie=now` dev switch, the sky dependency, and the Tessie world module.

## Read first

- `games/gnome-theft-auto/src/tessie.ts`: the stub, with the final `TessieWorldDeps` / `TessieWorld` / `createTessieWorld` signatures. Keep them exactly.
- `games/gnome-theft-auto/src/config.ts`: `VEHICLES.tessie` and the `TESSIE` block (search `export const TESSIE`).
- `games/gnome-theft-auto/src/quests/types.ts`: `QuestDeps` (the new fields `atmosphere`, `onTessieUnlock`, `tessieNow` at the end).
- `games/gnome-theft-auto/src/app.ts`: lines 100-190 (tracker, `reportNews`, `achievements`, `radio`, `atmosphere`, `createQuests(...)`, `createWorldEvents`), lines 1040-1125 (the frame: `worldEvents.update`, blips) and lines 1178-1256 (`startParams`, the `?debug` hook).
- `games/gnome-theft-auto/src/worldEvents.ts` lines 1-80: style of a world-event module (`update(dt, player, cutsceneActive)`, `blips()`).

## Facts (confirmed in the code)

```ts
import { buildPrefab } from '@lawn/prefabs';
import { makeGnome, gnomeState } from './gnomes';   // makeGnome(scene, look: GnomeLook): GnomeModel (added to scene); model.update(gnomeState(x, y, z, yaw, 0), dt) poses it standing
import { randomTownLook } from './gnomes';           // a full GnomeLook to spread partial colours over
import { createVehicle, removeVehicle } from './vehicles';  // createVehicle(scene, 'tessie', x, z, yaw): Vehicle; removeVehicle(scene, v)
import { heightAt, waterAt } from './terrain';       // waterAt(x, z): { surface, depth } | null
import { BODIES, bodyRadius } from './water';        // BODIES.find((b) => b.id === 'water/loch-moss'); bodyRadius(body, x, z) < 1 inside, < 0.6 = deep open water
import { TESSIE, VEHICLES } from './config';
import { GIVERS } from './quests/defs';              // GIVERS[TESSIE.giver] = { x, z, ... } Driftwood's spot on the shore (-726, -548)
```

- Driftwood's look: `{ hat: 0x4f9d92, shirt: 0xd9c79e, beard: 0xe5e0d4 }` (spread over `randomTownLook()`).
- A 'tessie' vehicle is a boat (`spec.boat`), 9 m long (prefab `tessie` at scale 3), radius 4.2, draft 1.2. Idle boats (`driver === 'none'`) are floated every frame by the game; the player boards with the normal Enter key/button; while the player drives, `player.vehicle === v` and `v.driver === 'player'`. Her prefab has pivot groups named `head`, `flipper-0` .. `flipper-3` (find them with `v.object.getObjectByName(name)`).
- `vehicles` is the game's list; the quest's own ride step pushes a 'tessie' vehicle with `questOwned = true` and may leave it there when the step ends with the player aboard.
- Loch Moss: centre (-700, -680), half axes 150 x 120, water surface about -0.65, 5 m deep in the middle; Tessie's island at (-760, -720), dry within about 22 m.

## Change

### 1. `games/gnome-theft-auto/src/tessie.ts`

`createTessieWorld(deps)` returns `{ update, blips, surfaceNow }`:

- **Driftwood:** while `deps.unlocked()` is true, a Driftwood gnome (`makeGnome(deps.scene, { ...randomTownLook(), ...DRIFTWOOD_LOOK })`) stands 2 m east of `GIVERS[TESSIE.giver]` on the ground (`heightAt`), facing the loch (yaw π, i.e. toward -z), posed each frame with `model.update(gnomeState(...), dt)`; when the player is within 25 m he turns to face them. Hide him (`object.visible = false`) while `cutsceneActive`. Create him lazily the first time `unlocked()` is true; never before.
- **Housekeeping for every 'tessie' vehicle in `deps.vehicles`** (yours and the quest's), each update: paddle the flippers (rotate `flipper-0..3` about y/z by a sine, faster when `Math.abs(v.speed) > 1`) and nod the `head` slowly. A 'tessie' vehicle that is NOT yours, has `driver === 'none'`, and the quest is not active (`!deps.questActive()`), dives after `TESSIE.event.diveAfterLeftS` seconds. Diving: set `v.driver = 'npc'` (so nobody can board her and the game's idle-boat float, which only steps `driver === 'none'` boats, stops pulling her back up), then lower `v.y` by about 1.5 m/s each update (the game syncs every vehicle's mesh from `v.y` each frame); once she is 5 m down, splice her out of `deps.vehicles` and `removeVehicle(deps.scene, v)`. A `splash` sound when she starts diving. Reset the timer while anyone drives her.
- **The world event (after the quest):** only while `deps.questDone()`, the player is within `TESSIE.event.nearDist` of `TESSIE.loch`, no other 'tessie' vehicle is in `deps.vehicles`, and not `cutsceneActive`. First surfacing after `TESSIE.event.firstDelayS`, then a random gap between `minGapS` and `maxGapS`. She surfaces at a random deep spot (try up to 20 random points in the loch's rectangle with `bodyRadius(loch, x, z) < 0.6` and `waterAt(x, z)?.depth > 3`, and not within 25 m of the island): `createVehicle(deps.scene, 'tessie', x, z, randomYaw)`, `v.questOwned = true`, push to `deps.vehicles`; set `v.y` 3 m below her float height (`waterAt(x, z).surface - VEHICLES.tessie.draft`); the game's idle-boat float (a buoyancy spring) lifts her to the surface by itself. `deps.play('splash')`, `deps.hud.toast('Tessie has surfaced in Loch Moss!', 5000)`, `deps.report(TESSIE.bulletins.surfaced)`. While nobody rides her she drifts slowly: you may nudge `v.yaw` a little over time; she is a boat, so do not set `v.x/z` directly while the player drives. After `TESSIE.event.stayS` seconds with nobody aboard she dives (as above). If the player is aboard, she stays until they get off, then dives after `diveAfterLeftS`.
- `blips()`: Driftwood is already a quest giver (no blip). A surfaced Tessie that you own: `{ x, z, color: '#45e68b', quest: 'Tessie' }`.
- `surfaceNow()`: if `deps.questDone()` and none is up, surface her at once at the best spot nearest the player within the loch (for demos and `?debug`).
- Keep simulation choices in small pure helpers where easy (e.g. `pickSurfaceSpot(rand)`), exported for a test.

### 2. `games/gnome-theft-auto/src/app.ts` (small, targeted edits)

- Imports: `createTessieWorld` from `./tessie`; `TESSIE` from `./config` (add to the existing config import if there is one).
- In the `createQuests({ ... })` call (around line 168), add:
  - `atmosphere: atmosphere ?? undefined,`
  - `tessieNow: new URLSearchParams(location.search).get(TESSIE.devParam) === 'now',`
  - `onTessieUnlock() { void achievements.unlock(TESSIE.achievements.rumour); hud.banner('BREAKING NEWS', 3500); hud.toast('Turfton FM: something big in Loch Moss. Driftwood is waiting for you on the loch shore.', 9000); play('whistle'); },`
  (`achievements.unlock` already puts the matching `EVENT_BULLETINS` entry on the air through `reportNews`.)
- After `const worldEvents = createWorldEvents(...)`, create:
  ```ts
  // The Tessie side quest's open world (tessie.ts): Driftwood at the loch once unlocked, Tessie surfacing after the quest.
  const tessieWorld = createTessieWorld({
    scene, world, hud, vehicles, play, report: reportNews,
    unlocked: () => quests.getJournal().saves[TESSIE.unlockKey]?.state === 'done',
    questDone: () => quests.getJournal().saves[TESSIE.questId]?.state === 'done',
    questActive: () => quests.getJournal().activeId === TESSIE.questId,
  });
  ```
  (`getJournal()` copies the saves; if you call these every frame, cache the three booleans in `tessie.ts` and refresh them once a second.)
- In the frame, right after `worldEvents.update(dt, player, cutscene.active);` add `tessieWorld.update(dt, player, cutscene.active);`, and add `...tessieWorld.blips()` to the `blips.push(...)` line that already has `...worldEvents.blips()`.
- In the `?debug` hook object (`__gta`), add `tessie: tessieWorld,`.
- Touch nothing else in app.ts.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (if the only errors are in files other workers own, they are mid-edit; re-run a little later).
- If you add `games/gnome-theft-auto/src/tessie.test.ts` for pure helpers: `npx vitest run src/tessie.test.ts` from `games/gnome-theft-auto` passes (do not import app.ts in a test).
- The `TessieWorld` / `TessieWorldDeps` / `createTessieWorld` signatures are unchanged.

## Out of scope

Everything else: `quests/*` (other workers and the planner), `config.ts`, `vehicles.ts`, `boats.ts`, `worldEvents.ts`, `radio/`, prefabs, achievements, lore.
