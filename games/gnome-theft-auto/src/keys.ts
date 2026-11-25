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
  /** Tap: next gun. Hold: the weapon wheel (weaponWheel.ts). */
  switchGun: 'KeyQ',
  /** Open and close the More menu (ui/moreMenu.ts): phone, emotes, journal, map, party, journals, options... Tab used to duplicate holding Q. */
  more: 'Tab',
  /** Open the Ammu-Gnation Pocket Kit: fit gun mods anywhere on foot (gunModKit.ts). */
  modKit: 'KeyK',
  reload: 'KeyR',
  /** Open and close the emote menu (anim/emoteMenu.ts). */
  emote: 'KeyG',
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
  /** Open and close the phone (phone/phone.ts): the Sling-Lift delivery, the taxi. */
  phone: 'KeyP',
  /** Open a garage you are parked at (Pay 'n' Glaze bay, Side-Valve Salvage). The same action in both places. */
  garage: 'KeyT',
  /** Open the Wingwright's Slipway (craft/craftShop.ts): paint and tune the boat or aircraft you sit in, stopped. */
  craftShop: 'KeyL',
  /** Birding binoculars (birding/scope.ts): hold to look, tap to keep them up. */
  binoculars: 'KeyV',
  /** Fishing (fishing/fishInput.ts): rod out / away by the water or in a stopped boat. */
  fish: 'KeyX',
  /** Fishing: next bait while the rod is out. */
  fishBait: 'KeyZ',
  /** Open and close the Save Trainer (trainer/install.ts): save import/export, character, spawn, world, cutscenes. */
  trainer: 'F9',
  /** The same as F9, for keyboards where F9 needs Fn. */
  trainerAlt: 'Backquote',
  /** Close the top overlay, skip a cutscene. */
  close: 'Escape',
  /** Go on (the intro tour). */
  confirm: 'Enter',
  /** Sim jobs (jobs/hud.ts): the job action (accept a call, drop cargo, next fare). */
  jobAction: 'KeyI',
  /** The bag (bag/runtime.ts): eat the quick-use snack. The bag itself opens from the More menu or the phone. */
  snack: 'Digit1',
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
