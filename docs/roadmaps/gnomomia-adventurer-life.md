# Gnomes of Gnomomia: adventurer life (Wayfarers idle, rest, travel, and look their level)

Goal: the AI adventurers in Gnomomia (the "Wayfarers", `src/companions.ts`) stop questing non-stop. Between stints of
questing they stand around and look about, sit down for a rest at a shrine or in a town square, or run to another
area (a town or a neighbouring zone's shrine) that suits their level. Each Wayfarer's level fits what it is doing and
where it stands, and it wears gear that fits its class and level (shown on its gnome model, locally and on other
players' screens).

Reading of the request (decided without asking):

- "Adventurers who run around" are the companions in `src/companions.ts` (lore name: Wayfarers,
  `docs/lore/entries/fescue/wayfarers.md`). Six per client, roles `current`/`prior`, activities today:
  `quest | forage | admire | stroll`. Only `admire` (1.6-3.2 s spin) and town `stroll` (2 of 6, only while the player
  stands in a town) are not questing.
- "Sometimes idle": three new break activities, `idle` (stand, look around, face and wave at a nearby player),
  `rest` (walk to the nearest town centre or shrine in the zone and sit on the ground) and `travel` (run to a town or
  shrine at most one zone hop away whose level band suits the Wayfarer). A break starts when a questing stint runs out
  (personality-tuned, 35-160 s) or, by chance, right after a quest is finished.
- "Level appropriate", the bugs found in the code:
  - `syncLevelToQuest` sets level = quest level +-1 regardless of where the gnome is; with no quest it uses the
    player's level. Town strollers are teleported into the player's town at their quest's level, so a Lv 3 Wayfarer
    strolls Flintdelve (band 19-24).
  - Other players see a companion's level as its owner's level (`net/mmo.ts`: `level: r.card?.level`), not its own.
  - Fix: one pure module (`src/companionGear.ts`) owns the level rules (quest level +-1; zone band fit
    `[lo - 2, hi + 3]`; zone-level fallback); strollers whose level does not fit the town are re-levelled for it;
    travel only goes to zones whose band fits; the companion pose carries the level.
- "Gear appropriate": companions wear nothing today (hat/shirt/beard colours only). They get a deterministic
  loadout from `ITEMS` (class-allowed weapon and armour, ilvl <= level, rarity cap and gaps by personality), drawn with
  the game's existing `createGearRig` / `syncGear` (`src/gear.ts`, uses `@lawn/prefabs`, no new prefabs). Hit damage
  and max hp read the gear. The pose carries class, personality and level so other clients compute the same loadout.
- No new player input, so mobile is unchanged (nothing to tap). Online: the companion pose grows from 10 to 14 fields,
  backward compatible (old 10-field poses still read). Achievements: none; Gnomomia has no achievement tracker and this
  is ambient NPC behaviour with no player verb (say so in the PR). Party slice: not applicable (no new mode).
- Lore: new bubble lines are written in this plan (issue 1A); the Wayfarers entry gains what they do between errands
  (issue 3B). No new ruling.

Zone graph (from `src/data/levels/*.level.json` exits; `*` = gated by a `when`, companions ignore gates):
mossbottom [1-6] - thatchford [6-11] - keep [10-14] (hub) - cloverfield [11-16], hedgewood [15-20], rockery [19-24],
deeps [10-25, indoor, excluded]; hedgewood - verge [25-30] - rockery.

## Overlap with the sibling roadmaps (sequencing)

This roadmap changes only these existing files: `src/companions.ts` (2A, 3A), `src/net/protocol.ts` (1C),
`src/net/mmo.ts` (2B), `docs/lore/entries/fescue/wayfarers.md` (3B). New files: `src/companionLife.ts`,
`src/companionLife.test.ts`, `src/companionGear.ts`, `src/companionGear.test.ts`, `src/net/companionPose.test.ts`.
It deliberately does not touch `src/companionLogic.ts`, `src/quests.ts`, `src/sim/**`, `src/data/**`,
`src/ui/online.ts`, `docs/lore/rulings.md`.

- Partying/social (sibling 4) almost certainly edits `companions.ts`, `net/protocol.ts`, `net/mmo.ts`, maybe
  `wayfarers.md`: run it before or after this roadmap, not interleaved. If it comes after: companion `activity` has
  `idle | rest | travel` too, and any new companion pose field goes after index 13.
- Quest framework / respawn bug (sibling 1): if its respawn fix is the companion respawn (`stepCompanion`'s dead
  branch in `companions.ts`), sequence it against 2A/3A. If it changes quest objective types, `companionLogic.ts`
  `resolveStageTarget` is its problem, not this plan's.
- Rebalance/raids (sibling 3): no shared files. `companionGear.ts` reads `ITEMS` ilvl/rarity and zone bands live, so
  retuned data flows through; it copies the class weapon/armour rules from `src/sim/loadout.ts` (not imported, so
  sibling 3 can edit `loadout.ts` freely).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Pure rules | `npx tsc --noEmit -p games/gnomes-of-gnomomia`, `npm test -w games/gnomes-of-gnomomia`, build pass; game behaviour unchanged | 3 (1A life rules, 1B level and gear rules, 1C pose wire format), parallel |
| 2. Level and gear on the gnomes | build and tests pass; local and remote Wayfarers wear class gear and show their own level; smoke passes | 2 (2A companions.ts, 2B net/mmo.ts), parallel |
| 3. Idle, rest, travel | build, tests, `npm run lore`, smoke pass; Wayfarers take breaks and run between areas | 2 (3A companions.ts, 3B lore), parallel |

End-of-epic checks (planner): `npm run build -w games/gnomes-of-gnomomia`, `npm test -w games/gnomes-of-gnomomia`,
then with `npm run dev -w games/gnomes-of-gnomomia` up: `bash tools/smoke.sh http://localhost:5291 game ui`.
No new scenery, so no `zfight` run. Epic 3 also `npm run lore`.

## Epic 1: pure rules

~~~~text
Epic: 1 Pure rules
Depends on: none
Issue 1A: companion life rules (src/companionLife.ts)

## Environment
Repo root is the current git worktree. Git Bash; if `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
If node_modules is missing, run `npm install` once from the repo root.
Game: games/gnomes-of-gnomomia (Vite + TypeScript + three.js). Two other workers edit other files of this game at the
same time (src/companionGear.ts, src/net/protocol.ts); do not touch them. Do not commit. Do not edit other games.

## Goal
A new pure module decides what an AI adventurer gnome ("Wayfarer", src/companions.ts) does between quests: which
break to take (idle, rest or travel), how long, where to rest, and where to travel (a town or a zone shrine at most
one zone hop away, in a zone whose level band suits the gnome). Nothing calls it yet.

## Read first
- games/gnomes-of-gnomomia/src/towns.ts: `Town` (id, name, zone, region, x, z, r) and `TOWNS` (the eight towns,
  world coordinates).
- games/gnomes-of-gnomomia/src/config.ts lines 122-126 (`OutdoorZoneId`, `ZoneId`), 254-258 (`ZoneExit`: `to`, `when`),
  321-340 (`ZoneDef`: `levels: readonly [number, number]`, `shrine: { x, z, name }`, `exits`, `indoor?`, `interior?`).
- games/gnomes-of-gnomomia/src/companionLogic.ts lines 1-10 and 177-180: `CompanionPersonalityId`
  ('tryhard' | 'lorehound' | 'lootgoblin' | 'wanderer' | 'helper') and `PERSONALITY_ORDER`; `nextZoneExit` (a BFS
  over exits, for style).
- games/gnomes-of-gnomomia/src/companionLogic.test.ts: test style (vitest, imports from './content').

## Change
- New games/gnomes-of-gnomomia/src/companionLife.ts. Header comment: pure rules for what Wayfarers do between quests;
  used by src/companions.ts. Imports exactly:
    import type { OutdoorZoneId, ZoneDef, ZoneId } from './config';
    import { ZONES } from './content';
    import { TOWNS, type Town } from './towns';
    import type { CompanionPersonalityId } from './companionLogic';
  Do not import three.js, state, player or terrain.
  Exports (verbatim names, values and signatures):

    export type LifeActivity = 'idle' | 'rest' | 'travel';
    export interface LifeWeights { idle: number; rest: number; travel: number }
    export const LIFE_WEIGHTS: Record<CompanionPersonalityId, LifeWeights> = {
      tryhard:    { idle: 1, rest: 0, travel: 4 },
      lorehound:  { idle: 3, rest: 3, travel: 2 },
      lootgoblin: { idle: 3, rest: 1, travel: 2 },
      wanderer:   { idle: 2, rest: 2, travel: 4 },
      helper:     { idle: 2, rest: 3, travel: 2 },
    };
    /** Seconds a Wayfarer quests before it takes a break: [min, max]. */
    export const QUEST_STINT_S: Record<CompanionPersonalityId, readonly [number, number]> = {
      tryhard: [90, 160], lorehound: [45, 90], lootgoblin: [60, 110], wanderer: [35, 70], helper: [50, 100],
    };
    /** Chance of a break right after finishing a quest. */
    export const BREAK_AFTER_QUEST_CHANCE = 0.45;
    export const IDLE_S: readonly [number, number] = [6, 14];
    export const REST_S: readonly [number, number] = [14, 30];
    /** After a trip, the Wayfarer idles at the destination this long. */
    export const ARRIVE_LINGER_S: readonly [number, number] = [4, 10];
    /** A trip goes at most this many zone hops away. */
    export const TRAVEL_MAX_HOPS = 1;
    /** A spot closer than this (m) to where the Wayfarer stands is not a trip. */
    export const TRAVEL_MIN_DIST = 40;
    /** Walk speed multiplier while travelling: they run between areas. */
    export const TRAVEL_SPEED_MULT = 1.15;
    /** A gnome sitting on the ground is drawn this much lower (m), so it sits on the grass, not in the air. */
    export const SIT_DROP = 0.28;
    /** A resting Wayfarer sits this far (m) from the rest spot's centre: [min, max], so several do not stack. */
    export const REST_RING_M: readonly [number, number] = [1.5, 4];

    /** range[0] + rng() * (range[1] - range[0]). */
    export function rollRange(range: readonly [number, number], rng: () => number): number

    /** Weighted pick from LIFE_WEIGHTS[personality]. When canTravel is false the travel weight counts as 0.
     * One rng() call: r = rng() * total; 'idle' if r < idle; else 'rest' if r < idle + rest; else 'travel'.
     * If the total weight is 0, returns 'idle'. */
    export function pickLifeActivity(personality: CompanionPersonalityId, rng: () => number, canTravel = true): LifeActivity

    /** A place to travel to or rest at. townId is the town's id for a town centre, null for a zone shrine. */
    export interface LifeSpot { zone: OutdoorZoneId; x: number; z: number; label: string; townId: string | null }

    /** Every town centre (from `towns`, in that order; label = town.name, x/z = town.x/z), then every outdoor zone's
     * shrine (label = zone.shrine.name) in Object.keys(zones) order. Zones whose id contains '/', or with `indoor`
     * or `interior` set, are left out (that drops the Deeps and every house interior). */
    export function lifeSpots(zones: Record<ZoneId, ZoneDef> = ZONES, towns: readonly Town[] = TOWNS): LifeSpot[]

    /** Hops from `from` to `to` over ZoneDef.exits (breadth-first; exit `when` conditions are ignored; an exit whose
     * `to` equals its own zone is skipped). 0 for the same zone; Infinity when unreachable or unknown. */
    export function zoneHops(from: ZoneId, to: ZoneId, zones: Record<ZoneId, ZoneDef> = ZONES): number

    /** A trip: a spot whose zone is at most TRAVEL_MAX_HOPS hops from `fromZone`, at least TRAVEL_MIN_DIST from
     * (x, z), and whose zone's `levels` band passes `fits`. Uniform pick among those with one rng() call:
     * candidates[Math.min(n - 1, Math.floor(rng() * n))]. Null when there is none (no rng call then).
     * When fromZone contains '/', use the part before the '/'. */
    export function pickTravelDestination(
      fromZone: ZoneId, x: number, z: number,
      fits: (band: readonly [number, number]) => boolean,
      rng: () => number,
      spots: readonly LifeSpot[] = defaultSpots(),
      zones: Record<ZoneId, ZoneDef> = ZONES,
    ): LifeSpot | null

    /** Where a Wayfarer in `zone` at (x, z) sits down: the nearest spot in the same zone (part before '/' if any);
     * null when the zone has none. */
    export function restSpot(zone: ZoneId, x: number, z: number, spots: readonly LifeSpot[] = defaultSpots()): LifeSpot | null

    /** Bubble lines for breaks. */
    export const LIFE_LINES: Record<CompanionPersonalityId, { rest: readonly string[]; travel: readonly string[]; arrive: readonly string[] }> = {
      tryhard: {
        rest: ['Brb, two minutes.', 'Waiting on cooldowns.', 'Lacing my boots tighter.'],
        travel: ['Better spawns over there.', 'Changing zones.', 'Running, not walking.'],
        arrive: ['Made it. Next.', 'Right, pulling here.'],
      },
      lorehound: {
        rest: ['A fine spot to sit a while.', 'Let my feet remember the road.', 'Hush. Listen to the grass.'],
        travel: ['The road calls, friends.', 'I hear there is a plaque yonder.', 'Onward, to the next chapter.'],
        arrive: ['Ah, the air is different here.', 'Just as the ledger described.'],
      },
      lootgoblin: {
        rest: ['Counting it all again.', 'Shh, sorting my bags.', 'Nobody touch my pile.'],
        travel: ['Heard the pickings are better there.', 'Off to new pickings!'],
        arrive: ['Fresh ground. Fresh loot.', 'What have we here?'],
      },
      wanderer: {
        rest: ['Just sitting. Is that allowed?', 'My legs gave up.', 'Nice and squishy here.'],
        travel: ['I think it is this way.', 'Ooh, what is over there?', 'Following the road. Probably.'],
        arrive: ['Where am I now?', 'Oh! This place.'],
      },
      helper: {
        rest: ['Taking five. Shout if you need me.', 'Sit with me a minute?', 'Rest up, then back to it.'],
        travel: ['Off to help out yonder.', 'Someone over there needs a hand.'],
        arrive: ['Right, who needs help?', 'Made it. Anyone stuck?'],
      },
    };

  `defaultSpots()` is a private function that computes lifeSpots() once and caches it in a module-level
  `let cached: LifeSpot[] | null = null`. Do not call lifeSpots() at import time.

- New games/gnomes-of-gnomomia/src/companionLife.test.ts (vitest) checking, against the real ZONES/TOWNS:
  - lifeSpots(): one spot per town in TOWNS with townId set; one shrine spot (townId null) per zone in ZONES whose id
    has no '/' and is not indoor/interior; no spot has zone 'deeps'.
  - zoneHops: ('mossbottom','mossbottom') = 0; ('mossbottom','thatchford') = 1; ('thatchford','cloverfield') = 2
    (through keep); unknown zone id cast `as ZoneId` gives Infinity.
  - pickTravelDestination with fits = () => true, rng = () => 0.5: from every outdoor non-indoor zone's shrine the
    result is non-null, its zone is at most 1 hop away and it is >= TRAVEL_MIN_DIST from the shrine. With
    fits = () => false it returns null. With fits = (b) => b[0] >= 25 from 'hedgewood' every result is in 'verge'.
  - restSpot('mossbottom', 0, 0) is in mossbottom; restSpot for a zone with no spots ('deeps') is null.
  - pickLifeActivity: tryhard with rng () => 0 gives 'idle' (idle weight 1 > 0); tryhard with rng () => 0.99 gives
    'travel'; with canTravel false and rng () => 0.99 tryhard gives 'idle' (rest weight 0, so all weight is idle).
  - every LIFE_LINES list is non-empty and every line is at most 40 characters.

## Contract
The export names, types, values and signatures above are fixed: src/companions.ts and src/net/mmo.ts will import
`LIFE_WEIGHTS, QUEST_STINT_S, BREAK_AFTER_QUEST_CHANCE, IDLE_S, REST_S, ARRIVE_LINGER_S, TRAVEL_SPEED_MULT, SIT_DROP,
REST_RING_M, rollRange, pickLifeActivity, pickTravelDestination, restSpot, LIFE_LINES, type LifeSpot` in a later epic.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (other workers' files may be mid-edit; only errors in your
  files count)
- `npx vitest run src/companionLife.test.ts` from games/gnomes-of-gnomomia passes
- No other file changed

## Out of scope
src/companions.ts, src/companionLogic.ts, src/companionGear.ts (another worker), src/net/** (another worker),
src/towns.ts, any data file.
~~~~

~~~~text
Epic: 1 Pure rules
Depends on: none
Issue 1B: companion level and gear rules (src/companionGear.ts)

## Environment
Repo root is the current git worktree. Git Bash; if `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
If node_modules is missing, run `npm install` once from the repo root.
Game: games/gnomes-of-gnomomia (Vite + TypeScript + three.js). Two other workers edit other files of this game at the
same time (src/companionLife.ts, src/net/protocol.ts); do not touch them. Do not commit. Do not edit other games.

## Goal
A new pure module decides an AI adventurer gnome's ("Wayfarer") level and its gear: the level for a quest or a zone,
whether a level suits a zone, a deterministic class- and level-appropriate loadout from ITEMS (same inputs give the
same loadout on every client), max hp and hit damage from level and gear, and small wire encoders for class and
personality. Nothing calls it yet.

## Read first
- games/gnomes-of-gnomomia/src/sim/loadout.ts lines 86-175: `isAllowedWeapon`, `isAllowedArmor`, `scoreArmor`,
  `selectEquipment`. Copy the two allow-rules (do NOT import from src/sim; another plan edits that folder).
- games/gnomes-of-gnomomia/src/config.ts lines 126-178: `ClassId`, `Rarity`, `EquipSlot`, `EQUIP_SLOTS`, `ItemDef`
  (slot, ilvl, rarity, hands, weaponClass, armorType, questItem), `ClassDef.armor`.
- games/gnomes-of-gnomomia/src/data/classes.ts line 56-58: `CLASSES[classId].armor`.
- games/gnomes-of-gnomomia/src/data/economy.ts: `ECONOMY.levelCap` (30).
- games/gnomes-of-gnomomia/src/data/interiors.ts lines 197-206: `mulberry32(seed): () => number`.
- games/gnomes-of-gnomomia/src/companionLogic.ts lines 8 and 177-179: `CompanionPersonalityId`, `PERSONALITY_ORDER`.

## Change
- New games/gnomes-of-gnomomia/src/companionGear.ts. Header comment: level and gear rules for Wayfarers, pure; used by
  src/companions.ts (local gnomes) and src/net/mmo.ts (other players' gnomes), which must get identical loadouts.
  Imports exactly:
    import { EQUIP_SLOTS, type ClassId, type EquipSlot, type ItemDef, type Rarity } from './config';
    import { ITEMS } from './content';
    import { CLASSES } from './data/classes';
    import { ECONOMY } from './data/economy';
    import { mulberry32 } from './data/interiors';
    import { PERSONALITY_ORDER, type CompanionPersonalityId } from './companionLogic';
  Exports (verbatim):

    /** A level suits a zone with band [lo, hi] when lo - LEVEL_BELOW_BAND <= level <= hi + LEVEL_ABOVE_BAND. */
    export const LEVEL_BELOW_BAND = 2;
    export const LEVEL_ABOVE_BAND = 3;

    /** -1, 0 or +1 by companion id ((id % 3) - 1, safe for negative ids), so Wayfarers on one quest differ. */
    export function levelOffset(id: number): number

    /** Level while doing a quest of level questLevel: questLevel + levelOffset(id), clamped to 1..ECONOMY.levelCap. */
    export function questLevelFor(questLevel: number, id: number): number

    /** Level of a Wayfarer that belongs in a zone of band [lo, hi] with no quest: clamp(playerLevel, lo, hi) +
     * levelOffset(id), then clamped to [max(1, lo), min(ECONOMY.levelCap, hi + 1)]. */
    export function zoneLevelFor(band: readonly [number, number], playerLevel: number, id: number): number

    /** True when level suits the band (see LEVEL_BELOW_BAND / LEVEL_ABOVE_BAND). */
    export function levelFitsZone(level: number, band: readonly [number, number]): boolean

    export interface GearStyle {
      /** Highest rarity worn. */
      maxRarity: Rarity;
      /** Items are at most level - lag (min 1). */
      lag: number;
      /** 0..1: chance each slot other than weapon and body is left empty. */
      gapChance: number;
      /** Never fills the head slot, so the coloured hat stays visible. */
      keepsHat: boolean;
    }
    export const GEAR_STYLE: Record<CompanionPersonalityId, GearStyle> = {
      tryhard:    { maxRarity: 'heirloom',  lag: 0, gapChance: 0,    keepsHat: false },
      lorehound:  { maxRarity: 'blooming',  lag: 1, gapChance: 0.15, keepsHat: true },
      lootgoblin: { maxRarity: 'kilnfired', lag: 1, gapChance: 0.1,  keepsHat: false },
      wanderer:   { maxRarity: 'sprouted',  lag: 3, gapChance: 0.4,  keepsHat: true },
      helper:     { maxRarity: 'blooming',  lag: 0, gapChance: 0.05, keepsHat: false },
    };
    export const RARITY_RANK: Record<Rarity, number> = { plain: 0, sprouted: 1, blooming: 2, heirloom: 3, kilnfired: 4 };
    /** Items more than this many levels under the gear cap are only used when nothing newer fits. */
    export const GEAR_WINDOW = 8;

    /** Same rule as sim/loadout.ts isAllowedWeapon: kind 'weapon'; weaponClass (default 'melee') must be
     * sling/blowpipe/thrown for slinger, staff/wand for mage, melee for warden. */
    export function companionWeaponAllowed(item: ItemDef, classId: ClassId): boolean
    /** Same rule as sim/loadout.ts isAllowedArmor with a non-null class: item.slot === slot; trinket slot needs kind
     * 'trinket'; offhand slot needs kind 'offhand', and a shield (armorType 'shield') only for warden; other slots
     * need kind 'armor' with armorType (default 'cloth') in CLASSES[classId].armor. */
    export function companionArmorAllowed(item: ItemDef, classId: ClassId, slot: EquipSlot): boolean

    /** A deterministic loadout. Algorithm (keep exactly, both clients must agree):
     *  rng = mulberry32((seed + 1) * 7919 + level * 31 + CLASS_WIRE.indexOf(classId));
     *  style = GEAR_STYLE[personality]; cap = Math.max(1, level - style.lag); lo = cap - GEAR_WINDOW;
     *  eligible(it) = !it.questItem && RARITY_RANK[it.rarity ?? 'plain'] <= RARITY_RANK[style.maxRarity] && (it.ilvl ?? 1) <= cap;
     *  pick(cands): pool = cands with (ilvl ?? 1) >= lo, or all cands when that is empty; sort by score descending
     *    (score = (ilvl ?? 1) * 10 + RARITY_RANK[rarity ?? 'plain'] * 5; ties by id ascending);
     *    return pool[Math.floor(rng() * Math.min(3, pool.length))].id, or null when pool is empty (no rng call then).
     *  1. weapon = pick(items allowed by companionWeaponAllowed and eligible); if null, the allowed weapon with the
     *     lowest ilvl (ties by id), ignoring eligible; null if the class has none.
     *  2. twoHanded = weapon !== null && items[weapon].hands === 2.
     *  3. for slot of EQUIP_SLOTS in order, skipping 'weapon':
     *     offhand && twoHanded -> null; head && style.keepsHat -> null;
     *     else if slot !== 'body' && rng() < style.gapChance -> null;
     *     else pick(items allowed by companionArmorAllowed(it, classId, slot) and eligible).
     *  Iterate items as Object.values(items) sorted by id, so the order never depends on object key order. */
    export function companionEquipment(
      classId: ClassId, level: number, personality: CompanionPersonalityId, seed: number,
      items: Record<string, ItemDef> = ITEMS,
    ): Record<EquipSlot, string | null>

    /** Max hp: base = 16 + 5 * level; x1.25 for warden; then x(1 + 0.04 * n) where n counts filled slots among
     * head, body, legs, hands, feet, offhand; Math.round. (With no gear this equals today's companion hp.) */
    export function companionMaxHp(level: number, classId: ClassId, equipment: Record<EquipSlot, string | null>): number

    /** One hit: Math.max(1, Math.round((1 + 0.4 * level) * (equipment.weapon ? 1 : 0.7))). */
    export function companionHitDamage(level: number, equipment: Record<EquipSlot, string | null>): number

    /** Wire indexes for the companion pose (src/net/protocol.ts). */
    export const CLASS_WIRE: readonly ClassId[] = ['warden', 'slinger', 'mage'];
    export function classToWire(classId: ClassId): number            // CLASS_WIRE.indexOf
    export function classFromWire(n: number): ClassId | null          // null unless an integer index into CLASS_WIRE
    export function personalityToWire(p: CompanionPersonalityId): number   // PERSONALITY_ORDER.indexOf
    export function personalityFromWire(n: number): CompanionPersonalityId | null  // null unless a valid integer index

- New games/gnomes-of-gnomomia/src/companionGear.test.ts (vitest, real ITEMS) checking:
  - for every class in CLASS_WIRE, every personality in PERSONALITY_ORDER and every level 1..30: the loadout has a
    weapon; companionWeaponAllowed holds for it; every non-null slot item exists in ITEMS, has that slot, passes
    companionArmorAllowed (or companionWeaponAllowed for the weapon) and is not a questItem; every item except a
    weapon from the fallback rule has ilvl <= max(1, level - lag) and rarity rank <= the style's maxRarity rank;
    keepsHat personalities have head null; a two-handed weapon means offhand null.
  - same inputs twice give deep-equal loadouts; seed 0 vs seed 5 differ for at least one (class, level) pair.
  - questLevelFor(1, 0) = 1 (clamped), questLevelFor(30, 2) = 30, questLevelFor(10, 1) = 10, questLevelFor(10, 0) = 9.
  - zoneLevelFor([19, 24], 3, 1) = 19; zoneLevelFor([1, 6], 25, 2) = 7; result always fits levelFitsZone(band).
  - levelFitsZone(3, [19, 24]) false; levelFitsZone(17, [19, 24]) true; levelFitsZone(28, [19, 24]) false.
  - companionMaxHp(5, 'mage', all-null) = 41; companionMaxHp(5, 'warden', all-null) = 51.
  - classFromWire(classToWire(c)) === c for each class; classFromWire(-1) and (3) and (0.5) are null; same for personality.

## Contract
Names, signatures and the loadout algorithm above are fixed: src/companions.ts (local) and src/net/mmo.ts (remote)
will both call companionEquipment(classId, level, personality, seed) with seed = the companion's id/slot, and must get
the same result.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (other workers' files may be mid-edit; only errors in your
  files count)
- `npx vitest run src/companionGear.test.ts` from games/gnomes-of-gnomomia passes
- No other file changed

## Out of scope
src/companions.ts, src/companionLogic.ts, src/sim/** (copy, never import or edit), src/gear.ts, src/companionLife.ts
(another worker), src/net/** (another worker), any data file.
~~~~

~~~~text
Epic: 1 Pure rules
Depends on: none
Issue 1C: companion pose carries level, class, personality and sitting (src/net/protocol.ts)

## Environment
Repo root is the current git worktree. Git Bash; if `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
If node_modules is missing, run `npm install` once from the repo root.
Game: games/gnomes-of-gnomomia. Two other workers add src/companionLife.ts and src/companionGear.ts at the same time;
do not touch them. Do not commit. Do not edit other games.

## Goal
The online companion pose (one tuple per AI gnome, relayed to other players) can carry four more numbers: the gnome's
level, class index, personality index and a sitting flag. Old 10-field poses from older clients still read. Nothing
sends the new fields yet; the type keeps the new fields optional so the current sender still compiles.

## Read first
- games/gnomes-of-gnomomia/src/net/protocol.ts lines 36-40 (`CompanionPose`), 105-110 (`finite`), 143-166
  (`readCompanionList`).
- games/gnomes-of-gnomomia/src/companions.ts lines 834-847 (`companionPoses()`, the sender, returns 10 fields; do not
  edit it).
- games/gnomes-of-gnomomia/src/net/mmo.ts lines 552-560 (the receiver destructures the first 10 fields; do not edit).
- games/gnomes-of-gnomomia/src/net/animSync.test.ts (test style for protocol readers).

## Change
- src/net/protocol.ts:
  - Replace the CompanionPose type and its comment with:
      /** [slot, name, x, z, facing, dead, swings, y, hatColor, shirtColor, level, cls, pers, sit].
       * level: the gnome's own level (0 = unknown: an older client). cls: index into CLASS_WIRE in
       * src/companionGear.ts (-1 = unknown). pers: index into PERSONALITY_ORDER in src/companionLogic.ts (-1 = unknown).
       * sit: 1 while sitting on the ground, else 0. The last four are optional for older senders; readCompanionList
       * always fills them. */
      export type CompanionPose = [
        number, string, number, number, number, number, number, number, number, number,
        number?, number?, number?, number?,
      ];
  - readCompanionList: accept items of length 10 or 14 (anything else: return null, as now). Validate the first ten
    exactly as now. For 14: level = finite(item[10], 0, 99), cls = finite(item[11], -1, 15),
    pers = finite(item[12], -1, 15), sit = finite(item[13], 0, 1); any null -> return null; push
    Math.floor(level), Math.floor(cls), Math.floor(pers), sit >= 0.5 ? 1 : 0. For 10: push 0, -1, -1, 0.
    Every returned pose has 14 entries. Keep the `raw.length > 8` limit.
  - Do not change NET_VERSION (the change is backward compatible).
- New src/net/companionPose.test.ts (vitest): a 10-field pose reads back with [.., 0, -1, -1, 0] appended; a 14-field
  pose [3, 'Wobbles', 1, 2, 0.5, 0, 7, 0.1, 0x3b8a57, 0x4b6344, 12.9, 1, 3, 1] reads back with level 12, cls 1, pers 3,
  sit 1; length 11 or 13 gives null; level 150 or cls -2 or sit 2 gives null; more than 8 poses gives null.

## Contract
CompanionPose as written above (optional tail). readCompanionList's return type stays `CompanionPose[] | null`, and
every pose it returns has all 14 entries set.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (only errors in your files count)
- `npx vitest run src/net` from games/gnomes-of-gnomomia passes (includes townVisibility.test.ts)
- No other file changed

## Out of scope
src/companions.ts, src/net/mmo.ts (later issues), src/companionLife.ts and src/companionGear.ts (other workers).
~~~~

## Epic 2: level and gear on the gnomes

~~~~text
Epic: 2 Level and gear on the gnomes
Depends on: epic 1 (src/companionGear.ts, src/companionLife.ts, 14-field CompanionPose exist)
Issue 2A: local Wayfarers get level rules and class gear (src/companions.ts)

## Environment
Repo root is the current git worktree. Git Bash; if `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia (three.js). Another worker edits src/net/mmo.ts at the same time; do not touch it.
Do not commit. Do not edit other games. Do not start a dev server (the planner runs the smoke check).

## Goal
The six AI gnome players in src/companions.ts have a level that fits their quest, or the zone when they have no quest,
and town strollers are re-levelled when their level does not suit the town's zone. Each wears a class- and
level-appropriate loadout drawn on its gnome model, its max hp and hit damage come from level and gear, and its
online pose sends level, class and personality.

## Read first
- games/gnomes-of-gnomomia/src/companions.ts: the whole file (847 lines). Key places: `maxHpForLevel` 143-146,
  `syncLevelToQuest` 159-169, `assignQuest` 171-198, `swingAtEnemy` 400-427 (damage line 410), `startStroll` 546-556,
  `initCompanions` 743-816, `companionPoses` 834-847.
- games/gnomes-of-gnomomia/src/companionGear.ts (all exports; signatures below).
- games/gnomes-of-gnomomia/src/gear.ts lines 323-362: `GearRig`, `createGearRig()`, `syncGear(rig, model, equipment)`
  (rebuilds only changed slots; hides the hat when a head item is worn).
- games/gnomes-of-gnomomia/src/net/protocol.ts: `CompanionPose` (14 fields, last four optional).

## Change (all in src/companions.ts)
- Imports: add `import { createGearRig, syncGear, type GearRig } from './gear';` and
  `import { classToWire, companionEquipment, companionHitDamage, companionMaxHp, levelFitsZone, personalityToWire,
  questLevelFor, zoneLevelFor } from './companionGear';` and `EquipSlot` to the './config' type import.
- Companion interface: add `equipment: Record<EquipSlot, string | null>;` and `gear: GearRig;`.
- Delete `maxHpForLevel`.
- Add, next to syncLevelToQuest:
    const baseZone = (z: ZoneId): ZoneId => (z.includes('/') ? z.split('/')[0] : z) as ZoneId;

    /** Sets level, re-rolls the loadout (drawn on the model) and max hp; hp grows by what max hp gained. */
    function setLevel(c: Companion, level: number): void {
      if (c.level === level) return;
      c.level = level;
      c.equipment = companionEquipment(c.classId, level, c.personality, c.id);
      syncGear(c.gear, c.model, c.equipment);
      const prevMax = c.hpMax;
      c.hpMax = companionMaxHp(level, c.classId, c.equipment);
      c.hp = Math.min(c.hpMax, c.hp + Math.max(0, c.hpMax - prevMax));
    }
- syncLevelToQuest(c, questId) body becomes: if questId && QUESTS[questId] -> setLevel(c, questLevelFor(QUESTS[questId].level, c.id));
  else -> setLevel(c, zoneLevelFor(ZONES[baseZone(c.zone)].levels, state.level, c.id)).
- swingAtEnemy: damage = companionHitDamage(c.level, c.equipment) (replaces `Math.max(1, Math.round(1 + c.level * 0.4))`).
- startStroll(c, town): after the placeAtTownEdge line (and only when not dead), add:
    const band = ZONES[town.zone].levels;
    if (!levelFitsZone(c.level, band)) setLevel(c, zoneLevelFor(band, state.level, c.id));
- initCompanions: build each companion with `level: 0`, `hp: 1`, `hpMax: 1`, `gear: createGearRig()`,
  `equipment` = an object with every EQUIP_SLOTS key set to null (import EQUIP_SLOTS from './config'), and remove the
  `const level` / `const hpMax` lines. After `assignQuest(c, true)` and `placeAtQuestStart(c)`, set `c.hp = c.hpMax`.
  (assignQuest calls syncLevelToQuest, which calls setLevel, so the loadout is built there; level 0 never stays.)
- companionPoses(): append four entries after `c.shirtColor`: `c.level, classToWire(c.classId),
  personalityToWire(c.personality), 0` (the last is the sitting flag; a later issue sets it).
- Keep `localCompanions()` and `CompanionView` as they are (the plate already shows `c.level` and the class).

## Contract
Uses companionGear.ts as written:
  questLevelFor(questLevel: number, id: number): number
  zoneLevelFor(band: readonly [number, number], playerLevel: number, id: number): number
  levelFitsZone(level: number, band: readonly [number, number]): boolean
  companionEquipment(classId, level, personality, seed): Record<EquipSlot, string | null>   (seed = c.id)
  companionMaxHp(level, classId, equipment): number; companionHitDamage(level, equipment): number
  classToWire(classId): number; personalityToWire(p): number
The pose is [id, name, x, z, facing, dead, swings, y, hatColor, shirtColor, level, cls, pers, sit]; the remote side
(another worker) computes companionEquipment(cls, level, pers, slot) from it, so seed must be c.id.
Keep every export of companions.ts and its signature (initCompanions, updateCompanions, localCompanions,
companionPoses, CompanionView, CompanionBubble).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (only errors in your file count while net/mmo.ts is edited)
- `npm test -w games/gnomes-of-gnomomia` passes
- Reading the diff: no remaining call to maxHpForLevel; the loadout is built only in setLevel.

## Out of scope
src/net/** (another worker), src/companionGear.ts, src/companionLife.ts, src/companionLogic.ts, src/gear.ts,
src/ui/**. No idle/rest/travel behaviour yet (next epic).
~~~~

~~~~text
Epic: 2 Level and gear on the gnomes
Depends on: epic 1 (src/companionGear.ts, src/companionLife.ts, 14-field CompanionPose exist)
Issue 2B: other players' Wayfarers show their own level, their gear, and sit (src/net/mmo.ts)

## Environment
Repo root is the current git worktree. Git Bash; if `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia (three.js, online via @lawn/mp). Another worker edits src/companions.ts at the same
time; do not touch it. Do not commit. Do not edit other games. Do not start a dev server.

## Goal
Remote AI gnomes (companions relayed by other players) show their own level instead of their owner's, wear the same
loadout their owner's client gives them (computed locally from level, class and personality), and are drawn sitting
on the ground when the pose says so. Poses from older clients (no level/class) still draw as today, with no gear.

## Read first
- games/gnomes-of-gnomomia/src/net/mmo.ts: `RemoteCompanion` 72-90, `dropCompanionModel` 229-233,
  `ensureCompanionModel` 274-283, the 'comp' message handler 552-598, the companion draw loop in `updateMmo` 886-910.
- games/gnomes-of-gnomomia/src/net/protocol.ts: `CompanionPose` and `readCompanionList` (always returns 14 entries:
  level 0 = unknown, cls -1 / pers -1 = unknown, sit 0/1).
- games/gnomes-of-gnomomia/src/companionGear.ts: `companionEquipment`, `classFromWire`, `personalityFromWire`.
- games/gnomes-of-gnomomia/src/companionLife.ts: `SIT_DROP` (0.28 m).
- games/gnomes-of-gnomomia/src/gear.ts lines 323-362: `GearRig`, `createGearRig`, `syncGear`.

## Change (all in src/net/mmo.ts)
- Imports: `import { companionEquipment, classFromWire, personalityFromWire } from '../companionGear';`,
  `import { SIT_DROP } from '../companionLife';`, `import { createGearRig, syncGear, type GearRig } from '../gear';`,
  `ClassId` to the '../config' type import, `import type { CompanionPersonalityId } from '../companionLogic';`.
- RemoteCompanion: add `classId: ClassId | null; personality: CompanionPersonalityId | null; sitting: boolean;
  gear: GearRig | null; gearKey: string;`.
- dropCompanionModel: also set `c.gear = null; c.gearKey = '';` (the rig's nodes belonged to the disposed model).
- 'comp' handler: destructure all 14 fields
  `[slot, cname, cx, cz, cf, cdead, cswings, cy, hatColor, shirtColor, clevel, ccls, cpers, csit]`.
  Compute `const ownLevel = (clevel ?? 0) >= 1 ? clevel! : null;` and use `ownLevel ?? r.card?.level ?? null` for
  `level` both when creating and when updating a companion. Set (create and update) `classId = classFromWire(ccls ?? -1)`,
  `personality = personalityFromWire(cpers ?? -1)`, `sitting = (csit ?? 0) === 1`. New companions start with
  `gear: null, gearKey: ''`.
- Draw loop, right after `const cModel = ensureCompanionModel(c);`:
    if (c.classId && c.personality && c.level !== null) {
      const key = `${c.classId}:${c.personality}:${c.level}`;
      if (c.gearKey !== key) {
        c.gear ??= createGearRig();
        syncGear(c.gear, cModel, companionEquipment(c.classId, c.level, c.personality, c.slot));
        c.gearKey = key;
      }
    }
  (Only when the pose gave a real level: c.level falls back to the owner's level for old clients, so also require
  classId and personality, which are null for old clients.)
- Sitting: keep `c.position` as the true position (plates use it). When `c.sitting && cdead < 0.5`, pass a lowered
  copy to the model: a module-level `const scratchSit = new THREE.Vector3();`, `scratchSit.copy(c.position);
  scratchSit.y -= SIT_DROP;` and `cModel.update({ position: c.sitting && cdead < 0.5 ? scratchSit : c.position,
  velocity: ..., facing: cfacing, grounded: true, jumpsUsed: 0, sitting: c.sitting && cdead < 0.5 }, dt)`.

## Contract
companionEquipment(classId, level, personality, seed) with seed = the pose slot (the owner's client uses its companion
id, which is the slot). Pose layout: [slot, name, x, z, facing, dead, swings, y, hatColor, shirtColor, level, cls, pers, sit].
Keep `remoteCompanions()` and the RemoteCompanion fields that ui/online.ts reads (`model`, `name`, `level`, `key`,
`position`, `color`).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (only errors in your file count while companions.ts is edited)
- `npm test -w games/gnomes-of-gnomomia` passes (townVisibility.test.ts reads mmo.ts source: keep the
  `companionPoses` import from '../companions' and the `k: 'comp' ... companionPoses()` send line as they are)

## Out of scope
src/companions.ts (another worker), src/net/protocol.ts, src/ui/online.ts, remote players' (not companions') gear.
~~~~

## Epic 3: idle, rest, travel

~~~~text
Epic: 3 Idle, rest, travel
Depends on: epic 2 (companions.ts has setLevel, equipment and gear; mmo.ts draws the sit flag)
Issue 3A: Wayfarers take breaks: idle, rest, run between areas (src/companions.ts)

## Environment
Repo root is the current git worktree. Git Bash; if `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia (three.js). Another worker edits docs/lore/entries/fescue/wayfarers.md at the same
time; do not touch it. Do not commit. Do not edit other games. You are the only worker allowed to run the dev
server (port 5291).

## Goal
AI gnome players (src/companions.ts) no longer quest without pause. After a stint of questing (or sometimes right
after finishing a quest) each takes a break: stands and looks around (idle), walks to the nearest town centre or shrine
in its zone and sits on the ground (rest), or runs to a town or shrine in a neighbouring zone that suits its level
(travel), then lingers there before questing again. Breaks show bubbles, sitting shows to other players, and a hit
interrupts a break.

## Read first
- games/gnomes-of-gnomomia/src/companions.ts: the whole file. Key places: `Activity` type line 43, `Companion`
  interface, `advanceQuestStage`, `hurt`, `stepQuesting` (zone-travel block lines ~445-470), `startStroll`,
  `stepCompanion` (activity dispatch, stuck tracking, model update), `refreshQuestAssignments`, `initCompanions`,
  `companionPoses` (14th field is the sitting flag, currently 0).
- games/gnomes-of-gnomomia/src/companionLife.ts: all exports (listed in Contract).
- games/gnomes-of-gnomomia/src/companionGear.ts: `levelFitsZone(level, band)`.
- packages/gnome/src/types.ts lines 144-156: `PlayerState.sitting?: boolean` (legs forward, arms down).

## Change (all in src/companions.ts)
1. Imports: from './companionLife' import `ARRIVE_LINGER_S, BREAK_AFTER_QUEST_CHANCE, IDLE_S, LIFE_LINES,
   QUEST_STINT_S, REST_RING_M, REST_S, SIT_DROP, TRAVEL_SPEED_MULT, pickLifeActivity, pickTravelDestination,
   restSpot, rollRange, type LifeSpot`; from './companionGear' also `levelFitsZone` (if not already).
2. `type Activity = 'quest' | 'forage' | 'admire' | 'stroll' | 'idle' | 'rest' | 'travel';`
3. Companion interface, new fields: `stintS: number` (questing seconds left before a break), `lifeTimer: number`
   (seconds left in idle/rest/linger), `spot: LifeSpot | null` (rest or travel goal), `arrived: boolean` (rest: sat
   down), `sitting: boolean`, `waveS: number` (left-arm wave seconds left), `waved: boolean` (waved this break).
   initCompanions sets: `stintS: Math.random() * rollRange(QUEST_STINT_S[idSpec.personality.id], Math.random)`,
   `lifeTimer: 0, spot: null, arrived: false, sitting: false, waveS: 0, waved: false`.
4. Refactor the cross-zone block of stepQuesting into one function both quests and breaks use (keep behaviour):
     /** One step toward `zone` through its exits (teleport exits hop when in reach; far from the player a stuck
      * walker hops). 'no-route' when no exit leads there. */
     function stepToZone(c: Companion, zone: ZoneId, speed: number, dt: number, distToPlayer: number): 'moving' | 'no-route' {
       const exit = nextZoneExit(c.zone, zone, ZONES);
       if (!exit) return 'no-route';
       ...the existing lines from `const dExit = ...` through the stuck-hop `if` block, unchanged, with each inner
          `return;` replaced by `return 'moving';`...
       return 'moving';
     }
   and in stepQuesting:
     if (c.zone !== target.zone) {
       if (stepToZone(c, target.zone, speed, dt, distToPlayer) === 'no-route') {
         if (distToPlayer > 220) placeAtQuestStart(c);
         else assignQuest(c);
       }
       return;
     }
5. New helpers:
     /** Walks to `spot` (crossing zones like questing). 'arrived' within `radius` of it in its zone. */
     function goToSpot(c, spot: LifeSpot, radius: number, speed: number, dt: number, distToPlayer: number): 'moving' | 'arrived' | 'no-route'
       - live zone update like stepQuesting (`const liveZone = zoneAt(...); if (liveZone) c.zone = liveZone;`)
       - if c.zone !== spot.zone: return stepToZone(c, spot.zone, speed, dt, distToPlayer)
       - if Math.hypot(spot.x - x, spot.z - z) <= radius: return 'arrived'
       - followTargetWithPath(c, spot.x, spot.z, speed, dt); return 'moving'
     function startBreak(c: Companion): void
       - if c.activity !== 'quest' or c.dead: return. Reset c.path = [], c.pauseTimer = 0, c.targetEntityId = null,
         c.waved = false, c.sitting = false.
       - kind = pickLifeActivity(c.personality, Math.random)
       - 'rest': s = restSpot(c.zone, c.position.x, c.position.z); if s: a = Math.random() * 2 * Math.PI,
         d = rollRange(REST_RING_M, Math.random); c.spot = { ...s, x: s.x + Math.cos(a) * d, z: s.z + Math.sin(a) * d };
         c.arrived = false; c.activity = 'rest'; c.lifeTimer = rollRange(REST_S, Math.random); return.
         (no spot: fall through to idle)
       - 'travel': s = pickTravelDestination(c.zone, c.position.x, c.position.z, (b) => levelFitsZone(c.level, b), Math.random);
         if s: c.spot = s; c.activity = 'travel'; sayBubble(c, LIFE_LINES[c.personality].travel, 0.5); return.
         (none: fall through to idle)
       - idle: c.activity = 'idle'; c.lifeTimer = rollRange(IDLE_S, Math.random); sayBubble(c, c.personalityDef.lines.idle, 0.4).
     function endBreak(c: Companion): void
       - c.activity = 'quest'; c.sitting = false; c.spot = null; c.arrived = false; c.waveS = 0; c.path = [];
         c.pauseTimer = 0; c.stintS = rollRange(QUEST_STINT_S[c.personality], Math.random).
6. Break triggers:
   - stepCompanion, before the existing forage/admire roll: `if (c.activity === 'quest') { c.stintS -= dt; if
     (c.stintS <= 0 && c.targetEntityId === null && c.attackTimer < -2) startBreak(c); }` (attackTimer below -2
     means it has not swung for a couple of seconds).
   - advanceQuestStage, inside the `if (c.questStage >= def.stages.length)` block, after its existing lines:
     `if (Math.random() < BREAK_AFTER_QUEST_CHANCE) startBreak(c);`
7. Steps, added to the activity dispatch in stepCompanion (before the final `else stepQuesting`):
   - 'idle' (stepIdle): c.lifeTimer -= dt; if the player is within 6 m: face the player
     (c.facing = Math.atan2(player.position.x - c.position.x, player.position.z - c.position.z)) and, once per break
     (!c.waved), set c.waved = true, c.waveS = 1.2; otherwise look around: c.facing += Math.sin(c.lifeTimer * 0.9) * 0.6 * dt.
     When c.lifeTimer <= 0: endBreak(c).
   - 'rest' (stepRest): if !c.arrived: r = goToSpot(c, c.spot!, 0.8, baseSpeed, dt, distToPlayer); 'no-route' ->
     endBreak; 'arrived' or c.stuckTimer > 8 -> c.arrived = true, c.sitting = true, c.path = [],
     c.facing = Math.random() * 2 * Math.PI, sayBubble(c, LIFE_LINES[c.personality].rest, 0.5).
     If arrived: c.lifeTimer -= dt; wave at a player within 6 m exactly as idle does (without turning); when
     c.lifeTimer <= 0: endBreak(c) (stands up).
   - 'travel' (stepTravel): r = goToSpot(c, c.spot!, 3, baseSpeed * TRAVEL_SPEED_MULT, dt, distToPlayer);
     'no-route' -> endBreak; 'arrived' -> sayBubble(c, LIFE_LINES[c.personality].arrive, 0.6); c.spot = null;
     c.activity = 'idle'; c.lifeTimer = rollRange(ARRIVE_LINGER_S, Math.random); c.waved = false.
8. Interruptions and resets:
   - hurt(c, ...): at the top, `if (c.activity === 'idle' || c.activity === 'rest') endBreak(c);` (gets up, back
     to questing; travel continues).
   - Respawn branch (dead -> alive): also set c.sitting = false, c.spot = null, c.arrived = false (activity is already
     set to 'quest' there).
   - startStroll: set c.sitting = false, c.spot = null, c.arrived = false (strollers ignore breaks; checkPlayerTown
     still owns 'stroll'). A stroller has activity 'stroll', so the stint trigger in 6 does not fire for it.
   - refreshQuestAssignments: where it calls placeAtQuestStart(c), call endBreak(c) first if c.activity is
     'idle', 'rest' or 'travel'.
9. Stuck tracking in stepCompanion: add `|| c.activity === 'idle' || (c.activity === 'rest' && c.arrived)` to the
   condition that resets stuckTimer. In the far-away unstick branch (`distToPlayer > 240 && c.stuckTimer > 4`),
   when c.activity is 'travel' or 'rest' with a c.spot: place the gnome at the spot instead of placeAtQuestStart
   (`const p = findFreeSpot(c.spot.x, c.spot.z, 6)`, y from standY/heightAt exactly as placeAtQuestStart does,
   c.zone = c.spot.zone, c.path = [], c.lastProgressPos = { x: p.x, z: p.z }).
10. Model update (the `if (visible)` block at the end of stepCompanion): pass `sitting: c.sitting` and, when sitting,
    a lowered position (module-level `const scratchSit = new THREE.Vector3();` copy c.position, y -= SIT_DROP);
    keep c.position itself unchanged. After the existing swing override add the wave:
    `if (c.waveS > 0) { c.waveS = Math.max(0, c.waveS - dt); c.model.arms.left.rotation.x = -2.6 + 0.35 * Math.sin(c.waveS * 14); }`.
11. companionPoses(): the 14th field becomes `c.sitting ? 1 : 0`.

## Contract
companionLife.ts exports used (fixed):
  rollRange(range: readonly [number, number], rng: () => number): number
  pickLifeActivity(personality, rng, canTravel = true): 'idle' | 'rest' | 'travel'
  pickTravelDestination(fromZone, x, z, fits: (band) => boolean, rng): LifeSpot | null
  restSpot(zone, x, z): LifeSpot | null
  interface LifeSpot { zone: OutdoorZoneId; x: number; z: number; label: string; townId: string | null }
  QUEST_STINT_S, IDLE_S, REST_S, ARRIVE_LINGER_S, REST_RING_M: readonly [number, number] (per personality for QUEST_STINT_S)
  BREAK_AFTER_QUEST_CHANCE = 0.45, TRAVEL_SPEED_MULT = 1.15, SIT_DROP = 0.28
  LIFE_LINES[personality].rest / .travel / .arrive: readonly string[]
Keep every export of companions.ts and its signature. The pose stays 14 fields; field 13 = sitting.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm test -w games/gnomes-of-gnomomia` passes
- `npm run build -w games/gnomes-of-gnomomia` passes
- With `npm run dev -w games/gnomes-of-gnomomia` running (port 5291):
  `bash tools/smoke.sh http://localhost:5291 game ui` reports no console errors. Stop the server afterwards.
- In the browser (if you can look): within a few minutes near Mossbottom some Wayfarers stand idle or sit near the
  shrine or town square, and one runs off toward Thatchford; questing still happens.

## Out of scope
docs/** (another worker), src/companionLife.ts, src/companionGear.ts, src/companionLogic.ts, src/net/**, src/ui/**.
Do not change the town-stroll rules (checkPlayerTown, pickTownStrollers).
~~~~

~~~~text
Epic: 3 Idle, rest, travel
Depends on: epic 2
Issue 3B: lore: what Wayfarers do between errands (docs/lore/entries/fescue/wayfarers.md)

## Environment
Repo root is the current git worktree. Git Bash; if `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
Another worker edits games/gnomes-of-gnomomia/src/companions.ts at the same time; do not touch code. Do not commit.

## Goal
The Wayfarers lore entry says what the game now shows: between errands Wayfarers stand about, sit down at a shrine
or in a town square, and run on to the next town or shrine that suits how seasoned they are; they wear their own
gear, fitted to their trade (class) and experience.

## Read first
- docs/lore/entries/fescue/wayfarers.md (the entry to edit; keep its front matter keys).
- docs/lore/canon.md (tone and hard rules), docs/lore/entries/fescue/the-bounds.md (the Bound-Peace).
- games/gnomes-of-gnomomia/src/companionLife.ts: `LIFE_LINES` (the new bubble lines; quote one or two in
  "What gnomes say" only if they fit as overheard speech).

## Change
- docs/lore/entries/fescue/wayfarers.md:
  - front matter `sources`: add games/gnomes-of-gnomomia/src/companionLife.ts and
    games/gnomes-of-gnomomia/src/companionGear.ts.
  - Opening paragraph: add one sentence: between errands they rest at shrines and town squares, and run on to the
    next town that suits them.
  - "What gnomes say": add one line, e.g. a shrine-keeper or Reeve noticing Wayfarers sitting on the shrine steps
    "as if the grass owed them a nap". Use a speaker already in the lore (search: `npm run lore -- find shrine`,
    `npm run lore -- find Reeve`); if none fits, write it unattributed ("Gnomes in Thatchford say: ...").
  - "In the games": add bullets: Wayfarers quest in stints, then take a break: stand about (and wave at a gnome who
    comes close), sit on the ground at the nearest shrine or town square, or run to a town or shrine one zone away
    whose level suits them (src/companionLife.ts); their level follows their errand, or the zone when they have none,
    and town strollers are always of a level that suits the town; each wears class gear of its level, picked the same
    way on every player's screen (src/companionGear.ts).
  - "Loose threads": replace "Where Wayfarers come from, and where they go between errands." with "Where Wayfarers
    come from." (the between-errands part is now answered in the entry).
- Do not edit docs/lore/rulings.md (no new ruling; the entry is enough).

## Done when
- `npm run lore` passes from the repo root
- Only docs/lore/entries/fescue/wayfarers.md changed

## Out of scope
All code, docs/lore/rulings.md, docs/lore/INDEX.md unless `npm run lore` says the index must be regenerated (then run
the command it names).
~~~~

## Check of the plan

| Epic | Issue | Files changed | Check command | Ports / outputs |
|---|---|---|---|---|
| 1 | 1A | new src/companionLife.ts, new src/companionLife.test.ts | tsc --noEmit, vitest one file | none |
| 1 | 1B | new src/companionGear.ts, new src/companionGear.test.ts | tsc --noEmit, vitest one file | none |
| 1 | 1C | src/net/protocol.ts, new src/net/companionPose.test.ts | tsc --noEmit, vitest src/net | none |
| 2 | 2A | src/companions.ts | tsc --noEmit, npm test | none |
| 2 | 2B | src/net/mmo.ts | tsc --noEmit, npm test | none |
| 3 | 3A | src/companions.ts | tsc, test, build, smoke | 5291, dist/ (only issue that builds) |
| 3 | 3B | docs/lore/entries/fescue/wayfarers.md | npm run lore | none |

- No file is under two issues of one epic. 1C keeps the pose tail optional so companions.ts (unchanged in epic 1)
  still compiles; 2A and 2B both depend only on epic-1 files.
- companions.ts imports companionGear and companionLife; mmo.ts imports companionGear, companionLife and gear.ts; none
  of those import companions.ts or mmo.ts, so no import cycle is added.
- PR notes (planner): mobile unchanged (no new input); online: backward-compatible 14-field companion pose; no
  achievements (no player verb, Gnomomia has no tracker); no new prefabs (gear uses existing item prefabs via gear.ts);
  no new scenery, so no z-fight run.
