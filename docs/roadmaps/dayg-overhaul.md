# DayG Overhaul Roadmap

Game folder: `games/dayg` (three.js, DOM UI in `src/ui`), dev port **5206**. Setting: `apocrypha` (Mossgrave).

This roadmap groups all 23 requested DayG fixes, redesigns, and new gameplay systems into **7 ordered epics**. Each epic leaves `games/dayg` building, passing tests, playable on desktop and mobile, and ready for a PR.

---

## Shape

| Epic | Name | Focus | Status |
|---|---|---|---|
| **1** | Core Fixes & Playability | UI click/pointer-lock fix, melee attack animation & feedback, Hatless spawn/despawn fix + 6 zombie walk archetypes, climbing/vaulting unstuck fix, quieter footsteps, multi-zone spawning, Admin Trainer (`F9`) | Done |
| **2** | Complete UI & Inventory Overhaul | Unified DayG UI design system, live 3D player preview in inventory, right-side drag-and-drop loot column, restyle all panels + mobile polish | Done |
| **3** | Persistent Owned Worlds & Loot Respawn | Toggleable loot respawning (default OFF), persistent player-owned worlds (local + `@lawn/cloudsave`), seamless `@lawn/mp` join-by-code | Done |
| **4** | Living World: Settlements, Combat, Radios & Lore | Constructed survivor settlements with defenses, world biome diversity, zombies attacking/interacting with survivors, camp & portable radios with music/talk, environmental storytelling vignettes | Done |
| **5** | Branching Survivor Stories, Journal, Cooking & Collectibles | Persistent survivors with mutually exclusive branching arcs, relationship & status journal, cooking system, unique collectibles & turn-in unlocks | Done |
| **6** | Player Camps, NPC Hiring & Turret/Security Base Building | 8 security defenses (turrets, searchlights, alarms, watchtowers, gates, spikes), Mk I–III upgrades, repair, autonomous patrolling/fighting crew, production & morale | Done |
| **7** | Vehicles & Modular Franken-Build Modding | 5 distinct vehicles (bicycle, mower kart, trike, utility tractor, hearse-buggy) + 6 modular swappable slots (24 parts) with visible mounted 3D parts and 9 Franken-Build synergies | Done |
| **8** | Visual World Overhaul, Top-Down World-Render Map & 8 Zombie Animations | Procedural CanvasTextures, per-region biome dressing (trees, arches, boardwalks, lamps), real top-down world-render map, 8 unique zombie locomotion/idle/lunge/stagger/crumble animations | Done |

---

## Pass 2 Deep-Dive Progress
- **Wave 1 Complete**:
  - Epics 1–2: Weapon-aware melee animations (thrust/cleave/punch) + impact particle bursts, backpack category filter tabs + sort + Shift/double-click quick-transfer + zoom/reset 3D preview + compass strip & quick-hand HUD bar + trainer live pos/stamina/time-slider.
  - Epics 3–4: World JSON export/import & delete + configurable loot respawn interval, constructed guardhouses/bunkers/biome landmarks, full NPC patrol/engage/flee/recover AI with floating HP bars, 5-station radio with tuning static & Now Playing pill, 16 lore dioramas.
  - Epic 5: 3-stage branching stories (`0..3`) + 8 3D named survivors with interactive dialogue modal, dedicated Campfire Cooking UI with 10 meals & Heat/Timing bar minigame, 16 collectibles + Curio Display Rack at Lychgate Waystation, upgraded Journal.
