// E25 firefighter job (Fire Station No. 1): shared contracts for calls.ts, hose.ts, hoseView.ts, hoseUi.ts, station.ts
// and runtime.ts. Pure types and tuning. Fires themselves are the shared fire system (src/fire/).
// Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md.

export type CallKind = 'bin' | 'shed' | 'bbq' | 'toadstool';
export const CALL_KINDS: readonly CallKind[] = ['bin', 'shed', 'bbq', 'toadstool'];

/** Where a call can happen. forest places only get toadstool calls; other places never do. */
export interface CallPlace {
  id: string;
  name: string;
  x: number;
  z: number;
  area: 'city' | 'outskirts' | 'forest';
}

/** A prop the call puts in the world (local offset from the call centre; yaw relative to the call's facing). */
export interface CallProp {
  prefab: string;
  dx: number;
  dz: number;
  yaw: number;
  scale?: number;
  /** Tint for prefabs with 'tint' parts. */
  tint?: number;
}

/** A burning point (lit when the call starts) or a fuel point (catches if left too long), local to the centre. */
export interface CallFire {
  dx: number;
  /** Height of the flames' base above the ground (0 = ground, 2.2 = a shed roof). */
  y: number;
  dz: number;
  r: number;
  /** Seconds of fuel at full heat. */
  fuel: number;
}

/** Someone stuck up high: a gnome on a shed roof, or Asphalt the cat on a lamp post. */
export interface CallRescue {
  who: 'gnome' | 'cat';
  name: string;
  dx: number;
  /** Height of the perch, metres. */
  y: number;
  dz: number;
  /** Ladder extension window 0..1 to let go in (see hose.ts stepLadder). */
  band: [number, number];
  /** What they say once down. */
  thanks: string;
}

export interface FireCall {
  id: number;
  kind: CallKind;
  /** "Shed fire: Juniper Vance's terrace". */
  title: string;
  place: CallPlace;
  props: CallProp[];
  fires: CallFire[];
  spread: CallFire[];
  rescue: CallRescue | null;
  /** Who phoned it in, and their line ("It was like that when I got here."). */
  caller: string;
  line: string;
  seed: number;
}

export interface CallOutcome {
  /** Seconds from the call to the last fire out. */
  seconds: number;
  /** 0..1 of the fuel that burned away (0 = caught at once, 1 = burnt to the ground). */
  burnt: number;
  /** Litres sprayed. */
  water: number;
  /** null = the call had no rescue. */
  rescued: boolean | null;
}

export interface CallScore {
  stars: 1 | 2 | 3 | 4 | 5;
  /** Shift-card lines ("Arrived in 48 s", "Shed: mostly a shed still"). */
  lines: string[];
  /** The chief's verdict (shift-card quote). */
  quote: string;
}

/** Tuning (tweak here). */
export const FIRE_JOB = {
  /** The engine stopped within this of the call centre: "Man the hose". */
  hoseRange: 32,
  stopSpeed: 1.2,
  /** Tank, seconds of spray at level 1; + per level above 1. */
  tankS: 30,
  tankPerLevelS: 4,
  /** Litres a second of spray. One tank second = one litre. */
  litresPerS: 1,
  /** Refill per second when stopped within hydrantRadius of a hydrant. */
  refillPerS: 6,
  hydrantRadius: 7,
  /** A call nobody answers within this long burns out (fails). */
  callTimeoutS: 300,
  /** The next call comes this long after the shift card closes, while on duty. */
  nextCallS: 6,
  /** Out of the engine and this far from it for abandonS seconds: off duty. */
  abandonDist: 80,
  abandonS: 45,
} as const;

/**
 * The Watering-Can Pumper prefab (gta-fire-engine): pivot 'nozzle' (the can's spout, front top: the hose stream starts
 * here; rotation.y = aim yaw relative to the engine, rotation.x = -pitch) and pivot 'ladder' (on the roof: rotation.y
 * turns it, rotation.x = -elevation, scale.z = 1 + 1.4 * extension stretches it).
 */
export const PUMPER = { nozzle: 'nozzle', ladder: 'ladder' } as const;

/** Window event the station's "Answer the bell" spot dispatches; firefighter/runtime.ts listens. */
export const FIRE_START_EVENT = 'gta:fire-bell';
