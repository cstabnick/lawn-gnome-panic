// Save Trainer contracts (docs/roadmaps/gta-save-trainer.md). Type-only: importing this file costs nothing at runtime.
import type * as THREE from 'three';
import type { Economy } from '../economy';
import type { AtmosphereController } from '../atmosphere';
import type { CritterRuntime } from '../critters';
import type { FleetRuntime } from '../fleetRuntime';
import type { Hunting } from '../hunting/hunting';
import type { Lockup } from '../lockup/runtime';
import type { PlayerEmote } from '../anim/playerEmote';
import type { Quests } from '../quests/quests';
import type { CutsceneHandle } from '../quests/types';
import type { Hud, Npcs, Player, Vehicle, Watch, Weapons, World } from '../types';

/** The live game objects a trainer section may use. app.ts builds it once (installTrainer). Use their public methods only. */
export interface TrainerCtx {
  ui: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  world: World;
  player: Player;
  /** The live vehicle list (spawners push into it). */
  vehicles: Vehicle[];
  hud: Hud;
  economy: Economy;
  watch: Watch;
  weapons: Weapons;
  quests: Quests;
  fleet: FleetRuntime;
  critters: CritterRuntime;
  hunting: Hunting;
  npcs: Npcs;
  lockup: Lockup;
  atmosphere: AtmosphereController | null;
  cutscene: CutsceneHandle;
  emote: PlayerEmote;
  /** True while the first-run intro tour owns the frame loop (cutscenes and most systems stand still until it ends). */
  introActive(): boolean;
  /** Read-only: is this @lawn/achievements id unlocked on this account. The trainer never unlocks or resets achievements. */
  isAchievementUnlocked(id: string): Promise<boolean>;
}

/** Where to put a spawned thing: on the ground under the camera's aim (or just ahead of the player). */
export interface TrainerSpot {
  x: number;
  z: number;
  /** Facing for the new thing: towards the player's view direction. */
  yaw: number;
}

/** One tab of the trainer panel. */
export interface TrainerSection {
  /** Unique, kebab-case ('save', 'character', 'birding'). */
  id: string;
  /** Tab label, short ('Save', 'Spawn'). */
  label: string;
  /** Tab order, ascending. Built-ins use 10, 20, ... 70; plug-ins pick anything else. */
  order: number;
  /**
   * Fill `container` (an empty div the panel owns). Called the first time the tab is shown, never before; call it again
   * by re-opening the tab after `refresh` (the panel empties the container and builds again on every show).
   */
  build(container: HTMLElement, ctx: TrainerCtx): void;
}

/** One button in the Spawn tab. */
export interface TrainerSpawnable {
  /** Group heading in the Spawn tab ('Vehicles', 'Aircraft', 'Critters', 'Birds', ...). */
  group: string;
  /** Unique within its group. */
  id: string;
  label: string;
  /** Spawn it at `at`. Return a short message for the status line (or nothing). Throwing shows the error. */
  spawn(at: TrainerSpot, ctx: TrainerCtx): string | void;
}