- **Wave 2 Complete**:
  - Epic 6: 8 security defenses (incl. `searchlight-tower` & `auto-crossbow`), Mk I–III defense upgrades & repair, autonomous patrolling/fighting camp crew, crew production (`Collect`), dynamic morale & role reassignment.
  - Epic 7: 5 vehicles (added `hearse-buggy`), 6 modular slots (`engine`, `belt`, `oil`, `wheels`, `exhaust`, `bumper`; 24 parts), 9 Franken-Build synergies, spinning wheels, wobble, headlights (`L`), horn (`H`), exhaust particles, mobile driving pedals (`GAS`/`BRAKE`/`HORN`/`EXIT`).
  - Epic 8: Procedural CanvasTextures (`worldBuilder.ts`), biome ground patches & trees/wildflowers/night streetlamps (`worldAtmosphere.ts`), real top-down world-render map (`mapPanel.ts`), 8 unique zombie walk animations + idle/lunge/stagger variants (`hatless.ts`).

---

## 24/24 Requirements Coverage Matrix

| # | Original & Follow-Up Request | Epic | Status |
|---|---|---|---|
| 1 | Redo inventory UI & all UI + 3D player preview + right-side drag-and-drop loot + fix UI clicks taking back into game | Epics 1, 2 | Done |
| 2 | Fix melee attack & play attack animations | Epic 1 | Done |
| 3 | Fix zombies randomly despawning/spawning | Epic 1 | Done |
| 4 | Make footsteps quieter | Epic 1 | Done |
| 5 | Survivor settlements with constructed buildings & defenses | Epic 4 | Done |
| 6 | Zombies interact with survivors like players | Epic 4 | Done |
| 7 | Pre-breakout & post-breakout environmental storytelling | Epic 4 | Done |
| 8 | Make the world more diverse & visually interesting | Epics 4, 8 | Done |
| 9 | Fix climbing over a wall getting stuck | Epic 1 | Done |
| 10 | Spawn player in different zones each time | Epic 1 | Done |
| 11 | Toggleable loot respawning (default OFF) | Epic 3 | Done |
| 12 | Persistent world owned by a player that others can join | Epic 3 | Done |
| 13 | Admin trainer menu (fly, god mode, teleport, kits, etc.) | Epic 1 | Done |
| 14 | Radios with talk and music in camps + portable | Epic 4 | Done |
| 15 | Persistent survivors with mutually exclusive branching stories | Epic 5 | Done |
| 16 | Establish camp & hire NPCs who want security measures | Epic 6 | Done |
| 17 | Security measures & base building with turrets | Epic 6 | Done |
| 18 | Journal with relationships, people met & last known status | Epic 5 | Done |
| 19 | Ability to cook foods | Epic 5 | Done |
| 20 | Unique collectibles with turn-in unlocks | Epic 5 | Done |
| 21 | Unique zombie walk animations (8 archetypes + idle/lunge/stagger) | Epics 1, 8 | Done |
| 22 | Vehicles (5 distinct vehicles) | Epic 7 | Done |
| 23 | Modular vehicle modding with visible mounted engines/parts & goofy Franken-Build boosts | Epic 7 | Done |
| 24 | Real top-down world-render map | Epic 8 | Done |

---

## Pass 2 Deep-Dive Progress
- **Wave 1 Complete**:
  - Epics 1–2: Weapon-aware melee animations (thrust/cleave/punch) + impact particle bursts, backpack category filter tabs + sort + Shift/double-click quick-transfer + zoom/reset 3D preview + compass strip & quick-hand HUD bar + trainer live pos/stamina/time-slider.
  - Epics 3–4: World JSON export/import & delete + configurable loot respawn interval, constructed guardhouses/bunkers/biome landmarks, full NPC patrol/engage/flee/recover AI with floating HP bars, 5-station radio with tuning static & Now Playing pill, 16 lore vignettes with multi-prop dioramas.
  - Epic 5: 3-stage branching stories (`0..3`) + 8 3D named survivors with interactive dialogue modal, dedicated Campfire Cooking UI with 10 meals & Heat/Timing bar minigame, 16 collectibles + Curio Display Rack at Lychgate Waystation, upgraded Journal.

---

## Epic 1: Core Fixes & Playability

