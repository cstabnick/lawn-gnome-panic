// The Options registry (L94/E07): every module adds its own rows or sections here, at import or install time, and the
// Options app (options.ts, shown inside the Gnomlet) renders whatever is registered, sorted by section order then row
// order. So the order in which epics install their modules does not matter, and no epic edits options.ts.
//
//   registerOption({ section: 'audio', id: 'bird-sounds', label: 'Bird sounds', desc: '...', kind: 'toggle',
//                    get: getBirdSounds, set: setBirdSounds, watch: 'gta:bird-prefs' });
//   registerOptionsSection('weather', 'Weather', (el) => { el.append(...); }, 45);
//
// Values are per-browser settings (localStorage, never in GTA_SAVE_KEYS / the cloud save): the module that owns a row
// owns its storage key and fires its own window event on change. Pure data, no DOM at import (tests run in node).

export type OptionKind = 'toggle' | 'cycle' | 'slider' | 'button';

interface OptionBase {
  /** Section id (see SECTIONS for the built-in ones; an unknown id gets its own section titled after it). */
  section: string;
  /** Unique per row; also the gamepad focus id and `data-opt` on the row element. */
  id: string;
  label: string;
  /** One short line under the label (plain text; a function is re-read on every repaint). */
  desc?: string | (() => string);
  /** Lower first within the section. Default 50. */
  order?: number;
  /** A window event that means "the value changed elsewhere" (a key, another panel): the row repaints on it. */
  watch?: string;
  /** False hides the row right now (re-read every time Options opens). */
  visible?(): boolean;
}

export interface ToggleOption extends OptionBase {
  kind: 'toggle';
  get(): boolean;
  set(on: boolean): void;
  /** Words for on / off. Default ['on', 'off']. */
  words?: readonly [string, string];
}

export interface CycleOption extends OptionBase {
  kind: 'cycle';
  /** The choices, in click order. */
  values: readonly { id: string; label: string }[];
  get(): string;
  set(id: string): void;
}

export interface SliderOption extends OptionBase {
  kind: 'slider';
  /** 0..1. */
  get(): number;
  set(v: number): void;
  /** Step in 0..1 units. Default 0.05. */
  step?: number;
}

export interface ButtonOption extends OptionBase {
  kind: 'button';
  /** Runs on click (open a panel, reset something). Options stays open unless the handler closes it. */
  run(): void;
}

export type OptionDef = ToggleOption | CycleOption | SliderOption | ButtonOption;

export interface OptionsSectionHooks {
  /** Called every time Options is shown (repaint live values, start a timer). */
  show?(): void;
  /** Called when Options is hidden (stop the timer). */
  hide?(): void;
}

export interface OptionsSection {
  id: string;
  title: string;
  /** Lower first. Built-in sections use 10, 20, ... 100; slot new ones between. Default 50. */
  order: number;
  /** Custom content (pickers, status lines, notes), drawn after the rows registered for this section. */
  mount?: (el: HTMLElement) => OptionsSectionHooks | void;
}

/** Built-in sections and their order. Other epics: reuse one of these ids, or register your own section. */
export const SECTIONS = {
  controls: { title: 'Controls', order: 10 },
  view: { title: 'View', order: 20 },
  map: { title: 'Map and markers', order: 30 },
  dialogue: { title: 'Dialogue and radio', order: 40 },
  world: { title: 'World', order: 50 },
  audio: { title: 'Sound', order: 60 },
  online: { title: 'Multiplayer', order: 70 },
  cheats: { title: 'Cheats', order: 80 },
  save: { title: 'Save', order: 90 },
  dev: { title: 'Profiler', order: 100 },
} as const satisfies Record<string, { title: string; order: number }>;

const sections = new Map<string, OptionsSection>();
const options = new Map<string, OptionDef>();
const listeners = new Set<() => void>();
const changed = (): void => { for (const cb of listeners) cb(); };

/** Adds a section (or replaces the one with the same id). `mount` runs once, when Options is first built or rebuilt. */
export function registerOptionsSection(
  id: string,
  title: string,
  mount?: OptionsSection['mount'],
  order?: number,
): void {
  const builtIn = (SECTIONS as Record<string, { title: string; order: number }>)[id];
  sections.set(id, { id, title, mount, order: order ?? builtIn?.order ?? 50 });
  changed();
}

/** Adds one row (or replaces the one with the same id). */
export function registerOption(def: OptionDef): void {
  options.set(def.id, def);
  changed();
}

export function unregisterOption(id: string): void {
  if (options.delete(id)) changed();
}

export interface ResolvedSection {
  id: string;
  title: string;
  order: number;
  mount?: OptionsSection['mount'];
  rows: OptionDef[];
}

/** Every section with content, in order, each with its rows in order. Sections named only by rows get a default. */
export function listOptionSections(): ResolvedSection[] {
  const out = new Map<string, ResolvedSection>();
  const ensure = (id: string): ResolvedSection => {
    let s = out.get(id);
    if (!s) {
      const reg = sections.get(id);
      const builtIn = (SECTIONS as Record<string, { title: string; order: number }>)[id];
      s = {
        id,
        title: reg?.title ?? builtIn?.title ?? id,
        order: reg?.order ?? builtIn?.order ?? 50,
        mount: reg?.mount,
        rows: [],
      };
      out.set(id, s);
    }
    return s;
  };
  for (const id of sections.keys()) ensure(id);
  for (const o of options.values()) ensure(o.section).rows.push(o);
  const list = [...out.values()].filter((s) => s.mount || s.rows.length > 0);
  for (const s of list) s.rows.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  return list.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function getOption(id: string): OptionDef | undefined {
  return options.get(id);
}

/** The text a row shows after its label: 'on' / 'off', the cycle value's label, or the slider's percent. */
export function optionValueText(o: OptionDef): string {
  switch (o.kind) {
    case 'toggle': return (o.words ?? ['on', 'off'])[o.get() ? 0 : 1];
    case 'cycle': return o.values.find((v) => v.id === o.get())?.label ?? o.get();
    case 'slider': return `${Math.round(o.get() * 100)}%`;
    case 'button': return '';
  }
}

export function optionDescText(o: OptionDef): string {
  return typeof o.desc === 'function' ? o.desc() : o.desc ?? '';
}

/** What a click on the row does: flips a toggle, steps a cycle to its next value, runs a button. Sliders: nothing. */
export function activateOption(o: OptionDef): void {
  if (o.kind === 'toggle') o.set(!o.get());
  else if (o.kind === 'cycle') {
    const i = o.values.findIndex((v) => v.id === o.get());
    o.set(o.values[(i + 1) % o.values.length].id);
  } else if (o.kind === 'button') o.run();
}

/** Called when a section or row is added or replaced (Options rebuilds if it is built). */
export function onOptionsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Tests only. */
export function _resetOptionsRegistry(): void {
  sections.clear();
  options.clear();
}
