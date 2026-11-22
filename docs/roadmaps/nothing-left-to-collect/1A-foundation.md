Epic: 1 Foundation
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed at the repo root. Do **not** run `npm install` (the planner does it after this epic). Do not `git commit`.
- One other worker is editing `packages/prefabs/src/catalog/` and `packages/achievements/src/catalog.ts` at the same time. Do not touch those.
- Repo rules that apply: UI modules append their own container to `#ui` and never restyle it; assets are generated in code only.

## Goal

Create the game `games/nothing-left-to-collect` (three.js, title "Nothing Left to Collect", port 5205) with its whole
contract (`types.ts`, `config.ts`), the wiring (`main.ts`, `app.ts`), a real `save.ts`, and a stub for every other
module, so that `npm run build -w games/nothing-left-to-collect` passes and later workers each fill exactly one stub. Also
add the three music theme stubs to `packages/music`.

## Read first

- `games/giant-pup/index.html`, `games/giant-pup/package.json`, `games/giant-pup/tsconfig.json`: the three.js game layout to copy.
- `packages/music/src/index.ts`: where the three new export lines go (append at the end).

## Change

### Scaffold

1. Run `npm run new -- nothing-left-to-collect` (copies `games/sample-dodge`).
2. Delete `games/nothing-left-to-collect/src/scenes/`, `src/audio.ts`, `src/storage.ts`, `src/config.ts`, `src/main.ts` (all Phaser) and `thumbnail.jpg`.
3. Keep `public/favicon.svg` but replace its content with:
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#f3d36b"/><circle cx="32" cy="34" r="16" fill="#8a5a2b"/><path d="M16 28h32a16 9 0 0 0-32 0z" fill="#5a3a1a"/><rect x="30" y="14" width="4" height="8" rx="2" fill="#5a3a1a"/></svg>
   ```
4. `games/nothing-left-to-collect/package.json` (replace whole file):
   ```json
   {
     "name": "nothing-left-to-collect",
     "private": true,
     "type": "module",
     "description": "Nothing Left to Collect: a job interview at the Club Gnome Annex that turns into the collectathon to end all collectathons.",
     "scripts": {
       "dev": "vite",
       "build": "tsc --noEmit && vite build",
       "preview": "vite preview",
       "typecheck": "tsc --noEmit",
       "test": "vitest run --passWithNoTests"
     },
     "dependencies": {
       "@lawn/achievements": "*",
       "@lawn/gnome": "*",
       "@lawn/music": "*",
       "@lawn/mutter": "*",
       "@lawn/party": "*",
       "@lawn/prefabs": "*",
       "three": "0.187.0"
     },
     "devDependencies": {
       "@types/three": "0.187.0",
       "typescript": "7.0.2",
       "vite": "8.3.8",
       "vitest": "5.1.0"
     }
   }
   ```
5. `tsconfig.json`: copy `games/giant-pup/tsconfig.json` exactly.
6. `vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite';
   export default defineConfig({ base: './', server: { port: 5205, host: true } });
   ```
7. `index.html`: copy `games/giant-pup/index.html`, then change the `<title>` to `Nothing Left to Collect` and the `html, body` background to `#f3efe4`. Keep the `#game` canvas and `#ui` div exactly as they are.
8. `CREDITS.md`: `# Credits\n\nAll models, sounds and music are generated in code (prefabs from @lawn/prefabs, music from @lawn/music). No external assets.`
9. `README.md`: a short placeholder: title, one line ("A job interview at the Club Gnome Annex that turns into the collectathon to end all collectathons."), `npm run dev -w games/nothing-left-to-collect` (port 5205), `?chapter=<prologue|ch1|ch2|ch3|ch4|ending>` and `?fast`. (Another issue expands it later.)

### Source files (write these exactly)

`src/main.ts`:
```ts
// Entry. The party slice branch (#minigame) is added by the slice issue.
import { loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
await import('./app');
```

`src/types.ts`:
```ts
// Nothing Left to Collect: every shared type. This file is the contract between modules; change it only in the plan.
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
```

