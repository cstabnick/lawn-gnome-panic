Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
The Rockery is a real zone: rock-garden mountains with the mining town of Flintdelve, the Spigot, the marble pits, the Shard Mine, the mole tunnels and the ancient Kiln.

## Read first
- `docs/design/gnomomia/places-and-people.md` §6; `world-map.md` (Rockery row)
- `games/gnomes-of-gnomomia/src/data/README.md`, the zone layouts table (rockery row)

## Change
`src/data/zones/rockery.ts`, `export const ZONE: ZoneDef`:
- `name: 'The Rockery'`, `levels: [19, 24]`, `half: 120`, shrine `{ x: 0, z: 20, name: 'the Flintdelve forge' }`. Regions and exits **exactly** as in the layouts table.
- **Lake:** the Spigot's pool at (-90,-45,10).
- **Houses:** 14 `stone` houses at `flintdelve`; 2 `stone` at `shard-mine` (minehead); one big `stone` (r 9) Kiln dome at `kiln`; 1 `log` at `raft-dock`.
- `theme`: ground `0x8a8478`, groundAlt `0x9c9488`, flora `'rock'`, floraDensity 0.8, fog `0xbab3a6`, sky `0xc9d3dc`, **hilliness 2.5** (mountains).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/zones/rockery.ts.

## Out of scope
Pack files.
