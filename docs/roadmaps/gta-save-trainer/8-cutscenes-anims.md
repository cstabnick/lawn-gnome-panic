Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
Two trainer tabs: **Cutscenes** (`src/trainer/sections/cutscenes.ts`, id `cutscenes`, order 60): every scripted scene, grouped (story, side, races, labs, other), searchable, played by id with a skip button, the player put back afterwards, and the trainer reopened. **Animations** (`src/trainer/sections/animations.ts`, id `animations`, order 70): play any gnome animation by id on the player, stop it.

## Read first
- `games/gnome-theft-auto/src/trainer/sections/cutscenes.ts`, `animations.ts` (stubs: keep `registerCutsceneSection()` / `registerAnimationSection()`).
- `games/gnome-theft-auto/src/cutscene/scenes/index.ts`: `SCENES: Record<string, SceneScript>` and the records it spreads: `SIDE_SCENES` (`./side`), `CH1_SCENES`, `CH1B_SCENES`, `CH1C_SCENES`, `CH1D_SCENES`, `CH2_SCENES`, `CH2B_SCENES`, `CH2C_SCENES`, `CH2D_SCENES`, `CH3_SCENES`, `CH4_SCENES`, `CH5_SCENES` (`./story/ch*`), `SPEEDWAY_SCENES` (`./speedway`), `LAB_SCENES` (`./lab`). `SceneScript` (`cutscene/script.ts`): `id`, `title?`.
- `games/gnome-theft-auto/src/quests/types.ts`: `CutsceneHandle` (`active`, `play(req, onDone, opts?)`, `skip()`); request for a script: `{ kind: 'script', script }`; `opts.onTrigger(name, arg)`.
- `games/gnome-theft-auto/src/app.ts`: search for `?cutscene=<id>` (the `sceneId` block): how a scene is played by id today, including the `onTrigger` that dispatches `gta:cutscene-trigger`. Do the same.
- `games/gnome-theft-auto/src/anim/index.ts`: `ANIMS` (`id`, `label`, `icon`, `category`, `loop`), `ANIM_TABS` (`category`, `title`). `games/gnome-theft-auto/src/anim/playerEmote.ts`: `PlayerEmote.play(id)` -> boolean, `stop()`, `active`.

## Change
- `games/gnome-theft-auto/src/trainer/sections/cutscenes.ts`: `{ id: 'cutscenes', label: 'Cutscenes', order: 60, build }`.
  - Groups (in order): "Story" = keys of the eleven CH*_SCENES records, "Side quests" = SIDE_SCENES, "Races" = SPEEDWAY_SCENES, "Labs" = LAB_SCENES, "Other" = every other key of SCENES. Import the records from `../../cutscene/scenes/...` (same paths index.ts uses).
  - `build(el, ctx)`: `status()`; note "Plays the scene now, where you stand. The trainer closes and comes back when it ends."; a search `input` filtering by id or title (re-render the lists on `input`); per group a `<details>` (summary `${group} (${n})`, min-height 44px; "Story" open by default) holding a `grid` of `button(script.title ?? id, play, id)`.
  - `play(id)`: if `ctx.cutscene.active` -> status error "A scene is already playing.". Remember `{ x, z, yaw, onFoot: !ctx.player.vehicle }` of the player. `closeTrainerPanel()` (from `../panel`). Add a skip pill to `ctx.ui`: a `<button>` "Skip scene", `position:fixed; left:calc(env(safe-area-inset-left) + 10px); bottom:calc(env(safe-area-inset-bottom) + 10px); z-index:70; min-height:44px; padding:8px 16px; border-radius:999px; border:2px solid rgba(255,255,255,.7); background:rgba(0,0,0,.6); color:#fff; font:700 14px system-ui,sans-serif;` with `pointerdown` -> `stopPropagation()` and click -> `ctx.cutscene.skip()`. Then `ctx.cutscene.play({ kind: 'script', script: SCENES[id] }, onDone, { onTrigger: (n, a) => window.dispatchEvent(new CustomEvent('gta:cutscene-trigger', { detail: { name: n, arg: a, quest: null } })) })`.
    `onDone`: remove the pill; if the player started on foot, is on foot now and is more than 3 m from the remembered spot -> `ctx.player.respawn(x, z, yaw)`; `ctx.hud.toast(`Scene "${id}" done`, 3000)`; reopen the trainer on this tab with `window.dispatchEvent(new CustomEvent('gta:trainer', { detail: { tab: 'cutscenes' } }))`.
    If `play` returns without starting (check `ctx.cutscene.active` right after the call; false means it refused) remove the pill and toast "Could not start that scene."
- `games/gnome-theft-auto/src/trainer/sections/animations.ts`: `{ id: 'animations', label: 'Animations', order: 70, build }`. `build(el, ctx)`: `status()`; note "Plays on the gnome when standing on foot. Close the trainer to watch; moving stops it."; a row of buttons "Stop" (`ctx.emote.stop()`) and "Close to watch" (`closeTrainerPanel()`); then for each `ANIM_TABS` entry: `heading(title)` + a `grid` of `button(`${a.icon} ${a.label}`, ..., a.id)` for `ANIMS` of that category. Click: `ctx.player.vehicle` -> status error "Get out of the vehicle first."; else `ctx.emote.play(a.id)` false -> status error `Could not play ${a.id}`, true -> status `Playing ${a.label}${a.loop ? ' (loops)' : ''}`.
  Nothing here is saved: never call `markTrainerModified`.

## Contract
`export function registerCutsceneSection(): void`, `export function registerAnimationSection(): void`. The trainer reopens on the window event `'gta:trainer'` with `detail: { tab }` (install.ts already listens: it toggles, and opens on `tab` when closed).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your two files.
- `cd games/gnome-theft-auto && npx vitest run src/trainer` passes.

## Out of scope
cutscene/*, quests/*, anim/*, app.ts, every other file.
