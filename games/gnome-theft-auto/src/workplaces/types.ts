// E24 workplace jobs (chef, mechanic, comedy stage): what app.ts hands the workplace runtimes, and what each returns.
// Plan: docs/roadmaps/gta-batch-3/E24/roadmap.md. Job data and pay: jobs/workDefs.ts; career save: jobs/career.ts.
import type * as THREE from 'three';
import type { TimeLabel } from '../atmosphere';
import type { ShowroomTarget } from '../camera';
import type { Economy } from '../economy';
import type { Blip, Hud, Player, Sfx, Vehicle } from '../types';

export interface WorkDeps {
  scene: THREE.Scene;
  /** The shared #ui element: append your own containers, never restyle it. */
  ui: HTMLElement;
  hud: Hud;
  economy: Economy;
  player: Player;
  /** The game's vehicle list: a spawned client car is pushed here and spliced out when it goes. */
  vehicles: Vehicle[];
  play(sfx: Sfx): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  /** Why work cannot start now (cutscene, dead), or null. */
  blocked(): string | null;
  /** The sky's time label, or null when there is no atmosphere. */
  timeLabel(): TimeLabel | null;
  /** Point the camera at a target (with `fixedYaw` for a locked stage view) and hold the controls, or give it back (null). */
  showroom(t: ShowroomTarget | null): void;
  /** Put the player on foot at (x, z) facing yaw (world coordinates; interior space is x >= 5000). */
  teleport(x: number, z: number, yaw: number): void;
  /** Leave the current vehicle at once (no-op on foot). */
  getOut(): void;
}

/** What each workplace runtime gives app.ts (through workplaces/index.ts). */
export interface WorkJobRuntime {
  /** Every frame. */
  update(dt: number): void;
  /** A full-screen job UI or a staged scene is up: app.ts holds the player's controls. */
  isOpen(): boolean;
  /** Map blips (the workplace, a waiting client). */
  blips(): Blip[];
}
