Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/gnome-town/_env.md` first: environment and shared rules.)

## Goal
`games/gnome-town/src/maps.ts` holds the four maps of Gnome Town as plain data, plus a test that checks them.

## Read first
- `games/gnome-town/src/config.ts`: `MapDef`, `BuildingDef`, `PortalDef`, `SpotDef`, `SignDef`, `PropDef`, `Rect`, `GAME_LINKS` / `GameKey`, `WALK`.
- `games/gnome-town/src/maps.ts`: the stub you replace.

## Change
- `games/gnome-town/src/maps.ts`: `export const MAPS: Record<MapId, MapDef>` with the four maps below. Pure data, imports only types from `./config`.
- `games/gnome-town/src/maps.test.ts` (new, vitest): the checks under "Done when".

### Units and rules
- 1 unit = about one gnome's height. Map bounds: x in [-w/2, w/2], z in [-d/2, d/2]. +z is toward the camera (the
  "front"/bottom of the screen), -z is the back. Buildings' doors are on their +z face, at z = building.z + d/2.
- A gnome stands anywhere at least 0.35 from a building or blocker rect and at least 0.8 inside the bounds.
- Every portal and spot centre must be such a standable point (not inside a building/blocker expanded by 0.35, and
  at least 0.8 inside the bounds).
- A portal's (spawnX, spawnZ) is in the destination map, standable, and at least r + 0.5 away from every portal of the
  destination map (so arriving never re-triggers a portal).
- Every building `link` is the id of a portal or spot on the same map. Ids are unique within a map.
- Each prop that stands for a spot (an arcade cabinet, a table) has its (x, z) within that spot's r - 0.2.
- Give props that a gnome should not walk through (tables, counters, fountain, tents, sheds, cabinets, water) a
  matching `blockers` rect. Small props (lamps, flowers, stools) need none.
- Prefab ids and their sizes at scale 1 (width x height x depth): slot-machine-classic 0.70x1.36x0.59,
  slot-machine-deluxe 0.73x1.48x0.63, slot-machine-mushroom 0.74x1.29x0.76, bar-counter 2.12x1.27x0.69, bar-stool
  0.42x0.73x0.44, cocktail-table 0.68x0.94x0.68, neon-sign 1.10x0.65x0.12, arcade-cabinet 0.64x1.46x0.68,
  vending-machine 0.84x1.54x0.63, stone-fountain 2.50x1.48x2.50, bench 1.20x0.50x0.40, lamp 0.32x1.14x0.32,
  mushroom-lamp 0.51x1.08x0.51, broadleaf-tree 0.60x0.75x0.60 (scale it 3-4), island-oak 2.40x2.30x2.20, cone-pine
  1.22x2.40x1.28, round-bush 1.63x1.23x1.28, flowering-bush 0.97x0.48x0.88, signpost 0.62x1.00x0.12, picket-fence
  1.00x0.72x0.04, hq-tent 2.97x1.25x2.97, team-banner 0.56x2.17x0.07, golf-flagstick 0.93x2.60x0.06, tee-marker
  0.50x0.50x0.50, gnome-statue 0.34x0.86x0.34, birdbath 0.76x0.74x0.76, market-stall 1.10x1.47x0.60, rug 2.20x0.04x1.50,
  plant 0.55x0.68x0.45, garden-shed 2.10x1.20x1.74, lawn-flamingo 0.18x0.69x0.38, barrel 0.64x0.90x0.64, crate
  0.62x0.60x0.62, flower-pot 0.20x0.33x0.20, toadstool-seat 0.42x0.41x0.44, mailbox 0.23x0.78x0.32, golf-cart
  1.60x2.09x2.30, hay-bale 0.50x0.36x0.36, painting 0.90x0.70x0.14, counter 2.10x0.98x0.80. Also `blackjack-table`
  (being added right now by another worker): about 2.6 wide x 0.95 high x 1.5 deep, dealer side at -z, players at +z.
  Use no other prefab ids. A prop with `rot` turns its front: rot 0 faces +z, Math.PI / 2 faces +x, -Math.PI / 2 faces -x.
- Colours are 0xRRGGBB numbers.

### The maps (positions given are binding; add decoration freely around them)

**town** (Town Square): w 44, d 32, ground 0x7fb45a, indoor false, spawn (0, 6).
- Buildings along the back, fronts facing +z:
  - `gnomecino`: x -12, z -10, w 10, d 7, h 5, color 0x4a2a6a, roof 0xd4af37, neon true, label 'GNOMECINO', link 'door-gnomecino'.
  - `arcade`: x 2, z -10, w 8, d 6, h 4, color 0x2f64c9, roof 0x23234a, label 'ARCADE', link 'door-arcade'.
  - `bowling`: x 14, z -10, w 8, d 6, h 4, color 0xc0392b, roof 0xf4f4f4, label 'BOWLING', link 'spot-bowling'.
  - `music-hall`: x -17, z 4, w 6, d 6, h 4, color 0xe0a84a, roof 0x6b4a2e, label 'MUSIC HALL', link 'spot-music'.
- Portals: `door-gnomecino` (-12, -5.9) r 1.0 to gnomecino spawn (0, 6.2); `door-arcade` (2, -6.4) r 1.0 to arcade spawn
  (0, 4.4); `path-park` (20.8, 0) r 1.4 label 'To Links Park' to park spawn (-18.5, 0). Labels: 'Enter the Gnomecino', 'Enter the Arcade'.
- Spots: `spot-bowling` (14, -6.2) r 1.6 game 'bowling' label 'Bowl at the Alley'; `spot-music` (-17, 7.6) r 1.6 game
  'music' label 'Jam in the Music Hall'; `spot-party` (15, 7.4) r 1.8 game 'party' label 'Join a Gnome Party' (an
  `hq-tent` prop scale 1.4 at (15, 4.6) is the party pavilion, with a blocker); `spot-creator` (-6, 9) r 1.6 game
  'creator' label 'Change your look' (a `gnome-statue` prop scale 2.5 at (-6, 8.2), and a sign 'GNOME CREATOR').
- The fountain: `stone-fountain` scale 1.4 at (0, 0) with blocker (0, 0, 3.6, 3.6).
- Patches: a stone plaza 0xc8b48a about 18 x 12 around the fountain, paths of the same colour to each door and to the
  east edge.
- Signs: 'Links Park →' near (19, -2.5); a welcome board 'GNOME TOWN' near (-4, 3).
- Decoration: benches around the plaza, lamps (scale 1.5) along the paths, trees and bushes along the edges, flowers, a mailbox, lawn flamingos.

**gnomecino** (casino interior): w 24, d 18, ground 0x6a1a2a, indoor true, wallColor 0x3a1a4a, spawn (0, 6.2).
- Portal `exit` (0, 8.0) r 1.0 label 'Back outside' to town spawn (-12, -4.3).
- Two `blackjack-table` props at (-5, -1.5) and (5, -1.5), each with a blocker (x, -1.5, 3.0, 1.8).
- Spots: `table-1` (-5, 0.4) r 2.2 game 'blackjack' label 'Play Blackjack'; `table-2` (5, 0.4) r 2.2 game 'blackjackHigh'
  label 'Play Blackjack: High Rollers'.
- A row of slot machines along the back wall (z about -7.6, x from -10 to -3, mix the three kinds) with one blocker
  rect for the row; spot `slots` (-6.5, -5.8) r 2.0 game 'blackjack' label 'Play slots & blackjack'.
- A bar along the right wall: two `bar-counter` props rotated -Math.PI / 2 at x 10.6, z -3 and -0.8, a blocker for
  them, bar stools at x 9.6. Cocktail tables with stools in the front corners.
- Wall signs (y 2.6): 'GNOMECINO' on the back wall (0, -8.9), 'HIGH ROLLERS' above table 2 (5, -8.9),
  'Dealer stands on 17' (-5, -8.9). neon-sign props on the back wall are fine too.

**arcade** (interior): w 20, d 14, ground 0x23234a, indoor true, wallColor 0x15152e, spawn (0, 4.4).
- Portal `exit` (0, 6.0) r 1.0 label 'Back outside' to town spawn (2, -4.8).
- Six `arcade-cabinet` props along the back wall at z -5.6, x = -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, one blocker rect
  (0, -5.6, 17, 0.9) for the row. Spots at (x, -4.5) r 1.4 with ids `cab-<game key>` for game keys in this order:
  prix 'Race in Lawn Prix', chain 'Play Mower Chain', panic 'Play Lawn Gnome Panic', sweet 'Play Gnome Sweet Gnome',
  ftl 'Play Faster Than Lawn', aether 'Ride Aether Board'. A wall sign (y 2.5, z -6.9) over each cabinet with its game's
  title (from GAME_LINKS titles).
- Vending machines and plants along the side walls.

**park** (Links Park): w 44, d 32, ground 0x6fae4a, indoor false, spawn (-18.5, 0).
- Portal `path-town` (-20.8, 0) r 1.4 label 'To Town Square' to town spawn (18.8, 0).
- Golf: a green patch 0x4c9a3a about 9 x 6 at (6, -8), `golf-flagstick` at (8.5, -9), two `tee-marker`s near (2, -7),
  a `golf-cart` at (-1.5, -9) with a blocker. Spot `golf` (3.6, -6.6) r 1.8 game 'golf' label 'Tee off (Gnome Golf)'.
- Dock: a water patch 0x3d7fc4 at (14, -13.5) w 16 d 5 with the same blocker rect; a plank patch 0x8b6a40 at
  (12, -9.6) w 2 d 3. Spot `gnaft` (12, -9.2) r 1.6 game 'gnaft' label 'Board the raft (Gnaft)'.
- Front camp: `hq-tent` at (-6, 8.5) with a blocker, team-banners, crates. Spot `front` (-6, 11.3) r 1.8 game 'front'
  label 'Join the battle (Gnome Front)'.
- Kennel: `garden-shed` scale 1.5 at (8, 8) with a blocker. Spot `pup` (8, 10.4) r 1.6 game 'pup' label 'Visit the Giant Pup'.
- The Fence: a row of `picket-fence` props near the south-east corner and a `signpost`; spot `gnomomia` (17, 10.5)
  r 1.6 game 'gnomomia' label 'Through the Fence (Gnomes of Gnomomia)'.
- Signs naming each place ('LINKS PARK', 'DOCK', 'THE FRONT', 'KENNEL', '← Town Square'). Trees around the edges.

## Contract
`export const MAPS: Record<MapId, MapDef>` (exactly this name and type). Ids above are binding (main.ts and other
code look them up).

## Done when
- `npx tsc --noEmit -p games/gnome-town` shows no error in `maps.ts` or `maps.test.ts`.
- `npm test -w games/gnome-town -- src/maps.test.ts` passes, and the test checks: every map's `id` matches its key;
  ids unique per map; every building link exists; every portal/spot centre is standable (write your own small
  rect-expanded-by-0.35 + bounds check inside the test; do not import `walk.ts`, another worker owns it); every portal
  spawn is standable in the destination and at least r + 0.5 from the destination's portals; every map `spawn` is
  standable; every spot's `game` is a key of `GAME_LINKS`; every prop's prefab exists (`getPrefab` from `@lawn/prefabs`
  returns a def) **except `blackjack-table`**, which another worker is adding right now.

## Out of scope
Every other file. Do not edit `config.ts`, `main.ts`, `walk.ts`, `world.ts` or `packages/`.
