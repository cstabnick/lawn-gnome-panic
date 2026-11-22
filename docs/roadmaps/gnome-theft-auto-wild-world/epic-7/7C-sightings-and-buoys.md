Epic: 7 (Gnome Theft Auto Wild World: the Tessie side quest)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there. Use absolute paths.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push or open a PR. Do not start a dev server.
- Five other workers are editing other files of `games/gnome-theft-auto` at the same time (`objectivesTessieEscort.ts`, `tessieQuest.ts`, `radio/content.ts`, `tessie.ts`, `app.ts`) and two prefab files. Edit only the files this issue names.
- Repo rules that apply: nothing is ever wet, soaked or dripping and nothing bleeds (lore ruling R-021: water only floats, sinks or slows). Anything flat laid on the water or ground uses a draw layer (`flatLayer(material, LAYER.marker)` from `@lawn/depth`), never just a small lift. New visible objects come from `@lawn/prefabs` (`buildPrefab(id, { scale })`), never hand-built meshes (rings and beacons for quest markers are fine, as the other runners do).

## Goal

Fill in the two runners in `games/gnome-theft-auto/src/quests/objectivesTessie.ts` (now stubs) for steps 1 and 2 of the Tessie side quest on Loch Moss: **sightings by boat at dusk**, and **sonar buoys dropped unseen by an HOA patrol boat**.

## Read first

- `games/gnome-theft-auto/src/quests/objectivesTessie.ts`: the stubs. Keep both exported signatures exactly.
- `games/gnome-theft-auto/src/quests/types.ts`: `ObjectiveDef` (kinds `tessie-sightings` and `tessie-buoys`), `QuestDeps`, `Run`.
- `games/gnome-theft-auto/src/quests/objectivesAction.ts` lines 1-40 and `choiceRun` (from line 265): the house style for a runner (`makeRing`, `makeBeacon`, blips, `cleanup` disposing what it made).
- `games/gnome-theft-auto/src/boatTraffic.ts` lines 1-130: `loopRoute`, `steerToward` and how an NPC boat is made and driven.
- `games/gnome-theft-auto/src/config.ts`: the `TESSIE` block (search `export const TESSIE`).

## Contract (verbatim from the code; do not change these files)

```ts
// quests/types.ts
| { kind: 'tessie-sightings'; text: string; points: [number, number][]; radius: number; hint: string }
| { kind: 'tessie-buoys'; text: string; points: [number, number][]; radius: number; spotRadius: number; hint: string }
export interface Run {
  lines(): string[];            // tracker lines; {{word}} is highlighted
  done(): boolean;
  update(dt: number, px: number, pz: number): void;   // px, pz = the player's position
  onCracked(npc: Npc): void;    // unused here: {}
  blips(): Blip[];              // Blip = { x, z, color: string, quest?: string }
  cracked(): string[];          // unused here: () => []
  cleanup(): void;              // remove and dispose everything this run added
}
// QuestDeps fields you use: scene: THREE.Scene; world: World; hud: Hud; play(sfx: Sfx): void; player?: Player;
//   vehicles?: Vehicle[]; fx?: Fx; atmosphere?: { getMode(): 'auto'|'noon'|'golden'|'night'; setMode(m): void }
// `changed()` (3rd arg): call once when the objective becomes done (and after any progress you want saved).
// `say(text)` (4th arg): a toast.
export function tessieSightingsRun(obj, deps, changed, say): Run
export function tessieBuoysRun(obj, deps, changed, say): Run
```

Existing helpers (confirmed):

```ts
import { buildPrefab } from '@lawn/prefabs';                 // buildPrefab(id, { scale }): THREE.Group (named pivot groups inside)
import { LAYER, flatLayer } from '@lawn/depth';
import { waterAt } from '../terrain';                         // waterAt(x, z): { surface, depth } | null
import { loopRoute, steerToward } from '../boatTraffic';      // loopRoute('water/loch-moss', scale, count): {x,z}[]; steerToward(v, tx, tz): steer -1..1
import { createVehicle, removeVehicle, stepVehicle } from '../vehicles';
// createVehicle(scene, 'hoa-patrol-boat', x, z, yaw): Vehicle (floats on the water by itself)
// stepVehicle(v, { throttle, steer, lift: 0 }, dt, deps.world)  // drives a boat; call it every update for your NPC boat
// removeVehicle(scene, v)
import { TESSIE } from '../config';
```

- The player is "in a boat" when `deps.player?.vehicle?.spec.boat === true` (Vehicle has `x, z, y, yaw, speed, driver, questOwned, spec`).
- An NPC boat you own: `v.driver = 'npc'; v.questOwned = true; deps.vehicles?.push(v);` and in `cleanup` splice it out of `deps.vehicles` and `removeVehicle(deps.scene, v)` (unless `deps.player?.vehicle === v`: the player took it; then leave it and set nothing).
- Loch Moss: centre (-700, -680), 150 x 120 half axes, water surface about -0.65, 5 m deep in the middle. A marker on the water stands at `waterAt(x, z)?.surface ?? 0` (never `heightAt`, which is the loch bed).
- `TESSIE.sightings` = [[-640, -700], [-700, -760], [-790, -640]], `sightingRadius` 12; `TESSIE.buoys` = [[-650, -640], [-760, -650], [-740, -770], [-640, -740]], `buoyRadius` 8; `patrolScale` 0.55, `patrolPoints` 8, `patrolThrottle` 0.55, `spotRadius` 24; `TESSIE.dock` = { x: -715, z: -564 } (boats are moored there).

## Change

