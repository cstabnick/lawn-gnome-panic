Epic: E17 wave 2 (living parts)
Depends on: J1 jobs.ts, J2 sortingUi.ts, J3 digUi.ts (all done)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section, the societies save, mobile rules).

## Goal
The four mole jobs can be worked in Loamdeep: job spots in the halls, a shift strip on the HUD, the Root Run carried
between halls, the Lamplighter relighting a tunnel's lamps, Post Sorting and Dig a Nook through their full-screen
games, then pay, the shift card, the save and the event. Also: Loamdeep's speakers play Subsoil Radio once DJ Moleman
visits.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`LOAMDEEP` (spots, lamps, halls), `LAMP_TUNNELS`, `HALL_NAMES`,
  `MOLE_JOB_NAMES`, `SOCIETY_INTERIORS`, `SOCIETY_EVENTS`, `SocietyDeps`, `SocietyPart`)
- `games/gnome-theft-auto/src/societies/loamdeep/jobs.ts` (`MOLE_JOBS`, `MoleShift`, `startShift`, `tickShift`,
  `takeRoots`, `dropRoots`, `lightLamp`, `recordSorting`, `recordNook`, `shiftStars`, `shiftPay`, `jobLine`)
- `games/gnome-theft-auto/src/societies/loamdeep/sortingUi.ts` and `digUi.ts` (only their exported functions:
  `openSortingGame(ui, { letters, seconds, rand, onDone })`, `sortingOpen()`, `openDigGame(ui, { nook, rand, onDone })`,
  `digOpen()`)
