Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
The Drainpipe Deeps is an indoor dungeon map with three wings (Gutters, Cistern, Backflow) separated by walls. Hatches open each wing as the story reaches it.

## Read first
- `docs/design/gnomomia/places-and-people.md` §3a (the wing table)
- `games/gnomes-of-gnomomia/src/data/README.md`, the zone layouts table (deeps row: regions, walls, hatches); `src/config.ts` `ZoneDef.walls`, `indoor`

## Change
`src/data/zones/deeps.ts`, `export const ZONE: ZoneDef`:
- `name: 'The Drainpipe Deeps'`, `levels: [10, 25]`, `half: 100`, `indoor: true`, shrine `{ x: 0, z: 90, name: 'the Gutter landing' }`.
- Regions, walls and all exits and hatches **exactly** as in the layouts table (6 exits in all).
- **Lakes:** ankle water in the Gutters (0,65,8); a big cistern pool (0,8,14) leaving a 6 m walkway round it; flooded rust in the Backflow at (-20,-55,8) and (20,-55,8).
- **Houses** (pipe junction boxes): six `stone` houses of r 3 spaced along the walls.
- `theme`: ground `0x4a4438`, groundAlt `0x5a5040`, flora `'pipe'`, floraDensity 0.6, fog `0x1d1a16`, sky `0x0d0c0a`, hilliness 0.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/zones/deeps.ts.

## Out of scope
Pack files (the wing bosses live in ch3, ch5 and ch6 packs).
