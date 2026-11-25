// E24 comedy job: the shared contracts of the comedy modules (material.ts the sets and heckles, show.ts the pure show
// clock, club.ts the cellar interior, stageUi.ts the captions overlay, runtime.ts the staging). The joke: the player
// does nothing. Their gnome performs a painfully unfunny set and the Pardonlin crowd grills it.

/** The interior id of Le Petit Groan (club.ts defineInterior). */
export const COMEDY_CLUB_ID = 'le-petit-groan';
/** club.ts's "Go on stage" spot dispatches this window event (no detail); runtime.ts listens and starts the set. */
export const COMEDY_START_EVENT = 'gta:comedy-start';

/** Room layout, interior-local metres (origin = room centre on the floor; +z south). The room is 16 (x) by 12 (z). */
export const CLUB = {
  size: { w: 16, d: 12, h: 4 },
  /** Where the comedian stands, facing the crowd (yaw 0 = facing +z). */
  stage: { x: 0, z: -3.6, yaw: 0 },
  /** The "Go on stage" spot at the foot of the stage steps. */
  stageSteps: { x: 2.6, z: -1.6 },
  /** Where the player is put after the set. */
  after: { x: 2.6, z: -1.0, yaw: Math.PI },
  /** Ten crowd seats (index = seat number), facing the stage; tomatoes fly from these. */
  seats: [
    { x: -4.5, z: 0.6 }, { x: -1.5, z: 0.4 }, { x: 1.5, z: 0.4 }, { x: 4.5, z: 0.6 },
    { x: -5.2, z: 2.6 }, { x: -2.2, z: 2.4 }, { x: 2.2, z: 2.4 }, { x: 5.2, z: 2.6 },
    { x: -3, z: 4.4 }, { x: 3, z: 4.4 },
  ],
} as const;

/** How the room answers a beat (runtime.ts plays its sound and caption; show.ts escalates it on a Double Down). */
export type CrowdReaction =
  | 'silence' | 'cricket' | 'cough' | 'groan' | 'sigh' | 'boo' | 'heckle' | 'tomato' | 'walkout' | 'pity-clap';

export interface Beat {
  /** What the player's gnome says. */
  line: string;
  /** A player animation id (anim/types.ts EMOTE_IDS, EMOTE_B_IDS, IDLE_IDS, BIT_IDS...) played on the line, or none. */
  anim?: string;
  /** Seconds the line holds before the reaction (2.5..6). */
  s: number;
  react: CrowdReaction;
  /** A specific heckle for this beat (else show.ts picks one from HECKLES when react is 'heckle'). */
  heckle?: string;
}

export interface ComedySet {
  id: string;
  /** "Hedges: What Is the Deal". */
  title: string;
  /** Comedian level that unlocks it (1..5): sets get longer and worse. */
  level: number;
  /** Mireille Sans-Rire introduces the act. */
  intro: string;
  beats: readonly Beat[];
  /** The last line before the gnome leaves the stage. */
  closer: string;
}

/** A crowd member who heckles: a name and a seat (CLUB.seats index). */
export interface Heckler { name: string; seat: number }

/** What show.ts asks runtime.ts to do, in order. */
export type ShowEvent =
  | { t: 'intro'; text: string }
  | { t: 'line'; text: string; anim?: string; s: number }
  | { t: 'react'; kind: CrowdReaction }
  | { t: 'heckle'; who: Heckler; text: string }
  | { t: 'tomato'; seat: number }
  | { t: 'doubled'; text: string }
  | { t: 'closer'; text: string }
  | { t: 'end' };

/** The captions and the one button (stageUi.ts openStageUi). */
export interface StageUi {
  /** Mireille's intro or the gnome's line, typed out over `s` seconds at the bottom of the screen. */
  line(speaker: string, text: string, s: number): void;
  /** A heckle bubble from the side: name + text, shown 2.5 s. */
  heckle(name: string, text: string): void;
  /** A small stage-direction caption: "*long silence*", "*one cough*", "*a tomato*". */
  reaction(kind: CrowdReaction): void;
  /** The cringe meter, 0..100. */
  meter(cringe: number): void;
  /** Enable the Double Down button (only right after a bad reaction). */
  setDoubleDown(enabled: boolean): void;
  /** A tomato hits the camera side: a red splat that slides down and fades. */
  splat(): void;
  close(): void;
}

export interface StageUiOpts {
  /** The set's title, shown small at the top: "Tonight: <title>". */
  title: string;
  onDoubleDown(): void;
  /** "Walk off" (leave early: no pay). */
  onLeave(): void;
}
