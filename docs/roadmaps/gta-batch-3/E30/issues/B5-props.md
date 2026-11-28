Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Other workers are editing other
files at the same time (another one writes `gta-pardonlin-gear.ts` and the achievements catalog); touch only your file.

## Goal
Twenty Pardonlin town props exist in `@lawn/prefabs`, so the town's district plans (written right now by other workers
using these exact ids) can place them.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules (parts, shapes, sizes, `about`, `examine`, tags).
- `packages/prefabs/README.md` (skim: categories, uses, footprint).
- `packages/prefabs/src/catalog/gta-euro-street.ts`: the European kit's street props, the style to match (life-size
  metres, front faces +z, origin on the ground at the centre, `tint` / `trim` swatches).
- `packages/prefabs/src/catalog/gta-pardonlin-props.ts`: your file (an empty array, already registered in
  `catalog/index.ts`).

## Change
- `packages/prefabs/src/catalog/gta-pardonlin-props.ts`: fill `GTA_PARDONLIN_PROPS` with these defs (ids exact;
  category 'prop' unless noted; uses ['place'], plus 'hold' where noted; life-size metres where 1 m = one gnome's
  height, so a gnome is about 1 m tall and a café table top is about 0.7 m; origin on the ground, front +z; each with
  `about`, 4-5 `examine` lines in the town's gentle continental-satire voice (long lunches, bread opinions, queues,
  strikes, pigeons with standing; no real places, brands or nationalities; nothing wet/soaked/dripping/bloody), tags
  including 'gta' and 'pardonlin', `emoji: []`):
  1. `pl-easel`: a wooden A-frame painter's easel (1.6 m) holding a canvas that shows a croissant-shaped tower
     (colour parts on the canvas front, 0.01 proud of it), a little paint box at its foot.
  2. `pl-gramophone`: a horn gramophone (0.5 m) with a brass horn, a wooden box, a black record.
  3. `pl-horn-speaker`: a brass horn loudspeaker on a 4 m iron post with a small base; horn at the top pointing +z.
  4. `pl-accordion`: an accordion (0.45 m) with bellows folds and button sides; uses ['place', 'hold'].
  5. `pl-baguette`: a long baguette (0.7 m) with slashes on top; uses ['place', 'hold'].
  6. `pl-bread-basket`: a wicker basket (0.7 m tall) of standing baguettes.
  7. `pl-book-stall`: a riverside bookseller's green box on legs (2 x 0.8 m, 1.4 m tall) with its lid propped open and
     rows of book spines inside; footprint `{ w: 2, d: 0.8, h: 1.4 }` style if the README uses footprints.
  8. `pl-queue-post`: a queue stanchion (0.95 m): weighted base, brass post, ball top, a red rope hanging in a shallow
     arc 1.5 m along local +x to where the next post stands (the rope belongs to this post).
  9. `pl-cheese-wheel`: a stack of three cheese wheels (0.6 m), tint = rind.
  10. `pl-produce-crate`: a slatted wooden crate (0.6 x 0.4 m) heaped with round produce (tint = produce).
  11. `pl-cafe-parasol`: a striped café parasol (2.4 m tall, 2.6 m across) on a weighted base; tint/trim stripes.
  12. `pl-boule`: one steel boules ball (0.09 m across) (use 'ball').
  13. `pl-newspaper`: a folded newspaper lying flat (0.3 x 0.22 x 0.02 m) with grey text-line strips 0.002 proud.
  14. `pl-espresso-cup`: a tiny white cup on a saucer (0.06 m tall).
  15. `pl-croissant`: a croissant (0.14 m), curved segments.
  16. `pl-music-stand`: a black folding music stand (1.2 m) with a sheet of music.
  17. `pl-cello`: a cello standing on its spike (1.25 m), with a bow leaned on it.
  18. `pl-marrow`: a giant prize marrow (0.9 m long) lying on straw, with a rosette.
  19. `pl-tour-flag`: a tour guide's flag: a 2 m pole with a small triangular flag (tint) and a pom-pom on top;
      uses ['place', 'hold'].
  20. `pl-sheet-music`: a scattered sheaf of sheet music (three sheets fanned, 0.3 m, 0.004 thick sheets each lifted
      0.003 above the one below, so no two sheets share a plane).
- No z-fighting inside a prefab: parts that touch must not share a face (offset by 0.002+ or overlap volumes).

## Done when
- `npm test -w packages/prefabs` passes.
- `npx tsc --noEmit -p packages/prefabs` (or the package's own build/typecheck script) passes.
- Report the ids and their sizes (height, footprint) in one line each.

## Out of scope
`catalog/index.ts` (already registered), `gta-pardonlin-gear.ts`, anything in `games/`.
