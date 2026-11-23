# GTA: street events and side-quest perks

Goal (two user requests):

1. "Make new random world events that just unfold in the world around you: police chases, robberies, non-violent
   scenes, random stuff." Built as a **street-event director** with a data-driven **catalog** of small semi-scripted
   events (`src/events/`). The six timed challenge events in `src/worldEvents.ts` stay as they are.
2. "Make side quests give little unlocks that are kind of useful but not hugely useful." Built as **perks**
   (`src/perks.ts`, applied by `src/perkEffects.ts`): every side quest and Fizz Cup race unlocks one.

Both are exposed to the later trainer by id:

- Events: `listWorldEvents()`, `triggerWorldEvent(id)`, `activeWorldEvents()`, `clearStreetEvents()` in
  `src/events/api.ts` (covers both the six challenge events and every street event).
- Perks: `listPerks()`, `grantPerk(id)`, `revokePerk(id)`, `clearPerkOverride(id)`, `perkActive(id)` in `src/perks.ts`.

Online: street events are local to each browser (like critters). Sharing them over `@lawn/mp` would mean a host
running every script and syncing its actors, which would double the size of this work; recorded in the PR.

Mobile: no new buttons. Every involvement is something the player already does with touch controls: come close,
drive or walk into, shoot, run over, steal or wreck a vehicle. The journal gains a perk line per quest (existing 44 px UI).

## How it works

- `events/types.ts`: `EventDef` (id, title, category, hint, weight, cooldown, duration, anchor 'road'|'walk', `when`
  filter, `start(kit, at)` returning an `EventScript` with `update(dt, kit)` -> 'running'|'done'|'failed'|'gone').
- `events/kit.ts`: per-event toolbox. `kit.gnome()` spawns a real pedestrian (`npcs.spawnNamed`, tagged `event:`), so
  it can be shot, run over and knocked; `walkTo/runTo/hold/face/flee`, `cracked()/down()/stopped()`. `kit.car()` puts
  a car with an NPC driver in the vehicle list; `driveTo` follows the road graph (`roadRoute`), `follow` chases, with
  an unstick reverse. `kit.prop()` places a `@lawn/prefabs` prefab. `say` (earshot only), `reward` (perk-scaled),
  `charge`, `heal`, `addHeat`, `spot()` (find a road/walk point in a ring), `offRoad()`. On end, gnomes rejoin the
  crowd and cars and props are removed once the player is 90 units away or after 25 s (only a car the player drove
  stays).
- Off the road: only events marked `roadScene: true` (watch-pursuit, traffic-stop, watch-checkpoint, carjacking,
  clay-wedding and the five traffic events) put gnomes and props on the lanes. Every other event's anchor is moved
  4 units clear of the road (`spots.ts offRoad`, distance to the road graph's segments), and the kit pushes each of
  its gnomes, walk targets and props onto the verge.
- `events/director.ts`: first event after 25 s, then one every 30-60 s, at most 2 at once, 55-120 units from the
  player; weighted pick among events whose cooldown is over and whose `when` passes; ends events the player left
  240 units behind or that outlived `duration`; callout (title + hint) when the player first comes within 45 units;
  map dots within 150 units (Datum Map perk: everywhere, labelled).
- Achievements: `gta-good-neighbour` (resolve 10 street events; Petal Bundle), `gta-have-a-go` (resolve 5
  crime/police events; Pot Lid), `gta-perks-of-the-job` (hold 6 perks; Odd-Job Rope). Every wear-slot prefab was
  already a reward, so these are hand-slot rewards.

## Perk table (side quest -> perk)

| Quest | Perk id | Name | Effect |
|---|---|---|---|
| sq-grid-truthers | datum-map | Datum Map | Street events show on the map from anywhere, labelled. |
| sq-snail-rigging | alley-clearance | Alley Clearance | In Turfton, heat under 3 hats cools 0.025/s faster. |
| sq-big-lou-embargo | velvet-rope | Velvet Rope Tab | Acorn-Cola, Dandelion Fizz, Acorn-Flour Cake 25% off. |
| sq-mulch-pyramid | mulch-rebate | Mulch Rebate | Pay 'n' Glaze 15% off. |
| sq-biscuit-hotdog | biscuit-nose | Biscuit's Nose | Map marks the nearest unfound Golden Acorn. |
| sq-castaway-drydock | castaway-float | Castaway's Float | Heal 1%/s while swimming. |
| sq-porcelain-blues | porcelain-charm | Porcelain-Glaze Charm | Glaze Clinic refunds half its bill. |
| sq-fescue-fugitive | bracken-blessing | Bracken's Blessing | On foot outside Turfton, heal 0.5%/s up to 60%. |
| sq-tessie | sonar-trinket | Sonar Trinket | Map marks the nearest unfound Stopping Shard. |
| sq-hose-revolt | rebel-pension | Brenda's Pension | +15 Acorns every 3 minutes of play. |
| sq-hoa-audit | audit-paperwork | Audit Paperwork | Heat below one hat fades 3x faster. |
| sq-porcelain-support | thick-glaze | Thick Glaze | 10% less damage. |
| race-rookie-mowdown | rookie-plate | Rookie Plate | Speed-trap payouts +25%. |
| race-lowrider-derby | carb-contacts | Carburettor Contacts | Taxi fares 20% off. |
| race-snail-endurance | shelldon-odds | Shelldon's Odds | World and street event rewards +10%. |
| race-fizz-cup-final | fizz-sponsor | Fizz Sponsor | Dandelion Fizz free. |

Active = quest 'done' in the quest save (already cloud-synced), unless revoked; trainer overrides and the
"announced" list are in localStorage `gta-perks-v1` (this browser only). Price perks wrap `economy.spend` by reason,
so shop labels still show the full price; the saving is toasted.

## Street event catalog

| File | Events |
|---|---|
| catalog/police.ts | watch-pursuit, traffic-stop, foot-chase, watch-checkpoint |
| catalog/crime.ts | shop-stickup, purse-snatch, carjacking, shell-game, gnome-napping |
| catalog/scenes.ts | street-busker, clay-wedding, lawn-picnic, lost-hat, yard-sale, mow-in-protest |
| catalog/traffic.ts | fender-bender, broken-down-mower, runaway-mower, snail-coach-jam, street-race-pass |
| catalog/wild.ts | loose-livestock, squirrel-heist, bee-swarm |

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner, written directly) | types, kit, director, spots, api, perks, perkEffects stub, catalog stubs, app.ts wiring, journal perk lines; `tsc` clean | 0 |
| 2 Content and effects | every catalog file filled, perkEffects real, achievements, lore entry, tests; `npm test -w games/gnome-theft-auto` and `tsc` pass | 9 |

