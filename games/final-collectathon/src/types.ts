// The Final Collectathon: every shared type. This file is the contract between modules; change it only in the plan.
import type * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { AchievementTracker } from '@lawn/achievements';

export type ChapterId = 'prologue' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ending';
export type FloorId = 'lobby' | 'f1' | 'f2' | 'f3' | 'f4' | 'sky';
export type ItemKind = 'acorn' | 'golden-acorn' | 'clip' | 'sticky' | 'button' | 'token' | 'star' | 'badge' | 'anything';
export type Speaker = 'narrator' | 'secretary' | 'player' | 'coworker' | 'pa';
export type TrackId = 'hold-music' | 'synergy-loop' | 'shellshore';
export type SfxName = 'ui' | 'ding' | 'door' | 'toast' | 'whoosh' | 'thud' | 'denied' | 'fanfare' | 'stamp';
export type EggId =
  | 'shortest-interview' | 'nameplate' | 'skip-tutorial' | 'do-not-collect'
  | 'water-cooler' | 'photocopier' | 'arcade-cabinet' | 'basement';
export type AchievementId =
  | 'collectathon-hello' | 'collectathon-clip-art' | 'collectathon-employee-of-the-month'
  | 'collectathon-the-point' | 'collectathon-not-taking-it' | 'collectathon-easter-eggs';
export type MoveMode = 'walk' | 'locked' | 'fly';
export type CameraMode = 'follow' | 'close' | 'wide' | 'sky';

export interface Vec2 { x: number; z: number }
/** A rectangle on the floor plane, x0 < x1, z0 < z1, world metres. */
export interface Rect { x0: number; z0: number; x1: number; z1: number }
/** Axis-aligned solid box, world metres. */
export interface Box { min: [number, number, number]; max: [number, number, number] }

// ---------- collecting (pure, collect.ts) ----------
export interface Item {
  id: number;
  kind: ItemKind;
  x: number; y: number; z: number;
  /** Vertical speed; only used while falling (rain). */
  vy: number;
  falling: boolean;
  /** Prefab shown instead of ITEM_KINDS[kind].prefab (Chapter 4's furniture). */
  prefab?: string;
}
export interface Pickup { id: number; kind: ItemKind; x: number; y: number; z: number; amount: number; by: number; prefab?: string }
export interface CollectState {
  t: number;
  nextId: number;
  /** mulberry32 state; advanced by rand(). */
  seed: number;
  items: Item[];
  counts: Record<ItemKind, number>;
  /** Everything ever collected (amounts summed). */
  total: number;
  /** Each pickup adds ITEM_KINDS[kind].value * multiplier. */
  multiplier: number;
  /** Pickup radius in metres (xz distance). */
  magnet: number;
}

// ---------- walking (pure, walk.ts) ----------
export interface Walker {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  /** Yaw; the gnome model faces +z at 0. */
  facing: number;
  grounded: boolean;
  jumpsUsed: number;
}

// ---------- floors (office.ts, floors/*.ts, sky.ts) ----------
export interface PropPlacement {
  prefab: string;
  x: number; z: number;
  /** Height of the prefab's base (on a desk top). Default 0. */
  y?: number;
  /** Yaw in degrees. */
  rot?: number;
  scale?: number;
  tint?: number;
  /** Blocks the player: the builder adds a collider from the prefab's bounding box. */
  solid?: boolean;
}
export interface NpcPlacement {
  id: string;
  x: number; z: number;
  /** Yaw in radians (0 faces +z, toward the camera). */
  facing: number;
  look: Partial<GnomeLook>;
  /** Shows a floating "z z z" and a slumped pose. */
  asleep?: boolean;
}
export interface Interactable { id: string; label: string; x: number; z: number; radius: number }
/** An interior wall from (x0,z0) to (x1,z1); it must be axis-aligned. 3 m tall, 0.2 m thick. */
export interface WallSeg { x0: number; z0: number; x1: number; z1: number }
export interface FloorLayout {
  id: FloorId;
  /** Shown on the lift panel and in debug. */
  title: string;
  /** The floor spans x in [-w/2, w/2] and z in [-d/2, d/2]. The builder adds the four outer walls. */
  w: number; d: number;
  /** Colours 0xRRGGBB. */
  floorColor: number; wallColor: number;
  walls: WallSeg[];
  props: PropPlacement[];
  npcs: NpcPlacement[];
  spawn: { x: number; z: number; facing: number };
  /** The lift doors sit in the north outer wall (z = -d/2) centred at this x. Its interactable (id 'elevator') is added by the director. */
  elevatorX: number;
  /** Lobby only: the glass front doors in the south outer wall (z = +d/2) centred at this x. */
  frontDoorX?: number;
  /** Named rectangles used by chapters (spawning, area triggers). */
  areas: Record<string, Rect>;
  interactables: Interactable[];
  /** Window panes on the outer walls with sky behind (and Shellshore visible to the north). */
  windows?: boolean;
}
export interface Floor {
  id: FloorId;
  layout: FloorLayout;
  group: THREE.Group;
  colliders: Box[];
  /** One Object3D per layout.props entry, same order. */
  props: THREE.Object3D[];
  npcs: Record<string, GnomeModel>;
  /** Height of walkable ground at (x, z). Office floors: 0. */
  groundAt(x: number, z: number): number;
  update(dt: number): void;
  setElevatorOpen(open: boolean): void;
  setFrontDoorOpen(open: boolean): void;
  /** Hides layout prop `index` and drops its collider (Chapter 4 collects the furniture). */
  removeProp(index: number): void;
  dispose(): void;
}

