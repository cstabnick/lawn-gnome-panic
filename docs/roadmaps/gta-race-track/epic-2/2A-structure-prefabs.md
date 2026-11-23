Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first (working directory, node, rules, no commits). Also read
`docs/roadmaps/prefab-library/_common.md` for the prefab format rules, EXCEPT: its "Environment" section (wrong
directory) and its "Examine voice" section. For examine lines use the Gnome Theft Auto voice instead: a parody crime
world; gnomes call giant human objects "Tall-One" things (a "Tall-One sneaker", "Tall-One cooler") and half
understand them; the Tall Ones are never seen. Example lines live in `packages/prefabs/src/catalog/gta-story.ts`
(`tall-one-pencil`). Do not invent new named characters; you may mention Turfton, the Dust Flats, the Great Spill (the
night this junk fell on the pan), the Lost & Found Speedway, Dandelion Fizz, Razor-Back, Buck-Iron, the Hat Watch, the
HOA.

## Goal
`packages/prefabs/src/catalog/gta-race-track.ts` holds the 13 structure prefabs of the Lost & Found Speedway, built
exactly to the sizes below (a game module places them and puts spectators on the decks, so the deck surfaces must be
where this issue says).

## Read first
- `packages/prefabs/src/types.ts` (PrefabDef, Part, shapes; `wedge` is a ramp full height at +z)
- `packages/prefabs/src/palette.ts` (colour names; or use 0xRRGGBB numbers)
- `packages/prefabs/src/catalog/gta-story.ts`, search `tall-one-pencil`: a big landmark prop with `footprint`
- `packages/prefabs/src/catalog.test.ts` lines 60-80: a prop with `footprint` may be up to 30 units on its largest side
- `packages/prefabs/src/catalog/gta-race-track.ts` (the empty export you fill)

