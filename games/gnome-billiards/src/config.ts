// Gnome Billiards: shared constants. Units: the table is TABLE_W long (x) and TABLE_H wide (y), balls are BALL_R in radius.
// The physics only uses + - * / and sqrt on simulated values, which IEEE floats make identical in every browser, so two
// players given the same shot reach the same table.

export const GAME_ID = 'gnome-billiards' as const;

export const TABLE_W = 2;
export const TABLE_H = 1;
export const BALL_R = 0.0225;
/** Ball-on-ball restitution and cushion restitution. */
export const BALL_E = 0.95;
export const CUSHION_E = 0.72;
/** Linear rolling slow-down, table units per second squared. */
export const ROLL_DECEL = 0.42;
/** Below this speed a ball counts as at rest. */
export const REST_SPEED = 0.012;
export const MAX_SHOT_SPEED = 2.6;
/** Pulling the cue back this far (table units) is a full-power shot. */
export const PULL_MAX = 0.35;
/** Fixed physics step. The shot is simulated in these steps, never in frame time. */
export const SUB_DT = 1 / 240;
/** A shot that has not settled after this long (seconds of table time) is stopped where it is. */
export const SETTLE_LIMIT_S = 40;
/** Pause before Big Lou takes a shot, so the player can see whose turn it is. */
export const CPU_THINK_S = 1.1;
/** Table-edge margin in table units, drawn as the wooden rail. */
export const RAIL = 0.11;

export const CUE_BALL = 0;
export const EIGHT_BALL = 8;
export const CPU_NAME = 'Big Lou';
