# Gnome Theft Auto: Ammu-Gnation (gun store, gun mods, aiming)

Chunk C of the GTA content push. Every gun is free and unlocked; **Ammu-Gnation**, a walk-in store on Turfton's east edge (200, -30),
sells MODS. Each mod is a `@lawn/prefabs` part bolted onto the held gun at a mount point (`gunRig.ts`, the gun's version of
`@lawn/glaze`'s `attachLoadout`; it stays in the game because only this game needs it), changes the gun's numbers (damage, fire rate,
spread, range, mag, reload, recoil, aim zoom) and some change its sound (suppressed, heavy, kazoo, squeaky duck; `gunSounds.ts`, kept out
of `audio.ts`). Owned and fitted mods per gun persist (`gunModStore.ts`, `gta-gunmods-v1`); other players see the held gun and its mods
through a `gun` relay message. Aim with right mouse held / the touch Aim toggle / gamepad LT: an over-the-shoulder zoomed camera, slower
walk, tighter spread, scopes zoom further and show a scope overlay. Six achievements with gear rewards.

Online: yes (held gun + mods relayed like Pay 'n' Glaze looks). Mobile: the shop is the glaze bottom sheet / side panel, the store prompt
uses the touch Enter button, aiming has a 64 px toggle. Party slice: unchanged (`gta-getaway` keeps working; weapons.ts keeps its API).

## Shape

| Epic | What | Issues | Done when |
|---|---|---|---|
| 1 | Foundation (planner): `gunMods.ts` (catalogue, stats, codes, aim tuning) + test, `gunModStore.ts`, stubs (`gunRig`, `gunSounds`, `gunShop`, `gunStore`, `aimHud`, `gunAchievements`), types (`Weapons.spec/setLoadout/loadoutOf/setAim`, `InputState.aim`, `ChaseCamera.setAim`), brand `ammu-gnation`, save key, empty prefab catalog files, named swappable parts on the gun prefabs | 0 (planner) | tsc + gunMods tests pass |
| 2 | Parallel build | 14 (2A-2N) | each issue's checks |
| 3 | Integration (planner): `app.ts` wiring (store, boxes, prompt, blip, aim blend, sounds, recoil, vehicle damage, achievements, net), help text, AGENT_INDEX, demo | 0 (planner) | build, tests, prefabs/achievements tests, zfight, smoke |

## Epic 2 issues

Common rules: [gta-gun-store/_common.md](gta-gun-store/_common.md). One file per issue:

| Issue | Files it owns |
|---|---|
| [2A mod prefabs (front)](gta-gun-store/epic-2/2A-mod-prefabs-front.md) | `packages/prefabs/src/catalog/gta-gun-mods-a.ts` |
| [2B mod prefabs (back)](gta-gun-store/epic-2/2B-mod-prefabs-back.md) | `packages/prefabs/src/catalog/gta-gun-mods-b.ts` |
| [2C store prefabs + gear](gta-gun-store/epic-2/2C-store-prefabs.md) | `packages/prefabs/src/catalog/gta-gun-store.ts` |
| [2D gun rig](gta-gun-store/epic-2/2D-gun-rig.md) | `gunRig.ts`, `gunRig.test.ts` |
| [2E weapons](gta-gun-store/epic-2/2E-weapons.md) | `weapons.ts` |
| [2F aim camera + player](gta-gun-store/epic-2/2F-aim-camera-player.md) | `camera.ts`, `player.ts` |
| [2G aim input](gta-gun-store/epic-2/2G-aim-input.md) | `input.ts`, `gamepad.ts` |
| [2H gun sounds](gta-gun-store/epic-2/2H-gun-sounds.md) | `gunSounds.ts` |
| [2I shop UI](gta-gun-store/epic-2/2I-gun-shop-ui.md) | `gunShop.ts` |
| [2J store world + back room](gta-gun-store/epic-2/2J-gun-store-world.md) | `gunStore.ts`, `gunStore.test.ts` |
| [2K gun sync](gta-gun-store/epic-2/2K-gun-sync.md) | `net.ts`, `net.test.ts`, `remotes.ts` |
| [2L achievements](gta-gun-store/epic-2/2L-achievements.md) | `packages/achievements/src/catalog.ts`, `gunAchievements.ts` (+ test), `docs/cosmetics.md` |
| [2M aim HUD](gta-gun-store/epic-2/2M-aim-hud.md) | `aimHud.ts` |
| [2N lore](gta-gun-store/epic-2/2N-lore.md) | `docs/lore/entries/apocrypha/ammu-gnation*.md`, `docs/lore/rulings.md` (R-055; R-054 went to chunk E) |

No issue depends on another inside the epic: shared signatures are fixed in the Epic 1 stubs and every runtime prefab lookup skips a
missing prefab.

The store sits outside `buildWorld` (it is added by `app.ts` with its own boxes), so `layout.golden.test.ts` is unchanged.
