Epic: 2, Systems
Depends on: none

## Goal
Mossbottom Vale runs on the new numbers (combat.md §11). It has Grubthorn's boss moves and last words, plus the new Chapter 1 quests and objects, so the intro leads into Thatchford.

## Read first
- `games/gnomes-of-gnomomia/src/data/packs/mossbottom.ts` (today's content, moved here in epic 1)
- `docs/design/gnomomia/combat.md` §11 (the conversion tables)
- `docs/design/gnomomia/quests.md`, Chapter 1 (the table and side quests)
- `docs/design/gnomomia/bestiary.md`, the Mossbottom Vale table; `places-and-people.md` §1
- `src/config.ts` for `EnemyDef`, `ItemDef`, `WorldObjectDef`, `QuestDef`, `BossMoveDef`

## Change
Only `src/data/packs/mossbottom.ts`. Prefix for new ids: `mb-`.

- **Items** as combat.md §11 says: ilvl, damageType, hands, armorType, rarity (the Mole King claw is heirloom). Add new starter class items as Plain items sold by Bramble:
  - `mb-forked-twig-sling`: ilvl 2, sling, pierce, 1-hand.
  - `mb-reed-blowpipe`: ilvl 2, blowpipe, pierce.
  - `mb-willow-switch`: ilvl 2, staff, crush, 2-hand.
  - `mb-mushroom-hood`: ilvl 2, cloth head.
  - `mb-bark-leggings`: ilvl 3, leather legs.
- **Enemies:**
  - Remove `hpOverride`, `damageOverride` and `defense` from every enemy (epic-1 placeholders that kept the old numbers), and set Grubthorn's `level` to 6. Set rank and family from bestiary.md (slug trivial/soft, mole normal/furred, beetle normal/shelled, feral-gnome normal/fired, mole-king boss/furred).
  - Add `pond-frog` (L2 normal soft, passive, near the Puddlemere shore) and `feral-brute` (L4 elite fired, at the Feral Camp, drops `mb-feral-totem`).
  - Every enemy gets `wants` from the bestiary's Wants column.
  - Grubthorn: `moves` = Burrow (vanish, every 14, telegraph 1.5, radius 3, damage 1.5), Mudsling (pool, every 9, telegraph 1, radius 2.5, damage 0.4, status slowed 3), Call the Clan (summon 2 `mole`, every 30, belowHpPct 0.5). `lastWords: "We weren't attacking. We were running."`
  - Add spawns for the frog and the brute.
- **Objects:**
  - `mb-moss-statue` (statue at the well, verb Examine, text "Her face is worn smooth. She is holding a trowel just like yours.", setFlag `mb-statue-seen`=`yes`).
  - `mb-drowned-cart` (cart at the Puddlemere shore, verb Search, once, giveItem `mb-soggy-letter`; also give a Sprouted ring `mb-tin-ring`, ilvl 3, trinket, +1 endurance, in the quest reward).
- **Quests** (zone mossbottom; existing ids keep their ids):
  - Give every quest `level` and `tier` (slime-time 2 side, feral-trouble 4 side, shells 5 side, mole-king 6 finale).
  - New quests:
    - `mb-trowel-like-yours` (side, level 3): interact `mb-moss-statue` → talk fernwick.
    - `mb-what-moles-know` (main, level 6): talk fernwick → reach mossbottom (10, -100, r 6) → reach thatchford (0, 100, r 10).
    - `mb-puddlemere-chest` (side, level 3): interact `mb-drowned-cart`.
    - `mb-feral-totem` (side, level 4, giver pip): collect `mb-feral-totem` → talk pip.
  - Wire the givers' dialogue: add hub options and turn-in greetings to Fernwick and Pip's nodes, in this file, since you own these NPCs. Use the lines from quests.md.
- `mb-soggy-letter` is a questItem misc ("To the Keep, from a Pipewright, 31 years ago."). Later chapters use it.

## Contract
The exported `PACK` name and the canonical ids (`fernwick bramble tansy pip thistle`, `slug mole pond-frog feral-gnome feral-brute beetle mole-king`, `mole-crown`) are unchanged. Other packs reference them.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/packs/mossbottom.ts.

## Out of scope
Every other file. Thatchford content is epic 3.
