// The cutscene script format: a scene is plain data (a SceneScript) that timeline.ts compiles into timed steps and
// samples at any moment, director.ts plays in the game, and los.ts / check.ts validate without a browser.
// Authoring guide: docs/design/gnome-theft-auto/cutscenes.md. Pure types only: no three.js, no DOM.
import type { GnomeLook } from '@lawn/gnome';
import type { Loadout } from '@lawn/glaze';
import type { CutsceneRoom } from '../quests/types';
import type { Sfx, VehicleKind } from '../types';

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
/** A point: [x, z] stands on the ground (or water, for a boat), [x, y, z] is exact. */
export type Point = Vec2 | Vec3;
/** What a camera looks at: an actor, vehicle or prop id (its head / centre, followed as it moves), or a fixed point. */
export type Target = string | Vec3;

/**
 * Where a scene is staged.
 * - 'room': an off-map set built at ROOM_ORIGIN (rooms.ts). All coordinates are room-local: floor y = 0, the back wall
 *   at z = -6.6, side walls at x = +-7.1, the open side (where cameras stand) towards +z. The world's lights are dimmed.
 *   No vehicles in rooms (they belong to the world).
 * - 'world': the real map at real positions (world coordinates). The world stays lit (the game is paused while a scene
 *   plays); the player's own gnome is hidden (an actor with `player: true` stands in for it).
 */
export type SceneStage =
  /** `bodega`: also build the Bodega & Sons corner (keeper and Asphalt the cat) at room-local BODEGA_OFFSET (30, 0, 0). */
  | { kind: 'room'; room: CutsceneRoom; bodega?: boolean }
  | { kind: 'world' };

export interface ScriptActor {
  id: string;
  /** A cast preset name from cast.ts CAST ('pip', 'tansy', 'vesper', ...): look, voice pitch, held prop and scale. */
  preset?: string;
  /** Wear the player's own gnome look (getMyGnome()), falling back to DEFAULT_LOOK. */
  player?: boolean;
  /** Speaker label on the subtitle card. Default: the preset's display name, else 'You' for the player, else the id. */
  name?: string;
  /** Overrides on top of the preset's look. */
  look?: Partial<GnomeLook>;
  /** Voice pitch (Hz) for @lawn/mutter. Default: the preset's, else 100. */
  hz?: number;
  /** Model scale. Default: the preset's, else 1 on a world stage and 1.45 in a room. */
  scale?: number;
  /** Prefab id held in the right hand (buildHeld). null = empty-handed even if the preset holds something. */
  held?: string | null;
  /** Start position. */
  at: Point;
  /** Start facing, radians (0 = facing +z, PI/2 = facing +x). Default 0. */
  yaw?: number;
  /** Off stage until a 'spawn' step. */
  hidden?: boolean;
  /** Starts seated in this vehicle (a ScriptVehicle id). `at` is then ignored. */
  seatedIn?: string;
  /** Seat in that vehicle: 0 = driver (default), 1.. = passenger seats. */
  seat?: number;
}

export interface ScriptVehicle {
  id: string;
  /** Any game vehicle (config.ts VEHICLES): mowers, 'lowrider', 'hoa-van', 'snail-coach', boats, 'plane', ... */
  kind: VehicleKind;
  /**
   * 'player': use the vehicle the player is driving when the scene starts (pull up in what you drove). If the player is
   * on foot, a `kind` is spawned instead. The player's vehicle is never removed: it stays where the scene leaves it.
   * Default 'spawn'.
   */
  from?: 'spawn' | 'player';
  /** Start position. [x, z] = on the ground (a boat: on the water surface). Flyers give [x, y, z]. */
  at: Point;
  yaw?: number;
  /** Body colour for a spawned vehicle. */
  tint?: number;
  /** Pay 'n' Glaze look for a spawned vehicle (merged onto the stock look with normalizeLoadout). */
  loadout?: Partial<Loadout>;
  /** Off stage until a 'spawn' step. */
  hidden?: boolean;
  /** Headlights on from the start. */
  headlights?: boolean;
  /** World stage only: the spawned vehicle stays in the world after the scene (handed to the game), else removed. */
  keep?: boolean;
}

