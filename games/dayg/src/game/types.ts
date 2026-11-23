import type * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import type { DeathCause, HavenId, ItemId, ItemStack, NpcId, RegionId, Season, TreatMethod, WeatherKind, WeatherState } from '../sim/types';
import type { ClimbRouteDef, SpotDef } from '../world/types';
import type { Tag, WornSlot, ItemDef } from '../items/defs';

export interface Vec3 { x: number; y: number; z: number }
export type Stance = 'stand' | 'crouch';
export type ClimbVia = 'route' | 'rope' | 'ladder';

export interface InputState {
  moveX: number; moveZ: number;   // -1..1; moveX +1 = right, moveZ +1 = forward
  lookX: number; lookY: number;   // radians this frame; lookX > 0 turns right, lookY > 0 looks down
  sprint: boolean;                // held
  crouch: boolean;                // edge: toggle stance
  action: boolean;                // edge: context action
  attack: boolean;                // edge: swing the held item
  climb: boolean;                 // edge: vault / climb / climb down
  inventory: boolean;             // edge: open or close the pack
  view: boolean;                  // edge: third / first person
}
export interface TouchSource { root: HTMLElement; read(): Partial<InputState>; setVisible(on: boolean): void; setClimbHint(on: boolean): void; active(): boolean }
export interface Input { read(dt: number): InputState; setPointerLockAllowed(allowed: boolean): void }
export interface CameraRig { yaw: number; pitch: number; view: 'third' | 'first'; update(target: THREE.Vector3, input: InputState, dt: number, crouched: boolean): void }

export interface Clock {
  sunHours: number; hourOfDay: number; day: number; night: boolean; light: number; season: Season; rate: number;
  update(dt: number): number;     // returns sun-hours advanced this frame
  setRate(rate: number): void;    // 1 = normal; sleeping uses more
}

export interface PlayerState {
  pos: THREE.Vector3; vel: THREE.Vector3; facing: number;  // facing: yaw, model faces +z at 0; forward = (sin f, 0, cos f)
  grounded: boolean; stance: Stance; sprinting: boolean;
  stamina: number;                                         // 0..100
  climbing: { topY: number; speed: number; via: ClimbVia; startY: number; down: boolean } | null;
  vaulting: number;                                        // seconds left in a vault
  fallFromY: number | null;
  speed: number;                                           // horizontal gm/s this frame
  noise: number;                                           // radius of the last step noise, gm
  region: RegionId | null; haven: HavenId | null;
  alive: boolean;
}
export interface MoveMods { speedMul: number; staminaRegenMul: number; canSprint: boolean; carryRatio: number; hasRope: boolean; hasLadder: boolean }
export interface ClimbHint { kind: 'vault' | 'route' | 'rope' | 'ladder' | 'too-high' | 'down'; height: number }
export interface PlayerController { update(p: PlayerState, input: InputState, yaw: number, dt: number, mods: MoveMods): void; climbHint(p: PlayerState, mods: MoveMods): ClimbHint | null }
export interface PlayerViewOpts { held: ItemId | null; back: ItemId | null; head: ItemId | null; hatSlips: boolean; dead: boolean }
export interface PlayerView { model: GnomeModel; update(p: PlayerState, dt: number, opts: PlayerViewOpts): void }
export interface WorldView { root: THREE.Group; containerObjects: Map<string, THREE.Object3D>; addRoute(route: ClimbRouteDef, fromY: number, topY: number): void; setContainerOpened(id: string): void }
export interface Sky { update(clock: Clock, weather: WeatherState, focus: THREE.Vector3, dt: number): void }

export interface Needs { warmth: number; water: number; food: number; calm: number }   // 0..100, 100 = fine
export interface NeedDamage { cause: 'cold' | 'thirst' | 'hunger'; perHour: number }
export interface NeedsEnv {
  night: boolean; weather: WeatherKind; tempC: number; nearFire: boolean; inHaven: boolean;
  hatlessNear: number; exertion: number; wet: number; altitude: number; infectionStage: InfectionStage | null;
}
export interface NeedsEffects { speedMul: number; staminaRegenMul: number; aimShake: number; damage: NeedDamage[] }
export interface NeedsSystem { state: Needs; update(sunHours: number, env: NeedsEnv): void; effects(): NeedsEffects; eat(def: ItemDef): void; drink(litres: number, clean: boolean): void }

