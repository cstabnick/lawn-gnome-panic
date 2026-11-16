Epic: 1, Foundation (**the implementing planner writes this directly, not a worker**). It's almost all verbatim types, tables and stubs, so handing it to a worker would only add cost and risk (see the decompose skill).

## Goal
`games/gnomes-of-gnomomia` has the new contract in place: new types in `config.ts`, all content moved into packs under `src/data/` and merged by `src/content.ts`, new events and state fields, and **a stub file for every module and pack that epics 2-6 fill in**. The game still builds and plays exactly as today (old numbers are fine until epic 2).

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`, `state.ts`, `events.ts`, `rules.ts`, `quests.ts`, `save.ts`, `main.ts`
- `docs/design/gnomomia/combat.md` §12, `classes.md`, `quests.md` (Objective types), `world-map.md` (Implementation notes)

## Change

### 1. `src/config.ts`: types and tuning only (move every data table out)
Keep `TUNING`, `UI`, `SAVE_KEY` (bump it to `'gnomomia.save.v2'`), `INVENTORY_SIZE`, `PLAYER_ID`, `START_*`, `Entity`, `InvSlot`, the `look()` helper (export it as `look`) and `PLAYER_LOOK`. Change the `TUNING` values: `playerAttackSeconds: 2.0`, `worldHalf` stays the default for zones that don't set `half`. Add or replace these types **verbatim**:

```ts
export type ZoneId = 'mossbottom' | 'thatchford' | 'keep' | 'deeps' | 'cloverfield' | 'hedgewood' | 'rockery' | 'verge';
export type ClassId = 'warden' | 'slinger' | 'mage';
export type Attribute = 'strength' | 'endurance' | 'agility' | 'intelligence';
export type SkillId = 'blade' | 'blunt' | 'marksmanship' | 'block' | 'toughness' | 'sun' | 'rain' | 'bloom';
export type School = 'sun' | 'rain' | 'bloom';
export type DamageType = 'slash' | 'crush' | 'pierce' | School;
export type Family = 'soft' | 'shelled' | 'furred' | 'winged' | 'plant' | 'fired' | 'unfired' | 'metal';
export type Rank = 'trivial' | 'normal' | 'elite' | 'miniboss' | 'boss' | 'worldboss' | 'final';
export type Rarity = 'plain' | 'sprouted' | 'blooming' | 'heirloom' | 'kilnfired';
export type EquipSlot = 'head' | 'body' | 'legs' | 'hands' | 'feet' | 'weapon' | 'offhand' | 'trinket';
export const EQUIP_SLOTS: readonly EquipSlot[] = ['head', 'body', 'legs', 'hands', 'feet', 'weapon', 'offhand', 'trinket'];
export type StatusId = 'chipped' | 'poisoned' | 'burning' | 'soaked' | 'slowed' | 'rooted' | 'staggered' | 'stunned' | 'cracked' | 'glazed' | 'marked';
export type StatKey = Attribute | 'accuracy' | 'defense' | 'critDamage' | 'moveSpeed' | 'sunDamage' | 'rainDamage' | 'bloomHealing';

export interface ItemDef {
  id: string; name: string; icon: string;
  kind: 'weapon' | 'offhand' | 'armor' | 'trinket' | 'potion' | 'misc';
  slot?: EquipSlot;
  ilvl?: number;                       // weapons, armor, offhands, trinkets
  rarity?: Rarity;                     // default 'plain'
  damageType?: DamageType;             // weapons; ammo pouches set the ranged type
  hands?: 1 | 2;
  weaponClass?: 'melee' | 'sling' | 'blowpipe' | 'thrown' | 'staff' | 'wand';
  armorType?: 'cloth' | 'leather' | 'plate' | 'shield';
  damageOverride?: readonly [number, number];   // min, max; else rules.weaponRange()
  armor?: number;                               // else rules.armorValue()
  stats?: Partial<Record<StatKey, number>>;
  effect?: string;                              // tooltip text for Heirloom/Kiln-fired specials
  heal?: number; mana?: number; stackable?: boolean;
  value: number; examine: string;
  questItem?: boolean;                          // cannot be sold or dropped
}