`src/config.ts`:
```ts
// Constants and tuning. Pure: no DOM, no three, safe to import in tests.
import type { AchievementId, ChapterId, EggId, FloorId, ItemKind, Speaker } from './types';

export const GAME_ID = 'nothing-left-to-collect';
export const GAME_TITLE = 'Nothing Left to Collect';

export const TUNING = {
  walkSpeed: 5,
  accel: 40,
  jumpSpeed: 6.5,
  gravity: 20,
  flySpeed: 9,
  playerRadius: 0.3,
  playerHeight: 1.1,
  /** Max ledge the walker steps up without jumping. */
  stepUp: 0.25,
  /** Pickup radius at the start (CollectState.magnet). */
  magnet: 0.9,
  itemRestY: 0.35,
  itemFallG: 14,
  rainHeight: 6,
  maxLiveItems: 400,
  interactRadius: 1.4,
  wallHeight: 3,
  wallThickness: 0.2,
  /** Seconds without a pickup that end a combo. */
  comboGap: 1.2,
} as const;

export interface ItemKindDef { label: string; prefab: string; glow: number | null; emoji: string; value: number }
export const ITEM_KINDS: Record<ItemKind, ItemKindDef> = {
  acorn: { label: 'Acorns', prefab: 'acorn', glow: null, emoji: '🌰', value: 1 },
  'golden-acorn': { label: 'Golden Acorns', prefab: 'acorn', glow: 0xffd34d, emoji: '🌰', value: 1 },
  clip: { label: 'Clips', prefab: 'fc-paperclip', glow: null, emoji: '📎', value: 1 },
  sticky: { label: 'Sticky Squares', prefab: 'fc-sticky-note', glow: null, emoji: '🟨', value: 1 },
  button: { label: 'Gold Buttons', prefab: 'button', glow: 0xffd34d, emoji: '🟡', value: 1 },
  token: { label: 'Tokens of Appreciation', prefab: 'fc-appreciation-token', glow: 0x7fd0ff, emoji: '🪙', value: 1 },
  star: { label: 'Stars of Recognition', prefab: 'party-star', glow: 0xffe066, emoji: '⭐', value: 1 },
  badge: { label: "Collector's Badges", prefab: 'fc-collector-badge', glow: 0xff8fd0, emoji: '📛', value: 1 },
  anything: { label: 'Everything', prefab: 'crate', glow: null, emoji: '📦', value: 1 },
};
export const ITEM_ORDER: readonly ItemKind[] = ['acorn', 'golden-acorn', 'clip', 'sticky', 'button', 'token', 'star', 'badge', 'anything'];

export const CHAPTER_ORDER: readonly ChapterId[] = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ending'];
export const CHAPTER_FLOOR: Record<ChapterId, FloorId> = { prologue: 'lobby', ch1: 'f1', ch2: 'f2', ch3: 'f3', ch4: 'f4', ending: 'lobby' };
export const CHAPTER_TITLES: Record<ChapterId, { kicker: string; title: string; sub: string }> = {
  prologue: { kicker: '', title: 'Nothing Left to Collect', sub: 'Bucketworth & Sons, Collectors. Reception.' },
  ch1: { kicker: 'Chapter 1', title: 'Orientation', sub: 'Floor 1' },
  ch2: { kicker: 'Chapter 2', title: 'Onboarding', sub: 'Floor 2' },
  ch3: { kicker: 'Chapter 3', title: 'Synergy', sub: 'Floor 2½' },
  ch4: { kicker: 'Chapter 4', title: 'Everything', sub: 'Floor ∞' },
  ending: { kicker: '', title: 'Reception', sub: 'Still nine o\'clock' },
};
/** Lift panel buttons, in panel order. 'B' is the basement easter egg. */
export const LIFT_BUTTONS: readonly { label: string; floor: FloorId | null }[] = [
  { label: 'L', floor: 'lobby' }, { label: '1', floor: 'f1' }, { label: '2', floor: 'f2' },
  { label: '2½', floor: 'f3' }, { label: '∞', floor: 'f4' }, { label: 'B', floor: null },
];

export const SPEAKERS: Record<Speaker, { name: string; hz: number; color: string }> = {
  narrator: { name: 'The Interviewer', hz: 84, color: '#3b4a6b' },
  secretary: { name: 'Primrose Paperweight', hz: 132, color: '#a8457a' },
  player: { name: 'You', hz: 100, color: '#2f6b3b' },
  coworker: { name: 'A Coworker', hz: 112, color: '#6b5a2f' },
  pa: { name: 'Intercom', hz: 96, color: '#555555' },
};
/** The narrator's label drifts every chapter: is this an interview or a dream? */
export const NARRATOR_NAME: Record<ChapterId, string> = {
  prologue: 'The Interviewer', ch1: 'The Interviewer', ch2: 'The Interviewer (probably)',
  ch3: 'The Narrator', ch4: 'You, possibly', ending: 'The Interviewer',
};

export const EGGS: Record<EggId, string> = {
  'shortest-interview': 'The Shortest Interview',
  nameplate: 'Still Primrose',
  'skip-tutorial': 'Skip Skip Tutorial',
  'do-not-collect': 'The One You Were Told Not To',
  'water-cooler': 'Water Cooler Gossip',
  photocopier: 'Two of You',
  'arcade-cabinet': 'The Answer Is Always Gnome',
  basement: 'Floor B',
};
export const EGG_COUNT = 8;

export const ACH = {
  hello: 'collectathon-hello',
  clipArt: 'collectathon-clip-art',
  employee: 'collectathon-employee-of-the-month',
  point: 'collectathon-the-point',
  notTaking: 'collectathon-not-taking-it',
  eggs: 'collectathon-easter-eggs',
} as const satisfies Record<string, AchievementId>;

export const SAVE_KEY = 'nothing-left-to-collect.save.v1';
export const MUSIC_MUTE_KEY = 'nothing-left-to-collect-music-muted';

export const CAMERA = {
  follow: { height: 7, back: 8.5, lookUp: 0.8, fov: 50 },
  close: { height: 2.4, back: 4, lookUp: 0.9, fov: 45 },
  wide: { height: 14, back: 15, lookUp: 0.5, fov: 50 },
  sky: { height: 2.5, back: 9, lookUp: 3, fov: 60 },
  /** Distance multiplier when the screen is taller than wide. */
  portraitBack: 1.45,
  lerp: 6,
} as const;

/** The secretary's look (Primrose Paperweight). */
export const PRIMROSE_LOOK = { hat: 0xc2457a, shirt: 0xf0d9e4, pants: 0x3b3b4a, skin: 0xf1c27d, boots: 0x2a2a2a, beard: null, hair: { color: 0x8a5a2b, style: 'pigtails' as const }, freckles: true, dress: true, glasses: true };
```

