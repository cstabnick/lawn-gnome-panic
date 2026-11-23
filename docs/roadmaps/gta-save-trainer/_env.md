# Environment (every Save Trainer issue)

- Repo: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn`. Game: `games/gnome-theft-auto` (Vite + TypeScript + three.js). In Git Bash, if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers and other planners edit other files of this game at the same time. Edit ONLY the files your issue lists under Change. Do not commit, push, stash or switch branches. Do not run `vite build` / `npm run build` and do not start a dev server.
- `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you did not touch (others are mid-edit): ignore those, but your own files must have none.
- The trainer foundation already exists, read it before you start:
  - `games/gnome-theft-auto/src/trainer/types.ts`: `TrainerCtx` (the live game objects: player, economy, watch, weapons, fleet, critters, hunting, npcs, lockup, atmosphere, cutscene, emote, hud, scene, camera, world, vehicles, ui, isAchievementUnlocked), `TrainerSection`, `TrainerSpawnable`, `TrainerSpot`.
  - `games/gnome-theft-auto/src/trainer/registry.ts`: `registerTrainerSection(s)`, `listTrainerSections()`, `registerTrainerSpawnable(group, id, label, spawn)`, `listTrainerSpawnables()`.
  - `games/gnome-theft-auto/src/trainer/ui.ts`: DOM helpers, use them for every control: `heading(text)`, `note(text)`, `grid(...els)`, `row(label|null, ...els)`, `button(label, onClick, sub?)`, `setButtonText(b, label, sub?)`, `confirmButton(label, onConfirm, sub?)` (two taps), `select(options, value?)`, `input({type, value, placeholder, rows})` (swallows key presses), `status()` -> `{ el, set(text, error?) }`, `reloadSoon(ms?)`. A button with class `on` is shown as selected (`b.classList.toggle('on', x)`).
  - `games/gnome-theft-auto/src/trainer/mark.ts`: `markTrainerModified(what: string)` -- call it after any trainer action that changes SAVED progress (localStorage save keys), never for session-only things (heat, health, spawns, try-on gear, time of day).
  - `games/gnome-theft-auto/src/trainer/aim.ts`: `trainerSpot(ctx): TrainerSpot` -- the ground point under the camera's aim, or 7 m ahead.
  - `games/gnome-theft-auto/src/trainer/panel.ts`: `closeTrainerPanel()`, `refreshTrainerTab()` (rebuilds the shown tab).
- A section's `build(container, ctx)` is called every time its tab is shown, with an empty container. Build DOM there, nothing at import time, no `requestAnimationFrame` loops, no timers left running.
- Rules (AGENTS.md): every control at least 44 px tall (the ui.ts helpers are), no hover-only UI, must fit a 390x844 phone (the panel is at most 460 px wide and scrolls). Use each game system's own public functions; never copy game logic. Do not edit any file outside your list (in particular not gun*, glaze*, handling.ts, simdrive.ts, camera.ts, hunting/, party/, events/, craft/, app.ts, types.ts, config.ts).
- Plain player-facing text, short. No emojis except where the issue says.