export interface ScriptProp {
  id: string;
  /** @lawn/prefabs id (buildPrefab). */
  prefab: string;
  at: Point;
  yaw?: number;
  /** Fit the prefab so its widest side ('w', default) or height ('h') is this many metres. Default: prefab size. */
  size?: number;
  by?: 'w' | 'h';
  hidden?: boolean;
}

/**
 * Arm and body poses. 'sit' and 'stand' change the resting pose until the next one; the rest last `s` seconds.
 * Emotes for acting (direction/bible.md): 'flinch' (jolt back, hands up: a surprise or a hit), 'slump' (shoulders and
 * head drop: defeat, grief), 'think' (hand to the beard: weighing it up), 'clutch' (arm across the body: hurt, or
 * holding something precious), 'beckon' (come here), 'tipHat' (a hand to the brim: hello, goodbye, a threat said
 * politely), 'stomp' (a foot-down bob: temper).
 */
export type Gesture =
  | 'wave' | 'point' | 'shrug' | 'nod' | 'cheer' | 'handsUp' | 'lean' | 'crossArms' | 'facepalm' | 'bow' | 'sit' | 'stand'
  | 'flinch' | 'slump' | 'think' | 'clutch' | 'beckon' | 'tipHat' | 'stomp';

/**
 * Cutscene music: procedural loops from cueAudio.ts. The story themes: 'turfton' (the main theme, laid-back street
 * swing), 'turfton-dusk' (the same tune slow and soft, for chapter endings), 'finale' (the main theme at full tilt),
 * 'villain' (Vesper's motif), 'fescue' (Mossy Wood folk), 'frost' (Frostbite Fells bells), 'sandpit' (Fort Sandpit march).
 */
export type MusicTrack =
  | 'tension' | 'warm' | 'heist' | 'sad' | 'triumph' | 'mystery' | 'chase'
  | 'turfton' | 'turfton-dusk' | 'finale' | 'villain' | 'fescue' | 'frost' | 'sandpit';
/** Ambience beds (looped, procedural). */
export type AmbienceBed = 'room' | 'street' | 'forest' | 'wind' | 'night' | 'crowd' | 'water' | 'rain';
/** One-shot musical hits. 'villain': Vesper walks in. 'chapter': a chapter's title card. */
export type Stinger = 'reveal' | 'danger' | 'comic' | 'sad' | 'triumph' | 'mystery' | 'villain' | 'chapter';
/** One-shot sounds: every game Sfx (audio.ts play) plus cutscene extras made in cueAudio.ts. */
export type CueSfx = Sfx | 'footsteps' | 'door-creak' | 'whoosh' | 'punch' | 'thud' | 'skid' | 'engine-rev' | 'glass' | 'cash' | 'phone' | 'knock';

/**
 * Shot sizes for a 'frame' shot, by how much of the frame's height the gnome fills (direction/bible.md, Camera):
 * 'cu' close-up (head and beard), 'mcu' medium close-up (hat to belt), 'ms' medium (the whole gnome, snug), 'fs' full
 * (the gnome with ground round it), 'ws' wide (the gnome small in its place).
 */
export type ShotSize = 'cu' | 'mcu' | 'ms' | 'fs' | 'ws';

/** Shared by every shot: `handheld` adds a slow camera-operator wobble (metres, 0.01 calm .. 0.05 panic). Checks ignore it. */
interface ShotBase { handheld?: number }

/**
 * Camera moves. Offsets in a target's local frame are [right, up, forward]: forward = (sin yaw, 0, cos yaw),
 * right = (-cos yaw, 0, sin yaw). fov defaults to 52 (degrees, vertical).
 */
