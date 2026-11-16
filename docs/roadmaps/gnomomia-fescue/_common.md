## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic` (Windows, Git Bash). Game: `games/gnomes-of-gnomomia` (Vite + TypeScript strict + three@0.187.0, no Phaser). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: don't run `npm install` or add packages.
- **Other workers are editing other files in `games/gnomes-of-gnomomia/src` at the same time.** Edit ONLY the file(s) listed under Change. Never edit `config.ts`, `content.ts`, `events.ts`, `state.ts` or `main.ts` unless your Change section lists them. If you need a constant that isn't in `config.ts`, declare it as a local `const` at the top of your own file.
- Keep every exported function name and signature in your file exactly as the stub has it. Other workers compile against them.
- Don't run `vite build` or `npm run dev`, and don't start any server. Don't `git commit`.
- Art is generated in code from three.js primitives (see `src/models.ts` and `src/world.ts` for the style: low-poly `MeshLambertMaterial`). No external assets.
- UI rule: DOM goes in your own container appended to the shared `#ui` element (the `root` passed to `createX(root)`). Style only your own elements, inline. Never restyle, hide or clear `#ui`.
- Type-check: `npx tsc --noEmit -p games/gnomes-of-gnomomia`. Only errors in YOUR file(s) matter. Errors elsewhere may be other workers mid-edit.

## The design
The game design lives in `docs/design/gnomomia/` (start with its `README.md`). Combat numbers: `combat.md`. Classes: `classes.md`. Lore rules: `lore-rules.md`. Content issues name the exact sections to read.

