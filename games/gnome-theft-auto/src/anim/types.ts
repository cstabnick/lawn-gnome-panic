// The gnome animation library's contract: every id, the parts a pose can drive, and one table row (AnimDef).
// The rows live in emotes.ts, emotesB.ts, dances.ts, idles.ts, reacts.ts, reactsB.ts, work.ts, roles.ts, hunt.ts and
// ride.ts; index.ts joins them; animator.ts plays them.
//
// How the shared gnome model (@lawn/gnome createGnomeModel) moves. All angles are radians, all poses are applied AFTER
// model.update(), which re-writes the arms' and legs' rotation.x every frame:
//   armL / armR  pivot at the shoulder; [0,0,0] hangs straight down. x < 0 swings the arm forward and up
//                (-1.57 straight forward, -2.9 straight up), x > 0 swings it back. z swings it out sideways:
//                LEFT arm z > 0 is outward, RIGHT arm z < 0 is outward (left [0,0,1.5] + right [0,0,-1.5] = a T).
//                y twists the arm about its own length (rarely needed). Arms are rigid: no elbows.
//   legL / legR  pivot at the hip (0.3 m up); x < 0 swings the leg forward (-1.57 = straight out, as when sitting),
//                x > 0 back. LEFT leg z > 0 / RIGHT leg z < 0 swing it out sideways.
//   body         [rx, ry, rz] rotates the whole rig about the FEET: rx > 0 leans forward (0.6 = a deep bow),
//                rx < 0 leans back (-1.57 lies flat on the back: add lift 0.24 so it rests on the ground);
//                ry > 0 turns the body to its left; rz > 0 tilts it over to its right, rz < 0 to its left.
//   lift         metres added to the rig's height: +0.3 a hop, -0.26 sits the hips on the ground (with both legs at x -1.57).
// The head is part of the body: a nod is a small body rx, a head shake a small body ry.
// Gnome left is +x and the gnome faces +z.

/** Things the player and townsgnomes do for show: the emote menu's first page. */
export const EMOTE_IDS = [
  'wave', 'point', 'shrug', 'cheer', 'clap', 'facepalm', 'thumbs-up', 'salute', 'bow', 'shake-fist', 'beckon', 'laugh',
  'taunt', 'flex',
] as const;
/** Dances: all loop. */
export const DANCE_IDS = ['dance-jig', 'dance-robot', 'dance-disco', 'dance-flail', 'dance-hop'] as const;
/** Standing about, sitting and sleeping: what an idle townsgnome does between walks. */
export const IDLE_IDS = [
  'look-around', 'stretch', 'yawn', 'scratch-head', 'tap-foot', 'hands-on-hips', 'cross-arms', 'sit-ground', 'sleep',
  'lean-back', 'think', 'one-leg',
] as const;
/** Reactions: fear, pain, falls. */
export const REACT_IDS = ['cower', 'panic', 'stumble', 'hurt', 'knockdown', 'get-up', 'dizzy', 'flinch'] as const;
/** Working poses, each with a hand prop (AnimDef.prop). All loop. */
export const WORK_IDS = ['fish', 'dig', 'sweep', 'saw', 'rake', 'water', 'read'] as const;

// ---- Batch 2 ----
/** More emotes (category 'emote'; rows in emotesB.ts). */
export const EMOTE_B_IDS = [
  'blow-kiss', 'air-guitar', 'raise-roof', 'slow-clap', 'peace', 'nope', 'yes-nod', 'headbang', 'call-me', 'victory',
  'tantrum', 'chicken',
] as const;
/** More reactions: weather, vehicles, falls and recoveries (category 'react'; rows in reactsB.ts). */
export const REACT_B_IDS = [
  'shiver-cold', 'shield-rain', 'shade-sun', 'duck-cover', 'jump-back', 'dodge-left', 'dodge-right', 'fall-forward',
  'limp', 'dust-off', 'hurt-arm', 'gasp', 'cough-smoke', 'sneeze',
] as const;
/** Job idles for townsgnomes with a role (category 'role'; rows in roles.ts). All loop. */
export const ROLE_IDS = [
  'direct-traffic', 'guard-stand', 'vendor-call', 'wrench-fix', 'stir-pot', 'paint-wall', 'juggle', 'busk-guitar',
  'phone-call', 'take-notes', 'torch-patrol', 'measure',
] as const;
/** Hunting and fishing (category 'hunt'; rows in hunt.ts). */
export const HUNT_IDS = [
  'crouch-stalk', 'crouch-aim', 'slingshot-draw', 'spear-ready', 'spear-throw', 'skin', 'track-ground', 'fish-cast',
  'fish-reel', 'fish-catch', 'lasso-twirl', 'bird-call',
] as const;
/** Seated riding poses: passengers, boats, golf cart (category 'ride'; rows in ride.ts). All loop. */
export const RIDE_IDS = [
  'heli-passenger', 'plane-passenger', 'hang-out-door', 'boat-row', 'boat-paddle', 'boat-lookout', 'golf-cart-drive',
  'golf-cart-passenger', 'hold-on', 'seasick', 'wave-from-seat', 'sleep-seated',
] as const;

