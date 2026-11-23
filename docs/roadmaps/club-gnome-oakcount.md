# Club Gnome: the Oakcount, shops, salon, dressing room and the guide

Goal: Club Gnome, the hub, gets an acorn economy and the first Animal-Crossing-style places to spend it.

- **Oakcount** (`@lawn/oakcount`): one acorn account for the whole arcade (acorns, Gnomecino chips, purchases),
  localStorage plus a cloud mirror for signed-in players (`GAME_OAKCOUNT` save slot). Acorns become chips, one way.
  Earned from a welcome gift (100), a daily visit gift (25) and acorns lying around outdoors (5 each).
- **Gnomecino**: the Cashier (acorns to chips) and the Prize Counter (6 casino cosmetics for chips, plus 6 "Coming
  soon" placards).
- **Acorn Row**, a new street south of the square: the **Gnome Market** (6 items for acorns, plus the dressing room),
  the **Gnome Salon** (hair styles for acorns, edited in place) and **Dovetail Furniture** (coming soon).
- **One gnome-editing code path**: the Gnome Creator's panel, preview and flow move into `@lawn/gnome-editor`
  (`createGnomeStudio`). The creator, the dressing room and the salon all call it.
- **Hair styles**: `Look.hairStyle` (proto `hair_style`), 6 new styles modelled in `@lawn/gnome`.
- **NPC gnomes**: the guide, 6 shopkeepers and townsfolk walking on a shared clock, so every player sees them in the
  same place without network traffic.
- **The guide**: Chicory Waymark by the fountain, three one-to-two-sentence answers (where am I, how to play, acorns),
  plus a ❓ Help button.
- **Lore**: entries for the shopkeepers, the guide, Acorn Row and the Oakcount, with rulings for the guide's fourth-wall
  licence and the chips.

Follow-up (done in the same PR): Gnome Blackjack's tables and slots play with Oakcount chips (`wallet` input, CPU-only
free stacks, a cashier button when broke). Not in scope: furniture and gnome huts.

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | proto + Go + regen, `@lawn/oakcount`, `HairStyle` types, `@lawn/gnome-editor` (moved, stubbed), Club Gnome config/maps/counters/main wiring and stubs; club-gnome builds | done by the planner, no issues |
| 2 Everything else, in parallel | `npm run build -w games/club-gnome` and `-w games/gnome-creator`; tests of club-gnome, gnome, prefabs, achievements, oakcount; `npm run lore` | 12 (2A-2L) |
| 3 Check and ship (planner) | smoke test, phone viewport, README/AGENT_INDEX/cosmetics docs, PR | none |

## Epic 1 (done by the planner)

Contracts now in the tree, binding for epic 2:

- `packages/oakcount/src/index.ts`: `loadOakcount, getAcorns, getChips, owns, earnAcorns, spendAcorns, buyChips,
  spendChips, buyItem(id, price, 'acorns'|'chips'), grantWelcome, claimDailyAcorns, onOakcountChange, OAK`.
- `packages/gnome/src/types.ts`: `HairStyle`, `HAIR_STYLES`, `isHairStyle`, `Look.hairStyle?`, `GnomeLook.hair.style: HairStyle`.
- `packages/gnome-editor/src/editor.ts` (`EditorSection`, `EditorOptions`, `HairStyleChoice`, `Editor.setHairStyles`,
  `Editor.dispose`) and `studio.ts` (`createGnomeStudio`, `StudioOptions`, `STUDIO_SECTIONS`, `hairItemId`).
- `games/club-gnome/src/config.ts`: `MapId` + `row`, `market`, `salon`; `PanelId`; `CounterDef`; `MapDef.counters`;
  `NpcDef`; `NPC_ID_BASE`; `PICKUPS`; `STORAGE.guideSeen`, `STORAGE.pickups`.
- `games/club-gnome/src/panel.ts`: `openPanel`, `isPanelOpen`, `closePanel`, `PanelCtx`.
- `games/club-gnome/src/shops/catalog.ts`: `PRIZE_ITEMS`, `PRIZE_COMING_SOON`, `MARKET_ITEMS`, `HAIR_PRICES`.
- `games/club-gnome/src/achievements.ts`: `onAcornPicked`, `onShopBuy(achievementId)`, `onHairBought`.
- Stubs with final signatures: `shops/cashier.ts`, `shops/prizes.ts`, `shops/market.ts`, `studioRoom.ts`, `guide.ts`,
  `npcs.ts`, `npcData.ts`, `pickups.ts`, `walletHud.ts`. `main.ts` already calls all of them.

NPC ids, names, maps and spots (lore and code use these):

| id | Name | Role | Map | Stands at | Counter |
|---|---|---|---|---|---|
| chicory-waymark | Chicory Waymark | the guide | town | (2.6, 6.6) | guide |
| clary-tillbox | Clary Tillbox | Gnomecino cashier | gnomecino | (2, -8.4) | counter-cashier |
| fennel-brassbell | Fennel Brassbell | Prize Counter keeper | gnomecino | (7, -8.4) | counter-prizes |
| marjoram-crate | Marjoram Crate | Gnome Market grocer | market | (-3, -5.3) | counter-market |
| poppy-thimble | Poppy Thimble | dressing room attendant | market | (7.6, -2.6) | counter-dressing |
| lavender-shearwell | Lavender Shearwell | Gnome Salon stylist | salon | (0, -4.4) | counter-salon |
| hazel-dovetail | Hazel Dovetail | furniture maker (shop not open) | row | (12.6, -1.6) | counter-furniture |

Townsfolk (walkers): Thistle Mugsworth, Clover Pegg, Burdock Ladle, Primrose Kettleby, Sage Bucketby, Dill Spindle,
Rosemary Brickwell.

## Epic 2 issues

Common environment text (pasted into every issue below):

~~~~text
## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
  If tsc reports errors in a file you do not own, ignore them (that worker is mid-edit); your own files must be clean.
- Do not start a dev server (other workers might need the port).
- Repo rules that apply: phone first (44 px touch targets, works at 390x844 portrait, no hover-only UI, safe-area
  insets); UI modules append their own container to `#ui` and never restyle or hide `#ui`; lore names follow
  docs/lore/canon.md.
~~~~

### 2A: gnome editor sections and the hair style picker

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
  If tsc reports errors in a file you do not own, ignore them (that worker is mid-edit); your own files must be clean.
- Do not start a dev server.
- Phone first: 44 px touch targets, works at 390x844 portrait, no hover-only UI.

## Goal
The gnome editor panel (`packages/gnome-editor/src/editor.ts`, moved here from the Gnome Creator) can show only some
of its sections, has a configurable title, close button and save label, and shows a HAIR STYLE picker with locked
(buyable) styles. The Gnome Creator, Club Gnome's dressing room and its salon all use this one panel.

