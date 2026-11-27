Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adec7594cd8bfc2db` (run every command from there).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Other workers edit other files at the same time; another worker edits
`packages/prefabs/src/catalog/gta-story-gear4.ts`: do not touch it.

## Goal
Sixteen story props for Gnome Theft Auto's act IV cutscenes exist in `@lawn/prefabs`, in the (already registered,
currently empty) array `GTA_STORY_ACT4` of `packages/prefabs/src/catalog/gta-story-act4.ts`.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules (units, y = 0 ground, +z front, `at` is a shape's
  centre, `rot` in degrees, 3-15 parts, five `examine` lines in the game's dry voice). Follow it exactly. GTA props are
  drawn **life size for a gnome world where 1 unit = one gnome's height**, like the neighbouring GTA files.
- `packages/prefabs/src/types.ts` (PrefabDef, Part), `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-story-act3.ts` (the act III story props: `hoa-radio`, `blade-crate`,
  `guidance-lens`, `combine-test-deck`, ...): copy its style and examine voice exactly.

## Change
`packages/prefabs/src/catalog/gta-story-act4.ts`: add these `PrefabDef`s (ids fixed; `category: 'prop'`, `uses:
['place']` plus `'hold'` with a `grip` where marked; tags include `'gta'`). `about` starts "Gnome Theft Auto: ...".
Examine lines: no "wet", "soak", "blood", "gore" (canon R-021). The HOA's colours are black hats and beige; the Grand
Combine is beige and porcelain-white with brass; the coalition is a patchwork of every faction's cap colour (red, green,
yellow, blue, orange, purple).

| id | what (from the story) |
|---|---|
| `heist-board` | Tansy's heist board: a plank board on two trestle legs with a pinned paper map of a fort, red string between brass tacks, three photographs pinned along the top (place, about 1.4 wide) |
| `door-mortar` | a small brass mortar tube on a hinged bracket made to bolt to a plane door, a painted ratio chalked on it (place and hold) |
| `parachute-rig` | a packed parachute rig: canvas pack with straps and a ripcord handle, stencilled "ALMOST CERTAINLY" (place and hold) |
| `pump-impeller` | a brass spray-pump impeller: a finned wheel on a short shaft, a paper tag (hold) |
| `roster-wall` | a wall board of pinned guard rosters, fifteen years of paper in neat rows, one empty nail in the middle (place, wall-mounted, back flat at z = 0, about 1.2 wide and 1 tall) |
| `diggs-medal` | Commander Diggs's medal: a tin star on a faded green ribbon (hold) |
| `mole-pickaxe` | a tiny mole's pickaxe, wooden handle, bright iron head (hold) |
| `cell-bunk` | an HOA lockup bunk: a beige metal cot with a thin folded blanket and a flat pillow, a stencilled number on the frame (place) |
| `mulch-fountain-pen` | the Mulch Club fountain pen: fat black barrel, gold nib and clip (hold) |
| `first-vine-pot` | the Countess's first vine: an old gnarled vine trunk with a few leaves and one bunch of grapes, planted in a slatted crate with rope handles (place and hold, about 1 tall) |
| `shield-grate-key` | the shield grate key: a brass key as long as a gnome's arm with an ornate bow and a Brassknock crest (hold) |
| `porch-photograph` | a framed leaf-print photograph in a small wooden frame: two gnomes on a porch step, one with a top hat (hold and place) |
| `hatbrim-beacon` | a signal beacon: an iron fire basket on a tall tripod, stacked kindling, a warm `glow` at its heart (place, about 2 tall) |
| `coalition-flag` | the coalition's patchwork flag on a pole: squares of every faction's cap colour stitched together (place) |
| `hat-rail` | a long hook-rail on two posts with six different caps hung on it (a mower cap, a pointed red hat, a miner's helmet, a ranger hat, a racing helmet, a straw hat) (place, about 2 wide) |
| `crate-table` | a long camp table made of upturned fruit crates and planks, a cloth runner down the middle (place, about 3 long) |

## Done when
- `npm test -w packages/prefabs` passes (it checks every prefab: ground contact, part count, examine lines, grips).
- `npx tsc --noEmit -p packages/prefabs` passes.
- All sixteen ids are exported in `GTA_STORY_ACT4` (grep first: if an id already exists elsewhere, stop and report it).

## Out of scope
Every other file. Do not edit `catalog/index.ts` (already wired) or `gta-story-gear4.ts`.
Final report (<= 10 lines): ids added, part counts, test result.
