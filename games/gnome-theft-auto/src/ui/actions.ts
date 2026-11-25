// The action table: every thing the player can do, and how each input device reaches it. One row per action.
//   touch  where the button lives: the action cluster (input.ts), the stick / drag, the dock (contextual buttons, shown
//          only while the action is possible: ui/dock.ts), the More menu (ui/moreMenu.ts), a widget's own button
//          (job HUD, fishing HUD, weapon wheel), Options, or an open sheet.
//   kb     a keys.ts KEYS / MOVE_KEYS entry, the mouse, or 'more' (Tab, then pick it in the More menu).
//   pad    the standard-layout control per camera mode ('any' = every mode), or 'more' (View, then pick).
// actions.test.ts checks that every action has a path on all three devices and a glyph in every pad family.
// The runtime half (registerAction / runAction) lets the More menu and the dock run an action without importing the
// module that owns it: each module registers its own handler.
import type { PadButtonName } from '@lawn/gamepad';
import type { KeyAction, MOVE_KEYS } from '../keys';
import type { CameraMode } from '../types';

export type ActionId =
  | 'move' | 'look' | 'jump' | 'fire' | 'aim' | 'reload' | 'interact' | 'switchGun' | 'modKit'
  | 'boost' | 'handbrake' | 'climb' | 'descend' | 'horn' | 'banger' | 'radio'
  | 'more' | 'phone' | 'emote' | 'journal' | 'map' | 'taxi' | 'party' | 'options' | 'mute'
  | 'binoculars' | 'birdJournal' | 'huntJournal' | 'fishJournal' | 'fish' | 'fishBait'
  | 'garage' | 'lockupStore' | 'craftShop' | 'jobAction' | 'context' | 'trainer' | 'close' | 'confirm'
  | 'bag' | 'snack';

export type TouchHome = 'cluster' | 'stick' | 'drag' | 'dock' | 'more' | 'widget' | 'options' | 'sheet' | 'minimap';

export type KbBinding =
  | { key: KeyAction }
  | { move: keyof typeof MOVE_KEYS }
  | { mouse: 'left' | 'right' | 'move' }
  | { via: 'more' | 'options' };

/** A pad control, or 'more' (View, then pick it in the More menu), or 'options' (Start, then pick it). */
export type PadBinding = PadButtonName | 'more' | 'options';

export type PadMode = CameraMode | 'any';

export interface ActionDef {
  id: ActionId;
  label: string;
  icon: string;
  kb: KbBinding;
  /** Per camera mode; 'any' is used when the current mode has no entry. At least one entry. */
  pad: Partial<Record<PadMode, PadBinding>>;
  touch: TouchHome;
  /** How a touch player reaches it, in words, for hint text: 'Fire', 'the action button', '☰ › Phone'. */
  touchText: string;
  /** A tile in the More menu (when registered and available). */
  inMore?: boolean;
  /** A contextual dock button (shown only while available). */
  inDock?: boolean;
  /** Listed in the Options controls list. Default true. */
  listed?: boolean;
}

const M = '☰ ›';