## Read first
- packages/gnome-editor/src/editor.ts: the whole file. The types `EditorSection`, `ALL_EDITOR_SECTIONS`,
  `HairStyleChoice`, `EditorOptions`, `EditorCallbacks.onHairStyleLocked`, `Editor.setHairStyles` and `Editor.dispose`
  already exist; the two places marked `TODO(issue 2A)` are what you implement.
- packages/gnome/src/types.ts: `HairStyle`, `HAIR_STYLES` (id + label), `Look.hairStyle` (absent = 'pigtails').

## Change
- packages/gnome-editor/src/editor.ts (the only file you edit):
  1. `createEditor(parent, cb, opts)`: `const sections = new Set(opts.sections ?? ALL_EDITOR_SECTIONS)`. Build the
     panel in the existing order, but append each section to the panel only when its id is in `sections`:
     - 'name': the NAME input section.
     - 'guide': the "Make your gnome stand out" tips box.
     - 'colours': HAT, SHIRT, PANTS, BOOTS colour grids (COLOUR_SECTIONS minus skin).
     - 'skin': the SKIN grid (split it out of the colour loop).
     - 'hair': BEARD and HAIR colour grids, then the new HAIR STYLE grid (step 3).
     - 'toggles': FRECKLES / DRESS / GLASSES row.
     - 'equipment': the EQUIPMENT section.
     - 'emotes': the EMOTES section.
     - 'share': SHARE CODE and IMPORT A CODE sections.
     SAVE and the status line always show. Hidden sections may still be built (so setEmotes/setShareCode keep
     working without errors); they are just not appended.
  2. Heading text = `opts.title ?? 'GNOME CREATOR'`. When `opts.onClose` is set, replace the "BACK TO THE ARCADE" link
     with a button (class `ge-btn`, text '✕ CLOSE', min-height 44px) that calls `opts.onClose()`; put the heading and
     the button on one row (flex, space-between). SAVE button text = `opts.saveLabel ?? 'SAVE'`.
  3. HAIR STYLE grid (inside the 'hair' section, label 'HAIR STYLE'): rendered from the choices given to
     `setHairStyles(choices)` (empty until then). One button per choice, class `ge-eq` (reuse the equipment button
     look), min-height 44px, content: the label, then for a locked choice a `ge-eq-lock` span with '🔒 ' + (price ?? '').
     Selected (class `sel`) when `(state.look.hairStyle ?? 'pigtails') === choice.id`. Tap:
     - owned: new look = copy of the current look; if id === 'pigtails' delete `hairStyle`, else set it; if the look
       has no `hairRgb`, also set `hairRgb = PALETTE[18]` (a hair brown) so the style shows; then `update(look)`.
     - locked: `cb.onHairStyleLocked?.(choice.id)` and nothing else.
     `setHairStyles` stores the choices and re-renders the grid; `refresh()` (called on every state change) must also
     update the `sel` class of the style buttons.
  4. `dispose()`: remove the panel (already done) and do nothing else.
  Keep every existing behaviour of the full panel (when `opts` is `{}` the panel looks exactly like before, plus the
  HAIR STYLE grid once setHairStyles is called).

## Contract
Do not change any exported type or signature in editor.ts. The studio (another worker) calls:
`createEditor(ui, callbacks, { sections, title, onClose, saveLabel })`, `editor.setHairStyles(choices)`,
`editor.setState`, `setUnlocked`, `setEmotes`, `setShareCode`, `setStatus`, `dispose`.

## Done when
- `npx tsc --noEmit -p packages/gnome-editor` has no errors in editor.ts.
- Reading the file: with `sections: ['hair']` only the hair grids, the style grid, SAVE and the status line are
  appended; with no options everything is.

## Out of scope
packages/gnome-editor/src/studio.ts, preview.ts and index.ts (another worker), games/gnome-creator, packages/gnome.
~~~~

### 2B: the gnome studio (one code path) and the creator using it

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
  If tsc reports errors in a file you do not own, ignore them (that worker is mid-edit); your own files must be clean.
- Do not start a dev server.

## Goal
`createGnomeStudio(opts)` in `packages/gnome-editor/src/studio.ts` runs the whole Gnome Creator flow (it is what
`games/gnome-creator/src/main.ts` does today), so the creator page, Club Gnome's dressing room and its salon all edit
and save a gnome through one function. The creator's main.ts becomes a thin caller.

## Read first
- games/gnome-creator/src/main.ts: today's flow (store, achievements, preview, editor callbacks, ?gnome= links,
  emotes). This moves into studio.ts.
- packages/gnome-editor/src/studio.ts: the stub with the final types (`StudioMode`, `STUDIO_SECTIONS`, `hairItemId`,
  `StudioOptions` incl. `hairPrices` and `onHairBought`, `Studio`). Keep them exactly.
- packages/gnome-editor/src/editor.ts: only the exported types at the top (`createEditor(parent, cb, opts)`,
  `EditorOptions`, `HairStyleChoice`, `Editor.setHairStyles`, `Editor.dispose`). Another worker is implementing the
  body right now; code against the types.
- packages/gnome-editor/src/preview.ts: `createPreview(canvas)`, `dispose()`.
- packages/oakcount/src/index.ts: `loadOakcount()`, `owns(id)`, `buyItem(id, price, 'acorns')`, `getAcorns()`.
- packages/gnome/src/types.ts: `HAIR_STYLES`, `HairStyle`.

## Change
- packages/gnome-editor/src/studio.ts: implement `createGnomeStudio(opts)`:
  1. `await loadOakcount()` (safe to call twice). Create `store = createGnomeStore()`,
     `achievementStore = createAchievementStore()`, `preview = createPreview(opts.canvas)`.
  2. `editor = createEditor(opts.ui, callbacks, { sections: STUDIO_SECTIONS[opts.mode], title, onClose: opts.onClose,
     saveLabel })`. Title default: full 'GNOME CREATOR', dressing 'DRESSING ROOM', salon 'GNOME SALON' (opts.title
     wins). saveLabel: full 'SAVE', others 'SAVE MY LOOK'.
  3. Callbacks: onChange/onImport/onEmotesChange/onEmotePreview exactly as main.ts does today. onSave: same as today,
     then `opts.onSaved?.({ name, look: snapLook(look) })`. Status after a save: full mode keeps today's text; other
     modes say 'Saved. Everyone in Club Gnome sees your new look.'
  4. Startup exactly as main.ts (getMe with the storage error message, achievements unlocked, emotes). The `?gnome=`
     link override applies only in 'full' mode.
  5. Hair styles: `refreshHair()` builds `HairStyleChoice[]` from `HAIR_STYLES`: pigtails is always owned; another
     style is owned when `owns(hairItemId(id))`; a locked style's `price` is `'🌰 ' + opts.hairPrices[id]` when a
     price is given, else `'Salon'`. Call `editor.setHairStyles(choices)` at startup and after a purchase.
  6. `onHairStyleLocked(id)`: no price → setStatus('Buy this style at the Gnome Salon in Club Gnome.'). With a price:
     two-tap confirm. The first tap sets status `Buy ${label} for 🌰 ${price}? Tap it again to buy.` and remembers the
     id. A second tap on the same id calls `buyItem(hairItemId(id), price, 'acorns')`. On success: refreshHair(), put
     the style on the current look (set `hairStyle`, and `hairRgb = PALETTE[18]` if the look has none), call
     `editor.setState(state)` and `show(state)`, then status `Yours! Press ${saveLabel} to keep it.` and
     `opts.onHairBought?.(id)`. Not enough acorns: status `You need 🌰 ${price}; you have 🌰 ${getAcorns()}.` (bad = true).
  7. Return `{ dispose() { preview.dispose(); editor.dispose(); } }`.
  The function never rejects: wrap startup storage calls like main.ts does.
