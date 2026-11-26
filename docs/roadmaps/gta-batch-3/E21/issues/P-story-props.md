Epic: E21-1 foundation (cast, props, gear, story marks)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adcca8ae7d2f22e45` (run every command from there).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Other workers edit other files at the same time; another worker edits
`packages/prefabs/src/catalog/gta-story-gear3.ts`: do not touch it.

## Goal
Thirteen story props for Gnome Theft Auto's act III cutscenes exist in `@lawn/prefabs`, in the (already registered,
currently empty) array `GTA_STORY_ACT3` of `packages/prefabs/src/catalog/gta-story-act3.ts`.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules (units, y = 0 ground, +z front, `at` is a shape's
  centre, `rot` in degrees, 3-15 parts, five `examine` lines in the game's dry voice). Follow it exactly. GTA props are
  drawn **life size for a gnome world where 1 unit = one gnome's height**, like the neighbouring GTA files.
- `packages/prefabs/src/types.ts` (PrefabDef, Part), `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-story-act12.ts` (the act I-II story props: `radio-jammer`, `bench-lock`,
  `rolled-chart`, `cigar-crate`, ...): copy its style and examine voice exactly.

## Change
`packages/prefabs/src/catalog/gta-story-act3.ts`: add these `PrefabDef`s (ids fixed; `category: 'prop'`, `uses:
['place']` plus `'hold'` with a `grip` where marked; tags include `'gta'`). `about` starts "Gnome Theft Auto: ...".
Examine lines: no "wet", "soak", "blood", "gore" (canon R-021). The HOA's colours are black hats and beige; the Grand
Combine is beige and porcelain-white with brass.

| id | what (from the story) |
|---|---|
| `hoa-radio` | a sunk Tall-One transistor radio fished out of a frozen pond: beige case, frost on one side, a bent aerial, an HOA hat sticker (hold) |
| `hoa-cable-reel` | a big wooden cable drum wound with fat black cable, an HOA tag on a string, on its edge (place, about 0.8 tall) |
| `blade-crate` | a long slatted crate stencilled with a hat, a curved beige mower blade showing through the slats (place, about 1.2 long) |
| `registrar-desk` | a university registrar's counter: a high oak desk, a brass bell, an in-tray of forms, a "MATURE STUDENTS" card (place) |
| `guidance-lens` | a lens the size of a teacup in a brass ring on a little cradle, glass via `alpha`, a faint gleam (`glow`) (hold) |
| `mole-trap` | a spring trap on a board: a wire hoop, a trigger plate, a red warning flag (place) |
| `ledger-book` | the Countess's ledger: a thick book open on a lectern-stand, purple ribbon, a signature on the right page (place) |
| `tasting-tray` | a waiter's silver tray with four small glasses of grape-dew and a folded napkin (hold) |
| `flatbed-trailer` | a low flatbed cart with four small wheels, rope rails and a tow bar, big enough for a statue (place, about 2.5 long) |
| `combine-test-deck` | one segment of the Grand Combine's cutting deck: a long beige-and-porcelain hood over a row of brass blade discs, rivets, a hat badge (place, about 4 wide, 1.2 tall) |
| `caddy-bib` | a caddy's bib: white mesh with a green number "9", hung on a little hanger stand (place and hold) |
| `toy-cutlass` | a toy pirate cutlass: painted wooden blade, a brass-coloured basket hilt (hold) |
| `sock-map` | a woolly sock laid flat with a map inked on it: four crosses marked in red at its edges (place) |

## Done when
- `npm test -w packages/prefabs` passes (it checks every prefab: ground contact, part count, examine lines, grips).
- `npx tsc --noEmit -p packages/prefabs` passes.
- All thirteen ids are exported in `GTA_STORY_ACT3`.

## Out of scope
Every other file. Do not edit `catalog/index.ts` (already wired) or `gta-story-gear3.ts`.
Final report (<= 10 lines): ids added, part counts, test result.