`src/save.ts` (real, final):
```ts
import { SAVE_KEY } from './config';
import type { SaveData } from './types';

const fresh = (): SaveData => ({ version: 1, chapter: 'prologue', eggs: [], finished: false, bestTotal: 0 });

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw) as SaveData;
    return s && s.version === 1 ? { ...fresh(), ...s } : fresh();
  } catch { return fresh(); }
}
export function writeSave(s: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}
export function resetSave(): SaveData {
  const s = fresh();
  writeSave(s);
  return s;
}
```

`src/app.ts` (real, final):
```ts
// Nothing Left to Collect: wiring only. Renderer, camera, which floor is built, and the frame loop.
// Gameplay is director.ts (the chapters' API) and chapters/*.ts (the script).
import * as THREE from 'three';
import { createAchievementTracker } from '@lawn/achievements';
import { createFollowCamera } from './camera';
import { clearItems, createCollectState } from './collect';
import { CHAPTER_ORDER } from './config';
import { createDirector } from './director';
import { createHud } from './hud';
import { createInput } from './input';
import { createItemView } from './items';
import { createMusic } from './music';
import { buildFloor } from './office';
import { createPlayer } from './player';
import { loadSave } from './save';
import { createSfx } from './sfx';
import type { ChapterId, Floor, FloorId } from './types';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
const follow = createFollowCamera(camera);

const params = new URLSearchParams(location.search);
const fast = params.has('fast');
const chapterParam = params.get('chapter');
const forced = chapterParam !== null && (CHAPTER_ORDER as readonly string[]).includes(chapterParam);
const start: ChapterId = forced ? (chapterParam as ChapterId) : 'prologue';

const hud = createHud(ui);
const input = createInput(ui);
const sfx = createSfx();
const music = createMusic();
const save = loadSave();
const achievements = createAchievementTracker({ ui });
const collect = createCollectState(0x5eed);
const items = createItemView(scene);
const player = createPlayer(scene);

let floor: Floor = buildFloor(scene, 'lobby');
function setFloor(id: FloorId): Floor {
  floor.dispose();
  clearItems(collect);
  items.clear();
  floor = buildFloor(scene, id);
  return floor;
}

const director = createDirector({
  scene, player, hud, input, items, collect, save, achievements, music, sfx, fast,
  getFloor: () => floor,
  setFloor,
});

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const unlockAudio = (): void => sfx.unlock();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

const sp = floor.layout.spawn;
player.teleport(sp.x, 0, sp.z, sp.facing);
follow.snap(player.pos, 'follow');

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  director.tick(dt);
  floor.update(dt);
  follow.update(dt, player.pos, director.cameraMode());
  renderer.render(scene, camera);
});

// Debug handle for agents and demos: window.fc.director.ctx, window.fc.collect, ...
(window as unknown as { fc: unknown }).fc = { director, player, collect, hud, music, get floor() { return floor; } };

void director.run(start, forced);
```

