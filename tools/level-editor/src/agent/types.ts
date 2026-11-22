// The agent API's shared types: what window.le takes and returns. Plain data only (JSON-safe), so an agent driving the page
// through puppeteer's page.evaluate gets back exactly what is described here. No DOM, no three.js.

/** Which item: by its place in the collection's live array, or by its `id` field when the item has one. */
export type ItemRef = { collection: string; index: number } | { collection: string; id: string };

/** An item as the agent sees it: where it is, what it is called, and every field the Select panel shows. */
export interface ItemView {
  collection: string;
  /** Index into the collection's live array (CollectionDef.items(zone)). Changes when earlier items are deleted. */
  index: number;
  /** The item's own `id` field, when it has a string one. Prefer it for refs: it does not shift. */
  id?: string;
  /** name ?? label ?? id ?? prefab, as the Select list shows it. */
  name?: string;
  x: number;
  z: number;
  /** Every FieldDef of the collection, read through its get() when it has one: { [field.key]: value }. */
  fields: Record<string, unknown>;
}

/** One collection the current game lets you place and edit. */
export interface CollectionInfo {
  id: string;
  label: string;
  /** true: can be moved and edited, never added or deleted. */
  fixed: boolean;
  /** Items in the current zone that the collection accepts. */
  count: number;
  fields: { key: string; label: string; type: string; options?: string[] }[];
}

export interface EditorState {
  game: string;
  zone: string;
  /** Every level of the game (adapter.levels()). */
  levels: { id: string; name: string }[];
  /** Ids of the loaded levels (ctx.outdoorZones). */
  loaded: string[];
  selection: { collection: string; index: number } | null;
  dirty: { zones: string[]; deltas: boolean; paint: boolean };
  /** Edited areas whose walk tiles need a re-bake (ctx.dirty.walkRects.length). */
  staleWalkAreas: number;
  /** Label of the step undo would revert ('' when none). */
  undo: string;
  canRedo: boolean;
  snap: number;
  gatesOpen: boolean;
  tools: string[];
  collections: CollectionInfo[];
}

/** What is at one ground point. */
export interface Probe {
  x: number;
  z: number;
  /** terrain.heightAt(x, z). */
  y: number;
  /** terrain.zoneAt(x, z), or null outside every loaded level. */
  zone: string | null;
  /** terrain.regionNameAt(x, z) ('' when the game has no regions). */
  region: string;
  /** Surface paint id (ctx.paint.at(x, z)); 0 = unpainted. */
  paint: number;
  /** terrain.isBlocked(x, z). */
  blocked: boolean;
  /** Items of the current zone within `radius` metres, nearest first. */
  near: { collection: string; index: number; id?: string; name?: string; distance: number }[];
}

export interface PathResult {
  /** true when the last waypoint is within 1.5 m of b. */
  reached: boolean;
  /** Metres along the waypoints (3D). 0 when there is no path. */
  length: number;
  waypoints: { x: number; y: number; z: number }[];
}

export interface ReachResultView {
  kind: string;
  id: string;
  label: string;
  x: number;
  z: number;
  reachable: boolean;
}

/** A problem in a level: the same list feeds the Problems panel and le.problems(). */
export interface Problem {
  /** error: the game would fail or misbehave, so a save should stop. warning: worth a look. */
  severity: 'error' | 'warning';
  /** Stable kebab-case code, e.g. 'unknown-prefab', 'prop-overlap', 'stale-bake'. */
  code: string;
  msg: string;
  zone: string;
  ref?: { collection: string; index: number };
  x?: number;
  z?: number;
}

/** What every le.run() call resolves to. Commands never throw across the API: errors come back as { ok: false }. */
export type CommandResult<T = unknown> = { ok: true; value: T } | { ok: false; error: string };

/** One command le.run(name, args) can run. */
export interface CommandDef {
  name: string;
  /** One line: what it does and its args, e.g. "item.move { ref, x, z }: moves an item (and its followers)". */
  help: string;
  run(args: Record<string, unknown>): unknown;
}
