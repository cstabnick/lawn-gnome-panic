Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Three other workers add prefabs to `gta-jobs3-fleet.ts`,
`gta-bin-round.ts` and `gta-fire-brigade.ts` at the same time; you own only `gta-gnomazon.ts`.

## Goal
The prefabs of Gnomazon Fulfilment Centre FC-1 (packing job): the warehouse building, the packing floor furniture,
KPI-9 the manager-bot, the boxes, and the three associate rewards (wearables).

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules.
- `packages/prefabs/src/catalog/gta-diner.ts`: a finished E24 job file (props + three wearables with `wear`).
- `packages/prefabs/src/catalog/gta-jobs-gear.ts`: example wearables per slot.
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, pivots, `glow`.
- `packages/prefabs/src/catalog/gta-gnomazon.ts`: the empty `GTA_GNOMAZON` (already registered).

## Change
- `packages/prefabs/src/catalog/gta-gnomazon.ts`: fill `GTA_GNOMAZON` (ids unique: grep first; tags include 'gta',
  'gnomazon', 'warehouse'), each with `about` and 5 `examine` lines. Tone: gentle satire of a giant online shop's
  warehouse (Gnomazon: "Everything, Eventually"; the logo is a smiling curved arrow from the G to the n), never mean;
  the break room is "coming soon"; associates are cheerful and tired:
  - `gnomazon-warehouse` (a building): a 50 x 26 x 9 m pale-grey ribbed shed, flat roof, a big orange smile-arrow
    logo band along the +x long side (the front, facing +x), a glass entrance door on that front side, three roller-
    shutter loading docks with yellow bumpers on the same side. (Model with +z as its front if that is the catalog
    convention and say so; the game rotates it.)
  - `gnomazon-box-s`, `gnomazon-box-m`, `gnomazon-box-l` (container): closed cardboard boxes 0.25 / 0.4 / 0.6 m cubes
    with a tape strip and the smile arrow. `gnomazon-box-open` (container): an open M box with flaps up.
  - `gnomazon-shelf-rack` (furniture): a 2.4 x 0.8 x 2.6 m steel rack, three shelves of yellow totes with stuff
    poking out.
  - `gnomazon-conveyor` (furniture): a 4 m straight conveyor on legs, belt 0.6 wide at 0.8 m, rollers at the ends,
    a few boxes on it.
  - `gnomazon-packing-station` (furniture): a 1.6 x 0.8 m bench with a tape gun, a label printer, a scanner on a
    cord, a stack of flat boxes and a screen showing a green bar (glow).
  - `gnomazon-tote` (container): a yellow plastic tote 0.5 x 0.35 x 0.25.
  - `gnomazon-tape-gun` (tool), `gnomazon-label-printer` (prop).
  - `kpi-9-manager-bot` (prop, a character prop): KPI-9 "Kippy", a 1.1 m tall manager-bot on a single wheel: a
    rounded white body, a tablet screen for a face with a smiling eye-dot pair (glow), a clipboard arm, an orange
    lanyard, an antenna with a little green light (glow). Pivot `head` on the screen so the game can turn it.
  - `gnomazon-returns-pile` (prop): a 2 m heap of identical returned gnome hats in their boxes.
  - `gnomazon-break-room-sign` (prop): a free-standing sign on a stand with a door outline ("BREAK ROOM: COMING SOON"
    is written by the game, no text needed).
  - `gnomazon-delivery-drone` (prop): a small four-rotor drone tangled in a hedge sprig, holding a box.
- Rewards (wearables; check slot use names in `types.ts`):
  - `gnomazon-lanyard` (neck): an orange lanyard with an ID badge with a smile arrow. `about` names "Fulfilled".
  - `gnomazon-scanner` (hand): a handheld barcode scanner with a red window (glow). `about` names "Beat the Bot".
  - `cardboard-box-hat` (head): a small cardboard box worn as a hat, flaps up. `about` names "Time Off Task".

## Contract
The ids above, exactly. Say in your report which way `gnomazon-warehouse`'s front faces.

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/gnome` passes.
- `npm test -w packages/achievements` may still fail ONLY on rewards owned by the other workers (`bin-crew-cap`,
  `golden-bin-lid`, `bin-bag-backpack`, `brass-fire-helmet`, `ladder-rescue-medal`, `brass-hose-nozzle`); yours must pass.

## Out of scope
Every other catalog file, `catalog/index.ts`, the achievements catalog, every game file.