export interface BossMoveDef {
  id: string; name: string;
  kind: 'ring' | 'cone' | 'lane' | 'summon' | 'pull' | 'pool' | 'vanish' | 'buff';
  every: number;            // seconds between uses
  telegraph: number;        // seconds of warning
  radius?: number; length?: number; width?: number;
  damage?: number;          // multiplier of the enemy's normal hit
  status?: StatusId; statusSeconds?: number;
  summon?: { enemy: string; count: number };
  belowHpPct?: number;      // only used when HP is below this fraction
}

export interface EnemyDef {
  id: string; name: string; level: number; rank: Rank; family: Family;
  damageType: DamageType; aggressive: boolean;
  attackSeconds?: number;                      // default 2.4
  hpOverride?: number; damageOverride?: readonly [number, number];
  defense?: number;                             // +2 for winged is applied automatically
  ward?: Partial<Record<School, number>>;      // 0..1 extra on top of family
  loot: readonly LootDrop[]; gold: readonly [number, number];
  model: CreatureModel; color: number; scale: number;
  respawnSeconds: number; examine: string;
  wants: string;                                // lore rule 6, shown on Examine
  moves?: readonly BossMoveDef[];
  lastWords?: string;                           // said on death
}
export type CreatureModel = 'gnome' | 'slug' | 'beetle' | 'mole' | 'rat' | 'frog' | 'worm' | 'leech' | 'ant' | 'aphid' | 'snail'
  | 'crow' | 'wasp' | 'moth' | 'spider' | 'cricket' | 'earwig' | 'centipede' | 'straw' | 'clay' | 'metal' | 'mower';

export interface SpawnGroup { zone: ZoneId; enemy: string; x: number; z: number; count: number; spread: number; when?: Condition }

export interface WorldObjectDef {
  id: string; zone: ZoneId; name: string; x: number; z: number;
  model: 'valve' | 'statue' | 'book' | 'cart' | 'chest' | 'sign' | 'stone' | 'grave' | 'post' | 'trough' | 'generic';
  color?: number; scale?: number;
  verb: string;                 // right-click label, e.g. 'Turn', 'Read', 'Lasso'
  examine: string;
  text?: string;                // shown in chat when used
  when?: Condition;             // hidden unless this holds
  once?: boolean;               // can be used once per save
  giveItem?: { item: string; count: number };
  setFlag?: { flag: string; value: string };
}

export interface ZoneExit { to: ZoneId; x: number; z: number; r: number; arriveX: number; arriveZ: number; label: string; when?: Condition }
export interface Region { id: string; name: string; x: number; z: number; r: number }
export interface ZoneDef {
  id: ZoneId; name: string; levels: readonly [number, number];
  half: number;                                        // map is -half..+half
  spawn: { x: number; z: number };                     // arrival when no exit applies
  shrine: { x: number; z: number; name: string };      // respawn point
  regions: readonly Region[];
  lakes: readonly { x: number; z: number; r: number }[];
  houses: readonly { x: number; z: number; r: number; yaw: number; style: 'mushroom' | 'thatch' | 'stone' | 'log' | 'tent' | 'pot' }[];
  theme: { ground: number; groundAlt: number; flora: 'mushroom' | 'grass' | 'clover' | 'hedge' | 'rock' | 'pipe' | 'stubble'; floraDensity: number; fog: number; sky: number; hilliness: number };
  exits: readonly ZoneExit[];
  indoor?: boolean;                                     // Drainpipe Deeps: walls, no sky
  walls?: readonly { x1: number; z1: number; x2: number; z2: number }[];  // blocking wall segments (Deeps wings)
}
// An exit may point to its own zone (to: same id): it's a hatch that teleports inside the map.

export interface Condition {
  quest?: { id: string; status: 'none' | 'active' | 'done' };
  questStage?: { id: string; stage: number };
  flag?: { name: string; value: string };       // state.flags[name] === value
  flagSet?: string;                              // state.flags[name] !== undefined
  flagUnset?: string;
  minLevel?: number;
  classId?: ClassId | 'none';
  hasItem?: { item: string; count: number };
  questAtLeast?: { id: string; stage: number };  // quest done, or active on this stage or later
  not?: Condition;                               // true when the inner condition is false
}

export type DialogueAction =
  | { type: 'startQuest'; quest: string }
  | { type: 'openShop' } | { type: 'heal' } | { type: 'close' }
  | { type: 'setFlag'; flag: string; value: string }
  | { type: 'chooseClass'; classId: ClassId }
  | { type: 'respec' }
  | { type: 'travel'; zone: ZoneId; x: number; z: number }
  | { type: 'giveItem'; item: string; count: number }
  | { type: 'takeItem'; item: string; count: number };

