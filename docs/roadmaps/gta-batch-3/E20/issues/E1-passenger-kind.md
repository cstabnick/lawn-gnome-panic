Epic: E20-1 foundation (engine, cast, props)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da`, game `games/gnome-theft-auto`
(three.js + TypeScript). Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit,
stash or checkout. Keep LF line endings. Six other workers edit other files of this game at the same time (cast tables,
prefabs, the 'inspect' kind, a side quest): touch only the files below.

## Goal
A new quest objective kind `passenger` (L58: pick a character up at their home or workplace, drive them, drop them off)
that plays in the game and that the quest sim can solve. The type, a stub runner and a stub solver already exist and are
registered; you replace the two stub bodies.

## Contract (already in `src/quests/types.ts`, do not change it)
```ts
| {
    kind: 'passenger';
    text: string;
    who: string;            // CAST key (src/cutscene/cast.ts CAST) for the look; `look` overrides
    name: string;
    look?: Partial<GnomeLook>;
    pickup: [number, number];
    dropAt: [number, number];
    radius: number;
    hint: string;
    vehicle?: { kind: VehicleKind; at: [number, number, number] };   // a ride parked near the pickup when the step starts
    maxDamage?: number;     // 0..1 of hp lost since pickup; past it the passenger refuses: Run.failed() returns a reason
    banter?: string[];      // toasts during the ride, spaced out (first after ~4 s, then every ~10 s)
    onBoard?: string;       // toast when they get in
    onDrop?: string;        // toast when they get out
  }
```
Runner signature (stub in `src/quests/objectivesPassenger.ts`, called from `quests.ts` OBJECTIVE_KINDS):
`export function passengerRun(obj, deps: QuestDeps, changed: () => void, say: (t: string) => void): Run`.
Solver (stub in `src/questSim/solvers/passenger.ts`): `export const passengerSolver: Solver<'passenger'>`.

## Behaviour
1. Step start: a gnome model of the character stands at `pickup` facing the road (look = `CAST[who].look` merged with
   `look`; name label like other quest NPCs if that exists), with a ground ring and a blip at the pickup. If `vehicle`
   is set and no player-usable ground vehicle is within 25 m, park one there (reuse `clearVehicleSpawn` /
   `createVehicle` the way `stealDeliverRun` in `objectivesDrive.ts` does, and `restoreVehicle` from `questPins.ts`).
2. Boarding: when the player is driving a ground vehicle (not a plane/boat/aircraft) within `radius` of the pickup and
   speed is below ~2 m/s, the character walks to the vehicle (~1 s), then rides it: seated on a passenger seat when the
   vehicle has one (see how `jobs/visuals.ts` seats taxi fares: `passengerCount(spec)` in `seats.ts`, the seat anim),
   otherwise hidden. Toast `onBoard` (default `"<name> climbs in."`). If the player is on foot near the pickup, show a
   hint line "Bring a ride: <name> won't walk."
3. Ride: the blip and ring move to `dropAt`; tracker lines `[text, 'Drop <name> at <hint>']`. `banter` toasts in order.
   Track hp at boarding; when `maxDamage` is set and hp lost exceeds it, `failed()` returns `"<name> got out: too
   rough"` (the engine retries the step from its checkpoint; see `Run.failed` in types.ts) and the model is removed.
   If the player leaves the vehicle mid-ride, the passenger waits in it (no fail).
4. Drop: driving within `radius` of `dropAt` below ~2 m/s: the character gets out beside the vehicle, walks ~3 m
   toward `dropAt`, toast `onDrop`, `done()` true, `changed()` called once.
5. `cleanup()` removes every mesh the run made (model, ring) and frees the parked vehicle like stealDeliver does.
   Resuming a save at this step simply restarts at the pickup.
6. Works on touch: no new input; the player only drives and stops.

## Read first
- `src/quests/objectivesDrive.ts`: `stealDeliverRun` (vehicle spawn, ring, blips, `maxDamage`) and `chaseFollowRun`
  (a gnome NPC driving: how its model is built from a look).
- `src/jobs/visuals.ts` and `src/seats.ts`: seated passenger models in a player's vehicle.
- `src/quests/types.ts` (`Run`, `QuestDeps`), `src/quests/quests.ts` (how runs are made and `failed()` is read).
- `src/questSim/solvers/drive.ts` (`stealDeliverSolver`) and `src/questSim/util.ts` (`travelTo`, `getInto`,
  `nearestVehicle`, `runUntil`, `stepDone`): the solver drives to the pickup, waits there stopped until boarded, then
  drives to the drop and stops until the step is done. It must not cheat-teleport unless `ctx.cheats.instantTravel`
  allows it, like the other solvers.

## Change
- `src/quests/objectivesPassenger.ts`: the runner (keep the export name and signature).
- `src/questSim/solvers/passenger.ts`: the solver (keep the export).
- New tests: `src/quests/objectivesPassenger.test.ts` (pure parts: boarding condition, damage check, banter timing;
  export small pure helpers for this) and `src/questSim/solvers/passenger.sim.test.ts` modelled on
  `drive.sim.test.ts`: a throwaway QuestDef with one passenger step from near Side-Valve Salvage (`SIDE_VALVE.bay` in
  `config.ts`) to `homeDoor('juniper')` (`src/homes/data.ts`) solves to 'pass'.

## Done when
- `npx tsc --noEmit` (from `games/gnome-theft-auto`) passes.
- `npx vitest run src/quests/objectivesPassenger.test.ts` passes, and
  `npx vitest run --config vitest.sim.config.ts src/questSim/solvers/passenger.sim.test.ts` passes.
- `npx vitest run src/questSim/coverage.test.ts src/quests/quests.test.ts` still pass.

## Out of scope
Every other file. In particular `src/quests/objectivesInspect.ts` and `src/questSim/solvers/inspect.ts` (another worker),
`types.ts`, `quests.ts`, `solvers/index.ts` (already wired). Report any wiring you think is missing instead of editing.