export type CamShot = ShotBase & (
  /** Hold still at `pos` looking at `look` (a moving target is followed with the eyes). */
  | { kind: 'cut'; pos: Vec3; look: Target; fov?: number }
  /** Move from -> to over `s` seconds, looking at `look` (or panning from `look` to `lookTo`). ease default 'smooth'. */
  | { kind: 'dolly'; from: Vec3; to: Vec3; look: Target; lookTo?: Target; s: number; ease?: 'linear' | 'smooth'; fov?: number; fovTo?: number }
  /** Circle `around` at `radius`, `height` above it, from yaw `fromYaw` to `toYaw` (radians, 0 = camera on the +z side) over `s`. */
  | { kind: 'orbit'; around: Target; radius: number; height: number; fromYaw: number; toYaw: number; s: number; fov?: number }
  /** Ride along with an actor or vehicle: camera at `offset` (default [0, 2.2, -5.5], behind), looking at `look` (default [0, 1, 3]), both in its local frame. `lag` seconds of yaw smoothing (default 0.35; 0 = rigid, use 0 for interior shots). */
  | { kind: 'follow'; who: string; offset?: Vec3; look?: Vec3; lag?: number; fov?: number }
  /** A fixed camera that turns to keep `who` in frame: drive-bys, arrivals. */
  | { kind: 'track'; pos: Vec3; who: string; fov?: number }
  /**
   * Coverage on an actor by shot size, placed from where the actors stand at each moment, so it needs no coordinates
   * (direction/bible.md, Camera; helpers in direct.ts):
   * - `size`: how big the gnome is in frame (ShotSize). The lens follows the size (cu 30, mcu 35, ms 40, fs 45, ws 52
   *   degrees) unless `fov` is given.
   * - `toward`: an actor id. The camera sits near the line from `who` to `toward` (an eyeline single: `who` looks just
   *   past the lens at `toward`). Without it the camera faces `who` straight on.
   * - `side`: degrees the camera swings round `who` off that line; positive swings it to `who`'s left as `who` faces
   *   `toward` (default 25). Negative: to the right.
   * - `over`: an actor id. An over-the-shoulder shot from behind `over` onto `who`; `side` > 0 puts the camera at the
   *   over actor's right shoulder, < 0 at the left (default 1).
   * - `height`: 'eye' (default), 'low' (looking up: power, threat, heroics), 'high' (looking down: small, cornered).
   * The camera moves with the actors (a walk-and-talk if they walk). direct.ts `coverage(a, b)` builds a matched set on
   * one side of the line.
   */
  | { kind: 'frame'; who: string; size: ShotSize; toward?: string; over?: string; side?: number; height?: 'eye' | 'low' | 'high'; fov?: number }
);

/** Every step may set `async: true`: the next step starts at the same moment instead of after this one. */
interface Base { async?: boolean }

