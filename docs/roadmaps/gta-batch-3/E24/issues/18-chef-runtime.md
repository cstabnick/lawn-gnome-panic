Epic: E24-3 (workplace runtimes)
Depends on: E24-2 (menu, kitchen UI, kitchen interior, prefabs, sounds are in place)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Two other workers write the mechanic and comedy runtimes at the
same time (other files). You may run ONE dev server on port **5351** only; stop it when done.

## Goal
The chef job works end to end: in the diner kitchen, "Work a shift (chef)" opens the kitchen screen; served tickets pay
through the jobs career (levels, XP, the shift card); up to three good dishes go into the bag as healing snacks;
achievements unlock.

## Read first
- `games/gnome-theft-auto/src/workplaces/chef/runtime.ts`: the stub (`installChef(deps): WorkJobRuntime`).
- `games/gnome-theft-auto/src/workplaces/types.ts` (`WorkDeps`, `WorkJobRuntime`), `workplaces/shift.ts`
  (`finishShift(deps, 'chef', { units, extra, bonus, bonusNote, quote })`, `workLevel('chef')`).
- `games/gnome-theft-auto/src/workplaces/chef/types.ts` (`CHEF_START_EVENT`, `CHEF_KITCHEN_ID`, `KitchenOpts`,
  `ShiftSummary`, `dishItemId`, `DISH_IDS`), `chef/menu.ts` (`DISHES`, `makeTickets`, `isRush`, `SAGE_LINES`),
  `chef/kitchenUi.ts` (`openKitchen(ui, opts)`).
- `games/gnome-theft-auto/src/inventory.ts`: `registerItem(def)`, `addItem(id, n)`, `ItemDef` (`kind: 'snack'`,
  `heal`, `prefab`, `blurb`).
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `WORK_ACHIEVEMENTS` (chef, fiveStarRush, fullMenu), `workTitle`.

## Change
- `games/gnome-theft-auto/src/workplaces/chef/runtime.ts`:
  - At install: `registerWorkSounds()` (`../sounds`); `registerItem` for every dish: `{ id: dishItemId(d.id), name:
    d.name, prefab: d.prefab, kind: 'snack', heal: d.heal, blurb: d.blurb }` (no price: cooked only).
  - Listen for `window` event `CHEF_START_EVENT`: if a session is open ignore; if `deps.blocked()` returns a reason,
    `deps.hud.toast(reason)`; else start: `level = workLevel('chef')`, `rush = isRush(deps.timeLabel())`,
    `tickets = makeTickets(level, rush, Date.now() & 0xffff)`, `session = openKitchen(deps.ui, { level, title:
    workTitle('chef', level), rush, tickets, say: (t) => deps.hud.toast('Sage: "' + t + '"', 3500), onServe: (_t,
    stars) => play2d(stars >= 4 ? 'chef-bell' : 'chef-ticket'), onEnd })`.
  - `onEnd(summary)`: units = `summary.served.map((s) => ({ stars: s.stars }))`; dishes served = sum of
    `s.dishes.length`; rush bonus: when `summary.rush && !summary.quit && summary.walkouts === 0` add 20 Acorns
    ("Rush bonus"); `finishShift(deps, 'chef', { units, extra: { dishes, fiveStarDishes: <count of 5-star tickets> },
    bonus, bonusNote: 'Rush bonus', quote: <a SAGE_LINES.end line> })`. Then the bag: for the tickets served with >= 4
    stars, take their dishes in order, up to 3 items, `addItem(dishItemId(id), 1)`; toast "Took home: <names>" when any.
    Achievements: `deps.increment(WORK_ACHIEVEMENTS.chef, dishes)`; when `summary.served.length >= 6` and every one is 5
    stars, `deps.unlock(WORK_ACHIEVEMENTS.fiveStarRush)`; "The Whole Menu" (target 8 in the catalogue): keep a set of
    dish ids ever served in localStorage key `gta-chef-menu-v1` (JSON array; wrap in try/catch) and
    `deps.increment(WORK_ACHIEVEMENTS.fullMenu, <number of NEW ids this shift>)`.
  - `update(dt)`: `session?.update(dt)`; drop the session when `!session.isOpen()`.
  - `isOpen()`: a session is open. `blips()`: one blip `{ x: WORK_JOBS.chef.place.x, z: WORK_JOBS.chef.place.z, color:
    WORK_JOBS.chef.color, label: '🍳 Acorn Diner (chef)', kind: 'shop' }` (check the `Blip.kind` union in
    `src/types.ts`; use 'shop' or omit `kind` if 'shop' does not fit).
  - Dev hook: when `new URLSearchParams(location.search).has('chefshift')`, start a shift 2 s after install (for
    screenshots and smoke tests).

## Contract
`export function installChef(deps: WorkDeps): WorkJobRuntime` (unchanged signature).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/chef/runtime.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/workplaces src/jobs src/inventory.test.ts` passes.
- Dev server on 5351 (`cd games/gnome-theft-auto && npx vite --port 5351 --strictPort`, background):
  `bash tools/smoke.sh "http://localhost:5351/?offline&no-intro&interior=acorn-diner-kitchen&chefshift" gta-gnomlet gta-chef-kitchen`
  passes (no console errors, the kitchen panel is in the DOM). Stop the server.

## Out of scope
Every other file (`chef/menu.ts`, `chef/kitchenUi.ts`, `chef/kitchen.ts`, `stepWidgets.ts` are done; report bugs in
them instead of rewriting them, small fixes allowed only if the smoke test fails because of them).