// ---- Round 3: character ----
/**
 * Personality walk/run overlays and standing styles per townsgnome archetype (category 'style'; rows in styles.ts).
 * walk-* and run-* rows are `onMove`: they ride on top of the walk cycle (arms and body only).
 */
export const STYLE_IDS = [
  'walk-swagger', 'walk-shuffle', 'walk-tiptoe', 'walk-sulk', 'walk-jaunty', 'walk-nervous', 'walk-proud', 'walk-sleepy',
  'walk-pompous', 'run-flail', 'run-pump', 'run-sneak',
  'idle-swagger', 'idle-nervous', 'idle-proud', 'idle-sleepy', 'idle-pompous', 'idle-sulk', 'idle-jaunty',
] as const;
/** Mood layers: arms-and-body overlays that work standing or walking (category 'style', `onMove`; rows in moods.ts). */
export const MOOD_IDS = ['mood-happy', 'mood-angry', 'mood-scared', 'mood-bored', 'mood-tipsy'] as const;
/** Situational bits of town life (category 'bit'; rows in bits.ts). */
export const BIT_IDS = [
  'wait-bus', 'read-map', 'check-watch', 'window-shop', 'haggle', 'argue', 'gossip', 'count-acorns', 'tie-shoe',
  'hiccups', 'sweat-heat', 'shiver-fells', 'dust-hat', 'pat-pockets', 'eat-snack', 'sip-drink', 'feed-birds', 'sit-bench',
] as const;
/** Reactions to the world's new sights: flyovers, birds, fish, hunts, the skyway view, phones (category 'react'; reactsC.ts). */
export const REACT_C_IDS = [
  'look-up-flyover', 'wave-banner-plane', 'spot-bird', 'fish-triumph', 'fish-sulk', 'tuft-comb', 'gawk-view',
  'answer-phone', 'duck-low-plane', 'cheer-race', 'startle-horn', 'photo-snap',
] as const;
/**
 * Pair animations: each row is one side, played by two gnomes standing PAIR_GAP apart facing each other; `pair` names
 * the row the other gnome plays (category 'social'; rows in social.ts).
 */
export const SOCIAL_IDS = [
  'handshake', 'high-five', 'fist-bump', 'hug-pair', 'dance-pair', 'pair-argue', 'pair-gossip', 'pair-laugh',
  'toast-cups', 'pair-bow', 'secret-whisper', 'secret-listen',
] as const;
/**
 * Driving personalities: overlays on a driver whose hands are on the grips (driverHands.ts). They move only the LEFT
 * arm (off the wheel) and/or the body, so the right hand keeps steering (category 'drive'; rows in drive.ts).
 */
export const DRIVE_IDS = [
  'drive-casual', 'drive-white-knuckle', 'drive-road-rage', 'drive-elbow-out', 'drive-sing-along', 'drive-lean-cool',
  'drive-honk-pound', 'drive-sleepy',
] as const;

/** Metres between two gnomes doing a pair animation (feet to feet), facing each other. */
export const PAIR_GAP = 0.9;

export type StyleAnimId = (typeof STYLE_IDS)[number];
export type MoodAnimId = (typeof MOOD_IDS)[number];
export type BitAnimId = (typeof BIT_IDS)[number];
export type ReactCAnimId = (typeof REACT_C_IDS)[number];
export type SocialAnimId = (typeof SOCIAL_IDS)[number];
export type DriveAnimId = (typeof DRIVE_IDS)[number];
/** Sim jobs and tubing (rows in jobs.ts; docs/roadmaps/gta-sim-jobs-and-tubing.md): hailing a cab, carrying a parcel
 *  (category 'bit'), riding a tow tube and cheering on one (category 'ride'). */