1. **1.1 UI Clicks & Pointer-Lock Release**
   - Ensure every UI panel/dialog root sets `pointer-events: auto` when open (so clicks never fall through `#ui { pointer-events: none }` to `<canvas id="game">`) and stops `mousedown`/`pointerdown` propagation.
   - Coordinate `input.setPointerLockAllowed(!anyPanelOpen)` in `src/main.ts` across all panels (`panel`, `chestUi`, `talkPanel`, `boardPanel`, `ledgerPanel`, `mapPanel`, `audioPanel`, `roomPanel`, `dBuildPanel`, `trainerPanel`, `!player.alive`).
2. **1.2 Melee Attack Fix, Animation & Feedback**
   - Replace the broken stamina-delta heuristic in `src/scene/playerView.ts` with an explicit `triggerAttack(hit?: boolean)` method on `PlayerView`.
   - Play a crisp 0.28s melee slash animation (right arm slash, torso twist, left arm counterbalance, and a brief visible slash arc even in close/first-person view).
   - Add attack cooldown (`0.35s`), `KeyF` / left-click / touch Attack support, and attack swing/hit audio in `src/audio/`.
3. **1.3 Hatless Spawn/Despawn Stability & 6 Unique Zombie Walk Animations**
   - Stop `src/game/simFeed.ts` from calling `hatless.despawnAll()` on every region border crossing. Keep current region + immediate graph neighbours active, prune only far-away (`> 85 gm`) zombies outside active regions, and spawn only the delta needed.
   - Enforce a safe minimum spawn distance (`>= 18 gm`) from the player in `src/scene/hatless.ts` `placeOne()`.
   - Add 6 distinct seeded zombie walk archetypes (`id % 6`: shambler, limper, hunched, twitcher, head-loller, stalker) layered onto `pose()`.
4. **1.4 Wall Climbing & Vaulting Unstuck Fix**
   - Add `findClearLanding` in `src/game/player.ts` to verify landing clearance on top of walls or across thin walls/kerbs before committing a vault or climb-up.
   - Add a radial unstuck spiral nudge in `update()` if the player ever overlaps a collider block.
   - Cover with unit tests in `src/game/player.test.ts`.
5. **1.5 Quieter Footsteps & Multi-Zone Player Spawning**
   - Lower footstep gain in `src/audio/index.ts` and `src/audio/synth.ts` (~35–40% of previous volume).
   - Add `src/game/spawn.ts` (`pickZoneSpawn`) to spawn players in a different valid region each run (avoiding the previous `sessionStorage` region) and toast the starting zone.
6. **1.6 Admin Trainer Menu (`F9` + Touch Button)**
   - Add `src/ui/trainerPanel.ts`: God Mode (invulnerable, infinite stamina, topped-up needs), Fly / Noclip (`Space` up, `C`/`Shift` down, speed multiplier), Region Teleport, Give Kits/Acorns/Heal, Spawn/Clear Hatless, Time/Weather/Sim Speed controls.

---

## Epic 2: Complete UI & Inventory Overhaul

1. **2.1 Unified DayG UI Design System**
   - Create `src/ui/theme.ts` with shared CSS tokens, sheet/dialog chrome, focus rings, 44px+ touch targets, and safe-area inset handling for 390x844, 844x390, and desktop.
2. **2.2 Inventory Overhaul (3D Player Preview + Right-Side Loot + Drag & Drop)**
   - Embed a live rotating 3D player gnome preview canvas inside the inventory screen showing currently worn head/back/neck/body gear and held items.
   - Present lootable containers on the right side of the inventory screen with full drag-and-drop between Loot ↔ Backpack ↔ Hands ↔ Worn slots, plus click-to-inspect and quick actions.
3. **2.3 Restyle All Remaining Panels**
   - Bring HUD, Map, Talk, Board, Room, Audio, Build, Chest, Ledger, and Recap onto the unified design system and pointer-lock/click-safe rules.

---

## Epic 3: Persistent Owned Worlds & Loot Respawn