export interface DialogueOption { text: string; next?: string; action?: DialogueAction; when?: Condition }
export interface DialogueNode { text: string; options: readonly DialogueOption[]; hub?: boolean }  // hub: pack topics appear here
export interface Greeting { when?: Condition; node: string }

export interface NpcDef {
  id: string; name: string; look: GnomeLook; zone: ZoneId; x: number; z: number; wander: number;
  placements?: readonly { zone: ZoneId; x: number; z: number; when: Condition }[];  // first match wins, else zone/x/z
  hidden?: Condition;            // not spawned while this holds
  greetings: readonly Greeting[]; nodes: Record<string, DialogueNode>;
  shop?: readonly string[]; trainer?: ClassId; examine: string;
  model?: CreatureModel;         // non-gnome NPCs (ants, moles, the Gleaner); default 'gnome'
}

export type Objective =
  | { type: 'kill'; enemy: string; count: number }
  | { type: 'collect'; item: string; count: number }
  | { type: 'talk'; npc: string }
  | { type: 'reach'; zone: ZoneId; x: number; z: number; r: number }
  | { type: 'interact'; object: string; count: number }
  | { type: 'escort'; npc: string; zone: ZoneId; x: number; z: number; r: number }
  | { type: 'defend'; zone: ZoneId; x: number; z: number; r: number; seconds: number; waves: readonly { enemy: string; count: number; at: number }[] }
  | { type: 'choice'; flag: string };

export interface QuestStage { text: string; objective: Objective; takeItems?: readonly { item: string; count: number }[] }
export interface QuestDef {
  id: string; name: string; giver: string; zone: ZoneId; level: number;
  tier: 'side' | 'main' | 'finale';
  chain?: string;                // storyline or chapter id, for the journal
  stages: readonly QuestStage[];
  reward: { gold: number; items: readonly { item: string; count: number }[] };
}

export interface AllyDef { id: string; name: string; when: Condition; effect: string }   // Battle of the Verge (effect id read by mower.ts)

