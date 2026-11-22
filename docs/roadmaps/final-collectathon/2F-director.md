Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling the other modules (`collect.ts`, `hud.ts`, `input.ts`, `player.ts`, `office.ts`, `music.ts`, ...) right now. You code only against their interfaces in `types.ts`; their stubs already compile. Edit only `src/director.ts`. `tsc` may show errors in their files mid-edit; only yours must be clean.

## Goal

Replace the stub `src/director.ts` with the director: it runs the chapters in order, implements every member of
`ChapterCtx` (the API the chapter scripts are written against), and drives each frame (input → player →
collecting → waits → interactions → HUD counters). It also owns the lift ride, the easter-egg bookkeeping and saving.

## Read first

- `games/final-collectathon/src/types.ts`: `ChapterCtx`, `Director`, `DirectorDeps`, and every interface they use. This is the contract.
- `games/final-collectathon/src/config.ts`: `CHAPTER_ORDER`, `CHAPTER_FLOOR`, `CHAPTER_TITLES`, `LIFT_BUTTONS`, `SPEAKERS`, `NARRATOR_NAME`, `EGGS`, `EGG_COUNT`, `ACH`, `ITEM_KINDS`, `ITEM_ORDER`, `TUNING` (`interactRadius`, `comboGap`).
- `games/final-collectathon/src/collect.ts`: `stepCollect`, `scatter`, `rain`, `spawnItem`, `formatCount`, `clearItems` (signatures; the bodies are being written now).
- `games/final-collectathon/src/save.ts`: `writeSave`, `resetSave`. `src/chapters/index.ts`: `CHAPTERS`.
- `packages/prefabs/src/icon.ts`: `prefabIcon(id)` returns a cached PNG data URL or null.

## Change

`createDirector(deps: DirectorDeps): Director`. Internal state: speaker display names (start from `SPEAKERS[who].name`),
the current control mode, camera mode, listener lists, pending waits, timers, the set of item kinds "seen" this
floor, combo counter.

### Time

All waiting uses **game time** advanced in `tick(dt)`, not `setTimeout`. With `deps.fast`, `wait(s)` waits `s / 10`
and every `say` gets `auto = 0.2` (unless the chapter gave a smaller auto). Implement `wait` as a pending
`{ until: number; resolve }` list checked each tick.

### `tick(dt)`

1. `const input = deps.input.read()`. If the HUD is showing a line or a choice (track it yourself: count in-flight `say`/`choose` calls), or the mode is `locked`, pass a zeroed input to the player.
2. `deps.player.update(dt, input, deps.getFloor())`.
3. `const picks = stepCollect(deps.collect, [deps.player.pos], dt)`; for each pickup: `deps.items.burst(p)`, combo (+1 if the last pickup was within `TUNING.comboGap` s, else 1), `deps.sfx.pickup(p.kind, combo)`, `deps.music.pickup()`, call every `onPickup` listener. Then `deps.items.sync(deps.collect, dt)`.
4. Waits: resolve `waitCount` when `collect.counts[kind] >= n`, `waitTotal` when `collect.total >= n`, `waitArea` / `onArea` on entering the rect (edge-triggered: fires when the player goes from outside to inside), timers (`wait`, `every`).
5. Interaction: candidates are `floor.layout.interactables` plus the lift `{ id: 'elevator', label: 'Lift', x: layout.elevatorX, z: -layout.d / 2 + 1.2, radius: TUNING.interactRadius }`, but only ids that currently have an `onInteract` listener or a pending `waitInteract`. The nearest one within its radius (xz distance to the player) sets `deps.input.setInteract(label)`; none → `setInteract(null)`. Only call `setInteract` when the label changes. On `input.interactPressed` with a candidate in range (and controls not locked, no line showing): call its listeners and resolve its `waitInteract`s.
6. HUD counters at 10 Hz: one `CounterRow` per kind in `ITEM_ORDER` that is "seen" (spawned or counted > 0 since the run started), `value: formatCount(collect.counts[kind])`, `label: ITEM_KINDS[kind].label`, `icon: prefabIcon(ITEM_KINDS[kind].prefab) ?? ITEM_KINDS[kind].emoji` (cache icons per kind; `prefabIcon` may return null at first, retry later).
7. Track `save.bestTotal = max(save.bestTotal, collect.total)` (write the save at most every 5 s).

### `ChapterCtx` members

