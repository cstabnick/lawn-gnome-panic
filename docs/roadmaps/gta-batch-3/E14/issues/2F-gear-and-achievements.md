Epic: E14-2 (content on the track registry)
Depends on: none
Worker: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules). You only touch two package
files.

## Goal
Six achievements for the dirt track, the rally and Capwood, each with its own wearable reward prefab.

## Read first
- `packages/achievements/README.md` (rules: one reward prefab per achievement, slot must match the prefab's `wear-*` use)
- `packages/achievements/src/catalog.ts` ~670-700 (the `gta-speedway-*` entries: the exact entry shape)
- `packages/prefabs/src/catalog/gta-race-gear.ts` (worked examples of `wear-head`, `wear-neck` gear: crown at min y = 0,
  `wear: { at }` offsets) and one back item: `grep -n "wear-back" -A12 packages/prefabs/src/catalog/cosmetics-back.ts | head -40`,
  one hand item: `grep -rn "uses: \['hold'\|wear-hand" packages/prefabs/src/catalog/gta-pardonlin-gear.ts | head`
- `packages/prefabs/src/catalog/gta-dirt-rally-gear.ts` (empty file you fill; already registered in `index.ts`)

## Change
- `packages/prefabs/src/catalog/gta-dirt-rally-gear.ts`: `export const GTA_DIRT_RALLY_GEAR: readonly PrefabDef[]` with
  six gear prefabs (gnome-scale, small: look at the sizes in `gta-race-gear.ts`), plain colours, `about` starting
  "Gnome Theft Auto (E14):", five `examine` lines each (description, saying, tip, joke, odd detail):

| prefab id | slot / use | look |
|---|---|---|
| `rutbottom-mud-bandana` | neck (`wear-neck`) | a red-and-white bandana knotted at the throat, splattered with brown mud dots |
| `rutbottom-knobbly-helmet` | head (`wear-head`) | an open-face dirt helmet, white with a red stripe, a short peak, goggles pushed up on the front |
| `capwood-rally-pennant` | back (`wear-back`) | a small orange pennant flag on a short pole worn across the back, a "CR" in white boxes |
| `capwood-cap-hat` | head (`wear-head`) | a red domed toadstool cap with white spots worn as a hat (like `giant-spotted-toadstool`, gnome hat sized), a pale gill ring under the brim |
| `spore-cloak` | back (`wear-back`) | a short mossy-green cloak with a hood down, dusted with tiny pale glowing dots (emissive if the part format allows, else pale yellow) |
| `warden-ticket-book` | hand (match how other hand rewards are tagged) | a small green ticket book with a pen clipped to it |

- `packages/achievements/src/catalog.ts`: add, after the last `gta-` entry of the Speedway group (or at the end of the GTA
  block), with `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`:

| id | title | description | reward |
|---|---|---|---|
| `gta-dirt-rookie` | Rut Runner | Finish on the podium in Rutbottom's Knobbly Heat. | neck `rutbottom-mud-bandana` 'Mud Bandana' |
| `gta-dirt-champion` | The Berm Remembers | Beat Two-Ton Teasel in the Rutbottom Heats. | head `rutbottom-knobbly-helmet` 'Knobbly Helmet' |
| `gta-rally-finish` | Capwood Finisher | Finish the Capwood Run. | back `capwood-rally-pennant` 'Rally Pennant' |
| `gta-rally-gold` | Gold Through the Gills | Win the Capwood Run inside the gold time. | head `capwood-cap-hat` 'Capwood Cap', `exclusive: true` |
| `gta-toadstool-trail` | Ring of Glow | Find the Great Ring in Capwood after dark. | back `spore-cloak` 'Spore Cloak' |
| `gta-cap-count` | Section Nine | Count every unfined cap for Warden Stook. | hand `warden-ticket-book` 'Ticket Book' |

## Contract
Achievement ids and prefab ids exactly as above (the game's quests and Capwood module unlock them by id).

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass (from the repo root). If the gear-fit
  checks in `npm test -w packages/gnome` exist for new items, run `npx vitest run -t "<your prefab id>"` inside
  `packages/gnome` and fix your own items' `wear` offsets if they fail (that suite has 38 older failures: ignore those).

## Out of scope
Every other file (`gta-dirt-rally.ts` is another worker's; `index.ts` is done).
