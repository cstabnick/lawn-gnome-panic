// window.le: the editor as commands and queries, for agents and scripts. Same functions the UI calls; every edit is one undo step.
import type { EditorContext } from '../context';
import { addItem, deleteItem, duplicateItem, moveItem, nudgeItem, resolveRef, rotateItem, setField } from './itemOps';
import { editorState, getItem, listItems, pathBetween, prefabCatalog, probe, reachability } from './queries';
import { collectProblems } from './problems';
import type { CommandDef, CommandResult, EditorState, ItemRef, ItemView, PathResult, Probe, Problem, ReachResultView } from './types';

/** What the page provides that the context does not (they live in editor.ts). */
export interface ApiHooks {
  /** Saves everything dirty, as the Save button does. Resolves the repo-relative files written; rejects with a readable Error. */
  save(): Promise<string[]>;
  /** Switches the active tool by id ('view', 'select', ...). Returns false when the game has no such tool. */
  activateTool(id: string): boolean;
  /** Re-runs the Problems panel's checks. */
  refreshProblems(reach?: boolean): void;
}

/** window.le: what an agent or script gets. Queries may throw; run() never rejects. */
export interface LeApi {
  version: 1;
  run(name: string, args?: Record<string, unknown>): Promise<CommandResult>;
  help(): { name: string; help: string }[];
  state(): EditorState;
  list(collection?: string): ItemView[];
  get(ref: ItemRef): ItemView;
  probe(x: number, z: number, radius?: number): Probe;
  path(a: { x: number; z: number }, b: { x: number; z: number }): PathResult;
  reach(): ReachResultView[];
  catalog(query: string, limit?: number): { id: string; name: string; category: string }[];
  problems(opts?: { reach?: boolean }): Problem[];
}

type Args = Record<string, unknown>;
type ZoneId = EditorContext['zone'];

/** Commands that change the level: the Problems panel is re-checked after each one succeeds. */
const MUTATING = new Set(['item.add', 'item.move', 'item.nudge', 'item.set', 'item.rotate', 'item.delete', 'item.duplicate', 'undo', 'redo']);

// ---- argument helpers: a missing or wrongly typed argument throws a readable Error naming the command.

function reqStr(cmd: string, args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== 'string') throw new Error(`${cmd}: ${key} must be a string`);
  return v;
}