export type Step =
  /** Do nothing for `s` seconds. */
  | (Base & { do: 'wait'; s: number })
  /** Run each track (a list of steps, run in order) at the same time; ends when the longest track ends. */
  | (Base & { do: 'parallel'; tracks: Step[][] })
  /**
   * A dialogue line. Types out letter by letter at the player's text speed with mutter blips, the speaker bobs while
   * the text types, then holds for reading time (238 wpm, at least 1.5 s). A tap finishes the typing; the next tap
   * ends the line. `who` is an actor id, or any label (e.g. 'Narrator') for an off-screen voice.
   * `music` / `stinger` / `sfx` are cues that fire as the line starts (`music: null` stops the music).
   */
  | (Base & { do: 'say'; who: string; text: string; icon?: string; hz?: number; music?: MusicTrack | null; stinger?: Stinger; sfx?: CueSfx })
  /** Walk (or run) along `path` from wherever the actor is. Default speed 1.6 m/s walking, 4 running. Faces along the path. */
  | (Base & { do: 'walk'; who: string; path: Point[]; speed?: number; run?: boolean })
  /** Turn to `yaw`, or towards `at` (an id or [x, z]), over `s` seconds (default 0.4). */
  | (Base & { do: 'face'; who: string; yaw?: number; at?: string | Vec2; s?: number })
  /** Play a gesture for `s` seconds (default 1.2). */
  | (Base & { do: 'gesture'; who: string; name: Gesture; s?: number })
  /** Put a hidden actor, vehicle or prop on stage (optionally at a new place). */
  | (Base & { do: 'spawn'; id: string; at?: Point; yaw?: number })
  /** Take an actor, vehicle or prop off stage. */
  | (Base & { do: 'despawn'; id: string })
  /** Put a prefab in the actor's right hand (null = empty the hand). */
  | (Base & { do: 'hold'; who: string; prop: string | null })
  /** Hand whatever `from` holds (or `prop`) to `to` over `s` seconds (default 1): both reach, it changes hands halfway. */
  | (Base & { do: 'give'; from: string; to: string; prop?: string; s?: number })
  /** Get into a vehicle with the real mount.ts sequence (walk, door, climb, settle). Waits until seated. `s` = planned length (default 2.6). */
  | (Base & { do: 'enter'; who: string; vehicle: string; seat?: number; s?: number })
  /** Get out of the vehicle the actor sits in, to its exit point. Waits until standing. `s` default 2.2. */
  | (Base & { do: 'exit'; who: string; s?: number })
  /**
   * Drive (sail, fly) along `path` from wherever the vehicle is, at `speed` m/s average. A Catmull-Rom spline through
   * the points unless `spline: false`. `depart` eases in from a stop, `arrive` eases out to a stop (both default true;
   * set depart false for a vehicle already moving, arrive false for a getaway that leaves at speed).
   * Wheels turn, the body leans on its suspension, the engine hums. Flyers give [x, y, z] points.
   */
  | (Base & { do: 'drive'; vehicle: string; path: Point[]; speed: number; spline?: boolean; depart?: boolean; arrive?: boolean })
  /** Headlights on or off. */
  | (Base & { do: 'lights'; vehicle: string; on: boolean })
  /** Sound the vehicle's horn. */
  | (Base & { do: 'horn'; vehicle: string })
  /** Change the camera. Never waits, unless `wait: true` (then it waits the shot's `s`). */
  | (Base & { do: 'cam'; shot: CamShot; wait?: boolean })
  /** Shake the camera (amp in metres, ~0.05 subtle .. 0.4 explosion) for `s` seconds. Never waits. */
  | (Base & { do: 'shake'; amp: number; s: number })
  /** Start, change (crossfade over `fade`, default 1.5 s) or stop (`track: null`) the scene music. */
  | (Base & { do: 'music'; track: MusicTrack | null; fade?: number })
  /** Start, change or stop (null) the ambience bed. */
  | (Base & { do: 'ambience'; bed: AmbienceBed | null; fade?: number })
  /** A one-shot sound, optionally placed at a target (panned and attenuated by distance from the camera). */
  | (Base & { do: 'sfx'; id: CueSfx; at?: Target; gain?: number })
  /** A one-shot musical hit. */
  | (Base & { do: 'stinger'; id: Stinger })
  /** Radio (Turfton FM) level while the scene plays, 0 = silent .. 1 = untouched. Scenes start at SceneScript.radio. */
  | (Base & { do: 'radio'; level: number })
  /** Call back into the game: `onTrigger(name, arg)` (quest state, spawn something, unlock). Also fired when skipped past. */
  | (Base & { do: 'call'; name: string; arg?: unknown })
  /** The title card at the top (null hides it). */
  | (Base & { do: 'title'; text: string | null })
  /** A caption pill at the bottom, for narration without a speaker (null hides it). */
  | (Base & { do: 'caption'; text: string | null })
  /** Fade to black (`to` 1) or back (`to` 0) over `s` seconds. Waits. */
  | (Base & { do: 'fade'; to: number; s: number });

