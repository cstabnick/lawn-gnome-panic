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
  map: boolean;                   // edge: open or close the world map
  trainer?: boolean;              // edge: toggle admin trainer (F9)
  radio?: boolean;                // edge: toggle/tune portable radio (R)
}
export interface TouchSource { root: HTMLElement; read(): Partial<InputState>; setVisible(on: boolean): void; setClimbHint(on: boolean): void; active(): boolean }
export interface Input { read(dt: number): InputState; setPointerLockAllowed(allowed: boolean): void }
export interface CameraRig { yaw: number; pitch: number; view: 'third' | 'first'; close: boolean; update(target: THREE.Vector3, input: InputState, dt: number, crouched: boolean): void }

export interface Clock {
  sunHours: number; hourOfDay: number; day: number; night: boolean; light: number; season: Season; rate: number;
  update(dt: number): number;     // returns sun-hours advanced this frame
  setRate(rate: number): void;    // 1 = normal; sleeping uses more
}

export interface PlayerState {
  pos: THREE.Vector3; vel: THREE.Vector3; facing: number;  // facing: yaw, model faces +z at 0; forward = (sin f, 0, cos f)
  grounded: boolean; stance: Stance; sprinting: boolean;
  stamina: number;                                         // 0..STAMINA.max (200)
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
export interface PlayerViewOpts { held: ItemId | null; back: ItemId | null; head: ItemId | null; hatSlips: boolean; dead: boolean; close?: boolean }
export interface PlayerView { model: GnomeModel; update(p: PlayerState, dt: number, opts: PlayerViewOpts): void; triggerAttack(hit?: boolean): void }
export interface WorldView { root: THREE.Group; containerObjects: Map<string, THREE.Object3D>; addRoute(route: ClimbRouteDef, fromY: number, topY: number): void; setContainerOpened(id: string): void; update(focus: Vec3): void }
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

export type RecipeId = 'campfire' | 'salt-wash' | 'spirit-wash' | 'scrape-seal' | 'boil-water' | 'mend-glaze'
  | 'roast-apple' | 'mushroom-skewer' | 'hearth-stew' | 'spiced-cider'
  | 'cord' | 'rope-coil' | 'torch' | 'acorn-club' | 'toadstool-stew' | 'smoked-fish' | 'charcoal' | 'acorn-flour' | 'plank' | 'ladder'
  | 'water-filter' | 'clay-jar' | 'glaze-pot' | 'nails' | 'iron-trowel';
export type Station = 'hand' | 'fire' | 'workbench' | 'kiln' | 'anvil';
export interface RecipeDef { id: RecipeId; name: string; inputs: { tag: Tag; count: number }[]; water: number; tool: Tag | null; seconds: number; needsFire: boolean;
  station?: Station; skill?: { id: SkillId; level: number }; items?: { def: ItemId; count: number }[]; output?: { def: ItemId; count: number } }
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
  acorns?: number; quest?: string | null; net?: string | null;
}
export interface Hud { root: HTMLElement; update(s: HudState): void; prompt(text: string | null): void; toast(text: string, seconds?: number): void }

