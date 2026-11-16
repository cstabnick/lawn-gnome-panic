Epic: 2, Systems
Depends on: none

## Goal
Dialogue supports pack greetings and topics, the new actions (flags, the Calling, respec, travel, give and take items), and trainer NPCs. Shops use merged stock and refuse quest items.

## Read first
- `games/gnomes-of-gnomomia/src/ui/dialogue.ts`, `src/ui/shop.ts` (both, all)
- `src/config.ts` (`DialogueAction`, `DialogueNode.hub`, `NpcDef.trainer`), `src/content.ts` (`npcGreetings(id)`, `TOPICS`, `NPCS`)
- `src/state.ts` `setFlag`; `src/talents.ts` (`chooseClass`, `respec`); `src/zones.ts` (`loadZone`); `src/inventory.ts` (`addItem`, `removeItem`, `countItem`)

## Change
- `src/ui/dialogue.ts`:
  - **Greeting:** the first entry of `npcGreetings(npcId)` whose `when` holds.
  - **Hub nodes:** when showing a node with `hub: true`, insert the options from `TOPICS[npcId]` whose `when` holds, before the node's last option.
  - **Actions:**

    | Action | Does |
    |---|---|
    | `setFlag` | `setFlag(flag, value)` |
    | `chooseClass` | `chooseClass(classId)` |
    | `respec` | `respec()` |
    | `travel` | `loadZone(zone, x, z)` |
    | `giveItem` | `addItem` (say it) |
    | `takeItem` | `removeItem` (only if `countItem` is enough, else say what's missing and don't advance) |

  - **Trainer NPCs** (`npc.trainer` set): automatically add the hub options "Train me" (lists that class's abilities with their level in a dialogue node, read-only) and "Reset my talents" (`respec`), shown only when `state.classId === npc.trainer`.
- `src/ui/shop.ts`:
  - Stock from `NPCS[npcId].shop`, which already includes pack `shopAdds`.
  - Items with `questItem` can't be sold (hide the Sell option).
  - Show item names coloured by rarity (plain white, sprouted green, blooming blue, heirloom purple, kilnfired orange).

## Contract
Existing exports unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in ui/dialogue.ts or ui/shop.ts.
- Fernwick's dialogue in Mossbottom plays as before.

## Out of scope
content.ts, talents.ts, zones.ts.
