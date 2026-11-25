Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
`homes/data.ts` holds a home row and a workplace row for every character of the character bible, so story quests can
ask `homeOf(id)` / `workOf(id)` / `homeDoor(id)`; acknowledged homes become taxi/courier destinations; a test keeps
the table honest.

## Read first
- `docs/design/gnome-theft-auto/characters.md` lines 9-85: the "Homes and workplaces" table (one row per character:
  home, home site slot, workplace, quests). This is the source; transcribe every row.
- `games/gnome-theft-auto/src/homes/types.ts`: `HomeDef`, `WorkDef`, `HomeKind`, `HOME_DOORS`, `SAUCER_COURT`.
- `games/gnome-theft-auto/src/homes/data.ts`: the stub (9 rows E10 builds, helpers). Keep its exports and those rows.
- `games/gnome-theft-auto/src/quests/stages.ts`: `CAST` (ids), `STAGES`, `stageById(id)` (a `Stage` has `center: [x, z]`).
- `games/gnome-theft-auto/src/city/cityCast.ts`: `CITY_CAST` (`key` ids).
- `games/gnome-theft-auto/src/jobs/places.ts`: `LAND_PLACES` (taxi/courier destinations) and its test
  `src/jobs/places.test.ts`.

## Change
- `games/gnome-theft-auto/src/homes/data.ts`: add a `HomeDef` for every bible row not yet in `ROWS` (keep the 9 existing
  rows unchanged), in bible order, and a `WorkDef` for every bible row in `WORK_ROWS`. Rules:
  - `characterId` = the bible's id. `name` = the bible's home wording, lower-case start ("a cot in Side-Valve's storeroom").
  - Slot `existing:<stage>` → `where: 'stage:<stage>'`, `kind: 'existing'`, `door` = the stage's `center` as
    `[x, z, 0]` (read it with `stageById` at module load; if a stage id in the bible does not exist in `STAGES`, use the
    nearest real one: `pebblewick` → `pebblewick-plots`, `speedway` → `speedway-pits`, `thorne-tower` →
    `glaze-tax-office`, `bodega-front` stays, `driftwood-trailer` stays; write a one-line comment for each such swap).
  - `site:<id>` or `mole halls (E17)` → `kind: 'site'`, `where: 'site:<E01 site id>'` (`site:coast` → `site:boardwalk`,
    `site:skyway-society` → `site:skyway-under`, mole halls → `site:mole-entrance`), `door: null` (the area epic builds it
    and calls `registerHome` with a door), `acknowledged: true`.
  - `(hidden)` homes → `kind: 'hidden'`, `acknowledged: false`, `door: null`, `where: null` unless the bible names an
    existing stage (then `where: 'stage:<id>'`, still `door: null`).
  - Characters with two homes over the story (pip, tansy, turncoat-cam, driftwood): one row, the first home; put the later
    one in a trailing comment (e.g. `// from #39: the player's couch at Saucer Court`).
  - `WorkDef.at`: a stage centre when the workplace is a stage (set `stage`), a fixed spot you can name from config
    (City Hall steps: `[8, -70]`; Kerbstone Cabs / Central Bus Stop: `[-6.25, 14]`; Glaze Clinic: `HOSPITAL` from
    `../config`), else `null`.
  - Every `CAST` id (quests/stages.ts) and every `CITY_CAST` key must have both rows. If one of them is missing from the
    bible table, give it a hidden home row and a null workplace with a comment.
- `games/gnome-theft-auto/src/jobs/places.ts`: append the acknowledged built homes to `LAND_PLACES` as
  `...homeLandPlaces()` where you add (in data.ts) `export function homeLandPlaces(): { id; name; x; z; area: 'city' | 'outskirts' | 'forest' }[]`
  returning only rows whose `kind` is `'facade'` or `'interior'` with a door: id `home-<characterId>`, name e.g.
  "Juniper Vance's terrace" (short, possessive, from the character's display name), area `'city'` inside |x|,|z| <= 215,
  `'forest'` for Sorrel, `'outskirts'` otherwise. Make sure `src/jobs/places.test.ts` still passes (it checks land
  places are dry and on land); if a door fails it, report which and move nothing (the lead fixes coordinates).
- New `games/gnome-theft-auto/src/homes/homes.test.ts`:
  - every `CAST` id and `CITY_CAST` key has `homeOf` and `workOf`;
  - no duplicate `characterId` in `HOMES` or `WORKS`;
  - every row with `where` starting `home-` or equal to `'saucer-court'` has a `door` and the door is within 14 m of
    that site's rectangle (`siteRect(id)` from `../sites`) and outside it by at least 0.5 m or on its edge;
  - every `kind: 'hidden'` row has `acknowledged: false` and `door: null`;
  - `homeDoor('juniper')` equals `[HOME_DOORS.juniper[0], HOME_DOORS.juniper[1]]`.

## Contract
Exports of data.ts stay: `HOMES`, `WORKS`, `registerHome`, `registerWork`, `homeOf`, `workOf`, `homeDoor`, `homePlaces`,
plus new `homeLandPlaces`. Other workers import `homeDoor` and `HOMES` right now: keep the signatures.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/homes/homes.test.ts src/jobs` passes.

## Out of scope
homes/types.ts, any builder file, quests, the bible itself.
