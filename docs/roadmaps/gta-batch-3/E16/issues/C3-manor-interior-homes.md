Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
Brassknock Manor can be entered by its BACK door (everyone comes round the back; nobody uses the front knocker): one
furnished interior, the tasting hall, with a footman, a row of shut doors and the locked ledger room. The homes of the
Countess, Chicory Snips and Chard Levelright get their doors (E10 `registerHome`).

## Read first
- `docs/roadmaps/gta-batch-3/E05/contracts.md`, section "Defining an interior" (`defineInterior`, the `kit` calls:
  `room`, `door`, `put`, `block`, `window`, `sign`, `npc`, `spot`), and how a spot toasts
  (`window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }))`).
- `games/gnome-theft-auto/src/campus/interiors.ts`: finished `defineInterior` rooms to copy.
- `games/gnome-theft-auto/src/homes/data.ts`: `HomeDef`, the rows `onSite('chard', ...)`, `onSite('chicory', ...)`,
  `onSite('wisteria', ...)`, `homeOf(id)`, `registerHome(def)`. And `docs/roadmaps/gta-batch-3/E10/contracts.md` (the
  `registerHome({ ...homeOf(id)!, door: [x, z, yaw] })` pattern; `door` yaw = the way a gnome faces walking OUT).
- `games/gnome-theft-auto/src/country/types.ts`: `MANOR` (the house footprint: centre (-1150, 31), 46 x 18, front facing
  north at z 22, back wall at z 40), `VINEYARD.lodge`, `EVEN_ESTATES[0].caravan`.
- `games/gnome-theft-auto/src/country/manorInterior.ts`: the stub you replace (keep `registerCountryHomes`).

## Change
`src/country/manorInterior.ts`:
- At import time, `defineInterior({ id: MANOR.interior /* 'brassknock-manor' */, name: 'Brassknock Manor', door: { x: -1150,
  z: 41.5, yaw: 0 }, exit: { x: -1150, z: 43, yaw: 0 }, size: { w: 26, d: 16, h: 6 }, theme: <a cream-and-oxblood
  theme object or the closest built-in>, prompt: 'Go in round the back', build(kit) {...} })`. The door is the BACK door
  (south wall of the house; the world spot is 1.5 m outside it, facing south). In `build`:
  - `kit.room()`; `kit.door(...)` on the south wall (local +z side) for the way out.
  - The tasting hall: the `tasting-table` prefab in the middle (another worker is adding it; a missing id is skipped),
    a long rug (a `kit.block` 0.02 tall, its own colour), two `manor-urn`s, 7 fireplaces along the walls as `kit.block`
    hearths with a dark opening (only one with a `campfire` prefab inside: the Countess lights one), 3 `kit.window`s on
    the north wall (it looks over the vines), framed portraits as `kit.sign` plates with dry captions ("THE FIRST
    BRASSKNOCK, WHO PLANTED A VINE", "THE SECOND BRASSKNOCK, WHO SIGNED THE CHARTER", "THE COUNTESS, WHO SMILES AT
    EVERYONE THE SAME DISTANCE"), a bookcase or two (browse the catalogue: `grep -l "bookshelf\|bookcase"
    packages/prefabs/src/catalog/*.ts`).
  - `kit.npc({ id: 'brassknock-footman', name: 'Footman Pell', x, z, yaw, line: 'Round the back was correct. The knocker is for the charter. Nobody has used it since.' })`.
  - A corridor of shut doors along the east wall as `kit.block` doors with three `kit.spot`s: "Try the door" → lines
    "Shut. The plate says MORNING ROOM (UNUSED).", "Shut. The plate says SECOND MORNING ROOM.", "Shut. Somebody has
    written LEDGERS on the plate and then rubbed it out, not very hard." (toast through `gta:interior-say`).
  - `kit.spot` 'Admire the grape-dew' at the table → "Brass caps, thimble glasses. Chicory says the cap is the only part
    that is for show."
- `export function registerCountryHomes(): void` (called once at install): `registerHome({ ...homeOf('wisteria')!,
  door: [-1150, 41.5, 0], kind: 'interior', interiorId: 'brassknock-manor' })` (keep any other fields the row has),
  `registerHome({ ...homeOf('chicory')!, door: [-1172, -73.5, 0] })` (the lodge's front, facing south) and
  `registerHome({ ...homeOf('chard')!, door: [-309, -102, Math.PI / 2] })` (the caravan door on its east side). Check
  `HomeDef`'s field names and the allowed `kind` values in `homes/data.ts` and follow them exactly; if a row is missing,
  skip it and say so.

## Contract
Interior id `brassknock-manor`, world door (-1150, 41.5) facing south; `registerCountryHomes()` signature unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/interiors src/homes` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your file.

## Out of scope
`src/interiors/*`, `src/homes/*` (call their APIs only), every other file under `src/country/`.