- `games/gnome-theft-auto/src/workplaces/shiftCard.ts` lines 1-35 (`showShiftCard(ui, ShiftCardView)`)
- `games/gnome-theft-auto/src/societies/loamdeep/runtime.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/runtime.ts`: keep both exported signatures. Module state: the deps
  (set by `installLoamdeep`), the current `MoleShift | null`, the lamp objects of the current build, a small cache of the
  save (re-read at most once a second). Helpers: `toast(t)` = `deps?.hud.toast(t)`; `say(name, line)` dispatches
  `gta:interior-say`. All world positions inside Loamdeep come from `interiorToWorld(SOCIETY_INTERIORS.loamdeep, lx, lz)`.
  - `buildJobSpots(kit)` (called on every entry; the room is rebuilt, so read the shift state when building):
    - Root Run: spot at `spots.rootPickup`, prompt 'Roots (Root Run)': no shift -> start a 'roots' shift then
      `takeRoots`; a roots shift with `rootTo === null` -> `takeRoots`; else toast "You have roots for <Hall>." After
      taking: toast "Old Tamp: 'To <Hall>, if it pleases you. Gently.'". One spot per `spots.rootDrops` hall, prompt
      'Drop the roots': roots shift and that hall is `rootTo` -> `dropRoots` (+ `playAt('mole-squeak')`, toast "Most
      kind."), wrong hall -> toast "These are for <Hall>.", no roots -> toast "Nothing to drop. Rootway Hall has roots."
    - Lamplighter: spot at `spots.taper`, prompt 'Take a taper (Lamplighter)': starts a 'lamps' shift, but choose the
      tunnel yourself: prefer one not lit in the last two lamps shifts this session (keep a small list), set
      `tunnel` and reset `lit` accordingly. For EVERY lamp point in `LOAMDEEP.lamps` (12): put both `mole-lamp-lit` and
      `mole-lamp` at the point with `{ y: 2.1, solid: false }`, yaw facing into the tunnel (westRise lamps face east
      `Math.PI / 2`, eastRise and mothersNorth lamps face west `-Math.PI / 2`), and show the lit one unless that lamp is
      in the active lamps shift's tunnel and not yet lit. A spot at each lamp point offset 0.9 m into the tunnel, prompt
      'Light the lamp': active lamps shift + this tunnel + unlit -> `lightLamp`, swap visibility, `playAt('lamp-whoomp')`;
      already lit -> toast "Already burning, and very nicely."; no shift -> toast "Mistress Delve keeps the tapers in
      Lamplight Hall."
    - Post Sorting: spot at `spots.sortingDesk`, prompt 'Sort the post (Post Sorting)': opens `openSortingGame(deps.ui,
      { letters: MOLE_JOBS.post.units, seconds: MOLE_JOBS.post.seconds, rand: Math.random, onDone })`; onDone: quit with 0
      sorted -> no shift; else `recordSorting` on a fresh post shift and finish it.
    - Dig a Nook: one spot per `spots.digFaces[i]`, prompt 'Dig a nook (Dig a Nook)': start a 'dig' shift if none; refuse
      a face already dug this shift (toast "That nook is done. A lovely one."); open `openDigGame(deps.ui, { nook: i,
      rand: Math.random, onDone })`; onDone (not quit) -> `recordNook`, `playAt('soil-crumble')`; finish when over.
    - Any job spot while a DIFFERENT job's shift runs: toast "Finish the <job> first. The moles are counting on you."
  - Finishing a shift (`over` true, or the clock ran out): `stars = shiftStars`, `pay = shiftPay`; if `done === 0`: toast
    "No harm done. The moles will keep your place." and clear. Else `deps.economy.earn(pay, 'Loamdeep')`,
    `updateSocietySave((s) => { s.moleJobs[job]++; s.moleBest[job] = Math.max(s.moleBest[job], stars); })`,
    `showShiftCard(deps.ui, { icon: '⛏️', title: '<Job name>: Loamdeep', quote: <a line from the job's mole, e.g. Old
    Tamp "You carry roots like someone who has been told about roots.">, stars, lines: [`${done} of ${units} done`, misses
    line if any], total: pay, level: 'Burrowfolk helper', xpFrac: 1 })`, dispatch
    `new CustomEvent(SOCIETY_EVENTS.moleJobDone, { detail: { job, stars, pay } })` on `window` (guard typeof window).
  - `installLoamdeep(deps)` returns a `SocietyPart`:
    - `update(dt)`: if a shift runs and no full-screen game is open: `tickShift`; out of time -> finish. Keep a HUD strip
      (one `div` appended to `deps.ui` lazily, top centre under the HUD, `pointer-events: none`, readable on a phone,
      `env(safe-area-inset-top)`) showing `jobLine(shift)`, hidden when no shift. Leaving Loamdeep
      (`onInteriorChange`, or `currentInterior() !== 'loamdeep'`) during a shift: finish it as is (pay for what was done).
    - `isOpen()`: `sortingOpen() || digOpen()`.
    - `blips()`: during a Root Run with `rootTo`, one blip at the target drop's world point `{ x, z, color: '#ffcc66',
      label: HALL_NAMES[rootTo] }`; during a Lamplighter shift, one blip at the next unlit lamp.
    - `speaker(x, z)`: when `currentInterior()` is 'loamdeep' and the cached save has `molemanVisits`, return the nearer of
      the two `spots.speakers` in world coords with `y: 1.2, station: 'under'`; when `currentInterior()` is
      'moleman-burrow', return the burrow's decks point (`MOLEMAN_BURROW.decks`, world coords via
      `interiorToWorld(SOCIETY_INTERIORS.moleman, ...)`), always. Else null.
- `games/gnome-theft-auto/src/societies/loamdeep/runtime.test.ts` (new): with `createKit` (see
  `src/interiors/kit.test.ts`) after `kit.room()`, `buildJobSpots(kit)` adds the spots: 1 roots pickup, 5 drops, 1 taper,
  12 lamp spots, 1 sorting desk, 3 dig faces (count by prompt); and 24 lamp objects. `installLoamdeep` with a minimal fake
  deps (hud.toast, economy.earn as vi.fn) returns a part whose `isOpen()` is false and `speaker(0, 0)` is null outside.

## Contract
`buildJobSpots(kit)` and `installLoamdeep(deps): SocietyPart` keep their signatures; the event `SOCIETY_EVENTS.moleJobDone`
with detail `{ job, stars, pay }`; save writes through `updateSocietySave`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/runtime.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (jobs.ts, the UIs, folk.ts, interior.ts, config.ts, save.ts).
