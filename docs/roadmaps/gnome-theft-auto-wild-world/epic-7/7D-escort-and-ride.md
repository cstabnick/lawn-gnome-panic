Epic: 7 (Gnome Theft Auto Wild World: the Tessie side quest)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there. Use absolute paths.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push or open a PR. Do not start a dev server.
- Five other workers are editing other files of `games/gnome-theft-auto` at the same time (`objectivesTessie.ts`, `tessieQuest.ts`, `radio/content.ts`, `tessie.ts`, `app.ts`) and two prefab files. Edit only the files this issue names.
- Repo rules that apply: nothing is ever wet, soaked or dripping and nothing bleeds (lore ruling R-021: water only floats, sinks or slows). Anything flat laid on the water or ground uses a draw layer (`flatLayer(material, LAYER.marker)` from `@lawn/depth`), never just a small lift. New visible objects come from `@lawn/prefabs` (`buildPrefab(id, { scale })`), never hand-built meshes (quest rings, beacons and cones are fine, as the other runners do).

## Goal

Fill in the two runners in `games/gnome-theft-auto/src/quests/objectivesTessieEscort.ts` (now stubs) for steps 3 and 4 of the Tessie side quest on Loch Moss: **escort the turtle's egg clutch past an HOA dredger** to her island, then **ride Tessie back across the loch**.

## Read first

- `games/gnome-theft-auto/src/quests/objectivesTessieEscort.ts`: the stubs. Keep both exported signatures exactly.
- `games/gnome-theft-auto/src/quests/types.ts`: `ObjectiveDef` (kinds `tessie-escort`, `tessie-ride`), `QuestDeps`, `Run`.
- `games/gnome-theft-auto/src/quests/objectivesDrive.ts` lines 1-80 and `stealDeliverRun` (from line 141): house style: a cone marker over a vehicle, rings, `deps.player?.vehicle === target`, cleanup that keeps a vehicle the player is in.
- `games/gnome-theft-auto/src/config.ts`: `VEHICLES.tessie` and the `TESSIE` block (search `export const TESSIE`).

## Contract (verbatim from the code; do not change these files)

```ts
// quests/types.ts
| { kind: 'tessie-escort'; text: string; route: [number, number][]; nest: [number, number]; dredgerAt: [number, number]; hint: string }
| { kind: 'tessie-ride'; text: string; spawnAt: [number, number, number]; to: [number, number]; radius: number; hint: string }
export interface Run {
  lines(): string[];            // tracker lines; {{word}} is highlighted
  done(): boolean;
  update(dt: number, px: number, pz: number): void;   // px, pz = the player's position
  onCracked(npc: Npc): void;    // unused here: {}
  blips(): Blip[];              // Blip = { x, z, color: string, quest?: string }
  cracked(): string[];          // unused here: () => []
  cleanup(): void;              // remove and dispose everything this run added
}
// QuestDeps fields you use: scene: THREE.Scene; world: World; play(sfx: Sfx): void; player?: Player; vehicles?: Vehicle[]; fx?: Fx
// `changed()` (3rd arg): call once when the objective becomes done. `say(text)` (4th arg): a toast.
export function tessieEscortRun(obj, deps, changed, say): Run
export function tessieRideRun(obj, deps, changed, say): Run
```

Existing helpers and facts (confirmed):

```ts
import { buildPrefab } from '@lawn/prefabs';            // buildPrefab(id, { scale }): THREE.Group
import { LAYER, flatLayer } from '@lawn/depth';
import { heightAt, waterAt } from '../terrain';          // waterAt(x, z): { surface, depth } | null; heightAt = ground (loch bed under water)
import { createVehicle, removeVehicle } from '../vehicles';  // createVehicle(scene, 'tessie', x, z, yaw): Vehicle; removeVehicle(scene, v)
import { TESSIE, VEHICLES } from '../config';
```

- `VEHICLES.tessie`: a boat vehicle (`spec.boat` true, prefab `tessie`, scale 3 = 9 m long, radius 4.2, draft 1.2, mountStyle 'clamber'). An idle boat (`driver === 'none'`) is floated every frame by the game (`stepIdleBoats`), and the player boards it with the normal Enter key/button when close (no new controls). When the player drives it, `deps.player.vehicle === tessie` and the game steps it.
- Vehicle fields: `x, y, z, yaw, speed, driver ('none'|'player'|'npc'|...), questOwned?, spec, object (THREE.Group)`. Add a marker to a vehicle with `v.object.add(mesh)`.
- The player is in a boat when `deps.player?.vehicle?.spec.boat === true`; their boat is `deps.player.vehicle`.
- `TESSIE`: `escortRoute` [[-690, -600], [-700, -650], [-725, -688], [-736, -706]], `escortSpeed` 3.2, `escortLeash` 30, `dredgerStart` [-650, -690], `dredgerSpeed` 3.5, `dredgerPull` 26, `dredgerPullSpeed` 1.6, `dredgerSwallow` 6, `rams` 3, `ramSpeed` 5, `stunS` 6, `nest` { x: -746, z: -713 }, `island` { x: -760, z: -720, r: 22 }, `rideSpawn` [-727, -716, 0], `rideTo` [-713, -590], `rideRadius` 10, `dock` { x: -715, z: -564 }.
- Loch Moss water surface is about -0.65; the island is dry within about 22 m of (-760, -720) (top about 5.8 m), with a shallow shelf to about 28 m. A marker on the water stands at `waterAt(x, z)?.surface`.

## Change