export type BodyPart = 'head' | 'chest' | 'armL' | 'armR' | 'legL' | 'legR';
export const BODY_PARTS: readonly BodyPart[] = ['head', 'chest', 'armL', 'armR', 'legL', 'legR'];
export type CrackLevel = 0 | 1 | 2 | 3;      // none, chip, crack, deep crack
export type InfectionStage = 0 | 1 | 2 | 3;  // exposed, rooting, spreading, taking
export interface Infection { part: BodyPart; hours: number; stage: InfectionStage }
export interface BodyState { cracks: Record<BodyPart, CrackLevel>; glaze: number; wear: number; infection: Infection | null; shattered: boolean; cause: DeathCause | null }
export interface BodyEffects { limp: number; aimShake: number; hatSlips: boolean }
export interface BodySystem { state: BodyState; update(sunHours: number, env: { damage: NeedDamage[]; season: Season; wet: number }): void; effects(): BodyEffects; treat(method: TreatMethod): boolean; mend(): boolean }

export interface Inventory { hands: [ItemStack | null, ItemStack | null]; worn: Partial<Record<WornSlot, ItemStack>>; pack: ItemStack[] }
export type StackRef = { where: 'hand'; index: 0 | 1 } | { where: 'worn'; slot: WornSlot } | { where: 'pack'; index: number };
export interface InventorySystem {
  state: Inventory;
  add(stack: ItemStack): ItemStack | null;          // merges, then pack, then free hands; returns what did not fit, or null
  get(ref: StackRef): ItemStack | null;
  take(ref: StackRef, count: number): ItemStack | null;
  move(from: StackRef, to: StackRef): boolean;      // hold, wear, put away (swaps when the target is full)
  findTag(tag: Tag): StackRef | null;               // hands, then pack, then worn
  countTag(tag: Tag): number;
  consumeTag(tag: Tag, count: number): boolean;     // all or nothing
  held(): ItemStack | null;                         // hands[0]
  weight(): number; carryCapacity(): number; bulkUsed(): number; bulkCapacity(): number;
  cleanWater(): number;                             // litres: clean liquid in HOLD_LIQUID stacks + 0.5 per DRINK item
  useWater(litres: number): number;                 // removes clean water (liquid first, then whole DRINK items), returns litres removed
  fillLiquid(kind: 'clean' | 'dirty', litres: number): number; // into empty or same-kind HOLD_LIQUID stacks; returns litres stored
  onChange(fn: () => void): () => void;
}

export type RecipeId = 'campfire' | 'salt-wash' | 'spirit-wash' | 'scrape-seal' | 'boil-water' | 'mend-glaze';
export interface RecipeDef { id: RecipeId; name: string; inputs: { tag: Tag; count: number }[]; water: number; tool: Tag | null; seconds: number; needsFire: boolean }
export interface UseAction { id: string; label: string; seconds: number; kind: 'eat' | 'drink' | 'wear' | 'unwear' | 'hold' | 'stow' | 'drop' | 'recipe'; ref?: StackRef; recipe?: RecipeId }
export interface UseApi {
  actionsFor(ref: StackRef): UseAction[];
  recipes(): { def: RecipeDef; ok: boolean; why: string | null }[];
  start(action: UseAction): boolean;
  update(dt: number): void;
  busy(): { label: string; progress: number } | null;
  cancel(): void;
}
export interface InventoryPanel { root: HTMLElement; toggle(): void; open(): void; close(): void; isOpen(): boolean; showLoot(title: string, items: ItemStack[], onTake: (index: number) => void): void }
export interface HudState {
  needs: Needs; stamina: number; body: BodyState; hourOfDay: number; day: number; night: boolean; season: Season;
  weather: WeatherKind; regionName: string | null; haven: HavenId | null; stance: Stance;
  busy: { label: string; progress: number } | null; carry: { weight: number; capacity: number };
}
export interface Hud { root: HTMLElement; update(s: HudState): void; prompt(text: string | null): void; toast(text: string, seconds?: number): void }

export interface HatlessSystem {
  spawn(region: RegionId, count: number, spots: readonly SpotDef[], from?: { x: number; z: number }): void;
  despawnAll(): number;                             // removes every L0 Hatless, returns how many were alive
  update(dt: number, ctx: { night: boolean; fog: boolean }): void;
  strike(origin: Vec3, facing: number, reach: number, damage: number): number; // hits landed
  aliveCount(): number;
  nearCount(pos: Vec3, radius: number): number;
}
export interface NpcActors { show(npcs: readonly { id: NpcId; name: string; lookSeed: number }[], spots: readonly SpotDef[]): void; remove(id: NpcId): void; clear(): void; update(dt: number): void; ids(): NpcId[] }
export interface SimFeed { update(dt: number, sunHoursAdvanced: number): void; promoted(): RegionId | null }
export interface CampSystem { update(dt: number, sunHours: number, weather: WeatherState): void; placeFire(x: number, y: number, z: number, burnHours: number): boolean; nearFire(pos: Vec3): boolean; firesLit(): number; sleeping(): boolean }
export interface ContainerSystem { update(dt: number): void }
export interface EventLog { lines(seconds: number): string[]; stats(): { hatlessDestroyed: number; containersSearched: number; climbs: number } }
export interface Recap { show(cause: DeathCause, where: string | null, day: number, hourOfDay: number): void }
