Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
Birdbath Keep is a real zone: the castle cut into the birdbath pedestal, the Basin lake behind it, Pedestal Ward town below, and the stairs down to the Drainpipe Deeps.

## Read first
- `docs/design/gnomomia/places-and-people.md` §3 (layout and services)
- `games/gnomes-of-gnomomia/src/data/README.md`, the zone layouts table (keep row); `src/data/zones/mossbottom.ts` (an example `ZoneDef`)

## Change
`src/data/zones/keep.ts`, `export const ZONE: ZoneDef`:
- `name: 'Birdbath Keep'`, `levels: [10, 14]`, `half: 80`, shrine `{ x: 0, z: 20, name: 'the Pedestal Ward shrine' }`. Regions, lake and exits **exactly** as in the layouts table.
- **Houses:**
  - The castle: 5 `stone` houses of r 6-8 in a ring around `pedestal` (0,-30), plus one r 10 `stone` keep at (0,-30).
  - Pedestal Ward: 14 `stone`/`thatch` houses around `pedestal-ward`, keeping 8 m around the shrine clear.
  - Three `stone` guild halls at `guild-halls`.
  - A `tent` at `robin-roost`.
- `theme`: ground `0x8c9a6e`, groundAlt `0xa2a48a`, flora `'grass'`, floraDensity 0.15, fog `0xd9dccf`, sky `0xc6dcef`, hilliness 0.4.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/zones/keep.ts.

## Out of scope
Every pack file.
