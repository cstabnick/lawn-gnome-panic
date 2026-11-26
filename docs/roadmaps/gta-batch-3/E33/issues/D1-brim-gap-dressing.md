Epic: E33 mountain routes, wave 2 (dressing). Worker: Sonnet.
Depends on: wave 1 (the Brim Gap Road's final line, spots and pads; the E33 prefabs)

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Three other dressers work at the same time on other files.

## Goal
The Brim Gap Road feels like a real Alpine pass that gnomes use and talk about: route signs at both ends, numbered
hairpins with chevrons, gradient and falling-rock warnings, the **Top Hat** café at Brim Gap (Velma Crown inside the
story, a terrace with tables, parked cars, a coin telescope and a topograph at the lookout), lay-bys with a view, and
small stories along the way. Environmental storytelling is the acceptance criterion: at least 3 readable vignettes
(props telling a story without text), signs and posters with jokes that fit the place, residents doing something
specific to the place, ambient sound.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/defs/brimGapRoad.ts` (`BRIM_GAP_ROAD`, `BRIM_GAP_SPOTS`: start, end,
  hairpin1..N, cafe, lookout, picnicHairpin, camperHairpin, tarnLayby), `defs/hatbrimPads.ts` (`cafe-terrace`,
  `tarn-layby`), `pads.ts` (`padHeight`, `padLocal`), `brimGap.ts` (your stub), `deps.ts`
- `games/gnome-theft-auto/src/capwood/runPlan.ts` and `src/capwood/run.ts` — the pattern to copy: a pure plan
  (`props`, `signs`, `vignettes`, `residents`, `solids`) and a builder (`buildStaticCells`, colliders, `buildSignText`,
  `createAmbientGnomes`, `playAt`).
- `docs/lore/entries/apocrypha/top-hat-cafe.md`, `velma-crown.md`, `brim-gap-road.md`, `hatbrim.md` and rulings
  R-223..R-225 in `docs/lore/rulings.md` (names and facts; follow them).
- Prefabs you may place (browse others in `packages/prefabs/src/catalog/`): `top-hat-cafe`, `route-name-sign`,
  `hairpin-chevron-sign`, `gradient-sign`, `falling-rocks-sign`, `viewpoint-topograph`, `picnic-blanket-spread`,
  `stuck-camper-chocks`, `scree-pile` (E33); `gta-shell-camper`, `euro-cafe-table`, `euro-cafe-chair`, `pl-cafe-parasol`,
  `gsr-telescope-stand`, `bench`, `hamlet-stone-cairn`, `hamlet-picnic-table`, `garden-rock`, `euro-bollard`, `goat`.
  Check each id exists with `getPrefab(id)` in your test.
- `games/gnome-theft-auto/src/sound/ids.ts` (world sound ids: e.g. 'cafe-clink', 'wind-gust', 'goat-bleat', 'horn-car').

## Change
- New `src/mountainRoutes/brimGapPlan.ts` (pure, no three.js): `export function brimGapPlan(): RunPlan`-like data
  (define your own `BrimGapPlan { props; signs; vignettes; residents; solids }` reusing `PlanProp`, `PlanSign`,
  `Vignette` from `../pardonlin/plan` and `AmbientGnomeDef` from `../ambientGnomes`), placed from the spots, pads and
  `track.frame(s, lat)`. Must include:
  - a `route-name-sign` at each end (text: "BRIM GAP ROAD / Brim Gap 1 / Top Hat café / High Tarn" style lines, and a
    joke line, e.g. "Snow chains advised. Two hats essential.");
  - at each hairpin: a `hairpin-chevron-sign` on the outside facing the approaching traffic, and a small sign or plaque
    with its number and name ("Hairpin 3: the Crease"); every hairpin a hat-themed name;
  - gradient and falling-rock warnings at the foot of each climb and in the steep stretches;
  - the café: the `top-hat-cafe` building on the `cafe-terrace` pad, 3 to 4 tables with chairs and parasols, a menu
    board ("Gap Tea / Hairpin Buns / Today's view: the Bobble"), Velma Crown's tally board (R-225), 2 parked vehicles are
    NOT props (leave room), the `viewpoint-topograph` and a coin telescope at `lookout`, a bench;
  - vignettes (each with a one-line story): the abandoned picnic at `picnicHairpin` (blanket, thermos, one boot, a map
    pinned by a stone, gulls' feathers: someone left in a hurry when the weather turned), the camper stuck on the
    outside verge at `camperHairpin` (`gta-shell-camper` tilted a little, `stuck-camper-chocks`, a hand-written sign
    "BACK IN 5 MINS (WENT FOR HELP) (TUESDAY)"), and at least one more of your own (a snow-plough marker stack nobody
    has used; a hat blown off at the tarn lay-by, caught on a rail post...).
  - residents: Velma Crown at the café (idle 'sweep' or 'hands-on-hips', bubble from her lore), a cyclist fixing a chain
    at a hairpin lay-by ('scratch-head'), a gnome taking photos of the view at `tarnLayby` ('look-around'). Bubbles are
    short and funny.
  - Nothing on the road itself: props stay outside `width / 2 + shoulder + 0.5` of the centre line (except the signs'
    posts, which stand at least `width / 2 + 1` out), off the Brim Walk and the Hatband (6 m), and clear of the guard
    rails (rails are on the outside of hard bends and drops: keep props at least 1.5 m from `railRuns()` positions,
    `railRuns` from `./rails`).
- `src/mountainRoutes/brimGap.ts` — implement `createBrimGapDressing(scene, world, deps)`: build the plan like
  `capwood/run.ts` does (prop placements in one `buildStaticCells(..., { name: 'e33-brim-gap' })`, colliders into
  `world.boxes` for solid things: café walls (one box per wall face, not one big box that swallows the door: leave the
  terrace open), tables, the camper, signs' posts), the sign text with `buildSignText`, residents with
  `createAmbientGnomes`, and sound in `update`: 'cafe-clink' near the café (every 4-7 s within 30 m), 'wind-gust' on the
  gap (every 6-12 s within 60 m of `cafe`). `blips()`: one blip at the café `{ color: '#7a3b2e', label: 'The Top Hat' }`.
- New test `src/mountainRoutes/brimGapPlan.test.ts`: every prop id exists (`getPrefab`); counts (>= 3 vignettes, a
  chevron per hairpin, 2 route signs, 3 residents); nothing on the road or another route (rules above); every prop
  within 40 m of the road; the café building inside the `cafe-terrace` pad.

## Contract
`createBrimGapDressing(scene, world, deps): Area` unchanged. You own `brimGap.ts`, `brimGapPlan.ts`,
`brimGapPlan.test.ts` only.

## Done when
- `npx vitest run src/mountainRoutes/brimGapPlan.test.ts` passes; `npx tsc --noEmit -p .` clean in your files.
- Report: vignettes (one line each), hairpin names, residents and their bubbles.

## Out of scope
Every other file (the defs, rails, surfaces, other dressers' files, prefabs: if a prefab you want is missing, place a
near one and say so in your report).
