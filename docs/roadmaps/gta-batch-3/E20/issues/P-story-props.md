Epic: E20-1 foundation (engine, cast, props)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da` (run every command from there).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Other workers edit other files at the same time; another worker edits
`packages/prefabs/src/catalog/gta-story-gear.ts`: do not touch it.

## Goal
Twelve story props for Gnome Theft Auto's acts I-II cutscenes exist in `@lawn/prefabs`, in the (already registered,
currently empty) array `GTA_STORY_ACT12` of `packages/prefabs/src/catalog/gta-story-act12.ts`.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules (units, y = 0 ground, +z front, `at` is a shape's
  centre, `rot` in degrees, 3-15 parts, five `examine` lines in the game's dry voice). Follow it exactly. Note GTA props
  are drawn **life size for a gnome world where 1 unit = one gnome's height**, like the neighbouring GTA files.
- `packages/prefabs/src/types.ts` (PrefabDef, Part), `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-story-props.ts` (existing story props: `asphalt-cat`, `cigar-box`, `wrench-rack`):
  copy its style and examine voice.

## Change
`packages/prefabs/src/catalog/gta-story-act12.ts`: add these `PrefabDef`s (ids fixed; `category: 'prop'`, `uses:
['place']` plus `'hold'` with a `grip` where marked; tags include `'gta'`). `about` starts "Gnome Theft Auto: ...".

| id | what (from the story) |
|---|---|
| `radio-jammer` | a hand-built radio jammer: tin box, two antennas, a dial, scrap wires, one glowing bulb (hold) |
| `citation-slip` | Hogweed's "unauthorised verticality" HOA citation: a pink ticket on a clipboard-sized board, a stamp |
| `framed-photograph` | a small framed photo on a stand: two gnome children (two hats) in front of a lawn (place) |
| `squall-box-barometer` | a big brass barometer on a wooden stand, dial with a needle, rope handle (hold) |
| `penthouse-key` | a beige key on a beige fob, oversized (hold) |
| `bench-lock` | a heavy combination lock: steel body, four number wheels, a shackle (place) |
| `fescue-vial` | a small glass vial with a cork, a pinch of dark soil inside (hold; glass via `alpha`) |
| `rolled-chart` | a sea chart, half unrolled on the ground, a pebble on one corner (place) |
| `carburettor` | a chrome carburettor with a red bow tied on (hold) |
| `hoa-clipboard` | a beige clipboard with a form and a pen on a string (hold) |
| `cigar-crate` | a wooden crate stencilled with an acorn, cigar boxes visible through slats (place, about 0.5 wide) |
| `mole-lantern` | a round brass mole lantern with a warm glowing glass (`glow: true`) and a hoop handle (hold) |

## Done when
- `npm test -w packages/prefabs` passes (it checks every prefab: ground contact, part count, examine lines, grips).
- `npx tsc --noEmit -p packages/prefabs` passes.
- All twelve ids are exported in `GTA_STORY_ACT12`.

## Out of scope
Every other file. Do not edit `catalog/index.ts` (already wired) or `gta-story-gear.ts`.
