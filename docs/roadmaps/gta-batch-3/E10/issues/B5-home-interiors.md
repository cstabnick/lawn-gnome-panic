Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Two character homes can be walked into: Reginald Vance's townhouse 404 in Patio Heights (id `townhouse-404`) and Diggs'
tin bungalow south of Pebblewick (id `diggs-bungalow`), each fully dressed with story vignettes, signs and its resident.

## Who (from docs/design/gnome-theft-auto/characters.md; `npm run lore -- find reginald` / `diggs` for more)
- **Reginald "Quarter-Inch" Vance**: HOA auditor at Thorne Tower, measures everything with calipers, rules-obsessed,
  Juniper Vance's estranged husband (they still share a surname and a grudge). Townhouse 404: beige, immaculate,
  everything at right angles, one thing out of place he cannot find. Voice: precise, prim, numbers.
- **Diggs**: Fort Sandpit's veteran digger, hoarder of finds, distrustful of the HOA and of maps he did not draw; lives
  in a tin (Nissen) bungalow, cluttered, warm, smells of sand and tea. Voice: gruff, short, conspiratorial.

## Read first
- `docs/roadmaps/gta-batch-3/E05/contracts.md` section "Defining an interior": the `defineInterior` API and the kit
  (`room`, `door`, `put`, `block`, `window`, `sign`, `npc`, `spot`). Rules: objects are prefabs via `kit.put`;
  rooms at least 10 x 8 m; local coordinates from the room centre.
- `games/gnome-theft-auto/src/interiors/showcase/bodega.ts`: a finished interior in this game (style to copy).
- `games/gnome-theft-auto/src/homes/types.ts`: `HOME_DOORS.reginald` (102, -136.5, yaw 0: the front door spot is on the
  south side (+z) of the house; a gnome walking out faces south, yaw 0) and `HOME_DOORS.diggs` (615, 206.5, yaw π: north side, walking out faces north).

## Change
- New `games/gnome-theft-auto/src/homes/interiors.ts` with two `defineInterior` calls (run at import time):
  - `townhouse-404`, name `'Townhouse 404, Patio Heights'`, `door: { x: 102, z: -136.5, yaw: 0 }`,
    `exit: { x: 102, z: -135, yaw: 0 }`, size about 12 x 9 x 3.2, theme `'office'` or a custom beige
    `InteriorTheme`, `ambience: 'city'`, prompt `'Enter townhouse 404'`. Build: `kit.room()`, `kit.door(...)` on the
    south wall (the door the player came in by is on the south wall since the front faces south: `kit.door(0, d / 2 - 0.2, Math.PI)`
    with yaw π facing into the room (-z)), two windows, then dressing:
    - Vignettes (prefabs; grep `packages/prefabs/src/catalog/` for ids, only use ones that exist): (1) a dining table
      laid for two with one chair pushed in neatly and the other knocked over (Juniper left); (2) a measured carpet: a
      `rug` with a measuring tool and pegs at its corners, one corner turned up; (3) a desk (`table` + `ledger` +
      `lamp`) stacked with "NOTICE OF NON-COMPLIANCE" forms (`sealed-letter`s), a calipers prop if one exists;
      (4) a bookshelf with every shelf identical.
    - Signs (`kit.sign`): `'SHOES OFF.\nSOCKS: BEIGE.'`, a framed certificate `'HOA AUDITOR OF THE MONTH\n(EVERY MONTH)'`,
      a fridge note `'J. - YOUR HALF OF THE SHELF\nIS 0.25 IN. OVER.'`.
    - Resident: `kit.npc({ id: 'reginald', name: 'Reginald Vance', look: { hat: 0x18181e, shirt: 0xc9b99b, glasses: true },
      x, z, yaw, line })` crouched by the rug measuring it; `line` cycles (keep an index, like flat3b.ts does with
      NEIGHBOUR_LINES via a `kit.spot`, or use one line): "You are standing on a non-compliant tile.", "The carpet is
      0.25 inches proud. I will find out why.", "If Juniper sent you, the answer is still no."
  - `diggs-bungalow`, name `"Diggs' bungalow"`, `door: { x: 615, z: 206.5, yaw: Math.PI }`, `exit: { x: 615, z: 205, yaw: Math.PI }`,
    size about 11 x 8 x 3 (a Nissen hut: low and long), theme `'burrow'` or a warm tin custom theme, `ambience: 'desert'`,
    prompt `"Enter Diggs' bungalow"`. Build: room, door on the north wall, one window, dressing:
    - Vignettes: (1) a camp bed with a metal detector (or spade) tucked under it like a teddy; (2) shelves of labelled
      jars of finds (`barrel`/`crate`/`pot`), one jar lid off and empty; (3) a kettle on a stove with two mugs, one for
      a guest who never comes; (4) a wall map with pins and string (`kit.sign` with a map-like text, plus `painting`).
    - Signs: `'FINDERS KEEPERS.\nLOSERS: HOA.'`, `'DO NOT DIG INDOORS\n(AGAIN)'`.
    - Resident: Diggs (`look: { hat: 0x8d6e63, shirt: 0xc2a36b, beard: 0x9e9e9e }`) sitting at the stove
      (`sit: true` if the kit supports it), line: "Tea? Don't touch the jars. Each one's a story and none of them are yours."
- `games/gnome-theft-auto/src/homes/interiors.test.ts`: import `./interiors`; `interiorById('townhouse-404')` and
  `interiorById('diggs-bungalow')` exist; building each with `createKit` (see `src/interiors/kit.test.ts`) gives at
  least 12 colliders-or-props and one npc (read `InteriorBuild` from `createKit`'s return).

## Contract
Interior ids `townhouse-404` and `diggs-bungalow` (homes/data.ts already names them). The lead imports
`./homes/interiors` from app.ts. Doors are unlocked (no `locked`).

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/homes/interiors.test.ts src/interiors` passes.

## Out of scope
src/interiors/* (read only), homes/types.ts, the house exteriors (other workers), app.ts.