export interface HatlessSystem {
  spawn(region: RegionId, count: number, spots: readonly SpotDef[], from?: { x: number; z: number }): void;
  despawnAll(): number;                             // removes every L0 Hatless, returns how many were alive
  pruneOutside(keepRegions: ReadonlySet<RegionId>, playerPos: Vec3, maxDist: number): number;
  countInRegion(region: RegionId): number;
  update(dt: number, ctx: { night: boolean; fog: boolean }): void;
  strike(origin: Vec3, facing: number, reach: number, damage: number): number; // hits landed
  aliveCount(): number;
  nearCount(pos: Vec3, radius: number): number;
  nearestPos?(pos: Vec3, radius: number): Vec3 | null;
  exportState(): HatlessNet[];                      // roadmap 4.11 (phases 4-8): the owner's Hatless for viewers
  applyRemote(list: readonly HatlessNet[]): void;   // viewers: puppets driven by the owner's list
  setAuthority(owner: boolean): void;               // false = puppets, no AI; strike queues the hit instead
  drainStrikes(): { x: number; y: number; z: number; f: number; reach: number; dmg: number }[];
  setExtraTargets(fn: (() => { key: string; pos: Vec3 }[]) | null): void;
  onRemoteScratch(fn: (key: string, strength: number, from: { x: number; z: number }) => void): void;
  setNpcTargets?(fn: (() => { key: string; pos: Vec3 }[]) | null): void;
  onNpcScratch?(fn: (key: string, strength: number, from: { x: number; z: number }) => void): void;
  setHazards(fn: ((x: number, z: number) => number) | null): void;   // damage per second at a point
}
export interface NpcActors {
  show(npcs: readonly { id: NpcId; name: string; lookSeed: number }[], spots: readonly SpotDef[]): void;
  remove(id: NpcId): void;
  clear(): void;
  update(dt: number): void;
  ids(): NpcId[];
  nearest(pos: Vec3, radius: number): NpcId | null;
  positionOf(id: NpcId): Vec3 | null;
  combatTargets?(): { key: string; pos: Vec3 }[];
  receiveHit?(key: string, strength: number, from: { x: number; z: number }): void;
  setHatless?(h: HatlessSystem): void;
  onFallen?(fn: (id: NpcId, name: string) => void): void;
}
export interface SimFeed { update(dt: number, sunHoursAdvanced: number): void; promoted(): RegionId | null }
export interface CampSystem { update(dt: number, sunHours: number, weather: WeatherState): void; placeFire(x: number, y: number, z: number, burnHours: number): boolean; nearFire(pos: Vec3): boolean; firesLit(): number; sleeping(): boolean }
export interface ContainerSystem { update(dt: number): void }
export interface EventLog { lines(seconds: number): string[]; stats(): { hatlessDestroyed: number; containersSearched: number; climbs: number } }
export interface Recap { show(cause: DeathCause, where: string | null, day: number, hourOfDay: number): void; onRise(fn: (at: HavenId) => void): void; hide(): void }

import type { ActionEnvelope, ActionResult, BoardId, PieceKind, PlayerKey, Quest, QuestId, SimAction, SkillId, TickResult, WorldState } from '../sim/types';
import type { Streams } from '../sim/rng';
import type { DaygMsg, Snapshot } from '../net/protocol';