- packages/gnome-editor/src/preview.ts: in `dispose()`, after `renderer.dispose()`, also call
  `renderer.forceContextLoss()` (the studio is opened and closed many times inside Club Gnome; browsers cap live
  WebGL contexts).
- games/gnome-creator/src/main.ts: replace the flow with:
  `initCreatorMusic(ui); await createGnomeStudio({ canvas, ui, mode: 'full' });` plus the canvas/ui lookups and
  imports. Remove imports it no longer uses. The page must look and behave as before (the HAIR STYLE row is new).

## Contract
Keep every exported name and type in studio.ts exactly as in the stub. Club Gnome calls
`createGnomeStudio({ canvas, ui, mode: 'dressing' | 'salon', onClose, onSaved, hairPrices, onHairBought })`.

## Done when
- `npx tsc --noEmit -p packages/gnome-editor` has no errors in studio.ts or preview.ts.
- `npx tsc --noEmit -p games/gnome-creator` passes.

## Out of scope
packages/gnome-editor/src/editor.ts (another worker), index.ts, anything under games/club-gnome, packages/gnome.
~~~~

### 2C: six new hair styles on the gnome model

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.

## Goal
`createGnomeModel(look)` draws `look.hair.style` for every `HairStyle`: 'pigtails' (unchanged), 'ponytail', 'bun',
'long', 'braid', 'mullet', 'curls'. Hair styles are bought in Club Gnome's salon and show in every game.

## Read first
- packages/gnome/src/types.ts: `HairStyle`, `HAIR_STYLES`, `GnomeLook.hair: { color, style: HairStyle } | null`.
- packages/gnome/src/model.ts: the hair block (search "Hair: pigtails"; about lines 186-212): the pigtail groups (they
  sway: they are pushed into the `pigtails` array and animated near line 385-410), the bangs and the back-of-head shell
  baked into `bodyParts` with `bakePart(geometry, color, x, y, z, rx, ry, rz, sx, sy, sz)`. Also read how `bakePart`
  and `bakedMesh` are defined.
- packages/gnome/src/anatomy.ts: `HEAD` (centre [0, 0.8, 0], radius 0.17). +z is the face, -z the back of the head.
- packages/gnome/src/model.test.ts: how models are built in tests.