Hot-file edits (Epic 1): `app.ts` (3 imports, director + perk effects creation after `worldEvents`, 2 update calls,
blips), `worldEvents.ts` (EVENT_TITLES, perk reward scale), `quests/journal.ts` (perk line).

## Epic 2 issues

The block between `---COMMON---` markers is pasted into every event-catalog issue (2.1-2.5).

~~~~text
---COMMON---
## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If `node` is not
found: export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto (three.js + TypeScript).
Other workers are editing OTHER files in this game at the same time. Edit only the file this issue owns. Do not
commit, push, stash or switch branches. Do not run vite build or a dev server.
`npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own (other workers mid-edit):
ignore those, fix only errors in your file.

Repo rules that apply:
- Lore: before writing names or dialogue run `npm run lore -- find <word>` (e.g. Watch, HOA, Turfton, Red Cap) and
  follow docs/lore/canon.md house style: gnome first names are plants (Fernwick, Tansy, Bramble), surnames are soil,
  tools and household things (Clayfoot, Stoutpot); at most one pun per name; gnomes are fired clay (they crack and
  chip, never bleed); no humans ever; no pop-culture references; dry humour. Acorns are money. The police are the
  "Hat Watch" (blue hats, yellow coats); the "HOA" are black hats, beige coats; the "Red Caps" are a gang.
- Props must be @lawn/prefabs ids (kit.prop(id, ...)); do not hand-build meshes.
- No new UI and no new buttons: involvement is only what the player already does (come close, drive into, shoot,
  run over, steal or wreck a vehicle).

## The street-event API (already exists; do not edit these files)
games/gnome-theft-auto/src/events/types.ts defines (excerpt, verbatim names):

  export type EventCategory = 'police' | 'crime' | 'scene' | 'traffic' | 'wild';
  export interface SpawnContext { px; pz; biome: BiomeId /* 'city'|'desert'|'forest'|'tundra'|'farmland'|'loch'|'parkland' */;
    district: DistrictId | null /* Turfton district or null outside the city */; night: number /* 0 noon..1 night */;
    heat: number /* 0..4 */; inVehicle: boolean; onQuest: boolean }
  export interface EventAnchor { x: number; z: number; yaw: number }
  export interface EventDef {
    id: string;           // unique kebab-case
    title: string;        // callout + map label
    category: EventCategory;
    hint: string;         // one line under the callout: what the player can do
    weight: number;       // pick weight, 1 = normal
    cooldown: number;     // seconds before it can be picked again (use 150-400)
    duration: number;     // seconds max; the director ends it ('gone') after that
    anchor: 'road' | 'walk';   // road node (cars) or sidewalk walk point (people on foot)
    when?(c: SpawnContext): boolean;
    start(kit: EventKit, at: EventAnchor): EventScript;
  }
  export type EventStatus = 'running' | 'done' | 'failed' | 'gone';
    // done = the player got involved and it resolved well (counts for achievements); failed = it resolved
    // badly or without them; gone = it simply ran its course.
  export interface EventScript { update(dt: number, kit: EventKit): EventStatus; blip?(): { x: number; z: number } | null; }
  export interface GnomeOpts { x; z; look?: Partial<GnomeLook> /* hat, shirt, pants: hex colours; beard: hex|null; dress, glasses: boolean */; name?: string }
  export interface Actor {   // a real pedestrian: can be shot apart, run over, knocked into a ragdoll
    readonly npc: Npc; readonly name: string; x(): number; z(): number;
    walkTo(x, z): void;  runTo(x, z): void /* runs with hands up */;  hold(x?, z?): void;  face(x, z): void;
    flee(fromX, fromZ): void;  arrived(r = 1.5): boolean;
    cracked(): boolean /* shot apart, gone */;  down(): boolean /* ragdoll now */;  stopped(): boolean /* was knocked or cracked at any time */;
    remove(): void;
  }
  export interface CarOpts { kind: VehicleKind; x; z; yaw; tint?: number; driver?: Partial<GnomeLook> | null /* null = empty car */ }
  export interface Car {
    readonly v: Vehicle /* v.x, v.z, v.yaw, v.speed, v.driver: 'none'|'player'|'npc'|'police' */;
    driveTo(x, z, throttle = 0.7): void /* along the roads, stops on arrival */;
    follow(target: {x,z} | (() => {x,z}), throttle = 0.9): void /* chase straight at it every frame */;
    stop(): void;  arrived(r = 8): boolean;  stolen(): boolean;  wrecked(): boolean;
    lost(): boolean /* no NPC at the wheel any more */;  eject(): Actor | null /* driver climbs out as an Actor */;
  }
  export interface EventKit {
    readonly t: number /* seconds since start */; readonly player: Player; readonly world: World; readonly fx: Fx;
    rand(): number; pick<T>(list: readonly T[]): T; ground(x, z): number;
    dist(x, z): number /* from the player (or their vehicle) */; near(x, z, r): boolean; px(): number; pz(): number; inVehicle(): boolean;
    spot(kind: 'road'|'walk', min, max, fromX?, fromZ?): EventAnchor | null /* a place min..max from (fromX,fromZ), default the anchor */;
    gnome(o: GnomeOpts): Actor;  car(o: CarOpts): Car;
    prop(id: string, x, z, yaw = 0, scale = 1): THREE.Object3D /* @lawn/prefabs prefab on the ground; move it yourself, y = kit.ground(x,z) */;
    dropProp(o): void;
    say(text, x?, z?, ms = 4500): void /* toast only if the player is within 60 units of (x,z), default the anchor */;
    tell(text, ms?): void /* toast always */;  sfx(s: Sfx): void;
    addHeat(amount): void;  heat(): number;
    reward(acorns, reason): void /* pays (perk-scaled) and toasts "+N Acorns" */;
    charge(acorns, reason): boolean /* false if they cannot afford it */;
    heal(amount 0..1): void;
  }
Sfx values: 'squirt' | 'crack' | 'steal' | 'door' | 'alarm' | 'whistle' | 'washed' | 'bump' | 'gunshot' | 'boom' |
'boost' | 'stunt' | 'splash' | 'smash' | 'drink' | 'gnome-hit'.
Fx (kit.fx): crack(x,y,z,color?), fire(x,y,z,spread?) (call every frame for smoke), explode(x,y,z), flash(x,y,z),
spark(x,y,z), confetti(x,y,z), dandelionCloud(x,y,z).
VehicleKind values you may use: 'push-bike' | 'ride-on' | 'zero-turn' | 'combine' | 'lowrider' | 'snail-coach' |
'mulch-spreader' | 'hoa-van' | 'boot-float' | 'pot-rod' | 'lawn-roller' | 'teacup-trundler' | 'barrow-buggy'.
Looks: import { WATCH } from '../../config' -> Hat Watch { hat: WATCH.hat, shirt: WATCH.coat }, HOA { hat: WATCH.hoaHat,
shirt: WATCH.hoaCoat }. Red Caps: { hat: 0xd8342c, shirt: 0x2b2e34 }.
Prefab ids known to exist (props): crate, barrel, bench, table, chair, stool, rug, sack, overflowing-acorn-sack,
acorn-flour-sack, gsr-boombox, gsr-upright-bass, gsr-bongo-stack, gsr-cafe-table, gsr-smoothie-kiosk, party-hat,
beach-ball, barricade, notice-board, wooden-wall-sign, deck-chair, fuel-can, scrap-heap, gta-dew-barrel, pointy-hat,
haystack, cow, sheep, pig, hen, squirrel, bee, bee-hive, beekeeper-hat, flower-wreath, seed-cake, bread-loaf,
display-case, gta-can-cola, gta-can-fizz, golf-ball, lamp, plant. (Check others with
`grep -rn "id: '<id>'" packages/prefabs/src/catalog/`.)

Rules for scripts:
- Keep all state in the closure returned by start(); no module-level mutable state.
- The director ends the event at `duration`; you may return 'gone' earlier.
- Return 'done' only when the player got involved and it went well (reward them with kit.reward, 30-150 Acorns);
  'failed' when it resolved without them or they lost. Never return 'done' with no player action.
- Use kit.say for dialogue (it only shows within earshot). Lines are short: `Name: "line"`.
- Spawn everything within ~25 units of `at`. Use kit.spot('walk'|'road', min, max) for places to run or drive to; it
  can return null: fall back to a point like `{ x: at.x + 40, z: at.z }`.
- Animals and props are moved by your script (set position x/z and y = kit.ground(x, z)); gnomes and cars by the kit.

## Worked example (shape to copy; do not paste it into your file unless the issue lists it)
  import type { EventDef } from '../types';
  const PURSE_SNATCH: EventDef = {
    id: 'purse-snatch', title: 'Acorn-Purse Snatch', category: 'crime',
    hint: 'Knock the snatcher down before he gets away', weight: 1, cooldown: 200, duration: 70, anchor: 'walk',
    when: (c) => c.biome === 'city' || c.biome === 'parkland',
    start(kit, at) {
      const victim = kit.gnome({ x: at.x, z: at.z, name: 'Old Tansy Ladle', look: { beard: null, dress: true } });
      const thief = kit.gnome({ x: at.x + 2, z: at.z + 1, name: 'Nettle Grubb', look: { hat: 0x2b2e34, shirt: 0x2b2e34 } });
      const away = kit.spot('walk', 50, 90) ?? { x: at.x + 60, z: at.z, yaw: 0 };
      let phase: 'grab' | 'run' = 'grab';
      return {
        update(_dt, k) {
          if (phase === 'grab') {
            if (k.t < 2) return 'running';
            phase = 'run';
            thief.runTo(away.x, away.z);
            victim.face(thief.x(), thief.z());
            k.say(`${victim.name}: "My acorn purse! Stop that gnome!"`);
            return 'running';
          }
          if (thief.stopped()) {
            k.reward(60, 'Purse returned');
            k.say(`${victim.name}: "Bless your glaze!"`, victim.x(), victim.z());
            return 'done';
          }
          if (thief.arrived(3)) { k.say('The snatcher got away.', thief.x(), thief.z()); return 'failed'; }
          return 'running';
        },
        blip: () => (phase === 'run' ? { x: thief.x(), z: thief.z() } : null),
      };
    },
  };
---COMMON---
~~~~

### 2.1 Police events

~~~~text
Epic: 2 Content and effects
Depends on: none
[COMMON block]

## Goal
games/gnome-theft-auto/src/events/catalog/police.ts exports four Hat Watch street events.

## Read first
- games/gnome-theft-auto/src/events/types.ts (the API above)
- games/gnome-theft-auto/src/events/kit.ts (how actors and cars behave)

## Change
- games/gnome-theft-auto/src/events/catalog/police.ts: replace `export const POLICE_EVENTS: readonly EventDef[] = [];`
  with these four events, all category 'police':
  1. 'watch-pursuit' "Hat Watch Pursuit" (anchor road, when city/parkland/farmland/desert, cooldown 240, duration 90):
     a red getaway lowrider (Red Cap driver) drives to kit.spot('road', 150, 260) at throttle 0.85; two Watch
     ride-ons (tint WATCH.hat, Watch driver) spawn 12-18 units behind it and `follow` it. Siren feel: kit.sfx('alarm')
     once at start if near. Player options: wreck it or stop it (getaway.lost()) -> the robber is ejected/falls out;
     reward 120 "Watch reward" and return 'done'. Steal it yourself (getaway.stolen()) -> kit.addHeat(1.5), reward 90
     "Loot in the boot", 'done'. Getaway arrives -> 'failed' with a say line. Blip on the getaway.
  2. 'traffic-stop' "Traffic Stop" (road, city/parkland, cooldown 200, duration 80): a stopped ride-on (driver
     ejected at t=0.5 and holding beside it) and a Watch ride-on parked 6 units behind; a Watch officer on foot
     (Officer Yarrow Ladle) holds between them facing the driver and they trade 3-4 lines (every ~6 s, within
     earshot) about grass height and hat angles. If the player drives past within 10 units faster than v.speed 18:
     officer says a line and kit.addHeat(0.5) once. If the player cracks or knocks the officer -> addHeat(1), 'failed'.
     After 45 s the officer lets the driver go (driver walks to the car; nothing more) -> 'gone'.
  3. 'foot-chase' "Foot Chase" (walk, city, cooldown 180, duration 70): a thief (dark hat/shirt) runs to a far walk
     spot; a Watch officer runs after (re-issue runTo to the thief's position every 1 s). Player knocks or cracks the
     thief -> reward 70 "Collar assist", 'done'. Officer catches up (within 1.5) -> officer says "Got you", thief holds,
     'failed'. Thief arrives -> 'failed'.
  4. 'watch-checkpoint' "Watch Checkpoint" (road, city, cooldown 300, duration 120): two `barricade` props across the
     road (perpendicular to at.yaw, 4 units either side), two Watch officers holding beside them. If the player passes
     within 8 units while kit.heat() >= 1 -> they shout a line and kit.addHeat(1) once. With heat 0 and
     driving through slowly (speed < 8) -> a friendly line and reward 20 "Paperwork in order", 'done'. Smashing
     through fast with heat 0 -> addHeat(0.5), 'failed'.
  Export: `export const POLICE_EVENTS: readonly EventDef[] = [WATCH_PURSUIT, TRAFFIC_STOP, FOOT_CHASE, WATCH_CHECKPOINT];`

## Contract
Keep the export name and type `POLICE_EVENTS: readonly EventDef[]` (catalog/index.ts imports it). Ids exactly as above.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in events/catalog/police.ts
- each event's update returns 'done' only after a player action

## Out of scope
Every other file, especially events/types.ts, kit.ts, director.ts and the other catalog files.
~~~~

### 2.2 Crime events

~~~~text
Epic: 2 Content and effects
Depends on: none
[COMMON block]

## Goal
games/gnome-theft-auto/src/events/catalog/crime.ts exports five crime street events.

## Read first
- games/gnome-theft-auto/src/events/types.ts, games/gnome-theft-auto/src/events/kit.ts

## Change
- games/gnome-theft-auto/src/events/catalog/crime.ts: replace `export const CRIME_EVENTS: readonly EventDef[] = [];` with
  five events, all category 'crime':
  1. 'shop-stickup' "Stick-Up" (walk, city, cooldown 260, duration 80): a clerk (holds at the anchor) and a Red Cap
     robber holding 2 units in front of him facing him, with a `sack` prop at his feet. A getaway lowrider (tint
     0xd8342c) WITH a Red Cap driver is created at start at kit.spot('road', 25, 45) (fallback at.x+30) and is simply
     not told to drive yet (it stays parked). At t=4: kit.dropProp(sack), robber.runTo(car.v.x, car.v.z), clerk says a
     line. When robber.arrived(3): robber.remove() and car.driveTo(far, 0.85) where far = kit.spot('road', 150, 250,
     car.v.x, car.v.z) (fallback car.v.x+200). Player cracks/knocks the robber (robber.stopped()) before he reaches
     the car, or the car is lost() after that -> reward 100 "Stopped the stick-up", 'done'. car.arrived() -> 'failed'.
  2. 'purse-snatch' exactly as the worked example above.
  3. 'carjacking' "Carjacking" (road, city/parkland, cooldown 240, duration 75): a ride-on whose driver is a Red Cap
     thief (the car is created with driver Red Cap look), and its owner, a separate gnome on foot 3 units beside it.
     At t=1.5 the car drives to kit.spot('road', 120, 200) at 0.8 and the owner shouts and runs after it (owner.runTo
     the car's position every 1 s). Player wrecks or steals the car (car.lost()) -> owner says thanks, reward 90
     "Ride returned", 'done' (if stolen the player keeps the ride). car.arrived() -> 'failed'.
  4. 'shell-game' "Shell Game" (walk, city, cooldown 300, duration 120): hustler Clover Thimblerig at a `table`
     prop with two onlookers holding nearby, facing the table. When the player stands (on foot, not in a vehicle)
     within 3 units for 2 s: kit.charge(10, 'Shell game'); if it succeeds, 1 in 3 wins reward 30 "Shell game win"
     -> 'done', otherwise a say line ("Bad luck, friend.") and the player may try again after 4 s (max 3 tries,
     then the hustler packs up -> 'gone'). If the player cracks or knocks the hustler: onlookers flee, 'failed'.
  5. 'gnome-napping' "Gnome-Napping" (road, city/parkland, cooldown 360, duration 90): an hoa-van (tint 0x18181e)
     with an HOA driver, parked (not told to drive). A victim gnome runs (runTo) from the van to kit.spot('walk', 25,
     40) while a crook on foot (HOA look) re-issues walkTo(victim.x(), victim.z()) every 1 s. From t=12, when the crook
     is within 2 of the victim: victim.remove(), crook.remove(), and the van drives to kit.spot('road', 150, 250) at 0.8. Player knocks/cracks the crook
     before that -> victim thanks, reward 110 "Gnome rescued", 'done'. Player wrecks or steals the van after the grab
     -> reward 110 too, 'done'. Van arrives -> 'failed'.
  Export: `export const CRIME_EVENTS: readonly EventDef[] = [SHOP_STICKUP, PURSE_SNATCH, CARJACKING, SHELL_GAME, GNOME_NAPPING];`

## Contract
Keep the export name and type `CRIME_EVENTS: readonly EventDef[]`. Ids exactly as above.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in events/catalog/crime.ts
- 'done' is returned only after a player action

## Out of scope
Every other file.
~~~~

### 2.3 Non-violent scenes

~~~~text
Epic: 2 Content and effects
Depends on: none
[COMMON block]

## Goal
games/gnome-theft-auto/src/events/catalog/scenes.ts exports six peaceful street scenes.

## Read first
- games/gnome-theft-auto/src/events/types.ts, games/gnome-theft-auto/src/events/kit.ts

## Change
- games/gnome-theft-auto/src/events/catalog/scenes.ts: replace `export const SCENE_EVENTS: readonly EventDef[] = [];`
  with six events, all category 'scene'. If the player cracks or knocks any scene gnome, the others flee
  (actor.flee(kit.px(), kit.pz())) and the scene returns 'failed'.
  1. 'street-busker' "Street Busker" (walk, city/parkland, cooldown 200, duration 120): busker Fennel Washboard holds
     next to a `gsr-upright-bass` prop; 3 listeners walk in and hold in a half circle 3-4 units away facing him. Every
     8 s while the player is within 20, kit.say a short song line. Player stands on foot within 4 units for 3 s ->
     kit.charge(5, 'Busker tip'); if paid, listeners cheer line, kit.heal(0.1), reward 0, return 'done' (no reward
     needed: done counts for the achievement). Use kit.fx.confetti once.
  2. 'clay-wedding' "Clay Wedding" (road, city/parkland/farmland, cooldown 300, duration 110): a `boot-float` car
     (tint 0xffffff, default random driver) drives slowly (throttle 0.35) to a road spot 120-200
     away; 4 guests spawn behind and walkTo a point 6 units behind the float every 1.5 s. Every 2 s kit.fx.confetti at
     the float (only when the player is within 60). Player stays within 25 units of the float for 20 s total -> the
     couple Juniper Kettle and Rue Ladle throw the player a gift: reward 40 "Wedding favour", 'done'. Player wrecks or
     steals the float -> guests flee, kit.addHeat(0.5), 'failed'. Float arrives -> 'gone'.
  3. 'lawn-picnic' "Lawn Picnic" (walk, parkland/farmland/city, cooldown 240, duration 120): a `rug` prop with
     `seed-cake` and `bread-loaf` props on it and 3 gnomes holding around it facing its centre. Player on foot within
     4 units for 2 s -> a line ("Pull up a toadstool!"), kit.heal(0.25), kit.sfx('drink'), 'done' (once).
  4. 'lost-hat' "Lost Hat" (walk, any biome, cooldown 260, duration 120): Parsley Gumboot (default look) stands at the anchor; a `pointy-hat` prop lies at kit.spot('walk', 25, 45) (fallback at.x+30).
     The hat prop spins slowly (rotation.y += dt). Player touches the hat (within 2.5, on foot or in a vehicle) ->
     dropProp it, then the player must come back within 4 of Parsley -> reward 50 "Hat returned", 'done'. Blip on the
     hat until picked up, then on Parsley.
  5. 'yard-sale' "Yard Sale" (walk, city/parkland/farmland, cooldown 300, duration 140): Aunt Hyssop Crockery holds
     behind a `table` with `crate`, `lamp` and `plant` props. Player on foot within 3 units for 2 s ->
     kit.charge(20, 'Yard sale'); if paid, a mystery: rand < 0.5 -> reward 40 "Yard sale find"; else a say line
     ("A slightly used glaze brush. Treasure it.") -> 'done' either way. Can't afford -> a say line, keep running.
  6. 'mow-in-protest' "Mow-In Protest" (walk, city, cooldown 320, duration 120): leader Sedge Trugg and 4 marchers of
     the Long Grass League walk a loop of 4 points (a 16-unit square around the anchor), each one 2 units behind the
     previous, carrying no props; every 7 s within earshot a chant line ("Longer grass! Fewer blades!", "What do we
     want? Seed heads!"). An HOA inspector (HOA look) holds at the anchor facing them. Player walks with them (on
     foot within 6 of the leader) for 15 s total -> reward 25 "Marched with the League", 'done'.
  Export: `export const SCENE_EVENTS: readonly EventDef[] = [STREET_BUSKER, CLAY_WEDDING, LAWN_PICNIC, LOST_HAT, YARD_SALE, MOW_IN_PROTEST];`

## Contract
Keep the export name and type `SCENE_EVENTS: readonly EventDef[]`. Ids exactly as above.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in events/catalog/scenes.ts

## Out of scope
Every other file.
~~~~

### 2.4 Traffic events

~~~~text
Epic: 2 Content and effects
Depends on: none
[COMMON block]

## Goal
games/gnome-theft-auto/src/events/catalog/traffic.ts exports five road incidents.

## Read first
- games/gnome-theft-auto/src/events/types.ts, games/gnome-theft-auto/src/events/kit.ts

## Change
- games/gnome-theft-auto/src/events/catalog/traffic.ts: replace `export const TRAFFIC_EVENTS: readonly EventDef[] = [];`
  with five events, all category 'traffic', anchor 'road':
  1. 'fender-bender' "Fender Bender" (city/parkland/farmland, cooldown 200, duration 90): two ride-ons nose to nose
     at the anchor (yaw at.yaw and at.yaw + PI + 0.4, 3 units apart), both drivers ejected at t=0.3 and holding
     between them facing each other, trading blame lines every 5 s within earshot. kit.fx.fire(x, ground+0.8, z, 0.3)
     on the first car every 0.25 s for the first 30 s (only if the player is within 80). At t=45 both drivers walkTo
     kit.spot('walk', 20, 40) (fallback anchor + 30) and the event returns 'gone' at t=50. Player steals either car -> its driver yells, addHeat(0.5), 'failed'.
  2. 'broken-down-mower' "Broken-Down Mower" (any biome except loch, cooldown 220, duration 100): a ride-on with its
     driver Chicory Sprocket ejected and holding beside it, waving lines; fire smoke on the engine every 0.3 s. If the
     player parks a vehicle within 8 units with |player vehicle speed| < 1 for 3 s -> "jump-start": stop the smoke,
     reward 40 "Jump-start", 'done'. Then nothing more (it lingers).
  3. 'runaway-mower' "Runaway Mower" (city/parkland/farmland, cooldown 260, duration 70): an EMPTY zero-turn
     (kit.car with driver: null) rolls along by itself: the kit only steers NPC-driven cars, so drive it yourself each
     frame while car.v.driver === 'none' && !car.v.exploded:
       import { stepVehicle, syncVehicleMesh } from '../../vehicles';
       stepVehicle(car.v, { throttle: 0.45, steer: Math.sin(k.t * 0.8) * 0.35, lift: 0 }, dt, k.world);
       syncVehicleMesh(car.v, dt); Owner Basil Tiller runs after it (runTo its position
     every 1 s). Player steals it (car.stolen()) -> owner reward 70 "Caught the runaway", 'done'.
  4. 'snail-coach-jam' "Snail Coach Jam" (city/parkland, cooldown 300, duration 100): a `snail-coach` drives at
     throttle 0.2 to a road spot 120-180 away; three ride-ons spawn 8, 14, 20 units behind and `follow` the car ahead
     of each at throttle 0.25; every 6 s a honk line from a random driver within earshot. Player overtakes (comes
     within 6 units of the coach while driving, after having been behind it) -> a say line, reward 15 "Overtook the
     snail", 'done'. Coach arrives -> 'gone'.
  5. 'street-race-pass' "Street Race" (city/desert, cooldown 280, duration 60): two lowriders (red 0xef4444 and blue
     0x3b82f6) side by side drive at throttle 1 to a road spot 200-300 away. Player drives within 20 units of either
     for 12 s total -> reward 60 "Kept up with the racers", 'done'. A Watch ride-on spawns 25 units behind at t=6 and
     follows the red one. Both arrive -> 'gone'.
  Export: `export const TRAFFIC_EVENTS: readonly EventDef[] = [FENDER_BENDER, BROKEN_DOWN_MOWER, RUNAWAY_MOWER, SNAIL_COACH_JAM, STREET_RACE_PASS];`

## Contract
Keep the export name and type `TRAFFIC_EVENTS: readonly EventDef[]`. Ids exactly as above.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in events/catalog/traffic.ts

## Out of scope
Every other file.
~~~~

### 2.5 Wild events

~~~~text
Epic: 2 Content and effects
Depends on: none
[COMMON block]

## Goal
games/gnome-theft-auto/src/events/catalog/wild.ts exports three creature events.

## Read first
- games/gnome-theft-auto/src/events/types.ts, games/gnome-theft-auto/src/events/kit.ts

## Change
- games/gnome-theft-auto/src/events/catalog/wild.ts: replace `export const WILD_EVENTS: readonly EventDef[] = [];`
  with three events, all category 'wild'. Animals are props you move yourself: keep { o: Object3D, x, z, yaw } per
  animal, move it (speed 2-3 units/s), set o.position.set(x, kit.ground(x, z), z) and o.rotation.y = yaw.
  1. 'loose-livestock' "Loose Livestock" (road, farmland/parkland/city, cooldown 260, duration 120): 4 animals
     (kit.pick(['sheep','pig','cow','hen']) each) wander on and around the road within 15 units of the anchor (each
     picks a new random target in that radius every 3-5 s). Farmer Bramble (lore: run `npm run lore -- find bramble`
     and use his name as written there) walks among them with lines. "Shoo" an animal: the player (on foot or driving)
     comes within 4 units of it -> it runs away from the player at 6 units/s for 2 s and then is counted as shooed
     (remove it with kit.dropProp). All 4 shooed -> reward 60 "Herded the flock", 'done'.
  2. 'squirrel-heist' "Squirrel Heist" (walk, any biome except tundra, cooldown 240, duration 60): a `squirrel` prop
     runs off with an `acorn-flour-sack` prop (place the sack on top: sack.position.y offset 0.6, update each frame)
     from a gnome holding at the anchor; the squirrel runs to kit.spot('walk', 40, 70) at 4.5 units/s in a zigzag
     (yaw wobble). The player catching it (within 2.5) -> squirrel drops the sack and bolts (remove both), reward 50
     "Sack recovered", 'done'. Squirrel arrives -> 'failed'. Blip follows the squirrel. Every pest wants something:
     the squirrel is hungry, not evil; one line says so.
  3. 'bee-swarm' "Bee Swarm" (walk, farmland/parkland/forest, cooldown 300, duration 80): beekeeper Linden Skep
     (look with a pale shirt) holds next to a `bee-hive` prop; 8 `bee` props circle a centre that drifts 2 units/s
     toward a walk spot 30-50 away (each bee orbits at radius 1.5-3, its own speed). Player within 3 units of the
     swarm centre -> kit.sfx('gnome-hit') and the player is stung: throttle it to once per 1.5 s with
     kit.player.hurt(0.03). Player walks the swarm back: if the swarm centre comes within 4 units of the hive (the
     player can "lead" it: while the player is within 8 units of the centre, the centre drifts toward the player
     instead) -> beekeeper reward 45 "Swarm rehived", 'done'. Otherwise duration ends -> 'gone'.
  Export: `export const WILD_EVENTS: readonly EventDef[] = [LOOSE_LIVESTOCK, SQUIRREL_HEIST, BEE_SWARM];`

## Contract
Keep the export name and type `WILD_EVENTS: readonly EventDef[]`. Ids exactly as above.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in events/catalog/wild.ts

## Out of scope
Every other file.
~~~~

### 2.6 Perk effects

~~~~text
Epic: 2 Content and effects
Depends on: none

## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Game games/gnome-theft-auto. Other workers edit other files in this game
at the same time: edit only the files below. Do not commit, push, stash or switch branches; no vite build, no dev server.
tsc may show errors in other files (mid-edit): fix only yours.

## Goal
src/perkEffects.ts applies every side-quest perk from src/perks.ts in the running game (it is a stub now; app.ts
already calls createPerkEffects(...), .update(dt) each frame and spreads .blips() into the map).

## Read first
- games/gnome-theft-auto/src/perks.ts: PERKS, PerkId, perkActive(id), activePerks(), priceScaleFor(reason, active),
  takeNewPerks(), PRICE_PERKS
- games/gnome-theft-auto/src/perkEffects.ts: the stub and its exported types (keep them)
- games/gnome-theft-auto/src/easterEggs.ts: GOLDEN_ACORN_SPOTS, STOPPING_SHARD_SPOTS (id, x, z), loadCollected()
  -> { acorns: string[]; shards: string[]; signs: string[] }
- games/gnome-theft-auto/src/economy.ts: Economy { earn(amount, reason?), spend(amount, reason?): boolean,
  chargeHospital(): { fee, receipt } }
- games/gnome-theft-auto/src/districts.ts: districtAt(x, z) (null outside Turfton)

## Change
- games/gnome-theft-auto/src/perkEffects.ts: implement createPerkEffects(deps). Keep the exported interfaces
  PerkEffectDeps { economy, watch, player, hud, play?, unlock? } and PerkEffects { update(dt), blips(): Blip[] }.
  At creation (once), wrap these methods ON THE PASSED OBJECTS (other modules call them through the same objects):
  - deps.economy.spend = (amount, reason) => { const s = priceScaleFor(reason, activePerks()); if (s >= 1) return orig(amount, reason);
      const cost = Math.round(amount * s); const ok = orig(cost, reason); if (ok && amount - cost > 0) hud.toast(`${perk name}: saved ${amount - cost} Acorns`, 2500); return ok; }
    (find the perk name from PRICE_PERKS + PERKS for the toast; if the cost is 0, orig(0) returns true).
  - deps.economy.earn = (amount, reason) => orig(reason === 'Speed Trap Daredevil' && perkActive('rookie-plate') ? Math.round(amount * 1.25) : amount, reason)
  - deps.economy.chargeHospital = () => { const r = orig(); if (perkActive('porcelain-charm') && r.fee > 0) {
      const back = Math.floor(r.fee / 2); deps.economy.earn(back, 'Porcelain-Glaze Charm'); r.receipt += ` PORCELAIN CHARM: ${back} Acorns refunded.`; } return r; }
    (call the ORIGINAL earn for the refund, not the wrapped one).
  - deps.player.hurt = (amount) => orig(perkActive('thick-glaze') ? amount * 0.9 : amount)
  Bind originals with .bind(obj) before replacing.
  update(dt):
  - every 2 s: for each p of takeNewPerks(): hud.banner('PERK UNLOCKED', 2500) and hud.toast(`${p.name}: ${p.text}`, 7000),
    play?.('stunt'); then if activePerks().size >= 6 call deps.unlock?.('gta-perks-of-the-job') (once per session).
    Do the first check only after 6 s of play (let the game load).
  - alley-clearance: if watch.heat > 0 && watch.heat < 3 && districtAt(px, pz) !== null -> watch.heat = Math.max(0, watch.heat - 0.025 * dt)
  - audit-paperwork: if watch.heat > 0 && watch.heat < 1 -> watch.heat = Math.max(0, watch.heat - 0.16 * dt)
    (px/pz = player.vehicle ? player.vehicle.x/z : player.x/z)
  - castaway-float: if player.swimming && player.health > 0 -> health = Math.min(1, health + 0.01 * dt)
  - bracken-blessing: if !player.vehicle && !player.swimming && districtAt(px, pz) === null && health > 0 && health < 0.6
    -> health = Math.min(0.6, health + 0.005 * dt)
  - rebel-pension: accumulate dt while active; every 180 s economy.earn(15, "Brenda's Pension") (original earn) and
    hud.toast("Brenda's Pension: +15 Acorns", 3000).
  blips(): (recompute the target at most every 2 s; cache it)
  - biscuit-nose: the nearest GOLDEN_ACORN_SPOTS entry whose id is not in loadCollected().acorns ->
    { x, z, color: '#f7c927', quest: "Biscuit's Nose" }
  - sonar-trinket: the nearest STOPPING_SHARD_SPOTS entry not in loadCollected().shards ->
    { x, z, color: '#38e89e', quest: 'Sonar Trinket' }
  All perk checks use perkActive(id) (cached, cheap). No DOM.
- games/gnome-theft-auto/src/perkEffects.test.ts (new): vitest. Build fake deps (economy object with earn/spend/
  chargeHospital spies, watch { heat }, player { x, z, vehicle: null, health, swimming, hurt }, hud { toast, banner })
  and use setPerkStorage(fake storage) from perks.ts with a quest save in key 'gta-quests-v1' marking quests done
  (e.g. { "sq-big-lou-embargo": { "state": "done", "step": 0, "cracked": [] } }). Test: velvet-rope makes
  spend(8, 'Acorn-Cola') charge 6; no perk -> 8; porcelain-charm refunds half the hospital fee; thick-glaze passes
  0.09 for hurt(0.1); audit-paperwork lowers heat 0.5 after update(1). Call setPerkStorage(null) in afterEach.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in perkEffects.ts / perkEffects.test.ts
- `npm test -w games/gnome-theft-auto -- src/perkEffects.test.ts` passes

## Out of scope
perks.ts (do not edit), app.ts, economy.ts, player.ts, police.ts, every other file.
~~~~

### 2.7 Achievements

~~~~text
Epic: 2 Content and effects
Depends on: none

## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files at the same time. Do not commit, push,
stash or switch branches.

## Goal
Three Gnome Theft Auto achievements exist for street events and perks, each with a cosmetic reward.

## Read first
- packages/achievements/src/catalog.ts: the existing `game: 'gnome-theft-auto'` entries (copy their shape exactly:
  id, game, gameTitle, title, description, target?, reward { slot, prefabId, label })
- packages/achievements/README.md: the reward rules
- packages/prefabs/src/catalog/*.ts: find prefab ids and their `uses` ('wear-head', 'wear-neck', 'wear-back', 'hold' ...)

## Change
- packages/achievements/src/catalog.ts: append after the last gnome-theft-auto entry:
  1. id 'gta-good-neighbour', title 'Good Neighbour', description 'Get involved in 10 street events and see them
     through.', target 10, reward: a neck-slot prefab that exists and is not already used as a reward by another
     achievement (check with grep), e.g. 'felt-scarf' or 'wool-scarf' if free; label its name.
  2. id 'gta-have-a-go', title 'Have-a-Go Gnome', description 'Stop 5 crimes or help the Hat Watch 5 times on the
     street.', target 5, reward: a head-slot prefab not already used as a reward (e.g. 'megaphone-cap' or
     'lamplighter-cap' if free).
  3. id 'gta-perks-of-the-job', title 'Perks of the Job', description 'Earn 6 side-quest perks.', reward: a
     back- or hand-slot prefab not already used as a reward.
  The reward's slot must match a `uses` entry of that prefab (head <-> 'wear-head', neck <-> 'wear-neck', back <->
  'wear-back', hand <-> whatever the existing hand rewards' prefabs use). If no free fitting prefab exists, reuse one
  already used (rewards may repeat) rather than inventing an id.

## Contract
Ids exactly 'gta-good-neighbour', 'gta-have-a-go', 'gta-perks-of-the-job' (the game calls
achievements.increment('gta-good-neighbour'), increment('gta-have-a-go'), unlock('gta-perks-of-the-job')).

## Done when
- `npm test -w packages/achievements` passes

## Out of scope
Everything outside packages/achievements/src/catalog.ts (do not add prefabs).
~~~~

### 2.8 Lore

~~~~text
Epic: 2 Content and effects
Depends on: none

## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files at the same time. Do not commit, push,
stash or switch branches.

## Goal
The lore base records Turfton's street life (the new street events and their named regulars) and the side-quest perks.

## Read first
- docs/lore/README.md (entry schema), docs/lore/canon.md (house style)
- docs/lore/entries/apocrypha/gnomas-food-truck.md (an example GTA entry)
- `npm run lore -- find bramble`, `npm run lore -- find watch`, `npm run lore -- find clara`, `npm run lore -- find brenda`

## Change
- docs/lore/entries/apocrypha/turfton-street-life.md (new): id turfton-street-life, kind concept, tier apocrypha,
  setting apocrypha, era now, status draft, games [gnome-theft-auto], sources [games/gnome-theft-auto/src/events/catalog/],
  related: existing ids you confirmed with `lore find` (e.g. hat-watch if it exists, farmer-bramble, big-lou-gta).
  Body: what happens on Turfton's streets between jobs: Hat Watch pursuits, traffic stops, foot chases and
  checkpoints; stick-ups, purse snatches, carjackings, Clover Thimblerig's shell game, HOA gnome-nappings; buskers
  (Fennel Washboard), clay weddings (Juniper Kettle and Rue Ladle), picnics, lost hats (Parsley Gumboot), yard sales
  (Aunt Hyssop Crockery), the Long Grass League's mow-in protests (leader Sedge Trugg); fender benders, broken-down
  mowers (Chicory Sprocket), runaway mowers (Basil Tiller), snail-coach jams and street races; loose livestock with
  Farmer Bramble, squirrel heists (the squirrels are hungry, not wicked), bee swarms (beekeeper Linden Skep). Watch
  officer Yarrow Ladle and thief Nettle Grubb. A "Loose threads" section (e.g. who keeps letting the livestock out).
- docs/lore/entries/apocrypha/side-quest-perks.md (new): kind concept, same frontmatter style: the small favours
  Turfton's strangers do for the player after their jobs, one line each: Datum Map (Mossley's survey), Alley
  Clearance (Shelldon), Velvet Rope Tab (Big Lou), Mulch Rebate, Biscuit's Nose, Castaway's Float (Driftwood),
  Porcelain-Glaze Charm (Clara), Bracken's Blessing (Elder Bracken), Sonar Trinket (Tessie quest), Brenda's Pension
  (Baroness Brenda), Audit Paperwork, Thick Glaze, and the Fizz Cup ones: Rookie Plate, Carburettor Contacts,
  Shelldon's Odds, Fizz Sponsor.

## Done when
- `npm run lore` passes (it regenerates docs/lore/INDEX.md; keep that change)

## Out of scope
Code files; other lore entries (do not edit them).
~~~~

### 2.9 Tests for the director, catalog and perks

~~~~text
Epic: 2 Content and effects
Depends on: none

## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Game games/gnome-theft-auto, tests are vitest (`npm test -w
games/gnome-theft-auto -- <file>`). Other workers are filling the event catalog files at the same time: your tests
must pass whatever the catalog holds (it may be empty now). Edit only the test files below. Do not commit.

## Goal
Unit tests cover the street-event director's picking, every catalog event's script (with a fake kit), and perks.ts.

## Read first
- games/gnome-theft-auto/src/events/types.ts (EventDef, EventKit, Actor, Car)
- games/gnome-theft-auto/src/events/director.ts (eligible, pickEvent, DIRECTOR)
- games/gnome-theft-auto/src/events/spots.ts (pickAnchor(world, kind, px, pz, rand, min, max))
- games/gnome-theft-auto/src/events/catalog/index.ts (STREET_EVENTS)
- games/gnome-theft-auto/src/perks.ts

## Change
- games/gnome-theft-auto/src/events/director.test.ts (new):
  - pickEvent: returns null for an empty list; skips an event whose readyAt > now; skips one whose when() is false;
    skips excluded ids; with rand = () => 0 returns the first eligible; weight 0 never picked.
  - pickAnchor: with roads { nodes: [{id:0,x:0,z:0,links:[1]},{id:1,x:80,z:0,links:[0]}], laneOffset: 2 } and
    walkPoints [{x:70,z:0}], player at (0,0), min 55 max 120: 'road' returns (80,0) with yaw atan2(0-80, 0-0)
    (it points at its link, node 0), 'walk' returns (70,0); with nothing in range returns null.
- games/gnome-theft-auto/src/events/catalog.test.ts (new): import STREET_EVENTS.
  - ids unique and match /^[a-z0-9]+(-[a-z0-9]+)*$/; title and hint non-empty; weight >= 0; cooldown > 0; duration > 0;
    anchor is 'road' or 'walk'; category is one of the five.
  - A fake EventKit (plain object implementing every EventKit member from types.ts; gnome() returns a fake Actor that
    records its goal and moves instantly-ish, car() returns a fake Car with a fake v = { x, z, yaw: 0, speed: 0,
    driver: 'npc', exploded: false, object: new THREE.Group() }, prop() returns new THREE.Group(), spot() returns
    { x: fromX + min, z: fromZ, yaw: 0 }, rand = a seeded LCG, ground() = 0, player = { x: 200, z: 200, vehicle: null,
    health: 1, hurt() {} } (far away)). For every event: start at { x: 0, z: 0, yaw: 0 }, call update(1/30) for 30 s of
    simulated time (advance kit.t), assert no throw and every returned status is one of the four; stop at the first
    non-'running'. With the player far away and doing nothing, no event may return 'done'.
- games/gnome-theft-auto/src/perks.test.ts (new): use setPerkStorage(fakeStorage) (a Map-backed getItem/setItem),
  setPerkStorage(null) in afterEach.
  - computeActive: quest done -> active; revoked wins; granted without quest -> active.
  - grantPerk/revokePerk/clearPerkOverride change listPerks() sources ('granted', 'revoked', 'quest', 'locked');
    unknown id returns false.
  - takeNewPerks returns a newly active perk once, then [] on the second call.
  - priceScaleFor('Dandelion Fizz', new Set(['velvet-rope','fizz-sponsor'])) === 0; ('Acorn-Cola', {velvet-rope}) === 0.75;
    unknown reason -> 1.
  - every PERKS questId is unique and every PerkId appears once.

## Done when
- `npm test -w games/gnome-theft-auto -- src/events/director.test.ts src/events/catalog.test.ts src/perks.test.ts` passes

## Out of scope
All non-test files.
~~~~
