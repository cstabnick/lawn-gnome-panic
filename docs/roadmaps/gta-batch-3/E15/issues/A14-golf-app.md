Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
A Gnomlet tablet app "Hedgeworth" shows the player's members' card: best score per hole, best round, rounds played,
aces, lost balls found, the course's holes with par and length, and a "Play a round" button that starts one when the
player is at the course.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `GolfApi`, `GolfStore`, `GolfSave`, `HOLES`, `COURSE_PAR`, `LOST_BALLS`,
  `YD`, `inYard`.
- `games/gnome-theft-auto/src/golf/golfApp.ts`: the stub you replace (keep `GolfAppDeps` and `registerGolfApp`).
- `games/gnome-theft-auto/src/winter/winterApp.ts` and `winterApp.test.ts`: the model (a Gnomlet app with `open(root)`,
  group 'fun', a list, a button, a cleanup; how the test opens it with a fake DOM).
- `games/gnome-theft-auto/src/gnomlet/registry.ts` lines 1-70 (`GnomletApp` fields).

## Change
- `src/golf/golfApp.ts` `registerGolfApp(deps)`: `registerGnomletApp({ id: 'hedgeworth', label: 'Hedgeworth',
  icon: '⛳', group: 'fun', detail: () => best round text or 'No card yet', open(root) {...} })`:
  a heading "Hedgeworth Links" with the line "Four holes. Nine on the card. Par 16."; a table of the holes (number,
  name, par, length in gnome yards from tee along the path to the green: sum of path legs / YD, rounded; your best or –);
  a stats block (rounds, best round with +/- to par, holes in one, lost balls found `n / LOST_BALLS.length`,
  the Kicked Board: "broken" / "still standing"); a **Play a round** button (44 px min height) that calls
  `deps.api()?.startRound(0)` and toasts the reason when it returns one; when `api()` is null the button is disabled.
  Starting a round from anywhere is fine (the runtime decides; it refuses with a reason when the player is far away).
- New `src/golf/golfApp.test.ts`: register with a fake store (data from `emptyGolfSave()` in `./save` with a best and a
  round set), open the app into a root element with the repo fake DOM, check the four hole rows and the stats text,
  click Play and see `startRound` called; with `api()` returning one that answers 'Too far from Hedgeworth.' the toast
  receives it.

## Contract
`registerGolfApp(deps: GolfAppDeps): void`; app id `hedgeworth`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/golfApp.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
