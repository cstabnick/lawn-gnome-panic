// Shared contracts of the music room: instruments, key maps, the relay messages and tuning numbers.
// Every other module imports from here; nothing here imports another module of this game.

export type InstrumentId = 'drums' | 'keys' | 'cowbell';
export const INSTRUMENTS: readonly InstrumentId[] = ['drums', 'keys', 'cowbell'];
export const INSTRUMENT_NAMES: Record<InstrumentId, string> = { drums: 'Drums', keys: 'Keyboard', cowbell: 'Cowbell' };
/** KeyboardEvent.code that picks each instrument. */
export const INSTRUMENT_KEYS: Record<InstrumentId, string> = { drums: 'Digit1', keys: 'Digit2', cowbell: 'Digit3' };

/** One playable pad: the physical key (KeyboardEvent.code), the key-cap text and what it plays. */
export interface PadDef {
  code: string;
  label: string;
  name: string;
  /** keys only: true for a black (sharp) key. */
  black?: boolean;
}

/**
 * Pads per instrument, in display order. A pad's index in its array is its "pad index".
 * Drums and cowbell: the note value n sent over the network IS the pad index.
 * Keys: n is a MIDI note number (see noteForPad / padForNote).
 */
export const PADS: Record<InstrumentId, readonly PadDef[]> = {
  drums: [
    { code: 'KeyA', label: 'A', name: 'Kick' },
    { code: 'KeyS', label: 'S', name: 'Snare' },
    { code: 'KeyD', label: 'D', name: 'Hi-hat' },
    { code: 'KeyF', label: 'F', name: 'Open hat' },
    { code: 'KeyJ', label: 'J', name: 'Low tom' },
    { code: 'KeyK', label: 'K', name: 'High tom' },
    { code: 'KeyL', label: 'L', name: 'Crash' },
    { code: 'Space', label: 'Space', name: 'Kick' },
  ],
  keys: [
    { code: 'KeyA', label: 'A', name: 'C' },
    { code: 'KeyW', label: 'W', name: 'C#', black: true },
    { code: 'KeyS', label: 'S', name: 'D' },
    { code: 'KeyE', label: 'E', name: 'D#', black: true },
    { code: 'KeyD', label: 'D', name: 'E' },
    { code: 'KeyF', label: 'F', name: 'F' },
    { code: 'KeyT', label: 'T', name: 'F#', black: true },
    { code: 'KeyG', label: 'G', name: 'G' },
    { code: 'KeyY', label: 'Y', name: 'G#', black: true },
    { code: 'KeyH', label: 'H', name: 'A' },
    { code: 'KeyU', label: 'U', name: 'A#', black: true },
    { code: 'KeyJ', label: 'J', name: 'B' },
    { code: 'KeyK', label: 'K', name: 'C' },
  ],
  cowbell: [
    { code: 'Space', label: 'Space', name: 'Cowbell' },
    { code: 'KeyF', label: 'F', name: 'Low bell' },
    { code: 'KeyJ', label: 'J', name: 'High bell' },
    { code: 'KeyB', label: 'B', name: 'Muted bell' },
  ],
};

/** Keyboard: MIDI note of pad 0 at octave 0 (60 = middle C). */
export const KEYS_BASE_MIDI = 60;
/** Keyboard octave shift range; KeyZ lowers, KeyX raises. */
export const OCTAVE_MIN = -2;
export const OCTAVE_MAX = 2;
export const OCTAVE_DOWN_CODE = 'KeyZ';
export const OCTAVE_UP_CODE = 'KeyX';

/** The note value n to play for a pad. octave is ignored except for keys. */
export function noteForPad(i: InstrumentId, pad: number, octave: number): number {
  return i === 'keys' ? KEYS_BASE_MIDI + octave * 12 + pad : pad;
}

/** The pad to light up for a note value n (keys: the pad with the same pitch class; top C lights pad 0). */
export function padForNote(i: InstrumentId, n: number): number {
  if (i !== 'keys') return n;
  return (((n - KEYS_BASE_MIDI) % 12) + 12) % 12;
}

/** The pad index of an instrument for a KeyboardEvent.code, or -1. */
export function padForCode(i: InstrumentId, code: string): number {
  return PADS[i].findIndex((p) => p.code === code);
}

/** Valid note value for an instrument (used to drop bad network input). */
export function isValidNote(i: InstrumentId, n: unknown): n is number {
  if (typeof n !== 'number' || !Number.isInteger(n)) return false;
  if (i === 'keys') return n >= 24 && n <= 108;
  return n >= 0 && n < PADS[i].length;
}

export function isInstrument(v: unknown): v is InstrumentId {
  return v === 'drums' || v === 'keys' || v === 'cowbell';
}

// ---------------------------------------------------------------- network

/** Game id on the shared server (packages/mp/src/protocol.ts GAMES). */
export const GAME_ID = 'music-room';

/** Relay payloads between players in the room. Everyone sends to everyone (to = null); there is no host logic. */
export type RoomMsg =
  /** I played note n on instrument i. */
  | { k: 'note'; i: InstrumentId; n: number }
  /** I am here, holding instrument i. Sent on join, on every instrument change and every HEARTBEAT_MS
   *  (the server drops a player who relays nothing for 8 s). */
  | { k: 'here'; i: InstrumentId };

export const HEARTBEAT_MS = 2000;

/** One player in the room, me included. */
export interface Member {
  id: number;
  name: string;
  /** 0xRRGGBB, from the server. */
  color: number;
  /** Latest instrument from their 'here' (or the character they queued with). */
  instrument: InstrumentId;
  me: boolean;
}

export type NetStatus = 'offline' | 'connecting' | 'in-room' | 'error';

export interface NetState {
  status: NetStatus;
  /** Human-readable status line, e.g. "Could not reach the server" or "In the public room". */
  message: string;
  /** My player id in the room, or -1. */
  me: number;
  /** The room code I joined; null = public room (or not in a room). */
  code: string | null;
  /** Everyone in the room (me included); empty when not in a room. */
  players: Member[];
}

/** Colour of my own hits while offline (the server picks one when online). */
export const OFFLINE_COLOR = 0xffd54f;

// ---------------------------------------------------------------- storage keys

export const NAME_KEY = 'music-room-name';
export const INSTRUMENT_KEY = 'music-room-instrument';

/** 0xRRGGBB to '#rrggbb'. */
export function cssColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}
