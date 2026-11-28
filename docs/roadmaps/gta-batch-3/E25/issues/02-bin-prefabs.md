Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Three other workers add prefabs to `gta-jobs3-fleet.ts`,
`gta-fire-brigade.ts` and `gta-gnomazon.ts` at the same time; you own only `gta-bin-round.ts`.

## Goal
The prefabs of the bin round (garbage job): the wheelie bin and its litter, the Turfton Bin Depot's buildings and
props, and the three bin-crew rewards (wearables).

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules (parts, colours, sizes, examine lines, wear mounts).
- `packages/prefabs/src/catalog/gta-diner.ts`: a finished E24 job file (props + three wearables with `wear`).
- `packages/prefabs/src/catalog/gta-jobs-gear.ts`: example wearables per slot (`uses: ['wear-head']` etc., `wear`).
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, pivots, `tint`.
- `packages/prefabs/src/catalog/gta-bin-round.ts`: the empty `GTA_BIN_ROUND` (already registered in `catalog/index.ts`).

## Change
- `packages/prefabs/src/catalog/gta-bin-round.ts`: fill `GTA_BIN_ROUND` (ids unique across the catalog: check with
  `grep -rn "id: '<id>'" packages/prefabs/src/catalog`; tags include 'gta', 'bin'), each with `about` and 5 `examine`
  lines (dry gnome humour; the depot is the Turfton Bin Depot by the Compost Heap, run by Mags Wheelie; Bin Day is
  sacred; the HOA fines litter):
  - `gta-wheelie-bin` (category 'container'): a gnome-world wheelie bin 0.55 wide x 0.5 deep x 0.9 tall, body parts
    colour 'tint' (the game tints it green/black/blue/brown), two wheels at the back, a handle bar on the back top edge,
    **pivot `lid`** at the back top hinge with the lid parts `group: 'lid'`. Front faces +z.
  - `bin-bag` (prop): a knotted black bin bag ~0.4 tall. `bin-bag-pile` (prop): five bags heaped, ~1 m.
  - `bin-litter-scatter` (prop, flat): a 1.4 x 1.0 spill of litter: flat paper/peel/can bits all within 0.03 m of the
    ground (the game lays it on a draw layer), plus one crumpled can standing up.
  - `bin-depot-shed` (furniture/prop, a building): a 10 x 6 x 4 m corrugated green garage with a big open bay on +z
    and a "TURFTON BIN DEPOT" fascia board (a box part, no text), a small office window.
  - `bin-depot-office` (prop): a 3 x 2.5 x 2.6 m portable cabin with a door and window, a "MAGS" mug on the sill.
  - `bin-wash-rack` (prop): a frame with a hose and three upside-down bins drying, ~2.5 m wide.
  - `bin-row-depot` (prop): eight empty wheelie bins in a neat row (colour by part colours: green/black/blue/brown),
    ~4.5 m long.
  - `bin-tipping-ramp` (prop): a 4 x 3 m concrete ramp with a yellow-striped kerb stop at the high end, max 0.9 m tall.
  - `bin-round-board` (furniture, wall board): a 1.2 x 0.8 m whiteboard with street list lines and a red "BIN DAY" header.
  - `lost-property-bin` (prop): a bin overflowing with odd things gnomes threw away (a shoe, a hat, a trophy).
- Rewards (wearables; check slot use names in `types.ts`):
  - `bin-crew-cap` (head): a hi-vis yellow baseball cap with a green bin badge. `about` names "Bin Day".
  - `golden-bin-lid` (hand): a small gold wheelie-bin lid held like a shield/tray. `about` names "Not a Drop".
  - `bin-bag-backpack` (back): a black bin bag tied as a backpack with yellow straps. `about` names "Kerb Appeal".

## Contract
The ids above, exactly (the game and the achievements catalog use them). `gta-wheelie-bin` has a `lid` pivot and
'tint' body parts.

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/gnome` passes (wearable fit checks).
- `npm test -w packages/achievements` may still fail ONLY on rewards owned by the other workers (`brass-fire-helmet`,
  `ladder-rescue-medal`, `brass-hose-nozzle`, `gnomazon-lanyard`, `gnomazon-scanner`, `cardboard-box-hat`); your
  three must pass. Say which failures remain.

## Out of scope
Every other catalog file, `catalog/index.ts`, the achievements catalog, every game file.
