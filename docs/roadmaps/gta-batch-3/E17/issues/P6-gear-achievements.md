Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first. For the prefab format read `docs/roadmaps/prefab-library/_common.md`
(IGNORE its "Environment" section). Gear prefabs are worn by the player's gnome: follow the existing wearable rewards.

## Goal
Six achievements for the E17 underground societies exist in the shared catalog; five have a new wearable reward prefab,
one reuses the existing `mole-crown`.

## Read first
- `packages/achievements/src/catalog.ts` around the `gta-weekend-away` and `gta-hat-wave` entries (format)
- `packages/achievements/README.md` (rules for rewards: slot, prefabId)
- `packages/prefabs/src/catalog/gta-living-gear.ts` (head, neck, back and hand wearables with `wear` mounts: copy their
  structure exactly)
- `packages/prefabs/src/catalog/trinkets.ts` around `id: 'mole-crown'` (check it has a head `wear` mount; if it has none,
  add one in the same style as the head items in gta-living-gear.ts; that is the only edit allowed in trinkets.ts)
- `packages/prefabs/src/catalog/gta-societies-gear.ts` (yours: empty `GTA_SOCIETIES_GEAR`, already registered)

## Change
- `packages/prefabs/src/catalog/gta-societies-gear.ts`: five wearables, each with 5-6 examine lines:
  - `post-satchel` (back): a mole post-runner's canvas satchel with a brass buckle and a letter poking out, worn across
    the back.
  - `subsoil-headphones` (neck): big padded headphones resting round the neck, a coiled cable ending in a tiny plug,
    "108.0" painted on one cup.
  - `underspan-goggles` (head): welding goggles with round smoked lenses on a leather strap, worn pushed up on the hat,
    a tiny spanner clipped to the strap.
  - `flock-hood` (head): a soft grey hood with one small grey feather (NOT pink: pink is for the Lady only).
  - `reed-tea-cup` (hand): a dented tin cup of reed tea with a reed sticking out of it.
- `packages/achievements/src/catalog.ts`: add a block `// ---- Gnome Theft Auto: E17 underground societies ----` after
  the E31 / `gta-hat-wave` entries, with exactly these six (game 'gnome-theft-auto', gameTitle 'Gnome Theft Auto'):
  - `gta-honest-dirt` "Honest Dirt": "Finish your first mole job in Loamdeep." reward back `post-satchel` "Post Satchel".
  - `gta-every-hall` "Every Hall Thanks You": "Finish all four kinds of mole job: roots, lamps, post and digging."
    target 4, reward head `mole-crown` "Mole Crown".
  - `gta-seat` "Seat": "Be in the Under-Chorus when DJ Moleman plays." reward neck `subsoil-headphones` "Subsoil Headphones".
  - `gta-unauthorised-verticality` "Unauthorised Verticality": "Ride the Underspan's Updraft up onto the Roost."
    reward head `underspan-goggles` "Underspan Goggles".
  - `gta-birds-of-a-feather` "Birds of a Feather": "Join the Flock of the One Leg." reward head `flock-hood` "Flock Hood".
  - `gta-sat-down` "Sat Down": "Sit down at the Flock's Long Vigil. They forgive you. It is a Tuesday." reward hand
    `reed-tea-cup` "Reed Tea Cup".
  Check first that none of these six ids already exists in the catalog (grep); if one does, report it and stop.

## Contract
Achievement ids and reward prefab ids exactly as above (the game fires them from `src/societies/config.ts` SOCIETY_ACH).

## Done when
- `npm test -w packages/achievements` passes.
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/gnome` passes (gear wear checks), or fails only on items that are not yours (report them).

## Out of scope
Other catalog files (except the mole-crown wear mount above), anything under `games/`.
