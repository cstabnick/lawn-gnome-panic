Epic: 2 (parallel build)
Depends on: none (the reward prefabs are being added by another worker right now in `packages/prefabs/src/catalog/gta-gun-store.ts`;
the achievements package test checks they exist, so it can only fully pass once that worker is done - see Done when)

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first, then `packages/achievements/README.md` ("Adding achievements") and `docs/cosmetics.md`
("Rules").

## Goal
Six Ammu-Gnation achievements exist in the shared catalogue with cosmetic rewards, and `gunAchievements.ts` decides which ones a fitting,
a shot or a long aimed crack earns, with a test.

## Read first
- `games/gnome-theft-auto/src/gunAchievements.ts`: the stub (keep every export and signature).
- `games/gnome-theft-auto/src/glazeAchievements.ts` and `glazeAchievements.test.ts`: the same pattern for Pay 'n' Glaze (copy it).
- `games/gnome-theft-auto/src/gunMods.ts`: `slotsFor`, `GunLoadout`, `GunSoundId`.
- `packages/achievements/src/catalog.ts`: search `gta-new-coat` for the Pay 'n' Glaze entries (the format; `target` for counted ones).

## Change
- `packages/achievements/src/catalog.ts`: add after the `gta-full-glaze` entry, all with `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`:
  | id | title | description | target | reward |
  |---|---|---|---|---|
  | `gta-bolt-on` | Bolt-On | Buy your first mod at Ammu-Gnation. | | `{ slot: 'head', prefabId: 'ammu-range-earmuffs', label: 'Range Earmuffs' }` |
  | `gta-hush-hush` | Hush Hush | Fit a suppressor. | | `{ slot: 'neck', prefabId: 'ammu-dog-tags', label: 'Dog Tags' }` |
  | `gta-party-piece` | Party Piece | Fire a gun with a kazoo or a squeaky duck on the end. | | `{ slot: 'hand', prefabId: 'ammu-golden-kazoo', label: 'Golden Kazoo' }` |
  | `gta-fully-kitted` | Fully Kitted | Fill every mod slot on one gun. | | `{ slot: 'back', prefabId: 'ammu-gun-case', label: 'Gun Case' }` |
  | `gta-gilded` | Shiny Bits | Spend 2,000 Acorns at Ammu-Gnation. | 2000 | `{ slot: 'hand', prefabId: 'ammu-gilded-pistol', label: 'Gilded Pistol', exclusive: true }` |
  | `gta-long-look` | Long Look | Crack a gnome 60 m away through a scope. | | `{ slot: 'head', prefabId: 'ammu-spotter-cap', label: "Spotter's Cap", exclusive: true }` |
- `games/gnome-theft-auto/src/gunAchievements.ts`: implement (pure, no DOM):
  - `modFitAchievements(info, sink)`: when `info.spent > 0`: `sink.unlock('gta-bolt-on')` and `sink.increment('gta-gilded', info.spent)`.
    Whether or not anything was spent: `info.loadout.muzzle === 'suppressor'` -> `unlock('gta-hush-hush')`; every slot in
    `slotsFor(info.gun)` filled in `info.loadout` -> `unlock('gta-fully-kitted')`.
  - `shotAchievements(sound, sink)`: `'kazoo'` or `'squeak'` -> `unlock('gta-party-piece')`.
  - `crackAchievements({ distance, zoom }, sink)`: `zoom >= 2 && distance >= 60` -> `unlock('gta-long-look')`.
  - `GUN_ACHIEVEMENT_IDS` stays the six ids.
- `games/gnome-theft-auto/src/gunAchievements.test.ts` (new): a fake sink like the glaze test; one case per rule above, including "spent 0
  unlocks nothing but hush-hush / fully-kitted" and "every id in GUN_ACHIEVEMENT_IDS is in `ACHIEVEMENTS` from '@lawn/achievements' with
  `game === 'gnome-theft-auto'` and a reward prefab that `getPrefab` finds" (this last case is fine to fail while the prefab worker is
  still running).
- `docs/cosmetics.md`: append six rows to the big table in its format (`| **Title** (`id`) | gnome-theft-auto | description | Label (`prefabId`) | Gear: slot | RARE? |`),
  and in "Counts" add 6 achievements / 6 gear (head +2, neck +1, back +1, hand +2) and 2 RARE.

## Contract
The stub's exports (unchanged): `AchievementSink`, `GUN_ACHIEVEMENT_IDS`, `ModFit { gun; bought; spent; loadout }`,
`modFitAchievements(info, sink)`, `shotAchievements(sound, sink)`, `crackAchievements({ distance, zoom }, sink)`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- `npx vitest run src/gunAchievements.test.ts` (from `games/gnome-theft-auto`): every case passes except possibly the prefab-exists case.
- `npm test -w packages/achievements`: passes, or fails ONLY because an `ammu-*` reward prefab does not exist yet (say so in your report).

## Out of scope
Every prefab catalog file, `app.ts`, every other file.
