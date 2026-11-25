Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You only touch
`packages/prefabs/src/catalog/gta-drainpipe-court.ts` (an empty, already registered file). Others fill the two other
new catalog files (`gta-gutter-bowls.ts`, `gta-sports-gear.ts`) at the same time.

## Goal
The props of Drainpipe Court, Downtown Turfton's public basketball court: "The hoop is bolted to a drainpipe, the lines
are chalk, and the bench has been there longer than the court." Gnome Theft Auto places them (scale 1 = metres, a gnome
is about 1 m tall).

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its "Environment" section).
- `packages/prefabs/src/types.ts` (`PrefabDef`, part shapes `box | cyl | cone | ball | ring | pill | wedge`, `rot` in
  degrees, `c` colour names) and `packages/prefabs/src/palette.ts` (colour names).
- `packages/prefabs/src/catalog/gnome-jam.ts`: `gba-hoop` (a stanchion, backboard, rim and net; rim height and how
  the front faces +z) and `gba-basketball`.
- `packages/prefabs/src/catalog/gta-golf-props.ts`: finished GTA props (style of `about`, five `examine` lines, tags).

## Change
`GTA_DRAINPIPE_COURT` in `gta-drainpipe-court.ts`, each with `tags` including `'gta'`, `emoji: []`, five examine lines
in the house voice (dry, warm, specific), `uses: ['place']` (`category: 'prop'` unless noted):
- `drainpipe-hoop`: a Tall-One galvanised drainpipe (a grey `cyl` r 0.09, 3.6 m tall) standing on a cracked
  concrete shoe, with a plywood backboard (1.5 x 1.0 x 0.04, painted white with a red shooter square drawn as thin
  boxes 0.005 proud) bolted to it by two pipe clamps; an orange rim (`ring`, inner radius 0.23, tube 0.015) with
  **no net**, rim centre at exactly **(0, 3.05, 0.4)** (scaled 0.8 in the game: 2.44 m), backboard face at z 0.08,
  the pipe at z -0.1. Front faces +z. A downpipe elbow at the top pointing back, a gutter stub. `footprint: { r: 0.5, h: 4.2 }`.
- `chalk-scoreboard`: an A-frame chalkboard on an easel (1.2 wide, 1.4 tall), "HOME" and "AWAY" columns drawn as
  white tally-stroke boxes, a chalk ledge with two chalk sticks and a rag. Front +z.
- `ball-cage`: a waist-high wire ball cage (a frame of thin dark boxes, 1.0 x 0.8 x 0.6) holding three scuffed
  orange basketballs (balls with dark seam rings), a padlock hanging open. Front +z.
- `old-court-bench`: a long wooden bench (2.4 m) visibly older than everything round it: grey weathered planks, one
  plank replaced in brighter wood, iron legs sunk into the ground with grass tufts round them, a brass plaque.
- `lost-ball-drain`: a street drain grate (flat, 0.6 x 0.6, thin box 0.03 high) with an orange basketball wedged
  half-down it (only the top third showing). For storytelling.
- `court-rules-sign`: a hand-painted board on a post (1.6 m): the court rules as several thin dark "text line"
  boxes, one line crossed out with a red stroke. Front +z.
- `laundrette-sign`: a small shop sign on a bracket for "Lather & Lint" (the laundrette under Swish's flat): a blue
  board 1.2 x 0.4 with a white bubble cluster (small balls) and a bent bracket. Front +z.
Keep part counts modest (<= 40 per prefab). Colours from the palette only.

## Contract
Prefab ids exactly: `drainpipe-hoop`, `chalk-scoreboard`, `ball-cage`, `old-court-bench`, `lost-ball-drain`,
`court-rules-sign`, `laundrette-sign`. `drainpipe-hoop` rim centre at (0, 3.05, 0.4), front +z.

## Done when
- `npm test -w packages/prefabs` passes (catalog, footprint and render tests cover new prefabs).
- `npx tsc --noEmit -p packages/prefabs` shows no errors.

## Out of scope
Every other catalog file, `catalog/index.ts` (already registered), the game.