## Change
- packages/gnome/src/model.ts: inside `if (look.hair)`, keep the bangs and the back shell for every style, and switch
  on `look.hair.style` for the rest. Low poly (sphere segments 8-12), the hair colour from `look.hair.color`:
  - 'pigtails': exactly today's code.
  - 'ponytail': one group pivoting at (0, 0.86, -0.17), pushed into `pigtails` so it sways; a chain of 4 spheres going
    down and slightly back (radii 0.07 to 0.045, from y -0.02 to -0.24 below the pivot, z from -0.02 to -0.06) and a
    tie (small torus in the shirt colour, like the pigtails have) at the top.
  - 'bun': a sphere r 0.085 at (0, 0.87, -0.2) and a smaller one r 0.05 on top of it at (0, 0.93, -0.22); baked into
    bodyParts (static).
  - 'long': a long back drape: a sphere squashed to (sx 1.15, sy 1.6, sz 0.55) radius 0.16 centred at
    (0, 0.68, -0.13), plus two front locks (spheres r 0.055, scale y 1.8) at (±0.15, 0.68, 0.0); baked (static).
  - 'braid': one swaying group pivoting at (0, 0.74, -0.18), a chain of 6 spheres (r 0.05 down to 0.035), each 0.06
    lower than the last, alternating x ±0.012, ending in a shirt-colour tie; pushed into `pigtails`.
  - 'mullet': short sides (no pigtails) and a back flare: a sphere squashed (sx 1.1, sy 1.1, sz 0.6) radius 0.15 at
    (0, 0.7, -0.14), baked.
  - 'curls': a ring of 12 spheres r 0.045 round the head at y 0.8, radius 0.17 from the centre, skipping the front
    third (only angles where the sphere's z < 0.08), plus a second ring of 8 at y 0.73 radius 0.15 at the back half;
    baked.
  No part may poke through the face: keep everything at z <= 0.08 except the existing bangs. Nothing new for gnomes
  without hair (look.hair null).
- packages/gnome/src/model.test.ts: add a test that builds a model for every `HAIR_STYLES` id (hair colour 0x6b4a2e)
  without throwing, and that 'bun' and 'curls' produce a different total vertex count from 'pigtails' (sum
  `geometry.attributes.position.count` over all meshes under `model.object`).

## Contract
No exported signature changes. `GnomeLook.hair.style` is the switch; unknown values fall back to pigtails.

## Done when
- `npm test -w packages/gnome` passes (all tests, including gear clearance).
- `npx tsc --noEmit -p packages/gnome` passes.

## Out of scope
types.ts, look.ts, store.ts, connectStore.ts (already done by the planner), every other package and game.
~~~~

### 2D: the six Prize Counter cosmetics (prefabs)

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Another worker is editing packages/prefabs/src/catalog/club-gnome-shops.ts (note the s) at the same time; edit only
  club-gnome-shop.ts.

## Goal
Six casino / too-much-money cosmetics, worn by gnomes, bought for chips at Club Gnome's Gnomecino Prize Counter. Each
is a placeholder box in packages/prefabs/src/catalog/club-gnome-shop.ts now; model them properly.

## Read first
- docs/roadmaps/prefab-library/_common.md: the modelling rules, data rules and examine voice. Follow them; for the
  examine voice use Club Gnome's setting instead of Fescue's where it fits: the Yard's town square, the Gnomecino
  casino (neon, card room called the Pub, "the house is also a gnome"), acorns as money. Never mention humans.
- packages/prefabs/src/types.ts (`PrefabDef`, `Part`, `PrefabWear`), packages/prefabs/src/palette.ts.
- Worn examples: `dealer-visor` at the end of packages/prefabs/src/catalog/casino.ts (head), the cosmetics in
  packages/prefabs/src/catalog/cosmetics-head-a.ts (head), cosmetics-neck.ts (neck), cosmetics-back.ts (back), and
  `stout-tankard` (search the catalog) for a held hand item with `grip`.
- packages/gnome/src/gear-clearance.ts: neck gear must clear the head by `MIN_GEAR_GAP`.

## Change
- packages/prefabs/src/catalog/club-gnome-shop.ts: keep the six ids, names, categories and uses; replace each
  placeholder's `about`, `examine` (5 lines in the voice), `tags` (keep the given ones, add more) and `parts`:
  - high-roller-top-hat (wear-head): tall black top hat (crown cylinder ~0.22 tall on a brim ring ~0.17 radius), a gold
    band, a playing card (white box with a red mark) tucked upright in the band.
  - cherry-jackpot-crown (wear-head): a gold band crown with 5 points, three of them topped with two red cherry balls
    on green stems; small 'glow' gems optional.
  - card-fan (hold): five thin card boxes (0.07 x 0.1 x 0.004) fanned around their bottom corner from -40 to +40
    degrees about z, white with a black or red pip box each, on a short handle at the bottom; `grip` at the handle.
  - chip-stack-tower (hold): a stack of 8 chip cylinders (r 0.035, h 0.012) in alternating red, white, black, gold,
    slightly offset in x so it wobbles; `grip` at the bottom chip.
  - jackpot-chip-medallion (wear-neck): a thin gold chain (two curved arcs of small balls or a torus) hanging at the
    front of the neck, holding a big chip disc (cylinder r ~0.05, h 0.01, gold with a red rim ring) facing +z at about
    z 0.15. It MUST pass gear clearance (the placeholder sits at [0, 0.005, 0.15]: stay at z >= 0.13 for the disc).
  - overflowing-acorn-sack (wear-back): a burlap sack (squashed ball) with a tied neck, and 5-7 small gold acorns
    (ball + cap) heaped on top and one spilling down the side; tags include money, rich.
  Keep each one gnome-sized (head items about the size of dealer-visor; the sack about 0.35 tall).

## Done when
- `npm test -w packages/prefabs` passes (every test whose name has one of the six ids).
- `npm test -w packages/gnome` passes (neck gear clearance).
- `npm test -w packages/achievements` passes.

## Out of scope
Every other file. Do not rename ids (achievements and Club Gnome's shop already use them).
~~~~

### 2E: shop furniture for Acorn Row (prefabs)

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Another worker is editing packages/prefabs/src/catalog/club-gnome-shop.ts (no s) at the same time; edit only
  club-gnome-shops.ts.

## Goal
Four furniture props for Club Gnome's new shops, now placeholder boxes in
packages/prefabs/src/catalog/club-gnome-shops.ts: a barber chair and a salon mirror (Gnome Salon), a changing screen
(the Gnome Market's dressing room) and a "Coming soon" placard on an easel (the furniture shop, not open yet).

## Read first
- docs/roadmaps/prefab-library/_common.md: modelling and data rules and the examine voice (use Club Gnome's setting:
  the Yard's town, Acorn Row's shops; never mention humans).
- packages/prefabs/src/types.ts, packages/prefabs/src/palette.ts.
- packages/prefabs/src/catalog/furniture.ts: `armchair`, `wardrobe` and `chair` as examples (a `sit` prefab needs `seat`).

## Change
- packages/prefabs/src/catalog/club-gnome-shops.ts: keep the four ids, names, categories and uses; write `about`,
  5 `examine` lines, more `tags`, and real `parts`:
  - barber-chair (sit, place): padded seat and back (tint-able leather, set `tint`), chrome pedestal and round base,
    footrest bar, two armrests; about 0.6 wide, 1.0 tall. Keep `seat` at the top of the cushion (adjust its y).
  - salon-mirror (place): a tall wooden frame (~0.8 wide, ~1.6 tall) on two feet, a pale-blue glassy mirror plane
    (box 0.01 deep, alpha 0.7) on its front (+z), a small shelf below the mirror with a comb, a pair of scissors (two
    thin boxes crossed) and a bottle.
  - changing-screen (place): three cloth panels (each ~0.45 wide, 1.5 tall) on thin wooden frames, the outer two angled
    30 degrees toward +z; cloth uses `tint` (set a default tint), frames `trim`.
  - coming-soon-placard (place): a wooden easel (three legs) holding a board ~0.7 wide, 0.5 tall; on the board, a
    painted look: a cream board, a red banner stripe box across it and a few dark "letter" boxes. (Text cannot be
    drawn; the shape reads as a sign.)

## Done when
- `npm test -w packages/prefabs` passes (all tests with these four ids).
- `npx vitest run --root games/club-gnome src/maps.test.ts` passes (the new maps place these props; the test checks
  they exist and that solid ones have blockers).

## Out of scope
Every other file, including the maps. Do not rename ids.
~~~~

### 2F: the Prize Counter and the Gnome Market panels

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
  If tsc reports errors in a file you do not own, ignore them; your own files must be clean.
- Do not start a dev server.
- Phone first: 44 px touch targets, the panel must work at 390x844 portrait (one column there, two columns from
  560 px wide), no hover-only UI. Append only inside the panel `openPanel` gives you.

## Goal
In Club Gnome, walking up to the Gnomecino Prize Counter opens a shop of 6 casino cosmetics for chips plus 6 "Coming
soon" placards; walking up to the Gnome Market counter opens a shop of 6 items for acorns. Buying records the item in
the Oakcount and unlocks its achievement, whose reward is the item, so the gnome can wear it in every game.

## Read first
- games/club-gnome/src/panel.ts: `openPanel(ui, { title, subtitle, onClose })` returns `{ body, close }`; button classes
  `cgp-btn` and `cgp-btn alt`; `PanelCtx` (`ui`, `system`, `npcSay`).
- games/club-gnome/src/shops/catalog.ts: `ShopItem`, `ComingSoonItem`, `PRIZE_ITEMS`, `PRIZE_COMING_SOON`, `MARKET_ITEMS`.
- games/club-gnome/src/shops/prizes.ts and market.ts: the stubs (signatures to keep).
- games/club-gnome/src/achievements.ts: `onShopBuy(achievementId): Promise<void>`.
- packages/oakcount/src/index.ts: `getAcorns`, `getChips`, `owns`, `buyItem(id, price, currency)`, `onOakcountChange`.
- `prefabIconElement(prefabId, fallbackEmoji, sizePx)` from '@lawn/prefabs' (returns an element to append).

## Change
- games/club-gnome/src/shops/shopGrid.ts (new): `export function renderShop(ctx: PanelCtx, panel: Panel, opts: {
  items: readonly ShopItem[]; currency: 'acorns' | 'chips'; keeperId: string; thanks: string[]; hint: string }): () => void`
  (returns an unsubscribe to call on close). It renders into `panel.body`:
  - a balance line: '🌰 <acorns>' for acorns or '🪙 <chips>' for chips, kept current with onOakcountChange;
  - the hint line (small text);
  - a grid of item cards: icon (prefabIconElement(item.prefabId, '🎁', 56)), name (bold), slot word ('Head', 'Neck',
    'Back', 'Hand'), blurb, price ('🌰 60' or '🪙 800', numbers with toLocaleString('en-US')), and one button:
    'Owned ✓' (disabled) when owns(item.id); 'Buy' otherwise, disabled with text 'Need <n> more' when the balance is
    too low. Two-tap confirm: the first tap changes the text to 'Tap again to buy', a second tap within 4 s buys:
    `buyItem(item.id, item.price, currency)`; on success `await onShopBuy(item.achievementId)`, then
    `ctx.npcSay(keeperId, <next line of thanks>)` and `ctx.system('You bought the <name>! Wear it in the dressing room
    on Acorn Row or in the Gnome Creator.')`, and re-render the cards.
  - When the shop opens, call `onShopBuy(item.achievementId)` for every item already owned (repairs a purchase whose
    achievement did not save; it shows no toast when already unlocked).
  - Card grid: CSS grid, `grid-template-columns: 1fr` below 560 px and `1fr 1fr` from 560 px (inject one <style>
    element with id 'cg-shop-style', class names prefixed 'cgs-').
- games/club-gnome/src/shops/prizes.ts: `openPrizeCounter(ctx)`: `openPanel(ctx.ui, { title: 'Prize Counter',
  subtitle: "Fennel Brassbell: 'Chips for prizes, dear. The house loves a winner who spends.'" })`, then renderShop
  with PRIZE_ITEMS, 'chips', keeperId 'fennel-brassbell', a few dry thank-you lines, hint 'Get chips from the Cashier
  next door: 1 acorn = 10 chips.'. Below the grid, a 'Coming soon' heading and a grid of six placards from
  PRIZE_COMING_SOON: a card with a dashed border, the emoji icon large, the name, the slot word, the blurb and a
  small 'COMING SOON' ribbon (no button). Unsubscribe on close.
- games/club-gnome/src/shops/market.ts: `openMarket(ctx)`: `openPanel(ctx.ui, { title: 'Gnome Market', subtitle:
  "Marjoram Crate: 'Fresh in today. Well, this week.'" })`, renderShop with MARKET_ITEMS, 'acorns', keeperId
  'marjoram-crate', thank-you lines, hint 'Try things on in the dressing room at the back.'.

## Contract
Keep `openPrizeCounter(ctx: PanelCtx): void` and `openMarket(ctx: PanelCtx): void` exactly.

## Done when
- `npx tsc --noEmit -p games/club-gnome` has no errors in shops/shopGrid.ts, shops/prizes.ts, shops/market.ts.
- `npx vitest run --root games/club-gnome src/shops` passes.

## Out of scope
shops/catalog.ts, shops/cashier.ts (another worker), panel.ts, main.ts, everything else.
~~~~

### 2G: the Gnomecino Cashier panel

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
- Do not start a dev server.
- Phone first: 44 px touch targets, works at 390x844 portrait, no hover-only UI.

## Goal
At the Gnomecino Cashier, Clary Tillbox trades acorns for chips, one way (chips never turn back into acorns).

## Read first
- games/club-gnome/src/panel.ts: `openPanel`, `PanelCtx`, classes `cgp-btn` / `cgp-btn alt`.
- games/club-gnome/src/shops/cashier.ts: the stub (keep `openCashier(ctx: PanelCtx): void`).
- packages/oakcount/src/index.ts: `OAK.chipsPerAcorn` (10), `getAcorns`, `getChips`, `buyChips(acorns)`, `onOakcountChange`.

## Change
- games/club-gnome/src/shops/cashier.ts: `openCashier(ctx)` opens a panel (title 'Cashier', subtitle "Clary Tillbox:
  'Acorns in, chips out. No refunds. The house has to eat.'") with:
  - balances: '🌰 <acorns> acorns' and '🪙 <chips> chips' (toLocaleString('en-US')), live via onOakcountChange
    (unsubscribe in onClose);
  - the rate line: '1 acorn = 10 chips. Chips can't be turned back into acorns.' (use OAK.chipsPerAcorn);
  - four buttons in a wrapping row: '10 🌰 → 100 🪙', '50 🌰 → 500 🪙', '100 🌰 → 1,000 🪙', and 'All my acorns'
    (shows the computed chips). Disabled when you have fewer acorns than that (and 'All' when you have 0).
    One tap trades (no confirm under 100 acorns; 'All my acorns' and the 100 button need a second tap within 4 s,
    text 'Tap again to trade'). On success: ctx.npcSay('clary-tillbox', one of 3-4 dry lines), ctx.system(`You traded
    ${a} acorns for ${c} chips.`).
  - a note: 'Spend chips at the Prize Counter.'
  - when you have no acorns: a line 'No acorns? Look under the trees outside, and come back every day for a gift.'

## Done when
- `npx tsc --noEmit -p games/club-gnome` has no errors in shops/cashier.ts.

## Out of scope
Every other file.
~~~~

### 2H: the dressing room and the salon in Club Gnome

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
  If tsc reports errors in a file you do not own, ignore them; your own files must be clean.
- Do not start a dev server.
- Phone first. UI goes in its own container appended to `ctx.ui`; never restyle or hide #ui.

## Goal
In Club Gnome, the dressing room (Gnome Market, Poppy Thimble) and the Gnome Salon (Lavender Shearwell) open the
shared gnome studio full screen over the town: the dressing room edits clothes colours, features and gear; the salon
edits hair (and sells hair styles for acorns). Saving changes my gnome in the town at once.

## Read first
- games/club-gnome/src/studioRoom.ts: the stub (keep `openStudio(ctx: PanelCtx, mode: 'dressing' | 'salon'): void`).
- games/club-gnome/src/panel.ts: `PanelCtx` (`ui`, `system`, `npcSay`, `onLookSaved`, `setTownHidden`), `closePanel`.
- packages/gnome-editor/src/studio.ts: `createGnomeStudio(opts): Promise<Studio>` and `StudioOptions` (canvas, ui,
  mode, title, onClose, onSaved, hairPrices, onHairBought). Another worker is implementing its body now; code against
  the types.
- games/club-gnome/src/shops/catalog.ts: `HAIR_PRICES`.
- games/club-gnome/src/achievements.ts: `onHairBought()`.

## Change
- games/club-gnome/src/studioRoom.ts: `openStudio(ctx, mode)`:
  1. If a studio is already open, do nothing. `closePanel()`.
  2. Create a container div (position:fixed; inset:0; z-index:45; pointer-events:auto; background:#8fd3f4) with a
     <canvas> (display:block; width:100vw; height:100vh; height:100dvh) and append it to ctx.ui. Stop pointerdown and
     keydown events from leaving the container (stopPropagation), except let Escape close the studio.
  3. `ctx.setTownHidden(true)`.
  4. `const studio = await createGnomeStudio({ canvas, ui: container, mode, title: mode === 'salon' ? 'GNOME SALON' :
     'DRESSING ROOM', onClose: close, onSaved: () => { ctx.onLookSaved(); ctx.npcSay(keeper, <a line>); },
     hairPrices: mode === 'salon' ? HAIR_PRICES : undefined, onHairBought: () => { onHairBought(); } })`
     where keeper is 'lavender-shearwell' (salon) or 'poppy-thimble' (dressing).
  5. `close()`: studio.dispose(), remove the container, `ctx.setTownHidden(false)`, and `ctx.system(...)` with a short
     line ('You leave the salon.' / 'You step out of the dressing room.'). Safe to call twice.
  6. If createGnomeStudio throws, close and `ctx.system('The studio could not open.')`.
  Saved looks reach other players through ctx.onLookSaved (main.ts reloads my gnome and rejoins with the new look).

## Done when
- `npx tsc --noEmit -p games/club-gnome` has no errors in studioRoom.ts.

## Out of scope
packages/gnome-editor (other workers), main.ts, panel.ts, everything else.
~~~~

### 2I: Chicory Waymark, the guide

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
- Do not start a dev server.
- Phone first: 44 px touch targets, works at 390x844 portrait, no hover-only UI.

## Goal
New players meet Chicory Waymark by the fountain (the spot they arrive at). Tapping Chicory (or the action button
"Talk to Chicory, the guide", or a ❓ Help button on the HUD) opens a friendly panel with three questions. Each answer
is one or two short sentences: players will not read more. Chicory is optional but obvious: until the player has
opened the guide once, Chicory calls out every so often.

## Read first
- games/club-gnome/src/guide.ts: the stub (keep `openGuide(ctx)` and `initGuide(ctx, addTopControl)` exactly).
- games/club-gnome/src/panel.ts: `openPanel`, `PanelCtx`, button classes.
- games/club-gnome/src/config.ts: `STORAGE.guideSeen`.

## Change
- games/club-gnome/src/guide.ts:
  - `openGuide(ctx)`: mark seen (localStorage STORAGE.guideSeen = '1', in try/catch). Open a panel: title
    "Hi! I'm Chicory.", subtitle 'Ask me anything. Tap a question.'. Three big buttons, full width, stacked (class
    'cgp-btn alt', min-height 52px, left-aligned text, an emoji first): '🗺️ Where am I?', '🎮 How do I play games?',
    '🌰 What are acorns?'. Tapping one shows its answer in a speech-bubble box above the buttons (replacing the last
    answer) and marks that button as chosen. The answers, verbatim:
    - Where am I? → "This is Club Gnome, the town square every player shares. Walk around, say hi, and step through
      any door to play what's inside."
    - How do I play games? → "Walk up to a door, cabinet or table and tap the yellow button. In a hurry? Press
      Shift+Tab, or tap the Arcade tab at the top, to pick any game."
    - What are acorns? → "Acorns are your money, kept in your Oakcount (top left). Pick them up under the trees, then
      spend them on Acorn Row or trade them for Gnomecino chips."
    Under the buttons, one 'Thanks, Chicory!' button (class 'cgp-btn') that closes the panel and makes Chicory say
    'Have fun! I'm always by the fountain.' via ctx.npcSay('chicory-waymark', ...).
    The answer box has `aria-live="polite"`.
  - `initGuide(ctx, addTopControl)`: add a ❓ Help button through addTopControl (a <button>, min 44x44px, dark pill
    like the HUD: background rgba(20,20,28,0.78), white text '❓ Help') that calls openGuide(ctx). Until the guide has
    been seen: right away and then every 14 s, `ctx.npcSay('chicory-waymark', line)` cycling through
    ['New here? Tap me!', 'Psst! I know where everything is.', 'Questions? Tap me, I don't bite.'], and pulse the Help
    button (a CSS animation class, 2 s); stop both once seen. (npcSay does nothing when Chicory is on another map,
    so no map check is needed.)

## Done when
- `npx tsc --noEmit -p games/club-gnome` has no errors in guide.ts.
- The three answers are exactly the text above.

## Out of scope
Every other file (main.ts already calls openGuide and initGuide; the guide NPC itself is drawn by another worker).
~~~~

### 2J: NPC gnomes (the guide, shopkeepers, townsfolk)

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
- Do not start a dev server.

## Goal
Club Gnome gets computer-controlled gnomes: the guide by the fountain, six shopkeepers behind their counters, and
townsfolk strolling around. Their place is a pure function of the clock, so every player online sees them in the
same spot without any network messages.

## Read first
- games/club-gnome/src/config.ts: `NpcDef` (id, name, map, path, facing, look, color, lines, counter), `NPC_ID_BASE`,
  `AvatarPose`, `MapId`.
- games/club-gnome/src/npcs.ts and npcData.ts: the stubs (keep `createNpcs(avatars): Npcs` and the `Npcs` interface:
  load, update, say, talk, npcNear).
- games/club-gnome/src/avatars.ts: the `Avatars` interface (upsert, remove, has, setPose, say).
- games/club-gnome/src/walk.ts: `isBlocked(map, x, z)`; games/club-gnome/src/maps.ts: `MAPS`.
- games/club-gnome/src/main.ts: search `npcs.` to see how it is called (load on every map change right after
  `avatars.removeAllExcept(ME)`; update every frame with Date.now(); npcNear on a ground tap; talk; say).

## Change
- games/club-gnome/src/npcData.ts: `export const NPCS: readonly NpcDef[]` with:
  - Standing (path of one point, facing given, `counter` set). Looks are yours to pick (distinct, readable); colour
    numbers 0xRRGGBB:
    | id | name | map | at | facing | counter | look notes |
    | chicory-waymark | Chicory Waymark | town | (2.6, 6.6) | -1.8 | guide | sunflower-yellow hat, sky-blue shirt, glasses, white beard |
    | clary-tillbox | Clary Tillbox | gnomecino | (2, -8.4) | 0 | counter-cashier | equipment { head: 'dealer-visor' }, waistcoat-dark shirt |
    | fennel-brassbell | Fennel Brassbell | gnomecino | (7, -8.4) | 0 | counter-prizes | equipment { head: 'high-roller-top-hat' } |
    | marjoram-crate | Marjoram Crate | market | (-3, -5.3) | 0 | counter-market | apron-green shirt, hair { style 'bun' } |
    | poppy-thimble | Poppy Thimble | market | (7.6, -2.6) | -1.5708 | counter-dressing | dress true, hair { style 'braid' } |
    | lavender-shearwell | Lavender Shearwell | salon | (0, -4.4) | 0 | counter-salon | lavender hat, hair { style 'curls' } |
    | hazel-dovetail | Hazel Dovetail | row | (12.6, -1.6) | 0.4 | counter-furniture | sawdust-brown shirt, beard |
  - Townsfolk (no counter), 7 of them with these names: Thistle Mugsworth, Clover Pegg, Burdock Ladle, Primrose
    Kettleby, Sage Bucketby, Dill Spindle, Rosemary Brickwell. Put 3 in town, 2 in park, 1 in row, 1 in gnomecino.
    Each walks a loop of 3-5 waypoints you choose; use the town loop [(-4.5,-2.2),(4.5,-2.2),(4.5,2.2),(-4.5,2.2)]
    for one of the town walkers. Every waypoint must be unblocked, and so must the straight line between consecutive
    waypoints, including last back to first (`isBlocked(MAPS[map], x, z)` false, sampled every 0.25 units). Avoid
    portals (stay 1.5 away from every portal of the map) and the dark road band of the town (|z| in 4.0..5.6 for
    |x| < 10.3, and |x| in 8.7..10.3 for |z| < 5.6).
  - Every NPC gets 3 short lines (under 70 characters each). Shopkeepers talk about their shop; townsfolk about town
    life, acorns, the fountain, the mowers that cross the square. Dry, gentle humour; no pop culture; no humans;
    names follow docs/lore/canon.md's house style.
  - `color` (name tag): a light colour per NPC.
- games/club-gnome/src/npcs.ts:
  - `export function npcPose(def: NpcDef, nowMs: number): AvatarPose` (pure): one-point path = stand there, facing
    def.facing, moving false. A loop: walk at 1.1 units/s along the closed polyline, starting at a per-NPC phase
    (hash of the id, so they do not all start together), pausing 2 s at each waypoint (moving false while paused);
    facing = atan2(dx, dz) of the current segment (yaw 0 faces +z). busy false.
  - `createNpcs(avatars)`: NPC i has avatar id `NPC_ID_BASE - i` (index in NPCS). `load(map)`: upsert every NPC of
    that map (`avatars.upsert(id, def.look as GnomeLook, def.name, def.color)`), remember which are shown.
    `update(nowMs)`: `avatars.setPose(id, npcPose(def, nowMs))` for each shown NPC. `say(npcId, text)`: if shown,
    `avatars.say(id, text)`. `talk(npcId)`: say the NPC's next line (per-NPC counter). `npcNear(x, z, r = 0.9)`: the
    nearest shown NPC whose current pose is within r, or null.
- games/club-gnome/src/npcs.test.ts (new): every NPC's map exists; ids unique; standing NPCs' counters exist in that
  map's `counters`; every loop waypoint and segment sample is unblocked and 1.5 away from portals (the rule above);
  npcPose is deterministic (same input, same output) and a walker moves between two times 3 s apart.

## Done when
- `npx vitest run --root games/club-gnome src/npcs.test.ts` passes.
- `npx tsc --noEmit -p games/club-gnome` has no errors in npcs.ts, npcData.ts, npcs.test.ts.

## Out of scope
main.ts, avatars.ts, config.ts, the maps, everything else.
~~~~

### 2K: acorn pickups and the wallet pill

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Eleven other workers are editing other files in this repo at the same time. Edit ONLY the files this issue names.
- Do not start a dev server.
- Phone first: the pill is readable at 390 px wide, no hover-only UI.

## Goal
Acorns lie around outdoors in Club Gnome (under the trees and bushes of the town, Links Park and Acorn Row). Walking
over one adds 5 acorns to the Oakcount. A new set appears every 2 hours. A pill under the map name shows
'🌰 123 · 🪙 4,560' and stays current.

## Read first
- games/club-gnome/src/pickups.ts and walletHud.ts: the stubs (keep `createPickups(world, onPicked): Pickups` with
  load/update, and `createWalletHud(addTopControl)`).
- games/club-gnome/src/config.ts: `PICKUPS` (acorns, perMap, slotMinutes, radius), `STORAGE.pickups`, `MapDef`,
  `MAP_IDS`.
- games/club-gnome/src/walk.ts: `isBlocked(map, x, z)`, `portalAt`.
- games/club-gnome/src/world.ts: `World.scene` (add your own THREE.Group to it; world.load only clears its own map group).
- packages/prefabs/src/drop.ts: `createDrop(id, { fit })` returns `{ object, update(dt) }` (a hovering, turning pickup).
  Do NOT pass `glow` (its flat disc would z-fight the floor patches).
- packages/oakcount/src/index.ts: `earnAcorns(n)`, `getAcorns`, `getChips`, `onOakcountChange`.
- games/club-gnome/src/main.ts: search `pickups` and `createWalletHud` to see how they are called.

## Change
- games/club-gnome/src/pickups.ts:
  - `export function pickupSpots(map: MapDef, slot: number): { id: string; x: number; z: number }[]` (pure):
    indoor maps → []. Candidates: for every prop whose prefab is 'broadleaf-tree', 'cone-pine', 'round-bush' or
    'flowering-bush', the point 1.1 units in front of it (+z), then the point 1.1 to its right if the first is
    blocked. Keep a candidate only if `!isBlocked(map, x, z)` and it is at least 1.5 from every portal centre. Shuffle
    the candidates with a seeded RNG (mulberry32 with seed `slot * 7919 + index of map.id in MAP_IDS`) and take the
    first PICKUPS.perMap. id = `${map.id}:${Math.round(x*10)}:${Math.round(z*10)}`.
  - `createPickups(world, onPicked)`: one THREE.Group added to world.scene. `load(map)`: clear the group, compute the
    current slot `Math.floor(Date.now() / (PICKUPS.slotMinutes * 60000))`, read STORAGE.pickups (JSON { slot, ids };
    a different slot means nothing is collected yet), and add a `createDrop('acorn', { fit: 0.3 })` at each spot not
    yet collected. `update(dt, x, z)`: drop.update(dt) for each; when one is within PICKUPS.radius of (x, z): remove
    it, store its id (try/catch around localStorage), `earnAcorns(PICKUPS.acorns)` and `onPicked(PICKUPS.acorns)`.
    If the slot changed while on the map, reload the spots.
- games/club-gnome/src/pickups.test.ts (new): for MAPS.town, MAPS.park and MAPS.row, `pickupSpots(map, 5)` returns
  PICKUPS.perMap spots (or all candidates if fewer), all unblocked, deterministic for the same slot, different for
  another slot; `pickupSpots(MAPS.gnomecino, 5)` is [].
- games/club-gnome/src/walletHud.ts: `createWalletHud(addTopControl)`: a pill element (background rgba(20,20,28,0.72),
  white, border-radius 14px, padding 6px 12px, font-weight 700, min-height 32px, `role="status"`, aria-label
  'Oakcount: N acorns, M chips') with the text `🌰 ${acorns} · 🪙 ${chips}` (toLocaleString('en-US')), passed to
  addTopControl once, updated on every onOakcountChange. When acorns go up, play a short scale pulse (CSS animation,
  0.4 s, injected once in a <style id="cg-wallet-style">).

## Done when
- `npx vitest run --root games/club-gnome src/pickups.test.ts` passes.
- `npx tsc --noEmit -p games/club-gnome` has no errors in pickups.ts, pickups.test.ts, walletHud.ts.

## Out of scope
main.ts, world.ts, config.ts, everything else.
~~~~

### 2L: lore for Acorn Row, the Oakcount, the shopkeepers and the guide

~~~~text
Epic: 2 (Club Gnome Oakcount)
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\dace (a git worktree). Run every command from there.
- Shell: Git Bash. If `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- Other workers are editing code at the same time; edit only files under docs/lore/.

## Goal
The lore knows Club Gnome's new places and people: Acorn Row (the Gnome Market with its dressing room, the Gnome
Salon, Dovetail Furniture, not open yet), the Gnomecino's Cashier and Prize Counter, the Oakcount (every gnome's acorn
account), the six shopkeepers and Chicory Waymark the guide, who is allowed to speak to the player a little like a
game's helper.

## Read first
- docs/lore/README.md: the entry schema (front matter fields, kinds, tiers, sections "What gnomes say",
  "In the games", "Loose threads"), how to add a ruling.
- docs/lore/canon.md: the core and the house style (names; dry jokes; no fourth-wall jokes; no humans).
- docs/lore/entries/the-yard/club-gnome.md, gnomecino.md, mallow-clayfoot.md (a person entry to copy).
- docs/lore/entries/core/acorns.md.
- docs/lore/rulings.md: the last ruling is R-053; append R-054 and R-055 in the same format.

## Change
- New entries in docs/lore/entries/the-yard/ (tier game, setting the-yard, status canon, games [club-gnome],
  sources [games/club-gnome/src/npcData.ts, games/club-gnome/src/data/levels/<map>.level.json, docs/roadmaps/club-gnome-oakcount.md]):
  - acorn-row.md (kind place): the shopping street south of the square, reached by the path past the Gnome Creator
    statue. The Gnome Market (Marjoram Crate's; the dressing room at the back is Poppy Thimble's), the Gnome Salon
    (Lavender Shearwell's), Dovetail Furniture (Hazel Dovetail's, "coming soon": huts and furniture are a loose thread).
  - oakcount.md (kind concept): a gnome's acorn account, the one purse every game shares. Acorns go in from the
    welcome gift, the daily visit gift and acorns found under the trees; out at the shops; and one way into Gnomecino
    chips (chips never turn back into acorns: the house keeps acorns). Who keeps the Oakcount's books is a loose thread.
  - chicory-waymark.md (person): the guide by the fountain; knows where everything is; cheerful; glasses; the one
    gnome who talks to the player as a player (see R-054).
  - clary-tillbox.md (person): Gnomecino cashier behind the cage; dry; "no refunds".
  - fennel-brassbell.md (person): keeps the Prize Counter; wears a High Roller Top Hat; loves a winner who spends;
    six prizes still "in the workshop" (coming soon).
  - marjoram-crate.md (person): runs the Gnome Market; sells staffs, flasks, lanterns, rods and a guitar.
  - poppy-thimble.md (person): dressing room attendant; tailor's eye; says everyone looks lovely.
  - lavender-shearwell.md (person): stylist at the Gnome Salon; the one who can cut hair under a gnome's hat without
    taking it off (canon: a gnome's hat is who they are, so it never comes off: hair styles change under the hat).
  - hazel-dovetail.md (person): furniture maker, shop not open yet; sawdust; "save your acorns".
  - club-gnome-townsfolk.md (kind group, or the closest kind the README allows): Thistle Mugsworth, Clover Pegg,
    Burdock Ladle, Primrose Kettleby, Sage Bucketby, Dill Spindle, Rosemary Brickwell, regulars who stroll the square,
    the park and Acorn Row.
  Each entry: a one-paragraph summary, 3 "What gnomes say" lines, "In the games" (Club Gnome, where they stand), and
  at least one loose thread. `related:` links to club-gnome, and to each other where it fits.
- docs/lore/entries/the-yard/club-gnome.md: update "In the games": seven places (add Acorn Row, the Gnome Market, the
  Gnome Salon), the guide by the fountain, townsfolk; add related ids (acorn-row, oakcount, chicory-waymark).
- docs/lore/entries/the-yard/gnomecino.md: add the Cashier (Clary Tillbox) and the Prize Counter (Fennel Brassbell).
- docs/lore/entries/core/acorns.md: add club-gnome to `games:` and an "In the games" line: Club Gnome keeps them in
  the Oakcount ([oakcount](../the-yard/oakcount.md)).
- docs/lore/rulings.md: append
  - R-054. Question: Chicory Waymark explains Club Gnome to new players ("tap the yellow button", "press Shift+Tab");
    the house style says no fourth-wall jokes. Ruling: Chicory alone may speak to the player as a player, plainly and
    briefly, like a game's helper, only to explain controls and places. It is help, not a joke; nobody else in the
    Yard does it, and Chicory never explains why they can. Applies to: club-gnome. Why: new players need one clear
    voice; keeping it to one gnome keeps the rest of the Yard in-world.
  - R-055. Question: what are Club Gnome's acorns and chips? Ruling: acorns are a gnome's own treasure kept in the
    Oakcount, shared by every game; the Gnomecino sells chips for acorns and never buys them back (the house keeps the
    acorns), and chips buy only Prize Counter prizes. Applies to: club-gnome (the-yard). Why: one currency across
    games, and a one-way casino currency that cannot leak back into the rest of the economy.
  Use today's date 2026-11-23.

## Done when
- `npm run lore` passes (it validates every entry and regenerates INDEX.md; commit-ready).
- `npm run lore -- find Chicory` and `npm run lore -- find Oakcount` find the new entries.

## Out of scope
Anything outside docs/lore/. Do not rename existing entries.
~~~~
