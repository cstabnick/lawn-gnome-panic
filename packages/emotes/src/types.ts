// Types of @lawn/emotes. An emote is a pose function of time over the @lawn/gnome rig: the two shoulder pivots, the
// two hip pivots, and the body rig (lift, side shift, spin, lean, tip). No keyframe files: every emote is code.

/** One pivot. x swings forward/back, z swings out to the side (see the axis notes in catalog.ts). Radians. */
export interface Joint {
  x: number;
  z: number;
}

/** Everything an emote may move. All zero = the gnome standing still. */
export interface EmotePose {
  armL: Joint;
  armR: Joint;
  legL: Joint;
  legR: Joint;
  /** Body rig offsets: up (m), sideways along the gnome's +x (m), spin about y, lean about z, tip forward about x (rad). */
  lift: number;
  shift: number;
  yaw: number;
  lean: number;
  tip: number;
}

export interface EmoteDef {
  /** Stable id, sent over the network and stored in the loadout. Lowercase kebab-case. */
  id: string;
  label: string;
  /** One emoji for buttons and toasts. */
  icon: string;
  /** Seconds: one cycle of a looping emote, or the whole of a one-shot. */
  duration: number;
  /** Loops until the gnome walks or plays another emote. One-shots end by themselves. */
  loop: boolean;
  /** Everyone has it; no achievement needed. */
  free?: boolean;
  /** Writes the pose at t seconds since the start (t keeps growing past duration for loops) into out (already zeroed). */
  pose(t: number, out: EmotePose): void;
}
