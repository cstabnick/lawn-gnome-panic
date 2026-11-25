Epic: E24-2 (workplace jobs, parallel build)
Depends on: none (foundation is in place)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first.

## Goal
The Jobs app (the job board, opened from the Gnomlet tablet) gets a "Workplaces" section listing the three new on-foot
jobs (Chef, Mechanic, Comedian) with level, XP bar, stats and perks, and a "Show me" button that routes the player to
the workplace (the HUD route line + waypoint), the same way a gig's next stop is routed.

## Read first
- `games/gnome-theft-auto/src/jobs/board.ts`: `BoardRow`, `BoardView`, `BoardActions`, `JobBoard`, and the render code
  (how a row card, its XP bar, perks list and buttons are built; reuse the same CSS classes `gta-jb-card`, `gta-jb-xp`...).
- `games/gnome-theft-auto/src/jobs/runtime.ts`: `boardView()` (~l.495), `openBoard()` (~l.529, the actions object it
  passes), `waypoint()` in the returned object / `update()` (~l.629-710).
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `WORK_JOBS`, `workTitle`, `workPerkLines`.
- `games/gnome-theft-auto/src/jobs/career.ts`: `levelProgress`, `sharedJobsStore` (the store has `get().work[job]`, a
  `JobRecord { xp, done, earned, ... }`).

## Change
- `games/gnome-theft-auto/src/jobs/board.ts`:
  - add `export interface WorkRow { job: WorkJobId; title: string; icon: string; employer: string; blurb: string;
    level: number; levelTitle: string; xpInto: number; xpNeed: number; done: number; earned: number; perks: string[];
    place: string; routed: boolean }` (`WorkJobId` from `./types`).
  - `BoardView` gains `work: WorkRow[]`; `BoardActions` gains `routeWork(job: WorkJobId): void` and `clearRoute(): void`.
  - Render a section header "Workplaces" after the vehicle-job cards (before the player-cab section), one card per
    row: icon + title + employer, `levelTitle` and "level n", the XP bar, a stats line ("12 done · 340 🌰 earned"),
    the blurb, the perks list, the place name, and one 44 px button: "Show me" (calls `routeWork`) or, when `routed`,
    "Stop route" (calls `clearRoute`). Same classes and look as the vehicle cards.
- `games/gnome-theft-auto/src/jobs/runtime.ts`:
  - `let workRoute: WorkJobId | null = null;`
  - `boardView()` fills `work` from `WORK_JOB_IDS` (in `./types`): `levelProgress(store.get().work[job].xp)`,
    `workTitle(job, level)`, `workPerkLines(job, level)`, `WORK_JOBS[job]` fields, `routed: workRoute === job`.
  - `openBoard()` actions: `routeWork(job)` sets `workRoute = job`, toasts `"Route set: <place name>"` and refreshes the
    board; `clearRoute()` sets null and refreshes.
  - `waypoint()`: when there is no gig waypoint and `workRoute` is set, return
    `{ x: place.x, z: place.z, color: WORK_JOBS[workRoute].color, label: place.name, direct: false }`.
  - In `update(dt)`: clear `workRoute` once the player (`deps.player.x/z`, or `deps.player.vehicle` position when
    driving) is within 12 m of the place.
  - The phone app `detail` line: `'Taxi, courier, pilot, boat, chef, mechanic, comedian'` when off duty.

## Contract
`BoardView.work`, `WorkRow`, `BoardActions.routeWork/clearRoute` as above. Do not change `JobId`, `JOBS`, `JobsSave` or
`career.ts`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `jobs/board.ts` or `jobs/runtime.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/jobs` passes.
- The new buttons are at least 44 px high; the section fits a 340 px wide board (the board is `min(340px, 100vw-24px)`).

## Out of scope
Everything under `src/workplaces/`, `jobs/workDefs.ts`, `jobs/career.ts`, `jobs/types.ts`, `app.ts`.
