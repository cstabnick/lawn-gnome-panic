// Which input device the player is using right now (the last one used): touch, keyboard + mouse, or a gamepad (and
// which family of pad), so hints show the right glyphs. Flips are debounced so a resting thumb or a stray mouse nudge
// does not make the hints flicker.
import { padFamily, type PadFamily } from '@lawn/gamepad';
import { isTyping } from '../keys';

export type InputSource = 'touch' | 'keyboard' | 'pad';
/** What hints draw: no glyphs on touch, key caps on keyboard, the pad family's glyphs on a pad. */
export type GlyphSet = 'touch' | 'keyboard' | PadFamily;

/** A different device must wait this long after the last flip before it takes over. */
export const SOURCE_DEBOUNCE_MS = 500;

/** How often the pending flip is checked. */
const SETTLE_INTERVAL_MS = 250;
/** Mouse movement (in px, summed over x and y) below this is treated as a resting hand, not a keyboard player. */
const MOUSE_MOVE_THRESHOLD = 6;

export interface SourceState {
  current: InputSource;
  family: PadFamily;
  /** performance.now() of the last flip (or of the start). */
  lastFlip: number;
  /** A different source seen inside the debounce window, applied by settleSource() once the window has passed. */
  pending: InputSource | null;
  pendingFamily: PadFamily | null;
}

export function initialSource(touchFirst: boolean, now = 0): SourceState {
  return { current: touchFirst ? 'touch' : 'keyboard', family: 'generic', lastFlip: now, pending: null, pendingFamily: null };
}

/** The state after a flip to `seen` at `now`. */
function flipTo(s: SourceState, seen: InputSource, now: number, family: PadFamily | null): SourceState {
  return {
    current: seen,
    family: seen === 'pad' && family ? family : s.family,
    lastFlip: now,
    pending: null,
    pendingFamily: null,
  };
}

/** Pure. Returns `s` itself when nothing changed. */
export function reduceSource(s: SourceState, seen: InputSource, now: number, family?: PadFamily): SourceState {
  if (seen === s.current && (seen !== 'pad' || family === undefined || family === s.family)) {
    // Back on the source we already have: any pending change is cancelled.
    if (s.pending === null && s.pendingFamily === null) return s;
    return { ...s, pending: null, pendingFamily: null };
  }
  const fam = family ?? null;
  if (now - s.lastFlip >= SOURCE_DEBOUNCE_MS) return flipTo(s, seen, now, fam);
  // Inside the window: remember it (a newer pending replaces an older one).
  if (s.pending === seen && s.pendingFamily === fam) return s;
  return { ...s, pending: seen, pendingFamily: fam };
}

/** Pure. Applies a pending flip once the debounce window has passed. Returns `s` itself when nothing changed. */
export function settleSource(s: SourceState, now: number): SourceState {
  if (s.pending === null || now - s.lastFlip < SOURCE_DEBOUNCE_MS) return s;
  return flipTo(s, s.pending, now, s.pendingFamily);
}

export function glyphSetOf(s: SourceState): GlyphSet {
  return s.current === 'pad' ? s.family : s.current;
}

let state: SourceState = initialSource(false, 0);
let installed = false;
const listeners = new Set<(set: GlyphSet) => void>();
let lastPadId: string | null = null;
let lastPadFamily: PadFamily = 'generic';

function applyBodyDataset(): void {
  const body = document.body;
  if (!body) return;
  body.dataset.input = state.current;
  if (state.current === 'pad') body.dataset.pad = state.family;
  else delete body.dataset.pad;
}

/** Stores a new state; when the glyph set changed, updates the body attributes and tells the listeners. */
function commit(next: SourceState): void {
  if (next === state) return;
  const before = glyphSetOf(state);
  state = next;
  const after = glyphSetOf(state);
  if (after === before) return;
  applyBodyDataset();
  for (const cb of listeners) cb(after);
}

function onKeyDown(e: KeyboardEvent): void {
  if (isTyping(e)) return;
  commit(reduceSource(state, 'keyboard', performance.now()));
}

function onPointerDown(e: PointerEvent): void {
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    commit(reduceSource(state, 'touch', performance.now()));
  } else if (e.pointerType === 'mouse') {
    commit(reduceSource(state, 'keyboard', performance.now()));
  }
}

function onWheel(): void {
  commit(reduceSource(state, 'keyboard', performance.now()));
}

function onMouseMove(e: MouseEvent): void {
  if (Math.abs(e.movementX) + Math.abs(e.movementY) <= MOUSE_MOVE_THRESHOLD) return;
  commit(reduceSource(state, 'keyboard', performance.now()));
}

/** Installs the window listeners once (idempotent). */
export function installInputSource(): void {
  if (installed) return;
  installed = true;
  const touchFirst = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  state = initialSource(touchFirst, performance.now());
  applyBodyDataset();

  // capture: true so a menu that stops propagation still counts as the player's input.
  window.addEventListener('keydown', onKeyDown, { capture: true, passive: true });
  window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
  window.addEventListener('wheel', onWheel, { capture: true, passive: true });
  window.addEventListener('mousemove', onMouseMove, { capture: true, passive: true });
  setInterval(() => commit(settleSource(state, performance.now())), SETTLE_INTERVAL_MS);
}

/** input.ts calls this every frame the pad did something, with the pad's id. Cheap when nothing changes. */
export function notePad(id: string): void {
  if (id !== lastPadId) {
    lastPadId = id;
    lastPadFamily = padFamily(id);
  }
  commit(reduceSource(state, 'pad', performance.now(), lastPadFamily));
}

export function currentInputSource(): InputSource {
  return state.current;
}

export function currentPadFamily(): PadFamily {
  return state.family;
}

export function currentGlyphSet(): GlyphSet {
  return glyphSetOf(state);
}

/** Called after every (debounced) change of the glyph set. Returns an unsubscribe function. */
export function onInputSourceChange(cb: (set: GlyphSet) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