/** s: 0 idle, 1 walk, 2 lunge, 3 down (crumbling). id is stable while the Hatless exists. */
export interface HatlessNet { id: number; x: number; y: number; z: number; f: number; s: 0 | 1 | 2 | 3 }
export type SimRole = 'solo' | 'host' | 'guest';
export interface SimHost {
  readonly world: WorldState;          // the main-thread replica; the object is never replaced (fields are reassigned)
  readonly streams: Streams;           // the same object; its Rng fields are replaced after a worker step
  readonly role: SimRole;
  readonly me: PlayerKey;
  setRole(role: SimRole, me: PlayerKey): void;
  setOutbox(fn: ((a: SimAction) => void) | null): void;   // guest: apply() hands actions to it
  apply(a: SimAction): ActionResult | null;               // solo/host: sequence and apply now; guest: send, return null
  applyFor(player: PlayerKey, a: SimAction): ActionResult; // solo/host: sequence an action on behalf of another player (a guest's 'act')
  receive(env: ActionEnvelope): ActionResult;             // apply an envelope the host sequenced (guests, replays)
  update(sunHours: number): void;                         // solo/host: tick while Math.floor(sunHours) > world.tick
  receiveTick(tick: number, hash: string): void;          // guest: tick up to `tick`, compare the hash
  onTick(fn: (r: TickResult & { desync: boolean }) => void): () => void;
  onAction(fn: (env: ActionEnvelope, r: ActionResult) => void): () => void;
  log(): readonly ActionEnvelope[];                       // envelopes applied since the last snapshot() or load()
  snapshot(): Snapshot;                                   // clears log()
  load(s: Snapshot): void;                                // replaces the replica in place, replays s.log, emits onTick
  busy(): boolean;                                        // a worker step is in flight
}
export interface TalkPanel { root: HTMLElement; open(npc: NpcId): void; close(): void; isOpen(): boolean }
export type LedgerTab = 'people' | 'stories' | 'lore' | 'collectibles' | 'factions' | 'quests' | 'skills';
export interface LedgerPanel { root: HTMLElement; open(tab?: LedgerTab): void; close(): void; toggle(): void; isOpen(): boolean }
export interface BoardPanel { root: HTMLElement; open(board: BoardId): void; close(): void; isOpen(): boolean }
export interface BoardsInWorld { boardNear(pos: Vec3): BoardId | null }
export interface QuestRunner { update(dt: number): void; active(): Quest[]; tracked(): Quest | null; track(id: QuestId | null): void }
export interface RoomChoice { mode: 'solo' | 'create' | 'join' | 'reopen'; code: string | null; title: string; pace: 'brisk' | 'standard' | 'slow'; roomMode: 'full' | 'haven-peace' | 'co-op'; lootRespawn?: boolean }
export interface RoomListItem { code: string; title: string; summary: string; updatedAt: string }
export interface RoomPanel { root: HTMLElement; open(): void; close(): void; isOpen(): boolean; onChoose(fn: (c: RoomChoice) => void): void; onOpen(fn: () => void): void; onSaveNow?(fn: () => void): void; setWorlds(list: readonly RoomListItem[]): void; setStatus(text: string): void }
export type NetStatus = 'offline' | 'connecting' | 'host' | 'guest' | 'lost';
export interface NetPlayer { id: number; key: PlayerKey; name: string; character: string; userId: string | null; color: number }
export interface NetSession {
  readonly status: NetStatus; readonly code: string | null; readonly myId: number | null;
  players(): NetPlayer[];
  start(c: RoomChoice, me: { name: string; character: string }): Promise<void>;
  leave(): void;
  update(dt: number): void;
  send(to: number | null, m: DaygMsg): void;
  onStatus(fn: (s: NetStatus) => void): () => void;
  onMessage(fn: (from: number, m: DaygMsg) => void): () => void;
  keyOf(id: number): PlayerKey | null; idOf(key: PlayerKey): number | null;
}
export interface RemotePlayers { update(dt: number): void; count(): number }
export interface BubbleSync { update(dt: number): void }
export interface RoomSaver { update(dt: number): void; saveNow(reason: 'timer' | 'handoff' | 'leave'): Promise<boolean>; lastSaved(): number | null }
export interface SkillSystem {
  xp: Record<SkillId, number>;
  level(s: SkillId): number;
  gain(s: SkillId, kind: 'easy' | 'hard' | 'fail', mul?: number): void;
  timeMul(s: SkillId): number;                   // 1 - 0.08 x level
  failChance(s: SkillId, need: number): number;  // 0.1 x max(0, need - level)
  load(xp: Partial<Record<SkillId, number>>): void;
  onLevel(fn: (s: SkillId, level: number) => void): () => void;
}
export interface BuildSystem { update(dt: number): void; start(kind: PieceKind): boolean; cancel(): void; placing(): PieceKind | null; confirm(): boolean; canAfford(kind: PieceKind): boolean }
export interface BuildPanel { root: HTMLElement; open(): void; close(): void; toggle(): void; isOpen(): boolean }
export interface FarmSystem { update(dt: number): void }
export interface TrapSystem { update(dt: number): void }
export interface LanternSystem { update(dt: number): void; litCount(): number }
export interface MowingFx { update(dt: number): void }
export interface PiecesView { update(dt: number): void }
export interface Respawner { respawn(at: HavenId): void }
export type DaygEvent =
  | { ev: 'dayg_session'; role: SimRole; players: number; map: string; minutes: number; quests: number; deaths: number }
  | { ev: 'dayg_day'; rh: string; seed: number; day: number; alive: number; start: number; hatless: number; factions: number; quests: number; food: number; price: number; players: number }
  | { ev: 'dayg_quest'; template: string; done: boolean; minutes: number }
  | { ev: 'dayg_death'; cause: string; region: string; minutes: number; unfair: boolean };
export interface Telemetry { record(e: DaygEvent): void; flush(): void }
