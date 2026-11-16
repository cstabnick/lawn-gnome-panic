Epic: 3, Thatchford Downs and the Calling
Depends on: none

## Goal
Thatchford Downs is a real zone map: a market town at a ford on the Hose, soggy downs with sprinkler heads, a hill, a compost heap and a neat little chapel.

## Read first
- `docs/design/gnomomia/places-and-people.md` §2 (Thatchford Downs); `world-map.md` (Thatchford row)
- `games/gnomes-of-gnomomia/src/data/README.md`, the zone layouts table (thatchford row); `src/data/zones/mossbottom.ts` (an example `ZoneDef`)

## Change
`src/data/zones/thatchford.ts`, `export const ZONE: ZoneDef`:
- `name: 'Thatchford Downs'`, `levels: [6, 11]`, `half: 120`, shrine `{ x: 0, z: 0, name: 'the Thatchford fountain' }`.
- Regions, lakes (the Hose) and exits **exactly** as in the layouts table.
- Houses: about 22 `thatch`-style houses around `thatchford-town` (both banks, leaving the ford at z≈0 and a market square within 8 m of the shrine clear), plus one larger `thatch` (r 5) for the Tipsy Toadstool at `tipsy-toadstool`, one `stone` (r 5) guildhall at `guildhall`, one `log` (r 4) mill at `mill`, and one `pot` (r 4) chapel at `neat-chapel`.
- `theme`: ground `0x7fa553`, groundAlt `0x96b866`, flora `'grass'`, floraDensity 0.5, fog `0xcfe3c0`, sky `0xbfdcf0`, hilliness 1.2 (rolling downs).

## Contract
`ZoneDef` from config.ts. The region ids are used by other packs, so keep them exactly.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/zones/thatchford.ts.

## Out of scope
Every pack file.
