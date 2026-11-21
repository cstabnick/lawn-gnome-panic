// Quest data. A quest is plain data (see defs.ts): who gives it, the objectives, and optionally its own cutscene. The
// systems that run it (quests.ts, cutscene.ts) know nothing about any one quest, so a new quest is a new entry in defs.ts.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { Economy } from '../economy';
import type { Blip, Fx, Hud, Npc, Npcs, Player, Sfx, Traffic, Vehicle, VehicleKind, Watch, World } from '../types';

export type CutsceneRoom =
  | 'mulch-club'
  | 'side-valve'
  | 'cloverfield-barn'
  | 'unmowed-hollow'
  | 'fells-shrine'
  | 'dust-overlook'
  | 'street';

/** A place that hands out quests: a building or landmark the player walks up to and interacts with. */
export interface GiverDef {
  id: string;
  /** Place name, e.g. "The Mulch Club" (map label and hints). */
  name: string;
  /** Prompt label, e.g. "Enter The Mulch Club". */
  label: string;
  /** Where the player stands to use it (and the minimap marker). */
  x: number;
  z: number;
  /** Where the player is put (and which way they face) when they come back out. */
  exit: { x: number; z: number; yaw: number };
  /** The cutscene set this giver plays its quests in. */
  room: CutsceneRoom;
  /** Optional single-character icon on the 3D ground marker ('D', 'P', 'T', 'G', 'B', '!'). */
  letter?: string;
}

/** A gnome to be cracked. `near` is snapped to the closest place gnomes walk. Missing look colours are random. */
export interface TargetDef {
  id: string;
  name: string;
  near: [number, number];
  look?: Partial<GnomeLook>;
  /** One short clue shown in the tracker, e.g. "Mossy Wood". */
  hint: string;
}

/** One line of speaking dialogue in a story cutscene. */
export interface DialogueLine {
  speaker: string;
  text: string;
  look?: Partial<GnomeLook>;
  hz?: number;
  icon?: string;
  bodegaCameo?: boolean;
}

/** Cutscene specification on a QuestDef. */
export type CutsceneSpec =
  | { kind: 'contract' }
  | { kind: 'dialogue'; room?: CutsceneRoom; lines: DialogueLine[]; titleCard?: string };

/** Request passed to `Cutscene.play()`. */
export type CutsceneRequest =
  | { kind?: 'contract'; room: CutsceneRoom; targets: { name: string; look: GnomeLook }[] }
  | { kind: 'dialogue'; room: CutsceneRoom; lines: DialogueLine[]; titleCard?: string };

export interface CutsceneHandle {
  active: boolean;
  play(req: CutsceneRequest, onDone: () => void): void;
  update(dt: number, camera: THREE.PerspectiveCamera): void;
  skip(): void;
}

/**
 * What the player has to do. Add a new `kind` here and a handler in quests.ts (the `OBJECTIVE_KINDS` table); a quest
 * lists as many objectives as it likes and they run one after another.
 */
export type ObjectiveDef =
  | { kind: 'crack'; text: string; targets: TargetDef[] }
  | { kind: 'visit'; text: string; at: [number, number]; radius: number; hint: string }
  | {
      kind: 'steal-deliver';
      text: string;
      vehicleKind: VehicleKind;
      spawnAt: [number, number, number];
      dropAt: [number, number];
      radius: number;
      hint: string;
      heatOnEnter?: number;
      maxDamage?: number;
    }
  | {
      kind: 'chase-follow';
      text: string;
      leaderName: string;
      leaderKind: VehicleKind;
      waypoints: [number, number][];
      speed: number;
      maxDist: number;
      hint: string;
    }
  | {
      kind: 'convoy-ambush';
      text: string;
      route: [number, number][];
      escorts: number;
      dropAt: [number, number];
      hint: string;
    }
  | {
      kind: 'air-drop';
      text: string;
      planeAt?: [number, number];
      dropZone: [number, number, number];
      radius: number;
      targetVehicle?: VehicleKind;
      hint: string;
    }
  | {
      kind: 'survive-derby';
      text: string;
      arena: [number, number];
      radius: number;
      seconds: number;
      attackers: number;
      hint: string;
    }
  | { kind: 'boss-combine'; text: string; startZ: number; endZ: number; hint: string }
  | {
      kind: 'choice';
      text: string;
      optionA: { label: string; at: [number, number]; endingText: string };
      optionB: { label: string; at: [number, number]; endingText: string };
    };

export interface QuestDef {
  id: string;
  title: string;
  giver: string;
  /** Prerequisite quest id that must be 'done' before this quest is offered. */
  prereq?: string;
  /** Story chapter number (1..5), used for Kiln-Debt paydown and pacing. */
  chapter?: number;
  /** Acorn reward on completion (defaults to 250). */
  rewardAcorns?: number;
  /** Turfton FM bulletin id triggered on completion (defaults to quest id). */
  radioBulletin?: string;
  /** Plays when the quest is taken. */
  cutscene?: CutsceneSpec;
  objectives: ObjectiveDef[];
  /** Achievement unlocked on completion (an id from @lawn/achievements). */
  achievement?: string;
  /** Shown as a DEMO quest: a note in the tracker and on completion that more is coming. */
  demo?: boolean;
  /** Toast on completion. */
  doneText: string;
}

/** Saved progress. */
export interface QuestSave {
  state: 'active' | 'done';
  /** Index of the objective being worked on. */
  step: number;
  /** Target ids already cracked in this quest. */
  cracked: string[];
}

/** Dependencies provided to the quest engine and objective runners. */
export interface QuestDeps {
  scene: THREE.Scene;
  world: World;
  npcs: Npcs;
  hud: Hud;
  cutscene: CutsceneHandle;
  /** Put the player (on foot) back in the world at the giver's exit. */
  placePlayer(x: number, z: number, yaw: number): void;
  unlock(achievementId: string): void;
  play(sfx: Sfx): void;
  player?: Player;
  vehicles?: Vehicle[];
  watch?: Watch;
  traffic?: Traffic;
  fx?: Fx;
  economy?: Economy;
  onRadioBulletin?: (id: string) => void;
}

/** One running objective. */
export interface Run {
  lines(): string[];
  done(): boolean;
  update(dt: number, px: number, pz: number): void;
  onCracked(npc: Npc): void;
  blips(): Blip[];
  /** Target ids cracked so far (saved). */
  cracked(): string[];
  cleanup(): void;
}