export const JOB_IDS = ['hail-cab', 'carry-parcel', 'tube-ride', 'tube-cheer'] as const;
export type JobAnimId = (typeof JOB_IDS)[number];
/**
 * Batch 3 (E09, L63): variants of the most-seen animations, so they are not identical every time (rows in variants.ts,
 * none in the emote menu). Plain-walk overlays (category 'style', onMove): walk-easy, walk-brisk, walk-amble. Flee-run
 * overlays (category 'style', onMove): run-cover-head, run-look-back, run-arms-up. Player standing fidgets (category
 * 'bit'): idle-weight-shift, idle-hat-adjust, idle-look-back. Horn startles (category 'react'): startle-hop,
 * startle-spin. Near-miss anger (category 'react'): fist-wave-both, stomp-off. Spectator cheers (category 'react'):
 * cheer-jump, cheer-whistle.
 */
export const VARIANT_IDS = [
  'walk-easy', 'walk-brisk', 'walk-amble', 'run-cover-head', 'run-look-back', 'run-arms-up',
  'idle-weight-shift', 'idle-hat-adjust', 'idle-look-back', 'startle-hop', 'startle-spin', 'fist-wave-both', 'stomp-off',
  'cheer-jump', 'cheer-whistle',
] as const;
export type VariantAnimId = (typeof VARIANT_IDS)[number];
export type EmoteAnimId = (typeof EMOTE_IDS)[number];
export type EmoteBAnimId = (typeof EMOTE_B_IDS)[number];
export type ReactBAnimId = (typeof REACT_B_IDS)[number];
export type RoleAnimId = (typeof ROLE_IDS)[number];
export type HuntAnimId = (typeof HUNT_IDS)[number];
export type RideAnimId = (typeof RIDE_IDS)[number];
export type DanceAnimId = (typeof DANCE_IDS)[number];
export type IdleAnimId = (typeof IDLE_IDS)[number];
export type ReactAnimId = (typeof REACT_IDS)[number];
export type WorkAnimId = (typeof WORK_IDS)[number];
export type AnimId = EmoteAnimId | DanceAnimId | IdleAnimId | ReactAnimId | WorkAnimId
  | EmoteBAnimId | ReactBAnimId | RoleAnimId | HuntAnimId | RideAnimId
  | StyleAnimId | MoodAnimId | BitAnimId | ReactCAnimId | SocialAnimId | DriveAnimId | JobAnimId | VariantAnimId;

export type AnimCategory =
  'emote' | 'dance' | 'idle' | 'react' | 'work' | 'role' | 'hunt' | 'ride' | 'style' | 'bit' | 'social' | 'drive';
export type AnimPart = 'armL' | 'armR' | 'legL' | 'legR' | 'body';
export type Vec3 = [number, number, number];

/** One frame of an animation: a rotation for each part the row lists (and only those), plus an optional lift. */
export type AnimPose = Partial<Record<AnimPart, Vec3>> & { lift?: number };

/** One row of the animation table. */
export interface AnimDef<Id extends AnimId = AnimId> {
  id: Id;
  /** Shown on the emote menu tile, at most 12 characters ("Wave", "Jig"). */
  label: string;
  /** One emoji for the emote menu tile. */
  icon: string;
  category: AnimCategory;
  /** Seconds for one play (one cycle when `loop`). */
  duration: number;
  /** Repeat until stopped (dances, work, holds like sit-ground or cower). Non-loops end by themselves after `duration`. */
  loop: boolean;
  /**
   * The parts this row drives; the others keep what model.update() gave them. A row with only arms plays while walking
   * (a wave on the move); a row with legs or body stops when the gnome walks.
   */
  parts: readonly AnimPart[];
  /** Listed in the player's emote menu. */
  emote: boolean;
  /** A @lawn/prefabs id held in the right hand while it plays (buildGear('hand', prop)), e.g. 'fishing-rod'. */
  prop?: string;
  /** Rides on top of the walk cycle: keeps playing while the gnome walks (styles, moods). Arms and body only. */
  onMove?: boolean;
  /** Pair rows: the row the partner plays, standing PAIR_GAP in front, facing this gnome. */
  pair?: AnimId;
  /**
   * The pose at t seconds, 0 <= t < duration. Returns exactly the parts listed in `parts` (plus `lift` when used).
   * Pure: no Math.random, no state. A loop should end where it starts (use sin/cos of 2*PI*t/duration times a whole
   * number). The animator blends 0.2 s in and out, so a non-loop may start and end anywhere.
   */
  pose(t: number): AnimPose;
}
