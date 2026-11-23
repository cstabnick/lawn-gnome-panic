# Common rules for every gta-gun-store worker issue

## Environment

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-ab772fee2be1d5403` (a git worktree). Run every command from there, with absolute paths.
- Node: in Git Bash, if `node`/`npm`/`npx` is not found: `export PATH="/c/Program Files/nodejs:$PATH"` (on its own line, not in a command that also runs git).
- Dependencies are installed. Do not run `npm install`. Do not run `git commit`, `git stash` or any git command that changes the tree.
- About ten other workers are editing OTHER files of the same game (`games/gnome-theft-auto`) and of `packages/prefabs` at the same time. Edit only the files your issue names. If `tsc` reports errors in a file you do not own, another worker is mid-edit: ignore them, but your own files must have none.
- Do not start a dev server and do not run `vite build` (it writes `dist/`); the planner runs those at the end.

## The game

Gnome Theft Auto (`games/gnome-theft-auto`, three.js + TypeScript). This chunk adds **Ammu-Gnation**, a gun-mod store: every gun is free and
unlocked; the store sells MODS (scopes, suppressors, barrels, mags, stocks, finishes, charms). Each mod is a small `@lawn/prefabs` part bolted
onto the held gun, changes how it shoots, and some change its sound. Aiming down sights (right mouse held, a touch Aim toggle, gamepad left
trigger) zooms the camera over the shoulder.

The shared contract is already written and compiles. Read what your issue lists, do not change it:

- `games/gnome-theft-auto/src/gunMods.ts`: the mod catalogue `GUN_MODS` (ids, slots, prefabs, stats, sounds, finishes), `MOD_SLOTS`,
  `SLOT_NAMES`, `SLOT_ICONS`, `GunLoadout` (= `Partial<Record<ModSlot, string>>`), `moddedGun(gun, loadout): ModdedGun`, `modsFor(gun, slot)`,
  `slotsFor(gun)`, `normalizeGunLoadout`, `loadoutIds`, `loadoutCost(owned, wanted)`, the codes `encodeGunLoadout` / `decodeGunLoadout` /
  `encodeGunWire` / `decodeGunWire`, and the aim tuning `AIM`, `stepAim`, `aimZoom`.
- `games/gnome-theft-auto/src/gunModStore.ts`: what the player owns and has fitted per gun (`ownedMods`, `fittedLoadout`, `buyMods`,
  `fitLoadout`, `onGunModsChange`), saved in localStorage.
- `games/gnome-theft-auto/src/types.ts`: `Weapons` (now with `spec()`, `setLoadout`, `loadoutOf`, `setAim`), `InputState.aim`,
  `ChaseCamera.setAim(t, zoom)`.
- Stub files with final signatures: `gunRig.ts`, `gunSounds.ts`, `gunShop.ts`, `gunStore.ts`, `aimHud.ts`, `gunAchievements.ts`.
  If your issue fills one of them, keep every exported name and signature exactly as the stub has it.

Weapons (`GunKind`, in `config.ts` `GUN_ORDER`): `pistol`, `smg`, `shotgun`, `rifle` (the four FIREARMS) and `leaf-blower`, `acorn-mortar`,
`tow-whip`, `dandelion-grenade`, `trip-mine`. Their held prefabs are `GUNS[kind].prefab` (`gta-pistol`, `gta-smg`, `gta-shotgun`,
`gta-rifle`, `leaf-blower-cannon`, `acorn-mortar`, `tow-cable-whip`, `dandelion-puff-grenade`, `acorn-trip-mine`).

## Repo rules that apply

- Assets: generated in code only (prefab primitives, Web Audio, canvas). No downloaded files.
- New objects go through `@lawn/prefabs` (`buildPrefab`, `buildHeld`, `getPrefab`). Do not hand-build one-off meshes for items.
- UI: append your own container to the `ui` element you are given (the shared `#ui`); never restyle or hide `#ui` itself.
- Mobile: every touch target at least 44 px; no hover-only UI; layouts must fit a 390x844 portrait phone and a landscape phone (safe-area insets).
- 3D: flat things lying on other surfaces need a `@lawn/depth` draw layer (`flatLayer(material, LAYER.<x>)`); boxes that touch must not share a
  face (no two surfaces in the same plane facing the same way).
- Plain, short, concrete comments in the existing style (`//` lines above a block, `/** */` on exports).

## Checks every issue runs

- `npx tsc --noEmit -p games/gnome-theft-auto` (and `-p packages/prefabs` for prefab issues): no errors in your files.
- Any test command your issue lists.
- Read your finished files once top to bottom against the issue.