## Code conventions (read `src/config.ts` for the exact types)
- **Data vs logic.** `src/config.ts` holds types and tuning only. All game content (items, enemies, NPCs, quests, spawns, world objects, zones) lives in **content packs** under `src/data/`, merged by `src/content.ts` into the tables `ITEMS`, `ENEMIES`, `NPCS`, `QUESTS`, `SPAWNS`, `OBJECTS`, `ZONES`, `TOPICS`, `GREETINGS_FIRST`, `ALLIES`. Logic imports tables from `./content`, types from `./config`.
- **Ids are global.** Every id in a pack (item, enemy, npc, quest, object, dialogue node) must be unique across the game. **Prefix every id you create with your pack's prefix** (given in your issue), e.g. `s07-sheaf-straw`. Canon ids that already exist (e.g. `fernwick`, `slug`, `red-potion`) are referenced, never redefined.
- **Zones.** A `ZoneId` is one of `'mossbottom' | 'thatchford' | 'keep' | 'deeps' | 'cloverfield' | 'hedgewood' | 'rockery' | 'verge'`. NPCs, spawns and objects carry `zone`. Coordinates are local to their zone's map (x, z from `-half` to `+half`; negative z is north).
- **Adding to canon NPCs without editing their pack:** use `topics` (extra dialogue options shown on that NPC's hub nodes, gated by `when`) and `greetingsFirst` (greetings checked before the NPC's own, for your quests' turn-in stages only, always gated by a `questStage` or `flag` condition). Your extra dialogue nodes go in `extraNodes[npcId]`, with node ids prefixed by your pack prefix.
- **Objectives:** `kill`, `collect`, `talk`, `reach`, `interact`, `escort`, `defend`, `choice`. A `choice` stage is met when `state.flags[flag]` is set. Set it from dialogue with `{ type: 'setFlag', flag, value }`.
- **Rewards:** `QuestDef.tier` is `'side' | 'main' | 'finale'`. XP is computed from tier and `QuestDef.level` (progression.ts). Finale quests also give +1 skill point.
- **Enemies:** give `level`, `rank`, `family`. HP and damage are computed by `enemyStats()` in `rules.ts` from combat.md §9 unless you set `hpOverride` / `damageOverride`.
- **Items:** give `ilvl` and `rarity`. Weapon ranges and armor values are computed by `rules.ts` from ilvl unless you set `damageOverride` / `armor`.
- **Messages:** `say(text, color)` from `./events`. Colours: `UI.quest`, `UI.good`, `UI.bad`, `UI.gold` from config.

## Content pack recipe (content issues: epics 3-6)
A content issue owns exactly one file: a pack `src/data/packs/<id>.ts` (`export const PACK: ContentPack = {...}`) or a zone `src/data/zones/<id>.ts` (`export const ZONE: ZoneDef = {...}`). `content.ts` already imports it. Don't touch the registry.

Turning a design doc into a pack:
1. **Quests**: one `QuestDef` per row of the doc's quest table. `level` from the doc (or the zone band's middle), `tier` from the doc (side/main/finale), and `chain` = the storyline or chapter title. Each objective in the doc becomes one stage. Every stage gets journal `text` in the doc's voice. Turn-ins are `talk` stages with `takeItems`.
2. **Dialogue**: every quest needs a way to start (`startQuest` action), a waiting line, and a turn-in. For NPCs your pack owns, write their `greetings`/`nodes` directly, and mark the opening node `hub: true`. For NPCs another pack owns, use `topics[npcId]` (start options, gated by `when: { quest: { id, status: 'none' } }` plus any prerequisite), `greetingsFirst[npcId]` (turn-in greetings gated by `questStage`), and `extraNodes[npcId]`. Use the doc's quoted lines. Keep every NPC line under about 220 characters.
3. **Conditions** can be combined (all fields must hold). Use `questAtLeast` for "from this stage on" and `not` to invert, e.g. an NPC that appears after a stage: `hidden: { not: { questAtLeast: { id, stage } } }`.
4. **Choices**: a `choice` stage with `flag`, and dialogue options with `{ type: 'setFlag', flag, value }`. Later stages or quests branch with `when: { flag: { name, value } }`.
5. **Enemies**: `level`, `rank`, `family`, `damageType` (claws/jaws slash, bodies/tools crush, stings/beaks pierce), `aggressive`, `model` (pick from `CreatureModel`), `color`, `scale`, `wants`, `examine`, `loot`, `gold`, `respawnSeconds` (30 normal, 120 elite, 600 boss, 0 = never for quest bosses). Bosses get 2-3 `moves` (`BossMoveDef`) matching the doc's attacks.
6. **Items**: `ilvl`, `rarity`, `slot`/`kind`, `damageType`/`hands`/`weaponClass` or `armorType`, `value` (about `ilvl² × rarity factor`: plain 1, sprouted 2, blooming 4, heirloom 8), `icon` (one emoji), `examine` from the doc's flavour. Quest items: `kind: 'misc'`, `questItem: true`, `value: 0`.
7. **Objects** and **spawns**: place them at the doc's sub-areas, using the zone's `regions` coordinates (read `src/data/zones/<zone>.ts`; if it's still a stub this epic, use the coordinates your issue lists).
8. Follow `docs/design/gnomomia/lore-rules.md` for any line you have to invent. Don't answer loose threads.

Done-when for every content issue: `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in your file, and every id you reference exists, either in your pack or in the canonical id table in `src/data/README.md`.

Also run the content linter on your own pack: `node games/gnomes-of-gnomomia/scripts/lint-content.mjs <your-pack-id>` (for a zone file, run it with no argument and read the `zone:<id>` lines). It reports ids nobody defines, broken dialogue `next` links, quests no dialogue option starts, and NPCs, spawns or objects placed inside a house, the shrine, a lake or off the map. Fix every ERROR it prints for your pack, except an unknown id that the canonical table in `src/data/README.md` lists as owned by another pack (it may not be written yet).

### Engine features added after the plan was written (use them instead of working around)
- Dialogue actions `{ type: 'giveGold', amount }` and `{ type: 'takeGold', amount }` (a short `takeGold` stops the option, like `takeItem`).
- `WorldObjectDef.takeItem: { item, count }`: the object consumes these items when used and refuses to work without them (e.g. a perch that eats 10 grain sacks).
- `EnemyDef.onDeathFlag: { flag, value }`: sets a flag when the enemy dies (e.g. a boss kill that decides a branch).
- `NpcDef.scale`: model scale for an NPC (default 1).
- A quest's first stage can't be a `talk` to the NPC that starts it: the start option runs after that talk event, so the player would have to talk twice. Start quests on their first real objective, or accept the double talk deliberately.
- A `QuestStage` has no `when`. Branch by writing separate quests whose start options and turn-in greetings are gated on the flag.
- A `Condition` holds only one `quest` field, but `not: { not: X }` means X, so you can chain: `{ quest: { id: A, status: 'done' }, not: { not: { quest: { id: B, status: 'done' }, not: { not: { quest: { id: C, status: 'done' } } } } } }` requires A, B and C all done.
