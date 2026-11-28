Epic: E05-2 Interiors and rooftops (showcase interiors run in the same wave)
Depends on: none (codes against the InteriorKit interface)
Also read and follow: `docs/roadmaps/gta-batch-3/E05/issues/3-showcase-common.md` (environment, rules, done-when).

## Goal
Flat 3B, Saucer Court (the player's loaned flat) is a walk-in shell on move-in day, ready for E10 to furnish:
`games/gnome-theft-auto/src/interiors/showcase/flat3b.ts`.

## Read first
- `games/gnome-theft-auto/src/interiors/types.ts`.
- `games/gnome-theft-auto/src/interiors/showcase/flat3b.ts` (the stub: keep id, name, door, exit, size, theme).
- `docs/lore/entries/apocrypha/saucer-court.md`, `first-kiln-bank.md`, `hyssop-doormat.md`, `parsley-inkpot.md` (whichever exist under `docs/lore/entries/apocrypha/`).

## Change
`flat3b.ts`: keep the def's fields; add `ambience: 'city'`; export `FLAT_3B_FURNISH_SLOTS` (below) for E10; write `build(kit)`.
Room 12 x 10 x 3 (x -6..6, z -5..5), door on the south wall `kit.door(0, 4.8, Math.PI)` (keep). The flat is empty on
move-in: the bank lent a roof, not furniture. Layout:
- `kit.room()`; two windows on the north wall: `kit.window(-3, -4.95, 0, 1.6, 1.2, 1.0)` and `kit.window(3, -4.95, 0, 1.6, 1.2, 1.0)`.
- Vignette 1, sleeping on the floor: `bedroll` at (-3.8, -2.6) yaw `Math.PI / 2`, a single `lamp` on the floor beside it at (-2.6, -3.6) (no table).
- Vignette 2, moving day: three `crate` (moving boxes) near the east wall at (4.6, 2.8), (4.6, 1.6) and stacked on the
  first (y = its height); a `parcel-box` on the floor at (3.6, 3.4) yaw 0.4 (solid false), a `chair` facing the window at (1.5, -2.6) yaw `Math.PI`.
- Vignette 3, the bank's letters: a `crate` used as a table at (-0.5, 0.8); on it (y = top, solid false) a `ledger`
  and a `sealed-letter`; two more `sealed-letter` on the floor by the door at (-0.6, 3.9) and (0.4, 4.1) yaw 0.5 (solid false) (post piling up).
- Signage: on the west wall (-5.95, 1.6, 0) yaw `Math.PI / 2`: "PROPERTY OF THE FIRST KILN BANK.\nPLEASE DO NOT ENJOY THE WALLS." (w 2.2, h 0.6, bg 0xf5f0e1, fg 0x263238);
  a sticky note on the east wall (5.95, 1.5, -1) yaw `-Math.PI / 2`: "FLAT 3B: 1,500 ACORNS\n(PLUS FEELINGS)" (w 1.0, h 0.45, bg 0xfff176, fg 0x263238).
- The neighbour: spot `{ id: 'wall-3a', x: -5.3, z: 2.5, prompt: 'Knock on the wall (flat 3A)', run }` that says, in
  turn (name 'Hyssop Doormat (through the wall)'): 'Wipe your feet. I can hear when you do not wipe your feet.',
  'Welcome to Saucer Court. Nobody sweeps the courtyard. That is a tradition now.', 'If you are the bank, I paid. If you are not the bank, I also paid.'
  (Only if `docs/lore/entries/apocrypha/hyssop-doormat.md` exists; otherwise name it 'Flat 3A (through the wall)'.)
- No resident inside (it is the player's flat).
- `export const FLAT_3B_FURNISH_SLOTS: readonly { id: string; x: number; z: number; yaw: number }[]` = six free floor
  spots E10 may fill: bed (-3.8, -2.6, π/2), sofa (2.5, 0.5, -π/2), table (-1, 1.5, 0), wardrobe (-5.3, -0.8, π/2),
  shelf (5.3, -2.5, -π/2), rug (0, -0.5, 0). Add a comment that E10 replaces the bedroll and crates.

## Contract
Interior id `flat-3b` (exported `FLAT_3B_INTERIOR`), door (30, 112.6); `FLAT_3B_FURNISH_SLOTS` (local coordinates).

## Out of scope
Every other file. Locking the flat behind the loan is E10's.
