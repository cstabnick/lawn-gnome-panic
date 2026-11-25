Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Three other workers add prefabs to `gta-jobs3-fleet.ts`,
`gta-bin-round.ts` and `gta-gnomazon.ts` at the same time; you own only `gta-fire-brigade.ts`.

## Goal
The prefabs of the fire brigade (firefighter job): Fire Station No. 1 and its props, the things that catch fire on
calls, and the three firefighter rewards (wearables).

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules.
- `packages/prefabs/src/catalog/gta-diner.ts`: a finished E24 job file (props + three wearables with `wear`).
- `packages/prefabs/src/catalog/gta-jobs-gear.ts`: example wearables per slot.
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, pivots, `damage` stages (`darken`, `hide`, `add`, `sink`).
- `packages/prefabs/src/catalog/gta-fire-brigade.ts`: the empty `GTA_FIRE_BRIGADE` (already registered).
- Existing prefabs the calls reuse (do not duplicate): `garden-shed`, `kerb-hydrant`, `giant-spotted-toadstool`,
  `capwood-toadstool-cluster`, `ladder`, `hose-reel` (grep them to see their size).

## Change
- `packages/prefabs/src/catalog/gta-fire-brigade.ts`: fill `GTA_FIRE_BRIGADE` (ids unique: grep first; tags include
  'gta', 'fire'), each with `about` and 5 `examine` lines (dry humour: Fire Station No. 1 "the Damp House", Chief Hydra
  Pumpwell, the brigade's motto "Wet Is Best", gnomes are clay so they fear fire less than they fear being knocked over):
  - `fire-station-house` (a building): 18 x 10 x 6 m red-brick engine house with two tall arched bay openings on +z
    (open, at least 4 m wide and 3.4 m tall each, so a vehicle fits), a small bell tower with a brass bell on the roof
    (pivot `bell` on the bell), a white "No. 1" roundel (a disc part). Walls must not share faces with the bay frames.
  - `fire-bell-post` (prop): a 2.2 m post with a brass hand bell and a pull rope (where "Answer the bell" is).
  - `fire-hose-drying-tower` (prop): a 7 m slatted tower with hoses hanging down.
  - `fire-boot-rack` (prop): a bench with six pairs of boots and helmets on pegs, one pair of tiny boots.
  - `fire-practice-shed` (prop): a scorched, much-repaired training shed 2.5 x 2 x 2.4 m with a "PRACTICE" plank.
  - `fire-chili-pot` (prop): the station's huge chili pot on a camp stove, ~0.7 m.
  - `fire-bbq-grill` (prop): a kettle barbecue on three legs with a lid propped open, tongs, sausages, ~1 m tall.
    Add a `damage` stage 'charred' (`darken`) for after a fire.
  - `fire-deckchair` (prop): a striped deckchair ~0.9 m (fuel next to a barbecue).
  - `fire-garden-shed-burnt` (prop): a garden shed (same footprint as `garden-shed`, check its size) charred black,
    one wall panel fallen, roof sagging: what is left after a call that went badly.
  - `fire-scorch-mark` (prop, flat): a 1.6 m black-brown scorch blot, all parts within 0.02 m of the ground.
  - `fire-callbox` (prop): a red post-mounted fire alarm box ~1.4 m ("PULL IN CASE OF SHED").
- Rewards (wearables; check slot use names in `types.ts`):
  - `brass-fire-helmet` (head): a polished brass fireman's helmet with a comb and a "1" badge. `about` names "Hose Gnome".
  - `ladder-rescue-medal` (neck): a round medal with a tiny ladder on a red-and-white ribbon. `about` names "Ladder Gnome".
  - `brass-hose-nozzle` (hand): a brass branch-pipe nozzle held like a wand. `about` names "Barbecue Season".

## Contract
The ids above, exactly. `fire-station-house` bays open on +z.

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/gnome` passes.
- `npm test -w packages/achievements` may still fail ONLY on rewards owned by the other workers (`bin-crew-cap`,
  `golden-bin-lid`, `bin-bag-backpack`, `gnomazon-lanyard`, `gnomazon-scanner`, `cardboard-box-hat`); yours must pass.

## Out of scope
Every other catalog file, `catalog/index.ts`, the achievements catalog, every game file.