`games/gnome-theft-auto/src/quests/objectivesTessieEscort.ts` only (plus an optional new test file `games/gnome-theft-auto/src/quests/objectivesTessieEscort.test.ts` for pure helpers you export).

### `tessieEscortRun` (step 3)

- The clutch: `buildPrefab('turtle-egg-clutch', { scale: 2 })`, starting at `obj.route[0]`, floating at the water surface (y = surface - 0.1, gentle bob ±0.05 m). A gold cone marker above it (like `makeCone` in objectivesDrive.ts, spinning).
- Each update, if the player is within `TESSIE.escortLeash` of the clutch, it moves along `obj.route` at `TESSIE.escortSpeed` m/s (face its direction of travel); otherwise it waits and the tracker says so. When it reaches the last route point, it is "home": move it onto the nest (`obj.nest`, y = `heightAt(nest)`), play `'whistle'`, `say('The clutch is safe in the nest!')`, done -> `changed()` once.
- The dredger: `buildPrefab('hoa-dredger', { scale: 3 })` (about 9 m long, bow +z), starts at `obj.dredgerAt` floating (y = surface - 0.4). While not stunned and not beaten it chugs toward the clutch at `TESSIE.dredgerSpeed` (turn its bow toward it). Within `TESSIE.dredgerPull` of the dredger, the clutch is also drawn toward the dredger at `TESSIE.dredgerPullSpeed` m/s (on top of its own motion); within `TESSIE.dredgerSwallow` it is swallowed: `say('The dredger sucked up the clutch! Back to the start.')`, `'alarm'`, and the clutch restarts at `route[0]` (the dredger goes back to `obj.dredgerAt`).
- Ramming: the player is in a boat whose `Math.abs(speed) >= TESSIE.ramSpeed` and the boat is within `4.5 + boat.spec.radius` of the dredger and the dredger is not stunned -> a ram: count it, stun the dredger for `TESSIE.stunS` s (it stops and is pushed 8 m away from the boat along the line between them), bounce the boat (`boat.speed = -boat.speed * 0.3`), `deps.play('bump')`, `deps.fx?.waterJet?.(x, surface + 0.5, z)` at the dredger; `say('Rammed the dredger! ' + n + ' of ' + TESSIE.rams)`. After `TESSIE.rams` rams it is beaten: it turns and chugs away east (+x) for 10 s then is hidden; `say('The dredger gives up and heads for the weir.')`. Once beaten, no more pull.
- `lines()`: `[obj.text]` plus one of: 'The clutch waits for you. Stay close.' (player too far), 'Ram the {{HOA dredger}} (' + n + '/' + rams + ') before it sucks up the eggs!' (dredger active), 'Bring the clutch to {{' + obj.hint + '}}.' (beaten). Before the player is in a boat, first line 'Take a boat out from the {{Loch Moss dock}}.'.
- `blips()`: the clutch (`'#45e68b'`, quest 'Egg clutch'), the dredger while active (`'#ff3b3b'`, quest 'HOA dredger'), the nest (`'#ff7a00'`, quest obj.hint).
- `cleanup()`: remove the clutch, dredger and markers from the scene; dispose only geometries/materials you created (the prefab ones are shared).

### `tessieRideRun` (step 4)

- On start: `const tessie = createVehicle(deps.scene, 'tessie', obj.spawnAt[0], obj.spawnAt[1], obj.spawnAt[2]); tessie.questOwned = true; deps.vehicles?.push(tessie);` (driver stays 'none' so she floats and can be boarded). `deps.play('splash')`, `deps.fx?.waterJet?.(...)` at her, `say('Tessie surfaces beside the island. Swim out and climb aboard!')`.
- A gold cone marker over her (add to `tessie.object`, at y about 4 since the rider sits at 3) while the player is not aboard; hide it when aboard.
- A ring on the water at `obj.to` (radius `obj.radius`, `flatLayer(..., LAYER.marker)`, at surface + 0.05) shown while the player rides her.
- Done when `deps.player?.vehicle === tessie` and within `obj.radius` of `obj.to`: `say('Tessie glides up to the dock and waits for you to hop off.')`, `'whistle'`, `changed()` once.
- `lines()`: not aboard: `['Swim out to {{Tessie}} and climb aboard (Enter).']`; aboard: `['Ride Tessie to {{' + obj.hint + '}}.']`.
- `blips()`: not aboard: Tessie (`'#ff7a00'`, quest 'Tessie'); aboard: `obj.to` (`'#45e68b'`, quest obj.hint).
- `cleanup()`: remove the markers. If the player is NOT aboard (`deps.player?.vehicle !== tessie`), splice her out of `deps.vehicles` and `removeVehicle(deps.scene, tessie)`; if they are aboard, leave her (the open-world Tessie module dives her once the player hops off).

Pure helpers you want to unit-test (e.g. `advanceAlong(route, i, x, z, dist)`, `rammed(...)`) may be exported.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (if the only errors are in files other workers own, they are mid-edit; re-run a little later).
- If you added `objectivesTessieEscort.test.ts`: `npx vitest run src/quests/objectivesTessieEscort.test.ts` from `games/gnome-theft-auto` passes (test only pure helpers; do not import `app.ts`).
- Both exported signatures are unchanged.

## Out of scope

Everything else, in particular `quests/types.ts`, `quests/quests.ts`, `quests/objectivesTessie.ts`, `quests/tessieQuest.ts`, `config.ts`, `vehicles.ts`, `boats.ts`, `app.ts`, `tessie.ts`, `radio/`, prefabs and lore.