### Stubs (final signatures, trivial bodies; later issues replace the bodies)

`src/collect.ts`:
```ts
// STUB: replaced by the collect-sim issue. Keep every exported signature.
import { TUNING } from './config';
import type { CollectState, Item, ItemKind, Pickup, Rect } from './types';

export function emptyCounts(): Record<ItemKind, number> {
  return { acorn: 0, 'golden-acorn': 0, clip: 0, sticky: 0, button: 0, token: 0, star: 0, badge: 0, anything: 0 };
}
export function createCollectState(seed: number): CollectState {
  return { t: 0, nextId: 1, seed, items: [], counts: emptyCounts(), total: 0, multiplier: 1, magnet: TUNING.magnet };
}
export function rand(s: CollectState): number { void s; return Math.random(); }
export function spawnItem(s: CollectState, kind: ItemKind, x: number, z: number, y?: number, prefab?: string): Item | null {
  void s; void kind; void x; void z; void y; void prefab; return null;
}
export function scatter(s: CollectState, kind: ItemKind, n: number, r: Rect, y?: number): number {
  void s; void kind; void n; void r; void y; return 0;
}
export function rain(s: CollectState, kind: ItemKind, n: number, r: Rect, height?: number): number {
  void s; void kind; void n; void r; void height; return 0;
}
export function stepCollect(s: CollectState, collectors: readonly { x: number; y: number; z: number }[], dt: number): Pickup[] {
  void collectors; s.t += dt; return [];
}
export function clearItems(s: CollectState, kind?: ItemKind): void {
  s.items = kind ? s.items.filter((i) => i.kind !== kind) : [];
}
export function formatCount(n: number): string { return String(Math.floor(n)); }
```

`src/walk.ts`:
```ts
// STUB: replaced by the player issue. Keep every exported signature.
import type { Box, Walker } from './types';

export function createWalker(x: number, y: number, z: number, facing: number): Walker {
  return { x, y, z, vx: 0, vy: 0, vz: 0, facing, grounded: true, jumpsUsed: 0 };
}
export function stepWalker(w: Walker, moveX: number, moveZ: number, jump: boolean, colliders: readonly Box[], groundY: number, dt: number): void {
  void jump; void colliders;
  w.x += moveX * 5 * dt;
  w.z += moveZ * 5 * dt;
  w.y = groundY;
}
```

