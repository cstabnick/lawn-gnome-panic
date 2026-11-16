Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full, especially the UI rule and the screen layout.

## Goal
Inventory and equipment rules, and the RuneScape-style tabbed side panel: a 28-slot inventory grid, worn equipment, the character sheet (attributes and skills), the quest journal and the spellbook.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `ITEMS`/`ItemDef`, `EQUIP_SLOTS`, `INVENTORY_SIZE`, `SKILLS`, `ATTRIBUTES`, `SPELLS`, `QUESTS`, `TUNING`, `UI`, `InvSlot`, `Entity`.
- `games/gnomes-of-gnomomia/src/state.ts`: `state`, `maxHp`, `maxMp`, `equippedArmor`, `equippedWeapon`.
- `games/gnomes-of-gnomomia/src/inventory.ts` and `src/ui/panels.ts`: the stubs you replace.

## Change
### `games/gnomes-of-gnomomia/src/inventory.ts`
Imports: `state, maxHp, maxMp` from `'./state'`; `bus, say` from `'./events'`; `getEntity, removeEntity, spawnLoot` from `'./entities'`; `player` from `'./player'`; config.
- `addItem(item, count = 1)`: stackable → add to the slot holding it, else the first empty slot; non-stackable → one item per empty slot (add as many as fit). If not everything fit: `say('Your inventory is full.', UI.bad)` and return false. Emit `item-added` with the number actually added (if > 0) and `changed`.
- `removeItem(item, count = 1)`: false if `countItem(item) < count`; otherwise remove across slots (null out empty ones), emit `changed`, return true.
- `countItem(item)`: total across slots.
- `equipFromSlot(i)`: the item must have a `slot`; swap it with whatever is in `state.equipment[slot]` (the old item goes into slot i, or slot i becomes null). `say(`You equip the ${name}.`)`. Emit `changed`.
- `unequip(slot)`: needs an empty inventory slot (else `say('Your inventory is full.', UI.bad)`); moves it there; emit `changed`.
- `useFromSlot(i)`: potion kind → apply `heal` (hp capped at `maxHp()`) and `mana` (capped at `maxMp()`), decrement the stack, `say(id === 'mushroom' ? 'You eat the mushroom.' : `You drink the ${name}.`)`, emit `heal` with the hp gained (if any) and `changed`. Items with a `slot` → `equipFromSlot(i)`. Misc → `say(def.examine, UI.textWhite)`.
- `dropFromSlot(i)`: `spawnLoot(player.position.x, player.position.z, [slot copy], 0)`, slot null, `say(`You drop the ${name}.`)`, `changed`.
- `pickUpLoot(id)`: `e = getEntity(id)`; must be `kind === 'loot'`. Gold: `state.gold += e.gold`, `e.gold = 0`, say `You take ${n} gold.` in `UI.gold` when n > 0. For each loot slot: `addItem`; keep slots that did not fit in `e.loot` (approximate is fine: if `addItem` returned false keep that slot). Say `You take: ${names joined by ', '}.` for what was taken. If `e.loot` is now empty, `removeEntity(id)`. Emit `changed`.

### `games/gnomes-of-gnomomia/src/ui/panels.ts`
Imports: inventory functions above; `castSpell` from `'../combat'`; `skillXpToNext, attributeMod` from `'../rules'`; `showContextMenu` from `'./hud'`; `bus`; state; config.
- `createPanels(root)`: append `div#panels` bottom-right (8 px from the right and bottom), 250 px wide, 360 px tall (on screens narrower than 700 px: 200 px wide, 300 px tall, and bottom 110 px so it clears the chat), `UI.panelBg`, `border: 2px solid UI.border`, `pointer-events: auto`, `font-family: UI.font`, 13 px.
- Tab bar of 5 square buttons at the top: 🎒 Inventory, 🛡️ Equipment, 📊 Stats, 📜 Quests, 🔮 Spells (title attribute = the name). Active tab has a lighter background (`UI.borderLight`). Hotkeys (window keydown, ignored in inputs): `i` inventory, `e` equipment, `c` stats, `j` quests, `b` spells.
- Re-render the active tab on bus `changed`, `quest-updated`, `skill-up`, `level-up`, `item-added`, and every 500 ms (for hp/mp and spell availability).
- Inventory tab: a 4 x 7 grid of 50 x 44 px cells (`INVENTORY_SIZE` = 28). Each filled cell shows the item `icon` (24 px) and, if `count > 1`, the count in small `UI.gold` text top-left; `title` = name. Left click → `useFromSlot(i)`. Right click (`contextmenu`, `preventDefault`) → `showContextMenu(e.clientX, e.clientY, [...])` with: `Drink ${name}` / `Eat ${name}` (potions; mushroom = Eat), `Wield ${name}` (weapons/shields) or `Wear ${name}` (armor), then `Drop ${name}`, then `Examine ${name}` (`say(def.examine, UI.textWhite)`). Under the grid: `🪙 ${state.gold} gold` in `UI.gold`.
- Equipment tab: one row per `EQUIP_SLOTS` entry: slot name, item icon and name (or `empty` in `UI.textDim`); click a filled row → `unequip(slot)`. Below: `Armor rating: ${equippedArmor()}` and the weapon line `Damage: 1d6 (Blade)` from `equippedWeapon()` (fists: `1d2 (Blunt)`).
- Stats tab: `Level ${state.level}`, `Skill-ups to next level: ${state.skillUps}/${TUNING.skillUpsPerLevel}`, `HP ${state.hp}/${maxHp()}`, `MP ${state.mp}/${maxMp()}`. Attributes: name, value and modifier (`+0`, `+1`, `-1` via `attributeMod`). Skills (from `SKILLS`): name, level, and a thin xp bar (`state.skills[id].xp / skillXpToNext(level)`, fill `UI.good`); `title` = `about`. Scroll if it overflows.
- Quests tab: for each `QUESTS` entry: not started → name in `UI.bad` (RuneScape red); active → name in `UI.gold` + the current stage text in `UI.text`, with progress for kill objectives `(${q.count}/${need})` and collect objectives `(${countItem(item)}/${need})`; done → name in `UI.good` with ` ✔`.
- Spells tab: one row per `SPELLS` entry: icon, name, `[${key}]`, `${cost} MP`, `about` in small text; click → `castSpell(id)`. Dim the row (opacity 0.5) when `state.mp < cost`.

## Contract
All exports keep their stub signatures. Emit `item-added` only for items actually added (quests count on it).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/inventory.ts` or `src/ui/panels.ts`.

## Out of scope
`src/ui/hud.ts`, `src/ui/shop.ts`, `src/ui/dialogue.ts`, `src/entities.ts`, `src/combat.ts` and all other files.
