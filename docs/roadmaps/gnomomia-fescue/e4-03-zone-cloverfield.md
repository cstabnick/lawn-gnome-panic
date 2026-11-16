Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
Cloverfield is a real zone: the flattest land in Fescue, with the farm town of Sodbury, ranches, anthills, a scarecrow on a rise and the crow's fallen fence post.

## Read first
- `docs/design/gnomomia/places-and-people.md` §4; `world-map.md` (Cloverfield row)
- `games/gnomes-of-gnomomia/src/data/README.md`, the zone layouts table (cloverfield row)

## Change
`src/data/zones/cloverfield.ts`, `export const ZONE: ZoneDef`:
- `name: 'Cloverfield'`, `levels: [11, 16]`, `half: 130`, shrine `{ x: 0, z: 0, name: 'the Sodbury pump' }`. Regions, lake and exit **exactly** as in the layouts table.
- **Houses:**
  - Sodbury: 14 `thatch` houses round `sodbury`, plus a tall `pot` (r 5) granary at `granary`.
  - Farmhouses: 4 `log` at `honeydew-ranch`, 3 `log` at `pettigrew-ranch`, 2 `tent` at `snail-pens`.
- `theme`: ground `0x8fb85a`, groundAlt `0xa6c86e`, flora `'clover'`, floraDensity 0.7, fog `0xe8eccf`, sky `0xcfe6f5`, **hilliness 0.15** (it's flat because the Mower flattened it).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/zones/cloverfield.ts.

## Out of scope
Pack files.
