Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/sports/app.ts`, `sports/app.test.ts`, and additions to `src/mapIcons.ts` (and
`src/mapIcons.test.ts` if it checks every kind). Others edit other files.

## Goal
A Gnomlet tablet app "Founders' Green" for Drainpipe Court and the Gutter Bowls (records, line bests, buttons to drop
your skateboard, start a line or a pickup game), and two map place kinds 'court' and 'skate' with their own icons.

## Read first
- `games/gnome-theft-auto/src/sports/types.ts` (`SportsSave`, `SportsStore`), `src/court/types.ts` (`CourtApi`,
  `PICKUP`), `src/skate/types.ts` (`SkateApi`, `SKATE_LINES`, `LineId`).
- `games/gnome-theft-auto/src/golf/golfApp.ts` and `golf/golfApp.test.ts`: the model (registerGnomletApp, card and
  button styles, a deps object, how the test renders the app).
- `games/gnome-theft-auto/src/mapIcons.ts`: `PoiKind`, `PLACE_STYLE` (the `golf` row), and the icon drawing switch
  (`case 'golf'` ~line 436). The Blip kind union in `src/types.ts` already has 'court' and 'skate'.

## Change
- `src/sports/app.ts`:
  ```ts
  export interface FoundersAppDeps {
    store(): SportsStore;
    court(): CourtApi | null;
    skate(): SkateApi | null;
    toast(text: string): void;
  }
  export function registerFoundersApp(deps: FoundersAppDeps): void;   // id 'founders-green', title "Founders' Green"
  ```
  Two cards. Drainpipe Court: games, wins, threes, dunks, beat Swish n times, best winning margin; buttons "Pickup game
  (to 11)" (`court()?.startGame({ opponents: 'regulars' })`) and "Shootaround" (`startShootaround()`); a refusal
  reason goes to `toast`. The Gutter Bowls: best combo, full rails, lines done, then each of `SKATE_LINES` with its
  name and best time (or "not yet"), a "Skate it" button each (`skate()?.startLine(id)`), and "Drop your board"
  (`skate()?.dropBoard()`) shown only when `skate()?.boardOwned()`. One line of flavour each ("Nobody owns the court.
  Swish is the nearest thing." / "It's only a gutter. It's the best gutter in the yard."). Buttons >= 44 px, fits
  390 px wide.
- `src/mapIcons.ts`: kinds 'court' (`PLACE_STYLE.court = { name: 'Drainpipe Court (basketball)', color: '#e0702a' }`,
  icon: a basketball: an orange disc with two dark seam curves) and 'skate' (`{ name: 'The Gutter Bowls (skate park)',
  color: '#3a7ac0' }`, icon: a skateboard seen from above, a rounded bar with four dots), drawn the way 'golf' is.
- `src/sports/app.test.ts`: registering puts the app in the registry; rendering with a fake store shows the numbers and
  one "Skate it" button per line; clicking one calls `startLine` with that id; "Drop your board" only when owned.

## Contract
`registerFoundersApp(deps: FoundersAppDeps): void`; map kinds 'court' and 'skate' in `PLACE_STYLE`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sports/app.test.ts src/mapIcons.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