1. **3.1 Toggleable Loot Respawning (Default OFF)**
   - Add `lootRespawn: boolean` (default `false`) and `lootRespawnDays` to `WorldState` / world settings UI; replenish unopened/emptied containers only when enabled and player is at a safe distance.
2. **3.2 Persistent Player-Owned World Loop**
   - Elevate the world creation/reopen flow (`roomPanel.ts`, `roomSave.ts`, `@lawn/cloudsave`) so players clearly own persistent worlds (auto-saved locally and to cloud), can configure world rules, and can invite friends seamlessly via `@lawn/mp` room codes.

---

## Epic 4: Living World: Settlements, Survivor-Zombie Combat, Radios & Lore

1. **4.1 Constructed Survivor Settlements & World Biome Diversity**
   - Build out haven/settlement architecture (palisade walls, gates, watchtowers, spikes, covered shelters) and enrich district visual diversity across Mossgrave.
2. **4.2 Zombies Interact with Survivors Like Players**
   - Give world NPCs HP, wound/status states, and active AI: Hatless detect, chase, and scratch NPCs just like players; NPCs fight back, retreat behind defenses, or fall if overwhelmed.
3. **4.3 Camp & Portable Radios**
   - Add 3D radio props in settlements/camps and a portable radio item with 3–4 stations playing procedural `@lawn/music` tracks and `@lawn/mutter` talk/emergency broadcasts with spatial falloff.
4. **4.4 Environmental Storytelling Vignettes**
   - Place pre-breakout and post-breakout miniature scenes (abandoned barricades, overturned carts, camp notes, memorial plaques) with inspectable lore entries.

---

## Epic 5: Branching Survivor Stories, Journal, Cooking & Collectibles

1. **5.1 Persistent Survivors & Mutually Exclusive Branching Stories**
   - Author 8+ named persistent survivors with multi-step story arcs where completing or siding with one arc locks out rival quests/arcs, creating a rich matrix of world outcomes.
2. **5.2 Relationship & Status Journal**
   - Rebuild the Journal (`ledgerPanel.ts`) with People Met (disposition, last known location & alive/injured/fallen status), Active/Completed/Locked-Out Stories, Discovered Lore Notes, and Collectibles checklist.
3. **5.3 Cooking System**
   - Add raw ingredients, campfire/stove cooking UI, timed cooking with burn/quality risk, cooked meal buffs, and cooking skill XP.
4. **5.4 Unique Collectibles & Turn-In Unlocks**
   - Add 12+ unique collectible `@lawn/prefabs` items placed in memorable/risky spots, turn-in rewards (gear/recipes/camp unlocks), and achievements.

---

## Epic 6: Player Camps, NPC Hiring & Turret/Security Base Building

1. **6.1 Base Security Measures & Turrets**
   - Add Acorn Slingshot Turret, Nail-Launcher Turret, Alarm Tripwire, Watchtower, Reinforced Gate, and Spike Pit to base building (`src/base/`) with active Hatless targeting and durability.
2. **6.2 Establish Camp & Hire NPCs**
   - Let players establish a named camp, compute a Camp Security Score, recruit friendly survivors, assign roles (Guard, Scavenger, Cook, Mechanic), and satisfy NPC security/shelter demands.

---

## Epic 7: Vehicles & Modular Franken-Build Modding

1. **7.1 Vehicle Physics, Driving & 4 Distinct Vehicles**
   - Implement Scrap Bicycle, Push-Mower Kart, Wheelbarrow Trike, and Utility Van/Tractor with `@lawn/vehicle`-style handling, desktop & mobile touch driving controls, and Hatless impact physics.
2. **7.2 Modular Vehicle Parts & Visible Engine/Part Modding**
   - Add scavengeable/swappable Engines, Belts, Oils, and Wheels; render mounted parts visibly on the vehicle 3D mesh (e.g., oversized mower engine sticking out of a tiny trike); support mix-and-match penalties and goofy Franken-Build synergy boosts.
