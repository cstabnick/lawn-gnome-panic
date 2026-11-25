Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`winter/winterApp.ts` adds the "Snowdrop" Gnomlet app (best times and run counts for the Wool Run and the Tea-Tray Run,
ice catches, bears hugged, buttons "Ski the Wool Run", "Sled the Tea-Tray Run", "Drop my sled here") and registers the Hot
Cocoa snack item.

## Read first
- `games/gnome-theft-auto/src/winter/winterApp.ts`: the stub (`HOT_COCOA_ID`, `registerWinterItems()`,
  `WinterAppCtx`, `registerWinterApp(ctx)`); keep the signatures.
- `games/gnome-theft-auto/src/winter/types.ts`: `WINTER_APP_ID` ('ski-runs'), `WOOL_RUN`, `TEA_TRAY_RUN`,
  `BLACK_DIAMOND_S`, `BEAR_HUG_TARGET`, `ICE_STATION_TARGET`, `WinterSave`.
- `games/gnome-theft-auto/src/winter/save.ts`: `WinterStore` (`data()`, `hasSled()`); another worker fills it in now.
- `games/gnome-theft-auto/src/winter/course.ts`: `formatTime(seconds)` ("0:31.4"; a stub until its worker lands).
- `games/gnome-theft-auto/src/gnomlet/registry.ts`: `registerGnomletApp`, `GnomletApp` (`open(root, ctx)` returns a
  cleanup), groups.
- `games/gnome-theft-auto/src/home/runtime.ts` lines 100-200: an in-tablet app (the Home app) built with plain DOM, for
  structure and class names.
- `games/gnome-theft-auto/src/inventory.ts`: `ItemDef`, `registerItem`, `itemDef`.

## Change
- `src/winter/winterApp.ts`:
  - `registerWinterItems()`: `registerItem({ id: HOT_COCOA_ID, name: 'Hot Cocoa', prefab: 'cocoa-mug', kind: 'snack',
    heal: 0.35, price: 6, blurb: 'Brown, sweet and too hot. Gentian says three marshmallows is a rule.' })` once (skip if
    `itemDef(HOT_COCOA_ID)` already exists).
  - `registerWinterApp(ctx)`: `registerGnomletApp({ id: WINTER_APP_ID, label: 'Snowdrop', icon: '🎿', group: 'fun',
    order: 30, detail, open })`:
    - `detail()`: the Wool Run best as `formatTime` or 'no runs yet'.
    - `open(root, ctx2)`: a scrollable panel built with DOM (`document.createElement`), no innerHTML with user data:
      - Title row "Snowdrop Slope".
      - One card per run (`WOOL_RUN`, `TEA_TRAY_RUN`): name, best (`formatTime`) or '—', runs finished, and for the Wool
        Run "Black Diamond: clean in ≤ 26.0 s" with a tick when `best <= BLACK_DIAMOND_S` and clean runs > 0; a button
        "Ski it" / "Sled it" calling `ctx.startRun(id)`; on a returned error string show it in a status line, on null
        close the tablet (`ctx2.close()`).
      - A "Pail Pond" card: ice catches `n / ICE_STATION_TARGET` (keep counting past it), holes drilled.
      - A "Bears" card: bears hugged `n / BEAR_HUG_TARGET`, line "They will barely notice."
      - If `store.hasSled()`: a button "Drop my sled here" calling `ctx.dropSled()`; error -> status line, null -> close.
        Else a line "Buy a tea tray to keep at the Woolly Sock Lodge (30 Acorns)."
      - Buttons are real `<button>`s at least 44 px tall, `pointerdown`-safe (use `click`; the tablet maps A/Enter to
        click), fit a 390 px wide screen (no fixed widths over 340 px).
      - Return a cleanup that removes the panel.
- New `src/winter/winterApp.test.ts`: with `installFakeDom()` from `../testing/fakeDom` if the registry needs a DOM:
  `registerWinterItems()` twice registers one item with id 'hot-cocoa'; `registerWinterApp(ctx)` with a fake ctx makes
  `getGnomletApp('ski-runs')` exist with label 'Snowdrop'; opening it into a detached `div` shows "the Wool Run" text and
  clicking the first run button calls `ctx.startRun('wool-run')`.

## Contract
App id `ski-runs` (WINTER_APP_ID), item id `hot-cocoa`, prefab `cocoa-mug` (another worker's prefab).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter/winterApp.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/winter/winterApp*.ts`.
- The panel fits 390x844 (no horizontal overflow: no element wider than the root).

## Out of scope
Every other file (`winter/runtime.ts` calls `registerWinterItems` and `registerWinterApp`).
