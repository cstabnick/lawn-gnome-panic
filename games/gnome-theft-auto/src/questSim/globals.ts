// Quest sim, headless layer: the browser globals the game's modules touch, for vitest / node. Import this module FIRST
// (before anything from the game), or call installSimGlobals() and then import the rest dynamically. No game imports.
//
// - document: the fake DOM from testing/fakeDom.ts plus getElementById / body / head / querySelector, so runners that
//   add a HUD element (the race HUD) work.
// - window: addEventListener / removeEventListener / dispatchEvent (cutscene 'call' steps go out as window events, and
//   the sim listens to them), location.search ''.
// - localStorage: an in-memory Storage (resetSimStorage() empties it between quests).
import { installFakeDom } from '../testing/fakeDom';

const mem = new Map<string, string>();

/** An in-memory Storage. */
export const simStorage: Storage = {
  get length() { return mem.size; },
  clear: () => mem.clear(),
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  key: (i: number) => [...mem.keys()][i] ?? null,
  removeItem: (k: string) => { mem.delete(k); },
  setItem: (k: string, v: string) => { mem.set(k, String(v)); },
};

/** Forget every saved key (a fresh profile). */
export function resetSimStorage(): void {
  mem.clear();
}

type Listener = (e: Event) => void;
const listeners = new Map<string, Set<Listener>>();

function fakeElement(): Record<string, unknown> {
  const e: Record<string, unknown> = {
    style: {}, dataset: {}, children: [], classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild: (c: unknown) => c, append() {}, remove() {}, removeChild() {}, setAttribute() {}, removeAttribute() {},
    addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 }),
    textContent: '', innerHTML: '', id: '', className: '',
  };
  return e;
}

let installed = false;

/** Install the globals (idempotent). Call before importing any game module. */
export function installSimGlobals(): void {
  if (installed) return;
  installed = true;
  const g = globalThis as Record<string, unknown>;
  installFakeDom();
  const doc = g.document as Record<string, unknown>;
  const make = doc.createElement as (tag: string) => Record<string, unknown>;
  doc.createElement = (tag: string) => (tag === 'canvas' ? make(tag) : fakeElement());
  doc.getElementById ??= () => null;
  doc.querySelector ??= () => null;
  doc.querySelectorAll ??= () => [];
  doc.body ??= fakeElement();
  doc.head ??= fakeElement();
  doc.documentElement ??= fakeElement();
  doc.addEventListener ??= () => {};
  doc.removeEventListener ??= () => {};
  if (!g.window) {
    g.window = {
      addEventListener(type: string, fn: Listener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(fn);
      },
      removeEventListener(type: string, fn: Listener) { listeners.get(type)?.delete(fn); },
      dispatchEvent(e: Event) {
        for (const fn of listeners.get(e.type) ?? []) fn(e);
        return true;
      },
      location: { search: '', href: 'http://localhost/', hostname: 'localhost' },
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      innerWidth: 390,
      innerHeight: 844,
      devicePixelRatio: 1,
    };
  }
  const w = g.window as Record<string, unknown>;
  if (!w.localStorage) w.localStorage = simStorage;
  if (!g.localStorage) g.localStorage = simStorage;
  if (!g.location) g.location = w.location;
}

installSimGlobals();
