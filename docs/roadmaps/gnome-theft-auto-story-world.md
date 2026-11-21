# Gnome Theft Auto: Story, World & Brands Roadmap

Goal: Turn [games/gnome-theft-auto](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/games/gnome-theft-auto/README.md) from an open-world sandbox with one demo contract into the full story-driven, brand-saturated *GTA* parody described in [docs/design/gnome-theft-auto/](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/design/gnome-theft-auto/README.md) ([story.md](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/design/gnome-theft-auto/story.md), [world-lore.md](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/design/gnome-theft-auto/world-lore.md), [brands.md](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/design/gnome-theft-auto/brands.md), [society.md](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/design/gnome-theft-auto/society.md)). Lore setting: `apocrypha` ([R-015](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/lore/rulings.md#r-015), [R-016](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/lore/rulings.md#r-016), [R-021–R-029](file:///C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/scoter/docs/lore/rulings.md#r-021)): clay gnomes crack into shards and get glued at the Glaze Clinic (never bleed, never soak), mowers char and burn when shot to pieces, and every blade of grass in Turfton is sponsored.

## Shape Table

| Epic | Name | Done When | Parallel Issues |
|---|---|---|---|
| **1** | **Prefabs, Brands & World Landmarks** | `npm test -w packages/prefabs`, `npx tsc --noEmit -p games/gnome-theft-auto` | **5** (`1A`–`1E`) |
| **2** | **Living World: Vibe NPCs, Easter Eggs, Economy & Pay 'n' Glaze** | `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` | **5** (`2A`–`2E`) |
| **3** | **Expanded Arsenal, Special Vehicles & 4-Hat HOA Escalation** | `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` | **5** (`3A`–`3E`) |
| **4** | **Quest Engine v2, Speaking Cutscenes & Cloud Save** | `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` | **5** (`4A`–`4E`) |
| **5** | **Main Story Campaign (Prologue & Chapters 1–5)** | `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` | **6** (`5A`–`5F`) |
| **6** | **Strangers & Freaks (11 Side Quests), Radio Bulletins, Achievements & Party Slice** | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/achievements`, `npm run lore`, smoke check | **5** (`6A`–`6E`) |

---

## Common Worker Environment (applies to every issue)

- **Working directory:** `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\scoter` (in Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`).
- **Concurrency rule:** Other workers are editing neighbouring files in `games/gnome-theft-auto` and `packages/` at the same time. **Only touch the files listed under `Owns` in your issue.** Do not run `vite build` or start dev servers during parallel issues; use `npx tsc --noEmit -p games/gnome-theft-auto` or package unit tests. Do NOT `git commit`.
- **Canon & House Style (`apocrypha`, R-021–R-029):** Gnomes are fired clay. Nothing bleeds, nothing gets wet/soaked/dripping (`Washed Out` is replaced by `Cracked`). Shot gnomes burst into clay shards; shot mowers char and burn.
- **Mobile & UI (`#ui`):** Never restyle or hide `#ui`. Every new button or touch control needs `>= 44px` tap targets, safe-area insets (`env(safe-area-inset-*)`), and works at `390x844` portrait and `844x390` landscape.

---

## Epic 1: Prefabs, Brands & World Landmarks

Fleshes out the physical world and brand presence from `brands.md` and `world-lore.md` Part III so every later quest and system has real 3D buildings, billboards, props, and landmarks to reference.

### Issue 1A: Brand & Storefront Prefabs (`packages/prefabs/src/catalog/gta-brands.ts`)
~~~~text
Epic: 1 (Prefabs, Brands & World Landmarks), Issue 1A
Depends on: none
Owns: packages/prefabs/src/catalog/gta-brands.ts, packages/prefabs/src/catalog/index.ts

## Goal
Add 3D prefabs for Turfton's corporate brands, storefronts, and sidewalk clutter from `docs/design/gnome-theft-auto/brands.md`.

## Read first
- docs/design/gnome-theft-auto/brands.md: brand colours, slogans, and visual presence.
- docs/roadmaps/prefab-library/_common.md: prefab sizing (< 3 units per side at scale 1; author large buildings at 1/5 scale and note in `about`), `examine` 5-line format (description, saying, tip, joke, lore thread).
- packages/prefabs/src/catalog/gta-world.ts: see `gta-mulch-club` and `gta-hospital` for 4x3 storefront authoring conventions.

## Change
- Create `packages/prefabs/src/catalog/gta-brands.ts` exporting `GTA_BRANDS: readonly PrefabDef[]` and register it in `packages/prefabs/src/catalog/index.ts`:
  1. `gta-bodega`: *Bodega & Sons (No Sons, Just John)* — overturned giant watering-can corner shop with neon window, Acorn-Cola crate, and counter inside.
  2. `gta-side-valve`: *Side-Valve Salvage* — Tansy's chop-shop garage with corrugated roof, roll-up bay door, wrench sign, and Husky-Blade banners.
  3. `gta-pay-n-glaze`: *Pay 'n' Glaze* — hot-pink (`0xff3b9a`) and chrome drive-through spray bay with open front/back arches and neon roller sign.
  4. `gta-gnomecino`: *The Gnomecino (Turfton Branch)* — neon-lit casino facade with giant golden acorn marquee and velvet rope.
  5. `gta-clay-mart`: *Clay-Mart Warehouse* — blue-and-yellow upside-down Tupperware big-box store facade.
  6. `gta-thorne-tower`: *Thorne Lawn & Order HQ* — obsidian-and-gold monolithic office base with brass plaque and manicured astroturf plinth.
  7. `gta-gnoma-truck`: *Gnoma's Food Truck* — mint-and-pink step van with serving window, awning, and giant triple-acorn waffle sign on the roof.
  8. `gta-vending-cola` & `gta-vending-fizz`: *Acorn-Cola* (crimson/white) and *Dandelion Fizz* (electric yellow) sidewalk vending machines.
  9. `gta-dew-pump`: *Black Dew™* amber-and-chrome roadside fuel pump canopy and shootable `gta-dew-barrel`.
  10. `gta-billboard`: roadside double-post billboard frame (tintable panel face so `brands.ts` can slap canvas textures onto it).

## Done when
- `npm test -w packages/prefabs` passes with all new prefabs validated.
~~~~

### Issue 1B: Story, Weapon, Vehicle & Landmark Prefabs (`packages/prefabs/src/catalog/gta-story.ts`)
~~~~text
Epic: 1 (Prefabs, Brands & World Landmarks), Issue 1B
Depends on: none
Owns: packages/prefabs/src/catalog/gta-story.ts

## Goal
Create the 3D prefabs for new story weapons, special vehicles, collectibles, and Easter egg landmarks listed in `docs/design/gnome-theft-auto/story.md` §7 and §11.

## Read first
- docs/design/gnome-theft-auto/story.md: sections 7 (Easter Eggs) and 11 (New Prefabs, Weapons, Vehicles & Achievements).
- packages/prefabs/src/catalog/gta-guns-air.ts: weapon `grip` and `+y` muzzle conventions; vehicle `seat` and `pivots` (`wheel-0..3`) conventions.

## Change
- Create `packages/prefabs/src/catalog/gta-story.ts` exporting `GTA_STORY: readonly PrefabDef[]` (Note: if Issue 1A edits `index.ts`, export `GTA_STORY` and let 1A or end-of-epic check wire the 1-line import in `index.ts`, OR import `GTA_STORY` inside `gta-guns-air.ts` and spread it into `GTA_GUNS_AIR` so `index.ts` has zero collision):
  - **Held Weapons (`uses: ['hold', 'shoot']` or `['hold', 'swing']`):**
    1. `leaf-blower-cannon` (Razor-Back safety-orange backpack blower tube with wide air-horn nozzle)
    2. `acorn-mortar` (stovepipe launcher with brass sight and acorn hopper)
    3. `tow-cable-whip` (coiled steel cable & hook with wooden handle)
    4. `dandelion-puff-grenade` (white fluffy seed-head sphere on a stem pin)
    5. `acorn-trip-mine` (spring-loaded mousetrap plate with brass acorn trigger)
  - **Vehicles (`uses: ['place', 'sit']`, with `wheel-0..3` pivots and `seat`):**
    6. `hoa-van` (*Thorne Lawn & Order* obsidian-and-gold Code-Enforcement Van with roof megaphones)
    7. `boot-parade-float` (30-foot papier-mâché Gnorwin Clayfoot mud-boot on a tractor chassis, scaled by `K = 0.25`)
    8. `snail-coach` (Turfton public transit bus with snail-shell roof dome and Dandelion Fizz side ad banner)
    9. `mulch-spreader-mower` (utility Ride-On with rear compost hopper and spinning spreader disc pivot `reel`)
  - **Story & World Props (`uses: ['place']` or `['hold', 'collect']`):**
    10. `stopping-stone` (ancient Fescue runed stone wedge)
    11. `tall-one-pencil` (redwood-sized yellow hexagonal pencil stub buried at an angle)
    12. `squeaky-hotdog-giant` (bus-sized glossy red rubber hotdog in a bun)
    13. `porcelain-lantern` (flickering wax lantern in a delicate white porcelain frame)
    14. `grand-combine-boss` (armored obsidian-and-gold Combine Harvester with roof bridge and front intake maw, scaled by `K = 0.2`)
  - **Cosmetic Gear Rewards (`uses: ['wear-head' | 'wear-back' | 'wear-neck' | 'hold']`):**
    15. `tansy-apron` (`wear-back`), `mini-boot-hat` (`wear-head`), `brass-calipers` (`hold`), `tinfoil-brim` (`wear-head`), `microfiber-bowler` (`wear-head`), `stopping-stone-charm` (`wear-neck`).

## Done when
- `npm test -w packages/prefabs` passes.
~~~~

### Issue 1C: Brand Registry, Procedural Billboards & Liveries (`games/gnome-theft-auto/src/brands.ts`)
~~~~text
Epic: 1 (Prefabs, Brands & World Landmarks), Issue 1C
Depends on: none
Owns: games/gnome-theft-auto/src/brands.ts, games/gnome-theft-auto/src/brands.test.ts

## Goal
Turn every brand and corporate rivalry in `docs/design/gnome-theft-auto/brands.md` into data, procedural 2D canvas billboard textures, and vehicle livery palettes.

## Read first
- docs/design/gnome-theft-auto/brands.md: all 13 brands, colours, slogans, fine print, and rivalries.
- games/gnome-theft-auto/src/textures.ts: procedural `CanvasTexture` helpers.

## Change
- Create `games/gnome-theft-auto/src/brands.ts`:
  - `export type BrandId = 'buck-iron' | 'razor-back' | 'husky-blade' | 'black-dew' | 'stink-gro' | 'pure-loam' | 'acorn-cola' | 'dandelion-fizz' | 'chirp-and-crumb' | 'clay-mart' | 'thorne-lawn' | 'pay-n-glaze' | 'kiln-shield' | 'snail-mail' | 'pigeon-drop';`
  - `export interface BrandDef { id: BrandId; name: string; primary: number; secondary: number; slogan: string; finePrint?: string; rival?: BrandId; vehicleKinds?: VehicleKind[]; }`
  - `export const BRANDS: Record<BrandId, BrandDef>` populated from `brands.md`.
  - `export function billboardTexture(brandId: BrandId): THREE.CanvasTexture` — renders a crisp 512x256 highway billboard canvas (brand background, bold header, slogan, fine print or rivalry clap-back, and simple geometric logo emblem). Cached per `BrandId`.
  - `export function placeBillboards(scene: THREE.Scene, boxes: Box[]): void` — places 16 roadside billboards along `HIGHWAYS` (`east`, `west`, `north`, `south`, and the ring road) and downtown rooftops, facing oncoming traffic, with Buck-Iron vs. Razor-Back and Stink-Gro vs. Pure-Loam boards placed in pairs.
  - `export function brandForVehicle(kind: VehicleKind, tint: number): BrandDef` — maps Ride-On/Combine (`buck-iron`), Zero-Turn (`razor-back`), Push-Bike (`husky-blade`) and returns rivalry honk/surcharge lines.
- Create `games/gnome-theft-auto/src/brands.test.ts` verifying every `BrandId` has non-empty slogans, valid hex colours, symmetric rivalries, and non-overlapping billboard placements clear of `HIGHWAYS`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass.
~~~~

### Issue 1D: Turfton Districts & Branded Storefronts (`games/gnome-theft-auto/src/world.ts`)
~~~~text
Epic: 1 (Prefabs, Brands & World Landmarks), Issue 1D
Depends on: none
Owns: games/gnome-theft-auto/src/world.ts, games/gnome-theft-auto/src/config.ts

## Goal
Place named story storefronts, branded sidewalk props, and the new Turfton districts from `world-lore.md` Part I & Part III (*The Greenhouse Strip*, *Patio Heights*, *Under-Deck Culvert Entrances*, *John Bodega's Shop*, *Side-Valve Salvage*, *Pay 'n' Glaze*, *Thorne Tower*, *The Gnomecino*, *Clay-Mart*, *Turfton Amphitheater*, and *Gnoma's Food Truck*) into `config.ts` and `world.ts`.

## Read first
- docs/design/gnome-theft-auto/world-lore.md: coordinates and descriptions for Turfton landmarks and Part III expansions.
- games/gnome-theft-auto/src/config.ts: `MULCH_CLUB`, `HOSPITAL`, `PLACES`.
- games/gnome-theft-auto/src/world.ts: how `MULCH_CLUB` and `HOSPITAL` reserve city blocks and how sidewalks/parks are populated.

## Change
- In `games/gnome-theft-auto/src/config.ts`:
  - Export landmark constants:
    - `BODEGA = { x: -60, z: 60, footprint: 18 }`
    - `SIDE_VALVE = { x: -120, z: 60, footprint: 24, bay: { x: -120, z: 46 } }`
    - `PAY_N_GLAZE = { x: 60, z: 120, footprint: 22, bay: { x: 60, z: 120, radius: 7 } }`
    - `GNOMECINO = { x: 60, z: -30, footprint: 26 }`
    - `THORNE_TOWER = { x: 30, z: -30, footprint: 30, height: 86 }`
    - `CLAY_MART = { x: -150, z: 150, footprint: 34 }`
    - `AMPHITHEATER = { x: -90, z: -90, footprint: 32 }`
    - `PATIO_HEIGHTS = { minX: 125, maxX: 210, minZ: -210, maxZ: -125 }`
    - `GREENHOUSE_STRIP = { minX: 45, maxX: 105, minZ: -55, maxZ: 55 }`
    - `GNOMA_TRUCK = { x: 14, z: 42, yaw: 0 }`
  - Expand `PLACES` with `side-valve`, `gnomecino`, `clay-mart`, `patio-heights`, `bodega`, and `pay-n-glaze` so NPC traffic (`errands.ts`) and Turfton FM traffic reports visit them.
- In `games/gnome-theft-auto/src/world.ts`:
  - Place each landmark building on its designated block, add *Gnoma's Food Truck* near the Glaze Clinic Hospital, scatter *Acorn-Cola* and *Dandelion Fizz* vending machines along downtown sidewalks, add glass-arch grow-lamp canopies over *The Greenhouse Strip*, add a walled flagstone slab for *Patio Heights*, and add two surface storm-drain culvert portals (`Under-Deck`) that teleport a vehicle or gnome cleanly between the SW canal and downtown (`x: 0, z: 0`).
  - Call `placeBillboards(scene, boxes)` if present (or guard via import from `./brands`).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes and no landmark box overlaps a `ROAD_LINES` road or `SPAWN`.
~~~~

### Issue 1E: Outer-Biome Expansions & Setpieces (`games/gnome-theft-auto/src/biomes.ts`)
~~~~text
Epic: 1 (Prefabs, Brands & World Landmarks), Issue 1E
Depends on: none
Owns: games/gnome-theft-auto/src/biomes.ts

## Goal
Flesh out the four outer biomes with the landmarks and Part III areas from `world-lore.md`: *The Compost Heap* (Industrial Badlands on the Turfton/Mossy Wood border), *The Fence-Line Overlook* (`|x|,|z| = 600`), *Tall House Porch* (far west Mossy Wood), *Biscuit's Nap Crater* & *Southern Drainage Canal* (Cloverfield Farms), *Frozen Birdbath Basin* & *Aether Ley-Line Ramp* (Frostbite Fells), and *Black Dew™* fuel stations.

## Read first
- docs/design/gnome-theft-auto/world-lore.md: sections 2–5 and 8, 10.
- docs/design/gnome-theft-auto/story.md: section 7 (Easter Eggs table).
- games/gnome-theft-auto/src/biomes.ts: `buildBiomes`, `reserved`, `batches`, `addBox`.

## Change
- In `games/gnome-theft-auto/src/biomes.ts`:
  1. **The Compost Heap (`x: -255, z: -60`):** steaming mulch mounds, rusted wheelbarrow cranes, and *Black Dew* refinery tanks + a steam-vent pad that gives light vehicles an upward boost (`vy`) when driven over.
  2. **Mossy Wood Landmarks:** the Unmowed's ring clearing at `(-360, 40)`, the abandoned *Chapel of Mulch* van off the `west` highway (`-290, -10`), and the boarded-up oversized *Tall House Porch* at the far western edge (`-560, 40`).
  3. **Frostbite Fells Landmarks:** a large circular *Frozen Birdbath Basin* derby arena at `(0, -350)`, the *Kiln-Resin Shrine* behind the northern snowbank `(-30, -520)`, and a glowing blue *Aether Ley-Line Ramp* at `(40, -540)`.
  4. **Cloverfield Farms Landmarks:** *Granny Gnertrude's Farmhouse & Barn* at `(-25, 340)`, the 40-unit muddy pawprint crater *Biscuit's Nap* at `(80, 380)` with a submerged *Squeaky Hotdog*, and the *Southern Drainage Canal* strip at `z = 230` with Baroness Brenda's lawn-chair throne and Driftwood's turf-raft.
  5. **The Fence-Line Overlook:** tall wooden boundary fence posts along `|x| = 595` and `|z| = 595` with a glowing knot-hole overlook at `(-590, -120)`.
  6. **Roadside Black Dew™ Stations:** place `gta-dew-pump` and shootable `gta-dew-barrel` clusters at highway junctions on the `east` and `south` highways.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes and all highway legs (`ROAD_CLEAR`) remain unobstructed.
~~~~

---

## Epic 2: Living World: Vibe NPCs, Easter Eggs, Economy & Pay 'n' Glaze

Brings the world to life with the 24/7 background characters from `world-lore.md`, interactive Gnomiverse Easter eggs from `story.md` §7, the Acorn / Kiln-Debt economy, and functional *Pay 'n' Glaze* / *Side-Valve Salvage* garages.

### Issue 2A: Vibe Characters & Street Factions (`games/gnome-theft-auto/src/vibeNpcs.ts`)
~~~~text
Epic: 2 (Living World), Issue 2A
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/vibeNpcs.ts

## Goal
Populate Turfton and the four biomes with the permanent 24/7 "Vibe / Background Characters" and ambient street factions from `world-lore.md` and `story.md` §4–5.

## Read first
- docs/design/gnome-theft-auto/world-lore.md: vibe character entries for each biome (John Bodega & Asphalt the Cat, Wind-Sock Wally, Moss-Watcher Merle, Thermos Theo, Fence-Post Frank, Silt-Diver Sal, Gate-Guard Gary, Ash-Shovel Ernie, Neon-Moth Nina, Knot-Hole Nora).
- docs/design/gnome-theft-auto/story.md: supporting cast & Red Cap / Blue Cap Corners (§5.6).
- games/gnome-theft-auto/src/gnomes.ts: `makeGnome`, `gnomeState`.

## Change
- Create `games/gnome-theft-auto/src/vibeNpcs.ts`:
  - `export interface VibeWorld { update(dt: number, playerX: number, playerZ: number, playerVehicle: Vehicle | null): string | null; }`
  - `export function createVibeNpcs(scene: THREE.Scene, world: World, hud: Hud): VibeWorld`
  - Spawn all 10 named vibe characters at their canonical coordinates with distinct `GnomeLook`s and props (e.g., **John Bodega** sweeping inside `BODEGA` at `(-60, 60)` with **Asphalt** the clay-dust tabby cat sitting on the counter batting a bottlecap; **Wind-Sock Wally** in a lawn chair at `(565, -110)` muttering *"Stall speed's 22, kid"*; **Thermos Theo** by a burning pine-cone barrel at `(40, -330)`; **Fence-Post Frank** at `(0, 260)`; **Gate-Guard Gary** at `PATIO_HEIGHTS` waving Zero-Turns through and citing Push-Bikes; **Big Lou** outside `GNOMECINO`).
  - Spawn the **Red Cap vs. Blue Cap** picnic-table standoff at `(60, -60)` where three Red Caps and three Blue Caps trade harmless acorn shots across the median.
  - When the player walks or drives within 7 units of a vibe character (with a 25s per-character cooldown), toast their signature dry line from `world-lore.md`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 2B: Interactive Gnomiverse Easter Eggs & Collectibles (`games/gnome-theft-auto/src/easterEggs.ts`)
~~~~text
Epic: 2 (Living World), Issue 2B
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/easterEggs.ts, games/gnome-theft-auto/src/easterEggs.test.ts

## Goal
Implement the interactive Gnomiverse Easter eggs (`story.md` §7) and map collectibles (`story.md` §12.6: 25 Golden Acorns, 10 Stopping-Stone Shards, 15 smashable HOA Foreclosure Signs).

## Read first
- docs/design/gnome-theft-auto/story.md: section 7 (14 Gnomiverse Easter Eggs) and section 12.6 (Collectibles).

## Change
- Create `games/gnome-theft-auto/src/easterEggs.ts`:
  - `export interface EasterEggs { update(dt: number, player: Player, vehicles: Vehicle[]): void; counts(): { acorns: number; shards: number; signs: number }; }`
  - `export function createEasterEggs(scene: THREE.Scene, world: World, hud: Hud, onAcornReward: (amount: number) => void): EasterEggs`
  - Implement interactive triggers for the §7 table:
    - **Gnoma's Food Truck (`(14, 42)`):** walking up restores full Clay Health (`player.health = 1`); bumping the truck with a mower toasts `'Gnoma: "Oops, a little wobbly! We learn from it!"'`.
    - **Aether Board Ley-Line Ramp (`(40, -540)`):** hitting it on a vehicle at speed `> 12` gives a low-gravity arc and chime toast.
    - **Biscuit's Nap (`(80, 380)`):** acorns inside the crater give double value.
    - **Old Combine (Dust Flats):** rare chrome-tinted unmanned Combine rolling slowly across the eastern dunes at night/dawn.
    - **Tall House Porch (`(-560, 40)`):** dims fog slightly and whispers *"Don't look at the lantern"* when approached.
    - **Gnorwin Clayfoot Statue (`(-30, 30)` park):** statue with an orange traffic cone on its head and *"EVEN CUT WAS HERE"* plaque.
  - Place 25 spinning **Golden Acorns** (touching collects +100 Acorns), 10 **Stopping-Stone Shards**, and 15 **HOA Foreclosure Signs** (driving through them smashes them into splinters and awards +50 Acorns). Persist collected IDs in `localStorage` (`gta-collectibles-v1`).
- Add `games/gnome-theft-auto/src/easterEggs.test.ts` testing collectible persistence and coordinate bounds.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass.
~~~~

### Issue 2C: Acorns Economy, Kiln-Debt & Kiln-Shield Insurance Fraud (`games/gnome-theft-auto/src/economy.ts`)
~~~~text
Epic: 2 (Living World), Issue 2C
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/economy.ts, games/gnome-theft-auto/src/economy.test.ts

## Goal
Implement the player's Acorn wallet, the 5,000-Acorn *Clay-Mart Kiln-Debt* tracker from Chapter 1, *Kiln-Shield: CLAIM DENIED* Glaze Clinic hospital receipts, and the *Kiln-Shield Ragdoll Insurance Fraud* side activity.

## Read first
- docs/design/gnome-theft-auto/story.md: Chapter 1 (5,000-Acorn Kiln-Debt), Squeaky-Clean Midge (Glaze Clinic receipt), §12.6 (Economy & Kiln-Shield Ragdoll Fraud).
- docs/design/gnome-theft-auto/brands.md: *Kiln-Shield Insurance* and *Pay 'n' Glaze*.

## Change
- Create `games/gnome-theft-auto/src/economy.ts`:
  - `export interface EconomyState { acorns: number; debtRemaining: number; debtPaidOff: boolean; }`
  - `export interface Economy { state(): EconomyState; earn(amount: number, reason?: string): void; spend(amount: number, reason?: string): boolean; payDebt(amount: number): number; chargeHospital(): { fee: number; receipt: string }; onPlayerRagdollImpact(speed: number): number; }`
  - Start new saves (`gta-economy-v1`) with `50` Acorns and `5000` Kiln-Debt.
  - `chargeHospital()` deducts up to 25 Acorns when the player wakes at the Glaze Clinic Hospital and returns a dry *Kiln-Shield Insurance* denial string (e.g. `"GLAZE CLINIC: -25 Acorns (Peppermint Slip). KILN-SHIELD: CLAIM DENIED — 'Act of Pip Potsworth'."`).
  - `onPlayerRagdollImpact(speed)`: when the player is hit by NPC traffic inside marked *Kiln-Shield Fraud Zones*, award Acorns proportional to impact speed (`Math.round(speed * 8)`).
- Add `games/gnome-theft-auto/src/economy.test.ts` testing earn/spend, debt payoff clamping, and hospital fee when broke (`0` Acorns never goes negative).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass.
~~~~

### Issue 2D: Pay 'n' Glaze, Side-Valve Tuning Garage & Brand Rivalries (`games/gnome-theft-auto/src/garages.ts`)
~~~~text
Epic: 2 (Living World), Issue 2D
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/garages.ts

## Goal
Build the interactive *Pay 'n' Glaze* respray/heat-clear bay and *Side-Valve Salvage* tuning & safehouse garage (using the existing `@lawn/vehicle` tuning hooks in `src/simdrive.ts` and brand rivalry surcharge from `brands.md`).

## Read first
- games/gnome-theft-auto/README.md: "Garage (not built yet)" under `## Driving` (`getSetup`, `setSetup`, `resetSetup` in `src/simdrive.ts`, `TUNING_PARAMS` in `@lawn/vehicle`, `rangeFor(kind, id)` in `src/handling.ts`).
- docs/design/gnome-theft-auto/brands.md: *Pay 'n' Glaze* ("Drive in with 3-Hat Heat and a smoking mower; drive out 5 seconds later in a fresh MOWER_TINTS colour while the Hat Watch drives right past you") and *Buck-Iron vs. Razor-Back* 20% "Emotional Damage Surcharge".

## Change
- Create `games/gnome-theft-auto/src/garages.ts`:
  - `export interface Garages { update(dt: number, player: Player, watch: Watch): void; openTuningModal(): void; }`
  - **Pay 'n' Glaze (`PAY_N_GLAZE.bay`):** Driving a ground vehicle into the bay triggers a 2.5s respray sequence: repairs vehicle (`repairVehicle(v)`), cycles `v.tint` to a fresh `MOWER_TINTS` colour, clears `watch.clear()`, deducts 50 Acorns (free if broke during story missions), and toasts *"PAY 'N' GLAZE: Fresh paint, VIN filed off, Hat Watch confused!"*.
  - **Side-Valve Salvage (`SIDE_VALVE.bay`):** Driving or walking into the bay lets the player press `E` / tap **Tune Mower** to open a clean mobile-friendly (44px sliders, portrait + landscape safe) DOM panel appended to `#ui` over the 11 `@lawn/vehicle` tuning knobs (`getSetup`, `setSetup`, `resetSetup`), plus a livery tint picker (*Buck-Iron Green*, *Razor-Back Orange*, *Husky-Blade Blue*, *Thorne Obsidian*, *Sea-Foam*). Displays the 20% "Emotional Damage Surcharge" joke toast when tuning a *Buck-Iron* rig after a *Razor-Back* one.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 2E: HUD Acorn Counter, Debt Readout & Branded Receipts (`games/gnome-theft-auto/src/hud.ts`)
~~~~text
Epic: 2 (Living World), Issue 2E
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/hud.ts, games/gnome-theft-auto/src/types.ts

## Goal
Extend the HUD with the Acorn counter, Kiln-Debt progress pill, and 4th-Hat ("THE HOA") wanted meter stage, and wire Epic 2's contracts into `types.ts`.

## Read first
- games/gnome-theft-auto/src/hud.ts: `#gta-hud` layout, `.gta-tl`, `.gta-meters`, mobile media queries (`@media (max-width:600px)`, `@media (max-height:500px)`).
- games/gnome-theft-auto/src/types.ts: `HudState`, `Hud`.

## Change
- In `games/gnome-theft-auto/src/types.ts`:
  - Add optional `acorns?: number;` and `debt?: number;` to `HudState`.
- In `games/gnome-theft-auto/src/hud.ts`:
  - Render an Acorn balance line (`🌰 50`) and, while `debt > 0`, a subtle `Kiln-Debt: 5,000` line in `.gta-tl` above `Cracked: N`.
  - Support `heat` values up to `4` in the wanted face meter (`s.heat === 4` shows an obsidian-and-gold HOA badge cap and pulses `"HOA ENFORCEMENT"`).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes and `#gta-hud` fits both `390x844` and `844x390` viewports without overlapping touch buttons.
~~~~

---

## Epic 3: Expanded Arsenal, Special Vehicles & 4-Hat HOA Escalation

Implements the new PG-13 garden-scale weapons, special vehicles, Hat Watch pursuit mowers, and the 4-Hat HOA Code-Enforcement Van from `story.md` §5, §11, and §13.

### Issue 3A: Garden-Scale Mayhem Arsenal (`games/gnome-theft-auto/src/weapons.ts`)
~~~~text
Epic: 3 (Arsenal, Special Vehicles & 4-Hat HOA), Issue 3A
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/weapons.ts, games/gnome-theft-auto/src/fx.ts

## Goal
Add the 5 garden-scale comedy weapons from `story.md` §11 (*Leaf-Blower Cannon*, *Acorn Mortar*, *Tow-Cable Whip*, *Acorn Trip-Mine*, *Dandelion Puff-Grenade*) to `weapons.ts` and `fx.ts` while keeping zero-gore clay physics.

## Read first
- docs/design/gnome-theft-auto/story.md: section 11 (New Weapons table).
- games/gnome-theft-auto/src/weapons.ts: hitscan ray loop, `attachTo`, `switchGun`, `reload`.
- games/gnome-theft-auto/src/fx.ts: particle bursts and tracers.

## Change
- In `games/gnome-theft-auto/src/fx.ts`:
  - Add `airBlast(x, y, z, dx, dz)` (swirling leaf-and-dust cone), `dandelionCloud(x, y, z)` (lingering 5s white fluff smoke sphere), and `confetti(x, y, z)` (colourful parade burst).
- In `games/gnome-theft-auto/src/weapons.ts`:
  - Support unlocking and cycling the new weapon kinds alongside `pistol`, `smg`, `shotgun`, `rifle`:
    1. `leaf-blower`: cone air blast (range 16) that calls `npcs.knock(...)` to launch pedestrians in goofy ragdoll arcs and pushes light vehicles back without cracking them.
    2. `acorn-mortar`: arcing toasted-acorn projectile that bursts on ground/vehicle contact (`fx.explode` + `damageVehicle` + ragdoll knock in radius 6).
    3. `tow-whip`: short-range (5 units) heavy arc that yanks NPC riders off nearby bikes/mowers (`traffic.ejectDriver`) and damages HOA vans.
    4. `dandelion-grenade`: thrown puff-grenade that spawns `fx.dandelionCloud`; any Hat Watch officer inside sneezes (hands up / drops aggro for 6s).
    5. `trip-mine`: places up to 3 spring-traps on the road; the next pursuing vehicle within 2.2 units is flung upward (`vy` / knock spin).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 3B: Special Vehicles & Handling Profiles (`games/gnome-theft-auto/src/vehicles.ts`, `src/handling.ts`)
~~~~text
Epic: 3 (Arsenal, Special Vehicles & 4-Hat HOA), Issue 3B
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/vehicles.ts, games/gnome-theft-auto/src/handling.ts, games/gnome-theft-auto/src/handling.test.ts

## Goal
Add the 5 new vehicles (*Ride-On Lowrider*, *Gnorwin's Boot Parade Float*, *Snail-Coach*, *Pressurized Mulch-Spreader*, and *HOA Code-Enforcement Van*) with `@lawn/vehicle` handling profiles and signature gimmicks (`story.md` §11).

## Read first
- docs/design/gnome-theft-auto/story.md: section 11 (New Vehicles table).
- games/gnome-theft-auto/src/handling.ts & `src/handling.test.ts`: per-vehicle 11-knob profiles and stability tests.
- games/gnome-theft-auto/src/vehicles.ts: `createVehicle`, `stepVehicle`, `syncVehicleMesh`.

## Change
- Add `lowrider`, `boot-float`, `snail-coach`, `mulch-spreader`, and `hoa-van` to `handling.ts` and `vehicles.ts`:
  - `lowrider`: Ride-On with hydraulics — tapping `jump` (`Space` / A / Hop button) gives a smooth hydraulic hop impulse (`vy`) and shock-absorption flag for Clara's porcelain escort quest.
  - `boot-float`: mass `10`, radius `3.8`, slow top speed (`13`), massive ramming momentum in `collideVehicles`; pressing fire/horn blasts `fx.confetti` and scatters nearby pedestrians (`poseHandsUp`).
  - `snail-coach`: long public transit bus (`mass: 5`, loose tail-happy drift profile).
  - `mulch-spreader`: firing while driving drops a 6-second compost slick behind the mower; any pursuing vehicle that drives over a slick gets a `knock.spin` skid impulse.
  - `hoa-van`: armored black-and-gold van (`mass: 4.5`) drivable if stolen from HOA enforcers.
- Update `games/gnome-theft-auto/src/handling.test.ts` so every new ground vehicle passes the full-lock + handbrake slalom stability test across all driving modes.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass.
~~~~

### Issue 3C: Hat Watch Pursuit Mowers, 4-Hat HOA Van & Faction Squads (`games/gnome-theft-auto/src/police.ts`)
~~~~text
Epic: 3 (Arsenal, Special Vehicles & 4-Hat HOA), Issue 3C
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/police.ts

## Goal
Upgrade `police.ts` so the Hat Watch deploys pursuit Ride-On/Zero-Turn cruisers at 2–3 Hats, escalates to **4-Hat ("THE HOA")** with the megaphone-blaring *HOA Code-Enforcement Van*, and supports mission-spawned enemy squads (*HOA Enforcers*, *Porcelain Guards*).

## Read first
- docs/design/gnome-theft-auto/story.md: sections 5 (Factions), 12.4 (Faction Hostility & Pursuit Mowers), and 13 (4th Hat — "THE HOA").
- games/gnome-theft-auto/src/police.ts: `createWatch`, `Unit`, `stepUnit`, `tick`.

## Change
- In `games/gnome-theft-auto/src/police.ts`:
  - Raise the heat ceiling to `4` (`MAX_HEAT = 4`):
    - **1 Hat:** foot officers (`WATCH.hat`, `WATCH.coat`).
    - **2 Hats:** foot officers + 1 **Hat Watch Pursuit Mower** (blue-and-yellow Ride-On driven by an officer that follows road nodes / steers toward the player at `speed: 21`).
    - **3 Hats:** 2 Pursuit Mowers (including a Zero-Turn interceptor) + foot officers.
    - **4 Hats ("THE HOA"):** spawns an **HOA Code-Enforcement Van** (`hoa-van`) crewed by beige-vested HOA Enforcers; its roof megaphone broadcasts *Municipal Code §404-B* citations (throttled toast + red/gold pulse ring that slightly slows the player's mower within 12 units until the van is outrun or smashed).
  - Add `spawnSquad(kind: 'hoa' | 'porcelain' | 'spade', points: [number, number][]): Npc[]` and `onSneeze(x: number, z: number, radius: number)` (for the Dandelion Puff-Grenade) to `Watch`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 3D: Errands, Special Traffic & Convoy Hooks (`games/gnome-theft-auto/src/traffic.ts`, `src/errands.ts`)
~~~~text
Epic: 3 (Arsenal, Special Vehicles & 4-Hat HOA), Issue 3D
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/traffic.ts, games/gnome-theft-auto/src/errands.ts, games/gnome-theft-auto/src/traffic.test.ts

## Goal
Include the *Snail-Coach* bus and *Black Dew* haulers in town/highway traffic errands, add Buck-Iron vs. Razor-Back red-light honking (`brands.md` §1), and expose a convoy-spawner helper for Chapter 2's highway heist.

## Read first
- games/gnome-theft-auto/src/traffic.ts & `src/errands.ts`: how NPC drivers pick destinations from `PLACES`, drive along `world.roads`, dwell, and un-jam.
- docs/design/gnome-theft-auto/brands.md: Buck-Iron vs. Razor-Back rivalry.

## Change
- In `games/gnome-theft-auto/src/errands.ts` and `src/traffic.ts`:
  - Add an occasional `snail-coach` bus route looping the city grid (`SPAWN` bus stop -> `GNOMECINO` -> `HOSPITAL` -> `CLAY_MART`).
  - When a Buck-Iron Ride-On and a Razor-Back Zero-Turn pass within 8 units of each other, trigger a brief rivalry honk/quip.
  - Add `spawnConvoy(routeNodes: number[], kinds: VehicleKind[]): Vehicle[]` on `Traffic` so quests can dispatch a multi-vehicle convoy along a highway path.
- Update `games/gnome-theft-auto/src/traffic.test.ts` to cover `spawnConvoy` and the expanded `PLACES`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass.
~~~~

### Issue 3E: Online Protocol Sync for New Vehicles & Weapons (`games/gnome-theft-auto/src/net.ts`, `src/remotes.ts`)
~~~~text
Epic: 3 (Arsenal, Special Vehicles & 4-Hat HOA), Issue 3E
Depends on: Epic 1
Owns: games/gnome-theft-auto/src/net.ts, games/gnome-theft-auto/src/remotes.ts

## Goal
Update `VEHICLE_CODES` in `net.ts` and remote vehicle rendering in `remotes.ts` so players driving a *Lowrider*, *Boot Parade Float*, *Snail-Coach*, *Mulch-Spreader*, or *HOA Van* online render accurately for all other players in Turfton.

## Read first
- games/gnome-theft-auto/src/net.ts: `VEHICLE_CODES`, `PeerPose`.
- games/gnome-theft-auto/src/remotes.ts: how remote player vehicles and gnomes (`resolveLook`) are built and interpolated.
- docs/gear-sync.md: online gnome look and gear sync rules.

## Change
- Append `'lowrider'`, `'boot-float'`, `'snail-coach'`, `'mulch-spreader'`, `'hoa-van'` to `VEHICLE_CODES` in `src/net.ts`.
- Ensure `src/remotes.ts` builds the matching vehicle prefab and seats the remote player gnome cleanly on `spec.seat`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

---

## Epic 4: Quest Engine v2, Speaking Cutscenes & Cloud Save

Upgrades `src/quests/` from a single-objective demo (`crack` + `visit` + silent Mulch Club room) into a full story mission engine supporting speaking character dialogues, 6 new objective kinds, multi-stage setpieces, and `@lawn/cloudsave`.

### Issue 4A: Quest Types & Multi-Room Cutscene / Dialogue Engine (`games/gnome-theft-auto/src/quests/types.ts`, `src/quests/cutscene.ts`)
~~~~text
Epic: 4 (Quest Engine v2 & Cutscenes), Issue 4A
Depends on: Epic 1, Epic 2, Epic 3
Owns: games/gnome-theft-auto/src/quests/types.ts, games/gnome-theft-auto/src/quests/cutscene.ts

## Goal
Extend `QuestDef` and `ObjectiveDef` with all story objective kinds and upgrade `cutscene.ts` so it plays **both** Don Compost's silent wanted-poster contracts **and** speaking character scenes (with bottom-third subtitle cards, speaker portraits/looks, `@lawn/mutter` voice synthesizer blips, and optional late-night **John Bodega & Asphalt** B-roll shots per `world-lore.md` §1).

## Read first
- games/gnome-theft-auto/src/quests/types.ts & `src/quests/cutscene.ts`: existing `GiverDef`, `ObjectiveDef`, `QuestDef`, `CutsceneRequest`.
- docs/design/gnome-theft-auto/story.md: sections 3 (Intro), 4 (Main Characters looks & voices), 6 (Chapters), 9 (Storyboarded Quests), 12.1–12.2.
- docs/design/gnome-theft-auto/world-lore.md: section 1 (John Bodega & Asphalt cutscene cameo rule).

## Change
- In `games/gnome-theft-auto/src/quests/types.ts`:
  - Expand `GiverDef.room` to `'mulch-club' | 'side-valve' | 'cloverfield-barn' | 'unmowed-hollow' | 'fells-shrine' | 'dust-overlook' | 'street'`.
  - Add `DialogueLine`: `{ speaker: string; text: string; look?: Partial<GnomeLook>; hz?: number; icon?: string; bodegaCameo?: boolean }`.
  - Expand `CutsceneSpec`: `{ kind: 'contract' } | { kind: 'dialogue'; room?: GiverDef['room']; lines: DialogueLine[]; titleCard?: string }`.
  - Expand `ObjectiveDef` union with:
    - `{ kind: 'crack'; text: string; targets: TargetDef[] }`
    - `{ kind: 'visit'; text: string; at: [number, number]; radius: number; hint: string }`
    - `{ kind: 'steal-deliver'; text: string; vehicleKind: VehicleKind; spawnAt: [number, number, number]; dropAt: [number, number]; radius: number; hint: string; heatOnEnter?: number; maxDamage?: number }`
    - `{ kind: 'chase-follow'; text: string; leaderName: string; leaderKind: VehicleKind; waypoints: [number, number][]; speed: number; maxDist: number; hint: string }`
    - `{ kind: 'convoy-ambush'; text: string; route: [number, number][]; escorts: number; dropAt: [number, number]; hint: string }`
    - `{ kind: 'air-drop'; text: string; planeAt?: [number, number]; dropZone: [number, number, number]; radius: number; targetVehicle?: VehicleKind; hint: string }`
    - `{ kind: 'survive-derby'; text: string; arena: [number, number]; radius: number; seconds: number; attackers: number; hint: string }`
    - `{ kind: 'boss-combine'; text: string; startZ: number; endZ: number; hint: string }`
    - `{ kind: 'choice'; text: string; optionA: { label: string; at: [number, number]; endingText: string }; optionB: { label: string; at: [number, number]; endingText: string } }`
  - Add `prereq?: string;`, `chapter?: number;`, `rewardAcorns?: number;`, `radioBulletin?: string;` to `QuestDef`.
- In `games/gnome-theft-auto/src/quests/cutscene.ts`:
  - Keep `kind: 'contract'` (Don Compost's silent back-room wanted-poster layout) intact.
  - Add `kind: 'dialogue'` staging: renders the room/actors (Pip, Tansy, Vesper in spotless white porcelain + obsidian top hat, Granny Gnertrude, Commander Diggs, Elder Bracken), shows a clean bottom-third subtitle card with speaker name in gold and `Next / Skip ▶` button (`>= 44px` touch target), and when `bodegaCameo: true` is set on a line, cuts to the neon window of *Bodega & Sons* where John Bodega calmly sweeps clay dust while Asphalt the cat bats a bottlecap.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 4B: Objective Runners: Vehicle Deliver, Chase, Escort & Convoy (`games/gnome-theft-auto/src/quests/objectivesDrive.ts`)
~~~~text
Epic: 4 (Quest Engine v2 & Cutscenes), Issue 4B
Depends on: Epic 4A (contract fixed above)
Owns: games/gnome-theft-auto/src/quests/objectivesDrive.ts

## Goal
Implement the pure objective runners for `steal-deliver`, `chase-follow`, and `convoy-ambush` so vehicle heists, fragile porcelain escorts, and highway blockades work out of the box from `QuestDef` data.

## Read first
- games/gnome-theft-auto/src/quests/quests.ts: `Run` interface (`lines()`, `done()`, `update(dt, px, pz)`, `onCracked(npc)`, `blips()`, `cracked()`, `cleanup()`).
- docs/design/gnome-theft-auto/story.md: Quest 1 (*Mower's Keepers*), Quest 2 (*Dew Run on Route South*), Side Quest 9 (*The Porcelain Support Group* fragile escort), Side Quest 11 (*Big Lou's Wet-Hat Embargo*).

## Change
- Create `games/gnome-theft-auto/src/quests/objectivesDrive.ts` exporting `stealDeliverRun`, `chaseFollowRun`, and `convoyAmbushRun`:
  - `stealDeliverRun`: spawns the target vehicle at `spawnAt` with a gold marker cone above it; once the player enters it, optionally adds `heatOnEnter` to `watch`, tracks `maxDamage` (for fragile porcelain/VIP deliveries), and marks the drop-off ring at `dropAt`.
  - `chaseFollowRun`: spawns an NPC leader (e.g. Pip on a `push-bike` in the Prologue or Mayor Mulch's mower) driving through `waypoints` at `speed`; succeeds when the leader reaches the final waypoint while the player stays within `maxDist`.
  - `convoyAmbushRun`: spawns an HOA Dew-Hauler Ride-On and `escorts` armed HOA guards moving along `route`; blocking or cracking the escorts and driving the lead hauler to `dropAt` completes the objective.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 4C: Objective Runners: Air-Drop, Ice Derby, Grand Combine Boss & Choice (`games/gnome-theft-auto/src/quests/objectivesAction.ts`)
~~~~text
Epic: 4 (Quest Engine v2 & Cutscenes), Issue 4C
Depends on: Epic 4A (contract fixed above)
Owns: games/gnome-theft-auto/src/quests/objectivesAction.ts

## Goal
Implement the objective runners for `air-drop`, `survive-derby`, `boss-combine`, and `choice` covering Chapters 3, 4, and 5's marquee setpieces.

## Read first
- docs/design/gnome-theft-auto/story.md: Quest 3 (*The Sandpit Drop*), Quest 5 (*Kiln-Resin & Black Ice* Frozen Birdbath Derby), Quest 6 (*The Even Cut* 5-phase Grand Combine finale & Ending A/B choice).

## Change
- Create `games/gnome-theft-auto/src/quests/objectivesAction.ts` exporting `airDropRun`, `surviveDerbyRun`, `bossCombineRun`, and `choiceRun`:
  - `airDropRun`: guides the player to fly over `dropZone` `(x, y, z)`, bail out (`player.airborne`), and land under parachute within `radius` (and optionally board `targetVehicle`, e.g., `whirligig`).
  - `surviveDerbyRun`: spawns `attackers` hostile HOA/derby mowers inside `arena` `(x, z, radius)` that ram the player for `seconds` while Father Loam's countdown timer ticks on the tracker.
  - `bossCombineRun`: spawns the skyscraper-sized `grand-combine-boss` rolling down `x = 0` from `startZ` (`-300`) toward downtown (`endZ`), escorted by HOA vans and Porcelain Guards on its upper deck; player strafes or parachutes onto the deck, cracks Vesper's Lawn-Throne guard phase, and jams the intake at the front marker with the Stopping Stone.
  - `choiceRun`: places two glowing decision beacons (`optionA` and `optionB`) on the Combine's jammed deck; walking into either completes the quest and toasts the chosen epilogue.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 4D: Quest Runner Integration, 3D Ground Rings & Cloud Save (`games/gnome-theft-auto/src/quests/quests.ts`)
~~~~text
Epic: 4 (Quest Engine v2 & Cutscenes), Issue 4D
Depends on: Epic 4A
Owns: games/gnome-theft-auto/src/quests/quests.ts, games/gnome-theft-auto/src/quests/quests.test.ts

## Goal
Wire all new `OBJECTIVE_KINDS`, prerequisite unlocking (`prereq`), Acorn/Kiln-Debt payouts, radio event bulletin triggers, 3D glowing giver letters (`P`, `T`, `D`, `G`, `B`, `!`), and `@lawn/cloudsave` persistence into `quests.ts`.

## Read first
- games/gnome-theft-auto/src/quests/quests.ts: `OBJECTIVE_KINDS`, `waitingAt`, `interact`, `stepCheck`, `loadSaves`, `storeSaves`.
- packages/cloudsave/README.md: `createCloudSlot` (`merge` mode).

## Change
- In `games/gnome-theft-auto/src/quests/quests.ts`:
  - Register `steal-deliver`, `chase-follow`, `convoy-ambush`, `air-drop`, `survive-derby`, `boss-combine`, and `choice` in `OBJECTIVE_KINDS`.
  - Respect `q.prereq`: a quest is available at its giver only when `!q.prereq || saves[q.prereq]?.state === 'done'`.
  - On quest completion (`stepCheck`), award `q.rewardAcorns ?? 250` via `deps.economy?.earn(...)`, pay down Kiln-Debt if in Chapter 1–2, and trigger `deps.onRadioBulletin?.(q.radioBulletin ?? q.id)`.
  - Mirror `gta-quests-v1` to `@lawn/cloudsave` (`createCloudSlot('gta-quests-v1', ...)`).
- Add `games/gnome-theft-auto/src/quests/quests.test.ts` testing quest prerequisite chains, step transitions, and save serialization.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass.
~~~~

### Issue 4E: Online Co-Op Mission Sync & Public World Events (`games/gnome-theft-auto/src/worldEvents.ts`)
~~~~text
Epic: 4 (Quest Engine v2 & Cutscenes), Issue 4E
Depends on: Epic 3
Owns: games/gnome-theft-auto/src/worldEvents.ts

## Goal
Implement the public free-roam **World Events** from `story.md` §12.5 (*Black Dew Convoy Ambush*, *Zero-Turn Midnight Drift Trial*, and *HOA Code-Enforcement Van Raid*) so online and solo sandbox play has recurring dynamic events between story missions.

## Read first
- docs/design/gnome-theft-auto/story.md: section 12.5 (Online Co-Op & World Events).

## Change
- Create `games/gnome-theft-auto/src/worldEvents.ts`:
  - `export interface WorldEvents { update(dt: number, player: Player): void; blips(): Blip[]; }`
  - Every 3 minutes in free-roam (when no story cutscene is active), rotate one of three 90-second world events announced via HUD toast & minimap blip:
    1. **Dew Convoy on Route South:** an armored Dew-Hauler and escort drive up the `south` highway; intercepting it awards +300 Acorns.
    2. **Lawn Prix Midnight Zero-Turn Trial:** 6 checkered-flag gates along the Turfton Ring Road; beating 45s in a Zero-Turn awards +250 Acorns.
    3. **HOA Foreclosure Raid:** an HOA Code-Enforcement Van parks outside a random Turfton shop issuing fines; smashing it clears the block and awards +250 Acorns.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

---

## Epic 5: Main Story Campaign (Prologue & Chapters 1–5)

Authors the entire 5-chapter main story arc from `story.md` §3, §6, and §9 as clean, modular quest definition files that plug into `src/quests/defs.ts`.

### Issue 5A: Prologue & Chapter 1 — *Fresh Out the Kiln* & *Acorns & Alibis* (`games/gnome-theft-auto/src/quests/chapter1.ts`)
~~~~text
Epic: 5 (Main Story Campaign), Issue 5A
Depends on: Epic 4
Owns: games/gnome-theft-auto/src/quests/chapter1.ts

## Goal
Author the playable cold open (*"Fresh Out the Kiln"*) and Chapter 1's main story quests (*"First Contract"*, *"Mower's Keepers"*, *"Two-Coat Tail"*, *"The Glaze & Tax Break-In"*, and *"Founder's Boot & The Kangaroo Court"*) in `chapter1.ts`.

## Read first
- docs/design/gnome-theft-auto/story.md: sections 3 (Intro Sequence), 6 (Prologue & Chapter 1), and 9 (Quest 1 *"Mower's Keepers"* & Quest 4 *"Founder's Boot & The Kangaroo Court"*).
- games/gnome-theft-auto/src/quests/types.ts: `QuestDef`, `GiverDef`.

## Change
- Create `games/gnome-theft-auto/src/quests/chapter1.ts` exporting `CHAPTER_1_QUESTS: readonly QuestDef[]`:
  1. `prologue-fresh-kiln` (*"Fresh Out the Kiln"*): triggered near `SPAWN` with Pip Potsworth (`push-bike`); hop on a kerb Ride-On, follow Pip through the grid (`chase-follow`), lose 1-Hat Watch behind *The Gnomecino*, and meet Tansy at *Side-Valve Salvage* to discover the Fescue crate & humming Golden Acorn (`achievement: 'gta-fresh-kiln'`).
  2. `first-contract` (*"First Contract"*): Don Compost's existing silent contract at `mulch-club` (cracking Dandy Dibbler, Gordie Gravelbottom, and Sandy Spadewell) paying off the first 1,000 Acorns of Kiln-Debt (`achievement: 'gta-first-contract'`).
  3. `ch1-mowers-keepers` (*"Mower's Keepers"*): Tansy sends you to downtown block `(60, -60)` to repo clamped Push-Mower Bikes from HOA Enforcers, evade 1-Hat Watch, and discover the HOA eviction notice on Tansy's own garage.
  4. `ch1-two-coat-tail` (*"Two-Coat Tail"*): Councilwoman Juniper Vance at City Hall hires you to tail Mayor Barnaby "Two-Coat" Mulch to Patio Heights, catching him signing median-lease kickbacks to Vesper Thorne (includes late-night `bodegaCameo: true` shot).
  5. `ch1-tax-break-in` (*"Glaze & Tax Break-In"*): raid the Turfton Glaze & Tax Office, recover Tansy's deed, discover Vesper's blueprint for **The Grand Combine**, and escape in a stolen Combine Harvester (`combine`).
  6. `ch1-founders-boot` (*"Founder's Boot & The Kangaroo Court"*): hijack `boot-float` from the Founder's Trim Day parade at `(0, -120)`, drift through downtown, crash the Turfton Amphitheater HOA tribunal, scatter Reginald Vance's enforcers with the `leaf-blower`, and escape (`achievement: 'gta-boot-legger'`).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 5B: Chapter 2 — *Black Dew & Greenbacks* (`games/gnome-theft-auto/src/quests/chapter2.ts`)
~~~~text
Epic: 5 (Main Story Campaign), Issue 5B
Depends on: Epic 4
Owns: games/gnome-theft-auto/src/quests/chapter2.ts

## Goal
Author Chapter 2's Cloverfield Farms and Mossy Wood quests (*"Dew Run on Route South"*, *"The Cloverfield Sprinkler Gauntlet"*, *"Vesper's Offer"*, and *"Whispers of the Unmowed"*).

## Read first
- docs/design/gnome-theft-auto/story.md: section 6 (Chapter 2) and section 9 (Quest 2 *"Dew Run on Route South"*).

## Change
- Create `games/gnome-theft-auto/src/quests/chapter2.ts` exporting `CHAPTER_2_QUESTS: readonly QuestDef[]`:
  1. `ch2-dew-run` (*"Dew Run on Route South"*): Granny Gnertrude (`cloverfield-barn`) tasks you with parking a Combine across the `south` highway bend (`[0, 260] -> [-40, 320]`), ambushing Vesper's Black Dew convoy (`convoy-ambush`), and delivering the lead Dew-Hauler to her barn to finish paying off your 5,000-Acorn Kiln-Debt.
  2. `ch2-sprinkler-gauntlet` (*"The Cloverfield Sprinkler Gauntlet"*): tow Granny's armored acorn silo to safety while dodging Reginald Vance's laser-level HOA squad.
  3. `ch2-vespers-offer` (*"Order Over Chaos"*): meet Vesper Thorne at a highway diner where he politely offers a Patio Heights penthouse for the Golden Acorn—and sends a 3-Hat ambush when you refuse.
  4. `ch2-unmowed-tablet` (*"The Cracked Tablet"*): track a missing shipment into Mossy Wood (`unmowed-hollow`), where Elder Bracken and Sorrel Tillbrook reveal on a cracked earthenware tablet that Vesper's Grand Combine is patterned after Fescue's original 3,000-year-old Mower.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 5C: Chapter 3 — *Cold Clay* (`games/gnome-theft-auto/src/quests/chapter3.ts`)
~~~~text
Epic: 5 (Main Story Campaign), Issue 5C
Depends on: Epic 4
Owns: games/gnome-theft-auto/src/quests/chapter3.ts

## Goal
Author Chapter 3's betrayal and Frostbite Fells exile arc (*"The Salvage Raid"*, *"Kiln-Resin & Black Ice"*, and *"Snail-Mail from the Under-Deck"*).

## Read first
- docs/design/gnome-theft-auto/story.md: section 6 (Chapter 3) and section 9 (Quest 5 *"Kiln-Resin & Black Ice"*).

## Change
- Create `games/gnome-theft-auto/src/quests/chapter3.ts` exporting `CHAPTER_3_QUESTS: readonly QuestDef[]`:
  1. `ch3-salvage-raid` (*"The Salvage Raid"*): a bribed Carburettor lieutenant sells out *Side-Valve Salvage*; Vesper's HOA squad seizes the Golden Acorn, Pip's clay arm cracks shielding your getaway, and you flee north up the `ring-nw` / `north` highway into Frostbite Fells (includes `bodegaCameo: true` cutaway as sirens pass John Bodega's window).
  2. `ch3-kiln-resin-ice` (*"Kiln-Resin & Black Ice"*): drive Pip to Father Loam at the Frozen Birdbath Basin (`(0, -350)`), survive a 90-second demolition derby (`survive-derby`) against 6 HOA snow-pursuit mowers while Loam mixes Kiln-Resin from the northern shrine (`(-30, -520)`) to glue Pip's arm back on.
  3. `ch3-tundra-drift-run` (*"Volatile on Ice"*): run an ice-packed Black Dew drift delivery across Frostbite Fells for the loyal Carburettors, ending with Shelldon's racing snail delivering Tansy's micro-scroll: *"Found the Stopping Stone. Meet me in the Dust Flats."*

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 5D: Chapter 4 — *Sandpit Protocol* (`games/gnome-theft-auto/src/quests/chapter4.ts`)
~~~~text
Epic: 5 (Main Story Campaign), Issue 5D
Depends on: Epic 4
Owns: games/gnome-theft-auto/src/quests/chapter4.ts

## Goal
Author Chapter 4's Dust Flats military heist arc (*"Runway Flares"*, *"The Sandpit Drop"*, and *"Nobody Fires the Guard"*).

## Read first
- docs/design/gnome-theft-auto/story.md: section 6 (Chapter 4) and section 9 (Quest 3 *"The Sandpit Drop"*).

## Change
- Create `games/gnome-theft-auto/src/quests/chapter4.ts` exporting `CHAPTER_4_QUESTS: readonly QuestDef[]`:
  1. `ch4-runway-flares` (*"Runway Flares"*): infiltrate the Desert Airfield (`AIRFIELD`, `x: 480, z: -110`) past Wind-Sock Wally, steal a **Crop Duster** (`plane`), take off above stall speed (`22`), and fly low over the Dust Flats to signal the Unmowed's covert team.
  2. `ch4-sandpit-drop` (*"The Sandpit Drop"*): fly west over **Fort Sandpit** (`BASE`), bail out at altitude under your automatic parachute (`air-drop`), land on the Whirligig pad (`padX: 358, padZ: -8`), lift **The Whirligig** under 3-Hat Heat, and escape to the Dust Flats overlook (`achievement: 'gta-mid-air-jack'`).
  3. `ch4-spade-truce` (*"Nobody Fires the Guard"*): Commander Diggs pursues you on a Zero-Turn until Vesper remotely locks Fort Sandpit's armory and declares the Spade Guard "redundant"—forging an alliance between Diggs, Tansy, Pip, and the Unmowed.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 5E: Chapter 5 — *The Even Cut* Finale & Epilogue (`games/gnome-theft-auto/src/quests/chapter5.ts`)
~~~~text
Epic: 5 (Main Story Campaign), Issue 5E
Depends on: Epic 4
Owns: games/gnome-theft-auto/src/quests/chapter5.ts

## Goal
Author Chapter 5's multi-phase finale (*"The HOA Tribunal Ambush"*, *"The Even Cut"*, and the Ending A / Ending B player choice + Club Gnome epilogue text).

## Read first
- docs/design/gnome-theft-auto/story.md: section 6 (Chapter 5) and section 9 (Quest 6 *"The Even Cut"*).

## Change
- Create `games/gnome-theft-auto/src/quests/chapter5.ts` exporting `CHAPTER_5_QUESTS: readonly QuestDef[]`:
  1. `ch5-even-cut` (*"The Even Cut"*):
     - Briefing at the Dust Flats safehouse with Tansy, Pip, Granny Gnertrude, and Commander Diggs (with `bodegaCameo: true` showing John Bodega and Asphalt watching the shadow of the Grand Combine roll toward downtown).
     - Phase 1 (`air-drop`): pilot the **Whirligig** or **Crop Duster** down `x = 0` to strafe Vesper's escort vans and parachute onto the moving **Grand Combine**'s roof deck.
     - Phase 2 (`boss-combine`): battle Vesper's Porcelain Guard across the deck, defeat Vesper's gilded Lawn-Throne mech-mower, and slam the **Fescue Stopping Stone** into the main intake maw as the machine tips into the Southern Drainage Canal.
     - Phase 3 (`choice`):
       - **Ending A — The Unmowed Monument:** leave the Golden Acorn jammed inside the Combine and let wild clover reclaim downtown's scar with Elder Bracken and Councilwoman Vance.
       - **Ending B — Turfton Rewired:** pull the Golden Acorn back out for Tansy and the Carburettors to power Turfton's neon grid and midnight races.
     - Unlocks `achievement: 'gta-even-cut'` and toasts the epilogue buzz from **Club Gnome**: *"Heard you're good with heavy machinery. Need a guy for a bowling alley."*

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 5F: Story Givers & Campaign Registry (`games/gnome-theft-auto/src/quests/defs.ts`)
~~~~text
Epic: 5 (Main Story Campaign), Issue 5F
Depends on: Epic 4
Owns: games/gnome-theft-auto/src/quests/defs.ts

## Goal
Register all story and side-quest givers (`GIVERS`) across the five biomes and assemble the campaign quest list in `src/quests/defs.ts`.

## Read first
- games/gnome-theft-auto/src/quests/defs.ts: existing `GIVERS` and `QUESTS`.
- docs/design/gnome-theft-auto/story.md: giver locations for Pip, Tansy, Don Compost, Granny Gnertrude, Elder Bracken, Father Loam, Commander Diggs, and the 11 Strangers & Freaks.

## Change
- In `games/gnome-theft-auto/src/quests/defs.ts`:
  - Expand `GIVERS` with:
    - `'pip-spawn'` (Pip Potsworth at `(-10, 18)`)
    - `'mulch-club'` (Don Compost at `(-16, -30)`)
    - `'side-valve'` (Tansy Clayfoot at `(-120, 48)`)
    - `'city-hall'` (Councilwoman Juniper Vance at `(0, -72)`)
    - `'cloverfield-barn'` (Granny Gnertrude at `(-25, 330)`)
    - `'unmowed-hollow'` (Elder Bracken at `(-350, 40)`)
    - `'fells-basin'` (Father Loam at `(0, -340)`)
    - `'dust-overlook'` (Commander Diggs / Crew at `(280, 40)`)
    - `'strangers'` (Strangers & Freaks markers for Mossley, Clara, Burt, Driftwood, Cedric, Farmer Bramble, Shelldon, Baroness Brenda, Big Lou).
  - Combine `CHAPTER_1_QUESTS` through `CHAPTER_5_QUESTS` into `QUESTS` while preserving `first-contract` ID compatibility for existing saves and tests.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

---

## Epic 6: Strangers & Freaks (11 Side Quests), Radio Bulletins, Achievements & Party Slice

Completes the 11 lore-enriched side quests from `story.md` §8, expands **Turfton FM** (`src/radio/content.ts`) and `docs/lore/entries/apocrypha/` with story & 4-Hat HOA broadcasts, registers all new achievements + cosmetic gear rewards, wires everything into `main.ts`, and surfaces the `gta-getaway` `@lawn/party` slice.

### Issue 6A: Strangers & Freaks — All 11 Side Quests (`games/gnome-theft-auto/src/quests/sideQuests.ts`)
~~~~text
Epic: 6 (Side Quests, Radio, Achievements & Slice), Issue 6A
Depends on: Epic 4, Epic 5
Owns: games/gnome-theft-auto/src/quests/sideQuests.ts

## Goal
Implement all 11 lore-enriched side quests (*Strangers & Freaks of Turfton*) from `docs/design/gnome-theft-auto/story.md` §8 and export `SIDE_QUESTS: readonly QuestDef[]` (imported by `defs.ts`).

## Read first
- docs/design/gnome-theft-auto/story.md: section 8 (Side Quests 1–11).

## Change
- Create `games/gnome-theft-auto/src/quests/sideQuests.ts` exporting `SIDE_QUESTS: readonly QuestDef[]`:
  1. `sq-grid-truthers` (*"The Grid Truthers"* — Mossley "Plumb-Line" Inkcap): visit 4 survey markers while dodging Watch patrols to uncover the buried `tall-one-pencil` under `(0, 0)`.
  2. `sq-porcelain-blues` (*"Porcelain Blues"* — Clara near the Tall House Porch): recover 3 stolen `porcelain-lantern`s from HOA scavengers before nightfall.
  3. `sq-fescue-fugitive` (*"The Fescue Fugitive"* — Elder Bracken): steal back the Replica Stopping Stone Vesper is using as a doorstop in Patio Heights, then choose (`choice`) whether to return it to Bracken or fence it to Granny Gnertrude.
  4. `sq-hoa-audit` (*"The HOA Audit"* — Burt): crack/repo 5 petty HOA citation vans across the biomes (citing a cactus for unruly needles and a snowman for seasonal height).
  5. `sq-castaway-drydock` (*"Castaway's Dry-Dock"* — Driftwood): drive a Combine to haul Driftwood's lawn-boat trailer across Cloverfield to the Southern Drainage Canal.
  6. `sq-mulch-pyramid` (*"The Mulch Pyramid Scheme"* — Cedric "Double-Bag" Peat): deliver and then hastily repo 3 pallets of wasp-attracting "Artisanal Miracle Mulch", unlocking the `mulch-spreader`.
  7. `sq-biscuit-hotdog` (*"Biscuit's Lost Squeaky Toy"* — Farmer Bramble): winch the bus-sized `squeaky-hotdog-giant` out of Biscuit's Nap crater with a Combine; every bump squeaks and panics nearby NPCs (`poseHandsUp`).
  8. `sq-snail-rigging` (*"Snail-Racing Rigging"* — Shelldon "No-Trail" Mucilage): swap rival espresso-fed slugs' lettuce for decaf dandelion greens in a downtown alley and cover your escape (`achievement: 'gta-snail-saboteur'`).
  9. `sq-porcelain-support` (*"The Porcelain Support Group"* — Clara): chauffeur 4 fragile porcelain refugees in a shock-absorbed `lowrider` (`maxDamage: 0.15`) to a moss bunker without chipping their glaze.
  10. `sq-hose-revolt` (*"The Great Hose-Pipe Tax Revolt"* — Baroness Brenda): kink 4 pressurized garden hoses across Turfton to flood Patio Heights, triggering an instant **4-Hat HOA Van** response (`achievement: 'gta-turf-violator'`).
  11. `sq-big-lou-embargo` (*"Big Lou's Wet-Hat Embargo"* — Big Lou outside The Gnomecino): recover VIP microfiber hat-towels from Red Cap hooligans and chauffeur a high-roller bowler across downtown in a Zero-Turn (`achievement: 'gta-dry-bone'`).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
~~~~

### Issue 6B: Turfton FM Story Bulletins, Adverts & Lore Rulings (`games/gnome-theft-auto/src/radio/content.ts`, `docs/lore/`)
~~~~text
Epic: 6 (Side Quests, Radio, Achievements & Slice), Issue 6B
Depends on: Epic 5
Owns: games/gnome-theft-auto/src/radio/content.ts, games/gnome-theft-auto/src/radio/schedule.test.ts, docs/lore/rulings.md

## Goal
Expand `src/radio/content.ts` with 4-Hat ("THE HOA") breaking-news bulletins, post-chapter/quest news bulletins for Chapters 1–5 and the 11 side quests, and additional celebrity/brand spots from `society.md` & `brands.md`. Record the updated 4-Hat ruling in `docs/lore/rulings.md`.

## Read first
- games/gnome-theft-auto/src/radio/content.ts & `src/radio/schedule.test.ts`: existing `STATIONS`, `ADS`, `HEAT_BULLETINS`, `EVENT_BULLETINS`, and the no-soaking / house-style content tests.
- docs/lore/rulings.md: R-028 (which noted 4-Hat HOA vans and chapter bulletins were not built yet).
- docs/design/gnome-theft-auto/society.md: Mayor Mulch, Juniper Vance, "Big Wrench" Grout, Vinnie "Turbo-Sod" Delacroix, Glenda "Matte-Finish" Clay, Sir Reginald "Left-Click" Clayfoot.

## Change
- In `docs/lore/rulings.md`:
  - Append a new ruling (`R-033`) amending R-028 now that 4-Hat HOA Code-Enforcement Vans and the 5-chapter story campaign are in the game.
- In `games/gnome-theft-auto/src/radio/content.ts`:
  - Add level `4` to `HEAT_BULLETINS` covering the HOA Code-Enforcement Van and Reginald Vance's megaphone citations.
  - Add `EVENT_BULLETINS` keys for every new story achievement and chapter finale (`gta-fresh-kiln`, `gta-boot-legger`, `gta-turf-violator`, `gta-mid-air-jack`, `gta-snail-saboteur`, `gta-dry-bone`, `gta-even-cut`, plus chapter completions) in the voices of Dock Hoewright, Lawn-Dart, Sorrel Tillbrook, and Cress Caliper.
  - Add celebrity gossip and union banter lines referencing Vinnie "Turbo-Sod" Delacroix, Glenda "Matte-Finish" Clay, Sir Reginald "Left-Click" Clayfoot, and Local 404 Boss "Big Wrench" Grout.
- Update `games/gnome-theft-auto/src/radio/schedule.test.ts` to verify all new lines pass the R-021 clay/no-gore/no-wetness check.

## Done when
- `npm test -w games/gnome-theft-auto` and `npm run lore` pass.
~~~~

### Issue 6C: Story Achievements & Cosmetic Gear Rewards (`packages/achievements/src/catalog.ts`)
~~~~text
Epic: 6 (Side Quests, Radio, Achievements & Slice), Issue 6C
Depends on: Epic 1B (prefab ids fixed in 1B)
Owns: packages/achievements/src/catalog.ts

## Goal
Add the 7 new story and side-quest achievements with their `@lawn/prefabs` cosmetic gear rewards from `docs/design/gnome-theft-auto/story.md` §11 to `packages/achievements/src/catalog.ts`.

## Read first
- docs/design/gnome-theft-auto/story.md: section 11 (New `@lawn/achievements` table).
- packages/achievements/src/catalog.ts: existing `gta-*` entries (lines 401–475).

## Change
- In `packages/achievements/src/catalog.ts`, add under `// ---- Gnome Theft Auto ----`:
  1. `gta-fresh-kiln`: **Fresh Out the Kiln** — *"Complete the Prologue and reach Side-Valve Salvage."* Reward: `{ slot: 'back', prefabId: 'tansy-apron', label: "Tansy's Grease-Stained Apron" }`.
  2. `gta-boot-legger`: **Boot-Legger** — *"Hijack Gnorwin's Boot Parade Float and crash the HOA Tribunal."* Reward: `{ slot: 'head', prefabId: 'mini-boot-hat', label: 'Mini Boot Hat' }`.
  3. `gta-turf-violator`: **Turf-Code Violator** — *"Trigger 4-Hat (THE HOA) heat and smash a Code-Enforcement Van."* Reward: `{ slot: 'hand', prefabId: 'brass-calipers', label: 'Broken Brass Calipers' }`.
  4. `gta-mid-air-jack`: **Mid-Air Mower-Jack** — *"Bail out of a Crop Duster over Fort Sandpit and lift the Whirligig."* Reward: `{ slot: 'head', prefabId: 'flight-goggles', label: 'Aviator Acorn Goggles' }`.
  5. `gta-snail-saboteur`: **Snail-Mail Saboteur** — *"Rig the underground alley snail races for Shelldon."* Reward: `{ slot: 'head', prefabId: 'tinfoil-brim', label: 'Tinfoil Conspiracy Brim' }`.
  6. `gta-dry-bone`: **Dry as a Bone** — *"Deliver Big Lou's VIP bowler without chipping the ride."* Reward: `{ slot: 'head', prefabId: 'microfiber-bowler', label: 'Microfiber Bowler' }`.
  7. `gta-even-cut`: **The Even Cut** — *"Jam the Grand Combine with the Stopping Stone and finish Chapter 5."* Reward: `{ slot: 'neck', prefabId: 'stopping-stone-charm', label: 'Golden Stopping-Stone Charm' }`.

## Done when
- `npm test -w packages/achievements` passes.
~~~~

### Issue 6D: Party Slice — `gta-getaway` (`games/gnome-theft-auto/src/minigames/`)
~~~~text
Epic: 6 (Side Quests, Radio, Achievements & Slice), Issue 6D
Depends on: Epic 3
Owns: games/gnome-theft-auto/src/minigames/gta-getaway.ts, games/gnome-theft-auto/src/minigames/index.ts, games/gnome-theft-auto/src/minigames/minigames.test.ts, games/gnome-theft-auto/src/minigames/play.ts, packages/party/README.md

## Goal
Implement the `gta-getaway` `@lawn/party` slice described in `packages/party/README.md` (`45 s getaway: four gnomes each boost a Zero-Turn from the Gnomecino kerb and race through Turfton checkpoints to Pay 'n' Glaze while Hat Watch cruisers try to bump them`), reusing the game's pure vehicle step and world road visuals.

## Read first
- packages/party/README.md: size rules (20–60s, one verb: steer, 4 seats at once, < 2 KB JSON state, `testMinigame(def)` contract).
- games/gnome-theft-auto/src/vehicles.ts: `stepVehicle`, `collideVehicles`.

## Change
- Create `games/gnome-theft-auto/src/minigames/gta-getaway.ts`, `index.ts`, `play.ts`, and `minigames.test.ts`:
  - 4 seats start in tinted Zero-Turn Racers outside *The Gnomecino* with auto-throttle; one verb (`pad.dir.x` steers, button triggers a brief handbrake drift).
  - Race through 5 downtown & Greenhouse Strip checkpoint rings into *Pay 'n' Glaze* while 3 AI Hat Watch cruisers patrol the intersections (`collideVehicles` trades momentum).
  - Rank by checkpoints cleared, then finish time (`report()` lists `Checkpoints` and `Time`).
- Update the `gta-getaway` row in `packages/party/README.md` from `later` to `building`.

## Done when
- `npm test -w games/gnome-theft-auto` (including `testMinigame`) passes.
~~~~

### Issue 6E: Main Loop Wiring, README &AGENT_INDEX Update (`games/gnome-theft-auto/src/main.ts`, `README.md`, `AGENT_INDEX.md`)
~~~~text
Epic: 6 (Side Quests, Radio, Achievements & Slice), Issue 6E
Depends on: Issues 6A–6D
Owns: games/gnome-theft-auto/src/main.ts, games/gnome-theft-auto/README.md, AGENT_INDEX.md

## Goal
Wire `vibeNpcs`, `easterEggs`, `economy`, `garages`, `worldEvents`, the expanded `quests` and `weapons`, and the `#minigame` entry check into `src/main.ts`, and document the new story, brands, garages, and party slice in `README.md` and `AGENT_INDEX.md`.

## Read first
- games/gnome-theft-auto/src/main.ts: frame loop, HUD state update, `window.__gta` debug hooks.
- games/gnome-theft-auto/README.md & `AGENT_INDEX.md`.

## Change
- In `games/gnome-theft-auto/src/main.ts`:
  - Support `#minigame` hash delegation to `./minigames/play` (`playOwnSlice()`).
  - Instantiate and step `vibeNpcs`, `easterEggs`, `economy`, `garages`, and `worldEvents` in `frame()`.
  - Pass `economy.state().acorns` and `economy.state().debtRemaining` to `hud.set(...)`.
  - On `wakeAtHospital()`, call `economy.chargeHospital()` and toast the *Kiln-Shield: CLAIM DENIED* receipt.
  - Expose `economy`, `garages`, `vibeNpcs`, `easterEggs`, `worldEvents`, and `quests` on `window.__gta` when `?debug` is set.
- Update `games/gnome-theft-auto/README.md` and the `gnome-theft-auto` row in `AGENT_INDEX.md` to reflect the 5-chapter story, 11 side quests, brands/billboards, Pay 'n' Glaze & Side-Valve tuning garages, new weapons/vehicles, 4-Hat HOA Van, and `gta-getaway` party slice.

## Done when
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore`, and `bash tools/smoke.sh http://localhost:5198/ game ui gta-hud` all pass.
~~~~
