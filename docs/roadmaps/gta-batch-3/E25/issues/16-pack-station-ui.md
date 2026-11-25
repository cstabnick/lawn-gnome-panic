Epic: E25-2 (jobs III, parallel build)
Depends on: none (orders.ts is filled in parallel; its stub returns a valid one-item order, enough to build against)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Minigame-feel issue: the packing shift should be a busy, funny,
satisfying 2.5 minutes on a phone. No dev server needed (the runtime opens it later); a throwaway harness is fine if
you delete it.

## Goal
`gnomazon/packUi.ts`: the Gnomazon packing station, a full-screen DOM minigame: an order slides in on the belt, pick
its items off a shelf grid, choose the box size, tape it, pick the right label, send it; a shift clock, a quota bar,
Kippy's lines; results back to the runtime.

## Read first
- `games/gnome-theft-auto/src/workplaces/gnomazon/types.ts`: `PackOpts`, `PackSession`, `ShiftResult`, `Order`,
  `PackedParcel`, `ParcelScore`, `BOX_SIZES`, `BOX_CAP`, `GNOMAZON` (shiftS, idleS).
- `games/gnome-theft-auto/src/workplaces/gnomazon/orders.ts`: `STOCK`, `stockItem`, `makeOrder(level, seed, id)`,
  `scoreParcel`, `KIPPY_LINES`.
- `games/gnome-theft-auto/src/workplaces/chef/kitchenUi.ts`: E24's full-screen job UI (container on `ui`, CSS injected
  once, layout for portrait and landscape, a timer, closing and callbacks). Follow its structure.
- `packages/prefabs/README.md` "Use it": `prefabIconElement(id, emoji, size)` from '@lawn/prefabs' for item icons.

## Change
- `games/gnome-theft-auto/src/workplaces/gnomazon/packUi.ts`: `openPackStation(ui, opts)`:
  - Container id `gta-pack-ui`, full screen, warehouse colours (grey, orange accents), safe-area aware; portrait
    (390x844) and landscape (844x390) layouts; every target >= 44 px; `pointerdown` for taps.
  - Top bar: level title, shift clock (mm:ss from `opts.shiftS`), quota bar `sent / quota` (turns green when met),
    a Kippy speech bubble (the last line, also sent to `opts.kippy`), "Clock out" (44 px).
  - The belt: the current order slip slides in from the right (CSS transition): item icons with counts, then (after
    the box is taped) the three label choices.
  - Shelf grid: all 12 `STOCK` items as tiles (icon + name); tap adds the item to the open box (a short fly animation);
    tapping a picked item in the box removes it.
  - Steps, shown as a 4-step strip that lights up: **Pick** (items in the box tray), **Box** (three buttons S / M / L
    with their size; choosing moves the items into that box; wrong size is allowed and scored later), **Tape** (swipe
    across the box flap left to right, >= 60% of its width; or hold the Tape button 0.6 s as the no-swipe fallback;
    animate the tape strip; sounds are the runtime's job), **Label**
    (tap one of the three labels), then **Send** (a big button) -> build a `PackedParcel`, `scoreParcel`, show the
    stars and Kippy's line, call `opts.onParcel(score)`, slide the box off on the belt, next order
    (`makeOrder(level, seed + n, n)`).
  - Keyboard: digits 1-9/0/-/= pick shelf tiles in order, S/M/L for boxes, T holds tape, 1-3 for labels when shown,
    Enter = Send, Escape = Clock out. Gamepad optional (skip if it costs much; say so).
  - Kippy: a line from `KIPPY_LINES.start` at open, `good`/`bad` after each parcel (from the score), `quota` once
    when the quota is met, `idle` once if there was no input for `GNOMAZON.idleS` seconds (set `idle: true` in the
    result).
  - End: when the clock runs out (or Clock out: `quit: true`), close and call `opts.onEnd({ parcels, quota, quit, idle })`
    once, with every ParcelScore sent. `update(dt)` drives the clock and idle timer; `close()` removes everything,
    no callback.

## Contract
`openPackStation(ui: HTMLElement, opts: PackOpts): PackSession` exactly as in the stub.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `packUi.ts`.
- Layout reasoned (or checked in a throwaway harness) at 390x844 and 844x390; a full parcel can be done with taps only.

## Out of scope
`gnomazon/types.ts`, `gnomazon/orders.ts`, every other file.