export const ACTIONS: readonly ActionDef[] = [
  // ---- Always on screen: the action cluster -------------------------------------------------------------------------
  { id: 'move', label: 'Move / steer', icon: '🕹', kb: { move: 'forward' }, pad: { any: 'lstick' }, touch: 'stick', touchText: 'the left stick' },
  { id: 'look', label: 'Look', icon: '👀', kb: { mouse: 'move' }, pad: { any: 'rstick' }, touch: 'drag', touchText: 'drag on the right' },
  { id: 'jump', label: 'Jump / climb', icon: '⤒', kb: { key: 'jump' }, pad: { foot: 'south' }, touch: 'cluster', touchText: 'Jump' },
  { id: 'fire', label: 'Fire', icon: '💦', kb: { mouse: 'left' }, pad: { foot: 'rt', chute: 'rt', drive: 'rb', fly: 'rb' }, touch: 'cluster', touchText: 'Fire' },
  { id: 'aim', label: 'Aim', icon: '🎯', kb: { mouse: 'right' }, pad: { foot: 'lt', chute: 'lt' }, touch: 'cluster', touchText: 'Aim' },
  { id: 'reload', label: 'Reload', icon: '🔄', kb: { key: 'reload' }, pad: { any: 'west' }, touch: 'cluster', touchText: 'Reload' },
  { id: 'interact', label: 'Enter / exit / talk / use', icon: '✋', kb: { key: 'enterExit' }, pad: { any: 'north' }, touch: 'cluster', touchText: 'the action button' },
  { id: 'switchGun', label: 'Next gun (hold: weapon wheel)', icon: '🔫', kb: { key: 'switchGun' }, pad: { foot: 'lb', chute: 'lb' }, touch: 'cluster', touchText: 'Guns' },
  { id: 'boost', label: 'Boost', icon: '⚡', kb: { move: 'boost' }, pad: { drive: 'lb' }, touch: 'cluster', touchText: 'Boost' },
  { id: 'handbrake', label: 'Handbrake / hop', icon: '🛑', kb: { key: 'jump' }, pad: { drive: 'south' }, touch: 'cluster', touchText: 'Handbrake' },
  { id: 'climb', label: 'Climb (flying)', icon: '⬆', kb: { key: 'jump' }, pad: { fly: 'rt' }, touch: 'cluster', touchText: 'Up' },
  { id: 'descend', label: 'Descend (flying)', icon: '⬇', kb: { move: 'descend' }, pad: { fly: 'lt' }, touch: 'cluster', touchText: 'Down' },
  { id: 'horn', label: 'Horn', icon: '📯', kb: { key: 'horn' }, pad: { drive: 'l3' }, touch: 'cluster', touchText: 'Horn' },
  { id: 'banger', label: 'Share the radio banger', icon: '🔥', kb: { key: 'banger' }, pad: { drive: 'east', fly: 'east' }, touch: 'cluster', touchText: '🔥' },
  { id: 'radio', label: 'Radio dial', icon: '📻', kb: { key: 'radio' }, pad: { drive: 'right', fly: 'right' }, touch: 'cluster', touchText: 'Radio' },
  { id: 'more', label: 'More menu', icon: '☰', kb: { key: 'more' }, pad: { any: 'select' }, touch: 'cluster', touchText: '☰' },

  // ---- The More menu ----------------------------------------------------------------------------------------------
  { id: 'phone', label: 'Phone', icon: '📱', kb: { key: 'phone' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Phone`, inMore: true },
  { id: 'emote', label: 'Emotes', icon: '😀', kb: { key: 'emote' }, pad: { foot: 'down', any: 'more' }, touch: 'more', touchText: `${M} Emotes`, inMore: true },
  { id: 'journal', label: 'Quest journal', icon: '📜', kb: { key: 'journal' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Journal`, inMore: true },
  { id: 'map', label: 'Map', icon: '🗺', kb: { key: 'map' }, pad: { any: 'more' }, touch: 'minimap', touchText: 'the minimap', inMore: true },
  { id: 'taxi', label: 'Turfton Taxi', icon: '🚕', kb: { key: 'taxi' }, pad: { foot: 'left', any: 'more' }, touch: 'more', touchText: `${M} Taxi`, inMore: true },
  { id: 'modKit', label: 'Pocket Kit', icon: '🔧', kb: { key: 'modKit' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Pocket Kit`, inMore: true },
  { id: 'party', label: 'Party', icon: '👥', kb: { via: 'more' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Party`, inMore: true },
  { id: 'birdJournal', label: 'Field journal', icon: '📗', kb: { via: 'more' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Field journal`, inMore: true },
  { id: 'huntJournal', label: 'Hunting journal', icon: '📓', kb: { via: 'more' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Hunting journal`, inMore: true },
  { id: 'fishJournal', label: 'Catch journal', icon: '📘', kb: { via: 'more' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Catch journal`, inMore: true },
  { id: 'bag', label: 'Bag', icon: '🎒', kb: { via: 'more' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Bag`, inMore: true },
  { id: 'mute', label: 'Mute', icon: '🔇', kb: { key: 'mute' }, pad: { any: 'more' }, touch: 'more', touchText: `${M} Mute`, inMore: true },
  { id: 'options', label: 'Options', icon: '⚙', kb: { key: 'options' }, pad: { any: 'start' }, touch: 'more', touchText: `${M} Options`, inMore: true },
  { id: 'trainer', label: 'Save Trainer', icon: '🛠', kb: { key: 'trainer' }, pad: { any: 'options' }, touch: 'options', touchText: 'Options › Save Trainer', listed: false },

  // ---- The dock: contextual, on screen only while possible ---------------------------------------------------------
  { id: 'context', label: 'Use the place you are at', icon: '⭐', kb: { via: 'more' }, pad: { any: 'up' }, touch: 'dock', touchText: 'the button above Fire', listed: false },
  { id: 'garage', label: 'Open the garage (Handling, Pay ’n’ Glaze)', icon: '🔧', kb: { key: 'garage' }, pad: { any: 'up' }, touch: 'dock', touchText: 'the garage button', inDock: true },
  { id: 'lockupStore', label: 'Store at the Lock-Up', icon: '🔒', kb: { key: 'garage' }, pad: { any: 'up' }, touch: 'dock', touchText: 'the Store button', inDock: true },
  { id: 'craftShop', label: 'Wingwright’s Slipway', icon: '🛠', kb: { key: 'craftShop' }, pad: { any: 'up' }, touch: 'dock', touchText: 'the Slipway button', inDock: true },
  { id: 'fish', label: 'Fish (rod out / away)', icon: '🎣', kb: { key: 'fish' }, pad: { foot: 'east', any: 'up' }, touch: 'dock', touchText: 'the 🎣 button', inDock: true },
  { id: 'snack', label: 'Eat a snack (quick-use)', icon: '🍎', kb: { key: 'snack' }, pad: { any: 'up' }, touch: 'dock', touchText: 'the snack button', inDock: true },
  { id: 'binoculars', label: 'Binoculars', icon: '🔭', kb: { key: 'binoculars' }, pad: { foot: 'right', any: 'up' }, touch: 'dock', touchText: 'the 🔭 button', inDock: true },

  // ---- Inside a widget or sheet -----------------------------------------------------------------------------------
  { id: 'fishBait', label: 'Next bait (fishing)', icon: '🪱', kb: { key: 'fishBait' }, pad: { foot: 'lb' }, touch: 'widget', touchText: 'the bait button' },
  { id: 'jobAction', label: 'Job action (accept, drop, next fare)', icon: '💼', kb: { key: 'jobAction' }, pad: { any: 'r3' }, touch: 'widget', touchText: 'the job button' },
  { id: 'close', label: 'Close / back', icon: '✕', kb: { key: 'close' }, pad: { any: 'east' }, touch: 'sheet', touchText: '✕' },
  { id: 'confirm', label: 'Go on / pick', icon: '✓', kb: { key: 'confirm' }, pad: { any: 'south' }, touch: 'sheet', touchText: 'tap' },
];

const BY_ID = new Map<ActionId, ActionDef>(ACTIONS.map((a) => [a.id, a]));

export function actionDef(id: ActionId): ActionDef {
  const d = BY_ID.get(id);
  if (!d) throw new Error(`unknown action ${id}`);
  return d;
}

/** The pad binding for an action in a camera mode (falls back to 'any', then the first entry). */
export function padBinding(id: ActionId, mode: CameraMode = 'foot'): PadBinding {
  const p = actionDef(id).pad;
  return p[mode] ?? p.any ?? (Object.values(p)[0] as PadBinding);
}

// ---- Runtime registry ------------------------------------------------------------------------------------------------

export interface ActionHandler {
  run(): void;
  /** False hides the action from the More menu / dock right now. Default: always available. */
  available?(): boolean;
}

const handlers = new Map<ActionId, ActionHandler>();
const changeListeners = new Set<() => void>();

/** A module says how to run one of its actions. A second call for the same id replaces the first. */
export function registerAction(id: ActionId, handler: ActionHandler): void {
  handlers.set(id, handler);
  for (const cb of changeListeners) cb();
}

export function isRegistered(id: ActionId): boolean {
  return handlers.has(id);
}

export function isAvailable(id: ActionId): boolean {
  const h = handlers.get(id);
  return !!h && (h.available ? h.available() : true);
}

/** Runs the action if it is registered and available; returns whether it ran. */
export function runAction(id: ActionId): boolean {
  const h = handlers.get(id);
  if (!h || (h.available && !h.available())) return false;
  h.run();
  return true;
}

/** Called when the set of registered actions changes (the More menu rebuilds its grid). */
export function onActionsChange(cb: () => void): () => void {
  changeListeners.add(cb);
  return () => changeListeners.delete(cb);
}
