// The keyboard map: one action per key (KeyboardEvent.code). Every module that listens for a key reads it from here,
// so two features can never share a key by accident (M used to open the map and mute the game at the same time).
// keys.test.ts checks that no code is bound twice and that no module hard-codes a key that is not in this table.
// Touch and gamepad have their own controls (input.ts, gamepad.ts); this is only the keyboard.

/** Held keys: movement and the drive/fly modifiers. */
export const MOVE_KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  /** Boost while driving, descend while flying. */
  boost: ['ShiftLeft', 'ShiftRight'],
  /** Descend while flying. */
  descend: ['KeyC'],
  /** Hold to fire (the mouse button fires too). */
  fire: ['KeyF'],
} as const;

/** Pressed keys: one action each. */
export const KEYS = {
  jump: 'Space',
  enterExit: 'KeyE',
  switchGun: 'KeyQ',
  reload: 'KeyR',
  /** Turn the radio dial. */
  radio: 'KeyN',
  banger: 'KeyB',
  horn: 'KeyH',
  /** Open and close the big map. */
  map: 'KeyM',
  /** Mute and unmute all sound and the radio. */
  mute: 'KeyU',
  options: 'KeyO',
  journal: 'KeyJ',
  /** Call or cancel the Turfton Taxi (config.ts TAXI.key). */
  taxi: 'KeyY',
  /** Open a garage you are parked at (Pay 'n' Glaze bay, Side-Valve Salvage). The same action in both places. */
  garage: 'KeyT',
  /** Close the top overlay, skip a cutscene. */
  close: 'Escape',
  /** Go on (the intro tour). */
  confirm: 'Enter',
} as const;

export type KeyAction = keyof typeof KEYS;

/** The label a key shows in help text: 'KeyM' -> 'M', 'Space' -> 'Space', 'Escape' -> 'Esc'. */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Escape') return 'Esc';
  return code;
}

/** True when a key press is typing into a text field and must not trigger a game action. */
export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!t) return false;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable === true;
}
