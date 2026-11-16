Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Hedgewood is a real zone: dark hedge forest with a lumber camp, a hunters' lodge, the Wildlings' tangle around the Elder Privet, spider tunnels and a paper wasp tower.

## Read first
- `docs/design/gnomomia/places-and-people.md` §5; `world-map.md` (Hedgewood row)
- `games/gnomes-of-gnomomia/src/data/README.md`, the zone layouts table (hedgewood row)

## Change
`src/data/zones/hedgewood.ts`, `export const ZONE: ZoneDef`:
- `name: 'Hedgewood'`, `levels: [15, 20]`, `half: 120`, shrine `{ x: 40, z: 40, name: 'the Clippings sawpit' }`. Regions and exits **exactly** as in the layouts table.
- **Houses:**
  - 10 `log` cabins at `clippings`; 3 `log` at `sawdust-mill`.
  - 4 `tent` at `barkhollow` (the hunters' lodge is in a hollow root, so add one big `log` r 6).
  - 6 `tent` at `burdocks-tangle`.
  - One tall `pot` (r 6, the paper spire) at `paper-spire`.
- `theme`: ground `0x4d6b37`, groundAlt `0x5d7d42`, flora `'hedge'`, **floraDensity 0.9**, fog `0x6f8a5a`, sky `0x9fb88f`, hilliness 0.8. The `elder-privet` region should stay clear (r 14), with roads through.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/zones/hedgewood.ts.

## Out of scope
Pack files.