## Change
`packages/prefabs/src/catalog/gta-race-track.ts`: fill `export const GTA_RACE_TRACK: readonly PrefabDef[]` with these
prefabs. Every one: `category: 'prop'`, `uses: ['place']`, `emoji: []`, a `footprint: { r, h }` (r = half its largest
ground side, h = its height), tags, `about`, 5 examine lines, lowest point y = 0, centred on x and z, front = +z (the
side spectators look out of / the track side). Units are metres (1 = a gnome's height). Max 40 parts each, `seg` 6-12.

1. `speedway-book-stand` "Book Stack Grandstand": three giant hardback books stacked as steps, front +z.
   - Book 1 (bottom): 24 wide (x -12..12), 3 tall (y 0..3), 16 deep (z -8..8). Cover colour 0x8b1e2b (red), page block
     visible on the +z face as a slightly inset cream box (0xf3ead2).
   - Book 2: x -12..12, y 3..6, z -8..3. Cover 0x1f4e79 (blue), cream page edge on +z.
   - Book 3: x -12..12, y 6..9, z -8..-2. Cover 0x2e6b3a (green), cream page edge on +z.
   - Gold spine bands (thin boxes) on the -z backs. A tall bookmark ribbon pole (thin box 0.3 x 6 x 0.1, tint) rising
     from the top book's back at x 10. Railings: a thin rail (0.1 tall bars) along each step's front edge, 1 unit above it.
   - DECKS (crowd stands here; keep these top surfaces clear of parts except the front rail): y 3 over z 3..8;
     y 6 over z -2..3; y 9 over z -8..-2; all x -11.5..11.5.
   - `tint` 0xffd21f (the ribbon pole). footprint { r: 12, h: 15 }.
2. `speedway-sneaker-stand` "Sneaker Grandstand": a giant Tall-One sneaker lying upright along x (toe at +x), with a
   wooden bleacher built against its +z side.
   - Sole: white box 28 long (x -14..14), 1.5 tall, 10 wide (z -5..5). Toe rounded with a flattened cyl or ball.
   - Upper: canvas colour 0xd8342c, from x -14 to 6, height 1.5..9, z -4.5..4.5; toe cap wedge or box x 6..14 up to 4.5.
     White laces (thin boxes across the top of the upper) and a dark collar opening box on top at the heel end.
   - Bleacher (timber 0xa0784a): four tiers, each 1 tall and 1.5 deep, stepping UP towards the shoe: tier tops at y 1, 2,
     3, 4 with z ranges 9.5..11, 8..9.5, 6.5..8, 5..6.5, all x -10..10 (each tier a box from y 0 to its top).
   - DECKS: those four tier tops, and the top of the upper at y 9, x -12..-2, z -3..3.
   - footprint { r: 14, h: 9.5 }.
3. `speedway-cooler-stand` "Cooler Grandstand": a giant picnic cooler box.
   - Body: box 16 wide (x -8..8), 10 tall, 10 deep (z -5..5), colour 0x2f7fd1, white stripe band around it at y 6.
   - Lid: white box 16.4 x 1.5 x 10.4 on top (y 10..11.5). Two grey handle bars on the x ends.
   - A ladder (two rails + 8 rungs, timber) leaning on the +z face at x 6.
   - DECK: lid top y 11.5, x -7.5..7.5, z -4.5..4.5. footprint { r: 8.5, h: 12 }.
4. `speedway-gantry` "Start Gantry": spans a 22 m road along x; cars drive along z under it.
   - Two pillars 1 x 9 x 1 at x -11.5 and 11.5. Beam 24 x 1.8 x 1.2 at y 8..9.8.
   - A chequered panel on both faces of the beam (alternate black/white small boxes, at least 12 squares per face).
   - Five start lamps on the +z face of the beam, evenly spaced across x -4..4 at y 7.4: a dark box housing each with a
     round red lens. Give each lens part `name: 'lamp-0'` .. `'lamp-4'`. Same five on the -z face named
     `'lamp-back-0'` .. `'lamp-back-4'`. Lenses `glow: true`, colour 0xff2a1a.
   - A banner board tint colour on top of the beam (24 x 1.2 x 0.2 at y 10.4). `tint` 0xffd21f. footprint { r: 12, h: 11 }.
5. `speedway-tyre-stack` "Tyre Stack": two stacked tyres, a barrier piece. Two black (0x1b1b1b) cyl tyres radius 0.6,
   height 0.45 each (y 0..0.45, 0.45..0.9), a `tint` painted band ring around each (radius 0.61, thin). `tint` 0xf4f4f4.
   footprint { r: 0.6, h: 0.9 }.
6. `speedway-hose-run` "Hose Barrier": a straight 10 m length of giant green garden hose lying along x: a cyl radius 0.7
   along x (rot [0,0,90]), lowest point y 0 (centre y 0.7), colour 0x3f9d3a, with 4 darker green ring bands along it.
   footprint { r: 5, h: 1.4 }.
7. `speedway-hose-arch` "Hose Loop": the giant hose rising in an arch over the track: a half hoop spanning x -12..12,
   top at y 11, tube radius 0.7, green 0x3f9d3a (use several cyl segments around a semicircle of radius 11.3 centred at
   y 0, or a ring part with arc 180 rotated so it stands upright as an arch; its lowest point must be y 0). A brass
   nozzle (cone + cyl, 0xc9a227) at one foot, lying on the ground pointing +x. footprint { r: 12.5, h: 12 }.
8. `speedway-light-tower` "Floodlight Tower": a 16 m lattice tower: four thin corner posts (0.15) on a 1.6 m square
   with cross braces, a platform at y 15, and a lamp bank facing +z: 6 boxes 0.8 x 0.6 x 0.2, `glow: true`, colour
   0xfff6d8, names `'flood-0'`..`'flood-5'`. Grey steel. footprint { r: 1.2, h: 17 }.
9. `speedway-banner` "Sponsor Board": a 6 x 2 board on two posts (board y 0.6..2.6, z 0), face `c: 'tint'`, a `trim`
   stripe along the top and bottom. `tint` 0xffd21f, `trim` 0x1d1d1d. footprint { r: 3, h: 2.7 }.
10. `speedway-pit-garage` "Pit Garage": 8 wide (x -4..4), 4.5 tall, 8 deep (z -4..4), open front (+z): back wall, two
    side walls, roof slab; a `tint` stripe across the roof front; a tool board on the back wall; a tyre rack inside.
    Walls 0.3 thick, grey 0xcfd3d6. `tint` 0xffd21f. footprint { r: 4, h: 4.6 }.
11. `speedway-podium` "Podium": three blocks side by side: centre (x -1..1) 1.5 tall, left (x -3..-1) 1.0 tall, right
    (x 1..3) 0.7 tall, all z -1..1, white with gold (centre), silver, bronze number plates on +z. footprint { r: 3, h: 1.5 }.
12. `speedway-ruler-wall` "Ruler Pit Wall": a giant Tall-One ruler standing on its long edge along x: box 30 x 1.4 x 0.5
    (x -15..15, y 0..1.4), yellow 0xf2c230, with black tick marks (thin boxes) on BOTH faces every 1 unit (longer every 5).
    footprint { r: 15, h: 1.4 }.
13. `speedway-frisbee` "Giant Frisbee": a Tall-One flying disc: a flattened cyl radius 7, height 0.8, bright 0xff5a36,
    a ring rim (radius 6.8, tube 0.35) and a lighter centre ring, lying flat (lowest point y 0). footprint { r: 7.2, h: 1.2 }.
14. `speedway-rake` "Giant Rake": a Tall-One garden rake lying flat on the ground along x: handle cyl radius 0.45 from
    x -14 to 8 (timber 0x9c6b3c), a green metal head box at x 8..9 spanning z -4..4, with 12 tines (thin boxes) pointing
    +x from the head. Lowest point y 0. footprint { r: 15, h: 1.0 }.

## Contract
The ids above, exactly. The deck heights and ranges in 1-3 and the lamp/flood part names in 4 and 8 are read by the game.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in gta-race-track.ts
- `npm test -w packages/prefabs` passes for every test naming one of your ids (other workers' new ids in
  gta-race-gear.ts may fail meanwhile; ignore those)
- You read the file top to bottom and checked every deck surface against the numbers above.

## Out of scope
Every other file. Do not edit catalog/index.ts (already registers GTA_RACE_TRACK), types.ts, palette.ts, tests.
