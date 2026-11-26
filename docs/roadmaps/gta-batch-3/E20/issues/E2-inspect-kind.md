Epic: E20-1 foundation (engine, cast, props)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da`, game `games/gnome-theft-auto`
(three.js + TypeScript). Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit,
stash or checkout. Keep LF line endings. Six other workers edit other files of this game at the same time: touch only
the files below.

## Goal
A new quest objective kind `inspect`: walk to each point on foot and press, or hold, an action button there
(photograph a permit, read a barometer, look through a knot-hole, test a lock). It plays on desktop and touch, and the
quest sim solves it. The type, a stub runner and a stub solver already exist and are registered; replace the stubs.

## Contract (already in `src/quests/types.ts`, do not change it)
```ts
| {
    kind: 'inspect';
    text: string;
    points: InspectPoint[];
    verb: string;            // button label: 'Photograph', 'Look', 'Hold', 'Test'
    holdSeconds?: number;    // absent/0 = one press; >0 = keep holding that long (a ring fills; letting go resets it)
    ordered?: boolean;       // points must be done in list order
    hint: string;
    scene?: string;          // a SCENES id played once the last point is done, before the step completes
  };
export interface InspectPoint {
  at: [number, number];
  label: string;             // tracker line and toast, e.g. "Permit 2 of 3: the show-home gate"
  note?: string;             // toast once done: the story line the player learns
  prop?: string;             // a @lawn/prefabs id built at the point while pending
  radius?: number;           // default 3 m
  interior?: string;         // `at` is local to this E05 interior (interiors/registry.ts interiorToWorld)
}
```
Runner (stub `src/quests/objectivesInspect.ts`): `export function inspectRun(obj, deps: QuestDeps, changed: () => void,
say: (t: string) => void): Run`. Solver (stub `src/questSim/solvers/inspect.ts`): `export const inspectSolver:
Solver<'inspect'>`.

## Behaviour
1. Each pending point gets a small marker (ground ring or beam like visit/checkpoints use, `trackBeam` from
   `questMarkerPrefs.ts`) and a blip; with `ordered` only the next one shows. `prop` builds the prefab there with
   `buildPrefab` from `@lawn/prefabs` (see how other runners or `stageSets.ts` place prefabs), removed when done.
2. On foot (not in a vehicle) within the point's radius: show an action button labelled with `verb` (a DOM button,
   min 44x44 px, appended to the shared `#ui` element through its own container, never restyle `#ui`). Pressing E,
   Space, or the gamepad's A (if there is an existing helper for it; else E/Space plus the button) or tapping the button
   does the point; with `holdSeconds` the press must be held (pointerdown/up on the button, keydown/keyup for keys) and a
   fill bar or ring on the button shows progress. Model the UI and input on the hold button in
   `src/societies/flock/sermon.ts` (E17's sermon hold game).
3. A done point: toast `note` (or `label`), `sfx` a camera click for verb 'Photograph' if a suitable sound exists
   (`deps.play`), marker removed. Tracker `lines()`: `[text, '<done>/<total>: next <label>']`.
4. After the last point: if `scene` is set, play it through `deps.cutscene` the way the `visit` runner plays its
   `scene:` (find it in `quests.ts`), then `done()`; else `done()` at once. Call `changed()` once.
5. Save resume: points done are not saved; the step restarts from the first point (keep it simple).
6. `cleanup()` removes the button container, listeners, markers and props.
7. For the quest sim, expose a way to do a point without input: e.g. the runner registers itself so the headless
   harness can call `inspectNow()`; or simpler, make the runner accept a held "action" from the sim input layer if one
   exists (`src/questSim/input.ts`). Pick the existing pattern other sim-solved input steps use (read `solvers/probe.ts`
   and `questSim/input.ts`) and say which in your report.

## Read first
- `src/quests/objectivesCity.ts` (`checkpointsRun`: markers, beams, interior points, blips), `src/quests/quests.ts`
  (how `visit` plays `scene`), `src/societies/flock/sermon.ts` (hold button UI + input), `src/questSim/solvers/foot.ts`
  (`visitSolver`) and `src/questSim/util.ts` (`travelTo`, `runUntil`).

## Change
- `src/quests/objectivesInspect.ts`: the runner. Export pure helpers you test (e.g. `holdProgress`, `nextPoint`).
- `src/questSim/solvers/inspect.ts`: walk to each point (in order), trigger it (holding for `holdSeconds` of sim time),
  wait for the step to finish.
- New tests: `src/quests/objectivesInspect.test.ts` (pure helpers) and `src/questSim/solvers/inspect.sim.test.ts`
  modelled on `foot.sim.test.ts`: a throwaway QuestDef with an inspect step of two points near the Central Bus Stop
  (around x 0..10, z 10..20), one with `holdSeconds: 2`, solves to 'pass'.

## Done when
- `npx tsc --noEmit` (from `games/gnome-theft-auto`) passes.
- `npx vitest run src/quests/objectivesInspect.test.ts` and
  `npx vitest run --config vitest.sim.config.ts src/questSim/solvers/inspect.sim.test.ts` pass.
- `npx vitest run src/questSim/coverage.test.ts src/quests/quests.test.ts` still pass.
- The button is at least 44 px and appended inside a container under `#ui`.

## Out of scope
Every other file, in particular `objectivesPassenger.ts` and `solvers/passenger.ts` (another worker), `types.ts`,
`quests.ts`, `solvers/index.ts`. If the sim input layer needs a change in a shared file (`questSim/input.ts`,
`harness.ts`), make the smallest additive change and list it in your report.
