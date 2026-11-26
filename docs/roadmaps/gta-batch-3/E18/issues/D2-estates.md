Epic: E18-B (world-change dressing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` and `D-dressing-common.md` (same folder) first: they hold the API,
the prefab and placement rules and the test you add.

## Goal
Build the props for world changes W02, W18, W05 in `games/gnome-theft-auto/src/worldChanges/rows/estates.ts` (currently a
stub registering empty groups), following `docs/design/gnome-theft-auto/world-changes.md` rows W02, W18, W05.

## Change (only `src/worldChanges/rows/estates.ts` and the new `src/worldChanges/rows/estates.test.ts`)
- W02 (hoardings): pale-blue Levelright hoardings ('site-hoarding', 'site-hoarding-gate') round each of E01 sites
  'construction-1..3' (`src/sites.ts`; E16's `src/country/` builds sites there: read it first and do not duplicate
  hoardings that are already always on; if E16 already fences them, make W02 add the signs, a crane over one site
  ('bucket-crane' or 'site-tower-crane') and one clipboard worker per gate), signs "THORNE EVEN-ESTATES: A HEIGHT FOR
  EVERYONE". Keep the sites' night-watch spawn points clear.
- W18 (show-homes): three identical beige flat-roofed show-homes behind the boards with a neat lawn each (grep prefabs
  for a small house/bungalow; E16's site prefabs in `packages/prefabs/src/catalog/gta-country-site.ts`). These stay
  after the finale (W17 hides only W02).
- W05 (the Double Pot tops out): at the Double Pot (downtown mega block around (90,-90)+(150,-90), road x=120 tunnel;
  grep 'double-pot' / 'Double Pot' in src) a long vertical banner "EVEN IS BETTER" down its face (a tall `coastSign`),
  rows of lit windows (emissive panes, night) on the sales floor, and a beige-vested valet with a "THORNE RESIDENTS"
  sign at the Patio Gate (grep 'patio-gate'). If a crane prop stands on the Double Pot as a separate named object, hide
  it (see common rules); else skip the crane. Keep the tunnel and rooftop clear.

## Done when
- See `D-dressing-common.md`: tsc clean for your file, `npx vitest run src/worldChanges` passes, report coordinates.
