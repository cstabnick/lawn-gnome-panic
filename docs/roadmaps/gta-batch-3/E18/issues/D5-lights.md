Epic: E18-B (world-change dressing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` and `D-dressing-common.md` (same folder) first: they hold the API,
the prefab and placement rules and the test you add.

## Goal
Build the props for world changes W10, W12 in `games/gnome-theft-auto/src/worldChanges/rows/lights.ts` (currently a
stub registering empty groups), following `docs/design/gnome-theft-auto/world-changes.md` rows W10, W12.

## Change (only `src/worldChanges/rows/lights.ts` and the new `src/worldChanges/rows/lights.test.ts`)
- W10 (the lights are steady): Pinwheel Ridge's pinwheels (E13, src/campus/ or grep 'pinwheel' in src) already turn:
  if they have a speed you can read, add nothing there; instead add, at the Capwood Run start (E01 site 'rally-route' /
  E14 src/capwood/ or src/dirtCountry/), a chalked board "WINNER: LULU", and at the Woolly Sock Lodge (site 'ski-hill',
  src/winter/) a string of lights (bulb prefabs or a 'bunting-span' with emissive bulbs, on at night). For "brighter
  neon downtown": add a few emissive neon signs on the Gnomecino strip (grep 'gnomecino' for its position) whose
  intensity follows ctx.night(). Do not edit global lighting code.
- W12 (the dome is open): at the Anthill Observatory (site 'observatory-mound', (1240,140); E13 src/campus/) the dome's
  shutter: if the observatory mesh has a named shutter object, hide it while on (restore in `hide`); else put an "OPEN
  TO THE SKY. EMPTY." notice on the observatory door. On the Rootwell quad (site 'campus', (1130,-180)) about ten
  student gnomes with protest boards "THE LINE WAS NEVER LEVEL" and "KEEP OUR STARS" ('college-banner' or coastSign on
  poles). Keep Dean's Leap ramp clear.

## Done when
- See `D-dressing-common.md`: tsc clean for your file, `npx vitest run src/worldChanges` passes, report coordinates.
