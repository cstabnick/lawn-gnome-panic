Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
The trainer's **Character** tab (`src/trainer/sections/character.ts`, id `character`, order 20): health, Acorns and Kiln-Debt, Hat Watch heat, perks, achievements (read-only), gear try-on for every slot, and (from another file) the story/quest and hunting editors.

## Read first
- `games/gnome-theft-auto/src/trainer/sections/character.ts` (stub: keep `export function registerCharacterSection(): void`)
- `games/gnome-theft-auto/src/types.ts`: `interface Player` (`health` 0..1, `hurt(amount)`, `respawn(x, z, yaw)`, `vehicle`, `model: GnomeModel`), `interface Watch` (`heat`, `addHeat(a)` clamps to 0..MAX_HEAT, `clear()`).
- `games/gnome-theft-auto/src/economy.ts`: `Economy` (`state()` -> `{ acorns, debtRemaining, debtPaidOff }`, `earn(amount, reason)`, `spend(amount, reason)` -> boolean, `payDebt(amount)` -> paid; payDebt takes the Acorns from the wallet).
- `games/gnome-theft-auto/src/config.ts`: `MAX_HEAT` (4).
- `games/gnome-theft-auto/src/perks.ts`: `listPerks()` -> `{ def: { id, name, text, questId }, active, source: 'quest'|'granted'|'revoked'|'locked' }[]`, `grantPerk(id)`, `revokePerk(id)`, `clearPerkOverride(id)`.
- `packages/achievements/src/index.ts` / `types.ts`: `achievementsForGame('gnome-theft-auto')` -> `AchievementDef[]` (`id, title, description, reward?: { slot, prefabId, label }`).
- `packages/gnome/src/gear.ts` (`buildGear(slot, id)`, `gearSlotFor(def)`) and `packages/gnome/src/types.ts` (`GnomeModel.rig`, `arms.right`, `setEquipmentOverride?(slot, overridden)`), `packages/prefabs/src/registry.ts` (`allPrefabs()`, `getPrefab(id)`; a `PrefabDef` has `id`, `name`).
- `games/gnome-theft-auto/src/player.ts` line ~32: the player model is made with `overrideEquipment: ['hand']` (the game owns the hand for guns).

## Change
- `games/gnome-theft-auto/src/trainer/sections/character.ts` only. `registerCharacterSection()` registers `{ id: 'character', label: 'Character', order: 20, build }`. `build(el, ctx)` appends one `status()` line at the top, then these blocks (each a `heading` + controls). After a change, update the numbers shown (repaint that block, or call `refreshTrainerTab()` from `../panel`).
  1. **Health**: note `Health: NN%` (`Math.round(ctx.player.health * 100)`); buttons "Heal" (`ctx.player.health = 1`), "Hurt 25%" (`ctx.player.hurt(0.25)`), "Get up here" (on foot only: `ctx.player.respawn(ctx.player.x, ctx.player.z, ctx.player.yaw)`; in a vehicle: status "Get out first."). Session only, no mark.
  2. **Acorns & Kiln-Debt**: note `Acorns: A · Kiln-Debt left: D` from `ctx.economy.state()`. A `row('Set Acorns', numberInput, button('Set'))`: target = max(0, round(value)); delta = target - acorns; `delta > 0 ? earn(delta, 'trainer') : spend(-delta, 'trainer')`. Buttons "+100", "+1,000", "+10,000" (`earn`). Button "Pay 500 Kiln-Debt" (`payDebt(500)`, status shows what was paid). Every one of these calls `markTrainerModified('acorns ' + newAcorns)` (or `'debt ' + ...`).
  3. **Hat Watch**: note `Heat: N / MAX_HEAT` (`Math.floor(ctx.watch.heat)`); a grid of buttons "0".."4" (MAX_HEAT): `ctx.watch.clear()` then, for n > 0, `ctx.watch.addHeat(n)`. Session only, no mark. Mark the current one `on`.
  4. **Perks**: note "Perk changes stay on this device." For each `listPerks()` entry: a note line `name: text (source)` and a `row(null, ...)` with buttons "On" (`grantPerk`), "Off" (`revokePerk`), "Auto" (`clearPerkOverride`, sub "from its quest"); the button matching the state gets `on` (granted -> On, revoked -> Off, quest/locked -> Auto). Repaint after a click. No mark (perk overrides are not in the save bundle).
  5. **Achievements (read only)**: note "Achievements belong to your account and every game, so the trainer never unlocks or resets them. Try their gear on below." For each `achievementsForGame('gnome-theft-auto')`: a row with the title, a "✓" or "·" filled in async from `await ctx.isAchievementUnlocked(def.id)` (start as "…"), and when `def.reward` exists a button "Try on" -> `tryOn(def.reward.slot, def.reward.prefabId)`. 30+ rows: put the list inside a `<details>` with `<summary>` "N achievements" (summary min-height 44px).
  6. **Gear try-on (this session)**: note "Not saved: your own gear comes back on reload." For each slot of `['head', 'back', 'neck', 'hand']`: `row(slot, select([{ value: '', label: '(your own)' }, ...allPrefabs().filter(d => gearSlotFor(d) === slot).map(d => ({ value: d.id, label: d.name }))], worn id or ''))`; on change -> `tryOn(slot, value)`. Plus button "Take it all off" (tryOn every slot with '').
     `tryOn(slot, id)` (module-level, with `const worn: Partial<Record<EquipSlot, { id: string; obj: THREE.Object3D }>> = {}`): remove the previous `worn[slot].obj` from its parent; if `id === ''`: delete `worn[slot]` and, unless slot is 'hand', `ctx.player.model.setEquipmentOverride?.(slot, false)`; else: `setEquipmentOverride?.(slot, true)` (skip for 'hand': the game already overrides it), `const obj = buildGear(slot, id)`, add it to `slot === 'hand' ? ctx.player.model.arms.right : ctx.player.model.rig`, store it. Status `Wearing <name>` / `Back to your own <slot>`.
  7. **Story & quests**: `heading('Story & quests')`, a `div`, then `buildStoryEditor(div, ctx)` from `./progress`.
  8. **Hunting**: `heading('Hunting')`, a `div`, then `buildHuntEditor(div, ctx)` from `./progress`.
  9. A last note: "Emotes and every animation: the Animations tab."

## Contract
`export function registerCharacterSection(): void`. Uses (do not edit) `./progress`: `buildStoryEditor(el: HTMLElement, ctx: TrainerCtx): void`, `buildHuntEditor(el: HTMLElement, ctx: TrainerCtx): void` (another worker writes them now; the stub already has these signatures).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/trainer/sections/character.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/trainer src/perks.test.ts` passes.

## Out of scope
`sections/progress.ts` (another worker), perks.ts, economy.ts, player.ts, police.ts, packages/*, every other file.
