Epic: E18-A
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first.

## Goal
World changes switch on and off from the quest save at runtime: each change's prop group is added to the scene while
the change is on, and its Turfton FM news line plays the first time the player drives after it turned on during play.

## Read first
- `src/worldChanges/defs.ts` (done; do not edit): `WORLD_CHANGES` (`id`, `after`, `hides`, `bulletin`, `bulletinB`),
  `activeWorldChanges(saves)`, `endingOf(saves)`, `worldBulletinKey(id, ending)`.
- `src/worldChanges/registry.ts` (done): `worldChangeBuilder(id)`, `WorldChangeCtx`, `WorldChangeBuilt { root,
  update?(dt, t), hide?() }`.
- `src/worldChanges/runtime.ts` (stub: keep `WorldChangesDeps`, `WorldChanges`, `installWorldChanges` signatures and the
  `import './rows'` line).
- `src/radio/content.ts` `EVENT_BULLETINS` (~l.266, `Record<string, readonly Line[]>`, `Line { who, text }` ~l.17;
  entries use `who: 'BULLETIN'`).
- How app.ts reports news: `reportNews(id)` -> `radio.news(id)`; a key with no `EVENT_BULLETINS` entry is dropped, news
  heard with nobody driving waits for the next drive (radio/player.ts ~l.399-425). You do not edit app.ts.

## Change
- `src/radio/content.ts`: add the world-change bulletins to `EVENT_BULLETINS` without hand-copying: import
  `WORLD_CHANGES` and `worldBulletinKey` from `../worldChanges/defs` and spread in entries
  `[worldBulletinKey(w.id)]: [{ who: 'BULLETIN', text: w.bulletin }]` for every row with a non-empty `bulletin`, plus
  `[worldBulletinKey(w.id, 'B')]: [{ who: 'BULLETIN', text: w.bulletinB }]` where `bulletinB` is set. (If `content.ts`
  has an import cycle problem with defs.ts, build the object in a tiny new `src/radio/worldBulletins.ts` and spread that.)
  Strip a leading "Turfton FM news: " from the text if the other bulletins do not carry such a prefix (check them).
- `src/worldChanges/runtime.ts` `installWorldChanges(deps)`:
  - ctx: `{ scene: deps.scene, groundY: deps.groundY, night: deps.night, ending: () => endingOf(deps.saves()) }`.
  - Every 0.5 s compute `activeWorldChanges(deps.saves())`. For each id: if on and it has a builder, build it lazily the
    first time (try/catch: a builder that throws logs `console.warn` once and is skipped), `scene.add(root)` while on,
    `scene.remove(root)` and call `hide?.()` when it goes off. Run `update(dt, t)` of shown changes every frame.
  - News: ids already on at the first check are "known" (no news). An id that turns on later calls
    `deps.news(worldBulletinKey(id, ending))` once, if that row's bulletin is non-empty.
  - `active()` returns the current on-list.
  - Expose `?worldchange=W03,W08` (URL param, read once at install via `new URLSearchParams(location.search)` in a
    try/catch): forces those ids on for screenshots and checks (they are shown and never sent as news).
- `src/worldChanges/runtime.test.ts` (new): with a fake scene (`new THREE.Scene()`) and a test builder registered via
  `registerWorldChange('W01', ...)` (vi.mock './rows' to an empty module so real builders do not load), saves without
  `m02-roof-on-credit` -> nothing added; set it done and step 0.6 s -> the root is in the scene and `news` was called with
  'world-W01'; a second install with it already done -> root shown, no news.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files.
- `npx vitest run src/worldChanges src/radio` passes.

## Out of scope
`src/worldChanges/rows/*` (dressing issues), `defs.ts`, `registry.ts`, `app.ts`.