// ---------- player (player.ts, camera.ts) ----------
export interface InputState {
  /** -1..1. +x is screen right, +z is screen down (toward the camera). */
  moveX: number; moveZ: number;
  jump: boolean;
  /** True on exactly one read() after a press. */
  jumpPressed: boolean;
  interactPressed: boolean;
}
export interface Input {
  read(): InputState;
  /** Shows the Interact button with this label ("Talk", "Use"), or hides it. */
  setInteract(label: string | null): void;
  /** false hides the joystick and buttons and makes read() return no movement. */
  setEnabled(on: boolean): void;
  dispose(): void;
}
export interface Player {
  readonly model: GnomeModel;
  readonly walker: Walker;
  /** Feet position, mirrored from walker every update. */
  readonly pos: THREE.Vector3;
  mode: MoveMode;
  update(dt: number, input: InputState, floor: Floor): void;
  teleport(x: number, y: number, z: number, facing: number): void;
  /** Scripted move in a straight line over `seconds` (ignores walls). In 'fly' mode the stick adds a sideways offset of up to 3 m. */
  moveTo(x: number, y: number, z: number, seconds: number): Promise<void>;
  lookAt(x: number, z: number): void;
}
export interface FollowCamera {
  update(dt: number, target: THREE.Vector3, mode: CameraMode): void;
  snap(target: THREE.Vector3, mode: CameraMode): void;
  shake(amount: number): void;
}

// ---------- items view (items.ts) ----------
export interface ItemView {
  /** Creates/removes/moves one pickup model per live item. Call every frame. */
  sync(s: CollectState, dt: number): void;
  burst(p: Pickup): void;
  /** Removes every pickup model (floor swap). */
  clear(): void;
}

// ---------- hud (hud.ts) ----------
export interface CounterRow { kind: ItemKind; label: string; value: string; /** data: URL or an emoji */ icon: string }
export interface Hud {
  root: HTMLElement;
  /** Parent for @lawn/achievements' toast stack: the top-right column below the goal line and mute. */
  achievementSlot: HTMLElement;
  setCounters(rows: CounterRow[]): void;
  setGoal(text: string | null): void;
  toast(title: string, body?: string): void;
  titleCard(kicker: string, title: string, sub?: string): Promise<void>;
  /** Types the line out; resolves when the player taps/presses Enter/Space after it is shown, or `auto` seconds after it finished. */
  say(who: Speaker, name: string, text: string, auto?: number): Promise<void>;
  /** Resolves with the chosen index. */
  choose(prompt: string | null, options: string[]): Promise<number>;
  /** 0..1: Chapter 4's overflowing HUD. */
  setOverflow(level: number): void;
  /** Fades a full-screen cover to opacity `to` over `seconds`. Default colour black. */
  fade(to: number, seconds: number, color?: string): Promise<void>;
  credits(lines: string[]): Promise<void>;
  /** A button under the counters (Chapter 1's "Skip Tutorial"); null hides it. */
  setSkipButton(label: string | null, onClick?: () => void): void;
  onMute(fn: (muted: boolean) => void): void;
  /** Shows or hides the counters column (the ending hides it). */
  setCountersVisible(on: boolean): void;
}

