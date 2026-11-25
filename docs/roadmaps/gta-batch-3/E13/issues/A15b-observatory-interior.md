Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): interior and the telescope

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
The Anthill Observatory can be entered (E05 interior `anthill-observatory`): a round-feeling dome room with the great
brass telescope, Professor Sextant's desk and her star charts. Looking through the telescope (E / touch action) shows a
short, funny line about the sky, different by day and at night, and fires the `TELESCOPE_EVENT` window event so the
achievements module can award "Level with the Stars" at night.

## Background (confirmed)
- E05 contract (`docs/roadmaps/gta-batch-3/E05/contracts.md`, "Defining an interior"): `defineInterior({ id, name, door,
  exit, size: { w, d, h }, theme, ambience?, prompt?, build(kit) })` at import time; kit: `room()`, `door(x, z, yaw)`,
  `put(prefab, x, z, yaw, opts?)`, `block(...)`, `window(...)`, `sign(text, x, y, z, yaw, { w, h })`,
  `npc({ id, name, x, z, yaw, line })`, `spot({ id, x, z, prompt, run })`. Toasts from a spot:
  `window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }))`. Example file with several rooms,
  a `putIf` helper for prefabs that may still be missing, and rotating lines: `src/pardonlin/interiors.ts`.
- Contract (`src/campus/types.ts`): `OBSERVATORY.door` (1247.5, 158, yaw -PI/2) is both the interior's `door` and
  `exit`; `ROOTWELL_ROOMS['anthill-observatory']` = { size 18 x 18 x 10, door [0, 8.8], telescope [0, -1], desk [-5, 4] };
  `TELESCOPE_EVENT` = 'gta:rootwell-telescope' (detail `{ night: boolean }`); `ROOTWELL_SOUNDS.telescope` =
  'telescope-whirr' (play it with `playAt` from `../sound/bus` at the player's world position or skip sound inside).
- The stub `src/campus/observatoryInterior.ts` exports `setTelescopeClock(clock: () => string | null): void`: the
  observatory runtime (another worker) calls it with the sky's time label (`TimeLabel` from `../atmosphere`: 'Morning' |
  'Noon' | 'Golden Hour' | 'Dusk' | 'Neon Night' | 'Dawn', or null when there is no sky). Night = 'Dusk', 'Neon Night'
  or 'Dawn'. Until it is called, treat the clock as null (= day).
- Prefabs: new E13 ones being added now (use `putIf`): `anthill-telescope` (~6 long, eyepiece at its low -z end, tube up
  toward +z), `chalk-equation-board`, `book-pile`, `essay-page`; existing `office-desk`, `filing-cabinet`, `bookshelf`,
  `lamp`, `pendant-lamp`, `library-ladder`, `crate`.
- Lore: Sextant surveyed the stars for a perfectly level line; the HOA wants the lens (later in the story the lens is
  taken; not now). The ants live below and are the landlords. "Stand at the top and the whole lawn looks flat. That is
  the trouble." Dry and gentle humour.

## Read first
- `docs/roadmaps/gta-batch-3/E05/contracts.md` (Defining an interior).
- `games/gnome-theft-auto/src/pardonlin/interiors.ts`.
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/observatoryInterior.ts` (stub).
- `games/gnome-theft-auto/src/interiors/types.ts` (`InteriorKit`, `InteriorTheme`).

## Change
`src/campus/observatoryInterior.ts`:
- Keep and implement `setTelescopeClock(clock)` (store it in a module variable).
- `defineInterior` `anthill-observatory`, name 'The Anthill Observatory', theme: night blue walls 0x1e2740, brass trim
  0xc9a227, dark wood floor, a pale ceiling; `door`/`exit` = `OBSERVATORY.door`; build:
  - `kit.room()`, `kit.door(0, 8.8, PI)` (facing into the room), a ring of 8 `block` buttresses round the walls to make
    the square room read as round (no shared faces with the walls: stand them 0.05 off), a painted star map on the
    ceiling (a few small `glow` blocks or signs with '✦' if the sign renderer draws them, else small pale blocks).
  - The great telescope (`anthill-telescope`) at `telescope` facing +z (its eyepiece toward the door side), a little
    stepladder is part of the prefab.
  - Sextant's desk at `desk` (`office-desk`, a `lamp`, `book-pile`, `essay-page`s), a `chalk-equation-board` reading
    (`kit.sign`) "LEVEL LINE\nSTAR A + STAR B\n= A STRAIGHT LINE\n(DO NOT GIVE TO HOA)", a `bookshelf`, a
    `filing-cabinet` labelled "SUGAR RECEIPTS (FEW)".
  - A `spot` at the eyepiece (about 1.6 m on the telescope's -z side of `telescope`), prompt 'Look through the
    telescope', run: night = the clock's label is 'Dusk' | 'Neon Night' | 'Dawn'; dispatch
    `new CustomEvent(TELESCOPE_EVENT, { detail: { night } })` on `window`; say a line (rotate through 4 night lines and 4
    day lines), e.g. night: "Stars. Every one of them exactly where Professor Sextant said. She is unbearable about it.",
    "A perfectly level line of stars. Somebody at the HOA has drawn a ruler on the glass."; day: "The sky, blue, and an
    ant on the lens. The ant looks back.", "Daytime. The telescope shows you the Dean's lodge, very large, and the Dean,
    pretending not to see it."; and `playAt('telescope-whirr', ...)` if a world position is handy (optional).
  - Sextant herself is outside on the summit (another worker); here a note on her desk via `kit.sign`
    "BACK AT DUSK\n— B.S." is enough, or an `npc` 'Professor Sextant' at the desk if you prefer (then she is in two
    places: avoid that, use the note).
- New `src/campus/observatoryInterior.test.ts` (vitest; see `src/interiors/interiors.test.ts` for building a room in a
  test): the interior is defined (`interiorById('anthill-observatory')`); its build runs; running the telescope spot with
  `setTelescopeClock(() => 'Neon Night')` dispatches `TELESCOPE_EVENT` with `night: true`, and with `() => 'Noon'` with
  `night: false` (listen with `window.addEventListener`, using the fake DOM the other interior tests use).

## Contract
Interior id `anthill-observatory`; event `TELESCOPE_EVENT` with `{ night }`; `setTelescopeClock(clock): void`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/observatoryInterior.test.ts src/interiors` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/observatoryInterior*.ts`.

## Out of scope
Every other file (`observatory.ts` is another worker's).
