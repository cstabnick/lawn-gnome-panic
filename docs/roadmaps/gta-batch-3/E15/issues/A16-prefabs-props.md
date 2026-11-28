Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-golf-props.ts` holds Hedgeworth's course and clubhouse furniture.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules. Ignore its "Environment" section.
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gnomeokemon-lab.ts` (`trophy-shelf`, `trophy-cup`) and `bowling.ts` (`bar-counter`) for
  interior furniture style.
- `packages/prefabs/src/catalog/gta-golf-props.ts`: the empty file you fill (already registered).

## Change
`GTA_GOLF_PROPS` gets these prefabs (ids exact; 1 = a gnome's height; fronts face +z; text is written by the game, so
leave sign faces blank and flat, 0.02+ in front of their backing):
- `tee-sign` (about 1.6 tall): a rustic hole sign on an oak post: a board 0.9 x 0.5 with a blank cream face, a little
  painted flag symbol in the corner, a tiny wooden roof over it.
- `yardage-post` (about 0.7 tall): a short white post with a coloured band (red/white/yellow: tint) and a blank top cap.
- `golf-bag` (about 1.0 tall): a stand golf bag (a tall tube with a pocket, a strap, two thin stand legs splayed at the
  back) with 6 club heads poking out of the top (thin shafts, small heads: woods with knitted head covers, irons as
  flat blades). Tint the bag (default tartan red 0xa8323a).
- `honours-board` (about 1.6 wide, 2 tall): a varnished wall board with a carved top crest and a blank gold-edged face
  (the game writes names), its back flat on z = 0 so it hangs on a wall.
- `trophy-cabinet` (about 1.6 wide, 1.9 tall, 0.5 deep): a dark wood cabinet with a glass front (a transparent pane
  0.02 in front of the shelves), three shelves holding cups (2-handled trophy cups, a silver plate, a cup that is clearly
  just an upside-down flowerpot sprayed gold), a small blank plaque at the bottom.
- `club-rack` (about 1.4 wide, 1.3 tall): a pro shop floor rack of 8 clubs standing in slots, with a little price tag
  card on each (blank white tabs).
- `scorecard-box` (about 1.2 tall): a small wooden box on a post with a slot of blank scorecards and a pencil on a string.
- `tee-time-board` (about 1.2 wide, 1.6 tall): a chalkboard on an easel with chalk lines (thin white boxes) and an
  empty corner (the game writes names), a chalk tray with a stub of chalk.
Five `examine` lines each in the house voice (`gta` in the tags; e.g. the trophy cabinet "holds every cup Hedgeworth
has won and one it made", the club rack "has a club for every lie, and Basil has one for every excuse").

## Contract
Prefab ids exactly: `tee-sign`, `yardage-post`, `golf-bag`, `honours-board`, `trophy-cabinet`, `club-rack`,
`scorecard-box`, `tee-time-board`.

## Done when
- `npm test -w packages/prefabs` passes (or `cd packages/prefabs && npx vitest run -t <id>` per id, then the package once).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.
