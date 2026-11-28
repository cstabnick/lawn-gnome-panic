# World-change dressing: common rules (every D issue)

Read `_env.md` first. Each D issue owns exactly **one** file `games/gnome-theft-auto/src/worldChanges/rows/<name>.ts`
(a stub that registers empty groups) and nothing else, except where the issue names a second file.

## The API (done; do not edit)
- `src/worldChanges/registry.ts`: `registerWorldChange(id, (ctx) => ({ root, update?(dt, t), hide?() }))`.
  `ctx: { scene, groundY(x, z), night(): 0..1, ending(): 'A' | 'B' }`. The runtime adds `root` to the scene while the
  change is on and removes it when off. Build everything once, inside the builder function (not at import time).
- `src/worldChanges/defs.ts`: the rows (`id`, `title`, `where`, `after`, `hides`). Design text for every row:
  `docs/design/gnome-theft-auto/world-changes.md` (read your rows there; it is the spec).

## How to build props
- Objects: `buildPrefab(id)` from `@lawn/prefabs` (returns a `THREE.Group` sized in metres, front on +z). Find ids with
  `grep -rn "id: '<word>" packages/prefabs/src/catalog/` (e.g. 'site-hoarding', 'site-hoarding-gate', 'bucket-crane',
  'site-tower-crane', 'bunting-span', 'street-banner-pole', 'college-banner', 'flock-banner', 'team-banner',
  'speedway-banner', 'glaze-extra-bunting'). Prefabs only, no hand-made meshes for objects. Use `prefabExists`-style
  guards only if the package offers them; otherwise use ids you confirmed with grep.
- Text signs: `coastSign(text, { w, h, bg, fg, post })` from `src/coast/sign.ts` returns a `THREE.Group` board (works
  without a DOM in tests). Sign text in the game's dry voice, short, in capitals where the design quotes capitals.
- People: ambient stand-ins only (no AI, no colliders): use the gnome builder other dressing modules use (grep
  `createGnomeModel` or `buildGnome` in `src/pardonlin/` or `src/country/` and copy that call), static pose, optionally
  a small idle bob in `update`. A few per change, not crowds of 50.
- Placement: find the real place's coordinates in code, never guess: grep `src/sites.ts` (E01 site ids like
  'construction-1', 'mole-entrance', 'wind-farm', 'observatory-mound', 'campus', 'coast', 'pirate-ship', 'dirt-track',
  'golf-yard', 'cult-camp'), `src/homes/data.ts` (Saucer Court), `src/quests/stages/*.ts` (stage `center` and `marks`
  for 'side-valve-bay', 'granny-barn', 'founders-green', 'bodega' etc.), `src/config.ts` (SIDE_VALVE, AIRFIELD...),
  the area module's own config (e.g. `src/campus/`, `src/coast/config.ts`). Y = `ctx.groundY(x, z)`.
- Never block a road, a door, a giver or a quest stage mark: keep props >= 3 m from stage marks and doors, off road
  surfaces (roads in Turfton run along x and z = -180,-120,-60,0,60,120,180, 10 m wide). Props have no colliders.
- Anything flat on the ground (a mown strip, a rug of clover) uses `flatLayer(material, LAYER.<x>)` from `@lawn/depth`.
- Night-lit things: emissive material whose `emissiveIntensity` follows `ctx.night()` in `update`.
- "Hides an existing prop" (e.g. HOA condemned signs): do NOT edit the baked world. If the old prop is a separate
  named object you can find in `ctx.scene` (`scene.getObjectByName`), set its `visible = false` in the builder and
  restore it in `hide()`; if it is baked into a static batch, cover/replace it visually instead (a torn version on top)
  and say so in your report.

## Test (each D issue)
Add `src/worldChanges/rows/<name>.test.ts`: for each of your ids, `worldChangeBuilder(id)!(ctx)` with
`ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' }` returns a root with at least 3
children, and `update?.(0.1, 1)` does not throw. Import `'./<name>'` and `worldChangeBuilder` from `'../registry'`.
Mock `'../../audio'` like other tests if an import chain needs it.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your file; `npx vitest run src/worldChanges` passes.
- Report the coordinates you used for each change and what each shows.
