Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full, especially the UI rule and the screen layout.

## Goal
Elder-Scrolls-style villagers: data-driven NPC conversations with choices, quests that start from dialogue and track kills, collected items and turn-ins, and shops to buy and sell.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `NPCS`/`NpcDef`/`DialogueNode`/`DialogueOption`/`DialogueAction`/`Condition`, `QUESTS`/`QuestDef`/`QuestStage`/`Objective`, `ITEMS`, `TUNING` (talkRange), `UI`.
- `games/gnomes-of-gnomomia/src/state.ts`: `state` (`quests: Record<string, QuestProgress>`, `gold`, `hp`), `maxHp`.
- `games/gnomes-of-gnomomia/src/quests.ts`, `src/ui/dialogue.ts`, `src/ui/shop.ts`: the stubs you replace.

## Change
### `games/gnomes-of-gnomomia/src/quests.ts`
Imports: `state`; `bus, say`; `addItem, removeItem, countItem` from `'./inventory'`; config.
- `questStatus(id)`: no entry → `'none'`; `done` → `'done'`; else `'active'`.
- `checkCondition(c)`: undefined → true. All given fields must hold: `c.quest` → `questStatus(c.quest.id) === c.quest.status`; `c.questStage` → the quest is active and `state.quests[id].stage === c.questStage.stage`.
- `startQuest(id)`: ignore if already started. `state.quests[id] = { stage: 0, count: 0, done: false }`; `say(`Quest started: ${name}`, UI.quest)`; emit `quest-updated` and `changed`; then check the stage (a collect objective may already be met).
- Stage check: for an active quest's current stage: `collect` met when `countItem(item) >= count`; `kill` met when `q.count >= count`; `talk` is only met by a talk event. When met, advance.
- Advance: if the stage has `takeItems`, remove them first. `stage++`, `count = 0`. Past the last stage → complete. Otherwise `say(`Quest updated: ${next stage text}`, UI.quest)`, emit `quest-updated` + `changed`, and check the new stage.
- Complete: `done = true`; `state.gold += reward.gold`; `addItem` each reward item; `say(`Quest complete: ${name}!`, UI.gold)` then `say(`Reward: ${gold} gold, ${item names with counts}.`, UI.gold)`; emit `quest-updated` + `changed`.
- `initQuests()` subscribes:
  - `talk` → for each active quest whose current stage is `{ type: 'talk', npc }` with `npc === npcId`: if the stage has `takeItems` and you lack any (`countItem < count`), `say(`You still need ${count} x ${item name}.`, UI.bad)`; otherwise advance.
  - `enemy-killed` → active quests on a `kill` stage for that `defId`: `count++`, `say(`${quest name}: ${count}/${need}`, UI.quest)`, then check the stage.
  - `item-added` → check every active quest's stage.

### `games/gnomes-of-gnomomia/src/ui/dialogue.ts`
Imports: `checkCondition, startQuest` from `'../quests'`; `openShop` from `'./shop'`; `getEntity` from `'../entities'`; `player` from `'../player'`; `bus, say`; `state, maxHp`; config.
- `createDialogue(root)`: build a hidden box bottom-centre, 170 px from the bottom, `width: min(560px, 94vw)`, `UI.panelBg`, `border: 2px solid UI.border`, `pointer-events: auto`, padding 12 px. Subscribe to `talk` HERE (main.ts calls this before `initQuests`, so the greeting is chosen from the state before a turn-in).
- On `talk { npcId, entityId }`: `def = NPCS[npcId]`; node = the first `def.greetings` entry whose `when` passes `checkCondition` (or has none); show it.
- Show a node: header = NPC name in `UI.gold` 16 px bold; the node `text` in `UI.text`; then the options whose `when` passes, numbered `1. text`, each a clickable row (hover `UI.textWhite`). Number keys `1`-`9` pick options while open (window keydown).
- Picking an option: run `action` if any: `startQuest` → `startQuest(quest)`; `openShop` → `openShop(npcId)` and close the dialogue; `heal` → if `state.gold >= 5`: `state.gold -= 5`, `state.hp = maxHp()`, `say(`${npc name} patches you up for 5 gold.`, UI.good)`, emit `changed`; else `say('You need 5 gold for that.', UI.bad)`; `close` → close. Then if `next` → show that node, else close (unless already closed).
- Every 250 ms while open: close if `getEntity(entityId)` is gone or 2D distance to `player.position` > `TUNING.talkRange + 3`.
- `isDialogueOpen()`, `closeDialogue()`.

### `games/gnomes-of-gnomomia/src/ui/shop.ts`
Imports: `addItem, removeItem` from `'../inventory'`; `getEntity, allEntities` from `'../entities'`; `player`; `bus, say`; `state`; config.
- `createShop(root)`: a hidden centred window, 440 px wide (max 94vw), `UI.panelBg`, `border: 2px solid UI.border`, `pointer-events: auto`, with a title `${npc name}'s Shop`, a close button `✕` top-right, and two sections.
- `openShop(npcId)`: show `NPCS[npcId].shop` items in "For sale": a grid of cells with icon, name and `${value} gp`; click buys one: needs `state.gold >= value` (else `say('You cannot afford that.', UI.bad)`); `addItem(id)` must succeed; then `state.gold -= value`, `say(`You buy the ${name}.`)`, emit `changed`. "Sell" section: every filled inventory slot (`state.inventory`) with icon, count, and `${Math.max(1, Math.floor(value / 2))} gp`; click sells one: `removeItem(id, 1)`, `state.gold += price`, `say(`You sell the ${name}.`)`, emit `changed`. Show the player's gold at the bottom. Re-render on bus `changed` while open.
- Close when `closeShop()` is called, the ✕ is clicked, or (checked every 250 ms) the player is more than `TUNING.talkRange + 3` from that NPC entity (find it in `allEntities()` by `kind === 'npc' && defId === npcId`).

## Contract
All exports keep their stub signatures. `dialogue.ts` subscribes to `talk` inside `createDialogue`; `quests.ts` subscribes inside `initQuests`.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/quests.ts`, `src/ui/dialogue.ts` or `src/ui/shop.ts`.

## Out of scope
`src/inventory.ts`, `src/ui/hud.ts`, `src/ui/panels.ts`, `src/config.ts` and all other files.