`src/player.ts`:
```ts
// STUB: replaced by the player issue. Keep every exported signature.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK } from '@lawn/gnome';
import { createWalker, stepWalker } from './walk';
import type { Floor, InputState, Player } from './types';

export function createPlayer(scene: THREE.Scene): Player {
  const model = createGnomeModel(getMyGnome()?.look ?? GNORMAN_LOOK);
  scene.add(model.object);
  const walker = createWalker(0, 0, 0, 0);
  const pos = new THREE.Vector3();
  const p: Player = {
    model, walker, pos, mode: 'walk',
    update(dt: number, input: InputState, floor: Floor) {
      if (p.mode === 'walk') stepWalker(walker, input.moveX, input.moveZ, input.jumpPressed, floor.colliders, floor.groundAt(walker.x, walker.z), dt);
      pos.set(walker.x, walker.y, walker.z);
      model.object.position.copy(pos);
    },
    teleport(x, y, z, facing) { walker.x = x; walker.y = y; walker.z = z; walker.facing = facing; pos.set(x, y, z); model.object.position.copy(pos); },
    async moveTo(x, y, z) { p.teleport(x, y, z, walker.facing); },
    lookAt() {},
  };
  return p;
}
```

`src/camera.ts`:
```ts
// STUB: replaced by the player issue. Keep every exported signature.
import * as THREE from 'three';
import type { CameraMode, FollowCamera } from './types';

export function createFollowCamera(camera: THREE.PerspectiveCamera): FollowCamera {
  const place = (t: THREE.Vector3): void => { camera.position.set(t.x, t.y + 7, t.z + 8.5); camera.lookAt(t.x, t.y + 0.8, t.z); };
  return {
    update(dt: number, target: THREE.Vector3, mode: CameraMode) { void dt; void mode; place(target); },
    snap(target: THREE.Vector3, mode: CameraMode) { void mode; place(target); },
    shake() {},
  };
}
```

`src/input.ts`:
```ts
// STUB: replaced by the input issue. Keep every exported signature.
import type { Input, InputState } from './types';

export function createInput(ui: HTMLElement): Input {
  void ui;
  const none: InputState = { moveX: 0, moveZ: 0, jump: false, jumpPressed: false, interactPressed: false };
  return { read: () => ({ ...none }), setInteract() {}, setEnabled() {}, dispose() {} };
}
```

`src/hud.ts`:
```ts
// STUB: replaced by the hud issue. Keep every exported signature. The real one owns div#fc-hud, #fc-counters, #fc-dialog.
import type { Hud } from './types';

export function createHud(ui: HTMLElement): Hud {
  const root = document.createElement('div');
  root.id = 'fc-hud';
  ui.append(root);
  return {
    root,
    setCounters() {}, setGoal() {}, toast() {},
    async titleCard() {},
    async say(_who, name, text) { console.info(`${name}: ${text}`); },
    async choose() { return 0; },
    setOverflow() {}, async fade() {}, async credits() {},
    setSkipButton() {}, onMute() {}, setCountersVisible() {},
  };
}
```

`src/items.ts`:
```ts
// STUB: replaced by the items-view issue. Keep every exported signature.
import type * as THREE from 'three';
import type { ItemView } from './types';

export function createItemView(scene: THREE.Scene): ItemView {
  void scene;
  return { sync() {}, burst() {}, clear() {} };
}
```

`src/office.ts`:
```ts
// STUB: replaced by the office issue. Keep every exported signature.
import * as THREE from 'three';
import { LAYOUTS } from './floors';
import { buildSkyFloor } from './sky';
import type { Floor, FloorId } from './types';

export function buildFloor(scene: THREE.Scene, id: FloorId): Floor {
  if (id === 'sky') return buildSkyFloor(scene);
  const layout = LAYOUTS[id];
  const group = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(layout.w, layout.d), new THREE.MeshStandardMaterial({ color: layout.floorColor }));
  ground.rotation.x = -Math.PI / 2;
  group.add(ground, new THREE.HemisphereLight(0xffffff, 0x888866, 2.5));
  scene.add(group);
  return {
    id, layout, group, colliders: [], props: [], npcs: {},
    groundAt: () => 0, update() {}, setElevatorOpen() {}, setFrontDoorOpen() {}, removeProp() {},
    dispose() { scene.remove(group); ground.geometry.dispose(); (ground.material as THREE.Material).dispose(); },
  };
}
```

