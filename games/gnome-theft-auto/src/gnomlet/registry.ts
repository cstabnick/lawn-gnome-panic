// The Gnomlet app registry (L94/E07). The Gnomlet is the in-game tablet (gnomlet.ts) that replaced the More menu and
// the phone list: every app on its home screen is registered here, so later epics add an app without editing the menu.
//
//   registerGnomletApp({ id: 'ledger', label: 'Ledger', icon: '📒', group: 'money', run: () => openLedger() });
//   registerGnomletApp({ id: 'gnomey-bird', label: 'Gnomey Bird', icon: '🐦', group: 'fun',
//                        open: (root, ctx) => { ...build into root...; return () => cleanup(); } });
//
// An app either `run()`s (the tablet closes first, then the app opens its own panel or does its thing: taxi, journals,
// shops), or `open(root, ctx)`s inside the tablet's screen (Options, Gnomey Bird). `phone.addApp` is a shim onto this.
// Pure data, no DOM at import (tests run in node).

export type GnomletGroup = 'here' | 'phone' | 'money' | 'world' | 'journals' | 'fun' | 'system';

/** Home-screen groups in order, with their headings. */
export const GNOMLET_GROUPS: readonly { id: GnomletGroup; title: string }[] = [
  { id: 'here', title: 'Here' },
  { id: 'phone', title: 'Calls and services' },
  { id: 'money', title: 'Money and things' },
  { id: 'world', title: 'Out and about' },
  { id: 'journals', title: 'Journals' },
  { id: 'fun', title: 'Games' },
  { id: 'system', title: 'Settings' },
];

export interface GnomletCtx {
  /** Close the whole tablet. */
  close(): void;
  /** Back to the home screen. */
  home(): void;
  /** Change the title bar text while the app is open. */
  setTitle(text: string): void;
}

export interface GnomletApp {
  /** Unique. For an app that mirrors an action of ui/actions.ts, the ActionId (pins and pad hints use it). */
  id: string;
  label: string;
  /** Emoji or short text for the icon. */
  icon: string;
  group?: GnomletGroup;
  /** Lower first within the group. Default 50. */
  order?: number;
  /** One line under the label (fee, status), re-read every time the home screen draws. */
  detail?(): string;
  /** A small badge on the icon (a count, '!'), or null / '' for none. */
  badge?(): string | number | null;
  /** False hides the app right now. Default: always shown. */
  available?(): boolean;
  /** Opens inside the tablet screen. `root` is empty and fills the screen; return a cleanup run when the app closes. */
  open?(root: HTMLElement, ctx: GnomletCtx): void | (() => void);
  /** Or: the tablet closes, then this runs. Used when `open` is absent. */
  run?(): void;
}

const apps = new Map<string, GnomletApp>();
const listeners = new Set<() => void>();

/** Adds an app (or replaces the one with the same id). */
export function registerGnomletApp(app: GnomletApp): void {
  if (!app.open && !app.run) throw new Error(`gnomlet app ${app.id} needs open or run`);
  apps.set(app.id, app);
  for (const cb of listeners) cb();
}

export function unregisterGnomletApp(id: string): void {
  if (apps.delete(id)) for (const cb of listeners) cb();
}

export function getGnomletApp(id: string): GnomletApp | undefined {
  return apps.get(id);
}

const GROUP_ORDER = new Map(GNOMLET_GROUPS.map((g, i) => [g.id, i]));

/** Available apps, by group then order then label. */
export function listGnomletApps(): GnomletApp[] {
  return [...apps.values()]
    .filter((a) => (a.available ? a.available() : true))
    .sort((a, b) => (GROUP_ORDER.get(a.group ?? 'world')! - GROUP_ORDER.get(b.group ?? 'world')!)
      || (a.order ?? 50) - (b.order ?? 50) || a.label.localeCompare(b.label));
}

/** Called when an app is added or removed (the open tablet redraws). */
export function onGnomletAppsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Tests only. */
export function _resetGnomletApps(): void {
  apps.clear();
}
