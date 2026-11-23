// Street events: small semi-scripted scenes that unfold around the player (roadmap
// docs/roadmaps/gta-world-events-and-rewards.md). An EventDef is data plus a tiny script; the director (director.ts)
// decides when and where one starts, the kit (kit.ts) spawns and drives its gnomes, cars and props and cleans them up.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { DistrictId } from '../districts';
import type { BiomeId, Fx, Npc, Player, Sfx, Vehicle, VehicleKind, World } from '../types';

export type EventCategory = 'police' | 'crime' | 'scene' | 'traffic' | 'wild';

/** What the director knows when it picks an event (EventDef.when). */
export interface SpawnContext {
  px: number;
  pz: number;
  biome: BiomeId;
  /** Turfton district, or null outside the city. */
  district: DistrictId | null;
  /** 0 = noon .. 1 = deep night. */
  night: number;
  /** Watch heat, 0..4. */
  heat: number;
  inVehicle: boolean;
  /** A quest is active. */
  onQuest: boolean;
}

/** Where an event is placed: its anchor, and the direction along the road (road) or towards the player (walk). */
export interface EventAnchor {
  x: number;
  z: number;
  yaw: number;
}

export interface EventDef {
  /** Unique kebab-case id; the trainer triggers events by it. */
  id: string;
  /** Shown in the callout when the player comes near, and on the map. */
  title: string;
  category: EventCategory;
  /** One line under the title in the callout: what the player can do ("Crack the thief or let him run"). */
  hint: string;
  /** Relative pick weight (1 = normal). */
  weight: number;
  /** Seconds before this event can be picked again. */
  cooldown: number;
  /** Seconds it lives at most; the director ends it ('gone') after that. */
  duration: number;
  /** 'road' = on a road node (cars), 'walk' = on a sidewalk/plaza walk point (gnomes on foot). */
  anchor: 'road' | 'walk';
  /**
   * A deliberate road scene (a chase, a traffic stop, a crash): its gnomes and props may stand on the road. Otherwise
   * the kit moves every gnome, walk target and prop of the event off road surfaces onto the verge.
   */
  roadScene?: boolean;
  /** Spawn filter (random spawns only; the trainer ignores it). Absent = anywhere, any time. */
  when?(c: SpawnContext): boolean;
  /** Build the scene at `at` and return its script. */
  start(kit: EventKit, at: EventAnchor): EventScript;
}

/** How an event ended: done = the player got involved and it resolved, failed = it resolved without them / they lost, gone = it simply ran its course. */
export type EventStatus = 'running' | 'done' | 'failed' | 'gone';

export interface EventScript {
  /** Every frame while running. Return 'running' to continue. */
  update(dt: number, kit: EventKit): EventStatus;
  /** Where the map dot goes (default: the anchor). */
  blip?(): { x: number; z: number } | null;
}

export interface GnomeOpts {
  x: number;
  z: number;
  /** Overrides on a random townsgnome look (hat/shirt colours, beard...). */
  look?: Partial<GnomeLook>;
  /** Shown when shot / in toasts. Default: a random gnome name. */
  name?: string;
}

/** A gnome on foot that an event controls. It is a real pedestrian (npcs.ts): it can be shot, run over and knocked. */
export interface Actor {
  readonly npc: Npc;
  readonly name: string;
  x(): number;
  z(): number;
  /** Walk to (x, z), then stand there. */
  walkTo(x: number, z: number): void;
  /** Run to (x, z) (hands up, panicky), then stand there. */
  runTo(x: number, z: number): void;
  /** Stand still where it is now (or at (x, z) if given). */
  hold(x?: number, z?: number): void;
  /** Turn to look at (x, z) while standing. */
  face(x: number, z: number): void;
  /** Run away from (fromX, fromZ) for a few seconds, then stand where it ends up. */
  flee(fromX: number, fromZ: number): void;
  /** Within r of where it was last sent (walkTo/runTo/hold). */
  arrived(r?: number): boolean;
  /** The player shot it apart: it is gone for good. */
  cracked(): boolean;
  /** Knocked over (ragdoll) right now. */
  down(): boolean;
  /** Was knocked over or cracked at any time since spawning. */
  stopped(): boolean;
  /** Take it out of the world now. */
  remove(): void;
}

