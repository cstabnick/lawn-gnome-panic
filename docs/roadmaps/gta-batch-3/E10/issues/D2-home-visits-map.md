Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Character homes become map places once the player has stood at their front door (hidden until then, so the map does
not spoil them); the player's own flat is always on the map once owned; each first visit counts toward the "House Call"
achievement and is remembered in the save.

## Read first
- `games/gnome-theft-auto/src/homes/data.ts`: `HOMES` (rows with `characterId`, `name`, `door: [x, z, yaw] | null`,
  `kind`, `acknowledged`). Another worker is filling in more rows right now; only rely on these fields.
- `games/gnome-theft-auto/src/home/types.ts` (`FLAT_ID`) and `games/gnome-theft-auto/src/ownership.ts` (`ownsProperty`).
- `games/gnome-theft-auto/src/mapIcons.ts`: `PlaceKind`, `PLACE_STYLE` (legend name + colour), the icon drawing
  `switch` (one `case` per kind), `RIM_PLACES`.
- `games/gnome-theft-auto/src/types.ts` around line 706: `Blip` and its `kind` union.
- `games/gnome-theft-auto/src/cloudSave.ts` (skim `unionArrays`): the save key `gta-homes-visited-v1` already merges as
  a union of string arrays and is in `GTA_SAVE_KEYS`.

## Change
- New `games/gnome-theft-auto/src/homes/visits.ts`:
  ```ts
  export const VISITS_KEY = 'gta-homes-visited-v1';
  export interface HomeVisitsDeps {
    increment(id: string, by: number): void;
    toast(text: string): void;
    storage?: { getItem(k: string): string | null; setItem(k: string, v: string): void };
  }
  export interface HomeVisits {
    /** Every frame with the player's position (on foot or driving). */
    update(px: number, pz: number): void;
    /** Map blips: visited acknowledged homes (kind 'home'), plus the player's flat when owned. */
    blips(): Blip[];
    visited(): readonly string[];
  }
  export function createHomeVisits(deps: HomeVisitsDeps): HomeVisits;
  ```
  - Save: a JSON array of character ids, read once at create (default `localStorage` inside try/catch; bad JSON = []),
    written on each new visit, then `notifySaveChanged()` from `../saveHook`.
  - `update`: check at most every 0.5 s of calls (count calls or keep a timestamp; keep it cheap: HOMES is ~70 rows,
    only rows with `acknowledged && door && characterId !== 'player'`). Within 4 m of a door, first time: add the id,
    save, `deps.increment('gta-house-call', 1)`, toast `` `${displayName}'s home: ${row.name}` `` where displayName is a
    short form you derive from the row (capitalise the characterId's words: 'mayor-mulch' → 'Mayor Mulch'; good enough).
  - `blips()`: for each visited id with a door: `{ x, z, color: PLACE_STYLE.home.color, kind: 'home', label: row.name
    with a capital first letter }`; and when `ownsProperty(FLAT_ID)`, the flat: label 'Your flat (Saucer Court)', at
    `HOMES` row `'player'`'s door, kind 'home' (same colour; that is fine).
- `games/gnome-theft-auto/src/mapIcons.ts`: add `'home'` to `PlaceKind`, `PLACE_STYLE.home = { name: 'Homes (visited)',
  color: '#c97b4a' }`, and a `case 'home'` icon: a little house (a square body and a triangle roof) drawn with the same
  helpers the other cases use.
- `games/gnome-theft-auto/src/types.ts`: add `| 'home'` to `Blip['kind']` (line ~720, the place kinds row) and mention it
  in the doc comment list.
- New `games/gnome-theft-auto/src/homes/visits.test.ts`: with an in-memory storage, `createHomeVisits`; `update` at
  Juniper's door (`homeOf('juniper').door`) increments `gta-house-call` once (a second update there does not), adds a
  blip with kind 'home'; a new `createHomeVisits` on the same storage remembers the visit.
- If `src/mapIcons.test.ts` checks that every `PlaceKind` has a style/icon/legend entry, make it pass.

## Contract
`createHomeVisits(deps): HomeVisits` as above; Blip kind `'home'`. The lead wires `update` and `blips` in app.ts.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/homes/visits.test.ts src/mapIcons.test.ts` passes.

## Out of scope
homes/data.ts, app.ts, hud.ts, cloudSave.ts, saveIO.ts.
