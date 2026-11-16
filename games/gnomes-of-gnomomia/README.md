# Gnomes of Gnomomia

An old-school, click-to-move 3D RPG with gnomes: Elder Scrolls rules (skills that grow when you use them, ten skill-ups to a level) with a RuneScape feel (click to walk, right-click menus, hitsplats, a 28-slot inventory).

The question it answers: is a small, quest-driven gnome RPG fun to click around in?

## Run

```
npm install
npm run dev -w games/gnomes-of-gnomomia   # http://localhost:5291
```

## Play

- **Left-click** the ground to walk; click an enemy to attack, an NPC to talk, a loot pile to take it.
- **Right-click** anything for its menu (Attack, Talk-to, Take, Examine, Walk here).
- **Arrow keys**, **middle-drag** or a **left-drag** turn the camera; the **wheel** zooms.
- **1-8** use the hotbar: Flare and Mend on 1-2, class abilities after your Calling in Thatchford (right-click a slot to assign).
- The side panel has tabs for the inventory, worn gear, stats, quests, spells and talents (key T).

### On a phone or tablet

- **Tap** to walk, attack, talk or take; **long-press** anything (ground, hotbar slot, inventory item) for its menu. A long-press on an item also shows its tooltip.
- **Drag one finger** to turn the camera, **pinch** to zoom.
- Phones (either way up) get a compact layout: hotbar at the bottom, the chat log above it, and the side panel behind the **🎒** button in the top-left row next to **💬** (chat). The chat line opens at the top so the keyboard never covers it. The layout lives in `src/ui/layout.ts`.

Start by talking to Elder Fernwick by the well in Mossbottom.

## Online (MMO)

After the title you join the one shared world on the matchmaking server (`packages/mp-server`, game id `gnomomia`): everyone in the public queue drops into the same running room; when it is full (40) the next player opens a new shard.

- You see the other gnomes in your zone, with their name, level, class and HP over their heads. The pill top-left shows who is here and online; click it for the list.
- **Enter** or the **💬** button opens the chat line (world-wide), with a Send button and one-tap quick lines. What a gnome says also shows in a speech bubble over their head for a few seconds (yours too). Commands: `/name <new name>`, `/who`, `/offline`, `/online`.
- **Who owns what:** each player owns their own character (`src/state.ts`, saved in localStorage as before) and relays a public card (level, class, HP) and their position (`src/net/protocol.ts`). Enemies, loot and quests stay per player. Nothing is authoritative yet, so it is trivially cheatable; moving characters to the server means the server keeps `GameState` by the card's `cid` (a per-browser character id) and builds the card itself.
- Local play: `npm run dev -w packages/mp-server` alongside the game (it uses ws://localhost:8787/ws), or `?mp=ws://host/ws`. `?offline` skips joining.

## The world (Fescue)

Seven zones plus the three-wing Drainpipe Deeps, levels 1-30: Mossbottom Vale, Thatchford Downs, Birdbath Keep, Cloverfield, Hedgewood, the Rockery and the Verge. Eight story chapters end in the Battle of the Verge against the Mower; 14 side storylines change who stands with you there. The design lives in `docs/design/gnomomia/`.

## Rules (src/rules.ts, src/combat.ts, src/progression.ts)

The formulas are in `docs/design/gnomomia/combat.md`. In short: XP from kills and quests raises your level (cap 30); skills still grow by use but are capped at 5 + 4 × level; to-hit is a d20 against the target's level and defense; armor is percentage mitigation; damage types meet creature families (Crush cracks shells, Sun burns plants); three classes (Warden, Slinger, Hedge-Mage) each have 3 talent branches.

## Files

- `config.ts`: types and tuning only.
- `src/data/`: all content. `packs/*.ts` (one per chapter or storyline) and `zones/*.ts`, merged by `content.ts`; `data/README.md` lists the canonical ids and zone layouts.
- One system per file (`combat.ts`, `zones.ts`, `quests.ts`, `talents.ts`, `mower.ts`, ...); `main.ts` only wires them.

## Checking content

- `npm run lint:content -w games/gnomes-of-gnomomia` (or `node games/gnomes-of-gnomomia/scripts/lint-content.mjs [packId]`): ids nobody defines, broken dialogue links, quests nothing starts, NPCs or objects placed inside houses or lakes, exits that bounce you straight back.
- In `npm run dev`, `?zone=<id>` (e.g. `http://localhost:5291/?zone=verge`) skips the title and drops a fresh character into that zone without touching your save. `bash tools/smoke.sh "http://localhost:5291/?zone=verge" game ui` checks a zone builds without errors.