export interface ContentPack {
  id: string;
  items?: Record<string, ItemDef>;
  enemies?: Record<string, EnemyDef>;
  npcs?: Record<string, NpcDef>;
  quests?: Record<string, QuestDef>;
  spawns?: readonly SpawnGroup[];
  objects?: Record<string, WorldObjectDef>;
  topics?: Record<string, readonly DialogueOption[]>;          // npcId -> options added to its hub nodes
  greetingsFirst?: Record<string, readonly Greeting[]>;         // npcId -> greetings checked before its own
  extraNodes?: Record<string, Record<string, DialogueNode>>;   // npcId -> nodes merged into its node map
  shopAdds?: Record<string, readonly string[]>;                // npcId -> extra stock
  allies?: readonly AllyDef[];
}
```

Keep `SpellId`/`SpellDef` but change `SpellDef` to `{ id; name; icon; school: School; cost: number; cooldown: number; castTime: number; needsTarget: boolean; ranks: readonly number[] /* levels learned */; heal?: boolean; about: string }`. Move `SKILLS`, `ATTRIBUTES` and `SPELLS` data to `src/data/core.ts`.

### 2. `src/data/`: content packs and zones (all new)
- `src/data/core.ts`: `SKILLS` (8 skills, names and abouts from combat.md §10), `ATTRIBUTES`, `SPELLS` (`flare` ranks `[1,6,12,18,24,30]`, `mend` ranks `[1,8,14,20,26]`), `START_EQUIPMENT` / `START_INVENTORY` (move from config).
- `src/data/zones/<zoneId>.ts`, one per ZoneId, each `export const ZONE: ZoneDef`. **Write `mossbottom.ts` for real** from today's `REGIONS`, `LAKE` (name it Puddlemere), `HOUSES` (style `'mushroom'`), `WELL` (the shrine) and `SPAWN`. Give it one exit north: `{ to: 'thatchford', x: 10, z: -112, r: 4, arriveX: 0, arriveZ: 105, label: 'North road to Thatchford', when: { quest: { id: 'mole-king', status: 'done' } } }`. The other seven are stubs: a flat ±80 meadow with a shrine at the origin, `regions: []`, and one exit back to the zone before them.
- `src/data/packs/mossbottom.ts`: **all of today's content moved here verbatim** (items, enemies, NPCs, quests, spawn groups), converted to the new shapes:
  - Items: `damage` dice become `ilvl`, `damageType` and `hands` as in combat.md §11.
  - Enemies: get `rank`, `family`, `damageType` and `wants`. Keep the old `hp` as `hpOverride` until epic 2.
  - NPCs: get `zone: 'mossbottom'`. Each NPC's first node is `hub: true`.
  - Quests: get `zone`, `level` and `tier`.
- **Pack stubs** (each `export const PACK: ContentPack = { id: '<file name>' };`): `ch2-thatchford`, `ch3-keep`, `ch4-cloverfield`, `ch5-hedgewood`, `ch6-rockery`, `ch7-verge`, `ch8-finale`, `s01-dandelion-idol`, `s02-neat-chapel`, `s03-heir-of-the-heap`, `s04-queen-outside`, `s05-seven-kiln-born`, `s06-the-forty`, `s07-straw-king`, `s08-range-war`, `s09-white-cricket`, `s10-hedgewrights`, `s11-finishing-the-unfired`, `s12-the-damp`, `s13-the-kings-cart`, `s14-the-smiths-road`.
- `src/data/classes.ts` stub: `export const CLASSES: Record<ClassId, ClassDef> = {...}` with names only, and `export const TALENTS: Record<string, TalentDef> = {}`. Types (put in config.ts):
  ```ts
  export interface ClassDef { id: ClassId; name: string; primary: Attribute; resource: 'grit' | 'focus' | 'mana'; armor: readonly ('cloth' | 'leather' | 'plate' | 'shield')[]; abilities: readonly AbilityDef[] }
  export interface AbilityDef { id: string; name: string; icon: string; level: number; cost: number; cooldown: number; castTime: number; kind: 'attack' | 'spell' | 'buff' | 'heal' | 'move' | 'summon' | 'trap' | 'passive'; damageType?: DamageType; power?: number; radius?: number; status?: StatusId; statusSeconds?: number; about: string; fromTalent?: string }
  export interface TalentDef { id: string; classId: ClassId; branch: string; tier: 1 | 2 | 3 | 4 | 5 | 6; maxRank: number; name: string; about: string; grants?: string /* ability id */ }
  ```

### 3. `src/content.ts` (new): the registry
Imports every pack and zone file above and builds, **once at import time**, the exported tables: `ITEMS`, `ENEMIES`, `NPCS`, `QUESTS`, `SPAWNS` (array), `OBJECTS`, `ZONES` (`Record<ZoneId, ZoneDef>`), `TOPICS`, `GREETINGS_FIRST`, `ALLIES` (array). `extraNodes` merge into `NPCS[npcId].nodes`; `shopAdds` append to `NPCS[npcId].shop`. **A duplicate id throws** `Error('duplicate <kind> id: <id> in pack <pack>')` so collisions fail loudly on load. Also export `export function npcGreetings(id: string): Greeting[]` (GREETINGS_FIRST then the NPC's own). Then switch every module's data imports from `./config` to `./content` or `./data/core`.

### 4. `src/events.ts`: add these events
```ts
'zone-changed': { zone: ZoneId };
'interacted': { objectId: string };
'flag-set': { flag: string; value: string };
'xp-gained': { amount: number; total: number };
'quest-completed': { questId: string };
'class-chosen': { classId: ClassId };
'talents-changed': Record<string, never>;
'status': { target: number; status: StatusId; seconds: number };
'boss-phase': { boss: string; phase: number; text: string };
```
Add `damageType?: DamageType; crit?: boolean` to the `hit` payload.

### 5. `src/state.ts`
Add to `GameState`: `xp: number; classId: ClassId | null; skillPoints: number; talents: Record<string, number>; flags: Record<string, string>; zone: ZoneId; objects: Record<string, number>; hotbar: (string | null)[]` (8 entries, `['flare','mend',null,...]`). New skills start at 5, and the new equipment slots start null. Add `export function setFlag(flag: string, value: string): void` (sets the flag, emits `flag-set` and `changed`). Keep `maxHp`/`maxMp`/`equippedArmor`/`equippedWeapon` signatures (epic 2 rewrites their bodies).

### 6. Stub modules (new files, final signatures, trivial bodies)
| File | Exports (final signatures) |
|---|---|
| `src/progression.ts` | `xpToNext(level: number): number` · `killXp(enemyLevel: number, rank: Rank): number` · `questXp(q: QuestDef): number` · `grantXp(amount: number): void` · `skillCap(level?: number): number` · `useSkill(skill: SkillId, xp?: number): void` (**moved here from rules.ts**, same behaviour for now) · `initProgression(): void` |
| `src/zones.ts` | `currentZone(): ZoneDef` · `loadZone(id: ZoneId, x?: number, z?: number): void` · `initZones(scene: THREE.Scene): void` · `updateZones(dt: number): void` (exit checks) |
| `src/talents.ts` | `talentRank(id: string): number` · `canLearn(id: string): boolean` · `learnTalent(id: string): void` · `respec(): void` · `chooseClass(c: ClassId): void` · `branchPoints(classId: ClassId, branch: string): number` |
| `src/abilities.ts` | `knownAbilities(): AbilityDef[]` · `useHotbar(slot: number): void` · `abilityCooldown(id: string): number` · `resource(): { kind: 'grit' | 'focus' | 'mana'; value: number; max: number }` · `updateAbilities(dt: number): void` |
| `src/bossmoves.ts` | `updateBossMoves(dt: number): void` · `initBossMoves(scene: THREE.Scene): void` |
| `src/objects.ts` | `spawnZoneObjects(scene: THREE.Scene, zone: ZoneId): void` · `useObject(objectId: string): void` · `objectFromMesh(obj: THREE.Object3D): string \| null` |
| `src/mower.ts` | `startMowerBattle(): void` · `updateMower(dt: number): void` · `initMower(scene: THREE.Scene): void` |
| `src/ui/talents.ts` | `renderTalents(container: HTMLElement): void` (the panels tab body) |
| `src/ui/hotbar.ts` | `createHotbar(root: HTMLElement): void` · `updateHotbar(): void` |
| `src/ui/epilogue.ts` | `showEpilogue(root: HTMLElement): void` (final cards after the Mower; epic 6) |

`rules.ts` gets these stubs alongside its existing functions (keep `rollDice`): `power(attr: number): number` · `accuracyFromSkill(level: number): number` · `damageFromSkill(level: number): number` · `attackRoll(accuracy: number, defense: number, critRange?: number, rng?: () => number): { hit: boolean; crit: boolean; roll: number }` · `mitigation(armor: number, attackerLevel: number): number` · `weaponRange(item: ItemDef): [number, number]` · `armorValue(item: ItemDef): number` · `typeMultiplier(type: DamageType, family: Family): number` · `enemyStats(def: EnemyDef): { hp: number; damage: [number, number]; armor: number; accuracy: number; defense: number }`. `combat.ts` gets stubs: `dealDamage(targetId: number, base: number, type: DamageType, opts?: { crit?: boolean; spell?: boolean; noRoll?: boolean }): number` · `applyStatus(targetId: number, status: StatusId, seconds: number, power?: number): void` · `healPlayer(amount: number): void` · `hasStatus(targetId: number, status: StatusId): boolean`. `entities.ts` gets: `spawnZoneEntities(scene: THREE.Scene, zone: ZoneId): void` (spawnWorldEntities becomes a wrapper) and `spawnEnemyAt(defId: string, x: number, z: number): Entity | null`.

`main.ts`: wire the stubs once: `initZones`, `initProgression`, `initBossMoves`, `initMower`, `createHotbar` after `createHud`, and `updateZones`, `updateAbilities`, `updateBossMoves`, `updateMower`, `updateQuests` (add `export function updateQuests(dt: number): void` stub to quests.ts) in the frame loop.

### 7. Canonical ids (later packs reference these before they exist)
Write this table into `src/data/README.md` so every worker can read it.

| Kind | Ids (owner pack) |
|---|---|
| NPCs | `fernwick bramble tansy pip thistle` (mossbottom) · `burlap stoutpot twitchett dimm puddleby grindwell nettle sedge clementine` (ch2) · `marigold potsworth inkcap ironsod ida sedgewick wren` (ch3) · `haybale fallow muckle mabel kree` (ch4) · `splitwell juniper burdock fen lichen` (ch5) · `hammerclod sedum grout cobalt mudtooth` (ch6). Verge appearances of canon NPCs use `placements`, not new NPCs. |
| Enemies | mossbottom: `slug mole pond-frog feral-gnome feral-brute beetle mole-king` · ch2: `water-beetle hose-leech muck-sprite brown-rat magpie-thief earthworm heap-rat grub-swarm rotgut` · ch3 (Gutters): `gutter-rat pipe-leech clogmaw` · ch5 (Cistern): `cistern-eel drowned-toad mother-vesh` · ch6 (Backflow): `rust-crab drowned-pipewright gromwell` · ch4: `aphid ladybird runaway-snail field-mouse red-ant-worker red-ant-soldier grasshopper straw-wight ant-queen old-gleaner` · ch5: `cricket centipede wildling-scout hedgewright-thug web-spider weaver-below paper-wasp wasp-drone queen-vespa` · ch6: `earwig gem-beetle rock-louse rockery-centipede deep-mole dowager-mudtooth kiln-guardian unfired kiln-warden` · ch7: `even-cut-clipper even-cut-acolyte shorn-hound rust-rat oil-slug grass-bag-moth edger-knight high-edger` · ch8: `mower-wheel mower-deck mower-heartspark mower-rope` |
| Quest items | `tremor-tally` (ch2) · `gnorwin-ledger gromwell-notes` (ch3) · `snailcart-writ` (ch4) · `heartwood-stake valve-maps` (ch5) · `stopping-stone valve-key gnorwins-trowel` (ch6) · `kings-signet` (ch7) · `mole-crown` (mossbottom) |
| Consumables | `glaze-pot salt-pinch` (ch2) · `honeydew-flask snailcart-ticket` (ch4) · `rust-oil` (ch7) · `rose-draught sky-tonic` (ch3) · `ruby-draught spigot-water` (ch6) |
| Main flags | `sedge ants gleaner hedge mudtooth potsworth` (values in quests.md) |
| Side quests, flags and NPC copies other packs depend on | `mb-feral-totem mb-moss-statue mb-soggy-letter` (mossbottom) · `c2-sedge-pamphlets c2-postage-due` and flag `c2-forty-list` (ch2) · `c3-letter-from-puddlemere` (ch3) · `c4-straw-king` (ch4) · `c6-brambles-old-master` (ch6) · `c7-ironsod c7-marigold c7-wren` (ch7 Verge copies of canon NPCs) · flag `c8-phase` (ch8 and mower.ts) |
| Main quests (in quests.md order) | ch1 (mossbottom): `slime-time feral-trouble shells mole-king mb-what-moles-know` · ch2: `c2-word-to-the-reeve c2-calling c2-tremor-tally c2-pressures-wrong c2-the-heap c2-letter-for-the-queen` · ch3: `c3-an-audience c3-three-accounts c3-queen-in-archive c3-into-the-gutters c3-ledger` · ch4: `c4-royal-warrant c4-rustlers c4-runaway-snails c4-granary c4-antenna-sister c4-old-gleaner c4-great-haul` · ch5: `c5-elder-privet c5-neutral-ground c5-mill-raid c5-weaver-below c5-fens-two-families c5-paper-spire c5-heartwood c5-valve-maps` · ch6: `c6-new-stopping-stone c6-humming-seam c6-honest-words c6-the-unfired c6-kiln-warden c6-firing-the-stone c6-down-the-drains c6-clay-seals c6-who-holds-the-valve` · ch7: `c7-wings-to-the-front c7-muster c7-no-hats c7-same-table c7-queens-judgement c7-the-level` · ch8: `c8-turning-blade` |

### 8. Zone layouts (also in `src/data/README.md`; zone issues build exactly these, and pack issues place things by them)
Coordinates are `x, z, r`. Negative z is north. Quest ids gating exits are canonical (they're defined in the chapter packs).

| Zone (half) | Shrine | Regions (id x,z,r) | Exits (to @ x,z → arrive x,z; when) |
|---|---|---|---|
| mossbottom (120) | Mossbottom well 0,0 | as today; lake `puddlemere` 50,-45,20 | thatchford @ 10,-112 → 0,105; when `mole-king` done |
| thatchford (120) | Thatchford fountain 0,0 | `thatchford-town` 0,0,28 · `hose-banks` -40,20,22 · `spinning-fountains` -55,-35,24 · `crowfoot-hill` 60,-40,20 · `compost-heap` 65,45,18 · `neat-chapel` 35,10,14 · `long-bank` 35,-15,10 · `tipsy-toadstool` -8,6,4 · `guildhall` 10,-10,5 · `mill` -15,-20,5. The Hose = lakes at (-6,-80,10) (-4,-50,10) (-2,-25,9) (4,30,9) (8,60,10) (10,95,10); the ford is the dry gap at z≈0 | mossbottom @ 0,112 → 10,-105 · keep @ 0,-112 → 0,70; when `c2-letter-for-the-queen` done |
| keep (80) | Pedestal Ward square 0,20 | `pedestal` 0,-30,22 · `pedestal-ward` 0,25,24 · `archive` -18,-28,6 · `throne-hall` 0,-34,6 · `robin-roost` 22,-46,6 · `deeps-stairs` -30,30,4 · `guild-halls` 25,25,8; lake `basin` 0,-50,10 | thatchford @ 0,76 → 0,-105 · deeps @ -30,32 → 0,92; when `c3-into-the-gutters` active or done · cloverfield @ -76,0 → 118,0; when `c3-ledger` done · hedgewood @ 56,-56 → -104,104; when `c4-great-haul` done · rockery @ -56,-56 → 104,104; when `c5-heartwood` done |
| deeps (100, indoor) | Gutter landing 0,90 | `gutters` 0,65,25 · `clogmaw-den` 0,42,9 · `cistern` 0,8,26 · `vesh-pool` 0,-14,9 · `backflow` 0,-55,24 · `great-valve` 0,-86,9. Walls: z=30 (x -100..-4 and 4..100), z=-24 (same) | keep @ 0,97 → -30,26 · hatch deeps @ 0,32 → 0,26; when `c5-valve-maps` active or done · hatch deeps @ 0,-22 → 0,-30; when `c6-down-the-drains` active or done (and reverse hatches at 0,24 → 0,36 and 0,-28 → 0,-18, no condition) |
| cloverfield (130) | Sodbury pump 0,0 | `sodbury` 0,0,26 · `granary` 10,-16,6 · `honeydew-ranch` -60,-40,22 · `snail-pens` 25,30,12 · `pettigrew-ranch` -70,40,18 · `red-anthills` 50,60,24 · `scarecrow-rise` -60,95,18 · `crows-perch` 80,-70,16; lake 30,-60,10 | keep @ 126,0 → -70,0 |
| hedgewood (120) | Clippings sawpit 40,40 | `clippings` 40,40,22 · `barkhollow` 80,-20,16 · `sawdust-mill` 0,60,16 · `webhollow` 60,-70,20 · `burdocks-tangle` -40,-20,22 · `elder-privet` -50,-55,14 · `paper-spire` -80,40,16 · `cricket-hedge` 20,-40,12 | keep @ -110,110 → 52,-52 · verge @ 0,-115 → 60,100; when `c6-who-holds-the-valve` done |
| rockery (120) | Flintdelve forge 0,20 | `flintdelve` 0,20,22 · `spigot` -90,-60,14 · `marble-pits` -80,40,18 · `shard-mine` 40,-20,20 · `mudtooth-deeps` 60,50,18 · `kiln` 0,-80,18 · `kiln-back` 0,-102,8 · `raft-dock` -40,40,5 | keep @ 110,110 → -52,-52 · verge @ -60,-115 → -80,100; when `c6-who-holds-the-valve` done |
| verge (140) | Last Tuft banner 0,80 | `last-tuft` 0,80,24 · `shorn` -40,20,40 · `kings-cart` -60,-10,8 · `the-level` 60,0,22 · `battlefield` 0,-60,35 · `fence-line` 0,-100,30 · `the-shed` 0,-125,14 | hedgewood @ 60,136 → 0,-108 · rockery @ -80,136 → -60,-108 |

Robin flights (Keep ⇄ Last Tuft) and the leaf raft (Flintdelve → Thatchford) are dialogue `travel` actions, not exits.

## Done when
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm run dev -w games/gnomes-of-gnomomia`, then `bash tools/smoke.sh http://localhost:5291 game ui`: no console errors. The intro plays as before: talk to Fernwick, kill a slug, loot, save and reload.
- `content.ts` throws on a deliberately duplicated id (try it once, then revert).

## Out of scope
Any new behaviour. Epic 2 owns every rewrite.
