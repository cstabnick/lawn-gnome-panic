# Roadmap: Gnomes of Gnomomia

Goal: an old-school click-to-move 3D gnome RPG in `games/gnomes-of-gnomomia`. Elder Scrolls rules (skills that rise when used, ten skill-ups to a level, quests from villagers), RuneScape controls (click to walk, right-click menus, hitsplats, a 28-slot inventory), three.js low-poly world.

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | Scaffold, `config.ts` (all types and data), `events.ts` (bus), `state.ts`, `main.ts`, stubs for every module; `npm run build -w games/gnomes-of-gnomomia` passes | 0 (direct) |
| 2. Systems | Every stub replaced; the game is playable end to end: walk, fight, loot, level, talk, quest, shop, save | 9, all parallel |

Epic 2 issues are in `docs/roadmaps/gnomes-of-gnomomia/`:

| # | Files | What |
|---|---|---|
| 01 | `src/world.ts` | Terrain, lake, trees, rocks, mushroom village, camp, barrows, burrow, lights, collision |
| 02 | `src/pathfind.ts`, `src/player.ts` | Grid A*, the player gnome, click-to-move, walk-then-interact |
| 03 | `src/entities.ts`, `src/models.ts` | NPCs, enemies, loot piles, creature models, enemy AI, respawn |
| 04 | `src/rules.ts`, `src/combat.ts` | d20 rules, skill progression, melee, spells, regen, death |
| 05 | `src/camera.ts`, `src/input.ts` | Orbit camera, picking, left-click actions, right-click menus, hotkeys |
| 06 | `src/ui/hud.ts` | Chat log, HP/MP orbs, hitsplats, overhead bars, banners, hover text, context menu |
| 07 | `src/inventory.ts`, `src/ui/panels.ts` | Inventory rules; tabbed side panel |
| 08 | `src/quests.ts`, `src/ui/dialogue.ts`, `src/ui/shop.ts` | Quests, NPC dialogue, shops |
| 09 | `src/audio.ts`, `src/save.ts`, `src/ui/title.ts` | Sound, saving, title screen |

No dependencies inside epic 2: each stub already exports its final signature.