`src/sky.ts`:
```ts
// STUB: replaced by the ending issue. Keep every exported signature.
import * as THREE from 'three';
import type { Floor, FloorLayout } from './types';

export const SKY_LAYOUT: FloorLayout = {
  id: 'sky', title: 'Sky', w: 40, d: 40, floorColor: 0xe8d6a0, wallColor: 0xffffff,
  walls: [], props: [], npcs: [], spawn: { x: 0, z: 0, facing: Math.PI }, elevatorX: 0, areas: {}, interactables: [],
};
/** Waypoints of the flight from the Annex roof to Shellshore's beach: fly to `to` over `seconds`. */
export const FLIGHT: readonly { to: [number, number, number]; seconds: number }[] = [{ to: [0, 0, -10], seconds: 1 }];
/** Where the gnome stands after landing on the beach. */
export const BEACH_SPAWN = { x: 0, y: 0, z: -10, facing: 0 };

export function buildSkyFloor(scene: THREE.Scene): Floor {
  const group = new THREE.Group();
  group.add(new THREE.HemisphereLight(0xffffff, 0xddccaa, 2.5));
  scene.add(group);
  return {
    id: 'sky', layout: SKY_LAYOUT, group, colliders: [], props: [], npcs: {},
    groundAt: () => 0, update() {}, setElevatorOpen() {}, setFrontDoorOpen() {}, removeProp() {},
    dispose() { scene.remove(group); },
  };
}
```

`src/floors/index.ts`:
```ts
import type { FloorId, FloorLayout } from '../types';
import { LOBBY } from './lobby';
import { F1 } from './f1';
import { F2 } from './f2';
import { F3 } from './f3';
import { F4 } from './f4';

export const LAYOUTS: Record<Exclude<FloorId, 'sky'>, FloorLayout> = { lobby: LOBBY, f1: F1, f2: F2, f3: F3, f4: F4 };
```

`src/floors/lobby.ts`, `f1.ts`, `f2.ts`, `f3.ts`, `f4.ts`: one stub each, all the same shape. Write `lobby.ts` as:
```ts
// STUB: replaced by the floor's own issue. Keep the export name and type.
import type { FloorLayout } from '../types';

export const LOBBY: FloorLayout = {
  id: 'lobby', title: 'Reception', w: 20, d: 16, floorColor: 0xc9b89a, wallColor: 0xece4d4,
  walls: [], props: [], npcs: [],
  spawn: { x: 0, z: 5, facing: Math.PI }, elevatorX: 0, frontDoorX: 0,
  areas: { 'front-door': { x0: -1.5, z0: 6.6, x1: 1.5, z1: 8 } }, interactables: [],
};
```
and the others with these values (no `frontDoorX`, `areas: { all: <the whole floor> }`, spawn 2.5 m in front of the lift facing +z i.e. `{ x: 0, z: -d/2 + 2.5, facing: 0 }`):
- `f1.ts`: `export const F1`, id `'f1'`, title `'Floor 1: Orientation'`, w 28, d 22, floorColor `0x8fa3b8`, wallColor `0xe9eef2`.
- `f2.ts`: `export const F2`, id `'f2'`, title `'Floor 2: Onboarding'`, w 32, d 26, floorColor `0x8fb894`, wallColor `0xeef2e9`.
- `f3.ts`: `export const F3`, id `'f3'`, title `'Floor 2½: Synergy'`, w 36, d 30, floorColor `0xb8a08f`, wallColor `0xf2ece9`.
- `f4.ts`: `export const F4`, id `'f4'`, title `'Floor ∞: Everything'`, w 30, d 30, floorColor `0xd8d8e0`, wallColor `0xffffff`, `windows: true`.
(For f1, `areas: { all: { x0: -14, z0: -11, x1: 14, z1: 11 } }`, and so on from w and d.)

`src/director.ts`:
```ts
// STUB: replaced by the director issue. Keep every exported signature.
import { CHAPTER_ORDER } from './config';
import { CHAPTERS } from './chapters';
import type { ChapterCtx, ChapterId, Director, DirectorDeps } from './types';

export function createDirector(deps: DirectorDeps): Director {
  const ctx = {} as ChapterCtx; // the real director implements every ChapterCtx member
  return {
    ctx,
    tick(dt: number) {
      deps.player.update(dt, deps.input.read(), deps.getFloor());
      deps.items.sync(deps.collect, dt);
    },
    cameraMode: () => 'follow',
    async run(from: ChapterId) {
      for (const id of CHAPTER_ORDER.slice(CHAPTER_ORDER.indexOf(from))) await deps.hud.say('narrator', 'The Interviewer', `(${CHAPTERS[id].id} is not written yet)`);
    },
  };
}
```