`games/gnome-theft-auto/src/quests/objectivesTessie.ts` only (plus an optional new test file `games/gnome-theft-auto/src/quests/objectivesTessie.test.ts` for pure helpers you export).

### `tessieSightingsRun` (step 1: "follow the sightings around the loch by boat at dusk")

- On start: remember `deps.atmosphere?.getMode()` and call `deps.atmosphere?.setMode('golden')` (dusk light while the step runs). In `cleanup`, put the remembered mode back.
- Sightings are visited in order (`obj.points`). For the current one draw a ring on the water (RingGeometry about `obj.radius - 0.6` to `obj.radius`, `flatLayer(..., LAYER.marker)`, laid flat, at surface + 0.05, pulsing opacity) and a faint beacon like `makeBeacon` but standing on the water surface. Also ripples: two or three thin rings that grow and fade in a loop inside it (same layer).
- When the player is within `obj.radius` of the current point **and in a boat**, it counts: a hump surfaces there: build `buildPrefab('tessie', { scale: 3 })` once, place it at the point with y = surface - 3.2 (only the top of the shell shows), rise it by about 1.2 m over 1.2 s, hold 1.5 s, sink back over 1.5 s, then hide it (reuse the same mesh for every sighting). Play `deps.play('splash')`, `deps.fx?.waterJet?.(x, surface + 0.3, z)` at the start, and `say('Sighting 1 of 3! ...')` with a short line (e.g. "Something big rolls under the surface and is gone."). Then move to the next point.
- In range but on foot or bobbing: `say` once (cooldown 6 s) "Too close to the shore to see. Take a boat out." Not in range: nothing.
- `lines()`: not in a boat: `['Take a boat out from the {{Loch Moss dock}}.', obj.text]`; in a boat: `[obj.text, 'Sighting ' + (n+1) + ' of ' + total + ': {{' + obj.hint + '}}']`.
- `blips()`: the current point, `{ x, z, color: '#ff7a00', quest: obj.hint }`; none when done.
- `done()` once all points have been seen and the last hump has finished sinking (so the player sees it); call `changed()` exactly once at that moment.
- `cleanup()`: remove and dispose rings, beacon and the turtle mesh (`deps.scene.remove(obj3d)`; dispose geometries/materials you created; the prefab's are shared, do not dispose them), restore the sky mode.

### `tessieBuoysRun` (step 2: "drop the sonar buoys without the HOA patrol boat seeing you")

- On start, create the HOA patrol boat: `const route = loopRoute('water/loch-moss', TESSIE.patrolScale, TESSIE.patrolPoints)`, spawn at `route[0]` facing `route[1]`, register it as an NPC boat (see Contract). Each update: if `patrol.driver === 'npc'`, advance its waypoint when within 10 m and `stepVehicle(patrol, { throttle: TESSIE.patrolThrottle, steer: steerToward(patrol, wp.x, wp.z), lift: 0 }, dt, deps.world)`. If the player takes it (`patrol.driver !== 'npc'`), the patrol is gone: no more spotting.
- A ring + beacon (as above) on every buoy point not yet dropped.
- Dropping: player in a boat within `obj.radius` of an undropped point -> it is dropped: build `buildPrefab('sonar-buoy', { scale: 1.5 })` there floating at the surface (y = surface - 0.2; bob it gently, ±0.06 m at about 0.8 Hz), play `'splash'`, `say('Buoy ' + k + ' of ' + total + ' down. Its lamp blinks.')`, call `changed()`.
- Spotted: while the patrol is driving, if the player is in a boat and within `obj.spotRadius` of the patrol (and at least one buoy is down), the patrol spots them: remove every dropped buoy (they become undropped again), `deps.play('alarm')`, `say('The HOA patrol spotted you and fished out your buoys! Keep your distance.')`, then a 6 s grace period with no spotting. Never add Hat Watch heat (this is stealth by water, Hat-Watch-free).
- Warn: when the player is within `obj.spotRadius + 15` of the patrol (and not spotted), `say` once per 8 s "HOA patrol boat nearby. Keep clear."
- `lines()`: `[obj.text, k + ' of ' + total + ' buoys down. Keep {{' + (TESSIE.spotRadius) + ' m}} from the HOA patrol boat.']`; plus 'Take a boat out from the {{Loch Moss dock}}.' first when not in a boat.
- `blips()`: undropped points `{ x, z, color: '#ff7a00', quest: 'Sonar buoy' }` and the patrol `{ x, z, color: '#ff3b3b', quest: 'HOA patrol boat' }` while it drives.
- `done()` when every point is dropped; call `changed()` then too (once).
- `cleanup()`: remove rings, beacons and buoy meshes; remove the patrol from `deps.vehicles` and the scene unless the player is in it.

Keep the code readable: a small internal helper for "ring on the water" and "beacon on the water" used by both runners is good. Pure helpers you want to unit-test (e.g. `nextUnseen`, `spotted(px, pz, bx, bz, r)`) may be exported.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (if the only errors are in files other workers own, they are mid-edit; re-run a little later).
- If you added `objectivesTessie.test.ts`: `npx vitest run src/quests/objectivesTessie.test.ts` from `games/gnome-theft-auto` passes. Tests that import `quests.ts` or `app.ts` need `vi.mock('../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }))`; prefer testing only your pure helpers.
- Both exported signatures are unchanged.

## Out of scope

Everything else, in particular `quests/types.ts`, `quests/quests.ts`, `quests/objectivesTessieEscort.ts`, `quests/tessieQuest.ts`, `config.ts`, `boatTraffic.ts`, `vehicles.ts`, `app.ts`, `tessie.ts`, `radio/`, prefabs and lore.
