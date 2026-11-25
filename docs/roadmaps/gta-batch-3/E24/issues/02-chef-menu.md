Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first.

## Goal
`workplaces/chef/menu.ts` holds the Route South Acorn Diner menu (eight dishes made of mini-steps), seeded ticket
generation, rush hour, the star rule for a served ticket and Sage Ladle's lines. Pure TypeScript, unit-tested.

## Read first
- `games/gnome-theft-auto/src/workplaces/chef/types.ts`: `DishId`, `DISH_IDS`, `CookStep`, `CookStepKind` (read the
  comment: what `target` means per kind), `Dish`, `Ticket`, `dishItemId`.
- `games/gnome-theft-auto/src/workplaces/chef/menu.ts`: the stub. Keep every exported name and signature.
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `Stars`, `toStars`, `starsForScore`.

## Change
- `games/gnome-theft-auto/src/workplaces/chef/menu.ts` (replace the stub bodies):
  - `DISHES: Record<DishId, Dish>`, all eight, `prefab: 'diner-' + id`. Levels and heals:
    | id | name | emoji | level | heal | steps (kinds, in order) |
    |---|---|---|---|---|---|
    | acorn-cake | Acorn-Flour Cake | 🍰 | 1 | 0.35 | pour (flour, 0.6), stir 3, heat 0.55, plate 3 |
    | dew-clover | Dew-Poached Clover | 🍀 | 1 | 0.15 | chop 5, pour (dew, 0.4), plate 3 |
    | root-stew | Grub-Free Root Stew | 🍲 | 2 | 0.45 | chop 8, stir 4, heat 0.7 |
    | acorn-toastie | Toasted Acorn Toastie | 🥪 | 2 | 0.3 | chop 4, flip 2, plate 2 |
    | dandelion-fritters | Dandelion Fritters | 🌼 | 3 | 0.3 | chop 6, pour (batter, 0.5), flip 3, plate 4 |
    | mushroom-coffee | Mushroom Coffee | ☕ | 3 | 0.2 | heat 0.4, pour (coffee, 0.85) |
    | mulch-chilli | Mulch-Bean Chilli | 🌶️ | 4 | 0.5 | chop 6, stir 5, heat 0.8, plate 2 |
    | pie-of-the-day | Pie of the Day | 🥧 | 5 | 0.6 | pour (filling, 0.7), plate 5, heat 0.6, chop 4 (slice it) |
    Write a short `label` per step ("Chop the clover", "Pour the dew", "Ring it up" is NOT a step) and a `seconds`
    allowance (chop: 0.6 s per tap + 1; stir: 2.2 s per circle; pour: 4; heat: 4; flip: 3 per flip; plate: 1.5 per
    item + 1). `emoji` per step (the ingredient). `blurb` one dry menu line each, e.g. the stew: "GRUB-FREE. Do not ask.".
  - `dishesForLevel(level)`: dishes with `dish.level <= level`, in `DISH_IDS` order.
  - `makeTickets(level, rush, seed)`: deterministic (write a small mulberry32-style PRNG from `seed`). 8 tickets, or
    12 when `rush`. Each ticket: 1 dish (60%), 2 (30%), 3 (10%; level >= 3 only), dishes picked from
    `dishesForLevel(level)`, never more than one pie per ticket. `from`: pick from
    `['Fence-Post Frank', 'Booth 1', 'Booth 2', 'Booth 3', 'the counter', 'a trucker', 'a gnome in a hurry', 'a regular']`,
    plus `'the coach'` when rush. `patience`: 45 s + 15 s per dish (rush: x0.8). `arriveAt`: first at 0, then every
    14 s (rush: every 7 s), +-2 s jitter, never decreasing. `id` 1.. .
  - `ticketStars(stepScores, waited, patience)`: mean of the scores (0 if empty), minus a wait penalty of
    `max(0, waited / patience - 0.5) * 40` points, then `starsForScore`.
  - `isRush(label)`: keep as is (Noon or Dusk).
  - `SAGE_LINES`: Sage Ladle is the diner's cook-owner: wide, quiet, quick with a ladle, says very little, pays debts in
    meals. Write 4-6 short lines for each key (start, good, walkout, rush, end). Example tone: "Bell's there. Use it.",
    "Frank wants it hot. Frank always wants it hot.", "They walked. Soup doesn't wait and neither do they.".
- `games/gnome-theft-auto/src/workplaces/chef/menu.test.ts` (new): every DishId has a dish with >= 2 steps and a valid
  prefab id `diner-<id>`; `dishesForLevel(1)` is cake + clover, `dishesForLevel(5)` has all eight; `makeTickets` is
  deterministic for a seed, returns 8 / 12, `arriveAt` non-decreasing, only unlocked dishes; `ticketStars([100,100],
  0, 60) === 5`, `ticketStars([100], 60, 60) < 5`, `ticketStars([], 0, 60) === 1`.

## Contract
Exports and signatures exactly as in the stub (`DISHES`, `SAGE_LINES`, `dishesForLevel`, `makeTickets`, `ticketStars`,
`isRush`). No DOM, no three.js imports.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/chef/menu.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/chef/menu*.ts`.

## Out of scope
`chef/types.ts` (do not change), every other file.