function reqNum(cmd: string, args: Args, key: string): number {
  const v = args[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${cmd}: ${key} must be a number`);
  return v;
}

function optNum(cmd: string, args: Args, key: string): number | undefined {
  return args[key] === undefined ? undefined : reqNum(cmd, args, key);
}

function reqRef(cmd: string, args: Args): ItemRef {
  const r = args.ref as { collection?: unknown; index?: unknown; id?: unknown } | undefined;
  if (!r || typeof r !== 'object' || typeof r.collection !== 'string' || !(typeof r.index === 'number' || typeof r.id === 'string')) {
    throw new Error(`${cmd}: ref must be an item ref ({ collection, index } or { collection, id })`);
  }
  return r as ItemRef;
}

/** The label a person sees in the undo list: 'Agent: ' + the agent's label, or the command's default. */
function labelArg(cmd: string, args: Args, fallback: string): string {
  return 'Agent: ' + (args.label === undefined ? fallback : reqStr(cmd, args, 'label'));
}

/** Builds every command window.le.run() accepts. */
export function createCommands(ctx: EditorContext, hooks: ApiHooks): CommandDef[] {
  const cmd = (name: string, help: string, run: (args: Args) => unknown): CommandDef => ({ name, help, run });
  return [
    cmd('item.add', 'item.add { collection, x, z, fields?, label? } -> { index }: places a new item', (a) => {
      const fields = a.fields === undefined ? undefined : (a.fields as Record<string, unknown>);
      const index = addItem(ctx, reqStr('item.add', a, 'collection'), reqNum('item.add', a, 'x'), reqNum('item.add', a, 'z'), fields, labelArg('item.add', a, 'add ' + String(a.collection)));
      return { index };
    }),
    cmd('item.move', 'item.move { ref, x, z }: moves an item (and its followers)', (a) => {
      moveItem(ctx, reqRef('item.move', a), reqNum('item.move', a, 'x'), reqNum('item.move', a, 'z'), labelArg('item.move', a, 'move'));
    }),
    cmd('item.nudge', 'item.nudge { ref, dx, dz }: moves an item by an offset in metres', (a) => {
      nudgeItem(ctx, reqRef('item.nudge', a), reqNum('item.nudge', a, 'dx'), reqNum('item.nudge', a, 'dz'), labelArg('item.nudge', a, 'nudge'));
    }),
    cmd('item.set', 'item.set { ref, key, value }: sets one field of an item', (a) => {
      reqStr('item.set', a, 'key');
      if (!('value' in a)) throw new Error('item.set: value must be given');
      setField(ctx, reqRef('item.set', a), a.key as string, a.value, labelArg('item.set', a, 'edit field'));
    }),
    cmd('item.rotate', 'item.rotate { ref, da }: turns an item by da radians; returns whether it rotated', (a) =>
      rotateItem(ctx, reqRef('item.rotate', a), reqNum('item.rotate', a, 'da'), labelArg('item.rotate', a, 'rotate'))),
    cmd('item.delete', 'item.delete { ref }: deletes an item', (a) => {
      deleteItem(ctx, reqRef('item.delete', a), labelArg('item.delete', a, 'delete'));
    }),
    cmd('item.duplicate', 'item.duplicate { ref } -> { index }: copies an item next to itself', (a) => ({
      index: duplicateItem(ctx, reqRef('item.duplicate', a), labelArg('item.duplicate', a, 'duplicate')),
    })),
    cmd('select', 'select { ref | null }: selects an item, or clears the selection with null', (a) => {
      if (a.ref === null) { ctx.select(null); return null; }
      const ref = reqRef('select', a);
      ctx.select({ collection: ref.collection, index: resolveRef(ctx, ref) });
      return null;
    }),
    cmd('focus', 'focus { x, z, distance? }: moves the 3D camera to a ground point', (a) => {
      ctx.viewport.focus(reqNum('focus', a, 'x'), reqNum('focus', a, 'z'), optNum('focus', a, 'distance'));
    }),
    cmd('zone.set', 'zone.set { id }: switches the zone being edited (must be a loaded zone)', (a) => {
      const id = reqStr('zone.set', a, 'id') as ZoneId;
      if (!ctx.outdoorZones.includes(id)) throw new Error(`No zone "${id}"`);
      ctx.setZone(id);
    }),
    cmd('tool', 'tool { id }: switches the active tool (view, brush, select, ...)', (a) => {
      const id = reqStr('tool', a, 'id');
      if (!hooks.activateTool(id)) throw new Error(`No tool "${id}"`);
    }),
    cmd('snap', 'snap { m }: sets the placement grid in metres (0 = off)', (a) => {
      ctx.snap = reqNum('snap', a, 'm');
    }),
    cmd('undo', 'undo: reverts the last edit -> the label of the next undo step', () => {
      ctx.history.undo();
      return ctx.history.nextUndo;
    }),
    cmd('redo', 'redo: re-applies the last undone edit -> the label of the next undo step', () => {
      ctx.history.redo();
      return ctx.history.nextUndo;
    }),
    cmd('save', 'save { force? } -> { files }: saves dirty levels; refused while there are errors unless force is true', async (a) => {
      if (a.force !== true) {
        const errors = collectProblems(ctx).filter((p) => p.severity === 'error');
        if (errors.length) {
          throw new Error('Save refused: ' + errors.map((p) => p.msg).join('; ') + ' (pass force: true to save anyway)');
        }
      }
      // Gnomomia's save asks confirm() for unknown markers; an agent cannot answer, so say yes while the save runs.
      const realConfirm = window.confirm;
      window.confirm = () => true;
      try {
        return { files: await hooks.save() };
      } finally {
        window.confirm = realConfirm;
      }
    }),
  ];
}

/** Installs window.le and returns it. */
export function installAgentApi(ctx: EditorContext, hooks: ApiHooks): LeApi {
  const commands = createCommands(ctx, hooks);
  const byName = new Map(commands.map((c) => [c.name, c]));

  const api: LeApi = {
    version: 1,
    async run(name, args) {
      const c = byName.get(name);
      if (!c) return { ok: false, error: `Unknown command "${name}": see le.help()` };
      try {
        const raw = await c.run(args ?? {});
        if (MUTATING.has(name)) hooks.refreshProblems();
        return { ok: true, value: raw === undefined ? null : raw };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    help: () => commands.map((c) => ({ name: c.name, help: c.help })),
    state: () => editorState(ctx),
    list: (collection) => listItems(ctx, collection),
    get: (ref) => getItem(ctx, ref),
    probe: (x, z, radius) => probe(ctx, x, z, radius),
    path: (a, b) => pathBetween(ctx, a, b),
    reach: () => reachability(ctx),
    catalog: (query, limit) => prefabCatalog(query, limit),
    problems: (opts) => collectProblems(ctx, opts),
  };
  (window as unknown as { le: LeApi }).le = api;
  return api;
}