- `player`, `collect`, `hud`, `save`: the deps. `floor()`: `deps.getFloor()`.
- `name(who, display)`: set the display name.
- `say(who, text, opts)`: `deps.sfx.voice(who, text)`, then `await deps.hud.say(who, displayName[who], text, auto)`. `lines(list)`: `say` each in order.
- `choose(prompt, options)`: `deps.sfx.play('ui')` after the pick; returns `deps.hud.choose(...)`.
- `toast(title, body)`: `deps.sfx.play('toast')` + `deps.hud.toast`. `setGoal`: `deps.hud.setGoal`.
- `spawn(kind, n, area)`: look up `floor().layout.areas[area]` (if missing: `console.warn` and use the whole floor `{-w/2+1, -d/2+1, w/2-1, d/2-1}`), `scatter(...)`, mark the kind seen, return the count. `rain` likewise with `rain(...)`. `spawnAt` → `spawnItem`. `spawnLine(kind, n, from, to, y)`: n items evenly spaced from `from` to `to` inclusive.
- `count(kind)`: `collect.counts[kind]`.
- `waitCount`, `waitTotal`, `waitInteract`, `waitArea`, `wait`: Promises resolved in `tick` (resolve immediately if already true for count/total/area).
- `onPickup(fn)`, `onInteract(id, fn)`, `onArea(area, fn)`, `every(seconds, fn)`: return an unsubscribe function. `every` fires each `seconds` of game time (fast mode: same scaling as `wait`).
- `setControls(mode)`: `player.mode = mode`; `deps.input.setEnabled(mode !== 'locked')`.
- `camera(mode)`: stored; `cameraMode()` returns it.
- `goToFloor(id)`: `await hud.fade(1, 0.5)`, `deps.setFloor(id)`, clear the seen-kinds set, teleport the player to the new layout's `spawn` (y = `floor.groundAt(spawn.x, spawn.z)`), `await hud.fade(0, 0.5)`.
- `rideElevator(to)`:
  1. `setGoal('Take the lift')` if no goal is set; `await waitInteract('elevator')`.
  2. Lock controls, `floor().setElevatorOpen(true)`, `sfx('ding')`, `player.moveTo(elevatorX, 0, -d/2 + 0.4, 0.8)`, `floor().setElevatorOpen(false)`, `await hud.fade(0.85, 0.4)`.
  3. Remember `music.current()`, `music.muffle(true)`.
  4. Panel loop: `const i = await hud.choose('Floor?', LIFT_BUTTONS.map(b => b.label))`. If the button's floor is `to`: break. If it is `null` (B): the basement gag (below), then loop. Otherwise `toast('That floor is not part of your interview.')`, `sfx('denied')`, loop.
  5. `await wait(1.5)`, `sfx('ding')`, `deps.setFloor(to)`, teleport to the new floor's spawn, `music.muffle(false)`, `floor().setElevatorOpen(true)`, `await hud.fade(0, 0.5)`, `floor().setElevatorOpen(false)`, `setGoal(null)`, unlock controls (`walk`).
  - Basement gag (say these as `narrator`, then `egg('basement')`):
    - "Floor B. Where the collectibles are made."
    - "Hundreds of gnomes, gluing acorns back together so you can find them again. It's very moving. Don't look too closely."
    - "Anyway. That's not your floor."
- `music(track)`: `null` → `deps.music.stop()`, else `deps.music.play(track)`. `intensity(x)` → `deps.music.intensity`. `sfx(name)` → `deps.sfx.play`.
- `unlock(id)`: `void deps.achievements.unlock(id)`. `increment(id, by)`: `void deps.achievements.increment(id, by)`.
- `egg(id)`: if `save.eggs` already has it, do nothing. Else push, `writeSave`, `sfx('fanfare')`, `toast('Easter egg: ' + EGGS[id], save.eggs.length + ' of ' + EGG_COUNT + ' found')`, `increment(ACH.eggs)`.

### `run(from, forced)`

1. Mute wiring once: `deps.hud.onMute(m => { deps.music.setMuted(m); deps.sfx.setMuted(m); })`.
2. If `!forced && save.chapter !== 'prologue' && !save.finished`: `choose(null, ['Continue: ' + CHAPTER_TITLES[save.chapter].title, 'Start over'])`; continue sets `from = save.chapter`; start over calls `resetSave()` and copies its fields into `deps.save` (keep the same object), `from = 'prologue'`. If `save.finished` and not forced: start from the prologue without asking (keep eggs).
3. For each chapter id from `from` in `CHAPTER_ORDER`: `save.chapter = id; writeSave(save)`; `name('narrator', NARRATOR_NAME[id])`; if `deps.getFloor().id !== CHAPTER_FLOOR[id]`: `deps.setFloor(CHAPTER_FLOOR[id])` and teleport to its spawn (no fade). Camera `follow`, controls `walk`. If `CHAPTER_TITLES[id].kicker` is not empty: lock controls, `await hud.titleCard(kicker, title, sub)`, unlock. `await CHAPTERS[id].run(ctx)`. After a chapter, unsubscribe any listeners it left behind (keep the list of unsubscribers made during the chapter and call them), cancel its `every` timers, and drop its pending waits.
4. After the ending: `save.finished = true; writeSave(save)`.
5. Wrap each chapter in try/catch: on error `console.error` it and continue with the next chapter (a broken chapter must not stop the game).

## Contract

```ts
export function createDirector(deps: DirectorDeps): Director;
```
`Director` and `ChapterCtx` exactly as in `types.ts`. The chapter scripts (written in the next epic) call nothing but
`ChapterCtx`, so every member must work as described above.

## Done when

- `npx tsc --noEmit -p games/final-collectathon` shows no errors in `src/director.ts`.
- Read your `tick` once more and check: a `say` in progress freezes movement; `every` timers stop after their chapter; `waitArea` is edge-triggered; the lift panel shows six buttons and only `to` proceeds.

## Out of scope

Every other file under `games/final-collectathon/` (`types.ts`, `config.ts`, `app.ts` are fixed), all packages.
