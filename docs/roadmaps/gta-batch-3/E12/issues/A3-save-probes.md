Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
The winter save `gta-winter-v1` works (`winter/save.ts`), four quest probes read it, and a test checks that every winter
place constant lies inside its E01 site.

## Read first
- `games/gnome-theft-auto/src/winter/types.ts`: `WinterSave`, `WINTER_SAVE_KEY`, `RunId`, `WINTER_PROBES`, and the
  place constants (`LODGE`, `SLED_STACK`, `COCOA_HATCH`, `SKI_RACK`, `TOW`, `WOOL_RUN`, `TEA_TRAY_RUN`, `PAIL_POND`,
  `SHANTY`, `SNOWCAP_BEARS`). Never edit it.
- `games/gnome-theft-auto/src/winter/save.ts`: the stub (keep its exports and signatures).
- `games/gnome-theft-auto/src/fishing/fishSave.ts` (lines 1-200): the house style of a store over localStorage
  (`parse...` that never throws, `create...Store(storage?)`, writes on every change, storage errors swallowed).
- `games/gnome-theft-auto/src/city/probes.ts`: the `SAVED` table of probes read fresh from a save.
- `games/gnome-theft-auto/src/sites.ts`: `inSite(id, x, z, margin)` (site ids `'ski-hill'`, `'ice-lake'`).

## Change
- `src/winter/save.ts`:
  - `parseWinterSave(raw)`: JSON; anything not an object -> `emptyWinterSave()`. Field by field: `best` and `runs` keep
    only keys 'wool-run' / 'tea-tray-run' with finite numbers > 0; `clean`, `iceCatches`, `holes` finite integers >= 0
    (else 0); `sled` boolean (else false); `hugged` array of strings (else [], duplicates dropped). `v` is always 1.
  - `createWinterStore(storage?)`: storage defaults to `globalThis.localStorage` when it exists (wrap the access in try:
    it can throw), else an in-memory object. Reads `WINTER_SAVE_KEY` once at creation. Every mutation writes the whole
    save back as JSON (try/catch, ignore failures).
    - `recordRun(id, seconds, clean)`: runs[id] += 1; if clean and id === 'wool-run', clean += 1; best[id] = min(old,
      seconds) (seconds rounded to 0.1); returns `{ best: <no old best or seconds < old>, first: <runs was 0 before> }`.
    - `hasSled()`, `buySled()` (sets true), `recordIceCatch()` (+1, returns total), `recordHole()` (+1, returns total),
      `hug(key)` (adds when new, returns `hugged.length`).
    - `data()` returns the live object (read-only by type).
- `src/city/probes.ts`: add four rows to `SAVED`, each reading the save fresh through `createWinterStore(storage() ??
  undefined).data()` inside `withStore(...) ?? 0`, like the fishing rows:
  `'winter-sled-runs'` = `runs['tea-tray-run'] ?? 0`, `'winter-ski-runs'` = `runs['wool-run'] ?? 0`, `'ice-holes'` =
  `holes`, `'ice-catches'` = `iceCatches`. (These ids are `WINTER_PROBES` in types.ts; import the store from
  `'../winter/save'`.)
- New `src/winter/save.test.ts`: a fake storage (`Map`-backed `getItem`/`setItem`): round trip (record, new store on the
  same storage reads it back); `recordRun` best/first flags (first run: best true, first true; slower second: best false,
  first false; faster third: best true); clean counting only for clean wool runs; garbage input ('{', '[]', '{"best":
  {"wool-run": -3, "x": 5}}', null) parses to safe values; a storage whose `setItem` throws does not throw out of the
  store; `hug` ignores duplicates. Also: with the fake storage installed as `globalThis.localStorage` (restore it after),
  `readProbe('winter-ski-runs')` from `../city/probes` reads 2 after two recorded wool runs.
- New `src/winter/places.test.ts`: every place is inside its site with `inSite(id, x, z)`: `LODGE`, `SLED_STACK`,
  `COCOA_HATCH`, `SKI_RACK`, `TOW.base`, `TOW.top`, every `WOOL_RUN` / `TEA_TRAY_RUN` start, gate and finish centre, and
  the `lodge-mug` bear in `'ski-hill'`; `PAIL_POND` centre, `SHANTY` and the three `pond-*` bears in `'ice-lake'`, and
  each pond bear and the shanty within `PAIL_POND.r` of the pond centre. Also the lodge does not cover the runs: every
  gate and finish centre is more than `LODGE.size` metres from `LODGE`.

## Contract
`save.ts` exports exactly as its stub. Probe ids exactly `winter-sled-runs`, `winter-ski-runs`, `ice-holes`, `ice-catches`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter/save.test.ts src/winter/places.test.ts src/saveIO.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`winter/types.ts` (report a place that falls outside its site instead of moving it), every other winter file,
`saveIO.ts` and `cloudSave.ts` (the lead already added the key).
