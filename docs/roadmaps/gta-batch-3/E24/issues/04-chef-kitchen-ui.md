Epic: E24-2 (workplace jobs, parallel build)
Depends on: none (uses stubs other workers are filling right now; keep to their signatures)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Game-feel issue: a diner rush must feel busy and fun on a phone.

## Goal
`workplaces/chef/kitchenUi.ts` is the full-screen kitchen: a ticket rail along the top, the dish being cooked in the
middle (its mini-steps one after another), a "Ring the bell" serve button, Sage's lines, and an end report.

## Read first
- `games/gnome-theft-auto/src/workplaces/chef/types.ts`: `KitchenOpts`, `KitchenSession`, `Ticket`, `Dish`,
  `ShiftSummary`, `StepWidget`.
- `games/gnome-theft-auto/src/workplaces/chef/kitchenUi.ts`: the stub; keep `openKitchen(ui, opts): KitchenSession`.
- `games/gnome-theft-auto/src/workplaces/chef/menu.ts`: use `DISHES[id]` (name, emoji, steps) and
  `ticketStars(stepScores, waited, patience)`; another worker is filling it (signatures fixed).
- `games/gnome-theft-auto/src/workplaces/chef/stepWidgets.ts`: `makeStepWidget(step)`; another worker is filling it.
- `games/gnome-theft-auto/src/workplaces/sounds.ts` (ids 'chef-bell', 'chef-ticket'); play with `play2d(id)` from
  `games/gnome-theft-auto/src/sound/bus.ts`.

## Change
- `games/gnome-theft-auto/src/workplaces/chef/kitchenUi.ts`:
  - `openKitchen(ui, opts)` appends `<div id="gta-chef-kitchen">` to `ui` (inject its CSS once, id
    `gta-chef-kitchen-css`): fixed full-screen panel (z-index 38), warm diner look (cream tiles, red-and-white awning
    strip on top), `pointer-events:auto`, padding with `env(safe-area-inset-*)`. Header: "🍳 <opts.title> · level
    <opts.level>", "RUSH!" tag when `opts.rush`, served count "3/8", a 44 px "Hang up apron" button (calls `close()`).
  - **Ticket rail**: the tickets whose `arriveAt <= clock` slide in (CSS transition) as paper slips: `from`, the dish
    emojis + names, a patience bar draining from `patience`. 'chef-ticket' when one arrives. At most 5 visible
    (horizontal scroll on narrow screens). A ticket whose patience runs out walks out: the slip crumples away,
    `opts.say(<a walkout line>)` (the runtime passes Sage's lines in via `say`; you just call `opts.say` with text
    from `SAGE_LINES.walkout` imported from `./menu`), counted in `walkouts`. Patience keeps draining while cooking it.
  - **Cooking**: tap a ticket (44 px+ slip) to start it when nothing is cooking. For each of its dishes, for each step,
    mount `makeStepWidget(step)` in the middle area under a header "<dish emoji> <dish name> · step 2/4"; call the
    widget's `update(dt)` from `update`; when `result()` is a number, keep the score, wait 0.6 s (let the verdict
    show), `destroy()` it, remove its element, go on. After the last step of the last dish show a big "🔔 Ring the bell"
    button (play 'chef-bell'); pressing it serves: stars = `ticketStars(allStepScores, waitedSeconds, ticket.patience)`
    where waited = clock - arriveAt; show the stars on the slip as it flies out; call `opts.onServe(ticket, stars)`;
    on 5 stars `opts.say(<a SAGE_LINES.good line>)`.
  - Start: `opts.say(SAGE_LINES.start[...])` (and a `rush` line when rush).
  - The shift ends when every ticket is served or walked out: show a short "Shift over" state for 1.2 s, then remove
    the panel and call `opts.onEnd({ served: [{ stars, dishes }...], walkouts, quit: false, rush: opts.rush })` once.
    `close()` (also the apron button) ends at once with `quit: true` (served so far still count) and destroys any
    live widget.
  - `update(dt)`: the clock, arrivals, patience bars, the live widget. `isOpen()` true until ended.
  - Layout: portrait phone = rail on top (one row), the step widget centred below, the bell under it; landscape phone =
    rail as a column on the left, widget on the right. Every button >= 44 px. Stop pointer events from reaching the
    game (`pointerdown` stopPropagation on the panel).
  - Keys for desktop (optional, nice): 1-5 pick the n-th ticket on the rail, Enter / Space rings the bell, Escape =
    Hang up apron. Remove the keydown listener when ended.

## Contract
`export function openKitchen(ui: HTMLElement, opts: KitchenOpts): KitchenSession`. Calls `opts.onEnd` exactly once.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/chef/kitchenUi.ts`.
- Reading the code: a shift with 0 tickets ends at once with `served: []`; `close()` twice calls `onEnd` once.

## Out of scope
`chef/types.ts`, `chef/menu.ts`, `chef/stepWidgets.ts`, `chef/runtime.ts`, every other file.
