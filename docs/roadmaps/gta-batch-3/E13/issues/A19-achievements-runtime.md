Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`src/campus/achievements.ts` awards the five Rootwell achievements from what the player does: land Dean's Leap, visit
the twelve campus doors (progress saved), look through the telescope at night, land an aircraft on Rootwell Field, and
fly along Pinwheel Ridge between the pinwheels.

## Background (confirmed)
- Ids (`src/campus/types.ts` `ROOTWELL_ACH`): `deansLeap` 'gta-deans-leap', `honours` 'gta-first-class-honours'
  (target 12), `stargazer` 'gta-stargazer', `touchAndGo` 'gta-touch-and-go', `windfall` 'gta-windfall' (another worker
  adds them to the catalogue). `deps.unlock(id)` and `deps.increment(id, by?)` (`JobsDeps` in `src/jobs/types.ts`) call
  the game's achievement tracker; unlocking twice is harmless.
- Dean's Leap: `onStuntLanded(cb: (rampId, dist, airTime) => void): () => void` from `../stunts` fires when a stunt jump
  lands and qualifies; the ramp id is `OBSERVATORY.rampId` ('deans-leap').
- Campus tour: `CAMPUS_BUILDINGS` rows with `tour: true` (twelve) and their `door` spots. Save visited ids in
  localStorage under `ROOTWELL_SAVE_KEY` ('gta-rootwell-v1') as JSON `{ "v": 1, "doors": string[] }`; wrap every
  storage read/write in try/catch (storage may be missing) and call `notifySaveChanged()` from `../saveHook` after a write
  (other modules do: grep it). A door counts when the player (on foot or driving) comes within 4 m of it; each new door
  `increment(honours)` once (never again for the same door, also across reloads).
- Telescope: the observatory interior dispatches `window` event `TELESCOPE_EVENT` ('gta:rootwell-telescope') with
  `detail: { night: boolean }`; unlock `stargazer` when `night` is true. Guard `typeof window !== 'undefined'`.
- Aircraft: `deps.player.vehicle` is the vehicle the player drives (or null); an aircraft has `v.spec.flies` true
  (`v.spec.fixedWing` for planes). Height above the ground: `aboveGround(x, y, z)` from `../terrain` with the vehicle's
  `v.x, v.y, v.z`. Speed: `v.speed` (m/s, signed).
- Rootwell Field's runway (`ROOTWELL_FIELD.runway`): centre (1300, 600), yaw 0, length 420, width 24, i.e. x 1288..1312,
  z 390..810.
- Pinwheel Ridge (`WIND_FARM.pinwheels`: ten at x 715..985 step 30, z ~-1202 on the crest; `PINWHEEL_SIZE.hub` 24 m,
  `rotorR` 9: the vane tips reach ground + 33).

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/achievements.ts` (stub: keep the signature).
- `games/gnome-theft-auto/src/jobs/types.ts` (`JobsDeps`).
- `games/gnome-theft-auto/src/stunts.ts` (`onStuntLanded`, near the top).
- `games/gnome-theft-auto/src/winter/save.ts` (a small localStorage save with try/catch and `notifySaveChanged`, to copy).

## Change
`src/campus/achievements.ts`:
- Pure exported helpers (unit-tested): `onRootwellRunway(x, z): boolean` (inside the runway rectangle);
  `windfallBand(x, z, above: number): number` returns the index (0..9) of the pinwheel whose x is within 15 m of `x` when
  `z` is within 22 m of that pinwheel's z and `above` (metres above the ground) is between 4 and 33, else -1;
  `loadTour(storage): Set<string>` / `saveTour(storage, set)` (storage = `Pick<Storage, 'getItem' | 'setItem'>` or null).
- `installRootwellAchievements(deps): RootwellPart`:
  - subscribe to `onStuntLanded` → `deps.unlock(ROOTWELL_ACH.deansLeap)` for 'deans-leap';
  - `window.addEventListener(TELESCOPE_EVENT, ...)` → unlock stargazer at night;
  - `update(dt)`: (a) the tour: every 0.25 s check the player's distance to the tour doors not yet visited; on a new one
    save, `deps.increment(ROOTWELL_ACH.honours)`, and `deps.hud.toast('First Class Honours: ' + n + '/12 — ' + name)`
    (if `hud.toast` exists; check `Hud` in `src/types.ts`); (b) Touch and Go: while the player flies an aircraft, remember
    the last time it was more than 3 m above the ground; when it is on the runway (`onRootwellRunway`), under 0.5 m above
    the ground, |speed| < 20 and it was airborne within the last 30 s, unlock touchAndGo; (c) Windfall: while flying an
    aircraft, track the set of distinct `windfallBand` indices passed in one continuous run (reset when the band check
    returns -1 for more than 4 s); at 4 distinct pinwheels unlock windfall.
  - Do nothing per frame beyond a distance check when the player is more than 1500 m from all Rootwell places.
- New `src/campus/achievements.test.ts` (vitest): the helpers (runway inside/outside, band hits/misses at the right
  heights, tour save round-trip with a fake storage and a throwing storage); `installRootwellAchievements(fakeDeps)`
  with a fake `unlock`/`increment` spy: walking the player to two tour doors increments twice and once more never
  increments the same door again; dispatching `TELESCOPE_EVENT` with `{ night: true }` unlocks stargazer (use the fake
  DOM from `../testing/fakeDom` if `window` is missing in the test environment).

## Contract
`installRootwellAchievements(deps): RootwellPart` (stub signature); exported helpers as above; save key
`gta-rootwell-v1` shape `{ v: 1, doors: string[] }`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/achievements.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/achievements*.ts`.

## Out of scope
Every other file (the catalogue entries are another worker's; `saveIO.ts`/`cloudSave.ts` are the lead's).