// ---------- audio (sfx.ts, music.ts) ----------
export interface Sfx {
  play(name: SfxName): void;
  /** A short tick for a pickup; `combo` counts quick pickups in a row. */
  pickup(kind: ItemKind, combo: number): void;
  /** Mutter voice for a line; returns seconds. */
  voice(who: Speaker, text: string): number;
  stopVoice(): void;
  unlock(): void;
  setMuted(m: boolean): void;
}
export interface MusicController {
  play(track: TrackId): void;
  /** 0..1, passed to the playing theme. */
  intensity(x: number): void;
  pickup(): void;
  muffle(on: boolean): void;
  stop(): void;
  setMuted(m: boolean): void;
  current(): TrackId | null;
}

// ---------- save (save.ts) ----------
export interface SaveData { version: 1; chapter: ChapterId; eggs: EggId[]; finished: boolean; bestTotal: number }

// ---------- chapters (director.ts, chapters/*.ts) ----------
export interface ChapterCtx {
  readonly player: Player;
  readonly collect: CollectState;
  readonly hud: Hud;
  readonly save: SaveData;
  floor(): Floor;
  /** Renames a speaker for the rest of the run (the drifting narrator, "Sorrel Gluepot"). */
  name(who: Speaker, display: string): void;
  say(who: Speaker, text: string, opts?: { auto?: number }): Promise<void>;
  lines(list: readonly (readonly [Speaker, string])[]): Promise<void>;
  choose(prompt: string | null, options: string[]): Promise<number>;
  toast(title: string, body?: string): void;
  setGoal(text: string | null): void;
  /** Scatter n items in a named area of the current floor; returns how many spawned. */
  spawn(kind: ItemKind, n: number, area: string): number;
  spawnAt(kind: ItemKind, x: number, z: number, y?: number, prefab?: string): void;
  spawnLine(kind: ItemKind, n: number, from: Vec2, to: Vec2, y?: number): void;
  /** n items fall from the ceiling over a named area. */
  rain(kind: ItemKind, n: number, area: string): number;
  count(kind: ItemKind): number;
  waitCount(kind: ItemKind, n: number): Promise<void>;
  waitTotal(n: number): Promise<void>;
  waitInteract(id: string): Promise<void>;
  waitArea(area: string): Promise<void>;
  wait(seconds: number): Promise<void>;
  /** Listeners return an unsubscribe function. */
  onPickup(fn: (p: Pickup) => void): () => void;
  onInteract(id: string, fn: () => void): () => void;
  onArea(area: string, fn: () => void): () => void;
  every(seconds: number, fn: () => void): () => void;
  setControls(mode: MoveMode): void;
  camera(mode: CameraMode): void;
  goToFloor(id: FloorId): Promise<void>;
  /** Waits for the player to use the lift, shows the floor panel, rides to `to`. */
  rideElevator(to: FloorId): Promise<void>;
  music(track: TrackId | null): void;
  intensity(x: number): void;
  sfx(name: SfxName): void;
  unlock(id: AchievementId): void;
  increment(id: AchievementId, by?: number): void;
  egg(id: EggId): void;
}
export interface Chapter { id: ChapterId; run(ctx: ChapterCtx): Promise<void> }

export interface DirectorDeps {
  scene: THREE.Scene;
  player: Player;
  hud: Hud;
  input: Input;
  items: ItemView;
  collect: CollectState;
  save: SaveData;
  achievements: AchievementTracker;
  music: MusicController;
  sfx: Sfx;
  /** ?fast: waits and auto-advance are shortened. */
  fast: boolean;
  getFloor(): Floor;
  /** Disposes the current floor, clears items, builds `id`, and returns it (does not move the player). */
  setFloor(id: FloorId): Floor;
}
export interface Director {
  readonly ctx: ChapterCtx;
  /** Every frame: input, player, collecting, waits, interactions, HUD counters. */
  tick(dt: number): void;
  cameraMode(): CameraMode;
  /** Runs the chapters in CHAPTER_ORDER from `from`. `forced` = picked by ?chapter (no continue prompt). */
  run(from: ChapterId, forced: boolean): Promise<void>;
}
