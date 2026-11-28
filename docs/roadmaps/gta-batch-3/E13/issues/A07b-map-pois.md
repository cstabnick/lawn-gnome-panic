Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
The minimap and big map show Rootwell's four places with their own icons and names: Rootwell University, the Anthill
Observatory, Rootwell Field and Pinwheel Ridge.

## Background (confirmed)
- `src/mapIcons.ts`: `PlaceKind` union and `PLACE_STYLE: Record<PlaceKind, { name, color }>` (the big-map legend lists
  them in this order), and the icon drawing for each kind (a coloured disc with a small glyph drawn by a switch/if chain
  on the kind). E12 added the kinds 'ski', 'bears', 'icefish' at the end: follow exactly how those were added (search
  for `'icefish'` in the file to find every place a kind must be handled).
- `src/mapPois.ts` `placeBlips()` returns the fixed places as blips via `at(kind, x, z, label)`.

## Read first
- `games/gnome-theft-auto/src/mapIcons.ts` (all of it: kinds, styles, glyphs).
- `games/gnome-theft-auto/src/mapPois.ts` (`placeBlips`).
- `games/gnome-theft-auto/src/mapIcons.test.ts` (what is checked per kind).
- `games/gnome-theft-auto/src/campus/types.ts` (`CAMPUS.quadCentre`, `OBSERVATORY.dome`, `ROOTWELL_FIELD.runway`,
  `WIND_FARM`).

## Change
- `src/mapIcons.ts`: three new kinds appended after 'icefish':
  - `'campus'` { name: 'Rootwell University', color: '#8b1e2b' }, glyph: a mortarboard (a white diamond/square with a
    small tassel line);
  - `'observatory'` { name: 'Observatory', color: '#2b3f7a' }, glyph: a white half-dome with a slit (a semicircle and a
    short dark line);
  - `'windfarm'` { name: 'Pinwheel Ridge', color: '#e0a21b' }, glyph: a four-vane pinwheel (four small white triangles
    round the centre).
  The existing kind 'airfield' is reused for Rootwell Field. Handle the new kinds everywhere 'icefish' is handled.
- `src/mapPois.ts` `placeBlips()`: four rows after the E28 block (import the constants from `./campus/types`):
  `at('campus', CAMPUS.quadCentre.x, CAMPUS.quadCentre.z, 'Rootwell University')`,
  `at('observatory', OBSERVATORY.dome.x, OBSERVATORY.dome.z, 'The Anthill Observatory')`,
  `at('airfield', ROOTWELL_FIELD.runway.x, ROOTWELL_FIELD.runway.z, 'Rootwell Field')`,
  `at('windfarm', 850, -1200, 'Pinwheel Ridge')`.
- `src/mapIcons.test.ts`: only if it lists kinds explicitly, add the three.

## Contract
Place kinds `'campus' | 'observatory' | 'windfarm'` (other code may draw them later).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/mapIcons.test.ts src/bigMapView.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `mapIcons.ts` or `mapPois.ts`.

## Out of scope
Every other file (`hud.ts` and `surfaces.ts` are another worker's).
