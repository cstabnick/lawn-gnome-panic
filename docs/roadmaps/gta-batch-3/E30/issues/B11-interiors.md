Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Many workers edit other files of
`games/gnome-theft-auto` at the same time (the district plans that build the outside of these buildings, the props);
touch only `src/pardonlin/interiors.ts` (and an optional `src/pardonlin/interiors.test.ts`).

## Goal
Two walk-in rooms in Pardonlin, each a small environmental story: **Café Pardon** on Teacup Row and the **Radio
Adagio foyer and studio** in the Opera Hall on the Left Bank.

## Read first
- `games/gnome-theft-auto/src/interiors/showcase/bodega.ts` and `flat3b.ts`: complete interiors with vignettes,
  signs, an NPC and spots: copy the structure.
- `games/gnome-theft-auto/src/interiors/types.ts`: `InteriorDef`, `InteriorKit` (room, door, put, block, window,
  sign, npc, spot, stairsTo), themes, ambience.
- `games/gnome-theft-auto/src/pardonlin/interiors.ts`: your file (currently `export {}`; app.ts imports it once).
- Prefab ids you may `kit.put`: `euro-cafe-table` (0.77 m top), `euro-cafe-chair`, `euro-bistro-set`,
  `euro-chalkboard-sign`, `euro-geranium-pot`, `euro-flower-trough`, `bread-loaf`, `cheese-wedge`, `crate`, `bench`,
  `bookshelf`, `gsr-upright-piano`, `grandfather-clock`, `wall-clock`, `lamp`, `pendant-lamp`, `newspaper-box`;
  NEW ones another worker is adding right now (exact ids, they exist by the end of the epic): `pl-espresso-cup`,
  `pl-croissant`, `pl-newspaper`, `pl-gramophone`, `pl-music-stand`, `pl-cello`, `pl-sheet-music`, `pl-accordion`,
  `pl-baguette`, `pl-bread-basket`, `pl-cafe-parasol`. If you use a NEW id, guard it so the room still builds if it
  is missing (check with `getPrefab(id)` from `@lawn/prefabs` and skip).

## Change
- `games/gnome-theft-auto/src/pardonlin/interiors.ts`: two `defineInterior` calls at import time (keep the file free of
  other side effects). Export `PL_INTERIOR_IDS = ['pl-cafe-pardon', 'pl-adagio-foyer'] as const`.
  1. `pl-cafe-pardon`, name 'Café Pardon', door `{ x: -1527.8, z: 139, yaw: -Math.PI / 2 }`, exit
     `{ x: -1526.6, z: 139, yaw: Math.PI / 2 }` (the café's front is on the west side of Teacup Row's lane, facing
     east), size about 14 x 10 x 4, theme 'shop' (or a warm custom InteriorTheme), ambience 'continental' if that is a
     valid ambience id, else omit. Inside: a zinc counter (`kit.block`), a pastry vitrine, 6-8 small tables, a back
     corner where two regulars have been on one espresso since Tuesday (cups stacked to the ceiling-ish: 12 saucers),
     a gramophone, the waiter Hector Disdain as an NPC who never takes your order (`kit.npc` id `pl-hector`, name
     'Hector Disdain', line in his voice), a chalkboard sign "Today: coffee. Tomorrow: possibly coffee.", a window, a
     `kit.spot` 'Order a coffee' whose run toasts (via `window.dispatchEvent(new CustomEvent('gta:interior-say',
     { detail: { name: 'Hector Disdain', line } }))`) a different refusal each time from a list of 6.
     Three vignettes, e.g. the lost umbrella collection behind the counter, the reserved table (sign "Reserved since
     the last strike"), the queue inside the café that formed out of habit.
  2. `pl-adagio-foyer`, name 'Radio Adagio', door `{ x: -1680, z: -100, yaw: Math.PI / 2 }` (the Opera Hall's front
     faces west onto the Boulevard; the door spot is in its forecourt), exit `{ x: -1682, z: -100, yaw: -Math.PI / 2 }`,
     size about 18 x 14 x 6, theme 'club' or 'office' or a custom velvet-and-gold InteriorTheme. Inside: the foyer with
     a red carpet (a `kit.block` 0.02 high), velvet rope posts, a ticket window with a sign "Season tickets: seats not
     provided", portraits (signs) of past conductors all with the same face; through an open glass wall the studio:
     a desk with a microphone (blocks), a gramophone, stacks of records (thin blocks lifted apart, no shared faces),
     music stands, a cello, a `gsr-upright-piano`, a sign "ON AIR (slowly)". NPC `pl-maestro-inside`, name 'Maestro
     Ottavio Lento', line in his pompous slow voice. A `kit.spot` 'Request a piece' that toasts one of 6 refusals
     or slow acceptances ("Your request has been noted. It will be played in the next season.").
  - Keep every flat thing off another flat thing at the same height (lift by 0.02); props 0.05 off walls.
  - Lore and tone: gentle continental satire (long lunches, queues, strikes, bread opinions), no real places, brands
    or nationalities; nothing wet, soaked, dripping or bloody.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your file.
- `cd games/gnome-theft-auto && npx vitest run src/interiors` passes (the interiors registry tests import every
  interior through the app's imports only if wired; if you add `interiors.test.ts`, import `./interiors` and check
  `listInteriors()` (from `../interiors`) contains both ids with their doors inside Pardonlin: x -1800..-1398).

## Out of scope
`src/interiors/*` (do not edit), `app.ts`, the district plans.
