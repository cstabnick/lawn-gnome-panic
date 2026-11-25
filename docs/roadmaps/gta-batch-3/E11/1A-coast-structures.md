Epic: 1 Foundation (prefabs, physics, lore, water)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Then read `docs/roadmaps/prefab-library/_common.md` for the prefab
rules, **except its "Environment" section** (the working directory there is wrong: use the one in `_env.md`).
Three other workers edit `gta-coast-kit.ts`, `gta-coast-gear.ts` and game files at the same time.

## Goal
`packages/prefabs/src/catalog/gta-coast.ts` gains six structures for Saltbucket Shore: the Spokewheel's wheel and stand,
the Bathtub Queen, a ship's cannon, an anchor and a floating wake ramp.

## Read first
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, the shapes and what `d` means for each.
- `packages/prefabs/src/palette.ts`: colour names.
- `packages/prefabs/src/catalog/gta-coast.ts`: the file you extend; it already holds `water-skis` and `spokewheel-gondola`
  (keep both unchanged, append after them). Copy their style and examine voice.
- `packages/prefabs/src/catalog/gta-jobs.ts`: `tube-rack` and `tow-buoy` (similar small coast props).

## Change
`packages/prefabs/src/catalog/gta-coast.ts`: append these `PrefabDef`s to `GTA_COAST` (category `'prop'`, uses
`['place']`, tags include `'gta'`, `'saltbucket'` and the nouns below, `emoji: []`, 5 examine lines). The game scales
them up, so **the numbers below are contracts**: keep the named points exactly where they are written.

1. `spokewheel-wheel` "Spokewheel Wheel": a giant bicycle wheel standing upright, the wheel plane is x-y (it faces +z).
   - Rim: `ring` radius 1.25, tube 0.05, `at: [0, 1.3, 0]` (no `rot`: a ring faces +z already), colour `'iron'` or a
     silver number. A thin dark tyre ring just outside it (radius 1.3, tube 0.04, same centre).
   - Hub: a short cylinder lying along z (`rot: [90, 0, 0]`), radius 0.09, length 0.25, centre `[0, 1.3, 0]`.
   - 12 spokes: thin boxes `d: [0.02, 1.2, 0.02]`, each centred at the midpoint between hub and rim
     (`at: [sin(a) * 0.62, 1.3 + cos(a) * 0.62, 0]`) and rotated `rot: [0, 0, -a in degrees]` for a = 0, 30, ..., 330
     degrees. Write the 12 numbers out (no code loops in the catalog).
   - A few red and white pennant boxes on the rim are welcome (stay under 40 parts in total).
   - The lowest point is the tyre bottom at y = 1.3 - 1.34 = -0.04: shift every part up by 0.04 so the lowest point is 0,
     i.e. **the hub centre is at y 1.34**. Write that in `about`: "hub centre at (0, 1.34, 0), rim radius 1.25".
2. `spokewheel-stand` "Spokewheel Stand": the frame that holds the wheel, same scale.
   - The axle point is `(0, 1.34 + 0.12, 0)` = **y 1.46** (the wheel hangs 0.12 above the stand's ground so its gondolas
     clear the platform). Put a short axle cylinder lying along z at `[0, 1.46, 0]`, length 0.9 (from z -0.45 to 0.45).
   - Two A-frames, one at z = 0.4 and one at z = -0.4: each two legs (boxes `d: [0.06, ~1.6, 0.06]`) from the ground
     at x = -0.85 and x = 0.85 up to the axle end, rotated in z so their tops meet at (0, 1.46). Feet stand on y 0.
   - A boarding platform: box `d: [0.7, 0.05, 0.6]` at `[0, 0.025, 0.55]` with a two-post rail at its front, painted
     `'wood'`.
   - A little sign box above the platform reading nothing (a coloured board), colour red with a white stripe.
   - `about`: "axle at (0, 1.46, 0); the wheel prefab's hub goes there; platform in front at +z".
3. `bathtub-queen` "The Bathtub Queen": a Tall-One bath-toy pirate ship (bright, shiny plastic look), **bow at +z**.
   - Hull: length 3.0 along z (z -1.5..1.5), beam 1.0 (x -0.5..0.5), from y 0 to the **deck top at y 0.4**. Build it from a
     main box `d: [1.0, 0.4, 2.4]` at `[0, 0.2, -0.1]`, a narrower bow box towards z 1.5 (e.g. `d: [0.7, 0.35, 0.5]`,
     rotated a little), colour a bright toy red (0xd8342c); a yellow trim strip along each side just under the deck.
   - Deck: a thin box `d: [0.9, 0.02, 2.6]` with its top at y 0.4 exactly (`at: [0, 0.39, -0.05]`), colour `'wood'`.
   - Stern castle (the captain's cabin) at the -z end: box `d: [0.9, 0.35, 0.6]` sitting on the deck (`at: [0, 0.575, -1.15]`),
     with two round window balls on its +z face; a little rail on its roof.
   - Two masts (cylinders radius 0.03): main mast at z 0.2 up to y ~2.5, fore mast at z 0.9 up to y ~2.0. Square sails:
     white boxes `d: [0.8, 0.5, 0.02]` on each mast, one with a black skull-ish blob (two white ball eyes on a black disc
     is enough). A small black flag box on top of the main mast.
   - A big yellow rubber-ish figurehead ball at the bow (z ~1.5, y ~0.35), the joke being it looks like a duck's head.
   - Rails: thin continuous boxes along both deck edges, 0.08 tall above the deck (the game adds its own gangplank).
   - `about`: "bow +z, deck top at y 0.4, hull 3.0 long x 1.0 beam; cabin at -z".
4. `ship-cannon` "Ship's Cannon": a black barrel (cylinder radius 0.06, length 0.5 along z, `rot: [90, 0, 0]`) on a
   wooden carriage (box) with four small wheels (cylinders along x). Muzzle at +z. Height about 0.3.
5. `ship-anchor` "Anchor": an iron anchor standing upright about 0.8 tall: shank (box), ring on top (ring), two curved
   flukes at the bottom (boxes rotated), a cross stock near the top. Colour `'iron-dark'`, with a rope ring around the shank.
6. `wake-ramp` "Wake Ramp": a floating jump for skiers. Two pontoon cylinders lying along z (radius 0.1, length 1.2) at
   x -0.3 and 0.3, y 0.1; on them a ramp board box `d: [0.8, 0.03, 1.2]` tilted to rise towards +z by about 14 degrees
   (its low end at y ~0.2, high end at y ~0.5), painted with a white and orange chevron (two thin boxes on top).
   `about`: "rises towards +z; 1.2 long, 0.8 wide; the game scales it by 5".

## Contract
Prefab ids exactly: `spokewheel-wheel`, `spokewheel-stand`, `bathtub-queen`, `ship-cannon`, `ship-anchor`, `wake-ramp`.
The named points (wheel hub y 1.34 / rim radius 1.25, stand axle y 1.46, ship deck top y 0.4 and length 3.0 along z, ramp
rising to +z) are read by game code.

## Done when
- `cd packages/prefabs && npx tsc --noEmit -p .` has no errors in `gta-coast.ts`.
- `cd packages/prefabs && npx vitest run -t "spokewheel|bathtub|ship-cannon|ship-anchor|wake-ramp|water-skis"` passes
  (ground, size, palette, examine rules).

## Out of scope
Every other catalog file, `catalog/index.ts` (already registers `GTA_COAST`), anything under `games/`.
