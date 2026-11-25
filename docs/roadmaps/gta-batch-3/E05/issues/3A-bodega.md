Epic: E05-2 Interiors and rooftops (showcase interiors run in the same wave)
Depends on: none (codes against the InteriorKit interface)
Also read and follow: `docs/roadmaps/gta-batch-3/E05/issues/3-showcase-common.md` (environment, rules, done-when).

## Goal
Bodega & Sons is a furnished walk-in corner shop: `games/gnome-theft-auto/src/interiors/showcase/bodega.ts`.

## Read first
- `games/gnome-theft-auto/src/interiors/types.ts` (InteriorKit, InteriorDef incl. `ambience`).
- `games/gnome-theft-auto/src/interiors/showcase/bodega.ts` (the stub: keep id, name, door, exit, size, theme).
- `docs/lore/entries/apocrypha/bodega-and-sons.md` and `docs/lore/entries/apocrypha/john-bodega.md`, `asphalt-the-cat.md`.

## Change
`games/gnome-theft-auto/src/interiors/showcase/bodega.ts`: keep the def's fields; add `ambience: 'city'`; write
`build(kit)`. Room 12 x 10 x 3.6 (x -6..6, z -5..5), door on the east wall `kit.door(5.8, 0, -Math.PI / 2)` (keep).
Layout (adjust by up to 0.5 m if things collide, keep the walkway):
- `kit.room()`; a doormat `put('rug', 4.6, 0, Math.PI / 2, { solid: false, size: 1.6, tint: 0x6b8e23 })`.
- Counter along the north side: `kit.block(5, 1.0, 1.0, -1, -3, { color: 0x6d4c41 })`. On it (y 1.0, solid false):
  `gsr-barcode-register` at (-2.2, -3) size 0.6; `asphalt-cat` asleep at (0.6, -3) yaw 0.6 size 0.7 (vignette 1:
  the whole shop tiptoes round the cat); a small sign on the counter front facing south at (0.6, 0.7, -2.45):
  "SHH. CAT ASLEEP." (w 0.9, h 0.3).
- John Bodega behind the counter: `kit.npc({ id: 'john', name: 'John Bodega', x: -1, z: -4.2, yaw: 0, look: { hat: 0x7c4a2d, shirt: 0x3b7a57, beard: 0x8b5a2b }, line: 'Keep your voice down. If Asphalt wakes up, prices go up.' })`.
- Counter bell spot at (-1, -2.2): prompt 'Ring the counter bell'; run() says (name 'John Bodega') one of three lines in
  turn: 'We are open. We are always open. We lost the key in the first week.', 'Cola is lukewarm. That is not a fault, that is the house style.', 'Spark plugs are behind the pickled clover. Do not ask why.'
- Big sign on the north wall above the counter: "BODEGA & SONS\n(NO SONS, JUST JOHN)\nCASH OR ACORNS." at (-1, 2.6, -4.95) yaw 0, w 3, h 1.
- West wall: `gta-vending-cola` at (-5.3, -3.8) and `gta-vending-fizz` at (-5.3, -2.3), both yaw `Math.PI / 2`;
  two `bookshelf` as shop shelving at (-5.4, 1.2) and (-5.4, 3.4) yaw `Math.PI / 2`, tint 0xa1887f.
- Vignette 2, the Acorn-Cola tower that fell: three `crate` stacked by the south-east corner at (3.6, 3.9) (the second
  and third with `y` = the first crate's height, read from the returned object's bounding box via
  `new THREE.Box3().setFromObject(obj)`), one more `crate` on its side on the floor at (2.6, 3.3) yaw 0.7, and five
  `gta-can-cola` (solid false) scattered on the floor between (1.6..3.2, 2.0..3.4); a hand sign on the south wall at
  (3.0, 1.6, 4.95) yaw `Math.PI`: "ACORN-COLA\nLUKEWARM AS ADVERTISED" (w 1.4, h 0.6, bg 0xc62828).
- Vignette 3, Mossley's abandoned grid survey: `side-table` at (2.4, -1.2); on it (y = table top, solid false)
  `folded-map` and `tall-one-pencil`; a `stool` at (3.2, -1.2) pushed back at yaw 1.2; a poster on the east wall at
  (5.95, 1.8, -2.6) yaw `-Math.PI / 2`: "GRID SURVEY, DAY 412:\nSTREET STILL STRAIGHT." (w 1.4, h 0.6, bg 0xf5f0e1, fg 0x263238).
- Vignette 4, the watering-can spout as umbrella stand: a `barrel` by the door at (5.0, 3.6) and a sign above it
  at (5.95, 1.6, 3.6) yaw `-Math.PI / 2`: "SPOUT (ORIGINAL)\nUMBRELLAS ONLY" (w 1.0, h 0.5).
- Window on the east wall: `kit.window(5.95, -3, -Math.PI / 2, 1.6, 1.0, 1.2)` and a neon-style sign just inside it
  at (5.9, 2.5, -3) yaw `-Math.PI / 2`: "OPEN 24 HRS" (w 1.2, h 0.35, bg 0x1a0d14, fg 0xff4fa3).
- `lamp` on the counter at (-3.2, -3) y 1.0 solid false.

## Contract
Interior id `bodega` (exported `BODEGA_INTERIOR`), door (-79.5, 92), exit (-78, 92). Do not change them.

## Out of scope
Every other file.