/** A pacing-checker fault code (pacing.ts) that a scene may waive on purpose. */
export type PacingCode =
  | 'line-long' | 'line-outruns-shot' | 'shot-short' | 'shot-long' | 'dead-shot' | 'dead-air' | 'speaker-unseen'
  | 'speaker-small' | 'speaker-back' | 'crosses-line' | 'lines-per-shot' | 'speaker-run' | 'narration' | 'no-hook'
  | 'opens-on-narration' | 'scene-long' | 'repeat-line';

/** A deliberate break of a pacing rule, with the reason (direction/bible.md, Waivers). */
export interface PacingWaiver {
  code: PacingCode;
  /** Only faults whose line text or detail contains this; omit to waive every fault of this code in the scene. */
  match?: string;
  /** Why the rule is broken here, in a few words. */
  why: string;
}

/** Scene kinds with their own length targets (direction/bible.md, Pacing). */
export type SceneKind =
  | 'intro' | 'outro' | 'arrival' | 'chapter-open' | 'chapter-close' | 'race-intro' | 'race-podium';

/** Director's metadata for the pacing checker. The director ignores it. */
export interface SceneDirection {
  /** Overrides the kind pacing.ts infers from the id and the title cards. */
  kind?: SceneKind;
  /** The scene's director notes (path from the repo root), once it has been re-directed. */
  notes?: string;
  waive?: PacingWaiver[];
}

export interface SceneScript {
  id: string;
  /** Director's notes path, scene kind and pacing waivers (pacing.ts reads them; nothing else does). */
  direction?: SceneDirection;
  stage: SceneStage;
  /** Title card shown at the start (the quest title for quest scenes). */
  title?: string;
  actors?: ScriptActor[];
  vehicles?: ScriptVehicle[];
  props?: ScriptProp[];
  /** Music and ambience from the first frame. */
  music?: MusicTrack;
  ambience?: AmbienceBed;
  /** Radio level while the scene plays (default 0.25: ducked under the dialogue). */
  radio?: number;
  /** Fade from black at the start and to black at the end, seconds (default 0.7 each). */
  fadeIn?: number;
  fadeOut?: number;
  /** Default true: a Skip button and Escape end the scene (every remaining 'call' still fires). */
  skippable?: boolean;
  /** World stage only: hold the sky at this time of day while the scene plays; the old sky comes back afterwards. */
  sky?: 'noon' | 'golden' | 'night';
  /**
   * World stages only. 'live' (the default on a world stage): ambient traffic, pedestrians, critters, boats and world
   * sounds keep running around the scene, while the player stays safe (no Hat Watch, no damage, no quest updates) and
   * the scene's area and drive paths are kept clear of traffic and pedestrians (liveArea.ts). 'paused': the whole game
   * stands still, as before. Room stages always pause.
   */
  world?: 'live' | 'paused';
  /**
   * Live world: the circle kept clear of traffic and pedestrians. Default: around every actor's and vehicle's start and
   * every walk path (liveArea.ts liveWorldFor). Drive paths are always kept clear as well.
   */
  clearArea?: { at: Vec2; r: number };
  /** Run in order. */
  steps: Step[];
}

// ---- Compiled form (timeline.ts) ------------------------------------------------------------------------------------

/** One step placed on the timeline. Nested 'parallel' steps are flattened; the parallel step itself is kept too. */
export interface TimedStep {
  step: Step;
  /** Seconds from the scene start. */
  start: number;
  /** Seconds it lasts (0 for instant steps). */
  dur: number;
  /** Position in the flattened list (stable tie-break for equal starts). */
  order: number;
  /** For 'say': seconds of typing (the rest of dur is the reading hold). */
  typeDur?: number;
  /**
   * 'say', 'enter', 'exit': the director may end it early (a tap) or hold the clock at its end (a mount sequence that is
   * still running).
   */
  gate: boolean;
}