export interface CarOpts {
  kind: VehicleKind;
  x: number;
  z: number;
  yaw: number;
  tint?: number;
  /** Driver look overrides; null = an empty car (no driver). Default: a random driver. */
  driver?: Partial<GnomeLook> | null;
}

/** A car an event controls (pushed into the game's vehicle list, so the player can steal or wreck it). */
export interface Car {
  readonly v: Vehicle;
  /** Drive along the roads to (x, z) at `throttle` (0..1, default 0.7); stops on arrival. Recomputes the route. */
  driveTo(x: number, z: number, throttle?: number): void;
  /** Chase another car or point every frame (re-aims straight at it, no road route). */
  follow(target: { x: number; z: number } | (() => { x: number; z: number }), throttle?: number): void;
  /** Stop driving (brake to a halt). */
  stop(): void;
  /** Reached the last driveTo goal (within r, default 8). */
  arrived(r?: number): boolean;
  /** The player is driving it (stolen). */
  stolen(): boolean;
  /** Blown up. */
  wrecked(): boolean;
  /** No NPC at the wheel any more (stolen, wrecked, or the driver got out). */
  lost(): boolean;
  /** The driver climbs out and becomes an Actor beside the car (null if there is no NPC driver). */
  eject(): Actor | null;
}

/** The toolbox an event script gets. One kit per running event; everything it spawns is cleaned up with it. */
export interface EventKit {
  /** Seconds since the event started. */
  readonly t: number;
  readonly player: Player;
  readonly world: World;
  readonly fx: Fx;
  rand(): number;
  pick<T>(list: readonly T[]): T;
  /** Ground height at (x, z). */
  ground(x: number, z: number): number;
  /** Distance from the player (or the player's vehicle) to (x, z), flat. */
  dist(x: number, z: number): number;
  near(x: number, z: number, r: number): boolean;
  /** Player position, flat (the vehicle's when driving). */
  px(): number;
  pz(): number;
  inVehicle(): boolean;
  /** (x, z) moved off any road surface onto the verge (unchanged when already off the road). */
  offRoad(x: number, z: number): { x: number; z: number };
  /**
   * A road node ('road') or sidewalk point ('walk') min..max units from (fromX, fromZ) (default: the event's anchor),
   * e.g. where a thief runs to or a getaway car drives to. Null when there is none.
   */
  spot(kind: 'road' | 'walk', min: number, max: number, fromX?: number, fromZ?: number): EventAnchor | null;
  gnome(o: GnomeOpts): Actor;
  car(o: CarOpts): Car;
  /** A @lawn/prefabs prefab placed on the ground (removed with the event). Move it yourself; use ground() for y. */
  prop(id: string, x: number, z: number, yaw?: number, scale?: number): THREE.Object3D;
  /** Remove a prop early. */
  dropProp(o: THREE.Object3D): void;
  /** A toast, only if the player is within earshot (HEAR_RADIUS) of (x, z) (default: the anchor). */
  say(text: string, x?: number, z?: number, ms?: number): void;
  /** A toast no matter where the player is. */
  tell(text: string, ms?: number): void;
  sfx(s: Sfx): void;
  addHeat(amount: number): void;
  /** Watch heat now. */
  heat(): number;
  /** Pay the player (scaled by perks), with a "+N Acorns" toast. */
  reward(acorns: number, reason: string): void;
  /** Take Acorns (a tip, a bet). False when the player cannot afford it. */
  charge(acorns: number, reason: string): boolean;
  /** Heal the player by `amount` (0..1). */
  heal(amount: number): void;
}
