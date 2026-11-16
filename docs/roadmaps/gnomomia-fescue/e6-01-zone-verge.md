Epic: 6, The Verge and the Battle of the Verge
Depends on: none

## Goal
The Verge is a real zone: a windswept strip of mown stubble by the Fence, with the war camp at Last Tuft, the Even Cut's square fort, the King's cart, the battlefield and the Shed.

## Read first
- `docs/design/gnomomia/places-and-people.md` §7; `world-map.md` (Verge row); `fescue-map.svg` (the Shed in the north)
- `games/gnomes-of-gnomomia/src/data/README.md`, the zone layouts table (verge row)

## Change
`src/data/zones/verge.ts`, `export const ZONE: ZoneDef`:
- `name: 'The Verge'`, `levels: [25, 30]`, `half: 140`, shrine `{ x: 0, z: 80, name: 'the Last Tuft banner' }`. Regions and exits **exactly** as in the layouts table.
- **Walls:** the Fence along z = -138 (x -140..140); the Level, a square of 4 walls around (60,0), side 36, with a 6 m gap on its south side.
- **Houses:**
  - 8 `tent` at `last-tuft`.
  - The Shed: one huge `log` house (r 14) at `the-shed` (0,-125).
  - 4 `stone` houses inside the Level.
- `theme`: ground `0xb8a868`, groundAlt `0xc9b97a`, flora `'stubble'`, floraDensity 0.6, fog `0xd8cfa8`, sky `0xbfc7cf`, hilliness 0.2. The `last-tuft` region keeps tall grass: it's the last uncut tuft. world.ts uses one flora per zone, so add 4 `thatch` houses of r 2 there as grass clumps.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/zones/verge.ts.

## Out of scope
Pack files, mower.ts.
