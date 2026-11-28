Epic: E17 wave 2 (building the places)
Depends on: wave 1 prefabs (they exist now: check with `getPrefab`)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (helpers, rules, who the Flock of the One Leg are).

## Goal
Wader's Rest is built: a reedy camp of grey tents round a ritual circle of one-leg stones, the big tent facing the
Standing Lady (a giant pink plastic flamingo) on her sand mound, grey washing, the rota board, the reed tea, the
Tuesday bench, banners, reeds, three story vignettes and joke signage. Static scenery with colliders, built once.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`WADERS_REST`: site, centre, lady, ladyMoundR, circle, bigTent,
  tentDoor, saxifrage, gate, tentRing, washingLine, teaUrn, rotaBoard, tuesdayBench)
- `games/gnome-theft-auto/src/societies/flock/build.ts` (yours: the stub)
- `games/gnome-theft-auto/src/campus/story.ts` lines 1-120 (a vignette builder: textPlate, loose props, colliders)
- `packages/prefabs/src/catalog/gta-flock.ts` (ids and sizes)
- For reeds and grass: `grep -rn "id: 'reed\|id: 'cattail\|id: 'bulrush\|id: 'tall-grass" packages/prefabs/src/catalog | head`

## Change
- `games/gnome-theft-auto/src/societies/flock/build.ts`: implement `buildWadersRest(scene, boxes)`. The ground is flat at
  y `heightAt(x, z)` (about 1.3). Everything stays inside `WADERS_REST.site` (x -1220..-1040, z -730..-550). Static
  prefabs in one `buildStaticCells` batch named 'waders-rest'; signs in a group 'waders-rest-signs'.
  - The Lady: `sand-mound` centred at `WADERS_REST.lady` (its low dome; a collider of radius ~5 as a box h +0.6 is fine
    or none: it is gentle), `standing-lady` on top at the centre, yaw `WADERS_REST.lady.yaw` (faces west), lifted to sit
    on the mound top (~ +0.9 m); a thin collider round her leg (0.6 x 0.6 m, h +7).
  - The big tent: `flock-big-tent` at `WADERS_REST.bigTent` (x -1130, z -608), yaw `Math.PI` so its door flap faces
    north toward the circle and the Lady; a round-ish collider: 4 boxes forming an octagon-ish ring or one box of
    half-size 7.5 m, BUT leave the door spot `WADERS_REST.tentDoor` (and 1 m round it) free.
  - The circle: 12 `one-leg-stone` on a ring of radius `WADERS_REST.circle.r` (8) round `circle` (no colliders: you walk
    between them), and a flat worn-earth disc of radius 9 under them (a `CircleGeometry`, muddy brown, lifted 0.03 m,
    `flatLayer(material, LAYER.marking)`).
  - The ring of small tents: `WADERS_REST.tentRing.count` (9) `flock-tent` on a circle of radius `tentRing.r` (42)
    round `centre`, each facing the centre, skipping any that would land within 8 m of the gate path (a straight line
    from `centre` east to `gate`) or of the washing line / tea urn / rota board / bench spots; a collider per tent.
  - `grey-washing-line` at `washingLine`, `reed-tea-urn` at `teaUrn`, `rota-board` at `rotaBoard`, `tuesday-bench` at
    `tuesdayBench`, 4 `flock-banner` round the circle (on the diagonals at radius 14), colliders for solid ones.
  - A gate at `gate`: two posts (any fence/gate prefab that exists, or two `flock-banner`) and a sign.
  - Reeds: a dense band of reeds along the site's west and south edges and clumps elsewhere (deterministic scatter with
    a seeded sin-hash, ~150 placements, in the same static batch; no colliders), but none within 10 m of `circle`,
    `lady`, `bigTent`, `gate`, or the gate path.
  - Signs (text plates): on the rota board "ROTA / Mon: tea (Sedge) / Tue: NO SITTING / Wed: washing (Bulrush) /
    Thu: wobble watch (Plover) / Fri: Godwit owes tea / Sat: Godwit owes tea / Sun: stand"; at the gate "WADER'S REST /
    Visitors welcome / Please stand on one leg"; on the bench "NOT TODAY" (in case it is Tuesday); by the Lady "PINK IS
    FOR THE LADY ONLY"; by the urn "A WOBBLE IS A THOUGHT. A THOUGHT IS A CUP."; a weathered HOA notice nailed to a post
    near the gate "NOTICE: ORNAMENTS OVER 2 M REQUIRE A PERMIT (HOA 9-f)" with a smaller hand-written note under it "She
    is not an ornament. She is standing."
  - Three vignettes (props telling a story without text): (1) a tipped stool far from the circle with a grey cup spilled
    beside it (someone sat on a Tuesday and fled); (2) one pink sock in the grey washing, pegged apart from the rest, with a
    grey sock-shaped gap where it should be (a dye accident under investigation); (3) a line of one-footed footprints in
    the mud from the circle to the tea urn (flat decals, `flatLayer`), ending in a puddle of spilled tea.
- `games/gnome-theft-auto/src/societies/flock/build.test.ts` (new): build into a fresh scene; every collider stays inside
  the site; no collider covers `WADERS_REST.tentDoor`, `saxifrage`, `circle` centre, or `gate` (0.8 m radius); at least
  6 flock tents and 12 stones are placed (count objects or placements by name in the built groups, or expose a small
  exported pure `planWadersRest(): { id: string; x: number; z: number; yaw: number }[]` and test that).

## Contract
`buildWadersRest(scene, boxes)` keeps its signature.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/flock/build.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the tent interior, flock life, the sermon, config.ts).