`src/sfx.ts`:
```ts
// STUB: replaced by the audio issue. Keep every exported signature.
import type { Sfx } from './types';
export function createSfx(): Sfx {
  return { play() {}, pickup() {}, voice: () => 0, stopVoice() {}, unlock() {}, setMuted() {} };
}
```

`src/music.ts`:
```ts
// STUB: replaced by the audio issue. Keep every exported signature.
import type { MusicController } from './types';
export function createMusic(): MusicController {
  return { play() {}, intensity() {}, pickup() {}, muffle() {}, stop() {}, setMuted() {}, current: () => null };
}
```

`src/chapters/index.ts`:
```ts
import type { Chapter, ChapterId } from '../types';
import { PROLOGUE } from './prologue';
import { CH1 } from './ch1';
import { CH2 } from './ch2';
import { CH3 } from './ch3';
import { CH4 } from './ch4';
import { ENDING } from './ending';

export const CHAPTERS: Record<ChapterId, Chapter> = { prologue: PROLOGUE, ch1: CH1, ch2: CH2, ch3: CH3, ch4: CH4, ending: ENDING };
```

`src/chapters/prologue.ts`, `ch1.ts`, `ch2.ts`, `ch3.ts`, `ch4.ts`, `ending.ts`: one stub each, e.g. `prologue.ts`:
```ts
// STUB: replaced by the chapter's own issue. Keep the export name and type.
import type { Chapter } from '../types';
export const PROLOGUE: Chapter = { id: 'prologue', async run(ctx) { await ctx.say('secretary', 'Hello.'); } };
```
with `CH1` (id `'ch1'`), `CH2`, `CH3`, `CH4`, `ENDING` (id `'ending'`) the same, each saying one placeholder line from `'narrator'`.

### Music theme stubs (`packages/music`)

`packages/music/src/themes/fcShared.ts` (final):
```ts
// Shared option and hook types for Nothing Left to Collect's three themes.
export interface FcMusicOptions {
  /** 0..1: how hard the game is collecting right now. Read it as often as you like. */
  intensity?: () => number;
}
export interface FcMusicHooks {
  /** A pickup: play one note of a climbing pickup scale in the track's key (resets after 1.2 s without a pickup). */
  pickup(): void;
}
```

`packages/music/src/themes/fcHoldMusic.ts`, `fcSynergyLoop.ts`, `fcShellshore.ts`: stubs, e.g.
```ts
// STUB: replaced by its own issue. Keep the signature.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import type { FcMusicHooks, FcMusicOptions } from './fcShared';

export function buildFcHoldMusic(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: FcMusicOptions = {}): FcMusicHooks {
  void T; void keep; void out; void seed; void opts;
  return { pickup() {} };
}
```
with `buildFcSynergyLoop` and `buildFcShellshore` in the other two files.

Append to the end of `packages/music/src/index.ts`:
```ts
export { type FcMusicHooks, type FcMusicOptions } from './themes/fcShared';
export { buildFcHoldMusic } from './themes/fcHoldMusic';
export { buildFcSynergyLoop } from './themes/fcSynergyLoop';
export { buildFcShellshore } from './themes/fcShellshore';
```

## Contract

Everything above is the contract for every later issue: `types.ts` and `config.ts` verbatim, and every stub's
exported names and signatures. Do not rename or "improve" any of it.

## Done when

- `npm run build -w games/nothing-left-to-collect` succeeds (tsc + vite build).
- `npx tsc --noEmit -p packages/music` succeeds.
- `games/nothing-left-to-collect` contains no Phaser import (`grep -r phaser games/nothing-left-to-collect/src` finds nothing).
- Optional: `npm run dev -w games/nothing-left-to-collect` serves a page on 5205 showing a flat floor and a gnome; stop the server afterwards.

## Out of scope

`packages/prefabs/**`, `packages/achievements/**` (another worker), `docs/**`, `AGENT_INDEX.md`, any other game.