export interface Timeline {
  script: SceneScript;
  /** Sorted by start, then order. */
  steps: TimedStep[];
  /** End of the last step. */
  duration: number;
}

/** How long lines take (textSpeed.ts supplies it from the player's setting). */
export interface LineTiming {
  /** Characters typed per second; Infinity = the whole line at once. */
  charsPerSecond: number;
  /** Reading hold after the line is typed, seconds. */
  holdSeconds(text: string): number;
}

/** Ground for the stage: a room's floor is 0; the world's is terrain.ts heightAt (bridges included). */
export interface StageEnv {
  ground(x: number, z: number): number;
  /** Where a vehicle of this kind sits at (x, z): ground for wheels, the water surface for boats. Default: ground. */
  vehicleGround?(kind: VehicleKind, x: number, z: number): number;
}

// ---- A sampled moment (timeline.ts sampleFrame) ----------------------------------------------------------------------

export interface ActorSample {
  id: string;
  visible: boolean;
  /** Feet position (or the seat's, while seated). */
  x: number; y: number; z: number;
  yaw: number;
  /** Ground speed m/s (drives the walk cycle). */
  speed: number;
  /** Head height above the feet, metres (0.9 x scale): what a camera looks at. */
  head: number;
  /** The gesture playing and how far into it (seconds), or null. */
  gesture: Gesture | null;
  gestureT: number;
  /** Resting pose from the last 'sit' / 'stand'. */
  sitting: boolean;
  /** Currently speaking a line that is still typing. */
  talking: boolean;
  /** Prefab id in the right hand. */
  held: string | null;
  /** Seated in this vehicle id, or null. */
  seatedIn: string | null;
  seat: number;
  /** Mid 'enter' / 'exit' step: the director plays the real mount sequence; x/y/z are a straight-line estimate. */
  mount: { vehicle: string; mode: 'enter' | 'exit'; t: number; dur: number } | null;
}

export interface VehicleSample {
  id: string;
  kind: VehicleKind;
  visible: boolean;
  x: number; y: number; z: number;
  yaw: number;
  /** Signed forward speed m/s (wheel spin, engine). */
  speed: number;
  /** -1..1 steering for the wheels' look (yaw rate based). */
  steer: number;
  headlights: boolean;
  /** True while a 'drive' step moves it. */
  driving: boolean;
}

export interface PropSample { id: string; visible: boolean; x: number; y: number; z: number; yaw: number }

export interface CameraSample {
  pos: Vec3;
  look: Vec3;
  fov: number;
  /** Index into Timeline.steps of the active 'cam' step, or -1 before the first. */
  step: number;
  /** The id the shot is aimed at ('cut'/'dolly' look, 'orbit' around, 'follow'/'track' who), or null for a fixed point. */
  target: string | null;
  /** Additive shake amplitude right now (metres). The director adds the jitter; checks ignore it. */
  shake: number;
}

/** A walk or drive path, densified to world points (timeline.ts scenePaths) for the collision checks (los.ts). */
export interface ScenePath {
  /** Actor or vehicle id. */
  who: string;
  kind: 'walk' | 'drive';
  /** Drives only. */
  vehicleKind?: VehicleKind;
  /** Index into Timeline.steps of the walk / drive step. */
  step: number;
  /** Points about every 0.5 m along the path, y on the ground (vehicles: StageEnv.vehicleGround) unless the script gave y. */
  points: Vec3[];
}

export interface SceneFrame {
  t: number;
  actors: Record<string, ActorSample>;
  vehicles: Record<string, VehicleSample>;
  props: Record<string, PropSample>;
  camera: CameraSample;
  /** The line being spoken: index into Timeline.steps, how many characters are shown, the speaker id or label. */
  say: { step: number; who: string; text: string; shown: number; typing: boolean } | null;
  title: string | null;
  caption: string | null;
  /** 0 clear .. 1 black, from 'fade' steps (the director adds the start / end fades). */
  fade: number;
}
