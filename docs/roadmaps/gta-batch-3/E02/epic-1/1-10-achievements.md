Epic: E02-1 Engine pieces
Depends on: none
Items: L57, L78 (achievements for the new verbs)

(Environment: paste `_environment.md`; this issue works in `packages/achievements`.)

## Goal
Two Gnome Theft Auto achievements with cosmetic rewards: `gta-driver-down` (crack 10 gnomes who are driving) and `gta-shell-collector` (leave 500 acorn shells).

## Read first
- `packages/achievements/README.md` (the def shape, reward rules, `target` for counters).
- `packages/achievements/src/catalog.ts`: the `// ---- Gnome Theft Auto ----` section (~515), e.g. `gta-rainmaker` (`target: 50`, reward `{ slot: 'head', prefabId: 'rain-hat', label: 'Rain Hat', exclusive: true }`).
- The catalog tests in `packages/achievements/src/` (the rules every def must meet).

## Change
- `packages/achievements/src/catalog.ts`: add two defs in the Gnome Theft Auto section:
  - `gta-driver-down`: title `Pulled Over`, description `Crack 10 gnomes while they are driving.`, `target: 10`, reward an existing `@lawn/prefabs` gear item for the `head` or `neck` slot not already used as a reward (search the catalog for `prefabId:`; find wearable prefabs in `packages/prefabs/src/catalog/` by the slot rules in the README).
  - `gta-shell-collector`: title `Shell Shock`, description `Leave 500 acorn shells on the ground.`, `target: 500`, reward an existing `back` or `hand` slot gear item not already used as a reward.
  Never add a prefab in this issue.

## Contract
Ids `gta-driver-down` and `gta-shell-collector` (the game increments them).

## Done when
- `npm test -w packages/achievements` passes (from the repo root).

## Out of scope
Every other file.
